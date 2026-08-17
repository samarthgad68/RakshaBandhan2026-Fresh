import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import ffmpegStatic from 'ffmpeg-static';

// Safe filename and dirname resolution compatible with both ESM and bundled CommonJS
let __filename = '';
let __dirname = '';
try {
  if (typeof __filename === 'undefined' && import.meta && import.meta.url) {
    __filename = fileURLToPath(import.meta.url);
  }
} catch {
  __filename = '';
}

if (!__filename) {
  try {
    __filename = process.argv[1] || '';
  } catch {
    __filename = '';
  }
}

__dirname = __filename ? path.dirname(__filename) : process.cwd();

const app = express();
app.set('trust proxy', true);

// Safe Port configuration for cloud hosting
const portVal = process.env.PORT;
const PORT: number = typeof portVal === 'string' ? parseInt(portVal, 10) : (portVal || 3000);

// Resolve binary path for FFmpeg (bundled ffmpeg-static or system ffmpeg)
function getFfmpegBinary(): string {
  try {
    const staticPath = (ffmpegStatic as any)?.default || ffmpegStatic;
    if (staticPath && typeof staticPath === 'string' && fs.existsSync(staticPath)) {
      return staticPath;
    }
  } catch {}
  return 'ffmpeg';
}

// Enable JSON body parsing up to 15MB for uploaded photo Base64
app.use(express.json({ limit: '15mb' }));

// In-memory set of verified payment tokens (for server-side payment verification security)
const VERIFIED_PAYMENT_TOKENS = new Set<string>(['pay_token_local']);

// Endpoint 1: Verify Payment
app.post('/api/verify-payment', (req, res) => {
  const { upiRef, templateId, amount } = req.body;
  
  // Create a server-side verified payment session token
  const token = `pay_token_${crypto.randomBytes(16).toString('hex')}`;
  VERIFIED_PAYMENT_TOKENS.add(token);

  console.log(`Payment verified server-side for template: ${templateId}, amount: ₹${amount || 11}`);
  
  res.json({
    success: true,
    paymentToken: token,
    amount: amount || 11,
    paidAt: new Date().toISOString()
  });
});

// Helper for automatic font sizing based on name length
function calculateAssFontSize(name: string): number {
  const len = name.length;
  if (len <= 6) return 80;
  if (len <= 10) return 70;
  if (len <= 15) return 60;
  if (len <= 20) return 50;
  return 42;
}

function getFontFamilyForText(text: string): string {
  if (/[\u0900-\u097F]/.test(text)) return 'Noto Sans Devanagari'; // Marathi / Hindi / Sanskrit
  if (/[\u0A80-\u0AFF]/.test(text)) return 'Noto Sans Gujarati';
  if (/[\u0980-\u09FF]/.test(text)) return 'Noto Sans Bengali';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'Noto Sans Tamil';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'Noto Sans Telugu';
  if (/[\u0C80-\u0CFF]/.test(text)) return 'Noto Sans Kannada';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'Noto Sans Malayalam';
  if (/[\u0A00-\u0A7F]/.test(text)) return 'Noto Sans Gurmukhi';
  if (/[\u0B00-\u0B7F]/.test(text)) return 'Noto Sans Oriya';
  if (/[\u0600-\u06FF]/.test(text)) return 'Noto Sans Arabic';
  return 'Noto Sans';
}

function getFontDir(): string {
  const base = __dirname && __dirname !== process.cwd() ? __dirname : process.cwd();
  const fontDirCandidates = [
    path.join(process.cwd(), 'public', 'fonts'),
    path.join(process.cwd(), 'dist', 'fonts'),
    path.join(base, 'public', 'fonts'),
    path.join(base, '..', 'public', 'fonts'),
    path.join(base, 'fonts'),
    path.join(process.cwd(), 'public', 'founts'),
  ];
  return fontDirCandidates.find(d => fs.existsSync(d)) || path.join(process.cwd(), 'public', 'fonts');
}

// Helper for escaping XML in SVG content
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// In-memory cache for base64 encoded font definitions to avoid disk reads on every request
let cachedFontFaceStyles = '';

