const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Engine = require("../assets/learning-recommendation-engine.js");

const read = name => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", name), "utf8"));
const catalog = read("economics_streaming_catalog.json");
const graph = read("economics_knowledge_graph.json");
const projects = read("economics_project_profiles.json");

function state(overrides = {}) {
  return {
    items:{},actions:[],events:[],projectSettings:{},focusProject:"pricing-real-estate",lastOpened:null,
    ...overrides
  };
}

test("v2 graph covers the full streaming catalog", () => {
  const items = Engine.allItems(catalog);
  assert.equal(items.length, 30);
  assert.equal(graph.concepts.length, 35);
  assert.equal(graph.content.length, 30);
  assert.equal(new Set(graph.content.map(x => x.id)).size, 30);
  assert.deepEqual(
    new Set(graph.content.map(x => x.id)),
    new Set(items.map(x => x.id))
  );
  assert.equal(projects.projects.length, 5);
});

test("pricing focus prioritizes pricing and causal application over unrelated behavioral content", () => {
  const ranked = Engine.rank(catalog, graph, projects, state());
  const score = id => ranked.find(x => x.item.id === id).score;
  assert.ok(score("pricing-revenue-case") > score("behavioral-prospect"));
  assert.ok(score("causal-did") > score("behavioral-prospect"));
});

test("applying a concept lowers its replay priority and moves the engine forward", () => {
  const before = Engine.rank(catalog, graph, projects, state());
  const s = state({items:{"pricing-elasticity-video":{started:true,completed:true,applied:true}}});
  const after = Engine.rank(catalog, graph, projects, s);
  const b = before.find(x => x.item.id === "pricing-elasticity-video").score;
  const a = after.find(x => x.item.id === "pricing-elasticity-video").score;
  assert.ok(a < b - 50);
  assert.notEqual(after[0].item.id, "pricing-elasticity-video");
});

test("an inconclusive observed outcome boosts useful neighboring content", () => {
  const base = state({items:{"pricing-revenue-case":{started:true,completed:true,applied:true}}});
  const before = Engine.rank(catalog, graph, projects, base);
  const beforeDid = before.find(x => x.item.id === "causal-did").score;
  const reviewed = state({
    items:base.items,
    actions:[{
      id:"a1",itemId:"pricing-revenue-case",projectId:"pricing-real-estate",status:"reviewed",
      outcomeSignal:"inconclusive",reviewedAt:"2026-09-16T12:00:00Z"
    }]
  });
  const after = Engine.rank(catalog, graph, projects, reviewed);
  const afterDid = after.find(x => x.item.id === "causal-did").score;
  assert.ok(afterDid > beforeDid);
  assert.match(after.find(x => x.item.id === "causal-did").reason, /outcome reciente/);
});

test("Discover Weekly returns a diverse five-piece mix", () => {
  const mix = Engine.weeklyMix(catalog, graph, projects, state(), 5);
  assert.equal(mix.length, 5);
  assert.ok(new Set(mix.map(x => x.item.channelId)).size >= 3);
});

test("project mastery responds to applied evidence", () => {
  const p = projects.projects.find(x => x.id === "pricing-real-estate");
  const m0 = Engine.conceptMastery(catalog, graph, state());
  const s = state({items:{"pricing-elasticity-video":{started:true,completed:true,applied:true},"causal-did":{started:true,completed:true,applied:true}}});
  const m1 = Engine.conceptMastery(catalog, graph, s);
  assert.ok(Engine.projectMastery(p, m1) > Engine.projectMastery(p, m0));
});