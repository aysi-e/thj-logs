import styled from 'styled-components';
import theme from '../../../theme.tsx';
import { sortBy } from 'lodash';
import { DamageShieldDamage, MeleeDamage, SpellDamage } from '@aysie/thj-parser-lib';
import {
    BaseChart,
    BaseChartFooter,
    BaseChartHeader,
    ChartItemContainer,
    DamageItemNumber,
    DamageItemText,
} from './Components.tsx';
import { ReactNode } from 'react';

/**
 * Props accepted by a detail chart.
 */
type Props = {
    /**
     * The title text.
     */
    title: string | ReactNode;

    /**
     * The items to display.
     */
    items: DetailItem[];

    /**
     * The columns to show.
     */
    columns?: DetailColumn[];

    /**
     * The height of the chart component.
     */
    height?: number;

    /**
     * Should we show a header with column names?
     */
    header?: boolean;

    /**
     * Should we show a footer with total values?
     */
    footer?: boolean;
};

/**
 * Type representing a column to include in a detail chart.
 */
export type DetailColumn = {
    /**
     * The title of this column, shown in the header.
     */
    title: string;

    /**
     * The value function for this column.
     *
     * @param item the item to determine the value of
     */
    value: (item: DetailItem) => number | undefined;

    /**
     * A formatting function for this column.
     *
     * @param value the value to format
     */
    format?: (value: number) => string;

    /**
     * The 'total' value to use for this column.
     *
     * If a string is provided, the string will be used as the total. If the boolean is provided
     * (and true), we will calculate the total based on the column values.
     */
    total?: string | boolean;

    /**
     * The width to use for this column.
     */
    width?: number;
};

/**
 * Type of detail item which contains spell data.
 */
export type SpellDetailItem = {
    /**
     * A spell damage detail item.
     */
    type: `spell`;

    /**
     * A name to use for this item.
     */
    name: string;

    /**
     * The spell damage object.
     */
    damage: SpellDamage;

    /**
     * The amount of per-second damage or healing dealt by this item.
     */
    perSecond: number;

    /**
     * The label to apply to the per-second value (ex: DPS, HPS).
     */
    label: string;

    /**
     * The percentage value for this item.
     */
    percent: number;

    /**
     * The background color to use for this item.
     */
    background?: string;

    /**
     * The text color to use for this item.
     */
    color?: string;
};

/**
 * Type of detail item which contains melee data.
 */
export type MeleeDetailItem = {
    /**
     * A melee damage detail item.
     */
    type: `melee`;

    /**
     * A name to use for this item.
     */
    name: string;

    /**
     * The melee damage object.
     */
    damage: MeleeDamage;

    /**
     * The amount of per-second damage or healing dealt by this item.
     */
    perSecond: number;

    /**
     * The label to apply to the per-second value (ex: DPS, HPS).
     */
    label: string;

    /**
     * The percentage value for this item.
     */
    percent: number;

    /**
     * The background color to use for this item.
     */
    background?: string;

    /**
     * The text color to use for this item.
     */
    color?: string;
};

/**
 * Type of detail item which contains damage shield data.
 */
export type DamageShieldDetailItem = {
    /**
     * A damage shield damage detail item.
     */
    type: `ds`;

    /**
     * A name to use for this item.
     */
    name: string;

    /**
     * The damage shield damage object.
     */
    damage: DamageShieldDamage;

    /**
     * The amount of per-second damage or healing dealt by this item.
     */
    perSecond: number;

    /**
     * The label to apply to the per-second value (ex: DPS, HPS).
     */
    label: string;

    /**
     * The percentage value for this item.
     */
    percent: number;

    /**
     * The background color to use for this item.
     */
    background?: string;

    /**
     * The text color to use for this item.
     */
    color?: string;
};

/**
 * Item information for a detail chart.
 */
export type DetailItem = MeleeDetailItem | DamageShieldDetailItem | SpellDetailItem;

/**
 * Component which displays a detailed damage breakdown chart for the Character page.
 * @param props
 * @constructor
 */
const DetailChart = (props: Props) => {
    if (!props.items.length) return <></>;
    const i = sortBy(props.items, (it) => it.damage.total * -1);
    const columns = props.columns ?? [];
    const totals: Record<string, number> = {};
    const grid = columns
        .reduce(
            (acc, val) => {
                acc.push(`${val.width ?? 50}px`);
                return acc;
            },
            [`1fr`],
        )
        .join(` `);
    const rescale = i[0].percent;

    const items = i.map((it: DetailItem) => (
        <ChartItemContainer key={`${it.label}-${it.name}`} $grid={grid}>
            <DamageMeterItem
                $color={it.color || `white`}
                $background={it.background || theme.color.secondary}
                $width={(it.percent / rescale) * 100}
            >
                <DamageItemText>{it.name}</DamageItemText>
            </DamageMeterItem>
            {columns.map(({ title, value, format = (v) => v.toString(), total }: DetailColumn) => {
                const val = value(it);
                if (!val) return <DamageItemNumber key={`${it.label}-${it.name}-${title}`} />;
                if (total === true) {
                    if (!totals[title]) totals[title] = 0;
                    totals[title] += val;
                }
                return (
                    <DamageItemNumber key={`${it.label}-${it.name}-${title}`}>
                        {format(val)}
                    </DamageItemNumber>
                );
            })}
        </ChartItemContainer>
    ));

    return (
        <BaseChart title={props.title} header={props.header} footer={props.footer}>
            {props.header && <BaseChartHeader columns={columns} />}
            {items}
            {props.footer && <BaseChartFooter columns={columns} totals={totals} />}
        </BaseChart>
    );
};

export default DetailChart;

/**
 * Styled div which can be used as a damage meter line.
 */
const DamageMeterItem = styled.div<{
    $width: number;
    $background: string;
    $color: string;
}>`
    background: ${(props) =>
        `linear-gradient(to right, ${props.$background}, ${props.$background} ${props.$width}%, transparent ${props.$width}% 100%)`};
    color: ${(props) => props.$color};
    padding: 4px;
    user-select: none;
    cursor: pointer;
`;
