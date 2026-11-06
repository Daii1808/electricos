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
  let _selectedOutageId = null;
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

      if (isFirstLoad) {
        _selectedOutageId = null;
        API.setCurrentOutageId(null);
        // En la carga inicial: NO abrir ninguna tarjeta de forma intrusiva
        MapManager.renderOutages(_activeOutages, null);
        UIManager.hideResultCard();

        const map = MapManager.getMap();
        if (map) {
          map.setView([-41.4720, -72.9350], 13); // Enfoque principal en Puerto Montt
        }
        return;
      }

      let activeOutage = _selectedOutageId ? _activeOutages.find(o => o.id === _selectedOutageId) : null;
      if (!activeOutage) {
        _selectedOutageId = null;
        API.setCurrentOutageId(null);
        UIManager.hideResultCard();
      }

      // Renderizar mapa con el corte seleccionado actualmente por el usuario (si existe)
      MapManager.renderOutages(_activeOutages, _selectedOutageId);

      if (activeOutage) {
        UIManager.renderOutageDetails(activeOutage);
      }

    } catch (err) {
      console.error('[App] Error cargando cortes:', err);
      UIManager.showToast('Error cargando información de la red eléctrica.', 'error');
    }
  }

  // ─── Selección de un corte ─────────────────────────────────────────────────

  async function selectOutage(outageId) {
    if (!outageId) return;
    _selectedOutageId = outageId;
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
        // 1. Actualizar el desplazamiento de todas las furgonetas en ruta
        for (const outage of _activeOutages) {
          if (outage.brigade && outage.brigade.status === 'en_route') {
            const loc = await API.getVehicleLocation(outage.id);
            if (loc) {
              outage.brigade.location = loc;
              const isSelected = (_selectedOutageId === outage.id);
              MapManager.renderBrigadeVehicle(outage.brigade, outage.center, outage.id, isSelected);
            }
          }
        }

        // 2. Si el usuario seleccionó un corte, actualizar ÚNICAMENTE la ficha de ese corte específico
        if (_selectedOutageId) {
          const selectedOutage = _activeOutages.find(o => o.id === _selectedOutageId);
          if (selectedOutage && selectedOutage.brigade) {
            const vanStatusText = document.getElementById('result-van-status-text');
            const vanBanner = document.getElementById('result-van-banner');
            const vanIconWrap = vanBanner?.querySelector('.van-eta-icon');
            if (vanStatusText) {
              if (selectedOutage.brigade.status === 'on_site') {
                vanStatusText.textContent = selectedOutage.brigade.statusText || 'Personal técnico en el lugar — Faenas de reparación en curso';
                if (vanBanner) vanBanner.className = 'result-van-eta-banner van-on-site';
                if (vanIconWrap) {
                  vanIconWrap.innerHTML = `
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                    </svg>
                  `;
                }
              } else {
                vanStatusText.textContent = selectedOutage.brigade.statusText || `Furgoneta en camino — Llegada estimada en ~${selectedOutage.brigade.etaMinutes} min al sector`;
                if (vanBanner) vanBanner.className = 'result-van-eta-banner';
                if (vanIconWrap) {
                  vanIconWrap.innerHTML = `
                    <svg viewBox="0 0 32 20" width="22" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="7" y1="2" x2="23" y2="2"></line>
                      <path d="M3 14V11c0-1.5 1-2.5 2.5-3l4-2c.8-.4 1.7-.6 2.5-.6H25c1.1 0 2 .9 2 2v6.6"></path>
                      <circle cx="8" cy="14.5" r="2.5"></circle>
                      <circle cx="22" cy="14.5" r="2.5"></circle>
                    </svg>
                  `;
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('[App] Telemetría temporalmente pausada:', err);
      }
    }, CONFIG.VEHICLE_POLL_INTERVAL_MS || 10000);
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
        _selectedOutageId = null;
        API.setCurrentOutageId(null);
        MapManager.renderOutages(_activeOutages, null);
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
            _selectedOutageId = null;
            API.setCurrentOutageId(null);
            MapManager.renderOutages(_activeOutages, null);
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
        _selectedOutageId = null;
        API.setCurrentOutageId(null);
        MapManager.renderOutages(_activeOutages, null);
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
