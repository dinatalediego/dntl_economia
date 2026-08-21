function renderHopfield() {
  els.mechanismIntro.textContent = "Corrompe una memoria, observa su energía y deja que la dinámica de Hopfield intente reconstruirla.";
  const target = [1, 1, 1, -1, -1, -1];
  const weights = hopfieldWeights(target);
  const corruptionSets = [[2, 4], [0, 5], [1, 3]];
  let vector = [1, 1, -1, -1, -1, -1];
  let initialEnergy = hopfieldEnergy(weights, vector);
  let corruptionIndex = 0;

  els.root.innerHTML = `
    <div class="sim-shell">
      <div class="sim-controls">
        <p class="sim-kicker">Física 2024 · Memoria asociativa</p>
        <h3>Rompe la memoria.</h3>
        <p class="sim-copy">Cada círculo es una neurona bipolar. Haz clic para cambiar su estado o usa una corrupción preparada.</p>
        <div class="sim-button-row">
          <button class="sim-button" type="button" id="hop-corrupt">Corromper 2 bits</button>
          <button class="sim-button" type="button" id="hop-reset">Estado inicial</button>
          <button class="sim-button primary" type="button" id="hop-recall">Reconstruir memoria</button>
        </div>
        <p class="sim-note">La red usa pesos hebbianos de una memoria objetivo. La demostración es deliberadamente pequeña para que cada transición sea inspeccionable.</p>
      </div>
      <div class="sim-visual">
        <p class="sim-kicker">Estado observable</p>
        <h3>La energía busca un mínimo.</h3>
        <div class="neuron-grid" id="hop-neurons" aria-label="Vector de seis neuronas"></div>
        <div class="pattern-row"><span class="pattern-label">Memoria objetivo</span><div class="pattern-dots" id="hop-target"></div></div>
        <div class="pattern-row"><span class="pattern-label">Energía</span><div><div class="energy-track"><div class="energy-fill" id="hop-energy-fill"></div></div></div></div>
        <div class="metric-grid">
          ${metric("distancia", "—", "hop-distance")}
          ${metric("energía", "—", "hop-energy")}
          ${metric("recuperación", "—", "hop-status")}
        </div>
      </div>
    </div>`;

  const neuronRoot = document.querySelector("#hop-neurons");
  const targetRoot = document.querySelector("#hop-target");
  target.forEach((value) => {
    const dot = document.createElement("span");
    dot.className = `pattern-dot ${value === 1 ? "on" : ""}`;
    targetRoot.appendChild(dot);
  });

  function updateHopfield(changed = -1) {
    neuronRoot.replaceChildren(...vector.map((value, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `neuron ${value === 1 ? "on" : "off"}${changed === index ? " changed" : ""}`;
      button.textContent = value === 1 ? "+" : "−";
      button.setAttribute("aria-label", `Neurona ${index + 1}: ${value === 1 ? "activa" : "inactiva"}. Cambiar estado.`);
      button.addEventListener("click", () => {
        vector[index] *= -1;
        initialEnergy = hopfieldEnergy(weights, vector);
        updateHopfield(index);
      });
      return button;
    }));

    const energy = hopfieldEnergy(weights, vector);
    const distance = hamming(vector, target);
    document.querySelector("#hop-distance").textContent = `${distance}/6`;
    document.querySelector("#hop-energy").textContent = energy.toFixed(1);
    document.querySelector("#hop-status").textContent = distance === 0 ? "exacta" : "incompleta";
    const minEnergy = hopfieldEnergy(weights, target);
    const span = Math.max(1, Math.abs(initialEnergy - minEnergy));
    const progress = Math.max(8, Math.min(100, 100 * (1 - Math.abs(energy - minEnergy) / (span + 1))));
    document.querySelector("#hop-energy-fill").style.width = `${progress}%`;
  }

  async function recall() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const button = document.querySelector("#hop-recall");
    button.disabled = true;
    for (let i = 0; i < vector.length; i += 1) {
      let activation = 0;
      for (let j = 0; j < vector.length; j += 1) activation += weights[i][j] * vector[j];
      vector[i] = activation >= 0 ? 1 : -1;
      updateHopfield(i);
      if (!reduced) await new Promise((resolve) => window.setTimeout(resolve, 130));
    }
    updateHopfield();
    button.disabled = false;
  }

  document.querySelector("#hop-corrupt").addEventListener("click", () => {
    vector = target.slice();
    corruptionSets[corruptionIndex % corruptionSets.length].forEach((index) => { vector[index] *= -1; });
    corruptionIndex += 1;
    initialEnergy = hopfieldEnergy(weights, vector);
    updateHopfield();
  });
  document.querySelector("#hop-reset").addEventListener("click", () => {
    vector = [1, 1, -1, -1, -1, -1];
    initialEnergy = hopfieldEnergy(weights, vector);
    updateHopfield();
  });
  document.querySelector("#hop-recall").addEventListener("click", recall);
  updateHopfield();
}
