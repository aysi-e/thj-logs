import { Encounter } from '@aysi-e/thj-parser-lib';
import { makeAutoObservable } from 'mobx';

/**
 * State class associated with an individual encounter page.
 */
class EncounterState {
    /**
     * Construct an empty, default EncounterState object for a specific encounter.
     */
    constructor(encounter: Encounter) {
        makeAutoObservable(this);
    }
}

export default EncounterState;
