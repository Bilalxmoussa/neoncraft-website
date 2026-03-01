import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

// Find next screenshot number
const existing = fs.readdirSync(dir).filter(f => f.startsWith('screenshot-'));
let num = 1;
for (const f of existing) {
  const m = f.match(/screenshot-(\d+)/);
  if (m) num = Math.max(num, parseInt(m[1]) + 1);
}

const filename = label ? `screenshot-${num}-${label}.png` : `screenshot-${num}.png`;
const filepath = path.join(dir, filename);

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000)); // wait for fonts

  // Scroll through page to trigger IntersectionObserver reveals
  await page.evaluate(async () => {
    const distance = 400;
    const delay = 100;
    const scrollHeight = document.body.scrollHeight;
    let current = 0;
    while (current < scrollHeight) {
      window.scrollBy(0, distance);
      current += distance;
      await new Promise(r => setTimeout(r, delay));
    }
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 500));
  });

  await new Promise(r => setTimeout(r, 1000)); // let animations finish
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`Screenshot saved: ${filepath}`);
  await browser.close();
})();
