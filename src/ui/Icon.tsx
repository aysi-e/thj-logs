import { ComponentProps } from '../theme.tsx';
import { JSX } from 'react';

/**
 * Props accepted by the Icon component.
 */
type Props = {
    height: number | string;
    width: number | string;
    path: string | IconDescription;
    backgroundColor?: string;
    foregroundColor?: string;
};

/**
 * Type describing an IconDescription.
 */
export type IconDescription = {
    path: string | JSX.Element;
    viewbox: string;
};

/**
 * A svg icon component appropriate for Google Fonts-based icon paths.
 */
export const UIIcon = (props: Props & ComponentProps) => (
    <svg
        className={props.className}
        xmlns='http://www.w3.org/2000/svg'
        viewBox={getViewbox(props) || '0 0 48 48'}
        height={props.height || 48}
        width={props.width || 48}
        fill={getElementPath(props) && (props.foregroundColor || `white`)}
    >
        {getElementPath(props) || (
            <g>
                <path
                    d={getTextPath(props)}
                    fill={props.foregroundColor || `white`}
                    fillOpacity='1'
                />
            </g>
        )}
    </svg>
);

/**
 * Check if the props object contains a text 'path' to use for the SVG content. If it does, return it.
 *
 * @param props the props object
 */
const getTextPath = (props: Props & ComponentProps) =>
    typeof props.path === 'string'
        ? props.path
        : typeof (props.path as IconDescription).path === 'string'
          ? ((props.path as IconDescription).path as string)
          : undefined;

/**
 * Check if the props object contains a specific viewbox to use for the SVG content. If it does, return it.
 *
 * @param props the props object
 */
const getViewbox = (props: Props & ComponentProps) =>
    typeof props.path === 'string' ? undefined : (props.path as IconDescription).viewbox;

/**
 * Check if the props object contains an Element 'path' to use for the SVG content. If it does, return it.
 *
 * @param props the props object
 */
const getElementPath = (props: Props & ComponentProps) =>
    typeof props.path === 'string'
        ? undefined
        : typeof (props.path as IconDescription).path === 'string'
          ? undefined
          : ((props.path as IconDescription).path as JSX.Element);

/**
 * An 'upload' icon from Google Icons.
 */
export const UI_UPLOAD = {
    path: 'M440-320v-326L336-542l-56-58 200-200 200 200-56 58-104-104v326h-80ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z',
    viewbox: '0 -960 960 960',
};

/**
 * A 'cancel' icon from Google Icons.
 */
export const UI_CANCEL = {
    path: 'm256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z',
    viewbox: '0 -960 960 960',
};

/**
 * A 'warning' icon from Google Icons.
 */
export const UI_WARNING = {
    path: 'm40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z',
    viewbox: '0 -960 960 960',
};
