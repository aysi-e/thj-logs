import { has, isEmpty, last, values } from 'lodash';
import {
    Handler,
    CRITICAL_MELEE,
    MELEE_DAMAGE_TYPE_NORMALIZE_MAP,
    MELEE_MISS_TYPE_NORMALIZE_MAP,
    MeleeDamageType,
    MeleeMissType,
    OTHER_CRITICAL_SPELL,
    OTHER_DAMAGE_SHIELD_HIT,
    OTHER_DEATH,
    OTHER_MELEE_HIT,
    OTHER_MELEE_MISS,
    PLAYER_DEATH,
    PLAYER_KILL,
    PLAYER_MELEE_HIT,
    PLAYER_MELEE_MISS,
    SPELL_HIT,
    SPELL_HIT_YOU,
    YOU_CRITICAL_SPELL,
    ZONE_CHANGE,
} from './handlers.ts';
import { DateTime } from 'luxon';
import { customAlphabet } from 'nanoid/non-secure';
import Entity, { Player } from './entity.ts';
import { BOSSES_BY_NAME } from './data.ts';
import Timeline from './timeline.ts';
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 16);

/**
 * An id to use for the logging player.
 */
export const PLAYER_ID = `#you`;

/**
 * An id to use for unknown entities.
 */
export const UNKNOWN_ID = `#unknown`;

/**
 * Regular expression which extracts the timestamp from an EverQuest log message.
 */
const TIMESTAMP_REGEX = new RegExp(`^\\[(.*?)\] (.*)$`);

/**
 * List of regular expressions that indicate that the message should not be parsed.
 */
const CHAT_SPAM_AVOIDLIST = [
    // ignore chat messages from others
    new RegExp(
        `^.+ (?:tells you,|says,?(?: out of character,)?|shouts|auctions,|tells the group,|tells the guild,|tells the raid,) '.+'`,
    ),
    // ignore chat messages from self
    new RegExp(
        `^You (?:say(?: out of character)?|shout|tell your party|tell your raid|tell .+|auction), '.+'$`,
    ),
    // ignore exp gain messages
    new RegExp(`^You gain experience!!$`),
    new RegExp(`^You gain bonus AA experience!`),
    new RegExp(`^Your .+ absorbs energy,`),
    new RegExp(`^You have gained an ability point!`),
    // ignore loot messages
    new RegExp(`^Luck is with you!`),
    new RegExp(`^Targeted \\(Corpse\\):`),
    new RegExp(`^Stand close to and right click on the Corpse to try looting it\.$`),
    new RegExp(`^--You have looted a`),
    new RegExp(`^You receive .+ from the corpse\.$`),

    // ignore faction messages
    new RegExp(`^Your faction standing with`),

    // ignore server spam
    new RegExp(`has reached Level`),
    new RegExp(`has logged in for the first time\.$`),

    // ignore error messages
    new RegExp(`^You cannot see your target\.$`),
    new RegExp(`^You can use this ability again in`),
    new RegExp(`^You must first click on the being you wish to attack!$`),

    // ignore spell worn off messages (they aren't consistent enough to care about)
    new RegExp(`^Your .+ spell has worn off of .+\.$`),
];

/**
 * A Parser object which ingests a logfile from The Heroes Journey custom EverQuest server.
 */
export default class Parser {
    /**
     * The timestamp of the first event in the log.
     */
    start: number | undefined = undefined;

    /**
     * The timestamp of the last event in the log.
     */
    end: number | undefined = undefined;

    /**
     * The combat encounters parsed by this Parser.
     */
    encounters: Encounter[] = [];

    /**
     * Message handlers.
     */
    handlers: Handler[] = [
        ZONE_CHANGE,
        CRITICAL_MELEE,
        PLAYER_MELEE_HIT,
        PLAYER_MELEE_MISS,
        OTHER_DAMAGE_SHIELD_HIT,
        OTHER_MELEE_HIT,
        OTHER_MELEE_MISS,
        YOU_CRITICAL_SPELL,
        OTHER_CRITICAL_SPELL,
        SPELL_HIT,
        SPELL_HIT_YOU,
        PLAYER_DEATH,
        PLAYER_KILL,
        OTHER_DEATH,
    ];

    /**
     * The raw log file, split into individual lines.
     */
    lines: string[] = [];

