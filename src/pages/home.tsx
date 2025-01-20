import {observer} from "mobx-react";
import styled from "styled-components";
import {useContext, useEffect, useRef} from "react";
import {LogContext} from "../state/log.ts";
import theme from "../theme.tsx";
import {IconSelectButton} from "../ui/SelectButton.tsx";
import {UI_UPLOAD} from "../ui/Icon.tsx";
import {runInAction} from "mobx";
import {Navigate} from "react-router-dom";

/**
 * The home page.
 *
 * Provides log uploading functionality.
 */
const HomePage = observer(() => {
    const log = useContext(LogContext);
    const buttonRef = useRef<HTMLInputElement | null>(null);

    /**
     * Handle clicking the file upload button.
     */
    const handleClick = () => {
        buttonRef.current?.click();
    }

    /**
     * Handle receiving a file from the file input.
     */
    const handleFileInput = (event: Event) => {
        const files = (event.target as HTMLInputElement).files;
        runInAction(() => {
            if (files) {
                for (let i = 0; i < files.length; i++) {
                    // todo: this doesn't actually work for multiple files because parseFile overrides the log each
                    //  time
                    log.parseFile(files[i])
                }
            }
        });
    }

    /**
     * Set up an event listener to allow us to read files.
     */
    useEffect(() => {
        if (buttonRef.current) {
            buttonRef.current.addEventListener(`change`, handleFileInput);
        }

        return () => {
            buttonRef.current?.removeEventListener(`change`, handleFileInput)
        }
    }, []);

    // have we parsed a log?
    if (log.progress && log.progress >= 100) {
        return <Navigate to={`encounter`} />;
    }

    // if we're currently uploading, show a progress bar. if we aren't, show the file browser.
    const upload = log.progress !== undefined && log.progress < 100 ? <ProgressBar $progress={log.progress}>parsing log ({log.progress}%)</ProgressBar> : <>
        <StyledUploadButton icon={UI_UPLOAD} text={`open file browser`} onClick={handleClick}/>
        <input
            type="file"
            id="fileElem"
            multiple
            accept="text/plain"
            style={{display: `none`}}
            ref={buttonRef}
        />
    </>

    // we have not parsed a log.
    return <Container>
        <Content>
            <TextBox>
                <Header>thj log parser (local)</Header>
                <ContentText>
                    <div>drag and drop a log file to view details about your combat encounters</div>
                    <div>- no data is sent to a server (this client is open source)</div>
                    <div>- the report is not sharable and only persists for the duration of your browser session</div>
                </ContentText>
            </TextBox>
            {upload}
        </Content>
        <Footer>
            {
                //<FooterText>click for credits and attributions</FooterText>
            }
            <div>not affiliated with or endorsed by EverQuest, Daybreak Games, or the Heroes Journey team</div>
        </Footer>
    </Container>


});

export default HomePage;

/**
 * A styled container div.
 */
const Container = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
`;

/**
 * A styled content div.
 */
const Content = styled.div`
    font-family: ${theme.font.content};
    margin: auto;
    max-width: 600px;
`;

const TextBox = styled.div`
    border: 1px solid ${theme.color.secondary};
`;

/**
 * A styled div for the text content.
 */
const ContentText = styled.div`
    background: ${theme.color.darkerGrey};
    color: ${theme.color.white};
    padding: 16px;
`;

/**
 * A styled div for header text.
 */
const Header = styled.div`
    background: ${theme.color.darkerBackground};
    color: ${theme.color.white};
    font-size: 1.25em;
    text-align: center;
    padding: 8px;
    border-bottom: 1px solid ${theme.color.secondary};
`;

/**
 * A footer component.
 */
const Footer = styled.div`
    position: absolute;
    width: calc(100vw - 24px);
    bottom: 12px;
    color: white;
    font-size: 1em;
    font-family: ${theme.font.content};
    text-align: right;
`;

/**
 * Styled span for the footer text (contains the 'credits and attributions' link).
 */
const FooterText = styled.span`
    cursor: pointer;
`;

/**
 * A styled upload button.
 */
const StyledUploadButton = styled(IconSelectButton)`
    cursor: pointer;
    background-color: ${theme.color.darkerBackground};
    margin-top: 8px;
    width: 100%;
    border: 1px solid ${theme.color.secondary};
`;

/**
 * A progress bar div.
 */
const ProgressBar = styled.div<{$progress: number}>`
    background: linear-gradient(to right, ${theme.color.success}, ${theme.color.success} ${props => props.$progress}%, transparent ${props => props.$progress}% 100%);
    color: ${props => props.$progress > 50 ? `black` : `white`};
    font-size: 1.25em;
    font-family: ${theme.font.content};
    height: 30px;
    padding: 8px;
    width: calc(100% - 16px);
    margin-top: 8px;
    border: 1px solid ${theme.color.secondary};
    text-align: center;
    line-height: 30px;
`;
