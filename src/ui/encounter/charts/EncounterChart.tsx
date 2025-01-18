import styled from "styled-components";
import theme from "../../../theme.tsx";
import {round} from "lodash";
import {Link} from "react-router-dom";

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
}

/**
 * Item information for an encounter chart.
 */
export type ChartItem = {

    /**
     * The entity name.
     */
    name: string;

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
}

/**
 * Component which displays a basic damage meter-style chart for the Encounter page.
 * @param props
 * @constructor
 */
const EncounterChart = (props: Props) => <Container>
    <Header>{props.title}</Header>
    <Content>
        {props.items.map(it =>
            <Link to={`character/${it.index}`} key={`${it.label}-${it.index}`}>
                <DamageItemContainer $color={it.color || `white`} $background={it.background || theme.color.secondary} $width={it.percent}>
                    <DamageItemText>{it.name}</DamageItemText>
                    <DamageItemText>{round(it.perSecond)} {round(it.percent, 1)}% {it.value}</DamageItemText>
                </DamageItemContainer>
            </Link>
        )}
    </Content>
</Container>

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
 * Styled div which can be used as a damage meter line.
 */
const DamageItemContainer = styled.div<{$width: number, $background: string, $color: string}>`
    background: ${props => `linear-gradient(to right, ${props.$background}, ${props.$background} ${props.$width}%, transparent ${props.$width}% 100%)`};
    color: ${props => props.$color};
    padding: 4px;
    user-select: none;
    cursor: pointer;
    
    display: flex;
    justify-content: space-between;
    
    &:hover {
        filter: brightness(1.25);
    }
    
    &:active {
        filter: brightness(.65);
    }
`;

/**
 * Styled div which formats text for the DamageItemContainer.
 */
const DamageItemText = styled.div`
    font-size: .9em;
`;
