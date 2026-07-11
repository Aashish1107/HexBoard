import { nanoid } from "nanoid";
import { HexCoordinate } from "../../client/HexCoordinate";
import { mockGraphicsContext } from "../../client/mockWebElements";

describe('hex coordinate basics', () => {
    test('should create hexCoordinate with default C', () => {
        const hex = new HexCoordinate(1, 2);
        expect(hex.a).toBe(1);
        expect(hex.b).toBe(2);
        expect(hex.c).toBe(-1);
    });

    test('should create hexCoordinate with three values', () => {
        const hex = new HexCoordinate(3, 2, 1);
        expect(hex.a).toBe(3);
        expect(hex.b).toBe(2);
        expect(hex.c).toBe(1);
    });

    test('should throw on invalid construction', () => {
        expect(() => new HexCoordinate(1, 2, 1)).toThrow();
    });

    test('should convert hex to string', () => {
        const hex = new HexCoordinate(1, 2);
        expect(hex.toString()).toBe("<1,2>");
    });

    test('should create hex from string', () => {
        const hex = HexCoordinate.fromString("<1,2>");
        expect(hex.a).toBe(1);
        expect(hex.b).toBe(2);
    });

    test('should create hex from three value string', () => {
        const hex = HexCoordinate.fromString("<3,2,1>");
        expect(hex.a).toBe(3);
        expect(hex.b).toBe(2);
    });

    test('should throw on invalid from string', () => {
        expect(() => HexCoordinate.fromString("(1,2)")).toThrow();
    });

    test('should throw on invalid C value', () => {
        expect(() => HexCoordinate.fromString("<1,2,3>")).toThrow();
    });

    test('should throw on invalid string length', () => {
        expect(() => HexCoordinate.fromString("<4,2,2,2>")).toThrow();
    });
})

describe('hex coordinate equality', () => {
    test('should return true for equal hexes', () => {
        const hex1 = new HexCoordinate(1, 2);
        const hex2 = new HexCoordinate(1, 2);
        expect(hex1.equals(hex2)).toBe(true);
    });

    test('should return false for unequal hexes', () => {
        const hex1 = new HexCoordinate(1, 2);
        const hex2 = new HexCoordinate(2, 1);
        expect(hex1.equals(hex2)).toBe(false);
    });
});

describe('toPoint behavior', () => {
    test('toPoint(0, 0)', () => {
        const hex = new HexCoordinate(0, 0);
        expect(hex.toPoint().x).toBeCloseTo(0);
        expect(hex.toPoint().y).toBeCloseTo(0);
    });
    test('toPoint(1, 1)', () => {
        const hex = new HexCoordinate(1, 1);
        expect(hex.toPoint().x).toBeCloseTo(0.5);
        expect(hex.toPoint().y).toBeCloseTo(0.866);
    });
    test('toPoint(2, 1)', () => {
        const hex = new HexCoordinate(2, 1);
        expect(hex.toPoint().x).toBeCloseTo(1.5);
        expect(hex.toPoint().y).toBeCloseTo(0.866);
    });
    test('toPoint(3, 1)', () => {
        const hex = new HexCoordinate(3, 1);
        expect(hex.toPoint().x).toBeCloseTo(2.5);
        expect(hex.toPoint().y).toBeCloseTo(0.866);
    });
    test('toPoint(1, 2)', () => {
        const hex = new HexCoordinate(1, 2);
        expect(hex.toPoint().x).toBeCloseTo(0);
        expect(hex.toPoint().y).toBeCloseTo(1.732);
    });
    test('toPoint(2, 2)', () => {
        const hex = new HexCoordinate(2, 2);
        expect(hex.toPoint().x).toBeCloseTo(1);
        expect(hex.toPoint().y).toBeCloseTo(1.732);
    });
    test('toPoint(3, 2)', () => {
        const hex = new HexCoordinate(3, 2);
        expect(hex.toPoint().x).toBeCloseTo(2);
        expect(hex.toPoint().y).toBeCloseTo(1.732);
    });
    test('toPoint(1, 3)', () => {
        const hex = new HexCoordinate(1, 3);
        expect(hex.toPoint().x).toBeCloseTo(-0.5);
        expect(hex.toPoint().y).toBeCloseTo(2.598);
    });
    test('toPoint(2, 3)', () => {
        const hex = new HexCoordinate(2, 3);
        expect(hex.toPoint().x).toBeCloseTo(0.5);
        expect(hex.toPoint().y).toBeCloseTo(2.598);
    });
    test('toPoint(3, 3)', () => {
        const hex = new HexCoordinate(3, 3);
        expect(hex.toPoint().x).toBeCloseTo(1.5);
        expect(hex.toPoint().y).toBeCloseTo(2.598);
    });
});

