import assert from "node:assert/strict";
import test from "node:test";
import { evaluateAntiPassback } from "./access-decision.service.js";

test("first access event must be an entry", () => {
  const decision = evaluateAntiPassback(
    {
      employee_id: "1",
      site_id: "1",
      access_point_id: "1",
      direction: "out",
    },
    null,
  );

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "employee is not marked inside any site");
});

test("employee already inside a site cannot enter again", () => {
  const decision = evaluateAntiPassback(
    {
      employee_id: "1",
      site_id: "2",
      access_point_id: "3",
      direction: "in",
    },
    {
      site_id: "1",
      access_point_id: "1",
      direction: "in",
    },
  );

  assert.equal(decision.allowed, false);
  assert.equal(
    decision.reason,
    "employee must exit site 1 before any new entry",
  );
});

test("employee can exit from the same site", () => {
  const decision = evaluateAntiPassback(
    {
      employee_id: "1",
      site_id: "1",
      access_point_id: "2",
      direction: "out",
    },
    {
      site_id: "1",
      access_point_id: "1",
      direction: "in",
    },
  );

  assert.equal(decision.allowed, true);
  assert.equal(decision.reason, "Access granted");
});
