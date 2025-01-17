import {observer} from "mobx-react";
import {createRef, useEffect, useState} from "react";
import {find} from "lodash";
import styled from "styled-components";
import theme, {ComponentProps} from "../theme.tsx";

/**
 * Props accepted by the DropTarget component.
 */
type DropProps = {

    /**
     * Function called when a file is dropped.
     * @param file the dropped file
     */
    onDrop: (file: File) => void;
} & ComponentProps

/**
 * A full-page file drag-and-drop target.
 */
const DropTarget = observer(({onDrop, className}: DropProps) => {
    const [isActive, setActive] = useState(false);
    const dropTarget = createRef<HTMLDivElement>()
    let dragCounter = 0;

    const handleDrag = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragIn = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter++;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        if (e.dataTransfer?.items && find(e.dataTransfer.items, (it : DataTransferItem) => it.kind == 'file')) setActive(true);
    };

    const handleDragOut = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter--;
        if (dragCounter === 0) {
            setActive(false);
        }
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setActive(false);
        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            for (let i = 0; i < e.dataTransfer.files.length; i++) {
                const file = e.dataTransfer.files.item(i);
                if (file) onDrop(file);
            }
            e.dataTransfer.clearData();
            dragCounter = 0;
        }
    };

    useEffect(() => {
        const target = dropTarget.current;
        window.addEventListener('dragenter', handleDragIn)

        if (target) {
            target.addEventListener('dragleave', handleDragOut);
            target.addEventListener('dragover', handleDrag);
            target.addEventListener('drop', handleDrop);
        }
        return () => {
            window.removeEventListener('dragenter', handleDragIn)

            if (target) {
                target.removeEventListener('dragleave', handleDragOut);
                target.removeEventListener('dragover', handleDrag);
                target.removeEventListener('drop', handleDrop);
            }
        }
    });

    return <DropTargetContainer ref={dropTarget} $isActive={isActive} className={className}>
        {isActive && <DropTargetContent><DropTargetText>Drop to parse</DropTargetText></DropTargetContent>}
    </DropTargetContainer>
})

export default DropTarget;

const DropTargetContainer = styled.div<{$isActive: boolean}>`
  position: fixed;
  pointer-events: ${props => props.$isActive ? `all` : `none`};
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DropTargetContent = styled.div`
  background: rgba(0,0,0,.5);
  height: calc(100% - 4px);
  width: 100%;
  border: 2px ${theme.color.lightGrey} dashed;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DropTargetText = styled.div`
  font-family: ${theme.font.content};
  color: ${theme.color.white};
  font-size: 2em;
`;
