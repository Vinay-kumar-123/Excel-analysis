/**
 * Safe, zero-dependency Markdown parser, AI metrics validator, and report formatter.
 */

/**
 * Sanitize plain text to prevent injection when rendering text nodes
 */
export function sanitizeText(text) {
  if (text === null || text === undefined) return "";
  return String(text);
}

/**
 * Parse an inline markdown string into an array of styled tokens.
 * Handles: bold (** or __), italic (* or _), code (`), strikethrough (~~), and plain text.
 */
export function parseInlineMarkdown(text) {
  if (!text) return [];
  const str = String(text);
  const tokens = [];

  // Regex matching inline tokens in order of precedence:
  // 1. Inline code: `code`
  // 2. Bold italic: ***text*** or ___text___
  // 3. Bold: **text** or __text__
  // 4. Italic: *text* or _text_
  // 5. Strikethrough: ~~text~~
  const regex = /(`([^`]+)`)|\*\*\*([^*]+)\*\*\*|___([^_]+)___|\*\*([^*]+)\*\*|__([^_]+)__|(?<!\w)\*([^*]+)\*(?!\w)|(?<!\w)_([^_]+)_(?!\w)|~~([^~]+)~~/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: "text",
        content: str.slice(lastIndex, match.index),
      });
    }

    if (match[1] !== undefined) {
      // Inline code
      tokens.push({ type: "code", content: match[2] });
    } else if (match[3] !== undefined || match[4] !== undefined) {
      // Bold + Italic
      tokens.push({ type: "bold_italic", content: match[3] ?? match[4] });
    } else if (match[5] !== undefined || match[6] !== undefined) {
      // Bold
      tokens.push({ type: "bold", content: match[5] ?? match[6] });
    } else if (match[7] !== undefined || match[8] !== undefined) {
      // Italic
      tokens.push({ type: "italic", content: match[7] ?? match[8] });
    } else if (match[9] !== undefined) {
      // Strikethrough
      tokens.push({ type: "strikethrough", content: match[9] });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    tokens.push({
      type: "text",
      content: str.slice(lastIndex),
    });
  }

  return tokens;
}

/**
 * Parse markdown blocks: Headings, Tables, Lists, Code blocks, Dividers, Paragraphs.
 */
export function parseMarkdownBlocks(markdown) {
  if (!markdown || typeof markdown !== "string") return [];
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // 1. Skip completely empty lines
    if (!line) {
      i++;
      continue;
    }

    // 2. Fenced Code Block: ```lang ... ```
    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // Consume closing ```
      blocks.push({
        type: "code_block",
        language: language || "text",
        content: codeLines.join("\n"),
      });
      continue;
    }

    // 3. Headings: #, ##, ###, ####, #####, ######
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // 4. Horizontal Rule / Divider: --- or *** or ___
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(line)) {
      blocks.push({ type: "divider" });
      i++;
      continue;
    }

    // 5. Blockquote: > text
    if (line.startsWith(">")) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({
        type: "blockquote",
        text: quoteLines.join("\n"),
      });
      continue;
    }

    // 6. Markdown Table: Starts with | and has a subsequent separator row |-+-|
    if (line.startsWith("|") && line.endsWith("|")) {
      const tableLines = [];
      let tempIndex = i;
      while (tempIndex < lines.length && lines[tempIndex].trim().startsWith("|") && lines[tempIndex].trim().endsWith("|")) {
        tableLines.push(lines[tempIndex].trim());
        tempIndex++;
      }

      // Check if second row is a separator row like | --- | --- |
      if (tableLines.length >= 2 && /^\|(\s*:?-+:?\s*\|)+$/.test(tableLines[1])) {
        const parseRow = (row) =>
          row
            .slice(1, -1)
            .split("|")
            .map((cell) => cell.trim());

        const headers = parseRow(tableLines[0]);
        const rows = tableLines.slice(2).map(parseRow);

        blocks.push({
          type: "table",
          headers,
          rows,
        });
        i = tempIndex;
        continue;
      }
    }

    // 7. Unordered List: - item, * item, + item
    if (/^[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*+]\s+/, ""));
        i++;
      }
      blocks.push({
        type: "unordered_list",
        items,
      });
      continue;
    }

    // 8. Ordered List: 1. item, 2. item
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({
        type: "ordered_list",
        items,
      });
      continue;
    }

    // 9. Standard Paragraph (accumulate consecutive non-empty lines until block break)
    const paraLines = [rawLine];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith(">") &&
      !/^[-*+]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !(lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) &&
      !/^(\-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    blocks.push({
      type: "paragraph",
      text: paraLines.join(" "),
    });
  }

  return blocks;
}

