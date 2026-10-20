# electricos

Plataforma de visualización, mapa de desconexiones eléctricas en tiempo real y geolocalización inspirada en la sección oficial de **Grupo Saesa / Crell** ([web.gruposaesa.cl](https://web.gruposaesa.cl/web/saesa/mapa-desconexiones)) y construida bajo el sistema de diseño minimalista de alto impacto **Tesla Style Reference** (`DESIGN.md`).

---

## ⚡ Novedades y Características

### 1. Sistema de Diseño Técnico Minimalista (Tokens Tesla `DESIGN.md`)
- **Paleta Acromática de Alta Fidelidad:**
  - `Tesla Blue (#3e6ae1)`: Reservado de manera exclusiva para llamadas a la acción primarias (CTAs) como *Consultar servicio* e ingresar reportes.
  - `Pure White (#ffffff)` y `Off-White (#eeeeee)`: Superficies de tarjetas y placas de información técnica.
  - `Onyx (#171a20)` y `Charcoal (#393c41)`: Tipografía principal de alta legibilidad técnica.
  - `Light Border (#cccccc)` y `Steel (#5c5e62)`: Líneas sutiles de delimitación sin sombras pesadas.
- **Geometría y Rejilla:** Rejilla base de 4px, radios técnicos de 4px para botones e inputs, y 8px para placas y modales.
- **Foco en el Producto:** La interfaz actúa como placas funcionales mínimas que ceden el protagonismo al mapa en vivo y a los datos de telemetría.

### 2. Mapa de Desconexiones (Funcionalidades Grupo Saesa / Crell)
- **Consulta Rápida por N° de Cliente o Comuna:** Input directo para consultar el estado del suministro ingresando el número de servicio o la comuna.
- **Geolocalización en Vivo ("📍 Mi Ubicación"):**
  - Detección GPS del usuario con efecto radar Tesla Blue.
  - Algoritmo de punto en polígono (Ray Casting) para verificar en tiempo real si el usuario está dentro de una zona afectada o si cuenta con suministro normal.
- **Filtro de Desconexiones:**
  - **⚡ Emergencias (No programadas):** Caída de ramas, postes chocados, fallas imprevistas.
  - **🛠️ Desconexiones Programadas:** Trabajos de mantenimiento preventivo y mejoras con aviso previo.
  - **Filtro por Comuna:** Temuco, Valdivia, Osorno, Puerto Montt, Puerto Varas, Castro, Coyhaique.
  - **Selector de Empresa / Filial:** Grupo Saesa (Saesa, Frontel, Luz Osorno, Edelaysen) y Crell.
- **KPIs de Red en Tiempo Real:** Porcentaje de operatividad (99.4%), total de sectores con corte, clientes afectados y brigadas en terreno.
- **Telemetría de Brigadas Móviles:** Cuadrilla asignada, patente del móvil técnico, velocidad, ruta calculada y tiempo estimado de llegada (ETA).
- **Reporte "Estoy sin luz":** Modal de ingreso de reportes de interrupción en 2 pasos con geolocalización.

---

## 📁 Estructura del Proyecto

```text
├── css/
│   ├── main.css              # Tokens DESIGN.md, reset, header, consultation bar, KPIs
│   ├── components.css        # Placas de corte, cuenta regresiva, ficha brigada, modal
│   ├── map.css               # Capas CartoDB/Leaflet, marcadores, radar GPS y popups
│   └── brigadista.css        # Portal de cuadrillas en terreno
├── js/
│   ├── config.js             # Parámetros globales, endpoints, filiales y KPIs
│   ├── api.js                # Gestión de datos, cortes múltiples, simulación y reportes
│   ├── map.js                # Leaflet, trazado de polígonos, GPS de móvil y geolocalización
│   ├── theme.js              # Selector de tema claro/oscuro
│   ├── ui.js                 # Controladores de interfaz y notificaciones Toast
│   └── main.js               # Bootstrap, filtros interactivos y búsqueda
├── data/
│   ├── cortes-ejemplo.json   # Datos de muestra de la red sur
│   └── geojson/              # Polígonos GeoJSON de zonas afectadas
├── index.html                # Plataforma pública y mapa interactivo
├── brigadista.html           # Portal para técnicos en terreno
├── Inspiracion_Diseño.md     # Guía y especificación de diseño Tesla (DESIGN.md)
└── README.md
```

---

## 🚀 Inicio Rápido

Para iniciar el servidor de desarrollo local:

```bash
npm install
npm run dev
```

Visita `http://localhost:5173` en tu navegador.
