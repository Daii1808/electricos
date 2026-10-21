/**
 * ─────────────────────────────────────────────────────
 *  showroom.js — Navegación y scroll fluido para el Showroom
 *  Conecta el navbar flotante, dropdowns y anclas de forma robusta.
 * ─────────────────────────────────────────────────────
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.tesla-snap-container');

  // 1. Manejo de scroll suave en enlaces tipo ancla (#...)
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href').substring(1);
      if (!targetId) return;

      const targetEl = document.getElementById(targetId);
      if (targetEl && container) {
        e.preventDefault();
        container.scrollTo({
          top: targetEl.offsetTop,
          behavior: 'smooth',
        });
        history.pushState(null, null, `#${targetId}`);
      }
    });
  });

  // 2. Soporte para dropdown de Distribución en dispositivos táctiles / click
  const dropdownItem = document.querySelector('.tesla-dropdown');
  if (dropdownItem) {
    const dropdownToggle = dropdownItem.querySelector('a');
    if (dropdownToggle) {
      dropdownToggle.addEventListener('click', (e) => {
        // En pantallas móviles permite abrir/cerrar dropdown
        if (window.innerWidth <= 900) {
          e.preventDefault();
          dropdownItem.classList.toggle('open');
        }
      });
    }
  }

  // 3. Indicador de sección activa durante el scroll
  if (container) {
    const sections = document.querySelectorAll('.tesla-hero-section');
    const navItems = document.querySelectorAll('.tesla-nav-item');

    container.addEventListener('scroll', () => {
      const scrollPos = container.scrollTop + window.innerHeight / 3;

      sections.forEach(sec => {
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        const id = sec.getAttribute('id');

        if (scrollPos >= top && scrollPos < top + height) {
          navItems.forEach(item => {
            const link = item.querySelector('a');
            if (link && link.getAttribute('href') === `#${id}`) {
              navItems.forEach(i => i.classList.remove('active'));
              item.classList.add('active');
            }
          });
        }
      });
    }, { passive: true });
  }
});
