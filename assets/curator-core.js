"use strict";

(function exposeCuratorCore(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.NobelCuratorCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildCuratorCore() {
  const DIMENSIONS = ["memoria", "causalidad", "complejidad", "evidencia", "prediccion"];
  const LABELS = {
    memoria: "Memoria & reconstrucción",
    causalidad: "Causalidad & contrafactuales",
    complejidad: "Complejidad & dinámica",
    evidencia: "Evidencia & trazabilidad",
    prediccion: "Predicción & representación",
  };

  const RULES = {
    memoria: ["memoria", "reconstru", "históric", "histor", "genóm", "genom", "testimonio", "corpus", "secuencia", "trauma"],
    causalidad: ["causal", "contrafactual", "experimento", "identificación", "identificacion", "institucion", "mercado laboral", "tratamiento", "crisis"],
    complejidad: ["complej", "sistema", "clima", "dinámica", "dinamica", "crecimiento", "innovación", "innovacion", "red", "regulación", "regulacion", "crisis"],
    evidencia: ["evidencia", "document", "inferencia", "medición", "medicion", "observación", "observacion", "experimental", "verific", "genóm", "genom", "testimonio"],
    prediccion: ["predic", "machine learning", "neuronal", "estructura", "representación", "representacion", "cuánt", "cuant", "modelo", "regulación", "regulacion"],
  };

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function emptyVector() {
    return Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, 0]));
  }

  function vectorForRow(row) {
    const text = normalize(`${row.area || ""} ${row.model_lens || ""} ${row.relation_class || ""}`);
    const vector = emptyVector();
    DIMENSIONS.forEach((dimension) => {
      RULES[dimension].forEach((term) => {
        if (text.includes(normalize(term))) vector[dimension] += 1;
      });
    });

    if (row.area === "Paz") vector.evidencia += 0.7;
    if (row.area === "Literatura") vector.memoria += 0.45;
    if (row.area === "Ciencias Económicas") vector.causalidad += 0.35;
    if (row.area === "Física") vector.complejidad += 0.25;
    if (Number(row.model_score) >= 4) vector.prediccion += 0.15;

    const total = Object.values(vector).reduce((sum, value) => sum + value, 0);
    if (total === 0) vector.evidencia = 0.25;
    return vector;
  }

  function normalized(vector) {
    const total = DIMENSIONS.reduce((sum, dimension) => sum + Math.max(0, Number(vector[dimension] || 0)), 0);
    if (!total) return emptyVector();
    return Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, Math.max(0, Number(vector[dimension] || 0)) / total]));
  }

  function profileFromHistory(history) {
    const totals = emptyVector();
    const areaCounts = {};
    let engagement = 0;

    (history || []).forEach((entry) => {
      const visits = Math.min(3, Math.max(1, Number(entry.visits || 1)));
      const lensTouches = Object.values(entry.lenses || {}).reduce((sum, value) => sum + Number(value || 0), 0);
      const mechanismTouches = Math.min(8, Number(entry.mechanismTouches || 0));
      const weight = 1 + (visits - 1) * 0.18 + Math.min(6, lensTouches) * 0.06 + mechanismTouches * 0.04;
      const vector = entry.vector || emptyVector();
      DIMENSIONS.forEach((dimension) => { totals[dimension] += Number(vector[dimension] || 0) * weight; });
      areaCounts[entry.area] = (areaCounts[entry.area] || 0) + 1;
      engagement += weight;
    });

    const distribution = normalized(totals);
    const ranked = DIMENSIONS
      .map((dimension) => ({ dimension, label: LABELS[dimension], score: distribution[dimension] }))
      .sort((a, b) => b.score - a.score || a.dimension.localeCompare(b.dimension));

    return {
      uniqueRooms: (history || []).length,
      engagement,
      totals,
      distribution,
      ranked,
      areaCounts,
      ready: (history || []).length >= 5,
      roomsUntilReady: Math.max(0, 5 - (history || []).length),
    };
  }

  function dot(left, right) {
    return DIMENSIONS.reduce((sum, dimension) => sum + Number(left[dimension] || 0) * Number(right[dimension] || 0), 0);
  }

  function keyFor(row) {
    return `${row.area}|${row.year}`;
  }

  function topDimension(vector) {
    return DIMENSIONS
      .map((dimension) => ({ dimension, score: Number(vector[dimension] || 0) }))
      .sort((a, b) => b.score - a.score || a.dimension.localeCompare(b.dimension))[0];
  }

  function recommendations(rows, history, limit = 3) {
    const profile = profileFromHistory(history);
    const visited = new Set((history || []).map((entry) => entry.key));
    const visitedAreas = new Set((history || []).map((entry) => entry.area));
    const topTwo = new Set(profile.ranked.slice(0, 2).map((item) => item.dimension));
    const available = (rows || []).filter((row) => !visited.has(keyFor(row)));
    const pool = available.length ? available : (rows || []);

    return pool
      .map((row) => {
        const vector = normalized(vectorForRow(row));
        const affinity = dot(profile.distribution, vector);
        const dominant = topDimension(vector);
        const unseenArea = visitedAreas.has(row.area) ? 0 : 1;
        const bridge = topTwo.has(dominant.dimension) ? 1 : 0.35;
        const depth = Math.min(1, Number(row.model_score || 0) / 5);
        const surprise = unseenArea && bridge === 1 ? 1 : 0;
        const score = affinity * 0.58 + unseenArea * 0.18 + bridge * 0.12 + depth * 0.07 + surprise * 0.05;
        const reason = unseenArea
          ? `${LABELS[dominant.dimension]} aparece en tu recorrido; esta sala lo reexpresa desde ${row.area}, un territorio que todavía no has recorrido.`
          : `${LABELS[dominant.dimension]} coincide con tu perfil actual, pero esta pieza cambia el mecanismo y evita recomendarte solo más de lo mismo.`;
        return { row, score, affinity, unseenArea: Boolean(unseenArea), dominant: dominant.dimension, reason };
      })
      .sort((a, b) => b.score - a.score || Number(b.row.model_score) - Number(a.row.model_score) || keyFor(a.row).localeCompare(keyFor(b.row)))
      .slice(0, limit);
  }

  function describeProfile(profile) {
    if (!profile.uniqueRooms) return "El curador todavía no tiene señales de tu recorrido.";
    if (!profile.ready) return `El curador está calibrando tu recorrido. Visita ${profile.roomsUntilReady} sala${profile.roomsUntilReady === 1 ? "" : "s"} más para activar corredores personalizados.`;
    const first = profile.ranked[0];
    const second = profile.ranked[1];
    return `Tu recorrido está gravitando hacia ${first.label.toLowerCase()} (${Math.round(first.score * 100)}%) y ${second.label.toLowerCase()} (${Math.round(second.score * 100)}%).`;
  }

  return {
    DIMENSIONS,
    LABELS,
    RULES,
    normalize,
    vectorForRow,
    normalized,
    profileFromHistory,
    recommendations,
    describeProfile,
    keyFor,
  };
});
