/**
 * ─────────────────────────────────────────────────────
 *  api.js — Capa de datos y comunicación con el backend
 *
 *  HOW TO CONNECT TO REAL BACKEND:
 *  1. Cambia CONFIG.BASE_URL en config.js por la URL real.
 *  2. Las funciones usan fetch() estándar — solo quita el
 *     bloque "MOCK" de cada función y descomenta el fetch real.
 *  3. Ajusta los nombres de campos si el schema del backend difiere.
 * ─────────────────────────────────────────────────────
 */

'use strict';

// ─── Datos mock para desarrollo ───────────────────────────────────────────────

const MOCK_DATA = {
  outage: {
    id: 'CRT-2026-00847',
    status: 'active',                   // 'active' | 'resolving' | 'restored'
    reason: 'Caída de rama sobre tendido eléctrico en sector Los Notros',
    reasonCode: 'VEGETATION',           // 'VEGETATION' | 'COLLISION' | 'EQUIPMENT' | 'STORM'
    reportedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // hace 45 min
    estimatedRestoration: new Date(Date.now() + 75 * 60 * 1000).toISOString(), // en 75 min
    affectedArea: {
      description: 'Pasaje Los Notros 100–350, Av. Caupolicán 1200–1450, Villa Los Arrayanes',
      estimatedUsers: 234,
    },
    priority: 'high',                   // 'low' | 'medium' | 'high' | 'critical'
  },

  brigade: {
    id: 'BRG-045',
    leadName: 'Carlos Andrés Fuentes Molina',
    employeeId: 'EMP-12483',
    photo: null,                        // URL de foto — null usa iniciales
    eta: new Date(Date.now() + 18 * 60 * 1000).toISOString(), // llega en 18 min
    status: 'en_route',                 // 'dispatched' | 'en_route' | 'on_site' | 'resolved'
    vehicle: {
      plate: 'RXLB-51',
      model: 'Toyota Hilux 4WD',
      color: 'Blanco',
      year: 2023,
    },
  },

  vehicleLocation: {
    lat: -38.7221,
    lng: -72.5830,
    heading: 135,
    speedKmh: 42,
    updatedAt: new Date().toISOString(),
  },

  affectedAreaPolygon: {
    type: 'Polygon',
    coordinates: [[
      [-72.5950, -38.7400],
      [-72.5850, -38.7380],
      [-72.5800, -38.7440],
      [-72.5820, -38.7500],
      [-72.5920, -38.7510],
      [-72.5970, -38.7460],
      [-72.5950, -38.7400],
    ]],
  },

  outagePoint: {
    lat: -38.7450,
    lng: -38.7450,   // se corrige abajo
  },
};

// Corregir coordenada incorrecta del mock
MOCK_DATA.outagePoint = { lat: -38.7450, lng: -72.5885 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Wrapper de fetch con manejo de errores centralizado.
 * ⚙️  BACKEND: Esta función ya está lista para producción.
 * @param {string} endpoint
 * @param {RequestInit} options
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${CONFIG.BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // ⚙️  BACKEND: Agregar token de auth aquí:
    // 'Authorization': `Bearer ${getAuthToken()}`,
  };

  const response = await fetch(url, {
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error ${response.status}: ${errorBody}`);
  }

  return response.json();
}

// ─── API Functions ────────────────────────────────────────────────────────────

const API = {
  /**
   * Obtiene los detalles del corte activo para el cliente.
   * ⚙️  BACKEND: GET /api/v1/outage/current
   * @returns {Promise<Object>} OutageDetails
   */
  async getOutageDetails() {
    /* ── MOCK (eliminar en producción) ── */
    return new Promise(resolve => setTimeout(() => resolve(MOCK_DATA.outage), 400));

    /* ── REAL (descomentar en producción) ──
    return apiFetch(CONFIG.API.outageDetails);
    */
  },

  /**
   * Obtiene información de la brigada asignada.
   * ⚙️  BACKEND: GET /api/v1/brigade/assigned
   * @returns {Promise<Object>} BrigadeInfo
   */
  async getBrigadeInfo() {
    /* ── MOCK ── */
    return new Promise(resolve => setTimeout(() => resolve(MOCK_DATA.brigade), 300));

    /* ── REAL ──
    return apiFetch(CONFIG.API.brigadeInfo);
    */
  },

  /**
   * Obtiene la ubicación GPS actual del vehículo de la brigada.
   * ⚙️  BACKEND: GET /api/v1/vehicle/location
   * Se llama cada CONFIG.VEHICLE_POLL_INTERVAL_MS milisegundos.
   * @returns {Promise<Object>} { lat, lng, heading, speedKmh, updatedAt }
   */
  async getVehicleLocation() {
    /* ── MOCK: simula movimiento del vehículo ── */
    const base = MOCK_DATA.vehicleLocation;
    const jitter = () => (Math.random() - 0.5) * 0.002;
    return new Promise(resolve => setTimeout(() => resolve({
      ...base,
      lat: base.lat + jitter(),
      lng: base.lng + jitter(),
      updatedAt: new Date().toISOString(),
    }), 200));

    /* ── REAL ──
    return apiFetch(CONFIG.API.vehicleLocation);
    */
  },

  /**
   * Obtiene el polígono GeoJSON de la zona afectada.
   * ⚙️  BACKEND: GET /api/v1/outage/area
   * @returns {Promise<Object>} GeoJSON Polygon
   */
  async getAffectedArea() {
    /* ── MOCK ── */
    return new Promise(resolve => setTimeout(() => resolve({
      polygon: MOCK_DATA.affectedAreaPolygon,
      outagePoint: MOCK_DATA.outagePoint,
    }), 250));

    /* ── REAL ──
    return apiFetch(CONFIG.API.affectedArea);
    */
  },

  /**
   * Fuerza una actualización de estado desde el backend.
   * ⚙️  BACKEND: POST /api/v1/outage/refresh
   * @returns {Promise<Object>} { success: boolean, message: string }
   */
  async refreshStatus() {
    /* ── MOCK ── */
    return new Promise(resolve => setTimeout(() => resolve({
      success: true,
      message: 'Estado actualizado correctamente.',
      updatedAt: new Date().toISOString(),
    }), 800));

    /* ── REAL ──
    return apiFetch(CONFIG.API.refreshStatus, { method: 'POST' });
    */
  },
};
