import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { validateAuth0Token } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // 2. Public API routes (add your own as needed)
  if (pathname.startsWith("/api/contribute/fetch")) {
    return NextResponse.next();
  }

  // 3. Auth0-protected API routes
  if (
    pathname.startsWith("/api/attendance") ||
    pathname.startsWith("/api/contribute") ||
    pathname.startsWith("/api/getData") ||
    pathname.startsWith("/api/requests") ||
    pathname.startsWith("/api/timetable")
  ) {
    const result = await validateAuth0Token(request);
    if (!result.isValid) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }
    const requestHeaders = new Headers(request.headers);
    if (result.payload && result.payload.sub) {
      requestHeaders.set("x-user-id", result.payload.sub);
    }
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // 4. NextAuth-protected admin pages
  if (
    pathname.startsWith("/api/drive") ||
    pathname.startsWith("/api/contributions") ||
    pathname.startsWith("/drive-manager") ||
    pathname.startsWith("/contribution-manager")
  ) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token) {
      const signInUrl = new URL("/api/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  // 5. Default: allow
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};
