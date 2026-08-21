"use strict";

const CATALOG_URL = "data/nobel_catalog_2021_2025.csv";
const REPO = "https://github.com/dinatalediego/dntl_economia/blob/main";
const core = globalThis.NobelExhibitCore;

const deepDives = new Map([
  ["Física|2021", `${REPO}/wiki/physics-2021-climate-models.md`],
  ["Física|2024", `${REPO}/wiki/physics-2024-hopfield-hinton.md`],
  ["Química|2024", `${REPO}/wiki/chemistry-2024-protein-models.md`],
  ["Medicina|2022", `${REPO}/wiki/medicine-2022-paabo-genomics.md`],
  ["Ciencias Económicas|2021", `${REPO}/wiki/economics-2021-causal-inference.md`],
  ["Ciencias Económicas|2023", `${REPO}/wiki/economics-2023-goldin-data.md`],
  ["Ciencias Económicas|2025", `${REPO}/wiki/economics-2025-growth-models.md`],
  ["Paz|2022", `${REPO}/wiki/peace-2022-documentation-evidence.md`],
  ["Literatura|2022", `${REPO}/wiki/literature-2022-ernaux-social-data.md`],
]);

const areaAccents = {
  "Física": "#6486a0",
  "Química": "#7b9270",
  "Medicina": "#9a6c64",
  "Ciencias Económicas": "#d1ad65",
  "Paz": "#6f9b91",
  "Literatura": "#8e758e",
};

const signatureQuestions = new Map([
  ["Física|2024", "¿Puede una memoria recuperar estructura cuando la observación llega incompleta?"],
  ["Ciencias Económicas|2021", "¿Qué parte del cambio observado puede atribuirse realmente al tratamiento?"],
  ["Ciencias Económicas|2023", "¿Qué ocurre cuando la definición de una variable cambia en mitad de la historia?"],
  ["Ciencias Económicas|2025", "¿Qué reglas locales de innovación producen crecimiento y reemplazo a nivel del sistema?"],
]);

const transferPrompts = {
  "Física": "¿Qué parte del ruido de tu problema contiene estructura estable y qué representación permitiría recuperarla?",
  "Química": "¿Tu output debería ser una etiqueta aislada o una estructura completa que habilite una acción posterior?",
  "Medicina": "¿Cómo conservarías el dato crudo, la contaminación y la incertidumbre antes de producir una inferencia?",
  "Ciencias Económicas": "¿Tu pregunta es descriptiva, predictiva, causal o estructural? Cambiar esa etiqueta cambia el método.",
  "Paz": "¿Puede cada afirmación importante rastrearse hasta una fuente, una fecha y una cadena de corroboración?",
  "Literatura": "¿Qué contexto cualitativo se pierde cuando una experiencia humana se reduce demasiado pronto a una columna?",
};

const els = {
  kicker: document.querySelector("#exhibit-kicker"),
  title: document.querySelector("#exhibit-title"),
  laureates: document.querySelector("#exhibit-laureates"),
  lens: document.querySelector("#exhibit-lens"),
  relation: document.querySelector("#exhibit-relation"),
  score: document.querySelector("#exhibit-score"),
  official: document.querySelector("#official-source"),
  deepDive: document.querySelector("#deep-dive-link"),
  plaqueNumber: document.querySelector("#plaque-number"),
  question: document.querySelector("#exhibit-question"),
  mechanismIntro: document.querySelector("#mechanism-intro"),
  root: document.querySelector("#interactive-root"),
  lensTabs: Array.from(document.querySelectorAll(".lens-tab")),
  lensPanel: document.querySelector("#lens-panel"),
  lensOverline: document.querySelector("#lens-overline"),
  lensHeading: document.querySelector("#lens-heading"),
  lensBody: document.querySelector("#lens-body"),
  related: document.querySelector("#related-grid"),
  random: document.querySelector("#next-random"),
};

const museumState = {
  rows: [],
  row: null,
  activeLens: "observar",
};

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [headers, ...records] = rows;
  return records.map((record) => Object.fromEntries(headers.map((header, index) => [header.trim(), (record[index] || "").trim()])));
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function keyFor(row) {
  return `${row.area}|${row.year}`;
}

function exhibitHref(row) {
  const params = new URLSearchParams({ area: row.area, year: row.year });
  return `exhibit.html?${params.toString()}`;
}

function requestedRow(rows) {
  const params = new URLSearchParams(window.location.search);
  const area = params.get("area");
  const year = params.get("year");
  return rows.find((row) => row.area === area && row.year === year)
    || rows.find((row) => keyFor(row) === "Física|2024")
    || rows[0];
}

