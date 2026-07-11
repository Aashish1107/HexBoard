/* HexBoard renders a grid of hexagonal tiles and provides helper functions to work with them.
 * The main responsibilities of the HexBoard component include:
 *  - Draws hexagons
 *  - Clears terrain
 *  - Draws a hexagon with a specific terrain type
 *  - Converts mouse coordinates to hex coordinates
 *  - Translates canvas mouse events into HexBoard mouse events
 *  - Repaints the canvas whenever relevant props change
 *  - Centers the HexBoard based on the viewport and hex size
 */

import { type FC, type MouseEvent, type ReactNode, useCallback, useRef, useEffect } from 'react';
import { HexCoordinate } from '../HexCoordinate';
import { defaultStyle, Style } from '../TerrainMapEditor';
import { TerrainMap } from '../TerrainMap';
import { Point } from '../Point';
import { Terrain } from '../Terrain';

export interface HexBoardProps {
    style?: Style
    map?: TerrainMap;
    center?: HexCoordinate;
    hexSize: number;
    width: number;
    height: number;
    onMouseEvent?: (kind: string, e: MouseEvent, coord: HexCoordinate) => void;
    afterPaint?: (ctx: CanvasRenderingContext2D) => void;
    children?: ReactNode;
}

// scales a point by a given factor
function scalePoint(p: Point, s: number): Point {
    return { x: p.x * s, y: p.y * s };
}

// HexBoard component definition
export const HexBoard: FC<HexBoardProps> = (props) => {
    const canvasHeight = props.height;
    const canvasWidth = props.width;
    const currentSize = props.hexSize;
    const center = props.center || new HexCoordinate(0, 0);
    const centerPoint = scalePoint(center.toPoint(), currentSize);
    const style = props.style || defaultStyle;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const terrainMap = props.map;

    // useEffect is used to setup canvas and centers the hexboard when canvas dimensions, center point, or canvas reference changes
    useEffect(() => {
        if (canvasRef.current) {
            const newCtx = canvasRef.current.getContext('2d');
            if (!newCtx) return;
            newCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset any previous transformations
            newCtx.translate(canvasWidth / 2 - centerPoint.x, canvasHeight / 2 - centerPoint.y);
            ctxRef.current = newCtx;
        }
    }, [canvasWidth, canvasHeight, canvasRef, centerPoint]);

    // draws a hexagon on the canvas with the specified fill style
    const drawHexagon = useCallback((hc: HexCoordinate, fillStyle: string) => {
        if (ctxRef.current === null) return;
        ctxRef.current.fillStyle = fillStyle;
        ctxRef.current.lineWidth = style.lineWidth;
        ctxRef.current.strokeStyle = style.strokeStyle;
        ctxRef.current.beginPath();
        hc.path(ctxRef.current, currentSize);
        ctxRef.current.fill();
        ctxRef.current.stroke();
    }, [style, currentSize]);

    // clears an individual hex tile's terrain
    const clearTerrain = useCallback((hc: HexCoordinate) => {
        drawHexagon(hc, style.backgroundStyle);
    }, [drawHexagon, style]);

    // draws an individual hex tile's terrain
    const drawTerrain = useCallback((hc: HexCoordinate, terrain: Terrain) => {
        drawHexagon(hc, style.terrainStyle(terrain));
    }, [drawHexagon, style]);

    // converts mouse coordinates to hex coordinates
    const getHexCoordinate = useCallback((x: number, y: number) => {
        return HexCoordinate.fromPoint({ x: (x - canvasWidth / 2 + centerPoint.x) / currentSize, y: (y - canvasHeight / 2 + centerPoint.y) / currentSize }).round();
    }, [currentSize, centerPoint, canvasWidth, canvasHeight]);

    // mouse helper function
    const onMouseEvent = props.onMouseEvent;

    // translates raw canvas mouse events into hexboard mouse events with hex coordinates
    const mouseAction = useCallback((kind: string, event: MouseEvent) => {
        const coord = getHexCoordinate(event.clientX, event.clientY);
        if (coord && onMouseEvent) {
            onMouseEvent(kind, event, coord);
        }
    }, [getHexCoordinate, onMouseEvent]);

    // optional callback invoked after each repaint, receiving the 2D canvas rendering context
    const afterPaint = props.afterPaint;

    // useEffect is used to repaint the canvas whenever relevant props change
    useEffect(() => {
        function repaint() {
            if (canvasRef.current === null) return;
            const ctx = ctxRef.current;
            if (ctx === null) return;
            if (!terrainMap) return;
            ctx.fillStyle = style.backgroundStyle;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.strokeStyle = style.strokeStyle;
            ctx.lineWidth = style.lineWidth;

            const tl = getHexCoordinate(0, 0);
            const br = getHexCoordinate(canvasWidth, canvasHeight);
            for (let a = tl.a; a <= br.a; ++a) {
                for (let b = tl.b; b <= br.b; ++b) {
                    const hc = new HexCoordinate(a, b);
                    if (terrainMap.get(hc) !== undefined) {
                        drawTerrain(hc, terrainMap.get(hc) as Terrain);
                    } else {
                        clearTerrain(hc);
                    }
                }
            }
            // draw axes
            if (centerPoint.x >= -canvasWidth / 2 && centerPoint.x <= canvasWidth / 2) {
                ctx.beginPath();
                ctx.moveTo(0, centerPoint.y - canvasHeight / 2);
                ctx.lineTo(0, centerPoint.y + canvasHeight / 2);
                ctx.stroke();
            }
            if (centerPoint.y >= -canvasHeight / 2 && centerPoint.y <= canvasHeight / 2) {
                ctx.beginPath();
                ctx.moveTo(centerPoint.x - canvasWidth / 2, 0);
                ctx.lineTo(centerPoint.x + canvasWidth / 2, 0);
                ctx.stroke();
            }
            afterPaint?.(ctx);
        }

        if (ctxRef.current !== null) {
            repaint();
        }
    }, [centerPoint, canvasWidth, canvasHeight, canvasRef, terrainMap, currentSize, style, drawTerrain, clearTerrain, getHexCoordinate, afterPaint]);

    // render the canvas element with mouse event handlers
    return <canvas ref={canvasRef}
        style={{ border: "1px solid black" }}
        width={canvasWidth}
        height={canvasHeight}
        data-hex-size={currentSize}
        onMouseDown={(e) => mouseAction('mousedown', e)}
        onMouseUp={(e) => mouseAction('mouseup', e)}
        onMouseLeave={(e) => mouseAction('mouseleave', e)}
        onMouseEnter={(e) => mouseAction('mouseenter', e)}
        onMouseMove={(e) => mouseAction('mousemove', e)}
    > {props.children} </canvas>;

};