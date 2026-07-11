import { nanoid } from "nanoid";
import { Server } from "socket.io";
import { USER_EXT } from "../../client/network";
import fs from "node:fs/promises";
import http from "http";
import { Terrain } from "../../client/Terrain";
import { TerrainMap } from "../../client/TerrainMap";
import { HexCoordinate } from "../../client/HexCoordinate";
import { HexWorld } from "../../HexWorld";
import { createHexWorldServer } from "../../hexserver";
import path from 'node:path';

jest.mock("socket.io");

// =========================
// Mock socket types
// =========================

interface ConnectionSocket {
    nsp: {
        name: string;
        emit: jest.Mock;
    };
    handshake: {
        query: {
            id: string;
        };
    };
    on: jest.Mock;
    disconnect: jest.Mock;
    emit: jest.Mock;
}

interface MockSocket {
    emit: jest.Mock;
    on: jest.Mock;
    disconnect: jest.Mock;
}

function makeMockSocket(): MockSocket {
    return {
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
    };
}

function makeConnectionSocket(id: string, userID: string): ConnectionSocket {
    const namespace = {
        name: "/" + id,
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

// =========================
// Promise helper
//Used to control async file reads in tests
// =========================

function doNotCall() {
    throw new Error("should not be called");
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

// =========================
// Utility helpers
// =========================

async function sleep(millis: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, millis));
}

interface ReadFileCase {
    input: string;
    output: Promise<string>;
}

function mockReadFile(cases: ReadFileCase[]) {
    const fetchMap = new Map<string, ReadFileCase>();

    for (const c of cases) {
        fetchMap.set(c.input, c);
    }

    return (input: string, option?: string) => {
        const result = fetchMap.get(input);

        if (result && option === "utf-8") {
            return result.output;
        }

        return Promise.reject("cannot handle");
    };
}

function hc(a: number, b: number) {
    return new HexCoordinate(a, b);
}

// Finds an event handler that was registered on the socket.
function getHandler(
    sock: ConnectionSocket,
    name: string
): ((...args: unknown[]) => void) | undefined {
    const calls = sock.on.mock.calls;

    for (const call of calls) {
        if (call[0] === name) {
            expect(call.length).toBe(2);
            const handler = call[1];
            expect(typeof handler).toBe("function");
            return handler as (...args: unknown[]) => void;
        }
    }

    return undefined;
}

const serverOf = Server.prototype.of as jest.Mock;

// =========================
// Chat integration tests
// =========================

describe("chat event", () => {
    let ofSocket = makeMockSocket();
    let worlds: HexWorld[];
    let onFunction: (cs: ConnectionSocket) => void;
    let readFileMock: jest.SpyInstance;

    beforeEach(() => {
        ofSocket = makeMockSocket();
        serverOf.mockImplementation(() => ofSocket);

        const mockWebServer: http.Server = {} as http.Server;
        const results = createHexWorldServer(mockWebServer);
        worlds = results.worlds;

        const call = ofSocket.on.mock.calls[0];
        expect(call[0]).toBe("connection");
        expect(typeof call[1]).toBe("function");
        onFunction = call[1] as (cs: ConnectionSocket) => void;

        readFileMock = jest.spyOn(fs, "readFile");
    });

    afterEach(() => {
        readFileMock.mockRestore();
        serverOf.mockClear();
    });

    // Connects one user to one world and resolves the required file reads
    // so that the join flow completes successfully.
    async function connectAndJoin(
        worldID: string,
        userID: string,
        map: TerrainMap,
        name = "Test User"
    ): Promise<ConnectionSocket> {
        const sock = makeConnectionSocket(worldID, userID);
        const mapFetch = new PromisePuppet<string>();
        const userFetch = new PromisePuppet<string>();

        readFileMock.mockImplementation(
            mockReadFile([
                { input: path.join("data", `${worldID}.json`), output: mapFetch },
                { input: path.join("data", `${userID}${USER_EXT}`), output: userFetch },
            ])
        );

        onFunction(sock);
        mapFetch.resolve(JSON.stringify(map));
        userFetch.resolve(JSON.stringify({ name }));
        await sleep(100);

        return sock;
    }

    // =========================
    // Handler registration
    // =========================

    describe("handler registration", () => {
        test("registers the chat handler after a user joins successfully", async () => {

            // GIVEN
            const worldID = nanoid();
            const userID = nanoid();
            const map = new TerrainMap();
            map.set(hc(0, 0), Terrain.Open);

            // WHEN
            const sock = await connectAndJoin(worldID, userID, map);

            // THEN
            const chatHandler = getHandler(sock, "chat");
            expect(chatHandler).toBeDefined();
        });

        test("does not register the chat handler before files finish loading", async () => {

            // GIVEN
            const worldID = nanoid();
            const userID = nanoid();
            const map = new TerrainMap();
            map.set(hc(0, 0), Terrain.Open);

            const sock = makeConnectionSocket(worldID, userID);
            const mapFetch = new PromisePuppet<string>();
            const userFetch = new PromisePuppet<string>();

            readFileMock.mockImplementation(
                mockReadFile([
                    { input: path.join("data", `${worldID}.json`), output: mapFetch },
                    { input: path.join("data", `${userID}${USER_EXT}`), output: userFetch },
                ])
            );

            // WHEN
            onFunction(sock);
            await sleep(10);

            // THEN
            const chatHandler = getHandler(sock, "chat");
            expect(chatHandler).toBeUndefined();
        });
    });

    // =========================
    // Single-user chat behavior
    // =========================

    describe("single-user chat behavior", () => {
        test("broadcasts a valid chat message with user id and message", async () => {

            // GIVEN
            const worldID = nanoid();
            const userID = nanoid();
            const map = new TerrainMap();
            map.set(hc(0, 0), Terrain.Open);

            const sock = await connectAndJoin(worldID, userID, map);

            sock.nsp.emit.mockClear();

            // WHEN
            const chatHandler = getHandler(sock, "chat");
            expect(chatHandler).toBeDefined();
            if (!chatHandler) return;

            chatHandler("hello world");
            await sleep(10);

            // THEN
            expect(sock.nsp.emit).toHaveBeenCalledWith("chat", userID, "hello world");
        });

        test("does not disconnect the sender for a valid chat message", async () => {

            // GIVEN
            const worldID = nanoid();
            const userID = nanoid();
            const map = new TerrainMap();
            map.set(hc(0, 0), Terrain.Open);

            const sock = await connectAndJoin(worldID, userID, map);

            // WHEN
            const chatHandler = getHandler(sock, "chat");
            expect(chatHandler).toBeDefined();
            if (!chatHandler) return;

            chatHandler("hello");
            await sleep(10);

            // THEN
            expect(sock.disconnect).not.toHaveBeenCalled();
        });
    });

    // =========================
    // Multi-user chat behavior
    // =========================    
    
    describe("multi-user chat behavior", () => {
        test("keeps other users in the same world after a chat message is sent", async () => {
            // GIVEN
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

            readFileMock.mockImplementation(
                mockReadFile([
                   { input: path.join("data", `${worldID}.json`), output: mapFetch },
                   { input: path.join("data", `${userID1}${USER_EXT}`), output: user1Fetch },
                   { input: path.join("data", `${userID2}${USER_EXT}`), output: user2Fetch },
                ])
            );

            onFunction(sock1);
            onFunction(sock2);
            mapFetch.resolve(JSON.stringify(map));
            user1Fetch.resolve(JSON.stringify({ name: "Pat Smith" }));
            user2Fetch.resolve(JSON.stringify({ name: "Sam Lee" }));
            await sleep(100);

            // WHEN
            const chatHandler1 = getHandler(sock1, "chat");
            expect(chatHandler1).toBeDefined();
            if (!chatHandler1) return;

            chatHandler1("test message");
            await sleep(10);

            // THEN
            expect(worlds[0].getUserIDs()).toContain(userID1);
            expect(worlds[0].getUserIDs()).toContain(userID2);
        });

        test("does not broadcast a chat message to a different world namespace", async () => {
            // GIVEN
            const worldID1 = nanoid();
            const worldID2 = nanoid();
            const userID1 = nanoid();
            const userID2 = nanoid();

            const sock1 = makeConnectionSocket(worldID1, userID1);
            const sock2 = makeConnectionSocket(worldID2, userID2);

            const map1 = new TerrainMap();
            map1.set(hc(0, 0), Terrain.Open);

            const map2 = new TerrainMap();
            map2.set(hc(1, 1), Terrain.Open);

            const map1Fetch = new PromisePuppet<string>();
            const map2Fetch = new PromisePuppet<string>();
            const user1Fetch = new PromisePuppet<string>();
            const user2Fetch = new PromisePuppet<string>();

            readFileMock.mockImplementation(
                mockReadFile([
                    { input: path.join("data", `${worldID1}.json`), output: map1Fetch },
                    { input: path.join("data", `${worldID2}.json`), output: map2Fetch },
                    { input: path.join("data", `${userID1}${USER_EXT}`), output: user1Fetch },
                    { input: path.join("data", `${userID2}${USER_EXT}`), output: user2Fetch },
                ])
            );

            onFunction(sock1);
            onFunction(sock2);

            map1Fetch.resolve(JSON.stringify(map1));
            map2Fetch.resolve(JSON.stringify(map2));
            user1Fetch.resolve(JSON.stringify({ name: "User One" }));
            user2Fetch.resolve(JSON.stringify({ name: "User Two" }));
            await sleep(100);

            sock1.nsp.emit.mockClear();
            sock2.nsp.emit.mockClear();

            // WHEN
            const chatHandler1 = getHandler(sock1, "chat");
            expect(chatHandler1).toBeDefined();
            if (!chatHandler1) return;

            chatHandler1("hello from world 1");
            await sleep(10);

            // THEN
            expect(sock1.nsp.emit).toHaveBeenCalledWith("chat", userID1, "hello from world 1");
            expect(sock2.nsp.emit).not.toHaveBeenCalled();
        });
    });
});