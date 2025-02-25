// module containing chart components where data (damage or healing) is broken down by source.

import {
    DamageShieldBreakdownItem,
    EncounterEntityState,
    MeleeBreakdownItem,
    SpellBreakdownItem,
    useEncounter,
} from '../../../state/encounter.ts';
import DetailChart, {
    DamageShieldDetailItem,
    DetailColumn,
    DetailItem,
    MeleeDetailItem,
    SpellDetailItem,
} from './DetailChart.tsx';
import { assign, round, values } from 'lodash';
import { DamageShieldDamage, MeleeDamage, SpellDamage } from '@aysi-e/thj-parser-lib';
import theme from '../../../theme.tsx';
import { shortenNumber } from '../../../util/numbers.ts';

/**
 * Props accepted by the DamageBySourceChart component.
 */
type BySourceProps = {
    /**
     * The title for this breakdown chart.
     */
    title: string;

    /**
     * The entities that should be included in the breakdown chart.
     */
    entities: EncounterEntityState[];

    /**
     * Should we display incoming or outgoing damage?
     */
    direction?: `incoming` | `outgoing`;

    /**
     * A function that customizes meter items.
     *
     * @param item the item to customize
     */
    customize?: (item: MeleeDamage | SpellDamage | DamageShieldDamage) => {
        link?: string;
        background?: string;
        color?: string;
    };

    /**
     * The columns to render for this breakdown chart.
     */
    columns?: DetailColumn[];
};

/**
 * A breakdown chart where damage from the provided entities is broken down by damage type/name.
 *
 * @param props the props accepted by the DamageBySourceChart component.
 * @constructor
 */
export const DamageBySourceChart = (props: BySourceProps) => {
    const encounter = useEncounter();

    // is this a damage dealt or damage taken chart?
    const direction = props.direction || `outgoing`;
    // a customize function for the chart items.
    const customize = props.customize
        ? props.customize
        : (item: MeleeDamage | SpellDamage | DamageShieldDamage) => ({});
    // calculate the total damage done for the entities that we're charting.
    const { data, total } = props.entities.reduce<BreakdownStub>(
        (acc, val) => {
            const breakdown =
                direction === `outgoing` ? val.damageDealtBreakdown() : val.damageTakenBreakdown();
            breakdown.items.forEach((item) => {
                const key = `${item.type}-${item.name}`;
                if (!acc.data[key]) acc.data[key] = [];
                acc.data[key].push(item);
            });
            acc.total += breakdown.total;
            return acc;
        },
        {
            data: {},
            total: 0,
        },
    );

    /**
     * Given breakdown items, return detail items.
     *
     * The provided item list must not be empty.
     *
     * @param items the items
     */
    const toDetailItems = (items: BreakdownItems[]): DetailItem => {
        const sample = items[0];
        switch (sample.type) {
            case 'melee':
                const melee = new MeleeDamage(sample.data.type, `#all`);
                items.forEach((item) => melee.addFrom(item.data as MeleeDamage));
                return assign(customize(melee), {
                    type: 'melee',
                    name: melee.type,
                    damage: melee,
                    perSecond: melee.total / encounter.duration.as(`seconds`),
                    label: `DPS`,
                    percent: (melee.total / total) * 100,
                    background: `#7a7a7a`,
                }) as MeleeDetailItem;
            case 'ds':
                const ds = new DamageShieldDamage(sample.data.effect, `#all`);
                items.forEach((item) => ds.addFrom(item.data as DamageShieldDamage));
                return assign(customize(ds), {
                    type: `ds`,
                    name: `${ds.effect} (damage shield)`,
                    damage: ds,
                    perSecond: ds.total / encounter.duration.as(`seconds`),
                    label: `DPS`,
                    percent: (ds.total / total) * 100,
                    background: theme.color.error,
                }) as DamageShieldDetailItem;
            case 'spell':
                const spell = new SpellDamage(sample.data.name, `#all`);
                items.forEach((item) => spell.addFrom(item.data as SpellDamage));
                return assign(customize(spell), {
                    type: `spell`,
                    name: spell.name,
                    damage: spell,
                    perSecond: spell.total / encounter.duration.as(`seconds`),
                    label: `DPS`,
                    percent: (spell.total / total) * 100,
                    background: `#4a5ba6`,
                }) as SpellDetailItem;
        }
    };

    // the columns to show.
    const columns = props.columns ? props.columns : BREAKDOWN_DEFAULT_COLUMNS;

    return (
        <DetailChart
            title={props.title}
            items={values(data).map((it) => toDetailItems(it))}
            columns={columns}
            header
            footer
        />
    );
};

/**
 * A basic set of columns for an outgoing damage table.
 */
const BREAKDOWN_DEFAULT_COLUMNS: DetailColumn[] = [
    {
        title: `%`,
        value: (item) => item.percent,
        format: (value: number) => `${round(value, 1)}%`,
        total: '100%',
    },
    {
        title: `total`,
        value: (item) => item.damage.total,
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

type BreakdownItems = DamageShieldBreakdownItem | MeleeBreakdownItem | SpellBreakdownItem;
type BreakdownStub = {
    data: Record<string, BreakdownItems[]>;
    total: number;
};
