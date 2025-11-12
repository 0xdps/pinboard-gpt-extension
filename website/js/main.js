// Pinboard GPT Website JavaScript

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initMobileMenu();
    initSmoothScroll();
    initScrollAnimations();
    initScrollSpy();
    initBrowserDetection();
    
    console.log('Pinboard GPT website loaded successfully!');
});

// Mobile Menu Toggle
function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        const navLinkItems = document.querySelectorAll('.nav-link');
        navLinkItems.forEach(link => {
            link.addEventListener('click', function() {
                navLinks.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.navbar')) {
                navLinks.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            }
        });
    }
}

// Smooth Scroll for anchor links
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.offsetTop - navHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Add fade-in class to elements and observe them
    const elementsToAnimate = [
        '.feature-card',
        '.step',
        '.use-case',
        '.install-option',
        '.manage-pins'
    ];
    
    elementsToAnimate.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el, index) => {
            el.classList.add('fade-in');
            // Add slight delay for staggered animation
            el.style.animationDelay = `${index * 0.1}s`;
            observer.observe(el);
        });
    });
}

// Scroll Spy for Navigation
function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    function updateActiveLink() {
        let current = '';
        const scrollPos = window.pageYOffset + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', updateActiveLink);
    updateActiveLink(); // Call once on load
}

// Browser Detection and Install Button Optimization
function initBrowserDetection() {
    const userAgent = navigator.userAgent.toLowerCase();
    let detectedBrowser = 'unknown';
    
    // Detect browser
    if (userAgent.includes('firefox')) {
        detectedBrowser = 'firefox';
    } else if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
        detectedBrowser = 'chrome';
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
        detectedBrowser = 'safari';
    } else if (userAgent.includes('edg')) {
        detectedBrowser = 'edge';
    }
    
    // Update install section based on detected browser
    updateInstallSection(detectedBrowser);
    
    // Track browser detection for analytics
    trackEvent('browser_detected', { browser: detectedBrowser });
}

function updateInstallSection(browser) {
    const chromeOption = document.querySelector('.install-option[data-browser="chrome"]');
    const firefoxOption = document.querySelector('.install-option[data-browser="firefox"]');
    const sourceOption = document.querySelector('.install-option[data-browser="source"]');
    
    if (!chromeOption || !firefoxOption) return;
    
    // Reset all options to secondary
    chromeOption.classList.remove('primary');
    firefoxOption.classList.remove('primary');
    if (sourceOption) sourceOption.classList.remove('primary');
    
    // Show appropriate primary option based on browser
    if (browser === 'firefox') {
        firefoxOption.classList.add('primary');
        // Reorder: Firefox first, then Chrome, then Source
        const installOptions = document.querySelector('.install-options');
        if (installOptions) {
            installOptions.insertBefore(firefoxOption, chromeOption);
        }
    } else if (browser === 'chrome' || browser === 'edge') {
        chromeOption.classList.add('primary');
        // Keep Chrome first (default order)
    } else if (browser === 'safari') {
        // For Safari, show source option as primary since no browser extension available
        if (sourceOption) {
            sourceOption.classList.add('primary');
        }
        // Show a helpful message for Safari users
        showSafariMessage();
    } else {
        // Unknown browser - default to Chrome first
        chromeOption.classList.add('primary');
    }
    
    // Update install steps based on browser
    updateInstallSteps(browser);
    
    // Update hero CTA button based on browser
    updateHeroCTA(browser);
}

