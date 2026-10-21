"use client";
import React, { useRef } from "react";
import "./chartSetup";
import { Bar } from "react-chartjs-2";
import { Download } from "lucide-react";

export default function BarChart({
  chartData,
  title = "Bar Chart",
  xAxisLabel = "",
  yAxisLabel = "",
  horizontal = false,
}) {
  const chartRef = useRef(null);

  const defaultData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May"],
    datasets: [
      {
        label: "Dataset 1",
        data: [12, 19, 3, 5, 2],
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const dataToRender = chartData && chartData.labels?.length ? chartData : defaultData;

  const options = {
    indexAxis: horizontal ? "y" : "x",
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
      link.download = `${title.toLowerCase().replace(/\s+/g, "_") || "bar_chart"}.png`;
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
        <Bar ref={chartRef} data={dataToRender} options={options} />
      </div>
    </div>
  );
}
