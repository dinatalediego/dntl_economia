"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const readAloud = require("../assets/read-aloud.js");

test("normalizes whitespace before narration", () => {
  assert.equal(readAloud.normalizeText("  Nobel\n\tData\u00a0Lab  "), "Nobel Data Lab");
});

test("splits long narration into browser-safe chunks without losing words", () => {
  const sentence = "La evidencia permite contrastar una hipótesis y explicar sus límites.";
  const text = Array.from({ length: 12 }, () => sentence).join(" ");
  const chunks = readAloud.chunkText(text, 120);

  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.length <= 120));
  assert.equal(chunks.join(" "), text);
});

test("returns no utterances for empty content", () => {
  assert.deepEqual(readAloud.chunkText(" \n "), []);
});
