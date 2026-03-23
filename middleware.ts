import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Middleware simple para NextAuth v4 sin wrapper de auth
export function middleware(request: NextRequest) {
  // La protección se realiza en los route handlers con auth() y en las páginas con useSession()
  // Este middleware solo existe como placeholder para Next.js
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/login"],
}
