'use strict';

// Download locally hosted, commercially usable photographs from Openverse.
// The resulting credits file records the source and license for every image.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const PRODUCT_FILE = path.join(ROOT, 'src', 'home-catalog-expansion.json');
const OUTPUT_DIR = path.join(ROOT, 'public', 'images', 'home-products');
const OUTPUT_FILE = path.join(ROOT, 'src', 'home-product-photos.json');
const CREDIT_FILE = path.join(OUTPUT_DIR, 'credits.json');
const USER_AGENT = 'HomeShoppingCatalog/1.0 (product photo sourcing)';
const SEARCH = {
  tray: { queries: ['wood serving tray', 'wooden serving tray'], terms: ['serving tray', 'wooden tray', 'wood tray'] },
  board: { queries: ['wood cutting board kitchen', 'bamboo cutting board'], terms: ['cutting board'] },
  bottle: { queries: ['oil dispenser bottle kitchen', 'oil cruet bottle'], terms: ['oil dispenser', 'oil bottle', 'cruet'] },
  jar: { queries: ['glass spice jars kitchen', 'spice jar set'], terms: ['spice jar', 'spice rack'] },
  bowl: { queries: ['ceramic bowl tableware', 'stoneware bowl'], terms: ['rice bowl', 'ceramic bowl'] },
  cup: { queries: ['ceramic coffee mug', 'ceramic cup'], terms: ['ceramic mug', 'coffee mug'] },
  shelf: { queries: ['wooden home shelf', 'small wooden shelf'], terms: ['wood shelf', 'bookcase', 'shelf'] },
  crock: { queries: ['kitchen utensil holder crock', 'ceramic utensil holder'], terms: ['utensil holder', 'kitchen utensil'] },
  textile: { queries: ['linen kitchen towels', 'cotton tea towels kitchen'], terms: ['tea towel', 'kitchen towel', 'linen towel'] },
  carafe: { queries: ['glass water carafe', 'glass carafe table'], terms: ['water carafe', 'glass carafe'] },
  plate: { queries: ['ceramic dinner plate', 'stoneware plate'], terms: ['dinner plate', 'ceramic plate'] },
  kettle: { queries: ['electric kettle kitchen', 'tea kettle countertop'], terms: ['electric kettle', 'tea kettle'] },
  utensils: { queries: ['wooden kitchen utensils', 'wooden cooking utensils'], terms: ['wooden kitchen utensil', 'cooking utensil'] },
  cushion: { queries: ['throw pillow sofa', 'decorative cushion sofa'], terms: ['throw pillow', 'cushion'] },
  throw: { queries: ['sofa throw blanket', 'woven blanket sofa'], terms: ['throw blanket', 'sofa blanket', 'granny square blanket'] },
  vase: { queries: ['ceramic vase home decor', 'minimal ceramic vase'], terms: ['ceramic vase', 'glass vase', 'vase'] },
  lamp: { queries: ['table lamp home decor', 'bedside table lamp'], terms: ['table lamp', 'bedside lamp'] },
  diffuser: { queries: ['reed diffuser glass bottle', 'aroma diffuser home'], terms: ['reed diffuser', 'aroma diffuser'] },
  stool: { queries: ['small wooden stool furniture', 'round accent stool'], terms: ['wooden stool', 'round stool', 'stool'] },
  rug: { queries: ['woven area rug home', 'small woven rug'], terms: ['woven rug', 'area rug', 'rug'] },
  candle: { queries: ['glass candle jar home', 'decorative candle holder'], terms: ['glass candle', 'candle holder', 'candlestick'] },
  sculpture: { queries: ['small decorative sculpture home', 'abstract home decor sculpture'], terms: ['home sculpture', 'decorative sculpture', 'sculpture'] },
  table: { queries: ['small side table furniture', 'wood end table living room'], terms: ['side table', 'end table'] },
  frame: { queries: ['tabletop picture frame', 'wood picture frame'], terms: ['picture frame', 'photo frame'] },
  bedding: { queries: ['cotton bedding set bedroom', 'bed linens cotton'], terms: ['cotton bedding', 'bed linens', 'bed linen'] },
  box: { queries: ['decorative storage box home', 'small organizer box'], terms: ['storage box', 'organizer box'] },
  mirror: { queries: ['tabletop vanity mirror', 'small table mirror'], terms: ['vanity mirror', 'tabletop mirror'] },
  sachet: { queries: ['scented sachet bag closet', 'lavender sachet fabric'], terms: ['sachet', 'lavender sachet'] },
  dispenser: { queries: ['bathroom soap dispenser', 'ceramic soap pump dispenser'], terms: ['soap dispenser'] },
  basket: { queries: ['woven storage basket home', 'wicker basket storage'], terms: ['wicker basket', 'woven basket', 'basket'] },
  hook: { queries: ['wall mounted coat hook', 'decorative wall hook'], terms: ['coat hook', 'wall hook', 'hook rack'] },
  planter: { queries: ['ceramic plant pot planter', 'indoor plant pot'], terms: ['ceramic planter', 'plant pot', 'flower pot'] },
  clock: { queries: ['tabletop desk clock', 'small mantel clock'], terms: ['desk clock', 'table clock', 'mantel clock'] },
  floral: { queries: ['dried flower bouquet vase', 'dried flowers home decor'], terms: ['dried flower', 'dried flowers', 'bouquet'] },
  blender: { queries: ['countertop blender kitchen appliance', 'hand blender appliance'], terms: ['countertop blender', 'hand blender', 'blender'] },
  fan: { queries: ['small table fan appliance', 'desk fan home'], terms: ['table fan', 'desk fan', 'room fan'] },
  scale: { queries: ['digital kitchen scale', 'food weighing scale kitchen'], terms: ['kitchen scale', 'food scale'] },
  coffee: { queries: ['home coffee maker machine', 'coffee machine countertop'], terms: ['coffee maker', 'coffee machine'] },
  humidifier: { queries: ['small room humidifier', 'home humidifier appliance'], terms: ['humidifier'] },
  vacuum: { queries: ['handheld vacuum cleaner', 'small vacuum cleaner home'], terms: ['handheld vacuum', 'vacuum cleaner'] },
  toaster: { queries: ['two slice toaster kitchen appliance', 'bread toaster countertop'], terms: ['two slice toaster', 'bread toaster', 'toaster'] },
  lunchbox: { queries: ['insulated lunch box food container', 'bento lunch box'], terms: ['lunch box', 'lunchbox', 'bento box'] },
};
const FALLBACK = {
  tray: '/images/products/tray.jpg', board: '/images/products/woodenTools.jpg', bottle: '/images/catalog/pexels-4282738.jpg',
  jar: '/images/catalog/pexels-1516421.jpg', bowl: '/images/products/woodenTools.jpg', cup: '/images/catalog/pexels-1516421.jpg',
  shelf: '/images/products/shelf.jpg', crock: '/images/products/utensils.jpg', textile: '/images/products/towels.jpg',
  carafe: '/images/catalog/pexels-4282738.jpg', plate: '/images/products/woodenTools.jpg', kettle: '/images/catalog/coffee.jpg',
  utensils: '/images/products/utensils.jpg', cushion: '/images/products/pillow.jpg', throw: '/images/products/blanket.jpg',
  vase: '/images/products/vase.jpg', lamp: '/images/products/lamp.jpg', diffuser: '/images/catalog/pexels-4282738.jpg',
  stool: '/images/products/shelf.jpg', rug: '/images/catalog/pexels-12273900.jpg', candle: '/images/products/vaseRound.jpg',
  sculpture: '/images/products/vaseRound.jpg', table: '/images/products/shelf.jpg', frame: '/images/catalog/pexels-8251757.jpg',
  bedding: '/images/products/blanket.jpg', box: '/images/products/storage.jpg', mirror: '/images/catalog/pexels-8251757.jpg',
  sachet: '/images/products/towels.jpg', dispenser: '/images/products/storage.jpg', basket: '/images/catalog/pexels-31390649.jpg',
  hook: '/images/products/shelf.jpg', planter: '/images/products/planter.jpg', clock: '/images/catalog/pexels-6207335.jpg',
  floral: '/images/products/lamp.jpg', blender: '/images/catalog/blender.jpg', fan: '/images/products/lamp.jpg',
  scale: '/images/catalog/pexels-7558122.jpg', coffee: '/images/catalog/coffee.jpg', humidifier: '/images/catalog/pexels-4282738.jpg',
  vacuum: '/images/catalog/blender.jpg', toaster: '/images/products/utensils.jpg', lunchbox: '/images/products/tray.jpg',
};
const excludedTitle = /painting|illustration|drawing|logo|poster|diagram|meme|screenshot|textile pattern|wallpaper|insect|butterfly|book cover/i;
const ignoredWords = new Set(['wood', 'wooden', 'ceramic', 'glass', 'home', 'decor', 'decorative', 'small', 'modern', 'kitchen', 'table', 'set', 'room', 'cotton', 'linen', 'the', 'and', 'with', 'for']);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getJson(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(30_000) });
    if (response.ok) return response.json();
    if (![429, 500, 502, 503, 504].includes(response.status)) throw new Error(`Openverse responded ${response.status}: ${url}`);
    await sleep(Math.min(30_000, (Number(response.headers.get('retry-after')) || 2 ** attempt) * 1000));
  }
  throw new Error(`Openverse remained unavailable: ${url}`);
}

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function scoreResult(result, config) {
  const title = normalize(result.title);
  if (!['cc0', 'pdm', 'by'].includes(String(result.license || '').toLowerCase())) return -1;
  if (!title || excludedTitle.test(title) || result.width < 480 || result.height < 360) return -1;
  const wanted = config.terms.map(normalize);
  const matches = wanted.filter(term => title.includes(term)).length;
  if (!matches) return -1;
  const words = config.queries.flatMap(query => normalize(query).split(/\s+/)).filter(word => word.length > 3 && !ignoredWords.has(word));
  const overlap = new Set(words.filter(word => title.includes(word))).size;
  return matches * 10 + overlap;
}

