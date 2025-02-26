import { toDPSData } from '@aysi-e/thj-parser-lib';
import { observer } from 'mobx-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import styled from 'styled-components';
import { shortenNumber } from '../../util/numbers.ts';
import { Duration } from 'luxon';
import { EncounterEntityState, useEncounter } from '../../state/encounter.ts';
import { EncounterGraph } from './Common.tsx';
import { DamageBySourceChart } from './charts/BreakdownChart.tsx';
import { DamageByTargetChart } from './charts/ByCharacterChart.tsx';
import { DetailColumn } from './charts/DetailChart.tsx';
import { round } from 'lodash';

/**
 * Props accepted by the CharacterDamageDone component.
 */
type Props = {
    /**
     * The character.
     */
    entity: EncounterEntityState;
};

/**
 * Component which displays overview and summary data for an encounter.
 */
const CharacterDamageDone = observer(({ entity }: Props) => {
    return (
        <>
            <EncounterGraph title={`damage per second dealt by ${entity.name}`}>
                <CharacterDamageTimeline entity={entity} />
            </EncounterGraph>
            <EncounterSummaryContainer>
                <DamageBySourceChart
                    title={`damage breakdown for ${entity.name}`}
                    entities={[entity]}
                    columns={OUTGOING_DAMAGE_DETAILED_COLUMNS}
                />
            </EncounterSummaryContainer>
            <EncounterSummaryContainer>
                <DamageByTargetChart
                    title={`target breakdown for ${entity.name}`}
                    entity={entity}
                    customize={(item) => ({
                        background: item.isEnemy ? `#9c4646` : `#4A58A4`,
                        link: `../character/${item.index}?mode=damage-taken`,
                    })}
                />
            </EncounterSummaryContainer>
        </>
    );
});

export default CharacterDamageDone;

/**
 * A container div for the encounter damage done charts.
 */
const EncounterSummaryContainer = styled.div`
    margin-top: 8px;
    display: flex;
    justify-content: space-around;
    gap: 8px;
`;

/**
 * A placeholder component for the character damage timeline.
 *
 * @param entity the entity
 * @param encounter the encounter
 * @constructor
 */
const CharacterDamageTimeline = ({ entity }: { entity: EncounterEntityState }) => {
    const encounter = useEncounter();
    const data = toDPSData(encounter.timeline, undefined, undefined, [entity.id]);
    return (
        <ResponsiveContainer width='100%' height={270}>
            <LineChart
                data={data}
                margin={{
                    top: 16,
                    right: 12,
                    left: -4,
                    bottom: 0,
                }}
            >
                <XAxis
                    dataKey='time'
                    interval={data.length > 450 ? 59 : data.length > 60 ? 29 : 5}
                    tickFormatter={(i) => Duration.fromMillis(i * 1000).toFormat(`m:ss`)}
                />
                <YAxis tickFormatter={(i) => shortenNumber(i)} />
                <Line type='monotone' dataKey='dps' stroke='#70bfff' dot={false} />
                <Tooltip
                    labelFormatter={(label) => Duration.fromMillis(label * 1000).toFormat(`m:ss`)}
                    contentStyle={{ background: 'black' }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

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
