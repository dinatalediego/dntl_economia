#!/usr/bin/env python3
"""Build the public Nobel Data Lab datasets from the official Nobel Prize API.

The pipeline deliberately separates official facts from local editorial curation:

1. API responses are preserved in ``data/raw``.
2. One prize-level row feeds the museum gallery.
3. One prize-laureate row exposes biographical and award detail.
4. Existing 2021–2025 model interpretations are joined as explicit overrides.

No external Python packages are required.
"""

from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
RAW = DATA / "raw"
CURATION = DATA / "curation" / "nobel_model_overrides_2021_2025.csv"
CATALOG = DATA / "nobel_catalog_1995_2025.csv"
LAUREATES = DATA / "nobel_laureates_1995_2025.csv"
MANIFEST = DATA / "nobel_dataset_manifest.json"

API_BASE = "https://api.nobelprize.org/2.1"
USER_AGENT = "dntl-economia/1.0 (educational Nobel Data Lab)"
AREA_MAP = {
    "Physics": ("Física", "physics"),
    "Chemistry": ("Química", "chemistry"),
    "Physiology or Medicine": ("Medicina", "medicine"),
    "Economic Sciences": ("Ciencias Económicas", "economic-sciences"),
    "Peace": ("Paz", "peace"),
    "Literature": ("Literatura", "literature"),
}
AREA_ORDER = {name: index for index, (name, _) in enumerate(AREA_MAP.values())}

TOPIC_RULES = {
    "memoria": ("memory", "histor", "reconstruct", "archive", "genetic", "testimony"),
    "causalidad": ("causal", "cause", "effect", "experiment", "evidence", "measurement"),
    "complejidad": ("complex", "dynamic", "interaction", "network", "system", "climate"),
    "predicción": ("predict", "model", "information", "structure", "neural", "algorithm"),
    "cambio": ("growth", "innovation", "develop", "evolution", "change", "regulation"),
}


def english(value: Any) -> str:
    if isinstance(value, dict):
        return str(value.get("en") or next(iter(value.values()), ""))
    return str(value or "")


def fetch_json(url: str) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)


