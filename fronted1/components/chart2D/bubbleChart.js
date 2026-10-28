"use client";
import React, { useRef } from "react";
import "./chartSetup";
import { Bubble } from "react-chartjs-2";
import { Download } from "lucide-react";
import { formatChartValue } from "./chartFormatting";

export default function BubbleChartComponent({
  chartData,
  title = "Bubble Chart",
  xAxisLabel = "X Axis",
  yAxisLabel = "Y Axis",
  currency = false,
}) {
  const chartRef = useRef(null);
  const dataToRender = chartData || { datasets: [] };
  const hasChart = Boolean(dataToRender.datasets?.length);

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
            return `${raw.label ? `${raw.label}: ` : ""}X: ${formatChartValue(raw.x)}, Y: ${formatChartValue(raw.y, currency)}, Size: ${formatChartValue(raw.sizeValue)}`;
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
        ticks: { callback: (value) => formatChartValue(value) },
      },
      y: {
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel,
          font: { weight: "600" },
        },
        grid: { color: "rgba(229, 231, 235, 0.5)" },
        ticks: { callback: (value) => formatChartValue(value, currency) },
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
          disabled={!hasChart}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
          title="Export as PNG"
        >
          <Download className="w-3.5 h-3.5 text-amber-600" />
          Export PNG
        </button>
      </div>
      <div className="flex-1 relative w-full min-h-[340px]">
        {hasChart
          ? <Bubble ref={chartRef} data={dataToRender} options={options} />
          : <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">No compatible numeric data to display.</div>}
      </div>
    </div>
  );
}
