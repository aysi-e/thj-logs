import {Encounter} from "../../parser/parser.ts";
import Entity from "../../parser/entity.ts";
import styled from "styled-components";
import {round, values} from "lodash";
import theme from "../../theme.tsx";
import {Link} from "react-router-dom";

type DamageItem = {
    id: string;
    name: string;
    damage: number;
    dps: number;
    index: number,
}

/**
 * Convert an entity object into an appropriate data type to use for our damage meter.
 *
 * @param entity the entity object
 * @param encounter the encounter object
 * @param index the entity index
 */
const toDamageItem = (entity: Entity, encounter: Encounter, index: number) => {
    let damage = 0;

    // un-spool the damage shield section
    values(entity.outgoing.ds).forEach((dm) => {
        values(dm).forEach((ds) => {
            damage += ds.total;
        });
    });

    // un-spool the melee damage section
    values(entity.outgoing.melee).forEach((mm) => {
        values(mm).forEach((melee) => {
            damage += melee.total;
        });
    });

    // un-spool the spell damage section
    values(entity.outgoing.spell).forEach((sm) => {
        values(sm).forEach((spell) => {
            damage += spell.total;
        });
    });

    return {
        id: entity.id,
        name: entity.name || entity.id,
        damage,
        dps: damage / encounter.duration * 1000,
        index,
    }
};

/**
 * A damage meter component which totals the amount of damage done by each non-enemy entity.
 *
 * @param encounter the encounter
 * @constructor
 */
const DamageMeter = ({encounter}: {encounter: Encounter}) => {
    let total = 0;
    const items = values(encounter.entities)
        .map((it, index) => {
            if (!it.isEnemy) {
                const item = toDamageItem(it, encounter, index);
                total += item.damage;
                return item;
            }
            return undefined;
        })
        .filter(it => it !== undefined)
        .sort((a, b) => b.damage - a.damage);
    return <Container>
        <ItemContainer width={0}>{total} damage ({round(total / encounter.duration * 1000)} DPS)</ItemContainer>
        {items.map(item => <Link key={item.id} to={`character/${item.index}`}><DamageMeterItem item={item} total={total}/></Link>)}
    </Container>
}

export default DamageMeter;

/**
 * A styled container div.
 */
const Container = styled.div`
    border: white 2px solid;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px;
`;

const DamageMeterItem = ({item, total}: {item: DamageItem, total: number}) => {
    const percent = round(item.damage/total * 100, 2);
    return <ItemContainer width={round(item.damage/total * 100, 2)}>{item.name} {item.damage} {round(item.dps)} {percent}%</ItemContainer>
}

const ItemContainer = styled.div<{width: number}>`
    padding: 4px;
    background: linear-gradient(to right, ${theme.color.secondary}, ${theme.color.secondary} ${props => props.width}%, transparent ${props => props.width}% 100%);
`;
