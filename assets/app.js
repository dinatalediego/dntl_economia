"use strict";

const CATALOG_URL = "data/nobel_catalog_2021_2025.csv";
const REPO = "https://github.com/dinatalediego/dntl_economia/blob/main";

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

const routeRules = {
  memoria: {
    label: "Memoria & reconstrucción",
    terms: ["memoria", "reconstru", "genómica", "históric", "corpus", "testimonio", "secuencia"],
  },
  causalidad: {
    label: "Causalidad & contrafactuales",
    terms: ["causal", "institucion", "experimental", "inferencia", "mercado laboral", "crisis", "crecimiento"],
  },
  complejidad: {
    label: "Complejidad & dinámica",
    terms: ["complej", "clim", "redes", "crecimiento", "innovación", "cuánt", "regulación", "sistemas"],
  },
  evidencia: {
    label: "Evidencia & trazabilidad",
    terms: ["evidencia", "document", "inferencia", "medición", "genómica", "verific", "observación", "experimental"],
  },
  prediccion: {
    label: "Predicción & representación",
    terms: ["predic", "machine learning", "redes neuronales", "estructura", "regulación", "quantum", "cuánt"],
  },
};

const state = {
  rows: [],
  area: null,
  year: null,
  query: "",
  route: null,
};

const els = {
  grid: document.querySelector("#exhibit-grid"),
  count: document.querySelector("#result-count"),
  empty: document.querySelector("#empty-state"),
  areaFilters: document.querySelector("#area-filters"),
  yearFilters: document.querySelector("#year-filters"),
  search: document.querySelector("#search"),
  reset: document.querySelector("#reset-filters"),
  routeStatus: document.querySelector("#route-status"),
  random: document.querySelector("#random-exhibit"),
  routeCards: Array.from(document.querySelectorAll(".route-card")),
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

function routeMatches(row, routeKey) {
  if (!routeKey) return true;
  const rule = routeRules[routeKey];
  const haystack = normalize(`${row.area} ${row.laureates} ${row.model_lens} ${row.relation_class}`);
  return rule.terms.some((term) => haystack.includes(normalize(term)));
}

function queryMatches(row, query) {
  if (!query) return true;
  const haystack = normalize(`${row.area} ${row.year} ${row.laureates} ${row.model_lens} ${row.relation_class}`);
  return normalize(query).split(/\s+/).filter(Boolean).every((term) => haystack.includes(term));
}

function filteredRows() {
  return state.rows.filter((row) => {
    if (state.area && row.area !== state.area) return false;
    if (state.year && row.year !== state.year) return false;
    if (!queryMatches(row, state.query)) return false;
    if (!routeMatches(row, state.route)) return false;
    return true;
  });
}

function relationClassName(value) {
  if (value === "Directa") return "direct";
  if (value === "Metodológica") return "method";
  return "analogue";
}

function exhibitTarget(row) {
  return deepDives.get(`${row.area}|${row.year}`) || row.official_source;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function createScore(score) {
  const wrapper = element("span", "score");
  wrapper.setAttribute("aria-label", `Cercanía editorial a modelos: ${score} de 5`);
  for (let i = 1; i <= 5; i += 1) {
    wrapper.appendChild(element("i", i <= Number(score) ? "on" : ""));
  }
  return wrapper;
}

function createExhibit(row, index) {
  const card = element("article", "exhibit-card");
  card.dataset.area = row.area;
  card.dataset.year = row.year;
  card.id = `exhibit-${index}`;
  card.style.borderTopColor = areaAccents[row.area] || "#d1ad65";

  const top = element("div", "exhibit-top");
  top.append(element("span", "exhibit-area", row.area), element("span", "exhibit-year", row.year));

  const title = element("h3", "", row.laureates.replaceAll(";", " ·"));
  const lens = element("p", "exhibit-lens", row.model_lens);

  const bottom = element("div", "exhibit-bottom");
  const relation = element("span", `relation ${relationClassName(row.relation_class)}`, row.relation_class);
  bottom.append(relation, createScore(row.model_score));

  const link = element("a", "exhibit-link", `Abrir ${row.area} ${row.year}: ${row.laureates}`);
  link.href = exhibitTarget(row);
  link.target = "_blank";
  link.rel = "noreferrer";
  link.setAttribute("aria-label", `Abrir ${row.area} ${row.year}: ${row.laureates}`);

  card.append(top, title, lens, bottom, link);
  return card;
}

function render() {
  const rows = filteredRows();
  els.grid.replaceChildren(...rows.map(createExhibit));
  els.count.textContent = String(rows.length);
  els.empty.hidden = rows.length !== 0;
  els.grid.hidden = rows.length === 0;

  document.querySelectorAll(".filter-chip[data-area]").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.area === state.area);
    chip.setAttribute("aria-pressed", String(chip.dataset.area === state.area));
  });
  document.querySelectorAll(".filter-chip[data-year]").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.year === state.year);
    chip.setAttribute("aria-pressed", String(chip.dataset.year === state.year));
  });
  els.routeCards.forEach((card) => {
    const active = card.dataset.route === state.route;
    card.classList.toggle("active", active);
    card.setAttribute("aria-pressed", String(active));
  });

  if (state.route) {
    els.routeStatus.textContent = `Ruta activa: ${routeRules[state.route].label}. ${rows.length} piezas conectadas.`;
  } else {
    els.routeStatus.textContent = "Explora libremente o elige una ruta.";
  }
}

