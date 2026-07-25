(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  // Backend is deployed separately on Render (different origin from GitHub Pages),
  // so the contact form needs the full URL instead of a relative path.
  // Replace this with your actual Render service URL.
  const API_BASE_URL = 'https://https://portfolio-kdaz.onrender.com';

  /* ============================================
     Preloader
     ============================================ */
  window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    setTimeout(() => {
      preloader.classList.add('hidden');
      document.body.classList.add('loaded');
      playHeroReveal();
    }, 1500);
  });

  /* ============================================
     Custom cursor
     ============================================ */
  if (!isTouch) {
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    let dotX = 0, dotY = 0, ringX = 0, ringY = 0;

    window.addEventListener('mousemove', (e) => {
      dotX = e.clientX; dotY = e.clientY;
    });

    function animateCursor() {
      ringX += (dotX - ringX) * 0.18;
      ringY += (dotY - ringY) * 0.18;
      dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%,-50%)`;
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    document.querySelectorAll('a, button, [data-tilt]').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-active'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-active'));
    });
  }

  /* ============================================
     Scroll progress bar
     ============================================ */
  const scrollProgress = document.getElementById('scrollProgress');
  function updateScrollProgress() {
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    scrollProgress.style.width = scrolled + '%';
  }

  /* ============================================
     Header state + nav toggle
     ============================================ */
  const header = document.getElementById('siteHeader');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  function updateHeader() {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }

  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open);
  });
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', false);
    });
  });

  /* ============================================
     Active nav link via IntersectionObserver
     ============================================ */
  const sections = document.querySelectorAll('main section[id]');
  const navLinkEls = document.querySelectorAll('.nav-link');

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinkEls.forEach(link => {
          link.classList.toggle('active', link.dataset.section === id);
        });
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

  sections.forEach(sec => navObserver.observe(sec));

  /* ============================================
     Generic reveal-on-scroll (fade/slide up)
     ============================================ */
  const revealEls = document.querySelectorAll('.reveal-up, .reveal-line, .timeline-item, .skill-bar');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealEls.forEach(el => revealObserver.observe(el));

  document.querySelectorAll('.skill-bar').forEach(bar => {});

  /* ============================================
     Hero entrance sequence (staggered lines)
     ============================================ */
  function playHeroReveal() {
    const lines = document.querySelectorAll('.hero .reveal-line');
    lines.forEach((el, i) => {
      setTimeout(() => el.classList.add('in-view'), 120 * i);
    });
  }

  /* ============================================
     Role cycling text (typing effect)
     ============================================ */
  const roles = [
    'interfaces that feel alive',
    'ideas into digital experiences',
    'products people actually need',
    'clean code and clean UI',
    'things for the internet'
  ];
  const roleEl = document.getElementById('roleCycle');
  let roleIndex = 0;

  function typeRole() {
    if (reduceMotion) { roleEl.textContent = roles[0]; return; }
    const current = roles[roleIndex];
    let charIndex = current.length;

    const eraseInterval = setInterval(() => {
      roleEl.textContent = current.slice(0, charIndex);
      charIndex--;
      if (charIndex < 0) {
        clearInterval(eraseInterval);
        roleIndex = (roleIndex + 1) % roles.length;
        const next = roles[roleIndex];
        let writeIndex = 0;
        const writeInterval = setInterval(() => {
          roleEl.textContent = next.slice(0, writeIndex);
          writeIndex++;
          if (writeIndex > next.length) {
            clearInterval(writeInterval);
            setTimeout(typeRole, 2200);
          }
        }, 32);
      }
    }, 22);
  }
  setTimeout(typeRole, 3200);

  /* ============================================
     Animated counters
     ============================================ */
  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  counters.forEach(c => counterObserver.observe(c));

  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    if (reduceMotion) { el.textContent = target; return; }
    const duration = 1400;
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ============================================
     Hero low-poly cluster — mouse parallax + scroll parallax
     ============================================ */
  const heroVisual = document.getElementById('heroVisual');
  const polyCluster = document.getElementById('polyCluster');
  const baseRX = 12, baseRY = 0, baseRZ = -6;

  if (!reduceMotion && !isTouch && heroVisual && polyCluster) {
    heroVisual.addEventListener('mousemove', (e) => {
      const rect = heroVisual.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      const rx = baseRX - py * 16;
      const ry = baseRY + px * 20;
      const rz = baseRZ + px * 6;
      polyCluster.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`;
    });
    heroVisual.addEventListener('mouseleave', () => {
      polyCluster.style.transform = `rotateX(${baseRX}deg) rotateY(${baseRY}deg) rotateZ(${baseRZ}deg)`;
    });
  }

  /* ============================================
     Parallax on scroll (hero glow blobs + stack)
     ============================================ */
  const glowA = document.querySelector('.hero-glow-a');
  const glowB = document.querySelector('.hero-glow-b');

  function updateParallax() {
    if (reduceMotion) return;
    const y = window.scrollY;
    if (glowA) glowA.style.transform = `translateY(${y * 0.18}px)`;
    if (glowB) glowB.style.transform = `translateY(${y * -0.12}px)`;
    if (heroVisual) {
      const heroHeight = document.querySelector('.hero').offsetHeight;
      const progress = Math.min(y / heroHeight, 1);
      heroVisual.style.transform = `translateY(${progress * 60}px)`;
      heroVisual.style.opacity = String(1 - progress * 0.8);
    }
  }

  /* ============================================
     Project card 3D tilt
     ============================================ */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${-py * 8}deg) rotateY(${px * 10}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateY(0)';
      });
    });
  }

  /* ============================================
     Timeline scroll-linked fill
     ============================================ */
  const timeline = document.getElementById('timeline');
  const timelineFill = document.getElementById('timelineFill');

  function updateTimelineFill() {
    if (!timeline || !timelineFill) return;
    const rect = timeline.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = rect.height;
    const visible = Math.min(Math.max(vh * 0.75 - rect.top, 0), total);
    const pct = total > 0 ? (visible / total) * 100 : 0;
    timelineFill.style.height = pct + '%';
  }

  /* ============================================
     Back to top
     ============================================ */
  const backToTop = document.getElementById('backToTop');
  function updateBackToTop() {
    if (window.scrollY > 600) backToTop.style.opacity = '1';
    else backToTop.style.opacity = '0';
  }
  backToTop.style.transition = 'opacity 0.3s ease';
  backToTop.style.opacity = '0';
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ============================================
     Master scroll handler (rAF throttled)
     ============================================ */
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateScrollProgress();
        updateHeader();
        updateParallax();
        updateTimelineFill();
        updateBackToTop();
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll);
  onScroll();

  /* ============================================
     Contact form (front-end only validation + fake submit)
     ============================================ */
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const submitLabel = document.getElementById('submitLabel');
  const formSuccess = document.getElementById('formSuccess');
  const formServerError = document.getElementById('formServerError');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    const nameField = document.getElementById('name');
    const emailField = document.getElementById('email');
    const messageField = document.getElementById('message');
    const companyField = document.getElementById('company'); // honeypot

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    toggleFieldError(nameField, nameField.value.trim().length > 1);
    toggleFieldError(emailField, emailPattern.test(emailField.value.trim()));
    toggleFieldError(messageField, messageField.value.trim().length > 4);

    [nameField, emailField, messageField].forEach(f => {
      if (f.closest('.form-field').classList.contains('invalid')) valid = false;
    });

    if (!valid) return;

    formServerError.classList.remove('show');
    submitLabel.textContent = 'Sending...';
    submitBtn.disabled = true;

    try {
      const res = await fetch(`https://portfolio-kdaz.onrender.com/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameField.value.trim(),
          email: emailField.value.trim(),
          message: messageField.value.trim(),
          company: companyField ? companyField.value.trim() : ''
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      formSuccess.classList.add('show');
      form.reset();
      setTimeout(() => formSuccess.classList.remove('show'), 5000);
    } catch (err) {
      formServerError.textContent = err.message || 'Something went wrong. Please try again.';
      formServerError.classList.add('show');
    } finally {
      submitLabel.textContent = 'Send message';
      submitBtn.disabled = false;
    }
  });

  function toggleFieldError(field, isValid) {
    const wrap = field.closest('.form-field');
    wrap.classList.toggle('invalid', !isValid);
  }

  /* ============================================
     Footer year
     ============================================ */
  document.getElementById('year').textContent = new Date().getFullYear();

})();
