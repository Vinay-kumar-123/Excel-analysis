export function buildGeminiPrompt(data, query, datasetInfo = {}) {
  const promptText = typeof query === "string" && query.trim()
    ? query.trim()
    : "Summarize the key findings in this spreadsheet.";
  const header = Array.isArray(data) ? data[0] : null;
  const rowCount = Array.isArray(data) ? Math.max(0, data.length - 1) : "unknown";
  const context = [
    `The first row contains the column headers${header ? `: ${JSON.stringify(header)}` : "."}`,
    `The provided sample contains ${rowCount} data rows.`,
    Number.isFinite(datasetInfo.totalRows) ? `The full worksheet contains ${datasetInfo.totalRows} data rows.` : "",
    datasetInfo.truncated ? "This is only a sample, so do not claim calculations cover the entire worksheet." : "",
    "Use only values present in the supplied data. Never invent values or trends. If the sample cannot answer the question, state what is missing.",
    "Answer the user's question directly in clear, concise Markdown. Show calculation steps for requested totals or comparisons and retain the source column names.",
  ].filter(Boolean).join("\n");
  const serializedData = typeof data === "string" ? data : JSON.stringify(data);
  return `${context}\n\nUser question:\n${promptText}\n\nSpreadsheet data:\n${serializedData}`;
}
