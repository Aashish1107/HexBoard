# Backend Socket.IO API Documentation

## Overview

This document describes the developer-level API for the backend Socket.IO server used in the HexWorld project.

The backend server manages real-time communication between clients connected to the same hex world using Socket.IO. Each world is represented by a namespace, and the server keeps track of connected users and their locations within that world.

The backend handles user connections, movement updates, and broadcasting events to other users in the same world.

Default backend port: 58524

---

## Socket Events Summary

| Direction | Event | Description |
|----------|------|-------------|
| Client → Server | move | Request movement to a new hex coordinate |
| Server → Client | user | Notifies clients when a user joins, moves, or exits |
| Server → Client | error | Sent when the server rejects a client request |

### Planned Extension Events

| Direction | Event | Description |
|----------|------|-------------|
| Client → Server | chat | Send a text message to users in the same world |
| Server → Client | chat | Broadcast chat message to all clients |
| Client → Server | leave | User intentionally leaves the world |
| Client → Server | avatarUpdate | Notify server that a user avatar has changed |
| Server → Client | avatarUpdate | Broadcast updated avatar information |

---

## Connection

A client connects to a namespace representing a world and must provide a user ID in the connection query.

### Required query parameter

- `id : string` — user identifier

If the user ID is invalid, the server disconnects the client.

---

## Client → Server Events

### `move`

Requests movement to a new coordinate in the hex world.

#### Parameter:

- `coord : {a:number , b:number}`
   The destination hex coordinate.

Example valid payload:

`move({ a: 2, b: 3 })`

#### Server response

`user(userID, coord)`

#### Errors

`error("Invalid location")`

`error("Failed to move user: <reason>")`

Possible failure reasons include:

- user is not in the world
- coordinate is already occupied
- coordinate is not open

---

## Server → Client Events

### `user`

Notifies clients about user updates in a world.

This event is used when:

- a user joins the world
- a user moves
- a user leaves or disconnects

#### Parameters

- `userID : string`
- `coord : {a:number, b:number} | "exit"`

Examples:

`user("alice", { a: 2, b: 3 })`

`user("alice", "exit")`

---

### `error`

Sent when the server rejects a client request.

#### Parameter

- `mesg : string`

Examples:

`error("Invalid location")`

`error("Failed to move user: Coordinate is not open")`

---

### User Disconnect

When a client disconnects:

1. the user is removed from the world using `removeUser(userID)`
2. the server broadcasts:

`user(userID, "exit")`

to all connected clients in the same namespace

---

## Planned Extensions

The following features are proposed extensions for future milestones. These features are not yet implemented but describe how the backend Socket.IO will support them.

### 1. Text Chat

Users in the same world will be able to send real-time text messages to each other.

**Client → Server**

chat(message: string)

#### Parameters

- `message : string`
  The text message sent by the user.

**Server → Clients**

chat(userID: string, message: string)

#### Parameters

- `userID : string`
  The sender of the message.
- `message : string`
  The chat message.

---

### 2. Leave Event

Currently users leave only when the socket disconnects. This extension introduces an explicit event allowing a user to leave the world intentionally.

**Client → Server**

leave()

**Server → Clients**

user(userID, "exit")

This allows clients to update the interface immediately when a user leaves the world.

---

### 3. Avatar Update

Avatar image storage will be handled by the middle-end server. The backend will support broadcasting avatar updates to connected clients.

**Client → Server**

avatarUpdate(avatarURL: string)

#### Parameter

- `avatarURL : string`
  A reference to the stored avatar image.

**Server → Clients**

avatarUpdate(userID: string, avatarURL: string)

#### Parameters

- `userID : string`
  The user whose avatar was updated.
- `avatarURL : string`
  The avatar image reference.
