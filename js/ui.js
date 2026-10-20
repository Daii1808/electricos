/**
 * ─────────────────────────────────────────────────────
 *  ui.js — Módulo de renderizado de la interfaz de usuario
 *  Actualiza el DOM con los datos recibidos de api.js
 * ─────────────────────────────────────────────────────
 */

'use strict';

const UIManager = (() => {

  // ─── Utilidades de tiempo ──────────────────────────────────────────────────

  /**
   * Formatea un Date en hora local (HH:MM)
   */
  function formatTime(date) {
    return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Formatea la duración en horas y minutos
   */
  function formatDuration(ms) {
    if (ms <= 0) return '0 min';
    const totalMinutes = Math.floor(ms / 60000);
    const hours   = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes} min`;
  }

  /**
   * Calcula tiempo transcurrido desde una fecha ISO
   */
  function timeAgo(isoString) {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'hace instantes';
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    return `hace ${hours}h ${mins % 60}min`;
  }

  // ─── Íconos por motivo ────────────────────────────────────────────────────

  const REASON_ICONS = {
    VEGETATION: { emoji: '🌿', label: 'Vegetación sobre tendido', color: '#16A34A' },
    COLLISION:  { emoji: '🚗', label: 'Choque de vehículo en poste', color: '#DC2626' },
    EQUIPMENT:  { emoji: '⚙️',  label: 'Falla de equipo',           color: '#7C3AED' },
    STORM:      { emoji: '⛈️',  label: 'Daño por temporal',         color: '#2563EB' },
    UNKNOWN:    { emoji: '⚡',  label: 'Causa en investigación',    color: '#D97706' },
  };

  function getReasonInfo(code) {
    return REASON_ICONS[code] || REASON_ICONS.UNKNOWN;
  }

  // ─── Branding de empresa ──────────────────────────────────────────────────

  /**
   * Aplica el branding de la empresa distribuidora seleccionada.
   * @param {string} companyId — 'saesa' | 'crell'
   */
  function applyCompanyBranding(companyId) {
    const company = CONFIG.COMPANIES[companyId];
    if (!company) return;

    // Variables CSS dinámicas
    document.documentElement.style.setProperty('--color-brand-primary', company.primaryColor);
    document.documentElement.style.setProperty('--color-brand-accent',  company.accentColor);

    // Logo
    const logoText = document.getElementById('company-logo-text');
    const logoIcon = document.getElementById('company-logo-icon');
    const companyFullName = document.getElementById('company-full-name');

    if (logoText) logoText.textContent = company.logoText;
    if (logoIcon) logoIcon.textContent = company.logoIcon;
    if (companyFullName) companyFullName.textContent = company.name;

    // Selector activo
    document.querySelectorAll('.company-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.company === companyId);
    });

    // Guardar selección
    localStorage.setItem('selected-company', companyId);
  }

  // ─── Detalles del corte ───────────────────────────────────────────────────

  /**
   * Renderiza la tarjeta de detalles del corte eléctrico.
   * @param {Object} outage — datos del corte (ver MOCK_DATA.outage en api.js)
   */
  function renderOutageDetails(outage) {
    const reasonInfo = getReasonInfo(outage.reasonCode);

    // Badge de estado superior
    const statusBadge = document.getElementById('status-badge-text');
    const statusDot   = document.getElementById('status-dot');
    if (statusBadge) {
      const statusMap = {
        active:    { text: 'Corte inesperado en curso', cls: 'status--active' },
        resolving: { text: 'Brigada en el lugar', cls: 'status--resolving' },
        restored:  { text: 'Servicio Restablecido ✓', cls: 'status--restored' },
      };
      const s = statusMap[outage.status] || statusMap.active;
      statusBadge.textContent = s.text;
      const badge = document.getElementById('status-badge');
      if (badge) {
        badge.className = `status-badge ${s.cls}`;
      }
    }

    // ID del caso
    const outageId = document.getElementById('outage-id');
    if (outageId) outageId.textContent = outage.id;

    // Ícono y motivo del corte
    const reasonIcon  = document.getElementById('reason-icon');
    const reasonLabel = document.getElementById('reason-label');
    const reasonText  = document.getElementById('reason-text');
    if (reasonIcon)  reasonIcon.textContent = reasonInfo.emoji;
    if (reasonLabel) reasonLabel.textContent = reasonInfo.label;
    if (reasonText)  reasonText.textContent = outage.reason;

    // Hora de reporte
    const reportedEl = document.getElementById('reported-at');
    if (reportedEl) reportedEl.textContent = formatTime(new Date(outage.reportedAt));

    // Zona afectada
    const areaDesc = document.getElementById('affected-area-text');
    if (areaDesc) areaDesc.textContent = outage.affectedArea.description;

    const affectedUsers = document.getElementById('affected-users');
    if (affectedUsers) affectedUsers.textContent = outage.affectedArea.estimatedUsers.toLocaleString('es-CL');

    // Hora estimada de reposición
    const etaEl = document.getElementById('eta-time');
    if (etaEl) etaEl.textContent = formatTime(new Date(outage.estimatedRestoration));

    // Iniciar cuenta regresiva
    startCountdown(new Date(outage.estimatedRestoration));
  }

  // ─── Cuenta regresiva ────────────────────────────────────────────────────

  let _countdownInterval = null;

  function startCountdown(targetDate) {
    if (_countdownInterval) clearInterval(_countdownInterval);

    function update() {
      const remaining = targetDate.getTime() - Date.now();
      const el = document.getElementById('countdown-display');
      if (!el) return;

      if (remaining <= 0) {
        el.textContent = '00:00';
        el.closest('.countdown-wrapper')?.classList.add('countdown--done');
        clearInterval(_countdownInterval);
        return;
      }

      const totalSeconds = Math.floor(remaining / 1000);
      const hours   = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const pad = n => String(n).padStart(2, '0');

      if (hours > 0) {
        el.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
      } else {
        el.textContent = `${pad(minutes)}:${pad(seconds)}`;
      }

      // Urgencia cuando quedan menos de 10 minutos
      el.closest('.countdown-wrapper')?.classList.toggle('countdown--urgent', remaining < 600000);
    }

    update();
    _countdownInterval = setInterval(update, 1000);
  }

  // ─── Información de brigada ───────────────────────────────────────────────

  /**
   * Renderiza la tarjeta de la brigada asignada.
   * @param {Object} brigade — datos de la brigada (ver MOCK_DATA.brigade en api.js)
   */
  function renderBrigadeInfo(brigade) {
    // Avatar con iniciales
    const avatar = document.getElementById('brigade-avatar');
    if (avatar) {
      const initials = brigade.leadName.split(' ')
        .filter((_, i) => i < 2)
        .map(w => w[0])
        .join('');
      avatar.textContent = initials;
      if (brigade.photo) {
        avatar.style.backgroundImage = `url(${brigade.photo})`;
        avatar.textContent = '';
      }
    }

    // Nombre y credenciales
    setText('brigade-name', brigade.leadName);
    setText('brigade-id', brigade.employeeId);
    setText('brigade-code', brigade.id);

    // Estado y ETA de llegada
    const etaMin = Math.max(0, Math.round((new Date(brigade.eta) - Date.now()) / 60000));
    const etaEl  = document.getElementById('brigade-eta');
    if (etaEl) {
      if (etaMin <= 0) {
        etaEl.textContent = 'En el lugar';
        etaEl.classList.add('eta--arrived');
      } else {
        etaEl.textContent = `Llega en ~${etaMin} min`;
      }
    }

    // Estado de la brigada
    const statusEl = document.getElementById('brigade-status-text');
    const statusMap = {
      dispatched: { text: 'Despachado',  cls: 'brigade-status--dispatched' },
      en_route:   { text: 'En ruta',     cls: 'brigade-status--route' },
      on_site:    { text: 'En el lugar', cls: 'brigade-status--onsite' },
      resolved:   { text: 'Completado',  cls: 'brigade-status--done' },
    };
    const st = statusMap[brigade.status] || statusMap.en_route;
    if (statusEl) {
      statusEl.textContent = st.text;
      const badge = document.getElementById('brigade-status-badge');
      if (badge) badge.className = `brigade-status-badge ${st.cls}`;
    }

    // Vehículo
    setText('vehicle-plate', brigade.vehicle.plate);
    setText('vehicle-model', brigade.vehicle.model);
    setText('vehicle-color', brigade.vehicle.color);
    setText('vehicle-year',  brigade.vehicle.year);
  }

  // ─── Botón de actualización ───────────────────────────────────────────────

  let _refreshCooldownTimer = null;

  /**
   * Inicia el cooldown del botón de actualización para evitar spam.
   * @param {number} durationMs — duración del cooldown
   * @param {Function} onRefreshComplete — callback cuando termina el cooldown
   */
  function startRefreshCooldown(durationMs, onRefreshComplete) {
    const btn      = document.getElementById('refresh-btn');
    const btnText  = document.getElementById('refresh-btn-text');
    const progress = document.getElementById('refresh-progress');

    if (!btn) return;

    btn.disabled = true;
    btn.classList.add('btn--loading');

    const start = Date.now();
    const end   = start + durationMs;

    function update() {
      const remaining = end - Date.now();
      if (remaining <= 0) {
        btn.disabled = false;
        btn.classList.remove('btn--loading', 'btn--cooldown');
        if (btnText) btnText.textContent = 'Actualizar estado';
        if (progress) progress.style.width = '0%';
        if (onRefreshComplete) onRefreshComplete();
        return;
      }

      const pct = ((durationMs - remaining) / durationMs) * 100;
      if (progress) progress.style.width = `${pct}%`;

      const secs = Math.ceil(remaining / 1000);
      if (btnText) {
        btn.classList.add('btn--cooldown');
        btn.classList.remove('btn--loading');
        btnText.textContent = `Actualizar (${secs}s)`;
      }

      _refreshCooldownTimer = setTimeout(update, 500);
    }

    update();
  }

  /**
   * Muestra un toast de notificación temporal.
   * @param {string} message
   * @param {'success'|'error'|'info'} type
   */
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span class="toast-text">${message}</span>
    `;

    container.appendChild(toast);
    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('toast--visible'));

    setTimeout(() => {
      toast.classList.remove('toast--visible');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  /**
   * Muestra el skeleton loader en las cards mientras cargan datos.
   */
  function showSkeleton(show = true) {
    document.querySelectorAll('.skeleton').forEach(el => {
      el.classList.toggle('skeleton--active', show);
    });
  }

  // ─── Helper ───────────────────────────────────────────────────────────────

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? '—';
  }

  // ─── API pública ──────────────────────────────────────────────────────────

  return {
    applyCompanyBranding,
    renderOutageDetails,
    renderBrigadeInfo,
    startRefreshCooldown,
    showToast,
    showSkeleton,
  };
})();