    /**
     * The current index.
     */
    index: number = 0;

    /**
     * Does the next line represent a critical hit?
     */
    nextLineCritical = false;

    /**
     * The logging player.
     */
    player = new Player();

    /**
     * The current zone that the player is in.
     */
    zone: string | undefined = undefined;

    /**
     * Parse a log file.
     *
     * @param log
     */
    constructor(log: string) {
        this.lines = log.split(new RegExp('\r?\n'));
    }

    /**
     * Associate the logging player with the specified name.
     *
     * @param name the name to use for the logging player.
     */
    associatePlayer(name: string) {
        if (!this.player.name) {
            this.player.name = name;

            this.encounters.forEach((it) => {
                it.entities[PLAYER_ID].name = name;
                if (it.entities[name]) {
                    const existing = it.entities[name];
                    it.entities[PLAYER_ID].mergeFrom(existing);
                    delete it.entities[name];
                }
                it.timeline.replaceId(name, PLAYER_ID);
            });
        }
    }

    /**
     * Get the id to use for the entity with specified name.
     *
     * @param name the entity name
     */
    nameToId(name: string) {
        // map player names to the correct player id and name.
        let id;
        let mappedName: string | undefined = name;

        if (name === UNKNOWN_ID) {
            id = UNKNOWN_ID;
            mappedName = `Unknown`;
        } else if (name === 'YOU') {
            id = this.player.id;
            mappedName = this.player.name;
        } else if (this.player.name && this.player.name === name) {
            id = this.player.id;
            mappedName = name;
        } else if (name.startsWith(`A `)) {
            // combat log capitalization is inconsistent.
            id = `a ${name.slice(2, name.length)}`;
            mappedName = `a ${name.slice(2, name.length)}`;
        } else if (name.startsWith(`An `)) {
            id = `an ${name.slice(3, name.length)}`;
            mappedName = `an ${name.slice(3, name.length)}`;
        }

        // sometimes corpses generate combat log events (ex: dots). don't make new entities for them.
        if (name.endsWith('`s corpse')) {
            id = name.slice(0, name.length - 9);
            mappedName = name.slice(0, name.length - 9);
        }

        return {
            id: (id || name).toLowerCase().replace(new RegExp(`[-\\s]`, `g`), () => ``),
            name: mappedName,
        };
    }

    /**
     * Associate the player pet with the specified owner.
     *
     * @param petName the pet name
     * @param ownerName the owner name
     */
    associatePlayerPet(petName: string, ownerName: string) {
        const encounter = last(this.encounters);
        if (!encounter) return;

        const pet = this.nameToId(petName);
        const owner = this.nameToId(ownerName);
        const ownerEntity = encounter.getOrCreate(owner);
        const petEntity = encounter.getOrCreate(pet);
        petEntity.owner = ownerEntity.id;
    }

    /**
     * Parse the next encounter.
     *
     * Returns undefined if there is no next encounter.
     */
    parseNext(): Encounter | undefined {
        if (this.index >= this.lines.length) return undefined;
        while (this.index < this.lines.length) {
            const line = TIMESTAMP_REGEX.exec(this.lines[this.index]);
            if (line) {
                const [_, timestamp, rest] = line;

                // should we avoid parsing this line?
                const avoid = CHAT_SPAM_AVOIDLIST.find((it) => it.test(rest));
                if (!avoid) {
                    // we can parse this line.
                    const handler = this.handlers.find((it) => it.regex.test(rest));
                    if (handler) {
                        const time = parseEQTimestamp(timestamp);
                        const params = handler.regex.exec(rest)!;
                        const result = this.manageEncounterTime(time.toMillis());

                        // if we get a result from 'manageEncounterTime', we've ended our encounter. return it.
                        if (result) return result;

                        // otherwise, keep parsing
                        handler.evaluate(time.toMillis(), params, this);
                    }
                }
            }

            this.index++;
        }

        // if we've reached the end here, return the last encounter if it's real.
        const encounter = last(this.encounters)!;
        if (!isEmpty(encounter.entities) && encounter.duration > 0) return encounter;
        return undefined;
    }

