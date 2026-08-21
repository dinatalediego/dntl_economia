# Frontend — Museo Vivo para un Polímata

## Decisión de experiencia

El Nobel Data Lab no se presenta como un dashboard ni como una enciclopedia convencional. Se adopta una metáfora de **museo nocturno vivo**: las piezas están organizadas, pero las ideas pueden cruzar salas y conversar entre sí.

La referencia emocional es la sensación de recorrer un museo cuando las piezas parecen adquirir vida, **sin copiar arte, personajes ni recursos visuales de una película**.

## Principio rector

> Un especialista entra por una disciplina. Un polímata entra por una pregunta.

Por eso la arquitectura de información tiene dos ejes simultáneos:

1. **taxonomía formal** — Física, Química, Medicina, Economía, Paz y Literatura;
2. **rutas transversales** — memoria, causalidad, complejidad, evidencia y predicción.

La segunda navegación es la diferenciadora.

## Arquitectura de la visita

### 1. Gran Hall

Entrada narrativa, no utilitaria. Comunica inmediatamente:

- 30 premios;
- seis disciplinas;
- cinco años;
- una red de ideas.

La instalación orbital usa conceptos en lugar de fotografías para sugerir que el conocimiento está conectado.

### 2. Rutas del polímata

Cinco obsesiones permiten cruzar disciplinas:

- **Memoria & reconstrucción** — Hopfield, Pääbo, Ernaux, Goldin.
- **Causalidad & contrafactuales** — Card, Angrist, Imbens, instituciones.
- **Complejidad & dinámica** — clima, Parisi, redes, innovación y crecimiento.
- **Evidencia & trazabilidad** — documentación, inferencia, medición y provenance.
- **Predicción & representación** — AlphaFold, Hinton, regulación y estructura.

Una ruta no reemplaza la taxonomía Nobel: la atraviesa.

### 3. Gran Galería

El catálogo `data/nobel_catalog_2021_2025.csv` es la única fuente estructurada del frontend.

La galería permite:

- buscar por laureado o concepto;
- filtrar por área;
- filtrar por año;
- activar una ruta conceptual;
- ver intensidad editorial de relación con modelos;
- abrir un deep dive cuando existe y, en caso contrario, la fuente Nobel oficial.

No se duplica el catálogo dentro de JavaScript.

### 4. Gabinete del Polímata

Esta sala existe para producir conexiones que una tabla disciplinar no muestra:

- Hopfield ↔ Pääbo: reconstrucción desde información incompleta;
- Angrist/Imbens ↔ Paz 2022: de observación a evidencia defendible;
- Goldin ↔ Ernaux: categorías y contexto cambian en el tiempo;
- clima/Parisi ↔ Aghion/Howitt: patrones agregados emergen de dinámicas locales.

### 5. Ala experimental

La visita termina en código. Los experimentos de causalidad y Hopfield muestran la regla del repositorio:

`leer → estructurar → modelar → falsar → transferir`

## Lenguaje visual

- fondo carbón / azul noche;
- iluminación dorada cálida como vitrina;
- marcos finos y placas curatoriales;
- serif editorial para narrativa y sans-serif para navegación/datos;
- verde oscuro en el Gabinete del Polímata para marcar un cambio de sala;
- movimiento orbital muy lento, nunca necesario para entender la interfaz;
- densidad moderada: contemplativo, no barroco.

## Accesibilidad

- enlace de salto al contenido;
- navegación semántica;
- estados `aria-pressed` en filtros y rutas;
- regiones `aria-live` para resultados;
- foco visible;
- soporte `prefers-reduced-motion`;
- responsive desde 320 px;
- el significado no depende únicamente del color.

## Contrato técnico

El frontend es deliberadamente **build-free**:

```text
index.html
assets/styles.css
assets/app.js
        ↓
data/nobel_catalog_2021_2025.csv
```

Esto permite servirlo con cualquier hosting estático.

### Desarrollo local

Desde la raíz:

```bash
python -m http.server 8000
```

Abrir `http://localhost:8000`.

## Definition of Done del frontend

Una ampliación visual se considera completa cuando:

- el sitio sigue cargando desde el CSV único;
- todas las rutas del polímata siguen presentes;
- teclado y foco permiten navegar controles esenciales;
- `prefers-reduced-motion` conserva una experiencia completa;
- `node --check assets/app.js` termina correctamente;
- `python -m unittest discover -s tests -v` termina correctamente;
- la mejora no introduce imágenes o dependencias innecesarias para transmitir la atmósfera.
