# 🔁 loop — Extensión para loopear y practicar canciones en YouTube

**loop** es una extensión de Google Chrome diseñada para músicos. Te permite crear bucles (loops) de secciones exactas de cualquier video de YouTube, ajustar la velocidad con precisión y guardar partes clave de las canciones (solos, fills, riffs) para practicar con tu instrumento (guitarra, batería, bajo, teclado, etc.).

---

## 🚀 Cómo instalar la extensión en Chrome

1. Abre Google Chrome y ve a `chrome://extensions`.
2. En la esquina superior derecha, activa el **Modo de desarrollador**.
3. Haz clic en el botón **Cargar descomprimida** (*Load unpacked*) en la esquina superior izquierda.
4. Selecciona la carpeta donde está este proyecto:
   ```
   /Users/aincatoni/code/Ideas/loop
   ```
5. ¡Listo! La extensión **loop** ya estará instalada y activa.

> **💡 Nota:** Si ya tienes una pestaña de YouTube abierta, **recárgala con `Cmd + R`** para que el panel de **loop** aparezca sobre el video.

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
# loop