describe('fromPoint behavior', () => {
    test('fromPoint(0, 0)', () => {
        const hex = HexCoordinate.fromPoint({x:0, y:0});
        expect(hex.a).toBeCloseTo(0);
        expect(hex.b).toBeCloseTo(0);
    });
    test('fromPoint(1, 1)', () => {
        const hex = HexCoordinate.fromPoint({x:1, y:1});
        expect(hex.a).toBeCloseTo(1.577);
        expect(hex.b).toBeCloseTo(1.154);
    });
    test('fromPoint(2, 1)', () => {
        const hex = HexCoordinate.fromPoint({x:2, y:1});
        expect(hex.a).toBeCloseTo(2.577);
        expect(hex.b).toBeCloseTo(1.154);
    });
    test('fromPoint(3, 1)', () => {
        const hex = HexCoordinate.fromPoint({x:3, y:1});
        expect(hex.a).toBeCloseTo(3.577);
        expect(hex.b).toBeCloseTo(1.154);
    });
    test('fromPoint(1, 2)', () => {
        const hex = HexCoordinate.fromPoint({x:1, y:2});
        expect(hex.a).toBeCloseTo(2.154);
        expect(hex.b).toBeCloseTo(2.309);
    });
    test('fromPoint(2, 2)', () => {
        const hex = HexCoordinate.fromPoint({x:2, y:2});
        expect(hex.a).toBeCloseTo(3.154);
        expect(hex.b).toBeCloseTo(2.309);
    });
    test('fromPoint(3, 2)', () => {
        const hex = HexCoordinate.fromPoint({x:3, y:2});
        expect(hex.a).toBeCloseTo(4.154);
        expect(hex.b).toBeCloseTo(2.309);
    });
    test('fromPoint(1, 3)', () => {
        const hex = HexCoordinate.fromPoint({x:1, y:3});
        expect(hex.a).toBeCloseTo(2.732);
        expect(hex.b).toBeCloseTo(3.464);
    });
    test('fromPoint(2, 3)', () => {
        const hex = HexCoordinate.fromPoint({x:2, y:3});
        expect(hex.a).toBeCloseTo(3.732);
        expect(hex.b).toBeCloseTo(3.464);
    });
    test('fromPoint(3, 3)', () => {
        const hex = HexCoordinate.fromPoint({x:3, y:3});
        expect(hex.a).toBeCloseTo(4.732);
        expect(hex.b).toBeCloseTo(3.464);
    });
 });

