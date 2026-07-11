import { TerrainMap } from '../../../client/TerrainMap';
import { Terrain } from '../../../client/Terrain';
import { HexCoordinate } from '../../../client/HexCoordinate';
import { Socket } from 'socket.io-client';

import {
    connectClient,
    connectAndWaitForUser,
    startHermeticServer,
    waitForUserEvent,
    writeUser,
    writeWorld,
} from './hermetic-test-helpers';

function makeOpenMap(): TerrainMap {
    const map = new TerrainMap();

    for (let a = -3; a <= 3; a++) {
        for (let b = -3; b <= 3; b++) {
            map.set(new HexCoordinate(a, b), Terrain.Open);
        }
    }

    return map;
}

describe('leave hermetic tests', () => {
    it('notifies another real client when a user leaves', async () => {
        const server = await startHermeticServer();

        let alice: Socket | undefined;
        let bob: Socket | undefined;

        try {
            await writeWorld(server.dataDir, 'testworld', makeOpenMap());
            await writeUser(server.dataDir, 'alice');
            await writeUser(server.dataDir, 'bob');

            alice = connectClient(server.port, 'testworld', 'alice');
            await connectAndWaitForUser(alice, 'alice');

            bob = connectClient(server.port, 'testworld', 'bob');
            await connectAndWaitForUser(bob, 'bob');

            const exitPromise = waitForUserEvent(bob, 'alice', 'exit');

            alice.emit('leave');

            const args = await exitPromise;

            expect(args[0]).toBe('alice');
            expect(args[1]).toBe('exit');
        } finally {
            if (alice) alice.disconnect();
            if (bob) bob.disconnect();
            await server.close();
        }
    }, 10000);
});