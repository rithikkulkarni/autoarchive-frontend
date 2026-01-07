import React, { useEffect, useState } from "react";
import { searchModels } from "../lib/api.js";

export default function Search() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [error, setError] = useState("");

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
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
        const data = await searchModels({ q: query, limit: 15 });
        setResults(data);
        setStatus("idle");
      } catch (e) {
        // Ignore abort errors
        if (String(e).toLowerCase().includes("abort")) return;
        setStatus("error");
        setError(e.message || "Unknown error");
      }
    }, 250); // debounce

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [q]);

  return (
    <div>
      <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
        Search (make / model / trim)
      </label>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Try: camry, civic, outback..."
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 10,
          border: "1px solid #ccc",
          fontSize: 16,
        }}
      />

      <div style={{ marginTop: 12 }}>
        {status === "loading" && <div>Loading…</div>}
        {status === "error" && <div style={{ color: "crimson" }}>{error}</div>}

        {results.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0 0" }}>
            {results.map((m) => (
              <li
                key={m.id}
                style={{
                  padding: "10px 12px",
                  border: "1px solid #eee",
                  borderRadius: 10,
                  marginBottom: 8,
                }}
              >
                <a href={`/model/${m.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ fontWeight: 650 }}>
                    {m.year} {m.make} {m.model} {m.trim ? `(${m.trim})` : ""}
                  </div>
                  <div style={{ color: "#666", fontSize: 14 }}>
                    {m.canonicalKey}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}

        {q.trim().length >= 2 && status !== "loading" && results.length === 0 && (
          <div style={{ marginTop: 12, color: "#666" }}>No results.</div>
        )}
      </div>
    </div>
  );
}
