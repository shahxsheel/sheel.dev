const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-button');
const mobileNav = document.querySelector('.mobile-nav');

let headerFrame = 0;
const syncHeader = () => header?.classList.toggle('scrolled', window.scrollY > 8);
syncHeader();
window.addEventListener('scroll', () => {
  if (headerFrame) return;
  headerFrame = requestAnimationFrame(() => { headerFrame = 0; syncHeader(); });
}, { passive: true });

const setMenu = (open) => {
  menuButton?.setAttribute('aria-expanded', String(open));
  menuButton?.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  if (mobileNav) mobileNav.dataset.open = String(open);
};

menuButton?.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || menuButton?.getAttribute('aria-expanded') !== 'true') return;
  setMenu(false);
  menuButton.focus();
});

mobileNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenu(false));
});

document.querySelectorAll('[data-copy-email]').forEach((button) => {
  button.addEventListener('click', async () => {
    const email = button.dataset.copyEmail;
    const label = button.querySelector('[data-copy-label]');
    const state = button.parentElement?.querySelector('[data-copy-status]');
    try {
      await navigator.clipboard.writeText(email);
      if (label) label.textContent = 'copied ✓';
      if (state) state.textContent = 'Email copied to clipboard.';
      window.setTimeout(() => {
        if (label) label.textContent = 'copy';
        if (state) state.textContent = '';
      }, 1800);
    } catch {
      if (state) state.textContent = `Opening email app for ${email}.`;
      window.location.href = `mailto:${email}`;
    }
  });
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('[data-hero-art]').forEach((artwork) => {
  if (reducedMotion.matches) return;
  const pointerArea = artwork.closest('.hero-stage') || artwork;

  // A high-polling mouse fires pointermove far more often than the screen
  // refreshes, and getBoundingClientRect forces a layout every time. Keep the
  // latest position and do the measure/write once per frame instead.
  let pointer = null;
  let frame = 0;

  const apply = () => {
    frame = 0;
    const bounds = artwork.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const x = ((pointer.x - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((pointer.y - bounds.top) / bounds.height - 0.5) * 2;
    artwork.style.setProperty('--pull-x', `${(x * 14).toFixed(2)}px`);
    artwork.style.setProperty('--pull-y', `${(y * 9).toFixed(2)}px`);
  };

  pointerArea.addEventListener('pointermove', (event) => {
    pointer = { x: event.clientX, y: event.clientY };
    if (!frame) frame = requestAnimationFrame(apply);
  });

  pointerArea.addEventListener('pointerleave', () => {
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
    artwork.style.setProperty('--pull-x', '0px');
    artwork.style.setProperty('--pull-y', '0px');
  });
});

document.querySelectorAll('[data-bit-trigger]').forEach((button) => {
  const mascot = button.closest('.build-bit-wrap')?.querySelector('object');
  button.addEventListener('click', () => {
    const hitbox = mascot?.contentDocument?.getElementById('hitbox');
    hitbox?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
});

document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const slides = Array.from(carousel.querySelectorAll('[data-carousel-slide]'));
  const thumbnails = Array.from(carousel.querySelectorAll('[data-carousel-thumb]'));
  const stageProgress = carousel.querySelector('.carousel-stage-progress');
  const rotationToggle = carousel.querySelector('[data-carousel-toggle]');
  const rotationLabel = carousel.querySelector('[data-carousel-toggle-label]');
  const interval = Number(carousel.dataset.interval) || 6700;
  let current = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));
  let timer;
  // Hover, keyboard focus and page visibility can each pause the carousel.
  // Naming the holds stops one of them resuming while another still wants it
  // paused -- returning to the tab used to restart autoplay under a focused slide.
  const holds = new Set();

  const syncPausedState = () => {
    const motionOff = reducedMotion.matches;
    const manuallyPaused = holds.has('user');
    carousel.dataset.paused = String(holds.size > 0 || motionOff);
    if (!rotationToggle) return;
    rotationToggle.disabled = motionOff;
    rotationToggle.setAttribute('aria-pressed', String(manuallyPaused || motionOff));
    if (rotationLabel) {
      rotationLabel.textContent = motionOff
        ? 'Rotation off'
        : manuallyPaused ? 'Resume rotation' : 'Pause rotation';
    }
  };

  const schedule = () => {
    window.clearTimeout(timer);
    if (holds.size || reducedMotion.matches || slides.length < 2) return;
    timer = window.setTimeout(() => show(current + 1), interval);
  };

  const show = (nextIndex, moveFocus = false) => {
    current = (nextIndex + slides.length) % slides.length;

    slides.forEach((slide, index) => {
      const active = index === current;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      slide.tabIndex = active ? 0 : -1;
    });

    thumbnails.forEach((thumbnail, index) => {
      const active = index === current;
      thumbnail.classList.toggle('is-active', active);
      thumbnail.setAttribute('aria-pressed', String(active));
    });

    void thumbnails[current]?.offsetWidth;
    stageProgress?.classList.remove('is-running');
    void stageProgress?.offsetWidth;
    stageProgress?.classList.add('is-running');
    if (moveFocus) thumbnails[current]?.focus();
    schedule();
  };

  const hold = (reason) => {
    holds.add(reason);
    window.clearTimeout(timer);
    syncPausedState();
  };

  const release = (reason) => {
    holds.delete(reason);
    syncPausedState();
    if (holds.size || reducedMotion.matches) return;
    show(current);
  };

  thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener('click', () => show(index));
  });

  carousel.addEventListener('keydown', (event) => {
    if (!event.target.closest('[data-carousel-thumb]') || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    show(current + (event.key === 'ArrowRight' ? 1 : -1), true);
  });

  rotationToggle?.addEventListener('click', () => {
    if (!holds.has('user')) {
      hold('user');
      return;
    }

    // An explicit resume wins over the automatic focus and hover pauses while
    // the toggle remains focused and under the pointer. A later focus move or
    // pointer re-entry pauses again.
    holds.delete('user');
    holds.delete('focus');
    holds.delete('hover');
    syncPausedState();
    if (!holds.size && !reducedMotion.matches) show(current);
  });

  carousel.addEventListener('focusin', () => hold('focus'));
  carousel.addEventListener('focusout', (event) => {
    if (!carousel.contains(event.relatedTarget)) release('focus');
  });

  // Reading a slide shouldn't race a 6.7s timer (WCAG 2.2.2). Touch is excluded:
  // pointerenter fires on tap but pointerleave often never does.
  carousel.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') hold('hover');
  });
  carousel.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse') release('hover');
  });

  document.addEventListener('visibilitychange', () => {
    document.hidden ? hold('page') : release('page');
  });

  reducedMotion.addEventListener('change', () => {
    window.clearTimeout(timer);
    syncPausedState();
    if (!holds.size && !reducedMotion.matches) show(current);
  });

  syncPausedState();
  show(current);
});

// Carousel thumbnails mirror their slide's graphic, held as a still frame.
document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const slides = carousel.querySelectorAll('[data-carousel-slide]');
  carousel.querySelectorAll('[data-carousel-thumb]').forEach((thumb, i) => {
    const source = slides[i] && slides[i].querySelector('.viz');
    const target = thumb.querySelector('.project-visual');
    if (!source || !target || target.querySelector('svg')) return;
    const still = source.cloneNode(true);
    still.classList.add('viz-still');
    still.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    target.appendChild(still);
  });
});
