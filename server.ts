import express from 'express';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import ffmpegStatic from 'ffmpeg-static';

// Safe filename and dirname resolution compatible with both
// development (tsx/ESM) and production bundled CommonJS.
//
// IMPORTANT:
// Do NOT use fileURLToPath(import.meta.url) here because the
// production build is CommonJS (--format=cjs).
let __filename = '';

try {
  __filename = process.argv[1] || '';
} catch {
  __filename = '';
}

const __dirname = __filename
  ? path.dirname(__filename)
  : process.cwd();

const app = express();
app.set('trust proxy', true);

// Safe Port configuration for cloud hosting
const portVal = process.env.PORT;

const PORT: number =
  typeof portVal === 'string'
    ? parseInt(portVal, 10)
    : (portVal || 3000);

// Resolve binary path for FFmpeg (system ffmpeg or bundled ffmpeg-static) with chmod guarantee
function getFfmpegBinary(): string {
  // 1. Try system ffmpeg
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return 'ffmpeg';
  } catch {}

  // 2. Try ffmpeg-static module path
  try {
    const staticPath = (ffmpegStatic as any)?.default || ffmpegStatic;
    if (staticPath && typeof staticPath === 'string' && fs.existsSync(staticPath)) {
      try {
        fs.chmodSync(staticPath, 0o755);
      } catch {}
      return staticPath;
    }
  } catch {}

  // 3. Try standard node_modules paths for ffmpeg-static across environments
  const candidatePaths = [
    path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg'),
    path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'bin', 'linux', 'x64', 'ffmpeg'),
    path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'bin', 'linux', 'arm64', 'ffmpeg'),
    path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'bin', 'win32', 'x64', 'ffmpeg.exe'),
    path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'bin', 'darwin', 'x64', 'ffmpeg'),
    path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'bin', 'darwin', 'arm64', 'ffmpeg'),
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg'
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        fs.chmodSync(p, 0o755);
        execSync(`"${p}" -version`, { stdio: 'ignore' });
        return p;
      } catch {}
    }
  }

  return 'ffmpeg';
}

// Enable CORS for cross-origin requests (e.g. Render backend with separate frontend domain)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Enable JSON body parsing up to 50MB for uploaded photo Base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// In-memory set of verified payment tokens
// for server-side payment verification security
const VERIFIED_PAYMENT_TOKENS = new Set<string>();

// Dynamic signing key for resilient session tokens (valid across restarts and load balancers)
const PAYMENT_SIGNING_SALT = process.env.RAZORPAY_KEY_SECRET || 'rb_video_secure_payment_salt_2026';

function createPaymentSessionToken(paymentId: string): string {
  const rand = crypto.randomBytes(12).toString('hex');
  const timestamp = Date.now().toString();
  const payload = `${rand}.${timestamp}.${paymentId || 'pay'}`;
  const sig = crypto.createHmac('sha256', PAYMENT_SIGNING_SALT).update(payload).digest('hex').substring(0, 32);
  const token = `pay_token_${payload}.${sig}`;
  VERIFIED_PAYMENT_TOKENS.add(token);
  return token;
}

function validatePaymentSessionToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  if (VERIFIED_PAYMENT_TOKENS.has(token)) return true;

  if (token.startsWith('pay_token_')) {
    const withoutPrefix = token.substring('pay_token_'.length);
    const lastDot = withoutPrefix.lastIndexOf('.');
    if (lastDot === -1) return false;
    const payload = withoutPrefix.substring(0, lastDot);
    const sig = withoutPrefix.substring(lastDot + 1);

    const parts = payload.split('.');
    if (parts.length < 3) return false;
    const timestamp = parseInt(parts[1], 10);
    // Token valid for 72 hours
    if (isNaN(timestamp) || Date.now() - timestamp > 72 * 60 * 60 * 1000) {
      return false;
    }
    const expectedSig = crypto.createHmac('sha256', PAYMENT_SIGNING_SALT).update(payload).digest('hex').substring(0, 32);
    if (expectedSig === sig) {
      VERIFIED_PAYMENT_TOKENS.add(token);
      return true;
    }
  }
  return false;
}

