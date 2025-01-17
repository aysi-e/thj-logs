//
// Module containing theme and style information.
//

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
      selected: '#ffeab0',

      transparentGrey: 'rgba(0,0,0,.25)',
  },

    font: {
        header: "monospace",
        content: "monospace",
    },

    spacing: {
        small: 10,
        medium: 15,
    },

    // misc styling stuff.
    style: {
        dropShadow: `drop-shadow(2px 4px 6px black)`,
    },

}

/**
 * Reusable type for most bespoke styled-components that accept a 'className' prop.
 */
export type ComponentProps = {
    className?: string;
};

export default theme;
