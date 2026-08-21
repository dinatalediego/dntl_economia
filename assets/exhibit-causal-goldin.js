function renderCausal() {
  els.mechanismIntro.textContent = "Mueve los cuatro resultados de un Difference-in-Differences y observa cómo cambia el contrafactual, no solo la correlación.";
  els.root.innerHTML = `
    <div class="sim-shell">
      <div class="sim-controls">
        <p class="sim-kicker">Economía 2021 · Inferencia causal</p>
        <h3>Construye el contrafactual.</h3>
        <p class="sim-copy">Manipula resultados medios antes y después. El efecto DiD resta al cambio tratado el cambio que también ocurrió en el control.</p>
        <div class="control-stack">
          ${rangeControl("Tratado · antes", "did-tpre", 0, 50, 0.5, 20.5)}
          ${rangeControl("Tratado · después", "did-tpost", 0, 50, 0.5, 29.5)}
          ${rangeControl("Control · antes", "did-cpre", 0, 50, 0.5, 18.5)}
          ${rangeControl("Control · después", "did-cpost", 0, 50, 0.5, 20.5)}
        </div>
        <button class="sim-button" id="did-reset" type="button">Restaurar mundo sintético</button>
      </div>
      <div class="sim-visual">
        <p class="sim-kicker">Diseño 2 × 2</p>
        <h3>Lo importante es el cambio relativo.</h3>
        <div class="did-bars">
          <div class="did-group"><span>Tratado</span><div class="did-track"><div class="did-bar" id="bar-tpre"></div><div class="did-bar after" id="bar-tpost"></div></div></div>
          <div class="did-group"><span>Control</span><div class="did-track"><div class="did-bar" id="bar-cpre"></div><div class="did-bar after" id="bar-cpost"></div></div></div>
        </div>
        <div class="did-formula" id="did-formula"></div>
        <div class="metric-grid">
          ${metric("cambio tratado", "—", "did-treated-change")}
          ${metric("cambio control", "—", "did-control-change")}
          ${metric("efecto DiD", "—", "did-effect")}
        </div>
      </div>
    </div>`;

  const ids = ["did-tpre", "did-tpost", "did-cpre", "did-cpost"];
  function value(id) { return Number(document.querySelector(`#${id}`).value); }
  function paintBar(id, amount, label) {
    const node = document.querySelector(`#${id}`);
    const width = Math.max(4, Math.min(100, amount * 2));
    node.innerHTML = `<span>${label}</span><strong>${amount.toFixed(1)}</strong>`;
    node.style.background = `linear-gradient(90deg, rgba(209,173,101,.18) ${width}%, #15202a ${width}%)`;
  }
  function update() {
    ids.forEach((id) => {
      const input = document.querySelector(`#${id}`);
      document.querySelector(`#${id}-value`).textContent = Number(input.value).toFixed(1);
    });
    const tpre = value("did-tpre");
    const tpost = value("did-tpost");
    const cpre = value("did-cpre");
    const cpost = value("did-cpost");
    const { treatedChange, controlChange, effect, counterfactual } = core.differenceInDifferences(tpre, tpost, cpre, cpost);
    paintBar("bar-tpre", tpre, "antes");
    paintBar("bar-tpost", tpost, "después");
    paintBar("bar-cpre", cpre, "antes");
    paintBar("bar-cpost", cpost, "después");
    document.querySelector("#did-treated-change").textContent = signed(treatedChange);
    document.querySelector("#did-control-change").textContent = signed(controlChange);
    document.querySelector("#did-effect").textContent = signed(effect);
    document.querySelector("#did-formula").textContent = `Contrafactual tratado = ${tpre.toFixed(1)} + (${cpost.toFixed(1)} − ${cpre.toFixed(1)}) = ${counterfactual.toFixed(1)}  |  Efecto = ${tpost.toFixed(1)} − ${counterfactual.toFixed(1)} = ${effect.toFixed(1)}`;
  }

  ids.forEach((id) => document.querySelector(`#${id}`).addEventListener("input", update));
  document.querySelector("#did-reset").addEventListener("click", () => {
    const defaults = { "did-tpre": 20.5, "did-tpost": 29.5, "did-cpre": 18.5, "did-cpost": 20.5 };
    Object.entries(defaults).forEach(([id, value]) => { document.querySelector(`#${id}`).value = value; });
    update();
  });
  update();
}

function rangeControl(label, id, min, max, step, value) {
  return `<div class="control-row"><label for="${id}">${label} · <span class="control-value" id="${id}-value">${value}</span></label><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" /></div>`;
}

