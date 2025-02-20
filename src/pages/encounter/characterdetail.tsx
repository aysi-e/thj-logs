import { observer } from 'mobx-react';
import styled from 'styled-components';
import theme, { ScrollableContent } from '../../theme.tsx';
import { Encounter, toDPSData, Entity } from '@aysi-e/thj-parser-lib';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { values } from 'lodash';
import { UI_CANCEL, UIIcon } from '../../ui/Icon.tsx';
import CharacterDamageDone from '../../ui/encounter/CharacterDamageDone.tsx';

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
    const [nav] = useSearchParams();
    const mode = nav.get('mode');
    let content;
    switch (mode) {
        case 'damage-done':
            content = (
                <Content>
                    <CharacterDamageDone entity={entity} encounter={encounter} />
                </Content>
            );
            break;
        case 'damage-taken':
            content = <Content></Content>;
            break;
        case 'healing':
            content = <Content></Content>;
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
                <ButtonContainer to={`/encounter/${encounter.id}`}>
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
    height: calc(100% - 32px);
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