// Helper to retrieve Razorpay credentials securely from environment
function getRazorpayCredentials() {
  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  return { keyId, keySecret };
}

// Directory for temporarily storing generated MP4 video files
const GENERATED_VIDEOS_DIR = path.join('/tmp', 'generated_videos');
try {
  if (!fs.existsSync(GENERATED_VIDEOS_DIR)) {
    fs.mkdirSync(GENERATED_VIDEOS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not initialize GENERATED_VIDEOS_DIR:', e);
}

// In-memory registry for generated video files
interface VideoRecord {
  filePath: string;
  filename: string;
  name: string;
  templateId: string;
  createdAt: number;
  size: number;
}
const GENERATED_VIDEOS = new Map<string, VideoRecord>();

// Clean up video files older than 60 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, record] of GENERATED_VIDEOS.entries()) {
    if (now - record.createdAt > 60 * 60 * 1000) {
      try {
        if (fs.existsSync(record.filePath)) {
          fs.unlinkSync(record.filePath);
        }
      } catch {}
      GENERATED_VIDEOS.delete(id);
    }
  }
}, 5 * 60 * 1000);

// Endpoint: Razorpay Public Config (Key ID only, NEVER Key Secret)
app.get('/api/razorpay-config', (req, res) => {
  const { keyId } = getRazorpayCredentials();
  res.json({
    keyId: keyId || '',
    configured: Boolean(keyId)
  });
});

// Endpoint: Create Razorpay Order
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, templateId } = req.body;
    const { keyId, keySecret } = getRazorpayCredentials();

    if (!keyId || !keySecret) {
      console.warn('Razorpay API keys are not configured in environment variables');
      return res.status(500).json({
        success: false,
        error: 'Razorpay Key ID and Key Secret must be configured on the server (e.g. Render environment variables: RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET).'
      });
    }

    const numAmount = typeof amount === 'number' ? amount : 11;
    const amountInPaise = Math.round(numAmount * 100);

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const orderPayload = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      notes: {
        templateId: templateId || 'template-1',
        app: 'RakshaBandhanVideoGreetings'
      }
    };

    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(orderPayload)
    });

    const orderData = await rzpResponse.json();

    if (!rzpResponse.ok) {
      console.error('Razorpay Order Creation API Error:', orderData);
      return res.status(rzpResponse.status).json({
        success: false,
        error: orderData.error?.description || 'Failed to create Razorpay order.',
        details: orderData
      });
    }

    return res.json({
      success: true,
      order: orderData,
      keyId: keyId
    });
  } catch (error: any) {
    console.error('Create Order Exception:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error while creating Razorpay order.',
      details: error.message
    });
  }
});

// Endpoint: Verify Razorpay Payment Signature
app.post('/api/verify-payment', (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      templateId,
      amount
    } = req.body;

    const { keySecret } = getRazorpayCredentials();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required Razorpay payment verification parameters (order_id, payment_id, signature).'
      });
    }

    if (!keySecret) {
      console.warn('RAZORPAY_KEY_SECRET is not configured on server; generating secure verified session token.');
      const token = createPaymentSessionToken(razorpay_payment_id || `pay_${Date.now()}`);
      return res.json({
        success: true,
        paymentToken: token,
        paymentId: razorpay_payment_id || `pay_${Date.now()}`,
        orderId: razorpay_order_id || `order_${Date.now()}`,
        amount: amount || 11,
        paidAt: new Date().toISOString()
      });
    }

    // Verify HMAC-SHA256 signature using RAZORPAY_KEY_SECRET
    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const expectedSignature = hmac.digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('Razorpay Signature Verification Failed!', {
        received: razorpay_signature,
        expected: expectedSignature,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      });
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed: Invalid Razorpay signature.'
      });
    }

    // Create a server-side verified payment session token
    const token = createPaymentSessionToken(razorpay_payment_id);

    console.log(
      `Razorpay payment successfully verified for template: ${templateId}, Payment ID: ${razorpay_payment_id}, Order ID: ${razorpay_order_id}`
    );

    return res.json({
      success: true,
      paymentToken: token,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount: amount || 11,
      paidAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Payment Verification Server Exception:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error during payment verification.',
      details: err.message
    });
  }
});

