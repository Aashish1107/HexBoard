import { Server as ServerSocket } from 'socket.io';
import http from 'http';
import { HexWorld } from './HexWorld.js';
import { TerrainMap } from './client/TerrainMap.js';
import { HexCoordinate } from './client/HexCoordinate.js';
import { validateMessage } from './chat/message-validation.js';
import { PotentialHexCoordinate, ClientToServerEvents, InterSocketEvents, ServerToClientEvents, SocketData, USER_EXT } from './client/network.js';
import fs from 'node:fs/promises';
import path from 'node:path';

function dataPath(fileName: string): string {
    return path.join(process.env.DATA ?? "data", fileName);
}

export function createHexWorldServer(webserver : http.Server) : { 
    server : ServerSocket,
    worlds : HexWorld[] 
} {
     const server = new ServerSocket<ClientToServerEvents,ServerToClientEvents,InterSocketEvents,SocketData>(webserver, {cors:{
        origin: "*",
        credentials: false
    }});
    
    // exported for testing purposes
    const worlds : HexWorld[] = [];
    
    server.of(/^\/.*$/).on('connection', (client) => {
        const worldConnection = client.nsp;
        const mapID = worldConnection.name.substring(1);
        console.log('Connected! for ' + mapID);
        const userID = client.handshake.query.id;
        if (typeof userID !== "string") {
            console.error("Invalid userID: " + userID);
            client.disconnect();
            return;
        }
        console.log("userID: " + userID);
        let alive = true;
        let validated = false;
        let worldInfo : HexWorld | undefined = worlds.find(w => w.id === mapID);
        let added = false;

        client.on("disconnect", () => {
            console.log("Disconnected " + userID);
            if (!alive || !validated || !worldInfo || !added) return;
            worldInfo.removeUser(userID);
            client.disconnect();
            worldConnection.emit("user", userID, "exit");
            alive = false;
        });

        let worldPromise = Promise.resolve();
        if (!worldInfo) {
            worldPromise = fs.readFile(dataPath(`${mapID}.json`), 'utf-8')
            .then((data) => {
                if (!alive) return;
                console.log('map read for',mapID);
                worldInfo = worlds.find(w => w.id === mapID);
                if (worldInfo) return; // already done!
                worldInfo = new HexWorld(mapID, new TerrainMap(JSON.parse(data)));
                worlds.push(worldInfo);
                // console.log('worlds now',worlds);
            });
        }
        const userPromise = fs.readFile(dataPath(`${userID}${USER_EXT}`), 'utf-8')
        .then(() => {
            if (!alive) return;
            validated = true;
        });

        Promise.all([worldPromise, userPromise])
        .then(() => {
            if (!alive) return;
            if (!worldInfo) return;
            if (!validated) return;
            const loc = worldInfo.addUser(userID);
            for (const id of worldInfo.getUserIDs()) {
                if (id === userID) continue;
                const otherLoc = worldInfo.getUserLocation(id);
                if (!otherLoc) continue;
                client.emit("user", id, otherLoc);
            }
            worldConnection.emit("user", userID, loc);
            added = true;
            client.on("move", (location:PotentialHexCoordinate) => {
                if (!alive) return;
                if (
                    typeof location !== "object" ||
                    typeof location?.a !== 'number' ||
                    typeof location?.b !== 'number'
                ) {
                    console.log("Invalid location: " + location);
                    client.emit('error', "Invalid location");
                    return;
                }
                const hc = new HexCoordinate(location.a,location.b);
                try {
                    worldInfo?.moveUser(userID, hc);
                } catch (error) {
                    let message : string;
                    if (error instanceof Error) message = error.message
                    else message = String(error)
                    console.log("Failed to move user " + userID + " to " + location);
                    client.emit('error', "Failed to move user: " + message);
                    return;
                }
                worldConnection.emit("user", userID, location);                
            });
            client.on("chat", (message: string) => {
                if (!alive || !validated || !worldInfo || !added) return;

                const result = validateMessage(message);
                if (!result.valid) return;

                worldConnection.emit("chat", userID, message);
            });
            client.on("leave", () => {
                if (!alive || !validated || !worldInfo || !added) return;

                console.log("Leave called for " + userID);

                worldInfo.removeUser(userID);
                worldConnection.emit("user", userID, "exit");

                alive = false;
                client.disconnect();
            });
        })
        .catch((error) => {
            if (!alive) return;
            console.log("Error for user or world: ", error);
            client.disconnect();
            alive = false;
        });
    });
    return { server, worlds };
}
