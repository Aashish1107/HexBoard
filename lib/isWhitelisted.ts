import fs from "node:fs/promises";
import path from "node:path";

export async function isWhitelisted(ip: string): Promise<boolean> {
    const dataDir = process.env.DATA ?? path.join('data');
    const filePath = path.resolve(dataDir, 'whitelist.txt');
    const whitelistedIPs = (await fs.readFile(filePath, 'utf-8')).split('\n').map(line => line.trim());
    return whitelistedIPs.includes(ip);
}
