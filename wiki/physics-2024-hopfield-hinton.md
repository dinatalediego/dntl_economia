# Física 2024 — John Hopfield y Geoffrey Hinton

## Nobel

El Premio Nobel de Física 2024 fue otorgado a **John J. Hopfield** y **Geoffrey Hinton** por descubrimientos e invenciones fundamentales que permiten el aprendizaje automático con redes neuronales artificiales.

## Problema

¿Cómo puede un sistema formado por muchas unidades simples **almacenar patrones, reconstruir información incompleta y aprender regularidades presentes en datos**?

## Modelo

### Hopfield network

La red de Hopfield representa información mediante estados distribuidos entre nodos conectados. El sistema evoluciona hacia configuraciones de menor energía, lo que permite recuperar un patrón almacenado a partir de una versión ruidosa o incompleta.

Lectura desde data science:

- representación distribuida;
- memoria asociativa;
- función de energía / optimización;
- robustez ante ruido;
- reconocimiento de patrones.

### Boltzmann machine

Hinton extendió ideas de física estadística hacia redes capaces de aprender características de una distribución de datos. La Boltzmann machine introdujo una forma temprana de aprendizaje probabilístico generativo.

Lectura desde data science:

- variables latentes;
- aprendizaje probabilístico;
- distribuciones de energía;
- extracción automática de características;
- antecedente conceptual del deep learning moderno.

## Datos → modelo → salida

```text
Ejemplos / patrones
        ↓
Representación en nodos y pesos
        ↓
Aprendizaje / minimización de energía
        ↓
Representación interna
        ↓
Reconstrucción, clasificación o generación
```

## Qué aprender para proyectos propios

1. Un modelo no “aprende” porque memorice filas: aprende cuando ajusta una representación que generaliza regularidades útiles.
2. El ruido de entrada puede formar parte explícita del problema de modelamiento.
3. Una buena arquitectura incorpora supuestos sobre la estructura del fenómeno.
4. La conexión entre física y ML muestra que herramientas creadas para un dominio pueden convertirse en modelos generales de información.

## Preguntas para experimentar

- ¿Qué equivalente de “estado de energía” existe en un modelo de scoring comercial?
- ¿Qué variables latentes explican patrones de leads que no aparecen en reglas manuales?
- ¿Puede un modelo reconstruir información faltante sin crear falsa certeza?

## Relación con modelos de datos

**Directa y central.** El motivo oficial del Nobel menciona explícitamente machine learning y redes neuronales artificiales.

## Fuentes oficiales

- Nobel Prize, *The Nobel Prize in Physics 2024*: https://www.nobelprize.org/prizes/physics/2024/summary/
- Nobel Prize, *John Hopfield — Facts*: https://www.nobelprize.org/prizes/physics/2024/hopfield/facts/
- Nobel Prize, *Geoffrey Hinton — Facts*: https://www.nobelprize.org/prizes/physics/2024/hinton/facts/
- Nobel Prize, *Popular information — Physics 2024*: https://www.nobelprize.org/prizes/physics/2024/popular-information/
