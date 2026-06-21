/**
 * EnWater Design - Unified UI Interaction Effects Library
 * Consolidated from across project HTML assets.
 * Pure Vanilla JavaScript (ES6). No jQuery required.
 */

// Auto-run UI initializations when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAllEnWaterEffects);
} else {
  initAllEnWaterEffects();
}

/**
 * Initializes all core UI behaviors
 */
function initAllEnWaterEffects() {
  initYearUpdater();
  initRevealObserver();
  initNavDropdowns();
  initCardFlips();
  initCarousels();
  initScrollchevrons();
  initAccordions();
  initMobileNav();
  initStoryArc();
  initNetlifyFormAJAX();
}

/**
 * 1. Year Updater
 * Dynamically updates text content of elements with id="yr" or id="y" to the current year
 */
function initYearUpdater() {
  const elements = document.querySelectorAll('#yr, #y, #year');
  const currentYear = new Date().getFullYear();
  elements.forEach(el => {
    el.textContent = currentYear;
  });
}

/**
 * 2. Viewport Reveal Observer
 * Uses IntersectionObserver to check when elements with class "reveal" enter the viewport,
 * and adds the "visible" class to trigger the slide/fade transitions.
 */
function initRevealObserver() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: make all reveal elements visible directly if observer is not supported
    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.add('visible');
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Reveal only once
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px' // Trigger slightly before it hits the viewport
  });

  document.querySelectorAll('.reveal').forEach(el => {
    observer.observe(el);
  });
}

/**
 * 3. Stable Navigation Dropdown Positioner
 * Uses a hover-intent delay so the dropdown stays open while the cursor
 * travels from the nav item into the dropdown panel (prevents "disabled" feel).
 */
function initNavDropdowns() {
  const nav = document.querySelector('header.site-topnav');
  if (!nav) return;

  const items = Array.from(nav.querySelectorAll('li')).filter(li => li.querySelector('.drop'));
  if (!items.length) return;

  // Shared close timer — cleared when cursor enters the drop panel
  let closeTimer = null;

  function hide(li) {
    li.classList.remove('open');
    const btn = li.querySelector('.nav-toggle');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function closeAll() {
    clearTimeout(closeTimer);
    items.forEach(hide);
  }

  function openOnly(li) {
    clearTimeout(closeTimer);
    // Close others
    items.forEach(other => { if (other !== li) hide(other); });
    li.classList.add('open');
    const btn = li.querySelector('.nav-toggle');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }

  function scheduleClose(li) {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => hide(li), 200);
  }

  items.forEach(li => {
    const btn = li.querySelector('.nav-toggle');
    const drop = li.querySelector('.drop');

    // ▾ Button click: toggle on desktop, toggle on mobile
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // If window is wide, mouseenter already opens it. Clicking should not instantly close it.
        if (window.innerWidth > 900) {
           openOnly(li);
        } else {
          if (li.classList.contains('open')) {
            hide(li);
          } else {
            openOnly(li);
          }
        }
      });
    }

    // Desktop hover: open on enter, schedule close on leave
    li.addEventListener('mouseenter', () => {
      if (window.innerWidth > 900) openOnly(li);
    });

    li.addEventListener('mouseleave', () => {
      if (window.innerWidth > 900) scheduleClose(li);
    });

    // When cursor enters the dropdown panel — cancel the close timer
    if (drop) {
      drop.addEventListener('mouseenter', () => {
        clearTimeout(closeTimer);
      });

      drop.addEventListener('mouseleave', () => {
        if (window.innerWidth > 900) scheduleClose(li);
      });
    }
  });

  // Escape key closes all
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });

  // Click anywhere outside the nav closes all dropdowns
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeAll();
  });

  // Keep CSS variable --enwater-topnav-height in sync so mobile drawer positions correctly
  function setTopNavHeight() {
    const h = Math.ceil(nav.getBoundingClientRect().height || 64);
    document.documentElement.style.setProperty('--enwater-topnav-height', `${h}px`);
  }
  setTopNavHeight();
  window.addEventListener('resize', setTopNavHeight, { passive: true });
}

/**
 * 4. Card Flip Handlers
 * Setup delegation click handlers for double-sided flip cards (e.g. Insights, Case Studies)
 */
function initCardFlips() {
  const hosts = Array.from(document.querySelectorAll('.card-media, .case-flip-card'));
  if (!hosts.length) return;

  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('.flip-toggle');
    if (toggle) {
      const host = toggle.closest('.card-media, .case-flip-card');
      if (!host) return;

      event.preventDefault();
      event.stopPropagation();

      const isBackButton = !!toggle.closest('.card-back, .case-back');
      if (isBackButton) {
        host.classList.remove('is-flipped');
      } else {
        host.classList.add('is-flipped');
      }
      return;
    }

    // Click outside should reset flipped cards
    hosts.forEach(host => {
      if (!host.contains(event.target)) {
        host.classList.remove('is-flipped');
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hosts.forEach(host => host.classList.remove('is-flipped'));
    }
  });
}

