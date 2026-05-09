import { createHmac, timingSafeEqual } from "node:crypto";
import { ApiError } from "./access-api-service.js";

function base64UrlDecode(value) {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function jsonBase64Url(value) {
  return base64UrlEncode(JSON.stringify(value));
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new ApiError(500, "SERVER_MISCONFIGURED", "JWT_SECRET is required.");
  }

  return secret;
}

function verifyHs256Jwt(token) {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid token.");
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const header = JSON.parse(base64UrlDecode(encodedHeader).toString("utf8"));

  if (header.alg !== "HS256") {
    throw new ApiError(401, "UNAUTHORIZED", "Unsupported token algorithm.");
  }

  const expected = base64UrlEncode(
    createHmac("sha256", getJwtSecret()).update(`${encodedHeader}.${encodedPayload}`).digest()
  );
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid token.");
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8"));
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp <= now) {
    throw new ApiError(401, "UNAUTHORIZED", "Token expired.");
  }

  if (payload.nbf && payload.nbf > now) {
    throw new ApiError(401, "UNAUTHORIZED", "Token is not active yet.");
  }

  return payload;
}

export function signJwt(payload) {
  const header = jsonBase64Url({
    alg: "HS256",
    typ: "JWT"
  });
  const body = jsonBase64Url(payload);
  const signature = base64UrlEncode(
    createHmac("sha256", getJwtSecret()).update(`${header}.${body}`).digest()
  );

  return `${header}.${body}.${signature}`;
}

export function requireAuth(req) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new ApiError(401, "UNAUTHORIZED", "Please login first.");
  }

  const payload = verifyHs256Jwt(authorization.slice("Bearer ".length).trim());
  const employeeId = Number.parseInt(payload.employeeId ?? payload.sub, 10);

  if (!employeeId || Number.isNaN(employeeId)) {
    throw new ApiError(401, "UNAUTHORIZED", "Token does not contain an employee identity.");
  }

  return {
    employeeId,
    tokenPayload: payload
  };
}
