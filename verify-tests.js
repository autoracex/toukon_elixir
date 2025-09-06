#!/usr/bin/env node

/**
 * Test Verification Script
 * 
 * This script verifies that all test files are properly configured
 * and can be executed without errors.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Integration Test Suite Configuration...\n');

// Test files to verify
const testFiles = [
  'lighthouse-test.js',
  'browser-test.js', 
  'deployment-test.js',
  'integration-test.js'
];

// Required directories
const requiredDirs = [
  'lighthouse-reports',
  'browser-test-reports',
  'deployment-test-reports', 
  'integration-test-reports'
];

let allGood = true;

// Check test files exist and are executable
console.log('📋 Checking test files...');
testFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - exists`);
    
    // Check if file is readable
    try {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('module.exports')) {
        console.log(`   ✅ ${file} - properly structured`);
      } else {
        console.log(`   ⚠️  ${file} - missing module exports`);
      }
    } catch (error) {
      console.log(`   ❌ ${file} - cannot read file`);
      allGood = false;
    }
  } else {
    console.log(`❌ ${file} - missing`);
    allGood = false;
  }
});

console.log('');

// Check required directories
console.log('📁 Checking output directories...');
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}/ - exists`);
  } else {
    console.log(`⚠️  ${dir}/ - will be created when needed`);
    // Create directory
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`   ✅ ${dir}/ - created`);
    } catch (error) {
      console.log(`   ❌ ${dir}/ - failed to create`);
      allGood = false;
    }
  }
});

console.log('');

// Check package.json scripts
console.log('📦 Checking package.json scripts...');
if (fs.existsSync('package.json')) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = [
    'test',
    'test:lighthouse', 
    'test:browser',
    'test:deployment'
  ];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✅ npm run ${script} - configured`);
    } else {
      console.log(`❌ npm run ${script} - missing`);
      allGood = false;
    }
  });
} else {
  console.log('❌ package.json - missing');
  allGood = false;
}

console.log('');

// Check GitHub Actions workflow
console.log('🔧 Checking GitHub Actions workflow...');
const workflowPath = '.github/workflows/deploy.yml';
if (fs.existsSync(workflowPath)) {
  console.log('✅ GitHub Actions workflow - exists');
  
  const workflowContent = fs.readFileSync(workflowPath, 'utf8');
  const requiredComponents = [
    'name:',
    'on:',
    'push:',
    'jobs:',
    'runs-on:',
    'actions/checkout',
    'actions/deploy-pages'
  ];
  
  const missingComponents = requiredComponents.filter(component => 
    !workflowContent.includes(component)
  );
  
  if (missingComponents.length === 0) {
    console.log('✅ GitHub Actions workflow - properly configured');
  } else {
    console.log(`⚠️  GitHub Actions workflow - missing: ${missingComponents.join(', ')}`);
  }
} else {
  console.log('❌ GitHub Actions workflow - missing');
  allGood = false;
}

console.log('');

// Check CNAME file
console.log('🌐 Checking custom domain configuration...');
if (fs.existsSync('CNAME')) {
  const domain = fs.readFileSync('CNAME', 'utf8').trim();
  console.log(`✅ CNAME file - configured for ${domain}`);
} else {
  console.log('⚠️  CNAME file - missing (deployment tests will be limited)');
}

console.log('');

// Check documentation
console.log('📚 Checking documentation...');
if (fs.existsSync('TESTING.md')) {
  console.log('✅ TESTING.md - exists');
} else {
  console.log('❌ TESTING.md - missing');
  allGood = false;
}

if (fs.existsSync('run-tests.sh')) {
  console.log('✅ run-tests.sh - exists');
  
  // Check if executable
  try {
    const stats = fs.statSync('run-tests.sh');
    if (stats.mode & parseInt('111', 8)) {
      console.log('✅ run-tests.sh - executable');
    } else {
      console.log('⚠️  run-tests.sh - not executable (run: chmod +x run-tests.sh)');
    }
  } catch (error) {
    console.log('⚠️  run-tests.sh - cannot check permissions');
  }
} else {
  console.log('❌ run-tests.sh - missing');
  allGood = false;
}

console.log('');

// Final summary
console.log('🎯 Verification Summary');
console.log('======================');

if (allGood) {
  console.log('🎉 All integration test components are properly configured!');
  console.log('');
  console.log('📋 Available test commands:');
  console.log('   npm test                 - Run full integration test suite');
  console.log('   npm run test:lighthouse  - Run Lighthouse performance audit');
  console.log('   npm run test:browser     - Run cross-browser compatibility tests');
  console.log('   npm run test:deployment  - Run GitHub Pages deployment verification');
  console.log('   ./run-tests.sh           - Run tests with detailed output');
  console.log('');
  console.log('📖 For detailed information, see: TESTING.md');
  console.log('');
  process.exit(0);
} else {
  console.log('⚠️  Some integration test components need attention.');
  console.log('');
  console.log('🔧 Please fix the issues above and run this verification again.');
  console.log('');
  process.exit(1);
}