"use client";
import React, { useRef } from "react";
import "./chartSetup";
import { Bubble } from "react-chartjs-2";
import { Download } from "lucide-react";

export default function BubbleChartComponent({
  chartData,
  title = "Bubble Chart",
  xAxisLabel = "X Axis",
  yAxisLabel = "Y Axis",
}) {
  const chartRef = useRef(null);

  const defaultData = {
    datasets: [
      {
        label: "Market Segment",
        data: [
          { x: 20, y: 30, r: 15 },
          { x: 40, y: 10, r: 10 },
          { x: 30, y: 25, r: 25 },
          { x: 60, y: 40, r: 18 },
          { x: 75, y: 55, r: 12 },
        ],
        backgroundColor: "rgba(245, 158, 11, 0.7)",
        borderColor: "rgba(245, 158, 11, 1)",
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
            return `X: ${raw.x}, Y: ${raw.y}, Size: ${raw.r}`;
          },
        },
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
      },
    },
  };

  const handleDownload = () => {
    if (chartRef.current) {
      const link = document.createElement("a");
      link.download = `${title.toLowerCase().replace(/\s+/g, "_") || "bubble_chart"}.png`;
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
          <Download className="w-3.5 h-3.5 text-amber-600" />
          Export PNG
        </button>
      </div>
      <div className="flex-1 relative w-full min-h-[340px]">
        <Bubble ref={chartRef} data={dataToRender} options={options} />
      </div>
    </div>
  );
}
