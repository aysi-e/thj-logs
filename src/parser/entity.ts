import {MELEE_MISS_TYPE_NORMALIZE_MAP, MeleeDamageType, MeleeMissType, SpecialMeleeType} from "./handlers.ts";
import {forEach} from "lodash";

/**
 * Class representing an individual entity existing in a combat encounter.
 */
export default class Entity {

    /**
     * The entity name - a display name for this entity.
     *
     * An 'undefined' value means that we have not determined the name for this entity - this can happen for the logging
     * player because they are not immediately identified by the combat log.
     */
    name: string | undefined;

    /**
     * Is this entity an enemy to the logging player?
     *
     * An 'undefined' value means that we have not determined whether this entity is an enemy yet.
     */
    isEnemy: boolean | undefined = undefined;

    /**
     * Is this entity a boss?
     */
    isBoss: boolean | undefined = undefined;

    /**
     * Is this entity currently dead?
     *
     * An entity is dead if we have received a death message for it. It is alive if we receive other combat log events
     * for it.
     */
    isDead: boolean = false;

    /**
     * If this entity represents a pet, the id of the pet's owner.
     */
    owner: string | undefined;

    /**
     * Deaths recorded for this entity. If this entity is not an enemy, a death recap will be included for each death.
     */
    deaths: EntityDeath[] = [];

    /**
     * Incoming combat events for this entity.
     */
    incoming = new CombatEvents();

    /**
     * Outgoing combat events originating from this entity.
     */
    outgoing = new CombatEvents();

    /**
     * Construct an entity, providing a unique id.
     *
     * @param id the unique entity id
     */
    constructor(public readonly id: string) {}

    /**
     * Merge the data contained in the provided Entity into this entity.
     *
     * @param entity the entity to merge into this entity.
     */
    mergeFrom(entity: Entity) {
        this.incoming.addFrom(entity.incoming);
        this.outgoing.addFrom(entity.outgoing);
    }

    /**
     * Return an empty copy of this Entity (with no combat data).
     */
    emptyCopy() {
        const entity = new Entity(this.id);
        entity.name = this.name;
        entity.owner = this.owner;
        entity.isEnemy = this.isEnemy;
        entity.isBoss = this.isBoss;
        return entity;
    }

}

/**
 * Type representing a 'death' event for an entity.
 */
export type EntityDeath = {
    /**
     * The death timestamp, in epoch milliseconds.
     */
    timestamp: number;

    /**
     * The id of the killing entity.
     */
    killerId: string;

    /**
     * The death recap for this death event. Only present for non-enemy entities.
     */
    recap: DeathRecapItem[] | undefined;
}

/**
 * Type representing a 'death recap' for an entity's death.
 */
export type DeathRecapItem = {

    /**
     * The source entity id, or undefined if the source was unknown.
     */
    source: string | undefined;

    /**
     * A string description of the damage or healing done - a spell name, a melee type, etc.
     */
    description: string;

    /**
     * Does this death recap item represent a damage event or a healing event?
     */
    type: 'damage' | 'healing';

    /**
     * How much damage or healing was done by this event?
     */
    value: number;

    /**
     * The amount of time before the death that this item took place, in milliseconds (although due to the combat log
     * it'll always be multiples of a thousand).
     */
    timeBeforeDeath: number;
}

/**
 * Type containing combat events affecting or originating from an entity.
 */
export class CombatEvents {

    /**
     * Melee combat events involving this entity, keyed by target and damage type.
     */
    melee: Record<string, Record<string, MeleeDamage>> = {};

    /**
     * Spell combat events involving this entity, keyed by target and spell name.
     */
    spell: Record<string, Record<string, SpellDamage>> = {};

    /**
     * Healing combat events involving this entity, keyed by target and spell name.
     */
    heal: any;

    /**
     * Damage shield combat events involving this entity, keyed by target and damage shield description.
     */
    ds: Record<string, Record<string, DamageShieldDamage>> = {};

    /**
     * Add a melee event to this CombatEvents collection.
     *
     * @param type the type of melee damage
     * @param targetId the id of the target entity
     * @param damage the amount of damage done
     * @param isCritical is this a critical hit?
     */
    addMeleeHit(
        type: MeleeDamageType | SpecialMeleeType,
        targetId: string,
        damage: number,
        isCritical: boolean = false,
    ) {
        if (!this.melee[targetId]) this.melee[targetId] = {};
        if (!this.melee[targetId][type]) this.melee[targetId][type] = new MeleeDamage(type, targetId);

        const md = this.melee[targetId][type];

        if (isCritical) {
            md.crits++
        } else {
            md.hits++;
        }

        md.total += damage;
        if (md.min === undefined || damage < md.min) md.min = damage;
        if (md.max === undefined || damage > md.max) md.max = damage;
        if (md.average === undefined) {
            md.average = damage;
        }  else {
            md.average = (md.average + damage) / 2;
        }
    }

