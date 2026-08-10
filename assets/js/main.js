(() => {
  const root = document.documentElement;
  const savedTheme = localStorage.getItem('kha-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = savedTheme || (prefersDark ? 'dark' : 'light');

  document.querySelector('.theme-toggle')?.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = nextTheme;
    localStorage.setItem('kha-theme', nextTheme);
  });

  const nav = document.querySelector('.site-nav');
  const menuButton = document.querySelector('.menu-toggle');
  menuButton?.addEventListener('click', () => {
    const isOpen = nav?.classList.toggle('open') ?? false;
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('.site-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      nav?.classList.remove('open');
      menuButton?.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      nav?.classList.remove('open');
      menuButton?.setAttribute('aria-expanded', 'false');
    }
  });

  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  const config = window.SITE_CONFIG || {};
  if (config.showCV && config.cvUrl) {
    document.querySelectorAll('.cv-link').forEach((link) => {
      link.hidden = false;
      link.href = config.cvUrl;
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener');
    });
  }

  if (config.showProfilePhoto && config.profilePhotoUrl) {
    document.querySelectorAll('[data-profile-image]').forEach((image) => {
      image.src = config.profilePhotoUrl;
      image.alt = 'Portrait of Kazi Hafiz Md. Asad';
    });
  }

  const revealElements = Array.from(document.querySelectorAll('.reveal'));
  const initialViewportLimit = window.innerHeight * 1.08;

  /*
    Make the first viewport visible synchronously.
    This prevents a blank first screen if IntersectionObserver is delayed
    by the browser, GitHub Pages caching, or animation startup.
  */
  revealElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.top <= initialViewportLimit) {
      element.classList.add('visible');
    }
  });

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.04,
        rootMargin: '0px 0px 12% 0px'
      })
    : null;

  revealElements.forEach((element) => {
    if (element.classList.contains('visible')) return;

    if (observer) {
      observer.observe(element);
    } else {
      element.classList.add('visible');
    }
  });

  /*
    Hidden reveal styling is enabled only AFTER the safe initialization above.
    If this script ever fails before this point, the content remains visible.
  */
  requestAnimationFrame(() => {
    root.classList.add('reveal-ready');
  });

  const publicationButtons = document.querySelectorAll('[data-filter]');
  const publicationItems = document.querySelectorAll('[data-publication]');
  publicationButtons.forEach((button) => {
    button.addEventListener('click', () => {
      publicationButtons.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      const filter = button.dataset.filter;
      publicationItems.forEach((item) => {
        item.hidden = filter !== 'all' && item.dataset.publication !== filter;
      });
    });
  });

  const projectButtons = document.querySelectorAll('[data-project-filter]');
  const projectItems = document.querySelectorAll('[data-project]');
  projectButtons.forEach((button) => {
    button.addEventListener('click', () => {
      projectButtons.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      const filter = button.dataset.projectFilter;
      projectItems.forEach((item) => {
        const categories = (item.dataset.project || '').split(/\s+/);
        item.hidden = filter !== 'all' && !categories.includes(filter);
      });
    });
  });

  document.querySelector('[data-copy-email]')?.addEventListener('click', async (event) => {
    const email = 'kazi.asad@northsouth.edu';
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText(email);
      const original = button.textContent;
      button.textContent = 'Email copied';
      setTimeout(() => { button.textContent = original; }, 1600);
    } catch (_) {
      window.location.href = `mailto:${email}`;
    }
  });
})();
