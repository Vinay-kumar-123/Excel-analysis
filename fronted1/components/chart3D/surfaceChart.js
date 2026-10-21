"use client";
import React from "react";
import PlotlyWrapper from "./PlotlyWrapper";

export default function SurfaceChart3D({
  zMatrix,
  xValues,
  yValues,
  title = "3D Surface Chart",
  xLabel = "X Axis",
  yLabel = "Y Axis",
  zLabel = "Z Elevation",
}) {
  const defaultZ = [
    [10, 10.6, 12, 13, 14],
    [11, 12.5, 14, 15, 16],
    [13, 15.0, 17, 18, 19],
    [12, 14.0, 16, 17, 18],
    [10, 11.0, 13, 14, 15],
  ];

  const plotData = [
    {
      type: "surface",
      z: zMatrix && zMatrix.length > 0 ? zMatrix : defaultZ,
      x: xValues,
      y: yValues,
      colorscale: "Plasma",
      contours: {
        z: { show: true, usecolormap: true, highlightcolor: "#42f462", project: { z: true } },
      },
    },
  ];

  const layout = {
    title: { text: title, font: { size: 16 } },
    scene: {
      xaxis: { title: xLabel },
      yaxis: { title: yLabel },
      zaxis: { title: zLabel },
      camera: {
        eye: { x: 1.6, y: 1.6, z: 1.1 },
      },
    },
    autosize: true,
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex flex-col h-full min-h-[440px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-700 text-lg">{title}</h3>
        <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-medium">
          3D Surface Mesh
        </span>
      </div>
      <div className="flex-1 w-full min-h-[380px]">
        <PlotlyWrapper data={plotData} layout={layout} />
      </div>
    </div>
  );
}
