// Fixed light luxury brand theme
(function() {
  document.documentElement.setAttribute('data-theme', 'light');
  try { localStorage.setItem('dhara_theme', 'light'); } catch (e) {}
})();


document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initHeroCarousel();
  initStickyHeader();
  initMobileDrawer();
  initNavDropdown();
  initModals();
  initSiteVisitDateTimePicker();
  initProjectFiltering();
  initFAQ();
  initContactForms();
  initCounters();
  initClientCarouselAndModal();
  initFooterContactActions();
  initLogoHomeNavigation();
});

// Dropdown Navigation handler (Desktop touch + Mobile drawer accordion)
function initNavDropdown() {
  // Mobile drawer submenu accordion
  const drawerSubmenuToggles = document.querySelectorAll('.drawer-dropdown-toggle');
  drawerSubmenuToggles.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const parent = btn.closest('.drawer-dropdown-parent');
      const submenu = parent ? parent.querySelector('.drawer-submenu') : null;
      if (submenu) {
        const isOpen = submenu.classList.contains('open');
        submenu.classList.toggle('open', !isOpen);
        btn.classList.toggle('active', !isOpen);
        const icon = btn.querySelector('.drawer-chevron');
        if (icon) {
          icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
        }
      }
    });
  });

  // Desktop click & hover dropdown handling
  const desktopDropdowns = document.querySelectorAll('.nav-item-dropdown');
  desktopDropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.nav-link-dropdown');
    let leaveTimeout = null;

    if (toggle) {
      // Click toggles open/close state
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        desktopDropdowns.forEach(d => d.classList.remove('open', 'active-touch'));
        if (!isOpen) {
          dropdown.classList.add('open');
        }
      });
    }

    // Hover intent with smooth buffer so cursor movement to menu items never closes it
    dropdown.addEventListener('mouseenter', () => {
      if (leaveTimeout) clearTimeout(leaveTimeout);
      dropdown.classList.add('open');
    });

    dropdown.addEventListener('mouseleave', () => {
      leaveTimeout = setTimeout(() => {
        dropdown.classList.remove('open');
      }, 350);
    });
  });

  // Close desktop dropdown on click outside (or click any other link/element)
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-item-dropdown')) {
      desktopDropdowns.forEach(d => d.classList.remove('open', 'active-touch'));
    }
  });

  // Also close on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      desktopDropdowns.forEach(d => d.classList.remove('open', 'active-touch'));
    }
  });
}

// 1. Smart Hide / Show Sticky Header on Scroll
function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let lastScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
  let ticking = false;
  const scrollThreshold = 8; // 8px threshold to prevent micro-flicker / bounce
  const headerHeight = header.offsetHeight || 78;

  function updateHeader() {
    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

    // 1. Top of page: always keep header fully visible
    if (currentScrollY <= 15) {
      header.classList.remove('header-hidden', 'hidden');
      header.classList.add('header-visible', 'visible');
      header.classList.remove('scrolled');
      lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
      ticking = false;
      return;
    }

    // Shadow & border effect when scrolled
    if (currentScrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Keep header visible if mobile drawer or modal is open
    const isDrawerOpen = document.getElementById('mobileDrawer')?.classList.contains('open');
    const isModalOpen = document.querySelector('.modal-backdrop.open');
    if (isDrawerOpen || isModalOpen) {
      header.classList.remove('header-hidden', 'hidden');
      header.classList.add('header-visible', 'visible');
      lastScrollY = currentScrollY;
      ticking = false;
      return;
    }

    const scrollDiff = currentScrollY - lastScrollY;

    // Only update if difference exceeds threshold to prevent jitter
    if (Math.abs(scrollDiff) >= scrollThreshold) {
      if (scrollDiff > 0 && currentScrollY > headerHeight) {
        // Scrolling DOWN -> smoothly hide header
        header.classList.remove('header-visible', 'visible');
        header.classList.add('header-hidden', 'hidden');
      } else if (scrollDiff < 0) {
        // Scrolling UP -> smoothly show header
        header.classList.remove('header-hidden', 'hidden');
        header.classList.add('header-visible', 'visible');
      }
      lastScrollY = currentScrollY;
    }

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });

  // Initial check on page load
  updateHeader();
}

// Logo Home Link Navigation Handler (Desktop, Tablet, Mobile)
function initLogoHomeNavigation() {
  const logos = document.querySelectorAll('.logo-wrap, .drawer-logo, .header-logo');
  logos.forEach(logo => {
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', (e) => {
      // If inside an anchor tag pointing to home, let native link execute smoothly
      const anchor = logo.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href === '/' || href === '/index.html' || href === 'index.html' || href === './index.html') {
          return;
        }
      }
      e.preventDefault();
      window.location.href = '/';
    });
  });
}

