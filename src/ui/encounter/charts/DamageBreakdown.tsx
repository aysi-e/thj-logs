import { Encounter, UNKNOWN_ID } from '@aysi-e/thj-parser-lib';
import { Entity, DamageShieldDamage, MeleeDamage, SpellDamage } from '@aysi-e/thj-parser-lib';
import DetailChart, { DetailColumn, DetailItem } from './DetailChart.tsx';
import { isArray, round, values } from 'lodash';
import { shortenNumber } from '../../../util/numbers.ts';
import theme from '../../../theme.tsx';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

/**
 * Props accepted by damage breakdown charts.
 */
type Props = {
    /**
     * The encounter object.
     */
    encounter: Encounter;

    /**
     * The entity that should be used for the chart.
     */
    entity: Entity | Entity[];

    /**
     * Should we include a link to the character page?
     */
    link?: boolean;
};

/**
 * Type representing a damage shield breakdown (compiled damage shield damage dealt to all targets).
 */
type DamageShieldBreakdownItem = {
    name: string;
    type: `ds`;
    damage: DamageShieldDamage;
};

/**
 * Type representing a melee damage breakdown (compiled melee damage dealt to all targets).
 */
type MeleeBreakdownItem = {
    name: string;
    type: `melee`;
    damage: MeleeDamage;
};

/**
 * Type representing a spell damage breakdown (compiled spell damage dealt to all targets).
 */
type SpellBreakdownItem = {
    name: string;
    type: `spell`;
    damage: SpellDamage;
};

/**
 * Convert an entity object into an appropriate data type to use for our breakdown chart.
 *
 * @param entity the entity object
 * @param type the type of damage breakdown
 * @param encounter the encounter object
 */
const toDamageBreakdownItems = (
    entity: Entity[],
    type: `incoming` | `outgoing`,
    encounter: Encounter,
): DetailItem[] => {
    const items: Record<
        string,
        DamageShieldBreakdownItem | MeleeBreakdownItem | SpellBreakdownItem
    > = {};
    let damage = 0;
    entity.forEach((e) => {
        const ce = e[type];

        // un-spool the damage shield section
        values(ce.ds).forEach((dm) => {
            values(dm).forEach((ds) => {
                if (!items[`ds-${ds.effect}`])
                    items[`ds-${ds.effect}`] = {
                        name: `${ds.effect} (damage shield)`,
                        damage: new DamageShieldDamage(ds.effect, `all`),
                        type: `ds`,
                    };
                (items[`ds-${ds.effect}`] as DamageShieldBreakdownItem).damage.addFrom(ds);
                damage += ds.total;
            });
        });

        // un-spool the melee damage section
        values(ce.melee).forEach((mm) => {
            values(mm).forEach((melee) => {
                if (!items[`melee-${melee.type}`])
                    items[`melee-${melee.type}`] = {
                        name: melee.type,
                        damage: new MeleeDamage(melee.type, `all`),
                        type: `melee`,
                    };
                (items[`melee-${melee.type}`] as MeleeBreakdownItem).damage.addFrom(melee);
                damage += melee.total;
            });
        });

        // un-spool the spell damage section
        values(ce.spell).forEach((sm) => {
            values(sm).forEach((spell) => {
                if (!items[`spell-${spell.name}`])
                    items[`spell-${spell.name}`] = {
                        name: spell.name,
                        damage: new SpellDamage(spell.name, `all`),
                        type: `spell`,
                    };
                (items[`spell-${spell.name}`] as SpellBreakdownItem).damage.addFrom(spell);
                damage += spell.total;
            });
        });
    });

    return values(items)
        .map((it) => ({
            name: it.name,
            type: it.type,
            damage: it.damage,
            perSecond: (it.damage.total / encounter.duration) * 1000,
            percent: (it.damage.total / damage) * 100,
            label: `DPS`,
            background:
                it.type === `ds` ? theme.color.error : it.type === `spell` ? `#4a5ba6` : `#7a7a7a`,
        }))
        .sort((a, b) => b.damage.total - a.damage.total) as DetailItem[];
};

/**
 * A basic set of columns for an incoming damage table.
 */
const INCOMING_DAMAGE_BASIC_COLUMNS: DetailColumn[] = [
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
    {
        title: `avoid %`,
        value: (item) => {
            if (item.type === `ds` || item.type === `heal`) return undefined;
            const miss =
                item.type === `melee`
                    ? item.damage.miss +
                      item.damage.absorb +
                      item.damage.parry +
                      item.damage.riposte +
                      item.damage.block +
                      item.damage.dodge +
                      item.damage.immune
                    : item.damage.resists + item.damage.absorb + item.damage.immune;
            return miss / (item.damage.crits + item.damage.hits + miss);
        },
        format: (value: number) => `${round(value * 100)}%`,
    },
];

/**
 * A detailed set of columns for an incoming damage table.
 */
