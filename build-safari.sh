#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "🔨 Construyendo Loop para Safari (macOS)..."
xcodebuild -project Safari/Loop.xcodeproj \
  -scheme "Loop (macOS)" \
  -configuration Debug \
  CONFIGURATION_BUILD_DIR="$DIR/Safari/build" \
  CODE_SIGN_IDENTITY="-" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_STYLE=Manual \
  build

echo "📦 Registrando Loop.app con LaunchServices..."
/System/Library/Frameworks/CoreServices.framework/Versions/Current/Frameworks/LaunchServices.framework/Versions/Current/Support/lsregister -f "$DIR/Safari/build/Loop.app"

echo ""
echo "✅ ¡Construcción exitosa!"
echo "📍 Aplicación generada en: Safari/build/Loop.app"
echo ""
echo "👉 Pasos para activar la extensión en Safari:"
echo "1. Abre Safari."
echo "2. Ve a Safari > Ajustes (Cmd + ,) > Avanzado y marca 'Mostrar funciones para desarrolladores web'."
echo "3. En la barra de menús superior de Safari, ve a Desarrollo > marca 'Permitir extensiones no firmadas'."
echo "4. Abre la app complementaria: open \"Safari/build/Loop.app\""
echo "5. En Safari > Ajustes > Extensiones, activa la casilla de 'loop' y otorga permisos para youtube.com."
echo "6. Abre cualquier video en YouTube y verás el panel de Loop listo para practicar."
