#!/usr/bin/env node

/**
 * GitHub Pages Deployment Verification Script
 * 
 * This script verifies:
 * - GitHub Actions workflow functionality
 * - Custom domain HTTPS configuration
 * - Deployment status and accessibility
 * - SEO and metadata validation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  domain: 'www.autoracex.dev',
  githubRepo: 'autoracex/toukon_elixir',
  outputDir: './deployment-test-reports'
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * Check HTTPS connectivity
 */
function checkHTTPS(domain) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: domain,
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          certificate: res.connection.getPeerCertificate()
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Verify GitHub Actions workflow
 */
async function verifyGitHubActions() {
  console.log('🔧 Verifying GitHub Actions workflow...\n');
  
  try {
    // Check if workflow file exists
    const workflowPath = '.github/workflows/deploy.yml';
    if (!fs.existsSync(workflowPath)) {
      console.log('❌ GitHub Actions workflow file not found');
      return false;
    }
    
    console.log('✅ GitHub Actions workflow file exists');
    
    // Read and validate workflow content
    const workflowContent = fs.readFileSync(workflowPath, 'utf8');
    
    // Check for essential workflow components
    const requiredComponents = [
      'name:',
      'on:',
      'push:',
      'jobs:',
      'runs-on:',
      'actions/checkout',
      'actions/setup-node',
      'npm run build',
      'actions/deploy-pages'
    ];
    
    const missingComponents = requiredComponents.filter(component => 
      !workflowContent.includes(component)
    );
    
    if (missingComponents.length > 0) {
      console.log('❌ Missing workflow components:', missingComponents.join(', '));
      return false;
    }
    
    console.log('✅ GitHub Actions workflow contains all required components');
    
    // Check recent workflow runs (if gh CLI is available)
    try {
      const workflowRuns = execSync('gh run list --limit 5 --json status,conclusion,createdAt', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      const runs = JSON.parse(workflowRuns);
      
      if (runs.length > 0) {
        console.log('📊 Recent workflow runs:');
        runs.forEach((run, index) => {
          const status = run.conclusion || run.status;
          const icon = status === 'success' ? '✅' : status === 'failure' ? '❌' : '🔄';
          const date = new Date(run.createdAt).toLocaleString();
          console.log(`   ${icon} ${status} - ${date}`);
        });
      } else {
        console.log('ℹ️  No recent workflow runs found');
      }
      
    } catch (error) {
      console.log('ℹ️  GitHub CLI not available or not authenticated');
      console.log('   Manual verification: Check Actions tab in GitHub repository');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ GitHub Actions verification failed:', error.message);
    return false;
  }
}

/**
 * Verify custom domain and HTTPS
 */
async function verifyDomainAndHTTPS() {
  console.log(`🌐 Verifying custom domain and HTTPS for ${CONFIG.domain}...\n`);
  
  try {
    // Check CNAME file
    if (!fs.existsSync('CNAME')) {
      console.log('❌ CNAME file not found');
      return false;
    }
    
    const cnameContent = fs.readFileSync('CNAME', 'utf8').trim();
    if (cnameContent !== CONFIG.domain) {
      console.log(`❌ CNAME mismatch. Expected: ${CONFIG.domain}, Found: ${cnameContent}`);
      return false;
    }
    
    console.log('✅ CNAME file configured correctly');
    
    // Test HTTPS connection
    console.log('🔒 Testing HTTPS connection...');
    
    const response = await checkHTTPS(CONFIG.domain);
    
    if (response.statusCode === 200) {
      console.log('✅ HTTPS connection successful');
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Server: ${response.headers.server || 'Unknown'}`);
      
      // Check SSL certificate
      if (response.certificate) {
        const cert = response.certificate;
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const now = new Date();
        
        console.log('🔐 SSL Certificate info:');
        console.log(`   Subject: ${cert.subject.CN}`);
        console.log(`   Issuer: ${cert.issuer.O}`);
        console.log(`   Valid from: ${validFrom.toLocaleDateString()}`);
        console.log(`   Valid to: ${validTo.toLocaleDateString()}`);
        
        if (now < validFrom || now > validTo) {
          console.log('⚠️  SSL certificate is not valid for current date');
        } else {
          console.log('✅ SSL certificate is valid');
        }
      }
      
      // Check if it's actually serving our site
      if (response.body.includes('闘魂Elixir')) {
        console.log('✅ Site content verified');
      } else {
        console.log('⚠️  Site content not found - may be serving different content');
      }
      
    } else {
      console.log(`❌ HTTPS connection failed with status: ${response.statusCode}`);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Domain/HTTPS verification failed:', error.message);
    
    // Provide troubleshooting guidance
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Verify DNS settings point to GitHub Pages');
    console.log('2. Check GitHub Pages settings in repository');
    console.log('3. Ensure CNAME file is in repository root');
    console.log('4. Wait for DNS propagation (up to 24 hours)');
    
    return false;
  }
}

/**
 * Verify SEO and metadata
 */
async function verifySEOAndMetadata() {
  console.log('🔍 Verifying SEO and metadata...\n');
  
  try {
    const url = `https://${CONFIG.domain}`;
    const response = await checkHTTPS(CONFIG.domain);
    
    if (response.statusCode !== 200) {
      console.log('❌ Cannot verify SEO - site not accessible');
      return false;
    }
    
    const html = response.body;
    
    // Check essential meta tags
    const metaChecks = [
      { name: 'Title', pattern: /<title>([^<]+)<\/title>/, required: true },
      { name: 'Description', pattern: /<meta name="description" content="([^"]+)"/, required: true },
      { name: 'OG Title', pattern: /<meta property="og:title" content="([^"]+)"/, required: true },
      { name: 'OG Description', pattern: /<meta property="og:description" content="([^"]+)"/, required: true },
      { name: 'OG Image', pattern: /<meta property="og:image" content="([^"]+)"/, required: true },
      { name: 'OG URL', pattern: /<meta property="og:url" content="([^"]+)"/, required: true },
      { name: 'Twitter Card', pattern: /<meta name="twitter:card" content="([^"]+)"/, required: true },
      { name: 'Canonical URL', pattern: /<link rel="canonical" href="([^"]+)"/, required: true },
      { name: 'Theme Color', pattern: /<meta name="theme-color" content="([^"]+)"/, required: false }
    ];
    
    console.log('📋 SEO Meta Tags Check:');
    console.log('=======================');
    
    let allPassed = true;
    
    metaChecks.forEach(check => {
      const match = html.match(check.pattern);
      if (match) {
        console.log(`✅ ${check.name}: ${match[1]}`);
      } else {
        const status = check.required ? '❌' : '⚠️ ';
        console.log(`${status} ${check.name}: Not found`);
        if (check.required) allPassed = false;
      }
    });
    
    // Check structured data
    console.log('\n📊 Structured Data Check:');
    console.log('=========================');
    
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
    if (jsonLdMatches && jsonLdMatches.length > 0) {
      console.log(`✅ Found ${jsonLdMatches.length} JSON-LD structured data blocks`);
      
      jsonLdMatches.forEach((match, index) => {
        try {
          const jsonContent = match.replace(/<script[^>]*>|<\/script>/g, '').trim();
          const data = JSON.parse(jsonContent);
          console.log(`   ${index + 1}. ${data['@type'] || 'Unknown type'}`);
        } catch (error) {
          console.log(`   ${index + 1}. Invalid JSON-LD structure`);
        }
      });
    } else {
      console.log('⚠️  No structured data found');
    }
    
    // Check favicon
    console.log('\n🎨 Favicon Check:');
    console.log('=================');
    
    const faviconChecks = [
      /<link rel="icon" href="([^"]+)"/,
      /<link rel="shortcut icon" href="([^"]+)"/
    ];
    
    let faviconFound = false;
    faviconChecks.forEach(pattern => {
      const match = html.match(pattern);
      if (match) {
        console.log(`✅ Favicon found: ${match[1]}`);
        faviconFound = true;
      }
    });
    
    if (!faviconFound) {
      console.log('⚠️  No favicon found');
    }
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ SEO verification failed:', error.message);
    return false;
  }
}