function updateInstallSteps(browser) {
    const stepsContainer = document.querySelector('.install-steps .steps-content');
    const stepsTitle = document.querySelector('.install-steps .steps-title');
    
    if (!stepsContainer) return;
    
    let stepsHTML = '';
    let title = '';
    
    if (browser === 'chrome' || browser === 'edge') {
        title = 'Chrome Installation Steps:';
        stepsHTML = `
            <ol class="steps-list">
                <li>Click "🚀 Install for Chrome" above</li>
                <li>Click "Add to Chrome" on the Chrome Web Store</li>
                <li>Click "Add extension" to confirm</li>
                <li>Visit <a href="https://chatgpt.com" target="_blank">ChatGPT</a> and start pinning!</li>
            </ol>
            <div class="steps-alt">
                <p><strong>Alternative - Install from Source:</strong></p>
                <ol class="steps-list">
                    <li>Download from <a href="https://github.com/0xdps/gpt-pinboard-extension" target="_blank">GitHub</a></li>
                    <li>Go to <code>chrome://extensions/</code></li>
                    <li>Enable "Developer Mode"</li>
                    <li>Click "Load unpacked" → Select the extension folder</li>
                </ol>
            </div>
        `;
    } else if (browser === 'firefox') {
        title = 'Firefox Installation Steps:';
        stepsHTML = `
            <ol class="steps-list">
                <li>Click "🦊 Install for Firefox" above</li>
                <li>Click "Add to Firefox" on the Firefox Add-ons page</li>
                <li>Click "Add" when prompted</li>
                <li>Visit <a href="https://chatgpt.com" target="_blank">ChatGPT</a> and start pinning!</li>
            </ol>
            <div class="steps-alt">
                <p><strong>Alternative - Install from Source:</strong></p>
                <ol class="steps-list">
                    <li>Download from <a href="https://github.com/0xdps/gpt-pinboard-extension" target="_blank">GitHub</a></li>
                    <li>Go to <code>about:debugging</code></li>
                    <li>Click "This Firefox"</li>
                    <li>Click "Load Temporary Add-on" → Select the manifest.json from firefox folder</li>
                </ol>
            </div>
        `;
    } else if (browser === 'safari') {
        title = 'Safari Installation (Source Only):';
        stepsHTML = `
            <div class="safari-notice-inline">
                <p><strong>Note:</strong> Safari doesn't support Chrome/Firefox extensions. Please use source installation or switch to Chrome/Firefox.</p>
            </div>
            <ol class="steps-list">
                <li>Download from <a href="https://github.com/0xdps/gpt-pinboard-extension" target="_blank">GitHub</a></li>
                <li>Safari extensions require conversion to Safari Web Extension format</li>
                <li>Consider using <strong>Chrome</strong> or <strong>Firefox</strong> for the best experience</li>
                <li>Or follow the detailed guide in our <a href="https://github.com/0xdps/gpt-pinboard-extension#safari-installation" target="_blank">documentation</a></li>
            </ol>
        `;
    } else {
        // Default/unknown browser
        title = 'Installation Steps:';
        stepsHTML = `
            <ol class="steps-list">
                <li>Choose your browser above (Chrome or Firefox recommended)</li>
                <li>Click the install button for your browser</li>
                <li>Follow the browser-specific installation prompts</li>
                <li>Visit <a href="https://chatgpt.com" target="_blank">ChatGPT</a> and start pinning!</li>
            </ol>
            <div class="steps-alt">
                <p><strong>Install from Source (All Browsers):</strong></p>
                <ol class="steps-list">
                    <li>Download from <a href="https://github.com/0xdps/gpt-pinboard-extension" target="_blank">GitHub</a></li>
                    <li>Follow browser-specific instructions in the README</li>
                    <li>Chrome: <code>chrome://extensions/</code> → Developer Mode → Load unpacked</li>
                    <li>Firefox: <code>about:debugging</code> → Load Temporary Add-on</li>
                </ol>
            </div>
        `;
    }
    
    // Update title and content
    if (stepsTitle) stepsTitle.textContent = title;
    stepsContainer.innerHTML = stepsHTML;
}

function updateHeroCTA(browser) {
    const heroCTA = document.querySelector('.hero-buttons .btn-primary');
    if (!heroCTA) return;
    
    const originalHref = heroCTA.getAttribute('href');
    
    if (browser === 'firefox') {
        heroCTA.innerHTML = '<span>🦊</span> Install for Firefox';
        // Update href to go directly to Firefox section or addon store
        heroCTA.setAttribute('data-original-href', originalHref);
        heroCTA.addEventListener('click', function(e) {
            e.preventDefault();
            // Scroll to install section and highlight Firefox option
            const installSection = document.getElementById('install');
            if (installSection) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = installSection.offsetTop - navHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Highlight Firefox option briefly
                setTimeout(() => {
                    const firefoxOption = document.querySelector('.install-option[data-browser="firefox"]');
                    if (firefoxOption) {
                        firefoxOption.style.transform = 'scale(1.02)';
                        firefoxOption.style.boxShadow = '0 0 30px rgba(255, 140, 0, 0.3)';
                        setTimeout(() => {
                            firefoxOption.style.transform = '';
                            firefoxOption.style.boxShadow = '';
                        }, 1500);
                    }
                }, 500);
            }
        });
    } else if (browser === 'chrome' || browser === 'edge') {
        heroCTA.innerHTML = '<span>🚀</span> Install for Chrome';
        // Keep original install section scroll behavior
    } else if (browser === 'safari') {
        heroCTA.innerHTML = '<span>📦</span> Get from Source';
        heroCTA.addEventListener('click', function(e) {
            e.preventDefault();
            // Direct to GitHub or show install instructions
            window.open('https://github.com/0xdps/gpt-pinboard-extension#install-from-source', '_blank');
        });
    }
}

