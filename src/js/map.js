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
  let _vehicleMarker = null;
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
   * Ícono para el vehículo de la brigada en terreno
   */
  function createTruckIcon(plate = '') {
    const html = `
      <div class="map-truck-marker">
        <div class="map-truck-pulse"></div>
        <div class="map-truck-body">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
          ${plate ? `<span class="truck-plate-label">${plate}</span>` : ''}
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-truck-div-icon',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
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

    // Layer CartoDB Positron / OSM
    _tileLayer = L.tileLayer(tileUrl, {
      attribution: tileAttribution,
      maxZoom,
    }).addTo(_map);

    // Controles de zoom abajo a la derecha
    L.control.zoom({ position: 'bottomright' }).addTo(_map);

    // Atribución compacta abajo a la izquierda
    _map.attributionControl.setPosition('bottomleft');

    // Grupos de capas
    _polygonsGroup = L.featureGroup().addTo(_map);
    _markersGroup = L.featureGroup().addTo(_map);

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

    let selectedOutage = null;

    outages.forEach(outage => {
      const isSelected = outage.id === selectedId;
      if (isSelected) selectedOutage = outage;

      // 1. Polígono de la zona afectada
      if (outage.polygon && outage.polygon.coordinates) {
        const latLngs = outage.polygon.coordinates[0].map(([lng, lat]) => [lat, lng]);
        const isEmergency = outage.type === 'no_programada';

        const polygon = L.polygon(latLngs, {
          color: isSelected ? (isEmergency ? '#DC2626' : '#3e6ae1') : '#5c5e62',
          fillColor: isEmergency ? '#DC2626' : '#3e6ae1',
          fillOpacity: isSelected ? 0.22 : 0.08,
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

      // Popup técnico minimalista estilo plaque
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
    });

    // 3. Renderizar móvil y ruta del corte seleccionado
    if (selectedOutage && selectedOutage.brigade) {
      renderBrigadeVehicle(selectedOutage.brigade, selectedOutage.center);
    } else {
      clearVehicleAndRoute();
    }
  }

  // ─── Renderizado de Móvil de Brigada y Ruta ────────────────────────────────

  function renderBrigadeVehicle(brigade, destination) {
    if (!brigade || !brigade.location) return;

    const { lat, lng } = brigade.location;

    if (_vehicleMarker) {
      animateMarker(_vehicleMarker, [lat, lng]);
    } else {
      _vehicleMarker = L.marker([lat, lng], {
        icon: createTruckIcon(brigade.vehicle?.plate),
        zIndexOffset: 1000,
      }).addTo(_map);

      _vehicleMarker.bindPopup(`
        <div class="map-popup-plaque">
          <div class="popup-tag tag-brigade">MÓVIL EN RUTA</div>
          <div class="popup-title">${brigade.leadName}</div>
          <div class="popup-meta">
            <span>${brigade.vehicle?.model} (${brigade.vehicle?.plate})</span>
          </div>
        </div>
      `, { className: 'tesla-map-popup' });
    }

    // Ruta estimada al punto de falla
    if (destination) {
      if (_routeLine) _map.removeLayer(_routeLine);

      _routeLine = L.polyline([[lat, lng], [destination.lat, destination.lng]], {
        color: '#3e6ae1', // Tesla Blue
        weight: 3,
        opacity: 0.85,
        dashArray: '8 6',
        lineCap: 'round',
      }).addTo(_map);
    }
  }

  function clearVehicleAndRoute() {
    if (_vehicleMarker) {
      _map.removeLayer(_vehicleMarker);
      _vehicleMarker = null;
    }
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

