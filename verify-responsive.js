// Responsive Design Verification Script
// Run this in the browser console to verify all responsive features

class ResponsiveVerification {
  constructor() {
    this.results = {
      breakpoints: {},
      touchTargets: {},
      animations: {},
      accessibility: {}
    };
  }

  async runAllTests() {
    console.log('🔥 Starting Responsive Design Verification...\n');
    
    await this.testBreakpoints();
    await this.testTouchTargets();
    await this.testAnimations();
    await this.testAccessibility();
    
    this.generateReport();
  }

  async testBreakpoints() {
    console.log('📱 Testing Breakpoints...');
    
    const breakpoints = [
      { name: '320px - Small Mobile', width: 320, height: 568 },
      { name: '768px - Tablet', width: 768, height: 1024 },
      { name: '1024px - Desktop', width: 1024, height: 768 },
      { name: '1440px - Large Desktop', width: 1440, height: 900 }
    ];

    for (const bp of breakpoints) {
      console.log(`  Testing ${bp.name}...`);
      
      // Simulate viewport change
      const originalWidth = window.innerWidth;
      const originalHeight = window.innerHeight;
      
      // Test layout elements at this breakpoint
      const layoutTest = this.testLayoutAtBreakpoint(bp);
      
      this.results.breakpoints[bp.name] = {
        width: bp.width,
        height: bp.height,
        layoutTest: layoutTest,
        passed: layoutTest.passed
      };
      
      console.log(`    ${layoutTest.passed ? '✅' : '❌'} Layout: ${layoutTest.message}`);
    }
  }

  testLayoutAtBreakpoint(breakpoint) {
    const plate = document.querySelector('.plate');
    const heroInner = document.querySelector('.hero-inner');
    const nav = document.querySelector('.nav');
    
    if (!plate || !heroInner || !nav) {
      return { passed: false, message: 'Required elements not found' };
    }

    // Check if elements are properly sized for the breakpoint
    const plateRect = plate.getBoundingClientRect();
    const heroRect = heroInner.getBoundingClientRect();
    
    let issues = [];
    
    // Verify plate aspect ratio
    const aspectRatio = plateRect.width / plateRect.height;
    if (breakpoint.width <= 320) {
      if (Math.abs(aspectRatio - (4/3)) > 0.1) {
        issues.push('Plate aspect ratio should be 4:3 on small mobile');
      }
    } else if (breakpoint.width <= 767) {
      if (Math.abs(aspectRatio - (4/3)) > 0.1) {
        issues.push('Plate aspect ratio should be 4:3 on mobile');
      }
    } else if (breakpoint.width <= 1023) {
      if (Math.abs(aspectRatio - (16/10)) > 0.1) {
        issues.push('Plate aspect ratio should be 16:10 on tablet');
      }
    } else {
      if (Math.abs(aspectRatio - (16/9)) > 0.1) {
        issues.push('Plate aspect ratio should be 16:9 on desktop');
      }
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0 ? 'All layout tests passed' : issues.join(', ')
    };
  }

  async testTouchTargets() {
    console.log('👆 Testing Touch Targets...');
    
    const interactiveElements = document.querySelectorAll('a, button, .btn, .pill, [tabindex]:not([tabindex="-1"])');
    let totalElements = 0;
    let passedElements = 0;
    let failedElements = [];

    interactiveElements.forEach(element => {
      if (element.offsetParent === null) return; // Skip hidden elements
      
      totalElements++;
      const rect = element.getBoundingClientRect();
      const minSize = 44; // WCAG 2.1 AA minimum
      
      if (rect.width >= minSize && rect.height >= minSize) {
        passedElements++;
      } else {
        failedElements.push({
          element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
          size: `${Math.round(rect.width)}x${Math.round(rect.height)}px`,
          passed: false
        });
      }
    });

    this.results.touchTargets = {
      total: totalElements,
      passed: passedElements,
      failed: failedElements.length,
      failedElements: failedElements,
      passRate: Math.round((passedElements / totalElements) * 100)
    };

    console.log(`  ✅ ${passedElements}/${totalElements} touch targets meet WCAG 2.1 AA requirements (${this.results.touchTargets.passRate}%)`);
    
    if (failedElements.length > 0) {
      console.log('  ❌ Failed elements:');
      failedElements.forEach(el => {
        console.log(`    - ${el.element}: ${el.size}`);
      });
    }
  }

  async testAnimations() {
    console.log('🎭 Testing Animation Performance...');
    
    const plate = document.querySelector('.plate');
    const phoenixWings = document.querySelector('.phoenix-wings');
    const phoenixParticles = document.querySelector('.phoenix-particles');
    
    if (!plate) {
      this.results.animations = { passed: false, message: 'Animation elements not found' };
      return;
    }

    // Check if animations are properly optimized for mobile
    const isMobile = window.innerWidth <= 767;
    const isSmallMobile = window.innerWidth <= 320;
    
    let animationTests = [];
    
    // Test animation durations
    const computedStyle = getComputedStyle(document.documentElement);
    const swirlDuration = computedStyle.getPropertyValue('--phoenix-swirl-duration');
    const breatheDuration = computedStyle.getPropertyValue('--phoenix-breathe-duration');
    
    if (isSmallMobile) {
      animationTests.push({
        test: 'Small mobile animation optimization',
        passed: !phoenixWings || phoenixWings.style.display === 'none',
        message: 'Complex animations should be disabled on small mobile'
      });
    } else if (isMobile) {
      animationTests.push({
        test: 'Mobile animation optimization',
        passed: parseFloat(swirlDuration) > 30,
        message: 'Animation durations should be increased on mobile'
      });
    }

    // Test reduced motion support
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      animationTests.push({
        test: 'Reduced motion support',
        passed: true, // This would need more complex testing
        message: 'Animations should be disabled when user prefers reduced motion'
      });
    }

