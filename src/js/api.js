/**
 * ─────────────────────────────────────────────────────
 *  api.js — Capa de datos, consultas y simulación
 *  Soporta múltiples cortes (Programados y Emergencias),
 *  búsqueda por N° de cliente/comuna, reporte de incidentes y telemetría.
 * ─────────────────────────────────────────────────────
 */

'use strict';

const MIRASOL_STREET_WAYPOINTS = [
  [-41.46296, -72.95157],
  [-41.46362, -72.95140],
  [-41.46393, -72.95182],
  [-41.46448, -72.95277],
  [-41.46495, -72.95360],
  [-41.46533, -72.95427],
  [-41.46560, -72.95477],
  [-41.46579, -72.95521],
  [-41.46612, -72.95585],
  [-41.46652, -72.95653],
  [-41.46715, -72.95765],
  [-41.46803, -72.95921],
  [-41.46822, -72.95957],
  [-41.46842, -72.95998],
  [-41.46857, -72.96038],
  [-41.46887, -72.96126],
  [-41.46922, -72.96209],
  [-41.46941, -72.96255],
  [-41.47016, -72.96463],
  [-41.47038, -72.96524],
  [-41.47059, -72.96586],
  [-41.47085, -72.96664],
  [-41.47134, -72.96805],
  [-41.47193, -72.96932],
  [-41.47284, -72.97121],
  [-41.47369, -72.97152],
  [-41.47541, -72.97272],
  [-41.47577, -72.97322],
  [-41.47627, -72.97378],
  [-41.47709, -72.97389]
];

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
      affectedUsers: 285, // Zona Mediana (4-5 cuadras residenciales)
      priority: 'high',
      associatedClients: ['6104820-1', '6104820', '6104821', '6104822', '6104823'],
      center: { lat: -41.4771, lng: -72.9739 },
      // Polígono mediano residencial (~350m x 250m)
      polygon: {
        type: 'Polygon',
        coordinates: [[
          [-72.9768, -41.4752],
          [-72.9705, -41.4755],
          [-72.9712, -41.4790],
          [-72.9765, -41.4792],
          [-72.9768, -41.4752],
        ]],
      },
      brigade: {
        id: 'BRG-022',
        leadName: 'Rodrigo Alarcón Cárdenas',
        assistantName: 'Gonzalo Silva Tapia',
        employeeId: 'EMP-16204',
        status: 'en_route',
        statusText: 'Furgoneta en traslado por calle — Llegada en ~8 min (2.4 km)',
        etaMinutes: 8,
        estimatedRepairMinutes: 75,
        currentWaypointIndex: 0,
        routeWaypoints: MIRASOL_STREET_WAYPOINTS,
        vehicle: {
          plate: 'RHKL-18',
          type: 'Furgoneta Técnica de Respuesta Rápida',
          model: 'Peugeot Partner 1.6 HDi (Móvil F-22)',
          color: 'Blanco Saesa',
          year: 2024,
        },
        location: {
          lat: -41.46296,
          lng: -72.95157,
          speedKmh: 40,
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
      sector: 'Sector Pelluco — Pasaje Los Alerces con Av. Libanesa',
      reason: 'Fusible aéreo de transformador domiciliario quemado por sobrecarga puntual',
      reasonCode: 'EQUIPMENT',
      reportedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      estimatedRestoration: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
      estimatedRepairDuration: '25 minutos',
      affectedUsers: 34, // ZONA PEQUEÑA: Una sola cuadra puntual
      priority: 'medium',
      associatedClients: ['6209110-3', '6209110', '6209111', '6209112'],
      // Coordenadas 100% en TIERRA FIRME en Villa Cayhuasi, Pelluco (lejos del mar)
      center: { lat: -41.4852, lng: -72.8975 },
      // Polígono pequeño de EXACTAMENTE 1 cuadra (~90m x 70m)
      polygon: {
        type: 'Polygon',
        coordinates: [[
          [-72.8982, -41.4847],
          [-72.8968, -41.4846],
          [-72.8967, -41.4857],
          [-72.8981, -41.4858],
          [-72.8982, -41.4847],
        ]],
      },
      brigade: {
        id: 'BRG-019',
        leadName: 'Juan Carlos Bahamonde Soto',
        assistantName: 'Claudio Mansilla R.',
        employeeId: 'EMP-15408',
        status: 'on_site',
        statusText: 'Personal técnico en el lugar reparando transformador en el poste',
        etaMinutes: 0,
        estimatedRepairMinutes: 25,
        vehicle: {
          plate: 'SPKL-33',
          type: 'Furgoneta Técnica de Faena',
          model: 'Peugeot Partner 1.6 HDi (Móvil F-19)',
          color: 'Blanco Saesa',
          year: 2024,
        },
        // Posición del brigadista exactamente en tierra firme en la esquina del poste
        location: {
          lat: -41.4852,
          lng: -72.8975,
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
    if (!outage || !outage.brigade || !outage.brigade.location) return null;
    const brigade = outage.brigade;

    // Si la brigada tiene ruta de calles definida y está en ruta, avanzar paso a paso por las esquinas
    if (brigade.status === 'en_route') {
      if (brigade.routeWaypoints && brigade.routeWaypoints.length > 0) {
        if (typeof brigade.currentWaypointIndex !== 'number') {
          brigade.currentWaypointIndex = 0;
        }

        // Avanzar al siguiente punto o esquina de la calle
        if (brigade.currentWaypointIndex < brigade.routeWaypoints.length - 1) {
          brigade.currentWaypointIndex++;
          const [wLat, wLng] = brigade.routeWaypoints[brigade.currentWaypointIndex];
          brigade.location.lat = wLat;
          brigade.location.lng = wLng;

          const remainingPoints = brigade.routeWaypoints.length - 1 - brigade.currentWaypointIndex;
          const kmRemaining = Math.max(0.1, +(remainingPoints * 0.08).toFixed(1));
          const etaMinutes = Math.max(1, Math.round(kmRemaining * 2.2));
          brigade.etaMinutes = etaMinutes;
          brigade.statusText = `Furgoneta en traslado por calle — Llegada en ~${etaMinutes} min (${kmRemaining} km)`;
        } else {
          brigade.status = 'on_site';
          brigade.etaMinutes = 0;
          brigade.statusText = 'Furgoneta en el lugar — Personal técnico trabajando en terreno';
        }
      } else if (outage.center) {
        // Fallback vectorial suave
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

