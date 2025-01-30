import Entity from '../../../parser/entity';
import { Encounter } from '../../../parser/parser';
import { values } from 'lodash';
import EncounterChart, { ChartItem } from './EncounterChart.tsx';
import { keys } from 'mobx';
import { IncomingDamageBreakdownChart } from './DamageBreakdown.tsx';

/**
 * Props accepted by encounter detail charts.
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
     * The entity index in the entity array.
     */
    index: number;
};

/**
 * Convert an entity object into an appropriate data type to use for our damage meter.
 *
 * @param entity the entity object
 * @param encounter the encounter object
 */
const toDamageTakenEntityItem = (entity: Entity, encounter: Encounter) => {
    let damage = 0;

    // un-spool the damage shield section
    values(entity.incoming.ds).forEach((dm) => {
        values(dm).forEach((ds) => {
            damage += ds.total;
        });
    });

    // un-spool the melee damage section
    values(entity.incoming.melee).forEach((mm) => {
        values(mm).forEach((melee) => {
            damage += melee.total;
        });
    });

    // un-spool the spell damage section
    values(entity.incoming.spell).forEach((sm) => {
        values(sm).forEach((spell) => {
            damage += spell.total;
        });
    });

    return {
        entity,
        name: entity.name || entity.id,
        damage,
        dps: (damage / encounter.duration) * 1000,
        index: keys(encounter.entities).indexOf(entity.id),
    };
};

/**
 * Convert a DamageEntityItem into a ChartItem.
 *
 * @param item the damage item
 * @param total the chart item
 */
const toChartItem = (item: DamageEntityItem, total: number): ChartItem => ({
    name: item.name,
    value: item.damage,
    link: `character/${item.index}`,
    perSecond: item.dps,
    label: 'DTPS',
    percent: (item.damage / total) * 100,
    background: `#9c4646`,
});

/**
 * An encounter chart which displays data based on damage done during an encounter.
 */
const DamageTakenChart = ({ encounter, entities }: Props) => {
    if (entities.length === 0) {
        // todo: empty chart.
        return <></>;
    }

    let title;
    let chart: ChartItem[];
    if (entities.length === 1) {
        const entity = entities[0];
        return <IncomingDamageBreakdownChart encounter={encounter} entity={entity} />;
    } else {
        const relation = entities.reduce<{
            items: DamageEntityItem[];
            allies: boolean;
            enemies: boolean;
            total: number;
        }>(
            (acc, val) => {
                const item = toDamageTakenEntityItem(val, encounter);
                acc.items.push(item);
                acc.allies = acc.allies && !val.isEnemy;
                acc.enemies = acc.enemies && !!val.isEnemy;
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

        if (relation.allies) {
            title = `damage taken by allies`;
        } else if (relation.enemies) {
            title = `damage taken by enemies`;
        } else {
            title = `damage taken`;
        }
        chart = relation.items
            .sort((a, b) => b.damage - a.damage)
            .filter((it) => it.damage > 0)
            .map((item) => toChartItem(item, relation.total));
    }

    return <EncounterChart title={title} items={chart} />;
};

export default DamageTakenChart;
