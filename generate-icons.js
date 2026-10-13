const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPng(width, height, pixelFn) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    scanlines[offset++] = 0; // filter None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      scanlines[offset++] = r;
      scanlines[offset++] = g;
      scanlines[offset++] = b;
      scanlines[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(scanlines);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw a modern music looper icon: rounded dark square with circular loop arrow & musical glow
function drawIcon(size) {
  return createPng(size, size, (x, y, w, h) => {
    // Normalised coordinates (-1 to 1)
    const nx = (x / (w - 1)) * 2 - 1;
    const ny = (y / (h - 1)) * 2 - 1;
    const r = Math.sqrt(nx * nx + ny * ny);

    // Rounded rectangle background (radius ~ 0.85)
    const cornerR = 0.28;
    const dx = Math.max(0, Math.abs(nx) - (1 - cornerR));
    const dy = Math.max(0, Math.abs(ny) - (1 - cornerR));
    const distToCorner = Math.sqrt(dx * dx + dy * dy);

    if (distToCorner > cornerR) {
      return [0, 0, 0, 0]; // Transparent outside rounded corner
    }

    // Background gradient: dark violet-slate (#181824 to #0f0f17)
    const bgFactor = (ny + 1) / 2;
    const bgR = Math.round(26 * (1 - bgFactor) + 16 * bgFactor);
    const bgG = Math.round(24 * (1 - bgFactor) + 16 * bgFactor);
    const bgB = Math.round(38 * (1 - bgFactor) + 24 * bgFactor);

    // Loop ring: radius around 0.52, thickness ~ 0.16
    const ringRadius = 0.52;
    const ringDist = Math.abs(r - ringRadius);

    // Loop arrows / gap: opening at top-right
    const angle = Math.atan2(ny, nx); // -PI to PI
    const inGap = (angle > 0.4 && angle < 0.95);

    if (ringDist < 0.14 && !inGap) {
      // Vibrant Cyan / Lime electric gradient for the loop symbol
      const t = (angle + Math.PI) / (2 * Math.PI);
      const iconR = Math.round(0 + 255 * (1 - t) * 0.4);
      const iconG = Math.round(230 * (1 - t) + 120 * t);
      const iconB = Math.round(255 * t + 100 * (1 - t));
      return [iconR, iconG, iconB, 255];
    }

    // Little triangle arrow head near angle 0.4
    const headX = ringRadius * Math.cos(0.95);
    const headY = ringRadius * Math.sin(0.95);
    const dHead = Math.hypot(nx - headX, ny - headY);
    if (dHead < 0.18) {
      return [0, 230, 200, 255];
    }

    // Inner center dot: A/B indicator (cyan / orange)
    if (r < 0.16) {
      return [255, 180, 50, 255]; // Amber center dot (guitar / pedal LED)
    }

    return [bgR, bgG, bgB, 255];
  });
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const png = drawIcon(size);
  const outPath = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`Generated: ${outPath} (${size}x${size})`);
});
