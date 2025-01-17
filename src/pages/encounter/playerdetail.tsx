import {observer} from "mobx-react";
import {Navigate, useParams} from "react-router-dom";
import styled from "styled-components";
import theme from "../../theme.tsx";
import {Encounter} from "../../parser/parser.ts";
import {concat, forEach, round, values} from "lodash";
import Entity, {CombatEvents, DamageShieldDamage, MeleeDamage, SpellDamage} from "../../parser/entity.ts";

type PlayerDetailData = {
    /**
     * The total damage dealt by this player
     */
    total: number;

    /**
     * List containing all damage done by this player, separated by damage type.
     */
    items: (MeleeDamageItem | SpellDamageItem | DamageShieldItem)[];
}

type MeleeDamageItem = {
    /**
     * This type represents a melee damage item.
     */
    type: 'melee',

    /**
     * The melee damage object, representing damage done to all targets.
     */
    damage: MeleeDamage,

    /**
     * A map containing damage done by this melee damage type by target.
     */
    byTarget: Record<string, MeleeDamage>,
}

type SpellDamageItem = {
    /**
     * This type represents a spell damage item.
     */
    type: 'spell',

    /**
     * The spell damage object, representing damage done to all targets.
     */
    damage: SpellDamage,

    /**
     * A map containing damage done by this spell damage type by target.
     */
    byTarget: Record<string, SpellDamage>,
}

type DamageShieldItem = {
    /**
     * This type represents a damage shield item.
     */
    type: 'ds',

    /**
     * The damage shield object, representing damage done to all targets.
     */
    damage: DamageShieldDamage,

    /**
     * A map containing damage done by this damage shield by target.
     */
    byTarget: Record<string, DamageShieldDamage>,
}

/**
 * Convert a CombatEvents object into an appropriate format for the PlayerDetailPage.
 *
 * @param ce
 */
const toPlayerDamageItems = (ce: CombatEvents) => {
    const result: PlayerDetailData = {
        total: 0,
        items: [],
    };

    const melee: Record<string, MeleeDamageItem> = {};
    forEach(ce.melee, (meleeMap, targetId) => {
        forEach(meleeMap, (md, type) => {
            if (!melee[type]) melee[type] = {
                type: 'melee',
                damage: new MeleeDamage(type, "all"),
                byTarget: {}
            };

            melee[type].damage.addFrom(md);
            melee[type].byTarget[targetId] = md;
            result.total += md.total;
        });
    });

    const spell: Record<string, SpellDamageItem> = {};
    forEach(ce.spell, (spellMap, targetId) => {
        forEach(spellMap, (sd, spellName) => {
            if (!spell[spellName]) spell[spellName] = {
                type: 'spell',
                damage: new SpellDamage(spellName, "all"),
                byTarget: {}
            };

            spell[spellName].damage.addFrom(sd);
            spell[spellName].byTarget[targetId] = sd;
            result.total += sd.total;
        });
    });

    const ds: Record<string, DamageShieldItem> = {};
    forEach(ce.ds, (dsMap, targetId) => {
        forEach(dsMap, (dsd, effectString) => {
            if (!ds[effectString]) ds[effectString] = {
                type: 'ds',
                damage: new DamageShieldDamage(effectString, "all"),
                byTarget: {}
            };

            ds[effectString].damage.addFrom(dsd);
            ds[effectString].byTarget[targetId] = dsd;
            result.total += dsd.total;
        });
    });
    result.items = concat<MeleeDamageItem | SpellDamageItem | DamageShieldItem>(values(spell), values(melee), values(ds)).sort((a, b) => b.damage.total - a.damage.total);
    return result;
}

type Props = {
    encounter: Encounter,
}

const PlayerDetailPage = observer(({encounter}: Props) => {
    const params = useParams();
    if (params.id && !isNaN(parseInt(params.id))) {
        const entity = values(encounter.entities)[parseInt(params.id)];
        if (entity === undefined) return <Content>invalid id</Content>

        const outgoing = toPlayerDamageItems(entity.outgoing);
        return <Content>
            <ContentHeader>encounter details for {entity.name}</ContentHeader>
            <DetailContainer>
                {outgoing.items.map(it => {
                    switch (it.type) {
                        case "melee":
                            return <MeleeDetailItem key={`${it.type}-${it.damage.type}`} item={it} total={outgoing.total} />
                        case "spell":
                            return <SpellDetailItem key={`${it.type}-${it.damage.name}`} item={it} total={outgoing.total} />
                        case "ds":
                            return <DamageShieldDetailItem key={`${it.type}-${it.damage.effect}`} item={it} total={outgoing.total} />
                    }
                })}
            </DetailContainer>
        </Content>
    }

    return <Navigate to={`..`}/>
});

export default PlayerDetailPage;

/**
 * A styled content div.
 */
const Content = styled.div`
    font-family: ${theme.font.content};
    color: white;
    margin: auto;
`;

/**
 * A styled header div.
 */
const ContentHeader = styled.div`
    text-align: center;
`;

/**
 * A styled container div.
 */
const DetailContainer = styled.div`
    border: white 2px solid;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px;
`;

const SpellDetailItem = ({item, total}: {item: SpellDamageItem, total: number}) => {
    const percent = round(item.damage.total/total * 100, 2);
    //return <ItemContainer width={round(item.total/total * 100, 2)}>{item.name} {item.total} {round(item.dps)} {percent}%</ItemContainer>
    return <ItemContainer width={round(item.damage.total/total * 100, 2)}>{item.damage.name} {item.damage.total} {percent}%</ItemContainer>
}

const MeleeDetailItem = ({item, total}: {item: MeleeDamageItem, total: number}) => {
    const percent = round(item.damage.total/total * 100, 2);
    //return <ItemContainer width={round(item.total/total * 100, 2)}>{item.name} {item.total} {round(item.dps)} {percent}%</ItemContainer>
    return <ItemContainer width={round(item.damage.total/total * 100, 2)}>{item.damage.type} {item.damage.total} {percent}%</ItemContainer>
}

const DamageShieldDetailItem = ({item, total}: {item: DamageShieldItem, total: number}) => {
    const percent = round(item.damage.total/total * 100, 2);
    //return <ItemContainer width={round(item.total/total * 100, 2)}>{item.name} {item.total} {round(item.dps)} {percent}%</ItemContainer>
    return <ItemContainer width={round(item.damage.total/total * 100, 2)}>{item.damage.effect} {item.damage.total} {percent}%</ItemContainer>
}

const ItemContainer = styled.div<{width: number}>`
    padding: 4px;
    background: linear-gradient(to right, ${theme.color.secondary}, ${theme.color.secondary} ${props => props.width}%, transparent ${props => props.width}% 100%);
`;
