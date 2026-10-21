import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'public',
  plugins: [
    {
      name: 'dev-html-rewrites',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url.split('?')[0];
          const pages = [
            'generacion',
            'transmision',
            'distribucion',
            'saesa',
            'frontel',
            'edelaysen',
            'luz-osorno',
            'mapa-desconexiones',
            'brigadista',
          ];
          for (const page of pages) {
            if (url === `/${page}` || url === `/${page}.html`) {
              const query = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
              req.url = `/pages/${page}.html` + query;
              break;
            }
          }
          next();
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        generacion: resolve(import.meta.dirname, 'pages/generacion.html'),
        transmision: resolve(import.meta.dirname, 'pages/transmision.html'),
        distribucion: resolve(import.meta.dirname, 'pages/distribucion.html'),
        saesa: resolve(import.meta.dirname, 'pages/saesa.html'),
        frontel: resolve(import.meta.dirname, 'pages/frontel.html'),
        edelaysen: resolve(import.meta.dirname, 'pages/edelaysen.html'),
        luzOsorno: resolve(import.meta.dirname, 'pages/luz-osorno.html'),
        mapaDesconexiones: resolve(import.meta.dirname, 'pages/mapa-desconexiones.html'),
        brigadista: resolve(import.meta.dirname, 'pages/brigadista.html'),
      },
    },
  },
});
