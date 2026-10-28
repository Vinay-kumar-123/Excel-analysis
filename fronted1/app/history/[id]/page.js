"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch } from "react-redux";
import {
  Clock,
  ArrowLeft,
  FileSpreadsheet,
  BarChart3,
  Sparkles,
  Table,
  Download,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  AlertCircle,
  FileText,
  Layers,
  ChevronRight,
  Info,
} from "lucide-react";
import { toast } from "react-toastify";
import AuthGuard from "@/components/AuthGuard";
import GeminiReport from "@/components/GeminiReport";
import { fetchAnalysisById, deleteAnalysisHistory } from "@/lib/historyService";
import { setExcelData } from "@/redux/excelSlice";
import { downloadBlob, exportHistoryAsMarkdown } from "@/lib/analysisHistory.mjs";
import { buildCategoryChart, buildNumericPoints } from "@/lib/chartData.mjs";

import BarChart from "@/components/chart2D/BarChart";
import LineChart from "@/components/chart2D/LineChart";
import AreaChart from "@/components/chart2D/AreaChart";
import PieChartComponent from "@/components/chart2D/pieChart";
import ScatterChartComponent from "@/components/chart2D/ScatterChart";
import BubbleChartComponent from "@/components/chart2D/bubbleChart";

function HistoryDetailContent() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const rawId = params?.id;
  const id = typeof rawId === "string" && rawId !== "undefined" && rawId !== "null" ? rawId.trim() : null;

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("charts");
  const [selectedSheet, setSelectedSheet] = useState("");
  const [copiedInsightId, setCopiedInsightId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadAnalysis() {
      if (!id) {
        if (isMounted) {
          setError("Invalid analysis ID specified. Please select a valid analysis from the history list.");
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAnalysisById(id);
        if (isMounted) {
          if (data) {
            setAnalysis(data);
            setSelectedSheet(data.selectedSheet || data.sheetNames?.[0] || "");
            // If no charts exist, default to dataset preview tab
            if (!data.chartConfigurations?.length && !data.chart?.columns?.length) {
              setActiveTab("dataset");
            }
          } else {
            setError("Analysis record not found or you do not have permission to view it.");
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load analysis record.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadAnalysis();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleOpenInStudio = () => {
    if (!analysis) return;
    const dataToRestore = Array.isArray(analysis.dataSnapshot) && analysis.dataSnapshot.length > 0
      ? analysis.dataSnapshot
      : [];

    if (!dataToRestore.length) {
      toast.warning("This historical record does not contain raw data rows to restore.");
      return;
    }

    dispatch(
      setExcelData({
        data: dataToRestore,
        fileName: analysis.fileName,
        sheetNames: analysis.sheetNames || [],
        activeSheet: selectedSheet || analysis.selectedSheet || "",
        analysisId: analysis.id || analysis._id,
      })
    );

    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("excel_data", JSON.stringify(dataToRestore));
        sessionStorage.setItem("excel_filename", analysis.fileName);
        sessionStorage.setItem("excel_analysis_id", analysis.id || analysis._id);
      } catch (e) {
        console.warn("Could not save to session storage:", e);
      }
    }

    toast.success(`Restored "${analysis.fileName}" into Visualization Studio`);
    router.push("/tabSection");
  };

  const handleExportDatasetCsv = () => {
    if (!analysis?.dataSnapshot || !analysis.dataSnapshot.length) {
      toast.warning("No data snapshot available to export.");
      return;
    }
    const csvContent = analysis.dataSnapshot
      .map((row) =>
        (Array.isArray(row) ? row : [])
          .map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const filename = `${(analysis.fileName || "dataset").replace(/[^a-z0-9_-]/gi, "_")}_data.csv`;
    downloadBlob(csvContent, filename, "text/csv;charset=utf-8;");
    toast.success("Dataset CSV downloaded successfully!");
  };

  const handleExportChartCsv = (chart) => {
    const columns = chart?.chartData?.columns || chart?.chart?.columns || [];
    const rows = chart?.chartData?.rows || chart?.chart?.rows || [];
    if (!columns.length) {
      toast.warning("No chart data available to export.");
      return;
    }
    const headers = columns.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",");
    const csvRows = rows
      .map((r) => (Array.isArray(r) ? r.map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(",") : ""))
      .join("\n");
    const filename = `${(chart.title || "chart").replace(/[^a-z0-9_-]/gi, "_")}.csv`;
    downloadBlob(`${headers}\n${csvRows}`, filename, "text/csv;charset=utf-8;");
    toast.success("Chart CSV exported!");
  };

  const handleCopyInsight = (text, insightId) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedInsightId(insightId);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedInsightId(null), 2000);
  };

  const handleDelete = async () => {
    if (!analysis) return;
    await deleteAnalysisHistory(dispatch, analysis.id || analysis._id, true);
    setShowDeleteModal(false);
    toast.success(`Deleted analysis "${analysis.fileName}"`);
    router.push("/history");
  };

  // Reconstruct chart data points for visualization rendering
  const reconstructedCharts = useMemo(() => {
    if (!analysis) return [];
    const configs = Array.isArray(analysis.chartConfigurations) && analysis.chartConfigurations.length > 0
      ? analysis.chartConfigurations
      : [];

    // Also support legacy standalone chart snapshot
    if (!configs.length && analysis.chart?.columns?.length) {
      configs.push({
        id: "legacy-chart",
        chartType: analysis.chart.chartType || "Bar",
        title: analysis.title || "Saved Chart Snapshot",
        chartData: analysis.chart,
      });
    }

    const dataRows = Array.isArray(analysis.dataSnapshot) && analysis.dataSnapshot.length > 1
      ? analysis.dataSnapshot.slice(1)
      : [];

    return configs.map((config) => {
      const type = config.chartType || "Bar";
      let renderedComponent = null;

      if (config.chartData?.columns?.length && config.chartData?.rows?.length) {
        const labels = config.chartData.rows.map((r) => String(r[0] ?? ""));
        const values = config.chartData.rows.map((r) => Number(r[1]) || 0);

        if (type === "Bar" || type === "Bar3D") {
          const chartData = {
            labels,
            datasets: [
              {
                label: config.yLabel || config.chartData.columns[1] || "Value",
                data: values,
                backgroundColor: "rgba(99, 102, 241, 0.75)",
                borderColor: "rgba(99, 102, 241, 1)",
                borderWidth: 1.5,
                borderRadius: 6,
              },
            ],
          };
          renderedComponent = <BarChart chartData={chartData} title={config.title} xAxisLabel={config.xLabel} yAxisLabel={config.yLabel} />;
        } else if (type === "Line" || type === "Area3D") {
          const chartData = {
            labels,
            datasets: [
              {
                label: config.yLabel || config.chartData.columns[1] || "Value",
                data: values,
                borderColor: "rgb(99, 102, 241)",
                backgroundColor: "rgba(99, 102, 241, 0.15)",
                fill: true,
                tension: 0.3,
              },
            ],
          };
          renderedComponent = <LineChart chartData={chartData} title={config.title} xAxisLabel={config.xLabel} yAxisLabel={config.yLabel} />;
        } else if (type === "Area") {
          const chartData = {
            labels,
            datasets: [
              {
                label: config.yLabel || config.chartData.columns[1] || "Value",
                data: values,
                backgroundColor: "rgba(79, 70, 229, 0.4)",
                borderColor: "rgb(79, 70, 229)",
                fill: true,
                tension: 0.4,
              },
            ],
          };
          renderedComponent = <AreaChart chartData={chartData} title={config.title} xAxisLabel={config.xLabel} yAxisLabel={config.yLabel} />;
        } else if (type === "Pie" || type === "Pie3D") {
          const chartData = {
            labels,
            datasets: [
              {
                data: values,
                backgroundColor: [
                  "#6366f1", "#3b82f6", "#10b981", "#f59e0b",
                  "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6",
                ],
              },
            ],
          };
          renderedComponent = <PieChartComponent chartData={chartData} title={config.title} />;
        }
      }

      return {
        ...config,
        renderedComponent,
      };
    });
  }, [analysis]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50/60 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-pulse">
        <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
          <div className="h-6 w-64 bg-slate-200 rounded mb-3" />
          <div className="h-4 w-96 bg-slate-100 rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="h-64 bg-white border border-slate-200 rounded-2xl" />
      </main>
    );
  }

  if (error || !analysis) {
    return (
      <main className="min-h-screen bg-slate-50/60 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Analysis Not Found</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
            {error || "The requested analysis record does not exist or you do not have permission to view it."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/history"
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              Back to History
            </Link>
            <Link
              href="/upload"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Upload New Excel
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const allSavedInsights = Array.isArray(analysis.savedInsights) && analysis.savedInsights.length > 0
    ? analysis.savedInsights
    : analysis.response
    ? [{ id: "legacy-ai", query: analysis.prompt || "Gemini Insight", response: analysis.response, createdAt: analysis.createdAt }]
    : [];

  const headers = analysis.dataSnapshot?.[0] || [];
  const previewRows = analysis.dataSnapshot?.slice(1) || [];

  return (
    <main className="min-h-screen bg-slate-50/60 pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/history" className="hover:text-indigo-600 flex items-center gap-1 transition">
          <ArrowLeft className="h-3.5 w-3.5" />
          Analysis History
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="font-semibold text-slate-800 truncate max-w-md">
          {analysis.fileName}
        </span>
      </nav>

      {/* Order-Detail Style Top Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{analysis.fileName}</h1>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase text-slate-700">
                  {analysis.fileType || "XLSX"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    analysis.status === "Completed"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : analysis.status === "Processing"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {analysis.status || "Completed"}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  Analyzed:{" "}
                  {analysis.createdAt && Number.isFinite(Date.parse(analysis.createdAt))
                    ? new Date(analysis.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Recently"}
                </span>
                {analysis.fileSize > 0 && (
                  <span>· {(analysis.fileSize / 1024).toFixed(1)} KB</span>
                )}
                <span>· ID: <span className="font-mono text-slate-600">{analysis.id || analysis._id}</span></span>
              </div>
            </div>
          </div>

          {/* Action Buttons Right */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenInStudio}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition cursor-pointer"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open in Studio</span>
            </button>

            {analysis.dataSnapshot?.length > 0 && (
              <button
                type="button"
                onClick={handleExportDatasetCsv}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                title="Download restored dataset as CSV"
              >
                <Download className="h-4 w-4 text-slate-500" />
                <span>Export Dataset</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="rounded-xl border border-red-200 p-2.5 text-red-600 hover:bg-red-50 transition cursor-pointer"
              title="Delete this analysis"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Overview Metric Cards Bar */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="text-[11px] font-medium uppercase text-slate-500">Records Analyzed</span>
            <div className="mt-1 text-xl font-bold text-slate-900">
              {(analysis.rowCount || Math.max(0, (analysis.dataSnapshot?.length || 1) - 1)).toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="text-[11px] font-medium uppercase text-slate-500">Columns</span>
            <div className="mt-1 text-xl font-bold text-slate-900">
              {analysis.columnCount || (analysis.dataSnapshot?.[0]?.length || 0)}
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="text-[11px] font-medium uppercase text-slate-500">Worksheets</span>
            <div className="mt-1 text-xl font-bold text-slate-900">
              {analysis.sheetNames?.length || 1}
            </div>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
            <span className="text-[11px] font-medium uppercase text-blue-700 flex items-center gap-1">
              <BarChart3 className="h-3 w-3" /> Saved Charts
            </span>
            <div className="mt-1 text-xl font-bold text-blue-900">
              {analysis.chartCount || reconstructedCharts.length}
            </div>
          </div>
          <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3">
            <span className="text-[11px] font-medium uppercase text-purple-700 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> AI Insights
            </span>
            <div className="mt-1 text-xl font-bold text-purple-900">
              {allSavedInsights.length > 0 ? "Saved" : "None"}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Navigation Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-4">
          {[
            { id: "charts", label: "Visualizations", count: reconstructedCharts.length, icon: BarChart3 },
            { id: "dataset", label: "Dataset Preview", count: previewRows.length, icon: Layers },
            { id: "statistics", label: "Summary Statistics", count: analysis.summaryStatistics?.length || 0, icon: Table },
            { id: "insights", label: "Saved AI Insights", count: allSavedInsights.length, icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 py-3 px-1 text-xs font-semibold transition cursor-pointer ${
                  active
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      active ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Saved Visualizations */}
      {activeTab === "charts" && (
        <div className="space-y-6">
          {reconstructedCharts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Charts Saved for this Analysis</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                Restore this workbook in the Visualizations Studio to create and save interactive 2D and 3D charts.
              </p>
              <button
                type="button"
                onClick={handleOpenInStudio}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in Studio to Create Charts
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {reconstructedCharts.map((chart, idx) => (
                <div
                  key={chart.id || idx}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                          {chart.chartType} Chart
                        </span>
                        {chart.worksheet && (
                          <span className="text-[11px] text-slate-400">
                            Sheet: <span className="font-semibold text-slate-600">{chart.worksheet}</span>
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{chart.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {chart.xLabel && <span>X: <strong>{chart.xLabel}</strong></span>}
                        {chart.yLabel && <span>· Y: <strong>{chart.yLabel}</strong></span>}
                        {chart.zLabel && <span>· Z: <strong>{chart.zLabel}</strong></span>}
                        {chart.sizeLabel && <span>· Size: <strong>{chart.sizeLabel}</strong></span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleExportChartCsv(chart)}
                      className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>

                  {/* Render Chart Component */}
                  {chart.renderedComponent ? (
                    <div className="h-80 w-full">{chart.renderedComponent}</div>
                  ) : chart.chartData?.columns?.length ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="min-w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-700">
                          <tr>
                            {chart.chartData.columns.map((col, cIdx) => (
                              <th key={cIdx} className="px-3 py-2 font-semibold whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(chart.chartData.rows || []).slice(0, 10).map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50">
                              {row.map((val, vIdx) => (
                                <td key={vIdx} className="px-3 py-1.5 text-slate-700 whitespace-nowrap">
                                  {val === null || val === undefined ? "—" : String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-50 p-6 text-center text-xs text-slate-500">
                      Chart configuration preserved. Open in Studio to view in full interactive mode.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Dataset Preview & Worksheets */}
      {activeTab === "dataset" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Workbook Data Snapshot</h3>
              <p className="text-xs text-slate-500">
                {analysis.isSampled
                  ? `Showing first ${previewRows.length} sample rows of ${analysis.totalRows || analysis.rowCount} total records for optimal performance.`
                  : `Showing all ${previewRows.length} saved rows.`}
              </p>
            </div>

            {/* Sheet Tabs */}
            {analysis.sheetNames?.length > 1 && (
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 p-1 bg-slate-50">
                {analysis.sheetNames.map((sheet) => (
                  <button
                    key={sheet}
                    type="button"
                    onClick={() => setSelectedSheet(sheet)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                      selectedSheet === sheet
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {sheet}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Columns Schema Badges */}
          {analysis.columns?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {analysis.columns.map((col, idx) => (
                <span
                  key={idx}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 border border-slate-200"
                >
                  <span className="font-semibold">{col.header}</span>:{" "}
                  <span className="text-slate-500 capitalize">{col.type}</span>
                </span>
              ))}
            </div>
          )}

          {/* Table Data Preview */}
          {previewRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
              No data rows saved in this snapshot.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-96 overflow-y-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-slate-700 border-b border-slate-200 z-10">
                  <tr>
                    <th className="px-3 py-2 text-slate-400 font-mono w-12 text-center">#</th>
                    {headers.map((h, i) => (
                      <th key={i} className="px-3 py-2 font-semibold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {previewRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/80 transition">
                      <td className="px-3 py-1.5 text-slate-400 font-mono text-center text-[10px]">
                        {rIdx + 1}
                      </td>
                      {row.map((val, vIdx) => (
                        <td key={vIdx} className="px-3 py-1.5 text-slate-700 whitespace-nowrap">
                          {val === null || val === undefined ? "—" : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Summary Statistics */}
      {activeTab === "statistics" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Descriptive Summary Statistics</h3>
            <p className="text-xs text-slate-500">Column metrics computed from the workbook dataset.</p>
          </div>

          {analysis.summaryStatistics?.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-semibold">Column Name</th>
                    <th className="p-3 font-semibold">Type</th>
                    <th className="p-3 font-semibold">Valid Rows</th>
                    <th className="p-3 font-semibold">Sum</th>
                    <th className="p-3 font-semibold">Average (Mean)</th>
                    <th className="p-3 font-semibold">Minimum</th>
                    <th className="p-3 font-semibold">Maximum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analysis.summaryStatistics.map((stat, sIdx) => (
                    <tr key={sIdx} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-900">{stat.header || stat[0]}</td>
                      <td className="p-3 text-slate-600">{stat.type || stat[1]}</td>
                      <td className="p-3 text-slate-600">{stat.count || stat[2]}</td>
                      <td className="p-3 font-mono text-slate-700">{stat.sum || stat[3]}</td>
                      <td className="p-3 font-mono text-slate-700">{stat.mean || stat[4]}</td>
                      <td className="p-3 font-mono text-slate-700">{stat.min || stat[5]}</td>
                      <td className="p-3 font-mono text-slate-700">{stat.max || stat[6]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
              No summary statistics were calculated for this analysis. Open in Studio to view column statistics.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Saved AI Insights */}
      {activeTab === "insights" && (
        <div className="space-y-4">
          {allSavedInsights.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 mb-3">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No AI Insights Generated Yet</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                No Gemini insights were saved for this workbook. You can launch the AI Hub to ask questions about your data.
              </p>
              <Link
                href="/ai"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Launch AI Intelligence Hub
              </Link>
            </div>
          ) : (
            allSavedInsights.map((insight, idx) => (
              <GeminiReport
                key={insight.id || idx}
                response={insight.response}
                dataset={analysis.dataSnapshot || []}
                fileName={analysis.fileName}
                query={insight.query}
                timestamp={insight.createdAt || analysis.createdAt}
              />
            ))
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Analysis?</h3>
                <p className="text-xs text-slate-500">
                  Permanently delete &ldquo;{analysis.fileName}&rdquo; and all its saved charts?
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function HistoryDetailPage() {
  return (
    <AuthGuard requiredMessage="Please log in to view analysis history.">
      <HistoryDetailContent />
    </AuthGuard>
  );
}