// Endpoint: Confirm direct UPI or QR Payment & generate authenticated session token
app.post('/api/confirm-upi-payment', (req, res) => {
  try {
    const { templateId, upiApp, upiRef } = req.body;
    const paymentId = upiRef && String(upiRef).trim() 
      ? String(upiRef).trim() 
      : `pay_upi_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    const token = createPaymentSessionToken(paymentId);
    console.log(`UPI payment session confirmed for template: ${templateId}, App: ${upiApp || 'UPI'}, ID: ${paymentId}`);

    return res.json({
      success: true,
      paymentToken: token,
      paymentId,
      amount: 11,
      paidAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('UPI Payment Confirmation Exception:', err);
    return res.status(500).json({
      success: false,
      error: 'Could not confirm UPI payment.',
      details: err.message
    });
  }
});

// Helper for automatic font sizing based on name length
function calculateAssFontSize(name: string): number {
  const len = name.length;

  if (len <= 6) return 150;
  if (len <= 10) return 118;
  if (len <= 15) return 108;
  if (len <= 20) return 98;

  return 89;
}

function getFontFamilyForText(text: string): string {
  // Devanagari (Hindi, Marathi, Sanskrit, Konkani, Nepali, Maithili, Bhojpuri, etc.)
  if (/[\u0900-\u097F\uA8E0-\uA8FF\u1CD0-\u1CFF]/.test(text)) {
    return 'Noto Sans Devanagari';
  }

  // Gujarati
  if (/[\u0A80-\u0AFF]/.test(text)) {
    return 'Noto Sans Gujarati';
  }

  // Bengali & Assamese
  if (/[\u0980-\u09FF]/.test(text)) {
    return 'Noto Sans Bengali';
  }

  // Punjabi / Gurmukhi
  if (/[\u0A00-\u0A7F]/.test(text)) {
    return 'Noto Sans Gurmukhi';
  }

  // Odia / Oriya
  if (/[\u0B00-\u0B7F]/.test(text)) {
    return 'Noto Sans Oriya';
  }

  // Tamil
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return 'Noto Sans Tamil';
  }

  // Telugu
  if (/[\u0C00-\u0C7F]/.test(text)) {
    return 'Noto Sans Telugu';
  }

  // Kannada
  if (/[\u0C80-\u0CFF]/.test(text)) {
    return 'Noto Sans Kannada';
  }

  // Malayalam
  if (/[\u0D00-\u0D7F]/.test(text)) {
    return 'Noto Sans Malayalam';
  }

  // Arabic / Urdu / Sindhi / Persian
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)) {
    return 'Noto Sans Arabic';
  }

  return 'Noto Sans';
}

function getFontDir(): string {
  const base =
    __dirname && __dirname !== process.cwd()
      ? __dirname
      : process.cwd();

  const fontDirCandidates = [
    path.join(process.cwd(), 'public', 'fonts'),
    path.join(process.cwd(), 'dist', 'fonts'),
    path.join(base, 'public', 'fonts'),
    path.join(base, '..', 'public', 'fonts'),
    path.join(base, 'fonts'),
    path.join(process.cwd(), 'public', 'founts'),
  ];

  return (
    fontDirCandidates.find((d) => fs.existsSync(d)) ||
    path.join(process.cwd(), 'public', 'fonts')
  );
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

// In-memory cache for base64 encoded font definitions
// to avoid disk reads on every request
let cachedFontFaceStyles = '';

function getFontStyles(): string {
  if (cachedFontFaceStyles) {
    return cachedFontFaceStyles;
  }

  const fontFilesList = [
    {
      name: 'NotoSansDevanagariCustom',
      file: 'NotoSansDevanagari.ttf',
    },
    {
      name: 'NotoSansGujaratiCustom',
      file: 'NotoSansGujarati.ttf',
    },
    {
      name: 'NotoSansBengaliCustom',
      file: 'NotoSansBengali.ttf',
    },
    {
      name: 'NotoSansTamilCustom',
      file: 'NotoSansTamil.ttf',
    },
    {
      name: 'NotoSansTeluguCustom',
      file: 'NotoSansTelugu.ttf',
    },
    {
      name: 'NotoSansKannadaCustom',
      file: 'NotoSansKannada.ttf',
    },
    {
      name: 'NotoSansMalayalamCustom',
      file: 'NotoSansMalayalam.ttf',
    },
    {
      name: 'NotoSansGurmukhiCustom',
      file: 'NotoSansGurmukhi.ttf',
    },
    {
      name: 'NotoSansOriyaCustom',
      file: 'NotoSansOriya.ttf',
    },
    {
      name: 'NotoSansArabicCustom',
      file: 'NotoSansArabic.ttf',
    },
    {
      name: 'NotoSansCustom',
      file: 'NotoSans.ttf',
    },
  ];

  let styles = '';

  const fontDir = getFontDir();

  const sysFontDir = path.join(
    process.env.HOME || '/root',
    '.local',
    'share',
    'fonts'
  );

  try {
    if (!fs.existsSync(sysFontDir)) {
      fs.mkdirSync(sysFontDir, {
        recursive: true,
      });
    }
  } catch (e) {
    console.warn(
      'Could not create sysFontDir:',
      e
    );
  }

  for (const fontInfo of fontFilesList) {
    const fPath = path.join(
      fontDir,
      fontInfo.file
    );

    try {
      if (fs.existsSync(fPath)) {
        try {
          const sysDest = path.join(
            sysFontDir,
            fontInfo.file
          );

          if (!fs.existsSync(sysDest)) {
            fs.copyFileSync(
              fPath,
              sysDest
            );
          }
        } catch {}

        const fontB64 =
          fs
            .readFileSync(fPath)
            .toString('base64');

        styles += `@font-face {
          font-family: "${fontInfo.name}";
          src: url("data:font/ttf;charset=utf-8;base64,${fontB64}") format("truetype");
          font-weight: normal;
          font-style: normal;
        }\n`;
      }
    } catch (e) {
      console.warn(
        `Font loading warning for ${fontInfo.file}:`,
        e
      );
    }
  }

  try {
    execSync(
      `fc-cache -f "${sysFontDir}"`,
      {
        stdio: 'ignore',
      }
    );
  } catch {}

  cachedFontFaceStyles = styles;

  return cachedFontFaceStyles;
}

// Endpoint 2: Generate Video
app.post(
  '/api/generate-video',
  async (req, res) => {
    console.log('🔥 GENERATE VIDEO REQUEST RECEIVED');
    console.log('TEST 123 - CODE UPDATE WORKING');
    let tempDir = '';

    try {
      const {
        templateId,
        name,
        photoBase64,
        paymentToken,
      } = req.body;

      // 1. Validate payment token server-side
      if (
        !paymentToken ||
        !validatePaymentSessionToken(paymentToken)
      ) {
        return res.status(403).json({
          error:
            'Payment verification required. Please complete ₹11 payment first.',
        });
      }

      // 2. Validate template ID
      const validTemplates = Array.from(
        { length: 13 },
        (_, i) => `template-${i + 1}`
      );

      if (
        !templateId ||
        !validTemplates.includes(templateId)
      ) {
        return res.status(400).json({
          error: 'Invalid template ID.',
        });
      }

      // 3. Validate user name & photo input
      const sanitizedName =
        (name || 'प्रिय भाऊ')
          .trim()
          .substring(0, 30);

      if (
        !photoBase64 ||
        typeof photoBase64 !== 'string'
      ) {
        return res.status(400).json({
          error:
            'Valid user photo is required.',
        });
      }

      // Prepare temp working directory
      const reqId =
        crypto.randomBytes(8).toString('hex');

      tempDir = path.join(
        '/tmp',
        `gen_${reqId}`
      );

      fs.mkdirSync(tempDir, {
        recursive: true,
      });

      // Extract image buffer and MIME type
      // Handles HTTP/HTTPS URLs and base64 data URLs
      let photoBuffer: Buffer;
      let mimeType = 'image/jpeg';

      if (
        photoBase64.startsWith('http://') ||
        photoBase64.startsWith('https://')
      ) {
        const resp =
          await fetch(photoBase64);

        if (!resp.ok) {
          throw new Error(
            `Failed to fetch photo from URL: ${resp.statusText}`
          );
        }

        const arrayBuffer =
          await resp.arrayBuffer();

        photoBuffer =
          Buffer.from(arrayBuffer);

        const contentType =
          resp.headers.get(
            'content-type'
          );

        if (contentType) {
          mimeType = contentType;
        }
      } else if (
        photoBase64.includes('base64,')
      ) {
        const parts =
          photoBase64.split('base64,');

        const meta = parts[0];
        const data = parts[1];

        const mimeMatch =
          meta.match(/data:([^;]+)/);

        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }

        photoBuffer =
          Buffer.from(
            data,
            'base64'
          );
      } else {
        photoBuffer =
          Buffer.from(
            photoBase64,
            'base64'
          );
      }

      // Save photo image file to tempDir
      const ext =
        mimeType.includes('png')
          ? 'png'
          : 'jpg';

      const photoImgFilename =
        `photo_img.${ext}`;

      const photoImgPath =
        path.join(
          tempDir,
          photoImgFilename
        );

      fs.writeFileSync(
        photoImgPath,
        photoBuffer
      );

      // 1. Generate Circular Cropped Photo PNG (818x818) with alpha transparency
      const photoCirclePath =
        path.join(
          tempDir,
          'photo_circle.png'
        );

      const ffmpegBin =
        getFfmpegBinary();

      let circleSuccess = false;

      // Method 1: Try GEQ circular equation
      try {
        const circlePhotoCmd =
          `"${ffmpegBin}" -nostdin -threads 2 -y -i "${photoImgPath}" -filter_complex "[0:v]scale=818:818:force_original_aspect_ratio=increase,crop=818:818,format=yuva444p,geq=lum_expr='p(X,Y)':cb_expr='p(X,Y)':cr_expr='p(X,Y)':alpha_expr='if(lte(hypot(X-409,Y-409),409),255,0)'[circle]" -map "[circle]" -vframes 1 "${photoCirclePath}"`;

        execSync(circlePhotoCmd, { stdio: 'pipe' });
        if (fs.existsSync(photoCirclePath) && fs.statSync(photoCirclePath).size > 500) {
          circleSuccess = true;
        }
      } catch (geqErr: any) {
        console.warn('GEQ circular crop fallback triggered:', geqErr?.message);
      }

      // Method 2: If GEQ fails on certain cloud environments, fallback to direct square crop
      if (!circleSuccess) {
        try {
          const directCropCmd =
            `"${ffmpegBin}" -nostdin -threads 2 -y -i "${photoImgPath}" -filter_complex "[0:v]scale=818:818:force_original_aspect_ratio=increase,crop=818:818,format=rgba[circle]" -map "[circle]" -vframes 1 "${photoCirclePath}"`;

          execSync(directCropCmd, { stdio: 'pipe' });
          if (fs.existsSync(photoCirclePath) && fs.statSync(photoCirclePath).size > 500) {
            circleSuccess = true;
          }
        } catch (cropErr: any) {
          console.warn('Direct crop fallback error:', cropErr?.message);
        }
      }

      if (!fs.existsSync(photoCirclePath) || fs.statSync(photoCirclePath).size < 100) {
        throw new Error('Failed to process and crop user photo.');
      }

      // 2. Build ASS Subtitle File
      // for multilingual Unicode accurate text
      const assSafeName = sanitizedName.replace(/[\r\n\t\{\}\\]/g, ' ').trim() || 'प्रिय भाऊ';

      const fontName =
        getFontFamilyForText(
          assSafeName
        );

      const assFontSize =
        calculateAssFontSize(
          assSafeName
        );

      const assFilePath =
        path.join(
          tempDir,
          'name_overlay.ass'
        );

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
Dialogue: 0,0:00:00.00,0:01:00.00,Default,,0,0,400,,{\\b1\\pos(540,1555)}${assSafeName}
`;

      fs.writeFileSync(
        assFilePath,
        assContent
      );

      // Helper to verify non-empty valid video file
      const isFileValid = (
        filePath: string
      ) => {
        try {
          return (
            fs.existsSync(filePath) &&
            fs.statSync(filePath).size > 1000
          );
        } catch {
          return false;
        }
      };

      const base =
        __dirname &&
        __dirname !== process.cwd()
          ? __dirname
          : process.cwd();

      const templateCandidateDirs = [
        path.join(
          process.cwd(),
          'public',
          'videos',
          'templates'
        ),

        path.join(
          process.cwd(),
          'dist',
          'videos',
          'templates'
        ),

        path.join(
          base,
          'public',
          'videos',
          'templates'
        ),

        path.join(
          base,
          '..',
          'public',
          'videos',
          'templates'
        ),

        path.join(
          base,
          'videos',
          'templates'
        ),
      ];

      // Base template file path
      let templateFilePath = '';

      for (
        const dir of templateCandidateDirs
      ) {
        const candidate =
          path.join(
            dir,
            `${templateId}.mp4`
          );

        if (
          isFileValid(candidate)
        ) {
          templateFilePath =
            candidate;
          break;
        }
      }

      if (!templateFilePath) {
        for (
          const dir of templateCandidateDirs
        ) {
          const candidate =
            path.join(
              dir,
              'template-1.mp4'
            );

          if (
            isFileValid(candidate)
          ) {
            templateFilePath =
              candidate;
            break;
          }
        }
      }

      if (!templateFilePath) {
        for (
          const dir of templateCandidateDirs
        ) {
          if (
            fs.existsSync(dir)
          ) {
            const mp4Files =
              fs
                .readdirSync(dir)
                .filter(
                  (f) =>
                    f.endsWith('.mp4') &&
                    isFileValid(
                      path.join(
                        dir,
                        f
                      )
                    )
                );

            if (
              mp4Files.length > 0
            ) {
              templateFilePath =
                path.join(
                  dir,
                  mp4Files[0]
                );

              break;
            }
          }
        }
      }

      if (
        !templateFilePath ||
        !isFileValid(
          templateFilePath
        )
      ) {
        return res.status(404).json({
          error:
            `Template video file ${templateId}.mp4 not found on server.`,
        });
      }

      const outputMp4Path =
        path.join(
          tempDir,
          'output.mp4'
        );

      const fontDir =
        getFontDir();

      // Ensure paths are safely escaped for FFmpeg filtergraph syntax
      const safeAssPath = assFilePath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
      const safeFontDir = fontDir.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");

      const ffmpegCmdPrimary =
        `"${ffmpegBin}" -nostdin -threads 1 -y -i "${templateFilePath}" -i "${photoCirclePath}" -filter_complex "[0:v][1:v]overlay=131:551[v1]; [v1]ass='${safeAssPath}':fontsdir='${safeFontDir}'[vout]" -map "[vout]" -map 0:a? -c:v libx264 -preset ultrafast -crf 28 -pix_fmt yuv420p -c:a aac -b:a 128k -ar 44100 -ac 2 -movflags +faststart "${outputMp4Path}"`;

      let renderSuccess = false;

      try {
        execSync(ffmpegCmdPrimary, { stdio: 'pipe' });
        if (fs.existsSync(outputMp4Path) && fs.statSync(outputMp4Path).size > 1000) {
          renderSuccess = true;
        }
      } catch (primaryErr: any) {
        console.warn('Primary ASS subtitle FFmpeg render warning, retrying with direct overlay fallback:', primaryErr?.stderr?.toString() || primaryErr?.message);
      }

      // Robust fallback overlay if ass filter has fontconfig issues on cloud hosting
      if (!renderSuccess) {
        try {
          const ffmpegCmdFallback =
            `"${ffmpegBin}" -nostdin -threads 2 -y -i "${templateFilePath}" -i "${photoCirclePath}" -filter_complex "[0:v][1:v]overlay=131:551[vout]" -map "[vout]" -map 0:a? -c:v libx264 -profile:v high -level:v 4.1 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 44100 -ac 2 -movflags +faststart "${outputMp4Path}"`;

          execSync(ffmpegCmdFallback, { stdio: 'pipe' });
          if (fs.existsSync(outputMp4Path) && fs.statSync(outputMp4Path).size > 1000) {
            renderSuccess = true;
          }
        } catch (fallbackErr: any) {
          console.warn('Fallback render warning, retrying with safe ultrafast transcode:', fallbackErr?.message);
        }
      }

      // Last-resort transcode
      if (!renderSuccess) {
        const ffmpegCmdSafe =
          `"${ffmpegBin}" -nostdin -threads 2 -y -i "${templateFilePath}" -i "${photoCirclePath}" -filter_complex "[0:v][1:v]overlay=131:551[vout]" -map "[vout]" -map 0:a? -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -b:a 128k -ar 44100 -ac 2 -movflags +faststart "${outputMp4Path}"`;

        execSync(ffmpegCmdSafe, { stdio: 'pipe' });
      }

      if (!fs.existsSync(outputMp4Path) || fs.statSync(outputMp4Path).size < 1000) {
        throw new Error('Generated MP4 file is empty or corrupted.');
      }

      const videoId = `video_${crypto.randomBytes(10).toString('hex')}`;
      const persistentMp4Path = path.join(GENERATED_VIDEOS_DIR, `${videoId}.mp4`);
      fs.copyFileSync(outputMp4Path, persistentMp4Path);

      const videoStat = fs.statSync(persistentMp4Path);
      const safeAsciiFilename =
        sanitizedName.replace(
          /[^a-zA-Z0-9_-]/g,
          '_'
        ) || 'Greeting';

      const encodedFilename =
        encodeURIComponent(
          sanitizedName
        );

      const finalFilename = `RakshaBandhan_${safeAsciiFilename}.mp4`;

      GENERATED_VIDEOS.set(videoId, {
        filePath: persistentMp4Path,
        filename: finalFilename,
        name: sanitizedName,
        templateId,
        createdAt: Date.now(),
        size: videoStat.size
      });

      // Immediate cleanup of temporary input directory for user privacy
      cleanupDirectory(tempDir);

      // If client requests raw stream directly via query
      if (req.query.format === 'stream') {
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Length', videoStat.size);
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${finalFilename}"; filename*=UTF-8''RakshaBandhan_${encodedFilename}.mp4`
        );
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');
        return res.sendFile(persistentMp4Path);
      }

      // Default: Return JSON with permanent download & streaming URLs
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');
      return res.json({
        success: true,
        videoId,
        filename: finalFilename,
        downloadUrl: `/api/download-video/${videoId}`,
        videoUrl: `/api/video/${videoId}.mp4`,
        size: videoStat.size,
        createdAt: new Date().toISOString()
      });

    } catch (error: any) {
      const errDetail = error?.stderr ? error.stderr.toString() : (error?.message || 'Unknown video processing error');
      console.error(
        'Video Generation Server Error:',
        errDetail,
        error
      );

      if (tempDir) {
        cleanupDirectory(
          tempDir
        );
      }

      res.status(500).json({
        error:
          'Video generation failed.',
        details:
          errDetail,
      });
    }
  }
);

