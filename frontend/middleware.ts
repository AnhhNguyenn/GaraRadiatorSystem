import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Lấy access_token từ cookies thay vì localStorage
  const token = request.cookies.get('access_token')?.value;

  // Nếu không có token, redirect về login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Cấu hình áp dụng middleware cho các đường dẫn yêu cầu bảo mật
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - login (public auth page)
     * - change-password (public auth page for initial setup)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|login|change-password).*)',
  ],
};