// Hero Carousel with auto-sliding, arrows, dots, and pagination numbers
function initHeroCarousel() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-carousel-dot');
  const pagNumbers = document.querySelectorAll('.hero-pag-number');
  const prevBtn = document.getElementById('heroPrevBtn');
  const nextBtn = document.getElementById('heroNextBtn');
  const heroSection = document.getElementById('heroSection');

  if (!slides.length) return;

  let currentIndex = 0;
  let autoplayTimer = null;
  const slideCount = slides.length;
  const slideInterval = 5000; // Scroll automatically every 5 seconds

  function goToSlide(index) {
    currentIndex = (index + slideCount) % slideCount;

    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === currentIndex);
    });

    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIndex);
    });

    pagNumbers.forEach((num, idx) => {
      num.classList.toggle('active', idx === (currentIndex % Math.max(1, pagNumbers.length)));
    });
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentIndex - 1);
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(nextSlide, slideInterval);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      nextSlide();
      startAutoplay();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      prevSlide();
      startAutoplay();
    });
  }

  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const targetIndex = parseInt(dot.getAttribute('data-slide'), 10);
      if (!isNaN(targetIndex)) {
        goToSlide(targetIndex);
        startAutoplay();
      }
    });
  });

  pagNumbers.forEach((num, idx) => {
    num.addEventListener('click', (e) => {
      e.preventDefault();
      goToSlide(idx);
      startAutoplay();
    });
  });

  // Touch swipe handling
  let touchStartX = 0;
  if (heroSection) {
    heroSection.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    heroSection.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      if (touchStartX - touchEndX > 45) {
        nextSlide();
        startAutoplay();
      } else if (touchEndX - touchStartX > 45) {
        prevSlide();
        startAutoplay();
      }
    }, { passive: true });
  }

  startAutoplay();
}

// 2. Mobile Drawer Navigation
function initMobileDrawer() {
  const menuToggle = document.getElementById('menuToggle');
  const drawer = document.getElementById('mobileDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  const drawerClose = document.getElementById('drawerClose');

  if (!menuToggle || !drawer) return;

  function openDrawer() {
    drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  menuToggle.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);
}

// 3. Modals System (Site Visit, Service Inquiry, Global Search)
function initModals() {
  const modals = document.querySelectorAll('.modal-backdrop');
  
  window.closeModal = function(m) {
    if (!m) return;
    m.classList.remove('open');
    document.body.style.overflow = '';
    const dialog = m.querySelector('.modal-dialog');
    if (dialog && dialog._originalHTML) {
      setTimeout(() => {
        dialog.innerHTML = dialog._originalHTML;
        delete dialog._originalHTML;
        initContactForms();
        initSiteVisitDateTimePicker(m);
      }, 300);
    }
  };

  // Delegated click handler for close buttons, done buttons, and outside backdrop clicks
  document.addEventListener('click', (e) => {
    if (e.target.closest('.modal-close, [data-modal-close], [data-done-btn]')) {
      const modal = e.target.closest('.modal-backdrop');
      if (modal) {
        window.closeModal(modal);
      }
      return;
    }

    if (e.target.classList && e.target.classList.contains('modal-backdrop')) {
      window.closeModal(e.target);
    }
  });

  // ESC key closes any open modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal-backdrop.open');
      if (openModal) window.closeModal(openModal);
    }
  });

  // Search Modal
  const searchBtn = document.getElementById('searchBtn');
  const searchModal = document.getElementById('searchModal');
  if (searchBtn && searchModal) {
    searchBtn.addEventListener('click', () => {
      searchModal.classList.add('open');
      const input = searchModal.querySelector('input');
      if (input) setTimeout(() => input.focus(), 100);
      document.body.style.overflow = 'hidden';
    });
  }

  // Watch Our Story Modal
  const watchStoryBtn = document.getElementById('watchStoryBtn');
  const storyModal = document.getElementById('storyModal');
  if (watchStoryBtn && storyModal) {
    watchStoryBtn.addEventListener('click', (e) => {
      e.preventDefault();
      storyModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }

  // Schedule Visit Buttons (support both data-open-visit-modal and data-modal-open="visitModal")
  document.querySelectorAll('[data-open-visit-modal], [data-modal-open="visitModal"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = document.getElementById('visitModal');
      const projectName = btn.getAttribute('data-project') || btn.getAttribute('data-project-title') || 'Commercial / Residential Property';
      if (modal) {
        const titleElem = modal.querySelector('#visitProjectTitle');
        if (titleElem) titleElem.textContent = projectName;
        const hiddenInput = modal.querySelector('input[name="project"]');
        if (hiddenInput) hiddenInput.value = projectName;
        // Re-verify date picker starting from tomorrow
        initSiteVisitDateTimePicker(modal);
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  // Service Inquiry Buttons
  document.querySelectorAll('[data-open-service-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = document.getElementById('serviceModal');
      const serviceName = btn.getAttribute('data-service') || 'Real Estate Advisory';
      if (modal) {
        const titleElem = modal.querySelector('#serviceModalTitle');
        if (titleElem) titleElem.textContent = serviceName;
        const selectElem = modal.querySelector('select[name="serviceType"]');
        if (selectElem) selectElem.value = serviceName;
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    });
  });
}

// 4. Project Filtering
function initProjectFiltering() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card[data-category]');

  if (!filterBtns.length || !projectCards.length) return;

  function applyFilter(filterValue) {
    filterBtns.forEach(b => {
      if (b.getAttribute('data-filter') === filterValue) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    // Update Section Title & Subtitle dynamically based on active filter
    const portfolioTitle = document.getElementById('portfolioTitle');
    const portfolioSubtitle = document.getElementById('portfolioSubtitle');
    if (portfolioTitle && portfolioSubtitle) {
      if (filterValue === 'residential') {
        portfolioTitle.textContent = 'Premium Residential Communities';
        portfolioSubtitle.textContent = "Explore curated luxury residences, private villas, sky homes, and gated communities across West Hyderabad's most sought-after residential destinations.";
      } else if (filterValue === 'commercial') {
        portfolioTitle.textContent = 'Prime Commercial Developments';
        portfolioSubtitle.textContent = "Browse prime commercial towers, tech park office campuses, and high-street retail across Hyderabad's key business corridors.";
      } else {
        portfolioTitle.textContent = 'Exclusive Real Estate Listings';
        portfolioSubtitle.textContent = "Browse prime commercial towers, tech park office campuses, high-street retail, and landmark residential communities across Hyderabad.";
      }
    }

    projectCards.forEach(card => {
      const cardCategory = card.getAttribute('data-category');
      if (filterValue === 'all' || cardCategory === filterValue) {
        card.classList.remove('is-hidden');
        card.style.removeProperty('display');
        card.style.opacity = '0';
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transition = 'opacity 0.3s ease';
        }, 50);
      } else {
        card.classList.add('is-hidden');
        card.style.setProperty('display', 'none', 'important');
      }
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const filterValue = btn.getAttribute('data-filter');
      applyFilter(filterValue);
    });
  });

  // Check URL param or hash on initial load
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const paramFilter = urlParams.get('filter') || urlParams.get('type') || (window.location.hash ? window.location.hash.replace('#', '') : '');
    if (paramFilter && ['all', 'commercial', 'residential'].includes(paramFilter.toLowerCase())) {
      const activeFilter = paramFilter.toLowerCase();
      applyFilter(activeFilter);

      // If loaded with a specific filter (commercial or residential), scroll to projects view
      if (activeFilter === 'commercial' || activeFilter === 'residential') {
        setTimeout(() => {
          const targetSection = document.getElementById('projectsSection') || document.getElementById('projectsContainer') || document.querySelector('.filter-nav');
          if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      }
    }
  } catch (err) {}
}

