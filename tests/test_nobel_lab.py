import csv
import hashlib
import json
import unittest
from collections import Counter
from fractions import Fraction
from pathlib import Path

from examples.economics_2021_causal_inference import demo as causal_demo
from examples.physics_2024_hopfield import demo as hopfield_demo


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "nobel_catalog_1995_2025.csv"
LAUREATES = ROOT / "data" / "nobel_laureates_1995_2025.csv"
MANIFEST = ROOT / "data" / "nobel_dataset_manifest.json"


class NobelCatalogTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with CATALOG.open(encoding="utf-8", newline="") as handle:
            cls.rows = list(csv.DictReader(handle))
        with LAUREATES.open(encoding="utf-8", newline="") as handle:
            cls.laureates = list(csv.DictReader(handle))

    def test_catalog_is_complete_1995_2025(self):
        self.assertEqual(len(self.rows), 186)
        self.assertEqual(
            Counter(row["year"] for row in self.rows),
            {str(year): 6 for year in range(1995, 2026)},
        )
        self.assertEqual(
            Counter(row["area"] for row in self.rows),
            {
                "Física": 31,
                "Química": 31,
                "Medicina": 31,
                "Ciencias Económicas": 31,
                "Paz": 31,
                "Literatura": 31,
            },
        )

    def test_catalog_has_unique_area_year_pairs(self):
        pairs = {(row["area"], row["year"]) for row in self.rows}
        self.assertEqual(len(pairs), len(self.rows))

    def test_catalog_model_metadata_is_valid(self):
        valid_classes = {"Directa", "Metodológica", "Analógica/documental", "Fuente oficial"}
        for row in self.rows:
            self.assertIn(row["relation_class"], valid_classes)
            if row["curation_status"] == "curated":
                self.assertIn(int(row["model_score"]), range(1, 6))
            else:
                self.assertEqual(row["relation_class"], "Fuente oficial")
                self.assertEqual(row["model_score"], "0")
            self.assertTrue(row["official_motivation_en"])
            self.assertTrue(row["official_source"].startswith("https://www.nobelprize.org/"))

    def test_original_curated_collection_is_preserved(self):
        curated = [row for row in self.rows if row["curation_status"] == "curated"]
        self.assertEqual(len(curated), 30)
        self.assertEqual({row["year"] for row in curated}, {str(year) for year in range(2021, 2026)})

    def test_laureate_table_is_at_prize_laureate_grain(self):
        self.assertEqual(len(self.laureates), 376)
        keys = {(row["award_year"], row["area"], row["laureate_id"]) for row in self.laureates}
        self.assertEqual(len(keys), len(self.laureates))
        self.assertEqual(len({row["laureate_id"] for row in self.laureates}), 375)
        self.assertEqual({row["laureate_type"] for row in self.laureates}, {"person", "organization"})
        for row in self.laureates:
            self.assertTrue(row["display_name"])
            self.assertTrue(row["motivation_en"])
            self.assertTrue(row["official_prize_url"].startswith("https://www.nobelprize.org/"))

    def test_prize_portions_sum_to_one(self):
        totals = {}
        for row in self.laureates:
            key = (row["award_year"], row["area"])
            totals[key] = totals.get(key, Fraction(0)) + Fraction(row["portion"])
        self.assertEqual(len(totals), 186)
        self.assertTrue(all(total == 1 for total in totals.values()))

    def test_manifest_hashes_match_committed_outputs(self):
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        self.assertEqual(manifest["counts"]["prize_editions"], 186)
        self.assertEqual(manifest["counts"]["prize_laureate_rows"], 376)
        for relative_path, expected_hash in manifest["files"].items():
            actual_hash = hashlib.sha256((ROOT / relative_path).read_bytes()).hexdigest()
            self.assertEqual(actual_hash, expected_hash, relative_path)

    def test_causal_demo_identifies_known_effect(self):
        result = causal_demo()
        self.assertAlmostEqual(result["did_effect"], 7.0)
        self.assertAlmostEqual(result["counterfactual_treated_post"], 22.5)

    def test_hopfield_demo_recovers_corrupted_pattern(self):
        result = hopfield_demo()
        self.assertTrue(result["exact_recovery"])
        self.assertEqual(result["target"], result["recovered"])


if __name__ == "__main__":
    unittest.main()
