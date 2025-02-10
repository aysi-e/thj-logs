import Parser, { Encounter, UNKNOWN_ID } from './parser.ts';

export type Handler = {
    /**
     * The regex which matches messages that this handler should process.
     */
    regex: RegExp;

    /**
     * Evaluate the matching line, writing changes to the Parser object.
     *
     * @param timestamp the timestamp
     * @param line the matching line
     * @param parser the parser object.
     */
    evaluate: (timestamp: number, line: RegExpMatchArray, parser: Parser) => Encounter | void;
};

/**
 * Type representing each kind of melee damage type present in an EverQuest log file.
 */
export type MeleeDamageType =
    | 'maul'
    | 'bite'
    | 'mauls'
    | 'bites'
    | 'claw'
    | 'claws'
    | 'gore'
    | 'gores'
    | 'sting'
    | 'stings'
    | 'slices'
    | 'slice'
    | 'smash'
    | 'smashes'
    | 'rend'
    | 'rends'
    | 'slash'
    | 'slashes'
    | 'punch'
    | 'punches'
    | 'hit'
    | 'hits'
    | 'crush'
    | 'crushes'
    | 'pierce'
    | 'pierces'
    | 'kick'
    | 'kicks'
    | 'strike'
    | 'strikes'
    | 'backstab'
    | 'backstabs'
    | 'bash'
    | 'bashes'
    | 'frenzy on'
    | 'frenzies on'
    | 'frenzy';

/**
 * Special types of melee damage that might appear in an EverQuest log file.
 */
export type SpecialMeleeType =
    | 'assassinate'
    | 'finishing blow'
    | 'cleave'
    | 'headshot'
    | 'slay undead';

/**
 * Map which normalizes singular/plural melee damage types.
 */
export const MELEE_DAMAGE_TYPE_NORMALIZE_MAP: Record<MeleeDamageType, MeleeDamageType> = {
    maul: 'maul',
    bite: 'bite',
    mauls: 'maul',
    bites: 'bite',
    claw: 'claw',
    claws: 'claw',
    gore: 'gore',
    gores: 'gore',
    sting: 'sting',
    stings: 'sting',
    slices: 'slice',
    slice: 'slice',
    smash: 'smash',
    smashes: 'smash',
    rend: 'rend',
    rends: 'rend',
    slash: 'slash',
    slashes: 'slash',
    punch: 'punch',
    punches: 'punch',
    hit: 'hit',
    hits: 'hit',
    crush: 'crush',
    crushes: 'crush',
    pierce: 'pierce',
    pierces: 'pierce',
    kick: 'kick',
    kicks: 'kick',
    strike: 'strike',
    strikes: 'strike',
    backstab: 'backstab',
    backstabs: 'backstab',
    bash: 'bash',
    bashes: 'bash',
    frenzy: 'frenzy',
    'frenzy on': 'frenzy',
    'frenzies on': 'frenzy',
};

/**
 * List containing each singular melee damage type, for regular expressions.
 */
const MELEE_DAMAGE_TYPE_SINGULAR = [
    'maul',
    'bite',
    'claw',
    'gore',
    'sting',
    'slice',
    'smash',
    'rend',
    'slash',
    'punch',
    'hit',
    'crush',
    'pierce',
    'kick',
    'strike',
    'backstab',
    'bash',
    'frenzy on',
];
const MELEE_DAMAGE_TYPE_SINGULAR_GROUP = `(${MELEE_DAMAGE_TYPE_SINGULAR.join('|')})`;

/**
 * List containing each plural melee damage type, for regular expressions.
 */
const MELEE_DAMAGE_TYPE_PLURALS = [
    'mauls',
    'bites',
    'claws',
    'gores',
    'stings',
    'slices',
    'smashes',
    'rends',
    'slashes',
    'punches',
    'hits',
    'crushes',
    'pierces',
    'kicks',
    'strikes',
    'backstabs',
    'bashes',
    'frenzies on',
];
const MELEE_DAMAGE_TYPE_PLURAL_GROUP = `(${MELEE_DAMAGE_TYPE_PLURALS.join('|')})`;

/**
 * Handler for player melee hits.
 *
 * Regex groups: timestamp, attack type (crush, punch, kick, etc.), target name, damage dealt.
 */
