# 🔁 loop — Extensión para loopear y practicar canciones en YouTube

> 🌐 **Landing Page Oficial:** [https://aincatoni.github.io/loop/](https://aincatoni.github.io/loop/)  
> 📦 **Última Versión (Release):** [Descargar loop v1.0.0 (.zip)](https://github.com/aincatoni/loop/releases/latest/download/loop-v1.0.0.zip)

**loop** es una extensión para **Google Chrome** y **Apple Safari** (macOS e iOS) diseñada para músicos. Te permite crear bucles (loops) de secciones exactas de cualquier video de YouTube, ajustar la velocidad con precisión y guardar partes clave de las canciones (solos, fills, riffs) para practicar con tu instrumento (guitarra, batería, bajo, teclado, etc.).

### 📑 Guías de instalación rápida
* [Instalar en Google Chrome](#-cómo-instalar-la-extensión-en-chrome)
* [Instalar en Safari para macOS](#-cómo-instalar-y-usar-la-extensión-en-safari-macos)
* [Instalar en Safari para iOS / iPadOS](#-cómo-instalar-y-probar-la-extensión-en-safari-de-tu-iphone-ios)
* [Funciones y atajos de teclado](#-funciones-principales-para-músicos)

---

## 🚀 Cómo instalar la extensión en Chrome

### Opción 1: Descargar el archivo ZIP (Recomendado)
1. Descarga la última versión empaquetada: [**loop-v1.0.0.zip**](https://github.com/aincatoni/loop/releases/latest/download/loop-v1.0.0.zip) (o desde la sección de [Releases](https://github.com/aincatoni/loop/releases)).
2. Descomprime el archivo `.zip` en cualquier carpeta de tu ordenador.
3. Abre Google Chrome e ingresa a `chrome://extensions` en la barra de direcciones.
4. En la esquina superior derecha, activa el **Modo de desarrollador**.
5. Haz clic en el botón **Cargar descomprimida** (*Load unpacked*) en la esquina superior izquierda.
6. Selecciona la carpeta descomprimida `loop`.
7. ¡Listo! Abre YouTube o recarga la pestaña con `Cmd + R` (o `Ctrl + R`).

### Opción 2: Clonar con Git (Para Desarrolladores)
1. Abre tu terminal y clona el repositorio:
   ```bash
   git clone https://github.com/aincatoni/loop.git
   ```
2. Abre `chrome://extensions` en Google Chrome.
3. Activa el **Modo de desarrollador** y haz clic en **Cargar descomprimida**.
4. Selecciona la carpeta `loop` que acabas de clonar.

> **💡 Nota:** Si ya tienes una pestaña de YouTube abierta, **recárgala con `Cmd + R`** (o `Ctrl + R`) para que el panel de **loop** aparezca sobre el video.

---

## 🧭 Cómo instalar y usar la extensión en Safari (macOS)

Las extensiones de Safari se distribuyen como una aplicación nativa que contiene la extensión web (Safari Web Extension). Puedes compilarla y registrarla en segundos:

### Opción 1: Construcción rápida por terminal (Recomendado)
1. Abre tu terminal en este directorio y ejecuta el script de construcción:
   ```bash
   ./build-safari.sh
   ```
2. Abre **Safari**.
3. En la barra de menús, ve a **Safari ➔ Ajustes...** (o `Cmd + ,`), entra a la pestaña **Avanzado** y asegúrate de tener marcada la opción **Mostrar funciones para desarrolladores web** (o *Mostrar el menú Desarrollo en la barra de menús*).
4. En la barra superior de tu Mac, abre el menú **Desarrollo** y marca **Permitir extensiones no firmadas** (*Allow Unsigned Extensions*). Te pedirá tu contraseña o Touch ID de macOS.
5. Abre la aplicación contenedora ejecutando:
   ```bash
   open "Safari/build/Loop.app"
   ```
6. En la ventana que aparece, haz clic en **"Abrir ajustes de extensiones de Safari..."** (o ve a **Safari ➔ Ajustes ➔ Extensiones**).
7. Marca la casilla de verificación junto a **loop** y selecciona **"Permitir siempre en todos los sitios web"** o en `youtube.com`.
8. Abre cualquier video de YouTube en Safari y ¡listo!

### Opción 2: Abrir y ejecutar desde Xcode
1. Abre el proyecto en Xcode:
   ```bash
   open Safari/Loop.xcodeproj
   ```
2. Selecciona el esquema **Loop (macOS)** en la barra superior.
3. En las opciones de firma (*Signing & Capabilities*), puedes elegir tu cuenta personal o firmar localmente.
4. Presiona el botón **Run** (`Cmd + R`).
5. Sigue los pasos 3 y 4 de la opción anterior para activar extensiones no firmadas en Safari.

> **💡 Tip importante en Safari:** Al cerrar Safari por completo (`Cmd + Q`), macOS desactiva la casilla *"Permitir extensiones no firmadas"* por motivos de seguridad del sistema. Si al volver a abrir Safari no ves el panel de loop, solo debes volver a marcar dicha opción en el menú **Desarrollo ➔ Permitir extensiones no firmadas**.
---

## 📱 Cómo instalar y probar la extensión en Safari de tu iPhone (iOS)

El proyecto incluye el target oficial para **iOS** (`Loop (iOS)` + `Loop Extension (iOS)`). Gracias a las Safari Web Extensions en iOS 15+, puedes instalarla en tu propio iPhone usando Xcode con cualquier cuenta de Apple (gratuita):

### Requisitos previos en el iPhone:
1. Conecta tu iPhone a tu Mac con el cable USB/Lightning o mediante Wi-Fi.
2. En tu iPhone, activa el **Modo de desarrollador**:
   - Ve a **Ajustes ➔ Privacidad y seguridad**.
   - Baja hasta el final y toca **Modo de desarrollador**.
   - Actívalo y reinicia el iPhone cuando te lo solicite.

### Compilar e instalar desde Xcode:
1. Abre el proyecto en tu Mac:
   ```bash
   open Safari/Loop.xcodeproj
   ```
2. En la barra superior de Xcode, haz clic en el selector de esquema/dispositivo y elige:
   - Esquema: **Loop (iOS)**
   - Dispositivo: Selecciona **tu iPhone físico** conectado (ej. *iPhone de Ain*).
3. En el navegador izquierdo de Xcode, haz clic en el proyecto raíz **Loop** (icono azul).
4. Ve a la pestaña **Signing & Capabilities**:
   - Tanto para el target **Loop (iOS)** como para **Loop Extension (iOS)**, selecciona tu **Team personal** (tu Apple ID gratuito en el desplegable *Team*).
   - Si el *Bundle Identifier* (`com.aincatoni.loop`) ya está tomado por otro desarrollador en Apple, añade un sufijo o tus iniciales (ej. `com.aincatoni.loop-dev`).
5. Presiona el botón **Play / Run** (`Cmd + R`) en Xcode.
6. Xcode compilará e instalará la app **Loop** en tu iPhone.

### Activar la extensión en iOS:
1. Si es la primera vez que instalas una app tuya, en el iPhone ve a **Ajustes ➔ General ➔ Gestión de VPN y dispositivos**, toca tu correo de desarrollador y pulsa **Confiar**.
2. Abre la app **Loop** en tu iPhone (verás las instrucciones de bienvenida).
3. Ve a **Ajustes del iPhone ➔ Safari ➔ Extensiones**.
4. Verás **loop** en la lista: actívala.
5. En los permisos de sitios web, selecciona **Permitir** en `youtube.com`.
6. Abre **Safari en el iPhone** y entra a `m.youtube.com` o `youtube.com`. Al reproducir cualquier video verás el panel flotante de **loop** táctil sobre el video listo para loopear y practicar con tu instrumento.
---

## 🥁 Funciones principales para músicos

### 1. Marcado Preciso A-B
* **Punto A (Inicio):** Marca el compás o segundo exacto donde empieza la frase musical.
* **Punto B (Fin):** Marca el final de la frase; el reproductor empezará a repetirla en bucle sin pausas.
* **Micro-ajuste (+/- 0.1s y +/- 0.5s):** ¿Presionaste "Marcar" una fracción de segundo antes o después del golpe de caja o de púa? Usa los botones de ajuste fino para clavar el beat en el tiempo 1.

### 2. Entrenador de Tempo (Velocidad de Práctica)
* Presets rápidos: **0.5x**, **0.75x**, **0.85x**, **0.9x** y **1.0x**.
* Barra deslizante (slider) con pasos de **0.05x** (desde 0.25x hasta 1.5x).
* *YouTube conserva la afinación original del audio automáticamente*, permitiéndote sacar canciones rápidas nota por nota a menor velocidad.

### 3. Guardado y Reordenación de Secciones (Drag & Drop)
* Puedes guardar múltiples partes de la misma canción (ej: *"Intro Riff"*, *"Fill difícil"*, *"Solo de guitarra"*).
* **Arrastrar y reordenar:** Puedes arrastrar las secciones desde el icono `⋮⋮` para ordenarlas según la estructura de la canción (Intro ➔ Verso ➔ Coro ➔ Solo). El orden se guarda automáticamente.
* Se guardan vinculadas al video: cuando vuelvas mañana, tus secciones y su orden seguirán intactos.

### 4. Manos Libres: Pedal y Atajos de Teclado
Tanto si tienes las baquetas en la mano como si estás sosteniendo la guitarra:
* **Pedal Chocolate (M-VAVE) o F13:**
  * **1.er toque:** Marca el Punto A.
  * **2.º toque:** Marca el Punto B y activa el bucle.
  * **3.er toque:** Limpia el bucle.
* **Ciclo de 1 tecla (Mac / PC):** `⌥ Option + L` (o `Alt + L`) realiza la misma función cíclica del pedal directamente desde el teclado de tu ordenador.
* **Atajos dedicados:**
  * `[` : Fijar Punto A
  * `]` : Fijar Punto B
  * `\` : Alternar bucle ON / OFF
  * `Shift + [` : Saltar al inicio del bucle de inmediato
  * `Shift + X` : Limpiar bucle

---

## 🎨 Panel flotante y modo discreto
* **Arrastrable:** Puedes mover el panel haciendo clic y arrastrando la barra superior.
* **Minimizable:** Haz clic en el botón `─` para colapsarlo en una pequeña pastilla flotante que muestra el estado sin tapar la pantalla del video.
* Haz clic en la pastilla en cualquier momento para volver a abrir los controles completos.
