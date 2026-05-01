import test from "node:test";
import assert from "node:assert/strict";
import { evaluateAntiPassback } from "./access-decision.service.js";

test("first event must be entry", () => {
  const result = evaluateAntiPassback(
    { userId: "u1", factoryId: "F1", doorId: "D1", in: false },
    null
  );

  assert.equal(result.allowed, false);
});

test("user inside a factory cannot enter again", () => {
  const result = evaluateAntiPassback(
    { userId: "u1", factoryId: "F2", doorId: "D2", in: true },
    { factoryId: "F1", doorId: "D1", in: true }
  );

  assert.equal(result.allowed, false);
});

test("user can exit the same factory", () => {
  const result = evaluateAntiPassback(
    { userId: "u1", factoryId: "F1", doorId: "D2", in: false },
    { factoryId: "F1", doorId: "D1", in: true }
  );

  assert.equal(result.allowed, true);
});
