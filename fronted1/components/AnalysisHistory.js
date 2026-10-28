"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ExternalLink,
  ChevronRight,
  FileSpreadsheet,
  AlertCircle,
  Layers,
  Filter,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  filterAndSortHistory,
  exportHistoryTableAsCsv,
  exportHistoryAsMarkdown,
  downloadBlob,
  getValidEntryId,
  isWorkbookEntry,
} from "@/lib/analysisHistory.mjs";
import {
  fetchUserHistory,
  deleteAnalysisHistory,
  clearAllAnalysisHistory,
} from "@/lib/historyService";
import { setExcelData } from "@/redux/excelSlice";

export default function AnalysisHistory({ userId }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const rawEntries = useSelector((state) => state.history?.entries || []);
  const loading = useSelector((state) => state.history?.loading || false);
  const syncStatus = useSelector((state) => state.history?.syncStatus || "idle");
  const authUser = useSelector((state) => state.auth?.user);
  const isAuthenticated = Boolean(authUser);

  // Filter and display states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(15);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);

  // Sync with backend on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserHistory(dispatch, {
        search: searchQuery,
        status: statusFilter,
        fileType: fileTypeFilter,
        sort: sortBy,
      });
    }
  }, [isAuthenticated, dispatch, statusFilter, fileTypeFilter, sortBy]);

  // Filter entries: only workbook-level analyses for this user
  const userEntries = useMemo(() => {
    return rawEntries.filter((entry) => {
      if (!isWorkbookEntry(entry)) return false;
      if (!userId || userId === "anonymous") return true;
      return !entry.userId || entry.userId === userId || entry.userId === "anonymous";
    });
  }, [rawEntries, userId]);

  // Client-side search and filters
  const filteredEntries = useMemo(() => {
    let result = [...userEntries];

    if (statusFilter && statusFilter !== "all") {
      result = result.filter((e) => (e.status || "Completed").toLowerCase() === statusFilter.toLowerCase());
    }

    if (fileTypeFilter && fileTypeFilter !== "all") {
      result = result.filter((e) => (e.fileType || "xlsx").toLowerCase() === fileTypeFilter.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((e) => {
        const name = (e.fileName || e.title || "").toLowerCase();
        const sheet = (e.selectedSheet || (e.sheetNames || []).join(" ")).toLowerCase();
        const prompt = (e.prompt || "").toLowerCase();
        return name.includes(q) || sheet.includes(q) || prompt.includes(q);
      });
    }

    result.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortBy === "oldest" ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [userEntries, statusFilter, fileTypeFilter, searchQuery, sortBy]);

  // Summary statistics overview
  const stats = useMemo(() => {
    const total = userEntries.length;
    const completed = userEntries.filter((e) => (e.status || "Completed") === "Completed").length;
    const totalCharts = userEntries.reduce((sum, e) => {
      const count = e.chartCount || e.chartConfigurations?.length || (e.chart?.columns?.length ? 1 : 0);
      return sum + (Number.isFinite(count) ? count : 0);
    }, 0);
    const totalInsights = userEntries.reduce((sum, e) => {
      const count = e.insightsCount || e.savedInsights?.length || (e.response ? 1 : 0);
      return sum + (Number.isFinite(count) ? count : 0);
    }, 0);
    return { total, completed, totalCharts, totalInsights };
  }, [userEntries]);

  const handleOpenInStudio = (entry) => {
    const entryId = getValidEntryId(entry);
    const dataToRestore = Array.isArray(entry.dataSnapshot) && entry.dataSnapshot.length > 0
      ? entry.dataSnapshot
      : [];

    if (dataToRestore.length > 0) {
      dispatch(
        setExcelData({
          data: dataToRestore,
          fileName: entry.fileName || entry.title,
          sheetNames: entry.sheetNames || [],
          activeSheet: entry.selectedSheet || entry.sheetNames?.[0] || "",
          analysisId: entryId,
        })
      );
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("excel_data", JSON.stringify(dataToRestore));
          sessionStorage.setItem("excel_filename", entry.fileName || entry.title);
          if (entryId) {
            sessionStorage.setItem("excel_analysis_id", entryId);
          }
        } catch (e) {
          console.warn("Could not save to session storage:", e);
        }
      }
      toast.success(`Restored "${entry.fileName || entry.title}" in Visualizations Studio`);
      router.push("/tabSection");
    } else if (entryId) {
      router.push(`/history/${encodeURIComponent(entryId)}`);
    } else {
      toast.warning("This analysis does not have a valid saved ID to reopen.");
    }
  };

  const handleDelete = (id, fileName) => {
    deleteAnalysisHistory(dispatch, id, isAuthenticated);
    setEntryToDelete(null);
    toast.info(`Deleted analysis "${fileName || "entry"}"`);
  };

  const handleClearAll = () => {
    clearAllAnalysisHistory(dispatch, userId, isAuthenticated);
    setShowClearConfirm(false);
    toast.success("All analysis history records cleared.");
  };

  return (
    <section className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-200/50">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Analysis History</h1>
              <p className="text-xs text-slate-500">
                Persistent log of uploaded workbooks, charts, and generated AI insights.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sync Badge */}
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                syncStatus === "syncing"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : isAuthenticated
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
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

            {/* Refresh Button */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => fetchUserHistory(dispatch)}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
                <span>Refresh</span>
              </button>
            )}

            {/* Clear history */}
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              disabled={userEntries.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 transition cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        </div>

        {/* Analytics Statistics Row */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Analyses</span>
            <div className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</div>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Completed
            </span>
            <div className="mt-1 text-2xl font-bold text-emerald-900">{stats.completed}</div>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-1">
              <BarChart3 className="h-3 w-3" /> Saved Charts
            </span>
            <div className="mt-1 text-2xl font-bold text-blue-900">{stats.totalCharts}</div>
          </div>
          <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3.5">
            <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> AI Insights
            </span>
            <div className="mt-1 text-2xl font-bold text-purple-900">{stats.totalInsights}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="relative flex-1 md:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by filename or sheet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Processing">Processing</option>
            <option value="Failed">Failed</option>
          </select>

          {/* File Type Filter */}
          <select
            value={fileTypeFilter}
            onChange={(e) => setFileTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All File Types</option>
            <option value="xlsx">XLSX</option>
            <option value="xls">XLS</option>
            <option value="csv">CSV</option>
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && userEntries.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-5 w-48 bg-slate-200 rounded" />
                  <div className="h-3 w-64 bg-slate-100 rounded" />
                </div>
                <div className="h-8 w-24 bg-slate-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
            <FileSpreadsheet className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {searchQuery || statusFilter !== "all" || fileTypeFilter !== "all"
              ? "No analyses match your criteria"
              : "No Analysis History Yet"}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || statusFilter !== "all" || fileTypeFilter !== "all"
              ? "Try resetting your search query or switching your filters."
              : "Upload an Excel workbook to start analyzing data, creating charts, and generating AI insights."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/upload"
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              Upload Excel File
            </Link>
          </div>
        </div>
      ) : (
        /* Order History List (Amazon/Flipkart Style Cards) */
        <div className="space-y-4">
          {filteredEntries.slice(0, visibleCount).map((entry, entryIndex) => {
            const entryId = getValidEntryId(entry);
            const status = entry.status || "Completed";
            const rowCount = entry.rowCount ?? (entry.dataSnapshot?.length ? entry.dataSnapshot.length - 1 : 0);
            const colCount = entry.columnCount ?? (entry.columns?.length || 0);
            const chartCount = entry.chartCount ?? (entry.chartConfigurations?.length || (entry.chart?.columns?.length ? 1 : 0));
            const hasAi = entry.hasAiInsights || (entry.savedInsights?.length > 0) || entry.type === "ai" || Boolean(entry.response);

            return (
              <article
                key={entryId || `entry-${entryIndex}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Left Column: Title & Meta */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase text-slate-700">
                        {entry.fileType || "XLSX"}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold flex items-center gap-1 ${
                          status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : status === "Processing"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {status === "Completed" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : status === "Failed" ? (
                          <XCircle className="h-3 w-3" />
                        ) : (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        )}
                        <span>{status}</span>
                      </span>

                      <span className="text-[11px] text-slate-400">
                        {entry.createdAt && Number.isFinite(Date.parse(entry.createdAt))
                          ? new Date(entry.createdAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Saved"}
                      </span>
                    </div>

                    {/* Clickable Title that reopens detail */}
                    {entryId ? (
                      <Link
                        href={`/history/${encodeURIComponent(entryId)}`}
                        className="group/link flex items-center gap-1.5"
                      >
                        <h2 className="text-base font-bold text-slate-900 group-hover/link:text-indigo-600 transition">
                          {entry.fileName || entry.title || "Workbook Analysis"}
                        </h2>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover/link:text-indigo-600 group-hover/link:translate-x-0.5 transition" />
                      </Link>
                    ) : (
                      <h2 className="text-base font-bold text-slate-900">
                        {entry.fileName || entry.title || "Workbook Analysis"}
                      </h2>
                    )}

                    {/* Key Attributes Row */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span>
                        Records: <strong className="font-semibold text-slate-800">{rowCount.toLocaleString()}</strong>
                      </span>
                      {colCount > 0 && (
                        <span>
                          Columns: <strong className="font-semibold text-slate-800">{colCount}</strong>
                        </span>
                      )}
                      <span>
                        Charts: <strong className="font-semibold text-blue-700">{chartCount}</strong>
                      </span>
                      <span>
                        AI Insights:{" "}
                        <strong className={`font-semibold ${hasAi ? "text-purple-700" : "text-slate-400"}`}>
                          {hasAi ? "Available" : "None"}
                        </strong>
                      </span>
                    </div>

                    {/* Worksheets Badges */}
                    {entry.sheetNames && entry.sheetNames.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Layers className="h-3 w-3" /> Sheets:
                        </span>
                        {entry.sheetNames.slice(0, 4).map((sheet, sIdx) => (
                          <span
                            key={sIdx}
                            className="rounded-md bg-slate-50 border border-slate-200/80 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                          >
                            {sheet}
                          </span>
                        ))}
                        {entry.sheetNames.length > 4 && (
                          <span className="text-[10px] text-slate-400">
                            +{entry.sheetNames.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Error message if Failed */}
                    {entry.errorMessage && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                        Error: {entry.errorMessage}
                      </div>
                    )}
                  </div>

                  {/* Actions Right */}
                  <div className="flex flex-wrap items-center gap-2">
                    {entryId ? (
                      <Link
                        href={`/history/${encodeURIComponent(entryId)}`}
                        className="flex items-center gap-1 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                      >
                        <span>View Analysis</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="flex items-center gap-1 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed"
                        title="ID unavailable"
                      >
                        <span>View Analysis</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenInStudio(entry)}
                      className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                      title="Open dataset in visualization studio"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                      <span>Studio</span>
                    </button>

                    <button
                      type="button"
                      aria-label="Delete analysis"
                      onClick={() => setEntryToDelete(entry)}
                      className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {/* Load More Pagination */}
          {filteredEntries.length > visibleCount && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 15)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Load more ({filteredEntries.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Single Entry Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Analysis?</h3>
                <p className="text-xs text-slate-500">
                  Permanently remove &ldquo;{entryToDelete.fileName || entryToDelete.title}&rdquo; from your account?
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEntryToDelete(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(entryToDelete.id || entryToDelete._id, entryToDelete.fileName || entryToDelete.title)}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Clear Entire History?</h3>
                <p className="text-xs text-slate-500">
                  This will permanently delete all {userEntries.length} saved analyses and their charts.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition cursor-pointer"
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
