import { observer } from 'mobx-react';
import styled from 'styled-components';
import theme, { ScrollableContent } from '../../theme.tsx';
import { Encounter, toDPSData, Entity } from '@aysi-e/thj-parser-lib';
import { Navigate, useParams } from 'react-router-dom';
import { values } from 'lodash';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Duration } from 'luxon';
import { shortenNumber } from '../../util/numbers.ts';
import {
    DetailedIncomingDamageBreakdownChart,
    DetailedOutgoingDamageBreakdownChart,
} from '../../ui/encounter/charts/DamageBreakdown.tsx';
import {
    DetailedIncomingHealingBreakdownChart,
    DetailedOutgoingHealingBreakdownChart,
} from '../../ui/encounter/charts/HealingBreakdown.tsx';

type Props = {
    encounter: Encounter;
};

/**
 * Component which renders a character detail page.
 */
const CharacterDetailPage = observer(({ encounter }: Props) => {
    // if our id is invalid, get out of here.
    const id = parseInt(useParams().id || '');
    if (isNaN(id) || id >= values(encounter.entities).length)
        return <Navigate to={'../..'} relative={`path`} />;
    const entity = values(encounter.entities)[id];
    return (
        <Container>
            <Header>
                <HeaderText>
                    showing character details for <strong>{entity.name}</strong>
                </HeaderText>
            </Header>
            <ContentContainer>
                <Content>
                    <CharacterDamageTimeline entity={entity} encounter={encounter} />
                    <BreakdownContainer>
                        <DetailedOutgoingDamageBreakdownChart
                            encounter={encounter}
                            entity={entity}
                        />
                        <DetailedIncomingDamageBreakdownChart
                            encounter={encounter}
                            entity={entity}
                        />
                        <DetailedOutgoingHealingBreakdownChart
                            encounter={encounter}
                            entity={entity}
                        />
                        <DetailedIncomingHealingBreakdownChart
                            encounter={encounter}
                            entity={entity}
                        />
                    </BreakdownContainer>
                </Content>
            </ContentContainer>
        </Container>
    );
});

export default CharacterDetailPage;

/**
 * A container component for the character detail page.
 */
const Container = styled.div`
    position: absolute;
    margin-left: -8px;
    height: calc(100% - 32px - 47px);
    width: 100%;
`;

/**
 * Styled content container that handles scrolling
 */
const ContentContainer = styled(ScrollableContent)`
    width: calc(100% - 8px);
    height: calc(100% - 32px);
`;

/**
 * A header component for the character detail page.
 */
const Header = styled.div`
    background-color: ${theme.color.darkerBackground};
    width: 100%;
    color: ${theme.color.white};
    font-family: ${theme.font.header};
    border-bottom: 1px solid ${theme.color.secondary};
    display: flex;
    justify-content: space-between;
`;

/**
 * Styled div for header text.
 */
const HeaderText = styled.div`
    padding: 8px;
`;

/**
 * Styled span for the time text in the header.
 */
const HeaderTime = styled.span`
    font-size: 0.9em;
`;

/**
 * Styled span for the colored text in the header.
 */
const ColoredHeaderText = styled.span<{ $failed: boolean }>`
    font-weight: bold;
    color: ${(props) => (props.$failed ? theme.color.error : theme.color.success)};
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
    const data = toDPSData(encounter.timeline, undefined, undefined, [entity.id]);
    return (
        <EncounterDamageGraphContainer>
            <Header>
                <HeaderText>damage per second dealt by {entity.name}</HeaderText>
            </Header>
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
                    <Line type='monotone' dataKey='dps' stroke='#82ca9d' dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </EncounterDamageGraphContainer>
    );
};

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
 * A styled content div for the character detail page.
 */
const Content = styled.div`
    max-width: 1000px;
    margin: 8px auto;

    color: ${theme.color.white};
    font-family: ${theme.font.header};
`;

/**
 * A container div for the character detail breakdown charts.
 */
const BreakdownContainer = styled.div`
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;