/**
 * Format any date or timestamp string into the application's clean date convention (e.g. "Oct 28, 2026").
 */
export function formatReportDate(val) {
  if (!val) return "";
  const str = String(val).trim();
  // If it's already an ISO or standard date like 2026-03-15
  const parsed = Date.parse(str);
  if (!isNaN(parsed) && /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(str)) {
    const d = new Date(parsed);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return str;
}

/**
 * Parse row details string into structured key-value pairs.
 * Example input: "Date: 2026-03-15, Region: North, Units_Sold: 300, Unit_Price_INR: 515"
 * Returns: [{ key: "Date", value: "Mar 15, 2026" }, { key: "Region", value: "North" }, ...]
 */
export function parseRowDetails(rawDetails) {
  if (!rawDetails || typeof rawDetails !== "string") return [];
  const cleaned = rawDetails
    .replace(/^(Found in|Found on|Occurred on|At row|Row \d+:|With|For|Details:)\s+/i, "")
    .trim();

  // Try splitting by commas or semicolons
  const parts = cleaned.split(/[,;]\s*/);
  const fields = [];

  for (const part of parts) {
    const colonIdx = part.indexOf(":");
    if (colonIdx > 0) {
      const key = part.slice(0, colonIdx).replace(/\*\*/g, "").trim();
      const rawVal = part.slice(colonIdx + 1).replace(/\*\*/g, "").trim();
      const val = /\bdate\b/i.test(key) ? formatReportDate(rawVal) : rawVal;
      if (key && val) {
        fields.push({ key, value: val });
      }
    } else if (part.trim()) {
      fields.push({ key: "Detail", value: part.replace(/\*\*/g, "").trim() });
    }
  }

  return fields;
}

/**
 * Extract numerical claims (especially Maximum / Highest values) dynamically from Gemini response.
 * Matches patterns like:
 * - `**Maximum Revenue_INR (154500)**: Found on Date: 2026-03-15, Region: North...`
 * - `* **Units_Sold**: Maximum value is 450 (Date: 2026-02-10, Region: West)`
 * - `Maximum Unit_Price_INR: 1200`
 */
export function extractNumericalClaims(text) {
  if (!text || typeof text !== "string") return [];
  const lines = text.split(/\r?\n/);
  const claims = [];
  const seenColumns = new Set();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Pattern A: **Maximum Column_Name (12345)**: Row details...
    // Also matches: Maximum Column_Name (12345): ...
    const matchA = trimmed.match(
      /(?:^|[-*+\d.]\s+)(?:\*\*)?(?:Maximum|Max|Highest)\s+([A-Za-z0-9_ -]+?)\s*(?:\(([0-9,.]+)\))?(?:\*\*)?[:\s-]+(.*)$/i
    );

    if (matchA) {
      const col = matchA[1].replace(/\*\*/g, "").trim();
      const valStr = matchA[2] ? matchA[2].replace(/,/g, "") : null;
      const rest = matchA[3] || "";

      // Look for value in rest if not inside parentheses
      let numericVal = valStr !== null ? parseFloat(valStr) : NaN;
      if (isNaN(numericVal)) {
        const valMatch = rest.match(/([0-9,.]+)/);
        if (valMatch) numericVal = parseFloat(valMatch[1].replace(/,/g, ""));
      }

      if (col && !seenColumns.has(col.toLowerCase())) {
        seenColumns.add(col.toLowerCase());
        claims.push({
          column: col,
          type: "Maximum",
          claimedValue: isNaN(numericVal) ? null : numericVal,
          rawClaimedValue: valStr || (isNaN(numericVal) ? "" : String(numericVal)),
          rawDetails: rest.trim(),
          details: parseRowDetails(rest),
        });
        continue;
      }
    }

    // Pattern B: **Column_Name**: Maximum value is 12345, Details...
    const matchB = trimmed.match(
      /(?:^|[-*+\d.]\s+)(?:\*\*)?([A-Za-z0-9_ -]+?)(?:\*\*)?[:\s-]+(?:Maximum|Max|Highest)(?:\s+value)?(?:\s+is)?[:\s-]+([0-9,.]+)(.*)$/i
    );

    if (matchB) {
      const col = matchB[1].replace(/\*\*/g, "").trim();
      const valStr = matchB[2].replace(/,/g, "");
      const rest = matchB[3] || "";
      const numericVal = parseFloat(valStr);

      if (col && !seenColumns.has(col.toLowerCase()) && !/^(the|this|a|an|here)$/i.test(col)) {
        seenColumns.add(col.toLowerCase());
        claims.push({
          column: col,
          type: "Maximum",
          claimedValue: isNaN(numericVal) ? null : numericVal,
          rawClaimedValue: valStr,
          rawDetails: rest.trim(),
          details: parseRowDetails(rest),
        });
      }
    }
  }

  return claims;
}

