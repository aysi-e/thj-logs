import { Encounter, Entity, toDPSData } from '@aysi-e/thj-parser-lib';
import { observer } from 'mobx-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import styled from 'styled-components';
import theme from '../../theme.tsx';
import { shortenNumber } from '../../util/numbers.ts';
import { Duration } from 'luxon';
import { DetailedIncomingDamageBreakdownChart } from './charts/DamageBreakdown.tsx';
import { DamageTakenByTargetChart } from './charts/DamageByCharacter.tsx';

/**
 * Props accepted by the CharacterDamageTaken component.
 */
type Props = {
    encounter: Encounter;
    entity: Entity;
};

/**
 * Component which displays overview and summary data for an encounter.
 */
const CharacterDamageTaken = observer(({ encounter, entity }: Props) => {
    return (
        <>
            <CharacterDamageTimeline entity={entity} encounter={encounter} />
            <EncounterSummaryContainer>
                <DetailedIncomingDamageBreakdownChart encounter={encounter} entity={entity} />
            </EncounterSummaryContainer>
            <EncounterSummaryContainer>
                <DamageTakenByTargetChart encounter={encounter} targetId={entity.id} />
            </EncounterSummaryContainer>
        </>
    );
});

export default CharacterDamageTaken;

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
const CharacterDamageTimeline = ({
    entity,
    encounter,
}: {
    entity: Entity;
    encounter: Encounter;
}) => {
    const data = toDPSData(encounter.timeline, undefined, undefined, undefined, [entity.id]);
    return (
        <EncounterDamageGraphContainer>
            <DamageTimelineHeader>
                <HeaderText>damage per second taken by {entity.name}</HeaderText>
            </DamageTimelineHeader>
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
                    <Line type='monotone' dataKey='dps' stroke={theme.color.error} dot={false} />
                    <Tooltip
                        labelFormatter={(label) =>
                            Duration.fromMillis(label * 1000).toFormat(`m:ss`)
                        }
                        contentStyle={{ background: 'black' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </EncounterDamageGraphContainer>
    );
};

const DamageTimelineHeader = styled.div`
    background-color: ${theme.color.darkerGrey};
    width: calc(100% - 16px);
    color: ${theme.color.white};
    font-family: ${theme.font.header};
    border-bottom: 1px solid ${theme.color.secondary};
    display: flex;
    padding: 0 8px;
`;

/**
 * A container div for the character detail timeline.
 */
const EncounterDamageGraphContainer = styled.div`
    height: 300px;
    width: 100%;
    border: ${theme.color.secondary} 1px solid;
    box-sizing: border-box;
    background-color: ${theme.color.darkerBackground};
`;

/**
 * Styled div for header text.
 */
const HeaderText = styled.div`
    padding: 8px 0;
`;
