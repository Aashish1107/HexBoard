import { Namespace as SocketNamespace } from "socket.io";

export const PORT = 58524;
export const USER_EXT = ".user";

export interface PotentialHexCoordinate {
    a? : unknown;
    b? : unknown;
}

export interface ServerToClientEvents {
    user : (userID:string, coord:PotentialHexCoordinate|'exit') => void;
    error : (mesg:string) => void;
    chat : (userID:string, message:string) => void;
}

export interface ClientToServerEvents {
    move : (coord:PotentialHexCoordinate) => void;
    chat : (message:string) => void;
    leave : () => void;
}

export type InterSocketEvents = object;

export interface SocketData {
    nsp : SocketNamespace;
    handshake : { query : { id:string } };
}