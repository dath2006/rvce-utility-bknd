import { NextRequest, NextResponse } from "next/server";
import { validateAuth0Token } from "./lib/auth";

export async function middleware(request: NextRequest) {
  // Handle OPTIONS preflight requests first
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400", // 24 hours
      },
    });
  }

  // Skip auth for non-API routes
  // const path = request.nextUrl.pathname;
  // if (!path.startsWith("/api/")) {
  //   return NextResponse.next();
  // }

  // // Validate the token using the auth.ts function
  // const result = await validateAuth0Token(request);

  // if (!result.isValid) {
  //   return NextResponse.json({ error: result.error }, { status: 401 });
  // }

  // // If token is valid, add user info to headers and continue
  // const requestHeaders = new Headers(request.headers);
  // if (result.payload && result.payload.sub) {
  //   requestHeaders.set("x-user-id", result.payload.sub);
  // }

  // const res = NextResponse.next({
  //   request: {
  //     headers: requestHeaders,
  //   },
  // });

  // // Add CORS headers to the response
  // res.headers.set("Access-Control-Allow-Origin", "*");
  // res.headers.set(
  //   "Access-Control-Allow-Methods",
  //   "GET, POST, PUT, DELETE, OPTIONS"
  // );
  // res.headers.set(
  //   "Access-Control-Allow-Headers",
  //   "Authorization, Content-Type"
  // );
  // res.headers.set("Access-Control-Allow-Credentials", "true");

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
