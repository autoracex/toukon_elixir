#!/usr/bin/env node

/**
 * Lighthouse Performance Audit Script
 * 
 * This script runs Lighthouse audits on the site to verify:
 * - Performance metrics (LCP, FID, CLS)
 * - Accessibility compliance
 * - SEO optimization
 * - Best practices
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
    url: 'http://localhost:8000',
    outputDir: './lighthouse-reports',
    thresholds: {
        performance: 90,
        accessibility: 95,
        bestPractices: 90,
        seo: 95
    }
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * Run Lighthouse audit
 */
async function runLighthouseAudit() {
    console.log('🔍 Starting Lighthouse Performance Audit...\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(CONFIG.outputDir, `lighthouse-report-${timestamp}.html`);
    const jsonPath = path.join(CONFIG.outputDir, `lighthouse-report-${timestamp}.json`);

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

        // Run Lighthouse audit
        console.log('🚀 Running Lighthouse audit...');
        const baseReportPath = path.join(CONFIG.outputDir, `lighthouse-report-${timestamp}`);
        const lighthouseCmd = `npx lighthouse ${CONFIG.url} ` +
            `--output=html,json ` +
            `--output-path=${baseReportPath} ` +
            `--chrome-flags="--headless --no-sandbox --disable-dev-shm-usage" ` +
            `--enable-error-reporting=false ` +
            `--quiet`;

        execSync(lighthouseCmd, { stdio: 'inherit' });

        // Update paths to match actual output
        const actualJsonPath = `${baseReportPath}.report.json`;
        const actualHtmlPath = `${baseReportPath}.report.html`;

        // Parse JSON results
        const jsonResults = JSON.parse(fs.readFileSync(actualJsonPath, 'utf8'));
        const scores = {
            performance: Math.round(jsonResults.categories.performance.score * 100),
            accessibility: Math.round(jsonResults.categories.accessibility.score * 100),
            bestPractices: Math.round(jsonResults.categories['best-practices'].score * 100),
            seo: Math.round(jsonResults.categories.seo.score * 100)
        };

        // Display results
        console.log('\n📊 Lighthouse Audit Results:');
        console.log('================================');

        Object.entries(scores).forEach(([category, score]) => {
            const threshold = CONFIG.thresholds[category];
            const status = score >= threshold ? '✅' : '❌';
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1');

            console.log(`${status} ${categoryName}: ${score}/100 (threshold: ${threshold})`);
        });

        // Core Web Vitals
        console.log('\n🎯 Core Web Vitals:');
        console.log('===================');

        const metrics = jsonResults.audits;
        const lcp = metrics['largest-contentful-paint']?.displayValue || 'N/A';
        const fid = metrics['max-potential-fid']?.displayValue || 'N/A';
        const cls = metrics['cumulative-layout-shift']?.displayValue || 'N/A';

        console.log(`📈 Largest Contentful Paint (LCP): ${lcp}`);
        console.log(`⚡ First Input Delay (FID): ${fid}`);
        console.log(`📐 Cumulative Layout Shift (CLS): ${cls}`);

        // Performance opportunities
        console.log('\n💡 Performance Opportunities:');
        console.log('=============================');

        const opportunities = Object.values(metrics)
            .filter(audit => audit.details && audit.details.type === 'opportunity' && audit.score < 1)
            .sort((a, b) => (b.details.overallSavingsMs || 0) - (a.details.overallSavingsMs || 0))
            .slice(0, 5);

        if (opportunities.length > 0) {
            opportunities.forEach(audit => {
                const savings = audit.details.overallSavingsMs || 0;
                if (savings > 0) {
                    console.log(`• ${audit.title}: ${savings}ms potential savings`);
                }
            });
        } else {
            console.log('🎉 No significant performance opportunities found!');
        }

        console.log(`\n📄 Full report saved to: ${actualHtmlPath}`);
        console.log(`📊 JSON data saved to: ${actualJsonPath}\n`);

        // Check if all thresholds are met
        const allPassed = Object.entries(scores).every(([category, score]) =>
            score >= CONFIG.thresholds[category]
        );

        if (allPassed) {
            console.log('🎉 All Lighthouse thresholds passed!');
            return true;
        } else {
            console.log('⚠️  Some Lighthouse thresholds not met. Check the report for details.');
            return false;
        }

    } catch (error) {
        console.error('❌ Lighthouse audit failed:', error.message);
        return false;
    }
}

// Run the audit if this script is executed directly
if (require.main === module) {
    runLighthouseAudit()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { runLighthouseAudit, CONFIG };