    /**
     * Manage the encounter lifecycle by comparing the current message timestamp to the encounter start/end time.
     *
     * @param time the current encounter time
     * @param forceEnd should we forcibly end the encounter?
     * @private
     */
    private manageEncounterTime(time: number, forceEnd = false): Encounter | undefined {
        // update the timestamps for the parser
        if (!this.start) this.start = time;
        if (!this.end || time > this.end) this.end = time;

        // if we don't have an encounter, make one.
        if (this.encounters.length === 0) {
            const first = new Encounter(this.player, this.encounters.length.toString());
            first.zone = this.zone;
            this.encounters.push(first);
        }

        // update the encounter timestamps, and start a new encounter if enough time has elapsed since the previous
        // encounter.
        const encounter = last(this.encounters)!;
        if (forceEnd) {
            encounter.reset();
            encounter.zone = this.zone;
            return;
        }
        if (!encounter.start) encounter.start = time;
        if (!encounter.end) {
            encounter.end = time;
            encounter.duration = encounter.end - encounter.start;
            return;
        }

        // initial dumb encounter splitting logic: has 10 seconds elapsed since our last encounter event?
        if (time - encounter.end > 10 * 1000) {
            // we should split our encounter. is it worth keeping?

            const shouldDiscard =
                // don't keep zero-duration encounters.
                encounter.duration <= 0 ||
                // don't keep encounters where we don't have enemies.
                !values(encounter.entities).find((it) => it.isEnemy) ||
                // don't keep non-boss encounters where nobody dies
                !values(encounter.entities).find((it) => it.isBoss || it.deaths.length);

            // if any of the 'discard' conditions are true, discard our current encounter by
            // resetting it to empty.
            if (shouldDiscard) {
                encounter.reset();
                encounter.zone = this.zone;
                return;
            }

            // otherwise, finalize our encounter and create a new active encounter.
            encounter.isOver = true;
            const next = new Encounter(this.player, this.encounters.length.toString());
            next.zone = this.zone;
            next.start = time;
            this.encounters.push(next);
            return encounter;
        }

        // our encounter is still ongoing.
        encounter.end = time;
        encounter.duration = encounter.end - encounter.start;
    }

    /**
     * Manage the enemy state between two entities.
     *
     * @param source the attacking entity
     * @param target the entity being attacked
     * @private
     */
    private manageEnemyState(source: Entity, target: Entity) {
        // dont do anything if we attack ourselves.
        if (source.id === target.id) return;

        // something being attacked by a player or a pet is an enemy.
        // this won't work if we ever run into enemies that cast charm (i dunno if we will).
        if (source.id === PLAYER_ID || source.owner === PLAYER_ID) {
            source.isEnemy = false;
            target.isEnemy = true;
            return;
        }

        // something attacking or being attacked by an enemy is not an enemy.
        if (source.isEnemy !== undefined) {
            target.isEnemy = !source.isEnemy;
            return;
        }

        if (target.isEnemy !== undefined) {
            source.isEnemy = !target.isEnemy;
            return;
        }
    }

    /**
     * Look ahead to a future log line.
     *
     * @param i the number of lines to look ahead at.
     */
    lookAhead(i: number): string | undefined {
        const index = this.index + i;

        if (this.lines.length > index) {
            const result = TIMESTAMP_REGEX.exec(this.lines[index]);
            if (result) {
                // we have a next line
                const line = result[2];

                // should we avoid this next line?
                const avoid = CHAT_SPAM_AVOIDLIST.find((it) => it.test(line));
                if (avoid) return this.lookAhead(i + 1);

                // we can return the line
                return line;
            }
        }

        return undefined;
    }

    /**
     * Skip ahead to a future log line, returning the line and advancing the index (so the line will not be otherwise
     * handled).
     *
     * @param i the number of lines to skip ahead at.
     */
    skipAhead(i: number): string | undefined {
        if (this.lines.length > this.index + i) {
            const result = TIMESTAMP_REGEX.exec(this.lines[this.index + i]);
            if (result) {
                // we have a next line
                const line = result[2];

                // should we avoid this next line?
                const avoid = CHAT_SPAM_AVOIDLIST.find((it) => it.test(line));
                if (avoid) return this.skipAhead(i + 1);

                // we can advance and return the line.
                this.index += i;
                return line;
            } else {
                this.index += i;
                return undefined;
            }
        }

        return undefined;
    }

