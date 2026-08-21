function wireLensTabs() {
  els.lensTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      museumState.activeLens = tab.dataset.lens;
      renderLens();
      globalThis.PolymathCurator?.trackLens(tab.dataset.lens);
      els.lensPanel.focus({ preventScroll: true });
    });
  });
}

function wireRandom() {
  els.random.addEventListener("click", () => {
    const currentIndex = museumState.rows.indexOf(museumState.row);
    const nextIndex = (currentIndex * 7 + 11) % museumState.rows.length;
    window.location.href = exhibitHref(museumState.rows[nextIndex]);
  });
}

async function loadExhibit() {
  try {
    const response = await fetch(CATALOG_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    museumState.rows = parseCSV(await response.text());
    museumState.row = requestedRow(museumState.rows);
    renderHeader(museumState.row);
    renderMechanism(museumState.row);
    renderLens();
    renderRelated(museumState.row);
    wireLensTabs();
    wireRandom();
    globalThis.PolymathCurator?.onRoomLoaded({
      rows: museumState.rows,
      row: museumState.row,
      exhibitHref,
      areaAccents,
    });
  } catch (error) {
    console.error("No se pudo preparar la exhibición", error);
    els.title.textContent = "La sala no pudo abrirse";
    els.lens.textContent = "Sirve el repositorio por HTTP y comprueba que data/nobel_catalog_2021_2025.csv esté disponible.";
    els.root.innerHTML = `<div class="generic-lab"><h3>Catálogo no disponible</h3><p class="sim-copy">${String(error.message || error)}</p></div>`;
  }
}

loadExhibit();