export const PLAYER_MELEE_HIT = {
    regex: new RegExp(
        `^You ${MELEE_DAMAGE_TYPE_SINGULAR_GROUP} (.+) for (\\d+) points? of damage\.$`,
    ),
    evaluate: (timestamp: number, line: RegExpMatchArray, parser: Parser) => {
        const [_, attackType, target, damage] = line;
        parser.addPlayerMeleeHit(
            timestamp,
            attackType as MeleeDamageType,
            target,
            parseInt(damage),
        );
        parser.nextLineCritical = false;
    },
};

/**
 * Type representing each possible way that melee damage could miss.
 */
export type MeleeMissType =
    | 'block'
    | 'blocks'
    | 'miss'
    | 'misses'
    | 'riposte'
    | 'ripostes'
    | 'parry'
    | 'parries'
    | 'dodge'
    | 'dodges'
    | 'absorb'
    | 'absorbs'
    | 'immune';

/**
 * Map which normalizes singular/plural melee miss types.
 */
export const MELEE_MISS_TYPE_NORMALIZE_MAP: Record<
    MeleeMissType,
    'block' | 'miss' | 'riposte' | 'parry' | 'dodge' | 'absorb' | 'immune'
> = {
    block: 'block',
    blocks: 'block',
    miss: 'miss',
    misses: 'miss',
    riposte: 'riposte',
    ripostes: 'riposte',
    parry: 'parry',
    parries: 'parry',
    dodge: 'dodge',
    dodges: 'dodge',
    absorb: 'absorb',
    absorbs: 'absorb',
    immune: 'immune',
};

/**
 * Handler for player melee misses.
 *
 * Regex groups: timestamp, attack type (crush, punch, kick, etc.), target name, damage dealt.
 */
export const PLAYER_MELEE_MISS = {
    regex: new RegExp(`^You try to ${MELEE_DAMAGE_TYPE_SINGULAR_GROUP} (.+), but (.+)!`),
    evaluate: (timestamp: number, line: RegExpMatchArray, parser: Parser) => {
        const [_, attackType, target, rest] = line;
        if (rest === 'miss') {
            parser.addPlayerMeleeMiss(timestamp, attackType as MeleeDamageType, target, 'misses');
        } else if (rest.includes('magical skin absorbs the blow')) {
            parser.addPlayerMeleeMiss(timestamp, attackType as MeleeDamageType, target, 'absorbs');
        } else if (rest.includes('INVULNERABLE')) {
            parser.addPlayerMeleeMiss(timestamp, attackType as MeleeDamageType, target, 'immune');
        } else {
            const missType = new RegExp(`(\\w+)$`, 'g').exec(rest)![1] as MeleeMissType;
            parser.addPlayerMeleeMiss(timestamp, attackType as MeleeDamageType, target, missType);
        }
    },
};

/**
 * Handler for critical melee hits.
 *
 * Regex groups: timestamp, name, damage.
 */
export const CRITICAL_MELEE = {
    regex: new RegExp(`^(.+) scores a critical hit! \\(\\d+\\)$`),
    evaluate: (timestamp: number, line: RegExpMatchArray, parser: Parser) => {
        // attempt to evaluate this critical melee as a player melee event.
        if (evaluatePlayerMeleeCritical(timestamp, line, parser)) return;

        // attempt to evaluate this critical melee as an npc melee event.
        if (evaluateOtherMeleeCritical(timestamp, line, parser)) return;

        parser.addWarning(
            timestamp,
            `missed-melee-${line[1]}`,
            `missed melee event for ${line[1]}`,
        );
    },
};

/**
 * Evaluate a (potential) player melee critical event.
 *
 * Player melee critical hits are one way that we can associate the logging player with a character name.
 *
 * @param timestamp the timestamp when this occurred
 * @param line the parsed line
 * @param parser the parser object
 * @return true if this is event represents a player melee critical event, false otherwise
 */
