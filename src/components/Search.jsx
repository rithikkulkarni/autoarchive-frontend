import React, { useEffect, useMemo, useState } from "react";
import { searchModels, getModelCard } from "../lib/api.js";

function formatMoney(n) {
  if (n === null || n === undefined) return "—";
  return `$${Number(n).toLocaleString()}`;
}

function formatMiles(n) {
  if (n === null || n === undefined) return "—";
  return `${Number(n).toLocaleString()} mi`;
}

function formatDate(value) {
  if (!value) return "—";
  // Works for "YYYY-MM-DD"
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function daysAgo(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default function Search() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [error, setError] = useState("");

  const trimmed = q.trim();
  const canSearch = trimmed.length >= 2;

  useEffect(() => {
    if (!canSearch) {
      setResults([]);
      setStatus("idle");
      setError("");
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      try {
        setStatus("loading");
        setError("");

        const data = await searchModels({
          q: trimmed,
          limit: 15,
          signal: controller.signal,
        });

        const models = Array.isArray(data) ? data : [];
        const cards = await Promise.all(models.map((m) => getModelCard(m.id)));

        setResults(cards);
        setStatus("idle");
      } catch (e) {
        if (controller.signal.aborted) return;
        setStatus("error");
        setError(e?.message || "Unknown error");
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [trimmed, canSearch]);

  const headerText = useMemo(() => {
    if (!canSearch) return "Start typing (2+ characters)…";
    if (status === "loading") return "Searching…";
    if (status === "error") return "Something went wrong.";
    return `${results.length} result${results.length === 1 ? "" : "s"}`;
  }, [canSearch, status, results.length]);

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search make / model / trim (e.g., camry, civic, outback)"
        style={{
          width: "100%",
          padding: "16px 18px",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(0,0,0,0.22)",
          color: "rgba(255,255,255,0.92)",
          fontSize: 16,
          outline: "none",
        }}
      />

      <div style={{ marginTop: 14, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
        {headerText}
      </div>

      {status === "error" && (
        <div style={{ color: "salmon", marginTop: 10 }}>{error}</div>
      )}

      {results.length > 0 && (
        <div
          style={{
            marginTop: 20,
            padding: 18,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: 14,
            }}
          >
            {results.map((m) => {
              const last = m.lastListing; // { snapshotDate, price, mileage, region, source } or null
              const market = m.market;    // { weekStart, medianPrice, p10Price, p90Price, listingCount } or null

              const title = `${m.year} ${m.make} ${m.model}${m.trim ? ` (${m.trim})` : ""}`;

              const lastDays = daysAgo(last?.snapshotDate);
              const badge =
                last
                  ? (lastDays === 0 ? "Today" : lastDays === 1 ? "Yesterday" : `${lastDays}d ago`)
                  : "No listings";

              return (
                <a
                  key={m.id}
                  href={`/model/${m.id}`}
                  style={{
                    gridColumn: "span 12",
                    textDecoration: "none",
                    color: "inherit",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06))",
                    border: "1px solid rgba(255,255,255,0.14)",
                    borderRadius: 18,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 150ms ease, border-color 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0px)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                  }}
                >
                  {/* image placeholder */}
                  <div
                    style={{
                      height: 120,
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(0,0,0,0.15))",
                      borderBottom: "1px solid rgba(255,255,255,0.10)",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 12,
                        top: 12,
                        padding: "6px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        background: "rgba(0,0,0,0.35)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(255,255,255,0.82)",
                      }}
                    >
                      {(last?.source || "—").toUpperCase()}
                    </div>

                    <div
                      style={{
                        position: "absolute",
                        right: 12,
                        top: 12,
                        padding: "6px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        background: last ? "rgba(16,185,129,0.20)" : "rgba(255,255,255,0.10)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        color: "rgba(255,255,255,0.86)",
                      }}
                    >
                      {badge}
                    </div>
                  </div>

                  <div style={{ padding: 14 }}>
                    {/* title */}
                    <div style={{ fontWeight: 900, letterSpacing: "0.01em", fontSize: 16 }}>
                      {title}
                    </div>

                    {/* price */}
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 30, fontWeight: 950, lineHeight: 1.05 }}>
                        {last ? formatMoney(last.price) : "—"}
                      </div>
                      <div style={{ marginTop: 6, color: "rgba(255,255,255,0.70)", fontSize: 13 }}>
                        Last seen: {formatDate(last?.snapshotDate)}
                      </div>
                    </div>

                    {/* quick facts */}
                    <div
                      style={{
                        marginTop: 12,
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                        color: "rgba(255,255,255,0.75)",
                        fontSize: 13,
                      }}
                    >
                      <span>📍 {last?.region ?? "Unknown"}</span>
                      <span>🛣️ {formatMiles(last?.mileage)}</span>
                      <span style={{ opacity: 0.9 }}>🔗 {m.canonicalKey}</span>
                    </div>

                    {/* market strip */}
                    {market && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: "10px 12px",
                          borderRadius: 14,
                          background: "rgba(0,0,0,0.18)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          color: "rgba(255,255,255,0.78)",
                          fontSize: 13,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <span>
                            Market median:{" "}
                            <b style={{ color: "rgba(255,255,255,0.92)" }}>
                              {formatMoney(market.medianPrice)}
                            </b>
                          </span>
                          <span>
                            Weekly listings:{" "}
                            <b style={{ color: "rgba(255,255,255,0.92)" }}>
                              {market.listingCount}
                            </b>
                          </span>
                        </div>
                        <div style={{ marginTop: 6, opacity: 0.85 }}>
                          Week of {formatDate(market.weekStart)} · p10 {formatMoney(market.p10Price)} · p90{" "}
                          {formatMoney(market.p90Price)}
                        </div>
                      </div>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {canSearch && status !== "loading" && results.length === 0 && status !== "error" && (
        <div style={{ marginTop: 12, color: "rgba(255,255,255,0.65)" }}>
          No results.
        </div>
      )}

      {/* responsive columns */}
      <style>{`
        @media (min-width: 700px) {
          a[href^="/model/"] { grid-column: span 6 !important; }
        }
        @media (min-width: 1000px) {
          a[href^="/model/"] { grid-column: span 4 !important; }
        }
      `}</style>
    </div>
  );
}