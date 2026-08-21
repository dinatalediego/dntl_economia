function renderGrowth() {
  els.mechanismIntro.textContent = "Ajusta innovación y competencia, avanza rondas y observa productividad, concentración y reemplazo de líderes.";
  const base = [1.00, 1.04, 0.97, 1.08, 1.01, 0.95];
  let sim = core.createGrowthState(base, 2025);

  els.root.innerHTML = `
    <div class="sim-shell">
      <div class="sim-controls">
        <p class="sim-kicker">Economía 2025 · Destrucción creativa</p>
        <h3>Haz competir a las ideas.</h3>
        <p class="sim-copy">La simulación no intenta estimar una economía real. Hace visible el mecanismo: innovación local, ventaja temporal, reasignación y posible reemplazo del líder.</p>
        <div class="control-stack">
          ${rangeControl("Probabilidad de innovación", "growth-rate", 0.05, 0.95, 0.05, 0.45)}
          ${rangeControl("Intensidad competitiva", "growth-comp", 0.1, 1, 0.1, 0.7)}
        </div>
        <div class="sim-button-row"><button class="sim-button" id="growth-reset" type="button">Reiniciar</button><button class="sim-button" id="growth-step" type="button">Avanzar 1 ronda</button><button class="sim-button primary" id="growth-run" type="button">Simular 20 rondas</button></div>
      </div>
      <div class="sim-visual">
        <p class="sim-kicker">Sistema de seis firmas</p>
        <h3>La mejora agregada puede destruir posiciones locales.</h3>
        <div class="firm-board" id="firm-board"></div>
        <div class="metric-grid">
          ${metric("productividad agregada", "—", "growth-productivity")}
          ${metric("concentración HHI", "—", "growth-hhi")}
          ${metric("reemplazos líder", "0", "growth-replacements")}
        </div>
        <div class="event-log" id="growth-log" aria-live="polite"></div>
      </div>
    </div>`;

  function rate() { return Number(document.querySelector("#growth-rate").value); }
  function competition() { return Number(document.querySelector("#growth-comp").value); }
  function step() { sim = core.growthStep(sim, rate()); }

  function update() {
    document.querySelector("#growth-rate-value").textContent = `${Math.round(rate() * 100)}%`;
    document.querySelector("#growth-comp-value").textContent = competition().toFixed(1);
    const metrics = core.growthMetrics(sim.firms, competition());
    const shares = metrics.shares;
    const max = Math.max(...sim.firms);
    const board = document.querySelector("#firm-board");
    board.replaceChildren(...sim.firms.map((value, index) => {
      const firm = document.createElement("div");
      firm.className = "firm";
      const bar = document.createElement("div");
      bar.className = `firm-bar${index === sim.lastInnovator ? " innovated" : ""}${index === sim.displaced ? " displaced" : ""}`;
      bar.style.height = `${Math.max(12, 100 * value / max)}%`;
      bar.title = `Productividad ${value.toFixed(3)} · share ${(shares[index] * 100).toFixed(1)}%`;
      const label = document.createElement("div");
      label.className = "firm-label";
      label.textContent = `F${index + 1}`;
      firm.append(bar, label);
      return firm;
    }));
    document.querySelector("#growth-productivity").textContent = metrics.aggregateProductivity.toFixed(3);
    document.querySelector("#growth-hhi").textContent = metrics.hhi.toFixed(3);
    document.querySelector("#growth-replacements").textContent = String(sim.replacements);
    document.querySelector("#growth-log").innerHTML = sim.log.slice(0, 8).map((line) => `<p>${line.replace(/(Firma \d+)/g, "<strong>$1</strong>")}</p>`).join("") || "<p>Aún no hay eventos. Avanza una ronda.</p>";
  }

  function reset() {
    sim = core.createGrowthState(base, 2025);
    update();
  }

  document.querySelector("#growth-rate").addEventListener("input", update);
  document.querySelector("#growth-comp").addEventListener("input", update);
  document.querySelector("#growth-step").addEventListener("click", () => { step(); update(); });
  document.querySelector("#growth-run").addEventListener("click", () => { for (let i = 0; i < 20; i += 1) step(); update(); });
  document.querySelector("#growth-reset").addEventListener("click", reset);
  update();
}

function renderGeneric(row) {
  els.mechanismIntro.textContent = "Esta pieza usa un laboratorio curatorial común: cambia el nivel de exigencia de evidencia y observa cómo debe cambiar la afirmación.";
  els.root.innerHTML = `
    <div class="generic-lab">
      <p class="sim-kicker">Laboratorio curatorial · ${row.area} ${row.year}</p>
      <h3>¿Cuánto puedes afirmar con lo que observas?</h3>
      <p class="sim-copy">No todas las salas necesitan fingir un simulador científico. Aquí la interacción consiste en disciplinar la fuerza de la afirmación según la cercanía del premio a modelos y evidencia estructurada.</p>
      <div class="generic-question-grid">
        <article class="generic-question"><small>Observación</small><p>${row.model_lens}</p></article>
        <article class="generic-question"><small>Relación</small><p>${row.relation_class} · score editorial ${row.model_score}/5.</p></article>
        <article class="generic-question"><small>Riesgo</small><p>${genericRisk(row)}</p></article>
      </div>
      <div class="generic-control">
        ${rangeControl("Fuerza de la afirmación", "generic-claim", 1, 5, 1, Math.min(5, Number(row.model_score)))}
        <p id="generic-verdict" class="sim-copy"></p>
      </div>
    </div>`;

  function update() {
    const claim = Number(document.querySelector("#generic-claim").value);
    document.querySelector("#generic-claim-value").textContent = String(claim);
    const evidence = Number(row.model_score);
    const verdict = claim <= evidence
      ? "La fuerza de la afirmación está dentro de la evidencia que esta lectura editorial considera razonable. Aun así, vuelve a la fuente oficial antes de generalizar."
      : "La afirmación está corriendo más rápido que la evidencia de esta conexión. Conviene degradarla a hipótesis, analogía o pregunta antes de presentarla como mecanismo demostrado.";
    document.querySelector("#generic-verdict").textContent = verdict;
  }
  document.querySelector("#generic-claim").addEventListener("input", update);
  update();
}

function genericRisk(row) {
  if (row.relation_class === "Analógica/documental") return "Confundir una analogía fértil con evidencia cuantitativa o causal.";
  if (row.relation_class === "Metodológica") return "Convertir una práctica de evidencia en un algoritmo que el Nobel nunca afirmó.";
  return "Tomar una conexión técnica real y extrapolarla fuera de su dominio sin validar supuestos.";
}

function renderMechanism(row) {
  const key = keyFor(row);
  if (key === "Física|2024") renderHopfield();
  else if (key === "Ciencias Económicas|2021") renderCausal();
  else if (key === "Ciencias Económicas|2023") renderGoldin();
  else if (key === "Ciencias Económicas|2025") renderGrowth();
  else renderGeneric(row);
}
