import mongoose from "mongoose";
import { AnalysisHistory } from "../models/AnalysisHistory.js";

const MAX_HISTORY_PER_USER = 100;
const MAX_SNAPSHOT_ROWS = 2500;

function formatListEntry(doc) {
  if (!doc) return null;
  const chartConfigs = Array.isArray(doc.chartConfigurations) ? doc.chartConfigurations : [];
  const savedInsights = Array.isArray(doc.savedInsights) ? doc.savedInsights : [];

  const chartCount = chartConfigs.length > 0 ? chartConfigs.length : (doc.chart?.columns?.length ? 1 : 0);
  const insightsCount = savedInsights.length > 0 ? savedInsights.length : (doc.response ? 1 : 0);

  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    clientEntryId: doc.clientEntryId || doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type || "workbook",
    fileName: doc.fileName || doc.datasetName || doc.title || "Workbook Analysis",
    fileType: doc.fileType || (doc.fileName ? doc.fileName.split(".").pop().toLowerCase() : "xlsx"),
    fileSize: Number.isFinite(doc.fileSize) ? doc.fileSize : 0,
    status: doc.status || "Completed",
    sheetNames: Array.isArray(doc.sheetNames) ? doc.sheetNames : [],
    selectedSheet: doc.selectedSheet || (doc.sheetNames?.[0] || ""),
    rowCount: Number.isFinite(doc.rowCount) ? doc.rowCount : 0,
    columnCount: Number.isFinite(doc.columnCount) ? doc.columnCount : (doc.columns?.length || 0),
    columns: Array.isArray(doc.columns) ? doc.columns : [],
    chartCount,
    insightsCount,
    hasAiInsights: insightsCount > 0,
    title: doc.title || doc.fileName || "Analysis",
    summaryStatistics: Array.isArray(doc.summaryStatistics) ? doc.summaryStatistics : [],
    errorMessage: doc.errorMessage || null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
  };
}

function formatFullEntry(doc) {
  if (!doc) return null;
  const listEntry = formatListEntry(doc);
  return {
    ...listEntry,
    dataSnapshot: Array.isArray(doc.dataSnapshot) ? doc.dataSnapshot : [],
    totalRows: Number.isFinite(doc.totalRows) ? doc.totalRows : (doc.dataSnapshot?.length || 0),
    isSampled: Boolean(doc.isSampled),
    chartConfigurations: Array.isArray(doc.chartConfigurations) ? doc.chartConfigurations : [],
    savedInsights: Array.isArray(doc.savedInsights) ? doc.savedInsights : [],
    // Legacy support fields
    prompt: doc.prompt || "",
    response: doc.response || "",
    chart: doc.chart || null,
    dedupeKey: doc.dedupeKey || "",
  };
}

export const getHistory = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      type,
      status,
      fileType,
      search,
      sort = "newest",
      limit = 20,
      page = 1,
    } = req.query;

    const query = { userId };

    if (status && ["Completed", "Processing", "Failed"].includes(status)) {
      query.status = status;
    }

    if (fileType && typeof fileType === "string" && fileType !== "all") {
      query.fileType = fileType.toLowerCase().trim();
    }

    if (type && ["workbook", "ai", "chart", "summary"].includes(type)) {
      query.type = type;
    } else if (!type || type === "workbook") {
      // Primary history view represents uploaded Excel workbooks only, excluding standalone activity records
      query.type = { $nin: ["ai", "chart", "summary"] };
    }

    if (search && typeof search === "string" && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(sanitized, "i");
      query.$or = [
        { fileName: regex },
        { title: regex },
        { datasetName: regex },
        { prompt: regex },
      ];
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const sortOrder = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const [total, docs] = await Promise.all([
      AnalysisHistory.countDocuments(query),
      AnalysisHistory.find(query)
        .select("-dataSnapshot") // Do not fetch heavy row arrays for the list view
        .sort(sortOrder)
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1,
      entries: docs.map(formatListEntry),
    });
  } catch (error) {
    console.error("Get history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve analysis history",
    });
  }
};

