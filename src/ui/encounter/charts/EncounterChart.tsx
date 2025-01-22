import styled from 'styled-components';
import theme from '../../../theme.tsx';
import { round } from 'lodash';
import { Link } from 'react-router-dom';
import { shortenNumber } from '../../../util/numbers.ts';

/**
 * Props accepted by an encounter chart.
 */
type Props = {
    /**
     * The title text.
     */
    title: string;

    /**
     * The items to display.
     */
    items: ChartItem[];
};

/**
 * Item information for an encounter chart.
 */
export type ChartItem = {
    /**
     * The item name.
     */
    name: string;

    /**
     * The entity index.
     */
    link?: string | undefined;

    /**
     * The damage or healing value for this item.
     */
    value: number;

    /**
     * The damage or healing value per second for this item.
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
 * Component which displays a basic damage meter-style chart for the Encounter page.
 * @param props
 * @constructor
 */
const EncounterChart = (props: Props) => {
    let totalPerSecond = 0;
    let totalAmount = 0;
    const items = props.items.map((it: ChartItem) => {
        totalPerSecond += it.perSecond;
        totalAmount += it.value;
        const item = (
            <DamageItemContainer
                key={`${it.label}-${it.name}`}
                $color={it.color || `white`}
                $background={it.background || theme.color.secondary}
                $width={it.percent}
            >
                <DamageItemText>{it.name}</DamageItemText>
                <DamageItemNumber>{shortenNumber(it.value)}</DamageItemNumber>
                <DamageItemNumber>{round(it.perSecond).toLocaleString()}</DamageItemNumber>
            </DamageItemContainer>
        );
        if (it.link) {
            return (
                <Link to={it.link} key={`${it.label}-${it.name}`}>
                    {item}
                </Link>
            );
        } else {
            return item;
        }
    });
    return (
        <Container>
            <Header>{props.title}</Header>
            <Content>
                {items}
                {items.length > 1 && (
                    <ChartFooter>
                        <DamageItemText>total</DamageItemText>
                        <DamageItemNumber>{shortenNumber(totalAmount)}</DamageItemNumber>
                        <DamageItemNumber>
                            {round(totalPerSecond).toLocaleString()}
                        </DamageItemNumber>
                    </ChartFooter>
                )}
            </Content>
        </Container>
    );
};

export default EncounterChart;

/**
 * Styled container div for an encounter chart.
 */
const Container = styled.div`
    border: ${theme.color.secondary} 1px solid;
    width: 100%;
    height: 100%;
`;

/**
 * Styled header div for an encounter chart.
 */
const Header = styled.div`
    padding: 8px;
    background-color: ${theme.color.darkerGrey};
`;

/**
 * Styled content div for an encounter chart.
 */
const Content = styled.div`
    border-top: ${theme.color.secondary} 1px solid;
    padding: 8px;
    background-color: ${theme.color.darkerBackground};
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

/**
 * Styled div for the chart footer.
 */
const ChartFooter = styled.div`
    padding: 4px 4px 0 4px;
    background-color: ${theme.color.darkerBackground};
    display: grid;
    grid-template-columns: 72% 1fr 1fr;
    grid-gap: 8px;
    border-top: 1px solid ${theme.color.secondary};
`;

/**
 * Styled div which can be used as a damage meter line.
 */
const DamageItemContainer = styled.div<{ $width: number; $background: string; $color: string }>`
    background: ${(props) =>
        `linear-gradient(to right, ${props.$background}, ${props.$background} ${props.$width}%, transparent ${props.$width}% 100%)`};
    color: ${(props) => props.$color};
    padding: 4px;
    user-select: none;
    cursor: pointer;

    display: grid;
    grid-template-columns: 72% 1fr 1fr;
    grid-gap: 8px;

    &:hover {
        filter: brightness(1.25);
    }

    &:active {
        filter: brightness(0.65);
    }
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
`;
