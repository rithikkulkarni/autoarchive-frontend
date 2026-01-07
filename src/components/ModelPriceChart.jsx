import React, { useEffect, useRef } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend
);

export default function ModelPriceChart({ history }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!history || history.length === 0) return;

    const labels = history.map((p) =>
      new Date(p.weekStart).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    );

    const median = history.map((p) => p.medianPrice);
    const p10 = history.map((p) => p.p10Price);
    const p90 = history.map((p) => p.p90Price);

    const chart = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "p10",
            data: p10,
            borderColor: "rgba(255,255,255,0)",
            backgroundColor: "rgba(16,185,129,0.15)",
            fill: false,
          },
          {
            label: "p90",
            data: p90,
            borderColor: "rgba(255,255,255,0)",
            backgroundColor: "rgba(16,185,129,0.15)",
            fill: "-1", // fill between p10 and p90
          },
          {
            label: "Median price",
            data: median,
            borderColor: "rgba(255,255,255,0.9)",
            backgroundColor: "rgba(255,255,255,0.9)",
            tension: 0.3,
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            ticks: {
              callback: (v) => `$${v.toLocaleString()}`,
              color: "rgba(255,255,255,0.7)",
            },
            grid: { color: "rgba(255,255,255,0.08)" },
          },
          x: {
            ticks: { color: "rgba(255,255,255,0.7)" },
            grid: { display: false },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [history]);

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
      <h3 style={{ marginBottom: 12 }}>Price over time</h3>
      <canvas ref={canvasRef} />
    </div>
  );
}