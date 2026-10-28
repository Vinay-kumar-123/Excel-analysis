import mongoose from "mongoose";

const analysisHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clientEntryId: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["ai", "chart", "summary"],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    prompt: {
      type: String,
      trim: true,
      maxlength: 10000,
    },
    response: {
      type: String,
    },
    datasetName: {
      type: String,
      default: "Uploaded dataset",
      trim: true,
      maxlength: 300,
    },
    rowCount: {
      type: Number,
      default: 0,
    },
    chart: {
      chartType: { type: String, default: "" },
      columns: { type: [String], default: [] },
      rows: { type: Array, default: [] },
      totalRows: { type: Number, default: 0 },
    },
    dedupeKey: {
      type: String,
      trim: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal query performance
analysisHistorySchema.index({ userId: 1, createdAt: -1 });
analysisHistorySchema.index({ userId: 1, dedupeKey: 1 });
analysisHistorySchema.index({ userId: 1, type: 1 });

export const AnalysisHistory = mongoose.model(
  "AnalysisHistory",
  analysisHistorySchema
);
