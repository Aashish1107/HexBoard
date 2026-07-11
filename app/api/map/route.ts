'use server';

import fs from 'node:fs/promises';
import path from 'node:path';
import { requestIP } from '@/src/requestIP';
import { nanoid } from 'nanoid';
import { isWhitelisted } from '@/lib/isWhitelisted';

export async function POST(request: Request) {
    const ip = requestIP(request);
    console.log('POST request from IP:', ip);
    const Inwhitelist = await isWhitelisted(ip);
    if (!Inwhitelist) {
        return new Response(`IP ${ip} not in whitelist`, {
            status: 403,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
    const data = await request.json();
    console.log('Data received:', data);
    const id = nanoid();
    const editKey = nanoid();
    const dataDir = process.env.DATA ?? 'data';
    try {
        await fs.writeFile(path.resolve(dataDir, `${id}.json`), JSON.stringify(data, null, 2), 'utf-8');
        await fs.writeFile(path.resolve(dataDir, `${id}.key`), editKey, 'utf-8');
        return new Response(`{ "id": "${id}", "editKey": "${editKey}" }`, {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error writing file:', error);
        return new Response(`Error writing file`, {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}
