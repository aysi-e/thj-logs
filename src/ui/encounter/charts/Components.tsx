import styled from 'styled-components';
import theme from '../../../theme.tsx';
import { ReactNode } from 'react';

/**
 * Styled container div for a damage chart.
 */
export const ChartContainer = styled.div`
    border: ${theme.color.secondary} 1px solid;
    width: 100%;
    height: 100%;
    position: relative;
`;

/**
 * Props accepted by the ChartContent styled component.
 */
type ChartContentProps = {
    /**
     * The height to use.
     */
    $height: number;

    /**
     * Are we showing a chart header?
     */
    $isHeader: boolean;

    /**
     * Are we showing a chart footer?
     */
    $isFooter: boolean;
};

/**
 * Styled content div for a damage chart.
 */
export const ChartContent = styled.div<ChartContentProps>`
    border-top: ${theme.color.secondary} 1px solid;
    padding: 8px;
    background-color: ${theme.color.darkerBackground};
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: ${(props) =>
        props.$height - (props.$isFooter ? 31 : 0) - (props.$isHeader ? 31 : 0) - 19}px;
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
 * Props accepted by the ChartItemContainer styled component.
 */
type ChartItemProps = {
    // the grid to use
    $grid: string;
};

/**
 * Container div for the damage chart items.
 */
export const ChartItemContainer = styled.div<ChartItemProps>`
    display: grid;
    width: 100%;
    gap: 8px;
    grid-template-columns: ${(props) => props.$grid};
`;

/**
 * Styled header div for the damage chart.
 */
export const ChartHeader = styled.div<{ $grid: string }>`
    top: 31px;
    left: 0;
    right: 0;
    height: 22px;
    position: absolute;
    padding: 4px 8px 4px 8px;
    display: grid;
    gap: 8px;
    grid-template-columns: ${(props) => props.$grid};
    align-items: center;
    justify-content: center;
    text-align: center;
    border-bottom: 1px solid ${theme.color.secondary};
    border-top: 1px solid ${theme.color.secondary};
    background: ${theme.color.darkerBackground};
`;

/**
 * Styled div for the damage chart footer.
 */
export const ChartFooter = styled.div<{ $grid: string }>`
    left: 0;
    right: 0;
    bottom: 0;
    height: 22px;
    position: absolute;
    padding: 4px 8px 4px 8px;
    background-color: ${theme.color.darkerBackground};
    display: grid;
    grid-template-columns: ${(props) => props.$grid};
    grid-gap: 8px;
    border-top: 1px solid ${theme.color.secondary};
`;

/**
 * Props accepted by the BaseChart component.
 */
type Props = {
    title?: string;
    height?: number;
    className?: string;
    header?: boolean;
    footer?: boolean;
    children?: ReactNode;
};

/**
 * A basic chart container component.
 *
 * @param props the chart container props
 * @constructor
 */
export const BaseChart = (props: Props) => (
    <ChartContainer className={props.className}>
        <Header>{props.title}</Header>
        <ChartContent
            $height={props.height ?? 300}
            $isHeader={!!props.header}
            $isFooter={!!props.footer}
        >
            {props.children}
        </ChartContent>
    </ChartContainer>
);

/**
 * Styled header div for a chart.
 */
const Header = styled.div`
    padding: 8px;
    background-color: ${theme.color.darkerGrey};
`;

/**
 * Props accepted by the BaseChartHeader component.
 */
type HeaderProps = {
    /**
     * The header columns.
     */
    columns: {
        /**
         * The title of this column, shown in the header.
         */
        title: string;

        /**
         * The width to use for this column.
         */
        width?: number;
    }[];
};

/**
 * A header component used by a chart.
 *
 * @param columns the chart columns
 * @constructor
 */
export const BaseChartHeader = ({ columns }: HeaderProps) => {
    const grid: string[] = [`1fr`];
    const headers: string[] = [];
    columns.forEach((column) => {
        headers.push(column.title);
        grid.push(`${column.width ?? 50}px`);
    });
    const contentGrid = grid.join(` `);

    return (
        <ChartHeader $grid={contentGrid}>
            <DamageItemText>source</DamageItemText>
            {headers.map((column) => (
                <DamageItemText key={`header-${column}`}>{column}</DamageItemText>
            ))}
        </ChartHeader>
    );
};

/**
 * Styled div which formats text for the DamageItemContainer.
 */
export const DamageItemText = styled.div`
    font-size: 0.9em;
`;

/**
 * Styled div which formats text for the DamageItemContainer.
 */
export const DamageItemNumber = styled.div`
    font-size: 0.9em;
    text-align: center;
    justify-content: center;
    align-items: center;
    display: flex;
`;

/**
 * Props accepted by the BaseChartFooter component.
 */
type FooterProps = {
    /**
     * The header columns.
     */
    columns: {
        /**
         * The title of this column, shown in the header.
         */
        title: string;

        /**
         * The width to use for this column.
         */
        width?: number;

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
    }[];

    /**
     * The computed total values.
     */
    totals: Record<string, number>;
};

/**
 * A footer component used by a chart.
 *
 * @param columns the chart columns
 * @param totals the totals
 * @constructor
 */
export const BaseChartFooter = ({ columns, totals }: FooterProps) => {
    const grid = columns
        .reduce(
            (acc, val) => {
                acc.push(`${val.width ?? 50}px`);
                return acc;
            },
            [`1fr`],
        )
        .join(` `);

    return (
        <ChartFooter $grid={grid}>
            <DamageItemText></DamageItemText>
            {columns.map((it) => {
                if (!it.total) return <DamageItemNumber key={`footer-${it.title}`} />;
                if (it.total === true) {
                    const val = totals[it.title] ?? 0;
                    const formatted = it.format ? it.format(val) : val.toString();
                    return (
                        <DamageItemNumber key={`footer-${it.title}`}>{formatted}</DamageItemNumber>
                    );
                } else {
                    return (
                        <DamageItemNumber key={`footer-${it.title}`}>{it.total}</DamageItemNumber>
                    );
                }
            })}
        </ChartFooter>
    );
};
