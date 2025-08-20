// "use client";
// import React, { useState } from "react";
// import { Upload as UploadIcon, FileSpreadsheet, Eye } from "lucide-react";
// import { motion } from "framer-motion";
// import * as XLSX from "xlsx";
// import ExcelPreview from "@/components/ExcelPreview";

// export default function upload() {
//   const [file, setFile] = useState(null);
//   const [fileName, setFilename] = useState("");
//   const [excelData, setExcelData] = useState([]);
//   const handleFileChange = (e) => {
//     const selectedFile = e.target.files?.[0];
//     if (!selectedFile) return;
//     setFile(selectedFile);
//     setFilename(selectedFile.name);
//   };
//   const handleUpload = () => {
//     if (!file) return alert(" ⚠️ Please select a file first.");
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       const data = new Uint8Array(e.target.result);
//       const workbook = XLSX.read(data, { type: "array" });
//       const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//       const jsonData = XLSX.utils.sheet_to_json(worksheet, {
//         header: 1,
//         defval: "_",
//         blankrows: true,
//         raw: true,
//       });
//       setExcelData(jsonData);
//     };
//     reader.readAsArrayBuffer(file);
//   };
//   return (
//     <>
//       <div className="max-w-4xl mx-auto py-10 px-4 flex  flex-col items-center justify-center gap-8">
//         <div className="pt-8 mb-6 text-center">
//           <h1 className="text-[1.8rem] font-bold text-gray-900">Upload Excel File</h1>
//           <p className="text-gray-600 mt-2 text-base">
//             Upload your Excel file (.xls or .xlsx) to analyze and visualize your
//             data
//           </p>
//         </div>
//         <div  className="bg-white shadow-md rounded-xl p-8 mb-4 border-2 border-dashed border-gray-300 text-center cursor-pointer hover:border-blue-500 transition" onClick={() => document.getElementById("fileInput").click()}>
//           <div >
//             <input
//               className="hidden"
//               id="fileInput"
//               type="file"
//               accept=".xlsx,.xls"
//               onChange={handleFileChange}
//             />
//             <div className="flex flex-col items-center">
//               <h3 className="mb-2 text-xl font-semibold text-gray-900">Click to select File</h3>
//               <p className="text-sm text-gray-500 mb-4">
//                 {file
//                   ? `Selected: ${file.name}`
//                   : "Drag and drop your file here, or click to browse"}
//               </p>
//             </div>
//           </div>
//         </div>
//         <div className="text-center">
//           <button className="bg-blue-600 text-white px-8 py-3 text-base font-medium rounded-lg cursor-pointer hover:bg-green-700 transition" onClick={handleUpload}>Upload & Preview</button>
//         </div>
//         {excelData.length > 0 && (
//             <ExcelPreview data={excelData} fileName= {fileName} />
//         )}
//       </div>
//     </>
//   );
// }


"use client";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Upload as UploadIcon, FileSpreadsheet, Eye } from "lucide-react";
import { motion } from "framer-motion";
import ExcelPreview from "@/components/ExcelPreview";

const Upload = () => {
  const [file, setFile] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [filename, setFilename] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setFilename(selectedFile.name);
  };

  const handleUpload = () => {
    if (!file) return alert("⚠️ Please select a file first.");

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "_",
        blankrows: true,
        raw: true,
      });
      setExcelData(jsonData);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 p-8">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Upload Excel File
        </h1>
        <p className="text-gray-500">
          Upload your Excel file (.xls or .xlsx) to analyze and preview data.
        </p>
      </div>

      
      <motion.div
        whileHover={{ scale: 1.02, borderColor: "#3b82f6" }}
        className="border-2 border-dashed border-gray-300 rounded-2xl p-8 bg-white shadow-sm cursor-pointer transition"
        onClick={() => document.getElementById("fileInput").click()}
      >
        <input
          id="fileInput"
          type="file"
          className="hidden"
          accept=".xlsx,.xls"
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
              "Drag & drop your file here, or click to browse"
            )}
          </p>
        </div>
      </motion.div>

      
      <div className="flex justify-center mt-6">
        <button
          onClick={handleUpload}
          disabled={!file}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 cursor-pointer hover:bg-indigo-700 text-white font-semibold shadow-lg transition disabled:bg-gray-400"
        >
          <Eye className="w-5 h-5" />
          Upload & Preview
        </button>
      </div>

     
      {excelData.length > 0 && (
        <div className="mt-10">
          <ExcelPreview data={excelData} fileName={filename} />
        </div>
      )}
    </div>
  );
};

export default Upload;
