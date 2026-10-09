# Verificación · Atlas Android

## Estado de 0.3.0 (código en rama)

- Añadidos parser/validador de ZIP Atlas v1, selector Productos y pruebas instrumentadas con la demo sintética compartida.
- Añadida comprobación Python de contrato/hash de esa fixture al CI manual.
- No compilado en este entorno: faltan JDK y Android SDK. No se afirma firma, APK nuevo ni prueba visual de 0.3.0.
- La demo incluida en pruebas está clasificada SYNTHETIC; no contiene datos de CRM. Los packs PRIVATE se generan y transfieren localmente, nunca se versionan.

## Verificación anterior · 0.2.0 · 2026-10-09

- Compilación Java / D8 / AAPT2: correcta con JDK 17, plataforma 35,
  Build Tools 35.0.0; API mínima 26.
- APK: paquete com.dinatale.economia.atlas; versionCode 2; versionName 0.2.0.
- Firma APK verificada con apksigner (esquemas v2 y v3).
- 6 pruebas Python: cobertura territorial, distritos prioritarios, IDs únicos,
  geometría, períodos/fuentes de indicadores y catálogo.
- 6 comprobaciones JVM de respaldo: JSON válido, versión incorrecta, etapa
  inválida, preferencia inválida, tamaño excesivo y JSON corrupto.
- Emulador: arranque/conexión no completado dentro de los intentos disponibles.
  No se afirma validación visual, prueba de instalación en teléfono ni ejecución
  satisfactoria de SmokeInstrumentation. Es una versión de desarrollo para probar.
- Pruebas instrumentadas incluidas para arranque, catálogos, Atlas, ajustes,
  conservación de notas al importar y al borrar historial, y progreso.

## Repetir pruebas

```bash
python3 -m unittest discover -s tests -v
python3 -m unittest discover -s tests -p 'test_*.py' -v
# Después de scripts/build.sh, con las mismas variables de entorno:
./scripts/build-tests.sh
adb install -r build/dntl-economia-atlas-0.2.0.apk
adb install -r build/atlas-tests.apk
adb shell am instrument -w \
 com.dinatale.economia.atlas.test/com.dinatale.economia.atlas.SmokeInstrumentation
```

Las pruebas instrumentadas modifican un perfil de prueba: ejecutar únicamente
sobre emulador limpio, porque verifican también el borrado del historial.
BackupValidationTest requiere org.json:json:20240303 en el classpath JVM.
El APK no incorpora esa dependencia: utiliza org.json de Android.

## Límites

No hay migración automática de 0.1.0; conservar aquella instalación.
No hay noticias en vivo ni datos locales inventados. La cobertura de Natural
Earth 1:110m omite algunos territorios muy pequeños. Los tiempos de aprendizaje
son orientativos y corresponden a las actividades breves, no al video completo.
