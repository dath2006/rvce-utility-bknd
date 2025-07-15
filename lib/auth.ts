import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, importJWK } from "jose";
// Auth0 domain and audience from your Auth0 application
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || "";
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || "";
interface JwtPayload {
  sub: string;
  iss: string;
  aud: string | string[];
  iat: number;
  exp: number;
  [key: string]: any;
}
export async function validateAuth0Token(req: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        isValid: false,
        error: "Missing or invalid authorization header",
      };
    }

    // Extract the token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return { isValid: false, error: "No token provided" };
    }

    // Fetch Auth0 JWKS (JSON Web Key Set)
    const jwksResponse = await fetch(
      `https://${AUTH0_DOMAIN}/.well-known/jwks.json`
    );
    const jwks = await jwksResponse.json();

    // Find the signing key in the JWKS
    const signingKey = jwks.keys[0];

    // Create a public key from the JWKS - Fixed: use importJWK directly
    const publicKey = await importJWK(signingKey);

    // Verify the token
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: `https://${AUTH0_DOMAIN}/`,
      audience: AUTH0_AUDIENCE,
    });

    return { isValid: true, payload: payload as JwtPayload };
  } catch (error) {
    console.error("Token validation error:", error);
    return { isValid: false, error: "Invalid token" };
  }
}
// Middleware function to protect API routes
export async function authMiddleware(req: NextRequest) {
  // Skip auth for non-API routes or allowed paths
  const path = req.nextUrl.pathname;
  // Allow public routes to bypass authentication
  if (!path.startsWith("/api/") || path === "/api/public") {
    return NextResponse.next();
  }
  const result = await validateAuth0Token(req);
  if (!result.isValid) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  // Add user info to headers for API routes to use
  // Fixed: Type safety for payload.sub with proper type casting
  const requestHeaders = new Headers(req.headers);
  if (result.payload && result.payload.sub) {
    requestHeaders.set("x-user-id", result.payload.sub);
  }
  // Continue to the API route with user info
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
