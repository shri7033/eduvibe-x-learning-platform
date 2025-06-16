// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    initApp();
});

// Main initialization function
function initApp() {
    // Handle splash screen
    handleSplashScreen();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize scroll animations
    initScrollAnimations();
    
    // Initialize navigation effects
    initNavigationEffects();
}

// Handle splash screen animation and transition
function handleSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');
    
    // Show splash screen for 2 seconds then fade out
    setTimeout(() => {
        splashScreen.classList.add('fade-out');
        mainContent.classList.remove('hidden');
        mainContent.classList.add('animate-fade-in');
        
        // Remove splash screen from DOM after animation
        setTimeout(() => {
            splashScreen.remove();
        }, 500);
    }, 2000);
}

// Mobile menu functionality
function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.md\\:hidden');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenuBtn = mobileMenu.querySelector('.fa-times').parentElement;
    
    let isMenuOpen = false;
    
    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        
        if (isMenuOpen) {
            mobileMenu.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        } else {
            mobileMenu.classList.add('closing');
            document.body.style.overflow = '';
            
            setTimeout(() => {
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('closing');
            }, 300);
        }
    }
    
    mobileMenuBtn.addEventListener('click', toggleMenu);
    closeMenuBtn.addEventListener('click', toggleMenu);
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (isMenuOpen && !mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            toggleMenu();
        }
    });
}

// Initialize scroll animations
function initScrollAnimations() {
    const scrollElements = document.querySelectorAll('.scroll-fade');
    
    function handleScrollAnimation() {
        scrollElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('visible');
            }
        });
    }
    
    // Add initial check
    handleScrollAnimation();
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScrollAnimation);
}

// Initialize navigation effects
function initNavigationEffects() {
    const nav = document.querySelector('nav');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Add/remove background when scrolling
        if (currentScroll > 50) {
            nav.classList.add('glass-effect');
        } else {
            nav.classList.remove('glass-effect');
        }
        
        // Hide/show nav based on scroll direction
        if (currentScroll > lastScroll && currentScroll > 500) {
            nav.style.transform = 'translateY(-100%)';
        } else {
            nav.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll;
    });
}

// Form validation helper
function validateForm(formElement) {
    const inputs = formElement.querySelectorAll('input[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            showError(input, 'This field is required');
        } else {
            clearError(input);
        }
    });
    
    return isValid;
}

// Show error message
function showError(inputElement, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message text-red-500 text-sm mt-1';
    errorDiv.textContent = message;
    
    // Remove any existing error message
    clearError(inputElement);
    
    // Add new error message
    inputElement.parentElement.appendChild(errorDiv);
    inputElement.classList.add('border-red-500');
}

// Clear error message
function clearError(inputElement) {
    const existingError = inputElement.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    inputElement.classList.remove('border-red-500');
}

// Handle loading states
function setLoading(element, isLoading) {
    if (isLoading) {
        element.classList.add('loading');
        element.disabled = true;
    } else {
        element.classList.remove('loading');
        element.disabled = false;
    }
}

// Utility function to animate numbers
function animateNumber(element, start, end, duration) {
    let current = start;
    const range = end - start;
    const increment = range / (duration / 16);
    const timer = setInterval(() => {
        current += increment;
        element.textContent = Math.round(current).toLocaleString();
        
        if (current >= end) {
            element.textContent = end.toLocaleString();
            clearInterval(timer);
        }
    }, 16);
}

// Initialize number animations when elements come into view
function initNumberAnimations() {
    const numbers = document.querySelectorAll('.stats-counter');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const end = parseInt(element.dataset.value);
                animateNumber(element, 0, end, 2000);
                observer.unobserve(element);
            }
        });
    });
    
    numbers.forEach(number => observer.observe(number));
}

// Call number animations initialization
initNumberAnimations();