function showSafariMessage() {
    // Show a friendly message for Safari users
    const safariMessage = document.createElement('div');
    safariMessage.className = 'safari-notice';
    safariMessage.innerHTML = `
        <div class="notice-content">
            <span class="notice-icon">🍎</span>
            <div class="notice-text">
                <strong>Safari User?</strong> Since Safari doesn't support Chrome/Firefox extensions, 
                you can install from source or use Chrome/Firefox for the best experience.
            </div>
        </div>
    `;
    
    // Style the notice
    Object.assign(safariMessage.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        maxWidth: '350px',
        backgroundColor: '#f59e0b',
        color: 'white',
        padding: '1rem',
        borderRadius: '0.75rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        zIndex: '9998',
        transform: 'translateY(100%)',
        transition: 'transform 0.3s ease',
        fontSize: '0.9rem'
    });
    
    safariMessage.querySelector('.notice-content').style.display = 'flex';
    safariMessage.querySelector('.notice-content').style.alignItems = 'center';
    safariMessage.querySelector('.notice-content').style.gap = '0.75rem';
    safariMessage.querySelector('.notice-icon').style.fontSize = '1.5rem';
    
    document.body.appendChild(safariMessage);
    
    // Animate in
    setTimeout(() => {
        safariMessage.style.transform = 'translateY(0)';
    }, 1000);
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
        safariMessage.style.transform = 'translateY(100%)';
        setTimeout(() => {
            if (document.body.contains(safariMessage)) {
                document.body.removeChild(safariMessage);
            }
        }, 300);
    }, 8000);
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1rem;
        line-height: 1;
    `;
    
    closeBtn.addEventListener('click', () => {
        safariMessage.style.transform = 'translateY(100%)';
        setTimeout(() => {
            if (document.body.contains(safariMessage)) {
                document.body.removeChild(safariMessage);
            }
        }, 300);
    });
    
    safariMessage.appendChild(closeBtn);
}

// Navbar Background on Scroll
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Form Handling (for future contact forms)
function handleFormSubmission(formId, callback) {
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            if (callback && typeof callback === 'function') {
                callback(data);
            }
        });
    }
}

// Copy to Clipboard Functionality
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showNotification('Copied to clipboard!', 'success');
    });
}

// Show Notification (for future use)
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '0.5rem',
        color: 'white',
        fontWeight: '500',
        zIndex: '9999',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
    });
    
    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Analytics (placeholder for future implementation)
function trackEvent(eventName, parameters = {}) {
    // This would integrate with analytics services like Google Analytics
    console.log('Event tracked:', eventName, parameters);
    
    // Example implementation:
    // gtag('event', eventName, parameters);
}

// Track button clicks
document.addEventListener('click', function(e) {
    const button = e.target.closest('.btn');
    if (button) {
        const buttonText = button.textContent.trim();
        const buttonType = button.classList.contains('btn-primary') ? 'primary' : 'secondary';
        
        trackEvent('button_click', {
            button_text: buttonText,
            button_type: buttonType,
            page_section: getPageSection(button)
        });
    }
});

// Get page section for analytics
function getPageSection(element) {
    const section = element.closest('section');
    return section ? section.id || section.className.split(' ')[0] : 'unknown';
}

// Lazy Loading for Images (future enhancement)
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => {
        imageObserver.observe(img);
    });
}

// Theme Toggle (for future dark mode support)
function initThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-theme');
            
            // Save preference
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            
            trackEvent('theme_toggle', { theme: isDark ? 'dark' : 'light' });
        });
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }
}

// Performance Monitoring
function initPerformanceMonitoring() {
    // Log page load time
    window.addEventListener('load', function() {
        const loadTime = performance.now();
        console.log(`Page loaded in ${Math.round(loadTime)}ms`);
        
        trackEvent('page_load', {
            load_time: Math.round(loadTime),
            connection_type: navigator.connection?.effectiveType || 'unknown'
        });
    });
}

// Error Handling
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    
    trackEvent('javascript_error', {
        message: e.message,
        filename: e.filename,
        line: e.lineno,
        column: e.colno
    });
});

// Service Worker Registration (for future PWA support)
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
}

// Utility Functions
const utils = {
    // Debounce function for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle function for scroll events
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },
    
    // Format numbers (for future stats)
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
};

// Export utils for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { utils, trackEvent, showNotification };
}