# dntl_economia

Repositorio personal para estudiar economía, ciencia de datos y modelos aplicados mediante notas, datasets, experimentos reproducibles y una interfaz de exploración transversal.

## Nobel Data Lab · 2021–2025

La primera colección del repositorio estudia los cinco años Nobel completos más recientes (2021–2025) desde la óptica de **datos, modelamiento, inferencia y representación del conocimiento**.

### Qué contiene

- **30 ediciones Nobel catalogadas**: 6 áreas × 5 años.
- **Deep dives** seleccionados por valor de aprendizaje.
- **2 experimentos ejecutables**: inferencia causal y memoria asociativa de Hopfield.
- **Tests automáticos** sobre cobertura, metadata, comportamiento y contrato del frontend.
- **Museo Vivo de Ideas**: frontend estático para explorar por disciplina o por conexiones conceptuales.
- Fuentes oficiales de **NobelPrize.org** por registro.

➡️ [Abrir Nobel Data Wiki](wiki/README.md)

➡️ [Ver catálogo 2021–2025](wiki/catalog-2021-2025.md)

➡️ [Ver por qué se eligió esta arquitectura](wiki/decision-from-wiki-to-nobel-lab.md)

➡️ [Ver el diseño del Museo Vivo para un Polímata](wiki/frontend-museum-design.md)

## Museo Vivo · frontend

La raíz del repositorio contiene un frontend build-free (`index.html` + `assets/`) con una estética de **museo nocturno vivo** y navegación transversal por:

- memoria & reconstrucción;
- causalidad & contrafactuales;
- complejidad & dinámica;
- evidencia & trazabilidad;
- predicción & representación.

El frontend consume directamente `data/nobel_catalog_2021_2025.csv`; no mantiene una copia paralela de los 30 premios.

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
```

La colección distingue explícitamente entre conexiones **directas**, **metodológicas** y **analógicas/documentales** con data science para no confundir la motivación oficial del Nobel con interpretaciones posteriores.
