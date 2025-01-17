import {observer} from "mobx-react";
import {Navigate, Route, Routes, useParams} from "react-router-dom";
import styled from "styled-components";
import theme from "../../theme.tsx";
import {useContext} from "react";
import {LogContext} from "../../state/log.ts";
import {Encounter} from "../../parser/parser.ts";
import {values} from "lodash";
import {DateTime, Duration} from "luxon";
import DamageMeter from "../../ui/encounter/DamageMeter.tsx";
import PlayerDetailPage from "./playerdetail.tsx";
import {makeAutoObservable} from "mobx";
import EncounterList from "../../ui/EncounterList.tsx";

/**
 * Class which manages state for the encounter page.
 *
 * Responsible for transforming encounter data into usable formats for charts and graphs shown on the encounter and
 * player detail pages.
 */
class EncounterState {

    /**
     * List containing each entity present in this encounter.
     */
    entities: any[];

    /**
     * Construct an encounter state from an encounter object.
     */
    constructor(readonly encounter: Encounter) {
        makeAutoObservable(this);
        this.entities = values(encounter.entities).map(it => {
            return it;
        })
    }
}

const EncounterPage = observer(() => {
    const params = useParams();
    const log = useContext(LogContext);
    if (params.id && !isNaN(parseInt(params.id))) {
        const encounter = log.encounters[parseInt(params.id)];
        if (encounter) {
            return <Container>
                <Routes>
                    <Route path={'character'}>
                        <Route path={':id'} element={<PlayerDetailPage encounter={encounter} />}/>
                    </Route>
                    <Route index element={
                        <Content>
                            <EncounterOverview encounter={encounter} />
                        </Content>
                    } />
                </Routes>
            </Container>
        } else {
            return <Navigate to={'..'} relative={`path`}/>;
        }
    } else if (log.encounters.length > 0) {
        return <Container>
            <EncounterList />
        </Container>
    }

    return <Navigate to={'/'}/>
});

export default EncounterPage;

/**
 * A styled container div.
 */
const Container = styled.div`
    width: 100%;
    height: 100%;
    position: absolute;
    display: flex;
`;

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

const EncounterOverview = ({encounter}: {encounter: Encounter}) => {
    const name = values(encounter.entities).filter(it => it.isEnemy).map(it => it.name).join(', ');
    const start = DateTime.fromMillis(encounter.start);
    const end = DateTime.fromMillis(encounter.end);
    const duration = Duration.fromMillis(encounter.duration);

    return <div>
        <ContentHeader>overview for encounter against: {name}</ContentHeader>
        <ContentHeader>{start.toLocaleString({ month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })} - {end.toLocaleString({ month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })} ({duration.rescale().toHuman()})</ContentHeader>
        <EncounterDamageGraph encounter={encounter} />
        <ContentHeader>outgoing damage</ContentHeader>
        <DamageMeter encounter={encounter} />
    </div>;
}

const EncounterDamageGraph = ({encounter}: {encounter: Encounter}) => {
    return <EncounterDamageGraphPlaceholder>
        <span>pretend a damage timeline is here</span>
    </EncounterDamageGraphPlaceholder>
}

const EncounterDamageGraphPlaceholder = styled.div`
    margin: 24px 0;
    height: 200px;
    width: 600px;
    border: white 2px solid;
    text-align: center;
    line-height: 200px;
`;
