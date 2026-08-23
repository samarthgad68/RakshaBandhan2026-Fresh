/**
 * API configuration and utility helpers for backend communication and Razorpay integration.
 */

export function getApiBaseUrl(): string {
  // Support custom backend URL (e.g. Render backend URL configured in VITE_API_BASE_URL or VITE_BACKEND_URL)
  const envUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || '').trim();
  return envUrl.replace(/\/+$/, '');
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${normalizedPath}` : normalizedPath;
}

let razorpayScriptPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise<boolean>((resolve) => {
    // 1. If Razorpay is already available on window, resolve immediately
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    // 2. Helper to poll for window.Razorpay in case script is in-flight or already added
    const pollForRazorpay = (maxAttempts = 25): Promise<boolean> => {
      return new Promise((res) => {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if ((window as any).Razorpay) {
            clearInterval(interval);
            res(true);
          } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            res(false);
          }
        }, 100);
      });
    };

    // 3. Check for existing script tag in DOM
    const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existingScript) {
      pollForRazorpay().then((loaded) => {
        if (loaded) {
          resolve(true);
        } else {
          // If existing script failed, attach load listener or inject clean script
          existingScript.addEventListener('load', () => resolve(Boolean((window as any).Razorpay)));
          existingScript.addEventListener('error', () => resolve(false));
          setTimeout(() => resolve(Boolean((window as any).Razorpay)), 1500);
        }
      });
      return;
    }

    // 4. Inject fresh script tag into head
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      pollForRazorpay(10).then((loaded) => resolve(loaded || Boolean((window as any).Razorpay)));
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay Checkout SDK');
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return razorpayScriptPromise;
}