const evaluatePlayerMeleeCritical = (timestamp: number, line: RegExpMatchArray, parser: Parser) => {
    let nextLine = parser.lookAhead(1) || '';

    // if this melee critical event belongs to a player, the next line must be either:
    // - a damage shield effect message (YOU are pierced by thorns!)
    // - a melee damage hit message (You crush a glimmer drake for 120 points of damage.)
    const playerHitDs = new RegExp(`^YOU are .+!$`);
    if (playerHitDs.test(nextLine)) {
        parser.skipAhead(1);
        nextLine = parser.lookAhead(1) || '';
    }

    // advance forward until we find a line that we can actually parse.
    let i = 1;
    while (
        parser.index < parser.lines.length &&
        !parser.handlers.find((it) => it.regex.test(nextLine))
    ) {
        i++;
        nextLine = parser.lookAhead(i) || '';
    }

    const playerHit = PLAYER_MELEE_HIT.regex.exec(nextLine);
    if (!playerHit) return false;
    if (!parser.player.name) parser.associatePlayer(line[1]);
    parser.skipAhead(i);
    parser.nextLineCritical = true;
    PLAYER_MELEE_HIT.evaluate(timestamp, playerHit, parser);
    return true;
};

/**
 * Evaluate a (potential) NPC melee critical event.
 *
 * If everything is working correctly, melee critical damage log items should be immediately followed by the damage
 * swing. If it isn't, it could be an indication that the entity is out of range and that we're missing combat events.
 *
 * @param timestamp the timestamp when this occurred
 * @param line the parsed line
 * @param parser the parser object
 * @return true if we were able to match the critical text with a NPC hit, false otherwise
 */
const evaluateOtherMeleeCritical = (timestamp: number, line: RegExpMatchArray, parser: Parser) => {
    // if this melee critical event belongs to a npc, the next line must either be:
    // - a damage shield hit message (if the entity is an enemy) (Kerafyrm was hit by non-melee for 76 points of damage.)
    // - a damage shield effect message (if the entity is an ally) (Scrap was pierced by thorns.)
    // - a melee damage hit message (Kerafyrm hits Zumab for 1125 points of damage.) OR an absorb message
    let nextLine = parser.lookAhead(1) || '';

    const dsHit = OTHER_DAMAGE_SHIELD_HIT.regex.exec(nextLine);
    if (dsHit) {
        // we encountered a damage shield hit.
        parser.skipAhead(1);
        OTHER_DAMAGE_SHIELD_HIT.evaluate(timestamp, dsHit, parser);
        nextLine = parser.lookAhead(1) || '';
    } else if (new RegExp(`^(.+) was (.+).`).test(nextLine)) {
        // we encountered a damage shield effect
        parser.skipAhead(1);
        nextLine = parser.lookAhead(1) || '';
    }

    // advance forward until we find a line that we can actually parse.
    while (
        parser.index < parser.lines.length &&
        !parser.handlers.find((it) => it.regex.test(nextLine))
    ) {
        nextLine = parser.skipAhead(1) || '';
    }

    // the id for our entity scoring a critical hit.
    const entityId = parser.nameToId(line[1]).id;

    // we should be able to find our melee hit...
    const otherHit = OTHER_MELEE_HIT.regex.exec(nextLine);
    if (otherHit && parser.nameToId(otherHit[1]).id === entityId) {
        parser.skipAhead(1);
        parser.nextLineCritical = true;
        OTHER_MELEE_HIT.evaluate(timestamp, otherHit, parser);
        return true;
    }

    // it could be absorbed...
    const otherMiss = OTHER_MELEE_MISS.regex.exec(nextLine);
    if (
        otherMiss &&
        parser.nameToId(otherMiss[1]).id === entityId &&
        otherMiss[4].includes('magical skin absorbs the blow')
    ) {
        return true;
    }

    // we could have slain the enemy this second...
    const lookback = parser.lookBack(timestamp);
    const kill = lookback.find((it) => {
        const od = OTHER_DEATH.regex.exec(it);
        if (od && parser.nameToId(od[2]).id === entityId) return true;

        // an enemy could have slain something via a rampage hit.
        const rampage = new RegExp(`(.+) goes on a RAMPAGE!`).exec(it);
        if (rampage && parser.nameToId(rampage[1]).id === entityId) return true;

        return false;
    });

    // we did in fact slay an enemy this second.
    if (kill) return true;

    // we have failed to account for our melee critical
    return false;
};

/**
 * Handler for non-player melee hits.
 *
 * Regex groups: timestamp, attack type (crush, punch, kick, etc.), target name, damage dealt.
 */
export const OTHER_MELEE_HIT = {
    regex: new RegExp(
        `^(.+?) ${MELEE_DAMAGE_TYPE_PLURAL_GROUP} (?!by non-melee)(.+) for (\\d+) points? of damage\.(?: \\(Rampage\\))?$`,
    ),
    evaluate: (timestamp: number, line: RegExpMatchArray, parser: Parser) => {
        const [_, source, attackType, target, damage] = line;
        parser.addOtherMeleeHit(
            timestamp,
            source,
            attackType as MeleeDamageType,
            target,
            parseInt(damage),
        );
        parser.nextLineCritical = false;
    },
};

