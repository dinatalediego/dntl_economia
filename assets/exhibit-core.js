"use strict";

(function exposeExhibitCore(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.NobelExhibitCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildCore() {
  function hopfieldWeights(pattern) {
    return pattern.map((_, i) => pattern.map((__, j) => (i === j ? 0 : pattern[i] * pattern[j])));
  }

  function hopfieldEnergy(weights, state) {
    let sum = 0;
    for (let i = 0; i < state.length; i += 1) {
      for (let j = 0; j < state.length; j += 1) sum += weights[i][j] * state[i] * state[j];
    }
    return -0.5 * sum;
  }

  function hamming(left, right) {
    return left.reduce((distance, value, index) => distance + (value === right[index] ? 0 : 1), 0);
  }

  function hopfieldRecall(pattern, input) {
    const weights = hopfieldWeights(pattern);
    const state = input.slice();
    for (let i = 0; i < state.length; i += 1) {
      let activation = 0;
      for (let j = 0; j < state.length; j += 1) activation += weights[i][j] * state[j];
      state[i] = activation >= 0 ? 1 : -1;
    }
    return {
      target: pattern.slice(),
      input: input.slice(),
      recovered: state,
      exact: hamming(pattern, state) === 0,
      energyBefore: hopfieldEnergy(weights, input),
      energyAfter: hopfieldEnergy(weights, state),
    };
  }

  function differenceInDifferences(treatedPre, treatedPost, controlPre, controlPost) {
    const treatedChange = treatedPost - treatedPre;
    const controlChange = controlPost - controlPre;
    const counterfactual = treatedPre + controlChange;
    return {
      treatedChange,
      controlChange,
      counterfactual,
      effect: treatedChange - controlChange,
    };
  }

  function applyMeasurementBreak(series, bias, breakIndex) {
    const raw = series.map((value, index) => value + (index >= breakIndex ? bias : 0));
    const harmonized = raw.map((value, index) => value - (index >= breakIndex ? bias : 0));
    return { raw, harmonized };
  }

  function seededDraw(seed) {
    const nextSeed = (1664525 * seed + 1013904223) >>> 0;
    return { seed: nextSeed, value: nextSeed / 4294967296 };
  }

  function createGrowthState(firms = [1.00, 1.04, 0.97, 1.08, 1.01, 0.95], seed = 2025) {
    return {
      firms: firms.slice(),
      round: 0,
      replacements: 0,
      seed,
      lastInnovator: -1,
      displaced: -1,
      log: [],
    };
  }

  function leaderIndex(firms) {
    return firms.reduce((best, value, index, array) => value > array[best] ? index : best, 0);
  }

  function growthStep(previous, innovationRate) {
    const state = {
      ...previous,
      firms: previous.firms.slice(),
      log: previous.log.slice(),
      round: previous.round + 1,
      lastInnovator: -1,
      displaced: -1,
    };
    const oldLeader = leaderIndex(state.firms);
    const first = seededDraw(state.seed);
    state.seed = first.seed;
    const candidate = Math.floor(first.value * state.firms.length);
    const second = seededDraw(state.seed);
    state.seed = second.seed;
    const succeeds = second.value < innovationRate;

    if (succeeds) {
      const improvement = 1 + 0.05 + innovationRate * 0.17;
      state.firms[candidate] *= improvement;
      state.lastInnovator = candidate;
      state.log.unshift(`R${state.round}: Firma ${candidate + 1} innova ×${improvement.toFixed(2)}.`);
    } else {
      state.log.unshift(`R${state.round}: no aparece una innovación dominante.`);
    }

    const newLeader = leaderIndex(state.firms);
    if (newLeader !== oldLeader) {
      state.replacements += 1;
      state.displaced = oldLeader;
      state.log.unshift(`R${state.round}: Firma ${newLeader + 1} desplaza a Firma ${oldLeader + 1}.`);
    }
    return state;
  }

  function growthMetrics(firms, competition) {
    const alpha = 0.5 + 2 * competition;
    const powered = firms.map((value) => value ** alpha);
    const total = powered.reduce((sum, value) => sum + value, 0);
    const shares = powered.map((value) => value / total);
    const aggregateProductivity = shares.reduce((sum, share, index) => sum + share * firms[index], 0);
    const hhi = shares.reduce((sum, share) => sum + share ** 2, 0);
    return { shares, aggregateProductivity, hhi };
  }

  return {
    hopfieldWeights,
    hopfieldEnergy,
    hamming,
    hopfieldRecall,
    differenceInDifferences,
    applyMeasurementBreak,
    seededDraw,
    createGrowthState,
    growthStep,
    growthMetrics,
  };
});
