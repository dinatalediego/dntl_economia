# Ciencias Económicas 2021 — Card, Angrist e Imbens y la inferencia causal

## Nobel

El Premio del Banco de Suecia en Ciencias Económicas en memoria de Alfred Nobel 2021 fue dividido entre **David Card**, por sus contribuciones empíricas a la economía laboral, y **Joshua D. Angrist y Guido W. Imbens**, por sus contribuciones metodológicas al análisis de relaciones causales.

## Problema

Los datos observacionales muestran correlaciones. Pero para política pública, negocio y economía normalmente queremos contestar otra pregunta:

> ¿Qué habría ocurrido con el mismo individuo, empresa o mercado si la intervención no hubiera sucedido?

Ese resultado contrafactual no se observa directamente.

## Enfoque

Los laureados mostraron cómo los **experimentos naturales** y diseños cuasi-experimentales permiten aproximarse a relaciones de causa y efecto cuando un experimento aleatorizado no es posible.

Conceptos que esta línea de trabajo vuelve centrales:

- tratamiento y resultado potencial;
- contrafactual;
- grupos comparables;
- variación exógena;
- variables instrumentales;
- efectos de tratamiento heterogéneos;
- supuestos de identificación;
- separación entre estimación e identificación.

## Datos → diseño → efecto causal

```text
Datos observacionales
        ↓
identificar una fuente de variación cuasi-exógena
        ↓
diseño de identificación
        ↓
comprobación de supuestos
        ↓
estimación
        ↓
efecto causal interpretable
```

## Por qué esto cambia la forma de pensar ML

Un modelo predictivo puede descubrir que ciertos leads convierten más. Eso **no implica** que cambiar una variable asociada provoque mayor conversión.

Ejemplo:

```text
Predicción:
"Los leads contactados en menos de 5 minutos convierten más."

Causalidad:
"¿Reducir deliberadamente el tiempo de contacto a menos de 5 minutos
incrementa la probabilidad de conversión?"
```

La segunda pregunta requiere identificación causal, no solamente accuracy.

## Qué aprender para proyectos propios

1. Antes de entrenar, definir si la pregunta es **predictiva, causal o descriptiva**.
2. Un buen AUC no demuestra que una acción comercial funcione.
3. Las reglas operativas, cambios de asignación, campañas y políticas comerciales pueden generar cuasi-experimentos valiosos.
4. Conviene almacenar el contexto de cada decisión: fecha, política vigente, tratamiento, elegibilidad y outcome posterior.
5. La evidencia de producción debe permitir comparar challenger vs. baseline con una pregunta causal bien definida cuando sea posible.

## Preguntas para experimentar

- ¿Asignar un lead a cierto tipo de asesor mejora su conversión o solo refleja selección previa?
- ¿Un descuento causa mayor cierre o se entrega precisamente a clientes con mayor riesgo de no cerrar?
- ¿Qué cambios históricos de reglas comerciales pueden funcionar como experimentos naturales?

## Relación con modelos de datos

**Directa y central.** El motivo oficial del Nobel reconoce explícitamente contribuciones metodológicas al análisis de relaciones causales y el uso de experimentos naturales.

## Fuentes oficiales

- Nobel Prize, *The Sveriges Riksbank Prize in Economic Sciences in Memory of Alfred Nobel 2021*: https://www.nobelprize.org/prizes/economic-sciences/2021/summary/
- Nobel Prize, *Press release — Economic Sciences 2021*: https://www.nobelprize.org/prizes/economic-sciences/2021/press-release/
