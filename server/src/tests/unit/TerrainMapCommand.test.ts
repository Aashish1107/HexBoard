import { HexCoordinate } from '../../client/HexCoordinate';
import { TerrainMap } from '../../client/TerrainMap';
import { Terrain } from '../../client/Terrain';
import { Command, Log, LogUndoPolicy, removeTerrainCommand, setTerrainCommand, nullCommand, undoCommand, sequenceCommand, fromJSON } from '../../client/TerrainMapCommand';

// =========================
// Command basic behavior
// =========================

describe('basic command behavior', () => {
    test('should do nothing for null command', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(0, 0);
        const terrain = Terrain.Wall;
        const command = nullCommand();

        command.apply(map);
        expect(map.get(coord)).toBeUndefined();
        command.undo(map);
        expect(map.get(coord)).toBeUndefined();

        map.set(coord, terrain);
        command.apply(map);
        expect(map.get(coord)).toBe(terrain);
        command.undo(map);
        expect(map.get(coord)).toBe(terrain);
    });

    test('should assign terrain', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(1, 2);
        const terrain = Terrain.Water;
        const command = setTerrainCommand(coord, terrain);

        expect(map.get(coord)).toBeUndefined();
        command.apply(map);
        expect(map.get(coord)).toBe(terrain);
        
        command.undo(map);
        expect(map.get(coord)).toBeUndefined();
    });

    test('should change terrain', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(2, 2);
        const oldTerrain = Terrain.Water;
        const newTerrain = Terrain.Shrubbery;
        
        map.set(coord, oldTerrain);
        
        const command = setTerrainCommand(coord, newTerrain, oldTerrain);
        
        expect(map.get(coord)).toBe(oldTerrain);
        command.apply(map);
        expect(map.get(coord)).toBe(newTerrain);
        
        command.undo(map);
        expect(map.get(coord)).toBe(oldTerrain);
    });

    test("should remove terrain", () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(3, 2);
        const terrain = Terrain.Water;
        
        map.set(coord, terrain);
        
        const command = removeTerrainCommand(coord, terrain);
        
        expect(map.get(coord)).toBe(terrain);
        command.apply(map);
        expect(map.get(coord)).toBe(undefined);
        
        command.undo(map);
        expect(map.get(coord)).toBe(terrain);
    });

    test('should not change when same terrain', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(0, 1);
        const terrain = Terrain.Water;
        const command = setTerrainCommand(coord, terrain, terrain); 

        map.set(coord, terrain);
        command.undo(map);
        expect(map.get(coord)).toBe(terrain);
        command.apply(map);
        expect(map.get(coord)).toBe(terrain);

        map.set(new HexCoordinate(4,2), Terrain.Wall);
        command.apply(map);
        expect(map.get(coord)).toBe(terrain);
        expect(map.get(new HexCoordinate(4,2))).toBe(Terrain.Wall);
    });

    test('should apply and undo multiple commands in order', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(4,3);
        const oldTerrain = Terrain.Curtain;
        const newTerrain = Terrain.Wall;

        const comm3 = removeTerrainCommand(coord, newTerrain);
        const comm2 = setTerrainCommand(coord, newTerrain, oldTerrain);
        const comm1 = setTerrainCommand(coord, oldTerrain);

        comm1.apply(map);
        expect(map.get(coord)).toBe(oldTerrain);
        comm2.apply(map);
        expect(map.get(coord)).toBe(newTerrain);
        comm3.apply(map);
        expect(map.get(coord)).toBe(undefined);
        comm3.undo(map);
        expect(map.get(coord)).toBe(newTerrain);
        comm2.undo(map);
        expect(map.get(coord)).toBe(oldTerrain);
        comm1.undo(map);
        expect(map.get(coord)).toBe(undefined);
    });

    test('should handle independent commands', () => {
        const map = new TerrainMap();
        const coord1 = new HexCoordinate(5, 3);
        const coord2 = new HexCoordinate(6, 3);
        const terrain1 = Terrain.Open;
        const terrain2 = Terrain.Glass;

        const comm1 = setTerrainCommand(coord1, terrain1);
        const comm2 = setTerrainCommand(coord2, terrain2);

        comm1.apply(map);
        expect(map.get(coord1)).toBe(terrain1);
        expect(map.get(coord2)).toBeUndefined();

        comm2.apply(map);
        expect(map.get(coord1)).toBe(terrain1);
        expect(map.get(coord2)).toBe(terrain2);

        comm1.undo(map);
        expect(map.get(coord1)).toBeUndefined();
        expect(map.get(coord2)).toBe(terrain2);

        comm2.undo(map);
        expect(map.get(coord1)).toBeUndefined();
        expect(map.get(coord2)).toBeUndefined();
    });

    test('should throw error on invalid assign', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(7, 3);
        const terrain = Terrain.Water;
        const command = setTerrainCommand(coord, terrain);

        map.set(coord, terrain);
        // Attempting to assign the same terrain should throw an error
        expect(() => command.apply(map)).toThrow(Error);
        map.set(coord, Terrain.Curtain);
        expect(() => command.apply(map)).toThrow(Error);
        expect(map.get(coord)).toBe(Terrain.Curtain);
        map.remove(coord);
        command.apply(map);
        expect(map.get(coord)).toBe(terrain);
    });

    test('should throw error on invalid change', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(8, 3);
        const oldTerrain = Terrain.Water;
        const newTerrain = Terrain.Shrubbery;

        map.set(coord, oldTerrain);
        const command = setTerrainCommand(coord, newTerrain, oldTerrain);
        expect(map.get(coord)).toBe(oldTerrain);

        map.set(coord, newTerrain);
        // Attempting to change to the same terrain should throw an error
        expect(() => command.apply(map)).toThrow(Error);
        map.set(coord, Terrain.Curtain);
        expect(() => command.apply(map)).toThrow(Error);
        expect(map.get(coord)).toBe(Terrain.Curtain);
        map.remove(coord);
        expect(() => command.apply(map)).toThrow(Error);
        expect(map.get(coord)).toBeUndefined();
    });

    test('should throw error on invalid remove', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(2, 0);
        const terrain = Terrain.Water;

        map.set(coord, terrain);
        const command = removeTerrainCommand(coord, terrain);
        expect(map.get(coord)).toBe(terrain);

        map.set(coord, Terrain.Curtain);
        expect(() => command.apply(map)).toThrow(Error);
        expect(map.get(coord)).toBe(Terrain.Curtain);
        map.remove(coord);
        expect(() => command.apply(map)).toThrow(Error);
        expect(map.get(coord)).toBeUndefined();
    });

    test('should throw error on invalid assign undo', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(9, 3);
        const terrain = Terrain.Water;
        const command = setTerrainCommand(coord, terrain);

        // Attempting to undo should throw an error
        expect(() => command.undo(map)).toThrow(Error);
        map.set(coord, Terrain.Shrubbery);
        expect(() => command.undo(map)).toThrow(Error);
        expect(map.get(coord)).toBe(Terrain.Shrubbery);
    });

    test('should throw error on invalid change undo', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(10, 3);
        const oldTerrain = Terrain.Water;
        const newTerrain = Terrain.Shrubbery;

        map.set(coord, oldTerrain);
        const command = setTerrainCommand(coord, newTerrain, oldTerrain);

        // Attempting to undo should throw an error
        expect(() => command.undo(map)).toThrow(Error);
        map.set(coord, Terrain.Curtain);
        expect(() => command.undo(map)).toThrow(Error);
        expect(map.get(coord)).toBe(Terrain.Curtain);
        map.remove(coord);
        expect(() => command.undo(map)).toThrow(Error);
        expect(map.get(coord)).toBeUndefined();
    });

    test('should throw error on invalid remove undo', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(11, 3);
        const terrain = Terrain.Water;

        map.set(coord, terrain);
        const command = removeTerrainCommand(coord, terrain);

        // Attempting to undo should throw an error
        expect(() => command.undo(map)).toThrow(Error);
        map.set(coord, Terrain.Curtain);
        expect(() => command.undo(map)).toThrow(Error);
        expect(map.get(coord)).toBe(Terrain.Curtain);
        map.remove(coord);
        command.undo(map);
        expect(map.get(coord)).toBe(terrain);
    });

    test('should throw error on invalid no-op change', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(12, 3);
        const oldTerrain = Terrain.Water;
        const newTerrain = Terrain.Shrubbery;

        map.set(coord, oldTerrain);
        const command = setTerrainCommand(coord, newTerrain, newTerrain);

        // Attempting to apply a NOP change should throw an error
        expect(() => command.apply(map)).toThrow(Error);
        // ditto for undo
        expect(() => command.undo(map)).toThrow(Error);
        expect(map.get(coord)).toBe(oldTerrain);

        map.remove(coord);
        expect(() => command.apply(map)).toThrow(Error);
        expect(map.get(coord)).toBeUndefined();
        expect(() => command.undo(map)).toThrow(Error);
        expect(map.get(coord)).toBeUndefined();
    });
});