export const getHistoryById = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    if (!id || id === "undefined" || id === "null" || !String(id).trim()) {
      return res.status(400).json({ success: false, message: "Valid analysis ID is required" });
    }

    const cleanId = String(id).trim();
    const orConditions = [{ clientEntryId: cleanId }];
    if (mongoose.isValidObjectId(cleanId)) {
      orConditions.push({ _id: cleanId });
    }

    // Scoped strictly to authenticated user!
    const doc = await AnalysisHistory.findOne({
      userId,
      $or: orConditions,
    }).lean();

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Analysis record not found or access denied",
      });
    }

    return res.status(200).json({
      success: true,
      analysis: formatFullEntry(doc),
    });
  } catch (error) {
    console.error("Get history by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve analysis record",
    });
  }
};

export const createHistoryEntry = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const body = req.body || {};
    const {
      id: clientEntryId,
      type = "workbook",
      fileName,
      fileType,
      fileSize = 0,
      status = "Completed",
      sheetNames = [],
      selectedSheet = "",
      rowCount = 0,
      columnCount = 0,
      columns = [],
      summaryStatistics = [],
      chartConfigurations = [],
      savedInsights = [],
      dataSnapshot = [],
      totalRows = 0,
      errorMessage,
      // Legacy fields
      title,
      prompt,
      response,
      datasetName,
      chart,
      dedupeKey,
      createdAt,
    } = body;

    const resolvedTitle = (fileName || title || datasetName || "").trim();
    if (!resolvedTitle) {
      return res.status(400).json({
        success: false,
        message: "Filename or title is required for an analysis entry",
      });
    }

    // Deduplication check if dedupeKey is provided
    if (dedupeKey && typeof dedupeKey === "string" && dedupeKey.trim()) {
      const existing = await AnalysisHistory.findOne({
        userId,
        dedupeKey: dedupeKey.trim(),
      }).lean();

      if (existing) {
        return res.status(200).json({
          success: true,
          duplicate: true,
          analysis: formatFullEntry(existing),
          entry: formatFullEntry(existing), // backward compatibility
        });
      }
    }

    // Bound data snapshot to ensure BSON stays safely below MongoDB document limits
    const safeTotalRows = totalRows || (Array.isArray(dataSnapshot) ? dataSnapshot.length : rowCount);
    const isSampled = Array.isArray(dataSnapshot) && dataSnapshot.length > MAX_SNAPSHOT_ROWS;
    const boundedSnapshot = Array.isArray(dataSnapshot)
      ? dataSnapshot.slice(0, MAX_SNAPSHOT_ROWS)
      : [];

    // Prune oldest entries beyond MAX_HISTORY_PER_USER
    const currentCount = await AnalysisHistory.countDocuments({ userId });
    if (currentCount >= MAX_HISTORY_PER_USER) {
      const excessCount = currentCount - MAX_HISTORY_PER_USER + 1;
      const oldestDocs = await AnalysisHistory.find({ userId })
        .sort({ createdAt: 1 })
        .limit(excessCount)
        .select("_id")
        .lean();

      if (oldestDocs.length > 0) {
        await AnalysisHistory.deleteMany({
          _id: { $in: oldestDocs.map((doc) => doc._id) },
        });
      }
    }

    const resolvedFileType = fileType || (fileName ? fileName.split(".").pop().toLowerCase() : "xlsx");

    const newDoc = await AnalysisHistory.create({
      userId,
      clientEntryId: clientEntryId ? String(clientEntryId) : undefined,
      type: ["workbook", "ai", "chart", "summary"].includes(type) ? type : "workbook",
      fileName: fileName ? fileName.trim() : resolvedTitle,
      fileType: resolvedFileType,
      fileSize: Number.isFinite(fileSize) ? fileSize : 0,
      status: ["Processing", "Completed", "Failed"].includes(status) ? status : "Completed",
      sheetNames: Array.isArray(sheetNames) ? sheetNames : [],
      selectedSheet: selectedSheet ? String(selectedSheet).trim() : (sheetNames?.[0] || ""),
      rowCount: Number.isFinite(rowCount) ? rowCount : Math.max(0, boundedSnapshot.length - 1),
      columnCount: Number.isFinite(columnCount) ? columnCount : (columns.length || boundedSnapshot[0]?.length || 0),
      columns: Array.isArray(columns) ? columns : [],
      summaryStatistics: Array.isArray(summaryStatistics) ? summaryStatistics : [],
      chartConfigurations: Array.isArray(chartConfigurations) ? chartConfigurations : [],
      savedInsights: Array.isArray(savedInsights) ? savedInsights : [],
      dataSnapshot: boundedSnapshot,
      totalRows: safeTotalRows,
      isSampled,
      errorMessage: errorMessage ? String(errorMessage).trim() : undefined,
      // Legacy compatibility fields
      title: resolvedTitle,
      prompt: prompt ? String(prompt).trim() : undefined,
      response: response ? String(response) : undefined,
      datasetName: datasetName ? String(datasetName).trim() : (fileName || "Uploaded dataset"),
      chart: chart && typeof chart === "object" ? chart : undefined,
      dedupeKey: dedupeKey ? String(dedupeKey).trim() : undefined,
      createdAt: createdAt && !isNaN(Date.parse(createdAt)) ? new Date(createdAt) : new Date(),
    });

    const formatted = formatFullEntry(newDoc);
    return res.status(201).json({
      success: true,
      analysis: formatted,
      entry: formatted, // backward compatibility
    });
  } catch (error) {
    console.error("Create history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save analysis history record",
    });
  }
};

