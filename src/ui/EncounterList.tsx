import {LogContext} from "../state/log.ts";
import {Encounter} from "../parser/parser.ts";
import {Duration} from "luxon";
import {values} from "lodash";
import {observer} from "mobx-react";
import {useContext} from "react";
import styled from "styled-components";
import theme from "../theme.tsx";
import {Link} from "react-router-dom";

/**
 * Component which renders a list of encounter titles.
 *
 * @constructor
 */
const EncounterList = observer(() => {
    const log = useContext(LogContext);
    console.log(log.encounters);
    return <Content>
        <ContentHeader>encounters</ContentHeader>
        {log.encounters.map(((encounter, i) => <EncounterListItem encounter={encounter} index={i} key={`encounter-${encounter.id}`}></EncounterListItem>))}
    </Content>
});

export default EncounterList;

const EncounterListItem = ({encounter, index}: {encounter: Encounter, index: number}) => {
    const duration = Duration.fromMillis(encounter.duration);
    const enemies = values(encounter.entities).filter(it => it.isEnemy).map(it => it.name).join(', ')
    return <div><Link to={`${index}`}>{enemies} ({duration.rescale().toHuman()})</Link></div>
}


/**
 * A styled content div.
 */
const Content = styled.div`
    font-family: ${theme.font.content};
    color: white;
    margin: auto;
`;

/**
 * A styled header div.
 */
const ContentHeader = styled.div`
    text-align: center;
`;
