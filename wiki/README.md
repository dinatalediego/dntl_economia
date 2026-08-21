# Nobel Data Wiki · 2021–2025

Una guía de premios Nobel recientes leídos desde la óptica de **datos, modelamiento, inferencia y representación del conocimiento**.

La colección evolucionó de seis notas seleccionadas a un **Nobel Data Lab** con cobertura completa de las **30 ediciones 2021–2025** (6 áreas × 5 años), deep dives y experimentos reproducibles.

## Arquitectura

1. **Catálogo** — [`data/nobel_catalog_2021_2025.csv`](../data/nobel_catalog_2021_2025.csv) contiene una fila por área y año.
2. **Deep dives** — páginas que explican problema → evidencia → modelo/inferencia → transferencia.
3. **Experimentos** — [`examples/`](../examples/) convierte ideas Nobel en código mínimo ejecutable.
4. **Tests** — [`tests/test_nobel_lab.py`](../tests/test_nobel_lab.py) comprueba cobertura y resultados esperados.

➡️ [Ver la decisión arquitectónica y su demostración](decision-from-wiki-to-nobel-lab.md)

## Criterio epistemológico

La relación con datos se clasifica así:

- **Directa**: el trabajo premiado construye o usa explícitamente modelos computacionales, estadísticos o matemáticos sobre datos.
- **Metodológica**: el trabajo premiado depende de inferencia sistemática, reconstrucción de evidencia o representación estructurada.
- **Analógica / documental**: la conexión con data science es una lectura útil, pero **no fue el motivo oficial del Nobel**.

El `model_score` 1–5 del catálogo es una valoración editorial de este repositorio; no procede del Comité Nobel.

## Cobertura 2021–2025

| Año | Ediciones catalogadas | Deep dives destacados |
|---:|---:|---|
| 2021 | 6/6 | Física: clima y sistemas complejos · Economía: inferencia causal |
| 2022 | 6/6 | Medicina: genómica antigua · Paz: documentación · Literatura: memoria social |
| 2023 | 6/6 | Economía: Claudia Goldin y construcción de datos históricos |
| 2024 | 6/6 | Física: Hopfield/Hinton · Química: AlphaFold/proteínas |
| 2025 | 6/6 | Economía: innovación, crecimiento y destrucción creativa |

➡️ [Explorar catálogo cross-year](catalog-2021-2025.md)

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

Se priorizan páginas oficiales de **NobelPrize.org**. El catálogo enlaza la fuente oficial de cada una de las 30 ediciones y las páginas separan la motivación Nobel de nuestra interpretación aplicada a data science.
