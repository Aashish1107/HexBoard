/**
 * @jest-environment node
 */

import { HexCoordinate } from '@/src/HexCoordinate';
import { Terrain } from '@/src/Terrain';
import { TerrainMap } from '@/src/TerrainMap';
import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { POST } from './route';
import { GET, PUT, PATCH, DELETE} from './[id]/route';
import { nanoid } from 'nanoid';

let hasFailed = false;
const t = (name: string, fn: () => Promise<void> | void, timeout?: number) => {
    it(name, async () => {
        try { await fn(); } catch (err) { hasFailed = true; throw err; }
    }, timeout);
};

describe('API Route Map Tests', () => {
    //build a map
    let map : TerrainMap;
    const fileid: string = nanoid();
    const testDataDir = 'tmp/testdata';
    beforeAll(async() => {
        //build a map
        map = new TerrainMap();
        const hc = new HexCoordinate(Math.trunc(Math.random() * 10), Math.trunc(Math.random() * 10));
        map.set(hc, Terrain.Water);
        map.set(new HexCoordinate(13,10), Terrain.Glass);

        //set DATA environment variable for hermetic testing
        process.env.DATA = path.join(testDataDir,fileid);
        
        //ensure testdata directory exists
        const fullPath = path.join(process.cwd(), testDataDir, fileid);
        if (!existsSync(fullPath)) {
            mkdirSync(fullPath, { recursive: true });
        }

        // isWhitelisted reads whitelist.txt from the DATA dir — seed it from sample data
        await fs.copyFile(
            path.join(process.cwd(), 'data', 'sample', 'whitelist.txt'),
            path.join(fullPath, 'whitelist.txt')
        );
    });
    
    describe('testing GET /api/map', () => {
        //before
        t("should return 403 if IP not in whitelist",()=>{});
        t("should return 200 OK with an empty list if no terrain maps exist",()=>{});
        t("should return a list of all terrain maps",()=>{});
        //after
    });

    describe('testing POST /api/map', () => {
        //before - nothing required since each test is independent
        t('should return 403 if IP not in whitelist', async() => {
            const request = new Request('http://localhost/api/map', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'x-forwarded-for': '192.168.0.1'
                },
                body: JSON.stringify(map.toJSON())
            });
            const response=await POST(request)
            const data=response.status;
            expect(data).toBe(403);
        });
        t('should accept and return ID/editKey if in whitelist', async () => {
            
            const request = new Request('http://localhost/api/map', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-forwarded-for': 'localhost'
                },
                body: JSON.stringify(map.toJSON())
            });
            const response=await POST(request);
            const data=await response.json();
            expect(response.status).toBe(200);
            expect(data).toHaveProperty('id');
            expect(data).toHaveProperty('editKey');
        });
        t('should return 500 if an error occurs', async() => {
            jest.spyOn(fs, 'writeFile').mockRejectedValueOnce(new Error('Disk full'));
            const request = new Request('http://localhost/api/map', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-forwarded-for': 'localhost'
                },
                body: JSON.stringify(map.toJSON())
            });
            const response = await POST(request);
            expect(response.status).toBe(500);
        });
        //after - nothing required since test environment is cleaned up after all tests run
    });

    describe('testing GET /api/map/:id', () => {
        //before
        let id : string;
        beforeAll(async () => {
            const request = new Request('http://localhost/api/map', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-forwarded-for': 'localhost'
                },
                body: JSON.stringify(map.toJSON())
            });
            const response = await POST(request);
            const data = await response.json();
            id = data.id;
        });
        t('should return 404 if file not found', async () => {
            const fakeId = 'nonexistentid';
            const request = new Request(`http://localhost/api/map/${fakeId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const response = await GET(request, { params: Promise.resolve({ id: fakeId }) });
            expect(response.status).toBe(404);
        });
        t('should retrieve a terrain map by ID with status code 200', async () => {
            const request = new Request(`http://localhost/api/map/${id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const response = await GET(request, { params: Promise.resolve({ id }) });
            const data = await response.json();
            expect(response.status).toBe(200);
            expect(data).toEqual(map.toJSON());

        });
        //after - nothing required since test environment is cleaned up after all tests run
    });
    describe('testing PUT /api/map/:id', () => {
        //before
        let id : string;
        let editKey : string;
        beforeAll(async () => {
            const request = new Request('http://localhost/api/map', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-forwarded-for': 'localhost'
                },
                body: JSON.stringify(map.toJSON())
            });
            const response = await POST(request);
            const data = await response.json();
            id = data.id;
            editKey = data.editKey;
            // Modify the map to be different from the saved one
            map.set(new HexCoordinate(5, 5), Terrain.Shrubbery);
            map.set(new HexCoordinate(-1, -1), Terrain.Wall);
        });

        t('should return 401 if not authenticated', async () => {
            const request = new Request(`http://localhost/api/map/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json', 
                },
                body: JSON.stringify(map.toJSON())
            });
            const response = await PUT(request, { params: Promise.resolve({ id }) });
            expect(response.status).toBe(401);
            const testDataDir = process.env.DATA ?? 'tmp/testdata';
            const fileData = await fs.readFile(path.join(process.cwd(), testDataDir, `${id}.json`), 'utf-8');
            expect(JSON.parse(fileData)).not.toEqual(map.toJSON());
        });
        t('should return 403 if editKey is invalid', async () => {
            const request = new Request(`http://localhost/api/map/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer invalidkey'
                },
                body: JSON.stringify(map.toJSON())
            });
            const response = await PUT(request, { params: Promise.resolve({ id }) });
            expect(response.status).toBe(403);
            const testDataDir = process.env.DATA ?? 'tmp/testdata';
            const fileData = await fs.readFile(path.join(process.cwd(), testDataDir, `${id}.json`), 'utf-8');
            expect(JSON.parse(fileData)).not.toEqual(map.toJSON());
        });
        t('should return 500 if an error occurs', async () => {
            jest.spyOn(fs, 'writeFile').mockRejectedValueOnce(new Error('Disk full'));
            const request = new Request(`http://localhost/api/map/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${editKey}`
                },
                body: JSON.stringify(map.toJSON())
            });
            const response = await PUT(request, { params: Promise.resolve({ id }) });
            expect(response.status).toBe(500);
            const fileData = await fs.readFile(path.join(process.cwd(), testDataDir, fileid, `${id}.json`), 'utf-8');
            expect(JSON.parse(fileData)).not.toEqual(map.toJSON());
        });
        t('should update a terrain map by ID if authenticated and editKey is valid', async () => {
            const request = new Request(`http://localhost/api/map/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${editKey}`
                },
                body: JSON.stringify(map.toJSON())
            });
            const response = await PUT(request, { params: Promise.resolve({ id }) });
            expect(response.status).toBe(200);
            // Verify that the file was updated
            const fileData = await fs.readFile(path.join(process.cwd(), testDataDir, fileid, `${id}.json`), 'utf-8');
            expect(JSON.parse(fileData)).toEqual(map.toJSON());
        });
        //after - nothing required since test environment is cleaned up after all tests run
    });
    describe('testing PATCH /api/map/:id', () => {
        //before
        let id : string;
        let editKey : string;
        beforeAll(async () => {
            const request = new Request('http://localhost/api/map', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-forwarded-for': 'localhost'
                },
                body: JSON.stringify(map.toJSON())
            });
            const response = await POST(request);
            const data = await response.json();
            id = data.id;
            editKey = data.editKey;
            // Modify the map to be different from the saved one
            map.set(new HexCoordinate(3, 3), Terrain.Shrubbery);
            map.set(new HexCoordinate(-2, -2), Terrain.Wall);
        });
        t('should return 401 if not authenticated', async () => {
            const request = new Request(`http://localhost/api/map/${id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json', 
                },
                body: JSON.stringify(map.toJSON())
            });
            const response = await PATCH(request, { params: Promise.resolve({ id }) });
            expect(response.status).toBe(401);
            const fileData = await fs.readFile(path.join(process.cwd(), testDataDir, fileid, `${id}.json`), 'utf-8');
            expect(JSON.parse(fileData)).not.toEqual(map.toJSON());
        });
        t('should return 403 if editKey is invalid', async() => {
            const request = new Request(`http://localhost/api/map/${id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer invalidkey'
                },
                body: JSON.stringify(map.toJSON())
            });
            const response = await PATCH(request, { params: Promise.resolve({ id }) });
            expect(response.status).toBe(403);
            const fileData = await fs.readFile(path.join(process.cwd(), testDataDir, fileid, `${id}.json`), 'utf-8');
            expect(JSON.parse(fileData)).not.toEqual(map.toJSON());
        });
        t('should return 403 if editKey is invalid even for empty JSON', async () => {
            const request = new Request(`http://localhost/api/map/${id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer invalidkey'
                },
                body: JSON.stringify({})
            });
            const response = await PATCH(request, { params: Promise.resolve({ id }) });
            expect(response.status).toBe(403);
            const fileData = await fs.readFile(path.join(process.cwd(), testDataDir, fileid, `${id}.json`), 'utf-8');
            expect(JSON.parse(fileData)).not.toEqual(map.toJSON());
        });
        t('should return 500 if an error occurs', async () => {
            jest.spyOn(fs, 'writeFile').mockRejectedValueOnce(new Error('Disk full'));
            const request = new Request(`http://localhost/api/map/${id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${editKey}`
                },
                body: JSON.stringify(map.toJSON())
            });
            const response = await PATCH(request, { params: Promise.resolve({ id }) });
            expect(response.status).toBe(500);
            const fileData = await fs.readFile(path.join(process.cwd(), testDataDir, fileid, `${id}.json`), 'utf-8');
            expect(JSON.parse(fileData)).not.toEqual(map.toJSON());
        });
        t('Should not write if JSON is empty', async () => {
            const request = new Request(`http://localhost/api/map/${id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${editKey}`
                },
                body: JSON.stringify({})
            });
            const response = await PATCH(request, { params: Promise.resolve({ id }) });
            expect(response.status).toBe(200);
            const fileData = await fs.readFile(path.join(process.cwd(), testDataDir, fileid, `${id}.json`), 'utf-8');
            expect(JSON.parse(fileData)).not.toEqual(map.toJSON());
        });
        t('should update a terrain map by ID if authenticated and editKey is valid', async() => {
            const request = new Request(`http://localhost/api/map/${id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${editKey}`
                },
                body: JSON.stringify(map.toJSON())
            });
            const response = await PATCH(request, { params: Promise.resolve({ id }) });
            expect(response.status).toBe(200);
            const fileData = await fs.readFile(path.join(process.cwd(), testDataDir, fileid, `${id}.json`), 'utf-8');
            expect(JSON.parse(fileData)).toEqual(map.toJSON());
        });
        //after
    });
    describe('testing DELETE /api/map/:id', () => {
        //before
        let id : string;
        let editKey : string;
        beforeAll(async () => {
            const request = new Request('http://localhost/api/map', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-forwarded-for': 'localhost'
                },
                body: JSON.stringify(map.toJSON())
            });
            const response = await POST(request);
            const data = await response.json();
            id = data.id;
            editKey = data.editKey;
        });
        t('should return 401 if not authenticated', async() => {
            const request = new Request(`http://localhost/api/map/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(map.toJSON())
            });
            const response = await DELETE(request, { params: Promise.resolve({ id }) });
            expect(response.status).toBe(401);
            const fileData = await fs.readFile(path.join(process.cwd(), testDataDir, fileid, `${id}.json`), 'utf-8');
            expect(fileData).toBeDefined();
        });
        t('should return 403 if editKey is invalid', async () => {
            const request = new Request(`http://localhost/api/map/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer invalidkey'
                },
                body: JSON.stringify(map.toJSON())
            });
            const response = await DELETE(request, { params: Promise.resolve({ id }) });
            expect(response.status).toBe(403);
            const fileData = await fs.readFile(path.join(process.cwd(), testDataDir, fileid, `${id}.json`), 'utf-8');
            expect(fileData).toBeDefined();
        });
        t('should return 500 if an error occurs', async () => {
            jest.spyOn(fs, 'unlink').mockRejectedValueOnce(new Error('Disk full'));
            const request = new Request(`http://localhost/api/map/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${editKey}`
                },
                body: JSON.stringify(map.toJSON())
            });
            const response = await DELETE(request, { params: Promise.resolve({ id }) });
            expect(response.status).toBe(500);
            const fileData = await fs.readFile(path.join(process.cwd(), testDataDir, fileid, `${id}.json`), 'utf-8');
            expect(fileData).toBeDefined();
        });
        t('should delete a terrain map by ID if authenticated and editKey is valid', async () => {
            const request = new Request(`http://localhost/api/map/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${editKey}`
                },
                body: JSON.stringify(map.toJSON())
            });
            const response = await DELETE(request, { params: Promise.resolve({ id }) });
            expect(response.status).toBe(200);
            const fileData = await fs.readFile(path.join(process.cwd(), testDataDir, fileid, `${id}.json`), 'utf-8').catch(() => undefined);
            expect(fileData).toBeUndefined();
        });
        //after - nothing required since test environment is cleaned up after all tests run
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
            await Promise.all(files.filter(f => f.endsWith('.json') || f.endsWith('.key') || f === 'whitelist.txt').map(f => fs.unlink(path.join(fullPath, f))));
            //delete the folder as well
            await fs.rmdir(fullPath);
        } catch (error) {
            // Directory may not exist if tests failed
            console.error('Error cleaning up test data:', error);
        }
    });
});
