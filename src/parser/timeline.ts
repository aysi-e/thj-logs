import {first, includes, keys, last, range, reduce, round, size, values} from "lodash";

type TimelineItem = {

    /**
     * The key name for this timeline item (to merge identical sources of damage).
     */
    key: string;

    /**
     * The source id for this timeline event.
     */
    sourceId: string;

    /**
     * The target id for this timeline event.
     */
    targetId: string;

    /**
     * A display name representing the spell name, melee damage type, or effect description of this timeline item.
     */
    name: string;

    /**
     * The amount of damage represented by this timeline event.
     */
    amount: number;

};

export default class Timeline {

    /**
     * A map containing timeline events, keyed by the 'second' the event happened.
     */
    events: Record<number, Record<string, TimelineItem>> = {};

    /**
     * Add a damage event to the timeline.
     *
     * @param timestamp the timestamp of the damage event
     * @param sourceId the source which dealt damage
     * @param targetId the target of the damage
     * @param name the name of the damage event
     * @param type the type of damage event
     * @param amount the amount of damage dealt
     */
    addDamageEvent(timestamp: number, sourceId: string, targetId: string, name: string, type: `spell` | `melee` | `ds`, amount: number) {
        const timeKey = round(timestamp / 1000); // convert milliseconds to seconds (the log file is delineated in seconds).
        const itemKey = `${sourceId}-${targetId}-${type}-${name}`;
        if (!this.events[timeKey]) this.events[timeKey] = {};
        if (!this.events[timeKey][itemKey]) {
            this.events[timeKey][itemKey] = {
                key: itemKey,
                sourceId,
                targetId,
                name,
                amount: amount,
            }
        } else {
            this.events[timeKey][itemKey].amount += amount;
        }
    }

    /**
     * Replace all instances of `oldId` in timeline events with `newId`.
     *
     * This is (only) useful when we first discover the player character's name in a combat log.
     *
     * @param oldId
     * @param newId
     */
    replaceId(oldId: string, newId: string) {
        values(this.events).forEach(events => values(events).forEach(item => {
            if (item.sourceId === oldId) item.sourceId = newId;
            if (item.targetId === oldId) item.targetId = newId;
        }));
    }
}

/**
 * Generate data for a DPS line chart from this Timeline.
 */
export const toDPSData = (
    timeline: Timeline,
    start: number | undefined = undefined,
    end: number | undefined = undefined,
    sourceIds: string[] = [],
    targetIds: string[] = [],
    name: string | undefined = undefined
) => {
    if (size(timeline.events) === 0) return [];
    // if we have a start time (and it's later than our timeline start time), use it.
    const startTime = start && (start / 1000 > parseInt(first(keys(timeline.events))!)) ? round(start / 1000) : parseInt(first(keys(timeline.events))!)
    // if we have an end time (and it's earlier than our timeline end time), use it.
    const endTime = end && (end / 1000 < parseInt(last(keys(timeline.events))!)) ? round(end / 1000) : parseInt(last(keys(timeline.events))!)
    // if our start/end times are bad, error out.
    if (startTime > endTime) throw new Error(`start time was after end time when generating dps data`);

    /**
     * If we have a sourceIds list, filter the DPS data based on source id.
     *
     * @param item the item to evaluate
     */
    const sourceIdFilter = (item: TimelineItem) => {
        if (sourceIds.length) return includes(sourceIds, item.sourceId);
        return true;
    }

    /**
     * If we have a targetIds list, filter the DPS data based on target id.
     *
     * @param item the item to evaluate
     */
    const targetIdFilter = (item: TimelineItem) => {
        if (targetIds.length) return includes(targetIds, item.targetId);
        return true;
    }

    /**
     * If we have a damage name, filter the DPS data based on name
     *
     * @param item the item to evaluate
     */
    const nameFilter = (item: TimelineItem) => {
        if (name) return item.name === name;
        return true;
    }

    // for each second during our range, calculate the damage done (matching our filters).
    const damageItems = range(startTime, endTime).map((i, index) => {
        if (!timeline.events[i]) return {x: index, y: 0};
        return {
            x: index,
            y: reduce(values(timeline.events[i]), (acc, val) => {
                if (sourceIdFilter(val) && targetIdFilter(val) && nameFilter(val)) return acc + val.amount;
                return acc;
            }, 0)
        }
    });

    // calculate our DPS by averaging our damage data over 5 seconds (2 seconds before and 2 seconds after).
    const dps = damageItems.map((i, index, items) => {
        const s = Math.max(index - 2, 0);
        const e = Math.min(index + 2, items.length - 1);
        const y = range(s + 1, e).reduce((acc, val) => {
            return round((acc + items[val].y) / 2);
        }, items[s].y);

        return {
            time: i.x,
            dps: y
        }
    });

    return dps;
}
