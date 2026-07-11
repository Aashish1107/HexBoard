import { Point } from "./Point";

export type MockFunctions = { [key:string] : jest.Mock<unknown, unknown[]> };

export interface MockGraphicsContext {
    functions : MockFunctions,
    ctx : CanvasRenderingContext2D;
}

export function mockGraphicsContext() : MockGraphicsContext {
    const functions = {
        clearRect : jest.fn(),
        fillRect : jest.fn(),
        beginPath : jest.fn(),
        moveTo : jest.fn(),
        lineTo : jest.fn(),
        closePath : jest.fn(),
        stroke : jest.fn(),
        fill : jest.fn(),
        translate : jest.fn(),
        setTransform : jest.fn(),
    };
    const ctx = functions as unknown as CanvasRenderingContext2D;
    return { functions, ctx };
}

export interface MockCanvasElement {
    functions : MockFunctions,
    canvas : HTMLCanvasElement;
    context : MockGraphicsContext
}

export function mockCanvasElement( offsetX : number, offsetY : number, width : number, height : number) : MockCanvasElement {
    const functions = {
        getContext : jest.fn(),
        addEventListener : jest.fn(),
        removeEventListener : jest.fn(),
        getBoundingClientRect : jest.fn(() => ({
            x : offsetX,
            y : offsetY,
            left: offsetX,
            top: offsetY,
            width: width,
            height: height,
            right: offsetX + width,
            bottom: offsetY + height,
        })),
    };
    const context = mockGraphicsContext();
    functions.getContext.mockReturnValue(context.ctx);
    const canvas = functions as unknown as HTMLCanvasElement;
    canvas.width = width;
    canvas.height = height;
    return { functions, canvas, context };
}

export interface MockSelectElement {
    functions : MockFunctions,
    select : HTMLSelectElement;
}

export function mockSelectElement(initialSelect = "") : MockSelectElement {
    const functions = {
        addEventListener : jest.fn(),
        removeEventListener : jest.fn(),
    };
    const select = functions as unknown as HTMLSelectElement;
    select.value = initialSelect;
    return { functions, select };
}

export interface MockInputElement {
    functions : MockFunctions,
    input : HTMLInputElement;
}

export function mockInputElement(type = "", initialValue = "") : MockInputElement {
    const functions = {
        addEventListener : jest.fn(),
        removeEventListener : jest.fn(),
    };
    const input = functions as unknown as HTMLInputElement;
    input.type = type;
    input.value = initialValue;
    return { functions, input };
}

export interface MockAnchorElement {
    functions : MockFunctions,
    anchor : HTMLAnchorElement;
}

export function MockAnchorElement() : MockAnchorElement {
    const functions = {
        click : jest.fn(),
        addEventListener : jest.fn(),
        removeEventListener : jest.fn(),
    };
    const anchor = functions as unknown as HTMLAnchorElement;
    anchor.href = "";
    anchor.download = "";
    return { functions, anchor };
}

export function getEventListeners(target : MockFunctions, type : string) : Array<EventListener> {
    const listeners : Array<EventListener> = [];
    
    const addEventListener = target.addEventListener as jest.Mock;
    const removeEventListener = target.removeEventListener as jest.Mock;
    for (const call of addEventListener.mock.calls) {
        if (call[0] === type) {
            listeners.push(call[1] as EventListener);
        }
    }
    for (const call of removeEventListener.mock.calls) {
        if (call[0] === type) {
            const index = listeners.indexOf(call[1]);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }
    return listeners;
}

export const mockScreenCoords : Point = {x:17, y:83};

export function mockMouseEvent(
    target : HTMLElement,
    type : string,
    x : number,
    y : number,
    button = 0,
    buttons = 0,
    movement : Point = {x:0,y:0},
    keys ?: { altKey : boolean, ctrlKey : boolean, metaKey : boolean, shiftKey : boolean },
    screen ?: Point, 
 ) : MouseEvent {
    const rect = target.getBoundingClientRect();
    const event = {
        target,
        type,
        button,
        buttons,
        bubbles: true,
        cancelable: true,
        clientX: rect.left + x,
        clientY: rect.top + y,
        pageX: rect.left + x,
        pageY: rect.top + y,
        offsetX: x,
        offsetY: y,
        movementX: movement.x,
        movementY: movement.y,
        altKey: keys?.altKey ?? false,
        ctrlKey: keys?.ctrlKey ?? false,
        metaKey: keys?.metaKey ?? false,
        shiftKey: keys?.shiftKey ?? false,
        screenX: x + rect.left + (screen?.x ?? mockScreenCoords.x),
        screenY: y + rect.top + (screen?.y ?? mockScreenCoords.y),
    };
    return event as unknown as MouseEvent;
}

// // keydown event for numpad 4 (West), no modifier keys
// const event = mockKeyboardEvent('keydown', '4', 'Numpad4');

// // keydown with Shift held
// const event = mockKeyboardEvent('keydown', '4', 'Numpad4', {
//     altKey: false, ctrlKey: false, metaKey: false, shiftKey: true
// });

export function mockKeyboardEvent(
    type: string,
    key: string,
    code: string,
    keys?: { altKey: boolean, ctrlKey: boolean, metaKey: boolean, shiftKey: boolean },
) : KeyboardEvent {
    const event = {
        type,
        key,
        code,
        bubbles: true,
        cancelable: true,
        altKey: keys?.altKey ?? false,
        ctrlKey: keys?.ctrlKey ?? false,
        metaKey: keys?.metaKey ?? false,
        shiftKey: keys?.shiftKey ?? false,
    };
    return event as unknown as KeyboardEvent;
}