/**
 * Validate extracted claims against the uploaded dataset.
 * Does NOT alter or invent values; checks actual numbers from dataset rows.
 */
export function validateClaimsAgainstDataset(claims, dataset) {
  if (!Array.isArray(claims) || claims.length === 0) return [];
  if (!Array.isArray(dataset) || dataset.length <= 1) {
    // No dataset available for verification; keep values as AI Reported
    return claims.map((c) => ({
      ...c,
      status: "unverified",
      verificationBadge: "AI Reported",
      actualMax: null,
      isVerified: false,
    }));
  }

  const headers = dataset[0] || [];
  const rows = dataset.slice(1);

  return claims.map((claim) => {
    // Match column name against dataset headers (case-insensitive, normalized)
    const normalizedClaimCol = claim.column.toLowerCase().replace(/[\s_-]+/g, "");
    let matchedHeaderIndex = -1;
    let actualHeaderName = claim.column;

    headers.forEach((h, idx) => {
      if (h === undefined || h === null) return;
      const normalizedHeader = String(h).toLowerCase().replace(/[\s_-]+/g, "");
      if (normalizedHeader === normalizedClaimCol) {
        matchedHeaderIndex = idx;
        actualHeaderName = String(h);
      }
    });

    if (matchedHeaderIndex === -1) {
      return {
        ...claim,
        status: "unverified",
        verificationBadge: "AI Reported (Column not in sample)",
        actualMax: null,
        isVerified: false,
      };
    }

    // Compute actual max from dataset column
    let maxVal = -Infinity;
    let maxRow = null;

    for (const row of rows) {
      if (!Array.isArray(row)) continue;
      const rawCell = row[matchedHeaderIndex];
      if (rawCell === null || rawCell === undefined) continue;

      let num = NaN;
      if (typeof rawCell === "number") {
        num = rawCell;
      } else {
        const cleanedStr = String(rawCell).replace(/[^\d.-]/g, "");
        num = parseFloat(cleanedStr);
      }

      if (Number.isFinite(num) && num > maxVal) {
        maxVal = num;
        maxRow = row;
      }
    }

    if (maxVal === -Infinity) {
      return {
        ...claim,
        status: "unverified",
        verificationBadge: "AI Reported (Non-numeric in sample)",
        actualMax: null,
        isVerified: false,
      };
    }

    // Verify claimed value vs actual dataset max
    const tolerance = 0.001;
    const isMatch = claim.claimedValue !== null && Math.abs(claim.claimedValue - maxVal) < tolerance;

    // Build row details from the actual dataset source row
    let verifiedDetails = claim.details;
    if (maxRow) {
      const derived = [];
      headers.forEach((header, idx) => {
        if (idx !== matchedHeaderIndex && maxRow[idx] !== undefined && maxRow[idx] !== null) {
          const key = String(header).trim();
          const rawVal = maxRow[idx];
          const val = /\bdate\b/i.test(key) ? formatReportDate(rawVal) : String(rawVal);
          derived.push({ key, value: val });
        }
      });
      if (derived.length > 0) {
        verifiedDetails = derived;
      }
    }

    return {
      ...claim,
      column: actualHeaderName,
      status: isMatch ? "verified" : "discrepancy",
      verificationBadge: isMatch ? "Verified against dataset" : `AI Reported (Calculated max: ${maxVal.toLocaleString("en-US")})`,
      actualMax: maxVal,
      isVerified: isMatch,
      details: verifiedDetails,
    };
  });
}

