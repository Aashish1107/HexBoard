import fs from 'node:fs/promises';
import path from 'node:path';
import { USER_EXT } from '@/src/network';

interface RawUser {
    name?:string;
    avatar?:string;
    password?:string;
}

const MAX_LENGTH = 255;

export async function GET(
    _request: Request, 
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    console.log('GET request for user id:', id);
    if (id !== encodeURIComponent(id)) {
        return new Response(`Invalid ID`, {
            status: 400,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
    const dataDir = process.env.DATA ?? 'data';
    try {
        const data = await fs.readFile(path.resolve(dataDir, `${id}${USER_EXT}`), 'utf-8');
        return new Response(data, {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.log('Error reading file:', error);
        return new Response(`User ID not found`, {
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

export async function PUT(
    request: Request, 
    {params}: {params: Promise<{ id: string }>}
) {
    const id = (await params).id;
    console.log('PUT request for user id:', id);

    const auth = request.headers.get('Authorization');
        if (auth === null) {
        return new Response(`Authorization header is missing`, {
            status: 401,
            headers: { 'Content-Type': 'text/plain' }
        });
    }

    //look for a matching id
    const dataDir = process.env.DATA ?? 'data';
    try{
        await fs.readFile(path.resolve(dataDir, `${id}${USER_EXT}`), 'utf-8');
    } catch {
        return new Response(`Invalid ID`, {
            status: 400,
            headers: { 'Content-Type': 'text/plain' }
        });
    }

    try{
        //do all of the same validation for each field as is done in POST
        const data = await request.json() as RawUser;
        let { name, avatar, password } = data; //could generate an error is not an object
        if (name) name = name.trim(); // remove spaces
        if (password) password = password.trim();


        //verify we have a valid username and password
        if (!name || !password){
            return new Response(`Invalid username or password`, {
                status: 500,
                headers: { 'Content-Type': 'text/plain' }
            });
        } 
            
        //if no avatar is entered then make the avatar blank
        if (avatar === undefined) avatar = '';


        // make sure someone doesn't dump something huge.
        if (name.length > MAX_LENGTH) name = name.substring(0, MAX_LENGTH);
        if (avatar.length > MAX_LENGTH) avatar = avatar.substring(0, MAX_LENGTH);

        //
        await fs.writeFile(path.resolve(dataDir, `${id}${USER_EXT}`), JSON.stringify({name, avatar, password}, null, 2), 'utf-8');
        return new Response(`{ "id": "${id}" }`, {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch(error){
        console.error('Error updating file:', error);
        return new Response(`Error updating user`, {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
};

export async function DELETE(
    request: Request, 
    {params}: {params: Promise<{ id: string }>}
) {
    //get the id of the user we want to delete from params
    const id = (await params).id;
    console.log('DELETE request for id:', id);

    //check for authorization header
    const auth = request.headers.get('Authorization');
        if (auth === null) {
        return new Response(`Authorization header is missing`, {
            status: 401,
            headers: { 'Content-Type': 'text/plain' }
        });
    }

    //try to delete the user file from the file system
    const dataDir = process.env.DATA ?? 'data';
    try {
        await fs.unlink(path.resolve(dataDir, `${id}.user`));
        return new Response(`File ${id}.user deleted successfully`, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
        });
    } catch (error) {
        console.error('Error deleting file:', error);
        return new Response(`Error deleting file`, {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}
