import { assign, round } from 'lodash';
import { EncounterEntityState, useEncounter } from '../../../state/encounter.ts';
import DamageMeter, { MeterColumn, MeterItem } from './DamageMeter.tsx';
import { shortenNumber } from '../../../util/numbers.ts';

//
// module containing charts where the line items are characters
//

type Props = {
    /**
     * The title for this damage dealt chart.
     */
    title: string;

    /**
     * The entities that should be included in the damage dealt chart.
     */
    entities: EncounterEntityState[];

    /**
     * A function that customizes meter items.
     *
     * @param item the item to customize
     */
    customize?: (item: EncounterEntityState) => {
        link?: string;
        background?: string;
        color?: string;
    };

    /**
     * The columns to render for this damage dealt chart.
     */
    columns?: MeterColumn[];

    /**
     * Should we render breakdown data as tooltips?
     */
    breakdownTooltips?: boolean;
};

/**
 * A chart that ranks each provided entity according to their overall damage during the encounter.
 *
 * @param props the props accepted by the overall damage dealt chart
 * @constructor
 */
export const OverallDamageDealtChart = (props: Props) => {
    const encounter = useEncounter();

    // calculate the total damage done for the entities that we're charting.
    const total = props.entities.reduce((acc, val) => acc + val.damageDealt(), 0);

    // a customize function for the meter items.
    const customize = props.customize ? props.customize : (e: EncounterEntityState) => ({});

    /**
     * Given an entity, return a meter item.
     *
     * @param entity the entity
     */
    const toMeterItem = (entity: EncounterEntityState): MeterItem => {
        const name = entity.isPet
            ? `${entity.name} (${entity.owner?.name || `unknown`})`
            : entity.name;
        const tooltip = props.breakdownTooltips ? (
            <DamageByTargetChart
                title={`damage by target`}
                entity={entity}
                isTooltip
                limit={3}
                customize={(item) => ({
                    background: item.isEnemy ? `#9c4646` : `#4A58A4`,
                })}
            />
        ) : null;
        return assign(customize(entity), {
            entity,
            value: entity.damageDealt(),
            displayName: name || `Unknown`,
            index: entity.index,
            perSecond: entity.damageDealt() / encounter.duration.as('seconds'),
            percent: (entity.damageDealt() / total) * 100,
            tooltip,
        });
    };

    // the columns to use for this chart.
    const columns = props.columns ? props.columns : DAMAGE_METER_DEFAULT_COLUMNS;

    return (
        <DamageMeter
            title={props.title}
            items={props.entities.map((it) => toMeterItem(it)).filter((it) => it.value > 0)}
            columns={columns}
            header
            footer
        />
    );
};

/**
 * A chart that ranks each provided entity according to their overall damage taken during the encounter.
 *
 * @param props the props accepted by the overall damage taken chart
 * @constructor
 */
export const OverallDamageTakenChart = (props: Props) => {
    const encounter = useEncounter();

    // calculate the total damage done for the entities that we're charting.
    const total = props.entities.reduce((acc, val) => acc + val.damageTaken(), 0);

    // a customize function for the meter items.
    const customize = props.customize ? props.customize : (e: EncounterEntityState) => ({});

    /**
     * Given an entity, return a meter item.
     *
     * @param entity the entity
     */
    const toMeterItem = (entity: EncounterEntityState): MeterItem => {
        const name = entity.isPet
            ? `${entity.name} (${entity.owner?.name || `unknown`})`
            : entity.name;
        return assign(customize(entity), {
            entity,
            value: entity.damageTaken(),
            displayName: name || `Unknown`,
            index: entity.index,
            perSecond: entity.damageTaken() / encounter.duration.as('seconds'),
            percent: (entity.damageTaken() / total) * 100,
        });
    };

    // the columns to use for this chart.
    const columns = props.columns ? props.columns : DAMAGE_METER_DEFAULT_COLUMNS;

    return (
        <DamageMeter
            title={props.title}
            items={props.entities.map((it) => toMeterItem(it)).filter((it) => it.value > 0)}
            columns={columns}
            header
            footer
        />
    );
};

/**
 * A basic set of columns for an outgoing damage meter table.
 */
