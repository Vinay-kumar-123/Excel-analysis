"use client";
import React, { useState, useEffect, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { setExcelData } from "@/redux/excelSlice";
import Tab from "@/components/Tab";
import AuthGuard from "@/components/AuthGuard";
import {
  buildCategoryChart,
  buildNumericPoints,
  buildSurfaceGrid,
  getRecommendedMappings,
  inferColumnTypes,
  parseNumericValue,
} from "@/lib/chartData.mjs";
import Link from "next/link";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { createAnalysisDedupeKey, createAnalysisEntry } from "@/lib/analysisHistory.mjs";
import { addHistoryEntry } from "@/redux/historySlice";
import { saveAnalysisHistory } from "@/lib/historyService";
import AnalysisHistory from "@/components/AnalysisHistory";

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

function ChartValidationMessage({ message, warning = false }) {
  if (!message) return null;
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${warning
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-slate-200 bg-slate-50 text-slate-600"}`}>
      {message}
    </div>
  );
}

function displayColumnLabel(header = "") {
  return header
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+INR$/i, " (INR)");
}

function getChartTitle(type, xLabel, yLabel, sizeLabel) {
  if (type === "Pie") return `Distribution of ${yLabel} by ${xLabel}`;
  if (type === "Scatter") return `Correlation: ${xLabel} vs ${yLabel}`;
  if (type === "Bubble") return `${xLabel} vs ${yLabel} (Size: ${sizeLabel})`;
  return `${yLabel} by ${xLabel}`;
}

