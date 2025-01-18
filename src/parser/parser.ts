import {has, isEmpty, last, values} from "lodash";
import {
    Handler,
    MARK_CRITICAL_MELEE, MELEE_DAMAGE_TYPE_NORMALIZE_MAP, MELEE_MISS_TYPE_NORMALIZE_MAP,
    MeleeDamageType, MeleeMissType, OTHER_CRITICAL_SPELL, OTHER_DAMAGE_SHIELD_HIT, OTHER_DEATH,
    OTHER_MELEE_HIT, OTHER_MELEE_MISS, PLAYER_DEATH, PLAYER_KILL,
    PLAYER_MELEE_HIT,
    PLAYER_MELEE_MISS, SPELL_HIT, SPELL_HIT_YOU, YOU_CRITICAL_SPELL, ZONE_CHANGE
} from "./handlers.ts";
import {DateTime} from "luxon";
import { customAlphabet } from 'nanoid/non-secure';
import Entity from "./entity.ts";
import {BOSSES_BY_NAME} from "./data.ts";
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 16);

/**
 * An id to use for the logging player.
 */
export const PLAYER_ID = `#YOU`;

/**
 * An id to use for unknown entities.
 */
export const UNKNOWN_ID = `#unknown`;

/**
 * Regular expression which extracts the timestamp from an EverQuest log message.
 */
