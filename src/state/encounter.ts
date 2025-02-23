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

        // for enemies/allies, we will need:
        // - damage dealt by all enemies/allies, by target.
        // - damage dealt by all enemies/allies, by damage type.
        // - damage taken by all enemies/allies, by target.
        // - damage taken by all enemies/allies, by damage type.
        // - healing done by all enemies/allies, by target.
        // - healing taken by all enemies/allies, by target.

        // for each entity, we will need:
        // - damage done to all targets by damage type.
        // - damage done by target.
        // - damage done to each target by damage type.

        // - damage taken from all targets by damage type.
        // - damage taken by target.
        // - damage taken from each target by damage type.

        // - damage taken from all targets by damage type.
        // - damage taken by target.
        // - damage taken from each target by damage type.
    }
}

export default EncounterState;
