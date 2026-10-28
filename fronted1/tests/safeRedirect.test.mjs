import test from "node:test";
import assert from "node:assert/strict";
import { safeRedirectPath } from "../lib/safeRedirect.mjs";

test("safe redirects accept only internal root-relative paths", () => {
  assert.equal(safeRedirectPath("/ai?view=summary#latest"), "/ai?view=summary#latest");
  assert.equal(safeRedirectPath("https://example.com"), "/upload");
  assert.equal(safeRedirectPath("//example.com"), "/upload");
  assert.equal(safeRedirectPath("/\\example.com"), "/upload");
  assert.equal(safeRedirectPath(null), "/upload");
});
