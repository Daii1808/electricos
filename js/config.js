/**
 * ─────────────────────────────────────────────────────
 *  config.js — Configuración global y endpoints API
 *  NOTA: Reemplazar BASE_URL y rutas con los del backend real.
 * ─────────────────────────────────────────────────────
 */

const CONFIG = {
  /** Versión de la aplicación */
  APP_VERSION: '1.0.0',

  /**
   * Base URL del backend.
   * ⚙️  BACKEND: Cambiar por la URL real del servidor.
   * Ejemplo: 'https://api.saesa.cl/trazabilidad'
   */
  BASE_URL: 'http://localhost:3000',

  /** Endpoints REST */
  API: {
    outageDetails:   '/api/v1/outage/current',     // GET — detalles del corte activo
    brigadeInfo:     '/api/v1/brigade/assigned',   // GET — info de la brigada asignada
    vehicleLocation: '/api/v1/vehicle/location',   // GET — posición GPS del vehículo (polling)
    refreshStatus:   '/api/v1/outage/refresh',     // POST — forzar actualización de estado
    affectedArea:    '/api/v1/outage/area',        // GET — polígono GeoJSON de zona afectada
  },

  /** Intervalo de polling para posición del vehículo (ms) */
  VEHICLE_POLL_INTERVAL_MS: 15000,

  /** Cooldown del botón "Actualizar" para evitar spam (ms) */
  REFRESH_COOLDOWN_MS: 60000,

  /** Configuración del mapa */
  MAP: {
    /** Centro inicial del mapa — ⚙️  BACKEND: sobrescribir con coordenadas del corte */
    defaultCenter: [-38.7359, -72.5904], // Temuco, Región de La Araucanía
    defaultZoom: 14,
    minZoom: 10,
    maxZoom: 18,
    tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    tileAttribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },

  /** Empresas distribuidoras disponibles */
  COMPANIES: {
    saesa: {
      id: 'saesa',
      name: 'Grupo Saesa',
      shortName: 'SAESA',
      primaryColor: '#E8A000',
      accentColor:  '#FF6B00',
      logoText: 'SAESA',
      logoIcon: '⚡',
    },
    crell: {
      id: 'crell',
      name: 'Crell S.A.',
      shortName: 'CRELL',
      primaryColor: '#0066CC',
      accentColor:  '#004499',
      logoText: 'CRELL',
      logoIcon: '🔌',
    },
  },

  /** Empresa activa por defecto */
  DEFAULT_COMPANY: 'saesa',
};

// Congelar el objeto para evitar mutaciones accidentales
Object.freeze(CONFIG);
Object.freeze(CONFIG.API);
Object.freeze(CONFIG.MAP);
