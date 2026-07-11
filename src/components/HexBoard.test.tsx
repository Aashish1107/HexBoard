/* HexBoard Test Suite

This test suite is designed to validate the functionality of the HexBoard component
The tests covers:
- Canvas rendering with minimum and all properties defined
- Handling the map, center, and style property
- Multiple mouse events (mousedown, mousemove, mouseup, mouseenter, mouseleave)
- Axis drawing based on center visibility
- Recenter mechanism of the HexBoard
- Defaulting of style to defaultStyle when style prop is omitted
- Functionality of afterPaint callback
- Handling of missing 2D canvas context

The tests utilize Jest and React Testing Library for rendering the component and simulating user interactions. 
Mock functions are used to track calls to canvas drawing methods and event listeners.

Test follows unit testing principles and test styles are the following:
- Behavioral testing
- Interaction testing
- Mocking and spying on functions
*/

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { HexBoard } from './HexBoard';
import { HexCoordinate } from '../HexCoordinate';
import { TerrainMap } from '../TerrainMap';
import { Terrain } from '../Terrain';
import { defaultStyle, Style } from '../TerrainMapEditor';
import { MockFunctions, mockGraphicsContext } from '../mockWebElements';

// Style helper function with some properties overridden
function makeStrangeStyle() : Style {
    const result : Style = Object.create(defaultStyle);
    result.backgroundStyle = 'red'; // default is 'white'
    result.lineWidth = 4;   // default is 1
    result.terrainStyle = (t) => {
        switch (t) {
            case Terrain.Water: return 'purple'; // default is 'cyan'
            case Terrain.Wall: return 'yellow'; // default is 'dimgray'
            case Terrain.Shrubbery: return 'orange'; // default is 'olivedrab'
            default: return defaultStyle.terrainStyle(t); // for other terrains, use the default style
        }
    }
    return result;
}


