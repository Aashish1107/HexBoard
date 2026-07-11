import { HexCoordinate } from "../../client/HexCoordinate";
import { Terrain } from "../../client/Terrain";
import { TerrainMap } from "../../client/TerrainMap";

// =========================
// Basic behavior
// =========================

describe('terrain map basic behavior', () => {
    let terrainMap: TerrainMap;
    beforeEach(() => {
        terrainMap = new TerrainMap();
    });

    test('should set and get terrain', () => {
        const hex = new HexCoordinate(1,2);
        const terrain = Terrain.Open;
        terrainMap.set(hex, terrain);
        expect(terrainMap.get(new HexCoordinate(1,2,-1))).toBe(terrain);
    });

    test('should return undefined for different hex', () => {
        const hex = new HexCoordinate(1,2);
        const terrain = Terrain.Open;
        terrainMap.set(hex, terrain);
        expect(terrainMap.get(new HexCoordinate(2,1))).toBeUndefined();
    });

    test('should remove terrain', () => {
        const hex = new HexCoordinate(1,2);
        const terrain = Terrain.Open;
        terrainMap.set(hex, terrain);
        terrainMap.remove(new HexCoordinate(1,2,-1));
        expect(terrainMap.get(hex)).toBe(undefined);
    });

    test('should remove only matching hex', () => {
        const hex = new HexCoordinate(1,2);
        const terrain = Terrain.Open;
        terrainMap.set(hex, terrain);
        terrainMap.remove(new HexCoordinate(2,1));
        expect(terrainMap.get(hex)).toBe(terrain);
    });

    test('should overwrite existing terrain', () => {
        const hex = new HexCoordinate(1,2);
        terrainMap.set(hex, Terrain.Open);
        terrainMap.set(hex, Terrain.Water);
        expect(terrainMap.get(hex)).toBe(Terrain.Water);
    });

    test('should handle mixed set and remove operations', () => {
        terrainMap.set(new HexCoordinate(1,2), Terrain.Open);
        terrainMap.set(new HexCoordinate(2,1), Terrain.Water);
        terrainMap.set(new HexCoordinate(2,2), Terrain.Shrubbery);
        terrainMap.set(new HexCoordinate(1,1), Terrain.Glass);
        terrainMap.set(new HexCoordinate(1,2), Terrain.Curtain);
        terrainMap.remove(new HexCoordinate(2,2));
        expect(terrainMap.get(new HexCoordinate(1,2))).toBe(Terrain.Curtain);   
        expect(terrainMap.get(new HexCoordinate(2,1))).toBe(Terrain.Water); 
        expect(terrainMap.get(new HexCoordinate(2,2))).toBeUndefined(); 
        expect(terrainMap.get(new HexCoordinate(1,1))).toBe(Terrain.Glass); 
    });
});

// =========================
// JSON conversion
// =========================

describe('terrain map json', () => {
    let terrainMap: TerrainMap;
    beforeEach(() => {
        terrainMap = new TerrainMap();
    });

    test('should convert empty map to json', () => {
        expect(terrainMap.toJSON()).toEqual({});
    });

    test('should convert non-empty map to json', () => {
        terrainMap.set(new HexCoordinate(1,2), Terrain.Open);
        terrainMap.set(new HexCoordinate(2,1), Terrain.Water);
        terrainMap.set(new HexCoordinate(2,2), Terrain.Shrubbery);
        terrainMap.set(new HexCoordinate(1,1), Terrain.Glass);
        expect(terrainMap.toJSON()).toStrictEqual({
            '<1,2>': Terrain.Open,
            '<2,1>': Terrain.Water,
            '<2,2>': Terrain.Shrubbery,
            '<1,1>': Terrain.Glass,
        });
    });

    test('should convert updated map to json', () => {
        terrainMap.set(new HexCoordinate(1,2), Terrain.Open);
        terrainMap.set(new HexCoordinate(2,1), Terrain.Water);
        terrainMap.set(new HexCoordinate(2,2), Terrain.Shrubbery);
        terrainMap.set(new HexCoordinate(1,1), Terrain.Glass);
        terrainMap.set(new HexCoordinate(1,2), Terrain.Curtain);
        terrainMap.remove(new HexCoordinate(2,2));
        expect(terrainMap.toJSON()).toStrictEqual({
            '<1,2>': Terrain.Curtain,
            '<2,1>': Terrain.Water,
            '<1,1>': Terrain.Glass,
        });
    });
});