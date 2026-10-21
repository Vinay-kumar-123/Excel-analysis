"use client";
import React from "react";
import PlotlyWrapper from "./PlotlyWrapper";

export default function BubbleChart3D({
  x = [],
  y = [],
  z = [],
  size = [],
  labels = [],
  title = "3D Bubble Chart",
  xLabel = "X Axis",
  yLabel = "Y Axis",
  zLabel = "Z Axis",
  sizeLabel = "Bubble Size",
}) {
  const defaultX = [10, 20, 30, 40, 50];
  const defaultY = [15, 25, 35, 45, 55];
  const defaultZ = [100, 200, 150, 300, 250];
  const defaultSize = [15, 25, 40, 30, 50];

  const plotData = [
    {
      type: "scatter3d",
      mode: "markers",
      x: x.length > 0 ? x : defaultX,
      y: y.length > 0 ? y : defaultY,
      z: z.length > 0 ? z : defaultZ,
      text: labels.length > 0 ? labels : undefined,
      marker: {
        size: size.length > 0 ? size : defaultSize,
        sizemode: "diameter",
        sizeref: 2,
        color: z.length > 0 ? z : defaultZ,
        colorscale: "Cividis",
        opacity: 0.7,
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
        <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium">
          4D Bubble Space
        </span>
      </div>
      <div className="flex-1 w-full min-h-[380px]">
        <PlotlyWrapper data={plotData} layout={layout} />
      </div>
    </div>
  );
}
