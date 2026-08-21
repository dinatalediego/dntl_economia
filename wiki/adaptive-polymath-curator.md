# Gabinete del Polímata — curador adaptativo

## Decisión

El museo aprende del **recorrido**, no de la identidad del visitante.

La primera versión del curador es local, interpretable y determinista. No usa un LLM para inferir personalidad ni envía historial a un servidor. Guarda únicamente en `localStorage` señales del recorrido:

- sala (`area|year`);
- número de visitas;
- lentes usados (`observar`, `modelar`, `inferir`, `transferir`);
- cantidad de interacciones con el mecanismo;
- vector editorial de la sala.

El usuario puede borrar todo con **Borrar mi recorrido**.

## Cuándo despierta

El perfil se muestra desde la primera sala, pero los **corredores personalizados se activan al completar 5 salas únicas**.

Antes de ese umbral el museo dice explícitamente que está calibrando. Esto evita fingir certeza con una o dos observaciones.

## Cinco dimensiones

Se mantienen las obsesiones ya presentes en la arquitectura del museo:

1. memoria & reconstrucción;
2. causalidad & contrafactuales;
3. complejidad & dinámica;
4. evidencia & trazabilidad;
5. predicción & representación.

`assets/curator-core.js` traduce cada fila del catálogo a un vector multi-dimensional mediante reglas explícitas sobre `model_lens`, área y clase de relación.

Las reglas son editoriales del Nobel Data Lab; **no son clasificaciones del Comité Nobel ni diagnósticos psicológicos del visitante**.

## Cómo aprende

Para cada sala visitada se acumula su vector. La señal recibe pequeños incrementos por:

- revisitar una sala;
- cambiar de lente;
- manipular controles del mecanismo.

Los incrementos están acotados para que una sola sala no domine indefinidamente el perfil.

El resultado se normaliza a una distribución visible al visitante.

Ejemplo conceptual:

```text
Memoria & reconstrucción       34%
Causalidad & contrafactuales   27%
Evidencia & trazabilidad       21%
Complejidad & dinámica         11%
Predicción & representación     7%
```

## Cómo recomienda

Una sala candidata recibe una puntuación por cuatro motivos:

- **afinidad** con el perfil actual;
- **novedad disciplinar** si pertenece a un área todavía no recorrida;
- **bridge bonus** si expresa una de las dos obsesiones principales desde otro mecanismo;
- **profundidad editorial** (`model_score`).

El objetivo no es maximizar similitud pura. Un recomendador que siempre entrega "más de lo mismo" destruye el carácter polímata del museo.

Por eso cada corredor incluye una explicación, por ejemplo:

> Memoria & reconstrucción aparece en tu recorrido; esta sala lo reexpresa desde Medicina, un territorio que todavía no has recorrido.

## Dónde se ve

### Dentro de una exhibición

Después de la constelación aparece el **Gabinete del Polímata · Curador adaptativo** con:

- progreso `n / 5 salas`;
- distribución de las cinco obsesiones;
- tres corredores recomendados;
- razón de cada recomendación;
- control para borrar el recorrido.

### En el Gran Hall

`assets/curator-home.js` reconstruye el perfil desde `localStorage`, crea **Tu Gabinete del Polímata** y añade `curator-lit` a las tarjetas recomendadas de la Gran Galería.

El visitante literalmente ve iluminarse las puertas que el curador propone.

## Privacidad

Versión v1:

```text
navegador
   ↓
localStorage
   ↓
perfil + recomendaciones
```

No hay:

- cuenta;
- cookie de seguimiento;
- API de analytics propia;
- base de datos remota;
- envío de texto libre;
- inferencia de identidad.

## ¿Cuándo añadir Vercel / backend?

No es requisito para v1. La personalización funciona completamente en cliente.

Vercel o un backend empieza a justificarse cuando queramos una de estas capacidades:

- sincronizar el recorrido entre dispositivos;
- cuentas/favoritos persistentes;
- comparar recorridos entre sesiones;
- experimentación A/B del curador;
- un curador conversacional con LLM;
- almacenamiento voluntario de preguntas del visitante.

La recomendación es validar primero si los corredores adaptativos realmente producen exploración transversal.

## Definition of Done v1

- [x] Perfil con cinco dimensiones interpretables.
- [x] Activación después de cinco salas únicas.
- [x] Señales de visitas, lentes y mecanismo.
- [x] Tres recomendaciones que excluyen salas ya visitadas mientras existan alternativas.
- [x] Bonus de área no visitada para fomentar polimatía.
- [x] Explicación de cada recomendación.
- [x] Persistencia solo en `localStorage`.
- [x] Reset visible.
- [x] Iluminación de tarjetas recomendadas en la home.
- [x] Core determinista testeable sin DOM.
