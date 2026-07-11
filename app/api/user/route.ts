'use server';

import fs from 'node:fs/promises';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { USER_EXT } from '@/src/network';

interface RawUser {
    name?: string;
    avatar?: string;
    password?: string;
}

const MAX_LENGTH = 255;

export async function POST(request: Request) {
    const data = await request.json() as RawUser;
    console.log('Data received:', data);
    const id = nanoid();
    try {
        let { name, avatar, password } = data; //could generate an error is not an object
        if (name) name = name.trim(); // remove spaces
        if (password) password = password.trim();


        //verify we have a valid username and password
        if (!name || !password) {
            return new Response(`Invalid username or password`, {
                status: 401,
                headers: { 'Content-Type': 'text/plain' }
            });
        }

        //if no avatar is entered then make the avatar blank
        if (avatar === undefined) avatar = '';


        // make sure someone doesn't dump something huge.
        if (name.length > MAX_LENGTH) name = name.substring(0, MAX_LENGTH);
        if (avatar.length > MAX_LENGTH) avatar = avatar.substring(0, MAX_LENGTH);

        // This is slow, and gets slower if many are created,
        // but we want to permit anytone to do this and don't want lots of duplicates.
        const dataDir = process.env.DATA ?? 'data';
        const filenames = await fs.readdir(path.resolve(dataDir));
        for (const filename of filenames) {
            console.log('Checking', filename);
            if (filename.endsWith(USER_EXT)) {
                console.log('rght extension')
                const userJSON = JSON.parse(await fs.readFile(path.resolve(dataDir, filename), 'utf-8')) as RawUser;
                if (userJSON.name === name && userJSON.avatar === avatar) {
                    const existingID = filename.substring(0, filename.length - USER_EXT.length);
                    return new Response(`{ "id": "${existingID}"}`, {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }
        }

        //try to create the user file
        //worth noting password is currently just stored as plaintext, might want to change this in the future
        await fs.writeFile(path.resolve(dataDir, `${id}${USER_EXT}`), JSON.stringify({ name, avatar, password }, null, 2), 'utf-8');
        return new Response(`{ "id": "${id}" }`, {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.log('Error creating user:', error);
        return new Response(`Error creating user`, {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}