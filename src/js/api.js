/**
 * ─────────────────────────────────────────────────────
 *  api.js — Capa de datos, consultas y simulación
 *  Soporta múltiples cortes (Programados y Emergencias),
 *  búsqueda por N° de cliente/comuna, reporte de incidentes y telemetría.
 * ─────────────────────────────────────────────────────
 */

'use strict';

const MOCK_DATA = {
  outages: [
    {
      id: 'CRT-2026-00955',
      company: 'saesa',
      filial: 'Saesa',
      type: 'no_programada',
      typeName: 'Emergencia / No programada',
      status: 'active',
      comuna: 'Puerto Montt',
      sector: 'Sector Mirasol — Av. Los Notros con Vicuña Mackenna',
      reason: 'Falla en seccionador de media tensión por ramas sobre red y ráfagas de viento',
      reasonCode: 'WEATHER_EQUIPMENT',
      reportedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      estimatedRestoration: new Date(Date.now() + 75 * 60 * 1000).toISOString(),
      estimatedRepairDuration: '1 hora 15 minutos',
      affectedUsers: 285,
      priority: 'high',
      associatedClients: ['6104820-1', '6104820', '6104821', '6104822', '6104823'],
      center: { lat: -41.4740, lng: -72.9650 },
      polygon: {
        type: 'Polygon',
        coordinates: [[
          [-72.9730, -41.4680],
          [-72.9560, -41.4690],
          [-72.9540, -41.4790],
          [-72.9680, -41.4820],
          [-72.9750, -41.4750],
          [-72.9730, -41.4680],
        ]],
      },
      brigade: {
        id: 'BRG-022',
        leadName: 'Rodrigo Alarcón Cárdenas',
        assistantName: 'Gonzalo Silva Tapia',
        employeeId: 'EMP-16204',
        status: 'en_route',
        statusText: 'Furgoneta en traslado — Llegada en ~8 min (1.2 km)',
        etaMinutes: 8,
        estimatedRepairMinutes: 75,
        vehicle: {
          plate: 'RHKL-18',
          type: 'Furgoneta Técnica de Respuesta Rápida',
          model: 'Peugeot Partner 1.6 HDi (Móvil F-22)',
          color: 'Blanco Saesa',
          year: 2024,
        },
        location: {
          lat: -41.4630,
          lng: -72.9520,
          speedKmh: 42,
          heading: 215,
        },
      },
    },

    {
      id: 'CRT-2026-00962',
      company: 'saesa',
      filial: 'Saesa',
      type: 'no_programada',
      typeName: 'Emergencia / No programada',
      status: 'active',
      comuna: 'Puerto Montt',
      sector: 'Sector Pelluco — Av. Juan Soler Manfredini con Libanesa',
      reason: 'Reemplazo de aislador y conductor cortado por viento costero',
      reasonCode: 'WEATHER_EQUIPMENT',
      reportedAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
      estimatedRestoration: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      estimatedRepairDuration: '45 minutos',
      affectedUsers: 184,
      priority: 'high',
      associatedClients: ['6209110-3', '6209110', '6209111', '6209112'],
      center: { lat: -41.4880, lng: -72.9050 },
      polygon: {
        type: 'Polygon',
        coordinates: [[
          [-72.9150, -41.4830],
          [-72.8980, -41.4820],
          [-72.8950, -41.4930],
          [-72.9100, -41.4940],
          [-72.9180, -41.4890],
          [-72.9150, -41.4830],
        ]],
      },
      brigade: {
        id: 'BRG-019',
        leadName: 'Juan Carlos Bahamonde Soto',
        assistantName: 'Claudio Mansilla R.',
        employeeId: 'EMP-15408',
        status: 'on_site',
        statusText: 'Personal técnico en el lugar reparando línea y aislador',
        etaMinutes: 0,
        estimatedRepairMinutes: 45,
        vehicle: {
          plate: 'SPKL-33',
          type: 'Furgoneta Técnica de Faena',
          model: 'Peugeot Partner 1.6 HDi (Móvil F-19)',
          color: 'Blanco Saesa',
          year: 2024,
        },
        location: {
          lat: -41.4882,
          lng: -72.9048,
          speedKmh: 0,
          heading: 90,
        },
      },
    },

    {
      id: 'CRT-2026-00847',
      company: 'saesa',
      filial: 'Saesa',
      type: 'no_programada', // 'no_programada' | 'programada'
      typeName: 'Emergencia / No programada',
      status: 'active',
      comuna: 'Temuco',
      sector: 'Los Notros — Av. Caupolicán',
      reason: 'Caída de rama sobre alimentador de media tensión',
      reasonCode: 'VEGETATION',
      reportedAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
      estimatedRestoration: new Date(Date.now() + 65 * 60 * 1000).toISOString(),
      estimatedRepairDuration: '1 hora 05 minutos',
      affectedUsers: 234,
      priority: 'high',
      associatedClients: ['1204859-1', '1204859', '1204860', '1204861'],
      center: { lat: -38.7450, lng: -72.5885 },
      polygon: {
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
      brigade: {
        id: 'BRG-045',
        leadName: 'Carlos Andrés Fuentes Molina',
        assistantName: 'Miguel Sepúlveda P.',
        employeeId: 'EMP-12483',
        status: 'en_route',
        statusText: 'Furgoneta en traslado — Llegada en ~12 min',
        etaMinutes: 12,
        estimatedRepairMinutes: 65,
        vehicle: {
          plate: 'RXLB-51',
          type: 'Furgoneta Técnica',
          model: 'Renault Kangoo Maxi (Móvil F-14)',
          color: 'Blanco',
          year: 2023,
        },
        location: {
          lat: -38.7280,
          lng: -72.5840,
          speedKmh: 45,
          heading: 180,
        },
      },
    },

    {
      id: 'CRT-2026-00912',
      company: 'saesa',
      filial: 'Saesa',
      type: 'no_programada',
      typeName: 'Emergencia / No programada',
      status: 'active',
      comuna: 'Valdivia',
      sector: 'Isla Teja — Los Pelúes y Calle Las Encinas',
      reason: 'Choque de vehículo contra poste de media tensión',
      reasonCode: 'COLLISION',
      reportedAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
      estimatedRestoration: new Date(Date.now() + 110 * 60 * 1000).toISOString(),
      affectedUsers: 412,
      priority: 'critical',
      associatedClients: ['2398410-4', '2398410', '2398411', '2398412'],
      center: { lat: -39.8142, lng: -73.2514 },
      polygon: {
        type: 'Polygon',
        coordinates: [[
          [-73.2600, -39.8090],
          [-73.2450, -39.8080],
          [-73.2420, -39.8160],
          [-73.2540, -39.8200],
          [-73.2630, -39.8150],
          [-73.2600, -39.8090],
        ]],
      },
      brigade: {
        id: 'BRG-012',
        leadName: 'Matías Ignacio Soto Paredes',
        employeeId: 'EMP-14022',
        status: 'on_site',
        statusText: 'Trabajando en el punto de falla',
        etaMinutes: 0,
        vehicle: {
          plate: 'PJWD-88',
          model: 'Ford Ranger XLT',
          color: 'Gris Plata',
          year: 2024,
        },
        location: {
          lat: -39.8145,
          lng: -73.2512,
          speedKmh: 0,
          heading: 90,
        },
      },
    },

    {
      id: 'CRT-2026-01044',
      company: 'saesa',
      filial: 'Luz Osorno',
      type: 'no_programada',
      typeName: 'Emergencia / No programada',
      status: 'active',
      comuna: 'Osorno',
      sector: 'Rahue Alto — Sector Chorrillos y El Esfuerzo',
      reason: 'Falla técnica en subestación de distribución barrial',
      reasonCode: 'EQUIPMENT',
      reportedAt: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
      estimatedRestoration: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      affectedUsers: 610,
      priority: 'high',
      associatedClients: ['3411090-2', '3411090', '3411091'],
      center: { lat: -40.5739, lng: -73.1550 },
      polygon: {
        type: 'Polygon',
        coordinates: [[
          [-73.1640, -40.5680],
          [-73.1460, -40.5690],
          [-73.1450, -40.5780],
          [-73.1580, -40.5820],
          [-73.1660, -40.5750],
          [-73.1640, -40.5680],
        ]],
      },
      brigade: {
        id: 'BRG-078',
        leadName: 'Rodrigo Hernán Carrasco Lagos',
        employeeId: 'EMP-09881',
        status: 'on_site',
        statusText: 'Maniobras de aislamiento y reposición',
        etaMinutes: 0,
        vehicle: {
          plate: 'KZTS-19',
          model: 'Chevrolet D-Max 4x4',
          color: 'Blanco',
          year: 2022,
        },
        location: {
          lat: -40.5741,
          lng: -73.1548,
          speedKmh: 0,
          heading: 0,
        },
      },
    },

    {
      id: 'CRT-2026-00720',
      company: 'saesa',
      filial: 'Saesa',
      type: 'programada',
      typeName: 'Desconexión programada por mantenimiento',
      status: 'scheduled',
      comuna: 'Puerto Montt',
      sector: 'Alerce Sur — Av. Los Alerces con Transversal 3',
      reason: 'Mejoramiento de red y reemplazo preventivo de cables conductores',
      reasonCode: 'MAINTENANCE',
      reportedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      estimatedRestoration: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
      affectedUsers: 150,
      priority: 'medium',
      associatedClients: ['4502391-7', '4502391', '4502392'],
      center: { lat: -41.3980, lng: -72.9060 },
      polygon: {
        type: 'Polygon',
        coordinates: [[
          [-72.9150, -41.3920],
          [-72.8980, -41.3930],
          [-72.8970, -41.4030],
          [-72.9120, -41.4050],
          [-72.9170, -41.3980],
          [-72.9150, -41.3920],
        ]],
      },
      brigade: {
        id: 'BRG-031',
        leadName: 'Esteban Javier Morales Troncoso',
        employeeId: 'EMP-15104',
        status: 'on_site',
        statusText: 'Trabajos de mantenimiento programado',
        etaMinutes: 0,
        vehicle: {
          plate: 'TLBK-42',
          model: 'Mercedes-Benz Sprinter Brigada',
          color: 'Blanco',
          year: 2023,
        },
        location: {
          lat: -41.3982,
          lng: -72.9058,
          speedKmh: 0,
          heading: 270,
        },
      },
    },

    {
      id: 'CRT-2026-00655',
      company: 'crell',
      filial: 'Crell Distribución',
      type: 'programada',
      typeName: 'Desconexión programada por mejoras',
      status: 'scheduled',
      comuna: 'Puerto Varas',
      sector: 'Costanera Poniente — Km 2 camino a Ensenada',
      reason: 'Ampliación de capacidad y poda preventiva en faja de servidumbre',
      reasonCode: 'MAINTENANCE',
      reportedAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      estimatedRestoration: new Date(Date.now() + 140 * 60 * 1000).toISOString(),
      affectedUsers: 76,
      priority: 'low',
      associatedClients: ['5610293-9', '5610293', '5610294'],
      center: { lat: -41.3204, lng: -72.9856 },
      polygon: {
        type: 'Polygon',
        coordinates: [[
          [-72.9920, -41.3150],
          [-72.9780, -41.3160],
          [-72.9770, -41.3250],
          [-72.9910, -41.3260],
          [-72.9940, -41.3200],
          [-72.9920, -41.3150],
        ]],
      },
      brigade: {
        id: 'BRG-089',
        leadName: 'Fernando Gabriel Almonacid Vera',
        employeeId: 'EMP-07612',
        status: 'on_site',
        statusText: 'Faenas de poda y despeje de líneas',
        etaMinutes: 0,
        vehicle: {
          plate: 'HVDR-90',
          model: 'Toyota Hilux 4x4',
          color: 'Azul Crell',
          year: 2023,
        },
        location: {
          lat: -41.3207,
          lng: -72.9854,
          speedKmh: 0,
          heading: 45,
        },
      },
    },
  ],
};

// Variable interna para corte actualmente seleccionado
let _currentOutageId = 'CRT-2026-00955';

const API = {
  /**
   * Obtiene la lista de todos los cortes aplicando filtros
   * @param {{ company?: string, type?: string, comuna?: string }} filter
   */
  async getAllOutages(filter = {}) {
    let list = [...MOCK_DATA.outages];

    if (filter.company && filter.company !== 'all') {
      list = list.filter(o => o.company === filter.company);
    }
    if (filter.type && filter.type !== 'all') {
      list = list.filter(o => o.type === filter.type);
    }
    if (filter.comuna && filter.comuna !== 'all') {
      list = list.filter(o => o.comuna.toLowerCase() === filter.comuna.toLowerCase());
    }

    return list;
  },

  /**
   * Obtiene detalles del corte activo o del ID especificado
   */
  async getOutageDetails(outageId = null) {
    const id = outageId || _currentOutageId;
    const outage = MOCK_DATA.outages.find(o => o.id === id) || MOCK_DATA.outages[0];
    _currentOutageId = outage.id;
    return outage;
  },

  /**
   * Obtiene información de la brigada asignada
   */
  async getBrigadeInfo(outageId = null) {
    const outage = await this.getOutageDetails(outageId);
    return outage.brigade;
  },

  /**
   * Obtiene telemetría y ubicación actual del móvil de la brigada
   */
  async getVehicleLocation(outageId = null) {
    const outage = await this.getOutageDetails(outageId);
    const brigade = outage.brigade;

    // Si la brigada está en ruta, simular avance real hacia el punto de falla
    if (brigade.status === 'en_route' && outage.center) {
      const dLat = outage.center.lat - brigade.location.lat;
      const dLng = outage.center.lng - brigade.location.lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist > 0.001) {
        brigade.location.lat += (dLat / dist) * 0.00035;
        brigade.location.lng += (dLng / dist) * 0.00035;
        const kmRemaining = Math.max(0.2, dist * 111);
        const etaMinutes = Math.max(1, Math.round((kmRemaining / 35) * 60));
        brigade.etaMinutes = etaMinutes;
        brigade.statusText = `Furgoneta en traslado — Llegada en ~${etaMinutes} min (${kmRemaining.toFixed(1)} km)`;
      } else {
        brigade.status = 'on_site';
        brigade.etaMinutes = 0;
        brigade.statusText = 'Furgoneta en el lugar — Personal trabajando en terreno';
      }
    }

    return {
      lat: brigade.location.lat,
      lng: brigade.location.lng,
      speedKmh: brigade.location.speedKmh,
      heading: brigade.location.heading,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Obtiene datos geográficos del corte (polígono y centro)
   */
  async getAffectedArea(outageId = null) {
    const outage = await this.getOutageDetails(outageId);
    return {
      polygon: outage.polygon,
      outagePoint: outage.center,
      sector: outage.sector,
      comuna: outage.comuna,
    };
  },

  /**
   * Busca cortes asociados a un número de cliente o nombre de comuna
   * @param {string} query
   */
  async searchByClientOrComuna(query) {
    const cleanQuery = (query || '').trim().toLowerCase();
    if (!cleanQuery) return null;

    // 1. Buscar coincidencia exacta o parcial con N° de cliente
    const byClient = MOCK_DATA.outages.find(o =>
      o.associatedClients.some(c => c.toLowerCase().includes(cleanQuery))
    );
    if (byClient) return { matchType: 'client', outage: byClient };

    // 2. Buscar por comuna
    const byComuna = MOCK_DATA.outages.filter(o =>
      o.comuna.toLowerCase().includes(cleanQuery)
    );
    if (byComuna.length > 0) {
      return { matchType: 'comuna', outages: byComuna, primary: byComuna[0] };
    }

    // 3. Buscar por sector o palabra clave
    const bySector = MOCK_DATA.outages.find(o =>
      o.sector.toLowerCase().includes(cleanQuery) || o.id.toLowerCase().includes(cleanQuery)
    );
    if (bySector) return { matchType: 'sector', outage: bySector };

    return null;
  },

  /**
   * Reporta un nuevo corte imprevisto desde la plataforma ("Estoy sin luz")
   * @param {{ clientNumber: string, comuna: string, address: string, reason: string, coords?: { lat: number, lng: number } }} reportData
   */
  async reportOutage(reportData) {
    const randomId = `CRT-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const lat = reportData.coords ? reportData.coords.lat : -38.7400;
    const lng = reportData.coords ? reportData.coords.lng : -72.6000;

    const newOutage = {
      id: randomId,
      company: 'saesa',
      filial: 'Saesa',
      type: 'no_programada',
      typeName: 'Emergencia / Reportado por cliente',
      status: 'active',
      comuna: reportData.comuna || 'Temuco',
      sector: reportData.address || 'Sector reportado',
      reason: reportData.reason || 'Interrupción de suministro ingresada por cliente',
      reasonCode: 'UNKNOWN',
      reportedAt: new Date().toISOString(),
      estimatedRestoration: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
      affectedUsers: 1,
      priority: 'high',
      associatedClients: [reportData.clientNumber || '1000000-1'],
      center: { lat, lng },
      polygon: {
        type: 'Polygon',
        coordinates: [[
          [lng - 0.005, lat - 0.005],
          [lng + 0.005, lat - 0.005],
          [lng + 0.005, lat + 0.005],
          [lng - 0.005, lat + 0.005],
          [lng - 0.005, lat - 0.005],
        ]],
      },
      brigade: {
        id: 'BRG-PND',
        leadName: 'Cuadrilla por asignar',
        employeeId: 'EMP-PENDIENTE',
        status: 'dispatched',
        statusText: 'Asignando cuadrilla de emergencia',
        etaMinutes: 25,
        vehicle: {
          plate: 'ASIG-01',
          model: 'Vehículo técnico de respuesta rápida',
          color: 'Blanco',
          year: 2024,
        },
        location: {
          lat: lat + 0.015,
          lng: lng + 0.012,
          speedKmh: 50,
          heading: 210,
        },
      },
    };

    MOCK_DATA.outages.unshift(newOutage);
    _currentOutageId = newOutage.id;
    return newOutage;
  },

  /**
   * Refresca el estado actual
   */
  async refreshStatus() {
    return this.getOutageDetails(_currentOutageId);
  },

  /**
   * Setter de corte seleccionado
   */
  setCurrentOutageId(id) {
    _currentOutageId = id;
  },

  getCurrentOutageId() {
    return _currentOutageId;
  },
};

if (typeof window !== 'undefined') {
  window.API = API;
  window.MOCK_DATA = MOCK_DATA;
}

export { API, MOCK_DATA };

