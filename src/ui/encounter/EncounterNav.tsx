import styled from 'styled-components';
import theme from '../../theme.tsx';
import { SelectButton } from '../SelectButton.tsx';
import { Link, useSearchParams } from 'react-router-dom';
import { Encounter } from '@aysi-e/thj-parser-lib';

/**
 * Component which renders a navigation bar for an encounter.
 *
 * @constructor
 */
const EncounterNav = () => {
    const [nav] = useSearchParams();
    const mode = nav.get('mode');
    // todo: implement these modes.
    //            <Link to={'?mode=overview'}>
    //                 <Button selected={mode === 'overview' || !mode}>overview</Button>
    //             </Link>
    //            <Link to={'?mode=deaths'}>
    //                 <Button selected={mode === 'deaths'}>deaths</Button>
    //             </Link>
    //             <Link to={'?mode=events'}>
    //                 <Button selected={mode === 'events'}>event log</Button>
    //             </Link>
    return (
        <Container>
            <Link to={'?mode=damage-done'}>
                <Button selected={mode === 'damage-done'}>damage done</Button>
            </Link>
            <Link to={'?mode=damage-taken'}>
                <Button selected={mode === 'damage-taken'}>damage taken</Button>
            </Link>
            <Link to={'?mode=healing'}>
                <Button selected={mode === 'healing'}>healing</Button>
            </Link>
        </Container>
    );
};

export default EncounterNav;

/**
 * A container component for the encounter navigation bar.
 */
const Container = styled.div`
    background-color: ${theme.color.darkerBackground};
    width: calc(100% - 32px);
    color: ${theme.color.white};
    font-family: ${theme.font.header};
    border-bottom: 1px solid ${theme.color.secondary};
    display: flex;
    padding-left: 32px;
`;

/**
 * A styled button component for the encounter navigation bar.
 */
const Button = styled(SelectButton)`
    display: flex;
    font-size: 1em;
    padding: 12px;
`;
