import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, drawFn) {
  // RGBA buffer: width * height * 4
  const rgba = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const color = drawFn(x, y, width, height);
      rgba[idx] = color[0];     // R
      rgba[idx + 1] = color[1]; // G
      rgba[idx + 2] = color[2]; // B
      rgba[idx + 3] = color[3]; // A
    }
  }

  // PNG filter 0 (None) for each scanline
  const scanlineWidth = width * 4;
  const rawData = Buffer.alloc((scanlineWidth + 1) * height);
  for (let y = 0; y < height; y++) {
    rawData[y * (scanlineWidth + 1)] = 0; // filter byte
    rgba.copy(rawData, y * (scanlineWidth + 1) + 1, y * scanlineWidth, (y + 1) * scanlineWidth);
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(len + 12);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crc = crc32(buf.subarray(4, len + 8));
    buf.writeInt32BE(crc, len + 8);
    return buf;
  }

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        const mask = -(byte & 1);
        crc = (crc >>> 1) ^ (0xEDB88320 & mask);
        byte >>>= 1;
      }
    }
    return ~crc;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Brand draw function: Deep stone-950 background with emerald-500 rounded shield and diamond M logo
function brandIconDrawer(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (isMaskable) {
    // Maskable icon has full-bleed background (#0c0a09)
    // Central icon inside 70% safe zone
    const r = w * 0.35;
    if (dist < r) {
      // Emerald circular badge
      const factor = 1 - (dist / r) * 0.3;
      // Diamond M center
      const inDiamond = (Math.abs(dx) + Math.abs(dy)) < (w * 0.18);
      if (inDiamond) {
        return [255, 255, 255, 255]; // White core
      }
      return [Math.floor(5 * factor), Math.floor(150 * factor), Math.floor(105 * factor), 255]; // Emerald
    }
    return [12, 10, 9, 255]; // Stone-950 background
  }

  // Standard icon: Rounded rectangle badge
  const cornerR = w * 0.22;
  const inBox = Math.abs(dx) <= (cx - 4) && Math.abs(dy) <= (cy - 4);
  // Check rounded corner
  const qx = Math.max(0, Math.abs(dx) - (cx - cornerR));
  const qy = Math.max(0, Math.abs(dy) - (cy - cornerR));
  const outsideCorner = (qx * qx + qy * qy) > (cornerR * cornerR);

  if (outsideCorner || !inBox) {
    return [0, 0, 0, 0]; // Transparent
  }

  // Inside rounded square
  const inDiamond = (Math.abs(dx) + Math.abs(dy)) < (w * 0.22);
  if (inDiamond) {
    return [255, 255, 255, 255]; // Clean white diamond
  }

  // Emerald badge gradient
  const grad = Math.min(1, Math.max(0, (y / h)));
  const rCol = Math.floor(4 * (1 - grad) + 5 * grad);
  const gCol = Math.floor(120 * (1 - grad) + 160 * grad);
  const bCol = Math.floor(87 * (1 - grad) + 115 * grad);
  return [rCol, gCol, bCol, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. pwa-192x192.png
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, (x, y, w, h) => brandIconDrawer(x, y, w, h, false)));
console.log('Created pwa-192x192.png');

// 2. pwa-512x512.png
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, (x, y, w, h) => brandIconDrawer(x, y, w, h, false)));
console.log('Created pwa-512x512.png');

// 3. pwa-maskable-512x512.png
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, (x, y, w, h) => brandIconDrawer(x, y, w, h, true)));
console.log('Created pwa-maskable-512x512.png');

// 4. apple-touch-icon.png (180x180)
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, (x, y, w, h) => brandIconDrawer(x, y, w, h, false)));
console.log('Created apple-touch-icon.png');

// 5. favicon.ico / icon.svg
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#059669"/>
  <polygon points="50,22 78,50 50,78 22,50" fill="#ffffff"/>
  <path d="M40,55 L40,43 L46,51 L50,47 L54,51 L60,43 L60,55" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg);
console.log('Created icon.svg');