describe('undo command behavior', () => {
    test('should undo assign command', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(5, 2);
        const terrain = Terrain.Water;
        const command = undoCommand(setTerrainCommand(coord, terrain));
        map.set(coord, terrain);
        command.apply(map);
        expect(map.get(coord)).toBeUndefined();
        expect(() => command.apply(map)).toThrow(Error);
        expect(map.get(coord)).toBeUndefined();
        command.undo(map); // undo the undo
        expect(map.get(coord)).toBe(terrain);
    });
    test('should undo change command', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(6, 2);
        const oldTerrain = Terrain.Water;
        const newTerrain = Terrain.Shrubbery;
        
        map.set(coord, oldTerrain);
        const command = undoCommand(setTerrainCommand(coord, newTerrain, oldTerrain));
        
        expect(() => command.apply(map)).toThrow(Error);
        expect(map.get(coord)).toBe(oldTerrain);
        map.set(coord, newTerrain);
        command.apply(map);
        expect(map.get(coord)).toBe(oldTerrain);
        command.undo(map); // undo the undo
        expect(map.get(coord)).toBe(newTerrain);
        map.remove(coord);
        expect(() => command.apply(map)).toThrow(Error);
        expect(map.get(coord)).toBeUndefined();
    });
    test('should undo remove command', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(7, 2);
        const terrain = Terrain.Water;
        
        map.set(coord, terrain);
        const command = undoCommand(removeTerrainCommand(coord, terrain));
        expect(() => command.apply(map)).toThrow(Error); 
        expect(map.get(coord)).toBe(terrain);
        map.set(coord, Terrain.Shrubbery);
        expect(() => command.apply(map)).toThrow(Error); 
        expect(map.get(coord)).toBe(Terrain.Shrubbery);
        expect(() => command.undo(map)).toThrow(Error); // remove the terrain
        expect(map.get(coord)).toBe(Terrain.Shrubbery);
        map.remove(coord);
        command.apply(map);
        expect(map.get(coord)).toBe(terrain);
        command.undo(map); // undo the undo
        expect(map.get(coord)).toBeUndefined();
    });
    test('should undo null command', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(8, 2);
        const terrain = Terrain.Water;
        const command = undoCommand(nullCommand());
        
        command.apply(map); // should do nothing
        expect(map.get(coord)).toBeUndefined();
        
        map.set(coord, terrain);
        command.apply(map);
        expect(map.get(coord)).toBe(terrain);
        
        command.undo(map); // undo the undo
        expect(map.get(coord)).toBe(terrain);
    });
    test('should undo undo command', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(9, 2);
        const terrain = Terrain.Water;
        
        const command1 = setTerrainCommand(coord, terrain);
        const command2 = undoCommand(command1);
        const command = undoCommand(command2);
        
        command.apply(map);
        expect(map.get(coord)).toBe(terrain);
        
        expect(() => command.apply(map)).toThrow(Error);
        expect(map.get(coord)).toBe(terrain);

        command.undo(map);
        expect(map.get(coord)).toBeUndefined();
        expect(() => command.undo(map)).toThrow(Error);
        expect(map.get(coord)).toBeUndefined();
    });
});

function randomCommand(n : number) : {startMap:TerrainMap, command:Command, endMap:TerrainMap} {
    const root = Math.floor(Math.sqrt(n));
    function getCoord() : HexCoordinate {
        const a = Math.floor(Math.random() * root);
        const b = Math.floor(Math.random() * root);
        return new HexCoordinate(a,b);
    }
    function getTerrain() : Terrain {
        switch(Math.floor(Math.random() * 6)) {
            default:
            case 0: return Terrain.Open;
            case 1: return Terrain.Water;
            case 2: return Terrain.Shrubbery;
            case 3: return Terrain.Wall;
            case 4: return Terrain.Curtain;
            case 5: return Terrain.Glass;
        }
    }
    function genCommand(map : TerrainMap, rem : number[], reverse : boolean) : Command {
        const coord = getCoord();
        const terrain = getTerrain();
        const current = map.get(coord);
        const choice = Math.floor(Math.random() * 6);
        switch(choice) {
            default:
            case 0:
                return nullCommand();
            case 1:
                if (current !== undefined) {
                    --rem[0];
                    map.remove(coord);
                    if (!reverse) {
                        return removeTerrainCommand(coord, current);
                    } else {
                        return setTerrainCommand(coord, current);
                    }
                }
                // fall through
            case 2:
                map.set(coord,terrain);
                --rem[0];
                if (current === undefined) {
                    if (!reverse) {
                        return setTerrainCommand(coord, terrain);
                    } else {
                        return removeTerrainCommand(coord, terrain);
                    }
                } else {
                    if (!reverse) {
                        return setTerrainCommand(coord, terrain, current);
                    } else {
                        return setTerrainCommand(coord, current, terrain);
                    }
                }
            case 3:
                return undoCommand(genCommand(map, rem, !reverse));
            case 4:
            case 5: {
                const commands : Command[] = [];
                while (Math.random() > 0.3 && rem[0] >= 0) {
                    const com = genCommand(map, rem, reverse);
                    if (!reverse) {
                        commands.push(com);
                    } else {
                        commands.unshift(com); // reverse the order for undo
                    }
                }
                return sequenceCommand(commands);
            }
        }
    }
    const startMap = new TerrainMap();
    genCommand(startMap, [n], false); // for side-effect!
    if (n <= 0) return {startMap, endMap: startMap, command: nullCommand()}; // no commands to generate
    const endMap = new TerrainMap(startMap.toJSON()); // clone
    const rem = [n];
    let command = genCommand(endMap, rem, false);
    if (n <= 1 || rem[0] <= 0) {
        return {startMap, endMap, command};
    }
    const commands = [command];
    while (rem[0] >= 0) {
        command = genCommand(endMap, rem, false);
        commands.push(command);
    }
    command = sequenceCommand(commands);
    return {startMap, command, endMap};
}

