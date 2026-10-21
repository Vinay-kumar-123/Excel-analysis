"use client";
import React, { useState, useEffect, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { setExcelData } from "@/redux/excelSlice";
import Tab from "@/components/Tab";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";

// 2D Chart Components (fast client bundle)
import BarChart from "@/components/chart2D/BarChart";
import LineChart from "@/components/chart2D/LineChart";
import AreaChart from "@/components/chart2D/AreaChart";
import PieChartComponent from "@/components/chart2D/pieChart";
import ScatterChartComponent from "@/components/chart2D/ScatterChart";
import BubbleChartComponent from "@/components/chart2D/bubbleChart";

// Code Splitting & Lazy Loading for 3D Charts (Plotly is ~3MB, loaded only when 3D tab is opened)
const BarChart3D = dynamic(() => import("@/components/chart3D/barChart"), {
  ssr: false,
  loading: () => <ChartLoadingPlaceholder name="3D Column" />,
});
const SurfaceChart3D = dynamic(() => import("@/components/chart3D/surfaceChart"), {
  ssr: false,
  loading: () => <ChartLoadingPlaceholder name="3D Surface Mesh" />,
});
const ScatterChart3D = dynamic(() => import("@/components/chart3D/scatterChart"), {
  ssr: false,
  loading: () => <ChartLoadingPlaceholder name="3D Scatter Cloud" />,
});
const BubbleChart3D = dynamic(() => import("@/components/chart3D/bubbleChart"), {
  ssr: false,
  loading: () => <ChartLoadingPlaceholder name="3D Bubble Space" />,
});
const AreaChart3D = dynamic(() => import("@/components/chart3D/areaChart"), {
  ssr: false,
  loading: () => <ChartLoadingPlaceholder name="3D Ribbon" />,
});
const PieChart3D = dynamic(() => import("@/components/chart3D/pieChart"), {
  ssr: false,
  loading: () => <ChartLoadingPlaceholder name="3D Donut" />,
});
const PowerMapChart3D = dynamic(() => import("@/components/chart3D/powerMapChart"), {
  ssr: false,
  loading: () => <ChartLoadingPlaceholder name="Geographic 3D Globe" />,
});

function ChartLoadingPlaceholder({ name }) {
  return (
    <div className="w-full h-96 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="text-xs font-semibold text-gray-700">Loading {name} Visualizer...</p>
      <p className="text-[11px] text-gray-400">Loading 3D graphics engine on demand</p>
    </div>
  );
}

function TabSectionContent() {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const reduxExcel = useSelector((state) => state.excel);

  const [activeTab, setActiveTab] = useState("2D");
  const [active2DType, setActive2DType] = useState("Bar");
  const [active3DType, setActive3DType] = useState("Bar3D");

  const [rawDataset, setRawDataset] = useState([]);
  const [fileName, setFileName] = useState("");

  // Column Mapping State
  const [xAxisCol, setXAxisCol] = useState(0);
  const [yAxisCol, setYAxisCol] = useState(1);
  const [zAxisCol, setZAxisCol] = useState(2);
  const [sizeAxisCol, setSizeAxisCol] = useState(3);

  // Load Data safely from Redux -> sessionStorage -> searchParams -> demo data
  useEffect(() => {
    if (reduxExcel?.data && reduxExcel.data.length > 0) {
      setRawDataset(reduxExcel.data);
      setFileName(reduxExcel.fileName || "Uploaded File");
      return;
    }

    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("excel_data");
        const cachedName = sessionStorage.getItem("excel_filename");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRawDataset(parsed);
            setFileName(cachedName || "Restored File");
            dispatch(setExcelData({ data: parsed, fileName: cachedName }));
            return;
          }
        }
      } catch (e) {
        console.warn("Could not read from sessionStorage:", e);
      }
    }

    const queryData = searchParams.get("excelData");
    if (queryData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(queryData));
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRawDataset(parsed);
          setFileName("Imported Dataset");
          dispatch(setExcelData({ data: parsed, fileName: "Imported Dataset" }));
          return;
        }
      } catch (e) {
        console.warn("Failed to parse excelData from searchParams:", e);
      }
    }

    // Default sample data for demo if no file has been uploaded yet
    const demoData = [
      ["Region", "Sales", "Profit", "Units", "Satisfaction"],
      ["North America", 45000, 12000, 320, 88],
      ["Europe", 38000, 9500, 275, 84],
      ["Asia Pacific", 52000, 16000, 410, 91],
      ["Latin America", 21000, 4200, 160, 78],
      ["Middle East", 18500, 5100, 130, 82],
      ["Africa", 14000, 3100, 95, 75],
    ];
    setRawDataset(demoData);
    setFileName("Sample Sales Dataset.xlsx");
  }, [reduxExcel, searchParams, dispatch]);

  const headers = useMemo(() => {
    if (!rawDataset || rawDataset.length === 0) return [];
    return (rawDataset[0] || []).map((h, i) =>
      h !== undefined && h !== null && String(h).trim() !== "" ? String(h) : `Column ${i + 1}`
    );
  }, [rawDataset]);

  const rows = useMemo(() => {
    if (!rawDataset || rawDataset.length <= 1) return [];
    return rawDataset.slice(1);
  }, [rawDataset]);

  // Analyze columns to distinguish numeric vs categorical
  const columnAnalysis = useMemo(() => {
    return headers.map((header, colIndex) => {
      let numericCount = 0;
      let totalValid = 0;
      // Sampling up to 100 rows for fast type detection on large datasets
      const sample = rows.slice(0, 100);
      sample.forEach((row) => {
        const val = row[colIndex];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          totalValid++;
          const num = Number(String(val).replace(/[^0-9.-]+/g, ""));
          if (!isNaN(num)) numericCount++;
        }
      });
      const isNumeric = totalValid > 0 && numericCount / totalValid >= 0.7;
      return { colIndex, header, isNumeric, totalValid };
    });
  }, [headers, rows]);

  // Adjust defaults when headers change
  useEffect(() => {
    if (headers.length > 0) {
      const firstCategorical = columnAnalysis.find((c) => !c.isNumeric)?.colIndex ?? 0;
      const firstNumeric = columnAnalysis.find((c) => c.isNumeric)?.colIndex ?? Math.min(1, headers.length - 1);
      const secondNumeric =
        columnAnalysis.find((c) => c.isNumeric && c.colIndex !== firstNumeric)?.colIndex ??
        Math.min(2, headers.length - 1);
      const thirdNumeric =
        columnAnalysis.find((c) => c.isNumeric && c.colIndex !== firstNumeric && c.colIndex !== secondNumeric)?.colIndex ??
        Math.min(3, headers.length - 1);

      setXAxisCol(firstCategorical);
      setYAxisCol(firstNumeric);
      setZAxisCol(secondNumeric);
      setSizeAxisCol(thirdNumeric);
    }
  }, [columnAnalysis, headers]);

  // Prepared 2D chart data
  const chart2DData = useMemo(() => {
    if (rows.length === 0 || headers.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = rows.map((r) => String(r[xAxisCol] ?? `Row`));
    const values = rows.map((r) => {
      const raw = String(r[yAxisCol] ?? "0").replace(/[^0-9.-]+/g, "");
      const num = Number(raw);
      return isNaN(num) ? 0 : num;
    });

    const colors = [
      "rgba(59, 130, 246, 0.75)",
      "rgba(147, 51, 234, 0.75)",
      "rgba(16, 185, 129, 0.75)",
      "rgba(245, 158, 11, 0.75)",
      "rgba(236, 72, 153, 0.75)",
      "rgba(6, 182, 212, 0.75)",
      "rgba(239, 68, 68, 0.75)",
      "rgba(99, 102, 241, 0.75)",
    ];

    if (active2DType === "Pie") {
      return {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: labels.map((_, i) => colors[i % colors.length]),
            borderWidth: 1,
          },
        ],
      };
    }

    if (active2DType === "Scatter") {
      return {
        datasets: [
          {
            label: `${headers[xAxisCol]} vs ${headers[yAxisCol]}`,
            data: rows.map((r) => {
              const xVal = Number(String(r[xAxisCol] ?? "0").replace(/[^0-9.-]+/g, "")) || 0;
              const yVal = Number(String(r[yAxisCol] ?? "0").replace(/[^0-9.-]+/g, "")) || 0;
              return { x: xVal, y: yVal };
            }),
            backgroundColor: "rgba(236, 72, 153, 0.8)",
            pointRadius: 6,
          },
        ],
      };
    }

    if (active2DType === "Bubble") {
      return {
        datasets: [
          {
            label: `${headers[yAxisCol]}`,
            data: rows.map((r) => {
              const xVal = Number(String(r[xAxisCol] ?? "0").replace(/[^0-9.-]+/g, "")) || 0;
              const yVal = Number(String(r[yAxisCol] ?? "0").replace(/[^0-9.-]+/g, "")) || 0;
              const rVal = Math.min(
                35,
                Math.max(5, Number(String(r[sizeAxisCol] ?? "15").replace(/[^0-9.-]+/g, "")) || 15)
              );
              return { x: xVal, y: yVal, r: rVal };
            }),
            backgroundColor: "rgba(245, 158, 11, 0.7)",
          },
        ],
      };
    }

    return {
      labels,
      datasets: [
        {
          label: headers[yAxisCol] || "Value",
          data: values,
          backgroundColor:
            active2DType === "Area"
              ? "rgba(16, 185, 129, 0.25)"
              : "rgba(59, 130, 246, 0.75)",
          borderColor:
            active2DType === "Area"
              ? "rgba(16, 185, 129, 1)"
              : "rgba(59, 130, 246, 1)",
          borderWidth: 2,
          fill: active2DType === "Area",
          tension: 0.35,
          borderRadius: 4,
        },
      ],
    };
  }, [rows, headers, xAxisCol, yAxisCol, sizeAxisCol, active2DType]);

  // Prepared 3D chart data - computed only when 3D tab is active
  const chart3DProps = useMemo(() => {
    if (activeTab !== "3D" || rows.length === 0 || headers.length === 0) {
      return { x: [], y: [], z: [], size: [], labels: [] };
    }

    const labels = rows.map((r) => String(r[xAxisCol] ?? `Item`));
    const xVals = rows.map((r) => {
      const num = Number(String(r[xAxisCol] ?? "0").replace(/[^0-9.-]+/g, ""));
      return isNaN(num) ? String(r[xAxisCol] ?? "") : num;
    });
    const yVals = rows.map((r) => {
      const num = Number(String(r[yAxisCol] ?? "0").replace(/[^0-9.-]+/g, ""));
      return isNaN(num) ? String(r[yAxisCol] ?? "") : num;
    });
    const zVals = rows.map((r) => {
      const num = Number(String(r[zAxisCol] ?? "0").replace(/[^0-9.-]+/g, ""));
      return isNaN(num) ? 0 : num;
    });
    const sizeVals = rows.map((r) => {
      const num = Number(String(r[sizeAxisCol] ?? "15").replace(/[^0-9.-]+/g, ""));
      return isNaN(num) ? 15 : num;
    });

    return {
      x: xVals,
      y: yVals,
      z: zVals,
      size: sizeVals,
      labels,
    };
  }, [activeTab, rows, headers, xAxisCol, yAxisCol, zAxisCol, sizeAxisCol]);

  // Compute Summary Statistics ONLY when SUMMARY tab is viewed
  const summaryStats = useMemo(() => {
    if (activeTab !== "SUMMARY") return [];
    return columnAnalysis.map((col) => {
      const vals = rows
        .map((r) => {
          const raw = String(r[col.colIndex] ?? "").replace(/[^0-9.-]+/g, "");
          const num = Number(raw);
          return isNaN(num) || raw === "" ? null : num;
        })
        .filter((n) => n !== null);

      if (vals.length === 0) {
        return {
          ...col,
          count: rows.length,
          min: "N/A",
          max: "N/A",
          mean: "N/A",
          sum: "N/A",
        };
      }

      const sum = vals.reduce((a, b) => a + b, 0);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const mean = (sum / vals.length).toFixed(2);

      return {
        ...col,
        count: vals.length,
        min: min.toLocaleString(),
        max: max.toLocaleString(),
        mean,
        sum: sum.toLocaleString(),
      };
    });
  }, [activeTab, columnAnalysis, rows]);

  const exportSummaryCsv = () => {
    let csv = "Column,Data Type,Count,Sum,Average,Min,Max\n";
    summaryStats.forEach((s) => {
      csv += `"${s.header}","${s.isNumeric ? "Numeric" : "Categorical"}",${s.count},"${s.sum}","${s.mean}","${s.min}","${s.max}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName.replace(/\.[^/.]+$/, "")}_summary.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto mt-20 p-4 md:p-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-indigo-600" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Interactive Analytics Studio
            </h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Active Dataset: <span className="font-semibold text-gray-700">{fileName}</span> ({rows.length} rows, {headers.length} columns)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/upload"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition shadow-sm"
          >
            <UploadCloud className="w-4 h-4 text-gray-500" />
            Upload New File
          </Link>
          <Link
            href="/ai"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:opacity-95 transition shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            AI Insights
          </Link>
        </div>
      </div>

      {/* Main Tab Controller */}
      <Tab activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Control Panel for X/Y/Z Column Selectors */}
      {(activeTab === "2D" || activeTab === "3D") && (
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <span>Visualization Axes & Column Mapping</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                {activeTab === "2D" ? "X Axis / Category" : "X Axis"}
              </label>
              <select
                value={xAxisCol}
                onChange={(e) => setXAxisCol(Number(e.target.value))}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
              >
                {headers.map((h, i) => (
                  <option key={i} value={i}>
                    {h} {columnAnalysis[i]?.isNumeric ? "(#)" : "(Abc)"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-600 font-medium mb-1">
                {activeTab === "2D" ? "Y Axis / Value" : "Y Axis"}
              </label>
              <select
                value={yAxisCol}
                onChange={(e) => setYAxisCol(Number(e.target.value))}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
              >
                {headers.map((h, i) => (
                  <option key={i} value={i}>
                    {h} {columnAnalysis[i]?.isNumeric ? "(#)" : "(Abc)"}
                  </option>
                ))}
              </select>
            </div>

            {activeTab === "3D" && (
              <div>
                <label className="block text-gray-600 font-medium mb-1">
                  Z Axis (Elevation)
                </label>
                <select
                  value={zAxisCol}
                  onChange={(e) => setZAxisCol(Number(e.target.value))}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                >
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h} {columnAnalysis[i]?.isNumeric ? "(#)" : "(Abc)"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(active2DType === "Bubble" || active3DType === "Bubble3D") && (
              <div>
                <label className="block text-gray-600 font-medium mb-1">
                  Bubble Radius / Size
                </label>
                <select
                  value={sizeAxisCol}
                  onChange={(e) => setSizeAxisCol(Number(e.target.value))}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                >
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h} {columnAnalysis[i]?.isNumeric ? "(#)" : "(Abc)"}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2D VISUALIZATIONS TAB */}
      {activeTab === "2D" && (
        <div>
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: "Bar", label: "Bar Chart" },
              { id: "Line", label: "Line Chart" },
              { id: "Area", label: "Area Chart" },
              { id: "Pie", label: "Pie Chart" },
              { id: "Scatter", label: "Scatter Plot" },
              { id: "Bubble", label: "Bubble Chart" },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setActive2DType(type.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  active2DType === type.id
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="w-full">
            {active2DType === "Bar" && (
              <BarChart
                chartData={chart2DData}
                title={`${headers[yAxisCol]} by ${headers[xAxisCol]}`}
                xAxisLabel={headers[xAxisCol]}
                yAxisLabel={headers[yAxisCol]}
              />
            )}
            {active2DType === "Line" && (
              <LineChart
                chartData={chart2DData}
                title={`${headers[yAxisCol]} Trend along ${headers[xAxisCol]}`}
                xAxisLabel={headers[xAxisCol]}
                yAxisLabel={headers[yAxisCol]}
              />
            )}
            {active2DType === "Area" && (
              <AreaChart
                chartData={chart2DData}
                title={`${headers[yAxisCol]} Volume over ${headers[xAxisCol]}`}
                xAxisLabel={headers[xAxisCol]}
                yAxisLabel={headers[yAxisCol]}
              />
            )}
            {active2DType === "Pie" && (
              <PieChartComponent
                chartData={chart2DData}
                title={`Distribution of ${headers[yAxisCol]} by ${headers[xAxisCol]}`}
              />
            )}
            {active2DType === "Scatter" && (
              <ScatterChartComponent
                chartData={chart2DData}
                title={`Correlation: ${headers[xAxisCol]} vs ${headers[yAxisCol]}`}
                xAxisLabel={headers[xAxisCol]}
                yAxisLabel={headers[yAxisCol]}
              />
            )}
            {active2DType === "Bubble" && (
              <BubbleChartComponent
                chartData={chart2DData}
                title={`${headers[xAxisCol]} vs ${headers[yAxisCol]} (Size: ${headers[sizeAxisCol]})`}
                xAxisLabel={headers[xAxisCol]}
                yAxisLabel={headers[yAxisCol]}
              />
            )}
          </div>
        </div>
      )}

      {/* 3D VISUALIZATIONS TAB - Lazy Loaded on Demand */}
      {activeTab === "3D" && (
        <div>
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: "Bar3D", label: "3D Column" },
              { id: "Surface", label: "3D Surface Mesh" },
              { id: "Scatter3D", label: "3D Scatter Cloud" },
              { id: "Bubble3D", label: "3D Bubble Space" },
              { id: "Area3D", label: "3D Ribbon" },
              { id: "Pie3D", label: "3D Donut" },
              { id: "PowerMap", label: "3D Globe Power Map" },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setActive3DType(type.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  active3DType === type.id
                    ? "bg-purple-600 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="w-full">
            {active3DType === "Bar3D" && (
              <BarChart3D
                dataPoints={[
                  {
                    type: "scatter3d",
                    mode: "markers",
                    x: chart3DProps.x,
                    y: chart3DProps.y,
                    z: chart3DProps.z,
                    text: chart3DProps.labels,
                    marker: {
                      size: 10,
                      color: chart3DProps.z,
                      colorscale: "Viridis",
                      opacity: 0.9,
                      colorbar: { title: headers[zAxisCol] || "Z", thickness: 12 },
                    },
                  },
                ]}
                title={`3D Multi-Axis: ${headers[xAxisCol]} / ${headers[yAxisCol]} / ${headers[zAxisCol]}`}
                xLabel={headers[xAxisCol]}
                yLabel={headers[yAxisCol]}
                zLabel={headers[zAxisCol]}
              />
            )}
            {active3DType === "Surface" && (
              <SurfaceChart3D
                xValues={chart3DProps.x.slice(0, 20)}
                yValues={chart3DProps.y.slice(0, 20)}
                title={`3D Surface Topology: ${headers[zAxisCol]}`}
                xLabel={headers[xAxisCol]}
                yLabel={headers[yAxisCol]}
                zLabel={headers[zAxisCol]}
              />
            )}
            {active3DType === "Scatter3D" && (
              <ScatterChart3D
                x={chart3DProps.x}
                y={chart3DProps.y}
                z={chart3DProps.z}
                labels={chart3DProps.labels}
                title={`3D Point Cloud: (${headers[xAxisCol]}, ${headers[yAxisCol]}, ${headers[zAxisCol]})`}
                xLabel={headers[xAxisCol]}
                yLabel={headers[yAxisCol]}
                zLabel={headers[zAxisCol]}
              />
            )}
            {active3DType === "Bubble3D" && (
              <BubbleChart3D
                x={chart3DProps.x}
                y={chart3DProps.y}
                z={chart3DProps.z}
                size={chart3DProps.size}
                labels={chart3DProps.labels}
                title={`4D Space: ${headers[xAxisCol]} × ${headers[yAxisCol]} × ${headers[zAxisCol]} (Size: ${headers[sizeAxisCol]})`}
                xLabel={headers[xAxisCol]}
                yLabel={headers[yAxisCol]}
                zLabel={headers[zAxisCol]}
                sizeLabel={headers[sizeAxisCol]}
              />
            )}
            {active3DType === "Area3D" && (
              <AreaChart3D
                x={chart3DProps.labels}
                z={chart3DProps.z}
                title={`3D Ribbon Projection: ${headers[zAxisCol]}`}
                xLabel={headers[xAxisCol]}
                zLabel={headers[zAxisCol]}
              />
            )}
            {active3DType === "Pie3D" && (
              <PieChart3D
                labels={chart3DProps.labels}
                values={chart3DProps.z}
                title={`3D Perspective Distribution: ${headers[zAxisCol]}`}
              />
            )}
            {active3DType === "PowerMap" && (
              <PowerMapChart3D
                locations={chart3DProps.labels}
                values={chart3DProps.z}
                title={`Geographic Power Map: ${headers[zAxisCol]}`}
              />
            )}
          </div>
        </div>
      )}

      {/* DATA SUMMARY TAB */}
      {activeTab === "SUMMARY" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Descriptive Column Statistics
              </h3>
              <p className="text-xs text-gray-500">
                Statistical metrics automatically computed across all dataset columns
              </p>
            </div>
            <button
              onClick={exportSummaryCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export Summary CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-gray-700">
                  <th className="p-3 font-semibold">Column Name</th>
                  <th className="p-3 font-semibold">Inferred Type</th>
                  <th className="p-3 font-semibold">Valid Rows</th>
                  <th className="p-3 font-semibold">Sum</th>
                  <th className="p-3 font-semibold">Average (Mean)</th>
                  <th className="p-3 font-semibold">Minimum</th>
                  <th className="p-3 font-semibold">Maximum</th>
                </tr>
              </thead>
              <tbody>
                {summaryStats.map((col, idx) => (
                  <tr
                    key={idx}
                    className={`border-b transition hover:bg-gray-50 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="p-3 font-medium text-gray-900">{col.header}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          col.isNumeric
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {col.isNumeric ? "Numeric" : "Categorical"}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{col.count}</td>
                    <td className="p-3 text-gray-600 font-mono">{col.sum}</td>
                    <td className="p-3 text-gray-600 font-mono">{col.mean}</td>
                    <td className="p-3 text-gray-600 font-mono">{col.min}</td>
                    <td className="p-3 text-gray-600 font-mono">{col.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI INSIGHTS SHORTCUT TAB */}
      {activeTab === "AI" && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            AI-Powered Dataset Intelligence
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto mb-6 text-sm">
            Ask questions, discover hidden trends, detect anomalies, and generate executive summaries directly from your uploaded data using Google Gemini.
          </p>
          <Link
            href="/ai"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md transition"
          >
            <Sparkles className="w-5 h-5" />
            Launch AI Intelligence Hub
          </Link>
        </div>
      )}
    </div>
  );
}

export default function TabSection() {
  return (
    <AuthGuard requiredMessage="Please log in to upload your data, visualize it, and access AI analytics.">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        }
      >
        <TabSectionContent />
      </Suspense>
    </AuthGuard>
  );
}
