import {
    DamageShieldDamage,
    Encounter,
    Entity,
    Healing,
    MeleeDamage,
    SpellDamage,
} from '@aysi-e/thj-parser-lib';
import { computed, makeAutoObservable } from 'mobx';
import { chain, keys, union, values } from 'lodash';
import { createContext, useContext } from 'react';
import { DateTime, Duration } from 'luxon';

/**
 * An encounter context.
 */
export const EncounterContext = createContext<EncounterState | undefined>(undefined);

/**
 * Use the currently defined encounter context.
 */
export const useEncounter = () => {
    const result = useContext(EncounterContext);
    if (!result) throw new Error('no encounter was defined for encounter context');
    return result;
};

/**
 * State class associated with an individual encounter page.
 */
class EncounterState {
    /**
     * List containing entities included in this encounter.
     */
    private readonly entities: Record<string, EncounterEntityState>;

    /**
     * Construct an empty, default EncounterState object for a specific encounter.
     */
    constructor(private readonly encounter: Encounter) {
        makeAutoObservable(this);
        this.entities = chain(encounter.entities)
            .values()
            .map((entity, index) => new EncounterEntityState(entity, index, this))
            .keyBy((it) => it.id)
            .value();

        // for enemies/allies, we will need:
        // - damage dealt by all enemies/allies, by target.
        // - damage dealt by all enemies/allies, by damage type.
        // - damage taken by all enemies/allies, by target.
        // - damage taken by all enemies/allies, by damage type.
        // - healing done by all enemies/allies, by target.
        // - healing taken by all enemies/allies, by target.

        // for each entity, we will need:
        // - damage done to all targets by damage type.
        // - damage done by target.
        // - damage done to each target by damage type.

        // - damage taken from all targets by damage type.
        // - damage taken by target.
        // - damage taken from each target by damage type.

        // - healing to all targets by spell name.
        // - healing done by target.
        // - healing done to each target by spell name.
        // - healing received from all targets by spell name.
        // - healing received by target.
        // - healing received from each target by spell name.
    }

    /**
     * Get the unique id for this encounter.
     */
    get id() {
        return this.encounter.id;
    }

    /**
     * Get an entity from this encounter state by its index.
     *
     * @param index the entity index.
     */
    getEntityByIndex(index: number): EncounterEntityState {
        return values(this.entities)[index];
    }

    /**
     * Get an entity from this encounter state by its id.
     *
     * @param id the entity id.
     */
    getEntityById(id: string): EncounterEntityState {
        return this.entities[id];
    }

    /**
     * Get the duration of this combat encounter.
     */
    @computed
    get duration() {
        return Duration.fromMillis(this.encounter.duration);
    }

    /**
     * Get the encounter start time.
     */
    @computed
    get start() {
        return DateTime.fromMillis(this.encounter.start);
    }

    /**
     * Get the encounter end time.
     */
    @computed
    get end() {
        return DateTime.fromMillis(this.encounter.end);
    }

    /**
     * Return the friendly entities participating in this encounter.
     */
    @computed
    get friends() {
        return values(this.entities).filter((it) => it.isEnemy === false);
    }

    /**
     * Return the enemy entities participating in this encounter.
     */
    @computed
    get enemies() {
        return values(this.entities).filter((it) => it.isEnemy === true);
    }

    /**
     * Get the warnings generated while parsing this encounter.
     */
    get warnings() {
        return this.encounter.warnings;
    }

    /**
     * Is this encounter failed?
     */
    get isFailed() {
        return this.encounter.isFailed;
    }

    /**
     * Get the title text for this encounter.
     */
    @computed
    get title() {
        return values(this.encounter.entities)
            .filter((it) => it.isEnemy)
            .filter((it) => it.name !== `Unknown`)
            .map((it) => it.name)
            .join(', ');
    }

    /**
     * Get the timeline for this encounter.
     */
    get timeline() {
        return this.encounter.timeline;
    }

    /**
     * Get each character participating in this encounter.
     */
    get characters() {
        return values(this.entities);
    }

    /**
     * Get the events for this encounter.
     */
    get events() {
        return this.encounter.events;
    }
}

