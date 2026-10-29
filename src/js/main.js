/**
 * ─────────────────────────────────────────────────────
 *  main.js — Orquestador de la aplicación para Clientes
 *  Conecta el mapa, la API, los filtros, búsqueda por cliente/comuna
 *  y reporte rápido de interrupciones ("Estoy sin luz").
 * ─────────────────────────────────────────────────────
 */

'use strict';

import './config.js';
import './api.js';
import './theme.js';
import './map.js';
import './ui.js';

const App = (() => {

  let _currentFilter = {
    type: 'all',       // 'all' | 'no_programada' | 'programada'
    company: 'saesa',  // 'all' | 'saesa' | 'crell'
    comuna: 'all',
  };

  let _activeOutages = [];
  let _vehicleTimer = null;

  async function init() {
    // 1. Inicializar tema
    if (typeof ThemeManager !== 'undefined') ThemeManager.init();

    // 2. Inicializar mapa con callback de selección
    MapManager.init((outageId) => {
      selectOutage(outageId);
    });

    // Permitir callback global para popups de Leaflet
    window.selectOutageFromMap = (id) => selectOutage(id);

    // 3. Cargar datos iniciales
    await reloadOutages(true);

    // 4. Iniciar telemetría suave del móvil
    startVehicleTelemetry();

    // 5. Registrar eventos de UI para clientes
    registerEventListeners();
  }

  // ─── Carga y filtrado de cortes ───────────────────────────────────────────

  async function reloadOutages(isFirstLoad = false) {
    try {
      _activeOutages = await API.getAllOutages(_currentFilter);

      const currentSelectedId = API.getCurrentOutageId();
      let activeOutage = _activeOutages.find(o => o.id === currentSelectedId);
      if (!activeOutage && _activeOutages.length > 0) {
        activeOutage = _activeOutages[0];
        API.setCurrentOutageId(activeOutage.id);
      }

      // Renderizar mapa
      MapManager.renderOutages(_activeOutages, activeOutage ? activeOutage.id : null);

      if (isFirstLoad && activeOutage) {
        MapManager.focusOnOutage(activeOutage);
        UIManager.renderOutageDetails(activeOutage);
      } else if (activeOutage) {
        UIManager.renderOutageDetails(activeOutage);
      } else {
        UIManager.hideResultCard();
      }

    } catch (err) {
      console.error('[App] Error cargando cortes:', err);
      UIManager.showToast('Error cargando información de la red eléctrica.', 'error');
    }
  }

  // ─── Selección de un corte ─────────────────────────────────────────────────

  async function selectOutage(outageId) {
    API.setCurrentOutageId(outageId);
    const outage = await API.getOutageDetails(outageId);
    if (!outage) return;

    // Actualizar ficha de resultado para el cliente
    UIManager.renderOutageDetails(outage);

    // Actualizar capas en el mapa y enfocar suavemente
    MapManager.renderOutages(_activeOutages, outage.id);
    MapManager.focusOnOutage(outage);
  }

  // ─── Telemetría periódica del móvil en terreno ─────────────────────────────

  function startVehicleTelemetry() {
    if (_vehicleTimer) clearInterval(_vehicleTimer);

    _vehicleTimer = setInterval(async () => {
      try {
        const currentId = API.getCurrentOutageId();
        const outage = await API.getOutageDetails(currentId);
        if (outage && outage.brigade) {
          const loc = await API.getVehicleLocation(currentId);
          outage.brigade.location = loc;
          MapManager.renderBrigadeVehicle(outage.brigade, outage.center);
        }
      } catch (err) {
        console.warn('[App] Telemetría temporalmente pausada:', err);
      }
    }, CONFIG.VEHICLE_POLL_INTERVAL_MS);
  }

  // ─── Eventos de Interfaz ───────────────────────────────────────────────────

  function registerEventListeners() {

    // 1. Filtros Rápidos de Tipo (Todos / Emergencias / Programados)
    document.querySelectorAll('.client-pill-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        document.querySelectorAll('.client-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _currentFilter.type = btn.dataset.filterType;
        await reloadOutages();
      });
    });

    // 2. Filtro por Ciudad / Comuna
    const comunaSelect = document.getElementById('comuna-filter-select');
    if (comunaSelect) {
      comunaSelect.addEventListener('change', async (e) => {
        _currentFilter.comuna = e.target.value;
        await reloadOutages();
      });
    }

    // 3. Búsqueda por N° de Cliente o Comuna
    const searchBtn = document.getElementById('search-service-btn');
    const searchInput = document.getElementById('search-service-input');

    async function executeSearch() {
      const query = (searchInput?.value || '').trim();
      if (!query) {
        UIManager.showToast('Ingresa tu N° de cliente o comuna para consultar', 'info');
        return;
      }

      const result = await API.searchByClientOrComuna(query);
      if (result) {
        const targetOutage = result.outage || result.primary;
        if (targetOutage) {
          await selectOutage(targetOutage.id);
          UIManager.showToast(`Corte detectado en ${targetOutage.comuna} (${targetOutage.sector})`, 'error');
        }
      } else {
        UIManager.renderNormalService(query);
        UIManager.showToast(`Servicio operando con normalidad para "${query}".`, 'success');
      }
    }

    if (searchBtn) searchBtn.addEventListener('click', executeSearch);
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') executeSearch();
      });
    }

    // 4. Botón "Mi Ubicación" (Geolocalización GPS)
    const locateBtn = document.getElementById('locate-user-btn');
    if (locateBtn) {
      locateBtn.addEventListener('click', async () => {
        UIManager.showToast('Detectando coordenadas de tu ubicación GPS...', 'info');
        const assessment = await MapManager.locateUser(_activeOutages);

        if (assessment.success) {
          if (assessment.inAffectedZone) {
            UIManager.showToast(`Tu ubicación está en el área de corte de ${assessment.outage.comuna}`, 'error');
            await selectOutage(assessment.outage.id);
          } else {
            UIManager.renderNormalService('tu ubicación GPS');
            UIManager.showToast('Tu sector se encuentra con suministro eléctrico normal.', 'success');
          }
        }
      });
    }

    // 5. Cerrar Ficha de Resultado
    const closeResultBtn = document.getElementById('close-result-card-btn');
    if (closeResultBtn) {
      closeResultBtn.addEventListener('click', () => {
        UIManager.hideResultCard();
      });
    }

    // 6. Botón de Confirmación Rápida ("Sigo sin luz")
    const confirmReportBtn = document.getElementById('btn-quick-confirm-outage');
    if (confirmReportBtn) {
      confirmReportBtn.addEventListener('click', () => {
        const modalComuna = document.getElementById('report-comuna');
        if (modalComuna && confirmReportBtn.dataset.comuna) {
          modalComuna.value = confirmReportBtn.dataset.comuna;
        }
        openModal();
      });
    }

    // 7. Modal de Reporte ("Estoy sin Luz")
    const openReportBtn = document.getElementById('open-report-modal-btn');
    const modalOverlay = document.getElementById('report-modal');
    const closeReportBtn = document.getElementById('close-report-modal-btn');
    const cancelReportBtn = document.getElementById('cancel-report-btn');
    const reportForm = document.getElementById('report-outage-form');

    function openModal() {
      if (modalOverlay) modalOverlay.classList.add('active');
    }
    function closeModal() {
      if (modalOverlay) modalOverlay.classList.remove('active');
    }

    if (openReportBtn) openReportBtn.addEventListener('click', openModal);
    if (closeReportBtn) closeReportBtn.addEventListener('click', closeModal);
    if (cancelReportBtn) cancelReportBtn.addEventListener('click', closeModal);

    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
      });
    }

    // Envío del reporte ciudadano
    if (reportForm) {
      reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const clientNumber = document.getElementById('report-client-number')?.value;
        const comuna = document.getElementById('report-comuna')?.value;
        const address = document.getElementById('report-address')?.value;
        const reason = document.getElementById('report-reason')?.value;

        UIManager.showToast('Registrando reporte en el centro de despacho...', 'info');

        const newOutage = await API.reportOutage({
          clientNumber,
          comuna,
          address,
          reason,
        });

        closeModal();
        reportForm.reset();

        await reloadOutages();
        await selectOutage(newOutage.id);

        UIManager.showToast(`Aviso ingresado con éxito. Cuadrilla alertada.`, 'success');
      });
    }
  }

  return {
    init,
    selectOutage,
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

if (typeof window !== 'undefined') {
  window.App = App;
}

export { App };
