# Nobel Data Wiki · 1995–2025

Una guía de premios Nobel recientes leídos desde la óptica de **datos, modelamiento, inferencia y representación del conocimiento**.

La colección evolucionó de seis notas seleccionadas a un **Nobel Data Lab** con cobertura factual de **186 ediciones 1995–2025** (6 áreas × 31 años), 376 registros premio-laureado, deep dives y experimentos reproducibles.

## Arquitectura

1. **Fuente cruda** — respuestas de la Nobel Prize API preservadas en [`data/raw/`](../data/raw/).
2. **Tablas públicas** — [`data/nobel_catalog_1995_2025.csv`](../data/nobel_catalog_1995_2025.csv) contiene una fila por área y año; [`data/nobel_laureates_1995_2025.csv`](../data/nobel_laureates_1995_2025.csv), una por premio y laureado.
3. **Curaduría** — las interpretaciones Data Science viven separadas en [`data/curation/`](../data/curation/).
4. **Deep dives y experimentos** — páginas y código recorren problema → evidencia → modelo/inferencia → transferencia.
5. **Tests** — [`tests/test_nobel_lab.py`](../tests/test_nobel_lab.py) comprueba cobertura, grano, provenance y resultados esperados.

➡️ [Ver la decisión arquitectónica y su demostración](decision-from-wiki-to-nobel-lab.md)

## Criterio epistemológico

La relación con datos se clasifica así:

- **Directa**: el trabajo premiado construye o usa explícitamente modelos computacionales, estadísticos o matemáticos sobre datos.
- **Metodológica**: el trabajo premiado depende de inferencia sistemática, reconstrucción de evidencia o representación estructurada.
- **Analógica / documental**: la conexión con data science es una lectura útil, pero **no fue el motivo oficial del Nobel**.

El `model_score` 1–5 del catálogo es una valoración editorial de este repositorio; no procede del Comité Nobel.

## Cobertura longitudinal

| Período | Ediciones factuales | Estado editorial |
|---|---:|---|
| 1995–2020 | 156/156 | Fuente oficial; curaduría abierta |
| 2021–2025 | 30/30 | Lentes Data Science curadas |

➡️ [Explorar el archivo 1995–2025](catalog-1995-2025.md)

➡️ [Consultar el núcleo curado 2021–2025](catalog-2021-2025.md)

## Deep dives

### 2021

- [Física 2021 — Manabe, Hasselmann y Parisi: modelos climáticos y sistemas complejos](physics-2021-climate-models.md)
- [Economía 2021 — Card, Angrist e Imbens: inferencia causal](economics-2021-causal-inference.md)

### 2022

- [Medicina 2022 — Svante Pääbo: genómica y reconstrucción](medicine-2022-paabo-genomics.md)
- [Paz 2022 — documentación como infraestructura de evidencia](peace-2022-documentation-evidence.md)
- [Literatura 2022 — Annie Ernaux y la memoria como dato social](literature-2022-ernaux-social-data.md)

### 2023

- [Economía 2023 — Claudia Goldin: construir el dataset como parte del descubrimiento](economics-2023-goldin-data.md)

### 2024

- [Física 2024 — Hopfield y Hinton: redes neuronales y memoria asociativa](physics-2024-hopfield-hinton.md)
- [Química 2024 — Baker, Hassabis y Jumper: diseño y predicción de proteínas](chemistry-2024-protein-models.md)

### 2025

- [Economía 2025 — Mokyr, Aghion y Howitt: crecimiento impulsado por innovación](economics-2025-growth-models.md)

## Ejecutar los laboratorios

```bash
python examples/economics_2021_causal_inference.py
python examples/physics_2024_hopfield.py
python -m unittest discover -s tests -v
```

Los ejemplos usan datos sintéticos y solo la biblioteca estándar de Python: primero se comprueba el mecanismo en un mundo donde conocemos la verdad; después se escala a datos reales.

## Pregunta transversal

> ¿Qué convierte observaciones imperfectas en conocimiento confiable?

En la colección aparecen respuestas distintas: representación, predicción, reconstrucción, identificación causal, dinámica estructural, documentación verificable y memoria situada.

## Fuentes

Se priorizan páginas oficiales de **NobelPrize.org**. Las 186 ediciones enlazan su fuente; el pipeline preserva respuestas de API y separa la motivación Nobel de nuestra interpretación aplicada a data science.
