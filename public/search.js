(function (root) {
  function normalize(value) {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function matches(product, query) {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    const haystack = normalize([product.name, product.description, product.category, product.subCategory, ...(product.colors || []), ...(product.sizes || [])].join(' '));
    return words.every(word => haystack.includes(word));
  }
  const search = { normalize, matches };
  if (typeof module !== 'undefined' && module.exports) module.exports = search;
  else root.productSearch = search;
})(typeof globalThis !== 'undefined' ? globalThis : this);
