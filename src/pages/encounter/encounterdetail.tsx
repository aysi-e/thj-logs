import { observer } from 'mobx-react';
import { useContext } from 'react';
import { LogContext } from '../../state/log.ts';
import { Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import theme, { ScrollableContent } from '../../theme.tsx';
import CharacterDetailPage from './characterdetail.tsx';
import EncounterOverview from '../../ui/encounter/EncounterOverview.tsx';
import EncounterDamageDone from '../../ui/encounter/EncounterDamageDone.tsx';
import EncounterDamageTaken from '../../ui/encounter/EncounterDamageTaken.tsx';
import EncounterHealing from '../../ui/encounter/EncounterHealing.tsx';
import EncounterNav from '../../ui/encounter/EncounterNav.tsx';
import EncounterState, { EncounterContext } from '../../state/encounter.ts';
import EncounterTitle from '../../ui/encounter/EncounterTitle.tsx';

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

    const [nav] = useSearchParams();
    const mode = nav.get('mode');
    const encounter = log.encounters[id];

    let content;
    switch (mode) {
        case 'damage-done':
            content = (
                <Content>
                    <EncounterDamageDone />
                </Content>
            );
            break;
        case 'damage-taken':
            content = (
                <Content>
                    <EncounterDamageTaken />
                </Content>
            );
            break;
        case 'healing':
            content = (
                <Content>
                    <EncounterHealing encounter={encounter} />
                </Content>
            );
            break;
        case 'deaths':
            content = <Content></Content>;
            break;
        case 'events':
            content = <Content></Content>;
            break;
        default:
            content = (
                <Content>
                    <EncounterOverview encounter={encounter} />
                </Content>
            );
            break;
    }

    return (
        <EncounterContext.Provider value={new EncounterState(encounter)}>
            <Container>
                <EncounterTitle />
                <EncounterNav />
                <ContentContainer>
                    <Routes>
                        <Route path={`character/:id/*`} element={<CharacterDetailPage />} />
                        <Route index element={content} />
                    </Routes>
                </ContentContainer>
            </Container>
        </EncounterContext.Provider>
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
 * Styled content container that handles scrolling
 */
const ContentContainer = styled(ScrollableContent)`
    width: calc(100% - 8px);
    height: calc(100% - 32px - 54px);
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
