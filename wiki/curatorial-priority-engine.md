# Motor de prioridad curatorial

El motor ordena las **156 ediciones `source_only` de 1995–2020** como candidatas para futuras salas interactivas. Su objetivo es decidir qué prototipar primero con recursos limitados. **No puntúa la calidad, relevancia histórica ni mérito de un Nobel o de sus laureados.**

## Por qué es sostenible

- Se ejecuta en Python estándar durante la actualización del dataset.
- Lee el catálogo factual ya versionado; no vuelve a consultar una fuente por visitante.
- Produce un CSV estático que el navegador descarga junto con el sitio.
- No usa LLM, base de datos, backend ni API pagada en tiempo de ejecución.
- Las reglas, la versión de la rúbrica y cada señal encontrada quedan auditables en Git.

Esto elimina coste variable por visita. El alojamiento sigue sujeto a los límites del proveedor elegido, pero la funcionalidad no incorpora un servicio de pago adicional.

## Dos puntuaciones distintas

### Potencial interactivo · 0–100

| Dimensión | Máximo | Qué aproxima |
|---|---:|---|
| Mecanismo | 30 | Presencia de relaciones, procesos o estructuras convertibles en una regla visible |
| Interacción | 25 | Encaje con un arquetipo manipulable en navegador |
| Transferencia | 20 | Puentes temáticos y número de áreas en las que aparecen |
| Fuente | 15 | Motivación, laureados y enlaces oficiales disponibles |
| Alcance | 10 | Tamaño razonable para un primer prototipo |

### Índice sostenible · 0–100

El índice de prioridad descuenta el esfuerzo estimado del potencial:

| Talla | Factor | Lectura operativa |
|---|---:|---|
| S | × 1,00 | mecanismo acotado y señales claras |
| M | × 0,88 | requiere diseño o investigación adicional |
| L | × 0,74 | señal ambigua, motivaciones múltiples o alcance amplio |

La fórmula es `round(potencial × factor_de_esfuerzo)`. El CSV conserva el total y sus cinco componentes para evitar una caja negra.

## Arquetipos

Las reglas buscan términos completos o raíces declaradas en la motivación oficial y proponen uno de estos formatos:

- laboratorio de decisiones;
- constructor causal;
- explorador de información;
- simulador de sistemas;
- detector y clasificador;
- taller de reconstrucción;
- proceso paso a paso;
- línea de tiempo de cambio;
- mapa de evidencia;
- constelación narrativa;
- explorador guiado cuando no hay señal suficiente.

`matched_signals`, `transfer_signals`, `confidence` y `priority_reason` permiten inspeccionar por qué una fila quedó donde quedó. Una coincidencia sirve para **triage**, no constituye una interpretación experta.

## Portafolio equilibrado

Tomar únicamente los primeros puestos globales amplificaría el vocabulario de las áreas cuyas motivaciones explicitan modelos e incentivos. Para reducir ese sesgo, la cartera inicial tiene 12 plazas:

1. selecciona las dos candidatas con mejor índice de cada una de las seis áreas;
2. para la segunda plaza, prefiere una franja temporal distinta de la primera;
3. ordena las 12 seleccionadas por índice sostenible.

Así se mantienen juntas eficiencia operativa, amplitud cultural y diversidad temporal. El ranking global sigue disponible para poder discutir o reemplazar esta política.

## Contrato humano

Toda fila nace con `review_status=heuristic_candidate`. Antes de convertirla en sala, una persona debe:

1. leer la fuente primaria completa y literatura complementaria adecuada;
2. confirmar que el arquetipo no simplifica de manera engañosa el trabajo premiado;
3. revisar sensibilidad, derechos y procedencia de cualquier nuevo recurso;
4. definir una verdad conocida, un modo de fallo y una pregunta de transferencia;
5. añadir tests y accesibilidad según el [contrato de salas vivas](living-exhibits.md).

## Regeneración

El pipeline principal actualiza hechos, ranking y manifiesto en una ejecución:

```bash
python scripts/sync_nobel_data.py
```

Para recalcular solo la cola desde el catálogo ya existente:

```bash
python scripts/priority_engine.py
```

La implementación canónica y los pesos exactos están en [`scripts/priority_engine.py`](../scripts/priority_engine.py). El resultado está en [`data/nobel_room_candidates_1995_2020.csv`](../data/nobel_room_candidates_1995_2020.csv).
