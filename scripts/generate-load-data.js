#!/usr/bin/env node
'use strict';

// Creates isolated synthetic JSONL data for disk/streaming load experiments.
// This is deliberately not the application's shop.json database.
const fs = require('node:fs');
const path = require('node:path');
const { once } = require('node:events');

const GIGABYTE = 1_000_000_000;
const RECORD_BYTES = 4096;
const RESERVE_BYTES = 2 * 1024 * 1024 * 1024;
const DEFAULT_OUTPUT = path.join(__dirname, '..', 'data', 'load-test', 'shop-events-20gb.ndjson');
const TYPES = ['product_view', 'search', 'cart_add', 'checkout_started', 'order_created', 'order_shipped', 'review_opened'];
const CATEGORIES = ['apparel', 'shoes', 'accessories', 'home', 'electronics', 'beauty'];

function argumentsFrom(argv) {
  let sizeGb = 20;
  let output = DEFAULT_OUTPUT;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--size-gb') {
      sizeGb = Number(argv[++i]);
      if (!Number.isFinite(sizeGb) || sizeGb < 1 || sizeGb > 100) throw new Error('--size-gb phải nằm trong khoảng 1–100');
    } else if (argv[i] === '--output') {
      output = path.resolve(argv[++i] || '');
      if (!argv[i]) throw new Error('--output cần đường dẫn file');
    } else if (argv[i] === '--help') {
      console.log('Cách dùng: node scripts/generate-load-data.js [--size-gb 20] [--output đường-dẫn.ndjson]');
      process.exit(0);
    } else {
      throw new Error(`Tham số không hợp lệ: ${argv[i]}`);
    }
  }
  return { targetBytes: Math.round(sizeGb * GIGABYTE), output };
}

function makeRecord(sequence, lineBytes) {
  const type = TYPES[sequence % TYPES.length];
  const isOrder = type === 'order_created' || type === 'order_shipped';
  const record = {
    schema: 'shop-load-test-v1',
    eventId: sequence + 1,
    eventType: type,
    visitorId: `synthetic-${sequence % 2_000_000}`,
    productId: 1 + ((sequence * 37) % 100_000),
    category: CATEGORIES[sequence % CATEGORIES.length],
    orderId: isOrder ? `TEST-${String(sequence + 1).padStart(10, '0')}` : null,
    amountVnd: isOrder ? 50_000 + ((sequence * 7919) % 4_950_000) : 0,
    occurredAt: new Date(Date.UTC(2025, 0, 1) + sequence * 30_000).toISOString(),
    syntheticPayload: '',
  };
  const emptyLineBytes = Buffer.byteLength(JSON.stringify(record)) + 1;
  const paddingBytes = lineBytes - emptyLineBytes;
  if (paddingBytes < 0) throw new Error('Kích thước mỗi dòng nhỏ hơn dữ liệu nền');
  record.syntheticPayload = 'x'.repeat(paddingBytes);
  const line = JSON.stringify(record) + '\n';
  if (Buffer.byteLength(line) !== lineBytes) throw new Error('Không thể tạo dòng đúng kích thước yêu cầu');
  return line;
}

async function main() {
  const { targetBytes, output } = argumentsFrom(process.argv);
  if (output === path.resolve(path.join(__dirname, '..', 'data', 'shop.json'))) {
    throw new Error('Từ chối ghi đè database shop.json');
  }
  await fs.promises.mkdir(path.dirname(output), { recursive: true });
  if (fs.existsSync(output)) throw new Error(`File đã tồn tại, không ghi đè: ${output}`);

  const disk = fs.statfsSync(path.dirname(output));
  const freeBytes = disk.bavail * disk.bsize;
  if (freeBytes < targetBytes + RESERVE_BYTES) {
    throw new Error(`Không đủ chỗ trống: cần ${(targetBytes + RESERVE_BYTES) / GIGABYTE} GB gồm 2 GB dự phòng, hiện còn ${(freeBytes / GIGABYTE).toFixed(2)} GB`);
  }

  const stream = fs.createWriteStream(output, { flags: 'wx', highWaterMark: 1024 * 1024 });
  let bytesWritten = 0;
  let sequence = 0;
  let nextProgress = GIGABYTE;
  try {
    while (bytesWritten < targetBytes) {
      const lines = [];
      let batchBytes = 0;
      while (bytesWritten + batchBytes < targetBytes && batchBytes < 1024 * 1024) {
        const lineBytes = Math.min(RECORD_BYTES, targetBytes - bytesWritten - batchBytes);
        const line = makeRecord(sequence++, lineBytes);
        lines.push(line);
        batchBytes += lineBytes;
      }
      if (!stream.write(lines.join(''))) await once(stream, 'drain');
      bytesWritten += batchBytes;
      if (bytesWritten >= nextProgress) {
        console.log(`Đã ghi ${(bytesWritten / GIGABYTE).toFixed(0)}/${(targetBytes / GIGABYTE).toFixed(0)} GB`);
        nextProgress += GIGABYTE;
      }
    }
    stream.end();
    await once(stream, 'close');
    console.log(JSON.stringify({ file: output, bytes: bytesWritten, records: sequence, format: 'NDJSON', synthetic: true }));
  } catch (error) {
    stream.destroy();
    await fs.promises.unlink(output).catch(() => {});
    throw error;
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
