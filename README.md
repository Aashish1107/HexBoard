# HexBoard Node.JS web application

HexBoard is a Next.js + Chakra UI client for creating, editing, and visiting collaborative hex-map "meeting spaces". It pairs with a Socket.IO game server in the server/ folder to broadcast avatar movements and other realtime events.

- Root project: Next.js UI and API routes.
- Server project: Socket.IO server inside `server/`. This must be started before the root project for realtime features to work.

## What’s in this repo

- Next.js App Router UI with the following main routes:
  - / (Home): entry point that routes users into onboarding (guest vs create account) and provides shortcuts to create/enter/edit spaces.
  - /create-account: create a user account (front-end only; no backend auth integration yet).
  - /guest: guest access onboarding (front-end only).
  - /editor: edit a map and save changes with an edit key.
  - /visit: join a map with a user id and move around in real time.
- Socket server in server/ using Socket.IO for live movement updates.

## Table of Contents
* [HexBoard](#hexboard-nodejs-web-application)
* [What's in this Repo](#whats-in-this-repo)
* [Table of Contents](#table-of-contents)
* [Versions](#versions)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Run Order](#run-order-required)
* [Root Project Scripts](#root-project-scripts-nextjs)
* [Tests](#tests)
* [Server Project Scripts](#server-project-scripts-socketio)
* [Notes](#notes)
* [Front-End Behaviour](#front-end-behavior)
  * [Pages](#pages)
  * [Real-Time Interactions](#real-time-interactions)
  * [Data Persistence](#data-persistence)
* [Backend Architecture](#backend-architecture)
  * [Responsibilities](#responsibilities)
  * [Backend Structure](#backend-structure)
  * [Data & Shared Logic](#data-and-shared-logic)
  * [Data Persistance](#data-persistence)
  * [Running Backend Tests](#running-backend-tests)
* [Backend Code Style](#backend-code-style-eslint)
* [Styling enforced by Eslint](#eslint-styling-enforced)
  * [Rules](#rules)
  * [Custom Rules](#custom-rules)
* [Future Scope](#future-scope-extensions)
  * [Middle End Extensions](#middle-end-extensions)
* [Troubleshooting](#troubleshooting)
* [Contribution](#contribution)
* [Known Issues](#known-issues)
* [Find a bug?](#find-a-bug)

## Versions

- Next.js: 16.1.6
- React: 19.2.4 (atleast React 19 recommended, minimum React 18.2.0)
- TypeScript: 5.1.0+

## Prerequisites

- Node.js 20.9.0+ recommended
- npm 10.1.0+ recommended

## Installation

- clone the repository
- execute npm ci in the repo root directory:
  ```sh
  npm ci
  ```
- execute npm run init in ./server to access shared files:
  ```sh
  cd server
  npm run init
  ```
- execute npm ci in ./server:
  ```sh
  cd server
  npm ci
  ```
- To start a server:
  ```sh
  npm run build
  npm start
  ```
- To run in Development:
  ```sh
  npm run dev
  ```

## Run Order (Required)

- Start the Socket.IO server (in `server/`).

```bash
cd server
npm run start
```

- Start the Next.js app (in the repo root).

```bash
npm run dev
```

Then open <http://localhost:3000>.

## Root Project Scripts (Next.js)

Run these from the repo root:

- `npm run dev` - Start the Next.js dev server.
- `npm run build` - Build the production app.
- `npm run start` - Start the production server after build.
- `npm run lint` - Run linting.
- `npm run test` - Run Jest tests.
- `npm run test:ci` - Run Jest in CI mode.
- `npm run clean` - Clear the contents of the `tmp/` folder.

## Tests
Front-end onboarding + validation behavior is covered by Jest tests for Home, Create Account, and Guest page rendering.

Root tests (API route unit tests and client utilities):

```bash
npm run start
```

Server tests:

 ```bash
cd server
npm run test
```

Jest Tests: (in root directory):
```sh
npm test
```

Test Routes:
```sh
cd cmd
sh test-routes.sh
```
(For Windows, Use WSL or git bash to run this command).

## Server Project Scripts (Socket.IO)

Run these from the `server/` folder:

- `npm run init` - Copy client source files into `server/src/client`.
- `npm run build` - Build the server TypeScript.
- `npm run clean` - Clean build outputs.
- `npm run test` - Run Jest tests for the server.
- `npm run lint` - Run ESLint.
- `npm run start` - Build and start the server.
- `npm run stop` - Stop the server (kills port 58524).
- `npm run setup-link` - Configure local linking helper for the server.

## Notes

- The Socket.IO server reads map and user data from the shared data/ directory.
- API routes are implemented under app/api/.

## Front-End Behavior

### Pages

- **Home Page (/)**: Landing page where users can:
  - Choose an onboarding path (Guest vs Create Account)
  - Create a new map/meeting space
  - Enter an existing space by ID
  - Access the map editor
  - View recently visited spaces
  - Provide a password (UI only; no backend authentication yet)

- **Create Account Page (/create-account)**: User onboarding page where users can:
  - Enter a name and password
  - Confirm password with a "Verify Password" input
  - Create account remains disabled until both password fields are non-empty and match
  - Shows Passwords must match in red when the password fields do not match

  Note: This is currently front-end only. There is no backend account creation/auth integration yet.

- **Guest Access Page (/guest)**: Guest onboarding page where users can:
  - Continue without creating an account (front-end only)

- **Editor Page (/editor)**: Map creation and editing interface:
  - Terrain type selection
  - Hex grid placement and modification
  - Save/load map functionality
  - Requires edit key for modifications
  - Real-time preview of changes

- **Visit Page (/visit)**: Interactive meeting space:
  - Avatar movement using arrow keys
  - Real-time user presence indicators
  - Chat functionality (if implemented)
  - Terrain-based movement rules
  - Collaborative space with multiple concurrent users

### Real-Time Interactions

- **Avatar Movement**: Updates broadcast via Socket.IO
- **User Presence**: Join/leave events shown to all participants
- **Map Updates**: Changes propagate to all connected clients
- **Connection Status**: Visual indicators for connection state

### Data Persistence

- Maps stored in JSON format in the shared data directory
- User profiles maintained across sessions
- Edit keys required for map modifications

## Backend Architecture

The backend implements the real-time game server for the SP26 HexWorld project.  
It manages multiplayer world state, user sessions, and real-time communication using Socket.IO.

### Responsibilities

The backend is responsible for:

- Managing multiple game worlds
- Tracking user positions on a hex grid
- Validating user movement based on terrain and movement rules
- Broadcasting real-time updates to all connected clients
- Handling client connections and disconnections
- Enforcing map edit permissions using edit keys

---

### Backend Structure

The backend code is primarily located in the `server/` directory.

#### `server/` – Backend Server

This directory contains the Socket.IO server implementation and related logic.

#### `server/src/` – Main Server Source

Key files include:

- `start.ts`  
  Entry point for the backend server.  
  Initializes the HTTP server and Socket.IO instance.

- `hexserver.ts`  
  Handles all Socket.IO logic including:
  - Client connections
  - Disconnections
  - User validation
  - Movement and presence events
  - Broadcasting updates

- `HexWorld.ts`  
  Contains the core world logic.  
  Tracks users, manages world state, and enforces movement rules within the hex grid.

- `*.test.ts`  
  Automated Jest tests for backend server logic and world behavior.

---

### Data and Shared Logic

#### Shared Domain Logic (`src/` root level)

The root-level `src/` directory contains shared domain logic and utilities used by both the frontend (Next.js app) and the backend (Socket.IO server).  
Keeping these files shared ensures consistent behavior across the entire system.

Key modules include:

- `HexCoordinate.ts`  
  Implements hex grid coordinate calculations and neighbor logic.

- `HexDirection.ts`  
  Defines valid movement directions within the hex grid.

- `Terrain.ts`  
  Defines terrain types and related movement rules.

- `TerrainMap.ts`  
  Represents the hex map structure and terrain layout.

- `TerrainMapCommand.ts`  
  Encapsulates commands for modifying terrain maps.

- `TerrainMapEditor.ts`  
  Provides editing utilities for modifying map data.

- `Points.ts`  
  Utility functions for coordinate and distance calculations.

- `network.ts`  
  Shared network-related types and event definitions.

- `readFile.ts`  
  Utility for reading shared data files.

- `requestIP.ts`  
  Handles IP validation logic for API requests.

Test files (`*.test.ts`) validate the correctness of shared logic but are not required for running the application.

---

### Data Persistence (`data/`)

- Map and user data are stored as JSON files inside the shared `data/` directory.
- The backend reads these files at runtime for persistence and validation.

### Building and Running the Backend Server

All commands must be run inside the `server/` directory.

1. Install Dependencies (Exact Versions)

```bash
cd server
npm ci
```
2. Initialize Shared Client Files (Required Before Build)

```bash
npm run init
```
Copies shared domain files from the root `src/` directory into `server/src/client/`.  

3. Build the Server

```bash
npm run build
```

4. Start the Server

```bash
npm run start
```

### Running Backend Tests

All backend tests should be run from inside the `server/` directory:

```bash
cd server
npm run test
```
## Backend Code Style (ESLint)

The backend server uses ESLint to maintain consistent code style and improve overall code quality.

### Configuration

The backend ESLint configuration includes:

- `eslint:recommended`
- `plugin:@typescript-eslint/recommended`
- `@typescript-eslint/parser`

The environment is configured for:
- Node.js
- Jest (testing)

### Important Rules

- Unused variables are not allowed (`@typescript-eslint/no-unused-vars`)
- Variables that are intentionally unused must start with `_`
- TypeScript recommended rules are enforced
- General JavaScript best practices are followed

### Development Workflow

Before committing or pushing backend changes, run:

```bash
cd server
npm run lint
```
Backend code should pass linting before being pushed.

## ESLint Styling Enforced

ESLint is configured to enforce code style consistency across the project. The configuration follows the [Next.js ESLint recommended preset](https://nextjs.org/docs/app/building-your-application/configuring/eslint) with custom rules tailored to this project's needs.

Configuration files:

- `eslint.config.mjs` – Root project ESLint rules

Run linting from the repo root:

```sh
npm run lint
```

Note: All code must pass ESLint checks before contributing.

### Rules:

- nextVitals rules from eslint-config-next/core-web-vitals
- nextTs rules from eslint-config-next/typescript

### Custom Rules:

- No unused Vars except variable names that start with '_'.

## Future Scope/ Extensions

- A List of extensions/unimplemented features:

### Front End Extensions

- Using the mouse with left click to drag and move the map around (visitor and editor page) 
- Zoom in/out with mouse scroll wheel (visitor and editor page).
- Terrain legend button – a drop-down menu style (visitor page).
- Light/Dark toggle button (all pages).
- Back button (visitor and editor).
- Leavebutton (visitor).
- (Unimplemented) Relocating the visual directional arrow buttons (visitor page).
- Text Chat (visitor page).

- User Account Related:
  - Guest User access page and button.
  - New User creation page and button.

### Middle End Extensions

- Building more APIs based on frontend team's extensions.
- Organising Storage management.
- Implementing users in the traditional sense.
- VOIP Implementation
- Improving Tests and test cases

## Troubleshooting

- Socket.IO server not responding: Ensure you started the server in `server/` before running the root app.
- Port already in use (58524): Run `npm run stop` inside `server/`, then restart.
- Server build errors after repo changes: Run `npm run clean` then `npm run start` in `server/`.
- Client build errors referencing server client files: Run `npm run init` to refresh `server/src/client`.
- Lint/test failures after dependency updates: Remove `node_modules` and reinstall in both projects.

## Contribution

- Suggested to make branches in thier respective forks, pull requests are to be reviewed.
- Only Students in CompSci-736 will be able to contribute to this project.

## Known Issues

- UI needs work
- Can see people outside the plane

## Find a bug?

- If a bug is found, Please contact John Boyland at CEAS in UWM or the respective team responsible for those files consisting of the bug.