// 5. FAQ Accordions
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (!questionBtn) return;

    questionBtn.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isOpen) {
        item.classList.add('active');
      }
    });
  });
}

// Helper to sanitize phone number into international WhatsApp format
function sanitizeWhatsAppNumber(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

// Automated direct WhatsApp notification sender (dispatches in background directly to customer's mobile)
async function dispatchDirectWhatsAppNotification(payload) {
  console.info(`[WhatsApp Dispatch] Sending automated notification directly to customer mobile: +${payload.customerPhone}`);

  // 1. Audit / History logging in localStorage
  try {
    const history = JSON.parse(localStorage.getItem('dhara_dispatched_notifications') || '[]');
    history.unshift({
      ...payload,
      dispatchedAt: new Date().toISOString()
    });
    localStorage.setItem('dhara_dispatched_notifications', JSON.stringify(history.slice(0, 30)));
  } catch (e) {}

  // 2. Dispatch to external webhook if configured (Zapier, Make, AISensy, Twilio, Meta Cloud API)
  const webhookUrl = window.DHARA_WHATSAPP_WEBHOOK || window.DHARA_WHATSAPP_CONFIG?.webhookUrl;
  if (webhookUrl) {
    try {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors'
      }).catch(err => console.warn('[WhatsApp Webhook Notice]', err));
    } catch (e) {}
  }

  // 3. Dispatch to backend API (/api/send-whatsapp)
  try {
    const response = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ [WhatsApp Automation Success]', data);
      return data;
    }
  } catch (err) {
    console.warn('[WhatsApp API Fallback]', err.message);
  }

  return { success: true, simulated: true };
}

