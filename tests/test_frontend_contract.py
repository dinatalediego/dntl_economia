import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
STYLES = ROOT / "assets" / "styles.css"
APP = ROOT / "assets" / "app.js"
CATALOG = ROOT / "data" / "nobel_catalog_2021_2025.csv"


class MuseumFrontendContractTests(unittest.TestCase):
    def test_frontend_entrypoints_exist(self):
        for path in (INDEX, STYLES, APP, CATALOG):
            self.assertTrue(path.exists(), f"Missing frontend dependency: {path}")

    def test_index_exposes_polymath_navigation(self):
        html = INDEX.read_text(encoding="utf-8")
        for section_id in ("rutas", "galeria", "gabinete", "laboratorio"):
            self.assertIn(f'id="{section_id}"', html)
        for route in ("memoria", "causalidad", "complejidad", "evidencia", "prediccion"):
            self.assertIn(f'data-route="{route}"', html)

    def test_frontend_uses_single_catalog_source(self):
        js = APP.read_text(encoding="utf-8")
        self.assertIn('data/nobel_catalog_2021_2025.csv', js)
        self.assertIn("fetch(CATALOG_URL)", js)
        self.assertNotIn("const catalog = [", js.lower())

    def test_accessibility_contract(self):
        html = INDEX.read_text(encoding="utf-8")
        css = STYLES.read_text(encoding="utf-8")
        self.assertIn('class="skip-link"', html)
        self.assertIn('aria-live="polite"', html)
        self.assertIn("prefers-reduced-motion", css)
        self.assertGreaterEqual(len(re.findall(r"aria-label=", html)), 3)

    def test_deep_dive_links_are_explicit(self):
        js = APP.read_text(encoding="utf-8")
        expected_pages = (
            "physics-2021-climate-models.md",
            "physics-2024-hopfield-hinton.md",
            "chemistry-2024-protein-models.md",
            "medicine-2022-paabo-genomics.md",
            "economics-2021-causal-inference.md",
            "economics-2023-goldin-data.md",
            "economics-2025-growth-models.md",
            "peace-2022-documentation-evidence.md",
            "literature-2022-ernaux-social-data.md",
        )
        for filename in expected_pages:
            self.assertIn(filename, js)
            self.assertTrue((ROOT / "wiki" / filename).exists(), filename)


if __name__ == "__main__":
    unittest.main()
