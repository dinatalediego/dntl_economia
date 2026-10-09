"""Build offline map asset from explicitly downloaded source snapshots.
Usage: python3 scripts/build_atlas.py /path/to/sources
Sources: world.json, peru/departments.geojson, peru/districts.geojson,
         gdp.json, inflation.json (World Bank v2 JSON).
"""
import json,sys,pathlib,hashlib,math
src=pathlib.Path(sys.argv[1]); out=pathlib.Path(__file__).resolve().parents[1]/'app/src/main/assets'
def read(n): return json.loads((src/n).read_text())
def simplify(points,tol):
 if len(points)<=4:return points
 a,b=points[0],points[-1];dx=b[0]-a[0];dy=b[1]-a[1];den=dx*dx+dy*dy
 far=0;idx=0
 for i,p in enumerate(points[1:-1],1):
  t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den)) if den else 0
  d=(p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2
  if d>far:far=d;idx=i
 if far<=tol*tol:return [a,b]
 return simplify(points[:idx+1],tol)[:-1]+simplify(points[idx:],tol)
def rings(g,tol):
 if g['type']=='GeometryCollection': return [r for child in g['geometries'] for r in rings(child,tol)]
 if g['type'] not in ('Polygon','MultiPolygon'):return []
 polys=[g['coordinates']] if g['type']=='Polygon' else g['coordinates'];result=[]
 for poly in polys:
  for ring in poly:
   r=simplify(ring,tol)
   if len(r)<4:r=ring
   result.append([[round(x,5),round(y,5)] for x,y,*_ in r])
 return result
indicators={}
for filename,code,label in [('gdp.json','NY.GDP.MKTP.KD.ZG','Crecimiento real del PIB'),('inflation.json','FP.CPI.TOTL.ZG','Inflación del consumidor')]:
 data=read(filename)[1]
 for row in sorted(data,key=lambda r:r['date'],reverse=True):
  iso=row.get('countryiso3code','')
  if not iso or row['value'] is None:continue
  dest=indicators.setdefault(iso,[])
  if any(x['code']==code for x in dest):continue
  dest.append(dict(label=label,code=code,year=row['date'],value=round(row['value'],2),url=f'https://data.worldbank.org/indicator/{code}?locations={row["country"]["id"]}'))
world=[]
for f in read('world.json')['features']:
 p=f['properties'];iso=p['ADM0_A3'];world.append(dict(id='world:'+iso,name=p.get('NAME_ES',p['ADMIN']),rings=rings(f['geometry'],.025),indicators=indicators.get(iso,[])))
peru=[dict(id='peru:'+f['properties']['code'],name=f['properties']['name'],rings=rings(f['geometry'],.007)) for f in read('peru/departments.geojson')['features']]
lima=[dict(id='lima:'+f['properties']['ubigeo'],name=f['properties']['name'],rings=rings(f['geometry'],.00025)) for f in read('peru/districts.geojson')['features'] if f['properties']['province_code'] in ('1501','0701')]
for group in [world,peru,lima]:group.sort(key=lambda x:x['name'])
asset={'Mundo':world,'Perú':peru,'Lima':lima,'retrieved':'2026-10-09'}
out.mkdir(parents=True,exist_ok=True);(out/'atlas.json').write_text(json.dumps(asset,ensure_ascii=False,separators=(',',':')))
manifest={n:hashlib.sha256((src/n).read_bytes()).hexdigest() for n in ['world.json','peru/departments.geojson','peru/districts.geojson','gdp.json','inflation.json']}
(out/'atlas-source-hashes.json').write_text(json.dumps(manifest,indent=2))
print({k:len(v) for k,v in asset.items() if isinstance(v,list)})
