# electricos

Prototipo de plataforma de información, mapa de cortes de suministro eléctrico y geolocalización en tiempo real inspirado en SAESA / Crell.

## ⚡ Características del Prototipo

- **Mapa Interactivo con Leaflet**: Visualización de zonas de falla, polígonos de afectación y trazabilidad de brigadas.
- **Geolocalización**: Ubicación de incidentes, clientes y cuadrillas en ruta con cálculo de tiempos estimados de reposición (ETR).
- **Portal de Brigadistas**: Interfaz para cuadrillas en terreno para actualizar el estado del servicio y reportar avances.
- **Multidistribuidora**: Soporte visual e identidad corporativa para Grupo Saesa y Crell.
- **Modo Claro / Oscuro**: Interfaz adaptativa accesible para visualización diurna y nocturna.

## 📁 Estructura del Proyecto

```text
├── assets/                 # Recursos gráficos, íconos y marcadores del mapa
├── css/                    # Hojas de estilo modulares (main, components, map, brigadista)
├── data/                   # Datos mock GeoJSON y registros de cortes para prototipado
│   └── geojson/            # Polígonos de zonas afectadas y trazados
├── js/                     # Lógica de la aplicación
│   ├── api.js              # Capa de datos y simulación de endpoints
│   ├── config.js           # Parámetros globales y configuración de distribuidoras
│   ├── map.js              # Inicialización y capas del mapa Leaflet
│   ├── theme.js            # Selector de tema oscuro/claro
│   └── ui.js               # Controladores de interfaz de usuario
├── brigadista.html         # Portal de gestión en terreno para brigadas
├── index.html              # Vista pública para clientes y mapa interactivo
├── package.json            # Dependencias de desarrollo (Vite)
└── README.md               # Documentación general
```

## 🚀 Inicio Rápido

Para ejecutar el servidor de desarrollo local:

```bash
npm install
npm run dev
```

Abra `http://localhost:5173` en su navegador.
