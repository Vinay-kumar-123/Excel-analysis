export const MAX_ANALYSIS_HISTORY = 100;

export function createAnalysisEntry(details, createdAt = new Date()) {
  const dateObj = createdAt instanceof Date ? createdAt : new Date(createdAt);
  return {
    ...details,
    id: details?.id || globalThis.crypto?.randomUUID?.() || `${dateObj.getTime()}-${Math.random().toString(36).slice(2)}`,
    createdAt: dateObj.toISOString(),
  };
}

export function appendAnalysisEntry(entries = [], entry, limit = MAX_ANALYSIS_HISTORY) {
  if (!entry) return entries;
  if (
    entry.dedupeKey &&
    entries.some((existing) => existing.dedupeKey === entry.dedupeKey)
  ) {
    return entries;
  }
  return [entry, ...entries.filter((existing) => existing.id !== entry.id)].slice(0, limit);
}

export function mergeHistoryEntries(localEntries = [], remoteEntries = [], limit = MAX_ANALYSIS_HISTORY) {
  const seenIds = new Set();
  const seenDedupeKeys = new Set();
  const merged = [];

  // Remote entries are canonical for authenticated user, followed by any local-only entries
  const combined = [...remoteEntries, ...localEntries];

  for (const item of combined) {
    if (!item) continue;
    const itemId = item.id || item._id;
    const dedupeKey = item.dedupeKey;

    if (itemId && seenIds.has(itemId)) continue;
    if (dedupeKey && seenDedupeKeys.has(dedupeKey)) continue;

    if (itemId) seenIds.add(itemId);
    if (dedupeKey) seenDedupeKeys.add(dedupeKey);
    merged.push(item);
  }

  // Sort by createdAt descending
  merged.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  return merged.slice(0, limit);
}

export function createAnalysisDedupeKey(details) {
  const serialized = JSON.stringify({
    userId: details.userId,
    type: details.type,
    datasetName: details.datasetName,
    title: details.title,
    chart: details.chart,
  });
  let hash = 2166136261;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `analysis-${(hash >>> 0).toString(16)}`;
}

export function removeUserAnalysis(entries = [], userId) {
  return entries.filter((entry) => entry.userId !== userId);
}

export function filterAndSortHistory(entries = [], { type = "all", search = "", sort = "newest" } = {}) {
  let filtered = [...entries];

  if (type && type !== "all") {
    filtered = filtered.filter((entry) => entry.type === type);
  }

  if (search && typeof search === "string" && search.trim()) {
    const query = search.trim().toLowerCase();
    filtered = filtered.filter((entry) => {
      const title = (entry.title || "").toLowerCase();
      const prompt = (entry.prompt || "").toLowerCase();
      const dataset = (entry.datasetName || "").toLowerCase();
      const response = (entry.response || "").toLowerCase();
      return (
        title.includes(query) ||
        prompt.includes(query) ||
        dataset.includes(query) ||
        response.includes(query)
      );
    });
  }

  filtered.sort((a, b) => {
    if (sort === "oldest") {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    }
    if (sort === "rows") {
      const rowsA = Number.isFinite(a.rowCount) ? a.rowCount : 0;
      const rowsB = Number.isFinite(b.rowCount) ? b.rowCount : 0;
      return rowsB - rowsA;
    }
    // Default newest first
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  return filtered;
}

export function formatCsvField(val) {
  if (val === null || val === undefined) return '""';
  const stringVal = String(val);
  return `"${stringVal.replace(/"/g, '""')}"`;
}

export function exportHistoryTableAsCsv(entry) {
  if (!entry?.chart?.columns || !Array.isArray(entry.chart.columns)) {
    return "";
  }
  const headers = entry.chart.columns.map(formatCsvField).join(",");
  const rows = (entry.chart.rows || [])
    .map((row) => (Array.isArray(row) ? row.map(formatCsvField).join(",") : ""))
    .join("\n");
  return `${headers}\n${rows}`;
}

export function exportHistoryAsMarkdown(entry) {
  if (!entry) return "";
  const lines = [
    `# ${entry.title || "Analysis Export"}`,
    "",
    `- **Type:** ${entry.type || "Analysis"}`,
    `- **Dataset:** ${entry.datasetName || "Uploaded dataset"}`,
    `- **Date:** ${entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "N/A"}`,
    `- **Rows Analyzed:** ${entry.rowCount ?? "N/A"}`,
    "",
  ];

  if (entry.prompt) {
    lines.push("## Query / Prompt", "", entry.prompt, "");
  }

  if (entry.response) {
    lines.push("## Gemini Insights", "", entry.response, "");
  }

  if (entry.chart?.columns?.length) {
    lines.push("## Data Snapshot", "");
    lines.push(`| ${entry.chart.columns.join(" | ")} |`);
    lines.push(`| ${entry.chart.columns.map(() => "---").join(" | ")} |`);
    const previewRows = (entry.chart.rows || []).slice(0, 50);
    previewRows.forEach((row) => {
      lines.push(`| ${row.map((c) => (c === null || c === undefined ? "-" : String(c))).join(" | ")} |`);
    });
    if ((entry.chart.rows?.length || 0) > 50) {
      lines.push("", `*Showing first 50 of ${entry.chart.rows.length} rows.*`);
    }
  }

  return lines.join("\n");
}

export function downloadBlob(content, filename, mimeType = "text/plain;charset=utf-8;") {
  if (typeof window === "undefined" || !window.Blob) return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
