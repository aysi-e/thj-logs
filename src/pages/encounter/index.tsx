import {observer} from "mobx-react";
import styled from "styled-components";
import theme from "../../theme.tsx";
import {useContext} from "react";
import {LogContext} from "../../state/log.ts";
import {DateTime, Duration} from "luxon";
import {Link, Navigate, Route, Routes} from "react-router-dom";
import {UI_CANCEL, UIIcon} from "../../ui/Icon.tsx";
import {runInAction} from "mobx";
import {Encounter} from "../../parser/parser.ts";
import {last, partition, values} from "lodash";
import EncounterDetailPage from "./encounterdetail.tsx";

/**
 * The encounter index page component.
 *
 * Allows the user to navigate through a list containing each encounter parsed from a log file.
 *
 * @constructor
 */
const EncounterIndex = observer(() => {
    const log = useContext(LogContext);

    if (log.encounters.length === 0) return <Navigate to={'/'} />;

    const clear = () => {
        runInAction(() => {
            log.start = undefined;
            log.end = undefined;
            log.progress = undefined;
            log.loggedBy = undefined;
            log.encounters = [];
        });
    }

    const loggedBy = log.loggedBy || 'unknown';
    const start = log.start
        ? DateTime.fromMillis(log.start).toLocaleString({ month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : `unknown`;
    const end = log.end
        ? DateTime.fromMillis(log.end).toLocaleString({ month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : `unknown`;

    return <Container>
        <Header>
            <Link to={`/encounter`}>
                <HeaderText>
                    <div><strong>{log.encounters.length}</strong> encounters</div>
                    <div>logged by <strong>{loggedBy}</strong> from <strong>{start}</strong> to <strong>{end}</strong></div>
                </HeaderText>
            </Link>
            <ButtonContainer onClick={clear}>
                <UIIcon path={UI_CANCEL} height={30} width={30}/>
            </ButtonContainer>
        </Header>
        <Routes>
            <Route path={`:id/*`} element={<EncounterDetailPage />}/>
            <Route index element={
                <Content>
                    <EncounterList encounters={log.encounters} />
                </Content>
            }/>
        </Routes>

    </Container>;
});

export default EncounterIndex;

/**
 * Styled container div for the Encounter index page.
 */
const Container = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

/**
 * Header component for the Encounter index page.
 */
const Header = styled.div`
    background-color: ${theme.color.darkerBackground};
    width: 100%;
    height: 46px;
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
 * Styled div for an icon button.
 */
const ButtonContainer = styled.div`
    display: flex;
    
    height: 100%;
    width: 46px;
    
    justify-content: center;
    align-items: center;
    cursor: pointer;

    &:hover {
        background-color: rgba(0,0,0,.25);
    }

    &:active {
        background-color: rgba(0,0,0,.5);
    }
`;

/**
 * The content div for the encounter index page.
 */
const Content = styled.div`
    margin: 0 0 0 8px;
    width: calc(100% - 8px);

    overflow-x: hidden;
    overflow-y: scroll;
    scrollbar-color: rgba(0, 0, 0, 0.5) ${theme.color.background};

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
        background: ${theme.color.background};
    }
`;

/**
 * The props accepted by the EncounterList component.
 */
type Props = {
    encounters: Encounter[];
}

/**
 * An encounter list component which displays each encounter parsed from a combat log.
 */
const EncounterList = observer(({encounters}: Props) => {
    const byZone = groupByZone(encounters);
    return <EncounterListContainer>{
        byZone.map((it, index) => <EncounterZoneList key={`encounter-zone-${index}`} encounters={it} />)
    }</EncounterListContainer>
});

/**
 * Group an encounter list by zone.
 *
 * @param encounters an encounter list
 */
const groupByZone = (encounters: Encounter[]) => {
    if (!encounters.length) return [];
    const result: Encounter[][] = [];

    let zone = encounters[0].zone;
    let current: Encounter[] = [];
    encounters.forEach(it => {
        if (it.zone !== zone) {
            zone = it.zone;
            if (current.length) {
                result.push(current);
                current = [];
            }
        }

        current.push(it);
    })

    if (current.length) result.push(current);

    return result;
}

/**
 * Container div for an encounter list.
 */
const EncounterListContainer = styled.div`
    max-width: 800px;
    margin: 8px auto;
    display: flex;
    flex-direction: column;
    text-align: center;
    gap: 8px;
    font-family: ${theme.font.content};
    color: ${theme.color.white};
`;

/**
 * An encounter sublist divided by zone name.
 */
const EncounterZoneList = observer(({encounters}: Props) => {
    if (!encounters.length) return <></>
    const zone = encounters[0].zone || 'unknown zone'
    const start = DateTime.fromMillis(encounters[0].start);
    const end = DateTime.fromMillis(last(encounters)!.end);

    // todo: eventually dont ignore trash
    const [bosses, trash] = partition(encounters, it => it.isBoss);
    if (!bosses.length) return <></>

    return <EncounterZoneListContainer>
        <EncounterZoneListItem>
            {`${zone} (${start.toLocaleString(DateTime.DATETIME_SHORT)} to ${end.toLocaleString(DateTime.DATETIME_SHORT)})`}
        </EncounterZoneListItem>
        {bosses.map(it => <BossEncounterListItem encounter={it} key={it.id} />)}
    </EncounterZoneListContainer>;
});

/**
 * Styled container div for an EncounterZoneList
 */
const EncounterZoneListContainer = styled.div`
    border: 1px solid ${theme.color.secondary};
`;

/**
 * An encounter zone list item.
 */
const EncounterZoneListItem = styled.div`
    padding: 8px;
    background-color: ${theme.color.darkerBackground};
    border-bottom: 1px solid ${theme.color.secondary};
    cursor: pointer;
`;

/**
 * An encounter list item component which displays a single encounter list item.
 */
const BossEncounterListItem = observer(({encounter}: {encounter: Encounter}) => {
    const duration = Duration.fromMillis(encounter.duration);
    const enemies = values(encounter.entities).filter(it => it.isEnemy && it.isBoss).map(it => it.name).join(', ')

    return <Link to={encounter.id}><ListItemContainer>
        <ListItemTime>{DateTime.fromMillis(encounter.start).toLocaleString(DateTime.TIME_SIMPLE)}</ListItemTime> <ListItemText $failed={encounter.isFailed}>{enemies} ({duration.rescale().toHuman()})</ListItemText>
    </ListItemContainer></Link>
});

/**
 * Styled container div for an encounter list item.
 */
const ListItemContainer = styled.div`
    padding: 8px;
    background: ${theme.color.darkerGrey};
    cursor: pointer;
    user-select: none;
    
    &:hover {
        filter: brightness(1.35);
    }
    
    &:active {
        filter: brightness(.65);
    }
`

/**
 * Styled text span for an encounter list item.
 */
const ListItemText = styled.span<{$failed: boolean}>`
    color: ${props => props.$failed ? theme.color.error : theme.color.success};
`

/**
 * Styled text span for an encounter list item.
 */
const ListItemTime = styled.span`
    font-size: .9em;
`
