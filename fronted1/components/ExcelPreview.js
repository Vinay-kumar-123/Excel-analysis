"use client";
import React from "react";
import Link from "next/link";
import { Table, BarChart2, FileSpreadsheet } from "lucide-react";

const ExcelPreview = ({ data, fileName }) => {
  const rowCount = data.length;
  const columnCount = Math.max(...data.map((row) => row.length));

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 mt-6">
      
      <div className="flex items-center gap-2 mb-4">
        <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-800">File Preview</h2>
      </div>

      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-sm">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-gray-500">File Name</p>
          <p className="font-semibold text-gray-700">{fileName}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Rows</p>
          <p className="font-semibold text-gray-700">{rowCount}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Columns</p>
          <p className="font-semibold text-gray-700">{columnCount}</p>
        </div>
      </div>

      
      <div className="overflow-x-auto max-h-96 border rounded-xl shadow-sm">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-indigo-600 text-white sticky top-0">
            <tr>
              {Array.from({ length: columnCount }).map((_, i) => (
                <th key={i} className="px-4 py-2 font-semibold">
                  {data[0]?.[i] || `Column ${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(1).map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                {Array.from({ length: columnCount }).map((_, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-4 py-2 text-gray-700 border-t"
                  >
                    {row[colIndex] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Showing {rowCount} rows, {columnCount} columns
      </p>

      
      <div className="flex justify-end mt-6">
        <Link
          href={{
            pathname: "/tabSection",
            query: { file: fileName },
          }}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg transition"
        >
          <BarChart2 className="w-5 h-5" />
          Continue to Analysis
        </Link>
      </div>
    </div>
  );
};

export default ExcelPreview;
