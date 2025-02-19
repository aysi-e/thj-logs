import { Encounter, Entity, isUnknown } from '@aysi-e/thj-parser-lib';
import { keys, round, values } from 'lodash';
import DamageMeter, { MeterColumn, MeterItem } from './DamageMeter.tsx';
import { shortenNumber } from '../../../util/numbers.ts';

/**
 * Props accepted by healing-by-source charts.
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
 * Type representing a single line item in a healing meter.
 */
type HealingEntityItem = {
    /**
     * The entity.
     */
    entity: Entity;

    /**
     * The entity display name.
     */
    name: string;

    /**
     * The total amount of healing done by this entity.
     */
    healing: number;

    /**
     * The amount of healing-per-second dealt by this entity.
     */
    hps: number;

    /**
     * The entity index.
     */
    index: number;
};

/**
 * Convert an entity object into an appropriate data type to use for our healing meter.
 *
 * @param entity the entity object
 * @param type incoming or outgoing healing?
 * @param encounter the encounter object
 */
const toHealingEntityItem = (
    entity: Entity,
    type: `incoming` | `outgoing`,
    encounter: Encounter,
) => {
    const ce = entity[type];
    let healing = 0;

    // un-spool the healing section
    values(ce.heal).forEach((byType) => {
        values(byType).forEach((ds) => {
            healing += ds.total;
        });
    });

    let name = entity.name;
    if (name && entity.owner) {
        name = `${name} (${encounter.entities[entity.owner].name || `Unknown`})`;
    }

    return {
        entity,
        name: name || entity.id,
        healing,
        hps: (healing / encounter.duration) * 1000,
        index: keys(encounter.entities).indexOf(entity.id),
    };
};

/**
 * Convert a HealingEntityItem into a MeterItem.
 *
 * @param item the healing item
 * @param total the chart item
 */
const toMeterItem = (
    item: HealingEntityItem,
    type: `incoming` | `outgoing`,
    total: number,
): MeterItem => ({
    entity: item.entity,
    displayName: item.name,
    link: `character/${item.index}`,
    index: item.index,
    value: item.healing,
    perSecond: item.hps,
    percent: (item.healing / total) * 100,
    background: `rgb(74, 164, 110)`,
});

/**
 * Additional props required by the HealingByCharacterChart component.
 */
type ChartProps = { columns: MeterColumn[]; type: `incoming` | `outgoing` };

/**
 * An encounter chart which displays data based on damage done during an encounter.
 */
const HealingByCharacterChart = ({ encounter, entities, type, columns }: Props & ChartProps) => {
    if (entities.length === 0) {
        // todo: empty chart.
        return <></>;
    }

    if (entities.length === 1) {
        const entity = entities[0];
        // return type === `outgoing` ? (
        //     <OutgoingDamageBreakdownChart encounter={encounter} entity={entity} />
        // ) : (
        //     <IncomingDamageBreakdownChart encounter={encounter} entity={entity} />
        // );
    }

    let title;
    let items: MeterItem[];

    const relation = entities.reduce<{
        items: HealingEntityItem[];
        allies: boolean;
        enemies: boolean;
        total: number;
    }>(
        (acc, val) => {
            const item = toHealingEntityItem(val, type, encounter);
            acc.items.push(item);
            if (!isUnknown(item.entity)) {
                // don't include unknown entities as allies or enemies
                acc.allies = acc.allies && !val.isEnemy;
                acc.enemies = acc.enemies && !!val.isEnemy;
            }
            acc.total += item.healing;
            return acc;
        },
        {
            items: [],
            allies: true,
            enemies: true,
            total: 0,
        },
    );

    if (relation.allies) {
        title = `healing ${type === `incoming` ? `received` : `done`} by allies`;
    } else if (relation.enemies) {
        title = `healing ${type === `incoming` ? `received` : `done`} by enemies`;
    } else {
        title = `healing ${type === `incoming` ? `received` : `done`}`;
    }

    items = relation.items
        .filter((it) => it.healing > 0)
        .map((item) => toMeterItem(item, type, relation.total));

    return <DamageMeter title={title} items={items} columns={columns} header footer />;
};

/**
 * A basic set of columns for an outgoing healing meter table.
 */
const OUTGOING_HEALING_METER_COLUMNS: MeterColumn[] = [
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
        title: `hps`,
        value: (item) => item.perSecond,
        format: (value: number) => round(value).toLocaleString(),
        total: true,
    },
];

/**
 * An encounter chart which displays data based on healing done during an encounter.
 */
export const HealingDoneChart = ({ encounter, entities }: Props) => (
    <HealingByCharacterChart
        encounter={encounter}
        entities={entities}
        type={`outgoing`}
        columns={OUTGOING_HEALING_METER_COLUMNS}
    />
);

/**
 * An encounter chart which displays data based on healing received during an encounter.
 */
export const HealingReceivedChart = ({ encounter, entities }: Props) => (
    <HealingByCharacterChart
        encounter={encounter}
        entities={entities}
        type={`incoming`}
        columns={OUTGOING_HEALING_METER_COLUMNS}
    />
);
