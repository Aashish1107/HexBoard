import { Terrain } from './Terrain.js';

/**
 * The style to use when drawing the editor
 */
export interface Style {
    backgroundStyle: string;
    strokeStyle: string;
    lineWidth: number;
    terrainStyle : (t:Terrain) => string;
}

/**
 * A default implementation of Style
 */
export const defaultStyle : Style = {
    backgroundStyle: 'white',
    strokeStyle: 'black',
    lineWidth: 1,
    terrainStyle: (t:Terrain) => {
        switch (t) {
            case Terrain.Open: return 'beige';
            case Terrain.Glass: return 'lightcyan';
            case Terrain.Water: return 'cyan';
            case Terrain.Wall: return 'dimgray';
            case Terrain.Shrubbery: return 'olivedrab';
            case Terrain.Curtain: return 'thistle';
            default: return `hsb(0,0%,${(16-(t%16))/16*100}%)`;
        }
    }
};

export const DEFAULT_FILENAME = 'terrainmap.json';
 
export const NO_ID_PROVIDED = 'NO_ID_PROVIDED';