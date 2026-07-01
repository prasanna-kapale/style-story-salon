/**
 * STYLE STORY — ADMIN PANEL LOGIC
 * ------------------------------------------------------------
 * Talks only to the repository layer (repository.js) and the upload
 * utility (upload.js) — never to Supabase directly. One file, organised
 * top to bottom: auth/shell -> shared helpers (toast/modal) -> a generic
 * CRUD engine reused by Services/Gallery/Testimonials/Stylists/Offers ->
 * the two hand-built modules (Dashboard, Bookings) -> Settings.
 * ------------------------------------------------------------
 */
document.addEventListener('DOMContentLoaded', () => {

  const repo = StyleStoryRepo;

  /* ============================================================
     AUTH + APP SHELL
  ============================================================ */
  const loginScreen = document.getElementById('login-screen');
  const appShell = document.getElementById('app');
  const loginForm = document.getElementById('login-form');
  const loginBtn = document.getElementById('login-btn');
  const loginError = document.getElementById('login-error');

  function showApp() {
    loginScreen.style.display = 'none';
    appShell.classList.add('show');
    initApp();
  }
  function showLogin() {
    appShell.classList.remove('show');
    loginScreen.style.display = 'flex';
  }

  StyleStoryAuth.getSession()
    .then((session) => { session ? showApp() : showLogin(); })
    .catch(() => showLogin());

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.remove('show');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in…';
    try {
      await StyleStoryAuth.signIn(
        document.getElementById('login-email').value.trim(),
        document.getElementById('login-password').value
      );
      showApp();
    } catch (err) {
      loginError.textContent = 'Incorrect email or password.';
      loginError.classList.add('show');
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign in';
    }
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await StyleStoryAuth.signOut();
    window.location.reload();
  });

  let appInitialized = false;
  function initApp() {
    if (appInitialized) return;
    appInitialized = true;
    setupNav();
    initDashboard();
    initBookings();
    initServicesModule();
    initGalleryModule();
    initTestimonialsModule();
    initStylistsModule();
    initOffersModule();
    initSettingsModule();

    const dateEl = document.getElementById('topbar-date');
    dateEl.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ============================================================
     NAVIGATION
  ============================================================ */
  const viewTitles = {
    dashboard: 'Dashboard', bookings: 'Bookings', services: 'Services', gallery: 'Gallery',
    testimonials: 'Testimonials', stylists: 'Stylists', offers: 'Offers', settings: 'Settings',
  };
  function setupNav() {
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.dataset.view;
        document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.dataset.viewPanel === view));
        document.getElementById('topbar-title').textContent = viewTitles[view] || view;
        closeSidebar(); // auto-close drawer on mobile after navigation
      });
    });
    document.querySelector('.view[data-view-panel="dashboard"]').classList.add('active');

    // ── Mobile drawer ──
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const burger = document.getElementById('admin-burger');

    function openSidebar() {
      sidebar.classList.add('open');
      overlay.classList.add('show');
      burger.classList.add('open');
      burger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    burger.addEventListener('click', () => {
      sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
    overlay.addEventListener('click', closeSidebar);

    // Show/hide burger based on viewport width
    function updateBurgerVisibility() {
      burger.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
      if (window.innerWidth > 768) closeSidebar();
    }
    updateBurgerVisibility();
    window.addEventListener('resize', updateBurgerVisibility, { passive: true });
  }

  /* ============================================================
     SHARED: TOASTS
  ============================================================ */
  function showToast(message, isError = false) {
    const host = document.getElementById('toast-host');
    const el = document.createElement('div');
    el.className = 'toast' + (isError ? ' error' : '');
    el.textContent = message;
    host.appendChild(el);
    setTimeout(() => el.remove(), 3800);
  }

  /* ============================================================
     SHARED: GENERIC MODAL FORM
     fieldConfig items: { key, label, type: text|textarea|number|date|select|toggle|image,
                           required, placeholder, options (for select), folder (for image) }
  ============================================================ */
  const modalOverlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalForm = document.getElementById('modal-form');
  document.getElementById('modal-close').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

  function closeModal() { modalOverlay.classList.remove('open'); modalForm.innerHTML = ''; }

  function buildFieldHTML(field, value) {
    const v = value ?? field.default ?? '';
    if (field.type === 'toggle') {
      return `<div class="toggle-row" data-key="${field.key}">
        <span>${field.label}</span>
        <button type="button" class="toggle-switch ${v ? 'on' : ''}" data-toggle="${field.key}"></button>
      </div>`;
    }
    if (field.type === 'image') {
      const bg = v ? `style="background-image:url('${v}')"` : '';
      return `<div class="image-upload-field" data-key="${field.key}">
        <label>${field.label}</label>
        <div class="image-upload-box" data-upload="${field.key}" data-folder="${field.folder}" ${bg}>
          <span class="upload-placeholder" data-ph style="${v ? 'display:none;' : ''}">Click to upload a photo</span>
          <div class="upload-overlay" data-ov>Click to replace</div>
          <input type="file" accept="image/*" data-file-input="${field.key}">
        </div>
        <input type="hidden" data-value="${field.key}" value="${v || ''}">
      </div>`;
    }
    if (field.type === 'textarea') {
      return `<div class="form-field"><label>${field.label}${field.required ? '' : ' <span class="optional">(optional)</span>'}</label>
        <textarea data-key="${field.key}" rows="3" placeholder="${field.placeholder || ''}">${v}</textarea></div>`;
    }
    if (field.type === 'select') {
      const opts = field.options.map((o) => `<option value="${o}" ${String(o) === String(v) ? 'selected' : ''}>${o}</option>`).join('');
      return `<div class="form-field"><label>${field.label}</label><select data-key="${field.key}">${opts}</select></div>`;
    }
    // text | number | date
    return `<div class="form-field"><label>${field.label}${field.required ? '' : ' <span class="optional">(optional)</span>'}</label>
      <input type="${field.type}" data-key="${field.key}" value="${v}" placeholder="${field.placeholder || ''}" ${field.list ? `list="${field.key}-list"` : ''}>
      ${field.list ? `<datalist id="${field.key}-list">${(field.list || []).map((o) => `<option value="${o}">`).join('')}</datalist>` : ''}
      </div>`;
  }

  function wireFieldInteractions(fields) {
    fields.filter((f) => f.type === 'toggle').forEach((f) => {
      const btn = modalForm.querySelector(`[data-toggle="${f.key}"]`);
      btn.addEventListener('click', () => btn.classList.toggle('on'));
    });
    fields.filter((f) => f.type === 'image').forEach((f) => {
      const box = modalForm.querySelector(`[data-upload="${f.key}"]`);
      const fileInput = modalForm.querySelector(`[data-file-input="${f.key}"]`);
      const hidden = modalForm.querySelector(`[data-value="${f.key}"]`);
      const placeholder = box.querySelector('[data-ph]');
      const overlay = box.querySelector('[data-ov]');
      box.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) return;
        box.classList.add('uploading');
        overlay.textContent = 'Uploading…';
        try {
          const oldUrl = hidden.value;
          const result = oldUrl
            ? await StyleStoryUpload.replaceImage(file, f.folder, oldUrl)
            : await StyleStoryUpload.uploadImage(file, f.folder);
          hidden.value = result.publicUrl;
          box.style.backgroundImage = `url('${result.publicUrl}')`;
          placeholder.style.display = 'none';
        } catch (err) {
          console.error('[Style Story] Upload failed:', err);
          showToast('Image upload failed — please try again.', true);
        } finally {
          box.classList.remove('uploading');
          overlay.textContent = 'Click to replace';
        }
      });
    });
  }

  function readFieldValues(fields) {
    const out = {};
    fields.forEach((f) => {
      if (f.type === 'toggle') {
        out[f.key] = modalForm.querySelector(`[data-toggle="${f.key}"]`).classList.contains('on');
      } else if (f.type === 'image') {
        out[f.key] = modalForm.querySelector(`[data-value="${f.key}"]`).value || null;
      } else if (f.type === 'number') {
        const raw = modalForm.querySelector(`[data-key="${f.key}"]`).value;
        out[f.key] = raw === '' ? null : Number(raw);
      } else if (f.type === 'select') {
        const raw = modalForm.querySelector(`[data-key="${f.key}"]`).value;
        const isNumeric = Array.isArray(f.options) && f.options.every((o) => typeof o === 'number');
        out[f.key] = isNumeric ? Number(raw) : raw;
      } else {
        const raw = modalForm.querySelector(`[data-key="${f.key}"]`).value.trim();
        out[f.key] = raw === '' ? null : raw;
      }
    });
    return out;
  }

  /**
   * @param {object} opts { title, fields, values, onSubmit(values), onDelete? }
   */
  function openModal(opts) {
    modalTitle.textContent = opts.title;
    modalForm.innerHTML = opts.fields.map((f) => buildFieldHTML(f, opts.values ? opts.values[f.key] : undefined)).join('');
    modalForm.insertAdjacentHTML('beforeend', `
      <div class="modal-error" id="modal-error" style="display:none;"></div>
      <div class="modal-actions">
        ${opts.onDelete ? '<button type="button" class="btn-danger" id="modal-delete-btn">Delete</button>' : '<span></span>'}
        <button type="submit" class="btn-gold" id="modal-submit-btn">${opts.submitLabel || 'Save'}</button>
      </div>`);
    wireFieldInteractions(opts.fields);

    if (opts.onDelete) {
      document.getElementById('modal-delete-btn').addEventListener('click', async () => {
        if (!confirm('Delete this item? This cannot be undone.')) return;
        try { await opts.onDelete(); closeModal(); }
        catch (err) { showToast(err.message || 'Could not delete.', true); }
      });
    }

    modalForm.onsubmit = async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('modal-error');
      errEl.style.display = 'none';
      const missing = opts.fields.find((f) => f.required && !readFieldValues([f])[f.key]);
      if (missing) {
        errEl.textContent = `${missing.label} is required.`;
        errEl.style.display = 'block';
        return;
      }
      const submitBtn = document.getElementById('modal-submit-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving…';
      try {
        await opts.onSubmit(readFieldValues(opts.fields));
        closeModal();
      } catch (err) {
        errEl.textContent = err.message || 'Something went wrong — please try again.';
        errEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = opts.submitLabel || 'Save';
      }
    };

    modalOverlay.classList.add('open');
  }

  /* ============================================================
     GENERIC CRUD MODULE ENGINE
     Drives Services / Testimonials / Stylists / Offers (Gallery has its
     own module below because of drag-sort + simpler fields).
  ============================================================ */
  function initCrudModule({ key, repository, gridEl, addBtn, fields, emptyMessage, renderCard, newDefaults }) {
    async function load() {
      gridEl.innerHTML = '<p class="muted">Loading…</p>';
      try {
        const items = await repository.getAll();
        if (items.length === 0) {
          gridEl.innerHTML = `<p class="muted">${emptyMessage}</p>`;
          return;
        }
        gridEl.innerHTML = '';
        items.forEach((item) => {
          const card = document.createElement('div');
          card.className = 'entity-card';
          card.innerHTML = renderCard(item);
          card.querySelector('[data-action="edit"]').addEventListener('click', () => openEdit(item));
          gridEl.appendChild(card);
        });
      } catch (err) {
        console.error(`[Style Story] Could not load ${key}:`, err);
        gridEl.innerHTML = `<div class="data-error" style="grid-column:1/-1;"><p>Couldn't load this list. ${err.message || ''}</p></div>`;
      }
    }

    function openAdd() {
      openModal({
        title: `Add ${key}`,
        fields,
        values: newDefaults || {},
        submitLabel: 'Create',
        onSubmit: async (values) => { await repository.create(values); showToast(`${cap(key)} created.`); load(); },
      });
    }

    function openEdit(item) {
      openModal({
        title: `Edit ${key}`,
        fields,
        values: item,
        submitLabel: 'Save changes',
        onSubmit: async (values) => { await repository.update(item.id, values); showToast(`${cap(key)} updated.`); load(); },
        onDelete: async () => {
          if (item.image_url) { try { await StyleStoryUpload.deleteByPublicUrl(item.image_url); } catch (e) {} }
          await repository.delete(item.id);
          showToast(`${cap(key)} deleted.`);
          load();
        },
      });
    }

    addBtn.addEventListener('click', openAdd);
    load();
    return { load };
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function escapeHTML(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ---------- SERVICES ---------- */
  function initServicesModule() {
    initCrudModule({
      key: 'service',
      repository: repo.ServicesRepository,
      gridEl: document.getElementById('services-grid'),
      addBtn: document.getElementById('services-add-btn'),
      emptyMessage: 'No services yet — add your first one.',
      newDefaults: { active: true, featured: false },
      fields: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'category', label: 'Category', type: 'text', required: true, list: ['Hair', 'Treatment', 'Skin', 'Bridal', 'Nails'] },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'price', label: 'Price (₹)', type: 'number', required: true },
        { key: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g. 45 min' },
        { key: 'image_url', label: 'Photo', type: 'image', folder: 'services' },
        { key: 'featured', label: 'Featured on landing page', type: 'toggle' },
        { key: 'active', label: 'Active (visible to visitors)', type: 'toggle' },
      ],
      renderCard: (s) => `
        <div class="entity-card-img" ${s.image_url ? `style="background-image:url('${s.image_url}')"` : ''}>
          ${!s.image_url ? `<span class="placeholder-letter">${escapeHTML((s.category || '?').charAt(0))}</span>` : ''}
        </div>
        <span class="entity-card-cat">${escapeHTML(s.category)}</span>
        <h3 class="entity-card-title">${escapeHTML(s.title)}</h3>
        <p class="entity-card-desc">${escapeHTML(s.description || '')}</p>
        <div class="entity-card-meta"><span>₹${Number(s.price).toLocaleString('en-IN')}</span><span>${escapeHTML(s.duration || '')}</span></div>
        <div class="badge-row">
          <span class="badge-pill ${s.featured ? 'on' : ''}">Featured</span>
          <span class="badge-pill ${s.active ? 'on' : ''}">${s.active ? 'Active' : 'Inactive'}</span>
        </div>
        <div class="entity-card-footer"><button class="btn-ghost-admin" data-action="edit" style="width:100%;">Edit</button></div>`,
    });
  }

  /* ---------- TESTIMONIALS ---------- */
  function initTestimonialsModule() {
    initCrudModule({
      key: 'testimonial',
      repository: repo.TestimonialsRepository,
      gridEl: document.getElementById('testimonials-grid'),
      addBtn: document.getElementById('testimonials-add-btn'),
      emptyMessage: 'No testimonials yet — add your first review.',
      newDefaults: { rating: 5, featured: false },
      fields: [
        { key: 'customer_name', label: 'Customer name', type: 'text', required: true },
        { key: 'designation', label: 'Source / designation', type: 'text', placeholder: 'e.g. Google Review' },
        { key: 'review', label: 'Review', type: 'textarea', required: true },
        { key: 'rating', label: 'Rating', type: 'select', options: [1, 2, 3, 4, 5] },
        { key: 'image_url', label: 'Customer photo', type: 'image', folder: 'testimonials' },
        { key: 'featured', label: 'Featured on landing page', type: 'toggle' },
      ],
      renderCard: (t) => `
        <div class="entity-card-img" style="height:64px;width:64px;border-radius:50%;margin:0 auto 1rem;${t.image_url ? `background-image:url('${t.image_url}')` : ''}">
          ${!t.image_url ? `<span class="placeholder-letter" style="font-size:22px;">${escapeHTML((t.customer_name || '?').charAt(0))}</span>` : ''}
        </div>
        <h3 class="entity-card-title" style="text-align:center;">${escapeHTML(t.customer_name)}</h3>
        <p class="entity-card-cat" style="text-align:center;">${escapeHTML(t.designation || '')} · ${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</p>
        <p class="entity-card-desc" style="margin-top:0.6rem;">"${escapeHTML(t.review)}"</p>
        <div class="badge-row"><span class="badge-pill ${t.featured ? 'on' : ''}">Featured</span></div>
        <div class="entity-card-footer"><button class="btn-ghost-admin" data-action="edit" style="width:100%;">Edit</button></div>`,
    });
  }

  /* ---------- STYLISTS ---------- */
  function initStylistsModule() {
    initCrudModule({
      key: 'stylist',
      repository: repo.StylistsRepository,
      gridEl: document.getElementById('stylists-grid'),
      addBtn: document.getElementById('stylists-add-btn'),
      emptyMessage: 'No stylists yet — add your first team member.',
      newDefaults: { active: true, featured: false },
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'role', label: 'Role/title', type: 'text', placeholder: 'e.g. Senior Stylist' },
        { key: 'specialization', label: 'Specialization', type: 'text', required: true, placeholder: 'e.g. Hair & Colour Specialist' },
        { key: 'experience', label: 'Experience', type: 'text', placeholder: 'e.g. 8+ yrs' },
        { key: 'bio', label: 'Bio', type: 'textarea' },
        { key: 'instagram', label: 'Instagram', type: 'text', placeholder: '@handle' },
        { key: 'image_url', label: 'Photo', type: 'image', folder: 'stylists' },
        { key: 'featured', label: 'Featured on landing page', type: 'toggle' },
        { key: 'active', label: 'Active (visible to visitors)', type: 'toggle' },
      ],
      renderCard: (s) => `
        <div class="entity-card-img" ${s.image_url ? `style="background-image:url('${s.image_url}')"` : ''}>
          ${!s.image_url ? `<span class="placeholder-letter">${escapeHTML((s.name || '?').charAt(0))}</span>` : ''}
        </div>
        <h3 class="entity-card-title">${escapeHTML(s.name)}</h3>
        <p class="entity-card-cat">${escapeHTML(s.specialization || '')}</p>
        <p class="entity-card-desc">${escapeHTML(s.bio || '')}</p>
        <div class="entity-card-meta"><span>${escapeHTML(s.experience || '')}</span><span>${escapeHTML(s.instagram || '')}</span></div>
        <div class="badge-row">
          <span class="badge-pill ${s.featured ? 'on' : ''}">Featured</span>
          <span class="badge-pill ${s.active ? 'on' : ''}">${s.active ? 'Active' : 'Inactive'}</span>
        </div>
        <div class="entity-card-footer"><button class="btn-ghost-admin" data-action="edit" style="width:100%;">Edit</button></div>`,
    });
  }

  /* ---------- OFFERS ---------- */
  function initOffersModule() {
    initCrudModule({
      key: 'offer',
      repository: repo.OffersRepository,
      gridEl: document.getElementById('offers-grid'),
      addBtn: document.getElementById('offers-add-btn'),
      emptyMessage: 'No offers yet — add a promotion.',
      newDefaults: { active: true },
      fields: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'discount', label: 'Discount', type: 'text', placeholder: 'e.g. 20% or ₹500' },
        { key: 'start_date', label: 'Start date', type: 'date' },
        { key: 'end_date', label: 'End date', type: 'date' },
        { key: 'image_url', label: 'Photo', type: 'image', folder: 'offers' },
        { key: 'active', label: 'Active', type: 'toggle' },
      ],
      renderCard: (o) => `
        <div class="entity-card-img" ${o.image_url ? `style="background-image:url('${o.image_url}')"` : ''}>
          ${!o.image_url ? `<span class="placeholder-letter">%</span>` : ''}
        </div>
        <h3 class="entity-card-title">${escapeHTML(o.title)}</h3>
        <p class="entity-card-desc">${escapeHTML(o.description || '')}</p>
        <div class="entity-card-meta"><span>${escapeHTML(o.discount || '')}</span><span>${o.start_date || '—'} → ${o.end_date || '—'}</span></div>
        <div class="badge-row"><span class="badge-pill ${o.active ? 'on' : ''}">${o.active ? 'Active' : 'Inactive'}</span></div>
        <div class="entity-card-footer"><button class="btn-ghost-admin" data-action="edit" style="width:100%;">Edit</button></div>`,
    });
  }

  /* ============================================================
     GALLERY MODULE (own logic: drag-to-reorder + simpler fields)
  ============================================================ */
  function initGalleryModule() {
    const gridEl = document.getElementById('gallery-grid');
    const addBtn = document.getElementById('gallery-add-btn');
    const fields = [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'text', list: ['Hair Colour', 'Bridal', 'Haircut', 'Makeup', 'Interior', 'Treatment'] },
      { key: 'image_url', label: 'Photo', type: 'image', folder: 'gallery', required: true },
      { key: 'featured', label: 'Featured (shown larger)', type: 'toggle' },
    ];

    async function load() {
      gridEl.innerHTML = '<p class="muted">Loading…</p>';
      try {
        const items = await repo.GalleryRepository.getAll();
        if (items.length === 0) { gridEl.innerHTML = '<p class="muted">No photos yet — upload your first one.</p>'; return; }
        gridEl.innerHTML = '';
        items.forEach((g) => gridEl.appendChild(buildTile(g)));
      } catch (err) {
        console.error('[Style Story] Could not load gallery:', err);
        gridEl.innerHTML = `<div class="data-error" style="grid-column:1/-1;"><p>Couldn't load the gallery.</p></div>`;
      }
    }

    function buildTile(g) {
      const tile = document.createElement('div');
      tile.className = 'media-tile';
      tile.draggable = true;
      tile.dataset.id = g.id;
      if (g.image_url) { tile.style.backgroundImage = `url('${g.image_url}')`; }
      tile.innerHTML = `
        ${g.featured ? '<span class="media-tile-featured">Featured</span>' : ''}
        <div class="media-tile-actions">
          <button data-action="edit" title="Edit">✎</button>
          <button data-action="delete" title="Delete">✕</button>
        </div>
        <div class="media-tile-overlay">
          <span class="media-tile-cat">${escapeHTML(g.category || '')}</span>
          <span class="media-tile-label">${escapeHTML(g.title)}</span>
        </div>`;
      tile.querySelector('[data-action="edit"]').addEventListener('click', () => openEdit(g));
      tile.querySelector('[data-action="delete"]').addEventListener('click', async () => {
        if (!confirm('Delete this photo?')) return;
        try {
          if (g.image_url) await StyleStoryUpload.deleteByPublicUrl(g.image_url);
          await repo.GalleryRepository.delete(g.id);
          showToast('Photo deleted.');
          load();
        } catch (err) { showToast(err.message || 'Could not delete.', true); }
      });
      wireDrag(tile);
      return tile;
    }

    function wireDrag(tile) {
      tile.addEventListener('dragstart', () => tile.classList.add('dragging'));
      tile.addEventListener('dragend', async () => {
        tile.classList.remove('dragging');
        const ids = [...gridEl.querySelectorAll('.media-tile')].map((t) => t.dataset.id);
        try {
          await Promise.all(ids.map((id, i) => repo.GalleryRepository.update(id, { sort_order: i })));
        } catch (err) { console.warn('[Style Story] Could not save new order:', err); }
      });
    }
    gridEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      const dragging = gridEl.querySelector('.dragging');
      if (!dragging) return;
      const siblings = [...gridEl.querySelectorAll('.media-tile:not(.dragging)')];
      const next = siblings.find((sib) => e.clientX < sib.getBoundingClientRect().left + sib.getBoundingClientRect().width / 2 &&
        e.clientY < sib.getBoundingClientRect().bottom);
      gridEl.insertBefore(dragging, next || null);
    });

    function openAdd() {
      openModal({
        title: 'Upload photo', fields, values: { featured: false }, submitLabel: 'Upload',
        onSubmit: async (values) => {
          const existing = await repo.GalleryRepository.getAll();
          await repo.GalleryRepository.create({ ...values, sort_order: existing.length });
          showToast('Photo added.');
          load();
        },
      });
    }
    function openEdit(g) {
      openModal({
        title: 'Edit photo', fields, values: g, submitLabel: 'Save changes',
        onSubmit: async (values) => { await repo.GalleryRepository.update(g.id, values); showToast('Photo updated.'); load(); },
        onDelete: async () => {
          if (g.image_url) { try { await StyleStoryUpload.deleteByPublicUrl(g.image_url); } catch (e) {} }
          await repo.GalleryRepository.delete(g.id);
          showToast('Photo deleted.');
          load();
        },
      });
    }

    addBtn.addEventListener('click', openAdd);
    load();
  }

  /* ============================================================
     BOOKINGS MODULE
  ============================================================ */
  function initBookings() {
    const tbody = document.getElementById('bookings-tbody');
    const searchInput = document.getElementById('bookings-search');
    const statusFilter = document.getElementById('bookings-filter-status');
    const sortSelect = document.getElementById('bookings-sort');
    let allBookings = [];
    let serviceMap = new Map();
    let stylistMap = new Map();

    async function load() {
      tbody.innerHTML = '<tr><td colspan="7" class="muted">Loading…</td></tr>';
      try {
        const [bookings, services, stylists] = await Promise.all([
          repo.BookingsRepository.getAll(),
          repo.ServicesRepository.getAll(),
          repo.StylistsRepository.getAll(),
        ]);
        allBookings = bookings;
        serviceMap = new Map(services.map((s) => [s.id, s]));
        stylistMap = new Map(stylists.map((s) => [s.id, s]));
        render();
      } catch (err) {
        console.error('[Style Story] Could not load bookings:', err);
        tbody.innerHTML = `<tr><td colspan="7" class="data-error"><p>Couldn't load bookings.</p></td></tr>`;
      }
    }

    function render() {
      const q = searchInput.value.trim().toLowerCase();
      const status = statusFilter.value;
      let rows = allBookings.filter((b) =>
        (!q || b.customer_name.toLowerCase().includes(q) || b.phone.includes(q)) &&
        (!status || b.status === status)
      );
      const sort = sortSelect.value;
      rows = rows.slice().sort((a, b) => {
        if (sort === 'date-asc') return new Date(a.created_at) - new Date(b.created_at);
        if (sort === 'appt-asc') return `${a.booking_date}${a.booking_time}`.localeCompare(`${b.booking_date}${b.booking_time}`);
        return new Date(b.created_at) - new Date(a.created_at); // date-desc default
      });

      if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="muted">No bookings match your filters.</td></tr>';
        return;
      }
      tbody.innerHTML = '';
      rows.forEach((b) => tbody.appendChild(buildRow(b)));
    }

    function buildRow(b) {
      const tr = document.createElement('tr');
      const service = serviceMap.get(b.service_id);
      const stylist = stylistMap.get(b.stylist_id);
      const dateLabel = b.booking_date
        ? new Date(b.booking_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—';
      tr.innerHTML = `
        <td><span class="cell-primary">${escapeHTML(b.customer_name)}</span><br><span class="cell-muted">${escapeHTML(b.phone)}</span></td>
        <td>${escapeHTML(service ? service.title : '—')}</td>
        <td>${escapeHTML(stylist ? stylist.specialization : 'No preference')}</td>
        <td>${dateLabel}<br><span class="cell-muted">${escapeHTML(b.booking_time)}</span></td>
        <td><span class="status-badge ${b.status}"><span class="status-dot"></span>${b.status}</span></td>
        <td><span class="wa-flag ${b.whatsapp_sent ? 'yes' : 'no'}">${b.whatsapp_sent ? 'Sent' : 'Not sent'}</span></td>
        <td><div class="status-actions" data-actions></div></td>`;
      const actionsHost = tr.querySelector('[data-actions]');
      buildActions(b, actionsHost);
      return tr;
    }

    function buildActions(b, host) {
      host.innerHTML = '';
      const addBtn = (label, status, danger) => {
        const btn = document.createElement('button');
        btn.className = danger ? 'btn-danger' : 'btn-ghost-admin';
        btn.textContent = label;
        btn.style.padding = '6px 10px';
        btn.style.fontSize = '11.5px';
        btn.addEventListener('click', () => updateStatus(b, status));
        host.appendChild(btn);
      };
      if (b.status === 'Pending') { addBtn('Confirm', 'Confirmed'); addBtn('Cancel', 'Cancelled', true); }
      else if (b.status === 'Confirmed') { addBtn('Complete', 'Completed'); addBtn('Cancel', 'Cancelled', true); }
      else { addBtn('Reopen', 'Pending'); }

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-icon';
      delBtn.title = 'Delete booking';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', async () => {
        if (!confirm('Delete this booking permanently?')) return;
        try { await repo.BookingsRepository.delete(b.id); showToast('Booking deleted.'); load(); }
        catch (err) { showToast(err.message || 'Could not delete.', true); }
      });
      host.appendChild(delBtn);
    }

    async function updateStatus(b, status) {
      try {
        await repo.BookingsRepository.update(b.id, { status });
        showToast(`Booking marked ${status.toLowerCase()}.`);
        load();
      } catch (err) { showToast(err.message || 'Could not update booking.', true); }
    }

    searchInput.addEventListener('input', render);
    statusFilter.addEventListener('change', render);
    sortSelect.addEventListener('change', render);
    load();
    return { reload: load };
  }

  /* ============================================================
     DASHBOARD
  ============================================================ */
  async function initDashboard() {
    const statGrid = document.getElementById('dash-stat-grid');
    const recentHost = document.getElementById('dash-recent-activity');
    const quickHost = document.getElementById('dash-quick-stats');

    try {
      const [bookings, services, gallery, testimonials] = await Promise.all([
        repo.BookingsRepository.getAll(),
        repo.ServicesRepository.getAll(),
        repo.GalleryRepository.getAll(),
        repo.TestimonialsRepository.getAll(),
      ]);

      const todayISO = new Date().toISOString().split('T')[0];
      const todaysCount = bookings.filter((b) => b.booking_date === todayISO).length;
      const pendingCount = bookings.filter((b) => b.status === 'Pending').length;

      const thisMonth = new Date().toISOString().slice(0, 7);
      const serviceById = new Map(services.map((s) => [s.id, s]));
      const revenue = bookings
        .filter((b) => b.status === 'Completed' && (b.booking_date || '').startsWith(thisMonth))
        .reduce((sum, b) => sum + Number(serviceById.get(b.service_id)?.price || 0), 0);

      const countByService = new Map();
      bookings.filter((b) => b.status !== 'Cancelled' && b.service_id).forEach((b) => {
        countByService.set(b.service_id, (countByService.get(b.service_id) || 0) + 1);
      });
      let popularServiceName = '—';
      if (countByService.size > 0) {
        const topId = [...countByService.entries()].sort((a, b) => b[1] - a[1])[0][0];
        popularServiceName = serviceById.get(topId)?.title || '—';
      }

      statGrid.innerHTML = [
        ['Today\'s bookings', todaysCount, ''],
        ['Pending bookings', pendingCount, pendingCount > 0 ? 'Needs attention' : 'All caught up'],
        ['Revenue this month', `₹${revenue.toLocaleString('en-IN')}`, 'Completed bookings'],
        ['Most popular service', popularServiceName, ''],
      ].map(([label, value, sub]) => `
        <div class="stat-card">
          <span class="stat-card-label">${label}</span>
          <span class="stat-card-value">${value}</span>
          ${sub ? `<span class="stat-card-sub">${sub}</span>` : ''}
        </div>`).join('');

      const recent = bookings.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);
      recentHost.innerHTML = recent.length === 0
        ? '<p class="muted">No bookings yet.</p>'
        : recent.map((b) => `
          <div class="recent-item">
            <div><div class="recent-item-name">${escapeHTML(b.customer_name)}</div>
            <div class="recent-item-meta">${escapeHTML(serviceById.get(b.service_id)?.title || 'Service')} · ${b.status}</div></div>
            <span class="recent-item-time">${timeAgo(b.created_at)}</span>
          </div>`).join('');

      quickHost.innerHTML = `
        <div class="quick-stat-row"><span>Total bookings</span><strong>${bookings.length}</strong></div>
        <div class="quick-stat-row"><span>Active services</span><strong>${services.filter((s) => s.active).length}</strong></div>
        <div class="quick-stat-row"><span>Gallery photos</span><strong>${gallery.length}</strong></div>
        <div class="quick-stat-row"><span>Testimonials</span><strong>${testimonials.length}</strong></div>`;
    } catch (err) {
      console.error('[Style Story] Dashboard load failed:', err);
      statGrid.innerHTML = `<div class="data-error" style="grid-column:1/-1;"><p>Couldn't load dashboard stats.</p></div>`;
      recentHost.innerHTML = '<p class="muted">Unavailable.</p>';
      quickHost.innerHTML = '<p class="muted">Unavailable.</p>';
    }
  }

  function timeAgo(iso) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  /* ============================================================
     SETTINGS MODULE
  ============================================================ */
  function initSettingsModule() {
    const form = document.getElementById('settings-form');
    const saveBtn = document.getElementById('settings-save-btn');
    const saveConfirm = document.getElementById('settings-save-confirm');
    const cleanupBtn = document.getElementById('cleanup-btn');
    const cleanupResult = document.getElementById('cleanup-result');

    const imageBoxes = {
      logo: document.querySelector('[data-upload="logo"]'),
      favicon: document.querySelector('[data-upload="favicon"]'),
      hero_image: document.querySelector('[data-upload="hero_image"]'),
    };
    const imageValues = { logo: null, favicon: null, hero_image: null };

    Object.entries(imageBoxes).forEach(([key, box]) => {
      box.innerHTML = `<span class="upload-placeholder" data-ph>Click to upload</span>
        <div class="upload-overlay" data-ov>Click to replace</div>
        <input type="file" accept="image/*" data-file>`;
      const input = box.querySelector('[data-file]');
      const placeholder = box.querySelector('[data-ph]');
      const overlay = box.querySelector('[data-ov]');
      box.addEventListener('click', () => input.click());
      input.addEventListener('change', async () => {
        const file = input.files[0];
        if (!file) return;
        box.classList.add('uploading');
        overlay.textContent = 'Uploading…';
        try {
          const folder = key === 'hero_image' ? 'hero' : 'branding';
          const result = imageValues[key]
            ? await StyleStoryUpload.replaceImage(file, folder, imageValues[key])
            : await StyleStoryUpload.uploadImage(file, folder);
          imageValues[key] = result.publicUrl;
          box.style.backgroundImage = `url('${result.publicUrl}')`;
          placeholder.style.display = 'none';
        } catch (err) {
          showToast('Upload failed — please try again.', true);
        } finally {
          box.classList.remove('uploading');
          overlay.textContent = 'Click to replace';
        }
      });
    });

    async function load() {
      try {
        const s = await repo.SettingsRepository.getAll();
        if (!s) return;
        Object.entries(s).forEach(([key, value]) => {
          const input = form.querySelector(`[name="${key}"]`);
          if (input && value != null) input.value = value;
        });
        ['logo', 'favicon', 'hero_image'].forEach((key) => {
          if (s[key]) {
            imageValues[key] = s[key];
            const box = imageBoxes[key];
            box.style.backgroundImage = `url('${s[key]}')`;
            const ph = box.querySelector('[data-ph]');
            if (ph) ph.style.display = 'none';
          }
        });
      } catch (err) {
        console.error('[Style Story] Could not load settings:', err);
        showToast('Could not load settings.', true);
      }
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';
      const payload = {};
      [...form.elements].forEach((el) => { if (el.name) payload[el.name] = el.value.trim() || null; });
      payload.logo = imageValues.logo;
      payload.favicon = imageValues.favicon;
      payload.hero_image = imageValues.hero_image;
      try {
        await repo.SettingsRepository.update(payload);
        saveConfirm.classList.add('show');
        setTimeout(() => saveConfirm.classList.remove('show'), 2200);
      } catch (err) {
        showToast(err.message || 'Could not save settings.', true);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save settings';
      }
    });

    cleanupBtn.addEventListener('click', async () => {
      cleanupBtn.disabled = true;
      cleanupBtn.textContent = 'Cleaning up…';
      cleanupResult.textContent = '';
      try {
        const [services, gallery, testimonials, stylists, offers, settings] = await Promise.all([
          repo.ServicesRepository.getAll(), repo.GalleryRepository.getAll(), repo.TestimonialsRepository.getAll(),
          repo.StylistsRepository.getAll(), repo.OffersRepository.getAll(), repo.SettingsRepository.getAll(),
        ]);
        const refsByFolder = {
          branding: [settings?.logo, settings?.favicon],
          services: services.map((s) => s.image_url),
          gallery: gallery.map((g) => g.image_url),
          stylists: stylists.map((s) => s.image_url),
          offers: offers.map((o) => o.image_url),
          testimonials: testimonials.map((t) => t.image_url),
          hero: [settings?.hero_image],
        };
        let total = 0;
        for (const [folder, refs] of Object.entries(refsByFolder)) {
          total += await StyleStoryUpload.cleanupOrphanedFiles(folder, refs);
        }
        cleanupResult.textContent = total > 0 ? `Removed ${total} unused file(s).` : 'No unused files found.';
      } catch (err) {
        cleanupResult.textContent = 'Cleanup failed — please try again.';
        console.error('[Style Story] Cleanup failed:', err);
      } finally {
        cleanupBtn.disabled = false;
        cleanupBtn.textContent = 'Clean up unused files';
      }
    });

    load();
  }

});