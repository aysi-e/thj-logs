import {observer} from "mobx-react";
import {useContext} from "react";
import {LogContext} from "../../state/log.ts";
import {Link, Navigate, Route, Routes, useParams} from "react-router-dom";
import styled from "styled-components";
import theme from "../../theme.tsx";
import {partition, values} from "lodash";
import {DateTime, Duration} from "luxon";
import {Encounter} from "../../parser/parser.ts";
import DamageDoneChart from "../../ui/encounter/charts/DamageDone.tsx";
import DamageTakenChart from "../../ui/encounter/charts/DamageTaken.tsx";
import CharacterDetailPage from "./characterdetail.tsx";
import {toDPSData} from "../../parser/timeline.ts";
import {Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {shortenNumber} from "../../util/numbers.ts";

/**
 * Component which renders an encounter detail page.
 */
const EncounterDetailPage = observer(() => {
    const log = useContext(LogContext);
    // if we don't have any encounters, get out of here.
    if (log.encounters.length === 0) return <Navigate to={'/'} />;

    // if our id is invalid, get out of here.
    const id = parseInt(useParams().id || '');
    if (isNaN(id) || id >= log.encounters.length) return <Navigate to={'..'} relative={`path`} />

    const encounter = log.encounters[id];
    const name = values(encounter.entities).filter(it => it.isEnemy).map(it => it.name).join(', ');
    const start = DateTime.fromMillis(encounter.start);
    const end = DateTime.fromMillis(encounter.end);
    const duration = Duration.fromMillis(encounter.duration);

    return <Container>
        <Header>
            <Link to={`/encounter/${id}`}><HeaderText>
                <HeaderTime>{start.toLocaleString({ month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</HeaderTime>
                {` `}
                <span>{encounter.isFailed ? `defeated by` : `killed`}</span>
                {` `}
                <ColoredHeaderText $failed={encounter.isFailed}>{name}</ColoredHeaderText>
                {` in `}
                <ColoredHeaderText $failed={encounter.isFailed}>{duration.rescale().toHuman()}</ColoredHeaderText>
            </HeaderText>
            </Link>
        </Header>
        <Routes>
            <Route path={`character/:id/*`} element={<CharacterDetailPage encounter={encounter} />} />
            <Route index element={<Content>
                <EncounterDamageGraph encounter={encounter} />
                <EncounterSummary encounter={encounter} />
            </Content>} />
        </Routes>

    </Container>;
});

export default EncounterDetailPage;

/**
 * A container component for the encounter detail page.
 */
const Container = styled.div``;

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
 * Styled div for header text.
 */
const HeaderText = styled.div`
    padding: 8px;
`;

/**
 * Styled span for the time text in the header.
 */
const HeaderTime = styled.span`
    font-size: .9em;
`;

/**
 * Styled span for the colored text in the header.
 */
const ColoredHeaderText = styled.span<{$failed: boolean}>`
    font-weight: bold;
    color: ${props => props.$failed ? theme.color.error : theme.color.success};
`

/**
 * A styled content div for the encounter detail page.
 */
const Content = styled.div`
    max-width: 800px;
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
const EncounterDamageGraph = ({encounter}: {encounter: Encounter}) => {
    const [enemies, friends] = partition(values(encounter.entities), it => it.isEnemy);
    const data = toDPSData(encounter.timeline, undefined, undefined, friends.map(it => it.id));
    return <EncounterDamageGraphContainer>
        <Header>
            <HeaderText>damage per second dealt by allies</HeaderText>
        </Header>
        <ResponsiveContainer width="100%" height={270}>
            <LineChart
                data={data}
                margin={{
                    top: 16,
                    right: 12,
                    left: -8,
                    bottom: 0,
                }}
            >
                <XAxis dataKey="time" interval={data.length > 450 ? 59 : data.length > 60 ? 29 : 5} tickFormatter={(i) => Duration.fromMillis(i * 1000).toFormat(`m:ss`)}/>
                <YAxis tickFormatter={(i) => shortenNumber(i)}/>
                <Line type="monotone" dataKey="dps" stroke="#82ca9d" dot={false} />
            </LineChart>
        </ResponsiveContainer>
    </EncounterDamageGraphContainer>
}

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
const EncounterSummary = ({encounter}: {encounter: Encounter}) => {
    const [enemies, friends] = partition(values(encounter.entities), it => it.isEnemy);
    return <>
        <EncounterSummaryContainer>
            <DamageDoneChart encounter={encounter} entities={friends}/>
            <DamageTakenChart encounter={encounter} entities={friends} />
        </EncounterSummaryContainer>
        <EncounterSummaryContainer>
            <DamageDoneChart encounter={encounter} entities={enemies}/>
            <DamageTakenChart encounter={encounter} entities={enemies} />
        </EncounterSummaryContainer>
    </>
}

/**
 * A container div for the encounter summary charts.
 */
const EncounterSummaryContainer = styled.div`
    margin-top: 8px;
    display: flex;
    justify-content: space-around;
    gap: 8px;
`;
