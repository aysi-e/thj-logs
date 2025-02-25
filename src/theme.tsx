//
// Module containing theme and style information.
//

import styled from 'styled-components';

/**
 * The constant theme object.
 */
const theme = {
    // the color palette used in this project
    color: {
        background: `#1b1b1b`,
        secondary: `#c99d66`,
        white: 'white',

        lightBackground: '#b3d3e2',
        darkBackground: '#65727b',
        darkerBackground: `#262a31`,

        lightGrey: '#eee',
        mediumGrey: '#999',
        darkGrey: '#666',
        darkerGrey: '#333',

        error: '#ffa3a3',
        success: '#b8ffaf',

        lightAlternate: '#5b6b3d',
        selected: 'rgba(255,255,255,0.25)',

        transparentGrey: 'rgba(0,0,0,.25)',

        whiteDamage: `#7a7a7a`,
        absorb: `#7c7941`,
        spellDamage: `#4a5ba6`,

        friend: `#4A58A4`,
        friendHeal: `#33622d`,
        enemy: `#9c4646`,
        enemyHeal: `#596215`,
    },

    font: {
        header: 'monospace',
        content: 'monospace',
    },

    spacing: {
        small: 10,
        medium: 15,
    },

    // misc styling stuff.
    style: {
        dropShadow: `drop-shadow(2px 4px 6px black)`,
    },
};

/**
 * Reusable type for most bespoke styled-components that accept a 'className' prop.
 */
export type ComponentProps = {
    className?: string;
};

export default theme;

/**
 * The content div for the encounter index page.
 */
export const ScrollableContent = styled.div`
    margin: 0 0 0 8px;
    width: calc(100% - 8px);

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
