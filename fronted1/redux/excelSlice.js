import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  data: [],
  fileName: "",
  sheetNames: [],
  activeSheet: "",
  headers: [],
  rowCount: 0,
  colCount: 0,
  aiAnalysis: null,
  analysisId: null,
};

const excelSlice = createSlice({
  name: "excel",
  initialState,
  reducers: {
    setExcelData: (state, action) => {
      const {
        data = [],
        fileName = "",
        sheetNames = [],
        activeSheet = "",
        analysisId,
      } = action.payload || {};
      state.data = data;
      state.fileName = fileName;
      state.sheetNames = sheetNames;
      state.activeSheet = activeSheet || (sheetNames.length > 0 ? sheetNames[0] : "");
      if (analysisId !== undefined) {
        state.analysisId = analysisId;
      }

      if (Array.isArray(data) && data.length > 0) {
        state.headers = (data[0] || []).map((h, idx) => (h !== undefined && h !== null && String(h).trim() !== "" ? String(h) : `Column ${idx + 1}`));
        state.rowCount = Math.max(0, data.length - 1);
        state.colCount = state.headers.length;
      } else {
        state.headers = [];
        state.rowCount = 0;
        state.colCount = 0;
      }
    },
    setAnalysisId: (state, action) => {
      state.analysisId = action.payload || null;
    },
    clearExcelData: (state) => {
      state.data = [];
      state.fileName = "";
      state.sheetNames = [];
      state.activeSheet = "";
      state.headers = [];
      state.rowCount = 0;
      state.colCount = 0;
      state.aiAnalysis = null;
      state.analysisId = null;
    },
    setAiAnalysis: (state, action) => {
      state.aiAnalysis = action.payload;
    },
  },
});

export const { setExcelData, setAnalysisId, clearExcelData, setAiAnalysis } = excelSlice.actions;
export default excelSlice.reducer;
