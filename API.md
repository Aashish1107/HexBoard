# API Documentation

## Overview
API endpoints for the Next.js application using the App Router.

## Base URL
```
http://localhost:3000/api
```

## Future Scope/ Extensions

- A List of extensions/unimplemented features:

### Middle End Extensions

- Building more APIs based on frontend and backend team's extensions.
    - Storing server chats in data/chat.
    - Update and Store Avatar Icons.
    - API to send a list of terrainMaps for the Terrain Drop Down
- Implementing users in the traditional sense.
    - CRUD APIs for User handling, like creating a new user, updating a new user or deleting a user.
    - Organising ./data to hold user info, for ex. ./data/[userId]
- VOIP Implementation
    -Implementation of Voice chats usin VoIP
- Improving Tests and test cases as the project grows with new APIs/ features.
    - ensure middle tests work despite having the app running already
    - better approach for windows than using taskkill node.exe if any.

## Endpoints

### Map API
**`POST /app/api/map`**
- Description: Create map data by generating a map id and editKey
- Body: JSON payload containing empty map data
- Response: Confirmation that map was created providing both a map id and editKey
- Status Codes: 
    - 200: map file was successfully created
    - 403: user's ip not in the whitelist
    - 500: error writing the map file

**`GET /app/api/map/[id]`**
- Description: Retrieve map data with the given map id
- Parameters: id - the nanoid for a map that was generated when it was created
- Response: the original JSON body sent when the map was created
- Status Codes: 
    - 200: map file successfully found and returned
    - 404: map file not found

**`PATCH /app/api/map/[id]`**
- Description: Verifies the editKey provided matches the generated editKey for the map, requires valid editKey
- Parameters: id - the nanoid for a map that was generated when it was created
- Body: empty JSON payload
- Response: Confirmation of a valid editKey
- Status Codes: 
    - 200: valid editKey provided, you can now save the map
    - 401: missing authorization header
    - 403: invalid editKey provided
    - 500: error writing file

**`PUT /app/api/map/[id]`**
- Description: Saves updates made to the map in the stored map file with the given id, requires valid editKey
- Parameters: id - the nanoid for a map that was generated when it was created
- Body: JSON payload containing all of the new map data to replace the old map
- Response: Confirmation of the new map data replacing the old map data
- Status Codes: 
    - 200: the changes made to the map have been successfully saved
    - 401: missing authorization header
    - 403: invalid editKey provided
    - 500: error writing file

**`DELETE /app/api/map/[id]`**
- Description: Deletes the map that has the given id, requires valid editKey
- Parameters: id - the nanoid for a map that was generated when it was created
- Response: Confirmation that the map was successfully deleted
- Status Codes: 
    - 200: the map file was successfully deleted
    - 401: missing authorization header
    - 403: invalid editKey provided
    - 500: error deleting file

### User API
**`POST /app/api/user`**
- Description: Creates a new user if a user with a matching name and avatar doesn't already exist
- Body: JSON payload containing name and avatar
- Response: A user with the given name and avatar is created and given an id, or an existing matching user is returned
- Status Codes: 
    - 200: user file successfully created or a user file with the same name and avatar already exists and is used
    - 500: error creating user

**`GET /app/api/user/[id]`**
- Description: Retrieve the user with the given user id
- Parameters: id - the nanoid for a user that was generated when it was created
- Response: the original JSON body sent when the user was created
- Status Codes: 
    - 200: user file successfully found and returned
    - 400: invalid id
    - 404: id not found

## Error Handling
All error responses are returned as plain text with the corresponding status code.
- `Invalid ID` - 400 (GET /user)
- `Authorization header is missing` - 401 (PUT, PATCH, DELETE /map)
- `Invalid edit key` - 403 (PUT, PATCH, DELETE /map)
- `IP not in whitelist` - 403 (POST /map)
- `File not found` - 404 (GET /map)
- `User ID not found`- 404 (GET /user)
- `Error writing file` - 500 (PUT, PATCH /map)
- `Error deleting file` - 500 (DELETE /map)
- `Error creating user` - 500 (POST /user)

### Authentication API
**`POST /app/api/auth`**
- Description: Receives user credentials, verifies them, and returns the corresponding user id
- Body: JSON payload containing name and password
- Response: a nanoid corresponding to the user with the matching name and password
- Status Codes:
    - 200: credential verification successful
    - 401: invalid user credentials 
    - 500: error verifying credentials

### User API Updates
**`POST /app/api/user`**
- Description: Creates a new user if a user with a matching name and avatar doesn't already exist
- Body: JSON payload containing name, avatar, and password
- Response: A user with the given name, avatar, and password is created and given an id
    - 200: user file successfully created
    - 401: invalid username or password
    - 500: error creating user

**`PUT /app/api/user/[id]`**
- Description: Updates the name, avatar, or password of the user with the given id
- Parameters: id - the nanoid for a user that was generated when it was created
- Body: JSON Payload containing the user fields that were changed 
- Response: Confirmation that the correct user fields were updated
- Status Codes: 
    - 200: the changes made to the user have been successfully saved
    - 400: invalid new name, password, or avatar 
    - 401: missing authorization header
    - 500: error updating user

**`DELETE /app/api/user/[id]`**
- Description: Deletes the user that has the given id
- Parameters: id - the nanoid for a user that was generated when it was created
- Response: Confirmation that the user was deleted
- Status Codes: 
    - 200: the user was successfully deleted
    - 401: missing authorization header
    - 500: error deleting user

### Avatar API (Mostly will be implemented within User API, depending on how the jpg file is handled)
**`GET /app/api/avatar/[id]`**
- Description: gets the avatar for the user of the given id
- Parameters: id - the nanoid for a user that was generated when it was created
- Response: A JSON Payload containing the link to the avatar stored with the user
- Status Codes:
    - 200: the user's avatar was successfully retrieved
    - 401: missing authorization header
    - 500: error retrieving the user's avatar

**`PUT /app/api/avatar/[id]`**
- Description: updates the avatar for the user of the given id
- Parameters: id - the nanoid for a user that was generated when it was created
- Body: A JSON Payload containing the link for what the user wants to change their avatar to
- Response: Confirmation that the user's avatar was updated
- Status Codes:
    - 200: The user's avatar was successfully updated
    - 400: Invalid avatar link provided
    - 401: missing authorization header
    - 500: error updating the user's avatar

**`DELETE /app/api/avatar/[id]`**
- Description: deletes the avatar and replaces it with the default for the user of the given id
- Parameters: id - the nanoid for a user that was generated when it was created
- Response: Confirmation that the user's avatar was deleted
- Status Codes:
    - 200: The user's avatar was successfully deleted
    - 401: missing authorization header
    - 500: error deleting the the user's avatar