    /**
     * Add a melee miss event to this CombatEvents collection.
     *
     * @param type the type of melee damage
     * @param targetId the id of the target entity
     * @param missType the type of miss
     */
    addMeleeMiss(type: MeleeDamageType, targetId: string, missType: MeleeMissType) {
        const miss = MELEE_MISS_TYPE_NORMALIZE_MAP[missType];
        if (!this.melee[targetId]) this.melee[targetId] = {};
        if (!this.melee[targetId][type]) this.melee[targetId][type] = new MeleeDamage(type, targetId);

        const md = this.melee[targetId][type];

        if (miss === undefined) debugger;
        md[miss]++;
    }

    /**
     * Add a damage shield combat event to this CombatEvents collection.
     *
     * @param effect the damage shield effect description
     * @param targetId the id of the other player
     * @param damage the amount of damage
     */
    addDamageShield(effect: string, targetId: string, damage: number) {
        if (!this.ds[targetId]) this.ds[targetId] = {};
        if (!this.ds[targetId][effect]) this.ds[targetId][effect] = new DamageShieldDamage(effect, targetId);

        const ds = this.ds[targetId][effect];
        ds.hits++;
        ds.total += damage;
    }

    /**
     * Add a spell hit combat event to this CombatEvents collection.
     *
     * @param spellName the name of the spell
     * @param targetId the id of the other player
     * @param damage the amount of damage dealt
     * @param isCritical is this a critical spell hit?
     */
    addSpellHit(spellName: string, targetId: string, damage: number, isCritical: boolean = false) {
        if (!this.spell[targetId]) this.spell[targetId] = {};
        if (!this.spell[targetId][spellName]) this.spell[targetId][spellName] = new SpellDamage(spellName, targetId);

        const spell = this.spell[targetId][spellName];

        if (isCritical) {
            spell.crits++;
        } else {
            spell.hits++;
        }

        spell.total += damage;

        if (spell.min === undefined || damage < spell.min) spell.min = damage;
        if (spell.max === undefined || damage > spell.max) spell.max = damage;
        if (spell.average === undefined) {
            spell.average = damage;
        }  else {
            spell.average = (spell.average + damage) / 2;
        }
    }

    /**
     * Add the combat events included in the 'other' object into this object.
     *
     * @param other the object to add combat events from.
     */
    addFrom(other: CombatEvents) {
        forEach(other.melee, (value, target) => {
            if (!this.melee[target]) this.melee[target] = value;
            else {
                forEach(value, (otherMelee, type) => {
                    const thisMelee = this.melee[target][type];
                    if (!thisMelee) {
                        this.melee[target][type] = otherMelee;
                    } else {
                        thisMelee.addFrom(otherMelee);
                    }
                });
            }
        });

        forEach(other.spell, (value, target) => {
            if (!this.spell[target]) this.spell[target] = value;
            else {
                forEach(value, (otherSpell, name) => {
                    if (!this.spell[target][name]) {
                        this.spell[target][name] = otherSpell;
                    } else {
                        const thisSpell = this.spell[target][name];
                        thisSpell.addFrom(otherSpell);
                    }
                })
            }
        });

        // todo: healing, etc
        forEach(other.ds, (value, target) => {
            if (!this.ds[target]) this.ds[target] = value;
            else {
                forEach(value, (otherDs, name) => {
                    if (!this.ds[target][name]) {
                        this.ds[target][name] = otherDs;
                    } else {
                        const thisDs = this.ds[target][name];
                        thisDs.addFrom(otherDs);
                    }
                })
            }
        });
    }
}

/**
 * Data type compiling statistics about melee damage done by an entity during an encounter.
 */
export class MeleeDamage {

    /**
     * The total number of hits for this damage type.
     */
    hits: number = 0;

    /**
     * The total number of crits for this damage type.
     */
    crits: number = 0;

    /**
     * The total number of misses for this damage type.
     */
    miss: number = 0;

    /**
     * The total number of parries for this damage type.
     */
    parry: number = 0;

