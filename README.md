# dntl_economia

Repositorio personal para estudiar economía, ciencia de datos y modelos aplicados mediante notas, datasets, experimentos reproducibles y una interfaz de exploración transversal.

## Nobel Data Lab · 1995–2025

La primera colección del repositorio recorre 31 años Nobel completos (1995–2025) desde la óptica de **datos, modelamiento, inferencia y representación del conocimiento**.

### Qué contiene

- **186 ediciones Nobel catalogadas**: 6 áreas × 31 años.
- **376 registros premio-laureado** correspondientes a 375 personas u organizaciones únicas.
- **186 exhibiciones individuales** enlazadas desde la Gran Galería.
- **4 salas signature manipulables**: Hopfield, inferencia causal, Goldin/medición y destrucción creativa.
- **26 salas curatoriales interpretadas** y **156 fichas oficiales abiertas a curaduría**, sin scores inventados.
- **Laboratorio de conexiones** para comparar cualquier par de Nobel, revelar mecanismos compartidos y generar preguntas de transferencia.
- **2 experimentos Python ejecutables**: inferencia causal y memoria asociativa de Hopfield.
- **Tests Python + Node** sobre cobertura, metadata, frontend y matemática de las exhibiciones.
- Fuentes oficiales de **NobelPrize.org** por registro, respuestas crudas preservadas y manifiesto con hashes.

➡️ [Abrir Nobel Data Wiki](wiki/README.md)

➡️ [Ver catálogo longitudinal 1995–2025](wiki/catalog-1995-2025.md)

➡️ [Ver diccionario y procedencia de los datos](data/README.md)

➡️ [Ver por qué se eligió esta arquitectura](wiki/decision-from-wiki-to-nobel-lab.md)

➡️ [Ver el diseño del Museo Vivo para un Polímata](wiki/frontend-museum-design.md)

➡️ [Ver el contrato de las exhibiciones vivas](wiki/living-exhibits.md)

## Museo Vivo · frontend

La raíz del repositorio contiene un frontend build-free (`index.html` + `assets/`) con una estética de **museo nocturno vivo** y navegación transversal por:

- memoria & reconstrucción;
- causalidad & contrafactuales;
- complejidad & dinámica;
- evidencia & trazabilidad;
- predicción & representación.

Cada tarjeta de la galería abre `exhibit.html?area=...&year=...`. El frontend consume directamente `data/nobel_catalog_1995_2025.csv`; no mantiene una copia paralela de las 186 ediciones. Los filtros permiten navegar por área, período, año exacto, concepto o laureado.

### Actualizar los datos oficiales

```bash
python scripts/sync_nobel_data.py --refresh
```

El script conserva la separación entre fuente y opinión: la motivación, biografía, afiliación y participación proceden de la API Nobel; las 30 lentes de 2021–2025 permanecen en `data/curation/` como overrides editoriales explícitos. La generación local posterior puede usar los JSON crudos sin red omitiendo `--refresh`.

### Salas signature

| Sala | Interacción | Verdad conocida / contrato |
|---|---|---|
| Física 2024 · Hopfield | corromper bits, energía, recall | recupera patrón y reduce energía |
| Economía 2021 · DiD | mover tratado/control | efecto sintético = `7.0` |
| Economía 2023 · Goldin | quiebre de medición | armonización elimina sesgo conocido |
| Economía 2025 · crecimiento | innovación/competencia | semilla fija `2025`, dinámica reproducible |

### Ejecutar localmente

```bash
python -m http.server 8000
```

Luego abrir `http://localhost:8000`.

> No abrir `index.html` directamente con `file://`, porque el navegador debe poder leer el CSV mediante HTTP.

### Publicar con GitHub Pages

El workflow `.github/workflows/pages.yml` está preparado para desplegar desde `main`. Antes del primer deploy, habilitar una sola vez en GitHub:

`Settings → Pages → Build and deployment → Source → GitHub Actions`

Después, cada push a `main` podrá desplegar el museo mediante el workflow.

## Ejecutar laboratorios y tests

No se requieren paquetes externos para los laboratorios actuales.

```bash
python examples/economics_2021_causal_inference.py
python examples/physics_2024_hopfield.py
python -m unittest discover -s tests -v
node --check assets/app.js
node --check assets/exhibit-core.js
node --check assets/exhibit.js
node --check assets/exhibit-router.js
node --test tests/exhibit-core.test.js
```

La colección distingue explícitamente entre conexiones **directas**, **metodológicas** y **analógicas/documentales** con data science para no confundir la motivación oficial del Nobel con interpretaciones posteriores.


## Economics Streaming OS

Nueva capa de aprendizaje aplicado en `economics-streaming.html`, diseñada como una interfaz de streaming para convertir conceptos económicos recurrentes en una secuencia **descubrir → consumir → practicar → aplicar → guardar evidencia → recomendar siguiente pieza**.

### MVP v1

- 10 canales: pricing, costo de oportunidad, portfolio, causalidad, información, teoría de decisión, stock-flow, incentivos, productividad/funnel y economía conductual.
- 30 piezas iniciales entre lectura, video, simulación y casos aplicados.
- Filtros por formato y búsqueda por concepto, autor o aplicación.
- Recomendación local basada en relevancia conceptual y progreso.
- Estado `iniciado / completado / aplicado` y evidencia persistida en `localStorage`.
- Videos externos embebidos con `youtube-nocookie.com` cuando existe una fuente curada; el resto abre la fuente original.
- Integración con las salas Nobel ya existentes, incluida la simulación DiD de Economía 2021.

La v1 no requiere backend ni dependencias adicionales y funciona con el mismo despliegue estático de GitHub Pages.


## Economics Streaming OS · v2 Learning Recommendation Engine

La v2 convierte el catálogo en un motor personal basado en cuatro señales explícitas:

```text
Content Graph + Knowledge Graph + Usage + Projects
                         ↓
                Next Best Content
                         ↓
Concept → Project → Action → Observed Outcome → Learning
```

### Arquitectura v2

- `data/economics_knowledge_graph.json`: 35 conceptos, relaciones conceptuales y mapeo de las 30 piezas a conceptos/vecinos.
- `data/economics_project_profiles.json`: cinco contextos de proyecto genéricos y seguros para un repositorio público.
- `assets/learning-recommendation-engine.js`: motor determinista y testeable de scoring/recomendación.
- `assets/economics-streaming.js`: capa de interacción, migración de estado v1→v2, acciones y outcomes.
- `localStorage`: conserva uso, evidencia, proyectos activos, acciones y resultados observados; estos datos personales no se publican en GitHub.

### Señales del ranking

El score combina:

1. encaje con el proyecto enfocado y proyectos activos;
2. gap de conocimiento estimado;
3. cercanía en Content/Knowledge Graph;
4. diversidad de formato;
5. progreso previo — completar/aplicar reduce replay innecesario;
6. outcomes recientes — resultados inconclusos o contradictorios elevan piezas vecinas útiles para rediseñar la siguiente acción.

### Closed learning loop

Una pieza puede pasar por:

`started → completed → applied → action pending → outcome reviewed`.

Cada aplicación registra proyecto, acción concreta, resultado esperado, métrica y fecha de revisión. Al observar el outcome se clasifica como `confirmed`, `inconclusive` o `contradicted`; esa señal vuelve al ranking.

### Validación

```bash
node --check assets/learning-recommendation-engine.js
node --check assets/economics-streaming.js
node --test tests/economics-streaming.test.js
node --test tests/recommendation-engine.test.js
```

El objetivo del producto deja de ser maximizar contenido consumido. La North Star v2 es **outcomes revisados / aplicaciones registradas**.
