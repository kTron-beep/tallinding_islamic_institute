// Main JavaScript for Tallinding Islamic Institute

let currentLang = localStorage.getItem('lang') || 'ar';
let mobileToggle;
let mobileDrawer;
let mobileClose;
let mobileToggleIcon;

const searchDictionary = [
    "quran", "quranic studies", "islamic sciences", "academic curriculum",
    "admissions", "student life", "mission", "vision", "about", "contact",
    "programs", "courses", "faculty", "staff", "events", "news",
    "tallinding", "islamic institute", "gambia", "education",
    "arabic", "hifz", "tajweed", "tafsir", "aqeedah", "fiqh", "seerah", "hadith"
];

let searchHighlights = [];
let currentMatchIndex = -1;

document.addEventListener('DOMContentLoaded', () => {
    initLanguage();
    initNavigation();
    initSearch();
    initLightbox();
    initSmoothScrolling();
    initFormValidation();
    initHeroCarousel();
    initScrollToTop();
    initHeaderScroll();
});

function applyTranslations(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);

    const direction = lang === 'ar' ? 'rtl' : 'ltr';
    const langCode = lang === 'ar' ? 'ar' : 'en';
    
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', langCode);

    const translatable = document.querySelectorAll('[data-translate]');
    translatable.forEach(el => {
        const key = el.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            // Preserve HTML structure if present
            const hasHTML = el.innerHTML !== el.textContent;
            if (hasHTML) {
                el.innerHTML = translations[lang][key];
            } else {
                el.textContent = translations[lang][key];
            }
        }
    });

    updateLanguageSwitcher(lang);
    closeMobileDrawer();
    
    // Force reflow to ensure RTL changes apply immediately
    document.body.offsetHeight;
}

function updateLanguageSwitcher(lang) {
    const desktopAr = document.getElementById('lang-ar');
    const desktopEn = document.getElementById('lang-en');
    const mobileAr = document.getElementById('lang-ar-mobile');
    const mobileEn = document.getElementById('lang-en-mobile');

    [desktopAr, mobileAr].forEach(btn => btn && btn.classList.toggle('active', lang === 'ar'));
    [desktopEn, mobileEn].forEach(btn => btn && btn.classList.toggle('active', lang === 'en'));
}

function initLanguage() {
    applyTranslations(currentLang);

    const desktopAr = document.getElementById('lang-ar');
    const desktopEn = document.getElementById('lang-en');
    const mobileAr = document.getElementById('lang-ar-mobile');
    const mobileEn = document.getElementById('lang-en-mobile');

    desktopAr?.addEventListener('click', () => applyTranslations('ar'));
    desktopEn?.addEventListener('click', () => applyTranslations('en'));
    mobileAr?.addEventListener('click', () => applyTranslations('ar'));
    mobileEn?.addEventListener('click', () => applyTranslations('en'));
}

function initNavigation() {
    mobileToggle = document.getElementById('mobile-menu-toggle');
    mobileDrawer = document.getElementById('mobile-drawer');
    mobileClose = document.getElementById('mobile-menu-close');
    mobileToggleIcon = mobileToggle?.querySelector('i');

    highlightActiveNav();

    if (mobileToggle && mobileDrawer) {
        mobileToggle.addEventListener('click', () => {
            if (mobileDrawer.classList.contains('show')) {
                closeMobileDrawer(true);
            } else {
                openMobileDrawer();
            }
        });
    }

    mobileClose?.addEventListener('click', () => closeMobileDrawer(true));

    const mobileLinks = mobileDrawer?.querySelectorAll('a');
    mobileLinks?.forEach(link => link.addEventListener('click', () => closeMobileDrawer(false)));

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 992) {
            closeMobileDrawer(false);
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeMobileDrawer(true);
        }
    });
}

