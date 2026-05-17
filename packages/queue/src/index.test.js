import test from "node:test";
import assert from "node:assert/strict";
import {
  AccessEventValidationError,
  parseAccessEvent,
  parseAccessRequest,
} from "./index.js";

test("parseAccessRequest accepts numeric string identifiers", () => {
  const request = parseAccessRequest({
    employee_id: "10001",
    access_point_id: "3",
    site_id: "2",
    direction: "in",
  });

  assert.deepEqual(request, {
    employee_id: "10001",
    access_point_id: "3",
    site_id: "2",
    direction: "in",
  });
});

test("parseAccessRequest rejects non-numeric employee identifiers", () => {
  assert.throws(
    () =>
      parseAccessRequest({
        employee_id: "E10001",
        access_point_id: "3",
        site_id: "2",
        direction: "in",
      }),
    AccessEventValidationError,
  );
});

test("parseAccessEvent rejects non-numeric identifiers before worker persistence", () => {
  assert.throws(
    () =>
      parseAccessEvent({
        eventId: "evt-1",
        eventType: "access.checked",
        occurredAt: new Date().toISOString(),
        employee_id: "E10001",
        access_point_id: "3",
        site_id: "2",
        direction: "in",
        result: true,
        reason: "Access granted",
      }),
    AccessEventValidationError,
  );
});
