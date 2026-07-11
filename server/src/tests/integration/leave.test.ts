import { nanoid } from 'nanoid';
import { Server } from 'socket.io';
import { USER_EXT } from '../../client/network';
import fs from 'node:fs/promises';
import http from 'http';
import { Terrain } from '../../client/Terrain';
import { TerrainMap } from '../../client/TerrainMap';
import { HexCoordinate } from '../../client/HexCoordinate';
import { HexWorld } from '../../HexWorld';
import { createHexWorldServer } from '../../hexserver';
import path from 'node:path';

// Replace socket.io with Jest's auto-mock so no real network is created.
// The mocked Server lets us intercept the connection handler and control
// what each namespace/socket does.
jest.mock('socket.io');

// --- Interfaces ---------------------------------------------------------

// Represents a socket.io client socket as seen by the server.
// nsp is the namespace (shared by all users in the same world).
interface ConnectionSocket {
    nsp: {
        name: string;
        emit: jest.Mock; // broadcasts to everyone in the namespace
    };
    handshake: {
        query: {
            id: string; // userID passed as a query param on connect
        };
    };
    on: jest.Mock;         // registers event handlers (disconnect, move, leave…)
    disconnect: jest.Mock; // closes this client's connection
    emit: jest.Mock;       // sends an event to this client only
}

// Minimal mock for the top-level socket.io Server object.
interface MockSocket {
    emit: jest.Mock;
    on: jest.Mock;
    disconnect: jest.Mock;
}

// --- Helper factories ----------------------------------------------------

function makeMockSocket(): MockSocket {
    return {
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
    };
}

function makeConnectionSocket(id: string, userID: string): ConnectionSocket {
    const namespace = {
        name: '/' + id,
        emit: jest.fn(),
    };
    return {
        nsp: namespace,
        handshake: { query: { id: userID } },
        on: jest.fn(),
        disconnect: jest.fn(),
        emit: jest.fn(),
    };
}

// --- PromisePuppet ------------------------------------------------------
// A Promise whose resolve/reject can be triggered externally.
// Used to simulate async file reads: we control exactly when each
// readFile call settles, allowing precise timing in tests.

function doNotCall() {
    throw new Error('should not be called');
}

