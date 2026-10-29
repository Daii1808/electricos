/**
 * ─────────────────────────────────────────────────────
 *  ui.js — Renderizado de interfaz para el Cliente (DESIGN.md)
 *  Tarjeta de estado de suministro, cuenta regresiva ETR,
 *  modal "Estoy sin luz" y notificaciones.
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
    if (hours > 0) return `~${hours} hora${hours > 1 ? 's' : ''} ${minutes} min`;
    return `~${minutes} minutos`;
  }

  // ─── Renderizado de Ficha de Suministro para el Cliente ────────────────────

  function renderOutageDetails(outage) {
    if (!outage) return;

    const card = document.getElementById('client-result-card');
    if (card) card.classList.remove('hidden');

    // 1. Badge de Estado
    const badge = document.getElementById('result-status-badge');
    if (badge) {
      const isEmergency = outage.type === 'no_programada';
      badge.className = `result-status-badge ${isEmergency ? 'badge--outage' : 'badge--scheduled'}`;
      badge.textContent = isEmergency ? 'Interrupción no programada' : 'Mantenimiento programado';
    }

    // 2. Título de Sector y Comuna
    const title = document.getElementById('result-sector-title');
    if (title) {
      title.textContent = `${outage.comuna} — ${outage.sector}`;
    }

    // 3. Filial
    const filialTag = document.getElementById('result-filial-tag');
    if (filialTag) {
      filialTag.textContent = outage.filial || 'Grupo Saesa';
    }

    // 4. Bloque ETR (Hora estimada y cuenta regresiva)
    const etaBlock = document.getElementById('result-eta-block');
    if (etaBlock) etaBlock.style.display = 'flex';

    const etaTime = document.getElementById('result-eta-time');
    if (etaTime) {
      etaTime.textContent = `${formatTime(outage.estimatedRestoration)} hrs`;
    }

    startCountdown(outage.estimatedRestoration);

    // 5. Causa del corte en lenguaje claro
    const reasonText = document.getElementById('result-reason-text');
    if (reasonText) {
      reasonText.textContent = outage.reason || 'Personal técnico investiga causa en la red.';
    }

    // 6. Estado de la Cuadrilla y Clientes Afectados
    const crewStatus = document.getElementById('result-crew-status');
    if (crewStatus) crewStatus.style.display = 'flex';

    const crewText = document.getElementById('result-crew-text');
    if (crewText) {
      crewText.textContent = outage.brigade?.statusText || 'Cuadrilla técnica en terreno';
    }

    const affectedClients = document.getElementById('result-affected-clients');
    if (affectedClients) {
      affectedClients.textContent = `${outage.affectedUsers} hogares involucrados`;
    }

    // 7. Botón de reporte rápido
    const reportBtn = document.getElementById('btn-quick-confirm-outage');
    if (reportBtn) {
      reportBtn.textContent = 'Sigo sin suministro en esta zona';
      reportBtn.dataset.comuna = outage.comuna;
    }
  }

  // ─── Renderizado cuando el cliente consulta y NO registra corte ───────────

  function renderNormalService(query) {
    const card = document.getElementById('client-result-card');
    if (card) card.classList.remove('hidden');

    const badge = document.getElementById('result-status-badge');
    if (badge) {
      badge.className = 'result-status-badge badge--normal';
      badge.textContent = 'Suministro Normal';
    }

    const title = document.getElementById('result-sector-title');
    if (title) {
      title.textContent = 'Sin Cortes Activos';
    }

    const filialTag = document.getElementById('result-filial-tag');
    if (filialTag) {
      filialTag.textContent = 'Grupo Saesa';
    }

    const etaBlock = document.getElementById('result-eta-block');
    if (etaBlock) etaBlock.style.display = 'none';

    const reasonText = document.getElementById('result-reason-text');
    if (reasonText) {
      reasonText.textContent = `La red eléctrica asociada a "${query}" opera con normalidad. Si te encuentras sin suministro en tu domicilio, puedes ingresar un aviso directo.`;
    }

    const crewStatus = document.getElementById('result-crew-status');
    if (crewStatus) crewStatus.style.display = 'none';

    const reportBtn = document.getElementById('btn-quick-confirm-outage');
    if (reportBtn) {
      reportBtn.textContent = 'Estoy sin luz y quiero reportar';
      reportBtn.dataset.comuna = '';
    }
  }

  function hideResultCard() {
    const card = document.getElementById('client-result-card');
    if (card) card.classList.add('hidden');
    if (_countdownTimer) clearInterval(_countdownTimer);
  }

  // ─── Cuenta Regresiva ──────────────────────────────────────────────────────

  function startCountdown(estimatedIso) {
    if (_countdownTimer) clearInterval(_countdownTimer);

    const countdownBadge = document.getElementById('result-eta-countdown');
    if (!countdownBadge || !estimatedIso) return;

    const targetTime = new Date(estimatedIso).getTime();

    function update() {
      const diff = targetTime - Date.now();
      countdownBadge.textContent = `En ${formatRemaining(diff)}`;
    }

    update();
    _countdownTimer = setInterval(update, 1000);
  }

  // ─── Compatibilidad / Fallbacks ───────────────────────────────────────────

  function renderOutagesList() {}
  function updateKPIs() {}
  function applyCompanyBranding() {}

  // ─── Notificaciones Toast ─────────────────────────────────────────────────

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;

    const icons = { success: '✓', error: '!', info: 'ℹ' };
    toast.innerHTML = `<span style="font-weight:600;">${icons[type] || '•'}</span> <span>${message}</span>`;

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
    renderNormalService,
    hideResultCard,
    showToast,
    renderOutagesList,
    updateKPIs,
    applyCompanyBranding,
  };
})();

if (typeof window !== 'undefined') {
  window.UIManager = UIManager;
}

export { UIManager };
