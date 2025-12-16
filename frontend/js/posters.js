// Poster Slideshow and Modal
(function() {
    let currentSlide = 1;
    const totalSlides = 5;
    let slideshowInterval;
    
    const posterFrame = document.getElementById('posterFrame');
    const dotIndicators = document.querySelectorAll('.dot-indicator');
    const posterSlideshow = document.getElementById('posterSlideshow');
    
    const modal = document.getElementById('posterModal');
    const modalFrame = document.getElementById('modalFrame');
    const modalClose = document.getElementById('modalClose');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalPrev = document.getElementById('modalPrev');
    const modalNext = document.getElementById('modalNext');
    const modalIndicator = document.getElementById('modalIndicator');
    
    let currentModalSlide = 1;
    
    // Update slideshow poster
    function updateSlide(slideNumber) {
        currentSlide = slideNumber;
        posterFrame.src = `./posters/compact-${slideNumber}.html`;
        
        // Update dot indicators
        dotIndicators.forEach((dot, index) => {
            if (index + 1 === slideNumber) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    // Auto advance slideshow
    function startSlideshow() {
        slideshowInterval = setInterval(() => {
            currentSlide = currentSlide >= totalSlides ? 1 : currentSlide + 1;
            updateSlide(currentSlide);
        }, 4000); // Change slide every 4 seconds
    }
    
    // Stop slideshow
    function stopSlideshow() {
        if (slideshowInterval) {
            clearInterval(slideshowInterval);
        }
    }
    
    // Dot indicators click
    dotIndicators.forEach((dot, index) => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            stopSlideshow();
            updateSlide(index + 1);
            // Restart slideshow after 8 seconds of inactivity
            setTimeout(startSlideshow, 8000);
        });
    });
    
    // Click on slideshow to open modal
    if (posterSlideshow) {
        posterSlideshow.addEventListener('click', () => {
            openModal(currentSlide);
        });
        posterSlideshow.style.cursor = 'pointer';
    }
    
    // Open modal
    function openModal(slideNumber) {
        currentModalSlide = slideNumber;
        updateModalSlide(slideNumber);
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        stopSlideshow(); // Pause slideshow when modal is open
    }
    
    // Close modal
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        startSlideshow(); // Resume slideshow when modal closes
    }
    
    // Update modal poster
    function updateModalSlide(slideNumber) {
        currentModalSlide = slideNumber;
        modalFrame.src = `./posters/${slideNumber}.html`;
        modalIndicator.textContent = `${slideNumber} / ${totalSlides}`;
    }
    
    // Modal navigation
    modalPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentModalSlide > 1) {
            updateModalSlide(currentModalSlide - 1);
        }
    });
    
    modalNext.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentModalSlide < totalSlides) {
            updateModalSlide(currentModalSlide + 1);
        }
    });
    
    // Close modal handlers
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    
    // Keyboard navigation in modal
    document.addEventListener('keydown', (e) => {
        if (modal.style.display === 'flex') {
            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'ArrowLeft') {
                if (currentModalSlide > 1) {
                    updateModalSlide(currentModalSlide - 1);
                }
            } else if (e.key === 'ArrowRight') {
                if (currentModalSlide < totalSlides) {
                    updateModalSlide(currentModalSlide + 1);
                }
            }
        }
    });
    
    // Start the slideshow
    startSlideshow();
    
    // Pause slideshow when user hovers over it
    posterSlideshow.addEventListener('mouseenter', stopSlideshow);
    posterSlideshow.addEventListener('mouseleave', startSlideshow);
})();