describe('hex distance', () => {
    let hex1 : HexCoordinate;
    beforeAll(() => {
        hex1 = new HexCoordinate(2, 1);
    });

    test('hex distance 0', () => {
        const hex2 = new HexCoordinate(2, 1);
        expect(hex1.distance(hex2)).toBe(0);
    });

    test('hex distance 1a', () => {
        const hex2 = new HexCoordinate(1, 0);
        expect(hex1.distance(hex2)).toBe(1);
    });
    test('hex dostance 1b', () => {
        const hex2 = new HexCoordinate(2, 0);
        expect(hex1.distance(hex2)).toBe(1);
    });
    test('hex distance 1c', () => {
        const hex2 = new HexCoordinate(3, 1);
        expect(hex1.distance(hex2)).toBe(1);
    });
    test('hex distance 1d', () => {
        const hex2 = new HexCoordinate(3, 2);
        expect(hex1.distance(hex2)).toBe(1);
    });
    test('hex distance 1e', () => {
        const hex2 = new HexCoordinate(2, 2);
        expect(hex1.distance(hex2)).toBe(1);
    });
    test('hex distance 1f', () => {
        const hex2 = new HexCoordinate(1, 1);
        expect(hex1.distance(hex2)).toBe(1);
    });

    test('hex distance 2a', () => {
        const hex2 = new HexCoordinate(0, 0);
        expect(hex1.distance(hex2)).toBe(2);
    });
    test('hex distance 2b', () => {
        const hex2 = new HexCoordinate(0, -1);
        expect(hex1.distance(hex2)).toBe(2);
    });
    test('hex distance 2c', () => {
        const hex2 = new HexCoordinate(1, -1);
        expect(hex1.distance(hex2)).toBe(2);
    });
    test('hexdistance 2d', () => {
        const hex2 = new HexCoordinate(2, -1);
        expect(hex1.distance(hex2)).toBe(2);
    });
    test('hex distance 2e', () => {
        const hex2 = new HexCoordinate(3, 0);
        expect(hex1.distance(hex2)).toBe(2);
    });
    test('hex distance 2f', () => {
        const hex2 = new HexCoordinate(4, 1);
        expect(hex1.distance(hex2)).toBe(2);
    });
    test('hex distance 2g', () => {
        const hex2 = new HexCoordinate(4, 2);
        expect(hex1.distance(hex2)).toBe(2);
    });
    test('hex distance 2h', () => {
        const hex2 = new HexCoordinate(4, 3);
        expect(hex1.distance(hex2)).toBe(2);
    });
    test('hex distance 2i', () => {
        const hex2 = new HexCoordinate(3, 3);
        expect(hex1.distance(hex2)).toBe(2);
    });
    test('hex distance 2j', () => {
        const hex2 = new HexCoordinate(2, 3);
        expect(hex1.distance(hex2)).toBe(2);
    });
    test('hex distance 2k', () => {
        const hex2 = new HexCoordinate(1, 2);
        expect(hex1.distance(hex2)).toBe(2);
    });
    test('hex distance 2l', () => {
        const hex2 = new HexCoordinate(0, 1);
        expect(hex1.distance(hex2)).toBe(2);
    });

    test('hex distance 3A', () => {
        const hex2 = new HexCoordinate(5, 2, 3);
        expect(hex1.distance(hex2)).toBe(3);
    });

    test('hex distance 3B', () => {
        const hex2 = new HexCoordinate(5, 4, 1);
        expect(hex1.distance(hex2)).toBe(3);
    });

    test('hex distance 3C', () => {
        const hex2 = new HexCoordinate(0, 2);
        expect(hex1.distance(hex2)).toBe(3);
    });

    test('hex distance 3D', () => {
        const hex2 = new HexCoordinate(-1, -1);
        expect(hex1.distance(hex2)).toBe(3);
    });

    test('hex distance 4', () => {
        const hex2 = new HexCoordinate(6, 5);
        expect(hex2.distance(hex1)).toBe(4);
    });
});

