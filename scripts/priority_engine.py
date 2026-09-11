#!/usr/bin/env python3
"""Rank source-only Nobel editions as candidates for future interactive rooms.

This is a deliberately modest triage heuristic, not a ranking of Nobel Prizes.
It reads only fields already committed to the repository, applies versioned rules,
and writes a static CSV. No model, database, API, or paid service runs for a visit.
"""

from __future__ import annotations

import csv
import json
import re
from dataclasses import dataclass
from hashlib import sha256
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "nobel_catalog_1995_2025.csv"
OUTPUT = ROOT / "data" / "nobel_room_candidates_1995_2020.csv"
MANIFEST = ROOT / "data" / "nobel_dataset_manifest.json"
RUBRIC_VERSION = "1.0.0"

AREA_ORDER = {
    "Física": 0,
    "Química": 1,
    "Medicina": 2,
    "Ciencias Económicas": 3,
    "Paz": 4,
    "Literatura": 5,
}


@dataclass(frozen=True)
class Archetype:
    key: str
    label: str
    interaction: str
    base_interaction: int
    base_effort: int
    signals: tuple[tuple[str, str, int], ...]


ARCHETYPES = (
    Archetype(
        "decision_lab",
        "Laboratorio de decisiones",
        "mover reglas o incentivos y comparar decisiones y resultados",
        22,
        1,
        (
            ("asymmetric information", "información asimétrica", 6),
            ("game theor*", "teoría de juegos", 5),
            ("auction*", "subastas", 5),
            ("incentive*", "incentivos", 4),
            ("market*", "mercados", 3),
            ("allocation*", "asignación", 3),
            ("decision*", "decisiones", 3),
            ("contract*", "contratos", 3),
            ("policy", "política", 2),
            ("welfare", "bienestar", 2),
            ("employment", "empleo", 2),
        ),
    ),
    Archetype(
        "causal_builder",
        "Constructor causal",
        "cambiar una condición y contrastar resultado observado y contrafactual",
        22,
        1,
        (
            ("causal*", "causalidad", 6),
            ("experiment*", "experimento", 3),
            ("cause*", "causas", 4),
            ("effect*", "efectos", 4),
            ("treatment*", "tratamiento", 4),
            ("impact*", "impacto", 3),
            ("empirical", "evidencia empírica", 3),
            ("evidence", "evidencia", 2),
            ("relationship*", "relaciones", 2),
        ),
    ),
    Archetype(
        "information_explorer",
        "Explorador de información",
        "alterar señal, ruido o incertidumbre y observar qué puede inferirse",
        21,
        2,
        (
            ("information", "información", 5),
            ("communication*", "comunicación", 5),
            ("algorithm*", "algoritmos", 5),
            ("predict*", "predicción", 4),
            ("neural", "redes neuronales", 4),
            ("learning", "aprendizaje", 4),
            ("signal*", "señales", 4),
            ("probabilit*", "probabilidad", 3),
            ("uncertain*", "incertidumbre", 3),
            ("detect*", "detección", 2),
        ),
    ),
    Archetype(
        "system_simulator",
        "Simulador de sistemas",
        "ajustar parámetros y observar la dinámica agregada del sistema",
        20,
        2,
        (
            ("equilibrium", "equilibrio", 5),
            ("mechanism*", "mecanismos", 4),
            ("dynamic*", "dinámica", 4),
            ("interaction*", "interacciones", 4),
            ("system*", "sistemas", 4),
            ("climate", "clima", 4),
            ("growth", "crecimiento", 3),
            ("regulation", "regulación", 3),
            ("formation", "formación", 2),
            ("decomposition", "descomposición", 2),
            ("evolution", "evolución", 2),
            ("process*", "procesos", 2),
            ("theor*", "teoría", 2),
            ("model*", "modelos", 2),
        ),
    ),
    Archetype(
        "detector",
        "Detector y clasificador",
        "variar umbral o ruido y comparar detecciones, omisiones y falsos positivos",
        21,
        2,
        (
            ("classification", "clasificación", 5),
            ("detect*", "detección", 4),
            ("measurement*", "medición", 4),
            ("identif*", "identificación", 3),
            ("recognition", "reconocimiento", 3),
            ("spectroscop*", "espectroscopía", 3),
            ("microscop*", "microscopía", 3),
            ("imaging", "imagen", 3),
            ("observation*", "observación", 2),
        ),
    ),
    Archetype(
        "reconstruction",
        "Taller de reconstrucción",
        "ocultar fragmentos y reconstruir una estructura con evidencia parcial",
        19,
        2,
        (
            ("structure*", "estructura", 5),
            ("reconstruct*", "reconstrucción", 5),
            ("genom*", "genoma", 4),
            ("genetic", "genética", 3),
            ("sequenc*", "secuencias", 3),
            ("memory", "memoria", 3),
            ("fragment*", "fragmentos", 3),
            ("molecular", "escala molecular", 2),
            ("histor*", "historia", 2),
            ("origin*", "origen", 2),
        ),
    ),
    Archetype(
        "process_lab",
        "Proceso paso a paso",
        "activar o bloquear etapas y seguir cómo cambia el resultado final",
        20,
        2,
        (
            ("pathway*", "rutas", 5),
            ("synthesis", "síntesis", 4),
            ("repair", "reparación", 4),
            ("transport*", "transporte", 4),
            ("activation", "activación", 3),
            ("control*", "control", 3),
            ("regulat*", "regulación", 3),
            ("formation", "formación", 3),
            ("decomposition", "descomposición", 3),
            ("reaction*", "reacciones", 3),
            ("function*", "función", 2),
            ("development", "desarrollo", 2),
        ),
    ),
    Archetype(
        "change_timeline",
        "Línea de tiempo de cambio",
        "desplazar tiempo o contexto y comparar trayectorias y puntos de quiebre",
        19,
        1,
        (
            ("over time", "cambio en el tiempo", 5),
            ("histor*", "historia", 4),
            ("transformation", "transformación", 4),
            ("evolution", "evolución", 3),
            ("development", "desarrollo", 3),
            ("change*", "cambio", 3),
            ("growth", "crecimiento", 3),
            ("emergence", "emergencia", 3),
            ("past", "pasado", 2),
        ),
    ),
    Archetype(
        "evidence_map",
        "Mapa de evidencia",
        "conectar actores, afirmaciones y fuentes sin convertir analogía en prueba",
        16,
        2,
        (
            ("human rights", "derechos humanos", 6),
            ("document*", "documentación", 5),
            ("testimon*", "testimonios", 4),
            ("democra*", "democracia", 3),
            ("peace", "paz", 3),
            ("conflict*", "conflicto", 3),
            ("freedom", "libertad", 3),
            ("campaign*", "campaña", 2),
            ("organisation*", "organización", 2),
        ),
    ),
    Archetype(
        "narrative_constellation",
        "Constelación narrativa",
        "recorrer motivos, voces y contextos y hacer visibles sus relaciones",
        15,
        2,
        (
            ("narrative*", "narrativa", 5),
            ("language", "lenguaje", 4),
            ("poetry", "poesía", 4),
            ("novel*", "novela", 4),
            ("drama*", "drama", 4),
            ("identity", "identidad", 4),
            ("culture*", "cultura", 3),
            ("memory", "memoria", 3),
            ("human condition", "condición humana", 3),
            ("experience*", "experiencia", 2),
            ("voice*", "voces", 2),
        ),
    ),
)

