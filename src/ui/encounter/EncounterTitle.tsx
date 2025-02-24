import { useEncounter } from '../../state/encounter.ts';
import styled from 'styled-components';
import { Header } from '../Common.tsx';
import { map, size } from 'lodash';
import { UI_CANCEL, UI_WARNING, UIIcon } from '../Icon.tsx';
import theme from '../../theme.tsx';
import Tooltip, { BasicTooltip } from '../Tooltip.tsx';
import { Link, useSearchParams } from 'react-router-dom';

/**
 * Component which displays a title bar for an encounter.
 *
 * @constructor
 */
const EncounterTitle = () => {
    const encounter = useEncounter();
    const [nav] = useSearchParams();
    const mode = nav.get('mode');
    const startText = encounter.start.toLocaleString({
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
    return (
        <TitleHeader background={`secondary`}>
            <Content>
                <EncounterWarnings />
                <Link to={`/encounter/${encounter.id}${mode ? `?mode=${mode}` : ``}`}>
                    <Text>
                        <TimeText>{startText}</TimeText>
                        <span>{` ${encounter.isFailed ? `defeated by` : `killed`} `}</span>
                        <ColoredText $failed={encounter.isFailed}>{encounter.title}</ColoredText>
                        <span>{` in `}</span>
                        <ColoredText $failed={encounter.isFailed}>
                            {encounter.duration.rescale().toHuman()}
                        </ColoredText>
                    </Text>
                </Link>
            </Content>
            <ButtonContainer to={`/encounter`}>
                <UIIcon path={UI_CANCEL} height={24} width={24} />
            </ButtonContainer>
        </TitleHeader>
    );
};

export default EncounterTitle;

/**
 * A styled header component for the encounter title component.
 */
const TitleHeader = styled(Header)`
    justify-content: space-between;
`;

/**
 * A styled content div.
 */
const Content = styled.div`
    display: flex;
`;

/**
 * Styled div for title text.
 */
const Text = styled.div`
    padding: 8px;
`;

/**
 * Styled span for the time text in the header.
 */
const TimeText = styled.span`
    font-size: 0.9em;
`;

/**
 * Styled span for the colored text in the title.
 */
const ColoredText = styled.span<{ $failed: boolean }>`
    font-weight: bold;
    color: ${(props) => (props.$failed ? theme.color.error : theme.color.success)};
`;

/**
 * Render a header containing warning data for an encounter.
 *
 * @constructor
 */
const EncounterWarnings = () => {
    const encounter = useEncounter();
    if (size(encounter.warnings)) {
        return (
            <HeaderWarning>
                <StyledTooltip
                    renderTrigger={() => (
                        <UIIcon
                            height={18}
                            width={18}
                            path={UI_WARNING}
                            foregroundColor={theme.color.secondary}
                        />
                    )}
                    renderTooltip={() => (
                        <WarningTooltip>
                            <WarningHeader>
                                encountered the following warnings when parsing this encounter
                            </WarningHeader>
                            <WarningContent>
                                {map(encounter.warnings, (value, key) => (
                                    <div key={key}>
                                        {value.message} ({value.count} times)
                                    </div>
                                ))}
                            </WarningContent>
                        </WarningTooltip>
                    )}
                    placement={`bottom`}
                    arrow
                />
            </HeaderWarning>
        );
    } else {
        return <></>;
    }
};

/**
 * Styled div for the warning element in the header.
 */
const HeaderWarning = styled.div`
    justify-content: center;
    align-items: center;
    display: flex;
    cursor: pointer;
    padding: 0 8px;
    z-index: 1;
`;

/**
 * A styled tooltip for the encounter warnings.
 */
const StyledTooltip = styled(Tooltip)`
    display: flex;
`;

/**
 * A styled tooltip container for the encounter warnings.
 */
const WarningTooltip = styled(BasicTooltip)`
    max-width: 500px;
`;

/**
 * A header component for the encounter warnings.
 */
const WarningHeader = styled.div`
    padding: 4px;
    width: calc(100% - 8px);
    color: ${theme.color.white};
    font-family: ${theme.font.header};
    border-bottom: 1px solid ${theme.color.secondary};
    text-align: center;
`;

/**
 * Styled content div for the encounter warnings.
 */
const WarningContent = styled.div`
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: center;
`;

/**
 * Styled div for an icon button.
 */
const ButtonContainer = styled(Link)`
    display: flex;
    flex-shrink: 0;

    width: 46px;

    justify-content: center;
    align-items: center;
    cursor: pointer;

    &:hover {
        background-color: rgba(0, 0, 0, 0.25);
    }

    &:active {
        background-color: rgba(0, 0, 0, 0.5);
    }
`;
