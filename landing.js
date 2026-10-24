// ==========================================================================
// loop — Landing Page Interactive Features
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Copy clone command to clipboard
  const copyBtns = document.querySelectorAll('.copy-cmd-btn');
  copyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-clipboard') || 'git clone https://github.com/aincatoni/loop.git';
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = btn.textContent;
        btn.textContent = '¡Copiado! ✓';
        btn.style.borderColor = 'var(--accent-mint)';
        btn.style.color = 'var(--accent-mint)';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.borderColor = '';
          btn.style.color = '';
        }, 2000);
      }).catch(err => {
        console.error('Error al copiar:', err);
      });
    });
  });

  // 2. Interactive Mockup Looper Controls
  const playhead = document.querySelector('.looper-playhead');
  const tempoPills = document.querySelectorAll('.mockup-tempo-pill');
  const statusBadge = document.querySelector('.mockup-status-badge');
  const toggleLoopBtn = document.querySelector('.mockup-toggle-loop');
  let isLoopActive = true;
  let currentSpeed = 0.85;
  const speedSlider = document.querySelector('.mockup-speed-slider');
  const speedValDisplay = document.querySelector('.mockup-speed-val');

  function updateMockupSpeed(speed) {
    currentSpeed = speed;
    if (speedSlider) speedSlider.value = speed;
    if (speedValDisplay) speedValDisplay.textContent = `${speed.toFixed(2)}x`;

    tempoPills.forEach(p => {
      const s = parseFloat(p.getAttribute('data-speed') || '1.0');
      if (Math.abs(s - speed) < 0.01) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });

    if (playhead && isLoopActive) {
      const baseDuration = 4.0;
      const newDuration = (baseDuration / currentSpeed).toFixed(2);
      playhead.style.animationDuration = `${newDuration}s`;
    }
  }

  // Tempo Pill clicks
  tempoPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const speed = parseFloat(pill.getAttribute('data-speed') || '1.0');
      updateMockupSpeed(speed);
    });
  });

  if (speedSlider) {
    speedSlider.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value);
      updateMockupSpeed(speed);
    });
  }

  // Loop Toggle
  if (toggleLoopBtn) {
    toggleLoopBtn.addEventListener('click', () => {
      isLoopActive = !isLoopActive;
      if (isLoopActive) {
        statusBadge.textContent = '● Bucle Activo';
        statusBadge.style.color = 'var(--accent-mint)';
        statusBadge.style.background = 'rgba(5, 223, 158, 0.15)';
        statusBadge.style.borderColor = 'rgba(5, 223, 158, 0.3)';
        toggleLoopBtn.textContent = 'Desactivar';
        if (playhead) {
          playhead.style.animationPlayState = 'running';
        }
      } else {
        statusBadge.textContent = '○ Pausado';
        statusBadge.style.color = 'var(--text-tertiary)';
        statusBadge.style.background = 'rgba(255, 255, 255, 0.05)';
        statusBadge.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        toggleLoopBtn.textContent = 'Activar';
        if (playhead) {
          playhead.style.animationPlayState = 'paused';
        }
      }
    });
  }

  // Micro adjustments in mockup
  const timeADisplay = document.querySelector('.mockup-time-a');
  const timeBDisplay = document.querySelector('.mockup-time-b');

  let timeA = 84.3; // 01:24.3
  let timeB = 98.8; // 01:38.8

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
    const secsStr = (seconds % 60) < 10 ? `0${secs}` : `${secs}`;
    return `${minsStr}:${secsStr}`;
  }

  document.querySelectorAll('.mockup-adj').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      const delta = parseFloat(btn.getAttribute('data-delta') || '0');

      if (target === 'A') {
        timeA = Math.max(0, parseFloat((timeA + delta).toFixed(2)));
        if (timeADisplay) timeADisplay.textContent = formatTime(timeA);
      } else if (target === 'B') {
        timeB = Math.max(timeA + 0.5, parseFloat((timeB + delta).toFixed(2)));
        if (timeBDisplay) timeBDisplay.textContent = formatTime(timeB);
      }
    });
  });

  // Mockup section tabs
  const sectionItems = document.querySelectorAll('.mockup-section-item');
  sectionItems.forEach(item => {
    item.addEventListener('click', () => {
      sectionItems.forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');

      const a = parseFloat(item.getAttribute('data-a'));
      const b = parseFloat(item.getAttribute('data-b'));
      if (a && b) {
        timeA = a;
        timeB = b;
        if (timeADisplay) timeADisplay.textContent = formatTime(timeA);
        if (timeBDisplay) timeBDisplay.textContent = formatTime(timeB);
      }
    });
  });

  // 3. Installation Tabs (Chrome / Safari macOS / Safari iOS)
  const installTabs = document.querySelectorAll('.install-tab-btn');
  const installPanels = document.querySelectorAll('.install-panel');

  function switchInstallTab(tabId) {
    installTabs.forEach(t => {
      if (t.getAttribute('data-tab') === tabId) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    installPanels.forEach(p => {
      if (p.id === `tab-${tabId}`) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
  }

  installTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      if (tabId) switchInstallTab(tabId);
    });
  });

  // Platform chips in Hero also switch tabs and scroll to install section
  const platformChips = document.querySelectorAll('.platform-chip');
  platformChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const target = chip.getAttribute('data-target-tab');
      if (target) {
        switchInstallTab(target);
        const installSec = document.getElementById('install');
        if (installSec) {
          installSec.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
});
