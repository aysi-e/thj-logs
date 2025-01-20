import Entity, {DamageShieldDamage, MeleeDamage, SpellDamage} from "../../../parser/entity";
import { Encounter } from "../../../parser/parser";
import {values} from "lodash";
import DetailChart, {DetailItem} from "./DetailChart.tsx";

/**
 * Props accepted by encounter detail charts.
 */
type Props = {
    /**
     * The encounter object.
     */
    encounter: Encounter;

    /**
     * The entity that should be used for the chart.
     */
    entity: Entity;
}

type DamageShieldBreakdownItem = {
    name: string;
    type: `ds`,
    damage: DamageShieldDamage,
}

type MeleeBreakdownItem = {
    name: string;
    type: `melee`,
    damage: MeleeDamage,
}

type SpellBreakdownItem = {
    name: string;
    type: `spell`,
    damage: SpellDamage,
}

/**
 * Convert an entity object into an appropriate data type to use for our damage meter.
 *
 * @param entity the entity object
 * @param encounter the encounter object
 */
const toDamageBreakdownItems = (entity: Entity, encounter: Encounter): DetailItem[] => {
    const items: Record<string, DamageShieldBreakdownItem | MeleeBreakdownItem | SpellBreakdownItem> = {};
    let damage = 0;

    // un-spool the damage shield section
    values(entity.incoming.ds).forEach((dm) => {
        values(dm).forEach((ds) => {
            if (!items[`ds-${ds.effect}`]) items[`ds-${ds.effect}`] = {
                name: `${ds.effect} (damage shield)`,
                damage: new DamageShieldDamage(ds.effect, `all`),
                type: `ds`,
            };
            (items[`ds-${ds.effect}`] as DamageShieldBreakdownItem).damage.addFrom(ds);
            damage += ds.total;
        });
    });

    // un-spool the melee damage section
    values(entity.incoming.melee).forEach((mm) => {
        values(mm).forEach((melee) => {
            if (!items[`melee-${melee.type}`]) items[`melee-${melee.type}`] = {
                name: melee.type,
                damage: new MeleeDamage(melee.type, `all`),
                type: `melee`,
            };
            (items[`melee-${melee.type}`] as MeleeBreakdownItem).damage.addFrom(melee);
            damage += melee.total;
        });
    });

    // un-spool the spell damage section
    values(entity.incoming.spell).forEach((sm) => {
        values(sm).forEach((spell) => {
            if (!items[`spell-${spell.name}`]) items[`spell-${spell.name}`] = {
                name: spell.name,
                damage: new SpellDamage(spell.name, `all`),
                type: `spell`,
            };
            (items[`spell-${spell.name}`] as SpellBreakdownItem).damage.addFrom(spell);
            damage += spell.total;
        });
    });

    return values(items).map(it => ({
        name: it.name,
        type: it.type,
        damage: it.damage,
        perSecond: it.damage.total / encounter.duration * 1000,
        percent: it.damage.total / damage * 100,
        label: `DPS`,
    })).sort((a, b) => b.damage.total - a.damage.total) as DetailItem[];
};

/**
 * An encounter chart which displays data based on damage done during an encounter, broken down by damage type.
 */
const IncomingDamageBreakdownChart = ({encounter, entity}: Props) => {
    const title = `damage taken by ${entity.name}`;
    const items = toDamageBreakdownItems(entity, encounter);
    return <DetailChart title={title} items={items}/>
}

export default IncomingDamageBreakdownChart;
