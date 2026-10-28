"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Download,
  CheckCircle2,
  AlertTriangle,
  Info,
  Table as TableIcon,
  Layers,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  parseMarkdownBlocks,
  parseInlineMarkdown,
  extractNumericalClaims,
  validateClaimsAgainstDataset,
  formatReportForCopy,
  formatReportForExport,
  formatReportDate,
} from "@/lib/geminiReport.mjs";

/**
 * Render an inline array of parsed tokens (text, bold, italic, code, strikethrough).
 * Completely safe React elements; zero dangerouslySetInnerHTML.
 */
function InlineContent({ text }) {
  if (!text) return null;
  const tokens = parseInlineMarkdown(text);

  return (
    <>
      {tokens.map((token, index) => {
        switch (token.type) {
          case "bold":
            return (
              <strong key={index} className="font-bold text-slate-900">
                {token.content}
              </strong>
            );
          case "italic":
            return (
              <em key={index} className="italic text-slate-800">
                {token.content}
              </em>
            );
          case "bold_italic":
            return (
              <strong key={index} className="font-bold italic text-slate-900">
                {token.content}
              </strong>
            );
          case "code":
            return (
              <code
                key={index}
                className="rounded-md bg-purple-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-purple-700 border border-purple-100"
              >
                {token.content}
              </code>
            );
          case "strikethrough":
            return (
              <del key={index} className="line-through text-slate-400">
                {token.content}
              </del>
            );
          default:
            return <React.Fragment key={index}>{token.content}</React.Fragment>;
        }
      })}
    </>
  );
}

/**
 * Render Markdown Blocks (Headings, Paragraphs, Lists, Tables, Code, Quotes, Dividers).
 */
function MarkdownRenderer({ markdown }) {
  const blocks = useMemo(() => parseMarkdownBlocks(markdown), [markdown]);

  if (!blocks || blocks.length === 0) {
    return (
      <p className="text-xs text-slate-400 italic">
        No report content available.
      </p>
    );
  }

  return (
    <div className="space-y-4 text-sm text-slate-700 leading-relaxed font-sans">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "heading": {
            if (block.level === 1) {
              return (
                <h1
                  key={idx}
                  className="text-xl font-extrabold text-slate-900 border-b border-purple-100 pb-2 pt-3 first:pt-0"
                >
                  <InlineContent text={block.text} />
                </h1>
              );
            }
            if (block.level === 2) {
              return (
                <h2
                  key={idx}
                  className="text-base font-bold text-slate-900 border-b border-slate-100 pb-1.5 pt-3 first:pt-0"
                >
                  <InlineContent text={block.text} />
                </h2>
              );
            }
            return (
              <h3
                key={idx}
                className="text-sm font-bold text-slate-800 pt-2 first:pt-0"
              >
                <InlineContent text={block.text} />
              </h3>
            );
          }

          case "paragraph":
            return (
              <p key={idx} className="text-slate-700 leading-relaxed">
                <InlineContent text={block.text} />
              </p>
            );

          case "unordered_list":
            return (
              <ul key={idx} className="space-y-1.5 pl-5 list-disc marker:text-purple-500">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-slate-700">
                    <InlineContent text={item} />
                  </li>
                ))}
              </ul>
            );

          case "ordered_list":
            return (
              <ol key={idx} className="space-y-1.5 pl-5 list-decimal marker:text-purple-600 font-medium">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-slate-700 font-normal">
                    <InlineContent text={item} />
                  </li>
                ))}
              </ol>
            );

          case "table":
            return (
              <div
                key={idx}
                className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs my-3"
              >
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      {block.headers.map((h, hIdx) => (
                        <th key={hIdx} className="px-3.5 py-2.5">
                          <InlineContent text={h} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {block.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/60 transition">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3.5 py-2 text-slate-600">
                            <InlineContent text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "blockquote":
            return (
              <blockquote
                key={idx}
                className="border-l-4 border-purple-400 bg-purple-50/40 px-4 py-2.5 rounded-r-xl text-xs text-slate-700 italic"
              >
                <InlineContent text={block.text} />
              </blockquote>
            );

          case "code_block":
            return (
              <pre
                key={idx}
                className="overflow-x-auto rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-xs my-3 shadow-inner"
              >
                <code>{block.content}</code>
              </pre>
            );

          case "divider":
            return <hr key={idx} className="border-slate-200 my-4" />;

          default:
            return null;
        }
      })}
    </div>
  );
}

