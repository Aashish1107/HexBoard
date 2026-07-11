import { nanoid } from "nanoid";
import { HexCoordinate } from "../../client/HexCoordinate";
import { Terrain } from "../../client/Terrain";
import { TerrainMap } from "../../client/TerrainMap";
import { HexWorld } from "../../HexWorld";

function hc(a:number,b:number) { return new HexCoordinate(a,b); }

describe('HexWorld', () => {
    let id : string;
    let map : TerrainMap;
    beforeEach(() => {
        id = nanoid()
        map = new TerrainMap();
        map.set(hc(0,0), Terrain.Open);
        map.set(hc(1,0), Terrain.Shrubbery);
        map.set(hc(0,1), Terrain.Water);
        map.set(hc(-1,-1), Terrain.Open);
        map.set(hc(3,-2), Terrain.Open);
    });

// =========================
// Start / basic checks
// =========================

    test('should set Id and Map', () => {
        const world = new HexWorld(id, map);
        expect(world.id).toBe(id);
        expect(world.map).toBe(map);
    });

    test('should be empty at start', () => {
        const world = new HexWorld(id, map);
        expect(world.getUserIDs()).toEqual([]);
        expect(world.getUserLocation(nanoid())).toBeUndefined();
        expect(world.at(hc(1,0))).toBeUndefined();
        expect(world.isUnoccupied()).toBe(true);
    });

// =========================
// addUser
// =========================

    test('should add first user', () => {
        const world = new HexWorld(id, map);
        const userID = nanoid();
        const loc = world.addUser(userID);
        expect(loc).toEqual(hc(0,0));
        expect(world.getUserIDs()).toEqual([userID]);
        expect(world.getUserLocation(userID)).toEqual(loc);
        expect(world.at(loc)).toBe(userID);
        expect(world.isUnoccupied()).toBe(false);
    });

    test('should add second user', () => {
        const world = new HexWorld(id, map);
        const userID1 = nanoid();
        const loc1 = world.addUser(userID1);
        expect(loc1).toEqual(hc(0,0));
        const userID2 = nanoid();
        const loc2 = world.addUser(userID2);
        expect(loc2).toEqual(hc(-1,-1));
        expect(world.getUserIDs().sort()).toEqual([userID1, userID2].sort());
        expect(world.getUserLocation(userID1)).toEqual(loc1);
        expect(world.getUserLocation(userID2)).toEqual(loc2);
        expect(world.at(loc1)).toBe(userID1);
        expect(world.at(loc2)).toBe(userID2);
    });

    test('should add third user', () => {
        const world = new HexWorld(id, map);
        const userID1 = nanoid();
        const loc1 = world.addUser(userID1);
        expect(loc1).toEqual(hc(0,0));
        const userID2 = nanoid();
        const loc2 = world.addUser(userID2);
        expect(loc2).toEqual(hc(-1,-1));
        const userID3 = nanoid();
        const loc3 = world.addUser(userID3);
        expect(loc3).toEqual(hc(3,-2));
        expect(world.getUserIDs().sort()).toEqual([userID1, userID2, userID3].sort());
        expect(world.getUserLocation(userID1)).toEqual(loc1);
        expect(world.getUserLocation(userID2)).toEqual(loc2);
        expect(world.getUserLocation(userID3)).toEqual(loc3);
        expect(world.at(loc1)).toBe(userID1);
        expect(world.at(loc2)).toBe(userID2);
        expect(world.at(loc3)).toBe(userID3);
    });

    test('should throw when no space', () => {
        const world = new HexWorld(id, map);
        const userID1 = nanoid();
        const loc1 = world.addUser(userID1);
        expect(loc1).toEqual(hc(0,0));
        const userID2 = nanoid();
        const loc2 = world.addUser(userID2);
        expect(loc2).toEqual(hc(-1,-1));
        const userID3 = nanoid();
        const loc3 = world.addUser(userID3);
        expect(loc3).toEqual(hc(3,-2));
        const userID4 = nanoid();
        expect(() => world.addUser(userID4)).toThrow();
        expect(world.getUserIDs().sort()).toEqual([userID1,userID2,userID3].sort());
        expect(world.getUserLocation(userID1)).toEqual(loc1);
        expect(world.at(loc1)).toBe(userID1);
    });

// =========================
// moveUser
// =========================

    test('should move user', () => {
        const world = new HexWorld(id, map);
        const userID = nanoid();
        const loc1 = world.addUser(userID);
        expect(loc1).toEqual(hc(0,0));
        world.moveUser(userID, hc(-1,-1));
        expect(world.getUserLocation(userID)).toEqual(hc(-1,-1));
        expect(world.at(hc(0,0))).toBeUndefined();
        expect(world.at(hc(-1,-1))).toBe(userID);
    });

    test('should not move to blocked tile', () => {
        const world = new HexWorld(id, map);
        const userID = nanoid();
        const loc1 = world.addUser(userID);
        expect(loc1).toEqual(hc(0,0));
        expect(() => world.moveUser(userID, hc(1,0))).toThrow();
        expect(world.getUserLocation(userID)).toEqual(hc(0,0));
        expect(world.at(hc(0,0))).toBe(userID);
    });

    test('should not move outside map', () => {
        const world = new HexWorld(id, map);
        const userID = nanoid();
        const loc1 = world.addUser(userID);
        expect(loc1).toEqual(hc(0,0));
        expect(() => world.moveUser(userID, hc(1,1))).toThrow();
        expect(world.getUserLocation(userID)).toEqual(hc(0,0));
        expect(world.at(hc(0,0))).toBe(userID);
    });

    test('should stay same if same location', () => {
        const world = new HexWorld(id, map);
        const userID = nanoid();
        const loc1 = world.addUser(userID);
        expect(loc1).toEqual(hc(0,0));
        world.moveUser(userID, hc(0,0));
        expect(world.getUserLocation(userID)).toEqual(hc(0,0));
        expect(world.at(hc(0,0))).toBe(userID);
    });

    test('should move second user', () => {
        const world = new HexWorld(id, map);
        const userID1 = nanoid();
        const loc1 = world.addUser(userID1);
        expect(loc1).toEqual(hc(0,0));
        const userID2 = nanoid();
        const loc2 = world.addUser(userID2);
        expect(loc2).toEqual(hc(-1,-1));
        world.moveUser(userID2, hc(3,-2));
        expect(world.getUserLocation(userID2)).toEqual(hc(3,-2));
        expect(world.at(hc(0,0))).toBe(userID1);
        expect(world.at(hc(-1,-1))).toBeUndefined();
        expect(world.at(hc(3,-2))).toBe(userID2);
    });

    test('should not move second user to blocked tile', () => {
        const world = new HexWorld(id, map);
        const userID1 = nanoid();
        const loc1 = world.addUser(userID1);
        expect(loc1).toEqual(hc(0,0));
        const userID2 = nanoid();
        const loc2 = world.addUser(userID2);
        expect(loc2).toEqual(hc(-1,-1));
        expect(() => world.moveUser(userID2, hc(0,1))).toThrow();
        expect(world.getUserLocation(userID2)).toEqual(hc(-1,-1));
        expect(world.at(hc(0,0))).toBe(userID1);
        expect(world.at(hc(-1,-1))).toBe(userID2);
    });

    test('should not move to occupied tile', () => {
        const world = new HexWorld(id, map);
        const userID1 = nanoid();
        const loc1 = world.addUser(userID1);
        expect(loc1).toEqual(hc(0,0));
        const userID2 = nanoid();
        const loc2 = world.addUser(userID2);
        expect(loc2).toEqual(hc(-1,-1));
        expect(() => world.moveUser(userID2, hc(0,0))).toThrow();
        expect(world.getUserLocation(userID2)).toEqual(hc(-1,-1));
        expect(world.at(hc(0,0))).toBe(userID1);
        expect(world.at(hc(-1,-1))).toBe(userID2);
    });

    test('should keep second user in same place', () => {
        const world = new HexWorld(id, map);
        const userID1 = nanoid();
        const loc1 = world.addUser(userID1);
        expect(loc1).toEqual(hc(0,0));
        const userID2 = nanoid();
        const loc2 = world.addUser(userID2);
        expect(loc2).toEqual(hc(-1,-1));
        world.moveUser(userID2, hc(-1,-1));
        expect(world.getUserLocation(userID2)).toEqual(hc(-1,-1));
        expect(world.at(hc(0,0))).toBe(userID1);
        expect(world.at(hc(-1,-1))).toBe(userID2);
    });

    test('should throw if user not in world', () => {
        const world = new HexWorld(id, map);
        const userID = nanoid();
        expect(() => world.moveUser(userID, hc(0,0))).toThrow();
    });

    test('should throw if moving non-existent user', () => {
        const world = new HexWorld(id, map);
        const userID1 = nanoid();
        const loc1 = world.addUser(userID1);
        expect(loc1).toEqual(hc(0,0));
        const userID2 = nanoid();
        expect(() => world.moveUser(userID2, hc(-1,-1))).toThrow();
        expect(world.getUserIDs()).toEqual([userID1]);
    });

    test('should throw if non-existent user moves to occupied tile', () => {
        const world = new HexWorld(id, map);
        const userID1 = nanoid();
        const loc1 = world.addUser(userID1);
        expect(loc1).toEqual(hc(0,0));
        const userID2 = nanoid();
        const loc2 = world.addUser(userID2);
        expect(loc2).toEqual(hc(-1,-1));
        const userID3 = nanoid();
        expect(() => world.moveUser(userID3, hc(-1,-1))).toThrow();
        expect(world.getUserLocation(userID1)).toEqual(hc(0,0));
        expect(world.at(hc(0,0))).toBe(userID1);
        expect(world.at(hc(-1,-1))).toBe(userID2);
        expect(world.getUserLocation(userID3)).toBeUndefined();
    });

// =========================
// addUser after move
// =========================

    test('should reuse empty tile after move', () => {
        const world = new HexWorld(id, map);
        const userID1 = nanoid();
        const loc1 = world.addUser(userID1);
        expect(loc1).toEqual(hc(0,0));
        const userID2 = nanoid();
        const loc2 = world.addUser(userID2);
        expect(loc2).toEqual(hc(-1,-1));
        world.moveUser(userID1, hc(3,-2));
        expect(world.getUserLocation(userID1)).toEqual(hc(3,-2));
        const userID3 = nanoid();
        const loc3 = world.addUser(userID3);
        expect(loc3).toEqual(hc(0,0));
        expect(world.getUserIDs().sort()).toEqual([userID1, userID2, userID3].sort());
        expect(world.getUserLocation(userID1)).toEqual(hc(3,-2));
        expect(world.getUserLocation(userID2)).toEqual(hc(-1,-1));
        expect(world.getUserLocation(userID3)).toEqual(hc(0,0));
    });

// =========================
// removeUser
// =========================

    test('should remove user', () => {
        const world = new HexWorld(id, map);
        const userID = nanoid();
        const loc1 = world.addUser(userID);
        expect(loc1).toEqual(hc(0,0));
        world.removeUser(userID);
        expect(world.getUserIDs()).toEqual([]);
        expect(world.getUserLocation(userID)).toBeUndefined();
        expect(world.at(loc1)).toBeUndefined();
        expect(world.isUnoccupied()).toBe(true);
    });

    test('should remove second user', () => {
        const world = new HexWorld(id, map);
        const userID1 = nanoid();
        const loc1 = world.addUser(userID1);
        expect(loc1).toEqual(hc(0,0));
        const userID2 = nanoid();
        const loc2 = world.addUser(userID2);
        expect(loc2).toEqual(hc(-1,-1));
        world.removeUser(userID2);
        expect(world.getUserIDs()).toEqual([userID1]);
        expect(world.getUserLocation(userID1)).toEqual(loc1);
        expect(world.getUserLocation(userID2)).toBeUndefined();
        expect(world.at(loc1)).toBe(userID1);
        expect(world.at(loc2)).toBeUndefined();
    });

    test('should ignore removing non-existent user', () => {
        const world = new HexWorld(id, map);
        const userID = nanoid();
        world.removeUser(userID);
        expect(world.getUserIDs()).toEqual([]);
    });

    test('should ignore removing non-existent user in world', () => {
        const world = new HexWorld(id, map);
        const userID1 = nanoid();
        const loc1 = world.addUser(userID1);
        expect(loc1).toEqual(hc(0,0));
        const userID2 = nanoid();
        world.removeUser(userID2);
        expect(world.getUserIDs()).toEqual([userID1]);
    });
});