describe('sequence command behavior', () => {
    test('sequence 0 command', () => {
        const map = new TerrainMap();
        const command = sequenceCommand([]);
        command.apply(map);
        expect(map.toJSON()).toEqual({});
        command.undo(map);
        expect(map.toJSON()).toEqual({});
        const coord = new HexCoordinate(2, 0);
        const terrain = Terrain.Shrubbery;
        map.set(coord, terrain);
        command.apply(map);
        expect(map.get(coord)).toBe(terrain);
        command.undo(map);
        expect(map.get(coord)).toBe(terrain);
    });

    test('sequence 1 command', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(10, 2);
        const terrain = Terrain.Water;
        const command = sequenceCommand([setTerrainCommand(coord, terrain)]);
        
        command.apply(map);
        expect(map.get(coord)).toBe(terrain);
        
        command.undo(map);
        expect(map.get(coord)).toBeUndefined();
        map.set(coord, Terrain.Curtain);
        expect(() => command.apply(map)).toThrow(Error);
        expect(map.get(coord)).toBe(Terrain.Curtain);
        expect(() => command.undo(map)).toThrow(Error);
        expect(map.get(coord)).toBe(Terrain.Curtain);
    });

    test('sequence 2 independent commands', () => {
        const map = new TerrainMap();
        const coord1 = new HexCoordinate(11, 2);
        const coord2 = new HexCoordinate(12, 2);
        const terrain1 = Terrain.Water;
        const terrain2 = Terrain.Shrubbery;

        const command = sequenceCommand([
            setTerrainCommand(coord1, terrain1),
            setTerrainCommand(coord2, terrain2)
        ]);

        command.apply(map);
        expect(map.get(coord1)).toBe(terrain1);
        expect(map.get(coord2)).toBe(terrain2);

        command.undo(map);
        expect(map.get(coord1)).toBeUndefined();
        expect(map.get(coord2)).toBeUndefined();
    });

    test('sequence 2 independent commands error', () => {
        const map = new TerrainMap();
        const coord1 = new HexCoordinate(11, 2);
        const coord2 = new HexCoordinate(12, 2);
        const terrain1 = Terrain.Water;
        const terrain2 = Terrain.Shrubbery;

        const command = sequenceCommand([
            setTerrainCommand(coord1, terrain1),
            setTerrainCommand(coord2, terrain2)
        ]);

        map.set(coord1, Terrain.Curtain);
        expect(() => command.apply(map)).toThrow(Error);
        expect(map.get(coord1)).toBe(Terrain.Curtain);
        expect(map.get(coord2)).toBeUndefined();

        expect(() => command.undo(map)).toThrow(Error);
        expect(map.get(coord1)).toBe(Terrain.Curtain);
        expect(map.get(coord2)).toBeUndefined();
    });

    test('sequence 2 dependent commands', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(4, 2);
        const terrain1 = Terrain.Water;
        const terrain2 = Terrain.Shrubbery;
        const command = sequenceCommand([
            setTerrainCommand(coord, terrain1),
            setTerrainCommand(coord, terrain2, terrain1)
        ]);
        command.apply(map);
        expect(map.get(coord)).toBe(terrain2);
        command.undo(map);
        expect(map.get(coord)).toBeUndefined();
    });

    test('sequence 2 dependent commands with error', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(4, 2);
        const terrain1 = Terrain.Water;
        const terrain2 = Terrain.Shrubbery;
        const terrain3 = Terrain.Curtain;
        const command = sequenceCommand([
            setTerrainCommand(coord, terrain1),
            setTerrainCommand(coord, terrain2, terrain1)
        ]);

        map.set(coord, terrain3);
        expect(() => command.apply(map)).toThrow(Error);
        expect(map.get(coord)).toBe(terrain3);
        expect(() => command.undo(map)).toThrow(Error);
        expect(map.get(coord)).toBe(terrain3);

        map.set(coord, terrain2);
        expect(() => command.apply(map)).toThrow(Error);
        expect(map.get(coord)).toBe(terrain2);

        map.set(coord, terrain1);
        expect(() => command.undo(map)).toThrow(Error);
        expect(map.get(coord)).toBe(terrain1);
    });

    test('sequence 2 independent commands partial error', () => {
        const map = new TerrainMap();
        const coord1 = new HexCoordinate(13, 2);
        const coord2 = new HexCoordinate(14, 2);
        const terrain1 = Terrain.Water;
        const terrain2 = Terrain.Shrubbery;

        const command = sequenceCommand([
            setTerrainCommand(coord1, terrain1),
            setTerrainCommand(coord2, terrain2)
        ]);

        map.set(coord2, Terrain.Curtain); // result in partial error
        expect(() => command.undo(map)).toThrow(Error);
        expect(map.get(coord1)).toBeUndefined();
        expect(map.get(coord2)).toBe(Terrain.Curtain);

        map.set(coord2, terrain2); // set up for partial undo error
        expect(() => command.apply(map)).toThrow(Error);
        expect(map.get(coord1)).toBeUndefined();
        expect(map.get(coord2)).toBe(terrain2);
    });

    test('sequence 3 self-canceling commands', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(2, 2);
        const terrain1 = Terrain.Water;
        const terrain2 = Terrain.Shrubbery;

        const command = sequenceCommand([
            setTerrainCommand(coord, terrain1),
            setTerrainCommand(coord, terrain2, terrain1),
            removeTerrainCommand(coord, terrain2)
        ]);

        command.apply(map);
        expect(map.get(coord)).toBeUndefined();
        command.undo(map);
        expect(map.get(coord)).toBeUndefined();

        map.set(coord, terrain1);
        expect(() => command.apply(map)).toThrow(Error);
        expect(map.get(coord)).toBe(terrain1);
        expect(() => command.undo(map)).toThrow(Error);
        expect(map.get(coord)).toBe(terrain1);
    });

    test('sequence 4', () => {
        let map = new TerrainMap();
        const coord1 = new HexCoordinate(3, 2);
        const coord2 = new HexCoordinate(4, 1);
        const coord3 = new HexCoordinate(5, 0);
        const terrain1 = Terrain.Water;
        const terrain2 = Terrain.Shrubbery;
        const terrain3 = Terrain.Curtain;
        const terrain4 = Terrain.Glass;

        const command = sequenceCommand([
            setTerrainCommand(coord1, terrain1),
            setTerrainCommand(coord2, terrain3, terrain2),
            removeTerrainCommand(coord3, terrain4),
            setTerrainCommand(coord1, terrain2, terrain1),
        ]);

        map.set(coord2, terrain2);
        map.set(coord3, terrain4);

        command.apply(map);
        expect(map.get(coord1)).toBe(terrain2);
        expect(map.get(coord2)).toBe(terrain3);
        expect(map.get(coord3)).toBeUndefined();

        map = new TerrainMap();
        map.set(coord1, terrain2);
        map.set(coord2, terrain3);

        command.undo(map);
        expect(map.get(coord1)).toBeUndefined();
        expect(map.get(coord2)).toBe(terrain2);
        expect(map.get(coord3)).toBe(terrain4);
    });

    test('sequence 4 errors', () => {
        let map = new TerrainMap();
        const coord1 = new HexCoordinate(3, 2);
        const coord2 = new HexCoordinate(4, 1);
        const coord3 = new HexCoordinate(5, 0);
        const terrain1 = Terrain.Water;
        const terrain2 = Terrain.Shrubbery;
        const terrain3 = Terrain.Curtain;
        const terrain4 = Terrain.Glass;

        const command = sequenceCommand([
            setTerrainCommand(coord1, terrain1),
            setTerrainCommand(coord2, terrain3, terrain2),
            removeTerrainCommand(coord3, terrain4),
            setTerrainCommand(coord1, terrain2, terrain1),
        ]);

        map.set(coord1, terrain3);
        map.set(coord2, terrain2);
        map.set(coord3, terrain4);
        expect(() => command.apply(map)).toThrow(Error);
        expect(map.get(coord1)).toBe(terrain3);
        expect(map.get(coord2)).toBe(terrain2);
        expect(map.get(coord3)).toBe(terrain4);

        map = new TerrainMap();
        map.set(coord2, terrain3);
        map.set(coord3, terrain4);
        expect(() => command.apply(map)).toThrow(Error);
        expect(map.get(coord1)).toBeUndefined();
        expect(map.get(coord2)).toBe(terrain3);
        expect(map.get(coord3)).toBe(terrain4);

        map = new TerrainMap();
        map.set(coord2, terrain2);
        map.set(coord3, terrain3);
        expect(() => command.undo(map)).toThrow(Error);
        expect(map.get(coord1)).toBeUndefined();
        expect(map.get(coord2)).toBe(terrain2);
        expect(map.get(coord3)).toBe(terrain3);
    });

    test('sequence 4 undo errors', () => {
        let map = new TerrainMap();
        const coord1 = new HexCoordinate(3, 2);
        const coord2 = new HexCoordinate(4, 1);
        const coord3 = new HexCoordinate(5, 0);
        const terrain1 = Terrain.Water;
        const terrain2 = Terrain.Shrubbery;
        const terrain3 = Terrain.Curtain;
        const terrain4 = Terrain.Glass;

        const command = sequenceCommand([
            setTerrainCommand(coord1, terrain1),
            setTerrainCommand(coord2, terrain3, terrain2),
            removeTerrainCommand(coord3, terrain4),
            setTerrainCommand(coord1, terrain2, terrain1),
        ]);

        map.set(coord1, terrain1);
        map.set(coord2, terrain3);
        expect(() => command.undo(map)).toThrow(Error);
        expect(map.get(coord1)).toBe(terrain1);
        expect(map.get(coord2)).toBe(terrain3);
        expect(map.get(coord3)).toBeUndefined();

        map = new TerrainMap();
        map.set(coord1, terrain2);
        map.set(coord2, terrain3);
        map.set(coord3, terrain1);
        expect(() => command.undo(map)).toThrow(Error);
        expect(map.get(coord1)).toBe(terrain2);
        expect(map.get(coord2)).toBe(terrain3);
        expect(map.get(coord3)).toBe(terrain1);

        map = new TerrainMap();
        map.set(coord1, terrain2);
        map.set(coord2, terrain1);
        expect(() => command.undo(map)).toThrow(Error);
        expect(map.get(coord1)).toBe(terrain2);
        expect(map.get(coord2)).toBe(terrain1);
        expect(map.get(coord3)).toBeUndefined();
    });

    test('complex sequence', () => {
        const map = new TerrainMap();
        const coord1 = new HexCoordinate(0, 0);
        const coord2 = new HexCoordinate(1, 0);
        const coord3 = new HexCoordinate(2, 0);
        const coord4 = new HexCoordinate(3, 0);
        const terrain1 = Terrain.Water;
        const terrain2 = Terrain.Shrubbery;
        const terrain3 = Terrain.Curtain;
        const terrain4 = Terrain.Glass;

        const command = sequenceCommand([
            setTerrainCommand(coord1, terrain2, terrain1),
            undoCommand(sequenceCommand([
                setTerrainCommand(coord3, terrain3, terrain4),
                setTerrainCommand(coord2, terrain2),
                removeTerrainCommand(coord3, terrain3)
            ])),
            setTerrainCommand(coord4, terrain2),
            removeTerrainCommand(coord3, terrain4),
        ]);

        map.set(coord1, terrain1);
        map.set(coord2, terrain2);
        command.apply(map);
        expect(map.get(coord1)).toBe(terrain2);
        expect(map.get(coord2)).toBeUndefined();
        expect(map.get(coord3)).toBeUndefined();
        expect(map.get(coord4)).toBe(terrain2);
        
        command.undo(map);
        expect(map.get(coord1)).toBe(terrain1);
        expect(map.get(coord2)).toBe(terrain2);
        expect(map.get(coord3)).toBeUndefined();
        expect(map.get(coord4)).toBeUndefined();
    });

    test('complex sequence with errors', () => {
        let map = new TerrainMap();
        const coord1 = new HexCoordinate(0, 0);
        const coord2 = new HexCoordinate(1, 0);
        const coord3 = new HexCoordinate(2, 0);
        const coord4 = new HexCoordinate(3, 0);
        const terrain1 = Terrain.Water;
        const terrain2 = Terrain.Shrubbery;
        const terrain3 = Terrain.Curtain;
        const terrain4 = Terrain.Glass;

        const command = sequenceCommand([
            setTerrainCommand(coord1, terrain2, terrain1),
            undoCommand(sequenceCommand([
                setTerrainCommand(coord3, terrain3, terrain4),
                setTerrainCommand(coord2, terrain2),
                removeTerrainCommand(coord3, terrain3)
            ])),
            setTerrainCommand(coord4, terrain2),
            removeTerrainCommand(coord3, terrain4),
        ]);

        map.set(coord1, terrain1);
        map.set(coord2, terrain2);
        map.set(coord3, terrain4); // introduce an error
        expect(() => command.apply(map)).toThrow(Error);
        expect(map.get(coord1)).toBe(terrain1);
        expect(map.get(coord2)).toBe(terrain2);
        expect(map.get(coord3)).toBe(terrain4);
        expect(map.get(coord4)).toBeUndefined();

        map = new TerrainMap();
        map.set(coord1, terrain2);
        map.set(coord2, terrain2); // introduce error
        map.set(coord4, terrain2);
        expect(() => command.undo(map)).toThrow(Error);
        expect(map.get(coord1)).toBe(terrain2);
        expect(map.get(coord2)).toBe(terrain2);
        expect(map.get(coord3)).toBeUndefined();
        expect(map.get(coord4)).toBe(terrain2);
    });

    test.each([[1],[2],[4],[8],[16],[32],[64],[128]])(
        'random command %i', (n) => {
            const {startMap, command, endMap} = randomCommand(n);
            // console.log(startMap.toJSON(),'\n',JSON.stringify(command),'\n',endMap.toJSON());
            const map = new TerrainMap(startMap.toJSON());
            command.apply(map);
            expect(JSON.parse(JSON.stringify(map))).toEqual(JSON.parse(JSON.stringify(endMap)));
            command.undo(map);
            expect(JSON.parse(JSON.stringify(map))).toEqual(JSON.parse(JSON.stringify(startMap)));
        }
    );
});

