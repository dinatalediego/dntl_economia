import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EXHIBIT = ROOT / "exhibit.html"
CORE = ROOT / "assets" / "exhibit-core.js"
APP = ROOT / "assets" / "exhibit.js"
ROUTER = ROOT / "assets" / "exhibit-router.js"
CSS = ROOT / "assets" / "exhibit.css"
INDEX = ROOT / "index.html"


class LivingExhibitsContractTests(unittest.TestCase):
    def test_living_exhibit_entrypoints_exist(self):
        for path in (EXHIBIT, CORE, APP, ROUTER, CSS, INDEX):
            self.assertTrue(path.exists(), f"Missing living exhibit dependency: {path}")

    def test_every_gallery_card_is_routed_to_an_individual_exhibit(self):
        router = ROUTER.read_text(encoding="utf-8")
        self.assertIn("exhibit.html?", router)
        self.assertIn("card.dataset.area", router)
        self.assertIn("card.dataset.year", router)
        self.assertIn("MutationObserver", router)

    def test_four_signature_simulators_are_explicit(self):
        js = APP.read_text(encoding="utf-8")
        expected = {
            "Física|2024": "renderHopfield",
            "Ciencias Económicas|2021": "renderCausal",
            "Ciencias Económicas|2023": "renderGoldin",
            "Ciencias Económicas|2025": "renderGrowth",
        }
        for key, renderer in expected.items():
            self.assertIn(key, js)
            self.assertIn(renderer, js)
        self.assertIn("renderGeneric", js)

    def test_exhibit_preserves_polymath_lenses_and_connections(self):
        html = EXHIBIT.read_text(encoding="utf-8")
        for lens in ("observar", "modelar", "inferir", "transferir"):
            self.assertIn(f'data-lens="{lens}"', html)
        self.assertIn('id="related-grid"', html)
        self.assertIn('id="interactive-root"', html)
        self.assertGreaterEqual(len(re.findall(r"aria-label=", html)), 3)

    def test_math_is_separated_from_dom_code(self):
        core = CORE.read_text(encoding="utf-8")
        app = APP.read_text(encoding="utf-8")
        for function in (
            "hopfieldRecall",
            "differenceInDifferences",
            "applyMeasurementBreak",
            "growthStep",
            "growthMetrics",
        ):
            self.assertIn(function, core)
        self.assertIn("globalThis.NobelExhibitCore", app)

    def test_home_surfaces_four_living_rooms(self):
        html = INDEX.read_text(encoding="utf-8")
        self.assertEqual(html.count('class="lab-badge">VIVA'), 4)
        self.assertIn("exhibit-router.js", html)
        self.assertIn("exhibit.css", html)


if __name__ == "__main__":
    unittest.main()
