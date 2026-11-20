'use strict';

// Catalog values are the operator's per-unit packed measurements. Older catalog
// entries fall back to conservative category/name estimates until edited.
const PROFILES = [
  { match: /kệ|shelf|giá treo|giá để đồ/i, parcel: { weight: 2800, length: 55, width: 32, height: 14 } },
  { match: /chăn|duvet|blanket/i, parcel: { weight: 1300, length: 38, width: 30, height: 12 } },
  { match: /gối|pillow|đệm/i, parcel: { weight: 850, length: 42, width: 32, height: 18 } },
  { match: /thảm|rug|mat/i, parcel: { weight: 1100, length: 38, width: 20, height: 16 } },
  { match: /khăn|towel|vỏ gối/i, parcel: { weight: 450, length: 28, width: 20, height: 8 } },
  { match: /đèn|lamp|chụp đèn/i, parcel: { weight: 1500, length: 35, width: 28, height: 25 } },
  { match: /bình hoa|lọ thủy tinh|vase|bình rót|bình giữ nhiệt/i, parcel: { weight: 900, length: 26, width: 22, height: 18 } },
  { match: /bộ hộp|hộp bảo quản|hộp sắp xếp/i, parcel: { weight: 900, length: 30, width: 24, height: 16 } },
  { match: /thớt|khay|dụng cụ bếp|ống đựng|lọ gia vị/i, parcel: { weight: 750, length: 32, width: 24, height: 8 } },
  { match: /áo khoác|cardigan|áo len/i, parcel: { weight: 850, length: 34, width: 28, height: 10 } },
  { match: /quần|jeans|chinos/i, parcel: { weight: 650, length: 32, width: 25, height: 7 } },
  { match: /áo|sơ mi|thun/i, parcel: { weight: 420, length: 30, width: 24, height: 5 } },
  { match: /giày|sneaker|derby/i, parcel: { weight: 1250, length: 34, width: 23, height: 13 } },
];

const CATEGORY_PROFILES = [
  { match: /phòng ngủ|phòng khách|phòng tắm|trang trí|lưu trữ|nhà bếp|gia dụng/i, parcel: { weight: 800, length: 30, width: 24, height: 14 } },
  { match: /điện tử/i, parcel: { weight: 700, length: 25, width: 20, height: 10 } },
  { match: /thời trang|áo|quần/i, parcel: { weight: 500, length: 30, width: 24, height: 7 } },
];

function positiveInteger(value) {
  return Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
}

function resolveUnitParcel(item = {}) {
  const weight = positiveInteger(item.shippingWeightG);
  const length = positiveInteger(item.shippingLengthCm);
  const width = positiveInteger(item.shippingWidthCm);
  const height = positiveInteger(item.shippingHeightCm);
  if (weight && length && width && height) {
    const sides = [length, width, height].sort((a, b) => b - a);
    return { weight, length: sides[0], width: sides[1], height: sides[2], estimated: false };
  }

  const label = `${item.name || ''} ${item.category || ''} ${item.subCategory || ''}`;
  const profile = PROFILES.find(entry => entry.match.test(label)) ||
    CATEGORY_PROFILES.find(entry => entry.match.test(label)) ||
    { parcel: { weight: 800, length: 28, width: 22, height: 12 } };
  return { ...profile.parcel, estimated: true };
}

function estimateOrderParcel(items = []) {
  const lines = items.map(item => ({ item, unit: resolveUnitParcel(item), quantity: Number(item.quantity) || 0 }))
    .filter(line => line.quantity > 0);
  if (!lines.length) throw new Error('Order must contain at least one shippable item.');

  const weight = lines.reduce((sum, line) => sum + line.unit.weight * line.quantity, 100);
  const volume = lines.reduce((sum, line) => sum + line.unit.length * line.unit.width * line.unit.height * line.quantity, 0);
  const length = Math.max(...lines.map(line => line.unit.length));
  const width = Math.max(...lines.map(line => line.unit.width));
  const height = Math.max(
    ...lines.map(line => line.unit.height),
    Math.ceil((volume * 1.15) / (length * width)),
  );
  return {
    weight: Math.min(weight, 500000),
    length,
    width,
    height,
    estimated: lines.some(line => line.unit.estimated),
  };
}

module.exports = { resolveUnitParcel, estimateOrderParcel };
