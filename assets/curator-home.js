"use strict";

(function buildHomeCurator() {
  const core = globalThis.NobelCuratorCore;
  if (!core) return;
  const STORAGE_KEY = "nobel.polymath.curator.v1";

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return parsed && parsed.version === 1 && Array.isArray(parsed.history) ? parsed : { version: 1, history: [] };
    } catch (_) {
      return { version: 1, history: [] };
    }
  }

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];
      if (char === '"' && quoted && next === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = !quoted;
      else if (char === "," && !quoted) { row.push(field); field = ""; }
      else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && next === "\n") i += 1;
        row.push(field);
        if (row.some((cell) => cell.length)) rows.push(row);
        row = [];
        field = "";
      } else field += char;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    const [headers, ...records] = rows;
    return records.map((record) => Object.fromEntries(headers.map((header, index) => [header.trim(), (record[index] || "").trim()])));
  }

  function exhibitHref(row) {
    const params = new URLSearchParams({ area: row.area, year: row.year });
    return `exhibit.html?${params.toString()}`;
  }

  function render(rows) {
    const state = readState();
    const profile = core.profileFromHistory(state.history);
    let section = document.querySelector("#curador-personal");
    if (!section) {
      section = document.createElement("section");
      section.id = "curador-personal";
      section.className = "home-curator section";
      const cabinet = document.querySelector("#gabinete");
      if (cabinet) cabinet.after(section);
      else document.querySelector("main")?.appendChild(section);
    }

    const profileBars = profile.ranked.map((item) => `
      <div class="home-curator-mini"><span>${item.label}</span><strong>${Math.round(item.score * 100)}%</strong></div>`).join("");

    if (!profile.ready) {
      section.innerHTML = `
        <div class="section-heading">
          <div><p class="eyebrow">El curador está aprendiendo</p><h2>Tu constelación todavía se está formando.</h2></div>
          <p>${core.describeProfile(profile)}</p>
        </div>
        <div class="home-curator-calibration">${profileBars}<p>El perfil vive solo en este navegador. Abre ${profile.roomsUntilReady} sala${profile.roomsUntilReady === 1 ? "" : "s"} más para encender corredores personalizados.</p></div>`;
      return;
    }

    const recs = core.recommendations(rows, state.history, 3);
    section.innerHTML = `
      <div class="section-heading">
        <div><p class="eyebrow">Tu Gabinete del Polímata</p><h2>El museo ya detectó por dónde estás pensando.</h2></div>
        <p>${core.describeProfile(profile)}</p>
      </div>
      <div class="home-curator-layout">
        <div class="home-curator-profile">${profileBars}</div>
        <div class="home-curator-corridors">
          ${recs.map((item, index) => `
            <a href="${exhibitHref(item.row)}" class="home-corridor">
              <span>Corredor ${String(index + 1).padStart(2, "0")} · ${item.row.area} ${item.row.year}</span>
              <h3>${item.row.laureates.replaceAll(";", " ·")}</h3>
              <p>${item.reason}</p>
            </a>`).join("")}
        </div>
      </div>`;

    const recommended = new Set(recs.map((item) => core.keyFor(item.row)));
    const illuminate = () => {
      document.querySelectorAll(".exhibit-card").forEach((card) => {
        const key = `${card.dataset.area}|${card.dataset.year}`;
        card.classList.toggle("curator-lit", recommended.has(key));
      });
    };
    illuminate();
    const grid = document.querySelector("#exhibit-grid");
    if (grid) new MutationObserver(illuminate).observe(grid, { childList: true });
  }

  fetch("data/nobel_catalog_2021_2025.csv")
    .then((response) => response.ok ? response.text() : Promise.reject(new Error(`HTTP ${response.status}`)))
    .then((text) => render(parseCSV(text)))
    .catch((error) => console.warn("Curador doméstico no disponible", error));
})();
