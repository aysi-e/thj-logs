import { HandlerEvent, toDPSData, toHPSData } from '@aysi-e/thj-parser-lib';
import { observer } from 'mobx-react';
import { zipWith } from 'lodash';
import styled from 'styled-components';
import theme from '../../theme.tsx';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DateTime, Duration, Interval } from 'luxon';
import { shortenNumber } from '../../util/numbers.ts';
import { EncounterEntityState, useEncounter } from '../../state/encounter.ts';
import { EncounterGraph } from './Common.tsx';
import { Box } from '../Common.tsx';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { SelectButton } from '../SelectButton.tsx';
import { EventLog } from './EncounterEventLog.tsx';

/**
 * Props accepted by the CharacterEventLog component.
 */
type Props = {
    /**
     * The character.
     */
    entity: EncounterEntityState;
};

/**
 * Component which displays event log data for a character during an encounter.
 */
const CharacterEventLog = observer((props: Props) => {
    const filter = (event: HandlerEvent) => {
        if (event.type === `zone`) return false;
        if (event.type === `death`)
            return event.killerId === props.entity.id || event.killedId === props.entity.id;
        return event.targetId === props.entity.id || event.sourceId === props.entity.id;
    };
    return (
        <>
            <EncounterGraph title={`damage and healing done for ${props.entity.name}`}>
                <CharacterDamageTimeline entity={props.entity} />
            </EncounterGraph>
            <EncounterSummaryContainer>
                <StyledEventLog title={`events for ${props.entity.name}`} filter={filter} />
            </EncounterSummaryContainer>
        </>
    );
});

export default CharacterEventLog;

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
 * An event log component with a max height suitable for the character page.
 */
const StyledEventLog = styled(EventLog)`
    max-height: calc(100vh - 300px - 80px - 50px - 29px - 16px);
`;

/**
 * Component which contains a damage done graph for the encounter damage done section.
 *
 * @constructor
 */
const CharacterDamageTimeline = (props: Props) => {
    const encounter = useEncounter();

    const dpsData = toDPSData(encounter.timeline, undefined, undefined, [props.entity.id]);
    const hpsData = toHPSData(encounter.timeline, undefined, undefined, [props.entity.id]);

    const data = zipWith(dpsData, hpsData, (a, b) => {
        return {
            time: a.time,
            'damage dealt': a.dps,
            'healing done': b.hps,
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
                    interval={dpsData.length > 450 ? 59 : dpsData.length > 60 ? 29 : 5}
                    tickFormatter={(i) => Duration.fromMillis(i * 1000).toFormat(`m:ss`)}
                />
                <YAxis tickFormatter={(i) => shortenNumber(i)} />
                <Tooltip
                    labelFormatter={(label) => Duration.fromMillis(label * 1000).toFormat(`m:ss`)}
                    contentStyle={{ background: 'black' }}
                />
                <Line type='monotone' dataKey='damage dealt' stroke={`#70bfff`} dot={false} />
                <Line type='monotone' dataKey='healing done' stroke={`#82ca9d`} dot={false} />
            </LineChart>
        </ResponsiveContainer>
    );
};
