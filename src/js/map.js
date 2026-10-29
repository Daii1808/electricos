/**
 * ─────────────────────────────────────────────────────
 *  map.js — Módulo del mapa interactivo (Leaflet.js)
 *  Inspirado en la estética técnica y minimalista de DESIGN.md (Tesla Showroom)
 *  y la sección mapa-desconexiones de Grupo Saesa.
 * ─────────────────────────────────────────────────────
 */

'use strict';

const MapManager = (() => {
  let _map = null;
  let _tileLayer = null;

  // Capas activas
  let _markersGroup = null;
  let _polygonsGroup = null;
  let _brigadesGroup = null;
  let _vehicleMarkersMap = new Map();
  let _routeLine = null;
  let _userLocationMarker = null;

  // Callback al hacer click en un corte en el mapa
  let _onSelectOutageCallback = null;

  // ─── Íconos Personalizados (SVG Minimalistas) ───────────────────────────────

  /**
   * Crea ícono de marcador de corte según tipo
   * @param {string} type — 'no_programada' | 'programada'
   * @param {boolean} isSelected
   */
  function createOutageIcon(type = 'no_programada', isSelected = false) {
    const isEmergency = type === 'no_programada';
    const bgColor = isEmergency ? '#171a20' : '#3e6ae1'; // Onyx vs Tesla Blue
    const badgeColor = isEmergency ? '#DC2626' : '#3e6ae1';
    const symbolSvg = isEmergency
      ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M13 2L3 14h7v8l10-12h-7z"/></svg>'
      : '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.5 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.4-2.4c.4-.3.4-1 0-1.3z"/></svg>';
    const scale = isSelected ? 'transform: scale(1.15);' : '';

    const html = `
      <div class="map-outage-marker ${isSelected ? 'marker-selected' : ''}" style="${scale}">
        <div class="map-marker-pulse" style="background-color: ${badgeColor};"></div>
        <div class="map-marker-pin" style="background-color: ${bgColor}; border: 2px solid ${badgeColor}; color: #ffffff;">
          <span class="marker-symbol">${symbolSvg}</span>
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-outage-div-icon',
      iconSize: [42, 42],
      iconAnchor: [21, 21],
      popupAnchor: [0, -22],
    });
  }

  /**
   * Ícono para furgoneta técnica en traslado / ruta
   */
  function createVanIcon(plate = '', isSelected = false) {
    const scale = isSelected ? 'transform: scale(1.15);' : '';
    const html = `
      <div class="map-van-marker ${isSelected ? 'marker-selected' : ''}" style="${scale}">
        <div class="map-van-pulse"></div>
        <div class="map-van-body">
          <svg viewBox="0 0 32 20" width="26" height="16" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Portaescalas técnico en techo -->
            <line x1="7" y1="2" x2="23" y2="2" stroke="#64748b" stroke-width="2"></line>
            <line x1="10" y1="2" x2="10" y2="5" stroke="#64748b" stroke-width="1.5"></line>
            <line x1="20" y1="2" x2="20" y2="5" stroke="#64748b" stroke-width="1.5"></line>
            <!-- Carrocería de furgoneta técnica -->
            <path d="M3 14V10c0-1.2.8-2.2 2-2.6l4.5-1.9c.7-.3 1.5-.5 2.3-.5H25c1.1 0 2 .9 2 2v7" fill="#ffffff"></path>
            <path d="M11 5h8v4h-8z" fill="#dbeafe" stroke="#3b82f6" stroke-width="1"></path>
            <!-- Ruedas -->
            <circle cx="8" cy="15" r="2.5" fill="#1e293b" stroke="#ffffff" stroke-width="1.5"></circle>
            <circle cx="22" cy="15" r="2.5" fill="#1e293b" stroke="#ffffff" stroke-width="1.5"></circle>
          </svg>
        </div>
        ${plate ? `<span class="van-plate-label">${plate}</span>` : ''}
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-van-div-icon',
      iconSize: [46, 46],
      iconAnchor: [23, 23],
      popupAnchor: [0, -24],
    });
  }

  /**
   * Ícono para brigadista arreglando en la zona / en faena directa en el punto
   */
  function createBrigadeOnSiteIcon(leadName = '', isSelected = false) {
    const scale = isSelected ? 'transform: scale(1.15);' : '';
    const html = `
      <div class="map-technician-marker ${isSelected ? 'marker-selected' : ''}" style="${scale}">
        <div class="technician-pulse-ring"></div>
        <div class="technician-badge">
          <svg viewBox="0 0 32 32" width="26" height="26" fill="none">
            <!-- Casco brigadista de seguridad ámbar -->
            <path d="M8 14c0-4.4 3.6-8 8-8s8 3.6 8 8H8z" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
            <rect x="6" y="14" width="20" height="2.5" rx="1.2" fill="#d97706"/>
            <!-- Cabeza y chaleco reflectante -->
            <circle cx="16" cy="18" r="3.2" fill="#fde68a"/>
            <path d="M9 28c0-3.3 3.1-6 7-6s7 2.7 7 6H9z" fill="#0284c7"/>
            <path d="M13 22l-1 6m6-6l1 6" stroke="#fbbf24" stroke-width="1.8"/>
            <!-- Indicador activo de faena técnica -->
            <circle cx="23" cy="11" r="5" fill="#10b981" stroke="#ffffff" stroke-width="1.5"/>
            <path d="M22 8.5l-1.5 2.5h2l-1.5 3" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="technician-status-label">En faena</span>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-technician-div-icon',
      iconSize: [48, 48],
      iconAnchor: [24, 24],
      popupAnchor: [0, -24],
    });
  }

  /**
   * Ícono de geolocalización de usuario ("Mi Ubicación" Tesla Blue)
   */
  function createUserLocationIcon() {
    const html = `
      <div class="map-user-marker">
        <div class="user-pulse-wave"></div>
        <div class="user-dot"></div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-user-div-icon',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
    });
  }

  // ─── Inicialización ────────────────────────────────────────────────────────

  function init(onSelectOutage) {
    _onSelectOutageCallback = onSelectOutage;

    const { defaultCenter, defaultZoom, minZoom, maxZoom, tileUrl, tileAttribution } = CONFIG.MAP;

    _map = L.map('map', {
      center: defaultCenter,
      zoom: defaultZoom,
      minZoom,
      maxZoom,
      zoomControl: false,
      attributionControl: true,
    });
    // 1. Diccionario con las coordenadas aproximadas de cada comuna
const coordenadasComunas = {
    "Temuco": [-38.7397, -72.5901, 13],
    "Valdivia": [-39.8196, -73.2452, 13],
    "Osorno": [-40.5725, -73.1353, 13],
    "Puerto Montt": [-41.4693, -72.9424, 13],
    "Puerto Varas": [-41.3197, -72.9845, 13]
};

// 2. Escuchar cuando cambie la selección en el menú desplegable
const selectComuna = document.getElementById('comuna-filter-select');
if (selectComuna) {
    selectComuna.addEventListener('change', (event) => {
        const comunaSeleccionada = event.target.value;
        
        // Si selecciona una comuna válida, mover el mapa de forma fluida
        if (coordenadasComunas[comunaSeleccionada]) {
            const [lat, lng, zoom] = coordenadasComunas[comunaSeleccionada];
            _map.flyTo([lat, lng], zoom, { duration: 1.2 });
        } else if (comunaSeleccionada === "all") {
            // Opcional: Vista general si selecciona "Todas las comunas"
            _map.flyTo([-39.8142, -73.2459], 9, { duration: 1.2 });
        }
    });
}

    // Capa de mapa base (OpenStreetMap sin marcas de agua ni restricciones de API)
    L.tileLayer(tileUrl, {
      subdomains: ['a', 'b', 'c'],
      maxZoom,
      minZoom,
      attribution: tileAttribution,
    }).addTo(_map);

    // Controles de zoom abajo a la derecha
    L.control.zoom({ position: 'bottomright' }).addTo(_map);

    // Atribución compacta abajo a la izquierda
    _map.attributionControl.setPosition('bottomleft');

    // Grupos de capas
    _polygonsGroup = L.featureGroup().addTo(_map);
    _markersGroup = L.featureGroup().addTo(_map);
    _brigadesGroup = L.featureGroup().addTo(_map);

    return _map;
  }

  // ─── Renderizado de todos los cortes en el mapa ────────────────────────────

  /**
   * Renderiza todos los cortes en el mapa, destacando el seleccionado
   * @param {Array} outages — Lista de cortes
   * @param {string} selectedId — ID del corte activo
   */
  function renderOutages(outages, selectedId) {
    if (!_map) return;

    _markersGroup.clearLayers();
    _polygonsGroup.clearLayers();
    _brigadesGroup.clearLayers();
    _vehicleMarkersMap.clear();

    if (_routeLine) {
      _map.removeLayer(_routeLine);
      _routeLine = null;
    }

    let selectedOutage = null;

    outages.forEach(outage => {
      const isSelected = outage.id === selectedId;
      if (isSelected) selectedOutage = outage;

      // 1. Polígono de la zona afectada
      if (outage.polygon && outage.polygon.coordinates) {
        const latLngs = outage.polygon.coordinates[0].map(([lng, lat]) => [lat, lng]);
        const isEmergency = outage.type === 'no_programada';

        const polygon = L.polygon(latLngs, {
          color: isSelected ? (isEmergency ? '#dc2626' : '#2563eb') : '#64748b',
          fillColor: isEmergency ? '#ef4444' : '#3b82f6',
          fillOpacity: isSelected ? 0.26 : 0.12,
          weight: isSelected ? 2.5 : 1.5,
          dashArray: isSelected ? '6 4' : '4 4',
          lineCap: 'round',
        }).addTo(_polygonsGroup);

        polygon.on('click', () => {
          if (_onSelectOutageCallback) _onSelectOutageCallback(outage.id);
        });
      }

      // 2. Marcador del corte
      const marker = L.marker([outage.center.lat, outage.center.lng], {
        icon: createOutageIcon(outage.type, isSelected),
        zIndexOffset: isSelected ? 600 : 200,
      }).addTo(_markersGroup);

      const popupHtml = `
        <div class="map-popup-plaque">
          <div class="popup-tag ${outage.type === 'no_programada' ? 'tag-emergency' : 'tag-scheduled'}">
            ${outage.type === 'no_programada' ? 'EMERGENCIA' : 'PROGRAMADO'}
          </div>
          <div class="popup-id">${outage.id}</div>
          <div class="popup-title">${outage.comuna} — ${outage.sector}</div>
          <div class="popup-meta">
            <span><strong>${outage.affectedUsers}</strong> clientes</span> ·
            <span>${outage.brigade?.statusText || 'En atención'}</span>
          </div>
          <button class="popup-cta-btn" onclick="window.selectOutageFromMap('${outage.id}')">
            Inspeccionar en detalle
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'tesla-map-popup',
        maxWidth: 280,
      });

      marker.on('click', () => {
        if (_onSelectOutageCallback) _onSelectOutageCallback(outage.id);
      });

      // 3. Marcador de Cuadrilla Técnica: Furgoneta en ruta O Brigadista en la zona
      if (outage.brigade && outage.brigade.location) {
        const brigade = outage.brigade;
        const isOnSite = brigade.status === 'on_site';

        const brigadeIcon = isOnSite
          ? createBrigadeOnSiteIcon(brigade.leadName, isSelected)
          : createVanIcon(brigade.vehicle?.plate, isSelected);

        const brigadeMarker = L.marker([brigade.location.lat, brigade.location.lng], {
          icon: brigadeIcon,
          zIndexOffset: isSelected ? 1200 : (isOnSite ? 850 : 950),
        }).addTo(_brigadesGroup);

        const popupTagClass = isOnSite ? 'tag-onsite' : 'tag-brigade';
        const popupTagText = isOnSite ? 'BRIGADISTA EN FAENA' : 'FURGONETA EN TRASLADO';
        const statusDetail = isOnSite
          ? 'Personal técnico trabajando en el lugar'
          : `Llegada estimada en ~${brigade.etaMinutes || 8} min al punto`;

        const brigadePopupHtml = `
          <div class="map-popup-plaque">
            <div class="popup-tag ${popupTagClass}">${popupTagText}</div>
            <div class="popup-id">${outage.id}</div>
            <div class="popup-title">${brigade.leadName}</div>
            <div class="popup-meta">
              <span><strong>${statusDetail}</strong></span>
            </div>
            <div class="popup-submeta">
              <span>Móvil: ${brigade.vehicle?.model || 'Furgoneta Técnica'} (${brigade.vehicle?.plate || '—'})</span>
            </div>
            <button class="popup-cta-btn" onclick="window.selectOutageFromMap('${outage.id}')">
              Ver estado del corte y reposición
            </button>
          </div>
        `;

        brigadeMarker.bindPopup(brigadePopupHtml, {
          className: 'tesla-map-popup',
          maxWidth: 290,
        });

        brigadeMarker.on('click', () => {
          if (_onSelectOutageCallback) _onSelectOutageCallback(outage.id);
        });

        _vehicleMarkersMap.set(outage.id, brigadeMarker);

        // Si este corte está seleccionado y la furgoneta está en traslado, trazar ruta
        if (isSelected && !isOnSite && outage.center) {
          _routeLine = L.polyline([[brigade.location.lat, brigade.location.lng], [outage.center.lat, outage.center.lng]], {
            color: '#2563eb',
            weight: 3,
            opacity: 0.85,
            dashArray: '8 6',
            lineCap: 'round',
          }).addTo(_map);
        }
      }
    });
  }

  // ─── Renderizado y Actualización de Móvil de Brigada y Ruta ─────────────────

  function renderBrigadeVehicle(brigade, destination, outageId = null) {
    if (!brigade || !brigade.location) return;

    const { lat, lng } = brigade.location;
    const isOnSite = brigade.status === 'on_site';

    let marker = outageId ? _vehicleMarkersMap.get(outageId) : null;
    if (!marker && _vehicleMarkersMap.size > 0) {
      marker = _vehicleMarkersMap.values().next().value;
    }

    if (marker) {
      animateMarker(marker, [lat, lng]);

      // Si cambió de estado dinámicamente, actualizar icono
      const newIcon = isOnSite
        ? createBrigadeOnSiteIcon(brigade.leadName, true)
        : createVanIcon(brigade.vehicle?.plate, true);
      marker.setIcon(newIcon);
    }

    if (destination && !isOnSite) {
      if (_routeLine) _map.removeLayer(_routeLine);

      _routeLine = L.polyline([[lat, lng], [destination.lat, destination.lng]], {
        color: '#2563eb',
        weight: 3,
        opacity: 0.85,
        dashArray: '8 6',
        lineCap: 'round',
      }).addTo(_map);
    } else if (isOnSite && _routeLine) {
      _map.removeLayer(_routeLine);
      _routeLine = null;
    }
  }

  function clearVehicleAndRoute() {
    _brigadesGroup.clearLayers();
    _vehicleMarkersMap.clear();
    if (_routeLine) {
      _map.removeLayer(_routeLine);
      _routeLine = null;
    }
  }

    // ─── Zoom enfocado en corte ────────────────────────────────────────────────

  function focusOnOutage(outage) {
    if (!_map || !outage) return;

    if (outage.polygon && outage.polygon.coordinates) {
      const latLngs = outage.polygon.coordinates[0].map(([lng, lat]) => [lat, lng]);
      const bounds = L.latLngBounds(latLngs);
      _map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true });
    } else {
      _map.setView([outage.center.lat, outage.center.lng], 15, { animate: true });
    }
  }

  // ─── Geolocalización de Usuario ("Mi Ubicación") ───────────────────────────

  /**
   * Obtiene la ubicación del usuario mediante navigator.geolocation
   * y coloca un marcador con pulso Tesla Blue.
   */
  async function locateUser(outages = []) {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ success: false, message: 'Geolocalización no soportada por el navegador.' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          renderUserMarker(lat, lng);
          const assessment = checkUserAffected(lat, lng, outages);

          _map.flyTo([lat, lng], 14, { duration: 1.2 });
          resolve({ success: true, coords: { lat, lng }, ...assessment });
        },
        (error) => {
          // Si el usuario bloquea GPS o está en entorno local sin https,
          // usamos simulación estratégica en Temuco para fines de prototipo
          const fallbackLat = -38.7410;
          const fallbackLng = -72.5890;

          renderUserMarker(fallbackLat, fallbackLng);
          const assessment = checkUserAffected(fallbackLat, fallbackLng, outages);

          _map.flyTo([fallbackLat, fallbackLng], 14, { duration: 1.2 });
          resolve({
            success: true,
            coords: { lat: fallbackLat, lng: fallbackLng },
            isDemo: true,
            ...assessment,
          });
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    });
  }

  function renderUserMarker(lat, lng) {
    if (_userLocationMarker) {
      _userLocationMarker.setLatLng([lat, lng]);
    } else {
      _userLocationMarker = L.marker([lat, lng], {
        icon: createUserLocationIcon(),
        zIndexOffset: 1200,
      }).addTo(_map);

      _userLocationMarker.bindPopup(`
        <div class="map-popup-plaque">
          <div class="popup-tag tag-user">MI UBICACIÓN</div>
          <div class="popup-title">Tu posición actual</div>
          <div class="popup-meta">Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}</div>
        </div>
      `, { className: 'tesla-map-popup' });
    }
  }

  /**
   * Algoritmo de punto en polígono (Ray Casting) para verificar afectación
   */
  function checkUserAffected(lat, lng, outages) {
    for (const outage of outages) {
      if (outage.polygon && outage.polygon.coordinates) {
        const polyCoords = outage.polygon.coordinates[0]; // [ [lng, lat], ... ]
        if (isPointInPolygon(lng, lat, polyCoords)) {
          return { inAffectedZone: true, outage };
        }
      }
    }
    return { inAffectedZone: false, outage: null };
  }

  function isPointInPolygon(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1];
      const xj = poly[j][0], yj = poly[j][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // ─── Animación suave de marcador ───────────────────────────────────────────

  function animateMarker(marker, newLatLng) {
    const start = marker.getLatLng();
    const end = L.latLng(newLatLng);
    const duration = 600;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      marker.setLatLng([
        start.lat + (end.lat - start.lat) * eased,
        start.lng + (end.lng - start.lng) * eased,
      ]);

      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  return {
    init,
    renderOutages,
    renderBrigadeVehicle,
    focusOnOutage,
    locateUser,
    getMap: () => _map,
  };
})();

if (typeof window !== 'undefined') {
  window.MapManager = MapManager;
}

export { MapManager };

