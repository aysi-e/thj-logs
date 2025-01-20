import {observer} from "mobx-react";
import styled from "styled-components";
import theme from "../../theme.tsx";
import {Encounter} from "../../parser/parser.ts";
import {Navigate, useParams} from "react-router-dom";
import {values} from "lodash";
import OutgoingDamageBreakdownChart from "../../ui/encounter/charts/OutgoingDamageBreakdown.tsx";
import IncomingDamageBreakdownChart from "../../ui/encounter/charts/IncomingDamageBreakdown.tsx";

type Props = {
    encounter: Encounter;
}

/**
 * Component which renders a character detail page.
 */
const CharacterDetailPage = observer(({encounter}: Props) => {
    // if our id is invalid, get out of here.
    const id = parseInt(useParams().id || '');
    if (isNaN(id) || id >= values(encounter.entities).length) return <Navigate to={'../..'} relative={`path`} />
    const entity = values(encounter.entities)[id];
    return <Container>
        <Header>
            <HeaderText>
                showing character details for <strong>{entity.name}</strong>
            </HeaderText>
        </Header>
        <Content>
            <CharacterDamageTimeline encounter={encounter} />
            <BreakdownContainer>
                <OutgoingDamageBreakdownChart encounter={encounter} entity={entity}/>
                <IncomingDamageBreakdownChart encounter={encounter} entity={entity}/>
            </BreakdownContainer>
        </Content>
    </Container>
});

export default CharacterDetailPage;

/**
 * A container component for the character detail page.
 */
const Container = styled.div``;

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
 * A placeholder component for the character damage timeline.
 *
 * @param encounter the encounter
 * @constructor
 */
const CharacterDamageTimeline = ({encounter}: {encounter: Encounter}) => {
    return <EncounterDamageGraphContainer>
        <span>pretend a damage timeline graph is here</span>
    </EncounterDamageGraphContainer>
}

/**
 * A container div for the character detail timeline.
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
 * A styled content div for the character detail page.
 */
const Content = styled.div`
    max-width: 800px;
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
    justify-content: space-around;
    gap: 8px;
`;
