import { toHPSData } from '@aysi-e/thj-parser-lib';
import { observer } from 'mobx-react';
import { zipWith } from 'lodash';
import styled from 'styled-components';
import { useEncounter } from '../../state/encounter.ts';
import { EncounterGraph } from './Common.tsx';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Duration } from 'luxon';
import { shortenNumber } from '../../util/numbers.ts';
import {
    OverallHealingDoneChart,
    OverallHealingReceivedChart,
} from './charts/ByCharacterChart.tsx';

/**
 * Component which displays overview and summary data for an encounter.
 */
const EncounterHealing = observer(() => {
    const encounter = useEncounter();

    return (
        <>
            <EncounterGraph title={`healing by allies & enemies`}>
                <HealingTimelineGraph />
            </EncounterGraph>
            <EncounterSummaryContainer>
                <OverallHealingDoneChart
                    title={`healing done by allies`}
                    entities={encounter.friends}
                    customize={(item) => ({
                        link: `/encounter/${encounter.id}/character/${item.index}?mode=healing`,
                        background: `#33622d`,
                    })}
                />
                <OverallHealingDoneChart
                    title={`healing done by enemies`}
                    entities={encounter.enemies}
                    customize={(item) => ({
                        link: `/encounter/${encounter.id}/character/${item.index}?mode=healing`,
                        background: `#596215`,
                    })}
                />
            </EncounterSummaryContainer>
            <EncounterSummaryContainer>
                <OverallHealingReceivedChart
                    title={`healing received by allies`}
                    entities={encounter.friends}
                    customize={(item) => ({
                        link: `/encounter/${encounter.id}/character/${item.index}?mode=healing`,
                        background: `#33622d`,
                    })}
                />
                <OverallHealingReceivedChart
                    title={`healing received by enemies`}
                    entities={encounter.enemies}
                    customize={(item) => ({
                        link: `/encounter/${encounter.id}/character/${item.index}?mode=healing`,
                        background: `#596215`,
                    })}
                />
            </EncounterSummaryContainer>
        </>
    );
});

export default EncounterHealing;

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
 * Component which contains a damage done graph for the encounter damage done section.
 *
 * @constructor
 */
const HealingTimelineGraph = () => {
    const encounter = useEncounter();

    const friendsData = toHPSData(
        encounter.timeline,
        undefined,
        undefined,
        encounter.friends.map((it) => it.id),
    );
    const enemyData = toHPSData(
        encounter.timeline,
        undefined,
        undefined,
        encounter.enemies.map((it) => it.id),
    );

    const data = zipWith(friendsData, enemyData, (a, b) => {
        return {
            time: a.time,
            'ally hps': a.hps,
            'enemy hps': b.hps,
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
                <Line type='monotone' dataKey='ally hps' stroke='#82ca9d' dot={false} />
                <Line type='monotone' dataKey='enemy hps' stroke={`#ffba6c`} dot={false} />
            </LineChart>
        </ResponsiveContainer>
    );
};
