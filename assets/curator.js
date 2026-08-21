"use strict";

(function buildAdaptiveCurator() {
  const core = globalThis.NobelCuratorCore;
  if (!core) return;

  const STORAGE_KEY = "nobel.polymath.curator.v1";
  let current = null;
  let catalog = [];
  let hrefFor = null;
  let accents = {};

  function freshState() {
    return { version: 1, history: [] };
  }

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.history)) return freshState();
      return parsed;
    } catch (_) {
      return freshState();
    }
  }

  function writeState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function recordVisit(row) {
    const state = readState();
    const key = core.keyFor(row);
    const existing = state.history.find((entry) => entry.key === key);
    if (existing) {
      existing.visits = Number(existing.visits || 1) + 1;
      existing.lastVisited = Date.now();
      existing.vector = core.vectorForRow(row);
    } else {
      state.history.push({ key, area: row.area, year: row.year, vector: core.vectorForRow(row), visits: 1, lenses: {}, mechanismTouches: 0, lastVisited: Date.now() });
    }
    writeState(state);
    return state;
  }

  function mutateCurrent(mutator) {
    if (!current) return;
    const state = readState();
    const entry = state.history.find((item) => item.key === core.keyFor(current));
    if (!entry) return;
    mutator(entry);
    writeState(state);
    renderCurator();
  }

  function trackLens(lens) {
    mutateCurrent((entry) => {
      entry.lenses = entry.lenses || {};
      entry.lenses[lens] = Number(entry.lenses[lens] || 0) + 1;
    });
  }

  function trackMechanism() {
    mutateCurrent((entry) => { entry.mechanismTouches = Math.min(99, Number(entry.mechanismTouches || 0) + 1); });
  }

  function percent(score) { return `${Math.round(Number(score || 0) * 100)}%`; }

  function ensureShell() {
    let section = document.querySelector("#curador");
    if (section) return section;
    section = document.createElement("section");
    section.className = "curator-room";
    section.id = "curador";
    section.innerHTML = `
      <div class="curator-shell">
        <div class="stage-heading compact">
          <div><p class="eyebrow">Gabinete del Polímata · Curador adaptativo</p><h2>El museo empieza a leerte por tus preguntas.</h2></div>
          <p id="curator-summary">Calibrando señales del recorrido…</p>
        </div>
        <div class="curator-grid">
          <article class="curator-profile-card">
            <div class="curator-progress-row"><span>Perfil local</span><strong id="curator-room-count">0 / 5 salas</strong></div>
            <div id="curator-bars" class="curator-bars"></div>
            <p class="curator-privacy">Solo se guarda en este navegador qué salas visitas y cómo interactúas con ellas. No se guarda identidad ni texto libre.</p>
            <button class="curator-reset" id="curator-reset" type="button">Borrar mi recorrido</button>
          </article>
          <article class="curator-corridors-card">
            <div class="curator-progress-row"><span>Corredores iluminados</span><strong id="curator-status">Calibrando</strong></div>
            <div id="curator-recommendations" class="curator-recommendations"></div>
          </article>
        </div>
      </div>`;
    const exit = document.querySelector(".exhibit-exit");
    if (exit) exit.before(section);
    else document.querySelector("main")?.appendChild(section);
    section.querySelector("#curator-reset")?.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      renderCurator();
    });
    return section;
  }

  function renderBars(profile) {
    const root = document.querySelector("#curator-bars");
    if (!root) return;
    root.replaceChildren(...profile.ranked.map((item) => {
      const row = document.createElement("div");
      row.className = "curator-bar-row";
      row.innerHTML = `<div><span>${item.label}</span><strong>${percent(item.score)}</strong></div><div class="curator-bar-track"><i style="width:${percent(item.score)}"></i></div>`;
      return row;
    }));
  }

  function recommendationCard(item) {
    const link = document.createElement("a");
    link.className = "curator-recommendation";
    link.href = hrefFor ? hrefFor(item.row) : "#";
    link.style.borderTopColor = accents[item.row.area] || "var(--gold)";
    const score = Math.max(0, Math.min(1, item.score));
    link.innerHTML = `<small>${item.row.area} · ${item.row.year}</small><h3>${item.row.laureates.replaceAll(";", " ·")}</h3><p>${item.reason}</p><span>${Math.round(score * 100)} afinidad curatorial →</span>`;
    return link;
  }

  function renderRecommendations(profile, state) {
    const root = document.querySelector("#curator-recommendations");
    const status = document.querySelector("#curator-status");
    if (!root || !status) return;
    if (!profile.ready) {
      status.textContent = "Aprendiendo";
      root.innerHTML = `<div class="curator-waiting"><strong>${profile.roomsUntilReady}</strong><p>sala${profile.roomsUntilReady === 1 ? "" : "s"} más para encender corredores personalizados.</p></div>`;
      return;
    }
    status.textContent = "Personalizado";
    const recs = core.recommendations(catalog, state.history, 3);
    root.replaceChildren(...recs.map(recommendationCard));
  }

  function renderCurator() {
    ensureShell();
    const state = readState();
    const profile = core.profileFromHistory(state.history);
    const summary = document.querySelector("#curator-summary");
    const count = document.querySelector("#curator-room-count");
    if (summary) summary.textContent = core.describeProfile(profile);
    if (count) count.textContent = `${profile.uniqueRooms} / 5 salas`;
    renderBars(profile);
    renderRecommendations(profile, state);
  }

  function wireMechanismSignals() {
    const root = document.querySelector("#interactive-root");
    if (!root || root.dataset.curatorWired === "true") return;
    root.dataset.curatorWired = "true";
    root.addEventListener("change", trackMechanism);
    root.addEventListener("click", (event) => { if (event.target.closest("button")) trackMechanism(); });
  }

  function onRoomLoaded({ rows, row, exhibitHref, areaAccents }) {
    catalog = rows || [];
    current = row;
    hrefFor = exhibitHref;
    accents = areaAccents || {};
    recordVisit(row);
    renderCurator();
    wireMechanismSignals();
  }

  globalThis.PolymathCurator = { STORAGE_KEY, onRoomLoaded, trackLens, trackMechanism, readState, renderCurator };
})();
