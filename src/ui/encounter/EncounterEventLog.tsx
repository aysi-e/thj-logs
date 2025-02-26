import { HandlerEvent, toDPSData, toHPSData } from '@aysi-e/thj-parser-lib';
import { observer } from 'mobx-react';
import { zipWith } from 'lodash';
import styled from 'styled-components';
import theme, { ComponentProps } from '../../theme.tsx';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DateTime, Duration, Interval } from 'luxon';
import { shortenNumber } from '../../util/numbers.ts';
import { EncounterEntityState, useEncounter } from '../../state/encounter.ts';
import { EncounterGraph } from './Common.tsx';
import { Box } from '../Common.tsx';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { SelectButton } from '../SelectButton.tsx';

/**
 * Component which displays overview and summary data for an encounter.
 */
const EncounterEventLog = observer(() => {
    return (
        <>
            <EncounterGraph title={`encounter overview`}>
                <DamageTimelineGraph />
            </EncounterGraph>
            <EncounterSummaryContainer>
                <EventLog title={`event log for encounter`} />
            </EncounterSummaryContainer>
        </>
    );
});

export default EncounterEventLog;

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

    const friendsHPSData = toHPSData(
        encounter.timeline,
        undefined,
        undefined,
        encounter.friends.map((it) => it.id),
    );
    const enemyHPSData = toHPSData(
        encounter.timeline,
        undefined,
        undefined,
        encounter.enemies.map((it) => it.id),
    );

    const data = zipWith(friendsData, enemyData, friendsHPSData, enemyHPSData, (a, b, c, d) => {
        return {
            time: a.time,
            'ally dps': a.dps,
            'enemy dps': b.dps,
            'ally hps': c.hps,
            'enemy hps': d.hps,
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
                <Line type='monotone' dataKey='ally dps' stroke={`#70bfff`} dot={false} />
                <Line type='monotone' dataKey='enemy dps' stroke={theme.color.error} dot={false} />
                <Line type='monotone' dataKey='ally hps' stroke={`#82ca9d`} dot={false} />
            </LineChart>
        </ResponsiveContainer>
    );
};

/**
 * Props accepted by the EventLog component.
 */
type EventLogProps = {
    /**
     * The title to use for this event log.
     */
    title: string;

    /**
     * A filter function to apply to the event log.
     *
     * @param event the event to filter
     */
    filter?: (event: HandlerEvent) => boolean;
};

/**
 * An event log component for an encounter.
 *
 * @constructor
 */
export const EventLog = (props: EventLogProps & ComponentProps) => {
    const encounter = useEncounter();
    const [end, setEnd] = useState(500);
    const filter = props.filter ? props.filter : () => true;
    const events = encounter.events.filter(filter);
    return (
        <EventBox background={`secondary`} header={props.title} className={props.className}>
            <EventItemContainer>
                {events.slice(0, end).map((event, index) => (
                    <EventItem event={event} index={index} key={index} />
                ))}
                {end < events.length ? (
                    <LoadNext onClick={() => setEnd(end + 1000)}>load more events</LoadNext>
                ) : null}
            </EventItemContainer>
        </EventBox>
    );
};

/**
 * Container div for the event log.
 */
const EventBox = styled(Box)`
    max-height: calc(100vh - 300px - 80px - 50px - 29px);
    width: 1000px;
`;

/**
 * Container div for the event items.
 */
const EventItemContainer = styled.div`
    background: ${theme.color.darkerBackground};

    overflow-y: scroll;
    scrollbar-color: rgba(0, 0, 0, 0.5) ${theme.color.darkerBackground};

    ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }

    ::-webkit-scrollbar-thumb {
        /* Foreground */
        background: rgba(0, 0, 0, 0.5);
    }

    ::-webkit-scrollbar-track {
        /* Background */
        background: ${theme.color.darkerBackground};
    }
`;

/**
 * An event item which.
 */
const EventItem = ({ event, index }: { event: HandlerEvent; index: number }) => {
    const encounter = useEncounter();
    const time = Interval.fromDateTimes(encounter.start, DateTime.fromMillis(event.timestamp))
        .toDuration()
        .toFormat(`m:ss`);
    const elements = [];
    switch (event.type) {
        case 'zone':
            break;
        case 'meleehit':
            elements.push(
                <EventEntity
                    key={`${index}-source`}
                    entity={encounter.getEntityById(event.sourceId)}
                    mode={`damage-done`}
                />,
                <EventText key={`${index}-type`}>{event.damageType}</EventText>,
                <EventEntity
                    key={`${index}-target`}
                    entity={encounter.getEntityById(event.targetId)}
                    mode={`damage-taken`}
                />,
                <EventText
                    key={`${index}-amount`}
                >{`(${event.amount}${event.criticalType ? `, critical` : ``})`}</EventText>,
            );
            break;
        case 'meleemiss':
            elements.push(
                <EventEntity
                    key={`${index}-source`}
                    entity={encounter.getEntityById(event.sourceId)}
                    mode={`damage-done`}
                />,
                <EventText key={`${index}-type`}>{event.damageType}</EventText>,
                <EventEntity
                    key={`${index}-target`}
                    entity={encounter.getEntityById(event.targetId)}
                    mode={`damage-taken`}
                />,
                <EventText key={`${index}-amount`}>{`(${event.missType})`}</EventText>,
            );
            break;
        case 'spellhit':
            elements.push(
                <EventEntity
                    key={`${index}-source`}
                    entity={encounter.getEntityById(event.sourceId)}
                    mode={`damage-done`}
                />,
                <EventText $color={`#8ce1ff`} key={`${index}-type`}>
                    {event.spellName}
                </EventText>,
                <EventEntity
                    key={`${index}-target`}
                    entity={encounter.getEntityById(event.targetId)}
                    mode={`damage-taken`}
                />,
                <EventText
                    key={`${index}-amount`}
                >{`(${event.amount}${event.isCritical ? `, critical` : ``})`}</EventText>,
            );
            break;
        case 'spellmiss':
            elements.push(
                <EventEntity
                    key={`${index}-source`}
                    entity={encounter.getEntityById(event.sourceId)}
                    mode={`damage-done`}
                />,
                <EventText $color={`#8ce1ff`} key={`${index}-type`}>
                    {event.spellName}
                </EventText>,
                <EventEntity
                    key={`${index}-target`}
                    entity={encounter.getEntityById(event.targetId)}
                    mode={`damage-taken`}
                />,
                <EventText key={`${index}-amount`}>{`(resisted)`}</EventText>,
            );
            break;
        case 'damageshield':
            elements.push(
                <EventEntity
                    key={`${index}-source`}
                    entity={encounter.getEntityById(event.sourceId)}
                    mode={`damage-done`}
                />,
                <EventText $color={`#8ce1ff`} key={`${index}-type`}>
                    {event.description.length ? event.description : `(damage shield)`}
                </EventText>,
                <EventEntity
                    key={`${index}-target`}
                    entity={encounter.getEntityById(event.targetId)}
                    mode={`damage-taken`}
                />,
                <EventText key={`${index}-amount`}>{`(${event.amount})`}</EventText>,
            );
            break;
        case 'heal':
            elements.push(
                <EventEntity
                    key={`${index}-source`}
                    entity={encounter.getEntityById(event.sourceId)}
                    mode={`healing`}
                />,
                <EventText $color={`#a0e796`} key={`${index}-type`}>
                    {event.spellName}
                </EventText>,
                <EventEntity
                    key={`${index}-target`}
                    entity={encounter.getEntityById(event.targetId)}
                    mode={`healing`}
                />,
                <EventText key={`${index}-amount`}>{`(+${event.amount})`}</EventText>,
            );
            break;
        case 'absorb':
            elements.push(
                <EventEntity
                    key={`${index}-source`}
                    entity={encounter.getEntityById(event.sourceId)}
                    mode={`healing`}
                />,
                <EventText $color={`#fff98e`} key={`${index}-type`}>
                    {event.spellName}
                </EventText>,
                <EventEntity
                    key={`${index}-target`}
                    entity={encounter.getEntityById(event.targetId)}
                    mode={`healing`}
                />,
                <EventText key={`${index}-amount`}>{`(+${event.amount} absorb)`}</EventText>,
            );
            break;
        case 'death':
            elements.push(
                <EventEntity
                    key={`${index}-source`}
                    entity={encounter.getEntityById(event.killedId)}
                    mode={`deaths`}
                />,
                <EventText key={`${index}-type`}>{`killed by`}</EventText>,
                <EventEntity
                    key={`${index}-target`}
                    entity={encounter.getEntityById(event.killerId)}
                    mode={`damage-done`}
                />,
            );
            break;
    }

    return (
        <EventItemContent $index={index}>
            <EventTime>{time}</EventTime>
            {elements}
        </EventItemContent>
    );
};

const EventItemContent = styled.div<{ $index: number }>`
    padding: 4px;
    display: flex;
    gap: 4px;

    background: ${(props) =>
        props.$index % 2 ? theme.color.darkerGrey : theme.color.darkerBackground};

    &:hover {
        background: ${theme.color.selected};
    }
`;

const EventTime = styled.div`
    padding: 4px;
    font-size: 0.9em;
`;

const EventText = styled.div<{ $color?: string }>`
    color: ${(props) => props.$color};
    padding: 4px;
    line-height: 1em;
`;

const EventEntity = ({ entity, mode }: { entity: EncounterEntityState; mode?: string }) => {
    const encounter = useEncounter();
    const color = entity.isEnemy ? theme.color.error : `#b6d1ff`;
    return (
        <EventLink
            $color={color}
            to={`/encounter/${encounter.id}/character/${entity.index}?mode=${mode}`}
        >
            <EventText>{entity.name}</EventText>
        </EventLink>
    );
};

const EventLink = styled(Link)<{ $color?: string }>`
    color: ${(props) => props.$color || `#b6d1ff`};
    font-weight: bold;
    text-decoration: underline dotted;

    &:hover {
        background-color: rgba(0, 0, 0, 0.25);
    }

    &:active {
        background-color: rgba(0, 0, 0, 0.5);
    }
`;

const LoadNext = styled(SelectButton)`
    font-size: 1em;
    width: 100%;
`;
