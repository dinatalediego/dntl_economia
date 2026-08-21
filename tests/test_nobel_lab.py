import csv
import unittest
from collections import Counter
from pathlib import Path

from examples.economics_2021_causal_inference import demo as causal_demo
from examples.physics_2024_hopfield import demo as hopfield_demo


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "nobel_catalog_2021_2025.csv"


class NobelCatalogTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with CATALOG.open(encoding="utf-8", newline="") as handle:
            cls.rows = list(csv.DictReader(handle))

    def test_catalog_is_complete_2021_2025(self):
        self.assertEqual(len(self.rows), 30)
        self.assertEqual(
            Counter(row["year"] for row in self.rows),
            {str(year): 6 for year in range(2021, 2026)},
        )
        self.assertEqual(
            Counter(row["area"] for row in self.rows),
            {
                "Física": 5,
                "Química": 5,
                "Medicina": 5,
                "Ciencias Económicas": 5,
                "Paz": 5,
                "Literatura": 5,
            },
        )

    def test_catalog_has_unique_area_year_pairs(self):
        pairs = {(row["area"], row["year"]) for row in self.rows}
        self.assertEqual(len(pairs), len(self.rows))

    def test_catalog_model_metadata_is_valid(self):
        valid_classes = {"Directa", "Metodológica", "Analógica/documental"}
        for row in self.rows:
            self.assertIn(row["relation_class"], valid_classes)
            self.assertIn(int(row["model_score"]), range(1, 6))
            self.assertTrue(row["official_source"].startswith("https://www.nobelprize.org/"))

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