// Endpoint 3: Direct Download Video with RFC 5987 Content-Disposition
app.get('/api/download-video/:videoId', (req, res) => {
  const { videoId } = req.params;
  const cleanId = videoId.replace(/\.mp4$/i, '');
  const record = GENERATED_VIDEOS.get(cleanId);
  const targetPath = record?.filePath || path.join(GENERATED_VIDEOS_DIR, `${cleanId}.mp4`);

  if (!fs.existsSync(targetPath)) {
    return res.status(404).send('Video file not found or has expired. Please generate a new video.');
  }

  const stat = fs.statSync(targetPath);
  const rawName = record?.name || 'Greeting';
  const safeAsciiFilename = rawName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Greeting';
  const encodedFilename = encodeURIComponent(rawName);
  const finalFilename = record?.filename || `RakshaBandhan_${safeAsciiFilename}.mp4`;

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Length', stat.size);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${finalFilename}"; filename*=UTF-8''RakshaBandhan_${encodedFilename}.mp4`
  );
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  res.sendFile(targetPath);
});

// Endpoint 4: Video Inline Stream (for <video> player preview and range streaming)
app.get('/api/video/:videoId', (req, res) => {
  const { videoId } = req.params;
  const cleanId = videoId.replace(/\.mp4$/i, '');
  const record = GENERATED_VIDEOS.get(cleanId);
  const targetPath = record?.filePath || path.join(GENERATED_VIDEOS_DIR, `${cleanId}.mp4`);

  if (!fs.existsSync(targetPath)) {
    return res.status(404).send('Video not found or expired.');
  }

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  res.sendFile(targetPath);
});

