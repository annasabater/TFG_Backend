import rateLimit from 'express-rate-limit';

// General rate limiter for most endpoints
// General rate limiter for most endpoints
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per second cada 15 minutes
  message: 'Demasiadas peticiones, espera 15 minutos antes de intentarlo de nuevo.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Specific rate limiter for auth/login endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Solo 5 intentos por IP
  message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});