/**
 * Generate deployment test report
 */
function generateReport(results) {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    domain: CONFIG.domain,
    githubRepo: CONFIG.githubRepo,
    results,
    summary: {
      totalTests: Object.keys(results).length,
      passed: Object.values(results).filter(r => r.status === 'PASSED').length,
      failed: Object.values(results).filter(r => r.status === 'FAILED').length
    }
  };
  
  const reportPath = path.join(CONFIG.outputDir, `deployment-test-${timestamp.replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📄 Deployment test report saved to: ${reportPath}`);
  
  return report;
}

/**
 * Run all deployment verification tests
 */
async function runDeploymentTests() {
  console.log('🚀 Starting GitHub Pages Deployment Verification...\n');
  
  const results = {};
  
  // Test 1: GitHub Actions workflow
  try {
    const workflowResult = await verifyGitHubActions();
    results.githubActions = {
      status: workflowResult ? 'PASSED' : 'FAILED',
      description: 'GitHub Actions workflow configuration and execution'
    };
  } catch (error) {
    results.githubActions = {
      status: 'FAILED',
      description: 'GitHub Actions workflow configuration and execution',
      error: error.message
    };
  }
  
  console.log(''); // Add spacing
  
  // Test 2: Custom domain and HTTPS
  try {
    const domainResult = await verifyDomainAndHTTPS();
    results.domainHTTPS = {
      status: domainResult ? 'PASSED' : 'FAILED',
      description: 'Custom domain configuration and HTTPS connectivity'
    };
  } catch (error) {
    results.domainHTTPS = {
      status: 'FAILED',
      description: 'Custom domain configuration and HTTPS connectivity',
      error: error.message
    };
  }
  
  console.log(''); // Add spacing
  
  // Test 3: SEO and metadata
  try {
    const seoResult = await verifySEOAndMetadata();
    results.seoMetadata = {
      status: seoResult ? 'PASSED' : 'FAILED',
      description: 'SEO optimization and metadata validation'
    };
  } catch (error) {
    results.seoMetadata = {
      status: 'FAILED',
      description: 'SEO optimization and metadata validation',
      error: error.message
    };
  }
  
  // Generate and display summary
  console.log('\n📊 Deployment Verification Results:');
  console.log('===================================');
  
  Object.entries(results).forEach(([test, result]) => {
    const icon = result.status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} ${test}: ${result.status}`);
    console.log(`   ${result.description}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  // Generate report
  const report = generateReport(results);
  
  console.log(`\n📈 Summary: ${report.summary.passed}/${report.summary.totalTests} tests passed\n`);
  
  // Return overall success
  return report.summary.failed === 0;
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runDeploymentTests()
    .then(success => {
      if (success) {
        console.log('🎉 All deployment verification tests passed!');
      } else {
        console.log('⚠️  Some deployment verification tests failed.');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { runDeploymentTests, CONFIG };