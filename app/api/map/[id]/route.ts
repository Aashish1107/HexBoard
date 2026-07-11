'use server';
import { TerrainMap } from '@/src/TerrainMap';
// This is a server-side route handler for the Next.js API.

import fs from 'node:fs/promises';
import path from 'node:path';

async function getEditKey(id: string) : Promise<string | null> {
    try {
        const dataDir = process.env.DATA ?? 'data';
        const editKey = await fs.readFile(path.resolve(dataDir, `${id}.key`), 'utf-8');
        return editKey;
    } catch (error) {
        console.error('Error reading edit key:', error);
        return null;
    }
}

export async function GET(
    _request: Request, 
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    console.log('GET request for id:', id);
    const dataDir = process.env.DATA ?? 'data';
    try {
        const data = await fs.readFile(path.resolve(dataDir, `${id}.json`), 'utf-8');
        return new Response(data, {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.log('Error reading file:', error);
        return new Response(`File not found`, {
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

export async function PUT(
    request: Request, 
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    console.log('PUT request for id:', id);
    const auth = request.headers.get('Authorization');
     if (auth === null) {
        return new Response(`Authorization header is missing`, {
            status: 401,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
    const editKey = await getEditKey(id);
    if (`Bearer ${editKey}` !== auth) {
        return new Response(`Invalid edit key`, {
            status: 403,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
    const data = await request.json();
    console.log('Data received:', data);
    const dataDir = process.env.DATA ?? 'data';
    try {
        await fs.writeFile(path.resolve(dataDir, `${id}.json`), JSON.stringify(data), 'utf-8');
        return new Response(`File ${id}.json updated successfully`, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
    catch (error) {
        console.error('Error writing file:', error);
        return new Response(`Error writing file`, {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

function isEmptyJSON(json : object) {
    for (const _ in json) {
        return false;
    }
    return true;
}

export async function PATCH(
    request: Request, 
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    console.log('PATCH request for id:', id);
    const auth = request.headers.get('Authorization');
     if (auth === null) {
        return new Response(`Authorization header is missing`, {
            status: 401,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
    const editKey = await getEditKey(id);
    // console.log('INSECURE edit key', editKey);
    if (`Bearer ${editKey}` !== auth) {
        return new Response(`Invalid edit key`, {
            status: 403,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
    const data = await request.json();
    console.log('Data received:', data);
    if (isEmptyJSON(data)) {
        return new Response(`Edit Key Matches`, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
    try {
        const dataDir = process.env.DATA ?? 'data';
        const before = await fs.readFile(path.resolve(dataDir, `${id}.json`), 'utf-8');
        const map = new TerrainMap(JSON.parse(before));
        map.addJSON(data);
        const newData = JSON.stringify(map);
        await fs.writeFile(path.resolve(dataDir, `${id}.json`), newData, 'utf-8');
        return new Response(`File ${id}.json updated successfully`, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
    catch (error) {
        console.error('Error writing file:', error);
        return new Response(`Error writing file`, {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

export async function DELETE(
    request: Request, 
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    console.log('DELETE request for id:', id);
    const auth = request.headers.get('Authorization');
     if (auth === null) {
        return new Response(`Authorization header is missing`, {
            status: 401,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
    const editKey = await getEditKey(id);
    if (`Bearer ${editKey}` !== auth) {
        return new Response(`Invalid edit key`, {
            status: 403,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
    try {
        const dataDir = process.env.DATA ?? 'data';
        await fs.unlink(path.resolve(dataDir, `${id}.json`));
        await fs.unlink(path.resolve(dataDir, `${id}.key`));
        return new Response(`File ${id}.json deleted successfully`, {
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
