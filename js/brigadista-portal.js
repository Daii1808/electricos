/**
 * ─────────────────────────────────────────────────────
 *  brigadista-portal.js — Lógica del portal de campo
 *  Maneja: login UI, dashboard, formulario de reporte,
 *  subida de fotos y envío al backend.
 * ─────────────────────────────────────────────────────
 */

'use strict';

const BrigadistaPortal = (() => {

  // ─── Estado local ─────────────────────────────────────────────────────────
  let _photos = [];          // Array de File objects de las fotos subidas
  let _session = null;       // Sesión activa del brigadista

  // ─── Inicialización ───────────────────────────────────────────────────────

  function init() {
    ThemeManager.init();

    // ¿Ya hay sesión activa? — saltar login directamente al dashboard
    _session = AuthManager.getSession();
    if (_session) {
      showDashboard(_session);
    }

    registerLoginEvents();
    registerDashboardEvents();
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────

  function registerLoginEvents() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleLogin();
    });

    // Toggle visibilidad de la contraseña
    const pwToggle = document.getElementById('pw-toggle');
    const pwInput  = document.getElementById('login-password');
    if (pwToggle && pwInput) {
      pwToggle.addEventListener('click', () => {
        const isText = pwInput.type === 'text';
        pwInput.type = isText ? 'password' : 'text';
        pwToggle.textContent = isText ? 'Ver' : 'Ocultar';
      });
    }

    // Auto-uppercase del ID de empleado
    const idInput = document.getElementById('login-id');
    if (idInput) {
      idInput.addEventListener('input', () => {
        const pos = idInput.selectionStart;
        idInput.value = idInput.value.toUpperCase();
        idInput.setSelectionRange(pos, pos);
      });
    }

    // Limpiar errores al tipear
    [idInput, pwInput].forEach(input => {
      if (!input) return;
      input.addEventListener('input', () => {
        input.classList.remove('input--error');
        hideLoginError();
      });
    });

    // Toggle dark mode en login
    const themeToggle = document.getElementById('login-theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => ThemeManager.toggle());
    }
  }

  async function handleLogin() {
    const idInput  = document.getElementById('login-id');
    const pwInput  = document.getElementById('login-password');
    const btn      = document.getElementById('login-submit-btn');

    const employeeId = idInput?.value?.trim() || '';
    const password   = pwInput?.value || '';

    // Validación frontend básica
    let hasError = false;

    if (!employeeId) {
      idInput?.classList.add('input--error');
      showFieldError('id-error', 'Ingresa tu ID de empleado.');
      hasError = true;
    }

    if (!password) {
      pwInput?.classList.add('input--error');
      showFieldError('pw-error', 'Ingresa tu contraseña.');
      hasError = true;
    }

    if (hasError) return;

    // Estado de carga
    if (btn) {
      btn.disabled = true;
      btn.classList.add('loading');
    }

    const result = await AuthManager.login(employeeId, password);

    if (btn) {
      btn.disabled = false;
      btn.classList.remove('loading');
    }

    if (!result.success) {
      showLoginError(result.error);
      idInput?.classList.add('input--error');
      pwInput?.classList.add('input--error');
      return;
    }

    _session = result.user;

    // Aplicar branding de la empresa del brigadista
    if (typeof UIManager !== 'undefined') {
      UIManager.applyCompanyBranding(_session.companyId);
    } else {
      applyBrandingLocal(_session.companyId);
    }

    // Transición suave al dashboard
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
      loginScreen.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      loginScreen.style.opacity = '0';
      loginScreen.style.transform = 'translateY(-16px)';
      setTimeout(() => {
        loginScreen.style.display = 'none';
        showDashboard(_session);
      }, 300);
    }
  }

  // ─── DASHBOARD ───────────────────────────────────────────────────────────

  function showDashboard(session) {
    const dashboard = document.getElementById('dashboard-screen');
    if (!dashboard) return;

    dashboard.classList.add('active');

    // Poblar datos del usuario en el header
    setText('dash-user-name', session.name);
    setText('dash-user-role', session.role);

    // Avatar con iniciales
    const avatar = document.getElementById('dash-user-avatar');
    if (avatar) {
      avatar.textContent = session.name.split(' ').slice(0,2).map(w => w[0]).join('');
    }

    // Branding
    applyBrandingLocal(session.companyId);

    // Datos del caso asignado
    setText('dash-case-id', session.assignedCase);
    setText('dash-brigade-id', session.brigade);
    updateCaseBannerReason();
  }

  function updateCaseBannerReason() {
    // BACKEND: Obtener detalles del caso desde el servidor
    // Por ahora usa datos hardcodeados para la demo
    setText('dash-case-reason', 'Caída de rama sobre tendido eléctrico — Sector Los Notros');
  }

  // ─── EVENTOS DEL DASHBOARD ───────────────────────────────────────────────

  function registerDashboardEvents() {

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }

    // Toggle dark mode en dashboard
    const themeToggle = document.getElementById('dash-theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => ThemeManager.toggle());
    }

    // Subida de fotos: click en zona de drop
    const photoInput = document.getElementById('photo-input');
    const dropZone   = document.getElementById('photo-drop-zone');

    if (dropZone && photoInput) {
      // Drag & drop
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });

      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        addPhotos(files);
      });

      // Input file change
      photoInput.addEventListener('change', () => {
        const files = Array.from(photoInput.files);
        addPhotos(files);
        photoInput.value = ''; // Reset para permitir subir la misma foto de nuevo
      });
    }

    // Formulario de reporte
    const reportForm = document.getElementById('report-form');
    if (reportForm) {
      reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleSubmitReport();
      });
    }

    // Botón "Nuevo reporte" en pantalla de éxito
    const newReportBtn = document.getElementById('new-report-btn');
    if (newReportBtn) {
      newReportBtn.addEventListener('click', () => {
        document.getElementById('success-screen').style.display = 'none';
        document.getElementById('report-form-container').style.display = 'flex';
        resetForm();
      });
    }

    // Habilitar botón de envío cuando se acepte el check de seguridad
    const safetyCheck = document.getElementById('safety-check');
    const submitBtn   = document.getElementById('submit-report-btn');
    if (safetyCheck && submitBtn) {
      safetyCheck.addEventListener('change', () => {
        submitBtn.disabled = !safetyCheck.checked;
      });
    }
  }

  // ─── Fotos ───────────────────────────────────────────────────────────────

  function addPhotos(files) {
    const MAX_PHOTOS = 8;
    const available = MAX_PHOTOS - _photos.length;
    const toAdd = files.slice(0, available);

    _photos = [..._photos, ...toAdd];
    renderPhotoGrid();
    updatePhotoCount();
  }

  function removePhoto(index) {
    _photos.splice(index, 1);
    renderPhotoGrid();
    updatePhotoCount();
  }

  function renderPhotoGrid() {
    const grid = document.getElementById('photo-preview-grid');
    if (!grid) return;

    grid.innerHTML = '';

    _photos.forEach((file, i) => {
      const item = document.createElement('div');
      item.className = 'photo-preview-item';

      const img = document.createElement('img');
      img.alt = `Foto ${i + 1} de la falla`;
      img.src = URL.createObjectURL(file);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'photo-remove-btn';
      removeBtn.textContent = 'x';
      removeBtn.setAttribute('aria-label', `Eliminar foto ${i + 1}`);
      removeBtn.addEventListener('click', () => removePhoto(i));

      item.append(img, removeBtn);
      grid.appendChild(item);
    });
  }

  function updatePhotoCount() {
    const el = document.getElementById('photo-count');
    if (el) {
      el.textContent = _photos.length === 0
        ? 'Sin fotos adjuntas'
        : `${_photos.length} foto${_photos.length > 1 ? 's' : ''} adjunta${_photos.length > 1 ? 's' : ''}`;
    }

    // Mostrar/ocultar zona de drop si ya hay 8 fotos
    const dropZone = document.getElementById('photo-drop-zone');
    if (dropZone) {
      dropZone.style.display = _photos.length >= 8 ? 'none' : '';
    }
  }

  // ─── Envío del reporte ───────────────────────────────────────────────────

  async function handleSubmitReport() {
    const btn = document.getElementById('submit-report-btn');

    // Recopilar datos del formulario
    const reportData = collectFormData();

    // Validación mínima
    if (!reportData.fieldStatus) {
      showDashboardToast('Selecciona el estado actual del corte.', 'error');
      return;
    }

    if (!reportData.description || reportData.description.trim().length < 10) {
      showDashboardToast('Describe la situación encontrada (mínimo 10 caracteres).', 'error');
      const desc = document.getElementById('field-description');
      desc?.focus();
      return;
    }

    // Estado de carga
    if (btn) { btn.classList.add('loading'); btn.disabled = true; }

    try {
      const result = await submitReport(reportData);

      if (result.success) {
        setText('success-case-ref', reportData.caseId);
        showSuccessScreen();
      } else {
        showDashboardToast(result.error || 'Error al enviar el reporte.', 'error');
      }
    } catch (err) {
      console.error('[Portal] Error al enviar reporte:', err);
      showDashboardToast('Error de conexión. Verifica tu señal.', 'error');
    } finally {
      if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
    }
  }

  /**
   * Recopila todos los datos del formulario.
   * @returns {Object}
   */
  function collectFormData() {
    const session = AuthManager.getSession();

    return {
      // Identificación
      caseId:       session?.assignedCase || '',
      brigadeId:    session?.brigade || '',
      employeeId:   session?.employeeId || '',
      reportedAt:   new Date().toISOString(),

      // Estado actual del corte (radio buttons)
      fieldStatus: (() => {
        const checked = document.querySelector('input[name="field-status"]:checked');
        return checked?.value || '';
      })(),

      // Causa confirmada
      confirmedCause: document.getElementById('confirmed-cause')?.value || '',

      // Descripción de lo encontrado
      description: document.getElementById('field-description')?.value || '',

      // Tiempo estimado de reparación
      etaHours:   document.getElementById('eta-hours')?.value || '0',
      etaMinutes: document.getElementById('eta-minutes')?.value || '30',

      // Equipos o materiales necesarios
      materials: document.getElementById('materials-needed')?.value || '',

      // Notas adicionales
      notes: document.getElementById('additional-notes')?.value || '',

      // Fotos (se envían como FormData en producción)
      photoCount: _photos.length,
    };
  }

  /**
   * Envía el reporte al backend.
   * BACKEND: POST /api/v1/outage/field-report
   * @param {Object} data
   * @returns {Promise<{ success: boolean, reportId?: string, error?: string }>}
   */
  async function submitReport(data) {
    // ── MOCK ──────────────────────────────────────────────────────────────
    console.log('[Portal] Datos del reporte a enviar:', data);
    console.log('[Portal] Fotos:', _photos.map(f => f.name));

    await new Promise(r => setTimeout(r, 1500)); // Simula upload

    return {
      success: true,
      reportId: `RPT-${Date.now()}`,
    };

    // ── REAL (descomentar en producción) ──────────────────────────────────
    /*
    const session = AuthManager.getSession();

    // Usar FormData para incluir las fotos como archivos
    const formData = new FormData();

    // Agregar todos los campos de texto
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Agregar fotos
    _photos.forEach((file, i) => {
      formData.append(`photo_${i}`, file, file.name);
    });

    const response = await fetch(`${CONFIG.BASE_URL}/api/v1/outage/field-report`, {
      method: 'POST',
      headers: {
        // BACKEND: Incluir el token de auth
        'Authorization': `Bearer ${session.token}`,
        // NO incluir Content-Type aquí — fetch lo setea automáticamente con boundary para FormData
      },
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.message };
    }

    return { success: true, reportId: result.reportId };
    */
  }

  // ─── Logout ──────────────────────────────────────────────────────────────

  function handleLogout() {
    AuthManager.logout();
    _session = null;
    _photos  = [];

    const dashboard = document.getElementById('dashboard-screen');
    const login     = document.getElementById('login-screen');

    if (dashboard) dashboard.classList.remove('active');

    if (login) {
      login.style.display = '';
      login.style.opacity = '0';
      login.style.transform = 'translateY(16px)';
      requestAnimationFrame(() => {
        login.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        login.style.opacity = '1';
        login.style.transform = 'translateY(0)';
      });

      // Limpiar el formulario de login
      document.getElementById('login-form')?.reset();
      document.getElementById('login-id')?.classList.remove('input--error');
      document.getElementById('login-password')?.classList.remove('input--error');
      hideLoginError();
    }
  }

  // ─── Pantalla de éxito ────────────────────────────────────────────────────

  function showSuccessScreen() {
    document.getElementById('report-form-container').style.display = 'none';
    document.getElementById('success-screen').style.display = 'flex';
  }

  function resetForm() {
    document.getElementById('report-form')?.reset();
    _photos = [];
    renderPhotoGrid();
    updatePhotoCount();

    const submitBtn = document.getElementById('submit-report-btn');
    if (submitBtn) submitBtn.disabled = true;
  }

  // ─── Branding (standalone — sin depender de UIManager del index.html) ────

  function applyBrandingLocal(companyId) {
    const company = CONFIG.COMPANIES[companyId];
    if (!company) return;

    document.documentElement.style.setProperty('--color-brand-primary', company.primaryColor);
    document.documentElement.style.setProperty('--color-brand-accent',  company.accentColor);

    // Actualizar textos de logo en el portal
    const logoText = document.getElementById('portal-logo-text');
    const logoIcon = document.getElementById('portal-logo-icon');
    if (logoText) logoText.textContent = company.logoText;
    if (logoIcon) logoIcon.textContent = company.logoIcon;
  }

  // ─── Toast del dashboard ─────────────────────────────────────────────────

  function showDashboardToast(message, type = 'info') {
    const container = document.getElementById('portal-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? 'OK' : type === 'error' ? '!' : 'i'}</span>
      <span class="toast-text">${message}</span>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast--visible'));

    setTimeout(() => {
      toast.classList.remove('toast--visible');
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }

  // ─── Helpers UI ──────────────────────────────────────────────────────────

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? '—';
  }

  function showFieldError(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.classList.add('visible'); }
  }

  function showLoginError(msg) {
    const el = document.getElementById('login-error-box');
    const txt = document.getElementById('login-error-text');
    if (txt) txt.textContent = msg;
    if (el) el.classList.add('visible');
  }

  function hideLoginError() {
    const el = document.getElementById('login-error-box');
    if (el) el.classList.remove('visible');

    ['id-error', 'pw-error'].forEach(id => {
      document.getElementById(id)?.classList.remove('visible');
    });
  }

  // ─── API pública ─────────────────────────────────────────────────────────

  return { init };
})();

// Bootstrap cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => BrigadistaPortal.init());
