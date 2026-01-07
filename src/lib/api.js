const API_BASE = import.meta.env.PUBLIC_API_BASE_URL;

if (!API_BASE) {
  throw new Error("Missing PUBLIC_API_BASE_URL. Add it to .env");
}

export async function searchModels({ q, year, limit = 20 }) {
  const url = new URL(`${API_BASE}/models`);

  if (q) url.searchParams.set("q", q);
  if (year) url.searchParams.set("year", String(year));
  if (limit) url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString());
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