// 6. Contact & Inquiry Form Submissions with Customer WhatsApp Notifications
function initContactForms() {
  const forms = document.querySelectorAll('form[data-handle-submit]');
  const DHARA_TEAM_WHATSAPP = '918317604342';
  
  forms.forEach(form => {
    if (form._hasSubmitHandler) return;
    form._hasSubmitHandler = true;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Submit';
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <span class="button-spinner"></span>
          Opening WhatsApp...
        `;
      }

      // 1. Identify form type: Site Visit vs General Requirement Enquiry
      const visitDateInput = form.querySelector('[name="visitDate"], [name="date"], #visitDate, #bookDate, input[type="date"]');
      const visitTimeInput = form.querySelector('[name="visitTime"], [name="time"], #visitTime, #bookTime, select[name*="time" i]');
      const btnText = (submitBtn ? submitBtn.innerText : '').toLowerCase();
      const parentModal = form.closest('.modal-backdrop');

      const isSiteVisit = !!(
        (visitDateInput && visitDateInput.value) || 
        form.id === 'propBookingForm' || 
        form.closest('#visitModal') ||
        btnText.includes('site visit') ||
        btnText.includes('viewing')
      );

      // 2. Common Customer Details
      const fullNameInput = form.querySelector('[name="fullName"], [name="name"], input[placeholder*="Name" i], input[type="text"]:not([type="hidden"])');
      const fullName = (fullNameInput && fullNameInput.value.trim()) || 'Prospective Client';

      const phoneInput = form.querySelector('[name="phone"], [name="mobile"], input[type="tel"], input[placeholder*="Phone" i], input[placeholder*="98765" i]');
      const rawPhone = phoneInput ? phoneInput.value.trim() : '';
      const cleanPhone = sanitizeWhatsAppNumber(rawPhone) || rawPhone.replace(/[^\d+]/g, '');

      const emailInput = form.querySelector('[name="email"], input[type="email"]');
      const email = emailInput ? emailInput.value.trim() : '';

      const submissionTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      let templateMessage = '';
      let toastMsg = '';

      if (isSiteVisit) {
        // === SITE VISIT CONFIRMATION TEMPLATE ===
        const projectInput = form.querySelector('input[name="project"], #formHiddenProject');
        let projectName = (projectInput && projectInput.value.trim()) || '';
        if (!projectName) {
          const titleEl = document.querySelector('.prop-hero-title, #propTitle, #visitProjectTitle');
          projectName = (titleEl && titleEl.textContent.trim()) || 'Dhara Prime Realty Property';
        }

        const reqInput = form.querySelector('[name="requirements"], [name="notes"], [name="message"], textarea');
        const requirements = reqInput && reqInput.value.trim() ? reqInput.value.trim() : '';
        const timeVal = (visitTimeInput && visitTimeInput.value) || '10:00 AM – 11:30 AM (Morning)';

        let formattedDate = visitDateInput ? visitDateInput.value : '';
        try {
          if (formattedDate) {
            const parts = formattedDate.split('-');
            if (parts.length === 3) {
              const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
              formattedDate = dateObj.toLocaleDateString('en-IN', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
            }
          }
        } catch (err) {}

        templateMessage = `🏛️ *DHARA PRIME REALTY | NEW SITE VISIT REQUEST*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A client has scheduled a private site visit via the website.

👤 *CLIENT DETAILS:*

*Full Name:* ${fullName}

*Mobile Number:* ${cleanPhone ? `+${cleanPhone}` : (rawPhone || 'Not provided')}${email ? `\n\n*Email Address:* ${email}` : ''}

🏢 *PROPERTY / PROJECT:*

*Property:* ${projectName}

📅 *TOUR SCHEDULE:*

*Preferred Date:* ${formattedDate || 'Earliest Available Date'}

*Preferred Time:* ${timeVal}

📋 *SPECIFIC REQUIREMENTS:*

${requirements || 'Standard guided inspection and commercial briefing requested.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 *Source:* Dhara Prime Realty Website (Site Visit Booking)

⏰ *Submitted At:* ${submissionTime}`;

        toastMsg = `Site visit details prepared! Opening WhatsApp to Dhara Team (+91 83176 04342)...`;

      } else {
        // === REQUIREMENT / GENERAL ENQUIRY TEMPLATE ===
        const allSelects = Array.from(form.querySelectorAll('select:not([name*="time" i])'));
        const purposeSelect = form.querySelector('[name="purpose"], [name="serviceType"], [name="inquiryPurpose"]');
        const purpose = purposeSelect ? purposeSelect.value : (allSelects[0] ? allSelects[0].value : '');

        const locationSelect = form.querySelector('[name="location"], [name="targetLocation"]');
        const location = locationSelect ? locationSelect.value : (allSelects[1] ? allSelects[1].value : '');

        const spaceInput = form.querySelector('[name="space"], [name="spaceRequirement"], input[placeholder*="Seats" i], input[placeholder*="Sq.Ft" i]');
        const space = spaceInput ? spaceInput.value.trim() : '';

        const msgInput = form.querySelector('[name="message"], [name="requirements"], textarea');
        const messageText = msgInput && msgInput.value.trim() ? msgInput.value.trim() : '';

        const reqItems = [
          purpose ? `*Inquiry Purpose:* ${purpose}` : '',
          location ? `*Target Location:* ${location}` : '',
          space ? `*Space Requirement:* ${space}` : ''
        ].filter(Boolean).join('\n\n');

        templateMessage = `🏛️ *DHARA PRIME REALTY | NEW PROPERTY ENQUIRY*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A prospective client has submitted an enquiry through the website.

👤 *CLIENT DETAILS:*

*Full Name:* ${fullName}

*Mobile Number:* ${cleanPhone ? `+${cleanPhone}` : (rawPhone || 'Not provided')}${email ? `\n\n*Email Address:* ${email}` : ''}

🎯 *REQUIREMENT DETAILS:*

${reqItems || '*Inquiry Purpose:* Commercial / Residential Property Advisory'}

💬 *MESSAGE / SPECIFIC CRITERIA:*

${messageText || 'Client requested customized commercial / residential advisory options.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 *Source:* Dhara Prime Realty Website (Requirement Form)

⏰ *Submitted At:* ${submissionTime}`;

        toastMsg = `Enquiry details prepared! Opening WhatsApp to Dhara Team (+91 83176 04342)...`;
      }

      // 3. WhatsApp Direct URL to Dhara Team
      const teamWaUrl = `https://api.whatsapp.com/send?phone=${DHARA_TEAM_WHATSAPP}&text=${encodeURIComponent(templateMessage)}`;

      // 4. Background logging & persistence
      const payload = {
        customerPhone: cleanPhone || rawPhone,
        customerName: fullName,
        customerEmail: email,
        teamPhone: DHARA_TEAM_WHATSAPP,
        type: isSiteVisit ? 'SITE_VISIT' : 'ENQUIRY',
        message: templateMessage,
        submittedAt: submissionTime
      };
      dispatchDirectWhatsAppNotification(payload);

      // 5. Open WhatsApp Web / App directly to Dhara Team
      try {
        window.open(teamWaUrl, '_blank');
      } catch (err) {
        console.warn('Could not automatically launch WhatsApp popup:', err);
      }

      // 6. Modal Feedback or Inline Feedback
      if (parentModal) {
        const dialog = parentModal.querySelector('.modal-dialog');
        if (dialog) {
          dialog._originalHTML = dialog.innerHTML;
          dialog.innerHTML = `
            <button class="modal-close" data-modal-close aria-label="Close modal">&times;</button>
            <div class="visit-success-card">
              <div class="success-icon-badge">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 class="success-title">${isSiteVisit ? 'Site Visit Confirmed!' : 'Requirement Received!'}</h3>
              <p class="success-subtitle">${isSiteVisit ? 'Private tour request formatted for Dhara Prime Realty.' : 'Your requirement has been formatted for our Hyderabad advisory desk.'}</p>

              <div class="whatsapp-sent-pill">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                <span>Sending to Dhara Team: <strong>+91 83176 04342</strong></span>
              </div>

              <div class="booking-summary-ticket">
                <div class="ticket-header">
                  <span>${isSiteVisit ? 'VIP Tour Request' : 'Client Requirement'}</span>
                  <span>Dhara Prime Realty</span>
                </div>
                <div class="ticket-property">${isSiteVisit ? (form.querySelector('input[name="project"]')?.value || 'Property Tour') : (fullName + ' Requirement')}</div>
                <div class="ticket-grid">
                  <div class="ticket-item">
                    <span>Client Name</span>
                    <strong>${fullName}</strong>
                  </div>
                  <div class="ticket-item">
                    <span>Client Phone</span>
                    <strong>${cleanPhone ? `+${cleanPhone}` : (rawPhone || 'N/A')}</strong>
                  </div>
                </div>
              </div>

              <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 20px;">
                WhatsApp was launched with your pre-filled inquiry. If it didn't open automatically, click the button below:
              </p>

              <div class="success-actions">
                <a href="${teamWaUrl}" target="_blank" class="btn-whatsapp-action">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  <span>Chat with Dhara Team on WhatsApp (+91 83176 04342)</span>
                </a>
                <button type="button" class="btn btn-secondary" data-done-btn style="width: 100%; margin-top: 4px;">
                  Done &amp; Close
                </button>
              </div>
            </div>
          `;
        }
      }

      showToast(toastMsg);

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }

      form.reset();
    });
  });
}

