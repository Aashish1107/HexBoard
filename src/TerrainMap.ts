import { HexCoordinate } from "./HexCoordinate.js";
import { Terrain } from "./Terrain.js";

/**
 * A map from hex coordinates to terrain, representing a "world".
 */
export class TerrainMap {
    private data : Map<string,Terrain> = new Map<string,Terrain>();

    /**
     * Create a new terrain map.
     * @param json optional JSON object to initialize the map with
     * @throws Error if the JSON object is not valid
     */
    constructor(json ?: object) { 
        if (json !== undefined) {
            this.addJSON(json);
        }
    }
 
    public addJSON(json : object) {
        for (const [k,v] of Object.entries(json)) {
            if (typeof v !== 'number') {
                throw new Error("Invalid terrain map");
            }
            this.data.set(k, v as Terrain);
        }
    }

/**
     * Compute the terrain for a given hex coordinate.
     * @param h hex coordinate to get the terrain for
     * @returns terrain for this coordinate.
     */
    public get(h : HexCoordinate) : Terrain | undefined {
        return this.data.get(h.toString());
    }

    /**
     * Set the terrain at a given coordinate.   
     * @param h hex coordinate to set the terrain for
     * @param t terrain to set
     */
    public set(h : HexCoordinate, t : Terrain) {
        this.data.set(h.toString(), t);
    }

    /**
     * Remove the terrain at a given coordinate.
     * @param h hex coordinate to remove
     */
    public remove(h : HexCoordinate) {
        this.data.delete(h.toString());
    }

    /**
     * Return the contents as {key,terrain} objects.
     */
    public *[Symbol.iterator]() : Iterator<{key: HexCoordinate; terrain:Terrain}> {
        for (const [key,terrain] of this.data) {
            const h = HexCoordinate.fromString(key);
            yield ( { key:h, terrain } );
        }
    }
    
    /**
     * Return an object to be serialized as JSON.
     * @returns a JSON object for this map, of the form
     * where each hexagon is reprsented as a string
     * with the terrain as a number.
     */
    public toJSON() : {[key:string]:number} {
        const result : {[key:string]:number} = {};
        for (const [k,v] of this.data) {
            result[k] = v;
        }
        return result;
    }
}
