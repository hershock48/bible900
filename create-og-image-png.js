// Create PNG version of OG image using Puppeteer
// Run: npm install puppeteer (if not already installed)
// Then: node create-og-image-png.js

const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        // Set viewport to OG image size
        await page.setViewport({
            width: 1200,
            height: 630,
            deviceScaleFactor: 2 // For high DPI
        });
        
        // Load the HTML
        const html = fs.readFileSync('og-image.html', 'utf8');
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        // Take screenshot
        await page.screenshot({
            path: 'og-image.png',
            type: 'png',
            fullPage: false
        });
        
        await browser.close();
        console.log('✅ Created og-image.png (1200x630)');
    } catch (error) {
        if (error.message.includes('Cannot find module')) {
            console.log('❌ Puppeteer not installed. Run: npm install puppeteer');
        } else {
            console.error('❌ Error:', error.message);
        }
    }
})();
