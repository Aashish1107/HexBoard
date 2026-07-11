import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

let dataFolder = process.env.DATA || process.env.DATA_FOLDER || 'data';

test.beforeAll(async () => {
    // define test environment
    dataFolder = process.env.DATA || process.env.DATA_FOLDER || 'data';
    await fs.mkdir(dataFolder, { recursive: true });
    process.env.DATA = dataFolder;
    // Ensure whitelist used by /api/map is present in the active DATA folder.
    const whitelistDir = dataFolder;
    await fs.mkdir(whitelistDir, { recursive: true });
    const whitelistPath = path.join(whitelistDir, 'whitelist.txt');
    await fs.writeFile(whitelistPath, 'unknown\n127.0.0.1\n::1\n', 'utf-8');
});

test.afterAll(async () => {
    // No per-worker cleanup needed: playwright.config.ts uses a unique temp
    // folder (tmp/data/<nanoid>) per run, so files are isolated by run.
    // Global cleanup is handled by `npm run clean`.
});

test('Can send messages', async ({ browser, baseURL, browserName }) => {
    const ensureChatAvailable = async (page: Page, label: string) => {
        const openChatButton = page.getByRole('button', { name: /open chat room/i });
        const unavailableToast = page.getByText(/chat unavailable/i);

        await Promise.race([
            openChatButton.waitFor({ state: 'visible', timeout: 10000 }),
            unavailableToast.waitFor({ state: 'visible', timeout: 10000 }),
        ]);

        if (await unavailableToast.isVisible()) {
            throw new Error(`Chat backend is unavailable for ${label}; cannot run send-message flow.`);
        }

        await expect(openChatButton).toBeVisible();
    };

    // Get initial file count in data/ folder
    //const initialFiles = await fs.readdir(dataFolder);
    //const initialUserFiles = initialFiles.filter(f => f.endsWith('.user')).length;

    // Create two separate browser contexts for the two users
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const wsPort = process.env.WS_PORT || '58524';

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Navigate to home page and click "New User" button for User 1
    await page1.goto(baseURL || 'http://localhost:3000');
    await Promise.all([
        page1.waitForURL('**/UserAccountCreation'),
        page1.getByRole('button', { name: 'New User' }).click(),
    ]);
    expect(page1.url()).toContain('UserAccountCreation');

    // Fill in User 1 details
    await page1.fill('input[placeholder=""]', `Test User One ${browserName}`);
    const passwordInputs1 = await page1.locator('input[type="password"]').all();
    await passwordInputs1[0].fill('password');
    await passwordInputs1[1].fill('password');
    await Promise.all([
        page1.waitForURL(baseURL + '/'),
        page1.getByRole('button', { name: 'Create account' }).click(),
    ]);
    await expect(page1).toHaveURL((baseURL || 'http://localhost:3000') + '/');
    console.log('User 1 created with ID:', page1.url());

    // Navigate to home page and click "New User" button for User 2
    await page2.goto(baseURL || 'http://localhost:3000');
    await Promise.all([
        page2.waitForURL('**/UserAccountCreation'),
        page2.getByRole('button', { name: 'New User' }).click(),
    ]);

    // Fill in User 2 details
    await page2.fill('input[placeholder=""]', `Test User Two ${browserName}`);
    const passwordInputs2 = await page2.locator('input[type="password"]').all();
    await passwordInputs2[0].fill('password');
    await passwordInputs2[1].fill('password');
    await Promise.all([
        page2.waitForURL(baseURL + '/'),
        page2.getByRole('button', { name: 'Create account' }).click(),
    ]);
    await expect(page2).toHaveURL((baseURL || 'http://localhost:3000') + '/');
    console.log('User 2 created with ID:', page2.url());
    // Assert that the two users for this browser were created in the data folder
    const allFiles = await fs.readdir(dataFolder);
    let user1ID: string | null = null;
    let user2ID: string | null = null;
    for (const f of allFiles) {
        if (!f.endsWith('.user')) continue;
        const contents = JSON.parse(await fs.readFile(path.join(dataFolder, f), 'utf-8'));
        if (contents.name === `Test User One ${browserName}`) user1ID = f.replace('.user', '');
        if (contents.name === `Test User Two ${browserName}`) user2ID = f.replace('.user', '');
    }
    expect(user1ID).not.toBeNull();
    expect(user2ID).not.toBeNull();
    if (!user1ID || !user2ID) throw new Error('Could not find created user IDs');

    // Create a new map directly in the active DATA directory used by Next + WS servers.
    const openMapSeed = {
        '<0,0>': 0,
        '<1,0>': 0,
        '<0,1>': 0,
        '<-1,0>': 0,
        '<0,-1>': 0,
    };
    const mapID = `test-map-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await fs.writeFile(path.join(dataFolder, `${mapID}.json`), JSON.stringify(openMapSeed), 'utf-8');
    console.log('Created map with ID:', mapID);

    // Navigate both users to the visit page for the created map
    const wsPortQuery = encodeURIComponent(wsPort);
    await Promise.all([
        page1.waitForURL(`**/visit?id=${mapID}&user=${user1ID}&wsPort=${wsPortQuery}`),
        page1.goto((baseURL || 'http://localhost:3000') + `/visit?id=${mapID}&user=${user1ID}&wsPort=${wsPortQuery}`),
    ]);
    console.log('User 1 navigated to visit page');
    await Promise.all([
        page2.waitForURL(`**/visit?id=${mapID}&user=${user2ID}&wsPort=${wsPortQuery}`),
        page2.goto((baseURL || 'http://localhost:3000') + `/visit?id=${mapID}&user=${user2ID}&wsPort=${wsPortQuery}`),
    ]);
    console.log('User 2 navigated to visit page');

    // Wait for chat controls to render (or fail fast if backend is unavailable), then open chat on both pages.
    await ensureChatAvailable(page1, 'user 1');
    await ensureChatAvailable(page2, 'user 2');

    await page1.getByRole('button', { name: /open chat room/i }).click();
    await page2.getByRole('button', { name: /open chat room/i }).click();

    const page1ChatInput = page1.getByPlaceholder('Type a message...');
    const page1SendButton = page1.getByRole('button', { name: 'Send' });
    const page2ChatInput = page2.getByPlaceholder('Type a message...');
    const page2SendButton = page2.getByRole('button', { name: 'Send' });
    await expect(page1ChatInput).toBeEnabled();
    await expect(page1SendButton).toBeEnabled();
    await expect(page2ChatInput).toBeEnabled();
    await expect(page2SendButton).toBeEnabled();

    // user 1 sends a message
    await page1ChatInput.fill('Hello from User One!');
    await page1SendButton.click();

    // Assert that user 2 receives the message
    await expect(page2.getByText('Hello from User One!')).toBeVisible();

    // Wait for visit page network activity to settle before teardown cleanup removes files.
    await Promise.all([
        page1.waitForLoadState('networkidle'),
        page2.waitForLoadState('networkidle'),
    ]);

    await context1.close();
    await context2.close();
});
