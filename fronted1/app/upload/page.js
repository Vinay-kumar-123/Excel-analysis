"use client";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Upload as UploadIcon, FileSpreadsheet, Eye } from "lucide-react";
import { motion } from "framer-motion";
import ExcelPreview from "@/components/ExcelPreview";
import AuthGuard from "@/components/AuthGuard";
import { useDispatch } from "react-redux";
import { setExcelData } from "@/redux/excelSlice";
import { toast } from "react-toastify";

function UploadContent() {
  const dispatch = useDispatch();
  const [file, setFile] = useState(null);
  const [excelData, setExcelDataLocal] = useState([]);
  const [filename, setFilename] = useState("");
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheet, setActiveSheet] = useState("");
  const [workbookRef, setWorkbookRef] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setFilename(selectedFile.name);
  };

  const parseSheet = (workbook, sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      blankrows: false,
      raw: false,
    });
    return jsonData;
  };

  const handleUpload = () => {
    if (!file) {
      toast.warning("Please select a file first.");
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        setWorkbookRef(workbook);
        setSheetNames(workbook.SheetNames);
        const defaultSheet = workbook.SheetNames[0];
        setActiveSheet(defaultSheet);

        const jsonData = parseSheet(workbook, defaultSheet);
        setExcelDataLocal(jsonData);

        // Store in Redux and sessionStorage
        dispatch(
          setExcelData({
            data: jsonData,
            fileName: file.name,
            sheetNames: workbook.SheetNames,
            activeSheet: defaultSheet,
          })
        );

        try {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("excel_data", JSON.stringify(jsonData));
            sessionStorage.setItem("excel_filename", file.name);
          }
        } catch {
          // Ignore storage quota
        }

        toast.success(`Successfully parsed "${file.name}" with ${jsonData.length} rows`);
      } catch (err) {
        console.error("Excel parse error:", err);
        toast.error("Failed to read the Excel file. Please ensure it's a valid .xlsx or .xls file.");
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setIsProcessing(false);
      toast.error("Error reading file from disk.");
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSheetChange = (newSheet) => {
    if (!workbookRef) return;
    setActiveSheet(newSheet);
    const jsonData = parseSheet(workbookRef, newSheet);
    setExcelDataLocal(jsonData);
    dispatch(
      setExcelData({
        data: jsonData,
        fileName: filename,
        sheetNames,
        activeSheet: newSheet,
      })
    );
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("excel_data", JSON.stringify(jsonData));
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-20 p-8">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Upload Excel File
        </h1>
        <p className="text-gray-500">
          Upload your Excel file (.xls or .xlsx) to analyze, generate 2D/3D visualizations, and get AI insights.
        </p>
      </div>

      <motion.div
        whileHover={{ scale: 1.01, borderColor: "#3b82f6" }}
        className="border-2 border-dashed border-gray-300 rounded-2xl p-8 bg-white shadow-sm cursor-pointer transition text-center"
        onClick={() => document.getElementById("fileInput").click()}
      >
        <input
          id="fileInput"
          type="file"
          className="hidden"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center justify-center space-y-3">
          <UploadIcon className="w-12 h-12 text-indigo-500" />
          <h3 className="text-lg font-medium text-gray-700">
            Click to Select File
          </h3>
          <p className="text-gray-500 text-sm">
            {file ? (
              <span className="flex items-center gap-2 text-indigo-600 font-medium">
                <FileSpreadsheet className="w-5 h-5" />
                {filename}
              </span>
            ) : (
              "Drag & drop your file here, or click to browse (.xlsx, .xls, .csv)"
            )}
          </p>
        </div>
      </motion.div>

      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={handleUpload}
          disabled={!file || isProcessing}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg transition disabled:bg-gray-400 cursor-pointer"
        >
          <Eye className="w-5 h-5" />
          {isProcessing ? "Processing File..." : "Parse & Preview"}
        </button>
      </div>

      {sheetNames.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="text-sm font-medium text-gray-600">Select Sheet:</span>
          {sheetNames.map((s) => (
            <button
              key={s}
              onClick={() => handleSheetChange(s)}
              className={`px-3 py-1 text-sm rounded-lg border transition ${
                activeSheet === s
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {excelData.length > 0 && (
        <div className="mt-10">
          <ExcelPreview data={excelData} fileName={filename} />
        </div>
      )}
    </div>
  );
}

export default function Upload() {
  return (
    <AuthGuard requiredMessage="Please log in to upload your data, visualize it, and access AI analytics.">
      <UploadContent />
    </AuthGuard>
  );
}
