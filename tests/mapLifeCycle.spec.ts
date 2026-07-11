import { test, expect } from '@playwright/test';
import { HexCoordinate } from 'server/src/client/HexCoordinate';
import { Terrain } from 'server/src/client/Terrain';
import { TerrainMap } from 'server/src/client/TerrainMap';
import path from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import fs from 'node:fs/promises';

// DATA is set by playwright.config.ts before the server and workers start,
// so both the Next.js server process and this test worker share the same sandbox dir.
let hasFailed = false;

// This is an HTTP API test — it doesn't exercise any browser-specific behaviour.
// Restricting setup/teardown and the test itself to chromium prevents three workers
// from racing to create and delete the same sandbox directory.
test.beforeAll(async ({ browserName }) => {
  if (browserName !== 'chromium') return;
  const dataDir = process.env.DATA;
  if (!dataDir) throw new Error('DATA env var not set — check playwright.config.ts');
  const fullPath = path.join(process.cwd(), dataDir);
  if (!existsSync(fullPath)) {
    mkdirSync(fullPath, { recursive: true });
  }
  const whitelistSrc = path.join(process.cwd(), 'data', 'sample', 'whitelist.txt');
  await fs.copyFile(whitelistSrc, path.join(fullPath, 'whitelist.txt'));
  await fs.copyFile(whitelistSrc, path.join(process.cwd(), path.dirname(dataDir), 'whitelist.txt'));
});

test.beforeEach(async ({ browserName }) => {
  test.skip(browserName !== 'chromium', 'HTTP API test — only needs one browser');
});

test.afterEach(async ({}, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    hasFailed = true;
  }
});

test.afterAll(async ({ browserName }) => {
  if (browserName !== 'chromium') return;
  const dataDir = process.env.DATA;
  if (!dataDir) return;
  const fullPath = path.join(process.cwd(), dataDir);
  if (hasFailed || process.env.SKIP_CLEANUP === '1') {
    console.log(`Test data preserved at: ${fullPath}`);
    return;
  }
  await fs.rm(fullPath, { recursive: true, force: true });
  // Also clean up the parent-dir whitelist written for production-build compatibility
  const parentDir = path.join(process.cwd(), path.dirname(dataDir));
  await fs.rm(path.join(parentDir, 'whitelist.txt'), { force: true });
  // Remove the parent dir only if it is now empty (leave it if a failed run preserved a sibling sandbox)
  await fs.rmdir(parentDir).catch(() => {});
});

test('test map works e2e', async ({ baseURL }) => {
  const dataDir = process.env.DATA!;

  //build an initial map
  const map = new TerrainMap();
  map.set(new HexCoordinate(3,1), Terrain.Open);
  map.set(new HexCoordinate(3,2), 39);

  const map2 = new TerrainMap();
  map2.set(new HexCoordinate(3,1), Terrain.Open);
  map2.set(new HexCoordinate(13,1), 39);

  //make the post request
  const postRequest = await fetch(`${baseURL}/api/map`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': 'localhost'
    },
    body: JSON.stringify(map.toJSON())
  });
  //ensure that the request went through properly
  expect(postRequest.ok).toBeTruthy();
  const postBody = await postRequest.json();
  expect(postBody).toHaveProperty('id');
  expect(postBody).toHaveProperty('editKey');

  //make a get request
  const getRequest = await fetch(`${baseURL}/api/map/${postBody.id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': 'localhost'
    }
  });

  //ensure that the request returns the correct map
  expect(getRequest.ok).toBeTruthy();
  const getBody = await getRequest.json();
  expect(getBody).toEqual(map.toJSON());

  //make a patch request and update map to compare against
  map.set(new HexCoordinate(13,1), 39);
  const patchRequest = await fetch(`${baseURL}/api/map/${postBody.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${postBody.editKey}`,
      'x-forwarded-for': 'localhost'
    },
    body: JSON.stringify(map2.toJSON())
  });
  expect(patchRequest.ok).toBeTruthy();

  //call a get request to verify the patch request went through properly
  const patchTest = await fetch(`${baseURL}/api/map/${postBody.id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': 'localhost'
    }
  });
  const patchTestBody = await patchTest.json();
  expect(patchTestBody).toEqual(map.toJSON());

  //make a put request and replace the current map with map2 to compare against
  const putRequest = await fetch(`${baseURL}/api/map/${postBody.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${postBody.editKey}`,
      'x-forwarded-for': 'localhost'
    },
    body: JSON.stringify(map2.toJSON())
  });
  expect(putRequest.ok).toBeTruthy();

  //call a get request to verify the put request went through properly
  const putTest = await fetch(`${baseURL}/api/map/${postBody.id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': 'localhost'
    }
  });
  const putTestBody = await putTest.json();
  expect(putTestBody).toEqual(map2.toJSON());

  //make a delete request to delete the map
  const deleteRequest = await fetch(`${baseURL}/api/map/${postBody.id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${postBody.editKey}`,
      'x-forwarded-for': 'localhost'
    }
  });
  expect(deleteRequest.ok).toBeTruthy();

  //verify that the files were deleted properly
  const mapFile = await fs.readFile(path.join(process.cwd(), dataDir, `${postBody.id}.json`), 'utf-8').catch(() => undefined);
  expect(mapFile).toBeUndefined();
  const keyFile = await fs.readFile(path.join(process.cwd(), dataDir, `${postBody.id}.key`), 'utf-8').catch(() => undefined);
  expect(keyFile).toBeUndefined();
});