function highlightActiveNav() {
    const currentPage = document.body.dataset.page;
    if (!currentPage) return;

    document.querySelectorAll('[data-nav-item]').forEach(link => {
        const isActive = link.dataset.navItem === currentPage;
        link.classList.toggle('active', isActive);
        if (isActive) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

function openMobileDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.add('show');
    document.body.classList.add('menu-open');
    if (mobileToggleIcon) {
        mobileToggleIcon.classList.remove('fa-bars');
        mobileToggleIcon.classList.add('fa-times');
    }
}

function closeMobileDrawer(restoreFocus = false) {
    if (!mobileDrawer) return;
    mobileDrawer.classList.remove('show');
    document.body.classList.remove('menu-open');
    if (mobileToggleIcon) {
        mobileToggleIcon.classList.add('fa-bars');
        mobileToggleIcon.classList.remove('fa-times');
    }
    if (restoreFocus) {
        mobileToggle?.focus({ preventScroll: true });
    }
}

function initSearch() {
    const searchInput = document.getElementById('siteSearchInput');
    const searchButton = document.getElementById('siteSearchButton');
    const spellCheckIndicator = document.getElementById('spellCheckIndicator');
    const searchSuggestions = document.getElementById('searchSuggestions');
    const resultsNav = document.getElementById('searchResultsNav');
    const resultsCount = document.getElementById('searchResultsCount');
    const resultsList = document.getElementById('searchResultsList');
    const resultsClose = document.getElementById('searchResultsClose');
    const prevMatchButton = document.getElementById('prevMatch');
    const nextMatchButton = document.getElementById('nextMatch');

    if (!searchInput || !searchButton) return;

    searchInput.addEventListener('input', () => handleSpellCheck(searchInput, spellCheckIndicator, searchSuggestions));
    searchInput.addEventListener('focus', () => handleSpellCheck(searchInput, spellCheckIndicator, searchSuggestions));
    searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            triggerSearch();
        }
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('.search-container')) {
            searchSuggestions.style.display = 'none';
        }
    });

    searchButton.addEventListener('click', triggerSearch);

    function triggerSearch() {
        const term = searchInput.value.trim();
        if (!term) return;
        clearHighlights(resultsNav);

        searchHighlights = searchOnPage(term);
        if (searchHighlights.length === 0) {
            alert(`No matches found for: ${term}`);
            return;
        }

        resultsCount.textContent = `${searchHighlights.length} match${searchHighlights.length === 1 ? '' : 'es'} found`;
        populateResultsList(resultsList);
        resultsNav.style.display = 'flex';
        goToMatch(0, prevMatchButton, nextMatchButton);
    }

    prevMatchButton?.addEventListener('click', () => goToMatch(currentMatchIndex - 1, prevMatchButton, nextMatchButton));
    nextMatchButton?.addEventListener('click', () => goToMatch(currentMatchIndex + 1, prevMatchButton, nextMatchButton));
    resultsClose?.addEventListener('click', () => clearHighlights(resultsNav));
}

function handleSpellCheck(input, indicator, suggestions) {
    const value = input.value.trim().toLowerCase();
    suggestions.innerHTML = '';
    suggestions.style.display = 'none';
    indicator.style.opacity = '0';

    if (value.length < 2) return;

    const matches = searchDictionary.filter(term => term.includes(value));
    const exact = searchDictionary.includes(value);

    if (exact) {
        indicator.textContent = '✓ Match found';
        indicator.className = 'spell-check-indicator spell-check-match';
        indicator.style.opacity = '1';
        return;
    }

    if (matches.length === 0) {
        indicator.textContent = 'No matches found';
        indicator.className = 'spell-check-indicator spell-check-no-match';
        indicator.style.opacity = '1';
        return;
    }

    indicator.textContent = 'Did you mean...';
    indicator.className = 'spell-check-indicator spell-check-no-match';
    indicator.style.opacity = '1';

    matches.slice(0, 5).forEach(match => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = match;
        item.addEventListener('click', () => {
            input.value = match;
            handleSpellCheck(input, indicator, suggestions);
            suggestions.style.display = 'none';
        });
        suggestions.appendChild(item);
    });

    suggestions.style.display = 'block';
}