export const updateHistoryEntry = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    if (!id || id === "undefined" || id === "null" || !String(id).trim()) {
      return res.status(400).json({ success: false, message: "Valid analysis ID is required" });
    }

    const cleanId = String(id).trim();
    const orConditions = [{ clientEntryId: cleanId }];
    if (mongoose.isValidObjectId(cleanId)) {
      orConditions.push({ _id: cleanId });
    }

    const doc = await AnalysisHistory.findOne({
      userId,
      $or: orConditions,
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Analysis record not found or access denied",
      });
    }

    const {
      chartConfig,
      savedInsight,
      summaryStatistics,
      selectedSheet,
      status,
      errorMessage,
    } = req.body || {};

    if (chartConfig && typeof chartConfig === "object" && chartConfig.chartType) {
      const chartId = chartConfig.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newConfig = {
        ...chartConfig,
        id: chartId,
        updatedAt: new Date(),
      };

      const existingIndex = doc.chartConfigurations.findIndex(
        (c) => c.id === chartId || (c.chartType === chartConfig.chartType && c.title === chartConfig.title)
      );

      if (existingIndex >= 0) {
        doc.chartConfigurations[existingIndex] = {
          ...doc.chartConfigurations[existingIndex].toObject(),
          ...newConfig,
        };
      } else {
        doc.chartConfigurations.push(newConfig);
      }
    }

    if (savedInsight && typeof savedInsight === "object" && savedInsight.response) {
      const insightId = savedInsight.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      doc.savedInsights.push({
        id: insightId,
        query: savedInsight.query || "",
        response: savedInsight.response,
        status: savedInsight.status || "completed",
        createdAt: new Date(),
      });
    }

    if (Array.isArray(summaryStatistics)) {
      doc.summaryStatistics = summaryStatistics;
    }

    if (selectedSheet) {
      doc.selectedSheet = String(selectedSheet).trim();
    }

    if (status && ["Processing", "Completed", "Failed"].includes(status)) {
      doc.status = status;
    }

    if (errorMessage !== undefined) {
      doc.errorMessage = errorMessage ? String(errorMessage).trim() : undefined;
    }

    await doc.save();

    const formatted = formatFullEntry(doc);
    return res.status(200).json({
      success: true,
      analysis: formatted,
      entry: formatted,
    });
  } catch (error) {
    console.error("Update history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update analysis history",
    });
  }
};

export const deleteHistoryEntry = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    if (!id || id === "undefined" || id === "null" || !String(id).trim()) {
      return res.status(400).json({ success: false, message: "Valid analysis ID is required" });
    }

    const cleanId = String(id).trim();
    const orConditions = [{ clientEntryId: cleanId }];
    if (mongoose.isValidObjectId(cleanId)) {
      orConditions.push({ _id: cleanId });
    }

    // Scoped strictly to authenticated user!
    const deleted = await AnalysisHistory.findOneAndDelete({
      userId,
      $or: orConditions,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Analysis history entry not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "History entry deleted successfully",
      id,
    });
  } catch (error) {
    console.error("Delete history entry error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete history entry",
    });
  }
};

export const clearHistory = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await AnalysisHistory.deleteMany({ userId });

    return res.status(200).json({
      success: true,
      message: "All analysis history cleared successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Clear history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear analysis history",
    });
  }
};
