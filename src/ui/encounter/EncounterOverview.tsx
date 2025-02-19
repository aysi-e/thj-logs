import { Encounter, toDPSData } from '@aysi-e/thj-parser-lib';
import { observer } from 'mobx-react';
import { partition, values, zipWith } from 'lodash';
import styled from 'styled-components';
import theme from '../../theme.tsx';
import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Duration } from 'luxon';
import { shortenNumber } from '../../util/numbers.ts';

/**
 * Props accepted by the EncounterOverview component.
 */
type Props = {
    encounter: Encounter;
};

/**
 * Component which displays overview and summary data for an encounter.
 */
const EncounterOverview = observer(({ encounter }: Props) => {
    const [enemies, friends] = partition(
        values(encounter.entities).filter((it) => it.name !== `Unknown`),
        (it) => it.isEnemy,
    );
    const friendsData = toDPSData(
        encounter.timeline,
        undefined,
        undefined,
        friends.map((it) => it.id),
    );
    const enemyData = toDPSData(
        encounter.timeline,
        undefined,
        undefined,
        enemies.map((it) => it.id),
    );
    const data = zipWith(friendsData, enemyData, (a, b) => {
        return {
            time: a.time,
            'ally dps': a.dps,
            'enemy dps': b.dps,
        };
    });
    return (
        <>
            <OverviewGraphContainer>
                <Header>encounter overview</Header>
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
                        <Line type='monotone' dataKey='ally dps' stroke='#82ca9d' dot={false} />
                        <Line
                            type='monotone'
                            dataKey='enemy dps'
                            stroke={theme.color.error}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </OverviewGraphContainer>
            <EntityContainer>
                <ContentContainer>
                    <Header>allies</Header>
                    <EntityItems>
                        {friends.map((it) => (
                            <EntityItemContainer key={it.id}>{it.name}</EntityItemContainer>
                        ))}
                    </EntityItems>
                </ContentContainer>
                <ContentContainer>
                    <Header>enemies</Header>
                    <EntityItems>
                        {enemies.map((it) => (
                            <EntityItemContainer key={it.id}>{it.name}</EntityItemContainer>
                        ))}
                    </EntityItems>
                </ContentContainer>
            </EntityContainer>
        </>
    );
});

export default EncounterOverview;

/**
 * A header component for the encounter overview page.
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

/**
 * A container div for the character detail timeline.
 */
const OverviewGraphContainer = styled.div`
    height: 300px;
    width: 100%;
    border: ${theme.color.secondary} 1px solid;
    box-sizing: border-box;
    background-color: ${theme.color.darkerBackground};
`;

const EntityContainer = styled.div`
    display: flex;
    width: 100%;
    gap: 8px;
`;

/**
 * A container div for content elements.
 */
const ContentContainer = styled.div`
    margin-top: 8px;
    height: 100px;
    width: calc(50% - 4px);
    border: ${theme.color.secondary} 1px solid;
    background-color: ${theme.color.darkerBackground};
`;

const EntityItems = styled.div`
    display: flex;
`;

const EntityItemContainer = styled.div`
    padding: 8px;
`;
