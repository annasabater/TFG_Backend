// src/utils/exchangeRates.ts
import axios from 'axios';

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
  throw new Error('No se pudo obtener la tasa de cambio de ninguna fuente pública.');
}
