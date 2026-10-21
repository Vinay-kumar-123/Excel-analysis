"use client";
import React from "react";
import PlotlyWrapper from "./PlotlyWrapper";

export default function ScatterChart3D({
  x = [],
  y = [],
  z = [],
  labels = [],
  title = "3D Scatter Plot",
  xLabel = "X Axis",
  yLabel = "Y Axis",
  zLabel = "Z Axis",
}) {
  const defaultX = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const defaultY = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  const defaultZ = [100, 120, 110, 140, 130, 180, 170, 210, 200, 230];

  const plotData = [
    {
      type: "scatter3d",
      mode: "markers",
      x: x.length > 0 ? x : defaultX,
      y: y.length > 0 ? y : defaultY,
      z: z.length > 0 ? z : defaultZ,
      text: labels.length > 0 ? labels : undefined,
      marker: {
        size: 7,
        color: z.length > 0 ? z : defaultZ,
        colorscale: "Viridis",
        opacity: 0.8,
        colorbar: { title: zLabel, thickness: 12 },
      },
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
        <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
          3D Point Cloud
        </span>
      </div>
      <div className="flex-1 w-full min-h-[380px]">
        <PlotlyWrapper data={plotData} layout={layout} />
      </div>
    </div>
  );
}
