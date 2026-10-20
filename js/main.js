/**
 * ─────────────────────────────────────────────────────
 *  main.js — Orquestador de la aplicación
 *  Conecta el mapa, la API, los filtros, búsqueda y geolocalización
 * ─────────────────────────────────────────────────────
 */

'use strict';

const App = (() => {

  let _currentFilter = {
    type: 'all',       // 'all' | 'no_programada' | 'programada'
    company: 'saesa',  // 'all' | 'saesa' | 'crell'
    comuna: 'all',
  };

  let _activeOutages = [];
  let _vehicleTimer = null;

  async function init() {
    // 1. Inicializar tema y branding
    if (typeof ThemeManager !== 'undefined') ThemeManager.init();
    UIManager.applyCompanyBranding(CONFIG.DEFAULT_COMPANY);
    UIManager.updateKPIs(CONFIG.NETWORK_STATS);

    // 2. Inicializar mapa con callback de selección
    MapManager.init((outageId) => {
      selectOutage(outageId);
    });

    // Permitir callback global para popups de Leaflet
    window.selectOutageFromMap = (id) => selectOutage(id);

    // 3. Cargar datos iniciales
    await reloadOutages(true);

    // 4. Iniciar telemetría de vehículo
    startVehicleTelemetry();

    // 5. Registrar eventos de UI
    registerEventListeners();
  }

  // ─── Carga y filtrado de cortes ───────────────────────────────────────────

  async function reloadOutages(isFirstLoad = false) {
    try {
      _activeOutages = await API.getAllOutages(_currentFilter);

      const currentSelectedId = API.getCurrentOutageId();
      // Si el corte seleccionado ya no está en el filtro, tomar el primero disponible
      let activeOutage = _activeOutages.find(o => o.id === currentSelectedId);
      if (!activeOutage && _activeOutages.length > 0) {
        activeOutage = _activeOutages[0];
        API.setCurrentOutageId(activeOutage.id);
      }

      // Renderizar mapa
      MapManager.renderOutages(_activeOutages, activeOutage ? activeOutage.id : null);

      if (isFirstLoad && activeOutage) {
        MapManager.focusOnOutage(activeOutage);
      }

      // Renderizar ficha de corte y listado
      if (activeOutage) {
        UIManager.renderOutageDetails(activeOutage);
      }

      UIManager.renderOutagesList(_activeOutages, activeOutage ? activeOutage.id : null, (id) => {
        selectOutage(id);
      });

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

    // Actualizar inspector
    UIManager.renderOutageDetails(outage);

    // Actualizar capas en el mapa y enfocar
    MapManager.renderOutages(_activeOutages, outage.id);
    MapManager.focusOnOutage(outage);

    // Actualizar selección en listado
    UIManager.renderOutagesList(_activeOutages, outage.id, (id) => selectOutage(id));

    // Si estaba en pestaña de listado en mobile, cambiar a detalles
    switchTab('tab-details');
  }

  // ─── Telemetría periódica del móvil ───────────────────────────────────────

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

    // 1. Selector de Empresa / Filial
    document.querySelectorAll('.company-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const companyId = btn.dataset.company;
        _currentFilter.company = companyId;
        UIManager.applyCompanyBranding(companyId);
        await reloadOutages();
        UIManager.showToast(`Visualizando red de ${CONFIG.COMPANIES[companyId]?.name}`, 'info');
      });
    });

    // 2. Filtros de Tipo (Todas / Emergencia / Programadas)
    document.querySelectorAll('.filter-pill-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        document.querySelectorAll('.filter-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _currentFilter.type = btn.dataset.filterType;
        await reloadOutages();
      });
    });

    // 3. Filtro por Comuna
    const comunaSelect = document.getElementById('comuna-filter-select');
    if (comunaSelect) {
      comunaSelect.addEventListener('change', async (e) => {
        _currentFilter.comuna = e.target.value;
        await reloadOutages();
      });
    }

    // 4. Búsqueda por N° de Cliente o Comuna
    const searchBtn = document.getElementById('search-service-btn');
    const searchInput = document.getElementById('search-service-input');

    async function executeSearch() {
      const query = (searchInput?.value || '').trim();
      if (!query) {
        UIManager.showToast('Ingresa un N° de cliente o comuna para consultar', 'info');
        return;
      }

      const result = await API.searchByClientOrComuna(query);
      if (result) {
        const targetOutage = result.outage || result.primary;
        if (targetOutage) {
          await selectOutage(targetOutage.id);
          UIManager.showToast(`Corte detectado en ${targetOutage.comuna} (#${targetOutage.id})`, 'info');
        }
      } else {
        UIManager.showToast(`No se registran cortes asociados a "${query}". Servicio operando normal.`, 'success');
      }
    }

    if (searchBtn) searchBtn.addEventListener('click', executeSearch);
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') executeSearch();
      });
    }

    // 5. Geolocalización "Mi Ubicación"
    const locateBtn = document.getElementById('locate-user-btn');
    if (locateBtn) {
      locateBtn.addEventListener('click', async () => {
        UIManager.showToast('Detectando coordenadas de tu ubicación GPS...', 'info');
        const assessment = await MapManager.locateUser(_activeOutages);

        if (assessment.success) {
          if (assessment.inAffectedZone) {
            UIManager.showToast(`⚠️ Tu ubicación está dentro del área de corte #${assessment.outage.id}`, 'error');
            await selectOutage(assessment.outage.id);
          } else {
            UIManager.showToast('✓ Tu ubicación se encuentra fuera de sectores con corte activo.', 'success');
          }
        }
      });
    }

    // 6. Tabs de Panel Lateral
    document.querySelectorAll('.panel-tab-btn').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        const targetId = tabBtn.dataset.tabTarget;
        switchTab(targetId);
      });
    });

    // 7. Modal de Reportar Corte ("Estoy sin Luz")
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

    // Envío del reporte
    if (reportForm) {
      reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const clientNumber = document.getElementById('report-client-number')?.value;
        const comuna = document.getElementById('report-comuna')?.value;
        const address = document.getElementById('report-address')?.value;
        const reason = document.getElementById('report-reason')?.value;

        UIManager.showToast('Ingresando reporte a despacho de emergencias...', 'info');

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

        UIManager.showToast(`Reporte creado exitosamente. Ticket #${newOutage.id}`, 'success');
      });
    }

    // 8. Toggle de Tema
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn && typeof ThemeManager !== 'undefined') {
      themeBtn.addEventListener('click', () => {
        ThemeManager.toggle();
      });
    }

    // 9. Botón Refrescar
    const refreshBtn = document.getElementById('refresh-state-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        UIManager.showToast('Sincronizando estado con centro de despacho...', 'info');
        await reloadOutages();
        UIManager.showToast('Datos de red eléctrica actualizados.', 'success');
      });
    }
  }

  function switchTab(tabId) {
    document.querySelectorAll('.panel-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tabTarget === tabId);
    });
    document.querySelectorAll('.panel-content-tab').forEach(tab => {
      tab.classList.toggle('active', tab.id === tabId);
    });
  }

  return {
    init,
    selectOutage,
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
