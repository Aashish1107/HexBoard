'use server'

import { promises as fs } from "fs";
import path from "path";
import { USER_EXT } from '@/src/network';
import { nanoid } from "nanoid";
type RawUser = {
    name: string;
    password: string;
};


/**
 * Verifies a username and password combination against stored user data.
 * If registration is requested and the user does not exist, creates a new user entry.
 * 
 * @param username - The username to verify or register.
 * @param password - The password to verify or register.
 * @param register - Optional flag indicating whether to register a new user if not found. Can be a boolean or a Response object.
 * @returns A Promise that resolves to a Response object with user ID on success/failure (registration), true/false for verification(login)
 */
export async function VerifyUsernameAndPass(username: string, password: string, register?: boolean | Response): Promise<boolean | Response> {

    //check if username and password are valid (e.g., not empty, meet criteria)
    if (!username || !password) {
        return false;
    }
    //check if username and password meet criteria (e.g., length, character requirements)
    //check if username already exists in DB)
    const id: string = nanoid();
    let userExists = false;
    const dataDir = process.env.DATA ?? 'data';
    const dirEntries = await fs.readdir(path.resolve(dataDir), { withFileTypes: true });
    for (const entry of dirEntries) {
        if (!entry.isFile() || !entry.name.endsWith(USER_EXT)) continue;

        const userJSON = JSON.parse(
            await fs.readFile(path.resolve(dataDir, entry.name), "utf8")
        ) as RawUser;
        if (userJSON.name === username) userExists = true;
        if (userJSON.name === username && userJSON.password === password) {
            const existingID = entry.name.slice(0, -USER_EXT.length);
            return new Response(JSON.stringify({ id: existingID }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }
    }
    //if yes, return true
    if (register) {
        if (userExists) {
            return new Response(`User already exists`, {
                status: 400,
                headers: { 'Content-Type': 'text/plain' }
            });
        }
        try {
            await fs.writeFile(path.resolve(dataDir, `${id}${USER_EXT}`), JSON.stringify({ name: username, password }, null, 2), 'utf-8');
            return new Response(`{ "id": "${id}" }`, {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        catch (error) {
            console.log('Error creating user:', error);
            return new Response(`Error creating user`, {
                status: 500,
                headers: { 'Content-Type': 'text/plain' }
            });
        }
    }
    else
        return false;
}