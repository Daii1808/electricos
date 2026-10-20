# electricos — Plataforma Grupo Saesa (Rediseño Tesla Showroom)

Recreación integral del portal web corporativo y de servicios de **Grupo Saesa** y sus filiales, basada en la arquitectura de información oficial ([web.gruposaesa.cl](https://web.gruposaesa.cl)) e implementada bajo el sistema de diseño minimalista de alto impacto **Tesla Style Reference** (`DESIGN.md`).

---

## ⚡ Estructura y Secciones Recreadas

### 1. 🏠 Inicio (Hub Corporativo Grupo Saesa) — [`index.html`](file:///c:/Users/lilsh/OneDrive/Escritorio/Proyectos/Corte-electrico-20261020T010442Z-1-001/index.html)
- Presentación vertical en pantalla completa (*full-bleed scrolling showroom* con snapping de scroll suave).
- Visión integral de la infraestructura del sur: **1.094.000+ clientes**, **3.264 km de transmisión**, **275 MW de capacidad** y **99.4% de operatividad**.
- Acceso directo a cada unidad de negocio y al mapa interactivo en tiempo real.

### 2. 🌊 Saesa Generación — [`generacion.html`](file:///c:/Users/lilsh/OneDrive/Escritorio/Proyectos/Corte-electrico-20261020T010442Z-1-001/generacion.html)
- **Parque Fotovoltaico El Blanco (Aysén):** La planta solar más austral del planeta.
- **Centrales Hidroeléctricas de Pasada:** 14 centrales sustentables sin embalses de inundación en ríos del sur.
- **Sistemas Medianos y Aislados:** Microrredes híbridas para Melinka, Chaitén, Puerto Cisnes y Caleta Tortel.

### 3. ⚡ Saesa Transmisión — [`transmision.html`](file:///c:/Users/lilsh/OneDrive/Escritorio/Proyectos/Corte-electrico-20261020T010442Z-1-001/transmision.html)
- **Red Troncal y Zonal:** 3.264 km de líneas de 66 a 220 kV conectando desde Antofagasta hasta Los Lagos.
- **110 Subestaciones Eléctricas:** Automatización digital con protocolo IEC 61850 y telecontrol SCADA en milisegundos.
- **BESS Nueva Imperial:** Banco de almacenamiento en baterías de iones de litio a gran escala para estabilidad del Sistema Eléctrico Nacional (SEN).

### 4. 🔌 Distribución Austral — [`distribucion.html`](file:///c:/Users/lilsh/OneDrive/Escritorio/Proyectos/Corte-electrico-20261020T010442Z-1-001/distribucion.html)
- **Saesa:** 480.000+ clientes en Los Ríos y Los Lagos (Valdivia, Puerto Montt, Chiloé).
- **Frontel:** 360.000+ clientes en Biobío y La Araucanía; líder histórico en electrificación rural de comunidades.
- **Edelaysen:** 40.000+ clientes en la Patagonia de Aysén; sistemas aislados extremos.
- **Luz Osorno:** 90.000+ clientes en la Provincia de Osorno; redes urbanas blindadas y excelencia en continuidad.
- Selector interactivo de filial en la barra superior.

### 5. 🗺️ Mapa de Desconexiones en Vivo — [`mapa-desconexiones.html`](file:///c:/Users/lilsh/OneDrive/Escritorio/Proyectos/Corte-electrico-20261020T010442Z-1-001/mapa-desconexiones.html)
- Herramienta interactiva con mapas CartoDB/Leaflet.
- Consulta de suministro por **N° de Cliente** o **Comuna**.
- Detección de **"📍 Mi Ubicación"** mediante radar GPS con verificación de afectación en polígonos.
- Filtro entre *Emergencias / No Programadas* y *Trabajos Programados*.
- Telemetría en tiempo real de móviles y cuadrillas técnicas.
- Modal de reporte ciudadano *"⚠️ Estoy sin luz"*.

### 6. 🔧 Portal del Brigadista — [`brigadista.html`](file:///c:/Users/lilsh/OneDrive/Escritorio/Proyectos/Corte-electrico-20261020T010442Z-1-001/brigadista.html)
- Plataforma de acceso para técnicos en terreno, reporte de estado de faenas y cierre de tickets.

---

## 🎨 Sistema de Diseño (`DESIGN.md`)

- **Paleta de Colores Tesla:**
  - `Tesla Blue (#3e6ae1)`: Reservado para CTAs principales de interacción alta.
  - `Pure White (#ffffff)` y `Off-White (#eeeeee)`: Tarjetas, textos e indicadores sobre fotos.
  - `Onyx (#171a20)` y `Charcoal (#393c41)`: Tipografía neutra y técnica sin adornos.
  - `Light Border (#cccccc)` y `Steel (#5c5e62)`: Líneas tenues de demarcación.
- **Rejilla Base de 4px:** Radios de 4px para botones e inputs, 8px para placas y modales.
- **Tipografía:** Universal Sans / Inter con pesos 400 y 500, escala visual jerárquica y strips de especificaciones técnicas.

---

## 🚀 Inicio Rápido

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` para navegar por toda la plataforma showroom.
