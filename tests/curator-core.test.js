"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const curator = require("../assets/curator-core.js");

const rows = [
  { area: "Física", year: "2024", laureates: "Hopfield; Hinton", model_lens: "Redes neuronales, memoria asociativa, machine learning", relation_class: "Directa", model_score: "5" },
  { area: "Medicina", year: "2022", laureates: "Pääbo", model_lens: "Genómica antigua, reconstrucción e inferencia poblacional", relation_class: "Directa", model_score: "5" },
  { area: "Literatura", year: "2022", laureates: "Ernaux", model_lens: "Memoria individual y evidencia social", relation_class: "Analógica/documental", model_score: "2" },
  { area: "Ciencias Económicas", year: "2021", laureates: "Card; Angrist; Imbens", model_lens: "Experimentos naturales e inferencia causal", relation_class: "Directa", model_score: "5" },
  { area: "Paz", year: "2022", laureates: "Memorial", model_lens: "Documentación, provenance y evidencia", relation_class: "Metodológica", model_score: "4" },
  { area: "Química", year: "2024", laureates: "Baker; Hassabis; Jumper", model_lens: "Predicción de estructura de proteínas", relation_class: "Directa", model_score: "5" },
  { area: "Física", year: "2021", laureates: "Manabe; Hasselmann; Parisi", model_lens: "Modelos climáticos y sistemas complejos", relation_class: "Directa", model_score: "5" },
];

function entry(row, touches = 0) {
  return {
    key: curator.keyFor(row),
    area: row.area,
    year: row.year,
    vector: curator.vectorForRow(row),
    visits: 1,
    lenses: {},
    mechanismTouches: touches,
  };
}

test("curator waits for five unique rooms", () => {
  const profile4 = curator.profileFromHistory(rows.slice(0, 4).map(entry));
  assert.equal(profile4.ready, false);
  assert.equal(profile4.roomsUntilReady, 1);
  const profile5 = curator.profileFromHistory(rows.slice(0, 5).map(entry));
  assert.equal(profile5.ready, true);
  assert.equal(profile5.roomsUntilReady, 0);
});

test("visitor profile is normalized and interpretable", () => {
  const history = [entry(rows[0], 3), entry(rows[1], 2), entry(rows[2]), entry(rows[3]), entry(rows[4])];
  const profile = curator.profileFromHistory(history);
  const total = Object.values(profile.distribution).reduce((sum, value) => sum + value, 0);
  assert.ok(Math.abs(total - 1) < 1e-9);
  assert.ok(profile.ranked[0].score > 0);
  assert.ok(curator.LABELS[profile.ranked[0].dimension]);
});

test("recommendations exclude visited rooms and explain why", () => {
  const history = rows.slice(0, 5).map(entry);
  const recs = curator.recommendations(rows, history, 2);
  assert.equal(recs.length, 2);
  const visited = new Set(history.map((item) => item.key));
  recs.forEach((rec) => {
    assert.equal(visited.has(curator.keyFor(rec.row)), false);
    assert.ok(rec.reason.length > 40);
    assert.ok(Number.isFinite(rec.score));
  });
});

test("same history produces deterministic recommendations", () => {
  const history = rows.slice(0, 5).map(entry);
  const first = curator.recommendations(rows, history, 2).map((item) => curator.keyFor(item.row));
  const second = curator.recommendations(rows, history, 2).map((item) => curator.keyFor(item.row));
  assert.deepEqual(first, second);
});
