import { TerrainMap } from '../../../client/TerrainMap';
import { Terrain } from '../../../client/Terrain';
import { HexCoordinate } from '../../../client/HexCoordinate';
import { Socket } from 'socket.io-client';

import {
    connectClient,
    startHermeticServer,
    waitForEvent,
    connectAndWaitForUser,
    writeUser,
    writeWorld,
} from './hermetic-test-helpers';

describe('chat hermetic tests', () => {
    it('broadcasts chat messages between real clients', async () => {
        const server = await startHermeticServer();

        let alice: Socket | undefined;
        let bob: Socket | undefined;

        try {
           const map = new TerrainMap();

    for (let a = -3; a <= 3; a++) {
        for (let b = -3; b <= 3; b++) {
            map.set(new HexCoordinate(a, b), Terrain.Open);
    }
}

            await writeWorld(server.dataDir, 'testworld', map);

            await writeUser(server.dataDir, 'alice');
            await writeUser(server.dataDir, 'bob');

            alice = connectClient(server.port, 'testworld', 'alice');
            await connectAndWaitForUser(alice, 'alice');

            bob = connectClient(server.port, 'testworld', 'bob');
            await connectAndWaitForUser(bob, 'bob');

            const chatPromise = waitForEvent(bob, 'chat');

            alice.emit('chat', 'hello world');

            const args = await chatPromise;

            expect(args[0]).toBe('alice');
            expect(args[1]).toBe('hello world');

        } finally {
            if (alice) {
                alice.disconnect();
            }

            if (bob) {
                bob.disconnect();
            }

            await server.close();
        }
    }, 10000);
});