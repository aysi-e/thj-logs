import Entity from '../../../parser/entity.ts';
import { sortBy } from 'lodash';
import styled from 'styled-components';
import theme from '../../../theme.tsx';
import {
    BaseChart,
    BaseChartFooter,
    BaseChartHeader,
    DamageItemNumber,
    DamageItemText,
} from './Components.tsx';
import { Link } from 'react-router-dom';

/**
 * Type representing an item on a damage meter.
 */
export type MeterItem = {
    /**
     * The entity to display on a damage meter.
     */
    entity: Entity;

    /**
     * The entity index.
     */
    index: number;

    /**
     * The damage or healing value for this item.
     */
    value: number;

    /**
     * The damage or healing value per second for this item.
     */
    perSecond: number;

    /**
     * The percentage value for this item.
     */
    percent: number;

    /**
     * Should this item link to another page?
     */
    link?: string;

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
 * Type representing a column to include in a damage meter.
 */
export type MeterColumn = {
    /**
     * The title of this column, shown in the header.
     */
    title: string;

    /**
     * The value function for this column.
     *
     * @param item the item to determine the value of
     */
    value: (item: MeterItem) => number | undefined;

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
 * Props accepted by a damage meter.
 */
type Props = {
    /**
     * The title text.
     */
    title: string;

    /**
     * The items to display.
     */
    items: MeterItem[];

    /**
     * The columns to display.
     */
    columns?: MeterColumn[];

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
 * Component which displays a damage meter between various characters, displaying each character
 * ranked from most to least damage.
 *
 * @param props
 * @constructor
 */
const DamageMeter = (props: Props) => {
    if (!props.items.length) return <></>;
    const i = sortBy(props.items, (it) => it.value * -1);
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
    const items = i.map((it) => {
        const item = (
            <DamageMeterItemContainer
                key={`${props.title}-chart-${it.entity.id}`}
                $grid={grid}
                $color={it.color || `white`}
                $background={it.background || theme.color.secondary}
                $width={it.percent}
                $link={!!it.link}
            >
                <DamageItemText>{it.entity.name}</DamageItemText>
                {columns.map(
                    ({ title, value, format = (v) => v.toString(), total }: MeterColumn) => {
                        const val = value(it);
                        if (!val)
                            return (
                                <DamageItemNumber
                                    key={`${props.title}-${it.entity.name}-${title}`}
                                />
                            );
                        if (total === true) {
                            if (!totals[title]) totals[title] = 0;
                            totals[title] += val;
                        }
                        return (
                            <DamageItemNumber key={`${props.title}-${it.entity.name}-${title}`}>
                                {format(val)}
                            </DamageItemNumber>
                        );
                    },
                )}
            </DamageMeterItemContainer>
        );

        if (it.link)
            return (
                <Link key={`${props.title}-chart-${it.entity.id}`} to={it.link}>
                    {item}
                </Link>
            );
        return item;
    });

    return (
        <BaseChart title={props.title} header={props.header} footer={props.footer}>
            {props.header && <BaseChartHeader columns={columns} />}
            {items}
            {props.footer && <BaseChartFooter columns={columns} totals={totals} />}
        </BaseChart>
    );
};

export default DamageMeter;

/**
 * Styled div which can be used as a damage meter line.
 */
const DamageMeterItemContainer = styled.div<{
    $width: number;
    $background: string;
    $color: string;
    $grid: string;
    $link: boolean;
}>`
    display: grid;
    width: 100%;
    gap: 8px;
    grid-template-columns: ${(props) => props.$grid};
    background: ${(props) =>
        `linear-gradient(to right, ${props.$background}, ${props.$background} ${props.$width}%, transparent ${props.$width}% 100%)`};
    color: ${(props) => props.$color};
    padding: 4px 0;
    user-select: none;
    cursor: pointer;

    &:hover {
        filter: ${(props) => props.$link && `brightness(1.25)`};
    }

    &:active {
        filter: ${(props) => props.$link && `brightness(0.65)`};
    }

    :first-child {
        margin-left: 4px;
    }
`;
