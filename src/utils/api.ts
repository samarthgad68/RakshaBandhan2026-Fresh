/**
 * API configuration and utility helpers for backend communication
 * and Razorpay integration.
 */

export function getApiBaseUrl(): string {
  const envUrl = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    ''
  ).trim();

  return envUrl.replace(/\/+$/, '');
}

export function apiUrl(path: string): string {
  if (!path) return '';

  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
    return path;
  }

  const base = getApiBaseUrl();

  const normalizedPath = path.startsWith('/')
    ? path
    : `/${path}`;

  return base
    ? `${base}${normalizedPath}`
    : normalizedPath;
}

let razorpayScriptPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  if ((window as any).Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise<boolean>((resolve) => {
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');

    script.src =
      'https://checkout.razorpay.com/v1/checkout.js';

    script.async = true;

    script.onload = () => {
      console.log('Razorpay Checkout SDK loaded successfully');
      resolve(true);
    };

    script.onerror = () => {
      console.error(
        'Failed to load Razorpay Checkout SDK'
      );
      resolve(false);
    };

    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}