    /**
     * The total number of ripostes for this damage type.
     */
    riposte: number = 0;

    /**
     * The total number of dodges for this damage type.
     */
    dodge: number = 0;

    /**
     * The total number of blocks for this damage type.
     */
    block: number = 0;

    /**
     * The total number of absorbed hits for this damage type.
     */
    absorb: number = 0;

    /**
     * The total number of immune hits for this damage type.
     */
    immune: number = 0;

    /**
     * The total damage done for this damage type.
     */
    total: number = 0;

    /**
     * The maximum hit for this damage type.
     */
    max: number | undefined = undefined;

    /**
     * The minimum hit for this damage type.
     */
    min: number | undefined = undefined;

    /**
     * The average hit for this damage type.
     */
    average: number | undefined = undefined;

    /**
     * Construct a MeleeDamage object for the provided melee type.
     *
     * @param type the type of melee damage (crush, pierce, etc.)
     * @param targetId the target that was attacked
     */
    constructor(
        readonly type: string,
        readonly targetId: string
    ) {}

    /**
     * Add the combat events included in the 'other' object into this object.
     *
     * @param other the object to add combat events from.
     */
    addFrom(other: MeleeDamage) {
        this.crits += other.crits;
        this.hits += other.hits;

        this.miss += other.miss;
        this.parry += other.parry;
        this.riposte += other.riposte;
        this.absorb += other.absorb;
        this.block += other.block;
        this.dodge += other.dodge;
        this.immune += other.immune;
        this.total += other.total;

        if (other.max && (this.max === undefined || other.max > this.max)) this.max = other.max;
        if (other.min !== undefined && (this.min === undefined || other.min < this.min)) this.min = other.min;
        if (other.average !== undefined) {
            if (this.average === undefined) {
                this.average = other.average;
            } else {
                this.average = (this.average + other.average) / 2;
            }
        }

    }
}

/**
 * Data type compiling statistics about spell damage done by an entity during an encounter.
 */
export class SpellDamage {

    /**
     * The total number of hits for this damage type.
     */
    hits: number = 0;

    /**
     * The total number of crits for this damage type.
     */
    crits: number = 0;

    /**
     * The total number of resists for this damage type.
     */
    resists: number = 0;

    /**
     * The total number of absorbed hits for this damage type.
     */
    absorb: number = 0;

    /**
     * The total number of immune hits for this damage type.
     */
    immune: number = 0;

    /**
     * The total damage done for this damage type.
     */
    total: number = 0;

    /**
     * The maximum hit for this damage type.
     */
    max: number | undefined = undefined;

    /**
     * The minimum hit for this damage type.
     */
    min: number | undefined = undefined;

    /**
     * The average hit for this damage type.
     */
    average: number | undefined = undefined;

    /**
     * Construct a SpellDamage object for the provided spell name and target.
     *
     * @param name the name of the spell
     * @param targetId the target that was attacked
     */
    constructor(
        readonly name: string,
        readonly targetId: string
    ) {}

    /**
     * Add the combat events included in the 'other' object into this object.
     *
     * @param other the object to add combat events from.
     */
    addFrom(other: SpellDamage) {
        this.crits += other.crits;
        this.hits += other.hits;

        this.absorb += other.absorb;
        this.resists += other.resists;
        this.immune += other.immune;

        this.total += other.total;

        if (other.max && (this.max === undefined || other.max > this.max)) this.max = other.max;
        if (other.min !== undefined && (this.min === undefined || other.min < this.min)) this.min = other.min;
        if (other.average !== undefined) {
            if (this.average === undefined) {
                this.average = other.average;
            } else {
                this.average = (this.average + other.average) / 2;
            }
        }
    }
}

/**
 * Data type compiling statistics about damage shield damage done by an entity during an encounter.
 */
export class DamageShieldDamage {

    /**
     * The total number of hits for this damage type.
     */
    hits: number = 0;

    /**
     * The total damage done for this damage type.
     */
    total: number = 0;

    /**
     * Construct a DamageShieldDamage object for the provided effect description and target.
     *
     * @param effect the effect description.
     * @param targetId the target that was attacked
     */
    constructor(
        readonly effect: string,
        readonly targetId: string
    ) {}

    /**
     * Add the combat events included in the 'other' object into this object.
     *
     * @param other the object to add combat events from.
     */
    addFrom(other: DamageShieldDamage) {
        this.hits += other.hits;
        this.total += other.total;
    }
}
