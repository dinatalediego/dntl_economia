# Datos del Nobel Data Lab

La colección cubre las seis categorías entre 1995 y 2025, ambos años incluidos. La unidad de observación está declarada en el nombre y en el contrato de cada archivo.

| Archivo | Grano | Filas | Uso |
|---|---|---:|---|
| `nobel_catalog_1995_2025.csv` | premio × área × año | 186 | Galería y exhibiciones |
| `nobel_laureates_1995_2025.csv` | premio × laureado | 376 | Personas, organizaciones, motivaciones y afiliaciones |
| `nobel_room_candidates_1995_2020.csv` | edición histórica candidata | 156 | Cola de prototipado, score explicable y cartera equilibrada |
| `curation/nobel_model_overrides_2021_2025.csv` | área × año curado | 30 | Interpretación Data Science separada de la fuente |
| `raw/nobel_prizes_1995_2025.json.gz` | respuesta API comprimida | 186 premios | Provenance y regeneración |
| `raw/laureates_1995_2025.json.gz` | respuesta API comprimida | 375 entidades | Biografías y enlaces |
| `nobel_dataset_manifest.json` | ejecución | 1 | Período, conteos, URLs y hashes SHA-256 |

## Contrato epistemológico

- `curation_status=curated`: existe una lente editorial revisada, clasificada y puntuada por el proyecto.
- `curation_status=source_only`: la sala conserva hechos y motivación oficial, pero no finge una interpretación especializada.
- `model_score=0` significa **sin score editorial**; no significa baja calidad del premio.
- `priority_score` mide factibilidad estratégica de una futura interacción; **no mide calidad ni importancia del Nobel**.
- `topic_tags` se genera con reglas de palabras clave y sirve para navegación. No es una taxonomía del Comité Nobel.
- Las motivaciones oficiales se conservan en inglés para no presentar una traducción automática como cita oficial.

## Tabla granular de laureados

Incluye ID oficial, año, área, persona u organización, nombre, género cuando está disponible, nacimiento o fundación, fallecimiento, origen, fracción del premio, motivación, afiliaciones al recibirlo, montos, Wikipedia, Wikidata y enlaces Nobel/API.

Hay 376 filas pero 375 entidades únicas porque K. Barry Sharpless recibió dos premios dentro del período.

## Regeneración

```bash
# Actualizar desde Nobel Prize API 2.1
python scripts/sync_nobel_data.py --refresh

# Regenerar desde los JSON preservados
python scripts/sync_nobel_data.py
```

El pipeline no requiere paquetes externos. Los JSON se comprimen de forma determinista para mantener el repositorio ligero. Antes de sobrescribir las salidas valida los 186 pares área-año, la cantidad de relaciones premio-laureado y la presencia de enlaces oficiales.

La misma ejecución regenera el ranking histórico mediante una rúbrica local versionada. El navegador solo descarga el CSV resultante: no ejecuta modelos ni llama servicios pagos. La metodología completa está en [`wiki/curatorial-priority-engine.md`](../wiki/curatorial-priority-engine.md).
