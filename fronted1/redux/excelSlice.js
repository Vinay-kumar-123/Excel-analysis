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
};

const excelSlice = createSlice({
  name: "excel",
  initialState,
  reducers: {
    setExcelData: (state, action) => {
      const { data = [], fileName = "", sheetNames = [], activeSheet = "" } = action.payload || {};
      state.data = data;
      state.fileName = fileName;
      state.sheetNames = sheetNames;
      state.activeSheet = activeSheet || (sheetNames.length > 0 ? sheetNames[0] : "");

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
    clearExcelData: (state) => {
      state.data = [];
      state.fileName = "";
      state.sheetNames = [];
      state.activeSheet = "";
      state.headers = [];
      state.rowCount = 0;
      state.colCount = 0;
      state.aiAnalysis = null;
    },
    setAiAnalysis: (state, action) => {
      state.aiAnalysis = action.payload;
    },
  },
});

export const { setExcelData, clearExcelData, setAiAnalysis } = excelSlice.actions;
export default excelSlice.reducer;
