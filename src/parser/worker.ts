// webworker block.

import { Parser } from '@aysie/thj-parser-lib';

const FILENAME_PARSER = new RegExp(`eqlog_(\\w+)_thj.txt`);

/**
 * Attempt to read a character name from the log file name.
 *
 * @param fileName the log file name
 */
const getNameFromFileName = (fileName: string) => {
    const result = FILENAME_PARSER.exec(fileName);
    if (result) return result[1];
    return undefined;
};

{
    /**
     * Entrypoint to the webworker function.
     *
     * @param e the event.
     */
    onmessage = (e: MessageEvent<File>) => {
        if (e.data.type !== 'text/plain') {
            // if the file type is obviously wrong, get out of here.
            return;
        }

        e.data.text().then((log) => {
            const parser = new Parser(log);
            parser.player.name = getNameFromFileName(e.data.name);

            postMessage({
                type: `progress`,
                total: parser.lines.length,
                current: parser.index,
            });

            let encounter = parser.parseNext();
            while (encounter !== undefined) {
                postMessage({
                    type: 'encounter',
                    encounter,
                });

                postMessage({
                    type: `progress`,
                    total: parser.lines.length,
                    current: parser.index,
                });

                encounter = parser.parseNext();
            }

            postMessage({
                type: `progress`,
                total: parser.lines.length,
                current: parser.lines.length,
            });

            if (!parser.player.name) {
                postMessage({
                    type: 'error',
                    message: `couldn't determine logging player's name`,
                });
            } else {
                postMessage({
                    type: `metadata`,
                    loggedBy: parser.player.name,
                    start: parser.start!,
                    end: parser.end!,
                });
            }
        });
    };
}
