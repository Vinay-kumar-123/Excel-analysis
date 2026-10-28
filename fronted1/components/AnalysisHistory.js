"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import {
  Clock,
  Trash2,
  Sparkles,
  BarChart3,
  Table,
  Search,
  Download,
  Copy,
  Check,
  RefreshCw,
  Cloud,
  CloudCheck,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  AlertCircle,
  FileText,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  filterAndSortHistory,
  exportHistoryTableAsCsv,
  exportHistoryAsMarkdown,
  downloadBlob,
} from "@/lib/analysisHistory.mjs";
import {
  fetchUserHistory,
  deleteAnalysisHistory,
  clearAllAnalysisHistory,
} from "@/lib/historyService";

export default function AnalysisHistory({ userId }) {
  const dispatch = useDispatch();
  const rawEntries = useSelector((state) => state.history?.entries || []);
  const loading = useSelector((state) => state.history?.loading || false);
  const syncStatus = useSelector((state) => state.history?.syncStatus || "idle");
  const authUser = useSelector((state) => state.auth?.user);
  const isAuthenticated = Boolean(authUser);

  // Filter and display states
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(10);
  const [expandedCards, setExpandedCards] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Sync with backend on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserHistory(dispatch);
    }
  }, [isAuthenticated, dispatch]);

  // Filter entries for this specific user
  const userEntries = useMemo(() => {
    return rawEntries.filter((entry) => {
      if (!userId || userId === "anonymous") return true;
      return !entry.userId || entry.userId === userId || entry.userId === "anonymous";
    });
  }, [rawEntries, userId]);

  // Filtered and sorted results
  const filteredEntries = useMemo(() => {
    return filterAndSortHistory(userEntries, {
      type: activeFilter,
      search: searchQuery,
      sort: sortBy,
    });
  }, [userEntries, activeFilter, searchQuery, sortBy]);

  // Statistics overview
  const stats = useMemo(() => {
    const total = userEntries.length;
    const aiCount = userEntries.filter((e) => e.type === "ai").length;
    const chartCount = userEntries.filter((e) => e.type === "chart").length;
    const summaryCount = userEntries.filter((e) => e.type === "summary").length;
    return { total, aiCount, chartCount, summaryCount };
  }, [userEntries]);

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => {
      setCopiedId((current) => (current === id ? null : current));
    }, 2000);
  };

  const handleExportCsv = (entry) => {
    const csv = exportHistoryTableAsCsv(entry);
    if (!csv) {
      toast.warning("No table rows available to export.");
      return;
    }
    const filename = `${(entry.title || "chart_data").replace(/[^a-z0-9_-]/gi, "_")}.csv`;
    downloadBlob(csv, filename, "text/csv;charset=utf-8;");
    toast.success("CSV exported successfully!");
  };

  const handleExportMarkdown = (entry) => {
    const md = exportHistoryAsMarkdown(entry);
    const filename = `${(entry.title || "analysis").replace(/[^a-z0-9_-]/gi, "_")}.md`;
    downloadBlob(md, filename, "text/markdown;charset=utf-8;");
    toast.success("Markdown exported successfully!");
  };

  const handleDelete = (id, title) => {
    deleteAnalysisHistory(dispatch, id, isAuthenticated);
    toast.info(`Deleted "${title || "analysis entry"}"`);
  };

  const handleClearAll = () => {
    clearAllAnalysisHistory(dispatch, userId, isAuthenticated);
    setShowClearConfirm(false);
    toast.success("All analysis history cleared.");
  };

  const toggleExpand = (id) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Analysis History</h1>
                <p className="text-xs text-slate-500">
                  Comprehensive audit trail of AI insights, charts, and summary statistics.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sync Status Badge */}
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                syncStatus === "syncing"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : isAuthenticated
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
              title={
                isAuthenticated
                  ? "History is saved to your account and persistent across devices"
                  : "History is saved locally in your browser"
              }
            >
              {syncStatus === "syncing" ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin text-amber-600" />
                  <span>Syncing...</span>
                </>
              ) : isAuthenticated ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span>Cloud Synced</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                  <span>Local Cache</span>
                </>
              )}
            </div>

            {/* Refresh from cloud button */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => fetchUserHistory(dispatch)}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                title="Refresh history from cloud"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
                <span>Refresh</span>
              </button>
            )}

            {/* Clear history button */}
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              disabled={userEntries.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear history</span>
            </button>
          </div>
        </div>

        {/* Analytics Statistics Row */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Saved</span>
            <div className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</div>
          </div>
          <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3.5">
            <span className="text-[11px] font-medium text-purple-700 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> AI Insights
            </span>
            <div className="mt-1 text-2xl font-bold text-purple-900">{stats.aiCount}</div>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
            <span className="text-[11px] font-medium text-blue-700 uppercase tracking-wider flex items-center gap-1">
              <BarChart3 className="h-3 w-3" /> Charts
            </span>
            <div className="mt-1 text-2xl font-bold text-blue-900">{stats.chartCount}</div>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5">
            <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <Table className="h-3 w-3" /> Summaries
            </span>
            <div className="mt-1 text-2xl font-bold text-emerald-900">{stats.summaryCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Pill Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "All Items", count: stats.total },
            { id: "ai", label: "AI Insights", count: stats.aiCount, icon: Sparkles },
            { id: "chart", label: "Charts", count: stats.chartCount, icon: BarChart3 },
            { id: "summary", label: "Summaries", count: stats.summaryCount, icon: Table },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveFilter(tab.id);
                  setVisibleCount(10);
                }}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                <span>{tab.label}</span>
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                    active ? "bg-indigo-700 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="rows">Most rows</option>
          </select>
        </div>
      </div>

      {/* Entry Feed */}
      {filteredEntries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Clock className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">
            {searchQuery || activeFilter !== "all"
              ? "No matching analysis entries"
              : "No analysis history recorded yet"}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || activeFilter !== "all"
              ? "Try adjusting your search criteria or switching filter tabs."
              : "Create interactive 2D/3D charts or generate Gemini AI insights from your spreadsheets to build your analysis timeline."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/tabSection"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              Create Charts
            </Link>
            <Link
              href="/ai"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Ask Gemini
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.slice(0, visibleCount).map((entry) => {
            const isAi = entry.type === "ai";
            const isChart = entry.type === "chart";
            const isSummary = entry.type === "summary";
            const isExpanded = expandedCards[entry.id];
            const longResponse = isAi && (entry.response?.length || 0) > 350;

            return (
              <article
                key={entry.id || entry._id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                {/* Header line of card */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      {isAi && (
                        <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700">
                          <Sparkles className="h-3 w-3" />
                          Gemini Insight
                        </span>
                      )}
                      {isChart && (
                        <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                          <BarChart3 className="h-3 w-3" />
                          {entry.chart?.chartType || "Chart Snapshot"}
                        </span>
                      )}
                      {isSummary && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <Table className="h-3 w-3" />
                          Statistics Summary
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400">
                        {entry.createdAt && Number.isFinite(Date.parse(entry.createdAt))
                          ? new Date(entry.createdAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Saved recently"}
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
                      {entry.title}
                    </h2>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
                        {entry.datasetName || "Uploaded dataset"}
                      </span>
                      {Number.isFinite(entry.rowCount) && entry.rowCount > 0 && (
                        <span>· {entry.rowCount.toLocaleString()} rows</span>
                      )}
                    </div>
                  </div>

                  {/* Actions right */}
                  <div className="flex items-center gap-1">
                    {/* Markdown Export for AI */}
                    {isAi && (
                      <button
                        type="button"
                        onClick={() => handleExportMarkdown(entry)}
                        title="Download Markdown"
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* CSV Export for Charts or Summaries */}
                    {(isChart || isSummary) && entry.chart?.columns?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleExportCsv(entry)}
                        title="Export Table as CSV"
                        className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                      >
                        <Download className="h-3 w-3" />
                        <span>Export CSV</span>
                      </button>
                    )}

                    {/* Delete Item */}
                    <button
                      type="button"
                      aria-label={`Delete ${entry.title} from history`}
                      onClick={() => handleDelete(entry.id || entry._id, entry.title)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* AI Query Prompt Box */}
                {entry.prompt && (
                  <div className="mt-3 flex items-start justify-between gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-700 border border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-900">Question: </span>
                      <span>{entry.prompt}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(entry.prompt, `prompt-${entry.id}`)}
                      title="Copy Question"
                      className="text-slate-400 hover:text-indigo-600 transition"
                    >
                      {copiedId === `prompt-${entry.id}` ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                )}

                {/* AI Insight Response Box */}
                {entry.response && (
                  <div className="mt-3 rounded-xl bg-purple-50/60 p-4 border border-purple-100/70">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-purple-100 text-[11px] font-semibold text-purple-900">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                        Gemini Response
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(entry.response, `resp-${entry.id}`)}
                        className="flex items-center gap-1 text-purple-700 hover:text-purple-900 transition"
                      >
                        {copiedId === `resp-${entry.id}` ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-[10px]">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span className="text-[10px]">Copy text</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div
                      className={`whitespace-pre-wrap text-xs leading-relaxed text-slate-800 ${
                        longResponse && !isExpanded ? "max-h-36 overflow-hidden relative" : ""
                      }`}
                    >
                      {entry.response}
                      {longResponse && !isExpanded && (
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-purple-50/90 to-transparent pointer-events-none" />
                      )}
                    </div>

                    {longResponse && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(entry.id)}
                        className="mt-2 flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3.5 w-3.5" /> Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 w-3.5" /> Show full response
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Table Data Preview for Charts & Summaries */}
                {entry.chart && Array.isArray(entry.chart.columns) && Array.isArray(entry.chart.rows) && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                    <div className="max-h-60 overflow-x-auto overflow-y-auto">
                      <table className="min-w-full text-left text-xs">
                        <thead className="sticky top-0 bg-slate-50 text-slate-700 border-b border-slate-200">
                          <tr>
                            {entry.chart.columns.map((column, index) => (
                              <th
                                key={`${column}-${index}`}
                                className="whitespace-nowrap px-3.5 py-2 font-semibold"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {entry.chart.rows.slice(0, 10).map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-slate-50/70 transition">
                              {row.map((value, columnIndex) => (
                                <td key={columnIndex} className="whitespace-nowrap px-3.5 py-1.5 text-slate-700">
                                  {value === null || value === undefined ? "—" : String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-3.5 py-2 text-[11px] text-slate-500">
                      <span>
                        Showing {Math.min(10, entry.chart.rows.length)} of {entry.chart.totalRows || entry.chart.rows.length} rows
                      </span>
                      <button
                        type="button"
                        onClick={() => handleExportCsv(entry)}
                        className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Download complete CSV
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}

          {/* Load More Pagination */}
          {filteredEntries.length > visibleCount && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 10)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                Load more ({filteredEntries.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Clear All */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Clear Analysis History?</h3>
                <p className="text-xs text-slate-500">
                  This will permanently remove all {userEntries.length} saved analysis entries from your account.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