export default EncounterState;

/**
 * State class associated with an individual entity for a single encounter.
 */
export class EncounterEntityState {
    /**
     * A key to use for 'all' data.
     */
    static ALL_TARGETS = '#all';

    /**
     * A damage-by-target map containing damage breakdown data keyed by target id.
     *
     * @private
     */
    private readonly damageDealtByTarget: Record<string, DamageBreakdownData> = {};

    /**
     * A damage-by-target map containing damage taken breakdown data keyed by target id.
     *
     * @private
     */
    private readonly damageTakenByTarget: Record<string, DamageBreakdownData> = {};

    /**
     * A healing-by-target map containing outgoing healing breakdown data keyed by target id.
     *
     * @private
     */
    private readonly healingDoneByTarget: Record<string, HealingBreakdownData> = {};

    /**
     * A healing-by-target map containing incoming healing breakdown data keyed by target id.
     *
     * @private
     */
    private readonly healingReceivedByTarget: Record<string, HealingBreakdownData> = {};

    /**
     * Construct an EncounterEntityState object.
     *
     * @param entity the entity
     * @param index the entity index
     * @param encounter a reference to the encounter state
     */
    constructor(
        private readonly entity: Entity,
        readonly index: number,
        private readonly encounter: EncounterState,
    ) {
        makeAutoObservable(this);
    }

    /**
     * Get the unique entity id.
     */
    get id() {
        return this.entity.id;
    }

    /**
     * Get the entity name.
     */
    get name() {
        return this.entity.name;
    }

    /**
     * Is this entity an enemy?
     */
    get isEnemy() {
        return this.entity.isEnemy;
    }

    /**
     * Is this entity a pet?
     */
    get isPet() {
        return this.entity.owner !== undefined;
    }

    /**
     * If this entity is a pet, the owning entity.
     */
    get owner(): EncounterEntityState | undefined {
        if (this.entity.owner) return this.encounter.getEntityById(this.entity.owner);
        return undefined;
    }

    /**
     * Get damage dealt breakdown data for this entity, returning damage dealt by this entity to all
     * targets.
     */
    damageDealtBreakdown() {
        // do we need to calculate this?
        if (!this.damageDealtByTarget[EncounterEntityState.ALL_TARGETS]) {
            this.damageDealtByTarget[EncounterEntityState.ALL_TARGETS] =
                this.toDamageBreakdown('outgoing');
        }

        return this.damageDealtByTarget[EncounterEntityState.ALL_TARGETS];
    }

    /**
     * Get healing done breakdown data for this entity, returning healing done by this entity to all
     * targets.
     */
    healingDoneBreakdown() {
        if (!this.healingDoneByTarget[EncounterEntityState.ALL_TARGETS]) {
            this.healingDoneByTarget[EncounterEntityState.ALL_TARGETS] =
                this.toHealingBreakdown('outgoing');
        }

        return this.healingDoneByTarget[EncounterEntityState.ALL_TARGETS];
    }

    /**
     * Get damage taken breakdown data for this entity, returning damage taken by this entity from
     * all targets.
     */
    damageTakenBreakdown() {
        // do we need to calculate this?
        if (!this.damageTakenByTarget[EncounterEntityState.ALL_TARGETS]) {
            this.damageTakenByTarget[EncounterEntityState.ALL_TARGETS] =
                this.toDamageBreakdown('incoming');
        }

        return this.damageTakenByTarget[EncounterEntityState.ALL_TARGETS];
    }

    /**
     * Get healing received breakdown data for this entity, returning healing received by this
     * entity from all targets.
     */
    healingReceivedBreakdown() {
        if (!this.healingReceivedByTarget[EncounterEntityState.ALL_TARGETS]) {
            this.healingReceivedByTarget[EncounterEntityState.ALL_TARGETS] =
                this.toHealingBreakdown('incoming');
        }

        return this.healingReceivedByTarget[EncounterEntityState.ALL_TARGETS];
    }