describe('hex coordinate rounding', () => {
    test('round(2, 1.4)', () => {
        const hex = new HexCoordinate(2, 1.4);
        expect(hex.round()).toStrictEqual(new HexCoordinate(2,1));
    });
    test('round(2.1, 1.4)', () => {
        const hex = new HexCoordinate(2.1, 1.4);
        expect(hex.round()).toStrictEqual(new HexCoordinate(2,1));
    });
    test('round(2.2, 1.4)', () => {
        const hex = new HexCoordinate(2.2, 1.4);
        expect(hex.round()).toStrictEqual(new HexCoordinate(2,1));
    });
    test('round(2.3, 1.4)', () => {
        const hex = new HexCoordinate(2.3, 1.4);
        expect(hex.round()).toStrictEqual(new HexCoordinate(2,1));
    });
    test('round(2.4, 1.4)', () => {
        const hex = new HexCoordinate(2.4, 1.4);
        expect(hex.round()).toStrictEqual(new HexCoordinate(2,1));
    });
    test('round(2.5, 1.4)', () => {
        const hex = new HexCoordinate(2.5, 1.4);
        expect(hex.round()).toStrictEqual(new HexCoordinate(2,1));
    });
    test('round(2.6, 1.4)', () => {
        const hex = new HexCoordinate(2.6, 1.4);
        expect(hex.round()).toStrictEqual(new HexCoordinate(3,2));
    });
    test('round(2.7, 1.4)', () => {
        const hex = new HexCoordinate(2.7, 1.4);
        expect(hex.round()).toStrictEqual(new HexCoordinate(3,2));
    });
    test('round(2.8, 1.4)', () => {
        const hex = new HexCoordinate(2.8, 1.4);
        expect(hex.round()).toStrictEqual(new HexCoordinate(3,1));
    });
    test('round(2.9, 1.4)', () => {
        const hex = new HexCoordinate(2.9, 1.4);
        expect(hex.round()).toStrictEqual(new HexCoordinate(3,1));
    });
    test('round(3.0, 1.4)', () => {
        const hex = new HexCoordinate(3.0, 1.4);
        expect(hex.round()).toStrictEqual(new HexCoordinate(3,1));
    });
    test('round(2, 1.5)', () => {
        const hex = new HexCoordinate(2, 1.5);
        expect(hex.round()).toStrictEqual(new HexCoordinate(2,2));
    });
    test('round(2.1, 1.5)', () => {
        const hex = new HexCoordinate(2.1, 1.5);
        expect(hex.round()).toStrictEqual(new HexCoordinate(2,1));
    });
    test('round(2.2, 1.5)', () => {
        const hex = new HexCoordinate(2.2, 1.5);
        expect(hex.round()).toStrictEqual(new HexCoordinate(2,1));
    });
    test('round(2.3, 1.5)', () => {
        const hex = new HexCoordinate(2.3, 1.5);
        expect(hex.round()).toStrictEqual(new HexCoordinate(2,1));
    });
    test('round(2.4, 1.5)', () => {
        const hex = new HexCoordinate(2.4, 1.5);
        expect(hex.round()).toStrictEqual(new HexCoordinate(2,1));
    });
    test('round(2.5, 1.5)', () => {
        const hex = new HexCoordinate(2.5, 1.5);
        expect(hex.round()).toStrictEqual(new HexCoordinate(3,2));
    });
    test('round(2.6, 1.5)', () => {
        const hex = new HexCoordinate(2.6, 1.5);
        expect(hex.round()).toStrictEqual(new HexCoordinate(3,2));
    });
    test('round(2.7, 1.5)', () => {
        const hex = new HexCoordinate(2.7, 1.5);
        expect(hex.round()).toStrictEqual(new HexCoordinate(3,2));
    });
    test('round(2.8, 1.5)', () => {
        const hex = new HexCoordinate(2.8, 1.5);
        expect(hex.round()).toStrictEqual(new HexCoordinate(3,2));
    });
    test('round(2.9, 1.5)', () => {
        const hex = new HexCoordinate(2.9, 1.5);
        expect(hex.round()).toStrictEqual(new HexCoordinate(3,2));
    });
    test('round(3.0, 1.5)', () => {
        const hex = new HexCoordinate(3.01, 1.5); // push over boundary
        expect(hex.round()).toStrictEqual(new HexCoordinate(3,1));
    });
    test('round(2, 1.6)', () => {
        const hex = new HexCoordinate(2, 1.6);
        expect(hex.round()).toStrictEqual(new HexCoordinate(2,2));
    });
    test('round(2.1, 1.6)', () => {
        const hex = new HexCoordinate(2.1, 1.6);
        expect(hex.round()).toStrictEqual(new HexCoordinate(2,2));
    });
    test('round(2.2, 1.6)', () => {
        const hex = new HexCoordinate(2.2, 1.6);
        expect(hex.round()).toStrictEqual(new HexCoordinate(2,2));
    });
    test('round(2.3, 1.6)', () => {
        const hex = new HexCoordinate(2.3, 1.6);
        expect(hex.round()).toStrictEqual(new HexCoordinate(2,1));
    });
    test('round(2.4, 1.6)', () => {
        const hex = new HexCoordinate(2.39, 1.6);
        expect(hex.round()).toStrictEqual(new HexCoordinate(2,1));
    });
    test('round(2.5, 1.6)', () => {
        const hex = new HexCoordinate(2.5, 1.6);
        expect(hex.round()).toStrictEqual(new HexCoordinate(3,2));
    });
    test('round(2.6, 1.6)', () => {
        const hex = new HexCoordinate(2.6, 1.6);
        expect(hex.round()).toStrictEqual(new HexCoordinate(3,2));
    });
    test('round(2.7, 1.6)', () => {
        const hex = new HexCoordinate(2.7, 1.6);
        expect(hex.round()).toStrictEqual(new HexCoordinate(3,2));
    });
    test('round(2.8, 1.6)', () => {
        const hex = new HexCoordinate(2.8, 1.6);
        expect(hex.round()).toStrictEqual(new HexCoordinate(3,2));
    });
    test('round(2.9, 1.6)', () => {
        const hex = new HexCoordinate(2.9, 1.6);
        expect(hex.round()).toStrictEqual(new HexCoordinate(3,2));
    });
    test('round(3.0, 1.6)', () => {
        const hex = new HexCoordinate(3.0, 1.6);
        expect(hex.round()).toStrictEqual(new HexCoordinate(3,2));
    });
});

