// src/lib/api.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * Helper to import api.js fresh each time after we mutate import.meta.env.
 */
async function importFreshApi() {
  // Adjust path if your test file is not in src/lib/
  return import("./api.js?test=" + Math.random());
}

function mockFetchOk(jsonValue) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(jsonValue),
    text: vi.fn().mockResolvedValue(""),
  });
}

function mockFetchNotOk(status, text = "Bad Request") {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: vi.fn(), // shouldn't be called
    text: vi.fn().mockResolvedValue(text),
  });
}

describe("lib/api.js", () => {
  const BASE = "https://example.com/api";

  beforeEach(() => {
    // Ensure env is set BEFORE importing module
    import.meta.env.PUBLIC_API_BASE_URL = BASE;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("throws on import when PUBLIC_API_BASE_URL is missing", async () => {
    // remove env var and dynamically import a fresh copy
    delete import.meta.env.PUBLIC_API_BASE_URL;

    await expect(importFreshApi()).rejects.toThrow(
      /Missing PUBLIC_API_BASE_URL/i
    );
  });

  it("searchModels builds URL with q/year/limit and passes signal to fetch", async () => {
    const data = [{ id: "a" }];
    const fetchMock = mockFetchOk(data);
    vi.stubGlobal("fetch", fetchMock);

    const { searchModels } = await importFreshApi();

    const controller = new AbortController();
    const signal = controller.signal;

    const res = await searchModels({
      q: "camry",
      year: 2020,
      limit: 15,
      signal,
    });

    expect(res).toEqual(data);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe(
      `${BASE}/models?q=camry&year=2020&limit=15`
    );
    expect(options).toEqual({ signal });
  });

  it("searchModels omits optional params when not provided", async () => {
    const data = [];
    const fetchMock = mockFetchOk(data);
    vi.stubGlobal("fetch", fetchMock);

    const { searchModels } = await importFreshApi();

    await searchModels({ q: "", year: undefined, limit: 20, signal: undefined });

    const [url, options] = fetchMock.mock.calls[0];

    // q/year omitted; limit included (default 20)
    expect(url).toBe(`${BASE}/models?limit=20`);
    expect(options).toEqual({ signal: undefined });
  });

  it("searchModels throws API error with status and response text when !ok", async () => {
    const fetchMock = mockFetchNotOk(500, "Server exploded");
    vi.stubGlobal("fetch", fetchMock);

    const { searchModels } = await importFreshApi();

    await expect(
      searchModels({ q: "civic", limit: 10 })
    ).rejects.toThrow(/API error 500: Server exploded/);
  });

  it("getModelById fetches /models/:id and returns json", async () => {
    const payload = { id: "x", make: "Toyota" };
    const fetchMock = mockFetchOk(payload);
    vi.stubGlobal("fetch", fetchMock);

    const { getModelById } = await importFreshApi();

    await expect(getModelById("x")).resolves.toEqual(payload);

    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/models/x`);
  });

  it("getModelById throws API error with status and body text when !ok", async () => {
    const fetchMock = mockFetchNotOk(404, "Not found");
    vi.stubGlobal("fetch", fetchMock);

    const { getModelById } = await importFreshApi();

    await expect(getModelById("nope")).rejects.toThrow(
      /API error 404: Not found/
    );
  });

  it("getModelCard fetches /models/:id/card and returns json", async () => {
    const payload = { id: "m1", canonicalKey: "toyota_camry_le" };
    const fetchMock = mockFetchOk(payload);
    vi.stubGlobal("fetch", fetchMock);

    const { getModelCard } = await importFreshApi();

    await expect(getModelCard("m1")).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/models/m1/card`);
  });

  it("getModelCard throws with response text when !ok", async () => {
    const fetchMock = mockFetchNotOk(400, "Bad card request");
    vi.stubGlobal("fetch", fetchMock);

    const { getModelCard } = await importFreshApi();

    await expect(getModelCard("m1")).rejects.toThrow("Bad card request");
  });

  it("getPriceHistory fetches /price-history with default weeks=26", async () => {
    const payload = { weeks: 26, points: [] };
    const fetchMock = mockFetchOk(payload);
    vi.stubGlobal("fetch", fetchMock);

    const { getPriceHistory } = await importFreshApi();

    await expect(getPriceHistory("m1")).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/models/m1/price-history?weeks=26`
    );
  });

  it("getPriceHistory uses custom weeks", async () => {
    const payload = { weeks: 10, points: [] };
    const fetchMock = mockFetchOk(payload);
    vi.stubGlobal("fetch", fetchMock);

    const { getPriceHistory } = await importFreshApi();

    await getPriceHistory("m1", 10);
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/models/m1/price-history?weeks=10`
    );
  });

  it("getMileageHistogram uses default days=56 and bins=12", async () => {
    const payload = { days: 56, bins: 12, buckets: [] };
    const fetchMock = mockFetchOk(payload);
    vi.stubGlobal("fetch", fetchMock);

    const { getMileageHistogram } = await importFreshApi();

    await getMileageHistogram("m1");
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/models/m1/mileage-histogram?days=56&bins=12`
    );
  });

  it("getMileageHistogram uses custom days and bins", async () => {
    const payload = { days: 30, bins: 20, buckets: [] };
    const fetchMock = mockFetchOk(payload);
    vi.stubGlobal("fetch", fetchMock);

    const { getMileageHistogram } = await importFreshApi();

    await getMileageHistogram("m1", 30, 20);
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/models/m1/mileage-histogram?days=30&bins=20`
    );
  });

  it("getPriceHistory throws with response text when !ok", async () => {
    const fetchMock = mockFetchNotOk(502, "Bad gateway");
    vi.stubGlobal("fetch", fetchMock);

    const { getPriceHistory } = await importFreshApi();

    await expect(getPriceHistory("m1")).rejects.toThrow("Bad gateway");
  });

  it("getMileageHistogram throws with response text when !ok", async () => {
    const fetchMock = mockFetchNotOk(500, "Histogram error");
    vi.stubGlobal("fetch", fetchMock);

    const { getMileageHistogram } = await importFreshApi();

    await expect(getMileageHistogram("m1")).rejects.toThrow("Histogram error");
  });
});
