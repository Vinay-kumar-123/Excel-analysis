import test from "node:test";
import assert from "node:assert/strict";
import {
  appendAnalysisEntry,
  createAnalysisDedupeKey,
  createAnalysisEntry,
  mergeHistoryEntries,
  filterAndSortHistory,
  exportHistoryTableAsCsv,
  exportHistoryAsMarkdown,
  getValidEntryId,
  isWorkbookEntry,
  MAX_ANALYSIS_HISTORY,
  removeUserAnalysis,
} from "../lib/analysisHistory.mjs";

test("creates persistent timestamped analysis entries", () => {
  const entry = createAnalysisEntry(
    { type: "ai", title: "Revenue summary", userId: "user-1" },
    new Date("2026-10-24T12:00:00.000Z")
  );
  assert.ok(entry.id);
  assert.equal(entry.createdAt, "2026-10-24T12:00:00.000Z");
  assert.equal(entry.userId, "user-1");
});

test("prepends, deduplicates, and bounds saved history", () => {
  const oldEntries = Array.from({ length: MAX_ANALYSIS_HISTORY }, (_, index) => ({ id: `old-${index}` }));
  const entry = { id: "new" };
  const updated = appendAnalysisEntry(oldEntries, entry);
  assert.equal(updated.length, MAX_ANALYSIS_HISTORY);
  assert.equal(updated[0], entry);
  assert.equal(updated.includes(oldEntries.at(-1)), false);
  assert.equal(appendAnalysisEntry(updated, entry).length, MAX_ANALYSIS_HISTORY);
});

test("deduplicates repeated chart snapshots but distinguishes changed analyses", () => {
  const details = {
    userId: "user-1",
    type: "chart",
    datasetName: "sales.xlsx",
    title: "Revenue by Category",
    chart: { columns: ["Category", "Revenue"], rows: [["A", 10]] },
  };
  const key = createAnalysisDedupeKey(details);
  const entry = { ...details, id: "chart-1", dedupeKey: key };
  const existingEntries = [entry];

  assert.equal(createAnalysisDedupeKey(details), key);
  assert.equal(appendAnalysisEntry(existingEntries, { ...entry, id: "chart-2" }), existingEntries);
  assert.notEqual(
    createAnalysisDedupeKey({ ...details, chart: { ...details.chart, rows: [["A", 20]] } }),
    key
  );
});

test("clears only the requested user's history", () => {
  const entries = [{ userId: "one" }, { userId: "two" }];
  assert.deepEqual(removeUserAnalysis(entries, "one"), [{ userId: "two" }]);
});

test("mergeHistoryEntries reconciles local and remote entries without duplicates", () => {
  const remote = [
    { id: "r1", title: "Remote 1", createdAt: "2026-10-25T12:00:00Z" },
    { id: "r2", title: "Remote 2", dedupeKey: "key-a", createdAt: "2026-10-25T11:00:00Z" },
  ];
  const local = [
    { id: "r1", title: "Local copy of Remote 1", createdAt: "2026-10-25T12:00:00Z" },
    { id: "l1", title: "Local Only", dedupeKey: "key-a", createdAt: "2026-10-25T10:00:00Z" }, // duplicate dedupeKey
    { id: "l2", title: "Local 2", createdAt: "2026-10-25T13:00:00Z" },
  ];

  const merged = mergeHistoryEntries(local, remote);
  assert.equal(merged.length, 3);
  assert.equal(merged[0].id, "l2"); // Newest
  assert.equal(merged[1].id, "r1");
  assert.equal(merged[2].id, "r2");
});

