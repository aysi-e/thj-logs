import { Encounter, Healing } from '@aysie/thj-parser-lib';
import { Entity } from '@aysie/thj-parser-lib';
import DetailChart, { DetailColumn, DetailItem } from './DetailChart.tsx';
import { round, values } from 'lodash';
import { shortenNumber } from '../../../util/numbers.ts';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

/**
 * Props accepted by healing breakdown charts.
 */
type Props = {
    /**
     * The encounter object.
     */
    encounter: Encounter;

    /**
     * The entity that should be used for the chart.
     */
    entity: Entity;
};

/**
 * Type representing a healing breakdown (compiled healing done to all targets).
 */
type HealingBreakdownItem = {
    name: string;
    type: `heal`;
    healing: Healing;
};

/**
 * Convert an entity object into an appropriate data type to use for our breakdown chart.
 *
 * @param entity the entity object
 * @param type the type of healing breakdown
 * @param encounter the encounter object
 */
const toHealingBreakdownItems = (
    entity: Entity,
    type: `incoming` | `outgoing`,
    encounter: Encounter,
): DetailItem[] => {
    const items: Record<string, HealingBreakdownItem> = {};
    let healing = 0;
    const ce = entity[type];

    // un-spool the damage shield section
    values(ce.heal).forEach((byType) => {
        values(byType).forEach((byTarget) => {
            const key = `heal-${byTarget.name}`;
            if (!items[key])
                items[key] = {
                    name: byTarget.name,
                    healing: new Healing(byTarget.name, `all`, byTarget.isAbsorb),
                    type: `heal`,
                };
            (items[key] as HealingBreakdownItem).healing.addFrom(byTarget);
            healing += byTarget.total;
        });
    });

    return values(items)
        .map((it) => ({
            name: it.name,
            type: it.type,
            damage: it.healing,
            perSecond: (it.healing.total / encounter.duration) * 1000,
            percent: (it.healing.total / healing) * 100,
            label: `HPS`,
            background: it.healing.isAbsorb ? `#7c7941` : `#33622d`,
        }))
        .sort((a, b) => b.damage.total - a.damage.total) as DetailItem[];
};

/**
 * A basic set of columns for an incoming healing table.
 */
const INCOMING_HEALING_BASIC_COLUMNS: DetailColumn[] = [
    {
        title: `total`,
        value: (item) => item.damage.total,
        format: (value: number) => shortenNumber(value),
        total: true,
    },
    {
        title: `hps`,
        value: (item) => item.perSecond,
        format: (value: number) => round(value).toLocaleString(),
        total: true,
    },
    {
        title: `crit %`,
        value: (item) => {
            if (item.type === `heal` && item.damage.attempts() > 0)
                return item.damage.crits / item.damage.attempts();
        },
        format: (value: number) => `${round(value * 100)}%`,
    },
];

/**
 * A detailed set of columns for an incoming healing table.
 */
const INCOMING_HEALING_DETAILED_COLUMNS: DetailColumn[] = [
    {
        title: `total`,
        value: (item) => item.damage.total,
        format: (value: number) => shortenNumber(value),
        total: true,
    },
    {
        title: `hps`,
        value: (item) => item.perSecond,
        format: (value: number) => round(value).toLocaleString(),
        total: true,
    },
    {
        title: `hits`,
        value: (item) => item.damage.hits,
    },
    {
        title: `crits`,
        value: (item) => (item.type !== `ds` ? item.damage.crits : undefined),
    },
    {
        title: `crit %`,
        value: (item) =>
            item.type !== `ds`
                ? item.damage.crits / (item.damage.hits + item.damage.crits)
                : undefined,
        format: (value: number) => `${round(value * 100)}%`,
    },
];

/**
 * An encounter chart which displays data based on healing done during an encounter, broken down by healing type.
 */
export const IncomingHealingBreakdownChart = ({ encounter, entity }: Props) => {
    const link = values(encounter.entities).indexOf(entity);
    const title = (
        <div>
            {`healing received by `}
            <HeaderLink>
                <Link to={`character/${link}`}>{entity.name}</Link>
            </HeaderLink>
        </div>
    );
    const items = toHealingBreakdownItems(entity, `incoming`, encounter);

    return (
        <DetailChart
            title={title}
            items={items}
            columns={INCOMING_HEALING_BASIC_COLUMNS}
            header
            footer
        />
    );
};

/**
 * An encounter chart which displays data based on healing done during an encounter, broken down by healing type.
 */
export const DetailedIncomingHealingBreakdownChart = ({ encounter, entity }: Props) => {
    const title = `healing received by ${entity.name}`;
    const items = toHealingBreakdownItems(entity, `incoming`, encounter);
    return (
        <DetailChart
            title={title}
            items={items}
            columns={INCOMING_HEALING_DETAILED_COLUMNS}
            header
            footer
        />
    );
};

/**
 * An encounter chart which displays data based on healing done during an encounter, broken down by healing type.
 */
export const OutgoingHealingBreakdownChart = ({ encounter, entity }: Props) => {
    const link = values(encounter.entities).indexOf(entity);
    const title = (
        <div>
            {`healing done by `}
            <HeaderLink>
                <Link to={`character/${link}`}>{entity.name}</Link>
            </HeaderLink>
        </div>
    );

    const items = toHealingBreakdownItems(entity, `outgoing`, encounter);

    return (
        <DetailChart
            title={title}
            items={items}
            columns={INCOMING_HEALING_BASIC_COLUMNS}
            header
            footer
        />
    );
};

/**
 * A styled header link.
 */
const HeaderLink = styled.span`
    color: #b6d1ff;
    font-weight: bold;
    text-decoration: underline dotted;

    &:hover {
        background-color: rgba(0, 0, 0, 0.25);
    }

    &:active {
        background-color: rgba(0, 0, 0, 0.5);
    }

    padding: 4px;
    margin: 0 -4px;
`;

/**
 * An encounter chart which displays data based on healing done during an encounter, broken down by healing type.
 */
export const DetailedOutgoingHealingBreakdownChart = ({ encounter, entity }: Props) => {
    const title = `healing done by ${entity.name}`;
    const items = toHealingBreakdownItems(entity, `outgoing`, encounter);
    return (
        <DetailChart
            header
            footer
            title={title}
            items={items}
            columns={INCOMING_HEALING_DETAILED_COLUMNS}
        />
    );
};
