import { makeAutoObservable, runInAction } from 'mobx';
import { Encounter } from '../parser/parser.ts';
import { createContext } from 'react';
import {
    EncounterMessage,
    ErrorMessage,
    MetadataMessage,
    ProgressMessage,
} from '../parser/messages.ts';
import { round } from 'lodash';

/**
 * State class representing an uploaded combat log.
 */
export class Log {
    /**
     * The timestamp of the start time for this combat log.
     */
    start: number | undefined = undefined;

    /**
     * The timestamp of the end time for this combat log.
     */
    end: number | undefined = undefined;

    /**
     * The name of the logging player.
     */
    loggedBy: string | undefined = undefined;

    /**
     * The progress we've made parsing the combat log, as a percent from 0-100.
     *
     * Undefined if we are not currently parsing a combat log.
     */
    progress: number | undefined = undefined;

    /**
     * The list of encounters from a parsed combat log.
     */
    encounters: Encounter[] = [];

    /**
     * Construct a log state object.
     */
    constructor() {
        makeAutoObservable(this);
    }

    /**
     * Parse a log file, adding any encounters found to the log state.
     *
     * @param file the file to parse
     */
    parseFile(file: File) {
        runInAction(() => {
            this.encounters = [];
            this.progress = 0;
        });

        const worker = new Worker(new URL('../parser/worker.ts', import.meta.url), {
            type: 'module',
        });

        worker.onmessage = (
            e: MessageEvent<EncounterMessage | MetadataMessage | ErrorMessage | ProgressMessage>,
        ) => {
            const message = e.data;
            switch (message.type) {
                case 'encounter':
                    runInAction(() => this.encounters.push(message.encounter));
                    break;
                case 'metadata':
                    runInAction(() => {
                        this.loggedBy = message.loggedBy;
                        this.end = message.end;
                        this.start = message.start;
                    });
                    break;
                case 'error':
                    // todo: error handling
                    break;
                case 'progress':
                    runInAction(() => {
                        this.progress = round((message.current / message.total) * 100);
                    });
                    break;
            }
        };

        worker.postMessage(file);
    }
}

/**
 * A log context.
 */
export const LogContext = createContext<Log>(new Log());
