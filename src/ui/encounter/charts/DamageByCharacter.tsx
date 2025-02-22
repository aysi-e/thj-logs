import { round, values } from 'lodash';
import { shortenNumber } from '../../../util/numbers.ts';
import DamageMeter, { MeterColumn, MeterItem } from './DamageMeter.tsx';
import { Encounter, UNKNOWN_ID } from '@aysi-e/thj-parser-lib';
import { Entity } from '@aysi-e/thj-parser-lib';
import { has, keys } from 'mobx';
import { IncomingDamageBreakdownChart, OutgoingDamageBreakdownChart } from './DamageBreakdown.tsx';
import encounter from '../../../pages/encounter';

/**
 * Props accepted by damage-by-source charts.
 */
type Props = {
    /**
     * The encounter object.
     */
    encounter: Encounter;

    /**
     * The entities that should be used for the chart.
     */
    entities: Entity[];
};

/**
 * Type representing a single line item in a damage meter.
 */
type DamageEntityItem = {
    /**
     * The entity.
     */
    entity: Entity;

    /**
     * The entity display name.
     */
    name: string;

    /**
     * The total amount of damage dealt by this entity.
     */
    damage: number;

    /**
     * The amount of damage-per-second dealt by this entity.
     */
    dps: number;

    /**
     * The entity index.
     */
    index: number;
};

/**
 * Convert an entity object into an appropriate data type to use for our damage meter.
 *
 * @param entity the entity object
 * @param type incoming or outgoing damage?
 * @param encounter the encounter object
 * @param targetId if we have a target id filter, only damage involving this target.
 */
const toDamageEntityItem = (
    entity: Entity,
    type: `incoming` | `outgoing`,
    encounter: Encounter,
    targetId?: string,
) => {
    const ce = entity[type];
    let damage = 0;

    if (targetId) {
        values(ce.ds[targetId]).forEach((ds) => {
            damage += ds.total;
        });
        values(ce.melee[targetId]).forEach((melee) => {
            damage += melee.total;
        });
        values(ce.spell[targetId]).forEach((spell) => {
            damage += spell.total;
        });
    } else {
        // un-spool the damage shield section
        values(ce.ds).forEach((dm) => {
            values(dm).forEach((ds) => {
                damage += ds.total;
            });
        });

        // un-spool the melee damage section
        values(ce.melee).forEach((mm) => {
            values(mm).forEach((melee) => {
                damage += melee.total;
            });
        });

        // un-spool the spell damage section
        values(ce.spell).forEach((sm) => {
            values(sm).forEach((spell) => {
                damage += spell.total;
            });
        });
    }

    let name = entity.name;
    if (name && entity.owner) {
        name = `${name} (${encounter.entities[entity.owner].name || `Unknown`})`;
    }

    return {
        entity,
        name: name || entity.id,
        damage,
        dps: (damage / encounter.duration) * 1000,
        index: keys(encounter.entities).indexOf(entity.id),
    };
};

/**
 * Convert a DamageEntityItem into a MeterItem.
 *
 * @param item the damage item
 * @param type is this incoming or outdoing damage
 * @param total the chart item
 * @param encounterId the encounter id
 */
const toMeterItem = (
    item: DamageEntityItem,
    type: `incoming` | `outgoing`,
    total: number,
    encounterId: string,
): MeterItem => ({
    entity: item.entity,
    displayName: item.name,
    link: `/encounter/${encounterId}/character/${item.index}?mode=${type === `outgoing` ? `damage-done` : `damage-taken`}`,
    index: item.index,
    value: item.damage,
    perSecond: item.dps,
    percent: (item.damage / total) * 100,
    background: type === `outgoing` ? `rgb(74, 88, 164)` : `#9c4646`,
});

/**
 * Additional props required by the DamageByCharacterChart component.
 */
type ChartProps = {
    columns: MeterColumn[];
    type: `incoming` | `outgoing`;
    targetId?: string;
};

/**
 * An encounter chart which displays data based on damage done during an encounter.
 */
