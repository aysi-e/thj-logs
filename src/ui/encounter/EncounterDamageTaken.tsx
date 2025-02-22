import { Encounter, toDPSData } from '@aysi-e/thj-parser-lib';
import { observer } from 'mobx-react';
import { partition, values, zipWith } from 'lodash';
import styled from 'styled-components';
import theme from '../../theme.tsx';
import { DamageTakenChart } from './charts/DamageByCharacter.tsx';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Duration } from 'luxon';
import { shortenNumber } from '../../util/numbers.ts';
import {
    IncomingDamageBreakdownChart,
    OutgoingDamageBreakdownChart,
} from './charts/DamageBreakdown.tsx';

/**
 * Props accepted by the EncounterDamageTaken component.
 */
type Props = {
    encounter: Encounter;
};

/**
 * Component which displays overview and summary data for an encounter.
 */
const EncounterDamageTaken = observer(({ encounter }: Props) => {
    const [enemies, friends] = partition(values(encounter.entities), (it) => it.isEnemy);

    const friendsData = toDPSData(
        encounter.timeline,
        undefined,
        undefined,
        undefined,
        friends.map((it) => it.id),
    );
    const enemyData = toDPSData(
        encounter.timeline,
        undefined,
        undefined,
        undefined,
        enemies.map((it) => it.id),
    );

    const data = zipWith(friendsData, enemyData, (a, b) => {
        return {
            time: a.time,
            'ally dtps': a.dps,
            'enemy dtps': b.dps,
        };
    });

    return (
        <>
            <OverviewGraphContainer>
                <Header>damage taken by allies & enemies</Header>
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
                            interval={
                                friendsData.length > 450 ? 59 : friendsData.length > 60 ? 29 : 5
                            }
                            tickFormatter={(i) => Duration.fromMillis(i * 1000).toFormat(`m:ss`)}
                        />
                        <YAxis tickFormatter={(i) => shortenNumber(i)} />
                        <Tooltip
                            labelFormatter={(label) =>
                                Duration.fromMillis(label * 1000).toFormat(`m:ss`)
                            }
                            contentStyle={{ background: 'black' }}
                        />
                        <Line type='monotone' dataKey='ally dtps' stroke='#82ca9d' dot={false} />
                        <Line
                            type='monotone'
                            dataKey='enemy dtps'
                            stroke={theme.color.error}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </OverviewGraphContainer>
            <EncounterSummaryContainer>
                <DamageTakenChart encounter={encounter} entities={friends} />
                <DamageTakenChart encounter={encounter} entities={enemies} />
            </EncounterSummaryContainer>
            <EncounterSummaryContainer>
                <IncomingDamageBreakdownChart encounter={encounter} entity={friends} link />
                <IncomingDamageBreakdownChart encounter={encounter} entity={enemies} link />
            </EncounterSummaryContainer>
        </>
    );
});

export default EncounterDamageTaken;

/**
 * A container div for the encounter damage taken charts.
 */
const EncounterSummaryContainer = styled.div`
    margin-top: 8px;
    display: flex;
    justify-content: space-around;
    gap: 8px;
`;

/**
 * A container div for the encounter damage taken timeline graph.
 */
const OverviewGraphContainer = styled.div`
    height: 300px;
    width: 100%;
    border: ${theme.color.secondary} 1px solid;
    box-sizing: border-box;
    background-color: ${theme.color.darkerBackground};
`;

/**
 * A header component for the encounter damage taken page.
 */
const Header = styled.div`
    background-color: ${theme.color.darkerGrey};
    width: calc(100% - 16px);
    color: ${theme.color.white};
    font-family: ${theme.font.header};
    border-bottom: 1px solid ${theme.color.secondary};
    display: flex;
    justify-content: space-between;
    padding: 8px;
`;
