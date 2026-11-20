'use strict';

function normalizeVietnamPhone(value) {
  const compact = String(value || '').trim().replace(/[^\d+]/g, '');
  const international = compact.match(/^(?:\+?84|0084)(\d{9,10})$/);
  if (international) return `0${international[1]}`;
  return compact;
}

function isVietnamPhone(value) {
  return /^(?:0[35789]\d{8}|02\d{8,9})$/.test(value);
}

function isVietnamMobilePhone(value) {
  return /^0[35789]\d{8}$/.test(value);
}

module.exports = { normalizeVietnamPhone, isVietnamPhone, isVietnamMobilePhone };