/**
 * GeminiReport Presentation Component
 * Supports dynamic markdown formatting, structured maximum values table, dataset verification badges, copy, and export.
 */
export default function GeminiReport({
  response,
  dataset = [],
  fileName = "Uploaded Dataset",
  query = "",
  timestamp,
}) {
  const [copied, setCopied] = useState(false);

  // Extract and validate numerical claims dynamically
  const validatedMetrics = useMemo(() => {
    if (!response) return [];
    const claims = extractNumericalClaims(response);
    return validateClaimsAgainstDataset(claims, dataset);
  }, [response, dataset]);

  // Formatted date string
  const formattedDate = useMemo(() => {
    if (timestamp) return formatReportDate(timestamp);
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [timestamp]);

  const handleCopy = () => {
    if (!response) return;
    const cleanText = formatReportForCopy(response, validatedMetrics, {
      fileName,
      date: formattedDate,
    });
    navigator.clipboard.writeText(cleanText);
    setCopied(true);
    toast.success("Intelligence report copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (!response) return;
    const exportContent = formatReportForExport(response, validatedMetrics, {
      fileName,
      date: formattedDate,
    });
    const blob = new Blob([exportContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const cleanName = (fileName || "analysis").replace(/\.[^/.]+$/, "");
    link.download = `${cleanName}_Gemini_Report.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported successfully!");
  };

  if (!response) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 md:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Gemini Intelligence Report
            </h2>
            <p className="text-xs text-gray-500">
              Dataset: <span className="font-medium text-slate-700">{fileName}</span>
              {formattedDate ? ` • ${formattedDate}` : ""}
            </p>
          </div>
        </div>

        {/* Copy & Export Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition cursor-pointer"
            title="Copy clean report to clipboard"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition border border-purple-200 cursor-pointer"
            title="Export report as Markdown"
          >
            <Download className="w-3.5 h-3.5 text-purple-600" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Query Banner if provided */}
      {query && (
        <div className="rounded-xl bg-purple-50/60 p-3.5 text-xs border border-purple-100 flex items-start gap-2">
          <span className="font-bold text-purple-900 shrink-0">Analysis Question:</span>
          <span className="text-purple-800">{query}</span>
        </div>
      )}

      {/* Structured Key Numerical Metrics Table (Maximum Values) */}
      {validatedMetrics.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Key Numerical Metrics & Maximum Values
            </h3>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/40">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Column</th>
                  <th className="px-4 py-3">Maximum Value</th>
                  <th className="px-4 py-3">Verification Status</th>
                  <th className="px-4 py-3">Relevant Row Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 bg-white">
                {validatedMetrics.map((metric, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    {/* Column Name */}
                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      {metric.column}
                    </td>

                    {/* Maximum Value */}
                    <td className="px-4 py-3 font-bold text-indigo-600 text-sm whitespace-nowrap">
                      {metric.claimedValue !== null
                        ? metric.claimedValue.toLocaleString("en-US")
                        : metric.rawClaimedValue}
                    </td>

                    {/* Verification Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {metric.isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Verified against dataset
                        </span>
                      ) : metric.status === "discrepancy" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          {metric.verificationBadge}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200">
                          <Info className="w-3.5 h-3.5 text-slate-500" />
                          {metric.verificationBadge}
                        </span>
                      )}
                    </td>

                    {/* Row Details formatted as key-value badges */}
                    <td className="px-4 py-3">
                      {metric.details && metric.details.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {metric.details.map((d, dIdx) => (
                            <span
                              key={dIdx}
                              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 border border-slate-200/60 font-medium"
                            >
                              <span className="text-slate-500 font-normal">{d.key}:</span>
                              <span>{d.value}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">
                          {metric.rawDetails || "No additional details"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Main Analysis Body rendered from Markdown */}
      <section className="space-y-3 pt-2">
        {validatedMetrics.length > 0 && (
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
            <Layers className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Detailed Intelligence & Narrative Findings
            </h3>
          </div>
        )}
        <div className="prose-clean">
          <MarkdownRenderer markdown={response} />
        </div>
      </section>
    </div>
  );
}