describe('command json', () => {
    const cs0 = JSON.stringify(nullCommand());
    const cs1 = JSON.stringify(setTerrainCommand(new HexCoordinate(0, 0), Terrain.Water));
    const cs2 = JSON.stringify(removeTerrainCommand(new HexCoordinate(1, 0), Terrain.Wall));
    const cs3 = JSON.stringify(setTerrainCommand(new HexCoordinate(2, 2), Terrain.Water, Terrain.Shrubbery));
    const cs4 = JSON.stringify(undoCommand(setTerrainCommand(new HexCoordinate(2, 0), Terrain.Curtain)));
    const cs5 = JSON.stringify(sequenceCommand([
        setTerrainCommand(new HexCoordinate(3, 0), Terrain.Glass),
        removeTerrainCommand(new HexCoordinate(4, 0), Terrain.Open)
    ]));
    const cs6 = JSON.stringify(sequenceCommand([
        setTerrainCommand(new HexCoordinate(1,1), Terrain.Open, Terrain.Water),
        undoCommand(sequenceCommand([
            setTerrainCommand(new HexCoordinate(13,3), Terrain.Glass, Terrain.Curtain),
            setTerrainCommand(new HexCoordinate(-2,-2), Terrain.Wall),
            removeTerrainCommand(new HexCoordinate(13,3), Terrain.Glass)
        ])),
        setTerrainCommand(new HexCoordinate(404,-4), Terrain.Shrubbery),
        removeTerrainCommand(new HexCoordinate(13,3), Terrain.Curtain),
    ]));

    test('null command', () => {
        const command = fromJSON(JSON.parse(cs0));
        const map = new TerrainMap();
        command.apply(map);
        expect(map.toJSON()).toEqual({});

        map.set(new HexCoordinate(0, 0), Terrain.Water);
        command.undo(map);
        expect(map.get(new HexCoordinate(0, 0))).toBe(Terrain.Water);
    });

    test('assign terrain command', () => {
        const command = fromJSON(JSON.parse(cs1));
        const map = new TerrainMap();
        command.apply(map);
        expect(map.get(new HexCoordinate(0, 0))).toBe(Terrain.Water);
        expect(() => command.apply(map)).toThrow(Error);
        command.undo(map);
        expect(map.get(new HexCoordinate(0, 0))).toBeUndefined();
    });

    test('remove terrain command', () => {
        const command = fromJSON(JSON.parse(cs2));
        const map = new TerrainMap();
        map.set(new HexCoordinate(1, 0), Terrain.Wall);
        
        command.apply(map);
        expect(map.get(new HexCoordinate(1, 0))).toBeUndefined();
        
        command.undo(map);
        expect(map.get(new HexCoordinate(1, 0))).toBe(Terrain.Wall);
    });

    test('change terrain command', () => {
        const command = fromJSON(JSON.parse(cs3));
        const map = new TerrainMap();
        map.set(new HexCoordinate(2, 2), Terrain.Shrubbery);
        
        command.apply(map);
        expect(map.get(new HexCoordinate(2, 2))).toBe(Terrain.Water);
        
        command.undo(map);
        expect(map.get(new HexCoordinate(2, 2))).toBe(Terrain.Shrubbery);
    });

    test('undo command', () => {
        const command = fromJSON(JSON.parse(cs4));
        const map = new TerrainMap();
        map.set(new HexCoordinate(2, 0), Terrain.Curtain);
        
        command.apply(map);
        expect(map.get(new HexCoordinate(2, 0))).toBeUndefined();
        
        command.undo(map);
        expect(map.get(new HexCoordinate(2, 0))).toBe(Terrain.Curtain);
    });

    test('sequence command', () => {
        const command = fromJSON(JSON.parse(cs5));
        const map = new TerrainMap();

        map.set(new HexCoordinate(3, 0), Terrain.Glass);
        
        command.undo(map);
        expect(map.get(new HexCoordinate(3, 0))).toBeUndefined();
        expect(map.get(new HexCoordinate(4, 0))).toBe(Terrain.Open);
       
        command.apply(map);
        expect(map.get(new HexCoordinate(3, 0))).toBe(Terrain.Glass);
        expect(map.get(new HexCoordinate(4, 0))).toBeUndefined();
    });

    test('complex sequence command', () => {
        const command = fromJSON(JSON.parse(cs6));
        const map = new TerrainMap();

        map.set(new HexCoordinate(1, 1), Terrain.Water);
        map.set(new HexCoordinate(-2, -2), Terrain.Wall);
        map.set(new HexCoordinate(2, 2), Terrain.Shrubbery); 

        command.apply(map);
        expect(map.get(new HexCoordinate(1, 1))).toBe(Terrain.Open);
        expect(map.get(new HexCoordinate(13, 3))).toBeUndefined();
        expect(map.get(new HexCoordinate(-2, -2))).toBeUndefined();
        expect(map.get(new HexCoordinate(404, -4))).toBe(Terrain.Shrubbery);
        expect(map.get(new HexCoordinate(2, 2))).toBe(Terrain.Shrubbery);

        command.undo(map);
        expect(map.get(new HexCoordinate(1, 1))).toBe(Terrain.Water);
        expect(map.get(new HexCoordinate(13, 3))).toBeUndefined();
        expect(map.get(new HexCoordinate(-2, -2))).toBe(Terrain.Wall);
        expect(map.get(new HexCoordinate(404, -4))).toBeUndefined();
        expect(map.get(new HexCoordinate(2, 2))).toBe(Terrain.Shrubbery);
    });

    test.each([[1],[2],[4],[8],[16],[32],[64],[128]])(
        'random command %i', (n) => {
            const {startMap, command, endMap} = randomCommand(n);
            // console.log(JSON.stringify(command));
            const map = new TerrainMap(startMap.toJSON());
            const clone = fromJSON(JSON.parse(JSON.stringify(command)));
            clone.apply(map);
            expect(JSON.parse(JSON.stringify(map))).toEqual(JSON.parse(JSON.stringify(endMap)));
            clone.undo(map);
            expect(JSON.parse(JSON.stringify(map))).toEqual(JSON.parse(JSON.stringify(startMap)));
        }
    );
});

