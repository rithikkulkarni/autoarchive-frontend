import React, { useEffect, useRef } from "react";
import {
  Chart,
  BarController,
  BarElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(BarController, BarElement, LinearScale, CategoryScale, Tooltip, Legend);

function fmtRange(a, b) {
  return `${Number(a).toLocaleString()}–${Number(b).toLocaleString()}`;
}

export default function ModelMileageHistogram({ hist }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!hist || !hist.counts || hist.counts.length === 0) return;

    const edges = hist.binEdges;
    const labels = hist.counts.map((_, i) => fmtRange(edges[i], edges[i + 1]));
    const data = hist.counts;

    const chart = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Listings",
            data,
            backgroundColor: "rgba(255,255,255,0.25)",
            borderColor: "rgba(255,255,255,0.35)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { color: "rgba(255,255,255,0.08)" },
          },
          x: {
            ticks: {
              color: "rgba(255,255,255,0.7)",
              maxRotation: 45,
              minRotation: 45,
            },
            grid: { display: false },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [hist]);

  if (!hist || hist.sampleSize === 0) {
    return (
      <div
        style={{
          height: 360,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 16,
          padding: 16,
        }}
      >
        <h3 style={{ marginBottom: 10 }}>Mileage distribution</h3>
        <div style={{ color: "rgba(255,255,255,0.7)" }}>No mileage data yet.</div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: 360,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        padding: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <h3 style={{ marginBottom: 10 }}>Mileage distribution</h3>
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
          n={hist.sampleSize} · min {hist.minMileage?.toLocaleString()} · max {hist.maxMileage?.toLocaleString()}
        </div>
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
}