import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXHIBIT = ROOT / "exhibit.html"
BOOTSTRAP = ROOT / "assets" / "exhibit-bootstrap.js"
ROUTER = ROOT / "assets" / "exhibit-router.js"
CORE = ROOT / "assets" / "curator-core.js"
CURATOR = ROOT / "assets" / "curator.js"
HOME = ROOT / "assets" / "curator-home.js"
CSS = ROOT / "assets" / "curator.css"


class AdaptiveCuratorContractTests(unittest.TestCase):
    def test_curator_assets_exist(self):
        for path in (CORE, CURATOR, HOME, CSS):
            self.assertTrue(path.exists(), f"Missing curator asset: {path}")

    def test_profile_uses_five_interpretable_dimensions(self):
        core = CORE.read_text(encoding="utf-8")
        for dimension in ("memoria", "causalidad", "complejidad", "evidencia", "prediccion"):
            self.assertIn(f'"{dimension}"', core)
        self.assertIn("length >= 5", core)
        self.assertIn("reason", core)

    def test_privacy_is_local_first_and_resettable(self):
        curator = CURATOR.read_text(encoding="utf-8")
        self.assertIn("localStorage", curator)
        self.assertIn("nobel.polymath.curator.v1", curator)
        self.assertIn("Borrar mi recorrido", curator)
        self.assertNotIn("fetch(", curator)

    def test_exhibit_notifies_curator_about_visit_and_lenses(self):
        bootstrap = BOOTSTRAP.read_text(encoding="utf-8")
        self.assertIn("PolymathCurator", bootstrap)
        self.assertIn("trackLens", bootstrap)
        self.assertIn("onRoomLoaded", bootstrap)

    def test_home_illuminates_recommended_cards(self):
        home = HOME.read_text(encoding="utf-8")
        css = CSS.read_text(encoding="utf-8")
        router = ROUTER.read_text(encoding="utf-8")
        self.assertIn("curator-lit", home)
        self.assertIn("curator-lit", css)
        self.assertIn("recommendations", home)
        self.assertIn("curator-home.js", router)
        self.assertIn("curator-core.js", router)

    def test_exhibit_loads_curator_assets(self):
        exhibit = EXHIBIT.read_text(encoding="utf-8")
        for asset in ("curator.css", "curator-core.js", "curator.js"):
            self.assertIn(asset, exhibit)
        self.assertIn('href="#curador"', exhibit)


if __name__ == "__main__":
    unittest.main()