class PromisePuppet<T> extends Promise<T> {
    constructor() {
        let savedResolve: (value: T | PromiseLike<T>) => void = doNotCall;
        let savedReject: (reason?: unknown) => void = doNotCall;
        super((resolve, reject) => {
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

// --- Utilities ----------------------------------------------------------

async function sleep(millis: number): Promise<void> {
    return new Promise((resolve) => setTimeout(() => resolve(), millis));
}

interface ReadFileCase {
    input: string;
    output: Promise<string>;
}

// Returns a mock implementation for fs.readFile that maps specific
// file paths to PromisePuppet instances, letting each test control
// exactly when the map and user files "load".
function mockReadFile(cases: ReadFileCase[]) {
    const fetchMap = new Map<string, ReadFileCase>();
    for (const c of cases) {
        fetchMap.set(c.input, c);
    }
    return (input: string, option?: string) => {
        const result = fetchMap.get(input);
        if (result && option === 'utf-8') {
            return result.output;
        } else {
            return Promise.reject('cannot handle');
        }
    };
}

function hc(a: number, b: number) {
    return new HexCoordinate(a, b);
}

// Searches sock.on.mock.calls for a handler registered under `name`.
// Returns the handler function, or undefined if it was never registered.
function getHandler(sock: ConnectionSocket, name: string): ((...args: unknown[]) => void) | undefined {
    const calls = sock.on.mock.calls;
    for (const call of calls) {
        if (call[0] === name) {
            expect(call.length).toBe(2);
            const handler = call[1];
            expect(typeof handler).toBe('function');
            return handler as (...args: unknown[]) => void;
        }
    }
    return undefined;
}

// Grabs the mocked `.of()` method from the auto-mocked Server prototype.
// Must be captured after jest.mock() runs.
const serverOf = Server.prototype.of as jest.Mock;

// ========================================================================
// Tests
// ========================================================================

describe('leave event', () => {

    // Shared state reset before each test
    let ofSocket = makeMockSocket();
    let worlds: HexWorld[];
    let onFunction: (cs: ConnectionSocket) => void;
    let readFileMock: jest.SpyInstance;

    beforeEach(() => {
        // Fresh mock socket returned by server.of(...)
        ofSocket = makeMockSocket();
        serverOf.mockImplementation(() => ofSocket);

        // Create the server under test — no real HTTP server needed
        const mockWebServer: http.Server = {} as http.Server;
        const results = createHexWorldServer(mockWebServer);
        worlds = results.worlds;

        // Capture the connection handler that hexserver registers
        const call = ofSocket.on.mock.calls[0];
        expect(call[0]).toBe('connection');
        expect(typeof call[1]).toBe('function');
        onFunction = call[1] as (cs: ConnectionSocket) => void;

        // Spy on fs.readFile so tests can inject controlled responses
        readFileMock = jest.spyOn(fs, 'readFile');
    });

    afterEach(() => {
        readFileMock.mockRestore();
        serverOf.mockClear();
    });

    // --------------------------------------------------------------------
    // Helper: connects a single user to a world and waits for them to be
    // fully added (both map and user files resolved).
    // Returns the connected socket.
    // --------------------------------------------------------------------
    async function connectAndJoin(worldID: string, userID: string, map: TerrainMap): Promise<ConnectionSocket> {
        const sock = makeConnectionSocket(worldID, userID);
        const mapFetch = new PromisePuppet<string>();
        const userFetch = new PromisePuppet<string>();
        readFileMock.mockImplementation(mockReadFile([
            { input: path.join("data", `${worldID}.json`), output: mapFetch },
            { input: path.join("data", `${userID}${USER_EXT}`), output: userFetch },
        ]));
        onFunction(sock);
        mapFetch.resolve(JSON.stringify(map));
        userFetch.resolve(JSON.stringify({ name: 'Test User' }));
        await sleep(100); // wait for Promise.all inside hexserver to settle
        return sock;
    }

    // ====================================================================
    // Group 1: Handler Registration
    // Verifies that the server sets up the leave event listener at all.
    // If these fail, the feature is completely missing from hexserver.ts.
    // ====================================================================
    describe('handler registration', () => {

        test('should register leave handler after join', async () => {
            // A map with one open tile so the user can be placed
            const worldID = nanoid();
            const userID = nanoid();
            const map = new TerrainMap();
            map.set(hc(0, 0), Terrain.Open);

            const sock = await connectAndJoin(worldID, userID, map);

            // The server must have called sock.on('leave', handler)
            const leaveHandler = getHandler(sock, 'leave');
            expect(leaveHandler).toBeDefined();
        });

        test('leave handler is not registered before files finish loading', async () => {
            // The server reads the map and user files asynchronously before
            // adding the user to the world. The leave handler should only be
            // registered after that setup completes — not before.
            const worldID = nanoid();
            const userID = nanoid();
            const map = new TerrainMap();
            map.set(hc(0, 0), Terrain.Open);

            const sock = makeConnectionSocket(worldID, userID);
            const mapFetch = new PromisePuppet<string>();
            const userFetch = new PromisePuppet<string>();
            readFileMock.mockImplementation(mockReadFile([
                { input: path.join("data", `${worldID}.json`), output: mapFetch },
                { input: path.join("data", `${userID}${USER_EXT}`), output: userFetch },
            ]));

            // Connect but do NOT resolve the file fetches yet
            onFunction(sock);
            await sleep(10);

            // At this point the user is still loading — no leave handler yet
            const leaveHandler = getHandler(sock, 'leave');
            expect(leaveHandler).toBeUndefined();
        });

    });

    // ====================================================================
    // Group 2: Single User Leaving
    // Verifies the correct behavior when the leaving user's own state
    // and socket are cleaned up.
    // ====================================================================
    describe('single user leaving', () => {

        test('leave removes the user from the HexWorld', async () => {
            const worldID = nanoid();
            const userID = nanoid();
            const map = new TerrainMap();
            map.set(hc(0, 0), Terrain.Open);

            const sock = await connectAndJoin(worldID, userID, map);

            // Confirm user is in the world before leaving
            expect(worlds.length).toBe(1);
            const world = worlds[0];
            expect(world.getUserIDs()).toContain(userID);

            const leaveHandler = getHandler(sock, 'leave');
            expect(leaveHandler).toBeDefined();
            if (!leaveHandler) return;

            leaveHandler();
            await sleep(10);

            // User must no longer appear in the world's user list
            expect(world.getUserIDs()).not.toContain(userID);
        });

        test('leave closes the leaving user\'s socket connection', async () => {
            // Unlike an accidental disconnect, an intentional leave should
            // also terminate the socket from the server side
            const worldID = nanoid();
            const userID = nanoid();
            const map = new TerrainMap();
            map.set(hc(0, 0), Terrain.Open);

            const sock = await connectAndJoin(worldID, userID, map);

            const leaveHandler = getHandler(sock, 'leave');
            expect(leaveHandler).toBeDefined();
            if (!leaveHandler) return;

            leaveHandler();
            await sleep(10);

            expect(sock.disconnect).toHaveBeenCalled();
        });

        test('leave broadcasts the exit event to the entire world namespace', async () => {
            // All clients in the namespace (same world) must be notified
            // that this user has left, so their UI can remove the avatar
            const worldID = nanoid();
            const userID = nanoid();
            const map = new TerrainMap();
            map.set(hc(0, 0), Terrain.Open);

            const sock = await connectAndJoin(worldID, userID, map);

            // Clear previous join-related emits so we only count the leave emit
            sock.nsp.emit.mockClear();

            const leaveHandler = getHandler(sock, 'leave');
            expect(leaveHandler).toBeDefined();
            if (!leaveHandler) return;

            leaveHandler();
            await sleep(10);

            // Must broadcast: user <userID> has exited
            expect(sock.nsp.emit).toHaveBeenCalledWith('user', userID, 'exit');
        });

        test('calling leave twice does not throw or corrupt world state', async () => {
            // Guards against double-remove bugs: if leave fires twice
            // (e.g. a client bug), the server should handle it gracefully
            // without crashing or leaving the world in a broken state
            const worldID = nanoid();
            const userID = nanoid();
            const map = new TerrainMap();
            map.set(hc(0, 0), Terrain.Open);

            const sock = await connectAndJoin(worldID, userID, map);
            const world = worlds[0];

            const leaveHandler = getHandler(sock, 'leave');
            expect(leaveHandler).toBeDefined();
            if (!leaveHandler) return;

            leaveHandler();
            await sleep(10);

            // Second call must not throw
            expect(() => leaveHandler()).not.toThrow();
            await sleep(10);

            // World state must still be consistent
            expect(world.getUserIDs()).not.toContain(userID);
        });

        test('disconnect after leave does not cause a double-remove error', async () => {
            // When a user intentionally leaves, their socket is closed by the server.
            // This triggers a disconnect event. The server must not try to remove
            // an already-removed user a second time, which could throw or corrupt state.
            const worldID = nanoid();
            const userID = nanoid();
            const map = new TerrainMap();
            map.set(hc(0, 0), Terrain.Open);

            const sock = await connectAndJoin(worldID, userID, map);
            const world = worlds[0];

            const leaveHandler = getHandler(sock, 'leave');
            const disconnectHandler = getHandler(sock, 'disconnect');
            expect(leaveHandler).toBeDefined();
            expect(disconnectHandler).toBeDefined();
            if (!leaveHandler || !disconnectHandler) return;

            // User intentionally leaves first
            leaveHandler();
            await sleep(10);

            // Then the socket disconnect event fires (triggered by sock.disconnect())
            expect(() => disconnectHandler()).not.toThrow();
            await sleep(10);

            // World must still be in a valid state
            expect(world.getUserIDs()).not.toContain(userID);
        });

        test('when the last user leaves the world becomes empty', async () => {
            // Verifies that isUnoccupied() reflects the world being cleared,
            // which matters for any future cleanup or world-reuse logic
            const worldID = nanoid();
            const userID = nanoid();
            const map = new TerrainMap();
            map.set(hc(0, 0), Terrain.Open);

            const sock = await connectAndJoin(worldID, userID, map);
            const world = worlds[0];

            const leaveHandler = getHandler(sock, 'leave');
            expect(leaveHandler).toBeDefined();
            if (!leaveHandler) return;

            leaveHandler();
            await sleep(10);

            expect(world.getUserIDs()).toEqual([]);
            expect(world.isUnoccupied()).toBe(true);
        });

    });

    // ====================================================================
    // Group 3: Multiplayer — Effect on Other Users
    // Verifies that leaving one user does not break the experience for
    // the users who remain in the world.
    // ====================================================================
    describe('multiplayer - effect on other users', () => {

        test('other users are notified when a user leaves', async () => {
            // Both users connect to the same world
            const worldID = nanoid();
            const userID1 = nanoid();
            const userID2 = nanoid();
            const sock1 = makeConnectionSocket(worldID, userID1);
            const sock2 = makeConnectionSocket(worldID, userID2);
            const map = new TerrainMap();
            map.set(hc(0, 0), Terrain.Open);
            map.set(hc(1, 1), Terrain.Open);

            const mapFetch = new PromisePuppet<string>();
            const user1Fetch = new PromisePuppet<string>();
            const user2Fetch = new PromisePuppet<string>();
            readFileMock.mockImplementation(mockReadFile([
                { input: path.join("data", `${worldID}.json`), output: mapFetch },
                { input: path.join("data", `${userID1}${USER_EXT}`), output: user1Fetch },
                { input: path.join("data", `${userID2}${USER_EXT}`), output: user2Fetch },
            ]));

            onFunction(sock1);
            onFunction(sock2);
            mapFetch.resolve(JSON.stringify(map));
            user1Fetch.resolve(JSON.stringify({ name: 'Pat Smith' }));
            user2Fetch.resolve(JSON.stringify({ name: 'Sam Lee' }));
            await sleep(100);

            // Clear join-related emits before triggering leave
            sock1.nsp.emit.mockClear();

            const leaveHandler1 = getHandler(sock1, 'leave');
            expect(leaveHandler1).toBeDefined();
            if (!leaveHandler1) return;

            leaveHandler1();
            await sleep(10);

            // The namespace (which user2 is part of) must receive the exit broadcast
            expect(sock1.nsp.emit).toHaveBeenCalledWith('user', userID1, 'exit');
            // User2 must still be in the world
            expect(worlds[0].getUserIDs()).toEqual([userID2]);
        });

        test('a user leaving does not remove other users from the world', async () => {
            // Regression guard: only the leaver should be removed,
            // not everyone else in the world
            const worldID = nanoid();
            const userID1 = nanoid();
            const userID2 = nanoid();
            const sock1 = makeConnectionSocket(worldID, userID1);
            const sock2 = makeConnectionSocket(worldID, userID2);
            const map = new TerrainMap();
            map.set(hc(0, 0), Terrain.Open);
            map.set(hc(1, 1), Terrain.Open);

            const mapFetch = new PromisePuppet<string>();
            const user1Fetch = new PromisePuppet<string>();
            const user2Fetch = new PromisePuppet<string>();
            readFileMock.mockImplementation(mockReadFile([
               { input: path.join("data", `${worldID}.json`), output: mapFetch },
               { input: path.join("data", `${userID1}${USER_EXT}`), output: user1Fetch },
               { input: path.join("data", `${userID2}${USER_EXT}`), output: user2Fetch },
            ]));

            onFunction(sock1);
            onFunction(sock2);
            mapFetch.resolve(JSON.stringify(map));
            user1Fetch.resolve(JSON.stringify({ name: 'Pat Smith' }));
            user2Fetch.resolve(JSON.stringify({ name: 'Sam Lee' }));
            await sleep(100);

            const leaveHandler1 = getHandler(sock1, 'leave');
            expect(leaveHandler1).toBeDefined();
            if (!leaveHandler1) return;

            leaveHandler1();
            await sleep(10);

            // User2 must remain untouched
            expect(worlds[0].getUserIDs()).toContain(userID2);
        });

    });

});