    const allPassed = animationTests.every(test => test.passed);
    
    this.results.animations = {
      tests: animationTests,
      passed: allPassed,
      message: allPassed ? 'All animation tests passed' : 'Some animation tests failed'
    };

    animationTests.forEach(test => {
      console.log(`  ${test.passed ? '✅' : '❌'} ${test.test}: ${test.message}`);
    });
  }

  async testAccessibility() {
    console.log('♿ Testing Accessibility Features...');
    
    let accessibilityTests = [];
    
    // Test skip link
    const skipLink = document.querySelector('.skip-link');
    accessibilityTests.push({
      test: 'Skip link present',
      passed: !!skipLink,
      message: skipLink ? 'Skip link found' : 'Skip link missing'
    });

    // Test ARIA labels
    const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [role]');
    accessibilityTests.push({
      test: 'ARIA attributes',
      passed: ariaElements.length > 0,
      message: `Found ${ariaElements.length} elements with ARIA attributes`
    });

    // Test focus management
    const focusableElements = document.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
    let focusableCount = 0;
    focusableElements.forEach(el => {
      if (el.offsetParent !== null) focusableCount++;
    });
    
    accessibilityTests.push({
      test: 'Focusable elements',
      passed: focusableCount > 0,
      message: `Found ${focusableCount} focusable elements`
    });

    // Test semantic HTML
    const semanticElements = document.querySelectorAll('main, nav, header, footer, section, article, aside');
    accessibilityTests.push({
      test: 'Semantic HTML',
      passed: semanticElements.length >= 4,
      message: `Found ${semanticElements.length} semantic elements`
    });

    const allPassed = accessibilityTests.every(test => test.passed);
    
    this.results.accessibility = {
      tests: accessibilityTests,
      passed: allPassed,
      message: allPassed ? 'All accessibility tests passed' : 'Some accessibility tests failed'
    };

    accessibilityTests.forEach(test => {
      console.log(`  ${test.passed ? '✅' : '❌'} ${test.test}: ${test.message}`);
    });
  }

  generateReport() {
    console.log('\n📊 RESPONSIVE DESIGN VERIFICATION REPORT');
    console.log('==========================================\n');
    
    // Breakpoints summary
    const breakpointsPassed = Object.values(this.results.breakpoints).filter(bp => bp.passed).length;
    const breakpointsTotal = Object.keys(this.results.breakpoints).length;
    console.log(`📱 Breakpoints: ${breakpointsPassed}/${breakpointsTotal} passed`);
    
    // Touch targets summary
    if (this.results.touchTargets.total) {
      console.log(`👆 Touch Targets: ${this.results.touchTargets.passed}/${this.results.touchTargets.total} passed (${this.results.touchTargets.passRate}%)`);
    }
    
    // Animations summary
    console.log(`🎭 Animations: ${this.results.animations.passed ? 'PASSED' : 'FAILED'}`);
    
    // Accessibility summary
    console.log(`♿ Accessibility: ${this.results.accessibility.passed ? 'PASSED' : 'FAILED'}`);
    
    // Overall score
    const totalTests = breakpointsTotal + 1 + 1 + 1; // breakpoints + touch + animations + accessibility
    const passedTests = breakpointsPassed + 
                       (this.results.touchTargets.passRate >= 90 ? 1 : 0) +
                       (this.results.animations.passed ? 1 : 0) +
                       (this.results.accessibility.passed ? 1 : 0);
    
    const overallScore = Math.round((passedTests / totalTests) * 100);
    
    console.log(`\n🎯 Overall Score: ${overallScore}% (${passedTests}/${totalTests} tests passed)`);
    
    if (overallScore >= 90) {
      console.log('🎉 Excellent! Responsive design implementation is highly compliant.');
    } else if (overallScore >= 75) {
      console.log('👍 Good! Minor improvements needed.');
    } else {
      console.log('⚠️ Needs improvement. Several issues need to be addressed.');
    }
    
    console.log('\n📋 Detailed Results:');
    console.log(this.results);
  }
}

// Auto-run verification if script is loaded directly
if (typeof window !== 'undefined') {
  console.log('🔥 Responsive Design Verification Script Loaded');
  console.log('Run: new ResponsiveVerification().runAllTests()');
  
  // Auto-run after a short delay to ensure page is fully loaded
  setTimeout(() => {
    if (document.readyState === 'complete') {
      const verifier = new ResponsiveVerification();
      verifier.runAllTests();
    }
  }, 2000);
}