/**
 * 5. Horizontal Carousel Prev/Next Buttons
 * Attaches scroll triggers to buttons to animate left/right scrolling inside tracks
 */
function initCarousels() {
  document.querySelectorAll('[data-carousel]').forEach(sec => {
    const track = sec.querySelector('[data-carousel-track], [data-config-track]');
    const prev = sec.querySelector('[data-carousel-prev], [data-config-prev]');
    const next = sec.querySelector('[data-carousel-next], [data-config-next]');
    if (!track || !prev || !next) return;

    // Calculate step width based on viewport width
    const getScrollStep = () => Math.max(300, Math.min(840, track.clientWidth * 0.85));

    prev.addEventListener('click', (e) => {
      e.preventDefault();
      track.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
    });

    next.addEventListener('click', (e) => {
      e.preventDefault();
      track.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
    });
  });
}

/**
 * 6. Responsive Scroll Rows with Chevrons
 * Automatically creates scroll indicators/chevrons for horizontal scroll wrappers
 * that overflow the current viewport.
 */
function initScrollchevrons() {
  function svgChevron(direction) {
    return direction === 'left'
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  }

  function enhanceRow(row) {
    if (!row || row.dataset.scrollEnhanced) return;
    row.dataset.scrollEnhanced = "1";

    const wrap = document.createElement('div');
    wrap.className = 'scroll-wrap';
    
    // Wrap existing children of the row
    while (row.firstChild) {
      wrap.appendChild(row.firstChild);
    }
    row.appendChild(wrap);
    row.classList.add('scroll-row');

    const btnPrev = document.createElement('button');
    btnPrev.className = 'scroll-arrow-btn prev';
    btnPrev.type = 'button';
    btnPrev.setAttribute('aria-label', 'Scroll Left');
    btnPrev.innerHTML = svgChevron('left');

    const btnNext = document.createElement('button');
    btnNext.className = 'scroll-arrow-btn next';
    btnNext.type = 'button';
    btnNext.setAttribute('aria-label', 'Scroll Right');
    btnNext.innerHTML = svgChevron('right');

    row.appendChild(btnPrev);
    row.appendChild(btnNext);

    const updateArrows = () => {
      const scrollLeft = wrap.scrollLeft;
      const scrollWidth = wrap.scrollWidth;
      const clientWidth = wrap.clientWidth;
      const hasLeftScroll = scrollLeft > 5;
      const hasRightScroll = scrollLeft + clientWidth < scrollWidth - 5;

      btnPrev.style.display = hasLeftScroll ? 'flex' : 'none';
      btnNext.style.display = hasRightScroll ? 'flex' : 'none';
    };

    wrap.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows, { passive: true });

    btnPrev.addEventListener('click', () => {
      wrap.scrollBy({ left: -240, behavior: 'smooth' });
    });
    btnNext.addEventListener('click', () => {
      wrap.scrollBy({ left: 240, behavior: 'smooth' });
    });

    // Initial check (delay slightly to allow browser layout render)
    setTimeout(updateArrows, 100);
  }

  // Target specific rows needing horizontal helpers (e.g. mobile tab lists or chip bars)
  document.querySelectorAll('[data-scroll-row]').forEach(enhanceRow);
}

/**
 * 7. Accordion Toggle Observer
 * Adds open/close states to elements with custom accordions
 */
function initAccordions() {
  // Pattern 1: [data-acc] wraps with buttons
  document.querySelectorAll('[data-acc]').forEach(wrap => {
    const btn = wrap.querySelector('button');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      wrap.classList.toggle('acc-open');
    });
  });

  // Pattern 2: .accordion with [data-acc-btn] / [data-acc-body]
  document.querySelectorAll('.accordion').forEach(wrap => {
    const btn = wrap.querySelector('[data-acc-btn]');
    const body = wrap.querySelector('[data-acc-body]');
    const indicator = btn ? btn.querySelector('span:last-child') : null;
    if (!btn || !body) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = !body.classList.contains('hidden');
      body.classList.toggle('hidden', isOpen);
      if (indicator) {
        indicator.textContent = isOpen ? '+' : '-';
      }
    });
  });
}

