"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../assets/exhibit-core.js");

test("Hopfield reconstructs the known corrupted pattern and lowers energy", () => {
  const result = core.hopfieldRecall(
    [1, 1, 1, -1, -1, -1],
    [1, 1, -1, -1, -1, -1],
  );
  assert.equal(result.exact, true);
  assert.deepEqual(result.recovered, result.target);
  assert.ok(result.energyAfter < result.energyBefore);
  assert.equal(result.energyAfter, -15);
});

test("Difference-in-Differences recovers the synthetic effect of 7", () => {
  const result = core.differenceInDifferences(20.5, 29.5, 18.5, 20.5);
  assert.equal(result.treatedChange, 9);
  assert.equal(result.controlChange, 2);
  assert.equal(result.counterfactual, 22.5);
  assert.equal(result.effect, 7);
});

test("Goldin measurement break can be exactly harmonized in the synthetic world", () => {
  const truth = [30, 35, 41, 49, 57, 64];
  const result = core.applyMeasurementBreak(truth, 12, 3);
  assert.deepEqual(result.raw, [30, 35, 41, 61, 69, 76]);
  assert.deepEqual(result.harmonized, truth);
});

test("Creative destruction is deterministic and increases aggregate productivity", () => {
  let state = core.createGrowthState();
  const before = core.growthMetrics(state.firms, 0.7);
  for (let i = 0; i < 20; i += 1) state = core.growthStep(state, 0.45);
  const after = core.growthMetrics(state.firms, 0.7);

  assert.equal(state.round, 20);
  assert.equal(state.replacements, 6);
  assert.ok(after.aggregateProductivity > before.aggregateProductivity);
  assert.ok(after.hhi > 0 && after.hhi < 1);
});