describe('command performance', () => {
    const POWER = 20; // when first testing change to 10
    const MAX = 1 << POWER; // must be even

    test('undo wraping', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(3, 1);
        const terrain = Terrain.Water;

        let command = setTerrainCommand(coord, terrain);
        for (let i = 0; i < MAX; ++i) {
            command = undoCommand(command); // wrap the command in an undo command
        }

        for (let i = 0; i < MAX; ++i) {
            command.apply(map);
            map.remove(coord)
        }
        expect(map.get(coord)).toBeUndefined();
    });

    test('command wrapping', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(4, 1);
        const terrain = Terrain.Water;

        let command = setTerrainCommand(coord, terrain);
        for (let i = 0; i < MAX; ++i) {
            command = sequenceCommand([command]); // wrap the command in a sequence command
        }

        for (let i = 0; i < MAX; ++i) {
            command.apply(map);
            map.remove(coord);
        }
        expect(map.get(coord)).toBeUndefined();
    });

    test('extra command wrapping', () => {
        const map = new TerrainMap();
        const coord = new HexCoordinate(5, 1);
        const terrain = Terrain.Water;

        let command = setTerrainCommand(coord, terrain);
        for (let i = 0; i < MAX/2; ++i) {
            command = sequenceCommand([nullCommand(),command,sequenceCommand([])]); // wrap the command in a sequence command
        }

        for (let i = 0; i < MAX; ++i) {
            command.apply(map);
            map.remove(coord);
        }
        expect(map.get(coord)).toBeUndefined();
    });

    test('compound undo', () => {
        const map = new TerrainMap();
        const terrain = Terrain.Water;

        const commands : Command[] = [];
        for (let i = 0; i < MAX; ++i) {
            const coord = new HexCoordinate(i, 1);
            commands.push(setTerrainCommand(coord, terrain));
        }
        const command = sequenceCommand(commands);
        command.apply(map);
        let count = 0;
        for (let i = 0; i < MAX; ++i) {
            const coord = new HexCoordinate(i, 1);
            if (map.get(coord) === terrain) {
                count++;
            }
        }
        expect(count).toBe(MAX);
        command.undo(map);
        count = 0;
        for (let i = 0; i < MAX; ++i) {
            const coord = new HexCoordinate(i, 1);
            if (map.get(coord) === terrain) {
                count++;
            }
        }
        expect(count).toBe(0);
    });

    test('compound error', () => {
        const map = new TerrainMap();
        const terrain = Terrain.Water;
        const altTerrain = Terrain.Shrubbery;

        const commands : Command[] = [];
        for (let i = 0; i < MAX; ++i) {
            const coord = new HexCoordinate(i, 1);
            commands.push(setTerrainCommand(coord, terrain));
        }
        const command = sequenceCommand(commands);

        const halfway = new HexCoordinate(MAX/2, 1);
        map.set(halfway, altTerrain); // introduce an error
        expect(() => command.apply(map)).toThrow(Error);
        expect(map.get(halfway)).toBe(altTerrain);
        let count = 0;
        for (let i = 0; i < MAX; ++i) {
            const coord = new HexCoordinate(i, 1);
            if (map.get(coord) === terrain) {
                count++;
            }
        }
        expect(count).toBe(0);
    });

    test('compound undo error', () => {
        const map = new TerrainMap();
        const terrain = Terrain.Water;
        const altTerrain = Terrain.Shrubbery;

        const commands : Command[] = [];
        for (let i = 0; i < MAX; ++i) {
            const coord = new HexCoordinate(i, 1);
            map.set(coord, terrain);
            commands.push(setTerrainCommand(coord, terrain));
        }
        const command = sequenceCommand(commands);

        const halfway = new HexCoordinate(MAX/2, 1);
        map.set(halfway, altTerrain); // introduce an error
        expect(() => command.undo(map)).toThrow(Error);
        expect(map.get(halfway)).toBe(altTerrain);

        let count = 0;
        for (let i = 0; i < MAX; ++i) {
            const coord = new HexCoordinate(i, 1);
            if (map.get(coord) === terrain) {
                count++;
            }
        }
        expect(count).toBe(MAX-1);
    });
});