    /**
     * Look back through the log, returning a list of combat log events that happened before the current event until the
     * provided timestamp (inclusive). The lines will be returned in reverse-chronological order.
     *
     * If our current line doesn't have a timestamp for some reason, don't return anything.
     *
     * @param timestamp the timestamp to look back to
     */
    lookBack(timestamp: number): string[] {
        const result: string[] = [];
        if (this.index === 0) return result;

        const end = DateTime.fromMillis(timestamp);
        let i = this.index - 1;
        let line = TIMESTAMP_REGEX.exec(this.lines[i]);
        while (i > 0 && line && end <= parseEQTimestamp(line[1])) {
            line = TIMESTAMP_REGEX.exec(this.lines[i]);
            if (line) {
                const time = parseEQTimestamp(line[1]);
                const rest = line[2];
                if (end <= time && !CHAT_SPAM_AVOIDLIST.find((it) => it.test(rest))) {
                    result.push(rest);
                }
            }
            i--;
        }

        return result;
    }

    /**
     * Add a melee event to this Encounter, originating from the logging player.
     */
    addPlayerMeleeHit(timestamp: number, type: MeleeDamageType, target: string, damage: number) {
        const encounter = last(this.encounters)!;
        const entity = encounter.getOrCreate(PLAYER_ID);
        const targetEntity = encounter.getOrCreate(this.nameToId(target));
        this.addMeleeHit(timestamp, entity, type, targetEntity, damage);
    }

    /**
     * Add a melee event to this Encounter.
     */
    private addMeleeHit(
        timestamp: number,
        source: Entity,
        type: MeleeDamageType,
        target: Entity,
        damage: number,
    ) {
        this.manageEnemyState(source, target);
        const damageType = MELEE_DAMAGE_TYPE_NORMALIZE_MAP[type];

        source.outgoing.addMeleeHit(damageType, target.id, damage, this.nextLineCritical);
        target.incoming.addMeleeHit(damageType, source.id, damage, this.nextLineCritical);
        last(this.encounters)!.timeline.addDamageEvent(
            timestamp,
            source.id,
            target.id,
            type,
            `melee`,
            damage,
        );

        this.nextLineCritical = false;
        if (source.isDead) source.isDead = false;
    }

    /**
     * Add a melee miss event to this Encounter, originating from the logging player.
     */
    addPlayerMeleeMiss(
        timestamp: number,
        damageType: MeleeDamageType,
        target: string,
        missType: MeleeMissType,
    ) {
        const encounter = last(this.encounters)!;
        const entity = encounter.getOrCreate(PLAYER_ID);
        const targetEntity = encounter.getOrCreate(this.nameToId(target));
        this.addMeleeMiss(timestamp, entity, damageType, targetEntity, missType);
    }

    /**
     * Add a melee miss event to this Encounter.
     */
    private addMeleeMiss(
        timestamp: number,
        source: Entity,
        damage: MeleeDamageType,
        target: Entity,
        miss: MeleeMissType,
    ) {
        this.manageEnemyState(source, target);
        const missType = MELEE_MISS_TYPE_NORMALIZE_MAP[miss];
        const damageType = MELEE_DAMAGE_TYPE_NORMALIZE_MAP[damage];

        source.outgoing.addMeleeMiss(damageType, target.id, missType);
        target.incoming.addMeleeMiss(damageType, source.id, missType);

        if (source.isDead) source.isDead = false;
    }

    /**
     * Add a melee event to this Encounter, originating from an entity.
     */
    addOtherMeleeHit(
        timestamp: number,
        source: string,
        type: MeleeDamageType,
        target: string,
        damage: number,
    ) {
        const encounter = last(this.encounters)!;
        const entity = encounter.getOrCreate(this.nameToId(source));
        const targetEntity = encounter.getOrCreate(this.nameToId(target));
        this.addMeleeHit(timestamp, entity, type, targetEntity, damage);

        if (entity.isDead) entity.isDead = false;
    }

    /**
     * Add a melee miss event to this Encounter, originating from an entity.
     */
    addOtherMeleeMiss(
        timestamp: number,
        source: string,
        damageType: MeleeDamageType,
        target: string,
        missType: MeleeMissType,
    ) {
        const encounter = last(this.encounters)!;
        const entity = encounter.getOrCreate(this.nameToId(source));
        const targetEntity = encounter.getOrCreate(this.nameToId(target));
        this.addMeleeMiss(timestamp, entity, damageType, targetEntity, missType);

        if (entity.isDead) entity.isDead = false;
    }