    /**
     * Get damage dealt breakdown data for this entity, returning damage dealt by this entity to a
     * specific target entity.
     *
     * @param entityId the entity that received damage
     */
    damageDealtBreakdownTo(entityId: string) {
        if (!this.damageDealtByTarget[entityId]) {
            this.damageDealtByTarget[entityId] = this.toDamageBreakdownByTarget(
                entityId,
                'outgoing',
            );
        }

        return this.damageDealtByTarget[entityId];
    }

    /**
     * Get healing done breakdown data for this entity, returning healing done by this entity to a
     * specific target entity.
     *
     * @param entityId the entity that received healing
     */
    healingDoneBreakdownTo(entityId: string) {
        if (!this.healingDoneByTarget[entityId]) {
            this.healingDoneByTarget[entityId] = this.toHealingBreakdownByTarget(
                entityId,
                'outgoing',
            );
        }

        return this.healingDoneByTarget[entityId];
    }

    /**
     * Get damage taken breakdown data for this entity, returning damage taken by this entity from a
     * specific target entity.
     *
     * @param entityId the entity that dealt damage
     */
    damageTakenBreakdownFrom(entityId: string) {
        if (!this.damageTakenByTarget[entityId]) {
            this.damageTakenByTarget[entityId] = this.toDamageBreakdownByTarget(
                entityId,
                'incoming',
            );
        }

        return this.damageTakenByTarget[entityId];
    }

    /**
     * Get healing received breakdown data for this entity, returning healing received by this
     * entity from a specific target entity.
     *
     * @param entityId the entity that healed us
     */
    healingReceivedBreakdownFrom(entityId: string) {
        if (!this.healingReceivedByTarget[entityId]) {
            this.healingReceivedByTarget[entityId] = this.toHealingBreakdownByTarget(
                entityId,
                'incoming',
            );
        }

        return this.healingReceivedByTarget[entityId];
    }

    /**
     * Get the amount of damage that this entity dealt to the provided target entity.
     *
     * @param entityId the target entity
     */
    damageDealtTo(entityId: string): number {
        return this.damageDealtBreakdownTo(entityId).total;
    }

    /**
     * Get the amount of healing that this entity did to the provided target entity.
     *
     * @param entityId the target entity
     */
    healingDoneTo(entityId: string): number {
        return this.healingDoneBreakdownTo(entityId).total;
    }

    /**
     * Get the total damage dealt by this entity during the encounter.
     */
    damageDealt() {
        return this.damageDealtBreakdown().total;
    }

    /**
     * Get the total healing done by this entity during the encounter.
     */
    healingDone() {
        return this.healingDoneBreakdown().total;
    }

    /**
     * Get the total damage taken by this entity during the encounter.
     */
    damageTaken() {
        return this.damageTakenBreakdown().total;
    }

    /**
     * Get the total healing received by this entity during the encounter.
     */
    healingReceived() {
        return this.healingReceivedBreakdown().total;
    }

    /**
     * Get the damage taken by this entity from a specific entity id.
     *
     * @param entityId the damaging entity
     */
    damageTakenFrom(entityId: string): number {
        return this.damageTakenBreakdownFrom(entityId).total;
    }

    /**
     * Get the amount of healing that this entity did to the provided target entity.
     *
     * @param entityId the target entity
     */
    healingReceivedFrom(entityId: string): number {
        return this.healingReceivedBreakdownFrom(entityId).total;
    }

    /**
     * Calculate healing breakdown data for this entity to all targets.
     *
     * @private
     */
    private toHealingBreakdown(type: `incoming` | `outgoing`) {
        const ce = this.entity[type];
        const result = keys(ce.heal)
            .map((it) =>
                type === 'outgoing'
                    ? this.healingDoneBreakdownTo(it)
                    : this.healingReceivedBreakdownFrom(it),
            )
            .reduce<{
                items: Record<string, HealingBreakdownItem>;
                total: number;
            }>(
                (acc, val) => {
                    val.items.forEach((it) => {
                        const key = `${it.type}-${it.name}`;
                        if (acc.items[key]) {
                            acc.items[key].data.addFrom(it.data);
                        } else {
                            const heal = new Healing(
                                it.data.name,
                                EncounterEntityState.ALL_TARGETS,
                                it.data.isAbsorb,
                            );
                            heal.addFrom(it.data);
                            acc.items[key] = {
                                name: it.name,
                                type: it.type,
                                data: heal,
                            };

                            acc.total += it.data.total;
                        }
                    });
                    return acc;
                },
                {
                    items: {},
                    total: 0,
                },
            );

        return {
            items: values(result.items).sort((a, b) => b.data.total - a.data.total),
            total: result.total,
        };
    }

