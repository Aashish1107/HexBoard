import { nanoid } from 'nanoid';
import { Server } from 'socket.io';
import { PotentialHexCoordinate, USER_EXT } from '../../client/network';
import fs from 'node:fs/promises';
import http from 'http';
import { Terrain } from '../../client/Terrain';
import { TerrainMap } from '../../client/TerrainMap';
import { HexCoordinate } from '../../client/HexCoordinate';
import { HexWorld } from '../../HexWorld';
import { createHexWorldServer } from '../../hexserver';
import path from 'node:path';

// =========================
// Socket Server Mocking Helpers
// =========================

const MockServer = Server as unknown as jest.Mock<Server>; 

jest.mock('socket.io'/*, () => {
    const namespace = makeMockSocket();
    const emit = jest.fn();
    const on = jest.fn();
    const of = jest.fn(() => namespace);
    const listen = jest.fn();
    const Server = jest.fn(() => { return {
        of,
        listen,
        on,
        emit
    }});
    return {Server};
} /**/);

// Mock socket used by initialization tests
interface MockSocket {
    emit : jest.Mock;
    on : jest.Mock;
    disconnect : jest.Mock;
}

function makeMockSocket() : MockSocket {
    const sock : MockSocket = {
        emit : jest.fn(),
        on : jest.fn(),
        disconnect : jest.fn(),
    }
    return sock;
}

//console.log('Mockinconst server = MockServer.mock.instances[0];g of');
const serverOf = Server.prototype.of as jest.Mock;

// console.log('Server', MockServer);

// must do this after mocking


// These tests are somewhat trickier than usual because there
// is just one insatcne of the server and it is already instantiated before our tests begin

describe('hexserver', () => {

// =========================
// Server Initialization Tests
// =========================

  describe('server initialization', () => {
    let mockWebServer : http.Server;
    let ofSocket : MockSocket;
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockWebServer = {} as http.Server;
        ofSocket = makeMockSocket();
        serverOf.mockImplementation(() => ofSocket);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create socket server', () => {
        createHexWorldServer(mockWebServer);
        expect(MockServer).toHaveBeenCalledTimes(1);
    });
    
    it('should return created server instance', () => {
        const { server } = createHexWorldServer(mockWebServer);
        expect(server).toBeDefined();
        expect(MockServer.mock.instances).toEqual([server]);
    });
    
    it('should not register global connection handler', () => {
        const { server } = createHexWorldServer(mockWebServer);
        expect(server).toBeDefined();
        if (!server) return;
        expect(server.on).toHaveBeenCalledTimes(0);
    });
    
    it('should create namespace for world connections', () => {
        const { server } = createHexWorldServer(mockWebServer);
        expect(server).toBeDefined();
        if (!server) return;
        expect(server.of).toHaveBeenCalledTimes(1);
        const call = (server.of as jest.Mock).mock.calls[0];
        expect(call[0]).toEqual(/^\/.*$/);
    });
    
    it('should register connection handler on namespace', () => {
        const { server } = createHexWorldServer(mockWebServer);
        expect(server).toBeDefined();
        expect(serverOf).toHaveBeenCalledTimes(1);
        expect(ofSocket.on).toHaveBeenCalledTimes(1);
        const call = ofSocket.on.mock.calls[0];
        expect(call[0]).toBe("connection");
        expect(typeof call[1]).toBe('function');
    });
    
    it('should start with no worlds', () => {
        const { worlds } = createHexWorldServer(mockWebServer);
        expect(worlds).toEqual([]);
    })
});

// =========================
// Async Test Helpers
// =========================

function doNotCall() {
    throw new Error('should not be called');
}

// a class we can use test code that uses promises.
// the promise can be dynamically forced to resolve or reject
class PromisePuppet<T> extends Promise<T> {
     constructor() {
        let savedResolve : (value: T | PromiseLike<T>) => void = doNotCall;
        let savedReject : (reason?: unknown) => void = doNotCall;
        super((resolve,reject) => {
            savedResolve = resolve;
            savedReject = reject;
        });
        this.resolve = savedResolve;
        this.reject = savedReject;
    }

    readonly resolve: (value: T | PromiseLike<T>) => void;
    readonly reject: (reason?: unknown) => void;