describe('hex coordinate path', () => {
    let functions : { [key:string] : jest.Mock};
    let ctx : CanvasRenderingContext2D;
    beforeEach(() => {
        const { functions:f, ctx:c} = mockGraphicsContext();
        functions = f;
        ctx = c;
    });

    test('beginPath not called', () => {
        const hex = new HexCoordinate(2, 1);
        hex.path(ctx, 50);
        expect(functions.beginPath).not.toHaveBeenCalled();
        expect(functions.closePath).not.toHaveBeenCalled();
    });

    test('style not changed', () => {
        const fakeStyle = nanoid();
        ctx.fillStyle = fakeStyle;
        const hex = new HexCoordinate(4, 3);
        hex.path(ctx, 20);
        expect(functions.fillStyle).toBe(fakeStyle);
    });

    test('path not rendered', () => {
        const hex = new HexCoordinate(0, 0);
        hex.path(ctx, 1);
        expect(functions.stroke).not.toHaveBeenCalled();
        expect(functions.fill).not.toHaveBeenCalled();
    });

    test('path(0, 0, 1)', () => {
        const h = new HexCoordinate(0,0);
        h.path(ctx, 1);
        expect(functions.moveTo).toHaveBeenCalledTimes(1);
        expect(functions.moveTo.mock.calls[0][0]).toBeCloseTo(0.00);
        expect(functions.moveTo.mock.calls[0][1]).toBeCloseTo(-0.58);

        expect(functions.lineTo).toHaveBeenCalledTimes(5)

        expect(functions.lineTo.mock.calls[0][0]).toBeCloseTo(0.50);
        expect(functions.lineTo.mock.calls[0][1]).toBeCloseTo(-0.29);

        expect(functions.lineTo.mock.calls[1][0]).toBeCloseTo(0.50);
        expect(functions.lineTo.mock.calls[1][1]).toBeCloseTo(0.29);

        expect(functions.lineTo.mock.calls[2][0]).toBeCloseTo(0.00);
        expect(functions.lineTo.mock.calls[2][1]).toBeCloseTo(0.58);

        expect(functions.lineTo.mock.calls[3][0]).toBeCloseTo(-0.50);
        expect(functions.lineTo.mock.calls[3][1]).toBeCloseTo(0.29);

        expect(functions.lineTo.mock.calls[4][0]).toBeCloseTo(-0.50);
        expect(functions.lineTo.mock.calls[4][1]).toBeCloseTo(-0.29);
    });

    test('path(2, 1, 50)', () => {
        const h = new HexCoordinate(2,1);
        h.path(ctx, 50);
        expect(functions.moveTo).toHaveBeenCalledTimes(1);
        expect(functions.moveTo.mock.calls[0][0]).toBeCloseTo(75.00);
        expect(functions.moveTo.mock.calls[0][1]).toBeCloseTo(14.43);

        expect(functions.lineTo).toHaveBeenCalledTimes(5)

        expect(functions.lineTo.mock.calls[0][0]).toBeCloseTo(100.00);
        expect(functions.lineTo.mock.calls[0][1]).toBeCloseTo(28.87);

        expect(functions.lineTo.mock.calls[1][0]).toBeCloseTo(100.00);
        expect(functions.lineTo.mock.calls[1][1]).toBeCloseTo(57.74);

        expect(functions.lineTo.mock.calls[2][0]).toBeCloseTo(75.00);
        expect(functions.lineTo.mock.calls[2][1]).toBeCloseTo(72.17);

        expect(functions.lineTo.mock.calls[3][0]).toBeCloseTo(50.00);
        expect(functions.lineTo.mock.calls[3][1]).toBeCloseTo(57.74);

        expect(functions.lineTo.mock.calls[4][0]).toBeCloseTo(50.00);
        expect(functions.lineTo.mock.calls[4][1]).toBeCloseTo(28.87);
    });

    test('path(4, 3, 20)', () => {
        const h = new HexCoordinate(4,3);
        h.path(ctx, 20);
        expect(functions.moveTo).toHaveBeenCalledTimes(1);
        expect(functions.moveTo.mock.calls[0][0]).toBeCloseTo(50.00);
        expect(functions.moveTo.mock.calls[0][1]).toBeCloseTo(40.41);

        expect(functions.lineTo).toHaveBeenCalledTimes(5)

        expect(functions.lineTo.mock.calls[0][0]).toBeCloseTo(60.00);
        expect(functions.lineTo.mock.calls[0][1]).toBeCloseTo(46.19);

        expect(functions.lineTo.mock.calls[1][0]).toBeCloseTo(60.00);
        expect(functions.lineTo.mock.calls[1][1]).toBeCloseTo(57.74);

        expect(functions.lineTo.mock.calls[2][0]).toBeCloseTo(50.00);
        expect(functions.lineTo.mock.calls[2][1]).toBeCloseTo(63.51);

        expect(functions.lineTo.mock.calls[3][0]).toBeCloseTo(40.00);
        expect(functions.lineTo.mock.calls[3][1]).toBeCloseTo(57.74);

        expect(functions.lineTo.mock.calls[4][0]).toBeCloseTo(40.00);
        expect(functions.lineTo.mock.calls[4][1]).toBeCloseTo(46.19);
    });
});