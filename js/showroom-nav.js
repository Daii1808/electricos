/**
 * ─────────────────────────────────────────────────────
 *  showroom-nav.js — Script de reemplazo de navbar
 *  Inyecta el dropdown de navegacion en las paginas que
 *  usan el navbar simplificado (generacion, transmision, distribucion)
 * ─────────────────────────────────────────────────────
 */

const DROPDOWN_TEMPLATE = (activeItem) => {
  const pages = [
    { id: 'inicio',      href: 'index.html',              label: 'Inicio' },
    { id: 'generacion',  href: 'generacion.html',         label: 'Generación' },
    { id: 'transmision', href: 'transmision.html',        label: 'Transmisión' },
    { id: 'mapa',        href: 'mapa-desconexiones.html', label: 'Mapa Desconexiones' },
  ];

  const navItems = pages.map(p => `
    <li class="tesla-nav-item ${activeItem === p.id ? 'active' : ''}">
      <a href="${p.href}">${p.label}</a>
    </li>
  `).join('');

  const filiales = [
    { href: 'saesa.html',     title: 'Saesa',      sub: 'Los Ríos y Los Lagos' },
    { href: 'frontel.html',   title: 'Frontel',    sub: 'Biobío y La Araucanía' },
    { href: 'edelaysen.html', title: 'Edelaysen',  sub: 'Región de Aysén' },
    { href: 'luz-osorno.html',title: 'Luz Osorno', sub: 'Provincia de Osorno' },
  ];

  const isDistribucion = ['distribucion','saesa','frontel','edelaysen','luzosorno'].includes(activeItem);

  const dropdownItems = filiales.map(f => {
    const isCurrentFilial = window.location.pathname.includes(f.href.replace('.html',''));
    return `
      <a href="${f.href}" class="dropdown-link" ${isCurrentFilial ? 'style="background:rgba(255,255,255,0.12);"' : ''}>
        <span class="dropdown-link-title">${f.title}</span>
        <span class="dropdown-link-sub">${f.sub}</span>
      </a>
    `;
  }).join('');

  return `
    <ul class="tesla-nav-links">
      ${navItems}
      <li class="tesla-nav-item tesla-dropdown ${isDistribucion ? 'active' : ''}">
        <a href="distribucion.html">Distribución ▾</a>
        <div class="tesla-dropdown-menu">
          <a href="distribucion.html" class="dropdown-link">
            <span class="dropdown-link-title">Todas las Distribuidoras</span>
            <span class="dropdown-link-sub">Resumen general del área</span>
          </a>
          <div class="dropdown-divider"></div>
          ${dropdownItems}
        </div>
      </li>
    </ul>
  `;
};