DEFAULT_ARCHETYPE = Archetype(
    "guided_explorer",
    "Explorador guiado",
    "comparar casos y formular una hipótesis antes de abrir una sala especializada",
    12,
    3,
    (),
)

TRANSFER_FAMILIES = {
    "información": ("information", "signal*", "communicat*", "uncertain*", "predict*"),
    "sistemas": ("system*", "interaction*", "complex*", "dynamic*", "equilibrium", "climate"),
    "cambio": ("change*", "develop*", "evolution", "growth", "transform*", "histor*"),
    "evidencia": ("evidence", "experiment*", "measure*", "detect*", "observation*", "document*"),
    "memoria": ("memory", "reconstruct*", "fragment*", "past", "genom*"),
    "decisión": ("decision*", "incentive*", "market*", "policy", "allocation*", "choice*"),
    "estructura": ("structure*", "molecular", "genetic", "sequenc*", "formation"),
    "sociedad y lenguaje": ("language", "culture*", "identity", "peace", "rights", "human*", "social"),
}

CONTROL_SIGNALS = (
    "rate*", "level*", "probabilit*", "temperature*", "price*", "amount*",
    "number*", "condition*", "time", "control*", "increase*", "decrease*",
)

QUESTION_BY_ARCHETYPE = {
    "decision_lab": "¿Qué resultado cambia al mover una regla o un incentivo?",
    "causal_builder": "¿Qué contrafactual separa una causa de una coincidencia?",
    "information_explorer": "¿Cuánta señal sobrevive cuando aumenta el ruido?",
    "system_simulator": "¿Qué patrón emerge al cambiar un parámetro del sistema?",
    "detector": "¿Cómo cambia el error cuando movemos el umbral de detección?",
    "reconstruction": "¿Qué evidencia mínima permite reconstruir la estructura?",
    "process_lab": "¿Qué etapa altera más el resultado cuando se activa o bloquea?",
    "change_timeline": "¿Qué parece estable hasta que movemos el contexto temporal?",
    "evidence_map": "¿Qué afirmaciones están respaldadas por qué fuentes y actores?",
    "narrative_constellation": "¿Qué cambia al recorrer una obra por motivo, voz y contexto?",
    "guided_explorer": "¿Qué mecanismo debería poder fallar bajo las manos del visitante?",
}