function renderHeader(row) {
  const key = keyFor(row);
  const index = museumState.rows.findIndex((candidate) => candidate === row) + 1;
  const accent = areaAccents[row.area] || "#d1ad65";
  document.documentElement.style.setProperty("--room-accent", accent);
  document.title = `${row.area} ${row.year} · Exhibición viva`;
  els.kicker.textContent = `${row.area} · ${row.year}`;
  els.title.textContent = row.laureates.replaceAll(";", " ·");
  els.laureates.textContent = row.model_lens;
  els.lens.textContent = `Esta sala traduce la pieza a una experiencia manipulable. Relación con modelos: ${row.relation_class.toLowerCase()}.`;
  els.relation.textContent = row.relation_class;
  els.score.textContent = `Lente de modelos ${row.model_score}/5`;
  els.official.href = row.official_source;
  els.plaqueNumber.textContent = String(index).padStart(2, "0");
  els.question.textContent = signatureQuestions.get(key) || `¿Qué cambia si observas “${row.model_lens}” como un mecanismo y no solo como una descripción?`;

  const deepDive = deepDives.get(key);
  if (deepDive) {
    els.deepDive.href = deepDive;
    els.deepDive.hidden = false;
  } else {
    els.deepDive.hidden = true;
  }
}

function lensCopy(row, lens) {
  const score = Number(row.model_score);
  const copy = {
    observar: {
      overline: "Observar",
      heading: "¿Qué entra como evidencia?",
      body: `Empieza por lo observable antes que por el algoritmo. En esta pieza, la lente editorial del catálogo es “${row.model_lens}”. La pregunta útil es qué registros, mediciones, testimonios o estructuras permiten sostener esa descripción.`,
    },
    modelar: {
      overline: "Modelar",
      heading: "¿Qué estructura suponemos?",
      body: `La relación está clasificada como ${row.relation_class} y recibe ${score}/5 en cercanía editorial a modelos. Ese score no es del Comité Nobel: obliga a explicitar cuánto del aprendizaje puede traducirse razonablemente a representación, cálculo o inferencia.`,
    },
    inferir: {
      overline: "Inferir",
      heading: "¿Qué afirmación está justificada?",
      body: row.relation_class === "Directa"
        ? "Una conexión directa permite estudiar el mecanismo técnico con mayor fidelidad, pero todavía exige separar el resultado observado de los supuestos que hacen interpretable la inferencia."
        : row.relation_class === "Metodológica"
          ? "Aquí la transferencia principal está en el método de construir evidencia: procedencia, medición, comparación y trazabilidad. No conviene fingir que el Nobel premió un algoritmo que no existe."
          : "La conexión es analógica/documental. Su valor está en producir mejores preguntas y preservar contexto, no en convertir una obra o experiencia humana en una pseudo-validación estadística.",
    },
    transferir: {
      overline: "Transferir",
      heading: "¿Dónde reaparece este patrón?",
      body: transferPrompts[row.area] || "¿Qué problema propio tiene una estructura suficientemente parecida como para que esta idea genere una hipótesis comprobable?",
    },
  };
  return copy[lens];
}

function renderLens() {
  const copy = lensCopy(museumState.row, museumState.activeLens);
  els.lensOverline.textContent = copy.overline;
  els.lensHeading.textContent = copy.heading;
  els.lensBody.textContent = copy.body;
  els.lensTabs.forEach((tab) => {
    const active = tab.dataset.lens === museumState.activeLens;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
}

function tokenize(row) {
  const stop = new Set(["de", "y", "la", "el", "en", "del", "los", "las", "e", "un", "una", "por", "con", "como", "a"]);
  return new Set(
    normalize(`${row.model_lens} ${row.relation_class}`)
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 3 && !stop.has(token)),
  );
}

function similarity(a, b) {
  const left = tokenize(a);
  const right = tokenize(b);
  let shared = 0;
  left.forEach((token) => { if (right.has(token)) shared += 1; });
  const areaBonus = a.area === b.area ? 0.35 : 0;
  const classBonus = a.relation_class === b.relation_class ? 0.2 : 0;
  return shared + areaBonus + classBonus;
}

function renderRelated(row) {
  const ranked = museumState.rows
    .filter((candidate) => candidate !== row)
    .map((candidate) => ({ row: candidate, score: similarity(row, candidate) }))
    .sort((a, b) => b.score - a.score || a.row.year.localeCompare(b.row.year))
    .slice(0, 3);

  els.related.replaceChildren(...ranked.map(({ row: candidate, score }) => {
    const link = document.createElement("a");
    link.className = "related-card";
    link.href = exhibitHref(candidate);
    link.style.borderTopColor = areaAccents[candidate.area] || "#d1ad65";

    const meta = document.createElement("small");
    meta.textContent = `${candidate.area} · ${candidate.year}`;
    const title = document.createElement("h3");
    title.textContent = candidate.laureates.replaceAll(";", " ·");
    const lens = document.createElement("p");
    lens.textContent = candidate.model_lens;
    const shared = document.createElement("span");
    shared.className = "shared-score";
    shared.textContent = score >= 1 ? `${score.toFixed(1)} afinidad` : "salto lateral";
    link.append(meta, title, lens, shared);
    return link;
  }));
}

function metric(label, value, id = "") {
  return `<div class="metric"><small>${label}</small><strong${id ? ` id="${id}"` : ""}>${value}</strong></div>`;
}

function hopfieldEnergy(weights, state) { return core.hopfieldEnergy(weights, state); }
function hopfieldWeights(pattern) { return core.hopfieldWeights(pattern); }
function hamming(a, b) { return core.hamming(a, b); }
