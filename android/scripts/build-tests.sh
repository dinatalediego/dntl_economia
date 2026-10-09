#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p build/test-classes build/test-dex
javac --release 8 -cp "$ANDROID_JAR:build/classes" -d build/test-classes tests/SmokeInstrumentation.java
jar cf build/test-classes.jar -C build/test-classes .
"$BUILD_TOOLS/d8" --min-api 26 --lib "$ANDROID_JAR" --classpath build/classes.jar --output build/test-dex build/test-classes.jar
"$BUILD_TOOLS/aapt2" link -I "$ANDROID_JAR" --manifest tests/AndroidManifest.xml -A tests/fixtures -o build/test-unsigned.apk
(cd build/test-dex && zip -q ../test-unsigned.apk classes.dex)
"$BUILD_TOOLS/zipalign" -f 4 build/test-unsigned.apk build/test-aligned.apk
"$BUILD_TOOLS/apksigner" sign --ks "$SIGNING_KEY" --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out build/atlas-tests.apk build/test-aligned.apk
