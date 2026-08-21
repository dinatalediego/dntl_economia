# dntl_economia

Repositorio personal para estudiar economía, ciencia de datos y modelos aplicados mediante notas, datasets y experimentos reproducibles.

## Nobel Data Lab · 2021–2025

La primera colección del repositorio estudia los cinco años Nobel completos más recientes (2021–2025) desde la óptica de **datos, modelamiento, inferencia y representación del conocimiento**.

### Qué contiene

- **30 ediciones Nobel catalogadas**: 6 áreas × 5 años.
- **Deep dives** seleccionados por valor de aprendizaje.
- **2 experimentos ejecutables**: inferencia causal y memoria asociativa de Hopfield.
- **5 tests automáticos** sobre cobertura, metadata y comportamiento de los experimentos.
- Fuentes oficiales de **NobelPrize.org** por registro.

➡️ [Abrir Nobel Data Wiki](wiki/README.md)

➡️ [Ver catálogo 2021–2025](wiki/catalog-2021-2025.md)

➡️ [Ver por qué se eligió esta arquitectura](wiki/decision-from-wiki-to-nobel-lab.md)

## Ejecutar

No se requieren paquetes externos para los laboratorios actuales.

```bash
python examples/economics_2021_causal_inference.py
python examples/physics_2024_hopfield.py
python -m unittest discover -s tests -v
```

La colección distingue explícitamente entre conexiones **directas**, **metodológicas** y **analógicas/documentales** con data science para no confundir la motivación oficial del Nobel con interpretaciones posteriores.
