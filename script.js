// Enhanced image fallback handling with retry mechanism and accessibility
function handleImageError(img) {
  // Check if this is the first error attempt
  if (!img.dataset.retryAttempted) {
    img.dataset.retryAttempted = 'true';
    
    // Try PNG fallback if WebP failed
    if (img.src.includes('hero.webp')) {
      img.src = 'assets/hero.png';
      return;
    }
    
    // Try root level images if assets folder failed
    if (img.src.includes('assets/')) {
      const filename = img.src.split('/').pop();
      img.src = filename;
      return;
    }
  }
  
  // All retries failed, show SVG fallback
  img.style.display = 'none';
  const picture = img.closest('.hero-picture');
  if (picture) {
    picture.style.display = 'none';
  }
  
  // Show the SVG fallback with proper accessibility attributes
  const fallback = img.closest('.plate').querySelector('.hero-fallback');
  if (fallback) {
    fallback.style.display = 'block';
    fallback.setAttribute('aria-label', '画像の読み込みに失敗しました。炎で形作られた火の鳥Phoenixのプレースホルダー画像です。');
    fallback.setAttribute('role', 'img');
    
    // Update the fallback text for screen readers
    const fallbackDesc = fallback.querySelector('#fallback-desc');
    if (fallbackDesc) {
      fallbackDesc.textContent = '画像の読み込みに失敗しました。炎で形作られた火の鳥Phoenixのプレースホルダー画像です。';
    }
  }
  
  // Announce to screen readers
  announceToScreenReader('画像の読み込みに失敗しました。代替画像を表示しています。');
  
  // Log error for debugging (only in development)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.warn('Hero image failed to load after retries, showing SVG fallback');
  }
}

// Handle successful image load with accessibility improvements
function handleImageLoad(img) {
  // Ensure fallback is hidden when image loads successfully
  const fallback = img.closest('.plate').querySelector('.hero-fallback');
  if (fallback) {
    fallback.style.display = 'none';
  }
  
  // Add loaded class for CSS animations and hide loading spinner
  img.classList.add('loaded');
  const picture = img.closest('.hero-picture');
  if (picture) {
    picture.classList.add('loaded');
  }
  
  // Announce successful load to screen readers
  announceToScreenReader('メイン画像が正常に読み込まれました。');
  
  // Log successful load (only in development)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.info('Hero image loaded successfully:', img.src);
  }
}

// Accessibility utility: Announce messages to screen readers
function announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove the announcement after a short delay
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// WebP support detection and progressive enhancement
function checkWebPSupport() {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => resolve(webP.height === 2);
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

// Preload critical images
function preloadCriticalImages() {
  const criticalImages = [
    'assets/hero.webp',
    'assets/hero.png'
  ];
  
  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    
    // Add type for WebP
    if (src.includes('.webp')) {
      link.type = 'image/webp';
    }
    
    document.head.appendChild(link);
  });
}

// Phoenix Animation Enhancement System
class PhoenixAnimationController {
  constructor() {
    this.plate = null;
    this.phoenixWings = null;
    this.phoenixParticles = null;
    this.animationPhase = 0;
    this.performanceMode = 'high'; // high, medium, low
    this.isVisible = false;
  }
  
  init() {
    this.plate = document.querySelector('.plate');
    this.phoenixWings = document.querySelector('.phoenix-wings');
    this.phoenixParticles = document.querySelector('.phoenix-particles');
    
    if (!this.plate) return;
    
    this.detectPerformanceMode();
    this.setupIntersectionObserver();
    this.setupAnimationSequence();
  }
  
  detectPerformanceMode() {
    // Detect device capabilities for performance optimization
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const memory = navigator.deviceMemory || 4; // Default to 4GB if not available
    
    // Check for accessibility preferences first
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    const forcedColors = window.matchMedia('(forced-colors: active)').matches;
    
    // Respect accessibility preferences
    if (prefersReducedMotion || prefersHighContrast || forcedColors) {
      this.performanceMode = 'minimal';
      this.setupAccessibilityListeners();
      return;
    }
    
    // Detect screen size for responsive performance optimization
    const screenWidth = window.innerWidth;
    const isMobile = screenWidth <= 767;
    const isSmallMobile = screenWidth <= 320;
    const isTablet = screenWidth >= 768 && screenWidth <= 1023;
    
    // Performance mode based on device capabilities and screen size
    if (isSmallMobile || memory < 2 || (connection && connection.effectiveType === 'slow-2g')) {
      this.performanceMode = 'minimal';
    } else if (isMobile || memory < 4 || (connection && connection.effectiveType === '3g')) {
      this.performanceMode = 'low';
    } else if (isTablet || memory < 6 || (connection && connection.effectiveType === '4g')) {
      this.performanceMode = 'medium';
    } else {
      this.performanceMode = 'high';
    }
    
    this.applyPerformanceOptimizations();
    this.setupResponsiveListeners();
  }
  
