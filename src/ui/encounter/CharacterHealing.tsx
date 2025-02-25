import { EncounterEntityState, useEncounter } from '../../state/encounter.ts';
import { observer } from 'mobx-react';
import { EncounterGraph } from './Common.tsx';
import { HealingBySourceChart } from './charts/BreakdownChart.tsx';
import { DetailColumn } from './charts/DetailChart.tsx';
import { shortenNumber } from '../../util/numbers.ts';
import { round } from 'lodash';
import styled from 'styled-components';
import { toHPSData } from '@aysi-e/thj-parser-lib';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Duration } from 'luxon';
import { HealingByTargetChart, OverallHealingDoneChart } from './charts/ByCharacterChart.tsx';

/**
 * Props accepted by the CharacterHealing component.
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
const CharacterHealing = observer(({ entity }: Props) => {
    return (
        <>
            <EncounterGraph title={`damage per second dealt by ${entity.name}`}>
                <CharacterDamageTimeline entity={entity} />
            </EncounterGraph>
            <EncounterSummaryContainer>
                <HealingBySourceChart
                    title={`healing done by ${entity.name}`}
                    entities={[entity]}
                    columns={HEALING_DETAILED_COLUMNS}
                />
                <HealingByTargetChart
                    title={`healing done by ${entity.name}`}
                    entity={entity}
                    customize={(item) => ({
                        background: item.isEnemy ? `#596215` : `#33622d`,
                        link: `../character/${item.index}?mode=healing`,
                    })}
                />
            </EncounterSummaryContainer>
            <EncounterSummaryContainer>
                <HealingBySourceChart
                    title={`healing taken by ${entity.name}`}
                    entities={[entity]}
                    columns={HEALING_DETAILED_COLUMNS}
                    direction={`incoming`}
                />
                <HealingByTargetChart
                    title={`healing taken by ${entity.name}`}
                    entity={entity}
                    direction={`incoming`}
                    customize={(item) => ({
                        background: item.isEnemy ? `#596215` : `#33622d`,
                        link: `../character/${item.index}?mode=healing`,
                    })}
                />
            </EncounterSummaryContainer>
        </>
    );
});

export default CharacterHealing;

/**
 * A container div for the encounter healing charts.
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
    const data = toHPSData(encounter.timeline, undefined, undefined, [entity.id]);
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
                <Line type='monotone' dataKey='hps' stroke='#82ca9d' dot={false} />
                <Tooltip
                    labelFormatter={(label) => Duration.fromMillis(label * 1000).toFormat(`m:ss`)}
                    contentStyle={{ background: 'black' }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};
/**
 * A detailed set of columns for an incoming healing table.
 */
const HEALING_DETAILED_COLUMNS: DetailColumn[] = [
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