    static get [Symbol.species]() {
        return Promise;
    }
}

async function sleep(millis : number) : Promise<void> {
    return new Promise((resolve) => setTimeout(() => resolve(), millis));
}

// =========================
// Connection Socket Helpers
// =========================

interface ConnectionSocket {
    nsp : {
        name : string;
        emit : jest.Mock;
    };
    handshake : {
        query : {
            id : string;
        };
    };
    on : jest.Mock;
    disconnect : jest.Mock;
    emit : jest.Mock;
}

function makeConnectionSocket(id : string, userID : string) : ConnectionSocket {
    const namespace = {
        name : "/"+id,
        emit : jest.fn(),
    };
    return {
        nsp : namespace,
        handshake : { query : { id: userID } },
        on : jest.fn(),
        disconnect : jest.fn(),
        emit : jest.fn(),
    };
}

// =========================
// File Read Mock Helpers
// =========================

interface ReadFileCase {
    input : string;
    output : Promise<string>;
}

function mockReadFile(cases : ReadFileCase[]) {
    const fetchMap = new Map<string, ReadFileCase>();
    for (const c of cases) {
        fetchMap.set(c.input, c);
    }
    return (input : string, option ?: string) => {
        // console.log('mock readFfile(',input,',',option,')');
        const result = fetchMap.get(input);
        if (result && option === 'utf-8') {
            return result.output;
        } else {
            return Promise.reject('cannot handle');
        }
    };
}

// =========================
// Coordinate Helpers
// =========================

function hc(a : number, b : number) {
    return new HexCoordinate(a,b);
}

function canonhc(arg : PotentialHexCoordinate) {
    return {a : arg.a, b : arg.b};
}

function getHandler(sock : ConnectionSocket, name : string) : ((...args:unknown[])=>void)|undefined {
    const calls = sock.on.mock.calls;
    for (const call of calls) {
        if (call[0] === name) {
            expect(call.length).toBe(2);
            const handler = call[1];
            expect(typeof handler).toBe('function');
            return handler as (...args:unknown[])=>void;
        }
    }
    return undefined;
}

