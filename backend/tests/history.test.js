import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  getHistory,
  getHistoryById,
  createHistoryEntry,
  updateHistoryEntry,
  deleteHistoryEntry,
  clearHistory,
} from "../controllers/historyController.js";
import { AnalysisHistory } from "../models/AnalysisHistory.js";

function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
}

describe("Backend Analysis History Controller Tests", () => {
  test("createHistoryEntry returns 401 if user is not authenticated", async () => {
    const req = { user: null, body: { title: "Chart", type: "chart" } };
    const res = createMockRes();

    await createHistoryEntry(req, res);
    assert.equal(res.statusCode, 401);
    assert.equal(res.data.success, false);
  });

  test("createHistoryEntry returns 400 if title/fileName is missing", async () => {
    const req = { user: { _id: "6507f1f77b1b3a2a8b999999" }, body: { title: "", fileName: "" } };
    const res = createMockRes();

    await createHistoryEntry(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.data.message, /Filename or title is required/);
  });

  test("createHistoryEntry creates workbook analysis with sheets and columns", async () => {
    const origFindOne = AnalysisHistory.findOne;
    const origCount = AnalysisHistory.countDocuments;
    const origCreate = AnalysisHistory.create;

    try {
      AnalysisHistory.findOne = () => ({ lean: async () => null });
      AnalysisHistory.countDocuments = async () => 2;
      AnalysisHistory.create = async (doc) => ({
        _id: "6507f1f77b1b3a2a8b777777",
        ...doc,
      });

      const req = {
        user: { _id: "6507f1f77b1b3a2a8b999999" },
        body: {
          fileName: "Monthly_Sales.xlsx",
          fileType: "xlsx",
          fileSize: 45000,
          sheetNames: ["Sales_Data", "Category_Summary"],
          selectedSheet: "Sales_Data",
          rowCount: 30,
          columnCount: 4,
          columns: [
            { header: "Date", type: "date" },
            { header: "Category", type: "categorical" },
            { header: "Revenue", type: "numeric" },
            { header: "Units", type: "numeric" },
          ],
          dataSnapshot: [
            ["Date", "Category", "Revenue", "Units"],
            ["2026-01-01", "Electronics", 1200, 5],
          ],
        },
      };
      const res = createMockRes();

      await createHistoryEntry(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.analysis.fileName, "Monthly_Sales.xlsx");
      assert.equal(res.data.analysis.sheetNames.length, 2);
      assert.equal(res.data.analysis.status, "Completed");
      assert.equal(res.data.analysis.dataSnapshot.length, 2);
    } finally {
      AnalysisHistory.findOne = origFindOne;
      AnalysisHistory.countDocuments = origCount;
      AnalysisHistory.create = origCreate;
    }
  });

  test("getHistoryById returns full analysis document for authorized user", async () => {
    const origFindOne = AnalysisHistory.findOne;

    try {
      AnalysisHistory.findOne = (query) => ({
        lean: async () => {
          if (query.userId !== "6507f1f77b1b3a2a8b999999") return null;
          return {
            _id: "6507f1f77b1b3a2a8b777777",
            userId: "6507f1f77b1b3a2a8b999999",
            fileName: "Monthly_Sales.xlsx",
            fileType: "xlsx",
            status: "Completed",
            sheetNames: ["Sales_Data"],
            selectedSheet: "Sales_Data",
            rowCount: 30,
            columnCount: 4,
            chartConfigurations: [
              {
                id: "chart-1",
                chartType: "Bar",
                title: "Revenue by Category",
                xAxisCol: 1,
                yAxisCol: 2,
              },
            ],
            savedInsights: [
              {
                query: "What is top category?",
                response: "Electronics is top category.",
              },
            ],
            dataSnapshot: [["Category", "Revenue"], ["Electronics", 5000]],
          };
        },
      });

      const req = {
        user: { _id: "6507f1f77b1b3a2a8b999999" },
        params: { id: "6507f1f77b1b3a2a8b777777" },
      };
      const res = createMockRes();

      await getHistoryById(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.analysis.fileName, "Monthly_Sales.xlsx");
      assert.equal(res.data.analysis.chartConfigurations.length, 1);
      assert.equal(res.data.analysis.savedInsights.length, 1);
      assert.equal(res.data.analysis.dataSnapshot.length, 2);
    } finally {
      AnalysisHistory.findOne = origFindOne;
    }
  });

  test("getHistoryById returns 400 when id is 'undefined', 'null', or empty", async () => {
    for (const badId of ["undefined", "null", "   ", ""]) {
      const req = {
        user: { _id: "6507f1f77b1b3a2a8b999999" },
        params: { id: badId },
      };
      const res = createMockRes();

      await getHistoryById(req, res);
      assert.equal(res.statusCode, 400);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /Valid analysis ID is required/i);
    }
  });

  test("getHistoryById returns 404 when user tries to access another user's analysis", async () => {
    const origFindOne = AnalysisHistory.findOne;

    try {
      // Simulate query with authenticated user filter
      AnalysisHistory.findOne = (query) => ({
        lean: async () => {
          // Document belongs to user B, but request comes from user A
          if (query.userId === "attacker-user-id") return null;
          return null;
        },
      });

      const req = {
        user: { _id: "attacker-user-id" },
        params: { id: "victim-analysis-id" },
      };
      const res = createMockRes();

      await getHistoryById(req, res);
      assert.equal(res.statusCode, 404);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /access denied/i);
    } finally {
      AnalysisHistory.findOne = origFindOne;
    }
  });

  test("updateHistoryEntry appends chart configuration and saved insight", async () => {
    const origFindOne = AnalysisHistory.findOne;

    try {
      const mockDoc = {
        _id: "6507f1f77b1b3a2a8b777777",
        userId: "6507f1f77b1b3a2a8b999999",
        fileName: "Monthly_Sales.xlsx",
        chartConfigurations: [],
        savedInsights: [],
        save: async function () { return this; },
        toObject: function () { return this; },
      };

      AnalysisHistory.findOne = () => mockDoc;

      const req = {
        user: { _id: "6507f1f77b1b3a2a8b999999" },
        params: { id: "6507f1f77b1b3a2a8b777777" },
        body: {
          chartConfig: {
            id: "chart-101",
            chartType: "Line",
            title: "Revenue by Date",
            xAxisCol: 0,
            yAxisCol: 2,
          },
          savedInsight: {
            query: "Highlight anomalies",
            response: "No negative variances found.",
          },
        },
      };
      const res = createMockRes();

      await updateHistoryEntry(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.data.success, true);
      assert.equal(mockDoc.chartConfigurations.length, 1);
      assert.equal(mockDoc.chartConfigurations[0].title, "Revenue by Date");
      assert.equal(mockDoc.savedInsights.length, 1);
      assert.equal(mockDoc.savedInsights[0].query, "Highlight anomalies");
    } finally {
      AnalysisHistory.findOne = origFindOne;
    }
  });

  test("getHistory returns entries for the authenticated user with status and counters", async () => {
    const origCount = AnalysisHistory.countDocuments;
    const origFind = AnalysisHistory.find;

    try {
      AnalysisHistory.countDocuments = async () => 1;
      AnalysisHistory.find = () => ({
        select: () => ({
          sort: () => ({
            skip: () => ({
              limit: () => ({
                lean: async () => [
                  {
                    _id: "6507f1f77b1b3a2a8b333333",
                    userId: "6507f1f77b1b3a2a8b999999",
                    fileName: "Quarterly_Report.xlsx",
                    fileType: "xlsx",
                    status: "Completed",
                    sheetNames: ["Q1", "Q2"],
                    rowCount: 100,
                    columnCount: 5,
                    chartConfigurations: [{ id: "c1" }, { id: "c2" }],
                    savedInsights: [{ id: "i1" }],
                    createdAt: new Date("2026-10-25T12:00:00Z"),
                  },
                ],
              }),
            }),
          }),
        }),
      });

      const req = {
        user: { _id: "6507f1f77b1b3a2a8b999999" },
        query: { limit: "10" },
      };
      const res = createMockRes();

      await getHistory(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.total, 1);
      assert.equal(res.data.entries.length, 1);
      assert.equal(res.data.entries[0].fileName, "Quarterly_Report.xlsx");
      assert.equal(res.data.entries[0].chartCount, 2);
      assert.equal(res.data.entries[0].insightsCount, 1);
      assert.equal(res.data.entries[0].status, "Completed");
    } finally {
      AnalysisHistory.countDocuments = origCount;
      AnalysisHistory.find = origFind;
    }
  });

  test("deleteHistoryEntry removes entry and returns 200", async () => {
    const origFindOneAndDelete = AnalysisHistory.findOneAndDelete;

    try {
      AnalysisHistory.findOneAndDelete = async () => ({
        _id: "6507f1f77b1b3a2a8b333333",
      });

      const req = {
        user: { _id: "6507f1f77b1b3a2a8b999999" },
        params: { id: "item-to-delete" },
      };
      const res = createMockRes();

      await deleteHistoryEntry(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.data.success, true);
    } finally {
      AnalysisHistory.findOneAndDelete = origFindOneAndDelete;
    }
  });

  test("clearHistory deletes all history for user and returns count", async () => {
    const origDeleteMany = AnalysisHistory.deleteMany;

    try {
      AnalysisHistory.deleteMany = async () => ({ deletedCount: 8 });

      const req = {
        user: { _id: "6507f1f77b1b3a2a8b999999" },
      };
      const res = createMockRes();

      await clearHistory(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.deletedCount, 8);
    } finally {
      AnalysisHistory.deleteMany = origDeleteMany;
    }
  });

  test("getHistory filters out standalone activity entries (ai, chart, summary) from primary workbook list", async () => {
    const origCount = AnalysisHistory.countDocuments;
    const origFind = AnalysisHistory.find;
    let capturedQuery = null;

    try {
      AnalysisHistory.countDocuments = async (query) => {
        capturedQuery = query;
        return 1;
      };
      AnalysisHistory.find = (query) => {
        capturedQuery = query;
        return {
          select: () => ({
            sort: () => ({
              skip: () => ({
                limit: () => ({
                  lean: async () => [
                    {
                      _id: "6507f1f77b1b3a2a8b333333",
                      userId: "6507f1f77b1b3a2a8b999999",
                      fileName: "Quarterly_Report.xlsx",
                      type: "workbook",
                      createdAt: new Date(),
                    },
                  ],
                }),
              }),
            }),
          }),
        };
      };

      const req = {
        user: { _id: "6507f1f77b1b3a2a8b999999" },
        query: {},
      };
      const res = createMockRes();

      await getHistory(req, res);
      assert.equal(res.statusCode, 200);
      assert.deepEqual(capturedQuery.type, { $nin: ["ai", "chart", "summary"] });
    } finally {
      AnalysisHistory.countDocuments = origCount;
      AnalysisHistory.find = origFind;
    }
  });

  test("adding multiple charts and AI queries updates existing workbook without creating new top-level entries", async () => {
    const origFindOne = AnalysisHistory.findOne;

    try {
      const workbookDoc = {
        _id: "6507f1f77b1b3a2a8b777777",
        userId: "6507f1f77b1b3a2a8b999999",
        fileName: "Monthly_Sales.xlsx",
        type: "workbook",
        chartConfigurations: [],
        savedInsights: [],
        save: async function () { return this; },
        toObject: function () { return this; },
      };

      AnalysisHistory.findOne = () => workbookDoc;

      // 1. Add first chart
      const reqChart1 = {
        user: { _id: "6507f1f77b1b3a2a8b999999" },
        params: { id: "6507f1f77b1b3a2a8b777777" },
        body: { chartConfig: { id: "c1", chartType: "Bar", title: "Revenue by Category" } },
      };
      await updateHistoryEntry(reqChart1, createMockRes());

      // 2. Add second chart
      const reqChart2 = {
        user: { _id: "6507f1f77b1b3a2a8b999999" },
        params: { id: "6507f1f77b1b3a2a8b777777" },
        body: { chartConfig: { id: "c2", chartType: "Line", title: "Units by Date" } },
      };
      await updateHistoryEntry(reqChart2, createMockRes());

      // 3. Attach AI insight
      const reqAi = {
        user: { _id: "6507f1f77b1b3a2a8b999999" },
        params: { id: "6507f1f77b1b3a2a8b777777" },
        body: { savedInsight: { query: "hii", response: "Hello! Here is your summary." } },
      };
      await updateHistoryEntry(reqAi, createMockRes());

      // Confirm workbook accumulated changes without creating separate documents
      assert.equal(workbookDoc.chartConfigurations.length, 2);
      assert.equal(workbookDoc.chartConfigurations[0].title, "Revenue by Category");
      assert.equal(workbookDoc.chartConfigurations[1].title, "Units by Date");
      assert.equal(workbookDoc.savedInsights.length, 1);
      assert.equal(workbookDoc.savedInsights[0].query, "hii");
    } finally {
      AnalysisHistory.findOne = origFindOne;
    }
  });
});
