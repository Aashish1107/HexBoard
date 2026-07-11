import { HexCoordinate } from "./client/HexCoordinate.js";
import { HexDirection, move, rotate } from "./client/HexDirection.js";
import { Terrain } from "./client/Terrain.js"; 
import { TerrainMap } from "./client/TerrainMap.js";

export class HexWorld {
    readonly id : string;
    readonly map : TerrainMap;
    readonly userLocations : Map<string, HexCoordinate> = new Map();

    constructor(id: string, map: TerrainMap) {
        this.id = id;
        this.map = map;
    }

    /**
     * Return the IDs of all in this world.
     * @returns An array of user IDs in the world
     */
    getUserIDs() : string[] {
        return Array.from(this.userLocations.keys());
    }

    /**
     * Returns the location of a user in this world.
     * @param userID The ID of the user to get the location of
     * @returns where they are (if they are in the world)
     */
    public getUserLocation(userID: string) : HexCoordinate | undefined {
        return this.userLocations.get(userID);
    }

    /**
     * Determine if there is a user at this coordinate.
     * (There should be at most one such).
     * @param HexCoordinate The coordinate to check
     * @returns the user at this coordinate, if any
     */
    public at(coord: HexCoordinate) : string | undefined {
        let result : string | undefined = undefined;
        this.userLocations.forEach((value, key) => {
            if (value.equals(coord)) {
                result = key;
            }
        });
        return result;
    }

    private static * places() : Generator<HexCoordinate> {
        let c = new HexCoordinate(0,0);
        yield c;
        let dist = 0;
        while (true) {
            dist++;
            c = move(c,HexDirection.EAST);
            let d = HexDirection.SOUTHWEST;
            do {
                for (let i = 0; i < dist; ++i) {
                    c = move(c, d);
                    yield c;
                }
                d = rotate(d);
            } while (d !== HexDirection.SOUTHWEST);
        }
    }

    private static ATTEMPTS = 100;
    /**
     * Place a user in the world, if they are not there already.
     * @param userID The ID of the user to add
     * @returns where they were placed
     * @throws Error if the user is already in teh world, or
     * if it's too difficult to find a free OPEN coordinate.
     */
    public addUser(userID: string) : HexCoordinate {
        if (this.userLocations.has(userID)) {
            throw new Error("User " + userID + " is already in the world");
        }
        let count = 0;
        for (const coordinate of HexWorld.places()) {
            //console.log('checking ' + coordinate.toString());
            if (this.map.get(coordinate) === Terrain.Open &&
                this.at(coordinate) === undefined) {
                // found a free coordinate
                this.userLocations.set(userID, coordinate);
                return coordinate;
            }
            if (++count > HexWorld.ATTEMPTS) break;
        }
        throw new Error("Failed to find a free coordinate for user " + userID);
    }

    /**
     * Move the player within the world.
     * We don't check that they don't jump around.
     * @param userID The ID of the user to move
     * @param coordinate the location teh user wishes to move to
     * @throws Error if the user is not in the world, or
     * if the coordinate is already occupied, or
     * if the coordinate is not open.
     */
    public moveUser(userID: string, coordinate: HexCoordinate) : void {
        if (!this.userLocations.has(userID)) {
            throw new Error("User " + userID + " is not in the world");
        }
        if (this.userLocations.get(userID)?.equals(coordinate)) {
            // already there, do nothing
            return;
        }
        if (this.at(coordinate)) {
            throw new Error("Coordinate " + coordinate.toString() + " is already occupied");
        }
        const terr = this.map.get(coordinate);
        if (terr !== Terrain.Open) {
            throw new Error("Coordinate " + coordinate.toString() + " is not open");
        }
        this.userLocations.set(userID, coordinate);
    }

    /**
     * Remove a user from the world if they were there.
     * Do nothing otherwise.
     * @param userID The ID of the user to remove
     */
    public removeUser(userID: string) : void {
         this.userLocations.delete(userID);
    }

    /**
     * Returns whether the world is devoid of users.
     * @returns true if there are no users in the world
     */
    public isUnoccupied() : boolean {
        return this.userLocations.size === 0;
       
    }
}