def read_or_fetch(path: Path, url: str, refresh: bool) -> dict[str, Any]:
    if refresh or not path.exists():
        payload = fetch_json(url)
        path.parent.mkdir(parents=True, exist_ok=True)
        serialized = (json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode("utf-8")
        path.write_bytes(gzip.compress(serialized, compresslevel=9, mtime=0))
        return payload
    return json.loads(gzip.decompress(path.read_bytes()).decode("utf-8"))


def load_curation() -> dict[tuple[str, str], dict[str, str]]:
    with CURATION.open(encoding="utf-8", newline="") as handle:
        return {(row["area"], row["year"]): row for row in csv.DictReader(handle)}


def prize_source(area_en: str, year: str) -> str:
    _, slug = AREA_MAP[area_en]
    return f"https://www.nobelprize.org/prizes/{slug}/{year}/summary/"


def api_link(links: Iterable[dict[str, Any]], relation: str) -> str:
    return next((link.get("href", "") for link in links if link.get("rel") == relation), "")


def external_link(links: Iterable[dict[str, Any]], class_name: str) -> str:
    for link in links:
        classes = link.get("class", [])
        if class_name in classes:
            return link.get("href", "")
    return ""


def motivation_for(prize: dict[str, Any]) -> str:
    values: list[str] = []
    for laureate in prize.get("laureates", []):
        motivation = english(laureate.get("motivation"))
        if motivation and motivation not in values:
            values.append(motivation)
    return " | ".join(values)


def topics_for(text: str) -> str:
    lowered = text.casefold()
    topics = [label for label, terms in TOPIC_RULES.items() if any(term in lowered for term in terms)]
    return "; ".join(topics) if topics else "exploración"


def display_name(profile: dict[str, Any], prize_laureate: dict[str, Any]) -> str:
    for field in ("knownName", "fullName", "orgName"):
        value = english(profile.get(field) or prize_laureate.get(field))
        if value:
            return value
    return f"Laureate {prize_laureate.get('id', '')}".strip()


def location(entity: dict[str, Any]) -> tuple[str, str, str]:
    place = entity.get("place", {})
    return (
        english(place.get("city")),
        english(place.get("country")),
        english(place.get("continent")),
    )


def affiliations_for(prize: dict[str, Any]) -> str:
    values = []
    for affiliation in prize.get("affiliations", []):
        name = english(affiliation.get("nameNow") or affiliation.get("name"))
        place = english(affiliation.get("locationString"))
        value = " — ".join(part for part in (name, place) if part)
        if value:
            values.append(value)
    return " | ".join(values)


def matching_profile_prize(profile: dict[str, Any], year: str, area_en: str) -> dict[str, Any]:
    for prize in profile.get("nobelPrizes", []):
        if prize.get("awardYear") == year and english(prize.get("category")) == area_en:
            return prize
    return {}


def build_catalog(
    prizes: list[dict[str, Any]],
    curation: dict[tuple[str, str], dict[str, str]],
) -> list[dict[str, str]]:
    rows = []
    for prize in prizes:
        year = prize["awardYear"]
        area_en = english(prize["category"])
        area, _ = AREA_MAP[area_en]
        override = curation.get((area, year), {})
        motivation = motivation_for(prize)
        names = [
            english(item.get("knownName") or item.get("fullName") or item.get("orgName"))
            for item in prize.get("laureates", [])
        ]
        model_lens = override.get("model_lens") or motivation
        rows.append(
            {
                "area": area,
                "year": year,
                "laureates": "; ".join(filter(None, names)),
                "model_lens": model_lens,
                "relation_class": override.get("relation_class") or "Fuente oficial",
                "model_score": override.get("model_score") or "0",
                "curation_status": "curated" if override else "source_only",
                "topic_tags": topics_for(f"{model_lens} {motivation}"),
                "official_motivation_en": motivation,
                "laureate_count": str(len(prize.get("laureates", []))),
                "date_awarded": prize.get("dateAwarded", ""),
                "prize_amount_sek": str(prize.get("prizeAmount", "")),
                "prize_amount_adjusted_sek": str(prize.get("prizeAmountAdjusted", "")),
                "official_source": prize_source(area_en, year),
                "api_source": api_link(prize.get("links", []), "nobelPrize"),
            }
        )
    return sorted(rows, key=lambda row: (-int(row["year"]), AREA_ORDER[row["area"]]))


def build_laureates(
    prizes: list[dict[str, Any]],
    profiles: list[dict[str, Any]],
) -> list[dict[str, str]]:
    profiles_by_id = {str(profile["id"]): profile for profile in profiles}
    rows = []
    for prize in prizes:
        year = prize["awardYear"]
        area_en = english(prize["category"])
        area, _ = AREA_MAP[area_en]
        for laureate in prize.get("laureates", []):
            laureate_id = str(laureate["id"])
            profile = profiles_by_id.get(laureate_id, {})
            profile_prize = matching_profile_prize(profile, year, area_en)
            origin = profile.get("birth") or profile.get("founded") or {}
            city, country, continent = location(origin)
            is_org = bool(profile.get("orgName"))
            rows.append(
                {
                    "laureate_id": laureate_id,
                    "award_year": year,
                    "area": area,
                    "laureate_type": "organization" if is_org else "person",
                    "display_name": display_name(profile, laureate),
                    "given_name": english(profile.get("givenName")),
                    "family_name": english(profile.get("familyName")),
                    "gender": profile.get("gender", ""),
                    "birth_or_founded_date": origin.get("date", ""),
                    "death_date": profile.get("death", {}).get("date", ""),
                    "origin_city": city,
                    "origin_country": country,
                    "origin_continent": continent,
                    "portion": laureate.get("portion", profile_prize.get("portion", "")),
                    "sort_order": laureate.get("sortOrder", profile_prize.get("sortOrder", "")),
                    "motivation_en": english(laureate.get("motivation") or profile_prize.get("motivation")),
                    "affiliations": affiliations_for(profile_prize),
                    "prize_status": profile_prize.get("prizeStatus", ""),
                    "date_awarded": prize.get("dateAwarded", profile_prize.get("dateAwarded", "")),
                    "prize_amount_sek": str(prize.get("prizeAmount", profile_prize.get("prizeAmount", ""))),
                    "prize_amount_adjusted_sek": str(prize.get("prizeAmountAdjusted", profile_prize.get("prizeAmountAdjusted", ""))),
                    "official_laureate_url": external_link(profile.get("links", []), "laureate facts"),
                    "official_prize_url": prize_source(area_en, year),
                    "wikipedia_url": profile.get("wikipedia", {}).get("english", ""),
                    "wikidata_url": profile.get("wikidata", {}).get("url", ""),
                    "api_laureate_url": api_link(profile.get("links", []), "laureate"),
                }
            )
    return sorted(
        rows,
        key=lambda row: (-int(row["award_year"]), AREA_ORDER[row["area"]], int(row["sort_order"] or 0)),
    )


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    if not rows:
        raise ValueError(f"Refusing to write an empty dataset: {path}")
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate(prizes: list[dict[str, Any]], catalog: list[dict[str, str]], laureates: list[dict[str, str]], start: int, end: int) -> None:
    expected = (end - start + 1) * len(AREA_MAP)
    if len(prizes) != expected or len(catalog) != expected:
        raise ValueError(f"Expected {expected} prize editions, got {len(prizes)} API / {len(catalog)} curated rows")
    pairs = {(row["area"], row["year"]) for row in catalog}
    if len(pairs) != expected:
        raise ValueError("Duplicate or missing area-year pairs in catalog")
    api_assignments = sum(len(prize.get("laureates", [])) for prize in prizes)
    if len(laureates) != api_assignments:
        raise ValueError(f"Expected {api_assignments} prize-laureate rows, got {len(laureates)}")
    if any(not row["official_source"].startswith("https://www.nobelprize.org/") for row in catalog):
        raise ValueError("Every catalog row must retain an official Nobel source")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--start", type=int, default=1995)
    parser.add_argument("--end", type=int, default=2025)
    parser.add_argument("--refresh", action="store_true", help="Fetch fresh API responses instead of using data/raw")
    args = parser.parse_args()

    prize_url = f"{API_BASE}/nobelPrizes?nobelPrizeYear={args.start}&yearTo={args.end}&limit=1000"
    laureate_url = f"{API_BASE}/laureates?nobelPrizeYear={args.start}&yearTo={args.end}&limit=1000"
    prize_raw = RAW / f"nobel_prizes_{args.start}_{args.end}.json.gz"
    laureate_raw = RAW / f"laureates_{args.start}_{args.end}.json.gz"
    prizes_payload = read_or_fetch(prize_raw, prize_url, args.refresh)
    laureates_payload = read_or_fetch(laureate_raw, laureate_url, args.refresh)

    prizes = prizes_payload.get("nobelPrizes", [])
    profiles = laureates_payload.get("laureates", [])
    catalog = build_catalog(prizes, load_curation())
    laureates = build_laureates(prizes, profiles)
    validate(prizes, catalog, laureates, args.start, args.end)
    write_csv(CATALOG, catalog)
    write_csv(LAUREATES, laureates)

    unique_profiles = {row["laureate_id"]: row["laureate_type"] for row in laureates}
    previous_manifest = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    retrieved_at = (
        previous_manifest.get("retrieved_at_utc")
        if not args.refresh and previous_manifest.get("retrieved_at_utc")
        else datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    )
    manifest = {
        "dataset": "Nobel Data Lab longitudinal collection",
        "period": {"start": args.start, "end": args.end},
        "retrieved_at_utc": retrieved_at,
        "source": "Nobel Prize API 2.1",
        "source_urls": [prize_url, laureate_url],
        "counts": {
            "prize_editions": len(catalog),
            "prize_laureate_rows": len(laureates),
            "unique_laureate_entities": len({row["laureate_id"] for row in laureates}),
            "person_prize_rows": sum(row["laureate_type"] == "person" for row in laureates),
            "organization_prize_rows": sum(row["laureate_type"] == "organization" for row in laureates),
            "unique_people": sum(kind == "person" for kind in unique_profiles.values()),
            "unique_organizations": sum(kind == "organization" for kind in unique_profiles.values()),
            "curated_prize_editions": sum(row["curation_status"] == "curated" for row in catalog),
        },
        "files": {
            str(CATALOG.relative_to(ROOT)): sha256(CATALOG),
            str(LAUREATES.relative_to(ROOT)): sha256(LAUREATES),
            str(prize_raw.relative_to(ROOT)): sha256(prize_raw),
            str(laureate_raw.relative_to(ROOT)): sha256(laureate_raw),
        },
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest["counts"], ensure_ascii=False))


if __name__ == "__main__":
    main()