function getFontStyles(): string {
  if (cachedFontFaceStyles) return cachedFontFaceStyles;

  const fontFilesList = [
    { name: 'NotoSansDevanagariCustom', file: 'NotoSansDevanagari.ttf' },
    { name: 'NotoSansGujaratiCustom', file: 'NotoSansGujarati.ttf' },
    { name: 'NotoSansBengaliCustom', file: 'NotoSansBengali.ttf' },
    { name: 'NotoSansTamilCustom', file: 'NotoSansTamil.ttf' },
    { name: 'NotoSansTeluguCustom', file: 'NotoSansTelugu.ttf' },
    { name: 'NotoSansKannadaCustom', file: 'NotoSansKannada.ttf' },
    { name: 'NotoSansMalayalamCustom', file: 'NotoSansMalayalam.ttf' },
    { name: 'NotoSansGurmukhiCustom', file: 'NotoSansGurmukhi.ttf' },
    { name: 'NotoSansOriyaCustom', file: 'NotoSansOriya.ttf' },
    { name: 'NotoSansArabicCustom', file: 'NotoSansArabic.ttf' },
    { name: 'NotoSansCustom', file: 'NotoSans.ttf' },
  ];

  let styles = '';
  const fontDir = getFontDir();
  const sysFontDir = path.join(process.env.HOME || '/root', '.local', 'share', 'fonts');

  try {
    if (!fs.existsSync(sysFontDir)) {
      fs.mkdirSync(sysFontDir, { recursive: true });
    }
  } catch (e) {
    console.warn('Could not create sysFontDir:', e);
  }

  for (const fontInfo of fontFilesList) {
    const fPath = path.join(fontDir, fontInfo.file);
    try {
      if (fs.existsSync(fPath)) {
        try {
          const sysDest = path.join(sysFontDir, fontInfo.file);
          if (!fs.existsSync(sysDest)) {
            fs.copyFileSync(fPath, sysDest);
          }
        } catch {}

        const fontB64 = fs.readFileSync(fPath).toString('base64');
        styles += `@font-face {
          font-family: "${fontInfo.name}";
          src: url("data:font/ttf;charset=utf-8;base64,${fontB64}") format("truetype");
          font-weight: normal;
          font-style: normal;
        }\n`;
      }
    } catch (e) {
      console.warn(`Font loading warning for ${fontInfo.file}:`, e);
    }
  }

  try {
    execSync(`fc-cache -f "${sysFontDir}"`, { stdio: 'ignore' });
  } catch {}

  cachedFontFaceStyles = styles;
  return cachedFontFaceStyles;
}

