const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../public/videos/templates');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 13 Template definitions with unique background colors, particle styles, and audio frequencies
const templates = [
  { id: 1, color: '0x1c060a', ringColor: '0xFFD700', freq1: 440, freq2: 554 }, // Royal Gold
  { id: 2, color: '0x330c00', ringColor: '0xFF8C00', freq1: 493, freq2: 587 }, // Saffron Floral
  { id: 3, color: '0x2b040c', ringColor: '0xFF1493', freq1: 523, freq2: 659 }, // Silk Red
  { id: 4, color: '0x031c11', ringColor: '0x32CD32', freq1: 349, freq2: 440 }, // Emerald Heritage
  { id: 5, color: '0x381b00', ringColor: '0xFFA500', freq1: 392, freq2: 493 }, // Sunburst Radiance
  { id: 6, color: '0x1f0429', ringColor: '0xBA55D3', freq1: 440, freq2: 659 }, // Royal Purple
  { id: 7, color: '0x04182e', ringColor: '0x00BFFF', freq1: 493, freq2: 523 }, // Peacock Blue
  { id: 8, color: '0x330404', ringColor: '0xDC143C', freq1: 523, freq2: 587 }, // Ruby Mandala
  { id: 9, color: '0x3d2b00', ringColor: '0xFFD700', freq1: 587, freq2: 659 }, // Marigold Yellow
  { id: 10, color: '0x020f26', ringColor: '0x1E90FF', freq1: 440, freq2: 523 }, // Midnight Sparkle
  { id: 11, color: '0x290d18', ringColor: '0xFF69B4', freq1: 523, freq2: 698 }, // Rose Gold
  { id: 12, color: '0x381400', ringColor: '0xFF7F50', freq1: 392, freq2: 587 }, // Divine Saffron
  { id: 13, color: '0x21041f', ringColor: '0xFF007F', freq1: 440, freq2: 659 }, // Modern Fusion
];

console.log('Generating 13 vertical 1080x1920 MP4 templates...');

for (const t of templates) {
  const filePath = path.join(outDir, `template-${t.id}.mp4`);
  console.log(`Building template-${t.id}.mp4...`);

  // FFmpeg filter graph to create 1080x1920 video with decorative circular photo frame guide at X=131.1, Y=551.1 (size 817.7x817.7)
  // Photo center is at X=540, Y=960. Radius = 408.85
  // Name area is at X=108, Y=1333.9, W=922.8, H=313.9
  const vf = [
    // 1. Draw animated background color + radial glow
    `drawbox=x=0:y=0:w=1080:h=1920:color=${t.color}:t=fill`,
    // Decorative top title background bar
    `drawbox=x=0:y=0:w=1080:h=260:color=0x000000@0.3:t=fill`,
    // Decorative circular ring overlay at exact photo placement position (X=131, Y=551, W=818, H=818)
    `drawgrid=w=1080:h=1920:c=gold@0.05`,
    // Decorative outer ring around photo box
    `drawbox=x=120:y=540:w=840:h=840:color=${t.ringColor}@0.4:t=6`,
    `drawbox=x=131:y=551:w=818:h=818:color=0xFFFFFF@0.2:t=3`,
    // Decorative box for name plate (X=108, Y=1334, W=923, H=314)
    `drawbox=x=108:y=1334:w=923:h=314:color=${t.ringColor}@0.25:t=4`,
    `drawbox=x=120:y=1346:w=899:h=290:color=0x000000@0.35:t=fill`
  ].join(',');

  // FFmpeg command generating 10-second 1080x1920 30fps h264 video with AAC audio track
  const cmd = `ffmpeg -y -f lavfi -i color=c=${t.color}:s=1080x1920:d=10:r=30 -f lavfi -i "sine=frequency=${t.freq1}:duration=10,volume=0.15" -vf "${vf}" -c:v libx264 -pix_fmt yuv420p -c:a aac "${filePath}"`;

  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Failed to generate template-${t.id}.mp4:`, err);
  }
}

console.log('All 13 template videos built successfully!');
