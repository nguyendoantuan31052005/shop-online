'use strict';

const PRODUCTS = require('./home-catalog-expansion.json');
const BATCH = 'home-luxury-1000-v1';
const VERSION = 3;

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
  }
  return added;
}

module.exports = { addHomeCatalogExpansion, BATCH, VERSION };
