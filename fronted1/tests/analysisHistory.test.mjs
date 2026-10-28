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
