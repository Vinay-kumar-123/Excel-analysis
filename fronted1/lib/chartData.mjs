export function parseNumericValue(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;

  let text = value.trim();
  if (!text) return null;

  const isNegative = /^\(.*\)$/.test(text);
  if (isNegative) text = text.slice(1, -1);
  text = text
    .replace(/^(?:INR|USD|EUR|GBP|JPY)\s*/i, "")
    .replace(/\s*(?:INR|USD|EUR|GBP|JPY)$/i, "")
    .replace(/[₹$€£¥,\s]/g, "")
    .replace(/%$/, "");

  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(text)) return null;
  const number = Number(text) * (isNegative ? -1 : 1);
  return Number.isFinite(number) ? number : null;
}

function parseDateValue(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (typeof value !== "string") return null;

  const text = value.trim();
  const datePattern =
    /^(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})(?:[T\s].*)?$/;
  if (!datePattern.test(text)) return null;
  const date = new Date(text);
  return Number.isFinite(date.getTime()) ? date : null;
}

function isDateHeader(header) {
  return /\b(date|time|timestamp|day|month|year)\b/i.test(header);
}

function dateLabel(value) {
  const date = parseDateValue(value);
  if (!date) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}(?:$|T|\s)/.test(value.trim())) {
    return value.trim().slice(0, 10);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function inferColumnTypes(headers, rows) {
  return headers.map((header, colIndex) => {
    const values = rows
      .map((row) => row?.[colIndex])
      .filter((value) => value !== null && value !== undefined && String(value).trim() !== "");

    if (!values.length) {
      return { colIndex, header, type: "empty", validCount: 0, missingCount: rows.length };
    }

    const booleanCount = values.filter(
      (value) => typeof value === "boolean" || /^(true|false|yes|no)$/i.test(String(value).trim())
    ).length;
    const dateCount = values.filter((value) => parseDateValue(value)).length;
    const numericCount = values.filter((value) => parseNumericValue(value) !== null).length;
    const categoryCount = values.length - booleanCount - dateCount - numericCount;
    const threshold = values.length * 0.8;

    let type = "categorical";
    if (booleanCount >= threshold) type = "boolean";
    else if (dateCount >= threshold && (isDateHeader(header) || dateCount === values.length)) type = "date";
    else if (numericCount >= threshold && dateCount === 0 && booleanCount === 0 && categoryCount === 0) type = "numeric";
    else if ([numericCount, dateCount, booleanCount, categoryCount].filter((count) => count > 0).length > 1) type = "mixed";

    return {
      colIndex,
      header,
      type,
      isNumeric: type === "numeric",
      validCount: values.length,
      missingCount: rows.length - values.length,
    };
  });
}

export function getRecommendedMappings(columnAnalysis, mode, chartType) {
  const numeric = columnAnalysis
    .filter((column) => column.type === "numeric")
    .map((column) => column.colIndex);
  const category = columnAnalysis.find((column) =>
    ["categorical", "date", "boolean"].includes(column.type)
  )?.colIndex;

  if (mode === "2D" && ["Scatter", "Bubble"].includes(chartType)) {
    if (numeric.length < 2) return null;
    return {
      x: numeric[0],
      y: numeric[1],
      size: chartType === "Bubble" ? numeric[2] ?? numeric[1] : undefined,
    };
  }

  if (mode === "3D" && ["Pie3D", "PowerMap"].includes(chartType)) {
    if (category === undefined || !numeric.length) return null;
    return { x: category, z: numeric[0] };
  }

  if (mode === "3D") {
    if (numeric.length < 3) return null;
    return {
      x: numeric[0],
      y: numeric[1],
      z: numeric[2],
      size: numeric[3] ?? numeric[2],
    };
  }
  return null;
}

export function buildCategoryChart(rows, xIndex, yIndex, { positiveOnly = false } = {}) {
  const groups = new Map();
  let skipped = 0;
  let excludedNonPositive = 0;

  rows.forEach((row) => {
    const rawLabel = row?.[xIndex];
    const value = parseNumericValue(row?.[yIndex]);
    if (rawLabel === null || rawLabel === undefined || String(rawLabel).trim() === "" || value === null) {
      skipped += 1;
      return;
    }
    const label = dateLabel(rawLabel) || String(rawLabel).trim();
    groups.set(label, (groups.get(label) || 0) + value);
  });

  const labels = [...groups.keys()].filter((label) => {
    if (!positiveOnly || groups.get(label) > 0) return true;
    excludedNonPositive += 1;
    return false;
  });
  if (labels.length === 0) {
    return {
      data: { labels: [], datasets: [] },
      error: positiveOnly
        ? "No positive numeric values and category labels are available for this pie chart."
        : "No rows contain both a category/date and a valid numeric measure.",
      warning: "",
    };
  }

  if (labels.every((label) => /^\d{4}-\d{2}-\d{2}$/.test(label))) {
    labels.sort((a, b) => a.localeCompare(b));
  }

  const warningParts = [];
  if (skipped) warningParts.push(`${skipped} row(s) with missing labels or invalid measures were excluded.`);
  if (excludedNonPositive) warningParts.push(`${excludedNonPositive} non-positive value(s) were excluded.`);

  return {
    data: {
      labels,
      datasets: [{ label: "Total", data: labels.map((label) => groups.get(label)) }],
    },
    error: "",
    warning: warningParts.join(" "),
  };
}

export function buildNumericPoints(rows, indices) {
  const points = [];
  let skipped = 0;

  rows.forEach((row) => {
    const values = indices.map((index) => parseNumericValue(row?.[index]));
    if (values.some((value) => value === null)) {
      skipped += 1;
      return;
    }
    points.push({ values, label: String(row?.[0] ?? "") });
  });

  return { points, skipped };
}

export function buildSurfaceGrid(rows, xIndex, yIndex, zIndex) {
  const { points, skipped } = buildNumericPoints(rows, [xIndex, yIndex, zIndex]);
  const xValues = [...new Set(points.map(({ values }) => values[0]))].sort((a, b) => a - b);
  const yValues = [...new Set(points.map(({ values }) => values[1]))].sort((a, b) => a - b);

  if (xValues.length < 2 || yValues.length < 2) {
    return { xValues: [], yValues: [], zMatrix: [], error: "A surface needs at least two distinct numeric X and Y values." };
  }
  if (xValues.length * yValues.length > 10000) {
    return { xValues: [], yValues: [], zMatrix: [], error: "This surface would exceed 10,000 grid cells. Choose columns with fewer distinct X and Y values." };
  }

  const valuesByCoordinate = new Map();
  points.forEach(({ values: [x, y, z] }) => {
    const key = `${x}:${y}`;
    const group = valuesByCoordinate.get(key) || [];
    group.push(z);
    valuesByCoordinate.set(key, group);
  });
  const zMatrix = yValues.map((y) =>
    xValues.map((x) => {
      const group = valuesByCoordinate.get(`${x}:${y}`);
      return group ? group.reduce((sum, value) => sum + value, 0) / group.length : null;
    })
  );

  return {
    xValues,
    yValues,
    zMatrix,
    error: points.length < 4 ? "A surface needs at least four valid numeric points." : "",
    skipped,
  };
}