const INCOMING_DAMAGE_DETAILED_COLUMNS: DetailColumn[] = [
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
    {
        title: `avoid`,
        value: (item) => {
            if (item.type === `ds` || item.type === `heal`) return undefined;
            return item.damage.avoided();
        },
    },
    {
        title: `avoid %`,
        value: (item) => {
            if (item.type === `ds` || item.type === `heal`) return undefined;
            return item.damage.avoided() / item.damage.attempts();
        },
        format: (value: number) => `${round(value * 100)}%`,
    },
];

/**
 * An encounter chart which displays data based on damage done during an encounter, broken down by damage type.
 */
const BreakdownChart = ({
    encounter,
    entity,
    direction,
    columns,
    link,
}: Props & { direction: `incoming` | `outgoing`; columns: DetailColumn[] }) => {
    let e = entity;
    if (isArray(e)) {
        if (e.length === 0) {
            return <></>;
        }
        if (e.length === 1) {
            e = e[0];
        } else {
            // multiple entities
            const items = toDamageBreakdownItems(e, direction, encounter);
            const relation = e.reduce<{
                allies: boolean;
                enemies: boolean;
            }>(
                (acc, val) => {
                    if (val.id !== UNKNOWN_ID) {
                        // don't include unknown entities as allies or enemies
                        acc.allies = acc.allies && !val.isEnemy;
                        acc.enemies = acc.enemies && !!val.isEnemy;
                    }
                    return acc;
                },
                {
                    allies: true,
                    enemies: true,
                },
            );

            const title = (
                <div>{`damage ${direction === `incoming` ? `taken` : `dealt`} by${relation.allies ? ` allies by` : relation.enemies ? ` enemies by` : ``} type`}</div>
            );
            return <DetailChart title={title} items={items} columns={columns} header footer />;
        }
    }

    let title;
    if (link) {
        const index = values(encounter.entities).indexOf(e);
        title = (
            <div>
                {`damage ${direction === `incoming` ? `taken` : `dealt`} by `}
                <HeaderLink>
                    <Link to={`character/${index}`}>{e.name}</Link>
                </HeaderLink>
            </div>
        );
    } else {
        title = <div>{`damage ${direction === `incoming` ? `taken` : `dealt`} by ${e.name}`}</div>;
    }

    const items = toDamageBreakdownItems([e], direction, encounter);

    return <DetailChart title={title} items={items} columns={columns} header footer />;
};

/**
 * An encounter chart which displays data based on damage done during an encounter, broken down by damage type.
 */
export const IncomingDamageBreakdownChart = ({ encounter, entity, link }: Props) => {
    return (
        <BreakdownChart
            encounter={encounter}
            entity={entity}
            columns={INCOMING_DAMAGE_BASIC_COLUMNS}
            direction={`incoming`}
            link={link}
        />
    );
};

/**
 * An encounter chart which displays data based on damage done during an encounter, broken down by damage type.
 */
export const DetailedIncomingDamageBreakdownChart = ({ encounter, entity, link }: Props) => {
    return (
        <BreakdownChart
            encounter={encounter}
            entity={entity}
            columns={INCOMING_DAMAGE_DETAILED_COLUMNS}
            direction={`incoming`}
            link={link}
        />
    );
};

/**
 * A basic set of columns for an outgoing damage table.
 */
const OUTGOING_DAMAGE_BASIC_COLUMNS: DetailColumn[] = [
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

/**
 * Detail columns used for outgoing damage tables.
 */
const OUTGOING_DAMAGE_DETAILED_COLUMNS: DetailColumn[] = [
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
    {
        title: `avoid`,
        value: (item) => {
            if (item.type === `ds` || item.type === `heal`) return undefined;
            return item.damage.avoided();
        },
    },
    {
        title: `avoid %`,
        value: (item) => {
            if (item.type === `ds` || item.type === `heal`) return undefined;
            return item.damage.avoided() / item.damage.attempts();
        },
        format: (value: number) => `${round(value * 100)}%`,
    },
];

/**
 * An encounter chart which displays data based on damage done during an encounter, broken down by damage type.
 */
export const OutgoingDamageBreakdownChart = ({ encounter, entity, link }: Props) => {
    return (
        <BreakdownChart
            encounter={encounter}
            entity={entity}
            columns={OUTGOING_DAMAGE_BASIC_COLUMNS}
            direction={`outgoing`}
            link={link}
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
 * An encounter chart which displays data based on damage done during an encounter, broken down by damage type.
 */
export const DetailedOutgoingDamageBreakdownChart = ({ encounter, entity, link }: Props) => {
    return (
        <BreakdownChart
            encounter={encounter}
            entity={entity}
            columns={OUTGOING_DAMAGE_DETAILED_COLUMNS}
            direction={`outgoing`}
            link={link}
        />
    );
};