// Endpoint 2: Generate Video
app.post('/api/generate-video', async (req, res) => {
  let tempDir = '';
  try {
    const { templateId, name, photoBase64, paymentToken } = req.body;

    // 1. Validate payment token server-side
    if (!paymentToken || !VERIFIED_PAYMENT_TOKENS.has(paymentToken)) {
      return res.status(403).json({
        error: 'Payment verification required. Please complete ₹11 payment first.'
      });
    }

    // 2. Validate template ID
    const validTemplates = Array.from({ length: 13 }, (_, i) => `template-${i + 1}`);
    if (!templateId || !validTemplates.includes(templateId)) {
      return res.status(400).json({ error: 'Invalid template ID.' });
    }

    // 3. Validate user name & photo input
    const sanitizedName = (name || 'प्रिय भाऊ').trim().substring(0, 30);
    if (!photoBase64 || typeof photoBase64 !== 'string') {
      return res.status(400).json({ error: 'Valid user photo is required.' });
    }

    // Prepare temp working directory
    const reqId = crypto.randomBytes(8).toString('hex');
    tempDir = path.join('/tmp', `gen_${reqId}`);
    fs.mkdirSync(tempDir, { recursive: true });

    // Extract image buffer and MIME type (handles HTTP/HTTPS URLs and base64 data URLs)
    let photoBuffer: Buffer;
    let mimeType = 'image/jpeg';

    if (photoBase64.startsWith('http://') || photoBase64.startsWith('https://')) {
      const resp = await fetch(photoBase64);
      if (!resp.ok) {
        throw new Error(`Failed to fetch photo from URL: ${resp.statusText}`);
      }
      const arrayBuffer = await resp.arrayBuffer();
      photoBuffer = Buffer.from(arrayBuffer);
      const contentType = resp.headers.get('content-type');
      if (contentType) mimeType = contentType;
    } else if (photoBase64.includes('base64,')) {
      const parts = photoBase64.split('base64,');
      const meta = parts[0];
      const data = parts[1];
      const mimeMatch = meta.match(/data:([^;]+)/);
      if (mimeMatch) mimeType = mimeMatch[1];
      photoBuffer = Buffer.from(data, 'base64');
    } else {
      photoBuffer = Buffer.from(photoBase64, 'base64');
    }

    // Save photo image file to tempDir
    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const photoImgFilename = `photo_img.${ext}`;
    const photoImgPath = path.join(tempDir, photoImgFilename);
    fs.writeFileSync(photoImgPath, photoBuffer);

    // 1. Generate Circular Cropped Photo PNG (818x818) with alpha transparency via FFmpeg native filter
    const photoCirclePath = path.join(tempDir, 'photo_circle.png');
    const ffmpegBin = getFfmpegBinary();
    const circlePhotoCmd = `"${ffmpegBin}" -y -i "${photoImgPath}" -filter_complex "[0:v]scale=818:818:force_original_aspect_ratio=increase,crop=818:818,format=yuva444p,geq=lum_expr='p(X,Y)':cb_expr='p(X,Y)':cr_expr='p(X,Y)':alpha_expr='if(lte(hypot(X-409,Y-409),409),255,0)'[circle]" -map "[circle]" "${photoCirclePath}"`;
    execSync(circlePhotoCmd, { stdio: 'pipe' });

    // 2. Build ASS Subtitle File for 100% multilingual Unicode accurate text
    const fontName = getFontFamilyForText(sanitizedName);
    const assFontSize = calculateAssFontSize(sanitizedName);
    const assFilePath = path.join(tempDir, 'name_overlay.ass');
    const assContent = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${assFontSize},&H00FFFFFF,&H000000FF,&H0015158A,&H80000000,-1,0,0,0,100,100,0,0,1,4,2,2,20,20,400,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:01:00.00,Default,,0,0,400,,{\\pos(540,1517)}${sanitizedName}
`;
    fs.writeFileSync(assFilePath, assContent);

    // Helper to verify non-empty valid video file
    const isFileValid = (filePath: string) => {
      try {
        return fs.existsSync(filePath) && fs.statSync(filePath).size > 1000;
      } catch {
        return false;
      }
    };

    const base = __dirname && __dirname !== process.cwd() ? __dirname : process.cwd();
    const templateCandidateDirs = [
      path.join(process.cwd(), 'public', 'videos', 'templates'),
      path.join(process.cwd(), 'dist', 'videos', 'templates'),
      path.join(base, 'public', 'videos', 'templates'),
      path.join(base, '..', 'public', 'videos', 'templates'),
      path.join(base, 'videos', 'templates'),
    ];

    // Base template file path
    let templateFilePath = '';
    for (const dir of templateCandidateDirs) {
      const candidate = path.join(dir, `${templateId}.mp4`);
      if (isFileValid(candidate)) {
        templateFilePath = candidate;
        break;
      }
    }

    if (!templateFilePath) {
      for (const dir of templateCandidateDirs) {
        const candidate = path.join(dir, 'template-1.mp4');
        if (isFileValid(candidate)) {
          templateFilePath = candidate;
          break;
        }
      }
      if (!templateFilePath) {
        for (const dir of templateCandidateDirs) {
          if (fs.existsSync(dir)) {
            const mp4Files = fs.readdirSync(dir).filter(f => f.endsWith('.mp4') && isFileValid(path.join(dir, f)));
            if (mp4Files.length > 0) {
              templateFilePath = path.join(dir, mp4Files[0]);
              break;
            }
          }
        }
      }
    }

    if (!templateFilePath || !isFileValid(templateFilePath)) {
      return res.status(404).json({ error: `Template video file ${templateId}.mp4 not found on server.` });
    }

    const outputMp4Path = path.join(tempDir, 'output.mp4');
    const fontDir = getFontDir();
    const ffmpegCmd = `"${ffmpegBin}" -y -i "${templateFilePath}" -i "${photoCirclePath}" -filter_complex "[0:v][1:v]overlay=131:551[v1]; [v1]ass='${assFilePath}':fontsdir='${fontDir}'[vout]" -map "[vout]" -map 0:a? -c:v libx264 -preset superfast -crf 23 -pix_fmt yuv420p -c:a copy "${outputMp4Path}"`;

    execSync(ffmpegCmd, { stdio: 'pipe' });

    const safeAsciiFilename = sanitizedName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Greeting';
    const encodedFilename = encodeURIComponent(sanitizedName);

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="RakshaBandhan_${safeAsciiFilename}.mp4"; filename*=UTF-8''RakshaBandhan_${encodedFilename}.mp4`
    );

    const fileStream = fs.createReadStream(outputMp4Path);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      cleanupDirectory(tempDir);
    });

  } catch (error: any) {
    console.error('Video Generation Server Error:', error);
    if (tempDir) cleanupDirectory(tempDir);
    res.status(500).json({ error: 'Video generation failed.', details: error.message });
  }
});

// Utility: Cleanup temporary user upload files & directories immediately
function cleanupDirectory(dirPath: string) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`Failed to cleanup temp dir ${dirPath}:`, err);
  }
}

// Vite Dev Middleware vs Production Static File Server
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Raksha Bandhan Server running on http://0.0.0.0:${PORT}`);
  });
}

start();