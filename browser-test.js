#!/usr/bin/env node

/**
 * Cross-Browser Compatibility Test Script
 * 
 * This script tests the site across different browsers and viewports to verify:
 * - Responsive design functionality
 * - Cross-browser compatibility
 * - Animation performance
 * - Accessibility features
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  url: 'http://localhost:8000',
  outputDir: './browser-test-reports',
  viewports: [
    { name: 'Mobile', width: 320, height: 568 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1024, height: 768 },
    { name: 'Large Desktop', width: 1440, height: 900 }
  ],
  browsers: ['chromium', 'firefox', 'webkit']
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * Generate Playwright test script
 */
function generatePlaywrightTest() {
  const testScript = `
const { test, expect, devices } = require('@playwright/test');

// Test configuration
const URL = '${CONFIG.url}';
const VIEWPORTS = ${JSON.stringify(CONFIG.viewports, null, 2)};

// Test responsive design across viewports
VIEWPORTS.forEach(viewport => {
  test(\`Responsive design - \${viewport.name} (\${viewport.width}x\${viewport.height})\`, async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    
    // Navigate to page
    await page.goto(URL);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if page loads without errors
    const title = await page.title();
    expect(title).toContain('闘魂Elixir');
    
    // Check if hero image loads
    const heroImage = page.locator('.hero-image');
    await expect(heroImage).toBeVisible();
    
    // Check if navigation is accessible
    const nav = page.locator('nav[role="navigation"]');
    await expect(nav).toBeVisible();
    
    // Check if main content is visible
    const mainContent = page.locator('main[role="main"]');
    await expect(mainContent).toBeVisible();
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement.tagName);
    expect(['A', 'BUTTON', 'INPUT'].includes(focusedElement)).toBeTruthy();
    
    // Take screenshot
    await page.screenshot({ 
      path: \`${CONFIG.outputDir}/\${viewport.name.toLowerCase().replace(' ', '-')}-screenshot.png\`,
      fullPage: true 
    });
    
    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Reload to catch any console errors
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Report console errors
    if (errors.length > 0) {
      console.warn(\`Console errors on \${viewport.name}:\`, errors);
    }
  });
});

// Test animations and interactions
test('Animation and interaction tests', async ({ page }) => {
  await page.goto(URL);
  await page.waitForLoadState('networkidle');
  
  // Check if CSS animations are working
  const heroImage = page.locator('.hero-picture');
  await expect(heroImage).toBeVisible();
  
  // Test reduced motion preference
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  // Verify animations are disabled with reduced motion
  const animationDuration = await page.evaluate(() => {
    const element = document.querySelector('.hero-picture');
    return window.getComputedStyle(element).animationDuration;
  });
  
  // Should be 0s or very short when reduced motion is enabled
  expect(animationDuration === '0s' || parseFloat(animationDuration) < 0.1).toBeTruthy();
});

// Test accessibility features
test('Accessibility compliance', async ({ page }) => {
  await page.goto(URL);
  await page.waitForLoadState('networkidle');
  
  // Check for skip link
  const skipLink = page.locator('.skip-link');
  await expect(skipLink).toBeInViewport({ ratio: 0 }); // May be visually hidden
  
  // Test focus management
  await page.keyboard.press('Tab');
  const focusedElement = await page.locator(':focus');
  await expect(focusedElement).toBeVisible();
  
  // Check ARIA labels
  const ariaElements = await page.locator('[aria-label]').count();
  expect(ariaElements).toBeGreaterThan(0);
  
  // Check semantic HTML
  const main = page.locator('main[role="main"]');
  await expect(main).toBeVisible();
  
  const nav = page.locator('nav[role="navigation"]');
  await expect(nav).toBeVisible();
  
  // Check heading hierarchy
  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBe(1);
});

// Test performance
test('Performance metrics', async ({ page }) => {
  await page.goto(URL);
  
  // Measure page load time
  const startTime = Date.now();
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;
  
  // Should load within 3 seconds (requirement 5.1)
  expect(loadTime).toBeLessThan(3000);
  
  // Check if images are optimized
  const images = await page.locator('img').all();
  for (const img of images) {
    const src = await img.getAttribute('src');
    const naturalWidth = await img.evaluate(el => el.naturalWidth);
    const naturalHeight = await img.evaluate(el => el.naturalHeight);
    
    // Images should have reasonable dimensions
    expect(naturalWidth).toBeGreaterThan(0);
    expect(naturalHeight).toBeGreaterThan(0);
  }
});

// Test WebP support
test('WebP image support', async ({ page }) => {
  await page.goto(URL);
  await page.waitForLoadState('networkidle');
  
  // Check if WebP images are being used
  const pictureElements = await page.locator('picture').all();
  
  for (const picture of pictureElements) {
    const webpSource = await picture.locator('source[type="image/webp"]').count();
    expect(webpSource).toBeGreaterThan(0);
  }
});
`;

  fs.writeFileSync(path.join(CONFIG.outputDir, 'browser-tests.spec.js'), testScript);
}

