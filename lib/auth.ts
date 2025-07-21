import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, importJWK } from "jose";
// Auth0 domain and audience from your Auth0 application
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || "";
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || "";

export async function validateAuth0Token(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        isValid: false,
        error: "Missing or invalid authorization header",
      };
    }
    const token = authHeader.split(" ")[1];
    if (!token) return { isValid: false, error: "No token provided" };

    // Decode token header to get kid
    // jose's decodeJwt only decodes payload, so decode header manually
    const base64Url = token.split(".")[0];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const headerJson = Buffer.from(base64, "base64").toString("utf8");
    const header = JSON.parse(headerJson) as { kid?: string };
    const kid = header.kid;

    // Fetch JWKS
    const jwksResponse = await fetch(
      `https://${AUTH0_DOMAIN}/.well-known/jwks.json`
    );
    const jwks = await jwksResponse.json();

    // Find the correct signing key
    const signingKey = jwks.keys.find(
      (key: { kid?: string }) => key.kid === kid
    );
    if (!signingKey) return { isValid: false, error: "Signing key not found" };

    const publicKey = await importJWK(signingKey);

    const { payload } = await jwtVerify(token, publicKey, {
      issuer: `https://${AUTH0_DOMAIN}/`,
      audience: [AUTH0_AUDIENCE, `https://${AUTH0_DOMAIN}/userinfo`],
    });

    return { isValid: true, payload };
  } catch (error) {
    console.error("Token validation error:", error);
    return { isValid: false, error: "Invalid token" };
  }
}
