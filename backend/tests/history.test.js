import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  getHistory,
  createHistoryEntry,
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

  test("createHistoryEntry returns 400 if title is missing", async () => {
    const req = { user: { _id: "6507f1f77b1b3a2a8b999999" }, body: { title: "", type: "chart" } };
    const res = createMockRes();

    await createHistoryEntry(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.data.message, "Title is required for an analysis entry");
  });

  test("createHistoryEntry returns 400 if type is invalid", async () => {
    const req = {
      user: { _id: "6507f1f77b1b3a2a8b999999" },
      body: { title: "Test", type: "invalid_type" },
    };
    const res = createMockRes();

    await createHistoryEntry(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.data.message, /Invalid type/);
  });

  test("createHistoryEntry returns existing item if dedupeKey already exists", async () => {
    const origFindOne = AnalysisHistory.findOne;
    try {
      AnalysisHistory.findOne = () => ({
        lean: async () => ({
          _id: "6507f1f77b1b3a2a8b111111",
          userId: "6507f1f77b1b3a2a8b999999",
          clientEntryId: "client-123",
          type: "chart",
          title: "Existing Chart",
          dedupeKey: "key-123",
          createdAt: new Date("2026-10-25T10:00:00Z"),
        }),
      });

      const req = {
        user: { _id: "6507f1f77b1b3a2a8b999999" },
        body: {
          title: "Existing Chart",
          type: "chart",
          dedupeKey: "key-123",
        },
      };
      const res = createMockRes();

      await createHistoryEntry(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.duplicate, true);
      assert.equal(res.data.entry.dedupeKey, "key-123");
    } finally {
      AnalysisHistory.findOne = origFindOne;
    }
  });

  test("createHistoryEntry successfully creates a new history entry", async () => {
    const origFindOne = AnalysisHistory.findOne;
    const origCount = AnalysisHistory.countDocuments;
    const origCreate = AnalysisHistory.create;

    try {
      AnalysisHistory.findOne = () => ({ lean: async () => null });
      AnalysisHistory.countDocuments = async () => 5;
      AnalysisHistory.create = async (doc) => ({
        _id: "6507f1f77b1b3a2a8b222222",
        ...doc,
      });

      const req = {
        user: { _id: "6507f1f77b1b3a2a8b999999" },
        body: {
          id: "uuid-456",
          type: "ai",
          title: "AI Analysis",
          prompt: "What are sales trends?",
          response: "Sales increased by 15%",
          datasetName: "revenue.xlsx",
          rowCount: 100,
        },
      };
      const res = createMockRes();

      await createHistoryEntry(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.entry.id, "uuid-456");
      assert.equal(res.data.entry.type, "ai");
      assert.equal(res.data.entry.prompt, "What are sales trends?");
    } finally {
      AnalysisHistory.findOne = origFindOne;
      AnalysisHistory.countDocuments = origCount;
      AnalysisHistory.create = origCreate;
    }
  });

  test("getHistory returns entries for the authenticated user", async () => {
    const origCount = AnalysisHistory.countDocuments;
    const origFind = AnalysisHistory.find;

    try {
      AnalysisHistory.countDocuments = async () => 1;
      AnalysisHistory.find = () => ({
        sort: () => ({
          skip: () => ({
            limit: () => ({
              lean: async () => [
                {
                  _id: "6507f1f77b1b3a2a8b333333",
                  userId: "6507f1f77b1b3a2a8b999999",
                  clientEntryId: "client-entry-1",
                  type: "chart",
                  title: "Bar Chart Analysis",
                  datasetName: "data.csv",
                  rowCount: 50,
                  chart: { chartType: "Bar", columns: ["A", "B"], rows: [[1, 2]] },
                  createdAt: new Date("2026-10-25T12:00:00Z"),
                },
              ],
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
      assert.equal(res.data.entries[0].id, "client-entry-1");
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
});
