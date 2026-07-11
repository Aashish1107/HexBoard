import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  
  // Redirect unauthenticated users
  if (!token && request.nextUrl.pathname.startsWith('/editor')) {
    return NextResponse.redirect(new URL('/visit', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/editor/:path*', '/api/:path*'],
};