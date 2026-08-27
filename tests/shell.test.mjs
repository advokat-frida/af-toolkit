import assert from "node:assert/strict";
import test from "node:test";
import { runStaticChecks } from "../scripts/checks.mjs";

test("the synchronized Toolkit passes every structural and provenance check", async () => {
  const results = await runStaticChecks();
  const failed = results.filter((result) => !result.ok);
  assert.deepEqual(failed, [], failed.map((result) => `${result.label}: ${result.detail}`).join("\n"));
});
