#!/usr/bin/env node

/**
 * Simple build script for performance optimization
 * This script helps minify CSS and JavaScript files
 */

const fs = require('fs');
const path = require('path');

// Simple CSS minifier
function minifyCSS(css) {
  return css
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove unnecessary whitespace
    .replace(/\s+/g, ' ')
    // Remove whitespace around specific characters
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')
    // Remove trailing semicolons before closing braces
    .replace(/;}/g, '}')
    // Remove leading/trailing whitespace
    .trim();
}

// Simple JavaScript minifier (basic)
function minifyJS(js) {
  return js
    // Remove single-line comments (but preserve URLs and regex)
    .replace(/\/\/(?![^\n]*['"`]).*$/gm, '')
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove unnecessary whitespace (basic)
    .replace(/\s+/g, ' ')
    // Remove whitespace around operators and punctuation
    .replace(/\s*([{}();,=+\-*/<>!&|])\s*/g, '$1')
    // Remove trailing semicolons before closing braces
    .replace(/;}/g, '}')
    .trim();
}

// Build process
function build() {
  console.log('🔥 Starting build process...');
  
  try {
    // Minify CSS
    if (fs.existsSync('styles.css')) {
      const css = fs.readFileSync('styles.css', 'utf8');
      const minifiedCSS = minifyCSS(css);
      fs.writeFileSync('styles.min.css', minifiedCSS);
      console.log('✅ CSS minified successfully');
      
      // Show size reduction
      const originalSize = Buffer.byteLength(css, 'utf8');
      const minifiedSize = Buffer.byteLength(minifiedCSS, 'utf8');
      const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
      console.log(`   Original: ${originalSize} bytes`);
      console.log(`   Minified: ${minifiedSize} bytes`);
      console.log(`   Reduction: ${reduction}%`);
    }
    
    // Minify JavaScript
    if (fs.existsSync('script.js')) {
      const js = fs.readFileSync('script.js', 'utf8');
      const minifiedJS = minifyJS(js);
      fs.writeFileSync('script.min.js', minifiedJS);
      console.log('✅ JavaScript minified successfully');
      
      // Show size reduction
      const originalSize = Buffer.byteLength(js, 'utf8');
      const minifiedSize = Buffer.byteLength(minifiedJS, 'utf8');
      const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
      console.log(`   Original: ${originalSize} bytes`);
      console.log(`   Minified: ${minifiedSize} bytes`);
      console.log(`   Reduction: ${reduction}%`);
    }
    
    console.log('🎉 Build completed successfully!');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run build if this script is executed directly
if (require.main === module) {
  build();
}

module.exports = { build, minifyCSS, minifyJS };