function TabSectionContent() {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const reduxExcel = useSelector((state) => state.excel);
  const historyEntries = useSelector((state) => state.history?.entries || []);
  const user = useSelector((state) => state.auth?.user);
  const userId = String(user?._id || user?.id || "anonymous");

  const initialTabParam = searchParams.get("tab")?.toUpperCase();
  const validTabs = ["2D", "3D", "SUMMARY", "AI", "HISTORY"];
  const [activeTab, setActiveTab] = useState(
    validTabs.includes(initialTabParam) ? initialTabParam : "2D"
  );
  const [active2DType, setActive2DType] = useState("Bar");
  const [active3DType, setActive3DType] = useState("Bar3D");

  useEffect(() => {
    const tabParam = searchParams.get("tab")?.toUpperCase();
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const [rawDataset, setRawDataset] = useState([]);
  const [fileName, setFileName] = useState("");

  // Column Mapping State
  const [xAxisCol, setXAxisCol] = useState(0);
  const [yAxisCol, setYAxisCol] = useState(1);
  const [zAxisCol, setZAxisCol] = useState(2);
  const [sizeAxisCol, setSizeAxisCol] = useState(3);

  // Load data from Redux, session storage, or an explicitly supplied URL dataset.
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

    setRawDataset([]);
    setFileName("");
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

  // Classify full columns rather than coercing labels into apparent measures.
  const columnAnalysis = useMemo(() => {
    return inferColumnTypes(headers, rows);
  }, [headers, rows]);

  // Adjust defaults when headers change
  useEffect(() => {
    if (headers.length > 0) {
      const firstCategorical =
        columnAnalysis.find((c) => ["categorical", "date", "boolean"].includes(c.type))?.colIndex ?? 0;
      const firstNumeric = columnAnalysis.find((c) => c.type === "numeric")?.colIndex ?? Math.min(1, headers.length - 1);
      const secondNumeric =
        columnAnalysis.find((c) => c.type === "numeric" && c.colIndex !== firstNumeric)?.colIndex ??
        Math.min(2, headers.length - 1);
      const thirdNumeric =
        columnAnalysis.find((c) => c.type === "numeric" && c.colIndex !== firstNumeric && c.colIndex !== secondNumeric)?.colIndex ??
        Math.min(3, headers.length - 1);

      setXAxisCol(firstCategorical);
      setYAxisCol(firstNumeric);
      setZAxisCol(secondNumeric);
      setSizeAxisCol(thirdNumeric);
    }
  }, [columnAnalysis, headers]);

  const select2DType = (type) => {
    const mappings = getRecommendedMappings(columnAnalysis, "2D", type);
    if (mappings) {
      setXAxisCol(mappings.x);
      setYAxisCol(mappings.y);
      if (mappings.size !== undefined) setSizeAxisCol(mappings.size);
    }
    setActive2DType(type);
  };

  const select3DType = (type) => {
    const mappings = getRecommendedMappings(columnAnalysis, "3D", type);
    if (mappings) {
      setXAxisCol(mappings.x);
      if (mappings.y !== undefined) setYAxisCol(mappings.y);
      if (mappings.z !== undefined) setZAxisCol(mappings.z);
      if (mappings.size !== undefined) setSizeAxisCol(mappings.size);
    }
    setActive3DType(type);
  };

  const handleAnalyticsTabChange = (tab) => {
    if (tab === "3D") select3DType(active3DType);
    setActiveTab(tab);
  };

  const selectedXType = columnAnalysis[xAxisCol]?.type;
  const selectedYType = columnAnalysis[yAxisCol]?.type;
  const selectedZType = columnAnalysis[zAxisCol]?.type;
  const selectedSizeType = columnAnalysis[sizeAxisCol]?.type;

  const chart2DResult = useMemo(() => {
    const empty = { data: { labels: [], datasets: [] }, error: "", warning: "" };
    if (!rows.length) return { ...empty, error: "Upload a worksheet with data rows to create a chart." };

    if (active2DType === "Scatter" || active2DType === "Bubble") {
      const indices = active2DType === "Bubble" ? [xAxisCol, yAxisCol, sizeAxisCol] : [xAxisCol, yAxisCol];
      const types = active2DType === "Bubble"
        ? [selectedXType, selectedYType, selectedSizeType]
        : [selectedXType, selectedYType];
      if (types.some((type) => type !== "numeric")) {
        return { ...empty, error: `${active2DType} charts require numeric columns for every mapped dimension.` };
      }
      const { points, skipped } = buildNumericPoints(rows, indices);
      const visiblePoints = active2DType === "Bubble"
        ? points.filter(({ values }) => values[2] > 0)
        : points;
      if (!visiblePoints.length) {
        return { ...empty, error: "No rows contain valid numeric values for the selected chart dimensions." };
      }
      const sizes = active2DType === "Bubble"
        ? visiblePoints.map(({ values }) => values[2])
        : [];
      const minSize = sizes.length ? sizes.reduce((min, value) => Math.min(min, value), Infinity) : 0;
      const maxSize = sizes.length ? sizes.reduce((max, value) => Math.max(max, value), -Infinity) : 0;
      const data = visiblePoints.map(({ values, label }) => {
        if (active2DType === "Scatter") return { x: values[0], y: values[1], label };
        const sizeValue = values[2];
        return {
          x: values[0],
          y: values[1],
          r: maxSize === minSize ? 10 : 5 + ((sizeValue - minSize) / (maxSize - minSize)) * 20,
          sizeValue,
          label,
        };
      });
      return {
        data: {
          datasets: [{
            label: active2DType === "Bubble"
              ? `${displayColumnLabel(headers[sizeAxisCol])} (size)`
                : `${displayColumnLabel(headers[xAxisCol])} vs ${displayColumnLabel(headers[yAxisCol])}`,
            data,
            backgroundColor: active2DType === "Bubble" ? "rgba(245, 158, 11, 0.7)" : "rgba(59, 130, 246, 0.75)",
            borderColor: active2DType === "Bubble" ? "rgba(217, 119, 6, 1)" : "rgba(37, 99, 235, 1)",
          }],
        },
        error: "",
        warning: skipped + (points.length - visiblePoints.length)
          ? `${skipped + (points.length - visiblePoints.length)} row(s) with missing, invalid, or non-positive ${active2DType === "Bubble" ? "bubble" : "chart"} dimensions were excluded.`
          : "",
      };
    }

    if (selectedYType !== "numeric") {
      return { ...empty, error: "Choose a numeric measure for the Y axis; categorical labels are not quantities." };
    }
    if (active2DType === "Pie" && !["categorical", "date", "boolean"].includes(selectedXType)) {
      return { ...empty, error: "Pie charts require meaningful category or date labels on the X axis." };
    }
    const result = buildCategoryChart(rows, xAxisCol, yAxisCol, { positiveOnly: active2DType === "Pie" });
    if (result.error) return { ...result, data: empty.data };

    const colors = [
      "rgba(37, 99, 235, 0.78)", "rgba(124, 58, 237, 0.78)", "rgba(5, 150, 105, 0.78)",
      "rgba(217, 119, 6, 0.78)", "rgba(219, 39, 119, 0.78)", "rgba(8, 145, 178, 0.78)",
      "rgba(220, 38, 38, 0.78)", "rgba(79, 70, 229, 0.78)",
    ];
    result.data.datasets[0].label = displayColumnLabel(headers[yAxisCol]);
    result.data.datasets[0].backgroundColor = active2DType === "Pie"
      ? result.data.labels.map((_, index) => colors[index % colors.length])
      : active2DType === "Area" ? "rgba(5, 150, 105, 0.2)" : "rgba(37, 99, 235, 0.78)";
    result.data.datasets[0].borderColor = active2DType === "Area" ? "#059669" : "#2563eb";
    result.data.datasets[0].borderWidth = active2DType === "Pie" ? 1 : 2;
    result.data.datasets[0].borderColor = active2DType === "Pie" ? "#ffffff" : active2DType === "Area" ? "#059669" : "#2563eb";
    result.data.datasets[0].borderRadius = active2DType === "Bar" ? 5 : 0;
    result.data.datasets[0].fill = active2DType === "Area";
    result.data.datasets[0].tension = 0.25;
    return result;
  }, [active2DType, rows, xAxisCol, yAxisCol, sizeAxisCol, selectedXType, selectedYType, selectedSizeType, headers]);

  const chart3DProps = useMemo(() => {
    const empty = { x: [], y: [], z: [], size: [], labels: [], error: "" };
    if (activeTab !== "3D") return empty;
    if (!rows.length) return { ...empty, error: "Upload a worksheet with data rows to create a 3D chart." };
    if (active3DType === "Pie3D" || active3DType === "PowerMap") return empty;
    if ([selectedXType, selectedYType, selectedZType].some((type) => type !== "numeric")) {
      return { ...empty, error: "3D plots require numeric X, Y, and Z columns. Nominal categories are not encoded as measurements." };
    }
    if (active3DType === "Bubble3D" && selectedSizeType !== "numeric") {
      return { ...empty, error: "3D bubble charts require a numeric size column." };
    }
    const indices = active3DType === "Bubble3D"
      ? [xAxisCol, yAxisCol, zAxisCol, sizeAxisCol]
      : [xAxisCol, yAxisCol, zAxisCol];
    const { points } = buildNumericPoints(rows, indices);
    const visiblePoints = active3DType === "Bubble3D"
      ? points.filter(({ values }) => values[3] > 0)
      : points;
    if (!visiblePoints.length) {
      return { ...empty, error: "No rows contain valid numeric values for all selected 3D dimensions." };
    }
    const sizes = active3DType === "Bubble3D"
      ? visiblePoints.map(({ values }) => values[3])
      : [];
    const minSize = sizes.length ? sizes.reduce((min, value) => Math.min(min, value), Infinity) : 0;
    const maxSize = sizes.length ? sizes.reduce((max, value) => Math.max(max, value), -Infinity) : 0;
    return {
      x: visiblePoints.map(({ values }) => values[0]),
      y: visiblePoints.map(({ values }) => values[1]),
      z: visiblePoints.map(({ values }) => values[2]),
      size: active3DType === "Bubble3D"
        ? sizes.map((value) => maxSize === minSize ? 10 : 5 + ((value - minSize) / (maxSize - minSize)) * 20)
        : [],
      sizeValues: active3DType === "Bubble3D" ? sizes : [],
      labels: visiblePoints.map(({ label }) => label),
      error: "",
    };
  }, [activeTab, active3DType, rows, xAxisCol, yAxisCol, zAxisCol, sizeAxisCol, selectedXType, selectedYType, selectedZType, selectedSizeType]);

  const surfaceGrid = useMemo(
    () => buildSurfaceGrid(rows, xAxisCol, yAxisCol, zAxisCol),
    [rows, xAxisCol, yAxisCol, zAxisCol]
  );

  const chart3DPie = useMemo(() => {
    if (!["categorical", "date", "boolean"].includes(selectedXType) || selectedZType !== "numeric") {
      return { labels: [], values: [], error: "3D pie charts require category/date labels and a numeric measure." };
    }
    const result = buildCategoryChart(rows, xAxisCol, zAxisCol, { positiveOnly: true });
    return {
      labels: result.data.labels,
      values: result.data.datasets[0]?.data || [],
      error: result.error,
    };
  }, [rows, xAxisCol, zAxisCol, selectedXType, selectedZType]);

  const powerMap = useMemo(() => {
    if (!/\bcountr(?:y|ies)\b/i.test(headers[xAxisCol] || "") || selectedZType !== "numeric") {
      return { labels: [], values: [], error: "Power Map requires a country/countries column and a numeric measure." };
    }
    const result = buildCategoryChart(rows, xAxisCol, zAxisCol);
    return {
      labels: result.data.labels,
      values: result.data.datasets[0]?.data || [],
      error: result.error,
    };
  }, [rows, xAxisCol, zAxisCol, selectedZType, headers]);

  const saveHistoryEntry = (details) => {
    const entryDetails = {
      ...details,
      userId,
      datasetName: fileName || "Uploaded dataset",
      rowCount: rows.length,
    };
    if (details.type === "chart" || details.type === "summary") {
      entryDetails.dedupeKey = createAnalysisDedupeKey(entryDetails);
    }
    const entry = createAnalysisEntry(entryDetails);
    saveAnalysisHistory(dispatch, entry, Boolean(user));
  };

  const saveChartHistory = () => {
    const title = getChartTitle(
      active2DType,
      displayColumnLabel(headers[xAxisCol]),
      displayColumnLabel(headers[yAxisCol]),
      displayColumnLabel(headers[sizeAxisCol])
    );
    const dataset = chart2DResult.data.datasets?.[0];
    const chartRows = chart2DResult.data.labels?.length
      ? chart2DResult.data.labels.map((label, index) => [label, dataset?.data?.[index]])
      : (dataset?.data || []).map((point) => [point.label || "", point.x, point.y, point.sizeValue ?? point.r ?? ""]);
    saveHistoryEntry({
      type: "chart",
      title,
      chart: {
        chartType: active2DType,
        columns: chart2DResult.data.labels?.length
          ? [displayColumnLabel(headers[xAxisCol]), displayColumnLabel(headers[yAxisCol])]
          : ["Record", displayColumnLabel(headers[xAxisCol]), displayColumnLabel(headers[yAxisCol]), active2DType === "Bubble" ? displayColumnLabel(headers[sizeAxisCol]) : "Size"],
        rows: chartRows.slice(0, 200),
        totalRows: chartRows.length,
      },
    });
  };

  const save3DChartHistory = () => {
    let columns;
    let chartRows;
    if (active3DType === "Pie3D") {
      columns = [displayColumnLabel(headers[xAxisCol]), displayColumnLabel(headers[zAxisCol])];
      chartRows = chart3DPie.labels.map((label, index) => [label, chart3DPie.values[index]]);
    } else if (active3DType === "PowerMap") {
      columns = [displayColumnLabel(headers[xAxisCol]), displayColumnLabel(headers[zAxisCol])];
      chartRows = powerMap.labels.map((label, index) => [label, powerMap.values[index]]);
    } else if (active3DType === "Surface") {
      columns = [displayColumnLabel(headers[xAxisCol]), displayColumnLabel(headers[yAxisCol]), displayColumnLabel(headers[zAxisCol])];
      chartRows = surfaceGrid.zMatrix.flatMap((values, yIndex) =>
        values.map((value, xIndex) => [surfaceGrid.xValues[xIndex], surfaceGrid.yValues[yIndex], value])
          .filter((row) => row[2] !== null)
      );
    } else {
      columns = [displayColumnLabel(headers[xAxisCol]), displayColumnLabel(headers[yAxisCol]), displayColumnLabel(headers[zAxisCol])];
      if (active3DType === "Bubble3D") columns.push(displayColumnLabel(headers[sizeAxisCol]));
      chartRows = chart3DProps.x.map((x, index) => [
        x,
        chart3DProps.y[index],
        chart3DProps.z[index],
        ...(active3DType === "Bubble3D" ? [chart3DProps.sizeValues[index]] : []),
      ]);
    }
    saveHistoryEntry({
      type: "chart",
      title: `${active3DType}: ${columns.join(" / ")}`,
      chart: { chartType: active3DType, columns, rows: chartRows.slice(0, 200), totalRows: chartRows.length },
    });
  };

  const saveSummaryHistory = () => {
    saveHistoryEntry({
      type: "summary",
      title: `Statistics summary for ${fileName || "uploaded dataset"}`,
      chart: {
        chartType: "Summary",
        columns: ["Column", "Type", "Valid rows", "Sum", "Average", "Minimum", "Maximum"],
        rows: summaryStats.map((item) => [
          item.header, item.type, item.count, item.sum, item.mean, item.min, item.max,
        ]),
        totalRows: summaryStats.length,
      },
    });
  };

  // Compute Summary Statistics ONLY when SUMMARY tab is viewed
  const summaryStats = useMemo(() => {
    if (activeTab !== "SUMMARY") return [];
    return columnAnalysis.map((col) => {
      const vals = col.type === "numeric"
        ? rows.map((row) => parseNumericValue(row?.[col.colIndex])).filter((number) => number !== null)
        : [];

      if (vals.length === 0) {
        return {
          ...col,
          count: col.type === "numeric" ? 0 : col.validCount,
          min: "N/A",
          max: "N/A",
          mean: "N/A",
          sum: "N/A",
        };
      }

      const sum = vals.reduce((a, b) => a + b, 0);
      const min = vals.reduce((current, value) => Math.min(current, value), Infinity);
      const max = vals.reduce((current, value) => Math.max(current, value), -Infinity);
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

  useEffect(() => {
    if (activeTab === "2D" && !chart2DResult.error) {
      saveChartHistory();
    }
  }, [activeTab, active2DType, xAxisCol, yAxisCol, sizeAxisCol, chart2DResult, fileName]);

  useEffect(() => {
    if (activeTab !== "3D") return;
    const valid =
      active3DType === "Pie3D" ? !chart3DPie.error :
      active3DType === "PowerMap" ? !powerMap.error :
      active3DType === "Surface" ? !chart3DProps.error && !surfaceGrid.error :
      !chart3DProps.error;
    if (valid) save3DChartHistory();
  }, [
    activeTab, active3DType, xAxisCol, yAxisCol, zAxisCol, sizeAxisCol,
    chart3DProps, chart3DPie, surfaceGrid, powerMap, fileName,
  ]);

  useEffect(() => {
    if (activeTab === "SUMMARY" && summaryStats.length > 0) {
      saveSummaryHistory();
    }
  }, [activeTab, summaryStats, fileName]);

  const exportSummaryCsv = () => {
    let csv = "Column,Data Type,Count,Sum,Average,Min,Max\n";
    summaryStats.forEach((s) => {
      csv += `"${s.header}","${s.type}",${s.count},"${s.sum}","${s.mean}","${s.min}","${s.max}"\n`;
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
            Active Dataset: <span className="font-semibold text-gray-700">{fileName || "No dataset selected"}</span> ({rows.length} rows, {headers.length} columns)
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
      <Tab
        activeTab={activeTab}
        onTabChange={handleAnalyticsTabChange}
        counts={{ history: historyEntries.filter((entry) => entry.userId === userId).length }}
      />

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
                    {h} ({columnAnalysis[i]?.type || "empty"})
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
                    {h} ({columnAnalysis[i]?.type || "empty"})
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
                      {h} ({columnAnalysis[i]?.type || "empty"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {((activeTab === "2D" && active2DType === "Bubble") ||
              (activeTab === "3D" && active3DType === "Bubble3D")) && (
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
                      {h} ({columnAnalysis[i]?.type || "empty"})
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
                onClick={() => select2DType(type.id)}
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

          <div className="w-full space-y-3">
            {chart2DResult.error ? (
              <ChartValidationMessage message={chart2DResult.error} />
            ) : (
              <>
            {chart2DResult.warning && <ChartValidationMessage message={chart2DResult.warning} warning />}
            {active2DType === "Bar" && (
              <BarChart
                chartData={chart2DResult.data}
                title={`${displayColumnLabel(headers[yAxisCol])} by ${displayColumnLabel(headers[xAxisCol])}`}
                xAxisLabel={displayColumnLabel(headers[xAxisCol])}
                yAxisLabel={displayColumnLabel(headers[yAxisCol])}
                currency={/inr/i.test(headers[yAxisCol] || "")}
              />
            )}
            {active2DType === "Line" && (
              <LineChart
                chartData={chart2DResult.data}
                title={`${displayColumnLabel(headers[yAxisCol])} by ${displayColumnLabel(headers[xAxisCol])}`}
                xAxisLabel={displayColumnLabel(headers[xAxisCol])}
                yAxisLabel={displayColumnLabel(headers[yAxisCol])}
                currency={/inr/i.test(headers[yAxisCol] || "")}
              />
            )}
            {active2DType === "Area" && (
              <AreaChart
                chartData={chart2DResult.data}
                title={`${displayColumnLabel(headers[yAxisCol])} by ${displayColumnLabel(headers[xAxisCol])}`}
                xAxisLabel={displayColumnLabel(headers[xAxisCol])}
                yAxisLabel={displayColumnLabel(headers[yAxisCol])}
                currency={/inr/i.test(headers[yAxisCol] || "")}
              />
            )}
            {active2DType === "Pie" && (
              <PieChartComponent
                chartData={chart2DResult.data}
                title={`Distribution of ${displayColumnLabel(headers[yAxisCol])} by ${displayColumnLabel(headers[xAxisCol])}`}
                currency={/inr/i.test(headers[yAxisCol] || "")}
              />
            )}
            {active2DType === "Scatter" && (
              <ScatterChartComponent
                chartData={chart2DResult.data}
                title={`Correlation: ${displayColumnLabel(headers[xAxisCol])} vs ${displayColumnLabel(headers[yAxisCol])}`}
                xAxisLabel={displayColumnLabel(headers[xAxisCol])}
                yAxisLabel={displayColumnLabel(headers[yAxisCol])}
                currency={/inr/i.test(headers[yAxisCol] || "")}
              />
            )}
            {active2DType === "Bubble" && (
              <BubbleChartComponent
                chartData={chart2DResult.data}
                title={`${displayColumnLabel(headers[xAxisCol])} vs ${displayColumnLabel(headers[yAxisCol])} (Size: ${displayColumnLabel(headers[sizeAxisCol])})`}
                xAxisLabel={displayColumnLabel(headers[xAxisCol])}
                yAxisLabel={displayColumnLabel(headers[yAxisCol])}
                currency={/inr/i.test(headers[yAxisCol] || "")}
              />
            )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 3D VISUALIZATIONS TAB - Lazy Loaded on Demand */}
      {activeTab === "3D" && (
        <div>
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: "Bar3D", label: "3D Point Plot" },
              { id: "Surface", label: "3D Surface Mesh" },
              { id: "Scatter3D", label: "3D Scatter Cloud" },
              { id: "Bubble3D", label: "3D Bubble Space" },
              { id: "Area3D", label: "3D Line Plot" },
              { id: "Pie3D", label: "Donut Chart" },
              { id: "PowerMap", label: "3D Globe Power Map" },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => select3DType(type.id)}
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

          {(
            active3DType === "Pie3D" ? !chart3DPie.error :
            active3DType === "PowerMap" ? !powerMap.error :
            active3DType === "Surface" ? !chart3DProps.error && !surfaceGrid.error :
            !chart3DProps.error
          ) && <p className="mb-4 text-xs text-slate-500">Chart saved to analysis history.</p>}

          <div className="w-full space-y-3">
            {active3DType === "Pie3D" ? (
              chart3DPie.error
                ? <ChartValidationMessage message={chart3DPie.error} />
                : <PieChart3D labels={chart3DPie.labels} values={chart3DPie.values} title={`Distribution of ${displayColumnLabel(headers[zAxisCol])} by ${displayColumnLabel(headers[xAxisCol])}`} />
            ) : active3DType === "PowerMap" ? (
              powerMap.error
                ? <ChartValidationMessage message={powerMap.error} />
                : <PowerMapChart3D locations={powerMap.labels} values={powerMap.values} measureLabel={displayColumnLabel(headers[zAxisCol])} title={`Geographic Power Map: ${displayColumnLabel(headers[zAxisCol])}`} />
            ) : chart3DProps.error ? (
              <ChartValidationMessage message={chart3DProps.error} />
            ) : active3DType === "Surface" && surfaceGrid.error ? (
              <ChartValidationMessage message={surfaceGrid.error} />
            ) : (
              <>
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
                      colorbar: { title: displayColumnLabel(headers[zAxisCol]) || "Z", thickness: 12 },
                    },
                  },
                ]}
                title={`3D Point Plot: ${displayColumnLabel(headers[xAxisCol])} / ${displayColumnLabel(headers[yAxisCol])} / ${displayColumnLabel(headers[zAxisCol])}`}
                xLabel={displayColumnLabel(headers[xAxisCol])}
                yLabel={displayColumnLabel(headers[yAxisCol])}
                zLabel={displayColumnLabel(headers[zAxisCol])}
              />
            )}
            {active3DType === "Surface" && (
              <SurfaceChart3D
                xValues={surfaceGrid.xValues}
                yValues={surfaceGrid.yValues}
                zMatrix={surfaceGrid.zMatrix}
                title={`3D Surface Topology: ${displayColumnLabel(headers[zAxisCol])}`}
                xLabel={displayColumnLabel(headers[xAxisCol])}
                yLabel={displayColumnLabel(headers[yAxisCol])}
                zLabel={displayColumnLabel(headers[zAxisCol])}
              />
            )}
            {active3DType === "Scatter3D" && (
              <ScatterChart3D
                x={chart3DProps.x}
                y={chart3DProps.y}
                z={chart3DProps.z}
                labels={chart3DProps.labels}
                title={`3D Point Cloud: (${displayColumnLabel(headers[xAxisCol])}, ${displayColumnLabel(headers[yAxisCol])}, ${displayColumnLabel(headers[zAxisCol])})`}
                xLabel={displayColumnLabel(headers[xAxisCol])}
                yLabel={displayColumnLabel(headers[yAxisCol])}
                zLabel={displayColumnLabel(headers[zAxisCol])}
              />
            )}
            {active3DType === "Bubble3D" && (
              <BubbleChart3D
                x={chart3DProps.x}
                y={chart3DProps.y}
                z={chart3DProps.z}
                size={chart3DProps.size}
                sizeValues={chart3DProps.sizeValues}
                labels={chart3DProps.labels}
                title={`3D Bubble: ${displayColumnLabel(headers[xAxisCol])} / ${displayColumnLabel(headers[yAxisCol])} / ${displayColumnLabel(headers[zAxisCol])}`}
                xLabel={displayColumnLabel(headers[xAxisCol])}
                yLabel={displayColumnLabel(headers[yAxisCol])}
                zLabel={displayColumnLabel(headers[zAxisCol])}
                sizeLabel={displayColumnLabel(headers[sizeAxisCol])}
              />
            )}
            {active3DType === "Area3D" && (
              <AreaChart3D
                x={chart3DProps.x}
                y={chart3DProps.y}
                z={chart3DProps.z}
                title={`3D Line Plot: ${displayColumnLabel(headers[zAxisCol])}`}
                xLabel={displayColumnLabel(headers[xAxisCol])}
                yLabel={displayColumnLabel(headers[yAxisCol])}
                zLabel={displayColumnLabel(headers[zAxisCol])}
              />
            )}
              </>
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
              <p className="text-xs text-gray-500">Statistical metrics computed for numeric columns.</p>
            </div>
            <div className="flex gap-2">
              {summaryStats.length > 0 && (
                <span className="self-center text-xs text-slate-500">Saved to analysis history</span>
              )}
              <button
                onClick={exportSummaryCsv}
                disabled={summaryStats.length === 0}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" />
                Export Summary CSV
              </button>
            </div>
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
                          col.type === "numeric"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {col.type}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{col.count}</td>
                    <td className="p-3 text-gray-600 font-mono">{col.sum}</td>
                    <td className="p-3 text-gray-600 font-mono">{col.mean}</td>
                    <td className="p-3 text-gray-600 font-mono">{col.min}</td>
                    <td className="p-3 text-gray-600 font-mono">{col.max}</td>
                  </tr>
                ))}
                {summaryStats.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-sm text-gray-500">
                      Upload a worksheet with data to see column statistics.
                    </td>
                  </tr>
                )}
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

      {activeTab === "HISTORY" && <AnalysisHistory userId={userId} />}
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
