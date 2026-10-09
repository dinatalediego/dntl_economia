import hashlib
import json
from pathlib import Path
import unittest
import zipfile

ROOT = Path(__file__).resolve().parent
PACK = ROOT / "fixtures" / "atlas-demo-v1.zip"
NAMES = {"manifest.json", "data.json", "model.json", "story.json", "scenario.json"}

class PortableAtlasPack(unittest.TestCase):
    def test_public_fixture_integrity_and_contract(self):
        with zipfile.ZipFile(PACK) as z:
            self.assertEqual(set(z.namelist()), NAMES)
            self.assertIsNone(z.testzip())
            manifest = json.loads(z.read("manifest.json"))
            self.assertEqual(manifest["classification"], "SYNTHETIC")
            self.assertEqual(set(manifest["files"]), NAMES - {"manifest.json"})
            docs = {name: z.read(name) for name in NAMES - {"manifest.json"}}
            for name, body in docs.items():
                self.assertEqual(manifest["files"][name]["bytes"], len(body))
                self.assertEqual(manifest["files"][name]["sha256"], hashlib.sha256(body).hexdigest())
            data, model = json.loads(docs["data.json"]), json.loads(docs["model.json"])
            self.assertEqual(data["classification"], "SYNTHETIC")
            self.assertEqual(data["label"], "DEMO / SYNTHETIC DATA")
            self.assertEqual(len(data["rows"]), 18)
            for row in data["rows"]:
                self.assertAlmostEqual(row["stock_open"] - row["sales"], row["stock_close"])
            self.assertEqual(model["family"], "moving_average_3")

    def test_fixture_contains_no_private_classification(self):
        with zipfile.ZipFile(PACK) as z:
            for name in NAMES:
                doc = json.loads(z.read(name))
                self.assertEqual(doc["classification"], "SYNTHETIC")
                self.assertNotEqual(doc["label"], "PRIVATE / HISTÓRICO RECONSTRUIDO")

if __name__ == "__main__":
    unittest.main()
