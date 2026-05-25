import test from "node:test";
import assert from "node:assert/strict";
import app from "../app.js";
import { getValkeyClient } from "../clients/valkey.client.js";

let server;
let baseUrl;

function validateEnv() {
  const required = ["VALKEY_URL", "SQS_QUEUE_URL", "AWS_REGION"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `⚠ Missing environment variables: ${missing.join(", ")}\n` +
      `Local setup: Set these before running tests\n` +
      `Cloud setup: Configure in CI/CD secrets or environment\n`
    );
  }
}

function jsonRequest(path, body, expectedStatus = 200) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).then(async (res) => {
    const responseBody = await res.json().catch(() => null);
    assert.equal(res.status, expectedStatus, `Expected ${expectedStatus} but got ${res.status} for ${path}`);
    return responseBody;
  });
}

function getRequest(path, expectedStatus = 200) {
  return fetch(`${baseUrl}${path}`).then(async (res) => {
    const responseBody = await res.json().catch(() => null);
    assert.equal(res.status, expectedStatus, `Expected ${expectedStatus} but got ${res.status} for ${path}`);
    return responseBody;
  });
}

// -------------------------------------------------------------------
// Server lifecycle
// -------------------------------------------------------------------
test.before(() => {
  server = app.listen(0);
  const addr = server.address();
  const port = typeof addr === "object" && addr && "port" in addr ? addr.port : 0;
  assert.ok(port, "Server must listen on an ephemeral port");
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  try {
    const client = await getValkeyClient();
    if (client) {
      await client.quit().catch(() => {});
    }
  } catch {
    // ignore if valkey client was never created
  }
});

// -------------------------------------------------------------------
// 1. Health checks
// -------------------------------------------------------------------
test("✓ GET /healthz returns ok", async () => {
  const body = await getRequest("/healthz", 200);
  assert.deepEqual(body, { ok: true, service: "access" });
});

test("✓ GET /readyz returns ready", async () => {
  const body = await getRequest("/readyz", 200);
  assert.deepEqual(body, { ready: true, service: "access" });
});

// -------------------------------------------------------------------
// 2. Integration Tests (Valkey + SQS)
// -------------------------------------------------------------------
test.describe("Integration Tests (Valkey + SQS)", () => {
  test.before(() => {
    validateEnv();
  });

  test.before(async () => {
    try {
      const client = await getValkeyClient();
      const keys = await client.keys("anti-passback:*");
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (err) {
      // ignore cleanup errors
    }
  });

  test.afterEach(async () => {
    try {
      const client = await getValkeyClient();
      const keys = await client.keys("anti-passback:*");
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (err) {
      // ignore cleanup errors
    }
  });

  test("✓ First entry is allowed", async () => {
    const payload = {
      employee_id: "101",
      site_id: "1",
      access_point_id: "1",
      direction: "in",
    };

    const body = await jsonRequest("/check", payload, 200);

    assert.equal(body.result, true, "Should allow first entry");
    assert.equal(body.reason, "Access granted");
    assert.equal(body.employee_id, "101");
    assert.ok(body.eventId, "Should have eventId");
  });

  test("✓ Cannot enter same site twice", async () => {
    const empId = "102";

    const entry1 = await jsonRequest("/check", {
      employee_id: empId,
      site_id: "1",
      access_point_id: "1",
      direction: "in",
    }, 200);

    assert.equal(entry1.result, true);

    const entry2 = await jsonRequest("/check", {
      employee_id: empId,
      site_id: "2",
      access_point_id: "2",
      direction: "in",
    }, 200);

    assert.equal(entry2.result, false, "Should deny second entry");
    assert.match(entry2.reason, /must exit/);
  });

  test("✓ Can exit from same site", async () => {
    const empId = "103";
    const siteId = "1";

    const entry = await jsonRequest("/check", {
      employee_id: empId,
      site_id: siteId,
      access_point_id: "1",
      direction: "in",
    }, 200);

    assert.equal(entry.result, true);

    const exitRes = await jsonRequest("/check", {
      employee_id: empId,
      site_id: siteId,
      access_point_id: "2",
      direction: "out",
    }, 200);

    assert.equal(exitRes.result, true);
    assert.equal(exitRes.reason, "Access granted");
  });

  test("✓ First event must be entry (not exit)", async () => {
    const empId = "104";

    const res = await jsonRequest("/check", {
      employee_id: empId,
      site_id: "1",
      access_point_id: "1",
      direction: "out",
    }, 200);

    assert.equal(res.result, false);
    assert.match(res.reason, /not marked inside/);
  });

  test("✓ Invalid payload returns 400", async () => {
    await fetch(`${baseUrl}/check`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ employee_id: "123" }),
    }).then(async (res) => {
      assert.equal(res.status, 400);
    });
  });
});