describe('command log behavior', () => {
    let map : TerrainMap;
    let log : Log;
    const commandlists = [
        [setTerrainCommand(new HexCoordinate(0, 0), Terrain.Water)],
        [ // independent
            setTerrainCommand(new HexCoordinate(1, 0), Terrain.Wall),
            setTerrainCommand(new HexCoordinate(2, 0), Terrain.Shrubbery)],
        [ 
            setTerrainCommand(new HexCoordinate(3, 0), Terrain.Curtain),
            setTerrainCommand(new HexCoordinate(3, 0), Terrain.Glass, Terrain.Curtain),
        ],
        [
            setTerrainCommand(new HexCoordinate(5, 0), Terrain.Water),
            setTerrainCommand(new HexCoordinate(4, 0), Terrain.Open),
            removeTerrainCommand(new HexCoordinate(5, 0), Terrain.Water)
        ],
        [
            sequenceCommand([
                setTerrainCommand(new HexCoordinate(3, 1), Terrain.Curtain),
                setTerrainCommand(new HexCoordinate(3, 2), Terrain.Shrubbery)
            ]),
            undoCommand(setTerrainCommand(new HexCoordinate(3, 1), Terrain.Curtain))
        ]
    ];
    const maplists : object[][] = [];
    beforeEach(() => {
        map = new TerrainMap();
        log = new Log(map);
        maplists.splice(0, maplists.length); // clear the maplists
        for (let i=0; i < commandlists.length; ++i) {
            const list : object[] = [];
            maplists.push(list);
            const m = new TerrainMap();
            for (let j=0; j < commandlists[i].length; ++j) {
                commandlists[i][j].apply(m);
                list.push(m.toJSON());
            }
        }
    });

    describe('empty log tests', () => {
        test('map', () => {
            expect(map.toJSON()).toEqual({}); // empty map
        });
        test('size', () => {
            expect(log.size).toBe(0)
        });
        test('version', () => {
            expect(log.version).toBe(0);
        });
        test('canUndo', () => {
            expect(log.canUndo()).toBe(false);
        });
        test('canRedo', () => {
            expect(log.canRedo()).toBe(false);
        });
        test('non-empty start', () => {
            log = new Log(new TerrainMap(maplists[2][1])); // start with a non-empty map
            expect(log.size).toBe(0);
            expect(log.version).toBe(0);
            expect(log.canUndo()).toBe(false);
            expect(log.canRedo()).toBe(false);
        })
    });

    describe('single command tests', () => {
        describe('using add', () => {
            test('map', () => {
                log.add(commandlists[0][0]);
                expect(map.toJSON()).toEqual(maplists[0][0]);
            });

            test('size', () => {
                log.add(commandlists[1][0]);
                expect(log.size).toBe(1);
            });

            test('version', () => {
                log.add(commandlists[2][0]);
                expect(log.version).toBe(1);
            });

            test('canUndo', () => {
                log.add(commandlists[3][0]);
                expect(log.canUndo()).toBe(true);
            });

            test('canRedo', () => {
                log.add(commandlists[4][0]);
                expect(log.canRedo()).toBe(false);
            });

            test('non-empty start', () => {
                map = new TerrainMap(maplists[3][1]);
                log = new Log(map); // start with a non-empty map
                log.add(commandlists[3][2]);
                expect(map.toJSON()).toEqual(maplists[3][2]);
                expect(log.size).toBe(1);
                expect(log.version).toBe(1);
                expect(log.canUndo()).toBe(true);
                expect(log.canRedo()).toBe(false);
            });
        });
        describe('using log', () => {
            test('map', () => {
                log.log(commandlists[0][0]);
                expect(map.toJSON()).toEqual({});
            });

            test('size', () => {
                commandlists[1][0].apply(map)
                log.log(commandlists[1][0]);
                expect(log.size).toBe(1);
            });

            test('version', () => {
                log.log(commandlists[2][0]);
                commandlists[2][0].apply(map);
                expect(log.version).toBe(1);
            });

            test('canUndo', () => {
                log.log(commandlists[3][0]);
                expect(log.canUndo()).toBe(true);
            });

            test('canRedo', () => {
                commandlists[4][0].apply(map);
                log.log(commandlists[4][0]);
                expect(log.canRedo()).toBe(false);
            });

            test('non-empty start', () => {
                map = new TerrainMap(maplists[3][1])
                log = new Log(map); // start with a non-empty map
                log.log(commandlists[3][2]);
                expect(map.toJSON()).toEqual(maplists[3][1]);
                expect(log.size).toBe(1);
                expect(log.version).toBe(1);
                expect(log.canUndo()).toBe(true);
                expect(log.canRedo()).toBe(false);
            });
        });

        describe('with undo', () => {
            test("map", () => {
                log.add(commandlists[1][0]);
                log.undo();
                expect(map.toJSON()).toEqual({});
            });
            test('size/version', () => {
                log.add(commandlists[2][0]);
                log.undo();
                expect(log.size).toBe(1);
                expect(log.version).toBe(0);
            });
            test('can....', () => {
                log.add(commandlists[2][0]);
                log.undo();
                expect(log.canUndo()).toBe(false);
                expect(log.canRedo()).toBe(true);
            });
            test('log', () => {
                log.log(commandlists[3][0]);
                commandlists[3][0].apply(map);
                log.undo();
                expect(log.size).toBe(1);
                expect(log.version).toBe(0);
                expect(log.canUndo()).toBe(false);
                expect(log.canRedo()).toBe(true);
            });
            test('non-empty start', () => {
                map = new TerrainMap(maplists[3][2]);
                log = new Log(map); // start with a non-empty map
                log.log(commandlists[3][2]);
                log.undo();
                expect(map.toJSON()).toEqual(maplists[3][1]);
                expect(log.size).toBe(1);
                expect(log.version).toBe(0);
                expect(log.canUndo()).toBe(false);
                expect(log.canRedo()).toBe(true);
            });
        });

        describe('with redo', () => {
            test('basics', () => {
                log.add(commandlists[4][0]);
                log.undo();
                log.redo();
                expect(map.toJSON()).toEqual(maplists[4][0]);
                expect(log.size).toBe(1);
                expect(log.version).toBe(1);
                expect(log.canUndo()).toBe(true);
                expect(log.canRedo()).toBe(false);
                expect(map.toJSON()).toEqual(maplists[4][0]);
                expect(log.size).toBe(1);
                expect(log.version).toBe(1);
                expect(log.canUndo()).toBe(true);
                expect(log.canRedo()).toBe(false);
            });
            test('non-empty start', () => {
                map = new TerrainMap(maplists[4][1]);
                log = new Log(map);
                log.log(commandlists[4][1]);
                log.undo();
                log.redo();
                expect(map.toJSON()).toEqual(maplists[4][1]);
                expect(log.size).toBe(1);
                expect(log.version).toBe(1);
                expect(log.canUndo()).toBe(true);
                expect(log.canRedo()).toBe(false);
            });
        });
    });
    describe('logs with two commands', () => {
        test('basics', () => {
            log.add(commandlists[1][0]);
            log.add(commandlists[1][1]);
            expect(map.toJSON()).toEqual(maplists[1][1]);
            expect(log.size).toBe(2);
            expect(log.version).toBe(2);
            expect(log.canUndo()).toBe(true);
            expect(log.canRedo()).toBe(false);
        });
        test('undo 1', () => {
            log.add(commandlists[2][0]);
            log.add(commandlists[2][1]);
            log.undo();
            expect(map.toJSON()).toEqual(maplists[2][0]);
            expect(log.size).toBe(2);
            expect(log.version).toBe(1);
            expect(log.canUndo()).toBe(true);
            expect(log.canRedo()).toBe(true);
        });
        test('undo 2', () => {
            log.add(commandlists[3][0]);
            log.add(commandlists[3][1]);
            log.undo();
            log.undo();
            expect(map.toJSON()).toEqual({});
            expect(log.size).toBe(2);
            expect(log.version).toBe(0);
            expect(log.canUndo()).toBe(false);
            expect(log.canRedo()).toBe(true);
        });
        test('undo2 + redo', () => {
            log.add(commandlists[4][0]);
            log.add(commandlists[4][1]);
            log.undo();
            log.undo();
            log.redo();
            expect(map.toJSON()).toEqual(maplists[4][0]);
            expect(log.size).toBe(2);
            expect(log.version).toBe(1);
            expect(log.canUndo()).toBe(true);
            expect(log.canRedo()).toBe(true);
        });
        test('non-empty start', () => {
            commandlists[3][0].apply(map);
            log.add(commandlists[3][1]);
            log.add(commandlists[3][2]);
            expect(map.toJSON()).toEqual(maplists[3][2]);
            expect(log.size).toBe(2);
            expect(log.version).toBe(2);
            expect(log.canUndo()).toBe(true);
            expect(log.canRedo()).toBe(false);
        });
        test('in parts', () => {
            log.add(commandlists[2][0]);
            log.undo();
            log.redo();
            commandlists[2][1].apply(map);
            log.log(commandlists[2][1]);
            expect(map.toJSON()).toEqual(maplists[2][1]);
            expect(log.size).toBe(2);
            expect(log.version).toBe(2);
            expect(log.canUndo()).toBe(true);
            expect(log.canRedo()).toBe(false);
        });
    });
    describe('size 3', () => {
        test('basics', () => {
            log.add(commandlists[3][0]);
            log.add(commandlists[3][1]);
            log.log(commandlists[3][2]);
            commandlists[3][2].apply(map);
            expect(map.toJSON()).toEqual(maplists[3][2]);
            expect(log.size).toBe(3);
            expect(log.version).toBe(3);
            expect(log.canUndo()).toBe(true);
            expect(log.canRedo()).toBe(false);
        });
        test('undo', () => {
            commandlists[3][0].apply(map);
            log.log(commandlists[3][0]);
            log.add(commandlists[3][1]);
            log.undo();
            log.redo();
            log.add(commandlists[3][2]);
            log.undo();
            expect(log.size).toBe(3);
            expect(log.version).toBe(2);
            expect(log.canUndo()).toBe(true);
            expect(log.canRedo()).toBe(true);
            log.undo();
            expect(log.size).toBe(3);
            expect(log.version).toBe(1);
            expect(log.canUndo()).toBe(true);
            expect(log.canRedo()).toBe(true);
            expect(map.toJSON()).toEqual(maplists[3][0]);
            log.undo();
            expect(log.size).toBe(3);
            expect(log.version).toBe(0);
            expect(log.canUndo()).toBe(false);
            expect(log.canRedo()).toBe(true);
        });
        test('redo', () => {
            log.log(commandlists[3][0]);
            commandlists[3][0].apply(map);
            log.undo();
            log.redo();
            commandlists[3][1].apply(map);
            log.log(commandlists[3][1]);
            log.add(commandlists[3][2]);
            log.undo();
            log.undo();
            log.undo();
            log.redo();
            expect(log.size).toBe(3);
            expect(log.version).toBe(1);
            expect(log.canUndo()).toBe(true);
            expect(log.canRedo()).toBe(true);
            log.redo();
            expect(log.size).toBe(3);
            expect(log.version).toBe(2);
            expect(log.canUndo()).toBe(true);
            expect(log.canRedo()).toBe(true);
            log.redo();
            expect(log.size).toBe(3);
            expect(log.version).toBe(3);
            expect(log.canUndo()).toBe(true);
            expect(log.canRedo()).toBe(false);
            expect(map.toJSON()).toEqual(maplists[3][2]);
        });

        test('with empty sequence', () => {
            log.add(commandlists[2][0]);
            log.add(sequenceCommand([]));
            log.add(commandlists[2][1]);
            expect(log.size).toBe(3);
            expect(log.version).toBe(3);
            expect(map.toJSON()).toEqual(maplists[2][1]);
        });

        test('with nested sequence', () => {
            log.add(commandlists[1][0]);
            log.add(sequenceCommand([
                undoCommand(commandlists[1][0]),
                commandlists[1][1],
                commandlists[1][0]
            ]));
            log.add(undoCommand(commandlists[1][1]));
            expect(log.size).toBe(3);
            log.undo();
            expect(map.toJSON()).toEqual(maplists[1][1]);
            expect(log.version).toBe(2);
        });
    });

    describe('observer tests', () => {
        let numObservations = 0;
        const observer = (_log: Log) => {
            numObservations++;
        };
        beforeEach(() => {
            numObservations = 0;
            log.addObserver(observer);
        });

        test('add gets observation', () => {
            log.add(setTerrainCommand(new HexCoordinate(0, 0), Terrain.Water));
            expect(numObservations).toBe(1);
        });

        test('log gets observation', () => {
            log.add(commandlists[1][0]);
            numObservations = 0;
            log.log(commandlists[1][1]);
            expect(numObservations).toBe(1);
        });

        test('undo gets observation', () => {
            log.add(setTerrainCommand(new HexCoordinate(2, 0), Terrain.Shrubbery));
            numObservations = 0;
            log.undo();
            expect(numObservations).toBe(1);
        });

        test('redo gets observation', () => {
            log.add(setTerrainCommand(new HexCoordinate(3, 0), Terrain.Curtain));
            log.undo();
            numObservations = 0;
            log.redo();
            expect(numObservations).toBe(1);
        });

        test('multiple undo get observations', () => {
            log.add(commandlists[3][0]);
            log.add(commandlists[3][1]);
            log.add(commandlists[3][2]);
            numObservations = 0;
            log.undo();
            log.undo();
            log.undo();
            expect(numObservations).toBe(3);
        });

        test('multiple undo/redo get observations', () => {
            log.add(commandlists[3][0]);
            log.add(commandlists[3][1]);
            log.add(commandlists[3][2]);
            log.undo();
            log.undo();
            numObservations = 0;
            log.redo();
            log.redo();
            expect(numObservations).toBe(2);
         });

        test('removeObserver removes observation', () => {
            log.removeObserver(observer);
            log.add(setTerrainCommand(new HexCoordinate(4, 0), Terrain.Glass));
            expect(numObservations).toBe(0);
        });

        test('clean gets one observation', () => {
            log.add(commandlists[2][0]);
            log.add(commandlists[2][1]);
            numObservations = 0;
            log.clear();
            expect(numObservations).toBe(1);
            expect(log.size).toBe(0);
        });

        test('multiple observers', () => {
            const observer2 = (_log: Log) => {
                numObservations++;
            };
            log.addObserver(observer2);
            log.add(setTerrainCommand(new HexCoordinate(5, 0), Terrain.Water));
            expect(numObservations).toBe(2);
            log.removeObserver(observer);
            log.add(setTerrainCommand(new HexCoordinate(6, 0), Terrain.Shrubbery));
            expect(numObservations).toBe(3);
        });
    })
});

