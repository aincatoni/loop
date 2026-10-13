# Chrome Web Store Listing — loop

*Last Updated: 2026-10-12*

---

## 1. Store Metadata

* **Name:** loop
* **Short Description:** Crea bucles A-B precisos, ajusta la velocidad y guarda secciones para practicar guitarra, batería y cualquier instrumento en YouTube.
* **Category:** Accessibility / Fun / Productivity
* **Primary Language:** Spanish (Español)

---

## 2. Detailed Description

loop es la herramienta definitiva para músicos que sacan canciones de oído y practican con videos en YouTube. Diseñado para guitarristas, bateristas, bajistas, tecladistas y vocalistas.

### Funciones Principales:
* **Marcador de Bucles A-B con Micro-Ajuste:** Fija el inicio (A) y el fin (B) de cualquier frase musical. Ajusta con precisión de 0.1s y 0.5s para clavar el beat en el compás exacto.
* **Entrenador de Tempo:** Reduce la velocidad al 50%, 75%, 85%, 90% o usa el deslizador continuo para aprender partes difíciles a tu ritmo, conservando el tono y la afinación original.
* **Biblioteca de Secciones por Canción:** Guarda múltiples secciones de una canción (ej: Intro, Riff Principal, Solo de Guitarra, Fill de Batería). Quedan guardadas localmente y se recargan automáticamente cuando vuelves al video.
* **Control Manos Libres:** Compatible con pedaleras Bluetooth/USB como M-VAVE Chocolate (tecla F13) y atajos de teclado personalizables ([, ], \, ⌥+L) para no soltar las baquetas ni la púa.
* **Panel Integrado y Discreto:** Interfaz oscura estilo plugin musical, arrastrable y minimizable en una pastilla que no tapa la visualización del video.

---

## 3. Permissions Justification

| Permission | Justification |
| :--- | :--- |
| `storage` | Necesario para guardar en el almacenamiento local del navegador las secciones y puntos A-B que el usuario crea para cada video musical de YouTube. No se envían datos a ningún servidor externo. |
| `tabs` | Necesario para que la ventana emergente (popup) de la barra de extensiones detecte si la pestaña activa contiene un video de YouTube y refleje el estado del reproductor. |

### Host Permissions / Content Scripts:
| Host Pattern | Justification |
| :--- | :--- |
| `https://www.youtube.com/*` | Necesario para inyectar la barra de controles musicales y controlar la posición de reproducción del elemento de video HTML5 de YouTube. |

---

## 4. Privacy & Data Use Disclosure

* **Single Purpose:** Facilitar la práctica musical y transcripción de canciones mediante la repetición en bucle de fragmentos de videos en YouTube.
* **Data Collection:** loop NO recopila, transmite ni almacena información personal ni analítica de navegación. Todas las configuraciones y secciones guardadas residen exclusivamente de manera local en el navegador del usuario a través de `chrome.storage.local`.
* **Remote Code:** No se utiliza ningún script remoto ni `eval()`.
