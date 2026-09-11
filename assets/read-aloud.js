"use strict";

(function initialiseReadAloud(root, factory) {
  const api = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root && root.document) {
    root.NobelReadAloud = api;
    if (root.document.readyState === "loading") {
      root.document.addEventListener("DOMContentLoaded", api.mount, { once: true });
    } else {
      api.mount();
    }
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createReadAloud(root) {
  const DEFAULT_CHUNK_LENGTH = 220;

  function normalizeText(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function splitLongUnit(unit, maxLength) {
    const pieces = [];
    let remaining = normalizeText(unit);

    while (remaining.length > maxLength) {
      let splitAt = remaining.lastIndexOf(" ", maxLength);
      if (splitAt < Math.floor(maxLength * 0.55)) splitAt = maxLength;
      pieces.push(remaining.slice(0, splitAt).trim());
      remaining = remaining.slice(splitAt).trim();
    }

    if (remaining) pieces.push(remaining);
    return pieces;
  }

  function chunkText(value, requestedLength) {
    const text = normalizeText(value);
    const maxLength = Math.max(80, Number(requestedLength) || DEFAULT_CHUNK_LENGTH);
    if (!text) return [];
    if (text.length <= maxLength) return [text];

    const sentenceUnits = text.match(/[^.!?…]+(?:[.!?…]+[”»"']?|$)/gu) || [text];
    const units = sentenceUnits.flatMap((unit) => splitLongUnit(unit, maxLength));
    const chunks = [];
    let current = "";

    units.forEach((rawUnit) => {
      const unit = normalizeText(rawUnit);
      if (!unit) return;
      const candidate = current ? `${current} ${unit}` : unit;
      if (candidate.length <= maxLength) {
        current = candidate;
      } else {
        if (current) chunks.push(current);
        current = unit;
      }
    });

    if (current) chunks.push(current);
    return chunks;
  }

  function readableText(element) {
    if (!element || typeof element.cloneNode !== "function") return "";
    const clone = element.cloneNode(true);
    clone.querySelectorAll([
      "script",
      "style",
      "noscript",
      "svg",
      "canvas",
      "input",
      "select",
      "textarea",
      "[hidden]",
      '[aria-hidden="true"]',
      "[data-read-aloud-ignore]",
      ".read-aloud-tools",
    ].join(",")).forEach((node) => node.remove());
    return normalizeText(clone.textContent);
  }

  function sectionLabel(section, index, documentRef) {
    const explicit = normalizeText(section.dataset.readLabel || section.getAttribute("aria-label"));
    if (explicit) return explicit;

    const labelledBy = section.getAttribute("aria-labelledby");
    const labelledElement = labelledBy && documentRef.getElementById(labelledBy);
    if (labelledElement) return normalizeText(labelledElement.textContent);

    const heading = section.querySelector("h1, h2, h3");
    return normalizeText(heading && heading.textContent) || `Sección ${index + 1}`;
  }

  function buildInterface(documentRef) {
    const shell = documentRef.createElement("div");
    shell.className = "read-aloud-tools";
    shell.dataset.readAloudUi = "";
    shell.innerHTML = `
      <button class="read-aloud-trigger" id="read-aloud-trigger" type="button" aria-expanded="false" aria-controls="read-aloud-panel">
        <span aria-hidden="true">◖</span>
        <span>Escuchar</span>
      </button>
      <section class="read-aloud-panel" id="read-aloud-panel" aria-labelledby="read-aloud-title" hidden>
        <div class="read-aloud-heading">
          <div>
            <p class="read-aloud-kicker">Accesibilidad</p>
            <h2 id="read-aloud-title">Lectura en voz alta</h2>
          </div>
          <button class="read-aloud-close" type="button" aria-label="Cerrar controles de lectura">×</button>
        </div>
        <p class="read-aloud-intro">Escucha una sección con las voces de tu navegador. No requiere cuenta, micrófono ni una API del museo.</p>
        <div class="read-aloud-fields">
          <label for="read-aloud-section">Contenido
            <select id="read-aloud-section"></select>
          </label>
          <label for="read-aloud-rate">Velocidad
            <select id="read-aloud-rate">
              <option value="0.75">0,75×</option>
              <option value="1" selected>1×</option>
              <option value="1.25">1,25×</option>
              <option value="1.5">1,5×</option>
            </select>
          </label>
        </div>
        <div class="read-aloud-actions" aria-label="Controles de lectura">
          <button class="read-aloud-play" type="button">Leer sección</button>
          <button class="read-aloud-pause" type="button" disabled>Pausar</button>
          <button class="read-aloud-stop" type="button" disabled>Detener</button>
        </div>
        <p class="read-aloud-status" role="status" aria-live="polite" aria-atomic="true">Elige una sección y pulsa «Leer sección».</p>
        <p class="read-aloud-note">Esta ayuda complementa —no sustituye— lectores de pantalla como NVDA, JAWS o VoiceOver.</p>
      </section>`;
    return shell;
  }

  function mount() {
    const documentRef = root && root.document;
    if (!documentRef || documentRef.querySelector("[data-read-aloud-ui]")) return null;

    const main = documentRef.querySelector("main");
    if (!main) return null;

    const shell = buildInterface(documentRef);
    const skipLink = documentRef.querySelector(".skip-link");
    if (skipLink) skipLink.insertAdjacentElement("afterend", shell);
    else documentRef.body.insertAdjacentElement("afterbegin", shell);

    const trigger = shell.querySelector(".read-aloud-trigger");
    const panel = shell.querySelector(".read-aloud-panel");
    const closeButton = shell.querySelector(".read-aloud-close");
    const sectionSelect = shell.querySelector("#read-aloud-section");
    const rateSelect = shell.querySelector("#read-aloud-rate");
    const playButton = shell.querySelector(".read-aloud-play");
    const pauseButton = shell.querySelector(".read-aloud-pause");
    const stopButton = shell.querySelector(".read-aloud-stop");
    const status = shell.querySelector(".read-aloud-status");
    const sections = new Map();

    Array.from(main.children)
      .filter((element) => element.matches("section, article") && !element.hasAttribute("data-read-aloud-ignore"))
      .forEach((section, index) => {
        const key = `section-${index}`;
        const option = documentRef.createElement("option");
        option.value = key;
        option.textContent = sectionLabel(section, index, documentRef);
        sectionSelect.append(option);
        sections.set(key, section);
      });

    const allOption = documentRef.createElement("option");
    allOption.value = "all";
    allOption.textContent = "Toda la página (lectura extensa)";
    sectionSelect.append(allOption);
    sections.set("all", main);

    const synthesis = root.speechSynthesis;
    const supported = Boolean(synthesis && root.SpeechSynthesisUtterance);
    let chunks = [];
    let chunkIndex = 0;
    let session = 0;
    let state = "idle";
    let preferredVoice = null;

    function updateVoice() {
      if (!supported) return;
      const voices = synthesis.getVoices();
      preferredVoice = voices.find((voice) => /^es[-_](ES|419)$/i.test(voice.lang))
        || voices.find((voice) => /^es\b/i.test(voice.lang))
        || null;
    }

    function setState(nextState) {
      state = nextState;
      const active = state === "speaking" || state === "paused";
      pauseButton.disabled = !active;
      stopButton.disabled = !active;
      pauseButton.textContent = state === "paused" ? "Continuar" : "Pausar";
      playButton.textContent = active ? "Reiniciar sección" : "Leer sección";
    }

    function setStatus(message) {
      status.textContent = message;
    }

    function stopReading(announce) {
      session += 1;
      if (supported) synthesis.cancel();
      chunks = [];
      chunkIndex = 0;
      setState("idle");
      if (announce) setStatus("Lectura detenida.");
    }

    function speakNext(activeSession, sectionName) {
      if (activeSession !== session) return;
      if (chunkIndex >= chunks.length) {
        setState("idle");
        setStatus(`Lectura de «${sectionName}» finalizada.`);
        return;
      }

      const utterance = new root.SpeechSynthesisUtterance(chunks[chunkIndex]);
      utterance.lang = preferredVoice ? preferredVoice.lang : "es-ES";
      utterance.rate = Number(rateSelect.value);
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.onend = () => {
        if (activeSession !== session) return;
        chunkIndex += 1;
        speakNext(activeSession, sectionName);
      };
      utterance.onerror = (event) => {
        if (activeSession !== session || event.error === "canceled" || event.error === "interrupted") return;
        setState("idle");
        setStatus("No se pudo continuar la lectura. Puedes usar el lector de pantalla del sistema.");
      };

      setStatus(`Leyendo «${sectionName}»: fragmento ${chunkIndex + 1} de ${chunks.length}.`);
      synthesis.speak(utterance);
    }

    function startReading() {
      if (!supported) return;
      stopReading(false);
      const selected = sections.get(sectionSelect.value) || main;
      const text = readableText(selected);
      const sectionName = sectionSelect.options[sectionSelect.selectedIndex].textContent;
      chunks = chunkText(text, DEFAULT_CHUNK_LENGTH);
      if (!chunks.length) {
        setStatus("La sección elegida todavía no contiene texto para leer.");
        return;
      }

      chunkIndex = 0;
      session += 1;
      const activeSession = session;
      setState("speaking");
      speakNext(activeSession, sectionName);
    }

    function togglePanel(forceOpen) {
      const open = typeof forceOpen === "boolean" ? forceOpen : panel.hidden;
      panel.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
      if (open) sectionSelect.focus();
      else trigger.focus();
    }

    trigger.addEventListener("click", () => togglePanel());
    closeButton.addEventListener("click", () => togglePanel(false));
    playButton.addEventListener("click", startReading);
    stopButton.addEventListener("click", () => stopReading(true));
    pauseButton.addEventListener("click", () => {
      if (!supported || state === "idle") return;
      if (state === "paused") {
        synthesis.resume();
        setState("speaking");
        setStatus("Lectura reanudada.");
      } else {
        synthesis.pause();
        setState("paused");
        setStatus("Lectura pausada.");
      }
    });
    sectionSelect.addEventListener("change", () => {
      if (state !== "idle") stopReading(false);
      setStatus(`Preparada: «${sectionSelect.options[sectionSelect.selectedIndex].textContent}».`);
    });
    documentRef.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !panel.hidden) togglePanel(false);
    });
    root.addEventListener("beforeunload", () => stopReading(false));

    if (supported) {
      updateVoice();
      if (typeof synthesis.addEventListener === "function") {
        synthesis.addEventListener("voiceschanged", updateVoice);
      }
    } else {
      playButton.disabled = true;
      pauseButton.disabled = true;
      stopButton.disabled = true;
      setStatus("Este navegador no ofrece lectura en voz alta. El contenido conserva su estructura para lectores de pantalla.");
    }

    return { shell, startReading, stopReading };
  }

  return {
    chunkText,
    mount,
    normalizeText,
    readableText,
  };
});
