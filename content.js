/* ==========================================================================
   RiffLoop — Content Script para YouTube
   Controlador A-B, micro-ajuste, velocidad, pedal Chocolate y secciones.
   ========================================================================== */

(function () {
  'use strict';

  // Evitar inyección múltiple
  if (window.__riffLoopLoaded) return;
  window.__riffLoopLoaded = true;

  // --- Estado Global ---
  let videoEl = null;
  let currentVideoId = '';
  let pointA = null;
  let pointB = null;
  let isLooping = false;
  let playbackSpeed = 1.0;
  let isMinimized = false;
  let currentViewMode = 'intermediate'; // 'minimized' | 'intermediate' | 'full'
  let lastActiveViewMode = 'intermediate';
  let preRollSeconds = 0;
  let savedLoops = [];

  // --- Elementos del DOM del Widget ---
  let overlayEl = null;

  // --- Formateador de tiempo (mm:ss.S o mm:ss.SS) ---
  function formatTime(seconds, decimals = 2) {
    if (seconds === null || seconds === undefined || isNaN(seconds)) {
      return decimals === 1 ? '--:--.-' : '--:--.--';
    }
    const totalSecs = Math.max(0, seconds);
    const m = Math.floor(totalSecs / 60);
    const s = Math.floor(totalSecs % 60);
    const frac = Math.floor((totalSecs % 1) * Math.pow(10, decimals));

    const pad = (num, digits = 2) => String(num).padStart(digits, '0');
    const fracStr = String(frac).padStart(decimals, '0');
    return `${pad(m)}:${pad(s)}.${fracStr}`;
  }

  // --- Obtener video activo en YouTube ---
  function getVideo() {
    if (videoEl && document.contains(videoEl)) return videoEl;
    const v = document.querySelector('video.html5-main-video') || document.querySelector('video');
    if (v) {
      videoEl = v;
      hookVideoEvents(v);
    }
    return videoEl;
  }

  function getVideoId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('v') || '';
  }

  // --- Enlazar Eventos del Reproductor de Video ---
  function hookVideoEvents(v) {
    if (v._riffLoopHooked) return;
    v._riffLoopHooked = true;

    v.addEventListener('timeupdate', () => {
      if (isLooping && pointA !== null && pointB !== null) {
        if (v.currentTime >= pointB) {
          v.currentTime = Math.max(0, pointA - preRollSeconds);
        }
      }
      if (currentViewMode === 'intermediate' && !isMinimized) {
        updateInterPlayhead(v);
      }
    });

    v.addEventListener('ratechange', () => {
      playbackSpeed = v.playbackRate;
      updateUI();
    });

    v.addEventListener('loadedmetadata', () => {
      updateUI();
    });

    v.addEventListener('durationchange', () => {
      updateUI();
    });
  }

  // --- Lógica del Bucle (A-B) ---
  function setPointA(customTime) {
    const v = getVideo();
    if (!v) return;
    pointA = customTime !== undefined ? customTime : v.currentTime;
    if (pointB !== null && pointB <= pointA) {
      pointB = null;
      isLooping = false;
    }
    updateUI();
  }

  function setPointB(customTime) {
    const v = getVideo();
    if (!v) return;
    const targetB = customTime !== undefined ? customTime : v.currentTime;
    if (pointA !== null && targetB > pointA) {
      pointB = targetB;
      isLooping = true;
    } else if (pointA === null) {
      // Si no hay punto A, fijar A en targetB
      pointA = targetB;
    }
    updateUI();
  }

  function toggleLoop() {
    const v = getVideo();
    if (!v) return;

    if (pointA !== null && pointB !== null) {
      isLooping = !isLooping;
      if (isLooping && (v.currentTime < pointA || v.currentTime > pointB)) {
        v.currentTime = Math.max(0, pointA - preRollSeconds);
      }
    } else if (pointA === null) {
      // 1er paso: Fijar A
      setPointA();
    } else if (pointB === null) {
      // 2do paso: Fijar B y activar
      setPointB();
    }
    updateUI();
  }

  function jumpToA() {
    const v = getVideo();
    if (!v || pointA === null) return;
    v.currentTime = Math.max(0, pointA - preRollSeconds);
  }

  function clearLoop() {
    pointA = null;
    pointB = null;
    isLooping = false;
    updateUI();
  }

  function nudgePoint(point, delta) {
    if (point === 'A' && pointA !== null) {
      pointA = Math.max(0, pointA + delta);
      if (pointB !== null && pointA >= pointB) {
        pointA = Math.max(0, pointB - 0.1);
      }
    } else if (point === 'B' && pointB !== null) {
      pointB = Math.max(0, pointB + delta);
      if (pointA !== null && pointB <= pointA) {
        pointB = pointA + 0.1;
      }
    }
    updateUI();
  }

  function setSpeed(speed) {
    const v = getVideo();
    if (!v) return;
    v.playbackRate = speed;
    playbackSpeed = speed;
    updateUI();
  }

  // --- Almacenamiento de Secciones Guardadas ---
  async function loadSavedLoops() {
    currentVideoId = getVideoId();
    if (!currentVideoId) {
      savedLoops = [];
      updateUI();
      return;
    }

    try {
      const key = `riffloop_${currentVideoId}`;
      const result = await chrome.storage.local.get(key);
      savedLoops = result[key] || [];
    } catch (e) {
      savedLoops = [];
    }
    updateUI();
  }

  async function saveCurrentSection(name) {
    if (!name || pointA === null || pointB === null || !currentVideoId) return;

    const newSection = {
      id: Date.now().toString(),
      name: name.trim(),
      start: pointA,
      end: pointB,
    };

    savedLoops.push(newSection);
    try {
      const key = `riffloop_${currentVideoId}`;
      await chrome.storage.local.set({ [key]: savedLoops });
    } catch (e) {
      console.error('Error al guardar sección:', e);
    }
    updateUI();
  }

  async function deleteSavedSection(id) {
    savedLoops = savedLoops.filter(item => item.id !== id);
    try {
      const key = `riffloop_${currentVideoId}`;
      await chrome.storage.local.set({ [key]: savedLoops });
    } catch (e) {
      console.error('Error al borrar sección:', e);
    }
    updateUI();
  }

  async function reorderSavedSections(fromIndex, toIndex) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= savedLoops.length || toIndex >= savedLoops.length) return;
    const [moved] = savedLoops.splice(fromIndex, 1);
    savedLoops.splice(toIndex, 0, moved);
    try {
      const key = `riffloop_${currentVideoId}`;
      await chrome.storage.local.set({ [key]: savedLoops });
    } catch (e) {
      console.error('Error al guardar nuevo orden:', e);
    }
    updateUI();
  }

  function loadSection(section) {
    pointA = section.start;
    pointB = section.end;
    isLooping = true;
    const v = getVideo();
    if (v) {
      v.currentTime = Math.max(0, pointA - preRollSeconds);
    }
    updateUI();
  }

  // --- Atajos de Teclado y Pedal Chocolate ---
  function isTypingContext(e) {
    const target = e.target;
    if (!target) return false;
    const tag = target.tagName ? target.tagName.toLowerCase() : '';
    return tag === 'input' || tag === 'textarea' || target.isContentEditable || target.getAttribute('role') === 'textbox';
  }

  window.addEventListener('keydown', (e) => {
    // Si el usuario está escribiendo un comentario o buscando, ignorar
    if (isTypingContext(e)) return;

    const keyNum = e.keyCode || e.which;
    const isF13 = (keyNum === 124 || e.key === 'F13');
    const isAltL = (e.altKey && (e.code === 'KeyL' || e.key === 'l' || e.key === 'L' || e.key === '¬'));

    // 1. Pedal Chocolate (F13) o ⌥ Option + L (ciclo de 1 pedal/tecla)
    if (isF13 || isAltL) {
      e.preventDefault();
      e.stopPropagation();

      if (pointA === null) {
        setPointA();
      } else if (pointB === null) {
        setPointB();
      } else {
        clearLoop();
      }
      return;
    }

    // 2. Tecla [ : Fijar Punto A
    if (e.key === '[' || e.code === 'BracketLeft') {
      if (e.shiftKey) {
        e.preventDefault();
        jumpToA();
      } else {
        e.preventDefault();
        setPointA();
      }
      return;
    }

    // 3. Tecla ] : Fijar Punto B
    if (e.key === ']' || e.code === 'BracketRight') {
      e.preventDefault();
      setPointB();
      return;
    }

    // 4. Tecla \ : Alternar Loop ON/OFF
    if (e.key === '\\' || e.code === 'Backslash') {
      e.preventDefault();
      toggleLoop();
      return;
    }

    // 5. Tecla X (con Shift) o Delete: Limpiar bucle
    if (e.shiftKey && (e.code === 'KeyX' || e.key === 'X')) {
      e.preventDefault();
      clearLoop();
      return;
    }
  }, true);

  // --- Creación de la Interfaz Visual (DOM) ---
  function createWidget() {
    if (document.getElementById('riffloop-overlay')) return;

    overlayEl = document.createElement('div');
    overlayEl.id = 'riffloop-overlay';
    overlayEl.innerHTML = `
      <!-- Vista Minimizada (Pill) -->
      <div class="riffloop-minimized" id="riffloop-min-view" style="display: none;">
        <div class="riffloop-mini-led" id="riffloop-min-led"></div>
        <span class="riffloop-mini-title">loop</span>
        <span class="riffloop-mini-info" id="riffloop-min-info">A-B Inactivo</span>
      </div>

      <!-- Vista Intermedia (Practice Stage Card) -->
      <div class="riffloop-intermediate" id="riffloop-intermediate-view">
        <div class="riffloop-inter-header" id="riffloop-inter-drag-handle">
          <div class="riffloop-inter-brand-wrap">
            <div class="riffloop-brand">
              <span class="riffloop-logo">🔁</span>
              <span class="riffloop-title">loop</span>
            </div>
            <div class="riffloop-status-pill" id="riffloop-inter-status-pill">
              <span class="riffloop-status-dot"></span>
              <span id="riffloop-inter-status-text">BUCLE INACTIVO</span>
            </div>
          </div>

          <div class="riffloop-inter-actions">
            <button class="riffloop-inter-btn-toggle" id="riffloop-inter-btn-toggle">Activar</button>
            <button class="riffloop-view-switch-btn" id="riffloop-inter-btn-expand" title="Cambiar a vista vertical">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="7 15 12 20 17 15"></polyline>
                <polyline points="7 9 12 4 17 9"></polyline>
              </svg>
              <span>↕ Vista Vertical</span>
            </button>
            <div class="riffloop-header-actions">
              <button class="riffloop-icon-btn" id="riffloop-inter-btn-minimize" title="Minimizar a pastilla">─</button>
              <button class="riffloop-icon-btn" id="riffloop-inter-btn-close" title="Ocultar">✕</button>
            </div>
          </div>
        </div>

        <div class="riffloop-inter-ab-row">
          <!-- Punto A -->
          <div class="riffloop-inter-card" id="riffloop-inter-card-a">
            <div class="riffloop-inter-card-top">
              <span class="riffloop-inter-label">PUNTO A (INICIO)</span>
              <span class="riffloop-inter-tag" id="riffloop-inter-tag-a">COMPÁS 1</span>
            </div>
            <div class="riffloop-inter-time-row">
              <span class="riffloop-inter-time" id="riffloop-inter-time-a">--:--.-</span>
              <button class="riffloop-inter-set-btn" id="riffloop-inter-btn-set-a">Fijar A</button>
              <div class="riffloop-inter-nudges" id="riffloop-inter-nudges-a">
                <button class="riffloop-inter-nudge" id="riffloop-inter-nudge-a-minus2">-0.5s</button>
                <button class="riffloop-inter-nudge" id="riffloop-inter-nudge-a-minus1">-0.1s</button>
                <button class="riffloop-inter-nudge" id="riffloop-inter-nudge-a-plus1">+0.1s</button>
                <button class="riffloop-inter-nudge" id="riffloop-inter-nudge-a-plus2">+0.5s</button>
              </div>
            </div>
          </div>

          <!-- Punto B -->
          <div class="riffloop-inter-card" id="riffloop-inter-card-b">
            <div class="riffloop-inter-card-top">
              <span class="riffloop-inter-label">PUNTO B (FINAL)</span>
              <span class="riffloop-inter-tag" id="riffloop-inter-tag-b">SALIDA</span>
            </div>
            <div class="riffloop-inter-time-row">
              <span class="riffloop-inter-time" id="riffloop-inter-time-b">--:--.-</span>
              <button class="riffloop-inter-set-btn" id="riffloop-inter-btn-set-b">Fijar B</button>
              <div class="riffloop-inter-nudges" id="riffloop-inter-nudges-b">
                <button class="riffloop-inter-nudge" id="riffloop-inter-nudge-b-minus2">-0.5s</button>
                <button class="riffloop-inter-nudge" id="riffloop-inter-nudge-b-minus1">-0.1s</button>
                <button class="riffloop-inter-nudge" id="riffloop-inter-nudge-b-plus1">+0.1s</button>
                <button class="riffloop-inter-nudge" id="riffloop-inter-nudge-b-plus2">+0.5s</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Barra de progreso interactiva -->
        <div class="riffloop-inter-track-wrap" id="riffloop-inter-track-wrap" title="Clic para saltar en la pista">
          <div class="riffloop-inter-track" id="riffloop-inter-track">
            <div class="riffloop-inter-loop-span" id="riffloop-inter-loop-span"></div>
            <div class="riffloop-inter-playhead" id="riffloop-inter-playhead"></div>
          </div>
        </div>

        <!-- Fila de Tempo -->
        <div class="riffloop-inter-tempo-row">
          <div class="riffloop-inter-tempo-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Velocidad de estudio:</span>
          </div>
          <div class="riffloop-inter-tempo-presets">
            <button class="riffloop-inter-speed-pill" data-speed="0.5">0.5x</button>
            <button class="riffloop-inter-speed-pill" data-speed="0.75">0.75x</button>
            <button class="riffloop-inter-speed-pill" data-speed="0.85">0.85x</button>
            <button class="riffloop-inter-speed-pill" data-speed="1.0">1.0x</button>
          </div>
        </div>

        <!-- Fila de Secciones Guardadas -->
        <div class="riffloop-inter-sections-row">
          <span class="riffloop-inter-sections-title">SECCIONES GUARDADAS:</span>
          <div class="riffloop-inter-sections-pills" id="riffloop-inter-sections-list">
            <!-- Píldoras inyectadas -->
          </div>
          <button class="riffloop-inter-add-section-btn" id="riffloop-inter-add-section-btn" title="Guardar bucle actual">+</button>
        </div>
      </div>

      <!-- Panel Expandido Studio -->
      <div class="riffloop-panel" id="riffloop-full-view" style="display: none;">
        <div class="riffloop-header" id="riffloop-drag-handle">
          <div class="riffloop-brand">
            <span class="riffloop-logo">🔁</span>
            <span class="riffloop-title">loop</span>
          </div>
          <div class="riffloop-header-actions">
            <button class="riffloop-view-switch-btn" id="riffloop-btn-compact" title="Cambiar a vista horizontal">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 7 20 12 15 17"></polyline>
                <polyline points="9 7 4 12 9 17"></polyline>
              </svg>
              <span>↔ Vista Horizontal</span>
            </button>
            <button class="riffloop-icon-btn" id="riffloop-btn-minimize" title="Minimizar">─</button>
            <button class="riffloop-icon-btn" id="riffloop-btn-close" title="Ocultar">✕</button>
          </div>
        </div>

        <div class="riffloop-body">
          <!-- Tarjetas A y B -->
          <div class="riffloop-ab-grid">
            <!-- Punto A -->
            <div class="riffloop-point-card" id="riffloop-card-a">
              <span class="riffloop-point-label">Punto A (Inicio)</span>
              <span class="riffloop-time-display" id="riffloop-time-a">--:--.--</span>
              <button class="riffloop-set-btn" id="riffloop-btn-set-a">Marcar A [ [ ]</button>
              <div class="riffloop-nudge-group">
                <button class="riffloop-nudge-btn" id="riffloop-nudge-a-minus2">-0.5s</button>
                <button class="riffloop-nudge-btn" id="riffloop-nudge-a-minus1">-0.1s</button>
                <button class="riffloop-nudge-btn" id="riffloop-nudge-a-plus1">+0.1s</button>
                <button class="riffloop-nudge-btn" id="riffloop-nudge-a-plus2">+0.5s</button>
              </div>
            </div>

            <!-- Punto B -->
            <div class="riffloop-point-card" id="riffloop-card-b">
              <span class="riffloop-point-label">Punto B (Fin)</span>
              <span class="riffloop-time-display" id="riffloop-time-b">--:--.--</span>
              <button class="riffloop-set-btn" id="riffloop-btn-set-b">Marcar B [ ] ]</button>
              <div class="riffloop-nudge-group">
                <button class="riffloop-nudge-btn" id="riffloop-nudge-b-minus2">-0.5s</button>
                <button class="riffloop-nudge-btn" id="riffloop-nudge-b-minus1">-0.1s</button>
                <button class="riffloop-nudge-btn" id="riffloop-nudge-b-plus1">+0.1s</button>
                <button class="riffloop-nudge-btn" id="riffloop-nudge-b-plus2">+0.5s</button>
              </div>
            </div>
          </div>

          <!-- Acciones Principales -->
          <div class="riffloop-main-action">
            <button class="riffloop-toggle-btn" id="riffloop-btn-toggle">
              <span id="riffloop-toggle-icon">🔁</span>
              <span id="riffloop-toggle-text">Loop Desactivado</span>
            </button>
            <button class="riffloop-secondary-btn" id="riffloop-btn-jump-a" title="Rebobinar al inicio del bucle">⏮ Ir a A</button>
            <button class="riffloop-secondary-btn" id="riffloop-btn-clear" title="Quitar puntos A y B">✕ Limpiar</button>
          </div>

          <!-- Entrenador de Tempo / Velocidad -->
          <div class="riffloop-speed-box">
            <div class="riffloop-section-header">
              <span>Velocidad de Práctica</span>
              <span class="riffloop-speed-value" id="riffloop-speed-display">1.00x</span>
            </div>
            <div class="riffloop-speed-presets">
              <button class="riffloop-speed-btn" data-speed="0.5">0.5x</button>
              <button class="riffloop-speed-btn" data-speed="0.75">0.75x</button>
              <button class="riffloop-speed-btn" data-speed="0.85">0.85x</button>
              <button class="riffloop-speed-btn" data-speed="0.9">0.9x</button>
              <button class="riffloop-speed-btn active" data-speed="1.0">1.0x</button>
            </div>
            <input type="range" class="riffloop-slider" id="riffloop-speed-slider" min="0.25" max="1.5" step="0.05" value="1.0">
          </div>

          <!-- Guardar Secciones de la Canción -->
          <div class="riffloop-saved-box">
            <div class="riffloop-section-header">
              <span>Secciones Guardadas</span>
            </div>
            <div class="riffloop-save-input-row">
              <input type="text" class="riffloop-save-input" id="riffloop-section-name" placeholder="Ej. Solo de guitarra, Fill..." maxlength="25">
              <button class="riffloop-save-btn" id="riffloop-btn-save-section">+ Guardar</button>
            </div>
            <div class="riffloop-saved-list" id="riffloop-saved-list">
              <!-- Se inyectan dinámicamente -->
            </div>
          </div>
        </div>

        <div class="riffloop-footer">
          <span>Pedal / Mac: <kbd class="riffloop-kbd-shortcut">F13</kbd> o <kbd class="riffloop-kbd-shortcut">⌥L</kbd></span>
          <span>A: <kbd class="riffloop-kbd-shortcut">[</kbd> B: <kbd class="riffloop-kbd-shortcut">]</kbd> Loop: <kbd class="riffloop-kbd-shortcut">\\</kbd></span>
        </div>
      </div>
    `;

    document.body.appendChild(overlayEl);
    attachWidgetEvents();
  }

  // --- Eventos de Interacción del Widget ---
  // --- Eventos de Interacción del Widget ---
  function attachWidgetEvents() {
    // 1. Alternar Modos de Vista
    document.getElementById('riffloop-btn-compact').addEventListener('click', () => setViewMode('intermediate'));
    document.getElementById('riffloop-btn-minimize').addEventListener('click', () => setViewMode('minimized'));
    document.getElementById('riffloop-min-view').addEventListener('click', () => setViewMode(lastActiveViewMode || 'intermediate'));
    document.getElementById('riffloop-btn-close').addEventListener('click', () => {
      overlayEl.style.display = 'none';
    });

    // 2. Vista Intermedia Eventos
    document.getElementById('riffloop-inter-btn-expand').addEventListener('click', () => setViewMode('full'));
    document.getElementById('riffloop-inter-btn-minimize').addEventListener('click', () => setViewMode('minimized'));
    document.getElementById('riffloop-inter-btn-close').addEventListener('click', () => {
      overlayEl.style.display = 'none';
    });
    document.getElementById('riffloop-inter-btn-toggle').addEventListener('click', toggleLoop);

    document.getElementById('riffloop-inter-btn-set-a').addEventListener('click', () => setPointA());
    document.getElementById('riffloop-inter-btn-set-b').addEventListener('click', () => setPointB());
    document.getElementById('riffloop-inter-card-a').addEventListener('click', (e) => {
      if (!e.target.closest('button')) setPointA();
    });
    document.getElementById('riffloop-inter-card-b').addEventListener('click', (e) => {
      if (!e.target.closest('button')) setPointB();
    });

    document.getElementById('riffloop-inter-nudge-a-minus2').addEventListener('click', (e) => { e.stopPropagation(); nudgePoint('A', -0.5); });
    document.getElementById('riffloop-inter-nudge-a-minus1').addEventListener('click', (e) => { e.stopPropagation(); nudgePoint('A', -0.1); });
    document.getElementById('riffloop-inter-nudge-a-plus1').addEventListener('click', (e) => { e.stopPropagation(); nudgePoint('A', 0.1); });
    document.getElementById('riffloop-inter-nudge-a-plus2').addEventListener('click', (e) => { e.stopPropagation(); nudgePoint('A', 0.5); });

    document.getElementById('riffloop-inter-nudge-b-minus2').addEventListener('click', (e) => { e.stopPropagation(); nudgePoint('B', -0.5); });
    document.getElementById('riffloop-inter-nudge-b-minus1').addEventListener('click', (e) => { e.stopPropagation(); nudgePoint('B', -0.1); });
    document.getElementById('riffloop-inter-nudge-b-plus1').addEventListener('click', (e) => { e.stopPropagation(); nudgePoint('B', 0.1); });
    document.getElementById('riffloop-inter-nudge-b-plus2').addEventListener('click', (e) => { e.stopPropagation(); nudgePoint('B', 0.5); });

    document.querySelectorAll('.riffloop-inter-speed-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const speed = parseFloat(e.target.dataset.speed);
        setSpeed(speed);
      });
    });

    const interTrack = document.getElementById('riffloop-inter-track');
    if (interTrack) {
      interTrack.addEventListener('click', (e) => {
        const v = getVideo();
        if (!v || !v.duration) return;
        const rect = interTrack.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        v.currentTime = ratio * v.duration;
      });
    }

    document.getElementById('riffloop-inter-add-section-btn').addEventListener('click', () => {
      if (pointA === null || pointB === null) {
        alert('Fija primero el Punto A y el Punto B para guardar esta sección.');
        return;
      }
      const defaultName = `Sección ${savedLoops.length + 1}`;
      const name = prompt('Nombre para esta sección musical:', defaultName);
      if (name && name.trim()) {
        saveCurrentSection(name.trim());
      }
    });

    // 3. Panel Completo Eventos
    document.getElementById('riffloop-btn-set-a').addEventListener('click', () => setPointA());
    document.getElementById('riffloop-btn-set-b').addEventListener('click', () => setPointB());

    document.getElementById('riffloop-nudge-a-minus2').addEventListener('click', () => nudgePoint('A', -0.5));
    document.getElementById('riffloop-nudge-a-minus1').addEventListener('click', () => nudgePoint('A', -0.1));
    document.getElementById('riffloop-nudge-a-plus1').addEventListener('click', () => nudgePoint('A', 0.1));
    document.getElementById('riffloop-nudge-a-plus2').addEventListener('click', () => nudgePoint('A', 0.5));

    document.getElementById('riffloop-nudge-b-minus2').addEventListener('click', () => nudgePoint('B', -0.5));
    document.getElementById('riffloop-nudge-b-minus1').addEventListener('click', () => nudgePoint('B', -0.1));
    document.getElementById('riffloop-nudge-b-plus1').addEventListener('click', () => nudgePoint('B', 0.1));
    document.getElementById('riffloop-nudge-b-plus2').addEventListener('click', () => nudgePoint('B', 0.5));

    document.getElementById('riffloop-btn-toggle').addEventListener('click', toggleLoop);
    document.getElementById('riffloop-btn-jump-a').addEventListener('click', jumpToA);
    document.getElementById('riffloop-btn-clear').addEventListener('click', clearLoop);

    document.querySelectorAll('.riffloop-speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const speed = parseFloat(e.target.dataset.speed);
        setSpeed(speed);
      });
    });

    const slider = document.getElementById('riffloop-speed-slider');
    slider.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value);
      setSpeed(speed);
    });

    document.getElementById('riffloop-btn-save-section').addEventListener('click', () => {
      const input = document.getElementById('riffloop-section-name');
      if (input.value.trim()) {
        saveCurrentSection(input.value);
        input.value = '';
      }
    });

    // Dragging para ambos encabezados
    makeDraggable(document.getElementById('riffloop-drag-handle'), overlayEl);
    makeDraggable(document.getElementById('riffloop-inter-drag-handle'), overlayEl);
  }

  function setViewMode(mode) {
    if (mode === 'minimized') {
      isMinimized = true;
    } else {
      isMinimized = false;
      currentViewMode = mode;
      lastActiveViewMode = mode;
    }

    // Asegurar que si el widget fue arrastrado no quede recortado fuera de la pantalla
    if (overlayEl && overlayEl.style.left && overlayEl.style.left !== 'auto') {
      const currentLeft = parseFloat(overlayEl.style.left);
      const targetWidth = mode === 'intermediate' ? 640 : (mode === 'full' ? 360 : 200);
      const maxLeft = Math.max(10, window.innerWidth - targetWidth - 20);
      if (currentLeft > maxLeft) {
        overlayEl.style.left = `${maxLeft}px`;
      }
    }

    try {
      chrome.storage.local.set({ riffloop_view_mode: mode });
    } catch (e) {}
    updateUI();
  }

  function updateInterPlayhead(v) {
    const playhead = document.getElementById('riffloop-inter-playhead');
    if (!playhead || !v || !v.duration) return;
    const percent = (v.currentTime / v.duration) * 100;
    playhead.style.left = `${Math.min(100, Math.max(0, percent))}%`;
  }

  function updateInterTrackSpan() {
    const v = getVideo();
    const loopSpan = document.getElementById('riffloop-inter-loop-span');
    if (!loopSpan || !v || !v.duration) return;

    if (pointA !== null && pointB !== null && pointB > pointA) {
      const leftPercent = (pointA / v.duration) * 100;
      const widthPercent = ((pointB - pointA) / v.duration) * 100;
      loopSpan.style.display = 'block';
      loopSpan.style.left = `${Math.min(100, Math.max(0, leftPercent))}%`;
      loopSpan.style.width = `${Math.min(100 - leftPercent, Math.max(0.5, widthPercent))}%`;
    } else {
      loopSpan.style.display = 'none';
    }
  }

  function renderIntermediateSections() {
    const container = document.getElementById('riffloop-inter-sections-list');
    if (!container) return;
    container.innerHTML = '';

    if (savedLoops.length === 0) {
      container.innerHTML = '<span style="font-size:11px; color:rgba(255,255,255,0.35); font-style:italic;">Sin secciones aún</span>';
      return;
    }

    const icons = ['🎸', '⚡', '🥁', '🎹', '🎵', '🔥'];

    savedLoops.forEach((sec, idx) => {
      const pill = document.createElement('button');
      pill.className = 'riffloop-inter-section-pill';
      const icon = icons[idx % icons.length];
      pill.innerHTML = `<span>${icon} ${escapeHtml(sec.name)}</span>`;

      if (pointA !== null && pointB !== null &&
          Math.abs(sec.start - pointA) < 0.1 &&
          Math.abs(sec.end - pointB) < 0.1) {
        pill.classList.add('selected');
      }

      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        loadSection(sec);
      });

      container.appendChild(pill);
    });
  }

  function makeDraggable(handle, target) {
    if (!handle) return;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    handle.addEventListener('mousedown', (e) => {
      if (e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = target.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      target.style.bottom = 'auto';
      target.style.right = 'auto';
      target.style.left = `${initialLeft}px`;
      target.style.top = `${initialTop}px`;

      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const w = target.offsetWidth || (currentViewMode === 'intermediate' ? 640 : 360);
      const h = target.offsetHeight || 200;
      const minX = 10;
      const maxX = Math.max(minX, window.innerWidth - w - 10);
      const minY = 10;
      const maxY = Math.max(minY, window.innerHeight - h - 10);

      target.style.left = `${Math.max(minX, Math.min(maxX, initialLeft + dx))}px`;
      target.style.top = `${Math.max(minY, Math.min(maxY, initialTop + dy))}px`;
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    window.addEventListener('resize', () => {
      if (target.style.left && target.style.left !== 'auto') {
        const curLeft = parseFloat(target.style.left);
        const w = target.offsetWidth || (currentViewMode === 'intermediate' ? 640 : 360);
        const maxL = Math.max(10, window.innerWidth - w - 10);
        if (curLeft > maxL) {
          target.style.left = `${maxL}px`;
        }
      }
    });
  }

  // --- Actualizar Estado Visual del Widget ---
  function updateUI() {
    if (!overlayEl) return;

    const minView = document.getElementById('riffloop-min-view');
    const interView = document.getElementById('riffloop-intermediate-view');
    const fullView = document.getElementById('riffloop-full-view');
    const minLed = document.getElementById('riffloop-min-led');
    const minInfo = document.getElementById('riffloop-min-info');

    // Minimizado vs Intermedio vs Expandido
    if (isMinimized) {
      if (minView) minView.style.display = 'flex';
      if (interView) interView.style.display = 'none';
      if (fullView) fullView.style.display = 'none';

      if (isLooping && pointA !== null && pointB !== null) {
        if (minLed) minLed.classList.add('active');
        if (minInfo) minInfo.textContent = `${formatTime(pointA, 1)} ➔ ${formatTime(pointB, 1)}`;
      } else if (pointA !== null) {
        if (minLed) minLed.classList.remove('active');
        if (minInfo) minInfo.textContent = `A: ${formatTime(pointA, 1)}`;
      } else {
        if (minLed) minLed.classList.remove('active');
        if (minInfo) minInfo.textContent = 'A-B Inactivo';
      }
      return;
    }

    if (currentViewMode === 'intermediate') {
      if (minView) minView.style.display = 'none';
      if (interView) interView.style.display = 'flex';
      if (fullView) fullView.style.display = 'none';
    } else {
      if (minView) minView.style.display = 'none';
      if (interView) interView.style.display = 'none';
      if (fullView) fullView.style.display = 'flex';
    }

    // --- 1. Sincronizar Vista Intermedia ---
    if (interView) {
      const interCardA = document.getElementById('riffloop-inter-card-a');
      const interTimeA = document.getElementById('riffloop-inter-time-a');
      const interBtnSetA = document.getElementById('riffloop-inter-btn-set-a');
      const interNudgesA = document.getElementById('riffloop-inter-nudges-a');

      interTimeA.textContent = formatTime(pointA, 1);
      if (pointA !== null) {
        interCardA.classList.add('has-point');
        interBtnSetA.style.display = 'none';
        interNudgesA.style.display = 'flex';
      } else {
        interCardA.classList.remove('has-point');
        interBtnSetA.style.display = 'inline-block';
        interNudgesA.style.display = 'none';
      }

      const interCardB = document.getElementById('riffloop-inter-card-b');
      const interTimeB = document.getElementById('riffloop-inter-time-b');
      const interBtnSetB = document.getElementById('riffloop-inter-btn-set-b');
      const interNudgesB = document.getElementById('riffloop-inter-nudges-b');

      interTimeB.textContent = formatTime(pointB, 1);
      if (pointB !== null) {
        interCardB.classList.add('has-point');
        interBtnSetB.style.display = 'none';
        interNudgesB.style.display = 'flex';
      } else {
        interCardB.classList.remove('has-point');
        interBtnSetB.style.display = 'inline-block';
        interNudgesB.style.display = 'none';
      }

      const interStatusPill = document.getElementById('riffloop-inter-status-pill');
      const interStatusText = document.getElementById('riffloop-inter-status-text');
      const interBtnToggle = document.getElementById('riffloop-inter-btn-toggle');

      if (isLooping) {
        interStatusPill.classList.add('active');
        interStatusText.textContent = 'BUCLE ACTIVO';
        interBtnToggle.classList.add('active');
        interBtnToggle.textContent = 'Desactivar';
      } else {
        interStatusPill.classList.remove('active');
        interStatusText.textContent = 'BUCLE INACTIVO';
        interBtnToggle.classList.remove('active');
        interBtnToggle.textContent = 'Activar';
      }

      document.querySelectorAll('.riffloop-inter-speed-pill').forEach(btn => {
        const s = parseFloat(btn.dataset.speed);
        if (Math.abs(s - playbackSpeed) < 0.01) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      updateInterTrackSpan();
      const v = getVideo();
      if (v) updateInterPlayhead(v);
      renderIntermediateSections();
    }

    // --- 2. Sincronizar Vista Panel Completo ---
    if (fullView) {
      const cardA = document.getElementById('riffloop-card-a');
      const timeA = document.getElementById('riffloop-time-a');
      timeA.textContent = formatTime(pointA, 2);
      if (pointA !== null) {
        cardA.classList.add('has-point');
      } else {
        cardA.classList.remove('has-point');
      }

      const cardB = document.getElementById('riffloop-card-b');
      const timeB = document.getElementById('riffloop-time-b');
      timeB.textContent = formatTime(pointB, 2);
      if (pointB !== null) {
        cardB.classList.add('has-point');
      } else {
        cardB.classList.remove('has-point');
      }

      const toggleBtn = document.getElementById('riffloop-btn-toggle');
      const toggleIcon = document.getElementById('riffloop-toggle-icon');
      const toggleText = document.getElementById('riffloop-toggle-text');

      if (isLooping) {
        toggleBtn.classList.add('active');
        toggleIcon.textContent = '🔊';
        toggleText.textContent = 'LOOP ACTIVO';
      } else {
        toggleBtn.classList.remove('active');
        toggleIcon.textContent = '🔁';
        toggleText.textContent = (pointA !== null && pointB !== null) ? 'Activar Bucle' : 'Loop Desactivado';
      }

      const speedDisplay = document.getElementById('riffloop-speed-display');
      const speedSlider = document.getElementById('riffloop-speed-slider');
      speedDisplay.textContent = `${playbackSpeed.toFixed(2)}x`;
      speedSlider.value = playbackSpeed;

      document.querySelectorAll('.riffloop-speed-btn').forEach(btn => {
        const s = parseFloat(btn.dataset.speed);
        if (Math.abs(s - playbackSpeed) < 0.01) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    // Lista de secciones guardadas
    const listContainer = document.getElementById('riffloop-saved-list');
    listContainer.innerHTML = '';

    if (savedLoops.length === 0) {
      listContainer.innerHTML = '<span style="font-size:11px; color:rgba(255,255,255,0.4); padding:4px 0;">No hay secciones guardadas aún para este video.</span>';
    } else {
      let dragRecentlyFinished = false;

      savedLoops.forEach((section, index) => {
        const item = document.createElement('div');
        item.className = 'riffloop-saved-item';
        item.draggable = true;
        item.dataset.index = index;

        item.innerHTML = `
          <div class="riffloop-saved-item-left">
            <span class="riffloop-drag-grip" title="Arrastra para reordenar">⋮⋮</span>
            <span class="riffloop-saved-item-title">${escapeHtml(section.name)}</span>
            <span class="riffloop-saved-item-time">${formatTime(section.start)} ➔ ${formatTime(section.end)}</span>
          </div>
          <button class="riffloop-saved-delete-btn" title="Eliminar sección">✕</button>
        `;

        item.addEventListener('dragstart', (e) => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(index));
          setTimeout(() => item.classList.add('is-dragging'), 0);
        });

        item.addEventListener('dragend', () => {
          dragRecentlyFinished = true;
          setTimeout(() => { dragRecentlyFinished = false; }, 150);
          item.classList.remove('is-dragging');
          listContainer.querySelectorAll('.riffloop-saved-item').forEach(el => {
            el.classList.remove('drag-over-top', 'drag-over-bottom');
          });
        });

        item.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          const rect = item.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          if (e.clientY < midY) {
            item.classList.add('drag-over-top');
            item.classList.remove('drag-over-bottom');
          } else {
            item.classList.add('drag-over-bottom');
            item.classList.remove('drag-over-top');
          }
        });

        item.addEventListener('dragleave', () => {
          item.classList.remove('drag-over-top', 'drag-over-bottom');
        });

        item.addEventListener('drop', (e) => {
          e.preventDefault();
          item.classList.remove('drag-over-top', 'drag-over-bottom');
          const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
          if (isNaN(fromIdx) || fromIdx === index) return;

          const rect = item.getBoundingClientRect();
          const isAfter = e.clientY >= (rect.top + rect.height / 2);

          let target = isAfter ? index + 1 : index;
          if (fromIdx < target) {
            target = target - 1;
          }
          const toIdx = Math.max(0, Math.min(savedLoops.length - 1, target));

          reorderSavedSections(fromIdx, toIdx);
        });

        item.addEventListener('click', (e) => {
          if (dragRecentlyFinished) return;
          if (e.target.classList.contains('riffloop-saved-delete-btn')) {
            e.stopPropagation();
            deleteSavedSection(section.id);
          } else if (!e.target.classList.contains('riffloop-drag-grip')) {
            loadSection(section);
          }
        });

        listContainer.appendChild(item);
      });
    }
  }

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // --- Comunicación con Popup de la Extensión ---
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'GET_STATE') {
      sendResponse({
        isAvailable: true,
        pointA,
        pointB,
        isLooping,
        playbackSpeed,
        videoId: currentVideoId,
        savedLoops,
        viewMode: currentViewMode,
        isMinimized
      });
    } else if (message.action === 'SET_VIEW_MODE') {
      setViewMode(message.mode);
      sendResponse({ success: true });
    } else if (message.action === 'SET_POINT_A') {
      setPointA();
      sendResponse({ success: true });
    } else if (message.action === 'SET_POINT_B') {
      setPointB();
      sendResponse({ success: true });
    } else if (message.action === 'TOGGLE_LOOP') {
      toggleLoop();
      sendResponse({ success: true });
    } else if (message.action === 'CLEAR_LOOP') {
      clearLoop();
      sendResponse({ success: true });
    } else if (message.action === 'SET_SPEED') {
      setSpeed(message.speed);
      sendResponse({ success: true });
    } else if (message.action === 'LOAD_SECTION') {
      loadSection(message.section);
      sendResponse({ success: true });
    } else if (message.action === 'TOGGLE_OVERLAY_VISIBILITY') {
      if (overlayEl) {
        overlayEl.style.display = overlayEl.style.display === 'none' ? 'block' : 'none';
      }
      sendResponse({ success: true });
    }
    return true; // Keep message channel open
  });

  // --- Inicialización y Escucha de Navegación SPA de YouTube ---
  async function init() {
    createWidget();
    getVideo();
    loadSavedLoops();
    try {
      const res = await chrome.storage.local.get('riffloop_view_mode');
      if (res && res.riffloop_view_mode) {
        setViewMode(res.riffloop_view_mode);
      } else {
        setViewMode('intermediate');
      }
    } catch (e) {
      setViewMode('intermediate');
    }
  }

  // Si estamos en un video de YouTube
  init();
  setInterval(() => {
    getVideo();
  }, 1000);

  // Cuando YouTube navega a otro video sin recargar la página completa
  window.addEventListener('yt-navigate-finish', () => {
    clearLoop();
    loadSavedLoops();
    if (overlayEl) overlayEl.style.display = 'block';
  });

})();
