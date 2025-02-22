import { Encounter, toDPSData } from '@aysi-e/thj-parser-lib';
import { observer } from 'mobx-react';
import { isEmpty, map, partition, size, values, zipWith } from 'lodash';
import styled from 'styled-components';
import theme from '../../theme.tsx';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Duration } from 'luxon';
import { shortenNumber } from '../../util/numbers.ts';
import { UI_WARNING, UIIcon } from '../Icon.tsx';
import { Link } from 'react-router-dom';

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
            <EncounterWarnings encounter={encounter} />
            <EntityContainer>
                <ContentContainer>
                    <Header>allies</Header>
                    <EntityItems>
                        {friends.map((it) => {
                            const index = values(encounter.entities).indexOf(it);
                            return (
                                <Link to={`character/${index}?mode=overview`} key={it.id}>
                                    <EntityItemContainer>
                                        <div>{it.name}</div>
                                    </EntityItemContainer>
                                </Link>
                            );
                        })}
                    </EntityItems>
                </ContentContainer>
                <ContentContainer>
                    <Header>enemies</Header>
                    <EntityItems>
                        {enemies.map((it) => {
                            const index = values(encounter.entities).indexOf(it);
                            return (
                                <Link to={`character/${index}?mode=overview`} key={it.id}>
                                    <EntityItemContainer>
                                        <div>{it.name}</div>
                                    </EntityItemContainer>
                                </Link>
                            );
                        })}
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
 * A container div for the encounter overview timeline graph.
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
    width: calc(50% - 4px);
    border: ${theme.color.secondary} 1px solid;
    background-color: ${theme.color.darkerBackground};
`;

const EntityItems = styled.div`
    display: flex;
    padding: 8px;
    flex-wrap: wrap;
    gap: 8px;
`;

const EntityItemContainer = styled.div`
    padding: 8px;
    border: ${theme.color.secondary} 1px solid;
    background-color: ${theme.color.darkerBackground};
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;

    &:hover {
        background: rgba(255, 255, 255, 0.25);
    }

    &:active {
        background: rgba(0, 0, 0, 0.25);
    }
`;

const EncounterWarnings = ({ encounter }: Props) => {
    if (isEmpty(encounter.warnings)) return <></>;
    const title = `${size(encounter.warnings)} ${size(encounter.warnings) === 1 ? `warning` : `warnings`}`;
    return (
        <EncounterWarningContainer>
            {map(encounter.warnings, (value, key) => (
                <EncounterWarningItem key={key}>
                    <UIIcon height={15} width={15} path={UI_WARNING} />
                    <span>
                        warning: {value.message} ({value.count}{' '}
                        {value.count === 1 ? `time` : `times`})
                    </span>
                </EncounterWarningItem>
            ))}
        </EncounterWarningContainer>
    );
};

const EncounterWarningContainer = styled.div`
    margin-top: 8px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 4px;
`;
const EncounterWarningItem = styled.div`
    background-color: #655d3e;
    color: ${theme.color.white};
    font-family: ${theme.font.header};
    border: ${theme.color.secondary} 1px solid;
    display: flex;
    padding: 8px;
    gap: 8px;
    text-decoration: underline dotted;
    cursor: pointer;
`;
