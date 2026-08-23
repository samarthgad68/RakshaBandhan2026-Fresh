/**
 * API configuration and utility helpers for backend communication and Razorpay integration.
 */

export function getApiBaseUrl(): string {
  // Support custom backend URL (e.g. Render backend URL configured in VITE_API_BASE_URL or VITE_BACKEND_URL)
  const envUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || '').trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  return '';
}

export function apiUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${normalizedPath}` : normalizedPath;
}

let razorpayScriptPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  
  if (typeof (window as any).Razorpay === 'function') {
    return Promise.resolve(true);
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise<boolean>((resolve) => {
    // Quick polling helper in case Razorpay is in the process of initializing
    const checkExistingInterval = setInterval(() => {
      if (typeof (window as any).Razorpay === 'function') {
        clearInterval(checkExistingInterval);
        resolve(true);
      }
    }, 100);

    // Timeout polling after 4 seconds
    setTimeout(() => {
      clearInterval(checkExistingInterval);
      if (typeof (window as any).Razorpay === 'function') {
        resolve(true);
      }
    }, 4000);

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      if (typeof (window as any).Razorpay === 'function') {
        clearInterval(checkExistingInterval);
        resolve(true);
        return;
      }
      existingScript.addEventListener('load', () => {
        clearInterval(checkExistingInterval);
        resolve(true);
      });
      existingScript.addEventListener('error', () => {
        clearInterval(checkExistingInterval);
        razorpayScriptPromise = null;
        resolve(false);
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      clearInterval(checkExistingInterval);
      resolve(true);
    };
    script.onerror = () => {
      clearInterval(checkExistingInterval);
      console.error('Failed to load Razorpay Checkout SDK from https://checkout.razorpay.com/v1/checkout.js');
      razorpayScriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

