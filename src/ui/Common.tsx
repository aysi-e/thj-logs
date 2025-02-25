// module containing common, frequently-used UI components.

import theme, { ComponentProps } from '../theme.tsx';
import styled from 'styled-components';
import { ReactNode } from 'react';

/**
 * Props accepted by the Header component.
 */
type HeaderProps = {
    background?: `primary` | `secondary` | string;
    border?: `bottom` | `all`;
};

/**
 * A commonly used Header component.
 *
 * @param props the props accepted by the Header component.
 * @constructor
 */
export const Header = (props: HeaderProps & ComponentProps & { children?: ReactNode }) => {
    const background =
        (props.background === `primary`
            ? theme.color.darkerBackground
            : props.background === `secondary`
              ? theme.color.darkerGrey
              : props.background) || theme.color.darkerBackground;
    const border = props.border || `bottom`;
    return (
        <HeaderComponent $background={background} $border={border} className={props.className}>
            {props.children}
        </HeaderComponent>
    );
};

/**
 * The styled header component.
 */
const HeaderComponent = styled.div<{ $background: string; $border: string }>`
    background-color: ${(props) => props.$background};
    width: 100%;
    color: ${theme.color.white};
    font-family: ${theme.font.header};
    display: flex;
    border-bottom: ${(props) => props.$border === `bottom` && `1px solid ${theme.color.secondary}`};
    border: ${(props) => props.$border === `all` && `1px solid ${theme.color.secondary}`};
`;

/**
 * A boxy container component with optional header.
 *
 * @param props the props accepted by the box component.
 * @constructor
 */
export const Box = (
    props: ComponentProps & {
        header?: ReactNode | string;
        children?: ReactNode;
        background?: `primary` | `secondary` | string;
    },
) => {
    const background =
        (props.background === `primary`
            ? theme.color.darkerGrey
            : props.background === `secondary`
              ? theme.color.darkerBackground
              : props.background) || theme.color.darkerGrey;
    let header = <></>;
    if (props.header) {
        if (typeof props.header === 'string') {
            header = (
                <Header>
                    <HeaderText>{props.header}</HeaderText>
                </Header>
            );
        } else {
            header = <Header>{props.header}</Header>;
        }
    }
    return (
        <BoxComponent $background={background} className={props.className}>
            {header}
            {props.children}
        </BoxComponent>
    );
};

/**
 * Styled div for header text.
 */
const HeaderText = styled.div`
    padding: 8px;
`;

/**
 * Styled container component for a box container.
 */
const BoxComponent = styled.div<{ $background: string }>`
    background-color: ${(props) => props.$background};
    color: ${theme.color.white};
    font-family: ${theme.font.header};
    border: 1px solid ${theme.color.secondary};
    display: flex;
    flex-direction: column;
`;