function searchOnPage(term) {
    const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, span, a');
    const matches = [];
    const regex = new RegExp(term, 'gi');

    elements.forEach(element => {
        if (element.closest('.search-container') || element.closest('.search-results-nav')) return;
        const originalHTML = element.innerHTML;
        const text = element.textContent;

        if (regex.test(text)) {
            element.innerHTML = text.replace(regex, match => `<span class="search-highlight">${match}</span>`);
            element.querySelectorAll('.search-highlight').forEach(highlight => {
                matches.push({ element: highlight, parent: element, originalHTML, text });
            });
        }
    });

    return matches;
}

function clearHighlights(resultsNav) {
    searchHighlights.forEach(match => {
        if (match.parent) {
            match.parent.innerHTML = match.originalHTML;
        }
    });
    searchHighlights = [];
    currentMatchIndex = -1;
    if (resultsNav) {
        resultsNav.style.display = 'none';
        const list = resultsNav.querySelector('.search-results-list');
        if (list) list.innerHTML = '';
    }
}

function populateResultsList(container) {
    container.innerHTML = '';
    searchHighlights.forEach((match, index) => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        const context = match.text.length > 100 ? `${match.text.substring(0, 100)}...` : match.text;
        item.innerHTML = `<i class="fas fa-search search-result-icon"></i><span>${context}</span>`;
        item.addEventListener('click', () => goToMatch(index));
        container.appendChild(item);
    });
}

function goToMatch(index, prevBtn, nextBtn) {
    if (index < 0 || index >= searchHighlights.length) return;

    searchHighlights.forEach(match => match.element.classList.remove('active'));
    currentMatchIndex = index;
    const current = searchHighlights[currentMatchIndex];

    current.element.classList.add('active');
    current.element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    updateNavigationButtons(prevBtn, nextBtn);
    updateActiveResult();
}

function updateNavigationButtons(prevBtn, nextBtn) {
    if (!prevBtn || !nextBtn) {
        prevBtn = document.getElementById('prevMatch');
        nextBtn = document.getElementById('nextMatch');
    }
    prevBtn.disabled = currentMatchIndex <= 0;
    nextBtn.disabled = currentMatchIndex >= searchHighlights.length - 1;
}

function updateActiveResult() {
    const items = document.querySelectorAll('.search-result-item');
    items.forEach((item, idx) => {
        item.classList.toggle('active', idx === currentMatchIndex);
    });
}

function initLightbox() {
    const galleryItems = document.querySelectorAll('.gallery-item img');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('close-lightbox');

    if (!lightbox || !lightboxImg) return;

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            lightboxImg.src = item.src;
            lightboxImg.alt = item.alt;
            lightbox.classList.add('active');
            document.body.classList.add('menu-open');
        });
    });

    const close = () => {
        lightbox.classList.remove('active');
        document.body.classList.remove('menu-open');
    };

    lightboxClose?.addEventListener('click', close);
    lightbox.addEventListener('click', e => {
        if (e.target === lightbox) close();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) close();
    });
}

