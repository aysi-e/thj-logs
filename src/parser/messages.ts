import { Encounter } from './parser.ts';
import Timeline from './timeline.ts';

/**
 * Type representing a progress report from the parser.
 */
export type ProgressMessage = {
    /**
     * This is a progress message.
     */
    type: 'progress';

    /**
     * The current progress.
     */
    current: number;

    /**
     * The total number of lines in the log file.
     */
    total: number;
};

/**
 * Type representing an encounter from the parser.
 */
export type EncounterMessage = {
    /**
     * This is an encounter message.
     */
    type: 'encounter';

    /**
     * The encounter data.
     */
    encounter: Encounter;
};

/**
 * Type representing metadata parsed from the log.
 */
export type MetadataMessage = {
    /**
     * This is a metadata message.
     */
    type: 'metadata';

    /**
     * The name of the player who generated the log.
     */
    loggedBy: string;

    /**
     * The timestamp of the first event in the log.
     */
    start: number;

    /**
     * The timestamp of the last event in the log.
     */
    end: number;
};

/**
 * Type representing an error which occurred while parsing the log.
 */
export type ErrorMessage = {
    /**
     * This is an error message.
     */
    type: 'error';

    /**
     * The error message.
     */
    message: string;
};
