"use client";
import React, { useRef } from "react";
import "./chartSetup";
import { Scatter } from "react-chartjs-2";
import { Download } from "lucide-react";

export default function ScatterChartComponent({
  chartData,
  title = "Scatter Plot",
  xAxisLabel = "X Axis",
  yAxisLabel = "Y Axis",
}) {
  const chartRef = useRef(null);

  const defaultData = {
    datasets: [
      {
        label: "Observations",
        data: [
          { x: 10, y: 20 },
          { x: 15, y: 10 },
          { x: 26, y: 28 },
          { x: 35, y: 45 },
          { x: 42, y: 38 },
          { x: 50, y: 60 },
        ],
        backgroundColor: "rgba(236, 72, 153, 0.8)",
        borderColor: "rgba(236, 72, 153, 1)",
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const dataToRender = chartData && chartData.datasets?.length ? chartData : defaultData;

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
        callbacks: {
          label: (context) => {
            const raw = context.raw || {};
            return `(${raw.x}, ${raw.y})`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        position: "bottom",
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
      },
    },
  };

  const handleDownload = () => {
    if (chartRef.current) {
      const link = document.createElement("a");
      link.download = `${title.toLowerCase().replace(/\s+/g, "_") || "scatter_plot"}.png`;
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
          <Download className="w-3.5 h-3.5 text-pink-600" />
          Export PNG
        </button>
      </div>
      <div className="flex-1 relative w-full min-h-[340px]">
        <Scatter ref={chartRef} data={dataToRender} options={options} />
      </div>
    </div>
  );
}