describe('microsoft log policy', () => {
    const h00 = new HexCoordinate(0,0);
    const h10 = new HexCoordinate(1,0);
    const h11 = new HexCoordinate(1,1);
    const h21 = new HexCoordinate(2,1);
    const h22 = new HexCoordinate(2,2);

    let map = new TerrainMap();
    let log = new Log(map);

    beforeEach(() => {
        map = new TerrainMap();
        log = new Log(map, LogUndoPolicy.MICROSOFT);
    }) ;

    test('1 undo 1 do 1', () => {
        log.add(setTerrainCommand(h00,Terrain.Open));
        log.undo();
        log.add(setTerrainCommand(h00, Terrain.Water));
        expect(log.size).toBe(1);
        expect(log.version).toBe(1);
        log.undo();
        log.redo();
        expect(map.get(h00)).toBe(Terrain.Water);
    });

    test('1 undo 1 do 1 with log', () => {
        map.set(h10, Terrain.Shrubbery)
        log.add(setTerrainCommand(h10, Terrain.Open, Terrain.Shrubbery));
        log.undo();
        map.set(h10, Terrain.Curtain);
        log.log(setTerrainCommand(h10, Terrain.Curtain, Terrain.Shrubbery));
        expect(map.get(h10)).toBe(Terrain.Curtain);
        expect(log.size).toBe(1);
    });

    test('2 undo 1 do 1', () => {
        log.add(setTerrainCommand(h21, Terrain.Wall));
        log.add(setTerrainCommand(h21, Terrain.Glass, Terrain.Wall));
        log.undo();
        log.add(setTerrainCommand(h21, Terrain.Water, Terrain.Wall));
        expect(log.size).toBe(2);
        expect(log.version).toBe(2);
    });

    test('2 undo 1 do 1 undo 2', () => {
        log.add(setTerrainCommand(h21, Terrain.Wall));
        log.add(setTerrainCommand(h21, Terrain.Glass, Terrain.Wall));
        log.undo();
        log.add(setTerrainCommand(h21, Terrain.Water, Terrain.Wall));
        log.undo();
        log.undo();
        expect(log.size).toBe(2);
        expect(log.version).toBe(0);
        expect(map.get(h21)).toBeUndefined();
    });

    test('2 undo 2 do 1', () => {
        map.set(h22, Terrain.Open);  
        log.add(setTerrainCommand(h22, Terrain.Curtain, Terrain.Open));
        log.add(setTerrainCommand(h11, Terrain.Shrubbery));
        log.undo();
        log.undo();
        log.add(setTerrainCommand(h22, Terrain.Wall, Terrain.Open));
        expect(log.size).toBe(1);
        expect(log.version).toBe(1);
        expect(map.get(h11)).toBeUndefined();
        expect(map.get(h22)).toBe(Terrain.Wall);
    });

    test('3 undo 2 do 1', () => {
        map.set(h00, Terrain.Open);
        log.add(setTerrainCommand(h10, Terrain.Water));
        log.add(setTerrainCommand(h00, Terrain.Wall, Terrain.Open));
        log.add(setTerrainCommand(h10, Terrain.Shrubbery, Terrain.Water));
        log.undo();
        log.undo();
        log.add(setTerrainCommand(h00, Terrain.Curtain, Terrain.Open));
        expect(log.size).toBe(2);
        expect(log.version).toBe(2);
        expect(map.get(h00)).toBe(Terrain.Curtain);
        expect(map.get(h10)).toBe(Terrain.Water);
    });

    test('3 undo 2 do 1 undo 2', () => {
        map.set(h00, Terrain.Open);
        log.add(setTerrainCommand(h10, Terrain.Water));
        log.add(setTerrainCommand(h00, Terrain.Wall, Terrain.Open));
        log.add(setTerrainCommand(h10, Terrain.Shrubbery, Terrain.Water));
        log.undo();
        log.undo();
        log.add(setTerrainCommand(h00, Terrain.Curtain, Terrain.Open));
        log.undo();
        log.undo();
        expect(log.size).toBe(2);
        expect(log.version).toBe(0);
        expect(map.get(h00)).toBe(Terrain.Open);
        expect(map.get(h10)).toBeUndefined();
    });

    test('4 undo 3 do 2 undo 1 do 1', () => {
        map.set(h11, Terrain.Water);
        map.set(h22, Terrain.Wall);
        log.add(setTerrainCommand(h00, Terrain.Open));
        log.add(removeTerrainCommand(h11, Terrain.Water));
        log.add(setTerrainCommand(h22, Terrain.Curtain, Terrain.Wall));
        log.add(setTerrainCommand(h11, Terrain.Shrubbery));
        log.undo();
        log.undo();
        log.undo();
        log.add(setTerrainCommand(h11, Terrain.Open, Terrain.Water));
        log.add(setTerrainCommand(h21, Terrain.Glass));
        log.undo();
        log.add(setTerrainCommand(h21, Terrain.Wall));
        expect(log.size).toBe(3);
        expect(log.version).toBe(3);
        expect(map.get(h00)).toBe(Terrain.Open);
        expect(map.get(h11)).toBe(Terrain.Open);
        expect(map.get(h21)).toBe(Terrain.Wall);
        expect(map.get(h22)).toBe(Terrain.Wall);
    });

    test('4 undo 3 do 2 undo 1 do 1 undo 3', () => {
        map.set(h11, Terrain.Water);
        map.set(h22, Terrain.Wall);
        log.add(setTerrainCommand(h00, Terrain.Open));
        log.add(removeTerrainCommand(h11, Terrain.Water));
        log.add(setTerrainCommand(h22, Terrain.Curtain, Terrain.Wall));
        log.add(setTerrainCommand(h11, Terrain.Shrubbery));
        log.undo();
        log.undo();
        log.undo();
        log.add(setTerrainCommand(h11, Terrain.Open, Terrain.Water));
        log.add(setTerrainCommand(h21, Terrain.Glass));
        log.undo();
        log.add(setTerrainCommand(h21, Terrain.Wall));
        log.undo();
        log.undo();
        log.undo();
        expect(log.size).toBe(3);
        expect(log.version).toBe(0);
        expect(map.get(h00)).toBeUndefined();
        expect(map.get(h11)).toBe(Terrain.Water);
        expect(map.get(h21)).toBeUndefined();
        expect(map.get(h22)).toBe(Terrain.Wall);
    });

    test('discard log is not a separate action', () => {
        let observations = 0;
        const observer = () => {
            ++observations
        };
        log.addObserver(observer);
        map.set(h11, Terrain.Water);
        map.set(h22, Terrain.Wall);
        log.add(setTerrainCommand(h00, Terrain.Open));
        log.add(removeTerrainCommand(h11, Terrain.Water));
        log.add(setTerrainCommand(h22, Terrain.Curtain, Terrain.Wall));
        log.add(setTerrainCommand(h11, Terrain.Shrubbery));
        log.undo();
        log.undo();
        log.undo();
        observations = 0;
        log.add(setTerrainCommand(h11, Terrain.Open, Terrain.Water));
        expect(observations).toBe(1); // discard log is not a separate action
    });
});

