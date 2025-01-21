import { ReactNode, useRef, useState } from 'react';
import {
    arrow,
    autoUpdate,
    flip,
    offset,
    Placement,
    shift,
    useFloating,
    useHover,
    useInteractions,
} from '@floating-ui/react';
import styled from 'styled-components';
import theme, { ComponentProps } from '../theme';

/**
 * Props accepted by the Tooltip component.
 */
type Props = {
    renderTrigger: () => ReactNode;
    renderTooltip: () => ReactNode;
    arrow?: boolean;
    tooltipClassName?: string;
    placement?: Placement;

    /**
     * Should the tooltip be forced on or off? If true, the tooltip will be displayed. If false, the
     * tooltip will not be displayed. If undefined, the tooltip behavior will be normal (on mouseover).
     */
    forceTooltip?: boolean;
};

/**
 * Component that manages a component and a tooltip.
 */
const WithTooltip = (props: Props & ComponentProps) => {
    const arrowRef = useRef(null);
    const [open, setOpen] = useState(false);

    const {
        x,
        y,
        strategy,
        refs,
        context,
        placement,
        middlewareData: { arrow: { x: arrowX, y: arrowY } = {} },
    } = useFloating({
        placement: props.placement || `top`,
        open,
        onOpenChange: setOpen,
        middleware: [
            offset(8),
            flip(),
            shift(),
            arrow({
                element: arrowRef,
            }),
        ],
        whileElementsMounted: autoUpdate,
    });

    const hover = useHover(context, { move: false });
    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

    const staticSide: any = {
        top: 'bottom',
        right: 'left',
        bottom: 'top',
        left: 'right',
    }[placement.split('-')[0]];

    const isOpen =
        props.forceTooltip === undefined
            ? open
            : props.forceTooltip || (!props.forceTooltip && open);
    return (
        <>
            <Container ref={refs.setReference} {...getReferenceProps()} className={props.className}>
                {props.renderTrigger()}
            </Container>
            {isOpen && (
                <TooltipContainer
                    className={props.tooltipClassName}
                    ref={refs.setFloating}
                    $strategy={strategy}
                    y={y}
                    x={x}
                    {...getFloatingProps()}
                >
                    {props.renderTooltip()}
                    {props.arrow && (
                        <Arrow
                            ref={arrowRef}
                            style={{
                                left: arrowX != null ? `${arrowX}px` : '',
                                top: arrowY != null ? `${arrowY}px` : '',
                                [staticSide]: '-5px',
                            }}
                        />
                    )}
                </TooltipContainer>
            )}
        </>
    );
};

export default WithTooltip;

/**
 * Container div for the Tooltip component.
 */
const Container = styled.div`
    position: static;
    cursor: pointer;
`;

/**
 * Container div for the Tooltip component.
 */
const TooltipContainer = styled.div<any>`
    position: ${(props) => props.$strategy};
    top: ${(props) => props.y ?? 0}px;
    left: ${(props) => props.x ?? 0}px;
    width: max-content;
`;

/**
 * Arrow div for the tooltip component.
 */
const Arrow = styled.div<any>`
    position: absolute;
    width: 12px;
    height: 12px;
    background-color: #7a5c4f;
    transform: rotate(45deg);
`;

/**
 * A basic styled div suitable for use as a tooltip.
 */
export const BasicTooltip = styled.div`
    padding: 8px;
    background-color: #7a5c4f;
    color: white;
    font-family: ${theme.font.content};
    filter: ${theme.style.dropShadow};
`;