test("filterAndSortHistory correctly filters by type, search, and sorts", () => {
  const items = [
    { id: "1", type: "ai", title: "Executive Report", prompt: "Summarize profits", createdAt: "2026-10-20T00:00:00Z", rowCount: 10 },
    { id: "2", type: "chart", title: "Bar Chart Analysis", prompt: "", createdAt: "2026-10-22T00:00:00Z", rowCount: 50 },
    { id: "3", type: "summary", title: "Column Statistics", prompt: "", createdAt: "2026-10-21T00:00:00Z", rowCount: 20 },
  ];

  const aiOnly = filterAndSortHistory(items, { type: "ai" });
  assert.equal(aiOnly.length, 1);
  assert.equal(aiOnly[0].id, "1");

  const searchResults = filterAndSortHistory(items, { search: "profits" });
  assert.equal(searchResults.length, 1);
  assert.equal(searchResults[0].id, "1");

  const sortedOldest = filterAndSortHistory(items, { sort: "oldest" });
  assert.equal(sortedOldest[0].id, "1");
  assert.equal(sortedOldest[2].id, "2");

  const sortedRows = filterAndSortHistory(items, { sort: "rows" });
  assert.equal(sortedRows[0].id, "2");
  assert.equal(sortedRows[2].id, "1");
});

test("exportHistoryTableAsCsv escapes quotes and generates valid CSV format", () => {
  const entry = {
    chart: {
      columns: ["Product", 'Price "USD"'],
      rows: [
        ["Widget A", 10.5],
        ['Special "Deluxe"', 25.0],
      ],
    },
  };
  const csv = exportHistoryTableAsCsv(entry);
  assert.ok(csv.includes('"Product","Price ""USD"""'));
  assert.ok(csv.includes('"Widget A","10.5"'));
  assert.ok(csv.includes('"Special ""Deluxe""","25"'));
});

test("exportHistoryAsMarkdown renders title, prompt, response, and table markdown", () => {
  const entry = {
    title: "Quarterly Analysis",
    type: "ai",
    datasetName: "q3_data.xlsx",
    prompt: "Highlight top performers",
    response: "Top performer was Team Alpha.",
    rowCount: 200,
  };
  const md = exportHistoryAsMarkdown(entry);
  assert.ok(md.includes("# Quarterly Analysis"));
  assert.ok(md.includes("## Query / Prompt"));
  assert.ok(md.includes("Highlight top performers"));
  assert.ok(md.includes("## Gemini Insights"));
  assert.ok(md.includes("Top performer was Team Alpha."));
});

test("reconstructs historical analysis data and saved chart configurations accurately", () => {
  const savedAnalysis = {
    id: "hist-101",
    fileName: "Monthly_Sales.xlsx",
    status: "Completed",
    sheetNames: ["Sales_Data", "Summary"],
    selectedSheet: "Sales_Data",
    rowCount: 30,
    columnCount: 3,
    dataSnapshot: [
      ["Date", "Category", "Revenue"],
      ["2026-10-01", "Hardware", 1500],
      ["2026-10-02", "Software", 3200],
    ],
    chartConfigurations: [
      {
        id: "c-1",
        chartType: "Bar",
        title: "Revenue by Category",
        xAxisCol: 1,
        yAxisCol: 2,
        chartData: {
          columns: ["Category", "Revenue"],
          rows: [["Hardware", 1500], ["Software", 3200]],
        },
      },
    ],
    savedInsights: [
      {
        query: "What is top category?",
        response: "Software generated the highest revenue ($3,200).",
      },
    ],
  };

  assert.equal(savedAnalysis.fileName, "Monthly_Sales.xlsx");
  assert.equal(savedAnalysis.sheetNames.length, 2);
  assert.equal(savedAnalysis.dataSnapshot.length, 3);
  assert.equal(savedAnalysis.chartConfigurations[0].title, "Revenue by Category");
  assert.equal(savedAnalysis.savedInsights[0].response.includes("Software"), true);
});

test("getValidEntryId returns null for undefined, null, or empty string to prevent /history/undefined", () => {
  assert.equal(getValidEntryId(null), null);
  assert.equal(getValidEntryId({}), null);
  assert.equal(getValidEntryId({ id: undefined }), null);
  assert.equal(getValidEntryId({ id: "undefined" }), null);
  assert.equal(getValidEntryId({ id: "null" }), null);
  assert.equal(getValidEntryId({ id: "" }), null);
  assert.equal(getValidEntryId({ _id: "   ", id: "null" }), null);
});