    /**
     * Add a damage shield event to this Encounter, originating from an entity.
     */
    addOtherDamageShield(
        timestamp: number,
        source: string,
        target: string,
        effect: string,
        damage: number,
    ) {
        const encounter = last(this.encounters)!;
        const attacker = encounter.getOrCreate(this.nameToId(source));
        const shielded = encounter.getOrCreate(this.nameToId(target));
        this.manageEnemyState(attacker, shielded);

        attacker.incoming.addDamageShield(effect, shielded.id, damage);
        shielded.outgoing.addDamageShield(effect, attacker.id, damage);
        encounter.timeline.addDamageEvent(
            timestamp,
            shielded.id,
            attacker.id,
            effect,
            `ds`,
            damage,
        );
    }

    /**
     * Add a spell hit event to this Encounter, originating from an entity.
     */
    addSpellHit(
        timestamp: number,
        source: string,
        target: string,
        spellName: string,
        damage: number,
    ) {
        const encounter = last(this.encounters)!;
        const sourceEntity = encounter.getOrCreate(this.nameToId(source));
        const targetEntity = encounter.getOrCreate(this.nameToId(target));

        this.manageEnemyState(sourceEntity, targetEntity);

        sourceEntity.outgoing.addSpellHit(
            spellName,
            targetEntity.id,
            damage,
            this.nextLineCritical,
        );
        targetEntity.incoming.addSpellHit(
            spellName,
            sourceEntity.id,
            damage,
            this.nextLineCritical,
        );
        encounter.timeline.addDamageEvent(
            timestamp,
            sourceEntity.id,
            targetEntity.id,
            spellName,
            `spell`,
            damage,
        );

        this.nextLineCritical = false;

        // entities can actually make spell hits while dead, but the combat log attributes them to their corpse
        if (sourceEntity.isDead && !source.endsWith('`s corpse')) sourceEntity.isDead = false;
    }

    /**
     * Add a player-targeted spell damage event.
     *
     * The combat log does not actually give the spell name or source for these.
     *
     * @param timestamp the timestamp
     * @param description the spell description
     * @param damage the damage
     */
    addUnknownPlayerSpellHit(timestamp: number, description: string, damage: number) {
        const encounter = last(this.encounters)!;
        const targetEntity = encounter.getOrCreate(this.player.id);

        // todo: long term goal - look up spell description against spell data file to try and name it.
        targetEntity.incoming.addSpellHit(description, UNKNOWN_ID, damage, false);
    }

    /**
     * Change the zone.
     *
     * @param timestamp the timestamp
     * @param zone the new zone name
     */
    changeZone(timestamp: number, zone: string) {
        this.zone = zone;
        this.manageEncounterTime(timestamp, true);
    }

    /**
     * Register that the player has died.
     *
     * @param timestamp the time of death
     * @param killer the name of the killer
     */
    addPlayerDeath(timestamp: number, killer: string) {
        // todo: death recap
        const encounter = last(this.encounters)!;

        // mark the player dead, the encounter failed, and force a new encounter.
        const player = encounter.getOrCreate(PLAYER_ID);
        const killerEntity = encounter.getOrCreate(this.nameToId(killer));
        player.deaths.push({
            timestamp,
            killerId: killerEntity.id,
            recap: undefined, // todo: death recap for player death
        });

        encounter.isFailed = true;

        this.manageEncounterTime(timestamp, true);
    }

    /**
     * Register that the player killed an enemy.
     *
     * @param timestamp the time of death
     * @param killed the name of the slain enemy
     */
    addPlayerKill(timestamp: number, killed: string) {
        const encounter = last(this.encounters)!;
        const player = encounter.getOrCreate(PLAYER_ID);
        const target = encounter.getOrCreate(this.nameToId(killed));
        this.manageEnemyState(player, target);

        target.isDead = true;
        target.deaths.push({
            timestamp,
            killerId: player.id,
            recap: undefined,
        });

        // todo: need logic for multiple enemies with same name
    }