  setupAccessibilityListeners() {
    // Listen for changes in accessibility preferences
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    
    reducedMotionQuery.addEventListener('change', (e) => {
      if (e.matches) {
        this.performanceMode = 'minimal';
        this.pauseAnimations();
        announceToScreenReader('アニメーションが無効になりました。');
      } else {
        this.detectPerformanceMode();
        announceToScreenReader('アニメーションが有効になりました。');
      }
    });
    
    highContrastQuery.addEventListener('change', (e) => {
      if (e.matches) {
        this.performanceMode = 'minimal';
        announceToScreenReader('高コントラストモードが有効になりました。');
      } else {
        this.detectPerformanceMode();
        announceToScreenReader('高コントラストモードが無効になりました。');
      }
    });
  }
  
  applyPerformanceOptimizations() {
    if (!this.plate) return;
    
    const root = document.documentElement;
    const screenWidth = window.innerWidth;
    
    switch (this.performanceMode) {
      case 'minimal':
        // Ultra-lightweight for very small screens or accessibility
        root.style.setProperty('--phoenix-swirl-duration', '45s');
        root.style.setProperty('--phoenix-breathe-duration', '10s');
        root.style.setProperty('--phoenix-wing-duration', '15s');
        root.style.setProperty('--phoenix-particle-duration', '18s');
        root.style.setProperty('--phoenix-float-duration', '8s');
        
        // Disable complex animations on very small screens
        if (screenWidth <= 320) {
          if (this.phoenixWings) this.phoenixWings.style.display = 'none';
          if (this.phoenixParticles) this.phoenixParticles.style.display = 'none';
        }
        break;
        
      case 'low':
        // Mobile-optimized performance
        root.style.setProperty('--phoenix-swirl-duration', '35s');
        root.style.setProperty('--phoenix-breathe-duration', '8s');
        root.style.setProperty('--phoenix-wing-duration', '12s');
        root.style.setProperty('--phoenix-particle-duration', '15s');
        root.style.setProperty('--phoenix-float-duration', '7s');
        break;
        
      case 'medium':
        // Tablet-optimized performance
        root.style.setProperty('--phoenix-swirl-duration', '28s');
        root.style.setProperty('--phoenix-breathe-duration', '6s');
        root.style.setProperty('--phoenix-wing-duration', '10s');
        root.style.setProperty('--phoenix-particle-duration', '13s');
        root.style.setProperty('--phoenix-float-duration', '6.5s');
        break;
        
      case 'high':
      default:
        // Full desktop performance
        root.style.setProperty('--phoenix-swirl-duration', '22s');
        root.style.setProperty('--phoenix-breathe-duration', '5.4s');
        root.style.setProperty('--phoenix-wing-duration', '8s');
        root.style.setProperty('--phoenix-particle-duration', '12s');
        root.style.setProperty('--phoenix-float-duration', '6s');
        break;
    }
  }
  
