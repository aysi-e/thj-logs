import { toDPSData } from '@aysi-e/thj-parser-lib';
import { observer } from 'mobx-react';
import { zipWith } from 'lodash';
import styled from 'styled-components';
import theme from '../../theme.tsx';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Duration } from 'luxon';
import { shortenNumber } from '../../util/numbers.ts';
import { useEncounter } from '../../state/encounter.ts';
import { OverallDamageDealtChart } from './charts/ByCharacterChart.tsx';
import { DamageBySourceChart } from './charts/BreakdownChart.tsx';
import { EncounterGraph } from './Common.tsx';

/**
 * Component which displays overview and summary data for an encounter.
 */
const EncounterDamageDone = observer(() => {
    const encounter = useEncounter();
    return (
        <>
            <EncounterGraph title={`damage dealt by allies & enemies`}>
                <DamageTimelineGraph />
            </EncounterGraph>
            <EncounterSummaryContainer>
                <OverallDamageDealtChart
                    title={`damage dealt by allies`}
                    entities={encounter.friends}
                    customize={(item) => ({
                        link: `/encounter/${encounter.id}/character/${item.index}?mode=damage-done`,
                        background: `#4A58A4`,
                    })}
                />
                <OverallDamageDealtChart
                    title={`damage dealt by enemies`}
                    entities={encounter.enemies}
                    customize={(item) => ({
                        link: `/encounter/${encounter.id}/character/${item.index}?mode=damage-done`,
                        background: `#9c4646`,
                    })}
                />
            </EncounterSummaryContainer>
            <EncounterSummaryContainer>
                <DamageBySourceChart
                    title={'damage dealt by allies by source'}
                    entities={encounter.friends}
                />
                <DamageBySourceChart
                    title={'damage dealt by enemies by source'}
                    entities={encounter.enemies}
                />
            </EncounterSummaryContainer>
        </>
    );
});

export default EncounterDamageDone;

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
 * Component which contains a damage done graph for the encounter damage done section.
 *
 * @constructor
 */
const DamageTimelineGraph = () => {
    const encounter = useEncounter();

    const friendsData = toDPSData(
        encounter.timeline,
        undefined,
        undefined,
        encounter.friends.map((it) => it.id),
    );
    const enemyData = toDPSData(
        encounter.timeline,
        undefined,
        undefined,
        encounter.enemies.map((it) => it.id),
    );

    const data = zipWith(friendsData, enemyData, (a, b) => {
        return {
            time: a.time,
            'ally dps': a.dps,
            'enemy dps': b.dps,
        };
    });

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
                    interval={friendsData.length > 450 ? 59 : friendsData.length > 60 ? 29 : 5}
                    tickFormatter={(i) => Duration.fromMillis(i * 1000).toFormat(`m:ss`)}
                />
                <YAxis tickFormatter={(i) => shortenNumber(i)} />
                <Tooltip
                    labelFormatter={(label) => Duration.fromMillis(label * 1000).toFormat(`m:ss`)}
                    contentStyle={{ background: 'black' }}
                />
                <Line type='monotone' dataKey='ally dps' stroke='#82ca9d' dot={false} />
                <Line type='monotone' dataKey='enemy dps' stroke={theme.color.error} dot={false} />
            </LineChart>
        </ResponsiveContainer>
    );
};
