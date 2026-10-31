/**
 * ─────────────────────────────────────────────────────
 *  ui.js — Renderizado de interfaz para Clientes (Modo Claro Suave)
 *  Tarjeta de estado de suministro, tiempos duales (llegada y reposición),
 *  información de cuadrilla y furgoneta técnica.
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

    // 3. Filial y hogares
    const filialTag = document.getElementById('result-filial-tag');
    if (filialTag) {
      filialTag.textContent = `${outage.filial || 'Grupo Saesa'} · ${outage.affectedUsers} hogares sin servicio`;
    }

    // 4. Banner de Furgoneta en Camino / en Terreno
    const vanBanner = document.getElementById('result-van-banner');
    const vanStatusText = document.getElementById('result-van-status-text');
    if (vanBanner && vanStatusText) {
      vanBanner.style.display = 'flex';
      const isOnSite = outage.brigade?.status === 'on_site';
      vanBanner.className = `result-van-eta-banner ${isOnSite ? 'van-on-site' : ''}`;

      if (isOnSite) {
        vanStatusText.textContent = 'Furgoneta en el lugar — Personal técnico trabajando en el punto';
      } else {
        const etaMin = outage.brigade?.etaMinutes || 8;
        vanStatusText.textContent = `Furgoneta en camino — Llegada estimada en ~${etaMin} min al sector`;
      }
    }

    // 5. Bloque ETR (Hora estimada de reposición de luz y duración de faena)
    const etaBlock = document.getElementById('result-eta-block');
    if (etaBlock) etaBlock.style.display = 'flex';

    const etaTime = document.getElementById('result-eta-time');
    if (etaTime) {
      etaTime.textContent = `${formatTime(outage.estimatedRestoration)} hrs`;
    }

    startCountdown(outage.estimatedRestoration, outage.estimatedRepairDuration);

    // 6. Causa del corte
    const reasonText = document.getElementById('result-reason-text');
    if (reasonText) {
      reasonText.textContent = outage.reason || 'Personal técnico investiga causa en la red.';
    }

    // 7. Ficha de Cuadrilla y Furgoneta Asignada (Directamente en la tarjeta)
    const crewBox = document.getElementById('result-crew-box');
    if (crewBox && outage.brigade) {
      crewBox.style.display = 'flex';

      const vanModel = document.getElementById('crew-van-model');
      if (vanModel) {
        vanModel.textContent = `${outage.brigade.vehicle?.model || 'Furgoneta Técnica'} (${outage.brigade.vehicle?.plate || '—'})`;
      }

      const leadName = document.getElementById('crew-lead-name');
      if (leadName) {
        leadName.textContent = outage.brigade.leadName || 'Jefe de Cuadrilla en Terreno';
      }

      const assistantName = document.getElementById('crew-assistant-name');
      if (assistantName) {
        assistantName.textContent = outage.brigade.assistantName || 'Técnico Especialista de Apoyo';
      }
    }

    // 8. Botón de reporte rápido
    const reportBtn = document.getElementById('btn-quick-confirm-outage');
    if (reportBtn) {
      reportBtn.textContent = 'Vivo en este sector y sigo sin luz';
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

    const vanBanner = document.getElementById('result-van-banner');
    if (vanBanner) vanBanner.style.display = 'none';

    const etaBlock = document.getElementById('result-eta-block');
    if (etaBlock) etaBlock.style.display = 'none';

    const crewBox = document.getElementById('result-crew-box');
    if (crewBox) crewBox.style.display = 'none';

    const reasonText = document.getElementById('result-reason-text');
    if (reasonText) {
      reasonText.textContent = `La red eléctrica asociada a "${query}" opera con normalidad. Si te encuentras sin suministro en tu domicilio, puedes ingresar un aviso de inmediato.`;
    }

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

  function startCountdown(estimatedIso, repairDurationText = '') {
    if (_countdownTimer) clearInterval(_countdownTimer);

    const countdownBadge = document.getElementById('result-eta-countdown');
    if (!countdownBadge || !estimatedIso) return;

    const targetTime = new Date(estimatedIso).getTime();

    function update() {
      const diff = targetTime - Date.now();
      const repairInfo = repairDurationText ? ` (Trabajo estimado: ${repairDurationText})` : '';
      countdownBadge.textContent = `Luz estimada en ${formatRemaining(diff)}${repairInfo}`;
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
    toast.innerHTML = `<span style="font-weight:700;">${icons[type] || '•'}</span> <span>${message}</span>`;

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
