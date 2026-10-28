"use client";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setAiAnalysis } from "@/redux/excelSlice";
import { logoutUser } from "@/redux/authSlice";
import { addHistoryEntry } from "@/redux/historySlice";
import { saveAnalysisHistory } from "@/lib/historyService";
import api from "@/lib/api";
import { createAnalysisEntry } from "@/lib/analysisHistory.mjs";
import { toast } from "react-toastify";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Send,
  FileSpreadsheet,
  UploadCloud,
  Copy,
  Check,
  Download,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  FileText,
} from "lucide-react";

function AiPageContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const reduxExcel = useSelector((state) => state.excel);
  const user = useSelector((state) => state.auth?.user);

  const [dataset, setDataset] = useState([]);
  const [fileName, setFileName] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(reduxExcel?.aiAnalysis || "");
  const [copied, setCopied] = useState(false);

  // Restore dataset from Redux or sessionStorage
  useEffect(() => {
    if (reduxExcel?.data && reduxExcel.data.length > 0) {
      setDataset(reduxExcel.data);
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
            setDataset(parsed);
            setFileName(cachedName || "Restored File");
            return;
          }
        }
      } catch (e) {
        console.warn("Could not read from sessionStorage:", e);
      }
    }

    setDataset([]);
    setFileName("");
  }, [reduxExcel]);

  const quickPrompts = [
    {
      title: "Executive Summary",
      icon: FileText,
      prompt: "Provide an executive summary of this spreadsheet data with key performance indicators and high-level findings.",
    },
    {
      title: "Trend & Growth Analysis",
      icon: TrendingUp,
      prompt: "Identify the top trends, patterns, and growth opportunities visible in this dataset.",
    },
    {
      title: "Anomaly Detection",
      icon: AlertTriangle,
      prompt: "Detect any outliers, anomalies, or unexpected variances in this data and explain their potential causes.",
    },
    {
      title: "Actionable Recommendations",
      icon: Lightbulb,
      prompt: "Based on this data, provide 5 actionable, strategic business recommendations to maximize performance.",
    },
  ];

  const handleAskAI = async (customPrompt) => {
    if (dataset.length <= 1) {
      toast.warning("Upload a worksheet with data before requesting AI insights.");
      return;
    }
    const promptToSend = customPrompt || query;
    if (!promptToSend.trim()) {
      toast.warning("Please enter a question or select a quick prompt.");
      return;
    }

    setLoading(true);
    try {
      const sampleRows = dataset.slice(0, 150);
      const res = await api.post(
        "/api/v1/user/gemni",
        {
          data: sampleRows,
          query: promptToSend,
          datasetInfo: {
            totalRows: Math.max(0, dataset.length - 1),
            rowsIncluded: Math.max(0, sampleRows.length - 1),
            truncated: dataset.length > sampleRows.length,
          },
        }
      );

      const reply = typeof res.data?.reply === "string" ? res.data.reply.trim() : "";
      if (!reply) throw new Error("The AI service returned an empty answer. Please try a more specific question.");
      setResponse(reply);
      dispatch(setAiAnalysis(reply));
      const historyItem = createAnalysisEntry({
        type: "ai",
        title: promptToSend.length > 90 ? `${promptToSend.slice(0, 87)}...` : promptToSend,
        prompt: promptToSend,
        response: reply,
        datasetName: fileName || "Uploaded dataset",
        rowCount: Math.max(0, dataset.length - 1),
        userId: String(user?._id || user?.id || "anonymous"),
      });
      saveAnalysisHistory(dispatch, historyItem, Boolean(user));
    } catch (err) {
      if (err.response?.status === 401) {
        dispatch(logoutUser());
        toast.error("Session expired or authentication required. Please log in again.");
        router.push("/login?redirect=/ai");
        return;
      }
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to generate AI insights. Please ensure backend is running and Gemini API key is valid.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setCopied(true);
    toast.success("Insights copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const exportAsTxt = () => {
    if (!response) return;
    const blob = new Blob([response], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName.replace(/\.[^/.]+$/, "")}_AI_insights.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto mt-20 p-4 md:p-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 rounded-3xl p-8 text-white shadow-xl mb-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Powered by Google Gemini
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              AI Dataset Intelligence & Insights
            </h1>
            <p className="text-purple-100 text-sm max-w-xl">
              Ask natural language questions or run automated intelligence models across your spreadsheet data.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/tabSection"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-xs font-medium transition text-center"
            >
              Back to Charts
            </Link>
            <Link
              href="/upload"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-indigo-700 hover:bg-gray-100 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              Upload New File
            </Link>
          </div>
        </div>

        {/* File pill */}
        <div className="mt-6 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between text-xs text-purple-200">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-purple-300" />
            <span>Active Dataset:</span>
            <span className="font-semibold text-white">{fileName || "No dataset loaded"}</span>
            <span>({Math.max(0, dataset.length - 1)} rows)</span>
          </div>
        </div>
      </div>

      {dataset.length <= 1 && (
        <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          Upload a workbook to analyze your own data. AI insights will not use demo data.
        </div>
      )}

      {/* Quick Prompts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickPrompts.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => {
                setQuery(item.prompt);
                handleAskAI(item.prompt);
              }}
              disabled={loading || dataset.length <= 1}
              className="flex flex-col text-left p-4 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-purple-300 transition duration-200 group cursor-pointer disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm mb-1">{item.title}</h3>
              <p className="text-gray-500 text-xs line-clamp-2">{item.prompt}</p>
            </button>
          );
        })}
      </div>

      {/* Query Input Box */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskAI();
          }}
          className="flex flex-col md:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Ask anything about your data (e.g. 'What is the top performing segment?', 'Summarize key takeaways')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading || dataset.length <= 1}
              className="w-full pl-4 pr-10 py-3 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={loading || dataset.length <= 1 || !query.trim()}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Ask AI
              </>
            )}
          </button>
        </form>
      </div>

      {/* Response Display Box */}
      {response && (
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 md:p-8">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Gemini Intelligence Report</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={exportAsTxt}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                title="Export report as text file"
              >
                <Download className="w-3.5 h-3.5 text-purple-600" />
                Export
              </button>
            </div>
          </div>

          <div className="prose prose-purple max-w-none text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {response}
          </div>
        </div>
      )}

      {loading && !response && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">
            Gemini is analyzing your dataset...
          </h3>
          <p className="text-xs text-gray-500">
            The response uses the uploaded worksheet rows sent with your question. Larger sheets are sampled and identified as such.
          </p>
        </div>
      )}
    </div>
  );
}

export default function AiPage() {
  return (
    <AuthGuard requiredMessage="Please log in to upload your data, visualize it, and access AI analytics.">
      <AiPageContent />
    </AuthGuard>
  );
}
