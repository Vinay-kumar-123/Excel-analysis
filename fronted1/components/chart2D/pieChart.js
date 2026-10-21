"use client";
import React, { useRef } from "react";
import "./chartSetup";
import { Pie, Doughnut } from "react-chartjs-2";
import { Download } from "lucide-react";

export default function PieChartComponent({
  chartData,
  title = "Pie Chart",
  isDoughnut = false,
}) {
  const chartRef = useRef(null);

  const defaultData = {
    labels: ["Desktop", "Mobile", "Tablet"],
    datasets: [
      {
        data: [55, 35, 10],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(147, 51, 234, 0.8)",
          "rgba(236, 72, 153, 0.8)",
        ],
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  const dataToRender = chartData && chartData.labels?.length ? chartData : defaultData;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 14, font: { size: 12 }, padding: 15 },
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
  };

  const handleDownload = () => {
    if (chartRef.current) {
      const link = document.createElement("a");
      link.download = `${title.toLowerCase().replace(/\s+/g, "_") || "pie_chart"}.png`;
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
          <Download className="w-3.5 h-3.5 text-purple-600" />
          Export PNG
        </button>
      </div>
      <div className="flex-1 relative w-full min-h-[340px] flex items-center justify-center">
        {isDoughnut ? (
          <Doughnut ref={chartRef} data={dataToRender} options={options} />
        ) : (
          <Pie ref={chartRef} data={dataToRender} options={options} />
        )}
      </div>
    </div>
  );
}
