import { Point } from "./Point.js";

/**
 * A class to represent hexagonal coordinates, for
 * a two dimensional hexagonal grid.
 * The coordinates are represented as a triplet of integers
 * (a,b,c) such that c = a - b.  The b coordinate increases
 * as hexagons are lower on the screen, and a coordinates 
 * increase as they move to the "South-East" direction.
 * The coordinates are not necessarily integral, but 
 * hexagons are always represented by integral coordinates.
 */
export class HexCoordinate {
    /**
     * The three parts of this coordinate.
     */
    public readonly a : number;
    public readonly b : number;
    public readonly c : number;

    /**
     * Create a hex coordinate from its three parts.
     * @param a the first
     * @param b the second
     * @param c? the third (computed as a-b otherwise)
     */
    constructor(a : number, b : number)
    constructor(a : number, b : number, c : number)
    constructor(a : number, b : number, c? : number) {
        this.a = a;
        this.b = b;
        if (c === undefined) {
            c = a - b;
        }
        if (c !== a - b) {
            throw new Error("Invalid hex coordinate");
        }
        this.c = c;
    }

    /**
     * Return whether these coordinates are equal
     * @param other coordinate to comapre with
     * @returns whether they are equal
     */
    public equals(other : HexCoordinate) : boolean {
        return this.a === other.a && this.b === other.b;
    }

    /**
     * Return a string representation of this coordinate
     * @returns string representation
     */
    public toString() : string {
        return `<${this.a},${this.b}>`;
    }

    /**
     * Create a hex coordinate from its string representation.
     * @param s string of format <a,b> or <a,b,c>
     * @returns hex coordinate for this string
     * @throws Error if the string is not in the correct format
     */
    public static fromString(s : string) : HexCoordinate {
        if (!s.startsWith('<') || !s.endsWith('>')) {
            throw new Error("Invalid hex coordinate string");
        }
        const parts = s.substring(1, s.length-1).split(',');
        if (parts.length < 2 || parts.length > 3) {
            throw new Error("Invalid hex coordinate string");
        }
        const a = parseInt(parts[0]);
        const b = parseInt(parts[1]);
        if (parts.length === 2) {
            return new HexCoordinate(a,b);
        } else {
            const c = parseInt(parts[2]);
            return new HexCoordinate(a,b,c);
        }
    }

    /**
     * Return the distance between these coordinates
     * @param other coordinate to measure distance to
     * @returns distance between the coordinates
     */
    public distance(other : HexCoordinate) : number {
        return (Math.abs(this.a - other.a) + Math.abs(this.b - other.b) + Math.abs(this.c - other.c)) / 2;
    }
 
    private static SQRT32 = Math.sqrt(3) / 2;

    /**
     * Return the cartesian coordinates of this hex coordinate
     */
    public toPoint() : Point {
        return {
            x: this.a - this.b / 2,
            y: this.b * HexCoordinate.SQRT32,
        };
    }

    /**
     * Create a (usually nonitegral) hexcoordinate from a cartesian point.
     * @param p cartesian point
     * @returns hex coordinate
     * @see round to get to integral hex coordinates
     */
    public static fromPoint(p : Point) : HexCoordinate {
        const b = p.y / HexCoordinate.SQRT32;
        const a = p.x + b / 2;
        return new HexCoordinate(a, b);
    }

    /**
     * Return the hex coordinates of the integral hexagon that contains this hex coordinate.
     */
    public round() : HexCoordinate {
        let a = Math.round(this.a);
        let b = Math.round(this.b);
        let c = Math.round(this.c);

        const da = Math.abs(a - this.a);
        const db = Math.abs(b - this.b);
        const dc = Math.abs(c - this.c);

        if (da > db && da > dc) {
            a = b + c;
        } else if (db > dc) {
            b = a - c;
        } else {
            c = a - b;
        }

        return new HexCoordinate(a, b, c);
    }

    /**
     * Draw the outline of this hexagon on the given canvas context.
     * The hexagon is drawn in a clockwise direction starting
     * from the top vertex.  This method works best if the
     * coordinate is already integral.
     * @param ctx the canvas context to draw on
     * @param scale the width of hexagons (in pixels)
     */
    public path(ctx : CanvasRenderingContext2D, scale : number) {
        const p = this.toPoint();
        const r = Math.sqrt(3) / 3;
        for (let i=0; i < 6; ++i) {
            const angle = Math.PI/2 - (i * Math.PI / 3);
            const x = scale* (p.x + r * Math.cos(angle));
            const y = scale* (p.y - r * Math.sin(angle));
            if (i ==0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
         }
    }
}
 
