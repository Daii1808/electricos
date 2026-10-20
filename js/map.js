/**
 * ─────────────────────────────────────────────────────
 *  map.js — Módulo del mapa interactivo (Leaflet.js)
 *  Gestiona: tiles OSM, polígono afectado, marcador de
 *  vehículo, ruta estimada y punto de corte.
 * ─────────────────────────────────────────────────────
 */

'use strict';

const MapManager = (() => {
  let _map         = null;   // Instancia de Leaflet
  let _vehicleMarker = null; // Marcador de la brigada
  let _outageMarker  = null; // Marcador del punto de corte
  let _routeLine     = null; // Polyline de ruta
  let _affectedZone  = null; // Polígono de zona afectada

  // ─── SVG Icons ────────────────────────────────────────────────────────────

  /** Ícono personalizado para el vehículo de la brigada */
  function createTruckIcon() {
    const svgHtml = `
      <div class="map-truck-marker">
        <div class="map-truck-pulse"></div>
        <div class="map-truck-icon">
          <svg viewBox="0 0 40 40" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="19" fill="#FF6B00" stroke="white" stroke-width="2"/>
            <text x="20" y="26" text-anchor="middle" font-size="18" fill="white">🚐</text>
          </svg>
        </div>
      </div>`;

    return L.divIcon({
      html: svgHtml,
      className: '',
      iconSize:   [44, 44],
      iconAnchor: [22, 22],
      popupAnchor:[0, -22],
    });
  }

  /** Ícono para el punto de corte / falla */
  function createOutageIcon() {
    const svgHtml = `
      <div class="map-outage-marker">
        <div class="map-outage-pulse"></div>
        <div class="map-outage-icon">
          <svg viewBox="0 0 44 44" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
            <circle cx="22" cy="22" r="20" fill="#DC2626" stroke="white" stroke-width="2.5"/>
            <text x="22" y="29" text-anchor="middle" font-size="20" fill="white">⚡</text>
          </svg>
        </div>
      </div>`;

    return L.divIcon({
      html: svgHtml,
      className: '',
      iconSize:   [44, 44],
      iconAnchor: [22, 22],
      popupAnchor:[0, -26],
    });
  }

  // ─── Inicialización ────────────────────────────────────────────────────────

  /**
   * Inicializa el mapa Leaflet en el contenedor #map.
   */
  function init() {
    const { defaultCenter, defaultZoom, minZoom, maxZoom, tileUrl, tileAttribution } = CONFIG.MAP;

    _map = L.map('map', {
      center: defaultCenter,
      zoom: defaultZoom,
      minZoom,
      maxZoom,
      zoomControl: false,
      attributionControl: true,
    });

    // Tiles de OpenStreetMap — sin API key requerida
    L.tileLayer(tileUrl, {
      attribution: tileAttribution,
      maxZoom,
    }).addTo(_map);

    // Control de zoom en esquina inferior derecha
    L.control.zoom({ position: 'bottomright' }).addTo(_map);

    // Atribución en esquina inferior izquierda
    _map.attributionControl.setPosition('bottomleft');

    return _map;
  }

  // ─── Zona afectada ────────────────────────────────────────────────────────

  /**
   * Dibuja el polígono de la zona afectada y hace zoom sobre él.
   * @param {Object} geoJsonPolygon — GeoJSON de tipo Polygon
   */
  function renderAffectedArea(geoJsonPolygon) {
    if (_affectedZone) {
      _map.removeLayer(_affectedZone);
    }

    // Leaflet usa [lat, lng], GeoJSON usa [lng, lat] — invertimos
    const latLngs = geoJsonPolygon.coordinates[0].map(([lng, lat]) => [lat, lng]);

    _affectedZone = L.polygon(latLngs, {
      color:       '#DC2626',
      fillColor:   '#FF4444',
      fillOpacity: 0.18,
      weight:      2.5,
      dashArray:   '6 4',
      lineCap:     'round',
    }).addTo(_map);

    _affectedZone.bindPopup(
      '<strong>⚡ Zona sin suministro eléctrico</strong><br>Trabajo de reposición en curso.',
      { className: 'map-popup' }
    );

    // Centrar mapa en la zona afectada
    _map.fitBounds(_affectedZone.getBounds(), { padding: [60, 60] });
  }

  // ─── Punto de corte ───────────────────────────────────────────────────────

  /**
   * Agrega o mueve el marcador del punto de corte.
   * @param {{ lat: number, lng: number }} position
   * @param {string} reason — Motivo del corte
   */
  function renderOutagePoint(position, reason = 'Punto de corte') {
    if (_outageMarker) {
      _outageMarker.setLatLng([position.lat, position.lng]);
    } else {
      _outageMarker = L.marker([position.lat, position.lng], {
        icon: createOutageIcon(),
        zIndexOffset: 500,
      }).addTo(_map);

      _outageMarker.bindPopup(
        `<div class="map-popup-content">
          <strong>⚡ Punto de falla detectado</strong><br>
          <span>${reason}</span>
        </div>`,
        { className: 'map-popup' }
      );
    }
  }

  // ─── Vehículo de brigada ──────────────────────────────────────────────────

  /**
   * Agrega o mueve el marcador del vehículo de la brigada.
   * @param {{ lat: number, lng: number }} position
   * @param {string} brigadeName
   */
  function renderVehicle(position, brigadeName = 'Brigada asignada') {
    if (_vehicleMarker) {
      // Animación suave de transición de posición
      animateMarker(_vehicleMarker, [position.lat, position.lng]);
    } else {
      _vehicleMarker = L.marker([position.lat, position.lng], {
        icon: createTruckIcon(),
        zIndexOffset: 1000,
      }).addTo(_map);

      _vehicleMarker.bindPopup(
        `<div class="map-popup-content">
          <strong>🚐 ${brigadeName}</strong><br>
          <span>En ruta al punto de falla</span>
        </div>`,
        { className: 'map-popup' }
      );
    }

    // Actualizar ruta desde vehículo al punto de falla
    if (_outageMarker) {
      renderRoute(
        [position.lat, position.lng],
        _outageMarker.getLatLng()
      );
    }
  }

  // ─── Ruta estimada ────────────────────────────────────────────────────────

  /**
   * Dibuja la línea de ruta entre el vehículo y el punto de corte.
   * @param {[number, number]} from — [lat, lng] origen
   * @param {L.LatLng} to — destino
   */
  function renderRoute(from, to) {
    if (_routeLine) {
      _map.removeLayer(_routeLine);
    }

    _routeLine = L.polyline([from, [to.lat, to.lng]], {
      color:     '#FF6B00',
      weight:    3.5,
      opacity:   0.85,
      dashArray: '10 6',
      lineCap:   'round',
      lineJoin:  'round',
    }).addTo(_map);
  }

  // ─── Animación suave de marcador ─────────────────────────────────────────

  /**
   * Interpola suavemente la posición de un marcador (60 FPS, 800ms).
   * @param {L.Marker} marker
   * @param {[number, number]} newLatLng
   */
  function animateMarker(marker, newLatLng) {
    const start   = marker.getLatLng();
    const end     = L.latLng(newLatLng);
    const duration = 800;
    const startTime = performance.now();

    function step(now) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = easeInOut(progress);

      marker.setLatLng([
        start.lat + (end.lat - start.lat) * eased,
        start.lng + (end.lng - start.lng) * eased,
      ]);

      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  /** Función de easing cúbico */
  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // ─── API pública ──────────────────────────────────────────────────────────

  return {
    init,
    renderAffectedArea,
    renderOutagePoint,
    renderVehicle,
    getMap: () => _map,
  };
})();
