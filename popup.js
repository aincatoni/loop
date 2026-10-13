/* ==========================================================================
   RiffLoop — Popup Script
   Comunica con el content script de la pestaña activa de YouTube.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const statusContainer = document.getElementById('status-container');
  const statusText = document.getElementById('status-text');
  const quickControls = document.getElementById('quick-controls');
  const timeA = document.getElementById('popup-time-a');
  const timeB = document.getElementById('popup-time-b');
  const btnToggleLoop = document.getElementById('btn-toggle-loop');

  function formatTime(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return '--:--.--';
    const totalSecs = Math.max(0, seconds);
    const m = Math.floor(totalSecs / 60);
    const s = Math.floor(totalSecs % 60);
    const ms = Math.floor((totalSecs % 1) * 100);
    const pad = (num, digits = 2) => String(num).padStart(digits, '0');
    return `${pad(m)}:${pad(s)}.${pad(ms)}`;
  }

  async function getActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab;
    } catch (err) {
      console.error('Error al consultar pestaña activa:', err);
      return null;
    }
  }

  async function sendTabMessage(message) {
    const tab = await getActiveTab();
    if (!tab || !tab.id) return null;
    try {
      return await chrome.tabs.sendMessage(tab.id, message);
    } catch (err) {
      return null;
    }
  }

  async function refreshState() {
    const tab = await getActiveTab();
    const res = await sendTabMessage({ action: 'GET_STATE' });

    if (res && res.isAvailable) {
      statusContainer.className = 'status-banner status-active';
      statusText.textContent = '● Video conectado y listo para loopear';
      quickControls.style.display = 'block';

      timeA.textContent = formatTime(res.pointA);
      timeB.textContent = formatTime(res.pointB);

      if (res.isLooping) {
        btnToggleLoop.classList.add('active');
        btnToggleLoop.textContent = '🔊 Activo';
      } else {
        btnToggleLoop.classList.remove('active');
        btnToggleLoop.textContent = '🔁 Bucle';
      }
    } else {
      const isYouTube = tab && tab.url && tab.url.includes('youtube.com');
      statusContainer.className = 'status-banner status-inactive';
      if (isYouTube) {
        statusText.textContent = 'Recarga la pestaña del video (Cmd + R)';
      } else {
        statusText.textContent = 'Abre un video de YouTube para practicar';
      }
      quickControls.style.display = 'none';
    }
  }

  // --- Enlazar Botones ---
  document.getElementById('btn-set-a').addEventListener('click', async () => {
    await sendTabMessage({ action: 'SET_POINT_A' });
    await refreshState();
  });

  document.getElementById('btn-set-b').addEventListener('click', async () => {
    await sendTabMessage({ action: 'SET_POINT_B' });
    await refreshState();
  });

  document.getElementById('btn-toggle-loop').addEventListener('click', async () => {
    await sendTabMessage({ action: 'TOGGLE_LOOP' });
    await refreshState();
  });

  document.getElementById('btn-clear').addEventListener('click', async () => {
    await sendTabMessage({ action: 'CLEAR_LOOP' });
    await refreshState();
  });

  document.getElementById('btn-toggle-widget').addEventListener('click', async () => {
    await sendTabMessage({ action: 'TOGGLE_OVERLAY_VISIBILITY' });
  });

  const btnSwitchMode = document.getElementById('btn-switch-mode');
  if (btnSwitchMode) {
    btnSwitchMode.addEventListener('click', async () => {
      const res = await sendTabMessage({ action: 'GET_STATE' });
      if (res) {
        const nextMode = res.viewMode === 'intermediate' ? 'full' : 'intermediate';
        await sendTabMessage({ action: 'SET_VIEW_MODE', mode: nextMode });
        await refreshState();
      }
    });
  }

  await refreshState();
});