    /**
     * Register that an entity killed another entity.
     *
     * @param timestamp the time of death
     * @param killer the name of the killing entity
     * @param killed the name of the killed entity
     */
    addOtherDeath(timestamp: number, killer: string, killed: string) {
        const encounter = last(this.encounters)!;
        const source = encounter.getOrCreate(this.nameToId(killer));
        const target = encounter.getOrCreate(this.nameToId(killed));
        this.manageEnemyState(source, target);

        target.isDead = true;
        target.deaths.push({
            timestamp,
            killerId: source.id,
            recap: undefined, // todo: death recap for non-enemy death
        });

        // todo: need logic for multiple enemies with same name
    }

    /**
     * Add a warning message to the current encounter.
     *
     * @param timestamp the timestamp
     * @param key the key
     * @param message the message
     */
    addWarning(timestamp: number, key: string, message: string) {
        const encounter = last(this.encounters)!;
        encounter.addWarning(timestamp, key, message);
    }
}

/**
 * Class representing a combat encounter between the player and any number of enemy entities.
 */
export class Encounter {
    /**
     * The start time for this encounter.
     */
    start: number = 0;

    /**
     * The end time for this encounter.
     */
    end: number = 0;

    /**
     * The duration, in milliseconds, of this encounter.
     */
    duration: number = 0;

    /**
     * The timeline of events.
     */
    timeline = new Timeline();

    /**
     * Is this encounter over?
     */
    isOver = false;

    /**
     * Does this encounter represent a boss fight?
     */
    isBoss = false;

    /**
     * Did we fail this encounter?
     */
    isFailed = false;

    /**
     * The zone that this encounter takes place in.
     */
    zone: string | undefined = undefined;

    /**
     * The entities involved in this encounter.
     */
    entities: Record<string, Entity> = {};

    /**
     * Warnings generated when parsing this log.
     */
    warnings: Record<string, { message: string; count: number }> = {};

    /**
     * Construct an Encounter.
     *
     * @param player a reference to the logging player
     * @param id a unique encounter id
     */
    constructor(
        player: Player,
        readonly id: string = nanoid(),
    ) {
        this.entities[PLAYER_ID] = player.emptyCopy();
    }

    /**
     * Get or create an entity with the provided id.
     *
     * @param entityId the entity id to get or create
     * @return the entity
     */
    getOrCreate(entityId: string | { name?: string; id: string }): Entity {
        let name;
        let id;
        if (typeof entityId === 'string') {
            name = entityId;
            id = entityId;
        } else {
            name = entityId.name;
            id = entityId.id;
        }

        if (!this.entities[id]) {
            this.entities[id] = new Entity(id);
            this.entities[id].name = name;
        } else if (!this.entities[id].name) {
            this.entities[id].name = name;
        } else {
            // regex containing special characters that can get messed up in logs.
            const special = new RegExp(`-`);

            // if we have an entity without a special character, but receive it with a special
            // character, the one with a special character is correct.
            if (name && special.test(name) && !special.test(this.entities[id].name!)) {
                this.entities[id].name = name;
            }
        }

        if (name && this.entities[id].isBoss === undefined && has(BOSSES_BY_NAME, name)) {
            this.entities[id].isBoss = true;
            this.isBoss = true;
        }

        return this.entities[id];
    }

    /**
     * Add a warning to this Encounter.
     *
     * @param timestamp the timestamp
     * @param key the warning error key
     * @param message the message
     */
    addWarning(timestamp: number, key: string, message: string) {
        if (!this.warnings[key]) {
            this.warnings[key] = { message, count: 1 };
        } else {
            this.warnings[key].count++;
        }
    }

    /**
     * Reset the state contained in this encounter object.
     */
    reset() {
        const player = this.entities[PLAYER_ID].emptyCopy();
        this.timeline = new Timeline();
        this.entities = {
            [PLAYER_ID]: player,
        };
        this.start = 0;
        this.end = 0;
        this.isOver = false;
        this.isBoss = false;
        this.warnings = {};
    }
}

/**
 * Parse a timestamp from an EverQuest log file.
 *
 * The timestamp format is pretty cursed: Mon Dec 23 23:02:01 2024
 *
 * @param timestamp the timestamp string
 */
const parseEQTimestamp = (timestamp: string) =>
    DateTime.fromFormat(timestamp, 'ccc LLL d hh:mm:ss yyyy');

// things to track (per entity)
// - outgoing damage
// - incoming damage
// - outgoing healing
// - incoming healing
// - deaths (death recap for non-enemies)

// things to track (for timeline, in 6 second batches because server tick)
// - damage by source/type
// - healing by source/type