// 7. Toast Notification Feedback
function showToast(message) {
  let toast = document.getElementById('siteToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'siteToast';
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    <span>${message}</span>
  `;
  
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// 8. Stat Counters Animation
function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target], .counter-value[data-target], .about-stat-num[data-target], .who-stat-number[data-target]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = +entry.target.getAttribute('data-target');
        if (!target || isNaN(target) || target <= 0) {
          observer.unobserve(entry.target);
          return;
        }
        const suffix = entry.target.getAttribute('data-suffix') || '';
        let count = 0;
        const speed = Math.max(1, target / 30);

        const updateCount = () => {
          count += speed;
          if (count < target) {
            entry.target.innerText = Math.ceil(count) + suffix;
            requestAnimationFrame(updateCount);
          } else {
            entry.target.innerText = target + suffix;
          }
        };
        updateCount();
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });

  counters.forEach(c => observer.observe(c));
}

// 9. Theme Switcher (Obsidian Luxury Dark <-> Pristine Ivory Light)
function initThemeToggle() {
  const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('dhara_theme', newTheme);

      // Feedback toast
      const toast = document.getElementById('toastMsg');
      if (toast) {
        toast.textContent = newTheme === 'light' ? 'Light Luxury Mode Active' : 'Obsidian Dark Mode Active';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2200);
      }
    });
  });
}


// 10. Interactive Calendar & Time Slot Picker for Site Visits (Starts from Tomorrow)
function initSiteVisitDateTimePicker(container = document) {
  const groups = container.querySelectorAll ? container.querySelectorAll('.booking-datetime-group') : [];
  if (!groups.length) {
    if (container.classList && container.classList.contains('booking-datetime-group')) {
      setupBookingGroup(container);
    }
    return;
  }

  groups.forEach(setupBookingGroup);
}

function setupBookingGroup(group) {
  const dateInput = group.querySelector('.booking-date-input');
  const chips = group.querySelectorAll('.quick-chip');
  const hint = group.querySelector('.date-booking-hint');
  if (!dateInput) return;

  const now = new Date();
  // Tomorrow's date: today + 1 day
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tomorrowStr = formatYYYYMMDD(tomorrow);

  // Set minimum date to tomorrow: today and past dates are completely disabled in the calendar
  dateInput.min = tomorrowStr;

  // Default value: always set to tomorrow if empty or if invalid
  if (!dateInput.value || dateInput.value < tomorrowStr) {
    dateInput.value = tomorrowStr;
  }

  // Set active state on the chips matching the initial date
  updateChipActiveState(dateInput.value, chips, tomorrowStr);

  // Click on the date input triggers native picker popup
  if (!dateInput._hasPickerListener) {
    dateInput._hasPickerListener = true;
    dateInput.addEventListener('click', () => {
      try {
        if (typeof dateInput.showPicker === 'function') {
          dateInput.showPicker();
        }
      } catch (err) {
        // Fallback for older browsers
      }
    });
  }

  // Handle change and blur validation to strictly enforce "from tomorrow" rule
  function validateDate() {
    const val = dateInput.value;
    if (!val) {
      dateInput.value = tomorrowStr;
      updateChipActiveState(tomorrowStr, chips, tomorrowStr);
      return;
    }

    if (val < tomorrowStr) {
      // User attempted to pick today or a past date
      dateInput.classList.add('is-invalid');
      dateInput.value = tomorrowStr;

      if (hint) {
        hint.classList.add('has-warning');
        hint.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>Same-day visits cannot be booked today. Minimum 24h notice required. Reset to <strong>Tomorrow</strong>.</span>
        `;
        setTimeout(() => {
          hint.classList.remove('has-warning');
          hint.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>Site visits require 24h advance scheduling. Earliest available date: <strong>Tomorrow</strong>.</span>
          `;
          dateInput.classList.remove('is-invalid');
        }, 4000);
      }
      updateChipActiveState(tomorrowStr, chips, tomorrowStr);
    } else {
      dateInput.classList.remove('is-invalid');
      if (hint) hint.classList.remove('has-warning');
      updateChipActiveState(val, chips, tomorrowStr);
    }
  }

  if (!dateInput._hasValidationListener) {
    dateInput._hasValidationListener = true;
    dateInput.addEventListener('change', validateDate);
    dateInput.addEventListener('blur', validateDate);
  }

  // Quick Date Chips interaction
  chips.forEach(chip => {
    chip.onclick = (e) => {
      e.preventDefault();
      const offset = chip.getAttribute('data-date-offset');
      const target = chip.getAttribute('data-date-target');

      if (offset) {
        const offsetNum = parseInt(offset, 10);
        const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetNum);
        dateInput.value = formatYYYYMMDD(targetDate);
      } else if (target === 'weekend') {
        const dayOfWeek = now.getDay(); // 0 is Sun, 6 is Sat
        let daysToSaturday = (6 - dayOfWeek + 7) % 7;
        if (daysToSaturday === 0) {
          // If today is Saturday, next day is Sunday
          daysToSaturday = 1;
        }
        const weekendDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToSaturday);
        dateInput.value = formatYYYYMMDD(weekendDate);
      }

      dateInput.classList.remove('is-invalid');
      if (hint) hint.classList.remove('has-warning');
      updateChipActiveState(dateInput.value, chips, tomorrowStr);
    };
  });
}

function formatYYYYMMDD(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function updateChipActiveState(currentVal, chips, tomorrowStr) {
  const now = new Date();
  const dayAfter = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
  const dayAfterStr = formatYYYYMMDD(dayAfter);

  const dayOfWeek = now.getDay();
  let daysToSat = (6 - dayOfWeek + 7) % 7 || 1;
  const weekendDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToSat);
  const weekendStr = formatYYYYMMDD(weekendDate);

  chips.forEach(chip => {
    chip.classList.remove('active');
    const offset = chip.getAttribute('data-date-offset');
    const target = chip.getAttribute('data-date-target');

    if (offset === '1' && currentVal === tomorrowStr) {
      chip.classList.add('active');
    } else if (offset === '2' && currentVal === dayAfterStr) {
      chip.classList.add('active');
    } else if (target === 'weekend' && currentVal === weekendStr) {
      chip.classList.add('active');
    }
  });
}

// ==========================================================================
// CLIENTS & FACTS MODULE (Extensible Data Architecture + Modal + Counters)
// ==========================================================================

const DHARA_CLIENTS = [
  {
    id: 'emma',
    name: 'Emma Germany',
    logo: '/assets/images/client-emma.jpg',
    category: 'Commercial – Retail Space',
    propertyType: 'Commercial – Retail Space',
    description: 'Successfully supported the client in selecting the ideal property for their expansion store, aligning the location with their brand and business objectives.',
    projectImage: '/assets/images/client-emma-store.jpg',
    location: 'Hyderabad, Telangana',
    servicesProvided: 'Commercial Retail Leasing, Market Feasibility & Space Advisory',
    supportRole: 'Property Advisory, Site Selection & Negotiation Support',
    outcome: 'Successful store launch and continued expansion.',
    statistics: [
      { number: '2', label: 'Million sq.ft leasing', icon: 'building' },
      { number: '98', label: 'Positive Feedback', icon: 'star' },
      { number: '2', label: 'Years Experience', icon: 'chart' },
      { number: '50', label: 'Satisfied Clients', icon: 'users' }
    ]
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    logo: '/assets/images/client-airbnb.jpg',
    category: 'Commercial – Grade-A Corporate Office',
    propertyType: 'Commercial – Grade-A Corporate Office',
    description: 'Provided strategic commercial space acquisition and luxury managed property advisory for corporate regional operations and premium hospitality hosts in Hyderabad.',
    projectImage: '/assets/images/client-airbnb-hub.jpg',
    location: 'HITEC City, Hyderabad',
    servicesProvided: 'Corporate Office Leasing, Transaction Structuring & Tenant Representation',
    supportRole: 'Commercial Advisory & Prime IT Hub Space Selection',
    outcome: 'Streamlined regional workspace setup in Hyderabad\'s premier technology zone.',
    statistics: [
      { number: '2', label: 'Million sq.ft leasing', icon: 'building' },
      { number: '98', label: 'Positive Feedback', icon: 'star' },
      { number: '2', label: 'Years Experience', icon: 'chart' },
      { number: '50', label: 'Satisfied Clients', icon: 'users' }
    ]
  },
  {
    id: 'ca',
    name: 'CA Technologies',
    logo: '/assets/images/client-ca.jpg',
    category: 'Commercial – Enterprise IT Hub',
    propertyType: 'Commercial – Enterprise IT Hub',
    description: 'Advised on enterprise Grade-A corporate office leasing and strategic campus consolidation in Hyderabad with scalable long-term expansion options.',
    projectImage: '/assets/images/client-ca-headquarters.jpg',
    location: 'Financial District, Gachibowli, Hyderabad',
    servicesProvided: 'Institutional Leasing, Developer Mandates & Corporate Advisory',
    supportRole: 'Strategic Tenant Representation & Master Lease Negotiation',
    outcome: 'Delivered institutional-grade office space aligned with international compliance.',
    statistics: [
      { number: '2', label: 'Million sq.ft leasing', icon: 'building' },
      { number: '98', label: 'Positive Feedback', icon: 'star' },
      { number: '2', label: 'Years Experience', icon: 'chart' },
      { number: '50', label: 'Satisfied Clients', icon: 'users' }
    ]
  }
];

let activeClientIndex = 0;

function initClientCarouselAndModal() {
  const cards = document.querySelectorAll('.client-card-prime');
  const modalBackdrop = document.getElementById('clientModalBackdrop');
  const modalCloseBtn = document.getElementById('clientModalCloseBtn');
  const modalPrevBtn = document.getElementById('clientModalPrevBtn');
  const modalNextBtn = document.getElementById('clientModalNextBtn');
  const modalInquireBtn = document.getElementById('clientModalInquireBtn');
  const overviewTrigger = document.getElementById('openClientOverviewTrigger');

  if (overviewTrigger) {
    overviewTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      openClientModal(0);
    });
  }

  // Carousel elements
  const track = document.getElementById('clientsTrack');
  const prevBtn = document.getElementById('clientsPrevBtn');
  const nextBtn = document.getElementById('clientsNextBtn');
  const dots = document.querySelectorAll('#clientsDotsRow .client-dot');

  let carouselIndex = 0;
  let clientAutoSlideTimer = null;
  const clientAutoSlideDelay = 3000; // 3 seconds auto-slide

  function updateCarousel(idx) {
    if (!track) return;
    const cards = track.querySelectorAll('.client-card-prime');
    const totalCards = cards.length;
    if (totalCards === 0) return;
    
    // Support cycling/looping smoothly
    carouselIndex = ((idx % totalCards) + totalCards) % totalCards;

    const cardEl = cards[0];
    if (cardEl) {
      const containerWidth = track.parentElement ? track.parentElement.offsetWidth : 1200;
      const computedGap = parseFloat(window.getComputedStyle(track).gap) || 16;
      const cardWidth = cardEl.offsetWidth;
      const maxScroll = Math.max(0, track.scrollWidth - containerWidth);

      if (maxScroll <= 0) {
        track.style.transform = 'translateX(0px)';
      } else {
        const offset = (cardWidth + computedGap) * carouselIndex;
        const scrollPos = Math.min(offset, maxScroll);
        track.style.transform = `translateX(-${scrollPos}px)`;
      }
    }

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === carouselIndex);
    });

    if (prevBtn) prevBtn.disabled = carouselIndex === 0;
    if (nextBtn) nextBtn.disabled = carouselIndex >= totalCards - 1;
  }

  function startClientAutoSlide() {
    stopClientAutoSlide();
    clientAutoSlideTimer = setInterval(() => {
      if (!track) return;
      const totalCards = track.querySelectorAll('.client-card-prime').length;
      if (totalCards <= 1) return;
      const nextIdx = (carouselIndex + 1) % totalCards;
      updateCarousel(nextIdx);
    }, clientAutoSlideDelay);
  }

  function stopClientAutoSlide() {
    if (clientAutoSlideTimer) {
      clearInterval(clientAutoSlideTimer);
      clientAutoSlideTimer = null;
    }
  }

  // Start 3-second auto-slide
  startClientAutoSlide();

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      updateCarousel(carouselIndex - 1);
      startClientAutoSlide();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      updateCarousel(carouselIndex + 1);
      startClientAutoSlide();
    });
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-index') || '0', 10);
      updateCarousel(idx);
      startClientAutoSlide();
    });
  });

  // Mobile Touch Swipe support & pause/resume
  let touchStartX = 0;
  let touchEndX = 0;
  if (track) {
    track.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopClientAutoSlide();
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      const totalCards = track.querySelectorAll('.client-card-prime').length;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          updateCarousel((carouselIndex + 1) % totalCards);
        } else {
          updateCarousel((carouselIndex - 1 + totalCards) % totalCards);
        }
      }
      startClientAutoSlide();
    }, { passive: true });

    if (track.parentElement) {
      track.parentElement.addEventListener('mouseenter', stopClientAutoSlide);
      track.parentElement.addEventListener('mouseleave', startClientAutoSlide);
    }
  }

  window.addEventListener('resize', () => {
    updateCarousel(carouselIndex);
  });

  // Modal open function
  function openClientModal(clientIdOrIndex) {
    let index = 0;
    if (typeof clientIdOrIndex === 'number') {
      index = clientIdOrIndex;
    } else {
      const foundIdx = DHARA_CLIENTS.findIndex(c => c.id === clientIdOrIndex);
      index = foundIdx !== -1 ? foundIdx : 0;
    }

    if (index < 0) index = DHARA_CLIENTS.length - 1;
    if (index >= DHARA_CLIENTS.length) index = 0;
    activeClientIndex = index;

    const client = DHARA_CLIENTS[activeClientIndex];
    if (!client) return;

    // Populate modal elements
    const logoEl = document.getElementById('clientModalLogo');
    const titleEl = document.getElementById('clientModalTitle');
    const imgEl = document.getElementById('clientModalImg');
    const badgeEl = document.getElementById('clientModalBadge');
    const descEl = document.getElementById('clientModalDesc');
    const locEl = document.getElementById('clientModalLocation');
    const propTypeEl = document.getElementById('clientModalPropertyType');
    const servEl = document.getElementById('clientModalServices');
    const suppEl = document.getElementById('clientModalSupport');
    const outcomeEl = document.getElementById('clientModalOutcome');

    if (logoEl) {
      logoEl.src = client.logo;
      logoEl.alt = client.name;
    }
    if (titleEl) titleEl.textContent = client.name;
    if (imgEl) {
      imgEl.src = client.projectImage;
      imgEl.alt = `${client.name} Prime Project`;
    }
    if (badgeEl) badgeEl.textContent = client.category;
    if (descEl) descEl.textContent = client.description;
    if (locEl) locEl.textContent = client.location;
    if (propTypeEl) propTypeEl.textContent = client.propertyType;
    if (servEl) servEl.textContent = client.servicesProvided;
    if (suppEl) suppEl.textContent = client.supportRole;
    if (outcomeEl) outcomeEl.textContent = client.outcome;

    // Open modal with smooth animation
    if (modalBackdrop) {
      modalBackdrop.classList.add('open');
      modalBackdrop.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeClientModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('open');
    modalBackdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Bind card clicks
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const clientId = card.getAttribute('data-client-id');
      openClientModal(clientId);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const clientId = card.getAttribute('data-client-id');
        openClientModal(clientId);
      }
    });
  });

  // Modal navigation
  if (modalPrevBtn) {
    modalPrevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openClientModal(activeClientIndex - 1);
    });
  }

  if (modalNextBtn) {
    modalNextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openClientModal(activeClientIndex + 1);
    });
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeClientModal);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeClientModal();
      }
    });
  }

  // Key navigation (Esc, ArrowLeft, ArrowRight)
  document.addEventListener('keydown', (e) => {
    if (!modalBackdrop || !modalBackdrop.classList.contains('open')) return;
    if (e.key === 'Escape') {
      closeClientModal();
    } else if (e.key === 'ArrowLeft') {
      openClientModal(activeClientIndex - 1);
    } else if (e.key === 'ArrowRight') {
      openClientModal(activeClientIndex + 1);
    }
  });

  // Inquire button inside modal
  if (modalInquireBtn) {
    modalInquireBtn.addEventListener('click', () => {
      closeClientModal();
      const visitModal = document.getElementById('visitModal');
      if (visitModal) {
        visitModal.classList.add('open');
        document.body.style.overflow = 'hidden';
      } else {
        const contactSection = document.getElementById('contact');
        if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

// Footer Phone Call Dialog & Direct Gmail Opener
function initFooterContactActions() {
  // Inject Call Modal if not already present
  if (!document.getElementById('dharaCallModalOverlay')) {
    const modalHtml = `
      <div class="dhara-call-modal-overlay" id="dharaCallModalOverlay" role="dialog" aria-modal="true" aria-hidden="true">
        <div class="dhara-call-modal-card">
          <button class="dhara-call-modal-close" id="dharaCallModalCloseBtn" aria-label="Close dialog">&times;</button>
          <span class="dhara-call-modal-badge">Direct Line &bull; Dhara Prime Realty</span>
          <div class="dhara-call-modal-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#D4A72C">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-2.2 2.2a15.053 15.053 0 0 1-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1.01A11.36 11.36 0 0 1 8.57 3.99c.07-.55-.38-1-1-1H4.02c-.55 0-1 .45-1 1C3.02 13.28 10.73 21 20.01 21c.55 0 1-.45 1-1v-3.62c0-.55-.45-1-1-1z"/>
            </svg>
          </div>
          <h3 class="dhara-call-modal-title">Connect with Advisory Desk</h3>
          <p class="dhara-call-modal-desc">Tap below to place a direct phone call or message on WhatsApp</p>
          <div class="dhara-call-modal-number" id="dharaCallModalNumDisplay">+91 83176 04342</div>
          <div class="dhara-call-modal-actions">
            <a href="tel:+918317604342" class="dhara-call-btn-call" id="dharaCallModalDirectBtn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-2.2 2.2a15.053 15.053 0 0 1-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1.01A11.36 11.36 0 0 1 8.57 3.99c.07-.55-.38-1-1-1H4.02c-.55 0-1 .45-1 1C3.02 13.28 10.73 21 20.01 21c.55 0 1-.45 1-1v-3.62c0-.55-.45-1-1-1z"/>
              </svg>
              <span>Call Now</span>
            </a>
            <a href="https://wa.me/918317604342" target="_blank" class="dhara-call-btn-wa" id="dharaCallModalWaBtn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const overlay = document.getElementById('dharaCallModalOverlay');
    const closeBtn = document.getElementById('dharaCallModalCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => {
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
    });
    if (overlay) overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // Handle phone clicks
  document.addEventListener('click', (e) => {
    const telLink = e.target.closest('.footer-tel-link');
    if (telLink) {
      const phoneRaw = telLink.getAttribute('data-phone') || telLink.getAttribute('href').replace('tel:', '');
      const displayNum = telLink.getAttribute('data-display') || phoneRaw;
      const cleanDigits = phoneRaw.replace(/[^0-9]/g, '');

      const overlay = document.getElementById('dharaCallModalOverlay');
      const numDisplay = document.getElementById('dharaCallModalNumDisplay');
      const directBtn = document.getElementById('dharaCallModalDirectBtn');
      const waBtn = document.getElementById('dharaCallModalWaBtn');

      if (overlay && numDisplay && directBtn && waBtn) {
        numDisplay.textContent = displayNum;
        directBtn.href = `tel:+${cleanDigits}`;
        waBtn.href = `https://wa.me/${cleanDigits}?text=${encodeURIComponent('Hello Dhara Prime Realty, I am inquiring about properties in Hyderabad.')}`;
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
      }

      // Check if mobile device - on mobile, also trigger the tel: dialer directly!
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = `tel:+${cleanDigits}`;
      } else {
        e.preventDefault();
      }
    }

    // Handle email clicks -> Open Gmail directly
    const emailLink = e.target.closest('.footer-email-link');
    if (emailLink) {
      const email = emailLink.getAttribute('data-email') || emailLink.textContent.trim();
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (!isMobile) {
        // On desktop, open Gmail compose tab directly
        e.preventDefault();
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent('Inquiry: Dhara Prime Realty Services')}`;
        window.open(gmailUrl, '_blank', 'noopener,noreferrer');
      }
      // On mobile, let default mailto: execute, which opens Gmail / native email app!
    }
  });
}