/**
 * 8. Autoplay Video Fallback Alert
 * Fallback detection for browsers that block video autoplay rules.
 * @param {string} videoId The HTML5 video element ID
 * @param {string} fallbackId The fallback UI banner ID
 * @param {string} playBtnId The button ID to trigger manual video playback
 * @param {string} skipBtnId The skip button ID to go directly to site
 * @param {string} redirectUrl The target page on video end
 */
function configureVideoAutoplayFallback(videoId, fallbackId, playBtnId, skipBtnId, redirectUrl = 'home.html') {
  const video = document.getElementById(videoId);
  const fallback = document.getElementById(fallbackId);
  const playBtn = document.getElementById(playBtnId);
  const skipBtn = document.getElementById(skipBtnId);
  if (!video) return;

  const navigateToSite = () => {
    window.location.href = redirectUrl;
  };

  // Redirect on normal completion
  video.addEventListener('ended', navigateToSite);

  // Skip button handler
  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.preventDefault();
      try { video.pause(); } catch (err) {}
      navigateToSite();
    });
  }

  // Detect autoplay blocking
  let started = false;
  video.addEventListener('playing', () => {
    started = true;
  });

  setTimeout(() => {
    if (!started && fallback) {
      fallback.classList.add('show');
    }
  }, 900);

  // Manual play handler
  if (playBtn && fallback) {
    playBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await video.play();
        fallback.classList.remove('show');
      } catch (err) {
        // Play failed; user can still choose fallback links
      }
    });
  }
}

/**
 * 9. Custom Tab Switcher (Process Capabilities tab control)
 * Switches active body content when clicking specific side item selections.
 * @param {string} containerId ID of the tabs parent container
 * @param {object} contentDictionary Data map of headers, paragraphs, and list elements
 */
function configureTabSwitcher(containerId, contentDictionary) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const items = Array.from(container.querySelectorAll('[data-cap-item], [data-cap]'));
  const outTitle = container.querySelector('[data-cap-title]');
  const outBody = container.querySelector('[data-cap-body]');
  const outList = container.querySelector('[data-cap-list], [data-cap-support]');

  const handleSwitch = (key) => {
    const data = contentDictionary[key];
    if (!data) return;

    items.forEach(item => {
      const isSelected = (item.dataset.cap === key || item.dataset.capItem === key);
      item.classList.toggle('bg-white/10', isSelected);
      item.classList.toggle('ring-1', isSelected);
      item.classList.toggle('ring-white/20', isSelected);
      item.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });

    if (outTitle) outTitle.innerHTML = data.title;
    if (outBody) outBody.innerHTML = data.body;
    if (outList) {
      if (data.list) {
        outList.innerHTML = data.list.map(t => `<div class="rounded-sm border border-white/10 bg-black/10 p-4">${t}</div>`).join('');
      } else if (data.support) {
        // String split format supporting "|" dividers
        outList.innerHTML = data.support.split('|').filter(Boolean).map(s => `
          <li class="flex items-start gap-2">
            <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/60"></span>
            <span>${s}</span>
          </li>
        `).join('');
      }
    }
  };

  items.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const key = item.dataset.cap || item.dataset.capItem;
      if (key) handleSwitch(key);
    });
  });

  // Trigger default selection (first item)
  const defaultKey = items[0]?.dataset.cap || items[0]?.dataset.capItem;
  if (defaultKey) handleSwitch(defaultKey);
}

/**
 * 10. Clipboard Dosing / Enquiry Helper with Toast alerts
 * Captures form inputs, formats them as plain text, copies them to the keyboard buffer,
 * and launches a floating feedback message alert.
 * @param {string} triggerId The ID of the submit/copy button
 * @param {string} formContainerId The ID of the form containing labels & inputs
 * @param {string} toastId The ID of the toast banner container
 */
function configureEnquiryClipboardToast(triggerId, formContainerId, toastId) {
  const btn = document.getElementById(triggerId);
  const section = document.getElementById(formContainerId);
  const toast = document.getElementById(toastId);
  if (!btn || !section) return;

  const showToast = (message) => {
    if (!toast) {
      alert(message);
      return;
    }
    toast.textContent = message;
    toast.classList.remove('hidden');
    
    // Clear any active timers
    clearTimeout(window._enwaterToastTimer);
    window._enwaterToastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 3500);
  };

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const fields = [];
    
    section.querySelectorAll('label').forEach(label => {
      const labelText = label.querySelector('div, span')?.textContent?.trim() || label.firstChild?.textContent?.trim();
      const input = label.querySelector('input, textarea, select');
      const val = input?.value?.trim();
      if (labelText) {
        fields.push(`${labelText}: ${val || '[Not Specified]'}`);
      }
    });

    const outputText = `${section.dataset.formTitle || 'EnWater Enquiry Submission'}\n\n${fields.join('\n')}`.trim();

    try {
      await navigator.clipboard.writeText(outputText);
      showToast('Form copied to clipboard successfully.');
    } catch (err) {
      // Fallback copy procedure
      const ta = document.createElement('textarea');
      ta.value = outputText;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        showToast('Form copied to clipboard successfully.');
      } catch (err2) {
        showToast('Please copy details manually from fields.');
      }
      document.body.removeChild(ta);
    }
  });
}

