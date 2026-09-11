import csv
import tempfile
import unittest
from collections import Counter
from pathlib import Path

from scripts.priority_engine import build_priority_rows, write_priority_csv


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "nobel_catalog_1995_2025.csv"
CANDIDATES = ROOT / "data" / "nobel_room_candidates_1995_2020.csv"


class CuratorialPriorityEngineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with CATALOG.open(encoding="utf-8", newline="") as handle:
            cls.catalog = list(csv.DictReader(handle))
        with CANDIDATES.open(encoding="utf-8", newline="") as handle:
            cls.rows = list(csv.DictReader(handle))

    def test_queue_covers_every_source_only_historical_edition(self):
        expected = {
            (row["area"], row["year"])
            for row in self.catalog
            if row["curation_status"] == "source_only"
        }
        actual = {(row["area"], row["year"]) for row in self.rows}
        self.assertEqual(len(self.rows), 156)
        self.assertEqual(actual, expected)
        self.assertEqual({row["year"] for row in self.rows}, {str(year) for year in range(1995, 2021)})

    def test_scores_are_bounded_decomposable_and_effort_adjusted(self):
        factors = {"S": 1.0, "M": 0.88, "L": 0.74}
        for row in self.rows:
            dimensions = sum(
                int(row[field])
                for field in (
                    "mechanism_score_30",
                    "interaction_score_25",
                    "transfer_score_20",
                    "source_score_15",
                    "scope_score_10",
                )
            )
            self.assertEqual(int(row["potential_score"]), dimensions)
            self.assertEqual(int(row["priority_score"]), round(dimensions * factors[row["effort_size"]]))
            self.assertIn(int(row["potential_score"]), range(101))
            self.assertIn(int(row["priority_score"]), range(101))

    def test_global_rank_is_contiguous_and_deterministic(self):
        self.assertEqual([int(row["global_rank"]) for row in self.rows], list(range(1, 157)))
        regenerated = build_priority_rows(self.catalog)
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "priority.csv"
            write_priority_csv(output, regenerated)
            self.assertEqual(output.read_bytes(), CANDIDATES.read_bytes())

    def test_portfolio_balances_areas_and_time(self):
        portfolio = [row for row in self.rows if row["portfolio_rank"]]
        self.assertEqual(len(portfolio), 12)
        self.assertEqual(sorted(int(row["portfolio_rank"]) for row in portfolio), list(range(1, 13)))
        self.assertEqual(
            Counter(row["area"] for row in portfolio),
            {
                "Física": 2,
                "Química": 2,
                "Medicina": 2,
                "Ciencias Económicas": 2,
                "Paz": 2,
                "Literatura": 2,
            },
        )
        for area in {row["area"] for row in portfolio}:
            self.assertEqual(len({row["decade"] for row in portfolio if row["area"] == area}), 2)

    def test_every_candidate_exposes_rules_evidence_and_human_review_status(self):
        for row in self.rows:
            self.assertTrue(row["archetype"])
            self.assertTrue(row["interaction_prompt"])
            self.assertTrue(row["room_question"])
            self.assertTrue(row["priority_reason"].endswith("Revisión humana pendiente."))
            self.assertEqual(row["review_status"], "heuristic_candidate")
            self.assertEqual(row["rubric_version"], "1.0.0")
            self.assertTrue(row["official_source"].startswith("https://www.nobelprize.org/"))


if __name__ == "__main__":
    unittest.main()
