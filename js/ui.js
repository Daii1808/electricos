/**
 * ─────────────────────────────────────────────────────
 *  ui.js — Renderizado de interfaz según tokens DESIGN.md
 *  Gestión de fichas de corte, cuenta regresiva, listado,
 *  modal de reporte, geolocalización y notificaciones.
 * ─────────────────────────────────────────────────────
 */

'use strict';

const UIManager = (() => {

  let _countdownTimer = null;

  // ─── Utilidades de Tiempo ──────────────────────────────────────────────────

  function formatTime(isoString) {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  }

  function formatRemaining(ms) {
    if (ms <= 0) return 'Reposición en curso';
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} min`;
  }

  // ─── Renderizado de Ficha del Corte Seleccionado ────────────────────────────

  function renderOutageDetails(outage) {
    if (!outage) return;

    // Badge y tipo
    const typeTag = document.getElementById('outage-type-tag');
    if (typeTag) {
      const isEmergency = outage.type === 'no_programada';
      typeTag.className = `badge-tag ${isEmergency ? 'tag--emergency' : 'tag--scheduled'}`;
      typeTag.textContent = isEmergency ? 'Emergencia / No programada' : 'Mantenimiento programado';
    }

    // ID del ticket
    const ticketId = document.getElementById('outage-ticket-id');
    if (ticketId) ticketId.textContent = outage.id;

    // Titular (Comuna y Sector)
    const title = document.getElementById('outage-title');
    if (title) title.textContent = `${outage.comuna} — ${outage.sector}`;

    // Motivo del corte
    const reasonText = document.getElementById('outage-reason');
    if (reasonText) reasonText.textContent = outage.reason;

    const reasonIcon = document.getElementById('outage-reason-icon');
    if (reasonIcon) {
      const icons = {
        VEGETATION: '🌿',
        COLLISION: '🚗',
        EQUIPMENT: '⚙️',
        MAINTENANCE: '🛠️',
        UNKNOWN: '⚡',
      };
      reasonIcon.textContent = icons[outage.reasonCode] || '⚡';
    }

    // Meta datos
    const metaComuna = document.getElementById('meta-comuna');
    if (metaComuna) metaComuna.textContent = outage.comuna;

    const metaFilial = document.getElementById('meta-filial');
    if (metaFilial) metaFilial.textContent = outage.filial || 'Saesa';

    const metaReported = document.getElementById('meta-reported');
    if (metaReported) metaReported.textContent = formatTime(outage.reportedAt);

    const metaUsers = document.getElementById('meta-affected-users');
    if (metaUsers) metaUsers.textContent = `${outage.affectedUsers} clientes`;

    // Iniciar cuenta regresiva para este corte
    startCountdown(outage.estimatedRestoration);

    // Renderizar sección de brigada
    renderBrigade(outage.brigade);
  }

  // ─── Cuenta Regresiva ──────────────────────────────────────────────────────

  function startCountdown(estimatedIso) {
    if (_countdownTimer) clearInterval(_countdownTimer);

    const display = document.getElementById('countdown-display');
    const subtext = document.getElementById('countdown-eta-time');
    if (!display || !estimatedIso) return;

    const targetTime = new Date(estimatedIso).getTime();

    function update() {
      const diff = targetTime - Date.now();
      display.textContent = formatRemaining(diff);
      if (subtext) {
        subtext.textContent = `Hora estimada: ${formatTime(estimatedIso)} hrs`;
      }
    }

    update();
    _countdownTimer = setInterval(update, 1000);
  }

  // ─── Renderizado de Ficha de Brigada ───────────────────────────────────────

  function renderBrigade(brigade) {
    if (!brigade) return;

    const name = document.getElementById('brigade-lead-name');
    if (name) name.textContent = brigade.leadName;

    const empId = document.getElementById('brigade-employee-id');
    if (empId) empId.textContent = `ID: ${brigade.employeeId}`;

    const statusChip = document.getElementById('brigade-status-chip');
    if (statusChip) statusChip.textContent = brigade.statusText;

    const vehiclePlate = document.getElementById('brigade-vehicle-plate');
    if (vehiclePlate) vehiclePlate.textContent = brigade.vehicle?.plate || '—';

    const vehicleModel = document.getElementById('brigade-vehicle-model');
    if (vehicleModel) vehicleModel.textContent = `${brigade.vehicle?.model} (${brigade.vehicle?.color})`;

    const avatar = document.getElementById('brigade-avatar');
    if (avatar) {
      const initials = brigade.leadName
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('');
      avatar.textContent = initials;
    }
  }

  // ─── Renderizado de Lista de Desconexiones (Pestaña 2) ────────────────────

  function renderOutagesList(outages, selectedId, onSelectCallback) {
    const listContainer = document.getElementById('outages-list-container');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    outages.forEach(outage => {
      const isSelected = outage.id === selectedId;
      const isEmergency = outage.type === 'no_programada';

      const card = document.createElement('div');
      card.className = `outage-list-card ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="card-top-row">
          <span class="badge-tag ${isEmergency ? 'tag--emergency' : 'tag--scheduled'}">
            ${isEmergency ? 'EMERGENCIA' : 'PROGRAMADO'}
          </span>
          <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-muted);">${outage.id}</span>
        </div>
        <div class="card-location">${outage.comuna} — ${outage.sector}</div>
        <div class="card-bottom-row">
          <span><strong>${outage.affectedUsers}</strong> clientes afectados</span>
          <span>ETA ~${formatTime(outage.estimatedRestoration)}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        if (onSelectCallback) onSelectCallback(outage.id);
      });

      listContainer.appendChild(card);
    });

    // Actualizar contador en pestaña
    const countBadge = document.getElementById('outages-count-tab');
    if (countBadge) countBadge.textContent = `(${outages.length})`;
  }

  // ─── KPIs de Red Eléctrica ─────────────────────────────────────────────────

  function updateKPIs(stats) {
    const elOp = document.getElementById('kpi-operational');
    if (elOp) elOp.textContent = `${stats.operationalPercentage}%`;

    const elOutages = document.getElementById('kpi-outages');
    if (elOutages) elOutages.textContent = stats.totalActiveOutages;

    const elClients = document.getElementById('kpi-clients');
    if (elClients) elClients.textContent = stats.totalAffectedClients.toLocaleString('es-CL');

    const elBrigades = document.getElementById('kpi-brigades');
    if (elBrigades) elBrigades.textContent = stats.activeBrigades;
  }

  // ─── Branding de Empresa / Filial ──────────────────────────────────────────

  function applyCompanyBranding(companyId) {
    const company = CONFIG.COMPANIES[companyId];
    if (!company) return;

    const logoText = document.getElementById('company-logo-text');
    const logoIcon = document.getElementById('company-logo-icon');
    const companyFullName = document.getElementById('company-full-name');

    if (logoText) logoText.textContent = company.shortName;
    if (logoIcon) logoIcon.textContent = company.logoIcon;
    if (companyFullName) companyFullName.textContent = company.name;

    // Actualizar botones de selector
    document.querySelectorAll('.company-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.company === companyId);
    });
  }

  // ─── Notificaciones Toast ─────────────────────────────────────────────────

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;

    const icons = { success: '✓', error: '✕', info: '⚡' };
    toast.innerHTML = `<span>${icons[type] || '•'}</span> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 150ms ease';
      setTimeout(() => toast.remove(), 160);
    }, 4000);
  }

  return {
    renderOutageDetails,
    renderOutagesList,
    updateKPIs,
    applyCompanyBranding,
    showToast,
  };
})();
