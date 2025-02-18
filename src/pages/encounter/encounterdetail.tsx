import { observer } from 'mobx-react';
import { useContext } from 'react';
import { LogContext } from '../../state/log.ts';
import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom';
import styled from 'styled-components';
import theme, { ScrollableContent } from '../../theme.tsx';
import { map, partition, size, values } from 'lodash';
import { DateTime, Duration } from 'luxon';
import { Encounter, toDPSData } from '@aysie/thj-parser-lib';
import CharacterDetailPage from './characterdetail.tsx';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { shortenNumber } from '../../util/numbers.ts';
import { UI_CANCEL, UI_WARNING, UIIcon } from '../../ui/Icon.tsx';
import Tooltip, { BasicTooltip } from '../../ui/Tooltip.tsx';
import {
    DamageDealtChart,
    DamageTakenChart,
} from '../../ui/encounter/charts/DamageByCharacter.tsx';
import {
    HealingDoneChart,
    HealingReceivedChart,
} from '../../ui/encounter/charts/HealingByCharacter.tsx';

/**
 * Component which renders an encounter detail page.
 */
const EncounterDetailPage = observer(() => {
    const log = useContext(LogContext);
    // if we don't have any encounters, get out of here.
    if (log.encounters.length === 0) return <Navigate to={'/'} />;

    // if our id is invalid, get out of here.
    const id = parseInt(useParams().id || '');
    if (isNaN(id) || id >= log.encounters.length) return <Navigate to={'..'} relative={`path`} />;

    const encounter = log.encounters[id];
    const name = values(encounter.entities)
        .filter((it) => it.isEnemy)
        .filter((it) => it.name !== `Unknown`)
        .map((it) => it.name)
        .join(', ');
    const start = DateTime.fromMillis(encounter.start);
    const end = DateTime.fromMillis(encounter.end);
    const duration = Duration.fromMillis(encounter.duration);

    return (
        <Container>
            <Header>
                <HeaderContent>
                    <EncounterWarnings encounter={encounter} />
                    <Link to={`/encounter/${id}`}>
                        <HeaderText>
                            <HeaderTime>
                                {start.toLocaleString({
                                    month: 'short',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </HeaderTime>
                            {` `}
                            <span>{encounter.isFailed ? `defeated by` : `killed`}</span>
                            {` `}
                            <ColoredHeaderText $failed={encounter.isFailed}>
                                {name}
                            </ColoredHeaderText>
                            {` in `}
                            <ColoredHeaderText $failed={encounter.isFailed}>
                                {duration.rescale().toHuman()}
                            </ColoredHeaderText>
                        </HeaderText>
                    </Link>
                </HeaderContent>
                <ButtonContainer to={`/encounter`}>
                    <UIIcon path={UI_CANCEL} height={24} width={24} />
                </ButtonContainer>
            </Header>

            <ContentContainer>
                <Routes>
                    <Route
                        path={`character/:id/*`}
                        element={<CharacterDetailPage encounter={encounter} />}
                    />
                    <Route
                        index
                        element={
                            <Content>
                                <EncounterDamageGraph encounter={encounter} />
                                <EncounterSummary encounter={encounter} />
                            </Content>
                        }
                    />
                </Routes>
            </ContentContainer>
        </Container>
    );
});

export default EncounterDetailPage;

/**
 * A container component for the encounter detail page.
 */
const Container = styled.div`
    height: calc(100% - 47px);
    overflow-y: hidden;
`;

/**
 * A header component for the encounter detail page.
 */
const Header = styled.div`
    background-color: ${theme.color.darkerGrey};
    width: 100%;
    color: ${theme.color.white};
    font-family: ${theme.font.header};
    border-bottom: 1px solid ${theme.color.secondary};
    display: flex;
    justify-content: space-between;
`;

/**
 * A styled header content component for the encounter detail page.
 */
const HeaderContent = styled.div`
    display: flex;
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
 * Styled div for the warning element in the header.
 */
const HeaderWarning = styled.div`
    justify-content: center;
    align-items: center;
    display: flex;
    cursor: pointer;
    margin-left: 10px;
    z-index: 1;
`;

/**
 * Styled span for the colored text in the header.
 */
const ColoredHeaderText = styled.span<{ $failed: boolean }>`
    font-weight: bold;
    color: ${(props) => (props.$failed ? theme.color.error : theme.color.success)};
`;

/**
 * Styled content container that handles scrolling
 */
const ContentContainer = styled(ScrollableContent)`
    width: calc(100% - 8px);
    height: calc(100% - 32px);
    overflow-y: scroll;
`;

/**
 * A styled content div for the encounter detail page.
 */
const Content = styled.div`
    max-width: 1000px;
    margin: 8px auto;

    color: ${theme.color.white};
    font-family: ${theme.font.header};
`;

/**
 * A placeholder component for the encounter damage timeline.
 *
 * @param encounter the encounter
 * @constructor
 */
const EncounterDamageGraph = ({ encounter }: { encounter: Encounter }) => {
    const [enemies, friends] = partition(values(encounter.entities), (it) => it.isEnemy);
    const data = toDPSData(
        encounter.timeline,
        undefined,
        undefined,
        friends.map((it) => it.id),
    );
    return (
        <EncounterDamageGraphContainer>
            <Header>
                <HeaderText>damage per second dealt by allies</HeaderText>
            </Header>
            <ResponsiveContainer width='100%' height={270}>
                <LineChart
                    data={data}
                    margin={{
                        top: 16,
                        right: 12,
                        left: -8,
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
 * A container div for the encounter damage timeline.
 */
const EncounterDamageGraphContainer = styled.div`
    height: 300px;
    width: 100%;
    border: ${theme.color.secondary} 1px solid;
    box-sizing: border-box;
    background-color: ${theme.color.darkerBackground};
`;

/**
 * An encounter summary component which formats and displays damage charts for an encounter.
 */
const EncounterSummary = ({ encounter }: { encounter: Encounter }) => {
    const [enemies, friends] = partition(values(encounter.entities), (it) => it.isEnemy);
    return (
        <>
            <EncounterSummaryContainer>
                <DamageDealtChart encounter={encounter} entities={friends} />
                <DamageTakenChart encounter={encounter} entities={friends} />
            </EncounterSummaryContainer>
            <EncounterSummaryContainer>
                <HealingDoneChart encounter={encounter} entities={friends} />
                <HealingReceivedChart encounter={encounter} entities={friends} />
            </EncounterSummaryContainer>
            <EncounterSummaryContainer>
                <DamageDealtChart encounter={encounter} entities={enemies} />
                <DamageTakenChart encounter={encounter} entities={enemies} />
            </EncounterSummaryContainer>
            <EncounterSummaryContainer>
                <HealingDoneChart encounter={encounter} entities={enemies} />
                <HealingReceivedChart encounter={encounter} entities={enemies} />
            </EncounterSummaryContainer>
        </>
    );
};

/**
 * A container div for the encounter summary charts.
 */
const EncounterSummaryContainer = styled.div`
    margin-top: 8px;
    display: flex;
    justify-content: space-around;
    gap: 8px;
`;

/**
 * Render a header containing warning data for an encounter.
 *
 * @param encounter the encounter
 * @constructor
 */
const EncounterWarnings = ({ encounter }: { encounter: Encounter }) => {
    if (size(encounter.warnings)) {
        return (
            <HeaderWarning>
                <StyledTooltip
                    renderTrigger={() => (
                        <UIIcon
                            height={18}
                            width={18}
                            path={UI_WARNING}
                            foregroundColor={theme.color.secondary}
                        />
                    )}
                    renderTooltip={() => (
                        <WarningTooltip>
                            <WarningHeader>
                                encountered the following warnings when parsing this encounter
                            </WarningHeader>
                            <WarningContent>
                                {map(encounter.warnings, (value, key) => (
                                    <div key={key}>
                                        {value.message} ({value.count} times)
                                    </div>
                                ))}
                            </WarningContent>
                        </WarningTooltip>
                    )}
                    placement={`bottom`}
                    arrow
                />
            </HeaderWarning>
        );
    } else {
        return <></>;
    }
};

/**
 * A styled tooltip for the encounter warnings.
 */
const StyledTooltip = styled(Tooltip)`
    display: flex;
`;

/**
 * A styled tooltip container for the encounter warnings.
 */
const WarningTooltip = styled(BasicTooltip)`
    max-width: 500px;
`;

/**
 * A header component for the encounter warnings.
 */
const WarningHeader = styled.div`
    padding: 4px;
    width: calc(100% - 8px);
    color: ${theme.color.white};
    font-family: ${theme.font.header};
    border-bottom: 1px solid ${theme.color.secondary};
    text-align: center;
`;

/**
 * Styled content div for the encounter warnings.
 */
const WarningContent = styled.div`
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: center;
`;

/**
 * Styled div for an icon button.
 */
const ButtonContainer = styled(Link)`
    display: flex;

    width: 46px;

    justify-content: center;
    align-items: center;
    cursor: pointer;

    &:hover {
        background-color: rgba(0, 0, 0, 0.25);
    }

    &:active {
        background-color: rgba(0, 0, 0, 0.5);
    }
`;