const DamageByCharacterChart = ({
    encounter,
    entities,
    type,
    columns,
    targetId,
}: Props & ChartProps) => {
    if (entities.length === 0) {
        // todo: empty chart.
        return <></>;
    }

    if (entities.length === 1) {
        const entity = entities[0];
        return type === `outgoing` ? (
            <OutgoingDamageBreakdownChart encounter={encounter} entity={entity} link />
        ) : (
            <IncomingDamageBreakdownChart encounter={encounter} entity={entity} link />
        );
    }

    let title;
    let items: MeterItem[];

    const relation = entities.reduce<{
        items: DamageEntityItem[];
        allies: boolean;
        enemies: boolean;
        total: number;
    }>(
        (acc, val) => {
            const item = toDamageEntityItem(val, type, encounter, targetId);
            acc.items.push(item);
            if (item.entity.id !== UNKNOWN_ID) {
                // don't include unknown entities as allies or enemies
                acc.allies = acc.allies && !val.isEnemy;
                acc.enemies = acc.enemies && !!val.isEnemy;
            }
            acc.total += item.damage;
            return acc;
        },
        {
            items: [],
            allies: true,
            enemies: true,
            total: 0,
        },
    );

    if (targetId) {
        if (type === `outgoing`) {
            title = `damage taken by ${encounter.entities[targetId].name} by target`;
        } else {
            title = `damage dealt by ${encounter.entities[targetId].name} by target`;
        }
    } else if (relation.allies) {
        title = `damage ${type === `incoming` ? `taken` : `dealt`} by allies${targetId ? ` from ${encounter.entities[targetId].name}` : ``}`;
    } else if (relation.enemies) {
        title = `damage ${type === `incoming` ? `taken` : `dealt`} by enemies${targetId ? ` from ${encounter.entities[targetId].name}` : ``}`;
    } else {
        title = `damage ${type === `incoming` ? `taken` : `dealt`}${targetId ? ` from ${encounter.entities[targetId].name}` : ``}`;
    }

    items = relation.items
        .filter((it) => it.damage > 0)
        .map((item) => toMeterItem(item, type, relation.total, encounter.id));

    return <DamageMeter title={title} items={items} columns={columns} header footer />;
};

/**
 * A basic set of columns for an outgoing damage meter table.
 */
const OUTGOING_DAMAGE_METER_COLUMNS: MeterColumn[] = [
    {
        title: `%`,
        value: (item) => item.percent,
        format: (value: number) => `${round(value, 1)}%`,
        total: '100%',
    },
    {
        title: `total`,
        value: (item) => item.value,
        format: (value: number) => shortenNumber(value),
        total: true,
    },
    {
        title: `dps`,
        value: (item) => item.perSecond,
        format: (value: number) => round(value).toLocaleString(),
        total: true,
    },
];

/**
 * An encounter chart which displays data based on damage dealt during an encounter.
 */
export const DamageDealtChart = ({ encounter, entities }: Props) => (
    <DamageByCharacterChart
        encounter={encounter}
        entities={entities}
        type={`outgoing`}
        columns={OUTGOING_DAMAGE_METER_COLUMNS}
    />
);

/**
 * An encounter chart which displays data based on damage taken during an encounter.
 */
export const DamageTakenChart = ({ encounter, entities }: Props) => (
    <DamageByCharacterChart
        encounter={encounter}
        entities={entities}
        type={`incoming`}
        columns={OUTGOING_DAMAGE_METER_COLUMNS}
    />
);

/**
 * An encounter chart which displays data based on damage taken during an encounter.
 */
export const DamageTakenFromTargetChart = ({
    encounter,
    targetId,
}: {
    encounter: Encounter;
    targetId: string;
}) => {
    const entities = values(encounter.entities).filter(
        (it) =>
            has(it.incoming.melee, targetId) ||
            has(it.incoming.ds, targetId) ||
            has(it.incoming.spell, targetId),
    );
    return (
        <DamageByCharacterChart
            encounter={encounter}
            entities={entities}
            targetId={targetId}
            type={`incoming`}
            columns={OUTGOING_DAMAGE_METER_COLUMNS}
        />
    );
};

/**
 * An encounter chart which displays data based on damage taken during an encounter.
 */
export const DamageTakenByTargetChart = ({
    encounter,
    targetId,
}: {
    encounter: Encounter;
    targetId: string;
}) => {
    const entities = values(encounter.entities).filter(
        (it) =>
            has(it.outgoing.melee, targetId) ||
            has(it.outgoing.ds, targetId) ||
            has(it.outgoing.spell, targetId),
    );
    return (
        <DamageByCharacterChart
            encounter={encounter}
            entities={entities}
            targetId={targetId}
            type={`outgoing`}
            columns={OUTGOING_DAMAGE_METER_COLUMNS}
        />
    );
};