  setupResponsiveListeners() {
    // Listen for screen size changes and adjust performance accordingly
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const oldMode = this.performanceMode;
        this.detectPerformanceMode();
        
        // Only re-apply if mode changed
        if (oldMode !== this.performanceMode) {
          this.applyPerformanceOptimizations();
          announceToScreenReader(`表示モードが${this.performanceMode}に変更されました。`);
        }
      }, 250);
    });
    
    // Listen for orientation changes on mobile
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.detectPerformanceMode();
        this.applyPerformanceOptimizations();
      }, 100);
    });
  }
  
  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        this.isVisible = entry.isIntersecting;
        if (this.isVisible) {
          this.startPhoenixSequence();
        } else {
          this.pauseAnimations();
        }
      });
    }, { threshold: 0.1 });
    
    observer.observe(this.plate);
  }
  
  setupAnimationSequence() {
    // Enhanced animation sequence with staggered timing
    if (this.performanceMode === 'minimal') return;
    
    // Stagger the animation start times for more organic feel
    setTimeout(() => {
      if (this.phoenixWings) {
        this.phoenixWings.style.animationDelay = '2s';
      }
    }, 100);
    
    setTimeout(() => {
      if (this.phoenixParticles) {
        this.phoenixParticles.style.animationDelay = '4s';
      }
    }, 200);
  }
  
  startPhoenixSequence() {
    if (this.performanceMode === 'minimal') return;
    
    // Resume animations when visible
    if (this.plate) {
      this.plate.style.animationPlayState = 'running';
    }
    if (this.phoenixWings) {
      this.phoenixWings.style.animationPlayState = 'running';
    }
    if (this.phoenixParticles) {
      this.phoenixParticles.style.animationPlayState = 'running';
    }
  }
  
  pauseAnimations() {
    // Pause animations when not visible to save resources
    if (this.plate) {
      this.plate.style.animationPlayState = 'paused';
    }
    if (this.phoenixWings) {
      this.phoenixWings.style.animationPlayState = 'paused';
    }
    if (this.phoenixParticles) {
      this.phoenixParticles.style.animationPlayState = 'paused';
    }
  }
}

// Keyboard navigation and focus management
class AccessibilityManager {
  constructor() {
    this.focusableElements = [];
    this.currentFocusIndex = -1;
  }
  
  init() {
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupSkipLinks();
  }
  
  setupKeyboardNavigation() {
    // Handle keyboard navigation
    document.addEventListener('keydown', (e) => {
      // Handle Escape key to close any open modals or return focus
      if (e.key === 'Escape') {
        this.handleEscapeKey();
      }
      
      // Handle Tab navigation enhancement
      if (e.key === 'Tab') {
        this.handleTabNavigation(e);
      }
      
      // Handle Enter and Space for custom interactive elements
      if (e.key === 'Enter' || e.key === ' ') {
        this.handleActivation(e);
      }
    });
  }
  
  setupFocusManagement() {
    // Track focusable elements
    this.updateFocusableElements();
    
    // Re-scan focusable elements when DOM changes
    const observer = new MutationObserver(() => {
      this.updateFocusableElements();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['tabindex', 'disabled', 'aria-hidden']
    });
  }
  
  updateFocusableElements() {
    const selector = 'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])';
    this.focusableElements = Array.from(document.querySelectorAll(selector))
      .filter(el => !el.disabled && !el.getAttribute('aria-hidden'));
  }
  
  setupSkipLinks() {
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(skipLink.getAttribute('href'));
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          announceToScreenReader('メインコンテンツに移動しました。');
        }
      });
    }
  }
  
  handleEscapeKey() {
    // Return focus to a logical place when Escape is pressed
    const activeElement = document.activeElement;
    if (activeElement && activeElement !== document.body) {
      activeElement.blur();
      announceToScreenReader('フォーカスがリセットされました。');
    }
  }
  
  handleTabNavigation(e) {
    // Enhanced tab navigation with announcements
    const isShiftTab = e.shiftKey;
    const currentIndex = this.focusableElements.indexOf(document.activeElement);
    
    if (currentIndex === 0 && isShiftTab) {
      // First element, going backwards
      announceToScreenReader('ページの最初の要素です。');
    } else if (currentIndex === this.focusableElements.length - 1 && !isShiftTab) {
      // Last element, going forwards
      announceToScreenReader('ページの最後の要素です。');
    }
  }
  
  handleActivation(e) {
    const target = e.target;
    
    // Handle custom interactive elements that might need Enter/Space support
    if (target.classList.contains('pill') || target.classList.contains('btn')) {
      // These are already proper links, but ensure they work with Space
      if (e.key === ' ') {
        e.preventDefault();
        target.click();
      }
    }
  }
}

// Responsive Design Verification System
class ResponsiveDesignVerifier {
  constructor() {
    this.breakpoints = {
      'small-mobile': 320,
      'mobile': 767,
      'tablet': 1023,
      'desktop': 1439,
      'large-desktop': 1440
    };
    this.currentBreakpoint = '';
  }
  
