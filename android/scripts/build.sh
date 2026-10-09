#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${ANDROID_JAR:?Set ANDROID_JAR to platforms/android-35/android.jar}"
: "${BUILD_TOOLS:?Set BUILD_TOOLS to Android build-tools/35.0.0}"
: "${SIGNING_KEY:?Set SIGNING_KEY to the private Atlas development keystore}"
mkdir -p build/classes build/dex
"$BUILD_TOOLS/aapt2" compile --dir app/src/main/res -o build/res.zip
"$BUILD_TOOLS/aapt2" link -I "$ANDROID_JAR" --manifest app/src/main/AndroidManifest.xml -A app/src/main/assets -o build/resources.apk build/res.zip
javac -encoding UTF-8 --release 8 -classpath "$ANDROID_JAR" -d build/classes $(find app/src/main/java -name '*.java')
jar cf build/classes.jar -C build/classes .
"$BUILD_TOOLS/d8" --min-api 26 --lib "$ANDROID_JAR" --output build/dex build/classes.jar
cp build/resources.apk build/unsigned.apk
(cd build/dex && zip -q ../unsigned.apk classes*.dex)
"$BUILD_TOOLS/zipalign" -f -p 4 build/unsigned.apk build/aligned.apk
"$BUILD_TOOLS/apksigner" sign --ks "$SIGNING_KEY" --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out build/dntl-economia-atlas-0.3.0.apk build/aligned.apk
"$BUILD_TOOLS/apksigner" verify --verbose build/dntl-economia-atlas-0.2.0.apk
