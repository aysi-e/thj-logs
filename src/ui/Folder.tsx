import theme, { ComponentProps } from '../theme';
import styled from 'styled-components';
import { ReactNode } from 'react';

/**
 * Define the props accepted by the Folder component.
 */
type Props = {
    title?: string;

    backgroundColor?: string;
    borderColor?: string;

    headerFont?: string;
    headerFontSize?: string;
    headerFontColor?: string;

    children?: ReactNode;
} & ComponentProps;

/**
 * A basic, reusable Folder component which can contain all sorts of content.
 */
const Folder = ({
                    title = '',
                    backgroundColor = theme.color.darkGrey,
                    borderColor = theme.color.secondary,
                    headerFont = theme.font.header,
                    headerFontSize = `1em`,
                    headerFontColor = `black`,
                    className,
                    children,
                }: Props) => (
    <Container className={className}>
        <Header $borderColor={borderColor}>
            <HeaderText
                $fontSize={headerFontSize}
                $font={headerFont}
                $fontColor={headerFontColor}
                $borderColor={borderColor}
            >
                <Title>{title}</Title>
            </HeaderText>
            <BlockContainer $borderColor={borderColor}>
                <Block $borderColor={borderColor} />
            </BlockContainer>
        </Header>
        <Content $borderColor={borderColor} $backgroundColor={backgroundColor}>
            {children}
        </Content>
    </Container>
);

export default Folder;

/**
 * A container div for the Folder component.
 */
const Container = styled.div`
    min-width: 100px;
    filter: ${theme.style.dropShadow};
`;

/**
 * Props required for the Header component.
 */
type HeaderProps = {
    $borderColor: string;
    $fontColor: string;
    $font: string;
    $fontSize: string;
};

/**
 * A header div for the Folder component.
 */
const Header = styled.div<{ $borderColor: string }>`
    display: flex;
    width: 100%;

    border-left: 2px solid ${(props) => props.$borderColor};
`;

/**
 * A div inside the header that positions the text.
 */
const HeaderText = styled.div<HeaderProps>`
    padding-left: 4px;
    background: ${(props) => props.$borderColor};
    color: ${(props) => props.$fontColor};
    font-family: ${(props) => props.$font};
    font-size: ${(props) => props.$fontSize};
    display: flex;
`;

/**
 * A div containing title text.
 */
const Title = styled.div`
    margin-top: 2px;
    user-select: none;
`;

/**
 * Container which positions the Block element to create the header effect.
 */
const BlockContainer = styled.div<{ $borderColor: string }>`
    height: auto;
    position: static;
    background: ${(props) => `linear-gradient(
              to right,
              ${props.$borderColor},
              ${props.$borderColor} 42%,
              transparent 42%);`};
`;
/**
 * A div which creates the header triangle effect.
 */
const Block = styled.div<{ $borderColor: string }>`
    position: relative;
    z-index: -1;
    display: flex;
    background: ${(props) => props.$borderColor};
    height: 100%;
    width: 30px;
    transform: skewX(45deg);
`;

/**
 * Content div for the Folder component.
 */
const Content = styled.div<{ $borderColor: string; $backgroundColor: string }>`
    padding: 12px;
    background: ${(props) => props.$backgroundColor};
    border: 2px solid ${(props) => props.$borderColor};
`;
