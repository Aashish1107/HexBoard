import { HexCoordinate } from "./HexCoordinate.js";

export enum HexDirection {
    NORTHWEST = -3,
    NORTHEAST = -2,
    WEST = -1,
    EAST = 1,
    SOUTHWEST = 2,
    SOUTHEAST = 3,
}

export function rotate(d : HexDirection) : HexDirection {
    if (d < 0) return -rotate(-d);
    switch (d) {
        case HexDirection.EAST:
            return HexDirection.SOUTHEAST;
        case HexDirection.SOUTHWEST:
            return HexDirection.WEST;
        case HexDirection.SOUTHEAST:
            return HexDirection.SOUTHWEST;
    }
    return d;
}

export function oppositeDirection(d : HexDirection) : HexDirection {
    return -d;
}

export function move(hc : HexCoordinate, d : HexDirection) : HexCoordinate {
    if (d > 0) {
        return new HexCoordinate(hc.a + (d&1), hc.b + (d>>1));
    } else {
        const dd = -d;
        return new HexCoordinate(hc.a - (dd&1), hc.b - (dd>>1));
    }
}