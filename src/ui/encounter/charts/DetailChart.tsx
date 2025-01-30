import styled from 'styled-components';
import theme from '../../../theme.tsx';
import { round, sortBy } from 'lodash';
import { shortenNumber } from '../../../util/numbers.ts';
import { DamageShieldDamage, MeleeDamage, SpellDamage } from '../../../parser/entity.ts';

/**
 * Props accepted by a detail chart.
 */
type Props = {
    /**
     * The title text.
     */
    title: string;

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
    const i = sortBy(props.items, (it) => it.damage.total * -1);
    const columns = props.columns ?? [];
    const grid: string[] = [`1fr`];
    const headers: string[] = [];
    columns.forEach((column, i) => {
        headers.push(column.title);
        grid.push(`${column.width ?? 50}px`);
    });
    const totals: Record<string, number> = {};
    const contentGrid = grid.join(` `);

    const height = props.height ?? 300;
    const rescale = i[0].percent;

    const items = i.map((it: DetailItem) => {
        return (
            <ChartContainer key={`${it.label}-${it.name}`} $grid={contentGrid}>
                <DamageMeterItem
                    $color={it.color || `white`}
                    $background={it.background || theme.color.secondary}
                    $width={(it.percent / rescale) * 100}
                >
                    <DamageItemText>{it.name}</DamageItemText>
                </DamageMeterItem>
                {columns.map(
                    ({ title, value, format = (v) => v.toString(), total }: DetailColumn) => {
                        const val = value(it);
                        if (!val) return <DamageItemNumber />;
                        if (total === true) {
                            if (!totals[title]) totals[title] = 0;
                            totals[title] += val;
                        }
                        return <DamageItemNumber>{format(val)}</DamageItemNumber>;
                    },
                )}
            </ChartContainer>
        );
    });

    return (
        <Container>
            <Header>{props.title}</Header>
            <Content height={height} $isHeader={!!props.header} $isFooter={!!props.footer}>
                {props.header && (
                    <ChartHeader $grid={contentGrid}>
                        <DamageItemText>source</DamageItemText>
                        {headers.map((column) => (
                            <DamageItemText key={`header-${column}`}>{column}</DamageItemText>
                        ))}
                    </ChartHeader>
                )}
                {items}
                {props.footer && (
                    <ChartFooter $grid={contentGrid}>
                        <DamageItemText></DamageItemText>
                        {columns.map((it) => {
                            if (!it.total) return <DamageItemNumber key={`footer-${it.title}`} />;
                            if (it.total === true) {
                                const val = totals[it.title] ?? 0;
                                const formatted = it.format ? it.format(val) : val.toString();
                                return (
                                    <DamageItemNumber key={`footer-${it.title}`}>
                                        {formatted}
                                    </DamageItemNumber>
                                );
                            } else {
                                return (
                                    <DamageItemNumber key={`footer-${it.title}`}>
                                        {it.total}
                                    </DamageItemNumber>
                                );
                            }
                        })}
                    </ChartFooter>
                )}
            </Content>
        </Container>
    );
};

export default DetailChart;

/**
 * Styled container div for a detail chart.
 */
const Container = styled.div`
    border: ${theme.color.secondary} 1px solid;
    width: 100%;
    height: 100%;
    position: relative;
`;

/**
 * Styled header div for a detail chart.
 */
const Header = styled.div`
    padding: 8px;
    background-color: ${theme.color.darkerGrey};
`;

/**
 * Styled content div for a detail chart.
 */
const Content = styled.div<{ height: number; $isHeader: boolean; $isFooter: boolean }>`
    border-top: ${theme.color.secondary} 1px solid;
    padding: 8px;
    background-color: ${theme.color.darkerBackground};
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: ${(props) =>
        props.height - (props.$isFooter ? 31 : 0) - (props.$isHeader ? 31 : 0) - 19}px;
    margin-bottom: ${(props) => (props.$isFooter ? `31px` : 0)};
    margin-top: ${(props) => (props.$isHeader ? `31px` : 0)};

    overflow-x: hidden;
    overflow-y: scroll;
    scrollbar-color: rgba(0, 0, 0, 0.5) ${theme.color.darkerBackground};

    ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }

    ::-webkit-scrollbar-thumb {
        /* Foreground */
        background: rgba(0, 0, 0, 0.5);
    }

    ::-webkit-scrollbar-track {
        /* Background */
        background: ${theme.color.darkerBackground};
    }
`;

/**
 * Container div for the detail chart items.
 */
const ChartContainer = styled.div<{ $grid: string }>`
    display: grid;
    width: 100%;
    gap: 8px;
    grid-template-columns: ${(props) => props.$grid};
`;

/**
 * Styled div which formats text for the DamageItemContainer.
 */
const DamageItemText = styled.div`
    font-size: 0.9em;
`;

/**
 * Styled div which formats text for the DamageItemContainer.
 */
const DamageItemNumber = styled.div`
    font-size: 0.9em;
    text-align: center;
    justify-content: center;
    align-items: center;
    display: flex;
`;

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

/**
 * Styled header div for the detail chart.
 */
const ChartHeader = styled.div<{ $grid: string }>`
    top: 31px;
    left: 0;
    right: 0;
    height: 22px;
    position: absolute;
    padding: 4px 0 4px 16px;
    display: grid;
    gap: 8px;
    grid-template-columns: ${(props) => props.$grid} 16px;
    align-items: center;
    justify-content: center;
    text-align: center;
    border-bottom: 1px solid ${theme.color.secondary};
    border-top: 1px solid ${theme.color.secondary};
    background: ${theme.color.darkerBackground};
`;

/**
 * Styled div for the extra detail chart footer.
 */
const ChartFooter = styled.div<{ $grid: string }>`
    left: 0;
    right: 0;
    bottom: 0;
    height: 22px;
    position: absolute;
    padding: 4px 0 4px 16px;
    background-color: ${theme.color.darkerBackground};
    display: grid;
    grid-template-columns: ${(props) => props.$grid} 16px;
    grid-gap: 8px;
    border-top: 1px solid ${theme.color.secondary};
`;
