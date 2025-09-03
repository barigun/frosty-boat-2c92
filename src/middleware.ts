import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = async (context, next) => {
  const res = await next();

  // Content Security Policy: allow same-origin assets, inline for now (interactive posts), and no framing.
  // If/when inline scripts are removed, tighten by dropping 'unsafe-inline' and adding nonces.
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    'object-src none',
    'base-uri self',
    'form-action self',
    'upgrade-insecure-requests',
  ].join('; ');

  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Permissions-Policy', [
    'accelerometer=()',
    'camera=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=()',
    'usb=()',
  ].join(', '));
  // 1 year HSTS; requires HTTPS (Cloudflare provides). Adjust if serving on subdomains later.
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Opt into COOP for better isolation without requiring COEP.
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  // Prevent other origins from fetching your assets cross-origin by default.
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  return res;
};
