import { Encounter, toDPSData } from '@aysi-e/thj-parser-lib';
import { observer } from 'mobx-react';
import { partition, values, zipWith } from 'lodash';
import styled from 'styled-components';
import theme from '../../theme.tsx';
import { DamageTakenChart } from './charts/DamageByCharacter.tsx';

/**
 * Props accepted by the EncounterDamageTaken component.
 */
type Props = {
    encounter: Encounter;
};

/**
 * Component which displays overview and summary data for an encounter.
 */
const EncounterDamageTaken = observer(({ encounter }: Props) => {
    const [enemies, friends] = partition(values(encounter.entities), (it) => it.isEnemy);

    return (
        <>
            <OverviewGraphContainer>
                <Header>damage taken by allies & enemies</Header>
                <div>todo: graph</div>
            </OverviewGraphContainer>
            <EncounterSummaryContainer>
                <DamageTakenChart encounter={encounter} entities={friends} />
                <DamageTakenChart encounter={encounter} entities={enemies} />
            </EncounterSummaryContainer>
        </>
    );
});

export default EncounterDamageTaken;

/**
 * A container div for the encounter damage taken charts.
 */
const EncounterSummaryContainer = styled.div`
    margin-top: 8px;
    display: flex;
    justify-content: space-around;
    gap: 8px;
`;

/**
 * A container div for the encounter damage taken timeline graph.
 */
const OverviewGraphContainer = styled.div`
    height: 300px;
    width: 100%;
    border: ${theme.color.secondary} 1px solid;
    box-sizing: border-box;
    background-color: ${theme.color.darkerBackground};
`;

/**
 * A header component for the encounter damage taken page.
 */
const Header = styled.div`
    background-color: ${theme.color.darkerGrey};
    width: calc(100% - 16px);
    color: ${theme.color.white};
    font-family: ${theme.font.header};
    border-bottom: 1px solid ${theme.color.secondary};
    display: flex;
    justify-content: space-between;
    padding: 8px;
`;
