# Química 2024 — Baker, Hassabis y Jumper

## Nobel

El Premio Nobel de Química 2024 fue dividido entre **David Baker**, por diseño computacional de proteínas, y **Demis Hassabis y John Jumper**, por predicción de estructura de proteínas.

## Problema

Una proteína nace como una secuencia de aminoácidos, pero su función depende enormemente de la forma tridimensional que adopta. El reto es pasar de una representación secuencial a una estructura espacial útil.

## Modelos

### Diseño computacional de proteínas

El trabajo de Baker muestra el problema inverso: no solo predecir qué forma tendrá una secuencia, sino diseñar secuencias capaces de producir estructuras deseadas.

### AlphaFold2

Hassabis y Jumper desarrollaron **AlphaFold2**, un modelo de IA para predecir estructuras de proteínas. Desde la perspectiva de data science, el caso es extraordinario porque combina:

- representación de secuencias;
- aprendizaje sobre grandes corpus biológicos;
- relaciones entre posiciones de aminoácidos;
- predicción estructurada, no solo una etiqueta;
- validación contra estructuras observadas experimentalmente.

## Datos → modelo → salida

```text
Secuencia de aminoácidos + información evolutiva
                    ↓
          representación aprendida
                    ↓
       restricciones / relaciones espaciales
                    ↓
           estructura 3D predicha
                    ↓
 investigación, diseño y experimentación
```

## Qué aprender para proyectos propios

1. El output correcto de un modelo puede ser una **estructura completa**, no un score aislado.
2. La representación del dato puede ser tan importante como el algoritmo.
3. Los modelos más útiles conectan predicción con un problema operativo posterior.
4. El conocimiento de dominio y el ML no compiten: se potencian.

## Preguntas para experimentar

- ¿En un problema comercial conviene predecir solo “compra/no compra” o toda la trayectoria probable del lead?
- ¿Qué relaciones entre entidades deberían modelarse explícitamente: cliente–proyecto–asesor–unidad–canal?
- ¿Qué parte de un pipeline podría plantearse como problema inverso: dado un resultado deseado, qué acciones o características lo hacen más probable?

## Relación con modelos de datos

**Directa y central.** El Nobel destacó el diseño computacional y la predicción de estructuras; la información oficial señala explícitamente AlphaFold2 como modelo de IA.

## Fuentes oficiales

- Nobel Prize, *The Nobel Prize in Chemistry 2024*: https://www.nobelprize.org/prizes/chemistry/2024/summary/
- Nobel Prize, *Press release — Chemistry 2024*: https://www.nobelprize.org/prizes/chemistry/2024/press-release/
- Nobel Prize, *Demis Hassabis — Facts*: https://www.nobelprize.org/prizes/chemistry/2024/hassabis/facts/
- Nobel Prize, *David Baker — Facts*: https://www.nobelprize.org/prizes/chemistry/2024/baker/facts/
