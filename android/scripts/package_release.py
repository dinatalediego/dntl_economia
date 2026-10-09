"""Package the signed APK with installation instructions and a checksum."""
import pathlib,hashlib,zipfile,json
root=pathlib.Path(__file__).resolve().parents[2]
apk=root/'android/build/dntl-economia-atlas-0.3.0.apk'
out=root/'releases/android';out.mkdir(parents=True,exist_ok=True)
sha=hashlib.sha256(apk.read_bytes()).hexdigest()
instructions='''DNTL Economía · Atlas 0.3.0 — Android 8 o superior

1. Extrae este ZIP en tu celular.
2. Abre dntl-economia-atlas-0.3.0.apk.
3. Si Android lo solicita, permite instalar desde la aplicación que usas para abrirlo.

Se instala como DNTL Economía · Atlas, junto a la versión anterior.
No desinstales la anterior si tiene notas: NO se migran automáticamente.
El espacio Productos importa ZIP analíticos privados o sintéticos para consulta offline. Los packs privados nunca se incluyen en este ZIP.
Es una compilación de desarrollo. La prueba visual en dispositivo queda pendiente.

En Ajustes puedes cambiar tema, letra, intereses y la pregunta de sesión,
y exportar/importar tu respaldo JSON. Exporta antes de cambiar de celular.
Mapas y productos importados funcionan sin conexión. El pack privado se transfiere por separado; no se publica en este ZIP.
Los indicadores son una copia fechada, no datos en vivo.

Código, compilación, fuentes y verificación:
https://github.com/dinatalediego/dntl_economia/tree/main/android
'''
zip_path=out/'dntl-economia-atlas-0.3.0.zip'
with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED) as z:
 z.write(apk,apk.name);z.writestr('INSTALAR.txt',instructions);z.writestr('SHA256.txt',sha+'  '+apk.name+'\n')
with zipfile.ZipFile(zip_path) as z:
 assert z.testzip() is None
 assert hashlib.sha256(z.read(apk.name)).hexdigest()==sha
(out/'latest.json').write_text(json.dumps({'version':'0.3.0','package':'com.dinatale.economia.atlas','file':zip_path.name,'apk_sha256':sha,'zip_sha256':hashlib.sha256(zip_path.read_bytes()).hexdigest(),'minimum_android':8,'status':'development','device_verification':'pending'},indent=2)+'\n')
print(zip_path)
