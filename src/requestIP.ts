export function requestIP(req: Request): string {
    const ip = req.headers.get('X-Forwarded-For') || 'unknown';
    return ip;
}
