import { ReactNode } from 'react';
import styled from 'styled-components';
import theme from '../../theme.tsx';

type GraphProps = {
    /**
     * The title for the graph.
     */
    title: string | ReactNode;

    /**
     * The graph components.
     */
    children: ReactNode;
};

/**
 * Component which contains a graph for the encounter section.
 *
 * @constructor
 */
export const EncounterGraph = (props: GraphProps) => {
    return (
        <GraphContainer>
            <GraphHeader>{props.title}</GraphHeader>
            {props.children}
        </GraphContainer>
    );
};

/**
 * A container div for encounter graphs.
 */
const GraphContainer = styled.div`
    height: 300px;
    width: 100%;
    border: ${theme.color.secondary} 1px solid;
    box-sizing: border-box;
    background-color: ${theme.color.darkerBackground};
`;

/**
 * A header component for encounter graphs.
 */
const GraphHeader = styled.div`
    background-color: ${theme.color.darkerGrey};
    width: calc(100% - 16px);
    color: ${theme.color.white};
    font-family: ${theme.font.header};
    border-bottom: 1px solid ${theme.color.secondary};
    display: flex;
    justify-content: space-between;
    padding: 8px;
`;
