# Nobel Data Lab — experimentos ejecutables

Estos ejemplos traducen una idea Nobel a una implementación mínima e inspeccionable. Usan datos sintéticos y la biblioteca estándar de Python para separar el principio conceptual de dependencias o infraestructura.

## 1. Economía 2021 — Difference-in-Differences

```bash
python examples/economics_2021_causal_inference.py
```

Resultado esperado:

```text
Difference-in-Differences | synthetic demonstration
Treated change:      9.00
Control change:      2.00
Counterfactual post: 22.50
Estimated effect:    7.00
```

La demostración construye un mundo sintético donde conocemos el efecto verdadero. El estimador debe recuperar `7.0`.

## 2. Física 2024 — memoria asociativa de Hopfield

```bash
python examples/physics_2024_hopfield.py
```

Resultado esperado:

```text
Hopfield associative memory | synthetic demonstration
Target:     [1, 1, 1, -1, -1, -1]
Corrupted:  [1, 1, -1, -1, -1, -1]
Recovered:  [1, 1, 1, -1, -1, -1]
Recovered exactly: True
```

La red almacena patrones mediante pesos hebbianos. Al recibir una versión dañada, la dinámica converge al patrón almacenado.

## Tests

Desde la raíz del repositorio:

```bash
python -m unittest discover -s tests -v
```

Los tests verifican:

1. exactamente 30 combinaciones área-año para 2021–2025;
2. seis áreas en cada año y cinco años por área;
3. ausencia de duplicados `(area, year)`;
4. metadata y fuentes con formato válido;
5. recuperación del efecto causal y del patrón Hopfield esperados.

## Regla de diseño

Primero se usa un entorno sintético con verdad conocida. Después se lleva el método a datos reales. Esto permite distinguir un error de implementación de un problema de identificación, medición o calidad de datos.
