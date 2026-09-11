function wireLensTabs() {
  els.lensTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      museumState.activeLens = tab.dataset.lens;
      renderLens();
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
    const [catalogResponse, laureatesResponse] = await Promise.all([
      fetch(CATALOG_URL),
      fetch(LAUREATES_URL),
    ]);
    if (!catalogResponse.ok) throw new Error(`Catálogo HTTP ${catalogResponse.status}`);
    if (!laureatesResponse.ok) throw new Error(`Laureados HTTP ${laureatesResponse.status}`);
    museumState.rows = parseCSV(await catalogResponse.text());
    museumState.laureates = parseCSV(await laureatesResponse.text());
    museumState.row = requestedRow(museumState.rows);
    renderHeader(museumState.row);
    renderLaureates(museumState.row);
    renderMechanism(museumState.row);
    renderLens();
    renderRelated(museumState.row);
    wireLensTabs();
    wireRandom();
  } catch (error) {
    console.error("No se pudo preparar la exhibición", error);
    els.title.textContent = "La sala no pudo abrirse";
    els.lens.textContent = "Sirve el repositorio por HTTP y comprueba que data/nobel_catalog_1995_2025.csv esté disponible.";
    els.root.innerHTML = `<div class="generic-lab"><h3>Catálogo no disponible</h3><p class="sim-copy">${String(error.message || error)}</p></div>`;
  }
}

loadExhibit();
