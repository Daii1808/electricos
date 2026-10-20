import { resolve } from 'path';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

function copyStaticDirPlugin(dir) {
  return {
    name: `copy-${dir}`,
    closeBundle() {
      const src = resolve(import.meta.dirname, dir);
      const dest = resolve(import.meta.dirname, 'dist', dir);
      if (fs.existsSync(src)) {
        fs.cpSync(src, dest, { recursive: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [
    copyStaticDirPlugin('js'),
    copyStaticDirPlugin('data'),
    copyStaticDirPlugin('assets'),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        generacion: resolve(import.meta.dirname, 'generacion.html'),
        transmision: resolve(import.meta.dirname, 'transmision.html'),
        distribucion: resolve(import.meta.dirname, 'distribucion.html'),
        saesa: resolve(import.meta.dirname, 'saesa.html'),
        frontel: resolve(import.meta.dirname, 'frontel.html'),
        edelaysen: resolve(import.meta.dirname, 'edelaysen.html'),
        luzOsorno: resolve(import.meta.dirname, 'luz-osorno.html'),
        mapaDesconexiones: resolve(import.meta.dirname, 'mapa-desconexiones.html'),
        brigadista: resolve(import.meta.dirname, 'brigadista.html'),
      },
    },
  },
});
