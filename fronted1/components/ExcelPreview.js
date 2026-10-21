"use client";
import React, { useState } from "react";
import { BarChart2, FileSpreadsheet, Sparkles, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";

const ExcelPreview = ({ data, fileName }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  if (!data || data.length === 0) return null;

  const rawHeaders = data[0] || [];
  const columnCount = rawHeaders.length;
  const rawRows = data.slice(1);
  const totalRowCount = rawRows.length;

  const headers = rawHeaders.map((h, i) =>
    h !== undefined && h !== null && String(h).trim() !== "" ? String(h) : `Column ${i + 1}`
  );

  const filteredRows = searchTerm
    ? rawRows.filter((row) =>
        row.some((cell) =>
          String(cell ?? "").toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : rawRows;

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageIndex = Math.min(currentPage, totalPages);
  const displayedRows = filteredRows.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);

  const handleToAnalytics = () => {
    router.push("/tabSection");
  };

  const handleToAi = () => {
    router.push("/ai");
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 mt-6 border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-800">Dataset Preview</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToAi}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium shadow transition cursor-pointer text-sm"
          >
            <Sparkles className="w-4 h-4" />
            AI Insights
          </button>
          <button
            onClick={handleToAnalytics}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow transition cursor-pointer text-sm"
          >
            <BarChart2 className="w-4 h-4" />
            Create Charts (2D & 3D)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-sm">
        <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
          <p className="text-gray-500 text-xs">File Name</p>
          <p className="font-semibold text-gray-800 truncate" title={fileName}>{fileName || "Dataset"}</p>
        </div>
        <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
          <p className="text-gray-500 text-xs">Total Records</p>
          <p className="font-semibold text-gray-800">{totalRowCount.toLocaleString()}</p>
        </div>
        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
          <p className="text-gray-500 text-xs">Columns</p>
          <p className="font-semibold text-gray-800">{columnCount}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="relative w-full max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search rows..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 pr-4 py-2 w-full text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <span className="text-xs text-gray-500">
          Showing {filteredRows.length > 0 ? (pageIndex - 1) * pageSize + 1 : 0} -{" "}
          {Math.min(pageIndex * pageSize, filteredRows.length)} of {filteredRows.length} rows
        </span>
      </div>

      <div className="overflow-x-auto max-h-96 border border-gray-200 rounded-xl shadow-inner">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-xs font-semibold w-12 text-center border-r border-indigo-500/30">#</th>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-2 font-semibold text-xs tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedRows.length === 0 ? (
              <tr>
                <td colSpan={columnCount + 1} className="text-center py-8 text-gray-400 text-sm">
                  No matching records found.
                </td>
              </tr>
            ) : (
              displayedRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`border-b transition hover:bg-indigo-50/40 ${
                    rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/70"
                  }`}
                >
                  <td className="px-3 py-2 text-xs text-gray-400 text-center font-mono border-r">
                    {(pageIndex - 1) * pageSize + rowIndex + 1}
                  </td>
                  {headers.map((_, colIndex) => (
                    <td
                      key={colIndex}
                      className="px-4 py-2 text-xs text-gray-700 whitespace-nowrap"
                    >
                      {row[colIndex] !== undefined && row[colIndex] !== null && String(row[colIndex]).trim() !== ""
                        ? String(row[colIndex])
                        : "-"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
          <div>
            Page {pageIndex} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={pageIndex <= 1}
              className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={pageIndex >= totalPages}
              className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelPreview;
