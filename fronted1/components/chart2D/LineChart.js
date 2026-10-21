"use client";
import React, { useRef } from "react";
import "./chartSetup";
import { Line } from "react-chartjs-2";
import { Download } from "lucide-react";

export default function LineChart({
  chartData,
  title = "Line Chart",
  xAxisLabel = "",
  yAxisLabel = "",
  smooth = true,
  fill = false,
}) {
  const chartRef = useRef(null);

  const defaultData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Trend",
        data: [10, 25, 18, 30, 45, 60],
        borderColor: "rgba(99, 102, 241, 1)",
        backgroundColor: fill ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.05)",
        tension: smooth ? 0.35 : 0,
        fill: fill,
        pointBackgroundColor: "rgba(99, 102, 241, 1)",
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const dataToRender = chartData && chartData.labels?.length ? chartData : defaultData;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { boxWidth: 12, font: { size: 12 } },
      },
      title: {
        display: !!title,
        text: title,
        font: { size: 16, weight: "bold" },
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        title: {
          display: !!xAxisLabel,
          text: xAxisLabel,
          font: { weight: "600" },
        },
        grid: { color: "rgba(229, 231, 235, 0.5)" },
      },
      y: {
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel,
          font: { weight: "600" },
        },
        grid: { color: "rgba(229, 231, 235, 0.5)" },
        beginAtZero: true,
      },
    },
  };

  const handleDownload = () => {
    if (chartRef.current) {
      const link = document.createElement("a");
      link.download = `${title.toLowerCase().replace(/\s+/g, "_") || "line_chart"}.png`;
      link.href = chartRef.current.toBase64Image();
      link.click();
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex flex-col h-full min-h-[420px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-700 text-lg">{title}</h3>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition"
          title="Export as PNG"
        >
          <Download className="w-3.5 h-3.5 text-indigo-600" />
          Export PNG
        </button>
      </div>
      <div className="flex-1 relative w-full min-h-[340px]">
        <Line ref={chartRef} data={dataToRender} options={options} />
      </div>
    </div>
  );
}
