# Economía 2025 — Mokyr, Aghion y Howitt: modelar el crecimiento impulsado por innovación

## Nobel

El Premio en Ciencias Económicas 2025 fue otorgado a Joel Mokyr, Philippe Aghion y Peter Howitt por explicar el crecimiento económico impulsado por la innovación. Mokyr fue reconocido por identificar condiciones para el crecimiento sostenido mediante progreso tecnológico; Aghion y Howitt por la teoría de crecimiento sostenido mediante destrucción creativa.

Fuente oficial: https://www.nobelprize.org/prizes/economic-sciences/2025/summary/

## Por qué es importante para modelos de datos

Aquí el objetivo no es predecir una variable aislada sino representar un **mecanismo dinámico**:

`innovación → reemplazo de tecnologías → reasignación → productividad → crecimiento`

La destrucción creativa implica que una mejora agregada puede coexistir con pérdidas locales. Esto obliga a modelar transiciones y no únicamente promedios.

## Representación mínima

Un laboratorio computacional puede definir firmas o tecnologías `i` con:

- productividad `A_i,t`;
- probabilidad de innovación `p_i,t`;
- costo de I+D `R_i,t`;
- participación de mercado `s_i,t`;
- entrada y salida;
- shock tecnológico;
- crecimiento agregado.

En cada periodo una innovación puede desplazar a la tecnología incumbente. Así, el estado del sistema en `t+1` depende de la distribución completa en `t`, no solo de una media.

## Puente con machine learning

Este Nobel sirve para distinguir tres familias de preguntas:

1. **Predicción:** ¿qué empresa crecerá?
2. **Causalidad:** ¿qué efecto tiene invertir más en I+D?
3. **Modelo estructural:** ¿qué dinámica agregada emerge cuando innovadores reemplazan incumbentes repetidamente?

Un modelo de ML puede ser excelente en la primera pregunta y no responder las otras dos.

## Transferencia a decisiones empresariales

En pricing, producto o inteligencia comercial, optimizar el resultado del periodo actual puede reducir experimentación y aprendizaje futuro. Por ello conviene medir simultáneamente:

- performance presente;
- tasa de experimentación;
- velocidad de aprendizaje;
- supervivencia de mejoras;
- costo de reemplazar decisiones anteriores.

## Laboratorio recomendado

Construir una simulación de agentes donde cada firma elige entre explotación e innovación. Comparar escenarios con distinta intensidad competitiva y medir:

- crecimiento medio;
- volatilidad;
- concentración;
- tasa de reemplazo de incumbentes;
- productividad acumulada.

La pregunta central sería:

> ¿qué reglas locales de innovación producen crecimiento sostenido a nivel del sistema?

Eso convierte una teoría económica en un objeto computacional falsable y explorable.
