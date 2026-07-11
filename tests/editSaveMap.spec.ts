import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

let createdMapFilePath: string | undefined;

test.describe('editSaveMap', () => {
    test.beforeAll(async () => {
        const dataDir = process.env.DATA;
        if (!dataDir) {
            throw new Error('DATA env var not set — check playwright.config.ts');
        }

        const fullPath = path.resolve(dataDir);
        if (!existsSync(fullPath)) {
            mkdirSync(fullPath, { recursive: true });
        }
        // Test specific whitelist is needed for hermetic Playwright runs, since the server will reject connections from non-whitelisted IPs.
        // Cannot edit production whitelist just for the basis of a tests suite, since that would break production server security.
        // Ensure a whitelist exists for hermetic Playwright runs.
        const whitelist = [
            '127.0.0.1',
            '::1',
            '::ffff:127.0.0.1',
            'localhost',
            'unknown'
        ].join('\n') + '\n';
        await fs.writeFile(path.resolve(dataDir, 'whitelist.txt'), whitelist, 'utf8');
    });

    test.afterAll(async () => {
        if (!createdMapFilePath) {
            return;
        }

        await fs.rm(createdMapFilePath, { force: true });
    });

    test('can create a new account, create a board, edit Open terrain, and persist the map', async ({ page }) => {
        const dataDir = process.env.DATA;
        if (!dataDir) {
            throw new Error('DATA env var not set — check playwright.config.ts');
        }

        await page.goto('/');

        // Create a user so the board flow can run end to end.
        const username = 'Test User';
        const password = 'password';

        await page.getByRole('link', { name: /new user/i }).click();

        await page.getByLabel(/display name/i).fill(username);
        await page.getByLabel(/^password$/i).fill(password);
        await page.getByLabel(/verify password/i).fill(password);

        await Promise.all([
            page.waitForURL(/\/$/),
            page.getByRole('button', { name: /create account/i }).click(),
        ]);

        await expect(page).toHaveURL(/\/$/);

        // Create a board and capture the generated board ID and edit key from the dialog.
        // Wait for the home page to render by checking for the create board button.
        await expect(page.getByRole('button', { name: /edit a new meeting space/i })).toBeVisible();

        const createBoardResponsePromise = page.waitForResponse((response) =>
            response.url().endsWith('/api/map') && response.request().method() === 'POST'
        );
        await page.getByRole('button', { name: /edit a new meeting space/i }).click();

        const createBoardResponse = await createBoardResponsePromise;
        expect(createBoardResponse.ok()).toBe(true);
        const { id: mapId, editKey } = await createBoardResponse.json() as { id: string; editKey: string };

        // Wait for the dialog to appear (using role only, not title text to reduce brittleness).
        const boardDialog = page.getByRole('dialog').first();
        await expect(boardDialog).toBeVisible();
        const mapFilePath = path.resolve(dataDir, `${mapId}.json`);
        createdMapFilePath = mapFilePath;

        expect(existsSync(mapFilePath)).toBe(true);
        const initialMap = JSON.parse(await fs.readFile(mapFilePath, 'utf8'));

        // Open the editor for the generated board.
        await Promise.all([
            page.waitForURL(new RegExp(`/editor\\?id=${mapId}$`)),
            boardDialog.getByRole('link', { name: /^edit$/i }).click(),
        ]);

        await expect(page).toHaveURL(new RegExp(`/editor\\?id=${mapId}$`));
        // Verify the editor is open by checking for the editor controls, not text display.
        await expect(page.getByRole('combobox', { name: /mode/i })).toBeVisible();

        // Provide the edit key, which unlocks server saves.
        const provideEditKeyButton = page.getByRole('button', { name: /provide edit key/i });
        await expect(provideEditKeyButton).toBeVisible();
        await provideEditKeyButton.click();

        await page.getByPlaceholder('Enter Edit Key').fill(editKey);
        await page.getByRole('button', { name: /verify/i }).click();
        await expect(page.getByText(/edit key provided/i)).toBeVisible();

        // Select the terrain editing controls used to place Open terrain on the board.
        const modeSelector = page.getByRole('combobox', { name: /mode/i });
        await modeSelector.click();
        await page.getByRole('option', { name: /add terrain/i }).click();

        const terrainSelector = page.getByRole('combobox', { name: /choose a terrain/i });
        await terrainSelector.click();
        await page.getByRole('option', { name: /open/i }).click();

        // Draw one tile so the map becomes dirty and can be saved.
        const canvas = page.locator('canvas').first();
        await canvas.click({ position: { x: 250, y: 150 } });
        await expect(page.getByRole('button', { name: /undo/i })).toBeEnabled();

        // Save the edited map back through the server and verify the file changed.
        await Promise.all([
            page.waitForResponse((response) =>
                response.url().endsWith(`/api/map/${mapId}`) && response.request().method() === 'PUT' && response.ok()
            ),
            page.getByRole('button', { name: /^save$/i }).click(),
        ]);

        const finalMap = JSON.parse(await fs.readFile(mapFilePath, 'utf8'));
        expect(finalMap).not.toEqual(initialMap);
        expect(Object.values(finalMap)).toContain(0);

        await page.close();
    });
});