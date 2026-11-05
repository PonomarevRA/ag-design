import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as components from "../packages/components/index.js";
test("public source retains the four versioned packages and component entrypoints", async () => {
  const receipt = JSON.parse(
    await readFile(new URL("../PUBLICATION.json", import.meta.url)),
  );
  assert.equal(receipt.libraries.length, 4);
  assert.ok(receipt.components.length > 0);
  assert.equal(typeof components.createButton, "function");
  for (const id of receipt.libraries) {
    const p = JSON.parse(
      await readFile(
        new URL("../packages/" + id + "/package.json", import.meta.url),
      ),
    );
    assert.equal(p.name, "@ag-design/" + id);
  }
});
