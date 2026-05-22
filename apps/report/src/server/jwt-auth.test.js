import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/app";
process.env.JWT_SECRET = "test-secret";

const { ApiError } = await import("./api-error.js");
const { requireAuth, signJwt } = await import("./jwt-auth.js");

test("signJwt creates a token accepted by requireAuth", () => {
  const token = signJwt({
    employeeId: 123,
    sub: "123",
    exp: Math.floor(Date.now() / 1000) + 60
  });

  const currentUser = requireAuth({
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  assert.equal(currentUser.employeeId, 123);
});

test("requireAuth rejects requests without a bearer token", () => {
  assert.throws(
    () =>
      requireAuth({
        headers: {}
      }),
    (error) =>
      error instanceof ApiError &&
      error.status === 401 &&
      error.code === "UNAUTHORIZED"
  );
});

test("requireAuth rejects expired tokens", () => {
  const token = signJwt({
    employeeId: 123,
    exp: Math.floor(Date.now() / 1000) - 1
  });

  assert.throws(
    () =>
      requireAuth({
        headers: {
          authorization: `Bearer ${token}`
        }
      }),
    (error) =>
      error instanceof ApiError &&
      error.status === 401 &&
      error.message === "Token expired."
  );
});