def _matches(text: str, pattern: str) -> bool:
    """Match a whole word/phrase, with ``*`` denoting a word prefix."""
    escaped = re.escape(pattern.rstrip("*")).replace(r"\ ", r"\s+")
    suffix = r"\w*" if pattern.endswith("*") else ""
    return bool(re.search(rf"\b{escaped}{suffix}\b", text, flags=re.IGNORECASE))


def _matched_signals(text: str, archetype: Archetype) -> list[tuple[str, int]]:
    matches = [(label, weight) for pattern, label, weight in archetype.signals if _matches(text, pattern)]
    return sorted(matches, key=lambda item: (-item[1], item[0]))


def _transfer_families(text: str) -> list[str]:
    return [
        label
        for label, patterns in TRANSFER_FAMILIES.items()
        if any(_matches(text, pattern) for pattern in patterns)
    ]


def _decade(year: int) -> str:
    if year < 2000:
        return "1995–1999"
    if year < 2010:
        return "2000–2009"
    return "2010–2020"


def _archetype_for(text: str, area: str) -> tuple[Archetype, list[tuple[str, int]], int]:
    scored = []
    for archetype in ARCHETYPES:
        matches = _matched_signals(text, archetype)
        if archetype.key == "causal_builder":
            has_causal_core = any(
                _matches(text, pattern)
                for pattern in ("causal*", "cause*", "effect*", "treatment*", "impact*", "relationship*")
            )
            economics_experiment = area == "Ciencias Económicas" and _matches(text, "experiment*")
            if not has_causal_core and not economics_experiment:
                matches = []
        scored.append((sum(weight for _, weight in matches), archetype, matches))
    scored.sort(key=lambda item: (-item[0], item[1].base_effort, item[1].key))
    best_score, best, matches = scored[0]
    second_score = scored[1][0]
    if best_score == 0:
        return DEFAULT_ARCHETYPE, [], 0
    return best, matches, best_score - second_score


