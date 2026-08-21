# Decisión: de Nobel Data Wiki a Nobel Data Lab

## Decisión

La colección no crecerá como una lista indefinida de biografías. Se adopta una arquitectura de cuatro capas:

1. **Catálogo estructurado** — una fila por área y año, con fuente oficial y clasificación editorial de cercanía a modelos/datos.
2. **Deep dives** — wikipages seleccionadas cuando el premio enseña un principio transferible de modelamiento, inferencia o evidencia.
3. **Experimentos ejecutables** — implementaciones mínimas que hagan tangible el principio.
4. **Tests** — validaciones automáticas de cobertura, metadata y comportamiento esperado de los experimentos.

## Por qué esta opción

### Alternativa A — una página por laureado

Escala en cantidad, pero fragmenta el aprendizaje y mezcla biografía con método. Es difícil saber qué páginas merecen convertirse en código.

### Alternativa B — solo notebooks o scripts

Demuestra técnica, pero pierde contexto: qué problema resolvía el Nobel, qué evidencia utilizó y qué parte es interpretación propia.

### Alternativa C — catálogo + deep dives + código + tests

Es la opción elegida porque separa claramente **descubrimiento**, **representación estructurada**, **aprendizaje conceptual** y **reproducción computacional**.

## Demostración de la mejora

| Dimensión | Antes | Nobel Data Lab |
|---|---:|---:|
| Ediciones Nobel representadas | 6 | 30 |
| Años con cobertura estructurada | 3 | 5 (2021–2025) |
| Áreas | 6 | 6 |
| Dataset consultable | No | Sí |
| Experimentos ejecutables | 0 | 2 |
| Tests automatizados | 0 | 5 |
| Fuente oficial por registro | Parcial / por página | Sí |
| Intensidad de relación con modelos | Cualitativa | Clase + score 1–5 |

El salto importante es que **cobertura documental** y **profundidad técnica** dejan de competir: el catálogo puede crecer ampliamente mientras solo los casos de mayor valor se convierten en experimentos.

## Definition of Done

Una ampliación de la Nobel Data Wiki se considera terminada cuando:

- cada nueva edición tiene área, año, laureados, lente de modelamiento y fuente oficial;
- la conexión con data science se etiqueta como `Directa`, `Metodológica` o `Analógica/documental`;
- `model_score` está entre 1 y 5 y se reconoce explícitamente como valoración editorial del repositorio, no del Comité Nobel;
- no existen duplicados `(area, year)`;
- si se añade un experimento, tiene al menos una aserción automática sobre su comportamiento esperado;
- `python -m unittest discover -s tests -v` termina correctamente.

## Ruta de escalamiento

Los siguientes casos con mejor relación valor/esfuerzo para convertirse en laboratorios son:

1. **Física 2021** — señal, ruido, atribución y modelos climáticos.
2. **Economía 2023** — reconstrucción de paneles históricos y sesgos de medición.
3. **Economía 2024** — instituciones, historia e identificación.
4. **Economía 2025** — crecimiento endógeno, innovación y destrucción creativa.
5. **Medicina 2024** — redes de regulación génica.
6. **Química 2024** — estructura de proteínas y aprendizaje automático.

La regla es simple: **leer → estructurar → modelar → falsar/testear → transferir**.
