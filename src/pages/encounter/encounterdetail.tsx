import {observer} from "mobx-react";
import {useContext} from "react";
import {LogContext} from "../../state/log.ts";
import {Navigate, useParams} from "react-router-dom";
import styled from "styled-components";
import theme from "../../theme.tsx";
import {partition, values} from "lodash";
import {DateTime, Duration} from "luxon";
import {Encounter} from "../../parser/parser.ts";
import Entity from "../../parser/entity.ts";

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
            <HeaderText>
                <HeaderTime>{start.toLocaleString({ month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</HeaderTime>
                {` `}
                <span>{encounter.isFailed ? `defeated by` : `killed`}</span>
                {` `}
                <ColoredHeaderText $failed={encounter.isFailed}>{name}</ColoredHeaderText>
                {` in `}
                <ColoredHeaderText $failed={encounter.isFailed}>{duration.rescale().toHuman()}</ColoredHeaderText>
            </HeaderText>
        </Header>
        <Content>
            <EncounterDamageGraph encounter={encounter} />
            <EncounterSummary encounter={encounter} />
        </Content>
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
    return <EncounterDamageGraphContainer>
        <span>pretend a damage timeline graph is here</span>
    </EncounterDamageGraphContainer>
}

/**
 * A container div for the encounter damage timeline.
 */
const EncounterDamageGraphContainer = styled.div`
    height: 250px;
    width: 100%;
    border: ${theme.color.secondary} 1px solid;
    box-sizing: border-box;
    background-color: ${theme.color.darkerBackground};
    text-align: center;
    line-height: 250px;
`;

/**
 * An encounter summary component which formats and displays damage charts for an encounter.
 */
const EncounterSummary = ({encounter}: {encounter: Encounter}) => {
    const [enemies, friends] = partition(values(encounter.entities), it => it.isEnemy);
    return <>
        <EncounterSummaryContainer>
            <EncounterDamageDoneChart entities={friends}/>
            <EncounterDamageTakenChart entities={friends} />
            <EncounterHealingDoneChart entities={friends} />
        </EncounterSummaryContainer>
        <EncounterSummaryContainer>
            <EncounterDamageDoneChart entities={enemies}/>
            <EncounterDamageTakenChart entities={enemies} />
            <EncounterHealingDoneChart entities={enemies} />
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

/**
 * An encounter chart which displays data based on damage done during an encounter.
 */
const EncounterDamageDoneChart = ({entities}: {entities: Entity[]}) => {
    return <EncounterChartContainer>
        <EncounterChartHeader>damage done by allies</EncounterChartHeader>
        <EncounterChartContent>

        </EncounterChartContent>
    </EncounterChartContainer>
}

/**
 * An encounter chart which displays data based on damage taken during an encounter.
 */
const EncounterDamageTakenChart = ({entities}: {entities: Entity[]}) => {
    return <EncounterChartContainer>
        <EncounterChartHeader>damage taken by allies</EncounterChartHeader>
        <EncounterChartContent>

        </EncounterChartContent>
    </EncounterChartContainer>
}

/**
 * An encounter chart which displays data based on healing done during an encounter.
 */
const EncounterHealingDoneChart = ({entities}: {entities: Entity[]}) => {
    return <EncounterChartContainer>
        <EncounterChartHeader>healing done by allies</EncounterChartHeader>
        <EncounterChartContent>

        </EncounterChartContent>
    </EncounterChartContainer>
}

/**
 * Styled container div for an encounter chart.
 */
const EncounterChartContainer = styled.div`
    border: ${theme.color.secondary} 1px solid;
    width: 100%;
`;

/**
 * Styled header div for an encounter chart.
 */
const EncounterChartHeader = styled.div`
    padding: 8px;
    background-color: ${theme.color.darkerGrey};
`;

/**
 * Styled content div for an encounter chart.
 */
const EncounterChartContent = styled.div`

`;
