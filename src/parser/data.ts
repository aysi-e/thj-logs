import { groupBy } from 'lodash';

/**
 * A list containing each known EverQuest boss, for encounter detection.
 */
export const KNOWN_BOSSES = [
    // -- classic era --
    { name: `Lady Vox`, zone: `Permafrost`, era: `classic` },
    { name: `Lord Nagafen`, zone: `Nagafen's Lair`, era: `classic` },

    // plane of fear
    { name: `Dread`, zone: `The Plane of Fear`, era: `classic` },
    { name: `Terror`, zone: `The Plane of Fear`, era: `classic` },
    { name: `Fright`, zone: `The Plane of Fear`, era: `classic` },
    { name: `Dracoliche`, zone: `The Plane of Fear`, era: `classic` },
    { name: `Cazic Thule`, zone: `The Plane of Fear`, era: `classic` },

    // plane of hate
    { name: `Innoruuk`, zone: `The Plane of Hate`, era: `classic` },

    // plane of sky
    { name: `Noble Dojorn`, zone: `The Plane of Sky`, era: `classic` },
    { name: `Keeper of Souls`, zone: `The Plane of Sky`, era: `classic` },
    { name: `Overseer of Air`, zone: `The Plane of Sky`, era: `classic` },
    { name: `Protector of Sky`, zone: `The Plane of Sky`, era: `classic` },
    { name: `Sister of the Spire`, zone: `The Plane of Sky`, era: `classic` },
    { name: `The Spiroc Lord`, zone: `The Plane of Sky`, era: `classic` },
    { name: `Gorgalosk`, zone: `The Plane of Sky`, era: `classic` },
    { name: `Bazzt Zzzt`, zone: `The Plane of Sky`, era: `classic` },
    { name: `Bazzzazzt`, zone: `The Plane of Sky`, era: `classic` },
    { name: `Bizazzzt`, zone: `The Plane of Sky`, era: `classic` },
    { name: `Bizzzzt`, zone: `The Plane of Sky`, era: `classic` },
    { name: `Bzzazzt`, zone: `The Plane of Sky`, era: `classic` },
    { name: `Bzzzt`, zone: `The Plane of Sky`, era: `classic` },
    { name: `Eye of Veeshan`, zone: `The Plane of Sky`, era: `classic` },
    { name: `the Hand of Veeshan`, zone: `The Plane of Sky`, era: `classic` },

    // -- kunark era --
    // chardok
    { name: `Overking Bathezid`, zone: `Chardok`, era: `kunark` },
    { name: `Prince Selrach Di\`zok`, zone: `Chardok`, era: `kunark` },
    { name: `Queen Velazul Di\`zok`, zone: `Chardok`, era: `kunark` },

    // dragons
    { name: `Kelorek\`Dar`, zone: `Cobalt Scar`, era: `kunark` },
    { name: `Gorenaire`, zone: `The Dreadlands`, era: `kunark` },
    { name: `Severilous`, zone: `The Emerald Jungle`, era: `kunark` },
    { name: `Trakanon`, zone: `The Ruins of Sebilis`, era: `kunark` },
    { name: `Talendor`, zone: `The Skyfire Mountains`, era: `kunark` },
    { name: `Faydedar`, zone: `Timorous Deep`, era: `kunark` },

    // kc
    { name: `Venril Sathir`, zone: `Karnor's Castle`, era: `kunark` },

    // veeshan's peak
    { name: `Druushk`, zone: `Veeshan's Peak`, era: `kunark` },
    { name: `Hoshkar`, zone: `Veeshan's Peak`, era: `kunark` },
    { name: `Nexona`, zone: `Veeshan's Peak`, era: `kunark` },
    { name: `Xygoz`, zone: `Veeshan's Peak`, era: `kunark` },
    { name: `Silverwing`, zone: `Veeshan's Peak`, era: `kunark` },
    { name: `Phara Dar`, zone: `Veeshan's Peak`, era: `kunark` },

    // -- loy --
    { name: `The Luggald Broodmother`, zone: `The Crypt of Nadox`, era: `loy` },
    { name: `Innoruuk`, zone: `The Crypt of Nadox`, era: `loy` },
    { name: `Spiritseeker Nadox`, zone: `The Crypt of Nadox`, era: `loy` },
    { name: `Captain Krasnok`, zone: `Hate's Fury`, era: `loy` },

    // -- velious era --
    // dragons
    { name: `Zlandicar`, zone: `Dragon Necropolis`, era: `velious` },
    { name: `Wuoshi`, zone: `The Wakening Land`, era: `velious` },
    { name: `Klandicar`, zone: `The Western Wastes`, era: `velious` },

    // faction leaders
    { name: `Dain Frostreaver IV`, zone: `Icewell Keep`, era: `velious` },
    { name: `King Tormax`, zone: `Kael Drakkel`, era: `velious` },
    { name: `The Avatar of War`, zone: `Kael Drakkel`, era: `velious` },
    { name: `Lord Yelinak`, zone: `Skyshrine`, era: `velious` },

    // misc
    { name: `Velketor the Sorcerer`, zone: `Velketor's Labyrinth`, era: `velious` },
    { name: `Bristlebane the King of Thieves`, zone: `The Plane of Mischief`, era: `velious` },

    // temple of veeshan
    { name: `Dozekar the Cursed`, zone: `The Temple of Veeshan`, era: `velious` },
    { name: `Aaryonar`, zone: `The Temple of Veeshan`, era: `velious` },
    { name: `Lady Mirenilla`, zone: `The Temple of Veeshan`, era: `velious` },
    { name: `Lady Nevederia`, zone: `The Temple of Veeshan`, era: `velious` },
    { name: `Lord Feshlak`, zone: `The Temple of Veeshan`, era: `velious` },
    { name: `Lord Koi\`Doken`, zone: `The Temple of Veeshan`, era: `velious` },
    { name: `Lord Kreizenn`, zone: `The Temple of Veeshan`, era: `velious` },
    { name: `Lord Vyemm`, zone: `The Temple of Veeshan`, era: `velious` },
    { name: `Vulak\`Aerr`, zone: `The Temple of Veeshan`, era: `velious` },

    // sleeper's tomb
    { name: `Kerafyrm`, zone: `The Sleeper's Tomb`, era: `velious` },

    // -- luclin era --
    { name: `an evolved burrower`, zone: `The Acrylia Caverns`, era: `luclin` },
    // todo: better encounter support for 'event' encounters with waves of enemies
    { name: `Khati Sha the Twisted`, zone: `The Acrylia Caverns`, era: `luclin` },

    { name: `The Va’Dyn`, zone: `The Akheva Ruins`, era: `luclin` },
    { name: `The Itraer Vius`, zone: `The Akheva Ruins`, era: `luclin` },
    { name: `The Insanity Crawler`, zone: `The Akheva Ruins`, era: `luclin` },
    { name: `Shei Vinitras`, zone: `The Akheva Ruins`, era: `luclin` },

    { name: `Servitor of Luclin`, zone: `Grieg's End`, era: `luclin` },
    { name: `Grieg Veneficus`, zone: `Grieg's End`, era: `luclin` },

    { name: `Lcea Katta`, zone: `Katta Castellum`, era: `luclin` },
    { name: `Nathyn Illuminious`, zone: `Katta Castellum`, era: `luclin` },

    // todo: better encounter support for 'event' encounters with waves of enemies
    { name: `a burrower parasite`, zone: `The Deep`, era: `luclin` },
    { name: `Thought Horror Overfiend`, zone: `The Deep`, era: `luclin` },

    { name: `Doomshade`, zone: `The Umbral Plains`, era: `luclin` },
    { name: `Rumblecrush`, zone: `The Umbral Plains`, era: `luclin` },
    { name: `Zelnithak`, zone: `The Umbral Plains`, era: `luclin` },

    { name: `Lord Inquisitor Seru`, zone: `Sanctus Seru`, era: `luclin` },

    // ssra temple
    { name: `a glyph covered serpent`, zone: `Ssraeshza Temple`, era: `luclin` },
    { name: `Vyzh\`dra the Exiled`, zone: `Ssraeshza Temple`, era: `luclin` },
    { name: `Vyzh\`dra the Cursed`, zone: `Ssraeshza Temple`, era: `luclin` },
    { name: `Rhag\`Zhezum`, zone: `Ssraeshza Temple`, era: `luclin` },
    { name: `Rhag\`Mozdezh`, zone: `Ssraeshza Temple`, era: `luclin` },
    { name: `Arch Lich Rhag\`Zadune`, zone: `Ssraeshza Temple`, era: `luclin` },
    { name: `High Priest of Ssraeshza`, zone: `Ssraeshza Temple`, era: `luclin` },
    { name: `Xerkizh the Creator`, zone: `Ssraeshza Temple`, era: `luclin` },
    { name: `Emperor Ssraeshza`, zone: `Ssraeshza Temple`, era: `luclin` },
    // there is actually a space at the end of the name `Emperor Ssraeshza `
    { name: `Emperor Ssraeshza `, zone: `Ssraeshza Temple`, era: `luclin` },

    // vex thal
    { name: `Va Dyn Khar`, zone: `Vex Thal`, era: `luclin` },
    { name: `Thall Va Xakra`, zone: `Vex Thal`, era: `luclin` },
    { name: `Kaas Thox Xi Ans Dyek`, zone: `Vex Thal`, era: `luclin` },
    { name: `Diabo Xi Va`, zone: `Vex Thal`, era: `luclin` },
    { name: `Diabo Xi Xin`, zone: `Vex Thal`, era: `luclin` },
    { name: `Diabo Xi Xin Thall`, zone: `Vex Thal`, era: `luclin` },
    { name: `Thall Va Kelun`, zone: `Vex Thal`, era: `luclin` },
    { name: `Diabo Xi Va Temariel`, zone: `Vex Thal`, era: `luclin` },
    { name: `Thall Xundraux Diabo`, zone: `Vex Thal`, era: `luclin` },
    { name: `Va Xi Aten Ha Ra`, zone: `Vex Thal`, era: `luclin` },
    { name: `Kaas Thox Xi Aten Ha Ra`, zone: `Vex Thal`, era: `luclin` },
    { name: `Aten Ha Ra`, zone: `Vex Thal`, era: `luclin` },
];

/**
 * A dictionary containing each known EverQuest boss, keyed by boss name, for encounter detection.
 */
export const BOSSES_BY_NAME = groupBy(KNOWN_BOSSES, (it) => it.name);
