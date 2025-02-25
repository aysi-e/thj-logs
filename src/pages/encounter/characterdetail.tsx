import { observer } from 'mobx-react';
import styled from 'styled-components';
import theme, { ScrollableContent } from '../../theme.tsx';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { UI_CANCEL, UIIcon } from '../../ui/Icon.tsx';
import CharacterDamageDone from '../../ui/encounter/CharacterDamageDone.tsx';
import CharacterDamageTaken from '../../ui/encounter/CharacterDamageTaken.tsx';
import { useEncounter } from '../../state/encounter.ts';
import CharacterHealing from '../../ui/encounter/CharacterHealing.tsx';

/**
 * Component which renders a character detail page.
 */
const CharacterDetailPage = observer(() => {
    // if our id is invalid, get out of here.
    const encounter = useEncounter();
    const id = parseInt(useParams().id || '');
    if (isNaN(id) || !encounter.getEntityByIndex(id))
        return <Navigate to={'../..'} relative={`path`} />;
    const entity = encounter.getEntityByIndex(id);
    const [nav] = useSearchParams();
    const mode = nav.get('mode');
    let content;
    switch (mode) {
        case 'damage-done':
            content = (
                <Content>
                    <CharacterDamageDone entity={entity} />
                </Content>
            );
            break;
        case 'damage-taken':
            content = (
                <Content>
                    <CharacterDamageTaken entity={entity} />
                </Content>
            );
            break;
        case 'healing':
            content = (
                <Content>
                    <CharacterHealing entity={entity} />
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
            content = <Content></Content>;
            break;
    }

    return (
        <Container>
            <Header>
                <ButtonContainer to={`/encounter/${encounter.id}${mode ? `?mode=${mode}` : ''}`}>
                    <UIIcon path={UI_CANCEL} height={18} width={18} />
                </ButtonContainer>
                <HeaderText>
                    showing character details for <strong>{entity.name}</strong>
                </HeaderText>
            </Header>
            <ContentContainer>{content}</ContentContainer>
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
    height: calc(100% - 32px - 38px);
`;

/**
 * A header component for the character detail page.
 */
const Header = styled.div`
    background-color: ${theme.color.darkerGrey};
    width: 100%;
    color: ${theme.color.white};
    font-family: ${theme.font.header};
    border-bottom: 1px solid ${theme.color.secondary};
    display: flex;
    gap: 8px;
`;

/**
 * Styled div for header text.
 */
const HeaderText = styled.div`
    padding: 8px 0;
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
 * Styled div for an icon button.
 */
const ButtonContainer = styled(Link)`
    display: flex;
    padding: 0 8px;
    width: 18px;

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
