const puppeteer = require('puppeteer');
const path = require('path');

async function generatePDF() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Load the light HTML file
  const htmlPath = path.join(__dirname, 'SYSTEM-OVERVIEW-LIGHT.html');
  await page.goto(`file:///${htmlPath}`, { waitUntil: 'networkidle0' });

  console.log('Generating PDF...');
  await page.pdf({
    path: path.join(__dirname, 'TransRentals-System-Overview.pdf'),
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '15mm',
      right: '15mm'
    },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size:9px;color:#94a3b8;width:100%;padding:0 15mm;display:flex;justify-content:space-between;font-family:sans-serif;">
        <span>TransRentals — System Overview</span>
        <span>2026-03-20</span>
      </div>`,
    footerTemplate: `
      <div style="font-size:9px;color:#94a3b8;width:100%;padding:0 15mm;display:flex;justify-content:space-between;font-family:sans-serif;">
        <span>Confidential — Internal Use Only</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>`
  });

  await browser.close();
  console.log('PDF saved: TransRentals-System-Overview.pdf');
}

generatePDF().catch(console.error);
