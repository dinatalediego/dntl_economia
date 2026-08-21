# Medicina 2022 — Svante Pääbo y la genómica antigua

## Nobel

El Premio Nobel de Fisiología o Medicina 2022 fue otorgado a **Svante Pääbo** por sus descubrimientos sobre los genomas de homínidos extintos y la evolución humana.

## Problema

¿Cómo reconstruir relaciones evolutivas a partir de ADN antiguo que llega degradado, contaminado e incompleto?

## Datos y modelamiento

El trabajo de Pääbo convirtió restos biológicos extremadamente difíciles en información genómica comparable. Entre sus hitos están la secuenciación del genoma neandertal, la identificación de Denisova mediante datos genómicos y la demostración de flujo génico entre homínidos extintos y Homo sapiens.

Lectura desde data science:

- adquisición de datos bajo ruido extremo;
- control de contaminación y calidad;
- secuenciación y alineamiento;
- comparación de genomas;
- inferencia de parentesco y mezcla poblacional;
- integración de observaciones parciales con referencias de alta cobertura.

## Datos → inferencia → conocimiento

```text
Muestra antigua
     ↓
extracción y control de contaminación
     ↓
fragmentos de ADN
     ↓
secuenciación + alineamiento
     ↓
genoma reconstruido / parcial
     ↓
comparación poblacional
     ↓
parentesco, migración e introgresión
```

## Qué aprender para proyectos propios

1. La calidad del modelo nunca compensa una fuente cuya contaminación no se controla.
2. Mantener el dato crudo y la trazabilidad de transformaciones es parte del método científico.
3. Las observaciones incompletas pueden ser útiles si existe una referencia robusta contra la cual mapearlas.
4. Un buen pipeline no solo produce una tabla final: conserva evidencia suficiente para auditar cómo se llegó al resultado.

## Preguntas para experimentar

- ¿Qué campos de un data warehouse comercial equivalen a “muestras contaminadas” por cambios de definición o captura manual?
- ¿Qué tablas deberían funcionar como referencia estable para reconstruir eventos incompletos?
- ¿Cómo separar dato observado, dato corregido e inferencia del modelo?

## Relación con modelos de datos

**Directa.** El premio no fue por un algoritmo de ML, pero el descubrimiento depende profundamente de datos genómicos, procesamiento computacional e inferencia comparativa.

## Fuentes oficiales

- Nobel Prize, *The Nobel Prize in Physiology or Medicine 2022*: https://www.nobelprize.org/prizes/medicine/2022/summary/
- Nobel Prize, *Scientific background — Medicine 2022*: https://www.nobelprize.org/prizes/medicine/2022/advanced-information/
- Nobel Prize, *Svante Pääbo — Facts*: https://www.nobelprize.org/prizes/medicine/2022/paabo/facts/