async function download(result, destination) {
  const response = await fetch(result.thumbnail, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(45_000) });
  if (!response.ok) throw new Error(`Thumbnail request failed: HTTP ${response.status}`);
  const type = (response.headers.get('content-type') || '').split(';')[0];
  const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' })[type];
  if (!extension) throw new Error(`Unsupported image type: ${type}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 8_000) throw new Error('Thumbnail is too small to be a usable product photo');
  const target = `${destination}.${extension}`;
  await fs.writeFile(target, bytes);
  return target;
}

async function main() {
  const products = JSON.parse(await fs.readFile(PRODUCT_FILE, 'utf8'));
  const groups = new Map();
  for (const product of products) {
    const key = product.imageType;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(product);
  }
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const assignments = {};
  const credits = [];
  const seen = new Set();
  const seenTitles = new Set();
  for (const [type, items] of groups) {
    const config = SEARCH[type];
    if (!config) throw new Error(`No product photo search configured for ${type}`);
    const targetCount = Math.min(5, Math.max(2, Math.ceil(items.length / 25)));
    const selected = [];
    const seenForType = new Set();
    for (const query of config.queries) {
      for (let page = 1; page <= 2 && selected.length < targetCount; page++) {
        const params = new URLSearchParams({ q: query, page_size: '20', page: String(page), license_type: 'commercial' });
        const payload = await getJson(`https://api.openverse.org/v1/images/?${params}`);
        const candidates = (payload.results || []).map(result => ({ result, score: scoreResult(result, config) }))
          .filter(item => item.score > 0 && item.result.thumbnail && !seen.has(item.result.id) && !seenForType.has(item.result.id) && !seenTitles.has(normalize(item.result.title)))
          .sort((a, b) => b.score - a.score);
        for (const candidate of candidates) {
          if (selected.length >= targetCount) break;
          const destination = path.join(OUTPUT_DIR, `${type}-${String(selected.length + 1).padStart(2, '0')}`);
          try {
            const file = await download(candidate.result, destination);
            const extension = path.extname(file);
            const localPath = `/images/home-products/${path.basename(file)}`;
            const hash = crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');
            if (credits.some(item => item.sha256 === hash)) {
              await fs.unlink(file);
              continue;
            }
            seen.add(candidate.result.id);
            seenForType.add(candidate.result.id);
            seenTitles.add(normalize(candidate.result.title));
            const entry = {
              id: candidate.result.id,
              type,
              title: candidate.result.title,
              creator: candidate.result.creator || 'Unknown creator',
              license: candidate.result.license,
              licenseVersion: candidate.result.license_version || '',
              licenseUrl: candidate.result.license_url,
              source: candidate.result.source,
              sourceUrl: candidate.result.foreign_landing_url || candidate.result.url,
              imageUrl: candidate.result.url,
              localPath,
              attribution: candidate.result.attribution || '',
              sha256: hash,
            };
            credits.push(entry);
            selected.push(localPath);
          } catch (error) {
            console.warn(`Skipped ${type} photo “${candidate.result.title}”: ${error.message}`);
          }
        }
        await sleep(300);
      }
      if (selected.length >= targetCount) break;
    }
    const fallback = FALLBACK[type];
    if (!fallback) throw new Error(`No fallback photograph configured for product type ${type}`);
    if (!selected.includes(fallback)) selected.push(fallback);
    assignments[type] = selected;
    console.log(`${type}: ${selected.length} photos for ${items.length} products`);
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(assignments, null, 2) + '\n');
    await fs.writeFile(CREDIT_FILE, JSON.stringify(credits, null, 2) + '\n');
  }
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(assignments, null, 2) + '\n');
  await fs.writeFile(CREDIT_FILE, JSON.stringify(credits, null, 2) + '\n');
  console.log(`Saved ${credits.length} distinct, licensed photos for ${products.length} products.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
