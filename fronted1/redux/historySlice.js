import { createSlice } from "@reduxjs/toolkit";
import {
  appendAnalysisEntry,
  mergeHistoryEntries,
  removeUserAnalysis,
} from "@/lib/analysisHistory.mjs";

const initialState = {
  entries: [],
  loading: false,
  syncStatus: "idle", // 'idle' | 'syncing' | 'synced' | 'error'
  error: null,
};

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    setHistoryEntries: (state, action) => {
      state.entries = action.payload || [];
      state.loading = false;
      state.error = null;
      state.syncStatus = "synced";
    },
    mergeRemoteEntries: (state, action) => {
      state.entries = mergeHistoryEntries(state.entries, action.payload || []);
      state.loading = false;
      state.error = null;
      state.syncStatus = "synced";
    },
    addHistoryEntry: (state, action) => {
      state.entries = appendAnalysisEntry(state.entries, action.payload);
      state.error = null;
    },
    deleteHistoryEntry: (state, action) => {
      const targetId = action.payload?.id || action.payload?._id;
      state.entries = state.entries.filter(
        (entry) => entry.id !== targetId && entry._id !== targetId
      );
    },
    clearUserHistory: (state, action) => {
      state.entries = removeUserAnalysis(state.entries, action.payload.userId);
    },
    setHistoryLoading: (state, action) => {
      state.loading = Boolean(action.payload);
    },
    setHistorySyncStatus: (state, action) => {
      state.syncStatus = action.payload;
    },
    setHistoryError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
      state.syncStatus = "error";
    },
  },
});

export const {
  setHistoryEntries,
  mergeRemoteEntries,
  addHistoryEntry,
  deleteHistoryEntry,
  clearUserHistory,
  setHistoryLoading,
  setHistorySyncStatus,
  setHistoryError,
} = historySlice.actions;

export default historySlice.reducer;
