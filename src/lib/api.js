const API_BASE = import.meta.env.PUBLIC_API_BASE_URL;

if (!API_BASE) {
  throw new Error("Missing PUBLIC_API_BASE_URL. Add it to .env");
}

export async function searchModels({ q, year, limit = 20, signal }) {
  const url = new URL(`${API_BASE}/models`);

  if (q) url.searchParams.set("q", q);
  if (year) url.searchParams.set("year", String(year));
  if (limit) url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), { signal }); // ✅ here
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function getModelById(id) {
  const res = await fetch(`${API_BASE}/models/${id}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function getModelCard(id) {
  const res = await fetch(`${API_BASE}/models/${id}/card`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getPriceHistory(id, weeks = 26) {
  const res = await fetch(`${API_BASE}/models/${id}/price-history?weeks=${weeks}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getMileageHistogram(id, days = 56, bins = 12) {
  const res = await fetch(`${API_BASE}/models/${id}/mileage-histogram?days=${days}&bins=${bins}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}