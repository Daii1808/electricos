# Plataforma Grupo Saesa — Rediseño Tesla Showroom

Recreación integral del portal web corporativo y de servicios de **Grupo Saesa** y sus filiales, basada en la arquitectura de información oficial ([web.gruposaesa.cl](https://web.gruposaesa.cl)) e implementada bajo el sistema de diseño minimalista de alto impacto **Tesla Style Reference** (`docs/Inspiracion_Diseno.md`).

---

## Arquitectura del Proyecto

El frontend se encuentra organizado de forma modular y desacoplada:

```
.
├── docs/                      # Guías de diseño, especificaciones y referencias
│   └── Inspiracion_Diseno.md
├── pages/                     # Vistas y submódulos de la plataforma
│   ├── brigadista.html        # Portal operativo para cuadrillas técnicas
│   ├── distribucion.html      # Hub de distribución austral
│   ├── edelaysen.html         # Filial Aysén y Patagonia
│   ├── frontel.html           # Filial Biobío y La Araucanía
│   ├── generacion.html        # Matriz renovable y Parque Solar El Blanco
│   ├── luz-osorno.html        # Filial Provincia de Osorno
│   ├── mapa-desconexiones.html# Mapa interactivo de cortes y cuadrillas
│   ├── saesa.html             # Filial Los Ríos y Los Lagos
│   └── transmision.html       # Red de alta tensión y almacenamiento BESS
├── public/                    # Archivos estáticos servidos directamente
│   ├── assets/                # Íconos y recursos vectoriales
│   └── data/                  # GeoJSON de afectación y mocks de datos
├── src/                       # Código fuente procesado y optimizado por Vite
│   ├── css/                   # Hojas de estilo modulares
│   │   ├── brigadista.css
│   │   ├── components.css
│   │   ├── main.css
│   │   ├── map.css
│   │   └── tesla-showroom.css
│   └── js/                    # Módulos JavaScript (ES Modules)
│       ├── api.js
│       ├── brigadista-auth.js
│       ├── brigadista-portal.js
│       ├── config.js
│       ├── main.js
│       ├── map.js
│       ├── showroom.js
│       ├── theme.js
│       └── ui.js
├── index.html                 # Portal principal y punto de entrada
├── package.json               # Configuración de dependencias y scripts
├── vercel.json                # Rewrites para URLs amigables en producción
└── vite.config.js             # Configuración MPA, plugins y bundler
```

---

## Módulos y Secciones

### 1. Inicio (Hub Corporativo Grupo Saesa) — `index.html`
- Presentación vertical en pantalla completa (*full-bleed scrolling showroom* con snapping suave).
- Visión integral de la infraestructura del sur: 1.094.000+ clientes, 3.264 km de transmisión, 275 MW de capacidad y 99.4% de operatividad.
- Acceso directo a cada unidad de negocio y al mapa interactivo en tiempo real.

### 2. Saesa Generación — `pages/generacion.html`
- **Parque Fotovoltaico El Blanco (Aysén):** La planta solar más austral del planeta.
- **Centrales Hidroeléctricas de Pasada:** 14 centrales sustentables sin embalses de inundación en ríos del sur.
- **Sistemas Medianos y Aislados:** Microrredes híbridas para Melinka, Chaitén, Puerto Cisnes y Caleta Tortel.

### 3. Saesa Transmisión — `pages/transmision.html`
- **Red Troncal y Zonal:** 3.264 km de líneas de 66 a 220 kV conectando desde Antofagasta hasta Los Lagos.
- **110 Subestaciones Eléctricas:** Automatización digital con protocolo IEC 61850 y telecontrol SCADA en milisegundos.
- **BESS Nueva Imperial:** Banco de almacenamiento en baterías de iones de litio a gran escala para estabilidad del Sistema Eléctrico Nacional (SEN).

### 4. Distribución Austral — `pages/distribucion.html`
- **Saesa:** 480.000+ clientes en Los Ríos y Los Lagos (`pages/saesa.html`).
- **Frontel:** 360.000+ clientes en Biobío y La Araucanía (`pages/frontel.html`).
- **Edelaysen:** 40.000+ clientes en la Patagonia de Aysén (`pages/edelaysen.html`).
- **Luz Osorno:** 90.000+ clientes en la Provincia de Osorno (`pages/luz-osorno.html`).

### 5. Mapa de Desconexiones en Vivo — `pages/mapa-desconexiones.html`
- Herramienta interactiva con azulejos CartoDB Dark Matter y Leaflet.js.
- Consulta de suministro por N° de Cliente o Comuna.
- Detección de ubicación mediante radar GPS con verificación de afectación en polígonos.
- Filtro entre Emergencias / No Programadas y Trabajos Programados.
- Telemetría en tiempo real de móviles y cuadrillas técnicas.
- Formulario de reporte ciudadano de incidentes.

### 6. Portal del Brigadista — `pages/brigadista.html`
- Plataforma de acceso para técnicos en terreno, reporte de estado de faenas y cierre de tickets.

---

## Sistema de Diseño

- **Paleta de Colores Tesla Showroom:**
  - `Tesla Blue (#3e6ae1)`: Reservado para CTAs principales de interacción alta.
  - `Pure White (#ffffff)` y `Off-White (#eeeeee)`: Tarjetas, textos e indicadores sobre fotos.
  - `Onyx (#171a20)` y `Charcoal (#393c41)`: Tipografía neutra y técnica sin adornos.
  - `Light Border (#cccccc)` y `Steel (#5c5e62)`: Líneas tenues de demarcación.
- **Rejilla Base de 4px:** Radios de 4px para botones e inputs, 8px para placas y modales.
- **Tipografía:** Universal Sans / Inter con pesos 400 y 500, escala visual jerárquica y strips de especificaciones técnicas.

---

## Inicio Rápido

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` para navegar por toda la plataforma showroom.
Para compilar para producción:

```bash
npm run build
```
