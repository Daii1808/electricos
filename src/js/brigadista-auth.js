/**
 * ─────────────────────────────────────────────────────
 *  brigadista-auth.js — Módulo de autenticación
 *
 *  HOW TO CONNECT TO REAL BACKEND:
 *  1. Reemplaza MOCK_USERS con una llamada real a tu API.
 *  2. En AuthManager.login(), descomenta el fetch real.
 *  3. Guarda el token JWT en sessionStorage (no localStorage
 *     para mayor seguridad en dispositivos compartidos).
 * ─────────────────────────────────────────────────────
 */

'use strict';

const AuthManager = (() => {

  const SESSION_KEY = 'brigadista-session';

  // ─── Usuarios mock de demostración ────────────────────────────────────────
  // BACKEND: Eliminar este objeto — la validación será en el servidor.
  const MOCK_USERS = [
    {
      employeeId: 'EMP-12483',
      password:   'saesa2026',       // Solo para demo — nunca hardcodear en producción
      name:       'Carlos Andrés Fuentes Molina',
      role:       'Brigadista Eléctrico',
      brigade:    'BRG-045',
      companyId:  'saesa',
      assignedCase: 'CRT-2026-00847',
    },
    {
      employeeId: 'EMP-09341',
      password:   'crell2026',
      name:       'María Fernanda Quispe Ramos',
      role:       'Técnica de Terreno',
      brigade:    'BRG-017',
      companyId:  'crell',
      assignedCase: 'CRT-2026-00847',
    },
  ];

  // ─── Sesión activa ─────────────────────────────────────────────────────────

  /**
   * Intenta autenticar al usuario con sus credenciales.
   * @param {string} employeeId
   * @param {string} password
   * @returns {Promise<{ success: boolean, user?: Object, error?: string }>}
   */
  async function login(employeeId, password) {
    // ── MOCK (eliminar en producción) ──────────────────────────────────────
    await delay(900); // Simula latencia de red

    const user = MOCK_USERS.find(
      u => u.employeeId === employeeId.trim().toUpperCase() &&
           u.password   === password
    );

    if (!user) {
      return { success: false, error: 'ID de empleado o contraseña incorrectos.' };
    }

    // Guardar sesión (sin password)
    const session = {
      employeeId: user.employeeId,
      name:       user.name,
      role:       user.role,
      brigade:    user.brigade,
      companyId:  user.companyId,
      assignedCase: user.assignedCase,
      loginAt:    new Date().toISOString(),
      // BACKEND: aquí iría el token JWT devuelto por el servidor
      // token: response.token,
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true, user: session };

    // ── REAL (descomentar en producción) ──────────────────────────────────
    /*
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/api/v1/auth/brigadista/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Error de autenticación.' };
      }

      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
      return { success: true, user: data.session };
    } catch (err) {
      return { success: false, error: 'No se pudo conectar con el servidor.' };
    }
    */
  }

  /**
   * Cierra la sesión del brigadista.
   */
  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  /**
   * Retorna la sesión activa, o null si no hay sesión.
   * @returns {Object|null}
   */
  function getSession() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  /**
   * Retorna true si hay una sesión activa válida.
   */
  function isLoggedIn() {
    return getSession() !== null;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  return { login, logout, getSession, isLoggedIn };
})();

if (typeof window !== 'undefined') {
  window.AuthManager = AuthManager;
}

export { AuthManager };