/**
 * Run browser compatibility tests
 */
async function runBrowserTests() {
  console.log('🌐 Starting Cross-Browser Compatibility Tests...\n');
  
  try {
    // Check if local server is running
    console.log('📡 Checking if local server is running...');
    try {
      execSync(`curl -s -o /dev/null -w "%{http_code}" ${CONFIG.url}`, { stdio: 'pipe' });
      console.log('✅ Local server is accessible\n');
    } catch (error) {
      console.log('❌ Local server not accessible. Please run: npm run serve');
      console.log('   Then run this script again.\n');
      process.exit(1);
    }

    // Generate Playwright test file
    console.log('📝 Generating browser test suite...');
    generatePlaywrightTest();
    console.log('✅ Test suite generated\n');

    // Install Playwright if not already installed
    console.log('🔧 Installing Playwright browsers...');
    try {
      execSync('npx playwright install', { stdio: 'inherit' });
      console.log('✅ Playwright browsers installed\n');
    } catch (error) {
      console.log('⚠️  Playwright installation failed. Trying to continue...\n');
    }

    // Run tests for each browser
    const results = {};
    
    for (const browser of CONFIG.browsers) {
      console.log(`🧪 Testing with ${browser}...`);
      
      try {
        const testCmd = `npx playwright test ${path.join(CONFIG.outputDir, 'browser-tests.spec.js')} --project=${browser} --reporter=line`;
        execSync(testCmd, { stdio: 'inherit' });
        results[browser] = 'PASSED';
        console.log(`✅ ${browser} tests passed\n`);
      } catch (error) {
        results[browser] = 'FAILED';
        console.log(`❌ ${browser} tests failed\n`);
      }
    }

    // Generate summary report
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      url: CONFIG.url,
      results,
      viewports: CONFIG.viewports
    };
    
    fs.writeFileSync(
      path.join(CONFIG.outputDir, 'browser-test-summary.json'),
      JSON.stringify(report, null, 2)
    );

    // Display results
    console.log('📊 Browser Test Results:');
    console.log('========================');
    
    Object.entries(results).forEach(([browser, status]) => {
      const icon = status === 'PASSED' ? '✅' : '❌';
      console.log(`${icon} ${browser}: ${status}`);
    });
    
    console.log(`\n📄 Screenshots saved to: ${CONFIG.outputDir}/`);
    console.log(`📊 Summary report: ${CONFIG.outputDir}/browser-test-summary.json\n`);
    
    // Check if all tests passed
    const allPassed = Object.values(results).every(status => status === 'PASSED');
    
    if (allPassed) {
      console.log('🎉 All browser tests passed!');
      return true;
    } else {
      console.log('⚠️  Some browser tests failed. Check the detailed output above.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Browser testing failed:', error.message);
    return false;
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runBrowserTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { runBrowserTests, CONFIG };