function signed(value) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}`;
}

function svgPoints(values, width = 560, height = 250) {
  const padding = 28;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  return values.map((value, index) => {
    const x = padding + index * ((width - padding * 2) / (values.length - 1));
    const y = height - padding - ((value - min) / Math.max(1, max - min)) * (height - padding * 2);
    return [x, y];
  });
}

function polyline(points) {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

function renderGoldin() {
  els.mechanismIntro.textContent = "Introduce un quiebre de medición en una serie histórica y compara la historia cruda con la serie armonizada.";
  const years = [1950, 1960, 1970, 1980, 1990, 2000];
  const trueSeries = [30, 35, 41, 49, 57, 64];

  els.root.innerHTML = `
    <div class="sim-shell">
      <div class="sim-controls">
        <p class="sim-kicker">Economía 2023 · Claudia Goldin</p>
        <h3>Cambia la definición.</h3>
        <p class="sim-copy">Simula una serie donde la realidad evoluciona suavemente, pero el sistema de medición cambia en una década y crea un salto artificial.</p>
        <div class="control-stack">
          ${rangeControl("Sesgo tras el cambio", "goldin-bias", 0, 20, 1, 12)}
          <div class="control-row"><label for="goldin-break">Década del cambio</label><select id="goldin-break"><option value="2">1970</option><option value="3" selected>1980</option><option value="4">1990</option></select></div>
        </div>
        <div class="sim-button-row"><button class="sim-button" type="button" id="goldin-toggle">Ocultar verdad latente</button><button class="sim-button primary" type="button" id="goldin-harmonize">Mostrar armonización</button></div>
        <p class="sim-note">La armonización aquí conoce el sesgo verdadero porque el mundo es sintético. En datos reales, estimarlo es parte del problema científico.</p>
      </div>
      <div class="sim-visual">
        <p class="sim-kicker">Serie longitudinal</p>
        <h3>Un quiebre de definición puede parecer un quiebre económico.</h3>
        <div class="chart-frame"><svg viewBox="0 0 560 250" role="img" aria-label="Serie verdadera, cruda y armonizada" id="goldin-chart"></svg><div class="chart-legend"><span class="legend-raw">cruda</span><span class="legend-true">verdad latente</span><span class="legend-harm">armonizada</span></div></div>
        <div class="metric-grid">
          ${metric("salto aparente", "—", "goldin-jump")}
          ${metric("error final crudo", "—", "goldin-error")}
          ${metric("error armonizado", "0.0", "goldin-harm-error")}
        </div>
      </div>
    </div>`;

  let showTrue = true;
  let showHarmonized = true;

  function update() {
    const bias = Number(document.querySelector("#goldin-bias").value);
    const breakIndex = Number(document.querySelector("#goldin-break").value);
    document.querySelector("#goldin-bias-value").textContent = bias.toFixed(0);
    const { raw, harmonized } = core.applyMeasurementBreak(trueSeries, bias, breakIndex);
    const all = [...trueSeries, ...raw, ...harmonized];
    const ceiling = Math.max(...all) + 5;
    const scale = (series) => series.map((value) => value / ceiling * 100);
    const rawPts = svgPoints(scale(raw));
    const truePts = svgPoints(scale(trueSeries));
    const harmPts = svgPoints(scale(harmonized));
    const xBreak = svgPoints(scale(trueSeries))[breakIndex][0];
    const svg = document.querySelector("#goldin-chart");
    svg.innerHTML = `
      <line class="chart-axis" x1="28" y1="222" x2="532" y2="222"></line>
      <line class="chart-grid" x1="${xBreak}" y1="20" x2="${xBreak}" y2="222"></line>
      <text class="chart-label" x="${xBreak + 5}" y="35">cambio ${years[breakIndex]}</text>
      <polyline class="chart-line raw" points="${polyline(rawPts)}"></polyline>
      ${showTrue ? `<polyline class="chart-line true" points="${polyline(truePts)}"></polyline>` : ""}
      ${showHarmonized ? `<polyline class="chart-line harmonized" points="${polyline(harmPts)}"></polyline>` : ""}
      ${years.map((year, index) => `<text class="chart-label" x="${rawPts[index][0] - 13}" y="242">${String(year).slice(2)}</text>`).join("")}
    `;
    const observedJump = raw[breakIndex] - raw[breakIndex - 1];
    const trueJump = trueSeries[breakIndex] - trueSeries[breakIndex - 1];
    document.querySelector("#goldin-jump").textContent = `+${observedJump.toFixed(1)}`;
    document.querySelector("#goldin-error").textContent = `+${(raw.at(-1) - trueSeries.at(-1)).toFixed(1)}`;
    document.querySelector("#goldin-harm-error").textContent = (harmonized.at(-1) - trueSeries.at(-1)).toFixed(1);
    document.querySelector("#goldin-toggle").textContent = showTrue ? "Ocultar verdad latente" : "Mostrar verdad latente";
    document.querySelector("#goldin-harmonize").textContent = showHarmonized ? "Ocultar armonización" : "Mostrar armonización";
    document.querySelector("#goldin-jump").title = `De ese salto, ${bias.toFixed(1)} puntos vienen de medición y ${trueJump.toFixed(1)} de la evolución real.`;
  }

  document.querySelector("#goldin-bias").addEventListener("input", update);
  document.querySelector("#goldin-break").addEventListener("change", update);
  document.querySelector("#goldin-toggle").addEventListener("click", () => { showTrue = !showTrue; update(); });
  document.querySelector("#goldin-harmonize").addEventListener("click", () => { showHarmonized = !showHarmonized; update(); });
  update();
}
