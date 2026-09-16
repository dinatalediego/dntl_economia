const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"economics-streaming.html"),"utf8");
const config=fs.readFileSync(path.join(root,"assets","economics-supabase-config.js"),"utf8");
const memory=fs.readFileSync(path.join(root,"assets","economics-memory.js"),"utf8");
const app=fs.readFileSync(path.join(root,"assets","economics-streaming.js"),"utf8");
const schema=fs.readFileSync(path.join(root,"db","economics_learning_memory_v3.sql"),"utf8");

test("v3 wires identity and private memory before the application",()=>{
  const sdk=html.indexOf("@supabase/supabase-js@2.116.0");
  const cfg=html.indexOf("economics-supabase-config.js");
  const mem=html.indexOf("economics-memory.js");
  const appIndex=html.indexOf("economics-streaming.js");
  assert.ok(sdk>0&&cfg>sdk&&mem>cfg&&appIndex>mem);
  assert.match(html,/Learning Digital Twin · v3/);
  assert.match(html,/id="auth-modal"/);
  assert.match(html,/id="experiment-grid"/);
});

test("frontend contains only a publishable key, never privileged Supabase secrets",()=>{
  assert.match(config,/sb_publishable_/);
  assert.doesNotMatch(config,/service_role|sb_secret_/i);
  assert.doesNotMatch(memory,/service_role|sb_secret_/i);
  assert.doesNotMatch(app,/service_role|sb_secret_/i);
});

test("learning memory persists every private domain required by v3",()=>{
  for(const table of ["eco_profiles","eco_project_settings","eco_learning_state","eco_learning_events","eco_applications","eco_outcomes","eco_experiments"]){
    assert.match(memory,new RegExp(table));
    assert.match(schema,new RegExp("create table public\\."+table));
  }
});

test("RLS schema contract is owner-scoped and anon receives no grants",()=>{
  const tables=["eco_profiles","eco_project_settings","eco_learning_state","eco_learning_events","eco_applications","eco_outcomes","eco_experiments"];
  for(const table of tables){
    assert.match(schema,new RegExp("alter table public\\."+table+" enable row level security"));
    assert.match(schema,new RegExp("revoke all on table public\\."+table+" from anon, authenticated"));
  }
  assert.match(schema,/auth\.uid\(\)/);
  assert.doesNotMatch(schema,/to anon/i);
});

test("local-first migration and cross-device reconciliation are explicit",()=>{
  assert.match(memory,/sync_import/);
  assert.match(memory,/mergeSameUser/);
  assert.match(memory,/userCacheKey/);
  assert.match(memory,/loadRemote/);
  assert.match(memory,/signInWithOAuth/);
  assert.match(memory,/signInWithPassword/);
});

test("experiments close the hypothesis-to-outcome product loop",()=>{
  assert.match(app,/Design|Diseñar experimento|openExperiment/);
  assert.match(app,/hypothesis/);
  assert.match(app,/outcomeMetric/);
  assert.match(app,/saveExperiment/);
});