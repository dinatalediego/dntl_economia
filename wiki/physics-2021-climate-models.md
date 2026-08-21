# Física 2021 — Manabe, Hasselmann y Parisi: modelar sistemas complejos

## Nobel

El Nobel de Física 2021 reconoció contribuciones fundamentales a la comprensión de sistemas físicos complejos. Syukuro Manabe y Klaus Hasselmann fueron reconocidos por el modelamiento físico del clima terrestre, la cuantificación de su variabilidad y la capacidad de predecir de manera confiable el calentamiento global; Giorgio Parisi, por descubrir la interacción entre desorden y fluctuaciones en sistemas físicos desde escalas atómicas hasta planetarias.

Fuente oficial: https://www.nobelprize.org/prizes/physics/2021/summary/

## Por qué es un Nobel de modelos

Este caso contiene una de las ideas más transferibles de toda la colección:

> un sistema puede ser ruidoso e impredecible a corto plazo y, aun así, contener estructura estadística modelable a escalas mayores.

Hasselmann construyó un puente conceptual entre **weather** y **climate**: la variabilidad de corto plazo no invalida necesariamente inferencias robustas sobre el comportamiento de largo plazo.

## Traducción a data science

| Física climática | Data science |
|---|---|
| clima | proceso latente / señal estructural |
| tiempo meteorológico | observación local ruidosa |
| variabilidad natural | ruido + factores omitidos |
| fingerprint climático | firma estadística / patrón identificable |
| simulación física | modelo generativo / estructural |
| observaciones | datos de validación |

## Lección central

**Predicción e identificación no son lo mismo.**

Un modelo puede fallar al anticipar una observación puntual y seguir siendo útil para estimar tendencias, mecanismos y distribuciones agregadas. Esta distinción aparece también en economía, pricing, forecasting y machine learning.

## Mini-laboratorio propuesto

Construir una serie sintética:

`observado_t = tendencia_t + estacionalidad_t + shock_t + ruido_t`

Luego comparar:

1. una predicción ingenua del siguiente punto;
2. una media móvil;
3. una regresión de tendencia;
4. una descomposición señal/ruido;
5. la capacidad de detectar un cambio estructural conocido.

La métrica no debería ser únicamente RMSE. También debe evaluarse si el modelo recupera correctamente la **señal causal/estructural introducida en la simulación**.

## Transferencia

Para proyectos económicos o empresariales, la pregunta cambia de:

> “¿puedo predecir exactamente el próximo mes?”

hacia:

> “¿qué parte de la variación contiene estructura estable, qué parte es ruido y qué mecanismo podría haberla producido?”

Ese cambio de pregunta es una mejora de modelamiento, no solo de algoritmo.
