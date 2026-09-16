const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const catalogPath = path.join(__dirname, "..", "data", "economics_streaming_catalog.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

test("streaming catalog keeps the v1 contract", () => {
  assert.equal(catalog.channels.length, 10);
  const items = catalog.channels.flatMap(channel => channel.items);
  assert.equal(items.length, 30);
  assert.equal(new Set(items.map(item => item.id)).size, items.length);
});

test("every channel and item has required learning-loop fields", () => {
  for (const channel of catalog.channels) {
    assert.ok(channel.id);
    assert.ok(channel.title);
    assert.ok(Number(channel.relevance) > 0);
    assert.ok(channel.items.length >= 3);
    for (const item of channel.items) {
      for (const key of ["id","title","kind","duration","level","author","summary","application","applicationShort","body","challenge"]) {
        assert.ok(item[key], `${item.id || "unknown"} missing ${key}`);
      }
      assert.ok(["video","lesson","simulation","case"].includes(item.kind));
      assert.ok(Array.isArray(item.body) && item.body.length >= 3);
    }
  }
});

test("YouTube entries use explicit video ids and HTTPS sources", () => {
  const items = catalog.channels.flatMap(channel => channel.items);
  for (const item of items.filter(item => item.youtubeId)) {
    assert.match(item.youtubeId, /^[A-Za-z0-9_-]{11}$/);
    assert.match(item.sourceUrl, /^https:\/\//);
  }
});