describe('HexBoard', () => {
    let ctx : CanvasRenderingContext2D;
    let ctxMocks : MockFunctions;
    let listeners : { [key: string]: EventListenerOrEventListenerObject } = {}; 
    
    // before each test, set up the mock canvas, mock functions, and event listeners
    beforeEach(() => {
        const { ctx: mockCtx, functions } = mockGraphicsContext(); // create a mock canvas context and mock functions
        ctx = mockCtx; // assign the mock canvas context to the variable
        ctxMocks = functions; // assign the mock functions to the variable

        // mock the getContext method
        jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx);

        // reset the event listeners before each test
        listeners = {}; 

        // mock the addEventListener
        jest.spyOn(HTMLCanvasElement.prototype, 'addEventListener').mockImplementation((event, listener) => {
            listeners[event] = listener;
        });
    });

    // after each test, restore the original implementations of the mocked methods
    afterEach(() => {
        jest.restoreAllMocks();
    });

    // test that the HexBoard component renders with some properties defined
    test('renders with minimum properties defined', () => {
        const { container } = render(
            <HexBoard 
                width={300} 
                height={200} 
                hexSize={50}
            />
        )
        const canvasElement = container.querySelector('canvas');
        expect(canvasElement).toBeInTheDocument();
    });

    // test that the HexBoard component renders when defining all properties
    test('renders with all properties defined', () => {
        const map = new TerrainMap();
        const style = makeStrangeStyle();
        const { container } = render(
            <HexBoard
                width={900}
                height={300}
                hexSize={50}
                map={map}
                center={new HexCoordinate(3,2)}
                style={style}
                onMouseEvent={(_kind, _e, _coord) => {}}
                afterPaint={(_ctx) => {}}    
            />
        );
        const canvasElement = container.querySelector('canvas');
        expect(canvasElement).toBeInTheDocument();
    });

    // test that the HexBoard component is sized correctly
    test('renders with correct dimensions', () => {
        const { container } = render(
            <HexBoard
                width={900}
                height={300}
                hexSize={50}
            />
        );
        const canvasElement = container.querySelector('canvas');
        expect(canvasElement).toBeInTheDocument();
        if (!canvasElement) return;
        expect(canvasElement.width).toBe(900);
        expect(canvasElement.height).toBe(300);
    });

    // test that HexBoard paints mapped terrain using the map data
    test('uses map correctly', async () => {
        const map = new TerrainMap();
        map.set(new HexCoordinate(0,0), Terrain.Water);
        const style = makeStrangeStyle();
        const fills : string[] = [];
        ctxMocks.fill.mockImplementation(() => fills.push(ctx.fillStyle as string));
        render(
            <HexBoard
                width={900}
                height={300}
                hexSize={50}
                map={map}
                center={new HexCoordinate(0,0)}
                style={style}
            />
        );

        await waitFor(() => {
            expect(fills).toContain(style.backgroundStyle);
            expect(fills).toContain(style.terrainStyle(Terrain.Water));
            expect(fills).not.toContain(style.terrainStyle(Terrain.Open));
        });
    });

    // negative test: missing map should skip repaint work
    test('skips repaint when map is missing', async () => {
        const afterPaint = jest.fn();
        render(
            <HexBoard
                width={900}
                height={300}
                hexSize={50}
                afterPaint={afterPaint}
            />
        );

        await waitFor(() => {
            expect(ctx.translate).toHaveBeenCalled();
        });
        expect(ctx.fillRect).not.toHaveBeenCalled();
        expect(afterPaint).not.toHaveBeenCalled();
    });

    // test that HexBoard's center property
    test('uses center correctly', async () => {
        const map = new TerrainMap();
        const onMouseEvent = jest.fn();
        const { container } = render(
            <HexBoard
                width={900}
                height={300}
                hexSize={50}
                map={map}
                center={new HexCoordinate(3,2)}
                onMouseEvent={onMouseEvent}
            />
        );

        const canvasElement = container.querySelector('canvas');
        expect(canvasElement).toBeInTheDocument();
        if (!canvasElement) return;

        fireEvent.mouseDown(canvasElement, { clientX: 450, clientY: 150 });

        await waitFor(() => {
            expect(onMouseEvent).toHaveBeenCalled();
        });

        const calls = onMouseEvent.mock.calls;
        expect(calls.length).toBe(1);
        const coord = calls[0][2];
        expect(coord).toBeInstanceOf(HexCoordinate);
        expect(coord.a).toBe(3);
        expect(coord.b).toBe(2);
    });

    // test that center defaults to (0,0) when center prop is omitted
    test('uses default center when center is not defined', async () => {
        const map = new TerrainMap();
        const { container } = render(
            <HexBoard
                width={900}
                height={300}
                hexSize={50}
                map={map}
            />
        );

        const canvasElement = container.querySelector('canvas');
        expect(canvasElement).toBeInTheDocument();

        await waitFor(() => {
            expect(ctx.translate).toHaveBeenCalledWith(450,150);
        });
    });

    // test that any mouse buttons where pressed down on and hex coordinate matches
    test('receives mouse events #1', async () => {
        const map = new TerrainMap();
        const style = makeStrangeStyle();
        const onMouseEvent = jest.fn();
        const { container } = render(
            <HexBoard
                width={900}
                height={300}
                hexSize={50}
                map={map}
                center={new HexCoordinate(3,2)}
                style={style}
                onMouseEvent={onMouseEvent}
                afterPaint={(_ctx) => {}}
            />
        );
        const canvasElement = container.querySelector('canvas');
        expect(canvasElement).toBeInTheDocument();
        if (!canvasElement) return;
        const onMouseDown = listeners['mousedown'];
        const mouseHit = { clientX: 100, clientY: 100 };
        const event = new MouseEvent('mousedown', mouseHit);
        if (onMouseDown) {
            if (typeof onMouseDown === 'function') {
                onMouseDown(event);
            } else {
                onMouseDown.handleEvent(event);
            }
        } else {
            fireEvent.mouseDown(canvasElement, mouseHit);
        }
        // console.log('canvasElement:', canvasElement);
        // for some reason I don't understand, width and height
        // are defined, but not other props:
        await waitFor(() => {
            expect(onMouseEvent).toHaveBeenCalled();
        });
        const calls = onMouseEvent.mock.calls;
        expect(calls.length).toBe(1);
        const call = calls[0];
        expect(call[0]).toBe('mousedown');
        // expect(call[1]).toBe(event);
        const coord = call[2];
        expect(coord).toBeInstanceOf(HexCoordinate);
        expect(coord.a).toBe(-5);
        expect(coord.b).toBe(1);
    });

    // test mouse buttons being pressed down and moving while hex coordinates match
    test('receives mouse events #2', async () => {
        const map = new TerrainMap();
        const style = defaultStyle;
        const onMouseEvent = jest.fn();
        const { container } = render(
            <HexBoard
                width={900}
                height={300}
                hexSize={100}
                map={map}
                center={new HexCoordinate(2,0)}
                style={style}
                onMouseEvent={onMouseEvent}
                afterPaint={(_ctx) => {}}
            />
        );
        const canvasElement = container.querySelector('canvas');
        expect(canvasElement).toBeInTheDocument();
        if (!canvasElement) return;
        const onMouseDown = listeners['mousedown'];
        const onMouseMove = listeners['mousemove'];
        const mouseHit = { clientX: 100, clientY: 100 };
        const mouseNext = { clientX: 120, clientY: 80 };
        const event1 = new MouseEvent('mousedown', mouseHit);
        const event2 = new MouseEvent('mousemove', mouseNext);
        if (onMouseDown) {
            if (typeof onMouseDown === 'function') {
                onMouseDown(event1);
            } else {
                onMouseDown.handleEvent(event1);
            }
        } else {
            fireEvent.mouseDown(canvasElement, mouseHit);
        }
        await waitFor(() => {
            expect(onMouseEvent).toHaveBeenCalled();
        });
        if (onMouseMove) {
            if (typeof onMouseMove === 'function') {
                onMouseMove(event2);
            } else {
                onMouseMove.handleEvent(event2);
            }
        } else {
            fireEvent.mouseMove(canvasElement, mouseNext);
        }
        await waitFor(() => {
            expect(onMouseEvent).toHaveBeenCalledTimes(2);
        })
        const calls = onMouseEvent.mock.calls;
        expect(calls.length).toBe(2);
        const call = calls[1];
        expect(call[0]).toBe('mousemove');
        // expect(call[1]).toBe(event);
        const coord = call[2];
        expect(coord).toBeInstanceOf(HexCoordinate);
        expect(coord.a).toBe(-2);
        expect(coord.b).toBe(-1);
    });

    // test mouseup event translation
    test('receives mouseup event', async () => {
        const map = new TerrainMap();
        const onMouseEvent = jest.fn();
        const { container } = render(
            <HexBoard
                width={900}
                height={300}
                hexSize={50}
                map={map}
                center={new HexCoordinate(0,0)}
                onMouseEvent={onMouseEvent}
            />
        );
        const canvasElement = container.querySelector('canvas');
        expect(canvasElement).toBeInTheDocument();
        if (!canvasElement) return;
        const onMouseUp = listeners['mouseup'];
        const mouseHit = { clientX: 450, clientY: 150 };
        const event = new MouseEvent('mouseup', mouseHit);
        if (onMouseUp) {
            if (typeof onMouseUp === 'function') {
                onMouseUp(event);
            } else {
                onMouseUp.handleEvent(event);
            }
        } else {
            fireEvent.mouseUp(canvasElement, mouseHit);
        }
        await waitFor(() => {
            expect(onMouseEvent).toHaveBeenCalledTimes(1);
        });
        const call = onMouseEvent.mock.calls[0];
        expect(call[0]).toBe('mouseup');
        const coord = call[2];
        expect(coord).toBeInstanceOf(HexCoordinate);
        expect(coord.a).toBe(0);
        expect(coord.b).toBe(0);
    });

    // test mouseenter event translation
    test('receives mouseenter event', async () => {
        const map = new TerrainMap();
        const onMouseEvent = jest.fn();
        const { container } = render(
            <HexBoard
                width={900}
                height={300}
                hexSize={50}
                map={map}
                center={new HexCoordinate(0,0)}
                onMouseEvent={onMouseEvent}
            />
        );
        const canvasElement = container.querySelector('canvas');
        expect(canvasElement).toBeInTheDocument();
        if (!canvasElement) return;
        const onMouseEnter = listeners['mouseenter'];
        const mouseHit = { clientX: 450, clientY: 150 };
        const event = new MouseEvent('mouseenter', mouseHit);
        if (onMouseEnter) {
            if (typeof onMouseEnter === 'function') {
                onMouseEnter(event);
            } else {
                onMouseEnter.handleEvent(event);
            }
        } else {
            fireEvent.mouseEnter(canvasElement, mouseHit);
        }
        await waitFor(() => {
            expect(onMouseEvent).toHaveBeenCalledTimes(1);
        });
        const call = onMouseEvent.mock.calls[0];
        expect(call[0]).toBe('mouseenter');
        const coord = call[2];
        expect(coord).toBeInstanceOf(HexCoordinate);
        expect(coord.a).toBe(0);
        expect(coord.b).toBe(0);
    });

    // test mouseleave event translation
    test('receives mouseleave event', async () => {
        const map = new TerrainMap();
        const onMouseEvent = jest.fn();
        const { container } = render(
            <HexBoard
                width={900}
                height={300}
                hexSize={50}
                map={map}
                center={new HexCoordinate(0,0)}
                onMouseEvent={onMouseEvent}
            />
        );
        const canvasElement = container.querySelector('canvas');
        expect(canvasElement).toBeInTheDocument();
        if (!canvasElement) return;
        const onMouseLeave = listeners['mouseleave'];
        const mouseHit = { clientX: 450, clientY: 150 };
        const event = new MouseEvent('mouseleave', mouseHit);
        if (onMouseLeave) {
            if (typeof onMouseLeave === 'function') {
                onMouseLeave(event);
            } else {
                onMouseLeave.handleEvent(event);
            }
        } else {
            fireEvent.mouseLeave(canvasElement, mouseHit);
        }
        await waitFor(() => {
            expect(onMouseEvent).toHaveBeenCalledTimes(1);
        });
        const call = onMouseEvent.mock.calls[0];
        expect(call[0]).toBe('mouseleave');
        const coord = call[2];
        expect(coord).toBeInstanceOf(HexCoordinate);
        expect(coord.a).toBe(0);
        expect(coord.b).toBe(0);
    });

    // test axis drawing when center is in viewport
    test('draws both axes when center is visible', async () => {
        const map = new TerrainMap();
        jest.spyOn(HexCoordinate.prototype, 'path').mockImplementation(() => {});
        render(
            <HexBoard
                width={900}
                height={300}
                hexSize={50}
                map={map}
                center={new HexCoordinate(0,0)}
            />
        );

        await waitFor(() => {
            expect(ctx.moveTo).toHaveBeenCalledWith(0, -150);
            expect(ctx.lineTo).toHaveBeenCalledWith(0, 150);
            expect(ctx.moveTo).toHaveBeenCalledWith(-450, 0);
            expect(ctx.lineTo).toHaveBeenCalledWith(450, 0);
        });
    });

    // test axis drawing conditions when center is outside viewport
    test('does not draw axes when center is outside viewport', async () => {
        const map = new TerrainMap();
        const center = new HexCoordinate(20,20);
        const width = 200;
        const height = 200;
        const hexSize = 100;
        jest.spyOn(HexCoordinate.prototype, 'path').mockImplementation(() => {});

        const centerPoint = center.toPoint();
        const centerX = centerPoint.x * hexSize;
        const centerY = centerPoint.y * hexSize;
        expect(Math.abs(centerX)).toBeGreaterThan(width / 2);
        expect(Math.abs(centerY)).toBeGreaterThan(height / 2);

        render(
            <HexBoard
                width={width}
                height={height}
                hexSize={hexSize}
                map={map}
                center={center}
            />
        );

        await waitFor(() => {
            expect(ctx.fillRect).toHaveBeenCalled();
        });

        expect(ctx.moveTo).not.toHaveBeenCalledWith(0, centerY - height / 2);
        expect(ctx.lineTo).not.toHaveBeenCalledWith(0, centerY + height / 2);
        expect(ctx.moveTo).not.toHaveBeenCalledWith(centerX - width / 2, 0);
        expect(ctx.lineTo).not.toHaveBeenCalledWith(centerX + width / 2, 0);
    });

    // tests HexBoard recentering mechanism version 1
    test('centers the hexboard #1', async () => {
        const map = new TerrainMap();
        const style = makeStrangeStyle();
        const { container } = render(
            <HexBoard
                width={900}
                height={300}
                hexSize={50}
                map={map}
                center={new HexCoordinate(3,2)}
                style={style}
            />
        );
        const canvasElement = container.querySelector('canvas');
        expect(canvasElement).toBeInTheDocument();
        if (!canvasElement) return;
        await waitFor(() => {
            expect(ctx.translate).toHaveBeenCalledWith(350, 63.39745962155614);
        });
    });

    // tests HexBoard recentering mechanism version 2
    test('centers the hexboard #2', async () => {
        const map = new TerrainMap();
        const style = makeStrangeStyle();
        const { container } = render(
            <HexBoard
                width={900}
                height={300}
                hexSize={100}
                map={map}
                center={new HexCoordinate(2,0)}
                style={style}
            />
        );
        const canvasElement = container.querySelector('canvas');
        expect(canvasElement).toBeInTheDocument();
        if (!canvasElement) return;
        await waitFor(() => {
            expect(ctx.translate).toHaveBeenCalledWith(250,150);
        });
    });

    // tests HexBoard recentering mechanism version 3
    test('centers the hexboard #3', async () => {
        const map = new TerrainMap();
        const style = makeStrangeStyle();
        const { container } = render(
            <HexBoard
                width={800}
                height={600}
                hexSize={80}
                map={map}
                center={new HexCoordinate(-3,-1)}
                style={style}
                onMouseEvent={() => { /* ignore */ }}
                afterPaint={() => { /* ignore */ }}
            />
        );
        const canvasElement = container.querySelector('canvas');
        expect(canvasElement).toBeInTheDocument();
        if (!canvasElement) return;
        await waitFor(() => {
            expect(ctx.translate).toHaveBeenCalledWith(600, 369.28203230275506);
        });
    });

    // test that style defaults to defaultStyle when style prop is omitted
    test('uses default style when style is not defined', async () => {
        const map = new TerrainMap();
        map.set(new HexCoordinate(0,0), Terrain.Water);
        const fills : string[] = [];
        ctxMocks.fill.mockImplementation(() => fills.push(ctx.fillStyle as string));
        render(
            <HexBoard
                width={900}
                height={300}
                hexSize={50}
                map={map}
                center={new HexCoordinate(0,0)}
            />
        );

        await waitFor(() => {
            expect(fills).toContain(defaultStyle.backgroundStyle);
            expect(fills).toContain(defaultStyle.terrainStyle(Terrain.Water));
        });
    });

    // test Hexboard render with default but custom water style
    test('can use default style', async () => {
        const map = new TerrainMap();
        map.set(new HexCoordinate(1,0), Terrain.Water);
        const fills : string[] = [];
        ctxMocks.fill.mockImplementation(() => fills.push(ctx.fillStyle as string));
        render(
            <HexBoard
                width={800}
                height={600}
                hexSize={80}
                map={map}
                center={new HexCoordinate(-3,-1)}
            />
        );
        await waitFor(() => {
            expect(fills).toContain(defaultStyle.backgroundStyle);
            expect(fills).toContain(defaultStyle.terrainStyle(Terrain.Water));
            expect(fills).not.toContain(defaultStyle.terrainStyle(Terrain.Open));
            expect(fills).not.toContain(defaultStyle.terrainStyle(Terrain.Glass));
        });
    });


    // test HexBoard render with default style but custom Curtain style
    test('can use specified style', async () => {
        const map = new TerrainMap();
        map.set(new HexCoordinate(1,0), Terrain.Curtain);
        const style = makeStrangeStyle();
        const fills : string[] = [];
        ctxMocks.fill.mockImplementation(() => fills.push(ctx.fillStyle as string));
        render(
            <HexBoard
                width={800}
                height={600}
                hexSize={80}
                map={map}
                center={new HexCoordinate(-3,-1)}
                style={style}
            />
        );
        await waitFor(() => {
            expect(fills).not.toContain(style.terrainStyle(Terrain.Water));
            expect(fills).toContain(style.backgroundStyle);
            expect(fills).toContain(style.terrainStyle(Terrain.Curtain));
        });
    });

    // tests afterPaint - HexBoard should render to default
    test('afterPaint is called', async () => {
        const map = new TerrainMap();
        const style = makeStrangeStyle();
        const afterPaint = jest.fn();
        render(
            <HexBoard
                width={800}
                height={600}
                hexSize={80}
                map={map}
                center={new HexCoordinate(-3,-1)}
                style={style}
                afterPaint={afterPaint}
            />
        );
        await waitFor(() => {
            expect(afterPaint).toHaveBeenCalledWith(ctx);
        });
    });

    // negative test: handles missing 2d canvas context gracefully
    test('handles getContext returning null', async () => {
        (HTMLCanvasElement.prototype.getContext as jest.Mock).mockReturnValueOnce(null);
        const map = new TerrainMap();
        const afterPaint = jest.fn();

        const { container } = render(
            <HexBoard
                width={300}
                height={200}
                hexSize={50}
                map={map}
                afterPaint={afterPaint}
            />
        );

        const canvasElement = container.querySelector('canvas');
        expect(canvasElement).toBeInTheDocument();

        await waitFor(() => {
            expect(afterPaint).not.toHaveBeenCalled();
        });
        expect(ctx.translate).not.toHaveBeenCalled();
    });
});