#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { Transform } = require('node:stream');
const { pipeline } = require('node:stream/promises');

const source = path.resolve(process.argv[2] || path.join(__dirname, '..', 'data', 'load-test', 'shop-events-20gb.ndjson'));
const output = path.resolve(process.argv[3] || source + '.gz');
const minimumFreeBytes = 1024 * 1024 * 1024;

async function main() {
  const sourceInfo = await fs.promises.stat(source);
  if (!sourceInfo.isFile()) throw new Error('Nguồn phải là một file');
  if (output === path.resolve(path.join(__dirname, '..', 'data', 'shop.json'))) throw new Error('Từ chối ghi đè database shop.json');
  if (fs.existsSync(output)) throw new Error(`File đích đã tồn tại: ${output}`);
  await fs.promises.mkdir(path.dirname(output), { recursive: true });
  const stream = fs.createWriteStream(output, { flags: 'wx' });
  let compressedBytes = 0;
  const guard = new Transform({
    transform(chunk, _encoding, callback) {
      compressedBytes += chunk.length;
      const disk = fs.statfsSync(path.dirname(output));
      if (disk.bavail * disk.bsize < minimumFreeBytes) return callback(new Error('Đã dừng để giữ lại ít nhất 1 GiB trống'));
      callback(null, chunk);
    },
  });
  try {
    await pipeline(fs.createReadStream(source), zlib.createGzip({ level: zlib.constants.Z_BEST_SPEED }), guard, stream);
    console.log(JSON.stringify({ sourceBytes: sourceInfo.size, compressedBytes, output }));
  } catch (error) {
    await fs.promises.unlink(output).catch(() => {});
    throw error;
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
