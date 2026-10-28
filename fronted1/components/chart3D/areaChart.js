"use client";
import React from "react";
import PlotlyWrapper from "./PlotlyWrapper";

export default function AreaChart3D({
  x = [],
  y = [],
  z = [],
  title = "3D Line Plot",
  xLabel = "Timeline",
  yLabel = "Category",
  zLabel = "Value",
}) {
  const plotData = [
    {
      type: "scatter3d",
      mode: "lines",
      name: zLabel,
      x,
      y,
      z,
      line: { width: 6, color: "#3b82f6" },
    },
  ];

  const layout = {
    title: { text: title, font: { size: 16 } },
    scene: {
      xaxis: { title: xLabel },
      yaxis: { title: yLabel },
      zaxis: { title: zLabel },
    },
    autosize: true,
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex flex-col h-full min-h-[440px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-700 text-lg">{title}</h3>
        <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
          3D Line
        </span>
      </div>
      <div className="flex-1 w-full min-h-[380px]">
        <PlotlyWrapper data={plotData} layout={layout} />
      </div>
    </div>
  );
}
