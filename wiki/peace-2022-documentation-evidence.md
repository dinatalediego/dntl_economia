# Paz 2022 — documentación como infraestructura de evidencia

## Nobel

El Premio Nobel de la Paz 2022 fue otorgado a **Ales Bialiatski**, **Memorial** y **Center for Civil Liberties**. El Comité destacó, entre otras cosas, su esfuerzo por documentar crímenes de guerra, abusos de derechos humanos y abuso de poder.

## Problema

En contextos de violencia, represión o guerra, la información suele llegar fragmentada, sesgada, incompleta y bajo riesgo. El desafío no es únicamente “tener datos”, sino construir evidencia verificable.

## Lectura desde datos

La conexión con data science aquí es **metodológica**, no algorítmica. Documentar abusos requiere principios muy cercanos a una buena arquitectura de datos:

- procedencia de cada registro;
- fecha y lugar;
- fuente primaria y fuentes corroborantes;
- identidad y protección de testigos;
- taxonomía de eventos;
- versiones y correcciones;
- preservación de evidencia;
- separación entre hecho observado, testimonio e interpretación.

## Evento → evidencia → registro verificable

```text
Evento
  ↓
testimonio / documento / imagen / fuente
  ↓
validación y contextualización
  ↓
registro estructurado con procedencia
  ↓
corroboración
  ↓
evidencia utilizable para memoria, investigación o rendición de cuentas
```

## Qué aprender para proyectos propios

1. Un registro sin procedencia pierde valor cuando alguien pregunta “¿de dónde salió?”.
2. La trazabilidad es parte del dato, no un accesorio.
3. Nunca conviene sobrescribir silenciosamente una observación original: conservar RAW y registrar correcciones.
4. Las categorías deben tener definiciones operativas consistentes.
5. La calidad también incluye seguridad, privacidad y contexto de captura.

## Preguntas para experimentar

- ¿Puede cada KPI de un dashboard rastrearse hasta sus registros originales?
- ¿Las correcciones del data warehouse tienen una tabla de auditoría?
- ¿Se puede diferenciar automáticamente entre dato de fuente, regla de negocio e inferencia?

## Relación con modelos de datos

**Metodológica.** El Nobel no fue por modelamiento de datos. La conexión se fundamenta en que la propia motivación oficial destaca la **documentación** sistemática de abusos y crímenes. Esta página extrae lecciones sobre provenance, calidad y estructura de evidencia.

## Fuentes oficiales

- Nobel Prize, *The Nobel Peace Prize 2022*: https://www.nobelprize.org/prizes/peace/2022/summary/
- Nobel Prize, *Press release — Peace 2022*: https://www.nobelprize.org/prizes/peace/2022/press-release/
- Nobel Prize, *Ales Bialiatski — Facts*: https://www.nobelprize.org/prizes/peace/2022/bialiatski/facts/
