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

    /**
     * The height of the chart component.
     */
    height?: number;
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
    const height = props.height ?? 300;
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
            <Content height={height}>{items}</Content>
            {items.length > 1 && (
                <ChartFooter>
                    <DamageItemText>total</DamageItemText>
                    <DamageItemNumber>{shortenNumber(totalAmount)}</DamageItemNumber>
                    <DamageItemNumber>{round(totalPerSecond).toLocaleString()}</DamageItemNumber>
                </ChartFooter>
            )}
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
const Content = styled.div<{ height: number }>`
    border-top: ${theme.color.secondary} 1px solid;
    padding: 8px;
    background-color: ${theme.color.darkerBackground};
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: ${(props) => props.height - 62 - 19}px;
    margin-bottom: 31px;
    margin-top: 31px;

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
 * Styled div for the chart footer.
 */
const ChartFooter = styled.div`
    left: 0;
    bottom: 0;
    width: calc(100% - 16px);
    height: 22px;
    position: absolute;
    padding: 4px 8px;
    background-color: ${theme.color.darkerBackground};
    display: grid;
    justify-content: center;
    align-items: center;
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
    justify-content: center;
    align-items: center;
    display: flex;
`;

/**
 * Component which displays a detailed damage breakdown chart for the Character page.
 * @param props
 * @constructor
 */
export const ExtraDetailChart = (props: Props) => {
    let totalPerSecond = 0;
    let totalAmount = 0;
    const height = props.height ?? 300;
    const rescale = props.items[0].percent;
    const items = props.items.map((it: DetailItem) => {
        totalPerSecond += it.perSecond;
        totalAmount += it.damage.total;
        const miss =
            it.type === `melee`
                ? it.damage.miss +
                  it.damage.absorb +
                  it.damage.parry +
                  it.damage.riposte +
                  it.damage.block +
                  it.damage.dodge +
                  it.damage.immune
                : it.type === `spell`
                  ? it.damage.resists + it.damage.absorb + it.damage.immune
                  : 0;
        return (
            <ExtraDetailChartContainer key={`${it.label}-${it.name}`}>
                <ExtraDetailDamageMeterItem
                    $color={it.color || `white`}
                    $background={it.background || theme.color.secondary}
                    $width={(it.percent / rescale) * 100}
                >
                    <DamageItemText>{it.name}</DamageItemText>
                </ExtraDetailDamageMeterItem>
                <DamageItemNumber>{round(it.percent, 1)}%</DamageItemNumber>
                <DamageItemNumber>{shortenNumber(it.damage.total)}</DamageItemNumber>
                <DamageItemNumber>{round(it.perSecond).toLocaleString()}</DamageItemNumber>
                <DamageItemNumber>{it.damage.hits}</DamageItemNumber>
                {it.type === 'melee' || it.type === 'spell' ? (
                    <>
                        <DamageItemNumber>{it.damage.crits}</DamageItemNumber>
                        <DamageItemNumber>
                            {round((it.damage.crits / (it.damage.hits + it.damage.crits)) * 100)}%
                        </DamageItemNumber>
                        <DamageItemNumber>{miss}</DamageItemNumber>
                        <DamageItemNumber>
                            {round((miss / (it.damage.crits + it.damage.hits + miss)) * 100)}%
                        </DamageItemNumber>
                    </>
                ) : (
                    <>
                        <DamageItemNumber />
                        <DamageItemNumber />
                        <DamageItemNumber />
                        <DamageItemNumber />
                    </>
                )}
            </ExtraDetailChartContainer>
        );
    });

    return (
        <Container>
            <Header>{props.title}</Header>
            <Content height={height}>
                <ChartHeader>
                    <DamageItemText>source</DamageItemText>
                    <DamageItemText>%</DamageItemText>
                    <DamageItemText>total</DamageItemText>
                    <DamageItemText>dps</DamageItemText>
                    <DamageItemText>hits</DamageItemText>
                    <DamageItemText>crits</DamageItemText>
                    <DamageItemText>crit %</DamageItemText>
                    <DamageItemText>miss</DamageItemText>
                    <DamageItemText>miss %</DamageItemText>
                </ChartHeader>
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

const ExtraDetailChartContainer = styled.div`
    display: grid;
    width: 100%;
    gap: 8px;
    grid-template-columns: 1fr 50px 50px 50px 50px 50px 50px 50px 50px;
`;

const ChartHeader = styled.div`
    top: 31px;
    left: 0;
    right: 0;
    height: 22px;
    position: absolute;
    padding: 4px 0 4px 16px;
    display: grid;
    gap: 8px;
    grid-template-columns: 1fr 50px 50px 50px 50px 50px 50px 50px 50px 16px;
    align-items: center;
    justify-content: center;
    text-align: center;
    border-bottom: 1px solid ${theme.color.secondary};
    border-top: 1px solid ${theme.color.secondary};
    background: ${theme.color.darkerBackground};
`;

/**
 * Styled div which can be used as a damage meter line.
 */
const ExtraDetailDamageMeterItem = styled.div<{
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
