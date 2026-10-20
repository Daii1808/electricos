/**
 * ─────────────────────────────────────────────────────
 *  main.js — Bootstrap de la aplicación
 *  Orquesta la inicialización y el ciclo de vida de la app.
 * ─────────────────────────────────────────────────────
 */

'use strict';

const App = (() => {

  let _vehiclePollingTimer = null;

  // ─── Inicialización ────────────────────────────────────────────────────────

  async function init() {
    // 1. Aplicar tema (oscuro/claro según preferencia del sistema)
    ThemeManager.init();

    // 2. Aplicar branding de empresa por defecto o la guardada
    const savedCompany = localStorage.getItem('selected-company') || CONFIG.DEFAULT_COMPANY;
    UIManager.applyCompanyBranding(savedCompany);

    // 3. Mostrar skeleton loaders mientras cargan los datos
    UIManager.showSkeleton(true);

    // 4. Inicializar mapa
    MapManager.init();

    // 5. Cargar datos iniciales en paralelo
    try {
      const [outage, brigade, areaData] = await Promise.all([
        API.getOutageDetails(),
        API.getBrigadeInfo(),
        API.getAffectedArea(),
      ]);

      // Renderizar UI con datos
      UIManager.showSkeleton(false);
      UIManager.renderOutageDetails(outage);
      UIManager.renderBrigadeInfo(brigade);

      // Renderizar mapa
      MapManager.renderAffectedArea(areaData.polygon);
      MapManager.renderOutagePoint(areaData.outagePoint, outage.reason);

      // Cargar posición inicial del vehículo
      const vehiclePos = await API.getVehicleLocation();
      MapManager.renderVehicle(vehiclePos, brigade.leadName);

      // 6. Iniciar polling de posición del vehículo
      startVehiclePolling(brigade.leadName);

    } catch (err) {
      console.error('[App] Error cargando datos iniciales:', err);
      UIManager.showSkeleton(false);
      UIManager.showToast('Error al cargar información. Intente nuevamente.', 'error');
    }

    // 7. Registrar eventos de UI
    registerEventListeners();
  }

  // ─── Polling del vehículo ────────────────────────────────────────────────

  /**
   * Inicia el polling periódico de la ubicación del vehículo.
   * El backend puede reemplazar esto con WebSockets:
   * ⚙️  BACKEND: ws://tu-servidor/vehicle-location-stream
   */
  function startVehiclePolling(brigadeName) {
    if (_vehiclePollingTimer) clearInterval(_vehiclePollingTimer);

    _vehiclePollingTimer = setInterval(async () => {
      try {
        const pos = await API.getVehicleLocation();
        MapManager.renderVehicle(pos, brigadeName);
      } catch (err) {
        console.warn('[App] Error actualizando posición del vehículo:', err);
      }
    }, CONFIG.VEHICLE_POLL_INTERVAL_MS);
  }

  // ─── Event Listeners ─────────────────────────────────────────────────────

  function registerEventListeners() {

    // Toggle de modo oscuro/claro
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => ThemeManager.toggle());
    }

    // Selector de empresa distribuidora
    document.querySelectorAll('.company-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        UIManager.applyCompanyBranding(btn.dataset.company);
        UIManager.showToast(`Empresa cambiada a ${CONFIG.COMPANIES[btn.dataset.company]?.name}`, 'info');
      });
    });

    // Botón de actualización de estado
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', handleRefresh);
    }

    // Botón "Ver en mapa" en la tarjeta de brigada
    const viewMapBtn = document.getElementById('view-brigade-on-map');
    if (viewMapBtn) {
      viewMapBtn.addEventListener('click', () => {
        const map = MapManager.getMap();
        if (map) {
          map.setView(CONFIG.MAP.defaultCenter, 15, { animate: true });
        }
        // En mobile: hacer scroll al mapa
        document.getElementById('map-container')?.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Expandir/colapsar panel en mobile
    const panelToggle = document.getElementById('panel-toggle');
    if (panelToggle) {
      panelToggle.addEventListener('click', () => {
        const panel = document.getElementById('side-panel');
        panel?.classList.toggle('panel--collapsed');
        const isCollapsed = panel?.classList.contains('panel--collapsed');
        panelToggle.setAttribute('aria-expanded', !isCollapsed);
        panelToggle.querySelector('.toggle-arrow')?.classList.toggle('arrow--up', !isCollapsed);
      });
    }
  }

  // ─── Manejador de actualización ──────────────────────────────────────────

  async function handleRefresh() {
    const btnText = document.getElementById('refresh-btn-text');
    if (btnText) btnText.textContent = 'Actualizando...';

    try {
      const result = await API.refreshStatus();

      if (result.success) {
        // Recargar todos los datos
        const [outage, brigade] = await Promise.all([
          API.getOutageDetails(),
          API.getBrigadeInfo(),
        ]);
        UIManager.renderOutageDetails(outage);
        UIManager.renderBrigadeInfo(brigade);
        UIManager.showToast('Estado actualizado correctamente.', 'success');
      } else {
        UIManager.showToast('No hay cambios nuevos disponibles.', 'info');
      }
    } catch (err) {
      console.error('[App] Error al actualizar:', err);
      UIManager.showToast('Error al conectar con el servidor.', 'error');
    }

    // Iniciar cooldown de 60 segundos
    UIManager.startRefreshCooldown(CONFIG.REFRESH_COOLDOWN_MS);
  }

  // ─── API pública ──────────────────────────────────────────────────────────

  return { init };
})();

// ─── Arranque cuando el DOM esté listo ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
