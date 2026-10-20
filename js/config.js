/**
 * ─────────────────────────────────────────────────────
 *  config.js — Configuración global, tokens y endpoints
 *  Inspirado en tokens de DESIGN.md (Tesla Minimalist Showroom)
 *  y mapa de desconexiones de Grupo Saesa / Crell.
 * ─────────────────────────────────────────────────────
 */

const CONFIG = {
  APP_VERSION: '2.0.0',
  APP_NAME: 'Plataforma de Desconexiones Eléctricas',

  /** Base URL del backend */
  BASE_URL: 'http://localhost:3000',

  /** Endpoints REST */
  API: {
    outagesList:      '/api/v1/outages',
    outageDetails:    '/api/v1/outage/current',
    brigadeInfo:      '/api/v1/brigade/assigned',
    vehicleLocation:  '/api/v1/vehicle/location',
    refreshStatus:    '/api/v1/outage/refresh',
    affectedArea:     '/api/v1/outage/area',
    reportOutage:     '/api/v1/outage/report',
    searchClient:     '/api/v1/client/search',
  },

  /** Intervalo de polling para posición del vehículo (ms) */
  VEHICLE_POLL_INTERVAL_MS: 12000,
  REFRESH_COOLDOWN_MS: 30000,

  /** Configuración del mapa (CartoDB Positron: limpio, minimalista, técnico) */
  MAP: {
    defaultCenter: [-39.8142, -73.2459], // Los Ríos / Araucanía / Los Lagos
    defaultZoom: 10,
    minZoom: 6,
    maxZoom: 18,
    // CartoDB Dark Matter — Estilo minimalista showroom técnico acorde a DESIGN.md
    tileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    tileAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    // Fallback estándar OSM
    fallbackTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },

  /** Empresas distribuidoras */
  COMPANIES: {
    saesa: {
      id: 'saesa',
      name: 'Grupo Saesa',
      shortName: 'GRUPO SAESA',
      filiales: ['Saesa', 'Frontel', 'Luz Osorno', 'Edelaysen'],
      primaryColor: '#3e6ae1', // Tesla Blue CTA
      accentColor: '#171a20',  // Onyx
      logoText: 'GRUPO SAESA',
      logoIcon: '',
      phone: '800 600 801',
    },
    crell: {
      id: 'crell',
      name: 'Crell S.A.',
      shortName: 'CRELL',
      filiales: ['Crell Distribución'],
      primaryColor: '#3e6ae1',
      accentColor: '#171a20',
      logoText: 'CRELL',
      logoIcon: '',
      phone: '800 600 802',
    },
  },

  DEFAULT_COMPANY: 'saesa',

  /** KPIs de red eléctrica */
  NETWORK_STATS: {
    operationalPercentage: 99.4,
    totalActiveOutages: 5,
    totalAffectedClients: 1482,
    activeBrigades: 8,
  },
};

Object.freeze(CONFIG);
Object.freeze(CONFIG.API);
Object.freeze(CONFIG.MAP);
