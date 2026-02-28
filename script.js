/**
 * ============================================
 * Steven Van Overmeiren - Portfolio
 * Main JavaScript
 * ============================================
 *
 * Features:
 *   1. Mobile Navigation (hamburger toggle)
 *   2. Navbar Scroll Effect (shrink on scroll)
 *   3. Scroll Reveal Animations (IntersectionObserver)
 *   4. Image Carousel (auto-built from .gallery elements)
 *   5. Image Modal (click-to-zoom lightbox)
 *   6. Active Nav Link Detection
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------
   * 1. MOBILE NAVIGATION
   * Toggles the hamburger menu and closes
   * the menu when a link is clicked.
   * ---------------------------------------- */
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      toggle.classList.toggle('active');
    });

    // Close mobile menu when any link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.classList.remove('active');
      });
    });
  }

  /* ----------------------------------------
   * 2. NAVBAR SCROLL EFFECT
   * Adds a .scrolled class to the navbar
   * after scrolling past 30px for a subtle
   * shadow / background change.
   * ---------------------------------------- */
  const navbar = document.querySelector('.navbar');

  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });
  }

  /* ----------------------------------------
   * 3. SCROLL REVEAL ANIMATIONS
   * Uses IntersectionObserver to fade-in
   * elements as they enter the viewport.
   *
   * - .reveal: single element fade-in
   * - .reveal-stagger: children animate
   *   sequentially with staggered delays
   * ---------------------------------------- */
  const revealSingle = document.querySelectorAll(
    '.detail-section, .highlight-card, .about-card, ' +
    '.detail-columns, .hero-content, .resume-embed, .sub-project-card'
  );

  const revealStagger = document.querySelectorAll(
    '.projects-grid, .contact-links, .skills-list, ' +
    '.tools-list, .sub-projects-grid'
  );

  const observerOptions = {
    threshold: 0.08,
    rootMargin: '0px 0px -30px 0px'
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target); // Only animate once
      }
    });
  }, observerOptions);

  // Attach single-element reveal
  revealSingle.forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
  });

  // Attach stagger reveal (children animate sequentially)
  revealStagger.forEach(el => {
    el.classList.add('reveal-stagger');
    revealObserver.observe(el);
  });

  // Project cards & contact links get individual reveal
  document.querySelectorAll('.project-card, .contact-link').forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
  });

  /* ----------------------------------------
   * 4. IMAGE CAROUSEL
   * Auto-converts any .gallery with 2+
   * .gallery-item children into a carousel
   * with arrows, dots, counter, keyboard
   * navigation, and touch swipe support.
   * ---------------------------------------- */
  document.querySelectorAll('.gallery').forEach(gallery => {
    const items = gallery.querySelectorAll('.gallery-item');

    // Only create carousel if there are multiple images
    if (items.length < 2) return;

    gallery.classList.add('carousel-active');

    // -- Build carousel track (wraps all items) --
    const track = document.createElement('div');
    track.className = 'carousel-track';
    items.forEach(item => track.appendChild(item));
    gallery.appendChild(track);

    // -- Image counter badge (e.g. "1 / 7") --
    const counter = document.createElement('div');
    counter.className = 'carousel-counter';
    track.appendChild(counter);

    // -- Previous arrow --
    const prevBtn = document.createElement('button');
    prevBtn.className = 'carousel-arrow prev';
    prevBtn.innerHTML = '&#10094;';
    prevBtn.setAttribute('aria-label', 'Previous image');
    track.appendChild(prevBtn);

    // -- Next arrow --
    const nextBtn = document.createElement('button');
    nextBtn.className = 'carousel-arrow next';
    nextBtn.innerHTML = '&#10095;';
    nextBtn.setAttribute('aria-label', 'Next image');
    track.appendChild(nextBtn);

    // -- Dot indicators --
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'carousel-dots';
    items.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', `Go to image ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    });
    gallery.appendChild(dotsContainer);

    // -- Carousel state --
    let current = 0;

    /**
     * Navigate to a specific slide index.
     * Wraps around using modulo for infinite looping.
     */
    function goTo(index) {
      items[current].classList.remove('active');
      dotsContainer.children[current].classList.remove('active');
      current = (index + items.length) % items.length;
      items[current].classList.add('active');
      dotsContainer.children[current].classList.add('active');
      counter.textContent = `${current + 1} / ${items.length}`;
    }

    // Arrow click handlers
    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));

    // Keyboard navigation (left/right arrows)
    gallery.setAttribute('tabindex', '0');
    gallery.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') goTo(current - 1);
      if (e.key === 'ArrowRight') goTo(current + 1);
    });

    // Touch swipe support (mobile)
    let touchStartX = 0;
    track.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    track.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? goTo(current + 1) : goTo(current - 1);
      }
    }, { passive: true });

    // Initialize to first slide
    goTo(0);
  });

  /* ----------------------------------------
   * 5. IMAGE MODAL (Lightbox)
   * Clicking a gallery image opens it in a
   * full-screen overlay. Close with X button,
   * clicking the overlay, or pressing Escape.
   * ---------------------------------------- */
  const modal = document.getElementById('imageModal');

  if (modal) {
    const modalImg = modal.querySelector('img');
    const modalCaption = modal.querySelector('.modal-caption');

    // Open modal on gallery image click
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't open modal when clicking carousel controls
        if (e.target.closest('.carousel-arrow') || e.target.closest('.carousel-dot')) return;

        const img = item.querySelector('img');
        const caption = item.querySelector('.gallery-caption') || item.querySelector('p');
        modalImg.src = img.src;
        modalImg.alt = img.alt;
        modalCaption.textContent = caption ? caption.textContent : img.alt;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
      });
    });

    // Close modal on overlay click or X button
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('.modal-close')) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  /* ----------------------------------------
   * 6. ACTIVE NAV LINK DETECTION
   * Highlights the current page's nav link
   * by comparing the URL path.
   * ---------------------------------------- */
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';

  document.querySelectorAll('.nav-links > a, .nav-links > .nav-dropdown > a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    const linkPath = new URL(href, window.location.origin).pathname.replace(/\/$/, '') || '/';
    if (currentPath === linkPath || (linkPath !== '/' && currentPath.startsWith(linkPath))) {
      link.classList.add('active');
    }
  });

});
