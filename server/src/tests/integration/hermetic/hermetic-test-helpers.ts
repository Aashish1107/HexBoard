import http from 'http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { io, Socket } from 'socket.io-client';
import { createHexWorldServer } from '../../../hexserver';
import { TerrainMap } from '../../../client/TerrainMap';
import { USER_EXT } from '../../../client/network';

export interface HermeticServer {
    port: number;
    dataDir: string;
    close: () => Promise<void>;
}

export async function startHermeticServer(): Promise<HermeticServer> {
    const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hexserver-test-'));
    process.env.DATA = dataDir;

    const httpServer = http.createServer();
    createHexWorldServer(httpServer);

    await new Promise<void>((resolve) => {
        httpServer.listen(0, resolve);
    });

    const address = httpServer.address();
    if (!address || typeof address === 'string') {
        throw new Error('Unable to determine test server port');
    }

    return {
        port: address.port,
        dataDir,
        close: async () => {
            await new Promise<void>((resolve) => {
                httpServer.close(() => resolve());
            });
            delete process.env.DATA;
            await fs.rm(dataDir, { recursive: true, force: true });
        },
    };
}

export async function writeWorld(dataDir: string, worldID: string, map: TerrainMap): Promise<void> {
    await fs.writeFile(
        path.join(dataDir, `${worldID}.json`),
        JSON.stringify(map),
        'utf-8'
    );
}

export async function writeUser(dataDir: string, userID: string): Promise<void> {
    await fs.writeFile(
        path.join(dataDir, `${userID}${USER_EXT}`),
        JSON.stringify({ name: userID }),
        'utf-8'
    );
}

export function connectClient(port: number, worldID: string, userID: string): Socket {
    const socket = io(`http://localhost:${port}/${worldID}`, {
        query: { id: userID },
        transports: ['websocket'],
        reconnection: false,
        autoConnect: false,
    });

    return socket;
}

export function waitForEvent(socket: Socket, eventName: string): Promise<unknown[]> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Timed out waiting for ${eventName}`));
        }, 3000);

        socket.once(eventName, (...args: unknown[]) => {
            clearTimeout(timer);
            resolve(args);
        });
    });
}

export async function connectAndWaitForUser(
    socket: Socket,
    userID: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            socket.off('user', onUser);
            reject(new Error(`Timed out waiting for user ${userID}`));
        }, 3000);

        function onUser(receivedUserID: unknown): void {
            if (receivedUserID === userID) {
                clearTimeout(timer);
                socket.off('user', onUser);
                resolve();
            }
        }

        socket.on('user', onUser);
        socket.connect();
    });
}

export async function closeClients(...clients: Socket[]): Promise<void> {
    for (const client of clients) {
        client.disconnect();
    }
}

export function waitForUserEvent(
    socket: Socket,
    expectedUserID: string,
    expectedValue?: unknown
): Promise<unknown[]> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            socket.off('user', onUser);
            reject(new Error(`Timed out waiting for user event for ${expectedUserID}`));
        }, 3000);

        function onUser(userID: unknown, value: unknown): void {
            if (userID !== expectedUserID) return;

            if (expectedValue !== undefined && value !== expectedValue) return;

            clearTimeout(timer);
            socket.off('user', onUser);
            resolve([userID, value]);
        }

        socket.on('user', onUser);
    });
}