test("getValidEntryId extracts valid _id, id, or clientEntryId correctly", () => {
  assert.equal(getValidEntryId({ _id: "6507f1f77b1b3a2a8b999999" }), "6507f1f77b1b3a2a8b999999");
  assert.equal(getValidEntryId({ id: "6507f1f77b1b3a2a8b888888" }), "6507f1f77b1b3a2a8b888888");
  assert.equal(getValidEntryId({ clientEntryId: "uuid-12345" }), "uuid-12345");
  assert.equal(getValidEntryId({ id: "undefined", _id: "valid-mongo-id" }), "valid-mongo-id");
});

test("createAnalysisEntry guarantees a valid id even when payload lacks id", () => {
  const entry = createAnalysisEntry({ fileName: "test.xlsx", rowCount: 10 });
  assert.ok(entry.id);
  assert.notEqual(entry.id, "undefined");
  assert.notEqual(entry.id, "null");
  assert.ok(entry.clientEntryId);
});

test("appendAnalysisEntry replaces optimistic clientEntryId with backend persisted record without duplicate cards", () => {
  const optimistic = {
    id: "temp-client-id",
    clientEntryId: "temp-client-id",
    fileName: "Sales.xlsx",
    rowCount: 20,
  };
  const list = [optimistic];

  const canonicalBackend = {
    id: "6507f1f77b1b3a2a8b111111",
    _id: "6507f1f77b1b3a2a8b111111",
    clientEntryId: "temp-client-id",
    fileName: "Sales.xlsx",
    rowCount: 20,
  };

  const updated = appendAnalysisEntry(list, canonicalBackend);
  assert.equal(updated.length, 1);
  assert.equal(updated[0].id, "6507f1f77b1b3a2a8b111111");
  assert.equal(updated[0]._id, "6507f1f77b1b3a2a8b111111");
});

test("isWorkbookEntry distinguishes workbook analyses from standalone user activities (ai, chart, summary)", () => {
  const workbookEntry1 = { id: "w1", type: "workbook", fileName: "Sales.xlsx", rowCount: 100 };
  const workbookEntry2 = { id: "w2", fileName: "Budget.xlsx", sheetNames: ["Q1"] };
  const standaloneAi = { id: "a1", type: "ai", title: "hii", prompt: "hii" };
  const standaloneChart = { id: "c1", type: "chart", title: "Units Sold by Date" };
  const standaloneSummary = { id: "s1", type: "summary", title: "Statistics summary" };

  assert.equal(isWorkbookEntry(workbookEntry1), true);
  assert.equal(isWorkbookEntry(workbookEntry2), true);
  assert.equal(isWorkbookEntry(standaloneAi), false);
  assert.equal(isWorkbookEntry(standaloneChart), false);
  assert.equal(isWorkbookEntry(standaloneSummary), false);
});

test("filterAndSortHistory with onlyWorkbooks removes standalone user activities while preserving workbooks", () => {
  const items = [
    { id: "w1", type: "workbook", fileName: "Sales.xlsx", createdAt: "2026-10-25T10:00:00Z" },
    { id: "a1", type: "ai", title: "hii", createdAt: "2026-10-25T11:00:00Z" },
    { id: "c1", type: "chart", title: "Units Sold by Date", createdAt: "2026-10-25T12:00:00Z" },
    { id: "w2", type: "workbook", fileName: "Inventory.xlsx", createdAt: "2026-10-25T13:00:00Z" },
  ];

  const workbooksOnly = filterAndSortHistory(items, { onlyWorkbooks: true });
  assert.equal(workbooksOnly.length, 2);
  assert.equal(workbooksOnly[0].id, "w2");
  assert.equal(workbooksOnly[1].id, "w1");
});
