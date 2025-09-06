#!/usr/bin/env node

/**
 * Integration Test Runner
 * 
 * This is the main test runner that orchestrates all integration tests:
 * - Lighthouse performance audit
 * - Cross-browser compatibility tests
 * - GitHub Pages deployment verification
 * - Custom domain HTTPS verification
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import test modules
const { runLighthouseAudit } = require('./lighthouse-test.js');
const { runBrowserTests } = require('./browser-test.js');
const { runDeploymentTests } = require('./deployment-test.js');

// Configuration
const CONFIG = {
  outputDir: './integration-test-reports',
  runLocal: true,
  runDeployment: true
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * Check if local server is running
 */
function checkLocalServer() {
  try {
    execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:8000', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Start local server if needed
 */
function startLocalServer() {
  console.log('🚀 Starting local development server...');
  
  try {
    // Check if we can start the server
    const serverProcess = execSync('npm run serve > /dev/null 2>&1 &', { stdio: 'pipe' });
    
    // Wait a moment for server to start
    setTimeout(() => {
      if (checkLocalServer()) {
        console.log('✅ Local server started successfully');
        return true;
      } else {
        console.log('❌ Failed to start local server');
        return false;
      }
    }, 2000);
    
  } catch (error) {
    console.log('❌ Failed to start local server:', error.message);
    return false;
  }
}

/**
 * Install required dependencies
 */
async function installDependencies() {
  console.log('📦 Installing test dependencies...\n');
  
  const dependencies = [
    'lighthouse',
    '@playwright/test'
  ];
  
  for (const dep of dependencies) {
    try {
      console.log(`Installing ${dep}...`);
      execSync(`npm install --save-dev ${dep}`, { stdio: 'inherit' });
      console.log(`✅ ${dep} installed\n`);
    } catch (error) {
      console.log(`⚠️  Failed to install ${dep}, trying to continue...\n`);
    }
  }
}

/**
 * Generate comprehensive test report
 */
function generateComprehensiveReport(results) {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    testSuite: 'Integration Tests - 闘魂Elixir Landing Page',
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    },
    results,
    summary: {
      totalTestSuites: Object.keys(results).length,
      passed: Object.values(results).filter(r => r.status === 'PASSED').length,
      failed: Object.values(results).filter(r => r.status === 'FAILED').length,
      skipped: Object.values(results).filter(r => r.status === 'SKIPPED').length
    },
    requirements: {
      '2.1': 'GitHub Actions自動デプロイ',
      '2.2': 'カスタムドメインHTTPS接続',
      '5.1': '3秒以内のファーストビュー表示'
    }
  };
  
  // Calculate overall score
  const totalTests = report.summary.totalTestSuites;
  const passedTests = report.summary.passed;
  report.summary.overallScore = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  
  const reportPath = path.join(CONFIG.outputDir, `integration-test-report-${timestamp.replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate HTML report
  const htmlReport = generateHTMLReport(report);
  const htmlPath = path.join(CONFIG.outputDir, `integration-test-report-${timestamp.replace(/[:.]/g, '-')}.html`);
  fs.writeFileSync(htmlPath, htmlReport);
  
  console.log(`📄 Comprehensive report saved to: ${reportPath}`);
  console.log(`🌐 HTML report saved to: ${htmlPath}`);
  
  return report;
}

/**
 * Generate HTML report
 */
function generateHTMLReport(report) {
  const statusIcon = (status) => {
    switch (status) {
      case 'PASSED': return '✅';
      case 'FAILED': return '❌';
      case 'SKIPPED': return '⏭️';
      default: return '❓';
    }
  };
  
  const statusColor = (status) => {
    switch (status) {
      case 'PASSED': return '#22c55e';
      case 'FAILED': return '#ef4444';
      case 'SKIPPED': return '#f59e0b';
      default: return '#6b7280';
    }
  };
  
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Integration Test Report - 闘魂Elixir</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f8fafc;
        }
        .header {
            background: linear-gradient(135deg, #ff5b2e, #ffd166);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            font-size: 2em;
            font-weight: bold;
        }
        .results {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .result-item {
            padding: 20px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .result-item:last-child {
            border-bottom: none;
        }
        .result-info {
            flex: 1;
        }
        .result-status {
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: bold;
            color: white;
        }
        .requirements {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-top: 30px;
        }
        .timestamp {
            text-align: center;
            color: #6b7280;
            margin-top: 30px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔥 Integration Test Report</h1>
        <h2>闘魂Elixir Landing Page</h2>
        <p>Overall Score: ${report.summary.overallScore}%</p>
    </div>
    
    <div class="summary">
        <div class="summary-card">
            <h3 style="color: #22c55e">${report.summary.passed}</h3>
            <p>Tests Passed</p>
        </div>
        <div class="summary-card">
            <h3 style="color: #ef4444">${report.summary.failed}</h3>
            <p>Tests Failed</p>
        </div>
        <div class="summary-card">
            <h3 style="color: #f59e0b">${report.summary.skipped}</h3>
            <p>Tests Skipped</p>
        </div>
        <div class="summary-card">
            <h3>${report.summary.totalTestSuites}</h3>
            <p>Total Test Suites</p>
        </div>
    </div>
    
    <div class="results">
        <h2 style="padding: 20px; margin: 0; background: #f8fafc; border-bottom: 1px solid #e5e7eb;">Test Results</h2>
        ${Object.entries(report.results).map(([test, result]) => `
            <div class="result-item">
                <div class="result-info">
                    <h3>${statusIcon(result.status)} ${test}</h3>
                    <p>${result.description}</p>
                    ${result.error ? `<p style="color: #ef4444; font-size: 0.9em;">Error: ${result.error}</p>` : ''}
                    ${result.details ? `<p style="color: #6b7280; font-size: 0.9em;">${result.details}</p>` : ''}
                </div>
                <div class="result-status" style="background-color: ${statusColor(result.status)}">
                    ${result.status}
                </div>
            </div>
        `).join('')}
    </div>
    
    <div class="requirements">
        <h2>Requirements Coverage</h2>
        <ul>
            ${Object.entries(report.requirements).map(([req, desc]) => `
                <li><strong>${req}:</strong> ${desc}</li>
            `).join('')}
        </ul>
    </div>
    
    <div class="timestamp">
        Generated on ${new Date(report.timestamp).toLocaleString('ja-JP')}
    </div>
</body>
</html>
  `;
}

/**
 * Main integration test runner
 */
async function runIntegrationTests() {
  console.log('🧪 Starting Integration Test Suite for 闘魂Elixir Landing Page\n');
  console.log('================================================================\n');
  
  const results = {};
  
  // Install dependencies first
  await installDependencies();
  
  // Test 1: Lighthouse Performance Audit (Local)
  if (CONFIG.runLocal) {
    console.log('1️⃣  LIGHTHOUSE PERFORMANCE AUDIT');
    console.log('=================================\n');
    
    if (!checkLocalServer()) {
      console.log('⚠️  Local server not running. Please start it with: npm run serve');
      console.log('   Skipping local tests...\n');
      
      results.lighthouseAudit = {
        status: 'SKIPPED',
        description: 'Lighthouse performance audit',
        error: 'Local server not accessible'
      };
    } else {
      try {
        const lighthouseResult = await runLighthouseAudit();
        results.lighthouseAudit = {
          status: lighthouseResult ? 'PASSED' : 'FAILED',
          description: 'Lighthouse performance audit',
          details: 'Performance, accessibility, SEO, and best practices validation'
        };
      } catch (error) {
        results.lighthouseAudit = {
          status: 'FAILED',
          description: 'Lighthouse performance audit',
          error: error.message
        };
      }
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 2: Cross-Browser Compatibility (Local)
    console.log('2️⃣  CROSS-BROWSER COMPATIBILITY TESTS');
    console.log('====================================\n');
    
    if (!checkLocalServer()) {
      results.browserTests = {
        status: 'SKIPPED',
        description: 'Cross-browser compatibility tests',
        error: 'Local server not accessible'
      };
    } else {
      try {
        const browserResult = await runBrowserTests();
        results.browserTests = {
          status: browserResult ? 'PASSED' : 'FAILED',
          description: 'Cross-browser compatibility tests',
          details: 'Responsive design, animations, and accessibility across browsers'
        };
      } catch (error) {
        results.browserTests = {
          status: 'FAILED',
          description: 'Cross-browser compatibility tests',
          error: error.message
        };
      }
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }
  
  // Test 3: GitHub Pages Deployment Verification
  if (CONFIG.runDeployment) {
    console.log('3️⃣  GITHUB PAGES DEPLOYMENT VERIFICATION');
    console.log('=======================================\n');
    
    try {
      const deploymentResult = await runDeploymentTests();
      results.deploymentVerification = {
        status: deploymentResult ? 'PASSED' : 'FAILED',
        description: 'GitHub Pages deployment verification',
        details: 'GitHub Actions, custom domain, HTTPS, and SEO validation'
      };
    } catch (error) {
      results.deploymentVerification = {
        status: 'FAILED',
        description: 'GitHub Pages deployment verification',
        error: error.message
      };
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }
  
  // Generate comprehensive report
  console.log('📊 GENERATING COMPREHENSIVE REPORT');
  console.log('=================================\n');
  
  const report = generateComprehensiveReport(results);
  
  // Display final summary
  console.log('🎯 FINAL INTEGRATION TEST SUMMARY');
  console.log('=================================');
  console.log(`Overall Score: ${report.summary.overallScore}%`);
  console.log(`Tests Passed: ${report.summary.passed}/${report.summary.totalTestSuites}`);
  console.log(`Tests Failed: ${report.summary.failed}/${report.summary.totalTestSuites}`);
  console.log(`Tests Skipped: ${report.summary.skipped}/${report.summary.totalTestSuites}\n`);
  
  // Requirements verification
  console.log('📋 Requirements Verification:');
  console.log('============================');
  Object.entries(report.requirements).forEach(([req, desc]) => {
    console.log(`${req}: ${desc}`);
  });
  
  console.log('\n🎉 Integration testing complete!\n');
  
  // Return overall success
  return report.summary.failed === 0;
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runIntegrationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Integration test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runIntegrationTests, CONFIG };