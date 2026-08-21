# Economía 2023 — Claudia Goldin: cuando construir el dataset es parte del descubrimiento

## Nobel

Claudia Goldin recibió el Premio en Ciencias Económicas 2023 por avanzar nuestra comprensión de los resultados de las mujeres en el mercado laboral.

Fuente oficial: https://www.nobelprize.org/prizes/economic-sciences/2023/summary/

## La idea de data science que importa

Este Nobel es especialmente útil para combatir una idea simplista: que el trabajo científico comienza cuando el dataset ya está limpio.

En investigación histórica, muchas variables relevantes no existen como una tabla lista para modelar. Hay que reconstruir series, armonizar definiciones que cambian en el tiempo, identificar sesgos de medición y entender qué observaciones quedaron fuera del registro.

En otras palabras:

> **el modelo de datos también es una hipótesis sobre el mundo.**

## Del archivo histórico a una tabla analítica

Una representación mínima podría tener:

| dimensión | ejemplo |
|---|---|
| unidad de análisis | persona / cohorte / ocupación |
| tiempo | año o generación |
| outcome | participación, empleo, ingreso |
| exposición | educación, matrimonio, maternidad, institución |
| contexto | tecnología, normas, legislación |
| calidad de observación | completa, reconstruida, imputada |

El último campo es crítico. Una tabla histórica que oculta cómo fue reconstruida puede generar más confianza de la que merece.

## Preguntas de modelamiento

1. ¿La variable significa lo mismo en 1950 y en 2000?
2. ¿Cambió la población observable?
3. ¿Hay selección en quién aparece en los registros?
4. ¿Un aparente cambio económico es en realidad un cambio de medición?
5. ¿Se debe comparar individuos, cohortes o periodos?

## Transferencia a analytics moderno

La misma lógica aparece cuando una empresa cambia de CRM, redefine un estado comercial o incorpora una fuente nueva al data warehouse.

Si `vendido`, `lead`, `separado` o `cliente` cambian de definición entre sistemas, concatenar las tablas no crea automáticamente una serie histórica comparable.

La lección Goldin para ingeniería analítica es:

> **antes de optimizar el modelo predictivo, asegurar comparabilidad semántica en el tiempo.**

## Laboratorio recomendado

Crear dos versiones de una serie sintética de participación laboral:

- una con la definición verdadera constante;
- otra con un cambio artificial de medición a mitad de la serie.

Luego demostrar cómo una regresión ingenua atribuye el quiebre a comportamiento económico y cómo una variable de régimen o una armonización de definiciones corrige la inferencia.