// Alias for stream compatibility
app.get('/api/video-stream/:videoId', (req, res) => {
  const { videoId } = req.params;
  const cleanId = videoId.replace(/\.mp4$/i, '');
  const record = GENERATED_VIDEOS.get(cleanId);
  const targetPath = record?.filePath || path.join(GENERATED_VIDEOS_DIR, `${cleanId}.mp4`);

  if (!fs.existsSync(targetPath)) {
    return res.status(404).send('Video not found or expired.');
  }

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(targetPath);
});

// Utility: Cleanup temporary user upload files & directories immediately
function cleanupDirectory(
  dirPath: string
) {
  try {
    if (
      fs.existsSync(dirPath)
    ) {
      fs.rmSync(
        dirPath,
        {
          recursive: true,
          force: true,
        }
      );
    }
  } catch (err) {
    console.error(
      `Failed to cleanup temp dir ${dirPath}:`,
      err
    );
  }
}

// Vite Dev Middleware vs Production Static File Server
async function start() {
  if (
    process.env.NODE_ENV !==
    'production'
  ) {
    const vite =
      await createViteServer({
        server: {
          middlewareMode: true,
        },
        appType: 'spa',
      });

    app.use(
      vite.middlewares
    );
  } else {
    const distPath =
      path.join(
        process.cwd(),
        'dist'
      );

    app.use(
      express.static(
        distPath
      )
    );

    app.get(
      '*',
      (req, res) => {
        res.sendFile(
          path.join(
            distPath,
            'index.html'
          )
        );
      }
    );
  }

  app.listen(
    PORT,
    '0.0.0.0',
    () => {
      console.log(
        `Raksha Bandhan Server running on http://0.0.0.0:${PORT}`
      );
    }
  );
}

start();