def _family_reach(catalog: list[dict[str, str]]) -> dict[str, int]:
    areas = {family: set() for family in TRANSFER_FAMILIES}
    for row in catalog:
        text = row.get("official_motivation_en", "")
        for family in _transfer_families(text):
            areas[family].add(row.get("area", ""))
    return {family: len(values) for family, values in areas.items()}


def _candidate(row: dict[str, str], family_reach: dict[str, int]) -> dict[str, str | int]:
    text = row["official_motivation_en"]
    archetype, matches, lead = _archetype_for(text, row["area"])
    match_strength = sum(weight for _, weight in matches)
    families = _transfer_families(text)
    words = len(re.findall(r"\b[\w'-]+\b", text))
    laureate_count = int(row.get("laureate_count") or 0)
    multiple_motivations = " | " in text

    mechanism_score = min(30, 8 + match_strength)
    control_count = sum(_matches(text, pattern) for pattern in CONTROL_SIGNALS)
    interaction_score = min(25, archetype.base_interaction + min(4, control_count))
    widest_reach = max((family_reach[family] for family in families), default=0)
    transfer_score = min(20, 5 + (3 * len(families)) + widest_reach)
    source_score = min(
        15,
        (5 if row.get("official_source") else 0)
        + (3 if row.get("api_source") else 0)
        + (4 if text else 0)
        + (2 if row.get("laureates") else 0)
        + (1 if laureate_count else 0),
    )

    scope_score = 10
    if words > 35:
        scope_score -= 2
    elif words > 25:
        scope_score -= 1
    if multiple_motivations:
        scope_score -= 2
    if laureate_count > 2:
        scope_score -= 1
    if match_strength < 5:
        scope_score -= 2
    scope_score = max(4, scope_score)

    potential_score = mechanism_score + interaction_score + transfer_score + source_score + scope_score
    effort_points = archetype.base_effort
    if multiple_motivations or words > 35:
        effort_points += 1
    if match_strength < 5:
        effort_points += 1
    effort_points = min(3, effort_points)
    effort_size = {1: "S", 2: "M", 3: "L"}[effort_points]
    effort_factor = {1: 1.0, 2: 0.88, 3: 0.74}[effort_points]
    priority_score = round(potential_score * effort_factor)

    confidence = "alta" if match_strength >= 10 and lead >= 3 else "media" if match_strength >= 5 else "baja"
    signal_labels = [label for label, _ in matches]
    evidence = ", ".join(signal_labels[:3]) if signal_labels else "ninguna señal específica"
    reason = (
        f"La regla detecta {evidence}; propone {archetype.label.lower()} "
        f"con esfuerzo {effort_size}. Revisión humana pendiente."
    )

    return {
        "global_rank": 0,
        "portfolio_rank": "",
        "portfolio_role": "",
        "area": row["area"],
        "year": row["year"],
        "decade": _decade(int(row["year"])),
        "laureates": row["laureates"],
        "priority_score": priority_score,
        "potential_score": potential_score,
        "mechanism_score_30": mechanism_score,
        "interaction_score_25": interaction_score,
        "transfer_score_20": transfer_score,
        "source_score_15": source_score,
        "scope_score_10": scope_score,
        "effort_size": effort_size,
        "effort_points": effort_points,
        "confidence": confidence,
        "archetype": archetype.label,
        "interaction_prompt": archetype.interaction,
        "room_question": QUESTION_BY_ARCHETYPE[archetype.key],
        "matched_signals": "; ".join(signal_labels),
        "transfer_signals": "; ".join(families),
        "cross_area_reach": widest_reach,
        "priority_reason": reason,
        "review_status": "heuristic_candidate",
        "official_motivation_en": text,
        "official_source": row["official_source"],
        "rubric_version": RUBRIC_VERSION,
    }


