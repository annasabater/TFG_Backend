// src/utils/exchangeRates.ts
import axios from 'axios';

// Tasas de cambio por defecto (realistas, actualizadas a 2024)
const DEFAULT_EXCHANGE_RATES: Record<string, Record<string, number>> = {
  EUR: { USD: 1.08, GBP: 0.85, JPY: 170, CHF: 0.97, CAD: 1.47, AUD: 1.62, CNY: 7.8, HKD: 8.45, NZD: 1.75, EUR: 1 },
  USD: { EUR: 0.93, GBP: 0.79, JPY: 157, CHF: 0.90, CAD: 1.36, AUD: 1.50, CNY: 7.25, HKD: 7.85, NZD: 1.62, USD: 1 },
  GBP: { EUR: 1.17, USD: 1.27, JPY: 199, CHF: 1.14, CAD: 1.72, AUD: 1.90, CNY: 9.20, HKD: 9.95, NZD: 2.05, GBP: 1 },
  JPY: { EUR: 0.0059, USD: 0.0064, GBP: 0.0050, CHF: 0.0057, CAD: 0.0086, AUD: 0.0095, CNY: 0.046, HKD: 0.050, NZD: 0.010, JPY: 1 },
  CHF: { EUR: 1.03, USD: 1.11, GBP: 0.88, JPY: 175, CAD: 1.51, AUD: 1.67, CNY: 8.10, HKD: 8.75, NZD: 1.80, CHF: 1 },
  CAD: { EUR: 0.68, USD: 0.74, GBP: 0.58, JPY: 116, CHF: 0.66, AUD: 1.11, CNY: 5.37, HKD: 5.80, NZD: 1.19, CAD: 1 },
  AUD: { EUR: 0.62, USD: 0.67, GBP: 0.53, JPY: 104, CHF: 0.60, CAD: 0.90, CNY: 4.85, HKD: 5.25, NZD: 1.07, AUD: 1 },
  CNY: { EUR: 0.13, USD: 0.14, GBP: 0.11, JPY: 21.5, CHF: 0.12, CAD: 0.19, AUD: 0.21, HKD: 1.08, NZD: 0.22, CNY: 1 },
  HKD: { EUR: 0.12, USD: 0.13, GBP: 0.10, JPY: 19.5, CHF: 0.11, CAD: 0.17, AUD: 0.19, CNY: 0.93, NZD: 0.20, HKD: 1 },
  NZD: { EUR: 0.57, USD: 0.62, GBP: 0.49, JPY: 98, CHF: 0.56, CAD: 0.84, AUD: 0.93, CNY: 4.55, HKD: 5.00, NZD: 1 },
};

// Intenta primero exchangerate.host, si falla usa Frankfurter.app (Banco Central Europeo)
export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;
  // 1º intento: exchangerate.host
  try {
    const res = await axios.get(`https://api.exchangerate.host/convert?from=${from}&to=${to}`);
    if (res.data && typeof res.data.result === 'number') {
      return res.data.result;
    }
  } catch {}
  // 2º intento: Frankfurter.app (ECB)
  try {
    const res = await axios.get(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
    if (res.data && res.data.rates && typeof res.data.rates[to] === 'number') {
      return res.data.rates[to];
    }
  } catch {}
  // 3º intento: valor por defecto
  if (DEFAULT_EXCHANGE_RATES[from] && DEFAULT_EXCHANGE_RATES[from][to]) {
    return DEFAULT_EXCHANGE_RATES[from][to];
  }
  throw new Error('No se pudo obtener la tasa de cambio de ninguna fuente pública ni por defecto.');
}
