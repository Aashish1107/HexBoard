/**
 * @jest-environment node
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { POST, GET, DELETE } from "./route";
import { cookies } from 'next/headers';
import { GET as getUserById } from '../user/[id]/route';
import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';

let hasFailed = false;
const t = (name: string, fn: () => Promise<void> | void, timeout?: number) => {
    it(name, async () => {
        try { await fn(); } catch (err) { hasFailed = true; throw err; }
    }, timeout);
};

describe('API Route Auth Tests', () => {
    const fileid=nanoid();
    const testDataDir = 'tmp/testdata';
    beforeAll(async () => {
        //set DATA environment variable for hermetic testing
        process.env.DATA = path.join(testDataDir, fileid);
        
        //ensure testdata directory exists
        const fullPath = path.join(process.cwd(), testDataDir, fileid);
        if (!existsSync(fullPath)) {
            mkdirSync(fullPath, { recursive: true });
        }

        //create a user Jane Doe for testing as 1.user
        const userData = JSON.stringify({ name: 'Jane Doe', avatar: 'jane_doe.jpg', password: 'password' }, null, 2);
        await fs.writeFile(path.join(fullPath, '1.user'), userData, 'utf-8');
    });
    describe('testing POST /api/auth', () => {
        //before, create a request for a valid login
        let request : NextRequest;
        beforeAll(async () => {
            //create a request for a valid login
            request = new NextRequest('http://localhost/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Jane Doe', password: 'password' })
            });
        });
        t('should return 200 OK with a token if username and password are correct', async () => {
            const response = await POST(request)
            expect(response.status).toBe(200)
            const data = await response.json();
            //use the returned nanoid to get the user, test the nanoid returned is correct by testing if user is correct
            const getResponse = await getUserById(new Request(`http://localhost/api/user/${data.id}`), { params: Promise.resolve({ id: data.id }) })
            expect(getResponse.status).toBe(200)
            const getData = await getResponse.json()
            expect(getData.name).toBe('Jane Doe');
            expect(getData.avatar).toBe('jane_doe.jpg');
        });
        t('should return 500 if request body is missing', async () => {
            request = new NextRequest('http://localhost/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const response = await POST(request)
            expect(response.status).toBe(500)
        });
        t('should return 401 if username is missing', async () => {
            request = new NextRequest('http://localhost/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: '', password: 'password' })
            });
            const response = await POST(request)
            expect(response.status).toBe(401)
        });
        t('should return 401 if password is missing', async () => {
            request = new NextRequest('http://localhost/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Jane Doe', password: '' })
            });
            const response = await POST(request)
            expect(response.status).toBe(401)
        });
        t('should return 500 if there is any other error during authentication', async () => {
            jest.spyOn(fs, 'readFile').mockRejectedValueOnce(new Error('Disk error'));
            const response = await POST(request);
            expect(response.status).toBe(500);
        });
        //after
    });
    describe('testing GET /api/auth', () => {
        t('should return 401 when no session cookie is present', async () => {
            (cookies as jest.Mock).mockResolvedValueOnce({
                get: jest.fn().mockReturnValue(undefined),
                set: jest.fn(),
                delete: jest.fn(),
            });
            const response = await GET(new NextRequest('http://localhost/api/auth', { method: 'GET' }));
            expect(response.status).toBe(401);
        });

        t('should return 200 with userId when a valid session cookie is present', async () => {
            (cookies as jest.Mock).mockResolvedValueOnce({
                get: jest.fn().mockReturnValue({ value: 'mock-token' }),
                set: jest.fn(),
                delete: jest.fn(),
            });
            const response = await GET(new NextRequest('http://localhost/api/auth', { method: 'GET' }));
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('userId');
        });
    });

    describe('testing DELETE /api/auth', () => {
        t('should return 200 and delete the session cookie', async () => {
            const mockDelete = jest.fn();
            (cookies as jest.Mock).mockResolvedValueOnce({
                get: jest.fn(),
                set: jest.fn(),
                delete: mockDelete,
            });
            const response = await DELETE(new NextRequest('http://localhost/api/auth', { method: 'DELETE' }));
            expect(response.status).toBe(200);
            expect(mockDelete).toHaveBeenCalledWith('session');
        });

        t('should return 200 even when no session cookie exists (idempotent)', async () => {
            const mockDelete = jest.fn();
            (cookies as jest.Mock).mockResolvedValueOnce({
                get: jest.fn().mockReturnValue(undefined),
                set: jest.fn(),
                delete: mockDelete,
            });
            const response = await DELETE(new NextRequest('http://localhost/api/auth', { method: 'DELETE' }));
            expect(response.status).toBe(200);
            expect(mockDelete).toHaveBeenCalledWith('session');
        });
    });

    afterAll(async () => {
        //clean up test environment
        const testDataDir = process.env.DATA ?? path.join('tmp/testdata',fileid);
        const fullPath = path.join(process.cwd(), testDataDir);
        if (hasFailed || process.env.SKIP_CLEANUP === '1') {
            console.log(`Test data preserved at: ${fullPath}`);
            return;
        }
        try {
            const files = await fs.readdir(fullPath);
            await Promise.all(files.filter(f => f.endsWith('.user') || f.endsWith('.jpg')).map(f => fs.unlink(path.join(fullPath, f))));
            //Delete the folder as well
            await fs.rmdir(fullPath);
        } catch (error) {
            // Directory may not exist if tests failed
            console.error('Error cleaning up test data:', error);
        }
    });
});