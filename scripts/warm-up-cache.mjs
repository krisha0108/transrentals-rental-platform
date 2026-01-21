
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * CACHE WARM-UP SCRIPT (No External Dependencies)
 * Usage: node scripts/warm-up-cache.mjs https://your-domain.com
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.argv[2];

if (!BASE_URL) {
    console.error('❌ Error: Please provide a base URL.');
    console.log('Usage: node scripts/warm-up-cache.mjs https://transrentals.in');
    process.exit(1);
}

const CONCURRENCY = 3; // Keep it low to be safe for DB
const DELAY_MS = 300;  // Delay between requests

const SERVICES = [
    'car-rental', 'self-drive-car-rentals', 'luxury-car-rental',
    'local-taxi', 'airport-transfer', 'outstation-taxi',
    'tempo-traveller', 'bus-rental', 'transporter',
    'mini-truck-rental', 'trailer-on-rent', 'crane-on-rent', 'jcb-on-rent'
];

async function getCitySlugs() {
    const citiesPath = path.join(__dirname, '../src/data/indian-cities.ts');
    const content = fs.readFileSync(citiesPath, 'utf8');
    // Simple regex to extract slugs from the TS file
    const matches = content.matchAll(/slug:\s*['"]([^'"]+)['"]/g);
    return Array.from(new Set([...matches].map(m => m[1])));
}

async function start() {
    console.log(`🚀 Warm-up started for: ${BASE_URL}`);

    const slugs = await getCitySlugs();
    const paths = [];

    // 1. City landing pages
    slugs.forEach(slug => paths.push(`/${slug}`));

    // 2. Service pages
    SERVICES.forEach(service => {
        slugs.forEach(slug => paths.push(`/${service}/${slug}`));
    });

    console.log(`📊 Total paths to warm up: ${paths.length}`);

    let completed = 0;
    let failed = 0;
    const startTime = Date.now();

    for (let i = 0; i < paths.length; i += CONCURRENCY) {
        const batch = paths.slice(i, i + CONCURRENCY);

        await Promise.all(batch.map(async (p) => {
            try {
                const url = `${BASE_URL}${p}`;
                const res = await fetch(url);
                completed++;

                if (completed % 50 === 0) {
                    const elapsed = (Date.now() - startTime) / 1000;
                    console.log(`✅ [${completed}/${paths.length}] Crawled ${p} (${res.status}) - ${(completed / elapsed).toFixed(1)} p/s`);
                }
            } catch (e) {
                failed++;
                console.error(`❌ Failed ${p}: ${e.message}`);
            }
        }));

        await new Promise(r => setTimeout(r, DELAY_MS));
    }

    console.log(`\n✨ Done! Total: ${completed}, Failed: ${failed}`);
}

start().catch(console.error);
