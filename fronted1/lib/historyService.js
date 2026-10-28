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

export async function fetchUserHistory(dispatch) {
  if (!dispatch) return;
  dispatch(setHistoryLoading(true));
  dispatch(setHistorySyncStatus("syncing"));

  try {
    const res = await api.get("/api/v1/user/history");
    if (res.data?.success && Array.isArray(res.data.entries)) {
      dispatch(mergeRemoteEntries(res.data.entries));
    } else {
      dispatch(setHistorySyncStatus("synced"));
      dispatch(setHistoryLoading(false));
    }
  } catch (error) {
    console.warn("Backend history fetch skipped or failed:", error.message || error);
    // Graceful offline fallback: keep local entries
    dispatch(setHistorySyncStatus("idle"));
    dispatch(setHistoryLoading(false));
  }
}

export async function saveAnalysisHistory(dispatch, entry, isAuthenticated = false) {
  if (!dispatch || !entry) return;

  // Optimistic update
  dispatch(addHistoryEntry(entry));

  if (!isAuthenticated) return;

  try {
    dispatch(setHistorySyncStatus("syncing"));
    await api.post("/api/v1/user/history", entry);
    dispatch(setHistorySyncStatus("synced"));
  } catch (error) {
    console.warn("Failed to persist analysis to backend:", error.message || error);
    dispatch(setHistorySyncStatus("idle"));
  }
}

export async function deleteAnalysisHistory(dispatch, id, isAuthenticated = false) {
  if (!dispatch || !id) return;

  // Optimistic update
  dispatch(deleteHistoryEntry({ id }));

  if (!isAuthenticated) return;

  try {
    await api.delete(`/api/v1/user/history/${encodeURIComponent(id)}`);
  } catch (error) {
    console.warn("Failed to delete analysis from backend:", error.message || error);
  }
}

export async function clearAllAnalysisHistory(dispatch, userId, isAuthenticated = false) {
  if (!dispatch) return;

  // Optimistic update
  dispatch(clearUserHistory({ userId }));

  if (!isAuthenticated) return;

  try {
    await api.delete("/api/v1/user/history");
  } catch (error) {
    console.warn("Failed to clear backend analysis history:", error.message || error);
  }
}
