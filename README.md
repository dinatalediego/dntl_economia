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
- **Motor de prioridad curatorial** para las 156 fichas históricas: ranking explicable, esfuerzo S/M/L y cartera equilibrada de 12 candidatas.
- **Lectura en voz alta opcional** por secciones, con pausa, velocidad y estado accesible; usa Web Speech API sin backend ni cuenta.
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

➡️ [Auditar el motor de prioridad curatorial](wiki/curatorial-priority-engine.md)

## Museo Vivo · frontend

La raíz del repositorio contiene un frontend build-free (`index.html` + `assets/`) con una estética de **museo nocturno vivo** y navegación transversal por:

- memoria & reconstrucción;
- causalidad & contrafactuales;
- complejidad & dinámica;
- evidencia & trazabilidad;
- predicción & representación.

Cada tarjeta de la galería abre `exhibit.html?area=...&year=...`. El frontend consume directamente `data/nobel_catalog_1995_2025.csv`; no mantiene una copia paralela de las 186 ediciones. Los filtros permiten navegar por área, período, año exacto, concepto o laureado.

La **Mesa de curaduría** consume `data/nobel_room_candidates_1995_2020.csv` y permite comparar el portafolio equilibrado, el mayor índice sostenible y las candidatas de menor esfuerzo. El ranking se precalcula con Python estándar: no hay LLM, backend, base de datos ni API pagada por visita. El índice mide viabilidad de prototipo, no importancia del Nobel.

### Accesibilidad y lectura en voz alta

El botón **Escuchar** permite narrar una sección concreta o toda la página, pausar, continuar, detener y cambiar la velocidad. La función usa las voces disponibles en el navegador mediante Web Speech API y no activa el micrófono ni requiere servicios del proyecto.

La narración es una ayuda complementaria. El sitio conserva enlace de salto, regiones semánticas, encabezados, controles con nombre, foco visible y avisos concisos para funcionar también con lectores de pantalla como NVDA, JAWS y VoiceOver. No se reproduce audio automáticamente.

### Actualizar los datos oficiales

```bash
python scripts/sync_nobel_data.py --refresh
```

El script conserva la separación entre fuente y opinión: la motivación, biografía, afiliación y participación proceden de la API Nobel; las 30 lentes de 2021–2025 permanecen en `data/curation/` como overrides editoriales explícitos. La generación local posterior puede usar los JSON crudos sin red omitiendo `--refresh`. En la misma ejecución recalcula la cola curatorial y registra su hash en el manifiesto.

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
node --test tests/read-aloud.test.js
```

La colección distingue explícitamente entre conexiones **directas**, **metodológicas** y **analógicas/documentales** con data science para no confundir la motivación oficial del Nobel con interpretaciones posteriores.