describe('connection and world behavior', () => {
    let ofSocket = makeMockSocket();
    let worlds : HexWorld[];
    let onFunction : (cs:ConnectionSocket) => void;
    let readFileMock : jest.SpyInstance;

    beforeEach(() => {
        ofSocket = makeMockSocket();
        serverOf.mockImplementation(() => ofSocket);
        const mockWebServer : http.Server = {} as http.Server;
        const results = createHexWorldServer(mockWebServer);
        worlds = results.worlds;
        const call = ofSocket.on.mock.calls[0];
        expect(call[0]).toBe("connection");
        expect(typeof call[1]).toBe('function');
        onFunction = call[1] as (cs:ConnectionSocket) => void;
        readFileMock = jest.spyOn(fs, 'readFile');
    });

    afterEach(() => {
        readFileMock.mockRestore();
        serverOf.mockClear();
    });

    test('should register disconnect handler when socket connects', () => {

        // GIVEN
        const id = nanoid();
        const userID = nanoid();
        const sock = makeConnectionSocket(id, userID);
        const mapIDfetch = new PromisePuppet<string>();
        const userIDfetch = new PromisePuppet<string>();
        readFileMock.mockImplementation(mockReadFile([
            { 
                input: path.join("data", `${id}.json`), 
                output: mapIDfetch 
            },
            {
                input: path.join("data", `${userID}${USER_EXT}`),
                output: userIDfetch
            }
        ]));

        // WHEN
        onFunction(sock);
        expect(sock.on).toHaveBeenCalledTimes(1);
        const call = sock.on.mock.calls[0];

        // THEN
        expect(call[0]).toBe("disconnect");
        expect(typeof call[1]).toBe('function');
    });

    test('should read map and user files from handshake IDs', () => {

        // GIVEN
        const id = nanoid();
        const userID = nanoid();
        const sock = makeConnectionSocket(id, userID);
        const mapIDfetch = new PromisePuppet<string>();
        const userIDfetch = new PromisePuppet<string>();
        readFileMock.mockImplementation(mockReadFile([
            { 
                input: path.join("data", `${id}.json`), 
                output: mapIDfetch 
            },
            {
                input: path.join("data", `${userID}${USER_EXT}`),
                output: userIDfetch
            }
        ]));
 
        // WHEN
        onFunction(sock);

        // THEN
        expect(readFileMock).toHaveBeenCalledTimes(2);
        expect([
            readFileMock.mock.calls[0][0],
            readFileMock.mock.calls[1][0]].sort()).toEqual([
            path.join("data", `${id}.json`),
            path.join("data", `${userID}${USER_EXT}`)
        ].sort());
        expect(sock.disconnect).toHaveBeenCalledTimes(0);
    });

    test('should disconnect when map file cannot be loaded', async () => {
       
        // GIVEN
        const id = nanoid();
        const userID = nanoid();
        const sock = makeConnectionSocket(id, userID);
        const mapIDfetch = new PromisePuppet<string>();
        const userIDfetch = new PromisePuppet<string>();
        readFileMock.mockImplementation(mockReadFile([
            { 
                input: path.join("data", `${id}.json`), 
                output: mapIDfetch 
            },
            {
                input: path.join("data", `${userID}${USER_EXT}`),
                output: userIDfetch
            }
        ]));

        // WHEN
        onFunction(sock);
        mapIDfetch.reject();

        // THEN
        await sleep(10);
        // console.log('expecting disconnect to be called already');
        expect(sock.disconnect).toHaveBeenCalledTimes(1);
    });

    test('should disconnect when user profile cannot be loaded', async () => {
        
        // GIVEN
        const id = nanoid();
        const userID = nanoid();
        const sock = makeConnectionSocket(id, userID);
        const mapIDfetch = new PromisePuppet<string>();
        const userIDfetch = new PromisePuppet<string>();
        readFileMock.mockImplementation(mockReadFile([
            { 
                input: path.join("data", `${id}.json`), 
                output: mapIDfetch 
            },
            {
                input: path.join("data", `${userID}${USER_EXT}`),
                output: userIDfetch
            }
        ]));

        // WHEN
        onFunction(sock);
        userIDfetch.reject();

        // THEN
        await sleep(10);
        // console.log('expecting disconnect to be called already');
        expect(sock.disconnect).toHaveBeenCalledTimes(1);
    });


    test('should disconnect when map load fails even if user profile loads', async () => {
       
        // GIVEN
        const id = nanoid();
        const userID = nanoid();
        const sock = makeConnectionSocket(id, userID);
        const mapIDfetch = new PromisePuppet<string>();
        const userIDfetch = new PromisePuppet<string>();
        readFileMock.mockImplementation(mockReadFile([
            { 
                input: path.join("data", `${id}.json`), 
                output: mapIDfetch 
            },
            {
                input: path.join("data", `${userID}${USER_EXT}`),
                output: userIDfetch
            }
        ]));

        // WHEN
        onFunction(sock);
        userIDfetch.resolve(JSON.stringify({name : "Pat Smith"}));
        mapIDfetch.reject();

        // THEN
        await sleep(10);
        // console.log('expecting disconnect to be called already');
        expect(sock.disconnect).toHaveBeenCalledTimes(1);
    });

    test('should disconnect when user profile load fails even if map loads', async () => {

        // GIVEN
        const id = nanoid();
        const userID = nanoid();
        const sock = makeConnectionSocket(id, userID);
        const map = new TerrainMap();
        map.set(hc(0,0), Terrain.Open);

        const mapIDfetch = new PromisePuppet<string>();
        const userIDfetch = new PromisePuppet<string>();
        readFileMock.mockImplementation(mockReadFile([
            { 
                input: path.join("data", `${id}.json`),
                output: mapIDfetch 
            },
            {
                input: path.join("data", `${userID}${USER_EXT}`),
                output: userIDfetch
            }
        ]));

        // WHEN
        onFunction(sock);
        mapIDfetch.resolve(JSON.stringify(map));
        userIDfetch.reject();

        // THEN
        await sleep(10);
        // console.log('expecting disconnect to be called already');
        expect(sock.disconnect).toHaveBeenCalledTimes(1);
    });

    test('should disconnect when world has no open starting tile', async () => {

        // GIVEN
        const id = nanoid();
        const userID = nanoid();
        const sock = makeConnectionSocket(id, userID);
        const map = new TerrainMap();
        map.set(hc(0,0), Terrain.Wall);

        const mapIDfetch = new PromisePuppet<string>();
        const userIDfetch = new PromisePuppet<string>();
        readFileMock.mockImplementation(mockReadFile([
            { 
                input: path.join("data", `${id}.json`), 
                output: mapIDfetch 
            },
            {
                input: path.join("data", `${userID}${USER_EXT}`),
                output: userIDfetch
            }
        ]));
       
        // WHEN
        onFunction(sock);
        mapIDfetch.resolve(JSON.stringify(map));
        userIDfetch.resolve(JSON.stringify({name : "Pat Smith"}));

        // THEN
        await sleep(100); // give time to read file
        expect(sock.disconnect).toHaveBeenCalledTimes(1);
        expect(sock.nsp.emit).toHaveBeenCalledTimes(0);
    });

    test('should add user to world when connection data is valid', async () => {

        // GIVEN
        const id = nanoid();
        const userID = nanoid();
        const sock = makeConnectionSocket(id, userID);
        const map = new TerrainMap();
        map.set(hc(0,0), Terrain.Open);

        const mapIDfetch = new PromisePuppet<string>();
        const userIDfetch = new PromisePuppet<string>();
        readFileMock.mockImplementation(mockReadFile([
            { 
                input: path.join("data", `${id}.json`), 
                output: mapIDfetch 
            },
            {
                input: path.join("data", `${userID}${USER_EXT}`),
                output: userIDfetch
            }
        ]));

        // WHEN
        onFunction(sock);
        mapIDfetch.resolve(JSON.stringify(map));
        userIDfetch.resolve(JSON.stringify({name : "Pat Smith"}));

        // THEN
        await sleep(100); // give time to read file
        expect(worlds.length).toBe(1);
        const world = worlds[0];
        expect(world.id).toBe(id);
        expect(world.getUserLocation(userID)).toEqual(hc(0,0));
        expect(world.getUserIDs()).toEqual([userID]);
        expect(sock.nsp.emit).toHaveBeenCalledTimes(1);
    });

    test('should emit error when user moves to blocked tile', async () => {
        
        // GIVEN
        const id = nanoid();
        const userID = nanoid();
        const sock = makeConnectionSocket(id, userID);
        const map = new TerrainMap();
        map.set(hc(0,0), Terrain.Open);
        map.set(hc(1,1), Terrain.Wall);

        const mapIDfetch = new PromisePuppet<string>();
        const userIDfetch = new PromisePuppet<string>();
        readFileMock.mockImplementation(mockReadFile([
            { 
                input: path.join("data", `${id}.json`), 
                output: mapIDfetch 
            },
            {
                input: path.join("data", `${userID}${USER_EXT}`),
                output: userIDfetch
            }
        ]));

        // WHEN
        onFunction(sock);
        mapIDfetch.resolve(JSON.stringify(map));
        userIDfetch.resolve(JSON.stringify({name : "Pat Smith"}));
        await sleep(100); // give time to read file
        const moveHandler = getHandler(sock, 'move');
        expect(moveHandler).toBeDefined();
        if (!moveHandler) return;
        sock.emit.mockClear();
        moveHandler({a : 1, b : 1});
        await sleep(10);

        // THEN
        expect(sock.emit).toHaveBeenCalledTimes(1);
        expect(sock.disconnect).toHaveBeenCalledTimes(0);
        expect(sock.emit.mock.calls[0][0]).toBe('error');
    });

    test('should broadcast user location when move succeeds', async () => {

        // GIVEN
        const id = nanoid();
        const userID = nanoid();
        const sock = makeConnectionSocket(id, userID);
        const map = new TerrainMap();
        map.set(hc(0,0), Terrain.Open);
        map.set(hc(1,1), Terrain.Open);

        const mapIDfetch = new PromisePuppet<string>();
        const userIDfetch = new PromisePuppet<string>();
        readFileMock.mockImplementation(mockReadFile([
            { 
                input: path.join("data", `${id}.json`), 
                output: mapIDfetch 
            },
            {
                input: path.join("data", `${userID}${USER_EXT}`),
                output: userIDfetch
            }
        ]));

        // WHEN
        onFunction(sock);
        mapIDfetch.resolve(JSON.stringify(map));
        userIDfetch.resolve(JSON.stringify({name : "Pat Smith"}));
        await sleep(100); // give time to read file
        const moveHandler = getHandler(sock, 'move');
        expect(moveHandler).toBeDefined();
        if (!moveHandler) return;
        sock.emit.mockClear();
        sock.nsp.emit.mockClear();
        moveHandler({a : 1, b : 1});
        await sleep(10);

        // THEN
        expect(sock.nsp.emit).toHaveBeenCalledTimes(1);
        expect(sock.emit).toHaveBeenCalledTimes(0);
        expect(sock.nsp.emit.mock.calls[0]).toEqual(['user', userID, {a:1,b:1}]);
    });

    test('should broadcast user presence when multiple users join same world', async () => {

        // GIVEN
        const id = nanoid();
        const userID1 = nanoid();
        const userID2 = nanoid();
        // these two connections won't share a nsp
        //but that's OK for testing purposes
        const sock1 = makeConnectionSocket(id, userID1);
        const sock2 = makeConnectionSocket(id, userID2);
        const map = new TerrainMap();
        map.set(hc(0,0), Terrain.Open);
        map.set(hc(1,1), Terrain.Open);

        const mapIDfetch = new PromisePuppet<string>();
        const userID1fetch = new PromisePuppet<string>();
        const userID2fetch = new PromisePuppet<string>();
        readFileMock.mockImplementation(mockReadFile([
            { 
                input: path.join("data", `${id}.json`), 
                output: mapIDfetch 
            },
            {
                input: path.join("data", `${userID1}${USER_EXT}`),
                output: userID1fetch
            },
            {
                input: path.join("data", `${userID2}${USER_EXT}`),
                output: userID2fetch
            }
        ]));

        // WHEN
        onFunction(sock1);
        onFunction(sock2);
        mapIDfetch.resolve(JSON.stringify(map));
        userID1fetch.resolve(JSON.stringify({name : "Pat Smith"}));
        userID2fetch.resolve(JSON.stringify({name : "Sam Lee"}));

        // THEN
        await sleep(100); // give time to read file
        // expect(readFileMock).toHaveBeenCalledTimes(3); // there's a race!
        expect(worlds.length).toBe(1); // handle race condition!
        expect(sock1.nsp.emit).toHaveBeenCalledTimes(1);
        expect(sock2.nsp.emit).toHaveBeenCalledTimes(1);
    });

    test('should inform new user about existing users', async () => {

        // GIVEN
        const id = nanoid();
        const userID1 = nanoid();
        const userID2 = nanoid();
        // these two connections won't share a nsp
        //but that's OK for testing purposes
        const sock1 = makeConnectionSocket(id, userID1);
        const sock2 = makeConnectionSocket(id, userID2);
        const map = new TerrainMap();
        map.set(hc(0,0), Terrain.Open);
        map.set(hc(1,1), Terrain.Open);

        const mapIDfetch = new PromisePuppet<string>();
        const userID1fetch = new PromisePuppet<string>();
        const userID2fetch = new PromisePuppet<string>();
        readFileMock.mockImplementation(mockReadFile([
            { 
                input: path.join("data", `${id}.json`),
                output: mapIDfetch 
            },
            {
                input: path.join("data", `${userID1}${USER_EXT}`),
                output: userID1fetch
            },
            {
                input: path.join("data", `${userID2}${USER_EXT}`),
                output: userID2fetch
            }
        ]));

        // WHEN
        onFunction(sock1);
        mapIDfetch.resolve(JSON.stringify(map));
        userID1fetch.resolve(JSON.stringify({name : "Pat Smith"}));
        userID2fetch.resolve(JSON.stringify({name : "Sam Lee"}));
        await sleep(100); // give time to read file
        onFunction(sock2);

        // THEN
        await sleep(10);
        expect(readFileMock).toHaveBeenCalledTimes(3); // already read
        expect(sock2.emit).toHaveBeenCalledTimes(1);
        expect(sock2.emit.mock.calls[0][0]).toBe('user');
        expect(sock2.emit.mock.calls[0][1]).toBe(userID1);
        expect(canonhc(sock2.emit.mock.calls[0][2])).toEqual({a:0,b:0});
    });

    test('should broadcast movement updates between users', async () => {

        // GIVEN
        const id = nanoid();
        const userID1 = nanoid();
        const userID2 = nanoid();
        // these two connections won't share a nsp
        //but that's OK for testing purposes
        const sock1 = makeConnectionSocket(id, userID1);
        const sock2 = makeConnectionSocket(id, userID2);
        const map = new TerrainMap();
        map.set(hc(0,0), Terrain.Open);
        map.set(hc(1,1), Terrain.Open);
        map.set(hc(2,2), Terrain.Open);
        map.set(hc(3,3), Terrain.Open);
    
        const mapIDfetch = new PromisePuppet<string>();
        const userID1fetch = new PromisePuppet<string>();
        const userID2fetch = new PromisePuppet<string>();
        readFileMock.mockImplementation(mockReadFile([
            { 
                input: path.join("data", `${id}.json`), 
                output: mapIDfetch 
            },
            {
                input: path.join("data", `${userID1}${USER_EXT}`),
                output: userID1fetch
            },
            {
                input: path.join("data", `${userID2}${USER_EXT}`),
                output: userID2fetch
            }
        ]));

        // WHEN
        onFunction(sock1);
        onFunction(sock2);
        mapIDfetch.resolve(JSON.stringify(map));
        userID1fetch.resolve(JSON.stringify({name : "Pat Smith"}));
        userID2fetch.resolve(JSON.stringify({name : "Sam Lee"}));
        await sleep(100); // give time to read file
        // expect(readFileMock).toHaveBeenCalledTimes(3); // there's a race!
        expect(worlds.length).toBe(1); // handle race condition!
        sock1.emit.mockClear();
        sock2.emit.mockClear();
        sock1.nsp.emit.mockClear();
        sock2.nsp.emit.mockClear();
        const moveHandler1 = getHandler(sock1, 'move');
        const moveHandler2 = getHandler(sock2, 'move');
        expect(moveHandler1).toBeDefined();
        expect(moveHandler2).toBeDefined();
        if (!moveHandler1 || !moveHandler2) return;
        moveHandler1({a : 2, b : 2});
        await sleep(10);
        expect(sock1.nsp.emit).toHaveBeenCalledTimes(1);
        expect(sock1.nsp.emit.mock.calls[0][0]).toBe('user');
        expect(sock1.nsp.emit.mock.calls[0][1]).toBe(userID1);
        expect(canonhc(sock1.nsp.emit.mock.calls[0][2])).toEqual({a:2,b:2});
        moveHandler2({a : 3, b : 3});
        await sleep(10);

        // THEN
        expect(sock2.nsp.emit).toHaveBeenCalledTimes(1);
        expect(sock2.nsp.emit.mock.calls[0][0]).toBe('user');
        expect(sock2.nsp.emit.mock.calls[0][1]).toBe(userID2);
        expect(canonhc(sock2.nsp.emit.mock.calls[0][2])).toEqual({a:3,b:3});
    });

    test('should handle compatible concurrent moves', async () => {

        // GIVEN
        const id = nanoid();
        const userID1 = nanoid();
        const userID2 = nanoid();
        // these two connections won't share a nsp
        //but that's OK for testing purposes
        const sock1 = makeConnectionSocket(id, userID1);
        const sock2 = makeConnectionSocket(id, userID2);
        const map = new TerrainMap();
        map.set(hc(0,0), Terrain.Open);
        map.set(hc(1,1), Terrain.Open);
        map.set(hc(2,2), Terrain.Open);
        map.set(hc(3,3), Terrain.Open);
    
        const mapIDfetch = new PromisePuppet<string>();
        const userID1fetch = new PromisePuppet<string>();
        const userID2fetch = new PromisePuppet<string>();
        readFileMock.mockImplementation(mockReadFile([
            { 
                input: path.join("data", `${id}.json`), 
                output: mapIDfetch 
            },
            {
                input: path.join("data", `${userID1}${USER_EXT}`),
                output: userID1fetch
            },
            {
                input: path.join("data", `${userID2}${USER_EXT}`),
                output: userID2fetch
            }
        ]));

        // WHEN
        onFunction(sock1);
        onFunction(sock2);
        mapIDfetch.resolve(JSON.stringify(map));
        userID1fetch.resolve(JSON.stringify({name : "Pat Smith"}));
        userID2fetch.resolve(JSON.stringify({name : "Sam Lee"}));
        await sleep(100); // give time to read file
        // expect(readFileMock).toHaveBeenCalledTimes(3); // there's a race!
        expect(worlds.length).toBe(1); // handle race condition!
        sock1.emit.mockClear();
        sock2.emit.mockClear();
        sock1.nsp.emit.mockClear();
        sock2.nsp.emit.mockClear();
        const moveHandler1 = getHandler(sock1, 'move');
        const moveHandler2 = getHandler(sock2, 'move');
        expect(moveHandler1).toBeDefined();
        expect(moveHandler2).toBeDefined();
        if (!moveHandler1 || !moveHandler2) return;
        moveHandler1({a : 2, b : 2});
        moveHandler2({a : 3, b : 3});
        await sleep(10);

        // THEN
        expect(sock1.nsp.emit).toHaveBeenCalledTimes(1);
        expect(sock1.nsp.emit.mock.calls[0][0]).toBe('user');
        expect(sock1.nsp.emit.mock.calls[0][1]).toBe(userID1);
        expect(canonhc(sock1.nsp.emit.mock.calls[0][2])).toEqual({a:2,b:2});
        expect(sock2.nsp.emit).toHaveBeenCalledTimes(1);
        expect(sock2.nsp.emit.mock.calls[0][0]).toBe('user');
        expect(sock2.nsp.emit.mock.calls[0][1]).toBe(userID2);
        expect(canonhc(sock2.nsp.emit.mock.calls[0][2])).toEqual({a:3,b:3});
    });

    test('should allow only one user to take same destination tile', async () => {

        // GIVEN
        const id = nanoid();
        const userID1 = nanoid();
        const userID2 = nanoid();
        // these two connections won't share a nsp
        //but that's OK for testing purposes
        const sock1 = makeConnectionSocket(id, userID1);
        const sock2 = makeConnectionSocket(id, userID2);
        const map = new TerrainMap();
        map.set(hc(0,0), Terrain.Open);
        map.set(hc(1,1), Terrain.Open);
        map.set(hc(2,2), Terrain.Open);
        map.set(hc(3,3), Terrain.Open);
    
        const mapIDfetch = new PromisePuppet<string>();
        const userID1fetch = new PromisePuppet<string>();
        const userID2fetch = new PromisePuppet<string>();
        readFileMock.mockImplementation(mockReadFile([
            { 
                input: path.join("data", `${id}.json`),
                output: mapIDfetch 
            },
            {
                input: path.join("data", `${userID1}${USER_EXT}`),
                output: userID1fetch
            },
            {
                input: path.join("data", `${userID2}${USER_EXT}`),
                output: userID2fetch
            }
        ]));

        // WHEN
        onFunction(sock1);
        onFunction(sock2);
        mapIDfetch.resolve(JSON.stringify(map));
        userID1fetch.resolve(JSON.stringify({name : "Pat Smith"}));
        userID2fetch.resolve(JSON.stringify({name : "Sam Lee"}));
        await sleep(100); // give time to read file
        // expect(readFileMock).toHaveBeenCalledTimes(3); // there's a race!
        expect(worlds.length).toBe(1); // handle race condition!
        sock1.emit.mockClear();
        sock2.emit.mockClear();
        sock1.nsp.emit.mockClear();
        sock2.nsp.emit.mockClear();
        const moveHandler1 = getHandler(sock1, 'move');
        const moveHandler2 = getHandler(sock2, 'move');
        expect(moveHandler1).toBeDefined();
        expect(moveHandler2).toBeDefined();
        if (!moveHandler1 || !moveHandler2) return;
        moveHandler1({a : 2, b : 2});
        moveHandler2({a : 2, b : 2});
        await sleep(10);
        const world = worlds[0];

        // THEN
        if (world.at(hc(2,2)) == userID1) {
            expect(world.at(hc(1,1))).toBe(userID2);
            expect(sock1.nsp.emit).toHaveBeenCalledTimes(1);
            expect(sock1.nsp.emit.mock.calls[0][0]).toBe('user');
            expect(sock1.nsp.emit.mock.calls[0][1]).toBe(userID1);
            expect(canonhc(sock1.nsp.emit.mock.calls[0][2])).toEqual({a:2,b:2});
            expect(sock2.emit).toHaveBeenCalledTimes(1);
            expect(sock2.emit.mock.calls[0][0]).toBe('error');
        } else {
            expect(world.at(hc(0,0))).toBe(userID1);
            expect(sock2.nsp.emit).toHaveBeenCalledTimes(1);
            expect(sock2.nsp.emit.mock.calls[0][0]).toBe('user');
            expect(sock2.nsp.emit.mock.calls[0][1]).toBe(userID2);
            expect(canonhc(sock2.nsp.emit.mock.calls[0][2])).toEqual({a:2,b:2});
            expect(sock1.emit).toHaveBeenCalledTimes(1);
            expect(sock1.emit.mock.calls[0][0]).toBe('error');
        }
    });

    test('should remove user from world on disconnect', async () => {   

        // GIVEN
        const id = nanoid();
        const userID = nanoid();
        const sock = makeConnectionSocket(id, userID);
        const map = new TerrainMap();
        map.set(hc(0,0), Terrain.Open);

        const mapIDfetch = new PromisePuppet<string>();
        const userIDfetch = new PromisePuppet<string>();
        readFileMock.mockImplementation(mockReadFile([
            { 
                input: path.join("data", `${id}.json`),
                output: mapIDfetch 
            },
            {
                input: path.join("data", `${userID}${USER_EXT}`),
                output: userIDfetch
            }
        ]));

        // WHEN
        onFunction(sock);
        mapIDfetch.resolve(JSON.stringify(map));
        userIDfetch.resolve(JSON.stringify({name : "Pat Smith"}));
        await sleep(100); // give time to read file
        expect(worlds.length).toBe(1);
        const world = worlds[0];
        const disconnectHandler = getHandler(sock, 'disconnect');
        expect(disconnectHandler).toBeDefined();
        if (!disconnectHandler) return;
        disconnectHandler();
        await sleep(10);

        // THEN
        expect(world.getUserIDs()).toEqual([]);
    });

    test('should notify other users when user disconnects', async () => {

        // GIVEN
        const id = nanoid();
        const userID1 = nanoid();
        const userID2 = nanoid();
        // these two connections won't share a nsp
        //but that's OK for testing purposes
        const sock1 = makeConnectionSocket(id, userID1);
        const sock2 = makeConnectionSocket(id, userID2);
        const map = new TerrainMap();
        map.set(hc(0,0), Terrain.Open);
        map.set(hc(1,1), Terrain.Open);
        map.set(hc(2,2), Terrain.Open);
        map.set(hc(3,3), Terrain.Open);
    
        const mapIDfetch = new PromisePuppet<string>();
        const userID1fetch = new PromisePuppet<string>();
        const userID2fetch = new PromisePuppet<string>();
        readFileMock.mockImplementation(mockReadFile([
            { 
                input: path.join("data", `${id}.json`), 
                output: mapIDfetch 
            },
            {
                input: path.join("data", `${userID1}${USER_EXT}`),
                output: userID1fetch
            },
            {
                input: path.join("data", `${userID2}${USER_EXT}`),
                output: userID2fetch
            }
        ]));

        // WHEN
        onFunction(sock1);
        onFunction(sock2);
        mapIDfetch.resolve(JSON.stringify(map));
        userID1fetch.resolve(JSON.stringify({name : "Pat Smith"}));
        userID2fetch.resolve(JSON.stringify({name : "Sam Lee"}));
        await sleep(100);
        expect(worlds.length).toBe(1);
        const world = worlds[0];
        sock1.emit.mockClear();
        sock2.emit.mockClear();
        sock1.nsp.emit.mockClear();
        sock2.nsp.emit.mockClear();
        const disconnectHandler1 = getHandler(sock1, 'disconnect');
        expect(disconnectHandler1).toBeDefined();
        if (!disconnectHandler1) return;
        disconnectHandler1();
        await sleep(10);

        // THEN
        expect(sock1.nsp.emit).toHaveBeenCalledTimes(1);
        expect(sock1.nsp.emit.mock.calls[0]).toEqual(['user',userID1,'exit']);
        expect(world.getUserIDs()).toEqual([userID2]);
    });
});
});