/**
 * Handler for non-player melee misses.
 *
 * Regex groups: timestamp, attack type (crush, punch, kick, etc.), target name, damage dealt.
 */
export const OTHER_MELEE_MISS = {
    regex: new RegExp(`^(.+?) tries to ${MELEE_DAMAGE_TYPE_SINGULAR_GROUP} (.+), but (.+)!`),
    evaluate: (timestamp: number, line: RegExpMatchArray, parser: Parser) => {
        const [_, source, attackType, target, rest] = line;
        if (rest === 'misses') {
            parser.addOtherMeleeMiss(
                timestamp,
                source,
                attackType as MeleeDamageType,
                target,
                'misses',
            );
        } else if (rest.includes('magical skin absorbs the blow')) {
            parser.addOtherMeleeMiss(
                timestamp,
                source,
                attackType as MeleeDamageType,
                target,
                'absorbs',
            );
        } else if (rest.includes('INVULNERABLE')) {
            parser.addOtherMeleeMiss(
                timestamp,
                source,
                attackType as MeleeDamageType,
                target,
                'immune',
            );
        } else {
            const missType = new RegExp(`(\\w+)$`, 'g').exec(rest)![1] as MeleeMissType;
            parser.addOtherMeleeMiss(
                timestamp,
                source,
                attackType as MeleeDamageType,
                target,
                missType,
            );
        }
    },
};

/**
 * Handler for non-player damage shield hits.
 *
 * In the logs, damage shield hits are immediately followed by an effect description ('target was burned') and then the
 * melee hit that triggered the damage shield. We use this to attribute the damage from the damage shield to the correct
 * entity.
 *
 * Regex groups: timestamp, victim, damage dealt.
 */
export const OTHER_DAMAGE_SHIELD_HIT = {
    regex: new RegExp(`^(.+?) was hit by non-melee for (\\d+) points? of damage.$`),
    evaluate: (timestamp: number, line: RegExpMatchArray, parser: Parser) => {
        const [_, source, damage] = line;
        // to resolve the damage shield hit, we need to look at the next two lines.
        const line1 = parser.lookAhead(1);
        const line2 = parser.lookAhead(2);
        if (line1) {
            if (OTHER_MELEE_HIT.regex.test(line1) || OTHER_MELEE_MISS.regex.test(line1)) {
                // some (bard?) damage shields don't have descriptions. and sometimes the effect messages just don't
                // show up in the log.
                // the hit that caused the damage shield (to determine the source of the damage shield)
                const damageSourceLine =
                    OTHER_MELEE_HIT.regex.exec(line1) || OTHER_MELEE_MISS.regex.exec(line1);
                if (
                    damageSourceLine &&
                    parser.nameToId(damageSourceLine[1]).id === parser.nameToId(source).id
                ) {
                    const [_1, _2, _3, damageSource] = damageSourceLine;
                    parser.addOtherDamageShield(
                        timestamp,
                        source,
                        damageSource,
                        ``,
                        parseInt(damage),
                    );
                    return;
                }
            } else if (line2) {
                // ex: Target was burned.
                const effectLine = new RegExp(`^(.+) was (?!hit by non-melee)(.+).$`).exec(line1);
                // the hit that caused the damage shield (to determine the source of the damage shield)
                const damageSourceLine =
                    OTHER_MELEE_HIT.regex.exec(line2) || OTHER_MELEE_MISS.regex.exec(line2);
                if (
                    effectLine &&
                    damageSourceLine &&
                    parser.nameToId(damageSourceLine[1]).id === parser.nameToId(source).id
                ) {
                    const [_1, _2, _3, damageSource] = damageSourceLine;
                    const [_4, _5, effect] = effectLine;
                    parser.addOtherDamageShield(
                        timestamp,
                        source,
                        damageSource,
                        effect,
                        parseInt(damage),
                    );
                    parser.skipAhead(1);
                    return;
                }
            }
        }

        // we can't determine why we triggered a damage shield (missed log message?)
        parser.addOtherDamageShield(timestamp, line[1], UNKNOWN_ID, ``, parseInt(line[2]));
        parser.addWarning(
            timestamp,
            `missed-melee-${line[1]}`,
            `missed melee event for ${line[1]}`,
        );
    },
};

