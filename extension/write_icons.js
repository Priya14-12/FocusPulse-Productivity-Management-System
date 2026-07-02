// write_icons.js - Create placeholder extension icons
const fs = require('fs');
const path = require('path');

// Simple 48x48 grey/blue lock-style logo base64 PNG
const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABJklEQVR42u2ZsQ3CMBBG75ElYAKWYAlYgqGhoqCkpGIIKOhZAiZgCSb/d9wJTuIkUqQo8adPsv/q+7lzzskkSRIkSJAgQYIECRIkSJAgQYK/ExCRkcg+5g6d5kHkeLh+9VpXERFpDqQn0hDZkZ4e2VvIisg14L6BvEDoO0j3zT7zR+T2Duxp/A6yV0ReIvdz4Em87iCrfTj+P97D8UoH6Z2BuxB1Dqj+PojXw+Yd7IFyB2Gf9zW+9zVexP7rDpx3eAekM7AH8s9A79EepD8De4b2IP4Z6P2B2D+8AzvIfgf2QPY7SPfNPn/rM39Evnfg9iAekecOPIjXGWR1D8ff27w7yOr0DvyFwDugOxD+O7AH0p/hR3t4B2iQIEGCBAkSJEiQ4PMTfAAeGkGkexCbfAAAAABJRU5ErkJggg==';

const buffer = Buffer.from(base64Data, 'base64');
const dir = path.join(__dirname, 'icons');

if (!fs.existsSync(dir)){
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(path.join(dir, 'icon16.png'), buffer);
fs.writeFileSync(path.join(dir, 'icon48.png'), buffer);
fs.writeFileSync(path.join(dir, 'icon128.png'), buffer);

console.log('Icons generated successfully.');
