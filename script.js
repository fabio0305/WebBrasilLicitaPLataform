/* ================================================================
   LICITA BRASIL WEB – Scripts
   ================================================================ */

// ---- Header scroll shadow ----
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 20);
});

// ---- Mobile nav toggle ----
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');

hamburger.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', String(open));
  hamburger.querySelectorAll('span').forEach((s, i) => {
    if (open) {
      if (i === 0) s.style.transform = 'rotate(45deg) translate(5px, 5px)';
      if (i === 1) s.style.opacity = '0';
      if (i === 2) s.style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      s.style.transform = '';
      s.style.opacity = '';
    }
  });
});

// Close nav on link click
nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    hamburger.querySelectorAll('span').forEach(s => {
      s.style.transform = '';
      s.style.opacity = '';
    });
  });
});

// ---- Counter animation ----
function animateCounter(el, target, duration = 2000, suffix = '') {
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(ease * target);
    el.textContent = current.toLocaleString('pt-BR');
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target.toLocaleString('pt-BR');
  };
  requestAnimationFrame(update);
}

const statsSection = document.getElementById('stats');
let statsAnimated = false;

const statsData = [
  { id: 'stat-0', count: 128400 },
  { id: 'stat-1', count: 47 },
  { id: 'stat-2', count: 3800 },
  { id: 'stat-3', count: 89000 },
  { id: 'stat-4', count: 28 },
];

// ---- Intersection Observer ----
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    // Stats counters
    if (entry.target === statsSection && !statsAnimated) {
      statsAnimated = true;
      statsData.forEach(({ id, count }) => {
        const el = document.getElementById(id);
        if (el) animateCounter(el, count, 2200);
      });
    }

    // Fade-up cards
    if (entry.target.classList.contains('observe-anim')) {
      entry.target.classList.add('anim-fade-up');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

if (statsSection) observer.observe(statsSection);

// Observe animatable elements
document.querySelectorAll(
  '.profile-card, .feature-card, .step, .testimonial-card, .news-card, .stat-item'
).forEach((el, i) => {
  el.classList.add('observe-anim');
  el.style.animationDelay = `${(i % 4) * 0.1}s`;
  observer.observe(el);
});

// ---- Smooth active nav highlight ----
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav__link:not(.nav__link--btn)');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.style.color = '';
        link.style.background = '';
        if (link.getAttribute('href') === `#${entry.target.id}`) {
          link.style.color = 'var(--blue-700)';
          link.style.background = 'var(--blue-50)';
        }
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => navObserver.observe(s));

// ---- Search input UX ----
const searchInput = document.querySelector('.search-box__input');
const searchBtn = document.querySelector('.search-box__btn');

if (searchInput && searchBtn) {
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchBtn.click();
  });

  searchBtn.addEventListener('click', () => {
    const q = searchInput.value.trim();
    if (q) {
      searchBtn.textContent = 'Buscando...';
      setTimeout(() => {
        searchBtn.innerHTML = `<svg viewBox="0 0 20 20" fill="currentColor" class="btn__icon"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg> Buscar`;
      }, 1500);
    }
  });
}

// ---- Search tag clicks ----
document.querySelectorAll('.search-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = tag.textContent;
      searchInput.focus();
    }
  });
});
