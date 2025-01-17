import styled from 'styled-components';
import theme, { ComponentProps } from '../theme';
import {IconDescription, UIIcon} from "./Icon.tsx";

/**
 * Styled button component with a 'selected' state.
 */
export const SelectButton = styled.button<{ selected?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    font-size: 1.5em;
    color: white;
    background-color: ${(props) => props.selected && theme.color.selected};

    &:hover {
        background-color: ${(props) => (props.selected ? `#546b83` : `rgba(0, 0, 0, 0.25)`)};
    }

    &:active {
        background-color: rgba(0, 0, 0, 0.5);
    }
`;

/**
 * Styled text used for the select button component.
 */
export const SelectButtonText = styled.span`
    color: ${theme.color.white};
    font-size: 0.85em;
`;

/**
 * Props accepted by the IconSelectButton component.
 */
export type IconSelectButtonProps = {
    /**
     * Is this button selected?
     */
    selected?: boolean;

    /**
     * The text to display.
     */
    text?: string;

    /**
     * The icon to display.
     */
    icon?: IconDescription | string;

    /**
     * The icon height.
     */
    iconHeight?: number;

    /**
     * The icon width.
     */
    iconWidth?: number;

    /**
     * Function called when the button is clicked.
     */
    onClick?: () => void;
} & ComponentProps;

/**
 * Styled select button component with 'icon' and 'text' subcomponents.
 *
 * @param props the component props
 * @constructor
 */
export const IconSelectButton = (props: IconSelectButtonProps) => {
    const iconHeight = props.iconHeight || 30;
    const iconWidth = props.iconHeight || 90;

    let icon;
    if (props.icon) {
        icon = <UIIcon
            path={props.icon}
            height={iconHeight}
            width={iconWidth}
            foregroundColor={theme.color.white}
        />
    }

    return (
        <SelectButton className={props.className} onClick={props.onClick} selected={props.selected}>
            {props.icon && icon}
            {props.text && <SelectButtonText>{props.text}</SelectButtonText>}
            {props.icon && <EmptyIcon $height={iconHeight} $width={iconWidth} />}
        </SelectButton>
    );
};

/**
 * An empty space which centers the content.
 */
const EmptyIcon = styled.div<{$width: number, $height: number}>`
    height: ${props => props.$height}px;
    width: ${props => props.$width}px;
`;