/**
 * 11. Responsive Mobile Navigation Handler
 * Handles hamburger icon state changes (three-lines to cross) and accordion submenus.
 */
function initMobileNav() {
  const header = document.querySelector('header.site-topnav');
  if (!header) return;

  const toggleBtn = header.querySelector('.mobile-nav-toggle');
  if (toggleBtn) {
    // Clone node to remove any previously attached click listeners
    const newBtn = toggleBtn.cloneNode(true);
    toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);
    
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = header.classList.toggle('nav-open');
      newBtn.classList.toggle('nav-open', isOpen);
      newBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      
      // Control body overflow scrolling
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
  }

  // Handle mobile drawer submenu toggles
  const submenuToggles = header.querySelectorAll('.mobile-submenu-toggle');
  submenuToggles.forEach(btn => {
    // Clone node to remove any previously attached click listeners
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const parent = newBtn.closest('.mobile-nav-item');
      if (parent) {
        parent.classList.toggle('open');
      }
    });
  });
}

/**
 * 12. Story-Arc Scroll Spine & Floating Chapter Labels (Global)
 * Dynamically adds a progress spine and floating current-section indicator label
 * on scroll for all pages that don't already have a local implementation.
 */
function initStoryArc() {
  // Skip if already locally implemented on the page
  if (document.getElementById('story-spine') || document.getElementById('chapter-label')) {
    return;
  }

  const sections = Array.from(document.querySelectorAll('section[id]:not(#hero)'));
  if (!sections.length) return;

  // Create story spine DOM element
  const spine = document.createElement('div');
  spine.id = 'story-spine';
  document.body.appendChild(spine);

  // Create chapter label DOM elements
  const labelContainer = document.createElement('div');
  labelContainer.id = 'chapter-label';
  const labelInner = document.createElement('div');
  labelInner.id = 'chapter-label-inner';
  labelContainer.appendChild(labelInner);
  document.body.appendChild(labelContainer);

  let labelTimer;

  function updateSpine() {
    const doc = document.documentElement;
    const scrolled = window.scrollY || doc.scrollTop;
    const total = doc.scrollHeight - doc.clientHeight;
    const pct = total > 0 ? (scrolled / total * 100) : 0;
    spine.style.height = pct + '%';
  }

  function updateChapter() {
    const scrollMid = window.scrollY + window.innerHeight * 0.5;
    let current = null;

    sections.forEach(s => {
      const top = s.getBoundingClientRect().top + window.scrollY;
      if (top <= scrollMid) {
        current = s;
      }
    });

    if (current) {
      let labelText = '';
      const kicker = current.querySelector('.section-chapter-tag, .section-kicker, .eyebrow');
      if (kicker) {
        labelText = kicker.textContent.trim().replace(/^[^a-zA-Z0-9\s]+|[^a-zA-Z0-9\s]+$/g, '');
      }
      if (!labelText) {
        labelText = current.id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
      
      labelInner.textContent = labelText;
      labelContainer.classList.add('visible');
      clearTimeout(labelTimer);
      labelTimer = setTimeout(() => {
        labelContainer.classList.remove('visible');
      }, 2200);
    } else {
      labelContainer.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', () => {
    updateSpine();
    updateChapter();
  }, { passive: true });

  updateSpine();
  updateChapter();
}

/**
 * 13. Global Netlify Forms AJAX Handler
 * Intercepts submissions of forms configured with Netlify forms attributes,
 * posts the inputs via AJAX, and redirects the user using GET to avoid POST 404 errors on static pages.
 */
function initNetlifyFormAJAX() {
  document.addEventListener('submit', function(e) {
    const form = e.target;
    if (form && (form.getAttribute('data-netlify') === 'true' || form.hasAttribute('netlify'))) {
      e.preventDefault();
      
      const formData = new FormData(form);
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sending...';
      }

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      })
      .then(function() {
        const action = form.getAttribute('action') || '/thank-you.html';
        window.location.href = action;
      })
      .catch(function(err) {
        console.error('Form submission AJAX error:', err);
        const action = form.getAttribute('action') || '/thank-you.html';
        window.location.href = action;
      });
    }
  });
}