/**
 * Format report into clean, readable plain text for clipboard copy (without raw markdown asterisks).
 */
export function formatReportForCopy(markdown, validatedClaims = [], metadata = {}) {
  const parts = [];

  if (metadata.fileName) {
    parts.push(`Excel Analysis Report: ${metadata.fileName}`);
    if (metadata.date) parts.push(`Date: ${metadata.date}`);
    parts.push("--------------------------------------------------");
  }

  // If there are verified/extracted numerical claims, include them as a structured list
  if (Array.isArray(validatedClaims) && validatedClaims.length > 0) {
    parts.push("KEY METRICS & MAXIMUM VALUES:");
    validatedClaims.forEach((c) => {
      const valStr = c.claimedValue !== null ? c.claimedValue.toLocaleString("en-US") : c.rawClaimedValue;
      const statusStr = c.isVerified ? "[Verified against dataset]" : "[AI Reported]";
      parts.push(`- ${c.column}: ${valStr} ${statusStr}`);
      if (c.details && c.details.length > 0) {
        const detailStr = c.details.map((d) => `${d.key}: ${d.value}`).join(" | ");
        parts.push(`  Details: ${detailStr}`);
      }
    });
    parts.push("");
  }

  // Parse markdown into clean text without raw markers
  const blocks = parseMarkdownBlocks(markdown);
  for (const block of blocks) {
    switch (block.type) {
      case "heading":
        parts.push(`\n${block.text.toUpperCase()}\n${"=".repeat(Math.min(block.text.length, 60))}`);
        break;
      case "paragraph":
        parts.push(stripMarkdownMarkers(block.text));
        break;
      case "unordered_list":
        block.items.forEach((item) => {
          parts.push(`• ${stripMarkdownMarkers(item)}`);
        });
        parts.push("");
        break;
      case "ordered_list":
        block.items.forEach((item, idx) => {
          parts.push(`${idx + 1}. ${stripMarkdownMarkers(item)}`);
        });
        parts.push("");
        break;
      case "table":
        if (block.headers?.length) {
          parts.push(block.headers.join(" | "));
          parts.push("-".repeat(40));
          block.rows.forEach((row) => parts.push(row.join(" | ")));
          parts.push("");
        }
        break;
      case "blockquote":
        parts.push(`> ${stripMarkdownMarkers(block.text)}`);
        break;
      case "code_block":
        parts.push(`\n${block.content}\n`);
        break;
      case "divider":
        parts.push("--------------------------------------------------");
        break;
    }
  }

  return parts.join("\n\n").trim();
}

/**
 * Format report into clean Markdown for text file export.
 */
export function formatReportForExport(markdown, validatedClaims = [], metadata = {}) {
  const parts = [];

  parts.push(`# Gemini Intelligence Report`);
  if (metadata.fileName) parts.push(`**Dataset:** ${metadata.fileName}`);
  if (metadata.date) parts.push(`**Generated:** ${metadata.date}`);
  parts.push("");

  if (Array.isArray(validatedClaims) && validatedClaims.length > 0) {
    parts.push(`## Key Numerical Metrics & Maximums\n`);
    parts.push(`| Column | Maximum Value | Verification Status | Row Details |`);
    parts.push(`| --- | --- | --- | --- |`);
    validatedClaims.forEach((c) => {
      const val = c.claimedValue !== null ? c.claimedValue.toLocaleString("en-US") : c.rawClaimedValue;
      const details = (c.details || []).map((d) => `${d.key}: ${d.value}`).join("; ") || c.rawDetails || "-";
      parts.push(`| **${c.column}** | ${val} | ${c.verificationBadge} | ${details} |`);
    });
    parts.push("");
  }

  parts.push(`## Analysis Insights\n`);
  parts.push(markdown);

  return parts.join("\n");
}

/**
 * Strip bold, italic, and code markers from inline text
 */
export function stripMarkdownMarkers(text) {
  if (!text) return "";
  return String(text)
    .replace(/\*\*\*(.*?)\*\*\*/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/~~(.*?)~~/g, "$1");
}
