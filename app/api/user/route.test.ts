/**
 * @jest-environment node
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import {GET, PUT, DELETE} from './[id]/route';
import { POST } from './route';
import { nanoid } from 'nanoid';

let hasFailed = false;
const t = (name: string, fn: () => Promise<void> | void, timeout?: number) => {
    it(name, async () => {
        try { await fn(); } catch (err) { hasFailed = true; throw err; }
    }, timeout);
};

describe('API Route User Tests', () => {
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
        const userData = JSON.stringify({ name: 'Jane Doe', avatar: 'jane_doe.jpg' }, null, 2);
        await fs.writeFile(path.join(fullPath, '1.user'), userData, 'utf-8');
    });
    describe('testing GET /api/user/:id', () => {
        //before
        t('should return 400 if ID is not URL-encoded', async() => {
            const invalidID = 'invalid id';
            const request = new Request(`http://localhost/api/user/${invalidID}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const response = await GET(request, { params: Promise.resolve({ id: invalidID }) });
            expect(response.status).toBe(400);
        });
        t('should return 404 if user not found', async() => {
            const request = new Request('http://localhost/api/user/999', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const response = await GET(request, { params: Promise.resolve({ id: '999' }) });
            expect(response.status).toBe(404);
        });
        t('should retrieve a user by ID with status code 200', async() => {
            const request = new Request('http://localhost/api/user/1', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.name).toBe('Jane Doe');
            expect(data.avatar).toBe('jane_doe.jpg');
        });
        //after
    });
    describe('testing POST /api/user', () => {
        //before
        let request : Request;
        beforeAll(async () => {
            //create a user
            request = new Request('http://localhost/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'John Doe', avatar: 'john_doe.jpg', password: 'password' })
            });
        });
        t('should create a new user with valid name, avatar, and password', async() => {
            //post a new user
            const response = await POST(request);
            expect(response.status).toBe(200);
            const data = await response.text();
            const getResponse = await GET(request, { params: Promise.resolve({ id: JSON.parse(data).id }) });
            expect(getResponse.status).toBe(200);
            const getData = await getResponse.json();
            expect(getData.name).toBe('John Doe');
            expect(getData.avatar).toBe('john_doe.jpg');
            expect(getData.password).toBe('password');
        });
        t('should fail to create a user if name is missing', async() => {
            request = new Request('http://localhost/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: '', avatar: 'john_doe.jpg', password: 'password' })
            });
            const response = await POST(request);
            expect(response.status).toBe(401);
        });
        t('should create a new user with default avatar if avatar is missing', async() => {
            request = new Request('http://localhost/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'John Doe', avatar: undefined, password: 'password' })
            });
            const response = await POST(request);
            expect(response.status).toBe(200);
            const data = await response.text();
            const getResponse = await GET(request, { params: Promise.resolve({ id: JSON.parse(data).id }) });
            expect(getResponse.status).toBe(200);
            const getData = await getResponse.json();
            expect(getData.name).toBe('John Doe');
            expect(getData.avatar).toBe('');
            expect(getData.password).toBe('password');
        });
        t('should fail to create a user if password is missing', async() => {
            request = new Request('http://localhost/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'John Doe', avatar: 'john_doe.jpg', password: '' })
            });
            const response = await POST(request);
            expect(response.status).toBe(401);
        });
        t('should return existing user ID if name and avatar match an existing user', async() => {
            request = new Request('http://localhost/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'John Doe', avatar: 'john_doe.jpg', password: 'password' })
            });
            await POST(request); // create the user first
            request = new Request('http://localhost/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'John Doe', avatar: 'john_doe.jpg', password: 'password' })
            });
            const response2 = await POST(request);
            expect(response2.status).toBe(200);
            const data = await response2.text();
            const getResponse = await GET(request, { params: Promise.resolve({ id: JSON.parse(data).id }) });
            expect(getResponse.status).toBe(200);
            const getData = await getResponse.json();
            expect(getData.name).toBe('John Doe');
            expect(getData.avatar).toBe('john_doe.jpg');
            expect(getData.password).toBe('password')
        });
        //after
        afterEach(async () => {
            //delete john doe
            const testDataDir = process.env.DATA ?? 'tmp/testdata';
            const fullPath = path.join(process.cwd(), testDataDir);
            try {
                const files = await fs.readdir(fullPath);
                for (const file of files) {
                    if (file.endsWith('.user')) {
                        const userData = JSON.parse(await fs.readFile(path.join(fullPath, file), 'utf-8'));
                        if (userData.name === 'John Doe' || userData.avatar === 'john_doe.jpg') {
                            await fs.unlink(path.join(fullPath, file));
                            break;
                        }
                    }
                }
            } catch (error) {
                // Directory may not exist or file not found
                console.error('Error cleaning up test user:', error);
            }
        });
    });
    describe('testing PUT /api/user/:id', () => {
        //before
        t('should return 400 if user not found', async() => {
            const request = new Request('http://localhost/api/user/999', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer password123' // assuming this is the correct token for authentication
                },
                body: JSON.stringify({ name: 'Jane Doe', avatar: 'jane_doe.jpg', password: 'password' })
            });
            const response = await PUT(request, { params: Promise.resolve({ id: '999' }) });
            expect(response.status).toBe(400);
        });
        t('should return 401 if not authenticated', async() => {
            const request = new Request('http://localhost/api/user/1', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Jane Doe', avatar: 'jane_doe.jpg' })
            });
            const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
            expect(response.status).toBe(401);
        });
        t('should update a user by ID with status code 200', async() => {
            const request = new Request('http://localhost/api/user/1', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer password123' // assuming this is the correct token for authentication
                },
                body: JSON.stringify({ name: 'Jack Doe', avatar: 'jane_doe.jpg', password: 'newpassword' })
            });
            const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
            expect(response.status).toBe(200);
            const data = await response.json();
            console.log("Data: " + data);
            const getResponse = await GET(request, { params: Promise.resolve({ id: data.id }) });
            expect(getResponse.status).toBe(200);
            const getData = await getResponse.json();
            expect(getData.name).toBe('Jack Doe');
            expect(getData.avatar).toBe('jane_doe.jpg');
            expect(getData.password).toBe('newpassword')
        });
        //after
     });
    describe('testing DELETE /api/user/:id', () => {
        //before
        t('should return 401 if not authenticated', async() => {
            const request = new Request('http://localhost/api/user/1', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
            expect(response.status).toBe(401);
        });
        t('should delete a user by ID with status code 200', async() => {
            const request = new Request('http://localhost/api/user/1', {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer password123' // assuming this is the correct token for authentication
                }
            });
            const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
            expect(response.status).toBe(200);
            //verify user is deleted
            const getResponse = await GET(request, { params: Promise.resolve({ id: '1' }) });
            expect(getResponse.status).toBe(404);
        });
        //after
     });
    afterAll(async () => {
        //clean up test environment
        const testDataDir = process.env.DATA ?? path.join('tmp/testdata', fileid);
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