    /**
     * Calculate damage breakdown data for this entity to all targets.
     *
     * @private
     */
    private toDamageBreakdown(type: `incoming` | `outgoing`) {
        const ce = this.entity[type];
        const targets = union(keys(ce.ds), keys(ce.melee), keys(ce.spell));
        const result = targets
            .map((it) =>
                type === 'outgoing'
                    ? this.damageDealtBreakdownTo(it)
                    : this.damageTakenBreakdownFrom(it),
            )
            .reduce<{
                items: Record<
                    string,
                    DamageShieldBreakdownItem | MeleeBreakdownItem | SpellBreakdownItem
                >;
                total: number;
            }>(
                (acc, val) => {
                    val.items.forEach((it) => {
                        const key = `${it.type}-${it.name}`;
                        switch (it.type) {
                            case 'ds':
                                if (acc.items[key]) {
                                    (acc.items[key].data as DamageShieldDamage).addFrom(
                                        it.data as DamageShieldDamage,
                                    );
                                } else {
                                    const ds = new DamageShieldDamage(
                                        it.data.effect,
                                        EncounterEntityState.ALL_TARGETS,
                                    );
                                    ds.addFrom(it.data);
                                    acc.items[key] = {
                                        name: it.name,
                                        type: it.type,
                                        data: ds,
                                    };
                                }
                                break;
                            case 'melee':
                                if (acc.items[key]) {
                                    (acc.items[key].data as MeleeDamage).addFrom(
                                        it.data as MeleeDamage,
                                    );
                                } else {
                                    const melee = new MeleeDamage(
                                        it.data.type,
                                        EncounterEntityState.ALL_TARGETS,
                                    );
                                    melee.addFrom(it.data);
                                    acc.items[key] = {
                                        name: it.name,
                                        type: it.type,
                                        data: melee,
                                    };
                                }
                                break;
                            case 'spell':
                                if (acc.items[key]) {
                                    (acc.items[key].data as SpellDamage).addFrom(
                                        it.data as SpellDamage,
                                    );
                                } else {
                                    const melee = new SpellDamage(
                                        it.data.name,
                                        EncounterEntityState.ALL_TARGETS,
                                    );
                                    melee.addFrom(it.data);
                                    acc.items[key] = {
                                        name: it.name,
                                        type: it.type,
                                        data: melee,
                                    };
                                }
                                break;
                        }
                    });
                    acc.total += val.total;
                    return acc;
                },
                {
                    items: {},
                    total: 0,
                },
            );

        return {
            items: values(result.items).sort((a, b) => b.data.total - a.data.total),
            total: result.total,
        };
    }

