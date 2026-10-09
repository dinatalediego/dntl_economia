import json,pathlib,unittest,unicodedata
ROOT=pathlib.Path(__file__).resolve().parents[1]/'app/src/main/assets'
class Assets(unittest.TestCase):
 def setUp(self):self.a=json.loads((ROOT/'atlas.json').read_text())
 def test_coverage(self):
  self.assertGreater(len(self.a['Mundo']),170);self.assertEqual(len(self.a['Perú']),25);self.assertEqual(len(self.a['Lima']),50)
 def test_priority_districts(self):
  ids={p['id'] for p in self.a['Lima']}
  self.assertTrue({'lima:150113','lima:150122','lima:150131','lima:150141'}<=ids)
 def test_unique_ids(self):
  for level in ['Mundo','Perú','Lima']:
   ids=[p['id'] for p in self.a[level]];self.assertEqual(len(ids),len(set(ids)))
 def test_valid_geometry(self):
  for level in ['Mundo','Perú','Lima']:
   for p in self.a[level]:
    self.assertTrue(p['rings'])
    for r in p['rings']:
     self.assertGreaterEqual(len(r),4);self.assertEqual(r[0],r[-1])
     for x,y in r:self.assertTrue(-180<=x<=180 and -90<=y<=90)
 def test_indicator_periods(self):
  for p in self.a['Mundo']:
   for d in p.get('indicators',[]):self.assertIn(d['year'],['2024','2025']);self.assertTrue(d['url'].startswith('https://data.worldbank.org/'))
 def test_catalog(self):
  lessons=json.loads((ROOT/'lessons.json').read_text());items=[i for c in lessons['channels'] for i in c['items']]
  self.assertGreaterEqual(len(items),30);self.assertEqual(len(items),len({i['id'] for i in items}));self.assertGreaterEqual(len(json.loads((ROOT/'museum.json').read_text())),180)
if __name__=='__main__':unittest.main()
