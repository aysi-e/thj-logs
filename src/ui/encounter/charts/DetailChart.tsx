import styled from 'styled-components';
import theme from '../../../theme.tsx';
import { round } from 'lodash';
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
    let totalPerSecond = 0;
    let totalAmount = 0;
    const items = props.items.map((it: DetailItem) => {
        totalPerSecond += it.perSecond;
        totalAmount += it.damage.total;
        return (
            <DamageItemContainer
                key={`${it.label}-${it.name}`}
                $color={it.color || `white`}
                $background={it.background || theme.color.secondary}
                $width={it.percent}
            >
                <DamageItemText>{it.name}</DamageItemText>
                <DamageItemNumber>{shortenNumber(it.damage.total)}</DamageItemNumber>
                <DamageItemNumber>{round(it.perSecond).toLocaleString()}</DamageItemNumber>
            </DamageItemContainer>
        );
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

export default DetailChart;

/**
 * Styled container div for a detail chart.
 */
const Container = styled.div`
    border: ${theme.color.secondary} 1px solid;
    width: 100%;
    height: 100%;
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