const DAMAGE_METER_DEFAULT_COLUMNS: MeterColumn[] = [
    {
        title: `%`,
        value: (item) => item.percent,
        format: (value: number) => `${round(value, 1)}%`,
        total: '100%',
    },
    {
        title: `total`,
        value: (item) => item.value,
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
 * Props accepted by the DamageByTargetChart component.
 */
type DamageByTargetProps = {
    /**
     * The title for this damage chart.
     */
    title: string;

    /**
     * The entity that is dealing damage.
     */
    entity: EncounterEntityState;

    /**
     * Should we display incoming or outgoing damage?
     */
    direction?: `incoming` | `outgoing`;

    /**
     * A function that customizes meter items.
     *
     * @param item the item to customize
     */
    customize?: (item: EncounterEntityState) => {
        link?: string;
        background?: string;
        color?: string;
    };

    /**
     * The columns to render for this damage dealt chart.
     */
    columns?: MeterColumn[];

    /**
     * Is this chart being displayed as a tooltip?
     */
    isTooltip?: boolean;

    /**
     * The maximum number of rows to display.
     */
    limit?: number;
};

/**
 * A chart which displays damage from a single entity, broken down by target.
 *
 * @param props the props accepted by the damage by target chart.
 * @constructor
 */
export const DamageByTargetChart = (props: DamageByTargetProps) => {
    const encounter = useEncounter();

    // is this a damage dealt or damage taken chart?
    const direction = props.direction || `outgoing`;

    // the total damage.
    const total = encounter.characters.reduce(
        (acc, val) =>
            acc +
            (direction === `outgoing`
                ? props.entity.damageDealtTo(val.id)
                : props.entity.damageTakenFrom(val.id)),
        0,
    );
    // a customize function for the meter items.
    const customize = props.customize ? props.customize : (e: EncounterEntityState) => ({});
    /**
     * Given an entity, return a meter item.
     *
     * @param entity the entity
     */
    const toMeterItem = (entity: EncounterEntityState): MeterItem => {
        const name = entity.isPet
            ? `${entity.name} (${entity.owner?.name || `unknown`})`
            : entity.name;
        const value =
            direction === `outgoing`
                ? props.entity.damageDealtTo(entity.id)
                : props.entity.damageTakenFrom(entity.id);
        return assign(customize(entity), {
            entity,
            value: value,
            displayName: name || `Unknown`,
            index: entity.index,
            perSecond: value / encounter.duration.as('seconds'),
            percent: (value / total) * 100,
        });
    };
    const items = encounter.characters
        .map((it) => toMeterItem(it))
        .filter((it) => it.value > 0)
        .sort((a, b) => b.value - a.value);

    // the columns to use for this chart.
    const columns = props.columns ? props.columns : DAMAGE_METER_DEFAULT_COLUMNS;

    return (
        <DamageMeter
            title={props.title}
            items={props.limit ? items.slice(0, props.limit) : items}
            columns={columns}
            header
            footer
            isTooltip={props.isTooltip}
        />
    );
};

/**
 * A chart that ranks each provided entity according to their overall healing during the encounter.
 *
 * @param props the props accepted by the overall healing done chart
 * @constructor
 */
export const OverallHealingDoneChart = (props: Props) => {
    const encounter = useEncounter();

    // calculate the total damage done for the entities that we're charting.
    const total = props.entities.reduce((acc, val) => acc + val.healingDone(), 0);

    // a customize function for the meter items.
    const customize = props.customize ? props.customize : (e: EncounterEntityState) => ({});

    /**
     * Given an entity, return a meter item.
     *
     * @param entity the entity
     */
    const toMeterItem = (entity: EncounterEntityState): MeterItem => {
        const name = entity.isPet
            ? `${entity.name} (${entity.owner?.name || `unknown`})`
            : entity.name;
        return assign(
            {
                entity,
                value: entity.healingDone(),
                displayName: name || `Unknown`,
                index: entity.index,
                perSecond: entity.healingDone() / encounter.duration.as('seconds'),
                percent: (entity.healingDone() / total) * 100,
            },
            customize(entity),
        );
    };

    // the columns to use for this chart.
    const columns = props.columns ? props.columns : HEALING_METER_DEFAULT_COLUMNS;
    const items = props.entities.map((it) => toMeterItem(it));

    return (
        <DamageMeter
            title={props.title}
            items={items.filter((it) => it.value > 0)}
            columns={columns}
            header
            footer
        />
    );
};

/**
 * A basic set of columns for a healing meter table.
 */
const HEALING_METER_DEFAULT_COLUMNS: MeterColumn[] = [
    {
        title: `%`,
        value: (item) => item.percent,
        format: (value: number) => `${round(value, 1)}%`,
        total: '100%',
    },
    {
        title: `total`,
        value: (item) => item.value,
        format: (value: number) => shortenNumber(value),
        total: true,
    },
    {
        title: `hps`,
        value: (item) => item.perSecond,
        format: (value: number) => round(value).toLocaleString(),
        total: true,
    },
];

/**
 * A chart that ranks each provided entity according to their overall healing received during the encounter.
 *
 * @param props the props accepted by the overall healing done chart
 * @constructor
 */
export const OverallHealingReceivedChart = (props: Props) => {
    const encounter = useEncounter();

    // calculate the total damage done for the entities that we're charting.
    const total = props.entities.reduce((acc, val) => acc + val.healingReceived(), 0);

    // a customize function for the meter items.
    const customize = props.customize ? props.customize : (e: EncounterEntityState) => ({});

    /**
     * Given an entity, return a meter item.
     *
     * @param entity the entity
     */
    const toMeterItem = (entity: EncounterEntityState): MeterItem => {
        const name = entity.isPet
            ? `${entity.name} (${entity.owner?.name || `unknown`})`
            : entity.name;
        return assign(
            {
                entity,
                value: entity.healingReceived(),
                displayName: name || `Unknown`,
                index: entity.index,
                perSecond: entity.healingReceived() / encounter.duration.as('seconds'),
                percent: (entity.healingReceived() / total) * 100,
            },
            customize(entity),
        );
    };

    // the columns to use for this chart.
    const columns = props.columns ? props.columns : HEALING_METER_DEFAULT_COLUMNS;
    const items = props.entities.map((it) => toMeterItem(it));

    return (
        <DamageMeter
            title={props.title}
            items={items.filter((it) => it.value > 0)}
            columns={columns}
            header
            footer
        />
    );
};

/**
 * A chart which displays healing from a single entity, broken down by target.
 *
 * @param props the props accepted by the healing by target chart.
 * @constructor
 */
export const HealingByTargetChart = (props: DamageByTargetProps) => {
    const encounter = useEncounter();

    // is this a damage dealt or damage taken chart?
    const direction = props.direction || `outgoing`;

    // the total damage.
    const total = encounter.characters.reduce(
        (acc, val) =>
            acc +
            (direction === `outgoing`
                ? props.entity.healingDoneTo(val.id)
                : props.entity.healingReceivedFrom(val.id)),
        0,
    );
    // a customize function for the meter items.
    const customize = props.customize ? props.customize : (e: EncounterEntityState) => ({});
    /**
     * Given an entity, return a meter item.
     *
     * @param entity the entity
     */
    const toMeterItem = (entity: EncounterEntityState): MeterItem => {
        const name = entity.isPet
            ? `${entity.name} (${entity.owner?.name || `unknown`})`
            : entity.name;
        const value =
            direction === `outgoing`
                ? props.entity.healingDoneTo(entity.id)
                : props.entity.healingReceivedFrom(entity.id);
        return assign(customize(entity), {
            entity,
            value: value,
            displayName: name || `Unknown`,
            index: entity.index,
            perSecond: value / encounter.duration.as('seconds'),
            percent: (value / total) * 100,
        });
    };

    const items = encounter.characters
        .map((it) => toMeterItem(it))
        .filter((it) => it.value > 0)
        .sort((a, b) => b.value - a.value);

    // the columns to use for this chart.
    const columns = props.columns ? props.columns : HEALING_METER_DEFAULT_COLUMNS;

    return (
        <DamageMeter
            title={props.title}
            items={props.limit ? items.slice(0, props.limit) : items}
            columns={columns}
            header
            footer
            isTooltip={props.isTooltip}
        />
    );
};
