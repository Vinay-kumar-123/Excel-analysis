"use client";
import React from "react";
import PlotlyWrapper from "./PlotlyWrapper";

export default function PieChart3D({
  labels = [],
  values = [],
  title = "Donut Chart",
  hole = 0.4,
}) {
  const plotData = [
    {
      type: "pie",
      labels,
      values,
      hole: hole,
      textinfo: "label+percent",
      textposition: "outside",
      automargin: true,
      marker: {
        colors: ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"],
      },
      hovertemplate: "%{label}: %{value:,.2f} (%{percent})<extra></extra>",
    },
  ];

  const layout = {
    title: { text: title, font: { size: 16 } },
    showlegend: true,
    legend: { orientation: "h", y: -0.1 },
    autosize: true,
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex flex-col h-full min-h-[440px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-700 text-lg">{title}</h3>
        <span className="text-xs bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full font-medium">
          Category Donut
        </span>
      </div>
      <div className="flex-1 w-full min-h-[380px]">
        <PlotlyWrapper data={plotData} layout={layout} />
      </div>
    </div>
  );
}
