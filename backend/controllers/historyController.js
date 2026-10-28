import mongoose from "mongoose";
import { AnalysisHistory } from "../models/AnalysisHistory.js";

const MAX_HISTORY_PER_USER = 100;

function formatHistoryEntry(doc) {
  if (!doc) return null;
  return {
    id: doc.clientEntryId || doc._id.toString(),
    _id: doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type,
    title: doc.title,
    prompt: doc.prompt || "",
    response: doc.response || "",
    datasetName: doc.datasetName || "Uploaded dataset",
    rowCount: Number.isFinite(doc.rowCount) ? doc.rowCount : 0,
    chart: doc.chart || null,
    dedupeKey: doc.dedupeKey || "",
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
  };
}

export const getHistory = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { type, search, limit = 100, page = 1 } = req.query;
    const query = { userId };

    if (type && ["ai", "chart", "summary"].includes(type)) {
      query.type = type;
    }

    if (search && typeof search === "string" && search.trim()) {
      const sanitizedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(sanitizedSearch, "i");
      query.$or = [{ title: searchRegex }, { prompt: searchRegex }, { datasetName: searchRegex }];
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 200);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const [total, docs] = await Promise.all([
      AnalysisHistory.countDocuments(query),
      AnalysisHistory.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: parsedPage,
      limit: parsedLimit,
      entries: docs.map(formatHistoryEntry),
    });
  } catch (error) {
    console.error("Get history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve analysis history",
    });
  }
};

export const createHistoryEntry = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      id: clientEntryId,
      type,
      title,
      prompt,
      response,
      datasetName,
      rowCount,
      chart,
      dedupeKey,
      createdAt,
    } = req.body || {};

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required for an analysis entry",
      });
    }

    if (!type || !["ai", "chart", "summary"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Must be 'ai', 'chart', or 'summary'",
      });
    }

    // Deduplication check
    if (dedupeKey && typeof dedupeKey === "string" && dedupeKey.trim()) {
      const existing = await AnalysisHistory.findOne({
        userId,
        dedupeKey: dedupeKey.trim(),
      }).lean();

      if (existing) {
        return res.status(200).json({
          success: true,
          duplicate: true,
          entry: formatHistoryEntry(existing),
        });
      }
    }

    // Prune older entries if user exceeds max history limit
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

    const newDoc = await AnalysisHistory.create({
      userId,
      clientEntryId: clientEntryId ? String(clientEntryId) : undefined,
      type,
      title: title.trim(),
      prompt: prompt ? String(prompt).trim() : undefined,
      response: response ? String(response) : undefined,
      datasetName: datasetName ? String(datasetName).trim() : "Uploaded dataset",
      rowCount: Number.isFinite(rowCount) ? rowCount : 0,
      chart: chart && typeof chart === "object" ? chart : undefined,
      dedupeKey: dedupeKey ? String(dedupeKey).trim() : undefined,
      createdAt: createdAt && !isNaN(Date.parse(createdAt)) ? new Date(createdAt) : new Date(),
    });

    return res.status(201).json({
      success: true,
      entry: formatHistoryEntry(newDoc),
    });
  } catch (error) {
    console.error("Create history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save analysis history entry",
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
    if (!id) {
      return res.status(400).json({ success: false, message: "Entry ID is required" });
    }

    const orConditions = [{ clientEntryId: id }];
    if (mongoose.isValidObjectId(id)) {
      orConditions.push({ _id: id });
    }

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
