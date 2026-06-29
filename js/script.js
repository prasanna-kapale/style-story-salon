/**
 * STYLE STORY — INTERACTION LAYER
 * Vanilla JS + GSAP (CDN). No build step. Drop-in for Netlify.
 */

document.addEventListener('DOMContentLoaded', async () => {

  const repo = StyleStoryRepo;
  const isRepeatVisit = sessionStorage.getItem('ss_intro_seen') === '1';

  /* ============================================================
     -1. DATA LOADING HELPERS — skeleton / empty / error states
     (Supabase calls are real network requests now, so every section
     that depends on them needs a loading + failure path.)
  ============================================================ */
  function showSkeleton(host, count, className) {
    host.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = `skeleton-block ${className}`;
      host.appendChild(el);
    }
  }
  function showLoadError(host, message) {
    host.innerHTML = `<div class="data-error">
      <p>${message}</p>
      <a href="#" class="data-error-wa">Message us on WhatsApp instead</a>
    </div>`;
    const waLink = host.querySelector('.data-error-wa');
    if (waLink) waLink.href = `https://wa.me/${settings?.whatsappNumber || ''}`;
  }

  let settings;
  try {
    settings = await repo.getSettings();
  } catch (err) {
    console.error('[Style Story] Could not load settings:', err);
    settings = { brandName: 'Style Story', whatsappNumber: '', phoneDisplay: '', instagramHandle: '', hours: '', address: '' };
  }
  if (settings.seoTitle) document.title = settings.seoTitle;
  if (settings.seoDescription) {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', settings.seoDescription);
  }
  if (settings.favicon) {
    let icon = document.querySelector('link[rel="icon"]');
    if (!icon) { icon = document.createElement('link'); icon.rel = 'icon'; document.head.appendChild(icon); }
    icon.href = settings.favicon;
  }

  /* ============================================================
     0. SIGNATURE INTRO — straight lines ripple into a wave,
        then settle, echoing the real Style Story logomark
        (hair at rest -> hair in motion -> the mark).
  ============================================================ */
  function runIntro() {
    const alreadySeen = sessionStorage.getItem('ss_intro_seen');
    const introEl = document.getElementById('intro');

    if (alreadySeen) {
      introEl.style.display = 'none';
      document.body.classList.add('intro-done');
      return;
    }

    sessionStorage.setItem('ss_intro_seen', '1');

    const lines = ['#i-line-1', '#i-line-2', '#i-line-3', '#i-line-4', '#i-line-5', '#i-line-6', '#i-line-7', '#i-line-8'];

    const tl = gsap.timeline({
      onComplete: () => document.body.classList.add('intro-done')
    });

    gsap.set(lines, { opacity: 0, scaleY: 0, transformOrigin: 'center center' });

    // 1. lines draw in, straight, in sequence (hair at rest)
    tl.to(lines, { opacity: 1, scaleY: 1, duration: 0.6, ease: 'power2.out', stagger: 0.06 });

    // 2. ripple: each line skews/bows in sequence (hair catching motion)
    lines.forEach((sel, i) => {
      const amp = 10 + (i % 3) * 4;
      tl.to(sel, {
        skewX: i % 2 === 0 ? amp : -amp,
        x: i % 2 === 0 ? 4 : -4,
        duration: 0.45,
        ease: 'sine.inOut',
      }, 0.7 + i * 0.05)
      .to(sel, {
        skewX: 0,
        x: 0,
        duration: 0.5,
        ease: 'sine.inOut',
      }, 0.7 + i * 0.05 + 0.45);
    });
  }
  runIntro();
  
  /* ============================================================
     1. NAV — scroll state, burger menu, smooth-scroll links
  ============================================================ */
  const nav = document.getElementById('site-nav');
  const burger = document.getElementById('nav-burger');
  const mobileMenu = document.getElementById('mobile-menu');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    updateScrollProgress();
  }, { passive: true });

  burger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    burger.setAttribute('aria-expanded', isOpen);
  });
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.remove('open')));

  /* ============================================================
     2. SCROLL PROGRESS BAR
  ============================================================ */
  function updateScrollProgress() {
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    document.getElementById('scroll-progress-bar').style.width = scrolled + '%';
  }

  /* ============================================================
     3. CURSOR GLOW (desktop)
  ============================================================ */
  const glow = document.getElementById('cursor-glow');
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('mousemove', e => {
      glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      glow.classList.add('active');
    });
    document.addEventListener('mouseleave', () => glow.classList.remove('active'));
  }

  /* ============================================================
     4. MAGNETIC BUTTONS
  ============================================================ */
  document.querySelectorAll('[data-magnetic]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.22}px, ${y * 0.3}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = 'translate(0,0)'; });
  });

  /* ============================================================
     5. SCROLL REVEALS (IntersectionObserver)
  ============================================================ */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('[data-reveal], [data-reveal-lines]').forEach(el => revealObserver.observe(el));

  // Hero title word-by-word stagger on load
  const heroWords = document.querySelectorAll('.hero-title .word');
  heroWords.forEach(w => {
    w.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)';
    w.style.opacity = '0';
    w.style.transform = 'translateY(24px)';
  });
  const introWasSkipped = isRepeatVisit;
  setTimeout(() => {
    heroWords.forEach((word, i) => {
      setTimeout(() => { word.style.opacity = '1'; word.style.transform = 'translateY(0)'; }, i * 90);
    });
  }, introWasSkipped ? 200 : 3300);

  /* ============================================================
     6. HERO FLOATING PARTICLES
  ============================================================ */
  const particleHost = document.getElementById('hero-particles');
  for (let i = 0; i < 22; i++) {
    const p = document.createElement('div');
    p.className = 'hero-particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.animation = `floatParticle ${8 + Math.random() * 10}s ease-in-out infinite`;
    p.style.animationDelay = (Math.random() * 5) + 's';
    particleHost.appendChild(p);
  }
  const styleTag = document.createElement('style');
  styleTag.textContent = `@keyframes floatParticle { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-30px) translateX(12px); } }`;
  document.head.appendChild(styleTag);

  /* ============================================================
     7. ANIMATED STAT COUNTERS
  ============================================================ */
  const counters = document.querySelectorAll('.stat-num');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  counters.forEach(c => counterObserver.observe(c));

  function animateCounter(el) {
    const target = parseFloat(el.dataset.count);
    const isDecimal = el.dataset.decimal === 'true';
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = target * eased;
      el.textContent = isDecimal ? val.toFixed(1) : Math.round(val);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ============================================================
     8. SERVICES — render + category filter
  ============================================================ */
  const tabsHost = document.getElementById('services-tabs');
  const listHost = document.getElementById('services-list');
  showSkeleton(listHost, 6, 'skeleton-service');

  let services = [];
  try {
    services = await repo.getServices();
  } catch (err) {
    console.error('[Style Story] Could not load services:', err);
    showLoadError(listHost, "We couldn't load our services right now.");
  }

  if (services.length === 0 && !listHost.querySelector('.data-error')) {
    listHost.innerHTML = '<p class="empty-state">Our service menu is being updated — please check back shortly.</p>';
  }

  const categories = ['All', ...new Set(services.map(s => s.category))];
  categories.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.className = 'service-tab' + (i === 0 ? ' active' : '');
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      tabsHost.querySelectorAll('.service-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderServices(cat);
    });
    tabsHost.appendChild(btn);
  });

  function renderServices(filter) {
    if (services.length === 0) return;
    listHost.innerHTML = '';
    const filtered = filter === 'All' ? services : services.filter(s => s.category === filter);
    filtered.forEach(s => {
      const card = document.createElement('div');
      card.className = 'service-card';
      card.innerHTML = `
        <span class="service-cat">${s.category}</span>
        <h3 class="service-name">${s.name}</h3>
        <p class="service-desc">${s.description}</p>
        <div class="service-meta">
          <span class="service-price">From ₹${s.priceFrom.toLocaleString('en-IN')}</span>
          <span class="service-duration">${s.duration}</span>
        </div>`;
      card.addEventListener('click', () => openBookingWithService(s.id));
      listHost.appendChild(card);
    });
  }
  if (services.length > 0) renderServices('All');

  /* ============================================================
     9. GALLERY — horizontal track + lightbox
  ============================================================ */
  const galleryTrack = document.getElementById('gallery-track');
  showSkeleton(galleryTrack, 4, 'skeleton-gallery');

  let gallery = [];
  try {
    gallery = await repo.getGalleryItems();
  } catch (err) {
    console.error('[Style Story] Could not load gallery:', err);
    showLoadError(galleryTrack, "We couldn't load the gallery right now.");
  }

  if (gallery.length === 0 && !galleryTrack.querySelector('.data-error')) {
    galleryTrack.innerHTML = '<p class="empty-state">New photos are on their way — check back soon.</p>';
  }

  if (gallery.length > 0) galleryTrack.innerHTML = '';
  gallery.forEach(g => {
    const item = document.createElement('div');
    item.className = 'gallery-item' + (g.size === 'large' ? ' featured' : '');
    if (g.imageUrl) {
      item.style.backgroundImage = `url("${g.imageUrl}")`;
      item.style.backgroundSize = 'cover';
      item.style.backgroundPosition = 'center';
      item.innerHTML = `
        <span class="gallery-cat">${g.category}</span>
        <span class="gallery-label">${g.label}</span>`;
    } else {
      item.innerHTML = `
        <svg class="gallery-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <span class="gallery-cat">${g.category}</span>
        <span class="gallery-label">${g.label}</span>`;
    }
    item.addEventListener('click', () => openLightbox(g.label, g.imageUrl));
    galleryTrack.appendChild(item);
  });

  // drag-to-scroll
  const trackWrap = document.querySelector('.gallery-track-wrap');
  let isDown = false, startX, scrollLeft;
  trackWrap.addEventListener('mousedown', e => { isDown = true; startX = e.pageX; scrollLeft = trackWrap.scrollLeft; trackWrap.style.cursor = 'grabbing'; });
  window.addEventListener('mouseup', () => { isDown = false; trackWrap.style.cursor = 'grab'; });
  trackWrap.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    trackWrap.scrollLeft = scrollLeft - (e.pageX - startX) * 1.4;
  });

  function openLightbox(label, imageUrl) {
    const lb = document.getElementById('lightbox');
    const content = document.getElementById('lightbox-content');
    content.innerHTML = imageUrl
      ? `<img src="${imageUrl}" alt="${label}" style="max-width:100%;max-height:100%;object-fit:contain;">`
      : '';
    if (!imageUrl) content.textContent = label;
    lb.classList.add('open');
  }
  document.getElementById('lightbox-close').addEventListener('click', () => document.getElementById('lightbox').classList.remove('open'));
  document.getElementById('lightbox').addEventListener('click', e => { if (e.target.id === 'lightbox') e.target.classList.remove('open'); });

  /* ============================================================
     10. TEAM
  ============================================================ */
  const teamGrid = document.getElementById('team-grid');
  showSkeleton(teamGrid, 3, 'skeleton-team');

  let stylists = [];
  try {
    stylists = await repo.getStylists();
  } catch (err) {
    console.error('[Style Story] Could not load stylists:', err);
    showLoadError(teamGrid, "We couldn't load the team right now.");
  }

  if (stylists.length === 0 && !teamGrid.querySelector('.data-error')) {
    teamGrid.innerHTML = '<p class="empty-state">Meet the team in person — details coming soon.</p>';
  }

  if (stylists.length > 0) teamGrid.innerHTML = '';
  stylists.forEach(s => {
    const card = document.createElement('div');
    card.className = 'team-card';
    const portraitInner = s.imageUrl
      ? ''
      : `<span class="team-initial">${(s.specialization || '?').charAt(0)}</span>`;
    card.innerHTML = `
      <div class="team-portrait"${s.imageUrl ? ` style="background-image:url('${s.imageUrl}');background-size:cover;background-position:center;"` : ''}>${portraitInner}</div>
      <p class="team-name">${s.name}</p>
      <p class="team-role">${s.specialization}</p>
      <p class="team-exp">${s.experience} experience</p>`;
    teamGrid.appendChild(card);
  });

  /* ============================================================
     11. TESTIMONIALS
  ============================================================ */
  const tTrack = document.getElementById('testimonials-track');
  showSkeleton(tTrack, 3, 'skeleton-testimonial');

  let testimonials = [];
  try {
    testimonials = await repo.getTestimonials();
  } catch (err) {
    console.error('[Style Story] Could not load testimonials:', err);
    showLoadError(tTrack, "We couldn't load reviews right now.");
  }

  if (testimonials.length === 0 && !tTrack.querySelector('.data-error')) {
    tTrack.innerHTML = '<p class="empty-state">Reviews are on their way.</p>';
  }

  if (testimonials.length > 0) tTrack.innerHTML = '';
  testimonials.forEach(t => {
    const card = document.createElement('div');
    card.className = 't-card';
    const avatarInner = t.imageUrl ? '' : t.avatarInitial;
    card.innerHTML = `
      <div class="t-stars">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</div>
      <p class="t-text">"${t.text}"</p>
      <div class="t-person">
        <div class="t-avatar"${t.imageUrl ? ` style="background-image:url('${t.imageUrl}');background-size:cover;background-position:center;"` : ''}>${avatarInner}</div>
        <div><p class="t-name">${t.name}</p><p class="t-source">${t.source}</p></div>
      </div>`;
    tTrack.appendChild(card);
  });

  /* ============================================================
     12. BEFORE / AFTER SLIDER
  ============================================================ */
  const baFrame = document.getElementById('ba-frame');
  const baAfter = document.getElementById('ba-after');
  const baHandle = document.getElementById('ba-handle');
  let baDragging = false;

  function setBaPosition(clientX) {
    const rect = baFrame.getBoundingClientRect();
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    baAfter.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    baHandle.style.left = pct + '%';
  }
  baFrame.addEventListener('mousedown', e => { baDragging = true; setBaPosition(e.clientX); });
  window.addEventListener('mouseup', () => baDragging = false);
  window.addEventListener('mousemove', e => { if (baDragging) setBaPosition(e.clientX); });
  baFrame.addEventListener('touchstart', e => setBaPosition(e.touches[0].clientX));
  baFrame.addEventListener('touchmove', e => setBaPosition(e.touches[0].clientX));

  /* ============================================================
     13. FAQ ACCORDION
  ============================================================ */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => { i.classList.remove('open'); i.querySelector('.faq-a').style.maxHeight = null; });
      if (!isOpen) { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });

  /* ============================================================
     14. BOOKING FLOW (Apple-checkout style, 4 steps -> Supabase -> WhatsApp)
  ============================================================ */
  const bookingState = { service: null, serviceName: '', stylistId: null, stylist: 'No preference', date: '', time: '', name: '', phone: '', notes: '' };
  let currentStep = 1;
  const totalSteps = 4;

  const servicePickGrid = document.getElementById('service-pick-grid');
  services.forEach(s => {
    const card = document.createElement('div');
    card.className = 'pick-card';
    card.dataset.id = s.id;
    card.innerHTML = `<div class="pc-name">${s.name}</div><div class="pc-meta">From ₹${s.priceFrom.toLocaleString('en-IN')} · ${s.duration}</div>`;
    card.addEventListener('click', () => {
      servicePickGrid.querySelectorAll('.pick-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      bookingState.service = s.id;
      bookingState.serviceName = s.name;
    });
    servicePickGrid.appendChild(card);
  });

  const stylistPickGrid = document.getElementById('stylist-pick-grid');
  const noPrefCard = document.createElement('div');
  noPrefCard.className = 'pick-card selected';
  noPrefCard.innerHTML = `<div class="pc-name">No preference</div><div class="pc-meta">Any available stylist</div>`;
  noPrefCard.addEventListener('click', () => selectStylist(noPrefCard, null, 'No preference'));
  stylistPickGrid.appendChild(noPrefCard);
  stylists.forEach(s => {
    const card = document.createElement('div');
    card.className = 'pick-card';
    card.innerHTML = `<div class="pc-name">${s.specialization}</div><div class="pc-meta">${s.experience}</div>`;
    card.addEventListener('click', () => selectStylist(card, s.id, s.specialization));
    stylistPickGrid.appendChild(card);
  });
  function selectStylist(card, id, name) {
    stylistPickGrid.querySelectorAll('.pick-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    bookingState.stylistId = id;
    bookingState.stylist = name;
  }

  // Can't book a date that's already passed.
  const dateInput = document.getElementById('book-date');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

  function goToStep(n) {
    currentStep = n;
    document.querySelectorAll('.book-step').forEach(p => p.classList.toggle('active', +p.dataset.stepPanel === n));
    document.querySelectorAll('.step').forEach(s => {
      const sNum = +s.dataset.step;
      s.classList.toggle('active', sNum === n);
      s.classList.toggle('done', sNum < n);
    });
    document.getElementById('book-back-btn').style.visibility = n === 1 ? 'hidden' : 'visible';
    const nextBtn = document.getElementById('book-next-btn');
    nextBtn.textContent = n === totalSteps ? 'Continue to WhatsApp' : 'Continue';
    nextBtn.classList.toggle('wa-style', n === totalSteps);
    if (n === totalSteps) renderSummary();
  }

  function formatDateDisplay(isoDate) {
    if (!isoDate) return 'Not specified';
    const d = new Date(isoDate + 'T00:00:00');
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function renderSummary() {
    bookingState.date = document.getElementById('book-date').value || '';
    bookingState.time = document.getElementById('book-time').value || 'Not specified';
    bookingState.name = document.getElementById('book-name').value;
    bookingState.phone = document.getElementById('book-phone').value;
    bookingState.notes = document.getElementById('book-notes').value || '—';

    const rows = [
      ['Service', bookingState.serviceName || 'Not selected'],
      ['Stylist', bookingState.stylist],
      ['Date', formatDateDisplay(bookingState.date)],
      ['Time', bookingState.time],
      ['Name', bookingState.name || '—'],
      ['Phone', bookingState.phone || '—'],
      ['Notes', bookingState.notes],
    ];
    document.getElementById('book-summary').innerHTML = rows.map(([k, v]) =>
      `<div class="summary-row"><span>${k}</span><span>${v}</span></div>`
    ).join('');
  }

  function validateStep(n) {
    if (n === 1 && !bookingState.service) { alert('Please choose a service to continue.'); return false; }
    if (n === 2) {
      const date = document.getElementById('book-date').value;
      const time = document.getElementById('book-time').value;
      if (!date || !time) { alert('Please choose a date and time.'); return false; }
    }
    if (n === 3) {
      const name = document.getElementById('book-name').value.trim();
      const phone = document.getElementById('book-phone').value.trim();
      if (!name || !phone) { alert('Please enter your name and phone number.'); return false; }
    }
    return true;
  }

  document.getElementById('book-next-btn').addEventListener('click', () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < totalSteps) {
      goToStep(currentStep + 1);
    } else {
      confirmBooking();
    }
  });
  document.getElementById('book-back-btn').addEventListener('click', () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  });

  async function confirmBooking() {
    const nextBtn = document.getElementById('book-next-btn');
    const backBtn = document.getElementById('book-back-btn');
    const originalLabel = nextBtn.textContent;
    nextBtn.disabled = true;
    backBtn.disabled = true;
    nextBtn.textContent = 'Confirming…';

    try {
      await StyleStoryBooking.submitBooking({
        customerName: bookingState.name,
        phone: bookingState.phone,
        serviceId: bookingState.service,
        serviceName: bookingState.serviceName,
        stylistId: bookingState.stylistId,
        stylistName: bookingState.stylist,
        bookingDate: bookingState.date,
        dateDisplay: formatDateDisplay(bookingState.date),
        bookingTime: bookingState.time,
        notes: bookingState.notes,
      }, settings.brandName, settings.whatsappNumber);
    } catch (err) {
      console.error('[Style Story] Could not save booking:', err);
      alert("We couldn't save your booking just now, but you can still reach us directly on WhatsApp.");
      window.open(`https://wa.me/${settings.whatsappNumber}`, '_blank');
    } finally {
      nextBtn.disabled = false;
      backBtn.disabled = false;
      nextBtn.textContent = originalLabel;
    }
  }

  function openBookingWithService(serviceId) {
    document.getElementById('book').scrollIntoView({ behavior: 'smooth' });
    const card = servicePickGrid.querySelector(`[data-id="${serviceId}"]`);
    if (card) card.click();
    goToStep(1);
  }

  // Hero / nav book buttons jump straight to booking section
  ['nav-book-btn', 'hero-book-btn', 'mobile-book-btn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
      document.getElementById('book').scrollIntoView({ behavior: 'smooth' });
      mobileMenu.classList.remove('open');
    });
  });

  /* ============================================================
     15. SETTINGS-DRIVEN CONTENT (address, hours, phone, whatsapp)
  ============================================================ */
  document.getElementById('contact-address').textContent = settings.address || 'Address coming soon';
  document.getElementById('contact-hours').textContent = settings.hours || '—';
  document.getElementById('contact-phone').textContent = settings.phoneDisplay || '—';
  document.getElementById('contact-instagram').textContent = settings.instagramHandle || '—';

  const waLink = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(`Hi ${settings.brandName}, I would like to book an appointment.`)}`
    : '#';
  document.getElementById('contact-wa-btn').href = waLink;
  document.getElementById('float-wa').addEventListener('click', () => { if (waLink !== '#') window.open(waLink, '_blank'); });

});