import {groupBy} from "lodash";

/**
 * A list containing each known EverQuest boss, for encounter detection.
 */
export const KNOWN_BOSSES = [
    // -- classic era --
    {name: `Lady Vox`, zone: `Permafrost`, era: `classic`},
    {name: `Lord Nagafen`, zone: `Nagafen's Lair`, era: `classic`},

    // plane of fear
    {name: `Dread`, zone: `The Plane of Fear`, era: `classic`},
    {name: `Terror`, zone: `The Plane of Fear`, era: `classic`},
    {name: `Fright`, zone: `The Plane of Fear`, era: `classic`},
    {name: `Dracoliche`, zone: `The Plane of Fear`, era: `classic`},
    {name: `Cazic Thule`, zone: `The Plane of Fear`, era: `classic`},

    // plane of hate
    {name: `Innoruuk`, zone: `The Plane of Hate`, era: `classic`},

    // plane of sky
    {name: `Noble Dojorn`, zone: `The Plane of Sky`, era: `classic`},
    {name: `Keeper of Souls`, zone: `The Plane of Sky`, era: `classic`},
    {name: `Overseer of Air`, zone: `The Plane of Sky`, era: `classic`},
    {name: `Protector of Sky`, zone: `The Plane of Sky`, era: `classic`},
    {name: `Sister of the Spire`, zone: `The Plane of Sky`, era: `classic`},
    {name: `The Spiroc Lord`, zone: `The Plane of Sky`, era: `classic`},
    {name: `Gorgalosk`, zone: `The Plane of Sky`, era: `classic`},
    {name: `Bazzt Zzzt`, zone: `The Plane of Sky`, era: `classic`},
    {name: `Bazzzazzt`, zone: `The Plane of Sky`, era: `classic`},
    {name: `Bizazzzt`, zone: `The Plane of Sky`, era: `classic`},
    {name: `Bizzzzt`, zone: `The Plane of Sky`, era: `classic`},
    {name: `Bzzazzt`, zone: `The Plane of Sky`, era: `classic`},
    {name: `Bzzzt`, zone: `The Plane of Sky`, era: `classic`},
    {name: `Eye of Veeshan`, zone: `The Plane of Sky`, era: `classic`},
    {name: `the Hand of Veeshan`, zone: `The Plane of Sky`, era: `classic`},

    // -- kunark era --
    // chardok
    {name: `Overking Bathezid`, zone: `Chardok`, era: `kunark`},
    {name: `Prince Selrach Di\`zok`, zone: `Chardok`, era: `kunark`},
    {name: `Queen Velazul Di\`zok`, zone: `Chardok`, era: `kunark`},

    // dragons
    {name: `Kelorek\`Dar`, zone: `Cobalt Scar`, era: `kunark`},
    {name: `Gorenaire`, zone: `The Dreadlands`, era: `kunark`},
    {name: `Severilous`, zone: `The Emerald Jungle`, era: `kunark`},
    {name: `Trakanon`, zone: `The Ruins of Sebilis`, era: `kunark`},
    {name: `Talendor`, zone: `The Skyfire Mountains`, era: `kunark`},
    {name: `Faydedar`, zone: `Timorous Deep`, era: `kunark`},

    // kc
    {name: `Venril Sathir`, zone: `Karnor's Castle`, era: `kunark`},

    // veeshan's peak
    {name: `Druushk`, zone: `Veeshan's Peak`, era: `kunark`},
    {name: `Hoshkar`, zone: `Veeshan's Peak`, era: `kunark`},
    {name: `Nexona`, zone: `Veeshan's Peak`, era: `kunark`},
    {name: `Xygoz`, zone: `Veeshan's Peak`, era: `kunark`},
    {name: `Silverwing`, zone: `Veeshan's Peak`, era: `kunark`},
    {name: `Phara Dar`, zone: `Veeshan's Peak`, era: `kunark`},

    // -- velious era --
    // dragons
    {name: `Zlandicar`, zone: `Dragon Necropolis`, era: `velious`},
    {name: `Wuoshi`, zone: `The Wakening Land`, era: `velious`},
    {name: `Klandicar`, zone: `The Western Wastes`, era: `velious`},

    // faction leaders
    {name: `Dain Frostreaver IV`, zone: `Icewell Keep`, era: `velious`},
    {name: `King Tormax`, zone: `Kael Drakkel`, era: `velious`},
    {name: `The Avatar of War`, zone: `Kael Drakkel`, era: `velious`},
    {name: `Lord Yelinak`, zone: `Skyshrine`, era: `velious`},

    // misc
    {name: `Velketor the Sorcerer`, zone: `Velketor's Labyrinth`, era: `velious`},
    {name: `Bristlebane the King of Thieves`, zone: `The Plane of Mischief`, era: `velious`},

    // temple of veeshan
    {name: `Dozekar the Cursed`, zone: `The Temple of Veeshan`, era: `velious`},
    {name: `Aaryonar`, zone: `The Temple of Veeshan`, era: `velious`},
    {name: `Lady Mirenilla`, zone: `The Temple of Veeshan`, era: `velious`},
    {name: `Lady Nevederia`, zone: `The Temple of Veeshan`, era: `velious`},
    {name: `Lord Feshlak`, zone: `The Temple of Veeshan`, era: `velious`},
    {name: `Lord Koi\`Doken`, zone: `The Temple of Veeshan`, era: `velious`},
    {name: `Lord Kreizenn`, zone: `The Temple of Veeshan`, era: `velious`},
    {name: `Lord Vyemm`, zone: `The Temple of Veeshan`, era: `velious`},
    {name: `Vulak\`Aerr`, zone: `The Temple of Veeshan`, era: `velious`},

    // sleeper's tomb
    {name: `Kerafyrm`, zone: `The Sleeper's Tomb`, era: `velious`},

    // -- luclin era --
];

/**
 * A dictionary containing each known EverQuest boss, keyed by boss name, for encounter detection.
 */
export const BOSSES_BY_NAME = groupBy(KNOWN_BOSSES, it => it.name);
