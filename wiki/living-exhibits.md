# Living Exhibits — contrato de las salas vivas

## Decisión

El Museo Vivo deja de tratar cada Nobel como una tarjeta que termina en una lectura externa. Cada combinación `área + año` abre una **exhibición individual** en `exhibit.html`, cargada desde el mismo catálogo de 30 premios.

La arquitectura tiene dos niveles:

1. **4 exhibiciones signature** con un mecanismo especializado y manipulable.
2. **26 exhibiciones curatoriales** que conservan interacción mediante cuatro lentes (`observar`, `modelar`, `inferir`, `transferir`), un control sobre la fuerza de la afirmación y conexiones calculadas con otras salas.

Esto permite cobertura completa sin fingir que todos los Nobel pueden reducirse honestamente a un pequeño simulador.

## Exhibiciones signature

### Física 2024 — Hopfield & Hinton

El visitante puede:

- cambiar manualmente neuronas bipolares;
- introducir corrupciones reproducibles;
- observar distancia de Hamming y energía;
- ejecutar recuperación asincrónica;
- comprobar si el estado converge a la memoria almacenada.

La matemática vive en `assets/exhibit-core.js` y tiene un test que exige recuperación exacta del patrón sintético y menor energía final.

### Ciencias Económicas 2021 — Card, Angrist & Imbens

El visitante controla cuatro medias:

- tratado antes;
- tratado después;
- control antes;
- control después.

La sala recalcula en tiempo real:

`DiD = (tratado_post - tratado_pre) - (control_post - control_pre)`

El caso inicial conserva el mundo sintético del repositorio: efecto conocido `7.0` y contrafactual tratado `22.5`.

### Ciencias Económicas 2023 — Claudia Goldin

La sala separa tres objetos:

- verdad latente sintética;
- serie observada después de un cambio de definición;
- serie armonizada.

El visitante elige década del quiebre y magnitud del sesgo. Así se hace tangible que **construir una serie comparable es parte de la inferencia**, no una tarea previa y neutral.

### Ciencias Económicas 2025 — Mokyr, Aghion & Howitt

Se simulan seis firmas con:

- probabilidad de innovación;
- intensidad competitiva;
- productividad individual;
- participación derivada de productividad;
- HHI;
- reemplazos de líder.

La secuencia pseudoaleatoria usa semilla fija `2025`, de modo que un mismo conjunto de controles produce la misma historia y puede testearse.

## Por qué no crear 30 simuladores falsamente específicos

Para los otros 26 premios se usa una exhibición curatorial interactiva. La regla epistemológica es deliberada:

> **interactividad no autoriza a inventar un mecanismo.**

En esos casos el visitante manipula la fuerza de la afirmación, cambia de lente y explora conexiones con piezas similares. Cuando un deep dive justifique un mecanismo reproducible, esa sala puede graduarse a `signature`.

## Arquitectura

```text
index.html
   ↓ cada tarjeta
exhibit.html?area=...&year=...
   ↓
data/nobel_catalog_2021_2025.csv
   ↓
assets/exhibit.js
   ├── signature renderer (4)
   └── generic renderer (26)
          ↓
assets/exhibit-core.js  ← matemática pura / testeable
```

## Definition of Done

Una sala signature se considera lista cuando:

- el mecanismo puede manipularse sin recargar la página;
- existe un estado inicial reproducible;
- la matemática relevante está fuera del DOM;
- existe al menos un test con verdad conocida;
- la UI explica qué parte es simplificación pedagógica;
- la fuente Nobel oficial sigue visible;
- funciona con teclado y no depende solo del color;
- respeta `prefers-reduced-motion` cuando hay transiciones.

## Tests

```bash
node --test tests/exhibit-core.test.js
python -m unittest discover -s tests -v
```

Los tests de core comprueban:

1. Hopfield recupera el patrón y reduce energía.
2. DiD recupera exactamente `7.0`.
3. La armonización Goldin elimina exactamente el sesgo sintético conocido.
4. La simulación de destrucción creativa es determinista y eleva productividad agregada en el escenario base.
