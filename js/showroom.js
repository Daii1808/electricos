/**
 * ─────────────────────────────────────────────────────
 *  showroom.js — Lógica de navegación y scroll del showroom Tesla
 *  Garantiza que todos los enlaces del menú superior y anclas
 *  se conecten y desplacen fluidamente sin errores.
 * ─────────────────────────────────────────────────────
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.tesla-snap-container');

  // 1. Manejador de scroll suave para anclas dentro del showroom
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href').substring(1);
      if (!targetId) return;

      const targetElement = document.getElementById(targetId);
      if (targetElement && container) {
        e.preventDefault();
        container.scrollTo({
          top: targetElement.offsetTop,
          behavior: 'smooth',
        });

        // Actualizar URL sin recargar
        history.pushState(null, null, `#${targetId}`);
      }
    });
  });

  // 2. Si la URL ya viene con un hash (#hero-generacion, etc.), navegar a él
  if (window.location.hash && container) {
    const initialTarget = document.getElementById(window.location.hash.substring(1));
    if (initialTarget) {
      setTimeout(() => {
        container.scrollTo({
          top: initialTarget.offsetTop,
          behavior: 'smooth',
        });
      }, 100);
    }
  }

  // 3. Indicador dinámico de sección activa según el scroll
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
