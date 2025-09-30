import type { RequestHandler } from "express";
import { auth } from "express-oauth2-jwt-bearer";

// allows us to bypass auth on dev
const onDevelopment = process.env.NODE_ENV !== "production";
const skipAuth = process.env.SKIP_AUTH_ON_DEV === "1" && onDevelopment;

export const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: "RS256",
});

export const requireAuth: RequestHandler = skipAuth
  ? ((req, _res, next) => {
      // logs what's up so we won't forget auth is bypassed
      if (!req.headers["x-skip-auth-logged"]) {
        console.warn("⚠️  Auth bypass active (SKIP_AUTH_ON_DEV=1, NODE_ENV!=production)");
        (req.headers as any)["x-skip-auth-logged"] = "1";
      }
      next();
    })
  : checkJwt;
