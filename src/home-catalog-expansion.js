'use strict';

const PRODUCTS = require('./home-catalog-expansion.json');
const PRODUCT_PHOTOS = require('./home-product-photos.json');
const BATCH = 'home-luxury-1000-v1';
const VERSION = 4;

function addHomeCatalogExpansion(data) {
  let added = 0;
  let version = Number(data.homeCatalogExpansionVersion ?? 0);
  if (version < 1) {
    const existing = new Set(data.products.map(product => product.sku).filter(Boolean));
    for (const product of PRODUCTS) {
      if (existing.has(product.sku)) continue;
      data.products.push({ ...product, id: data.nextProductId++, catalogBatch: BATCH });
      added++;
    }
    data.homeCatalogExpansionVersion = 1;
    version = 1;
  }
  if (version < 2) {
    for (const product of data.products) {
      if (product.catalogBatch !== BATCH || !product.sku) continue;
      const sku = String(product.sku).toLowerCase();
      if (product.image === `/images/generated-products/${sku}.svg`) product.image = `/images/generated-products/${sku}-v2.svg`;
    }
    data.homeCatalogExpansionVersion = 2;
    version = 2;
  }
  if (version < 3) {
    const catalogBySku = new Map(PRODUCTS.map(product => [String(product.sku).toLowerCase(), product]));
    for (const product of data.products) {
      if (product.catalogBatch !== BATCH || !product.sku) continue;
      const catalogProduct = catalogBySku.get(String(product.sku).toLowerCase());
      if (!catalogProduct) continue;
      product.imageType = catalogProduct.imageType;
      if (/^\/images\/generated-products\/hsx-\d{4}(?:-v\d+)?\.svg$/i.test(product.image || '')) {
        product.image = catalogProduct.image;
      }
    }
    data.homeCatalogExpansionVersion = 3;
    version = 3;
  }
  if (version < 4) {
    const usage = new Map();
    for (const product of data.products) {
      if (product.catalogBatch !== BATCH || !/^\/images\/generated-products\//i.test(product.image || '')) continue;
      const photos = PRODUCT_PHOTOS[product.imageType] || [];
      if (!photos.length) continue;
      const used = usage.get(product.imageType) || 0;
      const image = photos[used % photos.length];
      usage.set(product.imageType, used + 1);
      product.image = image;
      const customGallery = Array.isArray(product.images)
        ? product.images.filter(item => typeof item === 'string' && !/^\/images\/generated-products\//i.test(item))
        : [];
      product.images = [image, ...customGallery.filter(item => item !== image)].slice(0, 8);
    }
    data.homeCatalogExpansionVersion = 4;
  }
  return added;
}

module.exports = { addHomeCatalogExpansion, BATCH, VERSION };
