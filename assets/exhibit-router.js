"use strict";

(function routeMuseumCardsToLivingExhibits() {
  const grid = document.querySelector("#exhibit-grid");
  if (!grid) return;

  const signatureKeys = new Set([
    "Física|2024",
    "Ciencias Económicas|2021",
    "Ciencias Económicas|2023",
    "Ciencias Económicas|2025",
  ]);

  function localHref(card) {
    const params = new URLSearchParams({
      area: card.dataset.area || "",
      year: card.dataset.year || "",
    });
    return `exhibit.html?${params.toString()}`;
  }

  function enhanceCards() {
    grid.querySelectorAll(".exhibit-card").forEach((card) => {
      const link = card.querySelector(".exhibit-link");
      if (!link) return;

      link.href = localHref(card);
      link.target = "_self";
      link.rel = "";
      link.textContent = "Entrar a la exhibición →";

      const key = `${card.dataset.area}|${card.dataset.year}`;
      if (signatureKeys.has(key) && !card.querySelector(".live-stamp")) {
        const stamp = document.createElement("span");
        stamp.className = "live-stamp";
        stamp.textContent = "SALA VIVA";
        stamp.setAttribute("aria-label", "Esta pieza incluye un simulador especializado");
        card.appendChild(stamp);
      }
    });
  }

  const observer = new MutationObserver(enhanceCards);
  observer.observe(grid, { childList: true });
  enhanceCards();
})();
