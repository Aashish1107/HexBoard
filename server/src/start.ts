import http from 'http';
import { createHexWorldServer } from './hexserver.js';
import { PORT as DEFAULT_PORT } from './client/network.js';
import path from 'node:path';

const port = process.env.PORT
    ? Number(process.env.PORT)
    : DEFAULT_PORT;

// Normalize DATA so this server reads the same sandbox path as the Next server.
// Prefer `DATA` environment variable; test harness should set `DATA` when needed.
const rawDataDir = process.env.DATA ?? 'data';
if (!path.isAbsolute(rawDataDir)) {
    const cwd = process.cwd();
    const repoRoot = path.basename(cwd) === 'server' ? path.resolve(cwd, '..') : cwd;
    process.env.DATA = path.resolve(repoRoot, rawDataDir);
} else {
    process.env.DATA = rawDataDir;
}

const httpServer = new http.Server((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('ok');
    }
});

createHexWorldServer(httpServer);
httpServer.listen(port);
console.log('started server on port', port, 'using DATA', process.env.DATA);