function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            const targetId = link.getAttribute('href');
            if (!targetId || targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function initFormValidation() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    // Create error message container
    let errorContainer = document.getElementById('form-errors');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'form-errors';
        errorContainer.className = 'form-errors';
        errorContainer.setAttribute('role', 'alert');
        errorContainer.setAttribute('aria-live', 'polite');
        form.insertBefore(errorContainer, form.firstChild);
    }

    // Create success message container
    let successContainer = document.getElementById('form-success');
    if (!successContainer) {
        successContainer = document.createElement('div');
        successContainer.id = 'form-success';
        successContainer.className = 'form-success';
        successContainer.setAttribute('role', 'alert');
        successContainer.setAttribute('aria-live', 'polite');
        form.insertBefore(successContainer, form.firstChild);
    }

    function showError(message) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        successContainer.style.display = 'none';
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function showSuccess(message) {
        successContainer.textContent = message;
        successContainer.style.display = 'block';
        errorContainer.style.display = 'none';
        successContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function clearMessages() {
        errorContainer.style.display = 'none';
        successContainer.style.display = 'none';
    }

    form.addEventListener('submit', e => {
        e.preventDefault();
        clearMessages();

        const name = document.getElementById('name');
        const phone = document.getElementById('phone');
        const email = document.getElementById('email');
        const message = document.getElementById('message');

        const nameValue = name.value.trim();
        const phoneValue = phone.value.trim();
        const emailValue = email.value.trim();
        const messageValue = message.value.trim();

        // Remove previous error states
        [name, phone, email, message].forEach(field => {
            field.classList.remove('error');
            const errorMsg = field.parentElement.querySelector('.field-error');
            if (errorMsg) errorMsg.remove();
        });

        const errors = [];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;

        if (!nameValue) {
            errors.push('Name is required.');
            name.classList.add('error');
        }
        if (!phoneValue) {
            errors.push('Phone number is required.');
            phone.classList.add('error');
        } else if (!phoneRegex.test(phoneValue)) {
            errors.push('Please enter a valid phone number.');
            phone.classList.add('error');
        }
        if (!emailValue) {
            errors.push('Email is required.');
            email.classList.add('error');
        } else if (!emailRegex.test(emailValue)) {
            errors.push('Please enter a valid email address.');
            email.classList.add('error');
        }
        if (!messageValue) {
            errors.push('Message is required.');
            message.classList.add('error');
        }

        if (errors.length) {
            showError(errors.join(' '));
            return;
        }

        showSuccess('Thank you for your message! We will get back to you soon.');
        form.reset();
        
        // Clear success message after 5 seconds
        setTimeout(() => {
            successContainer.style.display = 'none';
        }, 5000);
    });
}

// Header Scroll Minimization
function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) {
        console.warn('Header element not found');
        return;
    }

    const scrollThreshold = 100; // Scroll distance before minimizing
    let lastScroll = 0;
    let isMobile = window.innerWidth <= 768;
    let scrollTimeout = null;

    function handleScroll() {
        const currentScroll = window.pageYOffset || 
                              document.documentElement.scrollTop || 
                              window.scrollY ||
                              (document.body && document.body.scrollTop) || 
                              0;

        // Update mobile detection on resize
        isMobile = window.innerWidth <= 768;

        if (currentScroll > scrollThreshold) {
            if (!header.classList.contains('scrolled')) {
                header.classList.add('scrolled');
            }

            // On mobile: hide header when scrolling down, show when scrolling up
            if (isMobile) {
                const scrollDifference = currentScroll - lastScroll;
                const scrollThresholdMobile = 10; // Minimum scroll distance to trigger

                if (scrollDifference > scrollThresholdMobile && currentScroll > 150) {
                    // Scrolling down - hide header
                    if (!header.classList.contains('header-hidden')) {
                        header.classList.add('header-hidden');
                    }
                } else if (scrollDifference < -scrollThresholdMobile) {
                    // Scrolling up - show header with smooth animation
                    header.classList.remove('header-hidden');
                    // Add a temporary class for extra animation effect
                    header.classList.add('header-showing');
                    setTimeout(() => {
                        header.classList.remove('header-showing');
                    }, 400);
                }
            } else {
                // On desktop, always show header when scrolled
                header.classList.remove('header-hidden');
            }
        } else {
            if (header.classList.contains('scrolled')) {
                header.classList.remove('scrolled');
            }
            // Always show header when at top
            header.classList.remove('header-hidden');
        }

        lastScroll = currentScroll;
    }

    // Initial check on load
    setTimeout(handleScroll, 100);

    // Update mobile detection on resize
    window.addEventListener('resize', () => {
        isMobile = window.innerWidth <= 768;
        handleScroll();
    }, { passive: true });

    // Add scroll listener with throttling for better performance
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// Scroll to Top Button
function initScrollToTop() {
    const scrollButton = document.getElementById('scrollToTop');
    if (!scrollButton) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollButton.classList.add('show');
        } else {
            scrollButton.classList.remove('show');
        }
    });

    scrollButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Hero Carousel Functionality
function initHeroCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const prevBtn = document.querySelector('.carousel-btn-prev');
    const nextBtn = document.querySelector('.carousel-btn-next');
    const heroCarousel = document.querySelector('.hero-carousel');
    
    if (!slides.length || !prevBtn || !nextBtn) return;
    
    // Load and set images from data-bg attributes
    slides.forEach((slide, index) => {
        const imagePath = slide.getAttribute('data-bg');
        if (imagePath) {
            // Preload image first, then set background
            const img = new Image();
            img.onload = function() {
                // Image loaded successfully, now set it
                slide.style.backgroundImage = `url('${imagePath}')`;
                slide.style.backgroundSize = 'cover';
                slide.style.backgroundPosition = 'center';
                slide.style.backgroundRepeat = 'no-repeat';
                console.log(`Hero image ${index + 1} loaded: ${imagePath}`);
            };
            img.onerror = function() {
                console.error(`Hero image ${index + 1} failed to load: ${imagePath}`);
                // Try alternative path
                const altPath = imagePath.replace('assets/assets/', 'assets/');
                const altImg = new Image();
                altImg.onload = function() {
                    slide.style.backgroundImage = `url('${altPath}')`;
                    slide.style.backgroundSize = 'cover';
                    slide.style.backgroundPosition = 'center';
                    slide.style.backgroundRepeat = 'no-repeat';
                    console.log(`Hero image ${index + 1} loaded from alternative path: ${altPath}`);
                };
                altImg.onerror = function() {
                    console.error(`Hero image ${index + 1} failed from both paths`);
                };
                altImg.src = altPath;
            };
            img.src = imagePath;
        } else {
            // Fallback to CSS if no data-bg attribute
            console.log(`No data-bg attribute for slide ${index + 1}, using CSS fallback`);
        }
    });
    
    let currentSlide = 0;
    let carouselInterval;
    const slideInterval = 5000; // 5 seconds
    
    // Function to show a specific slide
    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        
        if (index >= slides.length) {
            currentSlide = 0;
        } else if (index < 0) {
            currentSlide = slides.length - 1;
        } else {
            currentSlide = index;
        }
        
        slides[currentSlide].classList.add('active');
    }
    
    // Function to show next slide
    function nextSlide() {
        showSlide(currentSlide + 1);
    }
    
    // Function to show previous slide
    function prevSlide() {
        showSlide(currentSlide - 1);
    }
    
    // Start auto-slide
    function startCarousel() {
        carouselInterval = setInterval(nextSlide, slideInterval);
    }
    
    // Stop auto-slide
    function stopCarousel() {
        clearInterval(carouselInterval);
    }
    
    // Function to handle button click/touch
    function handleNext() {
        nextSlide();
        stopCarousel();
        startCarousel(); // Restart after manual navigation
    }
    
    function handlePrev() {
        prevSlide();
        stopCarousel();
        startCarousel(); // Restart after manual navigation
    }
    
    // Event listeners for navigation buttons - support both click and touch
    nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleNext();
    });
    nextBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleNext();
    });
    nextBtn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    });
    
    prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handlePrev();
    });
    prevBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handlePrev();
    });
    prevBtn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    });
    
    // Pause on hover (desktop only)
    if (window.innerWidth >= 768 && heroCarousel) {
        heroCarousel.addEventListener('mouseenter', stopCarousel);
        heroCarousel.addEventListener('mouseleave', startCarousel);
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768 && heroCarousel) {
            heroCarousel.addEventListener('mouseenter', stopCarousel);
            heroCarousel.addEventListener('mouseleave', startCarousel);
        } else if (heroCarousel) {
            heroCarousel.removeEventListener('mouseenter', stopCarousel);
            heroCarousel.removeEventListener('mouseleave', startCarousel);
        }
    });
    
    // Start the carousel
    startCarousel();
    
    // Initialize first slide
    showSlide(0);
}

