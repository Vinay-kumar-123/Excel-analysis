import api from "./api";
import {
  setHistoryLoading,
  setHistorySyncStatus,
  setHistoryError,
  mergeRemoteEntries,
  addHistoryEntry,
  deleteHistoryEntry,
  clearUserHistory,
} from "@/redux/historySlice";

export async function fetchUserHistory(dispatch, params = {}) {
  if (dispatch) {
    dispatch(setHistoryLoading(true));
    dispatch(setHistorySyncStatus("syncing"));
  }

  try {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.set("search", params.search);
    if (params.status && params.status !== "all") queryParams.set("status", params.status);
    if (params.fileType && params.fileType !== "all") queryParams.set("fileType", params.fileType);
    if (params.sort) queryParams.set("sort", params.sort);
    if (params.page) queryParams.set("page", String(params.page));
    if (params.limit) queryParams.set("limit", String(params.limit));

    const url = `/api/v1/history${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const res = await api.get(url);

    if (res.data?.success && Array.isArray(res.data.entries)) {
      if (dispatch) {
        dispatch(mergeRemoteEntries(res.data.entries));
      }
      return res.data;
    }

    if (dispatch) {
      dispatch(setHistorySyncStatus("synced"));
      dispatch(setHistoryLoading(false));
    }
    return { success: true, entries: [], total: 0 };
  } catch (error) {
    console.warn("Backend history fetch failed:", error.message || error);
    if (dispatch) {
      dispatch(setHistorySyncStatus("idle"));
      dispatch(setHistoryLoading(false));
    }
    return { success: false, error: error.message };
  }
}

export async function fetchAnalysisById(id) {
  if (!id || id === "undefined" || id === "null" || !String(id).trim()) {
    return null;
  }
  try {
    const res = await api.get(`/api/v1/history/${encodeURIComponent(String(id).trim())}`);
    if (res.data?.success && res.data.analysis) {
      return res.data.analysis;
    }
    return null;
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn(`Analysis record not found: ${id}`);
    } else if (error.response?.status === 401) {
      console.warn("Unauthorized history fetch");
    } else {
      console.error("Fetch analysis by ID failed:", error.message || error);
    }
    return null;
  }
}

export async function createAnalysisRecord(dispatch, payload, isAuthenticated = false) {
  if (!payload) return null;

  const clientEntryId =
    payload.id ||
    payload._id ||
    payload.clientEntryId ||
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const entryToSave = {
    ...payload,
    id: clientEntryId,
    clientEntryId,
    createdAt: payload.createdAt || new Date().toISOString(),
  };

  // Optimistic update locally
  if (dispatch) {
    dispatch(addHistoryEntry(entryToSave));
  }

  if (!isAuthenticated) return entryToSave;

  try {
    if (dispatch) dispatch(setHistorySyncStatus("syncing"));
    const res = await api.post("/api/v1/history", entryToSave);
    if (res.data?.success && res.data.analysis) {
      if (dispatch) {
        // Replace optimistic entry with the canonical database record including doc._id
        dispatch(addHistoryEntry(res.data.analysis));
        dispatch(setHistorySyncStatus("synced"));
      }
      return res.data.analysis;
    }
  } catch (error) {
    console.warn("Failed to persist analysis to backend:", error.message || error);
    if (dispatch) dispatch(setHistorySyncStatus("idle"));
  }
  return entryToSave;
}

export async function saveChartToAnalysis(dispatch, analysisId, chartConfig, isAuthenticated = false) {
  if (!chartConfig || !analysisId) return;

  if (isAuthenticated) {
    try {
      const res = await api.patch(`/api/v1/history/${encodeURIComponent(analysisId)}`, {
        chartConfig,
      });
      if (res.data?.success && res.data.analysis && dispatch) {
        dispatch(addHistoryEntry(res.data.analysis));
      }
    } catch (error) {
      console.warn("Failed to attach chart configuration to analysis:", error.message || error);
    }
  }
}

export async function attachInsightToAnalysis(dispatch, analysisId, savedInsight, isAuthenticated = false) {
  if (!savedInsight || !analysisId) return;

  if (isAuthenticated) {
    try {
      const res = await api.patch(`/api/v1/history/${encodeURIComponent(analysisId)}`, {
        savedInsight,
      });
      if (res.data?.success && res.data.analysis && dispatch) {
        dispatch(addHistoryEntry(res.data.analysis));
      }
    } catch (error) {
      console.warn("Failed to attach AI insight to analysis:", error.message || error);
    }
  }
}

export async function updateAnalysisSummary(dispatch, analysisId, summaryStatistics, isAuthenticated = false) {
  if (!summaryStatistics || !analysisId) return;

  if (isAuthenticated) {
    try {
      const res = await api.patch(`/api/v1/history/${encodeURIComponent(analysisId)}`, {
        summaryStatistics,
      });
      if (res.data?.success && res.data.analysis && dispatch) {
        dispatch(addHistoryEntry(res.data.analysis));
      }
    } catch (error) {
      console.warn("Failed to update summary statistics on analysis:", error.message || error);
    }
  }
}

export async function saveAnalysisHistory(dispatch, entry, isAuthenticated = false) {
  if (!dispatch || !entry) return;

  dispatch(addHistoryEntry(entry));

  if (!isAuthenticated) return;

  try {
    dispatch(setHistorySyncStatus("syncing"));
    await api.post("/api/v1/history", entry);
    dispatch(setHistorySyncStatus("synced"));
  } catch (error) {
    console.warn("Failed to persist analysis to backend:", error.message || error);
    dispatch(setHistorySyncStatus("idle"));
  }
}

export async function deleteAnalysisHistory(dispatch, id, isAuthenticated = false) {
  if (!id) return;

  if (dispatch) {
    dispatch(deleteHistoryEntry({ id }));
  }

  if (!isAuthenticated) return;

  try {
    await api.delete(`/api/v1/history/${encodeURIComponent(id)}`);
  } catch (error) {
    console.warn("Failed to delete analysis from backend:", error.message || error);
  }
}

export async function clearAllAnalysisHistory(dispatch, userId, isAuthenticated = false) {
  if (dispatch) {
    dispatch(clearUserHistory({ userId }));
  }

  if (!isAuthenticated) return;

  try {
    await api.delete("/api/v1/history");
  } catch (error) {
    console.warn("Failed to clear backend analysis history:", error.message || error);
  }
}
