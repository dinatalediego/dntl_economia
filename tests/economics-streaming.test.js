const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "data", "economics_streaming_catalog.json"), "utf8"));
const graph = JSON.parse(fs.readFileSync(path.join(root, "data", "economics_knowledge_graph.json"), "utf8"));
const projects = JSON.parse(fs.readFileSync(path.join(root, "data", "economics_project_profiles.json"), "utf8"));
const html = fs.readFileSync(path.join(root, "economics-streaming.html"), "utf8");

test("streaming catalog keeps the 10-channel 30-piece contract", () => {
  assert.equal(catalog.channels.length, 10);
  const items = catalog.channels.flatMap(channel => channel.items);
  assert.equal(items.length, 30);
  assert.equal(new Set(items.map(item => item.id)).size, items.length);
});

test("every content item preserves the learning-loop fields", () => {
  for (const channel of catalog.channels) {
    assert.ok(channel.id);
    assert.ok(channel.title);
    assert.ok(Number(channel.relevance) > 0);
    for (const item of channel.items) {
      for (const key of ["id","title","kind","duration","level","author","summary","application","applicationShort","body","challenge"]) {
        assert.ok(item[key], `${item.id || "unknown"} missing ${key}`);
      }
      assert.ok(["video","lesson","simulation","case"].includes(item.kind));
      assert.ok(Array.isArray(item.body) && item.body.length >= 3);
    }
  }
});

test("graph and project sources are wired into the v2 page", () => {
  assert.equal(graph.version, "2.0.0");
  assert.equal(projects.version, "2.0.0");
  assert.match(html, /learning-recommendation-engine\.js/);
  assert.match(html, /economics-recommendation\.css/);
  assert.match(html, /Action Ledger|Acciones esperando resultado/);
  assert.match(html, /Knowledge Graph/);
});

test("YouTube entries use explicit video ids and HTTPS sources", () => {
  const items = catalog.channels.flatMap(channel => channel.items);
  for (const item of items.filter(item => item.youtubeId)) {
    assert.match(item.youtubeId, /^[A-Za-z0-9_-]{11}$/);
    assert.match(item.sourceUrl, /^https:\/\//);
  }
});