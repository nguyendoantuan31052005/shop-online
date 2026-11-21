#!/usr/bin/env node
'use strict';

// Generate isolated synthetic customer records for local load/UI experiments.
// This file deliberately does not write to the application's shop.json database.
const fs = require('node:fs');
const path = require('node:path');
const { once } = require('node:events');

const DEFAULT_COUNT = 20_000;
const DEFAULT_OUTPUT = path.join(__dirname, '..', 'data', 'load-test', `test-users-${DEFAULT_COUNT}.ndjson`);

function parseArgs(argv) {
  let count = DEFAULT_COUNT;
  let output = DEFAULT_OUTPUT;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--count') {
      count = Number(argv[++i]);
      if (!Number.isSafeInteger(count) || count < 1 || count > 1_000_000) throw new Error('--count phải nằm trong khoảng 1–1.000.000');
    } else if (argv[i] === '--output') {
      const value = argv[++i];
      if (!value) throw new Error('--output cần đường dẫn file');
      output = path.resolve(value);
    } else if (argv[i] === '--help') {
      console.log('Cách dùng: node scripts/generate-test-users.js [--count 20000] [--output đường-dẫn.ndjson]');
      process.exit(0);
    } else {
      throw new Error(`Tham số không hợp lệ: ${argv[i]}`);
    }
  }
  return { count, output };
}

function makeUser(index) {
  const id = String(index).padStart(6, '0');
  return {
    id: `test-user-${id}`,
    username: `test_user_${id}`,
    name: `Test User ${id}`,
    email: `test-user-${id}@example.invalid`,
    phone: null,
    created_at: new Date(Date.UTC(2026, 0, 1) + index * 60_000).toISOString(),
    disabled: false,
    synthetic: true,
  };
}

async function main() {
  const { count, output } = parseArgs(process.argv);
  const productionDb = path.resolve(path.join(__dirname, '..', 'data', 'shop.json'));
  if (output === productionDb) throw new Error('Từ chối ghi vào database shop.json');
  await fs.promises.mkdir(path.dirname(output), { recursive: true });
  if (fs.existsSync(output)) throw new Error(`File đã tồn tại, không ghi đè: ${output}`);

  const stream = fs.createWriteStream(output, { flags: 'wx' });
  try {
    for (let index = 1; index <= count; index++) {
      if (!stream.write(JSON.stringify(makeUser(index)) + '\n')) await once(stream, 'drain');
    }
    stream.end();
    await once(stream, 'close');
    const { size } = await fs.promises.stat(output);
    console.log(JSON.stringify({ file: output, records: count, bytes: size, format: 'NDJSON', synthetic: true }));
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
