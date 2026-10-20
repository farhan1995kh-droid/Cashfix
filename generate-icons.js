import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, combined, crcBuf]);
}

function generatePng(width, height, isMaskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with filter type 0 before each row
  const rowBytes = width * 4;
  const rawData = Buffer.alloc((rowBytes + 1) * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = isMaskable ? width * 0.45 : width * 0.44;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Gradient background from rich blue #1d4ed8 to dark indigo #1e1b4b
      const gradT = (x + y) / (width + height);
      const bgR = Math.round(29 * (1 - gradT) + 30 * gradT);
      const bgG = Math.round(78 * (1 - gradT) + 27 * gradT);
      const bgB = Math.round(216 * (1 - gradT) + 75 * gradT);

      // Check rounded rect or circle boundary for non-maskable
      let inShape = true;
      if (!isMaskable) {
        // Rounded rectangle with corner radius = width * 0.22
        const cr = width * 0.22;
        const cl = Math.max(Math.abs(dx) - (cx - cr), 0);
        const ct = Math.max(Math.abs(dy) - (cy - cr), 0);
        if (Math.sqrt(cl * cl + ct * ct) > cr) {
          inShape = false;
        }
      }

      if (!inShape) {
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
      } else {
        // Draw Cashfix 'C' & 'F' / Card emblem in center
        // Center white emblem: a stylized register/card rectangle
        const cardW = width * 0.48;
        const cardH = height * 0.32;
        const isCard = Math.abs(dx) <= cardW / 2 && Math.abs(dy) <= cardH / 2;
        const isBorder = isCard && (
          Math.abs(dx) >= cardW / 2 - width * 0.04 ||
          Math.abs(dy) >= cardH / 2 - height * 0.04
        );
        // Cash currency symbol bar
        const isBar = Math.abs(dx) <= cardW * 0.35 && Math.abs(dy - height * 0.02) <= height * 0.02;

        if (isBorder || isBar) {
          rawData[offset++] = 255;
          rawData[offset++] = 255;
          rawData[offset++] = 255;
          rawData[offset++] = 255;
        } else if (isCard) {
          rawData[offset++] = Math.min(255, bgR + 40);
          rawData[offset++] = Math.min(255, bgG + 40);
          rawData[offset++] = Math.min(255, bgB + 50);
          rawData[offset++] = 255;
        } else {
          rawData[offset++] = bgR;
          rawData[offset++] = bgG;
          rawData[offset++] = bgB;
          rawData[offset++] = 255;
        }
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generatePng(48, 48, false));

console.log('Successfully generated Cashfix PWA icons in /public');
