'use strict';

// Curated, locally hosted product/lifestyle photos. Each household product has
// its own image so the catalog no longer reuses unrelated category artwork.
const HOME_PRODUCT_IMAGES = {
  71: '/images/products/lamp.jpg',
  72: '/images/products/lamp.jpg',
  73: '/images/products/vase.jpg',
  74: '/images/catalog/pexels-6279644.jpg',
  75: '/images/products/storage.jpg',
  76: '/images/catalog/pexels-9565780.jpg',
  77: '/images/catalog/pexels-8767264.jpg',
  78: '/images/catalog/pexels-7303867.jpg',
  79: '/images/catalog/pexels-8580730.jpg',
  80: '/images/products/pillow.jpg',
  81: '/images/catalog/pexels-26988001.jpg',
  82: '/images/products/towels.jpg',
  83: '/images/catalog/pexels-6653896.jpg',
  84: '/images/products/tray.jpg',
  85: '/images/catalog/pexels-29677318.jpg',
  86: '/images/products/planter.jpg',
  87: '/images/catalog/pexels-8936386.jpg',
  88: '/images/products/woodenTools.jpg',
  89: '/images/products/utensils.jpg',
  90: '/images/catalog/pexels-18266452.jpg',
  91: '/images/catalog/pexels-6207335.jpg',
  92: '/images/catalog/pexels-13684937.jpg',
  93: '/images/catalog/pexels-616360.jpg',
  94: '/images/catalog/pexels-1516421.jpg',
  95: '/images/catalog/pexels-4282738.jpg',
  96: '/images/catalog/pexels-7691101.jpg',
  97: '/images/catalog/pexels-7558122.jpg',
  98: '/images/catalog/pexels-4635231.jpg',
  99: '/images/catalog/pexels-19321444.jpg',
  100: '/images/catalog/pexels-8899486.jpg',
  101: '/images/catalog/pexels-7000101.jpg',
  102: '/images/catalog/pexels-12814945.jpg',
  103: '/images/catalog/pexels-4946928.jpg',
  104: '/images/catalog/pexels-31902663.jpg',
  105: '/images/catalog/pexels-5629138.jpg',
  106: '/images/catalog/pexels-26546535.jpg',
  107: '/images/catalog/pexels-4202321.jpg',
  108: '/images/catalog/pexels-7749027.jpg',
  109: '/images/catalog/pexels-8251757.jpg',
  110: '/images/catalog/pexels-6964562.jpg',
  111: '/images/catalog/pexels-13872079.jpg',
  112: '/images/catalog/pexels-8903262.jpg',
  113: '/images/catalog/pexels-7233912.jpg',
  114: '/images/catalog/pexels-31390649.jpg',
  115: '/images/catalog/pexels-8286097.jpg',
  116: '/images/catalog/pexels-39882371.jpg',
  117: '/images/catalog/pexels-27581228.jpg',
  118: '/images/catalog/pexels-6430745.jpg',
  119: '/images/catalog/pexels-9774656.jpg',
  120: '/images/catalog/pexels-12273900.jpg',
  121: '/images/catalog/pexels-32435035.jpg',
};

function addHomePhotos(data) {
  const version = Number(data.homePhotoVersion) || 0;
  if (version >= 3) return 0;
  let changed = 0;
  if (version < 2) {
    for (const [id, image] of Object.entries(HOME_PRODUCT_IMAGES)) {
      const product = data.products.find(item => Number(item.id) === Number(id) && item.subCategory === 'home');
      if (product && product.image !== image) {
        product.image = image;
        changed++;
      }
    }
  } else {
    // The first household product was omitted from the earlier image map.
    // Repair only its known starter illustration, preserving any shop edit.
    const firstHouseholdProduct = data.products.find(item => Number(item.id) === 71 && item.subCategory === 'home');
    if (firstHouseholdProduct?.image === '/images/home-lamp.svg') {
      firstHouseholdProduct.image = HOME_PRODUCT_IMAGES[71];
      changed++;
    }
  }
  data.homePhotoVersion = 3;
  return changed;
}

module.exports = { addHomePhotos, HOME_PRODUCT_IMAGES };