def _rank_key(row: dict[str, str | int]) -> tuple[int, int, int, int]:
    return (
        -int(row["priority_score"]),
        -int(row["potential_score"]),
        AREA_ORDER[str(row["area"])],
        -int(row["year"]),
    )


def _select_balanced_portfolio(rows: list[dict[str, str | int]]) -> None:
    """Select two candidates per area, preferring a different decade for slot two."""
    selected: list[dict[str, str | int]] = []
    for area in AREA_ORDER:
        area_rows = sorted((row for row in rows if row["area"] == area), key=_rank_key)
        first = area_rows[0]
        second = next((row for row in area_rows[1:] if row["decade"] != first["decade"]), area_rows[1])
        first["portfolio_role"] = "ancla de área"
        second["portfolio_role"] = "contrapunto temporal"
        selected.extend((first, second))

    for rank, row in enumerate(sorted(selected, key=_rank_key), start=1):
        row["portfolio_rank"] = rank


def build_priority_rows(catalog: Iterable[dict[str, str]]) -> list[dict[str, str | int]]:
    catalog_rows = list(catalog)
    eligible = [row for row in catalog_rows if row.get("curation_status") == "source_only"]
    family_reach = _family_reach(eligible)
    rows = sorted((_candidate(row, family_reach) for row in eligible), key=_rank_key)
    for rank, row in enumerate(rows, start=1):
        row["global_rank"] = rank
    _select_balanced_portfolio(rows)
    validate_priority_rows(rows)
    return rows


def validate_priority_rows(rows: list[dict[str, str | int]]) -> None:
    keys = {(row["area"], row["year"]) for row in rows}
    if len(keys) != len(rows):
        raise ValueError("Priority queue contains duplicate area-year candidates")
    if [int(row["global_rank"]) for row in rows] != list(range(1, len(rows) + 1)):
        raise ValueError("Global candidate ranks are not contiguous")
    if any(not 0 <= int(row["potential_score"]) <= 100 for row in rows):
        raise ValueError("Potential scores must remain between 0 and 100")
    if any(not 0 <= int(row["priority_score"]) <= 100 for row in rows):
        raise ValueError("Priority scores must remain between 0 and 100")
    portfolio = [row for row in rows if row["portfolio_rank"] != ""]
    if len(portfolio) != 12:
        raise ValueError("Balanced portfolio must contain exactly 12 candidates")
    if any(sum(row["area"] == area for row in portfolio) != 2 for area in AREA_ORDER):
        raise ValueError("Balanced portfolio must contain two candidates per area")


def write_priority_csv(path: Path, rows: list[dict[str, str | int]]) -> None:
    if not rows:
        raise ValueError("Refusing to write an empty priority queue")
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def update_manifest(path: Path, output: Path, rows: list[dict[str, str | int]]) -> None:
    if not path.exists():
        return
    manifest = json.loads(path.read_text(encoding="utf-8"))
    manifest.setdefault("counts", {})["historical_room_candidates"] = len(rows)
    manifest["counts"]["balanced_portfolio_candidates"] = sum(row["portfolio_rank"] != "" for row in rows)
    manifest.setdefault("files", {})[str(output.relative_to(ROOT))] = sha256(output.read_bytes()).hexdigest()
    manifest["priority_rubric"] = {
        "version": RUBRIC_VERSION,
        "scope": "source_only editions; interactive-room feasibility, not Nobel importance",
        "runtime_paid_services": 0,
    }
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    with CATALOG.open(encoding="utf-8", newline="") as handle:
        rows = build_priority_rows(csv.DictReader(handle))
    write_priority_csv(OUTPUT, rows)
    update_manifest(MANIFEST, OUTPUT, rows)
    print(json.dumps({"candidates": len(rows), "portfolio": 12, "rubric": RUBRIC_VERSION}, ensure_ascii=False))


if __name__ == "__main__":
    main()
