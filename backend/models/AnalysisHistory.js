import mongoose from "mongoose";

const chartConfigurationSchema = new mongoose.Schema(
  {
    id: { type: String },
    chartType: { type: String, required: true },
    title: { type: String, default: "Saved Chart" },
    xAxisCol: { type: Number },
    yAxisCol: { type: Number },
    zAxisCol: { type: Number },
    sizeAxisCol: { type: Number },
    xLabel: { type: String },
    yLabel: { type: String },
    zLabel: { type: String },
    sizeLabel: { type: String },
    worksheet: { type: String },
    chartData: {
      columns: { type: [String], default: [] },
      rows: { type: Array, default: [] },
      totalRows: { type: Number, default: 0 },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const savedInsightSchema = new mongoose.Schema(
  {
    id: { type: String },
    query: { type: String },
    response: { type: String },
    status: { type: String, default: "completed" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const columnMetaSchema = new mongoose.Schema(
  {
    header: { type: String },
    type: { type: String, default: "text" },
  },
  { _id: false }
);

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
      enum: ["workbook", "ai", "chart", "summary"],
      default: "workbook",
      index: true,
    },
    // Workbook-level fields
    fileName: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    fileType: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 20,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Processing", "Completed", "Failed"],
      default: "Completed",
      index: true,
    },
    sheetNames: {
      type: [String],
      default: [],
    },
    selectedSheet: {
      type: String,
      trim: true,
    },
    rowCount: {
      type: Number,
      default: 0,
    },
    columnCount: {
      type: Number,
      default: 0,
    },
    columns: {
      type: [columnMetaSchema],
      default: [],
    },
    summaryStatistics: {
      type: Array,
      default: [],
    },
    chartConfigurations: {
      type: [chartConfigurationSchema],
      default: [],
    },
    savedInsights: {
      type: [savedInsightSchema],
      default: [],
    },
    dataSnapshot: {
      type: Array,
      default: [],
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    isSampled: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
      trim: true,
    },

    // Legacy fields for backward compatibility with isolated snapshots
    title: {
      type: String,
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

// Compound indexes for optimal user-scoped timeline queries
analysisHistorySchema.index({ userId: 1, createdAt: -1 });
analysisHistorySchema.index({ userId: 1, status: 1 });
analysisHistorySchema.index({ userId: 1, dedupeKey: 1 });
analysisHistorySchema.index({ userId: 1, type: 1 });

export const AnalysisHistory = mongoose.model(
  "AnalysisHistory",
  analysisHistorySchema
);