  init() {
    this.detectBreakpoint();
    this.setupBreakpointListeners();
    this.verifyTouchTargets();
    
    // Development mode: Add breakpoint indicator
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      this.addBreakpointIndicator();
    }
  }
  
  detectBreakpoint() {
    const width = window.innerWidth;
    let newBreakpoint = '';
    
    if (width <= 320) {
      newBreakpoint = 'small-mobile';
    } else if (width <= 767) {
      newBreakpoint = 'mobile';
    } else if (width <= 1023) {
      newBreakpoint = 'tablet';
    } else if (width <= 1439) {
      newBreakpoint = 'desktop';
    } else {
      newBreakpoint = 'large-desktop';
    }
    
    if (newBreakpoint !== this.currentBreakpoint) {
      this.currentBreakpoint = newBreakpoint;
      this.onBreakpointChange();
    }
  }
  
  setupBreakpointListeners() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.detectBreakpoint();
        this.verifyTouchTargets();
      }, 100);
    });
  }
  
  onBreakpointChange() {
    // Log breakpoint changes in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.info(`Breakpoint changed to: ${this.currentBreakpoint} (${window.innerWidth}px)`);
    }
    
    // Update breakpoint indicator
    this.updateBreakpointIndicator();
    
    // Announce to screen readers
    announceToScreenReader(`画面サイズが${this.currentBreakpoint}に変更されました。`);
  }
  
  verifyTouchTargets() {
    if (window.innerWidth > 767) return; // Only verify on mobile/tablet
    
    const interactiveElements = document.querySelectorAll('a, button, .btn, .pill, [tabindex]:not([tabindex="-1"])');
    let failedElements = 0;
    
    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const minSize = window.innerWidth <= 320 ? 44 : 44; // WCAG minimum
      
      if (rect.width < minSize || rect.height < minSize) {
        failedElements++;
        
        // Development mode: Log failed elements
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.warn(`Touch target too small: ${element.tagName}${element.className ? '.' + element.className : ''} (${Math.round(rect.width)}x${Math.round(rect.height)}px)`);
        }
      }
    });
    
    // Development mode: Log summary
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      if (failedElements === 0) {
        console.info('✅ All touch targets meet WCAG 2.1 AA requirements');
      } else {
        console.warn(`⚠️ ${failedElements} touch targets are too small`);
      }
    }
  }
  
  addBreakpointIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'breakpoint-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      z-index: 9999;
      pointer-events: none;
      opacity: 0.7;
    `;
    document.body.appendChild(indicator);
    this.updateBreakpointIndicator();
  }
  
  updateBreakpointIndicator() {
    const indicator = document.getElementById('breakpoint-indicator');
    if (indicator) {
      indicator.textContent = `${this.currentBreakpoint}: ${window.innerWidth}px`;
    }
  }
}

// Initialize image handling with enhanced error recovery and accessibility
document.addEventListener('DOMContentLoaded', async () => {
  // Set year
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  const heroImage = document.querySelector('.hero-image');
  const heroPicture = document.querySelector('.hero-picture');
  
  if (heroImage && heroPicture) {
    // Check WebP support
    const supportsWebP = await checkWebPSupport();
    
    // If WebP is not supported, modify the picture element to skip WebP
    if (!supportsWebP) {
      const webpSource = heroPicture.querySelector('source[type="image/webp"]');
      if (webpSource) {
        webpSource.remove();
      }
      console.info('WebP not supported, using PNG fallback');
    }
    
    // Enhanced error and load handling with performance monitoring
    const imageLoadStart = performance.now();
    
    heroImage.addEventListener('error', () => handleImageError(heroImage));
    heroImage.addEventListener('load', () => {
      handleImageLoad(heroImage);
      
      // Performance monitoring (development only)
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const loadTime = performance.now() - imageLoadStart;
        console.info(`Hero image loaded in ${loadTime.toFixed(2)}ms`);
      }
    });
  }
  
  // Initialize accessibility manager
  const accessibilityManager = new AccessibilityManager();
  accessibilityManager.init();
  
  // Initialize Phoenix animation controller
  const phoenixController = new PhoenixAnimationController();
  phoenixController.init();
  
  // Initialize responsive design verifier
  const responsiveVerifier = new ResponsiveDesignVerifier();
  responsiveVerifier.init();
  
  // Announce page load completion to screen readers
  setTimeout(() => {
    announceToScreenReader('闘魂Elixirのページが読み込まれました。');
  }, 1000);
});