/**
 * Handler for player critical spell hits.
 *
 * In the logs, player critical spells are immediately followed by the critical spell damage. This is one of the ways we
 * can identify the logging player's name.
 *
 * Regex groups: timestamp, damage, spell name.
 */
export const YOU_CRITICAL_SPELL = {
    regex: new RegExp(`^You deliver a critical blast! \\((\\d+)\\) \\((.+)\\)$`),
    evaluate: (timestamp: number, line: RegExpMatchArray, parser: Parser) => {
        if (!parser.player.name) {
            const nextLine = OTHER_CRITICAL_SPELL.regex.exec(parser.lookAhead(1) || '');
            if (nextLine) parser.associatePlayer(nextLine[1]);
        }

        parser.nextLineCritical = true;
    },
};

/**
 * Handler for critical spell hits performed by non-player characters.
 *
 * In the logs, critical spells are immediately followed by the critical spell damage.
 *
 * Regex groups: timestamp, source, damage, spell name.
 */
export const OTHER_CRITICAL_SPELL = {
    regex: new RegExp(`^(.+?) delivers a critical blast! \\((\\d+)\\) \\((.+)\\)$`),
    evaluate: (timestamp: number, line: RegExpMatchArray, parser: Parser) => {
        parser.nextLineCritical = true;
    },
};

/**
 * Handler for spell hits.
 *
 * Regex groups: timestamp, source, target, damage, spell name.
 */
export const SPELL_HIT = {
    regex: new RegExp(`^(.+?) hit (.+?) for (\\d+) points of non-melee damage. \\((.+)\\)$`),
    evaluate: (timestamp: number, line: RegExpMatchArray, parser: Parser) => {
        const [_, source, target, damage, spell] = line;
        const isPet = new RegExp(`(.+) \\(Owner: (.+)\\)`).exec(source);
        if (isPet) {
            // if a pet performed a spell hit, we get owner information from the log.
            const [_, pet, owner] = isPet;
            parser.associatePlayerPet(pet, owner);
            parser.addSpellHit(timestamp, pet, target, spell, parseInt(damage));
        } else {
            parser.addSpellHit(timestamp, source, target, spell, parseInt(damage));
        }

        parser.nextLineCritical = false;
    },
};

/**
 * Handler for spells that hit the player.
 *
 * Regex groups: spell description, spell name.
 */
export const SPELL_HIT_YOU = {
    regex: new RegExp(`^(.+)\. You have taken (\d+) points? of damage\.$`),
    evaluate: (timestamp: number, line: RegExpMatchArray, parser: Parser) => {
        const [_, description, damage] = line;
        parser.addUnknownPlayerSpellHit(timestamp, description, parseInt(damage));
    },
};

/**
 * Handler for zone change messages.
 *
 * Regex groups: zone name
 */
export const ZONE_CHANGE = {
    regex: new RegExp(`^You have entered (.+)\.$`),
    evaluate: (timestamp: number, line: RegExpMatchArray, parser: Parser) => {
        const [_, zone] = line;
        if (
            zone !== `an Arena (PvP) area` &&
            zone !== `an area where levitation effects do not function`
        ) {
            return parser.changeZone(timestamp, zone);
        }
    },
};

/**
 * Handler for player death events.
 */
export const PLAYER_DEATH = {
    regex: new RegExp(`^You have been slain by (.+)!$`),
    evaluate: (timestamp: number, line: RegExpMatchArray, parser: Parser) => {
        const [_, killer] = line;
        return parser.addPlayerDeath(timestamp, killer);
    },
};

/**
 * Handler for when a player kills an enemy.
 */
export const PLAYER_KILL = {
    regex: new RegExp(`^You have slain (.+)!$`),
    evaluate: (timestamp: number, line: RegExpMatchArray, parser: Parser) => {
        const [_, killed] = line;
        parser.addPlayerKill(timestamp, killed);
    },
};

/**
 * Handler for other entity death events.
 */
export const OTHER_DEATH = {
    regex: new RegExp(`^(.+) has been slain by (.+)!$`),
    evaluate: (timestamp: number, line: RegExpMatchArray, parser: Parser) => {
        const [_, killed, killer] = line;
        parser.addOtherDeath(timestamp, killer, killed);
    },
};
