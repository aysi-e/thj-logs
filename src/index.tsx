import React from 'react';
import ReactDOM from 'react-dom/client';
import { createGlobalStyle } from 'styled-components';
import theme from './theme.tsx';
import { BrowserRouter } from 'react-router-dom';
import App from './app.tsx';

/**
 * Type for the global style.
 */
type Style = {
    background: string;
};

/**
 * A global style component, which sets the background color.
 */
// eslint-disable-next-line react-refresh/only-export-components
const GlobalStyle = createGlobalStyle<Style>`
  body {
    margin: 0;
    background: ${(props) => props.background};
  }
  a {
    color: inherit;
    cursor: pointer;
    text-decoration: inherit;
  }
  
  button {
    cursor: pointer;
    border-width: 0;
    border-style: none;
    border-image: none;

    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    font-style: inherit;
    background: inherit;
    color: inherit;
  }
`;

// @ts-ignore - added by vite
const baseUrl = import.meta.env.BASE_URL;

/**
 * React entrypoint.
 */
ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
    <React.StrictMode>
        <GlobalStyle background={theme.color.background} />
        <BrowserRouter basename={baseUrl}>
            <App />
        </BrowserRouter>
    </React.StrictMode>,
);
