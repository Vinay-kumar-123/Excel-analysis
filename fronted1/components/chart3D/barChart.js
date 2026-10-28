"use client";
import React from "react";
import PlotlyWrapper from "./PlotlyWrapper";

export default function BarChart3D({
  dataPoints,
  title = "3D Point Plot",
  xLabel = "X Axis",
  yLabel = "Y Axis",
  zLabel = "Z Axis",
}) {
  const plotData = dataPoints || [];

  const layout = {
    title: { text: title, font: { size: 16 } },
    scene: {
      xaxis: { title: xLabel },
      yaxis: { title: yLabel },
      zaxis: { title: zLabel },
      camera: {
        eye: { x: 1.5, y: 1.5, z: 1.2 },
      },
    },
    autosize: true,
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex flex-col h-full min-h-[440px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-700 text-lg">{title}</h3>
        <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
          3D Point Plot
        </span>
      </div>
      <div className="flex-1 w-full min-h-[380px]">
        <PlotlyWrapper data={plotData} layout={layout} />
      </div>
    </div>
  );
}