describe('gnu log policy', () => {
    const h00 = new HexCoordinate(0,0);
    const h10 = new HexCoordinate(1,0);
    const h11 = new HexCoordinate(1,1);
    const h21 = new HexCoordinate(2,1);
    const h22 = new HexCoordinate(2,2);

    let map = new TerrainMap();
    let log = new Log(map);

    beforeEach(() => {
        map = new TerrainMap();
        log = new Log(map, LogUndoPolicy.GNU);
    }) ;

    test('1 undo 1 do 1', () => {
        log.add(setTerrainCommand(h00,Terrain.Open));
        log.undo();
        log.add(setTerrainCommand(h00, Terrain.Water));
        expect(log.size).toBe(3);
        expect(log.version).toBe(3);
        log.undo();
        log.redo();
        expect(map.get(h00)).toBe(Terrain.Water);
    });

    test('1 undo 1 do 1 with log', () => {
        map.set(h10, Terrain.Shrubbery)
        log.add(setTerrainCommand(h10, Terrain.Open, Terrain.Shrubbery));
        log.undo();
        map.set(h10, Terrain.Curtain);
        log.log(setTerrainCommand(h10, Terrain.Curtain, Terrain.Shrubbery));
        expect(map.get(h10)).toBe(Terrain.Curtain);
        expect(log.size).toBe(3);
    });

    test('2 undo 1 do 1', () => {
        log.add(setTerrainCommand(h21, Terrain.Wall));
        log.add(setTerrainCommand(h21, Terrain.Glass, Terrain.Wall));
        log.undo();
        log.add(setTerrainCommand(h21, Terrain.Water, Terrain.Wall));
        expect(log.size).toBe(4);
        expect(log.version).toBe(4);
    });

    test('2 undo 1 do 1 undo 2', () => {
        log.add(setTerrainCommand(h21, Terrain.Wall));
        log.add(setTerrainCommand(h21, Terrain.Glass, Terrain.Wall));
        log.undo();
        log.add(setTerrainCommand(h21, Terrain.Water, Terrain.Wall));
        log.undo();
        log.undo();
        expect(log.size).toBe(4);
        expect(log.version).toBe(2);
        expect(map.get(h21)).toBe(Terrain.Glass);
    });

    test('2 undo 2 do 1', () => {
        map.set(h22, Terrain.Open);  
        log.add(setTerrainCommand(h22, Terrain.Curtain, Terrain.Open));
        log.add(setTerrainCommand(h11, Terrain.Shrubbery));
        log.undo();
        log.undo();
        log.add(setTerrainCommand(h22, Terrain.Wall, Terrain.Open));
        expect(log.size).toBe(5);
        expect(log.version).toBe(5);
        expect(map.get(h11)).toBeUndefined();
        expect(map.get(h22)).toBe(Terrain.Wall);
    });

    test('3 undo 2 do 1', () => {
        map.set(h00, Terrain.Open);
        log.add(setTerrainCommand(h10, Terrain.Water));
        log.add(setTerrainCommand(h00, Terrain.Wall, Terrain.Open));
        log.add(setTerrainCommand(h10, Terrain.Shrubbery, Terrain.Water));
        log.undo();
        log.undo();
        log.add(setTerrainCommand(h00, Terrain.Curtain, Terrain.Open));
        expect(log.size).toBe(6);
        expect(log.version).toBe(6);
        expect(map.get(h00)).toBe(Terrain.Curtain);
        expect(map.get(h10)).toBe(Terrain.Water);
    });

    test('3 undo 2 do 1 undo 2', () => {
        map.set(h00, Terrain.Open);
        log.add(setTerrainCommand(h10, Terrain.Water));
        log.add(setTerrainCommand(h00, Terrain.Wall, Terrain.Open));
        log.add(setTerrainCommand(h10, Terrain.Shrubbery, Terrain.Water));
        log.undo();
        log.undo();
        log.add(setTerrainCommand(h00, Terrain.Curtain, Terrain.Open));
        log.undo();
        log.undo();
        expect(log.size).toBe(6);
        expect(log.version).toBe(4);
        expect(map.get(h00)).toBe(Terrain.Wall);
        expect(map.get(h10)).toBe(Terrain.Water);
    });

    test('4 undo 3 do 2 undo 1 do 1', () => {
        map.set(h11, Terrain.Water);
        map.set(h22, Terrain.Wall);
        log.add(setTerrainCommand(h00, Terrain.Open));
        log.add(removeTerrainCommand(h11, Terrain.Water));
        log.add(setTerrainCommand(h22, Terrain.Curtain, Terrain.Wall));
        log.add(setTerrainCommand(h11, Terrain.Shrubbery));
        log.undo();
        log.undo();
        log.undo();
        log.add(setTerrainCommand(h11, Terrain.Open, Terrain.Water));
        log.add(setTerrainCommand(h21, Terrain.Glass));
        log.undo();
        log.add(setTerrainCommand(h21, Terrain.Wall));
        expect(log.size).toBe(11);
        expect(log.version).toBe(11);
        expect(map.get(h00)).toBe(Terrain.Open);
        expect(map.get(h11)).toBe(Terrain.Open);
        expect(map.get(h21)).toBe(Terrain.Wall);
        expect(map.get(h22)).toBe(Terrain.Wall);
    });

    test('4 undo 3 do 2 undo 1 do 1 undo 3', () => {
        map.set(h11, Terrain.Water);
        map.set(h22, Terrain.Wall);
        log.add(setTerrainCommand(h00, Terrain.Open));
        log.add(removeTerrainCommand(h11, Terrain.Water));
        log.add(setTerrainCommand(h22, Terrain.Curtain, Terrain.Wall));
        log.add(setTerrainCommand(h11, Terrain.Shrubbery));
        log.undo();
        log.undo();
        log.undo();
        log.add(setTerrainCommand(h11, Terrain.Open, Terrain.Water));
        log.add(setTerrainCommand(h21, Terrain.Glass));
        log.undo();
        log.add(setTerrainCommand(h21, Terrain.Wall));
        log.undo();
        log.undo();
        log.undo();
        expect(log.size).toBe(11);
        expect(log.version).toBe(8);
        expect(map.get(h00)).toBe(Terrain.Open);
        expect(map.get(h11)).toBe(Terrain.Open);
        expect(map.get(h21)).toBeUndefined();
        expect(map.get(h22)).toBe(Terrain.Wall);
    });
    test('reverse log is not a separate action', () => {
        let observations = 0;
        const observer = () => {
            ++observations
        };
        log.addObserver(observer);
        map.set(h11, Terrain.Water);
        map.set(h22, Terrain.Wall);
        log.add(setTerrainCommand(h00, Terrain.Open));
        log.add(removeTerrainCommand(h11, Terrain.Water));
        log.add(setTerrainCommand(h22, Terrain.Curtain, Terrain.Wall));
        log.add(setTerrainCommand(h11, Terrain.Shrubbery));
        log.undo();
        log.undo();
        log.undo();
        observations = 0;
        log.add(setTerrainCommand(h11, Terrain.Open, Terrain.Water));
        expect(observations).toBe(1); // reverse log is not a separate action
    });
});
