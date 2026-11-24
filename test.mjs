import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";

const EXPECTED =
  "I ran a million simulations, and in every single one, you said yes.";

function runOnce() {
  const dir = mkdtempSync(join(tmpdir(), "pickup-line-"));
  const r = spawnSync(process.execPath, ["main.ts"], {
    cwd: import.meta.dirname,
    env: { ...process.env, MAKEFUN_OUTPUT_DIR: dir },
    encoding: "utf8",
  });
  assert.equal(r.status, 0, `main.ts failed: ${r.stderr}`);
  return readFileSync(join(dir, "entry.txt"));
}

test("entry is one line, 1-200 chars, deterministic across runs", () => {
  const first = runOnce();
  const second = runOnce();
  assert.equal(
    createHash("sha256").update(first).digest("hex"),
    createHash("sha256").update(second).digest("hex"),
    "two runs must produce byte-identical entry.txt",
  );
  const text = first.toString("utf8");
  assert.equal(text, EXPECTED);
  assert.ok(!text.endsWith("\n"), "no trailing newline");
  assert.equal(text.split("\n").length, 1, "exactly one line");
  const chars = [...text].length;
  assert.ok(chars >= 1 && chars <= 200, `length ${chars} must be 1-200`);
  assert.ok(text.trim().length > 0, "not only whitespace");
});

test("entry length is within the competition gate", () => {
  const chars = [...EXPECTED].length;
  assert.ok(chars >= 1 && chars <= 200, `EXPECTED is ${chars} chars`);
});
