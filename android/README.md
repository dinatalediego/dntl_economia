# DNTL Economía · Atlas 0.3.0

Aplicación Android nativa offline (Java / Android SDK, Android 8 o superior).
Reconstrucción del proyecto Android perdido; reutiliza el catálogo del repositorio.
La web existente no se modifica. No es el código exacto de la antigua edición Compose.

## Instalar

La compilación fuente 0.3.0 añade el espacio Productos. El ZIP anterior 0.2.0 no incluye el importador. Genera un APK 0.3.0 con el procedimiento de abajo; el ZIP privado se importa por separado.
Paquete: `com.dinatale.economia.atlas`. Se instala junto a la versión 0.1.0.
No desinstalar la anterior si contiene notas: sus datos no se migran automáticamente.
La firma es de desarrollo. No es una publicación en Play Store.

## Funciones

- Intención de sesión: explorar, entender, aplicar, ponerse a prueba o sorpresa.
- Energía opcional; sesiones de 1, 3, 10 o 20 minutos; botón Saltar.
- Nueva sesión al abrir o tras 30 minutos en segundo plano, no al navegar.
- Dos enfoques: trabajo y economía cotidiana. Preferencias e intereses locales.
- Museo Nobel y catálogo de aprendizaje reutilizados de la web; laboratorio DiD.
- Atlas offline con zoom, desplazamiento, selección y búsqueda accesible.
- Mundo, departamentos de Perú, distritos de Lima Metropolitana y Callao.
- Accesos a Jesús María, Miraflores, San Isidro y Surquillo.
- Notas y etapas: explorado, guardado, puedo explicarlo, lo apliqué.
- Temas claro/oscuro, tres tamaños de letra, exportación/importación JSON.
- Productos analíticos offline: importar ZIP v1 (data/model/story/scenario), validar SHA-256, clasificación, períodos e inventario antes de instalar.
- Etiqueta PRIVATE/SYNTHETIC visible, historial mensual, indicadores, MAE, límites del modelo y control de escenarios no causales.
- Pack almacenado en el sandbox de la app, separado de notas y respaldos; opción de eliminarlo. No requiere conexión ni permiso de almacenamiento.
- Importación con confirmación: se agregan registros ausentes; notas y etapas
  locales prevalecen. Preferencias se restauran. Límite de archivo: 2 MB.
- Borrar historial conserva notas, etapas y ajustes.

## Estructura

- `app/src/main/java/.../MainActivity.java`: pantallas y flujo de sesión.
- `Store.java`: persistencia y respaldo validado.
- `AtlasPack.java` / `AtlasProductsActivity.java`: validador y consumidor offline del pack v1.
- `MapView.java`: dibujo y selección de polígonos sin servicios externos.
- `app/src/main/assets`: catálogos y datos geográficos versionados.
- `scripts/build.sh`: compilación sin Gradle ni dependencias de terceros.
- `scripts/build_atlas.py`: generación reproducible desde fuentes descargadas.
- `tests`: contratos de contenido y pruebas de respaldo.

## Compilar en Linux

Requisitos: JDK 17 (incluido `javac`), Android Platform 35, Build Tools 35.0.0,
Python 3, zip. Descargar herramientas desde Android SDK / Google.

```bash
export ANDROID_JAR=/ruta/sdk/platforms/android-35/android.jar
export BUILD_TOOLS=/ruta/sdk/build-tools/35.0.0
export SIGNING_KEY=/ruta/privada/atlas-development.keystore
./scripts/build.sh
```

Resultado: `build/dntl-economia-atlas-0.3.0.apk`. Reutiliza exactamente la clave de la instalación para actualizarla.
La clave privada se guarda fuera del repositorio. Para actualizar una instalación
Atlas hay que reutilizarla. Alias `androiddebugkey`, contraseña estándar de
DESARROLLO `android`. El respaldo privado se entrega por separado, jamás publicar.
Sin esa clave, una compilación con otra firma requiere otro paquete o desinstalar
la app (exportar datos antes). No reemplazarla silenciosamente.

## Fuentes y alcance

- Mundo: Natural Earth 1:110m, dominio público.
  https://github.com/nvkelso/natural-earth-vector
- Perú: copia comunitaria de límites atribuidos a INEI 2023:
  https://github.com/axelrogg/peru-maps-geojson
  Geometría simplificada para referencia educativa, no catastro ni límites legales.
- PIB e inflación: Banco Mundial WDI, indicadores NY.GDP.MKTP.KD.ZG y
  FP.CPI.TOTL.ZG; observación no nula más reciente entre 2024 y 2025.
  https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.KD.ZG?date=2024:2025&format=json&per_page=20000
  https://api.worldbank.org/v2/country/all/indicator/FP.CPI.TOTL.ZG?date=2024:2025&format=json&per_page=20000
- Fecha de descarga: 2026-10-09. Huellas en `atlas-source-hashes.json`.
- Noticia editorial nacional: Banco Mundial, 2026-01-26, reformas fiscales y
  productividad. Enlace primario dentro de la aplicación. No es un feed en vivo.
- Sin indicadores departamentales/distritales incorporados: se indica ausencia
  y se enlazan INEI/BCRP. No se asignan cifras nacionales a un distrito.

## Siguientes mejoras

1. Verificar usabilidad en teléfonos físicos y accesibilidad con TalkBack.
2. Dividir MainActivity en pantallas antes de añadir nuevas funciones grandes.
3. Añadir indicadores locales con período, unidad, cobertura y fuente verificable.
4. Automatizar actualización de datos mediante revisiones de cambios, sin
   convertir proyecciones en observaciones ni sobrescribir notas del usuario.
5. Mejorar recomendaciones por evidencias de aprendizaje, con razones visibles.
6. Migrar hacia firma de distribución y flujo de releases estable si se publica.

Guardar cada mejora en una rama, verificar compilación y respaldos, actualizar
CHANGELOG y publicar un ZIP versionado. Mantener claves fuera de Git.