const TIMESTAMP_REGEX = new RegExp(`^\\[(.*)\] (.*)$`);

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
        MARK_CRITICAL_MELEE,
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
        OTHER_DEATH
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
        this.lines = log.split(new RegExp("\r?\n"));
    }

    /**
     * Associate the logging player with the specified name.
     *
     * @param name the name to use for the logging player.
     */
    associatePlayer(name: string) {
        if (!this.player.name) {
            this.player.name = name;

            this.encounters.forEach(it => {
                if (!it.entities[PLAYER_ID].name) it.entities[PLAYER_ID].name = name;
                if (it.entities[name]) {
                    const existing = it.entities[name];
                    it.entities[PLAYER_ID].mergeFrom(existing);
                    delete it.entities[name];
                }
            })
        }
    }

    /**
     * Get the id to use for the entity with specified name.
     *
     * @param name the entity name
     */
    private nameToId(name: string) {
        // map player names to the correct player id and name.
        let id = name;
        let mappedName: string | undefined = name;

        if (name === 'YOU') {
            id = this.player.id;
            mappedName = this.player.name;
        } else if (this.player.name && this.player.name === name) {
            id = this.player.id;
            mappedName = name;
        } else if (name.startsWith(`A `)) {
            // combat log capitalization is inconsistent.
            id = `a ${name.slice(2, name.length)}`
            mappedName = `a ${name.slice(2, name.length)}`
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
            id,
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
     * Parse the log.
     */
    parse() {
        while (this.index < this.lines.length) {
            const line = this.lines[this.index];
            const handler = this.handlers.find(it => it.regex.test(line));
            if (handler) {
                const params = handler.regex.exec(line);
                if (params) {
                    if (this.encounters.length === 0) this.encounters.push(new Encounter(this.player));
                    handler.evaluate(0, params, this);
                }
            }
            this.index++;
        }

        // finish the last encounter
        return this.encounters;
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
                if (rest.startsWith(`Scrap crushes a crimson`)) debugger;
                const handler = this.handlers.find(it => it.regex.test(rest));
                if (handler) {
                    const time = parseEQTimestamp(timestamp);
                    const params = handler.regex.exec(rest)!;
                    const result = this.manageEncounterTime(time.toMillis());

                    // if we get a result from 'manageEncounterTime', we've ended our encounter. return it.
                    if (result) return result;

                    // otherwise, keep parsing
                    handler.evaluate(0, params, this);
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
        if (this.encounters.length === 0) this.encounters.push(new Encounter(this.player, this.encounters.length.toString()));

        // update the encounter timestamps, and start a new encounter if enough time has elapsed since the previous
        // encounter.
        const encounter = last(this.encounters)!;
        if (!encounter.start) encounter.start = time;
        if (!encounter.end) {
            encounter.end = time;
            encounter.duration = encounter.end - encounter.start;
        } else if (encounter.end < time) {
            // initial dumb encounter splitting logic: has 10 seconds elapsed since our last encounter event?
            if (forceEnd || time - encounter.end > 10 * 1000) {
                if (encounter.duration <= 0) {
                    // don't keep zero-duration encounters.
                    encounter.reset();
                    encounter.zone = this.zone;
                } else if (!values(encounter.entities).find(it => it.isEnemy)) {
                    // don't keep encounters where we don't have enemies.
                    encounter.reset();
                    encounter.zone = this.zone;
                } else {
                    encounter.isOver = true;
                    const next = new Encounter(this.player, this.encounters.length.toString());
                    next.zone = this.zone;
                    next.start = time;
                    this.encounters.push(next);
                    return encounter;
                }
            } else {
                encounter.end = time;
                encounter.duration = encounter.end - encounter.start;
            }
        }
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
    lookAhead(i: number) {
        const index = this.index + i;

        if (this.lines.length > index) {
            const line = TIMESTAMP_REGEX.exec(this.lines[index]);
            if (line) return line[2];
        }

        return undefined;
    }

    /**
     * Skip ahead to a future log line, returning the line and advancing the index (so the line will not be otherwise
     * handled).
     *
     * @param i the number of lines to skip ahead at.
     */
    skipAhead(i: number) {
        this.index += i;
        if (this.lines.length > this.index) {
            const line = TIMESTAMP_REGEX.exec(this.lines[this.index]);
            if (line) return line[2];
        }

        return undefined;
    }

    /**
     * Add a melee event to this Encounter, originating from the logging player.
     */
    addPlayerMeleeHit(timestamp: number, type: MeleeDamageType, target: string, damage: number) {
        // this.manageEncounterTime(timestamp);
        const encounter = last(this.encounters)!;
        const entity = encounter.getOrCreate(PLAYER_ID);
        const targetEntity = encounter.getOrCreate(this.nameToId(target));
        this.addMeleeHit(timestamp, entity, type, targetEntity, damage);
    }

    /**
     * Add a melee event to this Encounter.
     */
    private addMeleeHit(timestamp: number, source: Entity, type: MeleeDamageType, target: Entity, damage: number) {
        this.manageEnemyState(source, target);
        const damageType = MELEE_DAMAGE_TYPE_NORMALIZE_MAP[type];

        source.outgoing.addMeleeHit(damageType, target.id, damage, this.nextLineCritical);
        target.incoming.addMeleeHit(damageType, source.id, damage, this.nextLineCritical);

        this.nextLineCritical = false;
        if (source.isDead) source.isDead = false;
    }

    /**
     * Add a melee miss event to this Encounter, originating from the logging player.
     */
    addPlayerMeleeMiss(timestamp: number, damageType: MeleeDamageType, target: string, missType: MeleeMissType) {
        // this.manageEncounterTime(timestamp);
        const encounter = last(this.encounters)!;
        const entity = encounter.getOrCreate(PLAYER_ID);
        const targetEntity = encounter.getOrCreate(this.nameToId(target));
        this.addMeleeMiss(timestamp, entity, damageType, targetEntity, missType);
    }

    /**
     * Add a melee miss event to this Encounter.
     */
    private addMeleeMiss(timestamp: number, source: Entity, damage: MeleeDamageType, target: Entity, miss: MeleeMissType) {
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
    addOtherMeleeHit(timestamp: number, source: string, type: MeleeDamageType, target: string, damage: number) {
        // this.manageEncounterTime(timestamp);
        const encounter = last(this.encounters)!;
        const entity = encounter.getOrCreate(this.nameToId(source));
        const targetEntity = encounter.getOrCreate(this.nameToId(target));
        this.addMeleeHit(timestamp, entity, type, targetEntity, damage);

        if (entity.isDead) entity.isDead = false;
    }

    /**
     * Add a melee miss event to this Encounter, originating from an entity.
     */
    addOtherMeleeMiss(timestamp: number, source: string, damageType: MeleeDamageType, target: string, missType: MeleeMissType) {
        // this.manageEncounterTime(timestamp);
        const encounter = last(this.encounters)!;
        const entity = encounter.getOrCreate(this.nameToId(source));
        const targetEntity = encounter.getOrCreate(this.nameToId(target));
        this.addMeleeMiss(timestamp, entity, damageType, targetEntity, missType);

        if (entity.isDead) entity.isDead = false;
    }

    /**
     * Add a damage shield event to this Encounter, originating from an entity.
     */
    addOtherDamageShield(timestamp: number, source: string, target: string, effect: string, damage: number) {
        // this.manageEncounterTime(timestamp);

        const encounter = last(this.encounters)!;
        const attacker = encounter.getOrCreate(this.nameToId(source));
        const shielded = encounter.getOrCreate(this.nameToId(target));
        this.manageEnemyState(attacker, shielded);

        attacker.incoming.addDamageShield(effect, shielded.id, damage);
        shielded.outgoing.addDamageShield(effect, attacker.id, damage);
    }

    /**
     * Add a spell hit event to this Encounter, originating from an entity.
     */
    addSpellHit(timestamp: number, source: string, target: string, spellName: string, damage: number) {
        // this.manageEncounterTime(timestamp);

        const encounter = last(this.encounters)!;
        const sourceEntity = encounter.getOrCreate(this.nameToId(source));
        const targetEntity = encounter.getOrCreate(this.nameToId(target));

        this.manageEnemyState(sourceEntity, targetEntity);

        sourceEntity.outgoing.addSpellHit(spellName, targetEntity.id, damage, this.nextLineCritical);
        targetEntity.incoming.addSpellHit(spellName, sourceEntity.id, damage, this.nextLineCritical);

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
        })

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
        })

        // todo: need logic for multiple enemies with same name
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
     * Construct an Encounter.
     *
     * @param player a reference to the logging player
     * @param id a unique encounter id
     */
    constructor(player: Player, readonly id: string = nanoid()) {
        this.entities[PLAYER_ID] = player.emptyCopy();
    }

    /**
     * Get or create an entity with the provided id.
     *
     * @param entityId the entity id to get or create
     * @return the entity
     */
    getOrCreate(entityId: string | {name?: string, id: string}): Entity {
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
        }

        if (name && this.entities[id].isBoss === undefined && has(BOSSES_BY_NAME, name)) {
            this.entities[id].isBoss = true;
            this.isBoss = true;
        }

        return this.entities[id];
    }

    /**
     * Reset the state contained in this encounter object.
     */
    reset() {
        const player = this.entities[PLAYER_ID].emptyCopy();
        this.entities = {
            [PLAYER_ID]: player
        }
        this.start = 0;
        this.end = 0;
        this.isOver = false;
        this.isBoss = false;
    }
}

/**
 * An entity class representing the logging player.
 */
export class Player extends Entity {

    /**
     * Construct a player entity.
     */
    constructor() {
        super(PLAYER_ID);
        this.isEnemy = false;
        this.isBoss = false;
    }
}

/**
 * Parse a timestamp from an EverQuest log file.
 *
 * The timestamp format is pretty cursed: Mon Dec 23 23:02:01 2024
 *
 * @param timestamp the timestamp string
 */
const parseEQTimestamp = (timestamp: string) => DateTime.fromFormat(timestamp, "ccc LLL d hh:mm:ss yyyy");

// things to track (per entity)
// - outgoing damage
// - incoming damage
// - outgoing healing
// - incoming healing
// - deaths (death recap for non-enemies)

// things to track (for timeline, in 6 second batches because server tick)
// - damage by source/type
// - healing by source/type