function createFilterButtons() {
  const areas = [...new Set(state.rows.map((row) => row.area))];
  const years = [...new Set(state.rows.map((row) => row.year))].sort();

  areas.forEach((area) => {
    const button = element("button", "filter-chip", area.replace("Ciencias ", ""));
    button.type = "button";
    button.dataset.area = area;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      state.area = state.area === area ? null : area;
      render();
    });
    els.areaFilters.appendChild(button);
  });

  years.forEach((year) => {
    const button = element("button", "filter-chip", year);
    button.type = "button";
    button.dataset.year = year;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      state.year = state.year === year ? null : year;
      render();
    });
    els.yearFilters.appendChild(button);
  });
}

function resetFilters() {
  state.area = null;
  state.year = null;
  state.query = "";
  state.route = null;
  els.search.value = "";
  render();
}

function wireInteractions() {
  els.search.addEventListener("input", (event) => {
    state.query = event.target.value;
    render();
  });

  els.reset.addEventListener("click", resetFilters);

  els.routeCards.forEach((card) => {
    card.setAttribute("aria-pressed", "false");
    card.addEventListener("click", () => {
      const key = card.dataset.route;
      state.route = state.route === key ? null : key;
      render();
      document.querySelector("#galeria").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  els.random.addEventListener("click", () => {
    resetFilters();
    const randomIndex = Math.floor(Math.random() * state.rows.length);
    const randomRow = state.rows[randomIndex];
    state.area = randomRow.area;
    state.year = randomRow.year;
    render();
    document.querySelector("#galeria").scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      const card = els.grid.querySelector(".exhibit-card");
      const link = card?.querySelector("a");
      link?.focus({ preventScroll: true });
    }, 500);
  });
}

async function loadCatalog() {
  try {
    const response = await fetch(CATALOG_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const csv = await response.text();
    state.rows = parseCSV(csv);
    createFilterButtons();
    wireInteractions();
    render();
  } catch (error) {
    console.error("No se pudo cargar el catálogo Nobel", error);
    els.grid.hidden = true;
    els.empty.hidden = false;
    els.empty.querySelector("h3").textContent = "El archivo del catálogo no respondió.";
    els.empty.querySelector("p").textContent = "Sirve el repositorio con un servidor HTTP local o revisa data/nobel_catalog_2021_2025.csv.";
    els.count.textContent = "0";
  }
}

loadCatalog();