    /**
     * Calculate damage breakdown data for this entity to a specific target id.
     *
     * @private
     */
    private toDamageBreakdownByTarget(targetId: string, type: `incoming` | `outgoing`) {
        const itemsByName: Record<
            string,
            DamageShieldBreakdownItem | MeleeBreakdownItem | SpellBreakdownItem
        > = {};
        const ce = this.entity[type];
        let total = 0;

        // add all damage shield damage dealt to this target.
        if (ce.ds[targetId]) {
            const dsByType = ce.ds[targetId];
            values(dsByType).forEach((ds) => {
                if (!itemsByName[`ds-${ds.effect}`])
                    itemsByName[`ds-${ds.effect}`] = {
                        name: `${ds.effect} (damage shield)`,
                        data: new DamageShieldDamage(ds.effect, `all`),
                        type: `ds`,
                    };
                (itemsByName[`ds-${ds.effect}`] as DamageShieldBreakdownItem).data.addFrom(ds);
                total += ds.total;
            });
        }

        if (ce.melee[targetId]) {
            const meleeByType = ce.melee[targetId];
            values(meleeByType).forEach((melee) => {
                if (!itemsByName[`melee-${melee.type}`])
                    itemsByName[`melee-${melee.type}`] = {
                        name: melee.type,
                        data: new MeleeDamage(melee.type, `all`),
                        type: `melee`,
                    };
                (itemsByName[`melee-${melee.type}`] as MeleeBreakdownItem).data.addFrom(melee);
                total += melee.total;
            });
        }

        if (ce.spell[targetId]) {
            const spellByType = ce.spell[targetId];
            values(spellByType).forEach((spell) => {
                if (!itemsByName[`spell-${spell.name}`])
                    itemsByName[`spell-${spell.name}`] = {
                        name: spell.name,
                        data: new SpellDamage(spell.name, `all`),
                        type: `spell`,
                    };
                (itemsByName[`spell-${spell.name}`] as SpellBreakdownItem).data.addFrom(spell);
                total += spell.total;
            });
        }

        return {
            items: values(itemsByName).sort((a, b) => b.data.total - a.data.total),
            total,
        };
    }

    /**
     * Calculate healing breakdown data for this entity to a specific target id.
     *
     * @private
     */
    private toHealingBreakdownByTarget(targetId: string, type: `incoming` | `outgoing`) {
        const itemsByName: Record<string, HealingBreakdownItem> = {};
        const ce = this.entity[type];
        let total = 0;

        if (ce.heal[targetId]) {
            const healByType = ce.heal[targetId];
            values(healByType).forEach((heal) => {
                if (!itemsByName[`heal-${heal.name}`])
                    itemsByName[`heal-${heal.name}`] = {
                        name: heal.name,
                        data: new Healing(heal.name, `all`),
                        type: `heal`,
                    };
                (itemsByName[`heal-${heal.name}`] as HealingBreakdownItem).data.addFrom(heal);
                total += heal.total;
            });
        }

        return {
            items: values(itemsByName).sort((a, b) => b.data.total - a.data.total),
            total,
        };
    }
}

/**
 * Type representing damage broken down by item.
 */
export type DamageBreakdownData = {
    /**
     * The damage items that make up this breakdown.
     */
    items: (DamageShieldBreakdownItem | MeleeBreakdownItem | SpellBreakdownItem)[];

    /**
     * The total amount of damage included in this breakdown.
     */
    total: number;
};

/**
 * Type representing healing broken down by item.
 */
export type HealingBreakdownData = {
    /**
     * The healing items that make up this breakdown.
     */
    items: HealingBreakdownItem[];

    /**
     * The total amount of healing included in this breakdown.
     */
    total: number;
};

/**
 * Type representing a damage shield breakdown (compiled damage shield damage dealt to all targets).
 */
export type DamageShieldBreakdownItem = {
    /**
     * A name to use for this item.
     */
    name: string;

    /**
     * A damage shield breakdown item.
     */
    type: `ds`;

    /**
     * The damage shield damage object.
     */
    data: DamageShieldDamage;
};

/**
 * Type representing a melee damage breakdown (compiled melee damage dealt to all targets).
 */
export type MeleeBreakdownItem = {
    /**
     * A name to use for this item.
     */
    name: string;
    /**
     * A melee damage breakdown item.
     */
    type: `melee`;

    /**
     * The melee damage object.
     */
    data: MeleeDamage;
};

/**
 * Type representing a spell damage breakdown (compiled spell damage dealt to all targets).
 */
export type SpellBreakdownItem = {
    /**
     * A name to use for this item.
     */
    name: string;

    /**
     * A spell damage breakdown item.
     */
    type: `spell`;

    /**
     * The spell damage object.
     */
    data: SpellDamage;
};

/**
 * Type representing a healing breakdown (compiled healing dealt to all targets).
 */
export type HealingBreakdownItem = {
    /**
     * A name to use for this item.
     */
    name: string;

    /**
     * A healing breakdown item.
     */
    type: `heal`;

    /**
     * The healing object.
     */
    data: Healing;
};
