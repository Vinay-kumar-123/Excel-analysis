import test from "node:test";
import assert from "node:assert/strict";
import {
  parseInlineMarkdown,
  parseMarkdownBlocks,
  parseRowDetails,
  extractNumericalClaims,
  validateClaimsAgainstDataset,
  formatReportForCopy,
  formatReportForExport,
  stripMarkdownMarkers,
  formatReportDate,
} from "../lib/geminiReport.mjs";

test("parseInlineMarkdown tokenizes bold, italic, code, and plain text safely", () => {
  const text = "The **Units_Sold** reached a peak of `154500` and *stabilized*.";
  const tokens = parseInlineMarkdown(text);

  assert.equal(tokens.length, 7);
  assert.equal(tokens[0].type, "text");
  assert.equal(tokens[0].content, "The ");
  assert.equal(tokens[1].type, "bold");
  assert.equal(tokens[1].content, "Units_Sold");
  assert.equal(tokens[2].type, "text");
  assert.equal(tokens[2].content, " reached a peak of ");
  assert.equal(tokens[3].type, "code");
  assert.equal(tokens[3].content, "154500");
  assert.equal(tokens[4].type, "text");
  assert.equal(tokens[4].content, " and ");
  assert.equal(tokens[5].type, "italic");
  assert.equal(tokens[5].content, "stabilized");
  assert.equal(tokens[6].type, "text");
  assert.equal(tokens[6].content, ".");
});

test("parseMarkdownBlocks parses headings, tables, bullet lists, ordered lists, and paragraphs", () => {
  const md = `# Executive Report
## Maximum Findings
* **Units_Sold**: 450
* **Unit_Price_INR**: 1200

1. First priority
2. Second priority

| Metric | Value |
| --- | --- |
| Revenue | 154500 |

Here is a concluding paragraph with **bold metrics**.`;

  const blocks = parseMarkdownBlocks(md);
  assert.equal(blocks[0].type, "heading");
  assert.equal(blocks[0].level, 1);
  assert.equal(blocks[0].text, "Executive Report");

  assert.equal(blocks[1].type, "heading");
  assert.equal(blocks[1].level, 2);
  assert.equal(blocks[1].text, "Maximum Findings");

  assert.equal(blocks[2].type, "unordered_list");
  assert.equal(blocks[2].items.length, 2);
  assert.equal(blocks[2].items[0], "**Units_Sold**: 450");

  assert.equal(blocks[3].type, "ordered_list");
  assert.equal(blocks[3].items.length, 2);

  assert.equal(blocks[4].type, "table");
  assert.deepEqual(blocks[4].headers, ["Metric", "Value"]);
  assert.deepEqual(blocks[4].rows, [["Revenue", "154500"]]);

  assert.equal(blocks[5].type, "paragraph");
  assert.match(blocks[5].text, /Here is a concluding paragraph/);
});

test("extractNumericalClaims captures maximums with format **Maximum Column (Value)**", () => {
  const md = `
### Maximum Values
* **Maximum Revenue_INR (154500)**: Found on Date: 2026-03-15, Region: North, Units_Sold: 300, Unit_Price_INR: 515.
* **Maximum Units_Sold (450)**: Found on Date: 2026-02-10, Region: West, Product: Alpha.
* **Maximum Unit_Price_INR (1200)**: Found on Date: 2026-01-22, Region: South.
`;

  const claims = extractNumericalClaims(md);
  assert.equal(claims.length, 3);
  assert.equal(claims[0].column, "Revenue_INR");
  assert.equal(claims[0].claimedValue, 154500);
  assert.equal(claims[1].column, "Units_Sold");
  assert.equal(claims[1].claimedValue, 450);
  assert.equal(claims[2].column, "Unit_Price_INR");
  assert.equal(claims[2].claimedValue, 1200);
});

test("extractNumericalClaims captures maximums with format **Column**: Maximum value is ...", () => {
  const md = `
1. **Revenue_INR**: Maximum value is 154,500 with Date: 2026-03-15
2. **Units_Sold**: Maximum value is 450 with Region: West
`;

  const claims = extractNumericalClaims(md);
  assert.equal(claims.length, 2);
  assert.equal(claims[0].column, "Revenue_INR");
  assert.equal(claims[0].claimedValue, 154500);
  assert.equal(claims[1].column, "Units_Sold");
  assert.equal(claims[1].claimedValue, 450);
});

test("validateClaimsAgainstDataset marks matching values as verified with source row details", () => {
  const dataset = [
    ["Date", "Region", "Units_Sold", "Unit_Price_INR", "Revenue_INR"],
    ["2026-01-10", "South", 100, 500, 50000],
    ["2026-02-10", "West", 450, 200, 90000],
    ["2026-03-15", "North", 300, 515, 154500],
  ];

  const claims = [
    { column: "Revenue_INR", claimedValue: 154500, rawClaimedValue: "154500", details: [] },
    { column: "Units_Sold", claimedValue: 450, rawClaimedValue: "450", details: [] },
    { column: "Unit_Price_INR", claimedValue: 9999, rawClaimedValue: "9999", details: [] }, // False/discrepant claim
  ];

  const validated = validateClaimsAgainstDataset(claims, dataset);
  assert.equal(validated.length, 3);

  // Revenue_INR matches
  assert.equal(validated[0].status, "verified");
  assert.equal(validated[0].isVerified, true);
  assert.match(validated[0].verificationBadge, /Verified against dataset/);

  // Units_Sold matches
  assert.equal(validated[1].status, "verified");
  assert.equal(validated[1].isVerified, true);

  // Unit_Price_INR discrepancy
  assert.equal(validated[2].status, "discrepancy");
  assert.equal(validated[2].isVerified, false);
  assert.match(validated[2].verificationBadge, /AI Reported/);
  assert.equal(validated[2].actualMax, 515);
});

test("validateClaimsAgainstDataset marks claims as unverified when dataset is missing", () => {
  const claims = [{ column: "Revenue_INR", claimedValue: 154500, rawClaimedValue: "154500", details: [] }];
  const validated = validateClaimsAgainstDataset(claims, []);
  assert.equal(validated.length, 1);
  assert.equal(validated[0].status, "unverified");
  assert.equal(validated[0].isVerified, false);
  assert.equal(validated[0].verificationBadge, "AI Reported");
});

test("parseRowDetails formats date and key-value fields cleanly", () => {
  const raw = "Found on Date: 2026-03-15, Region: North, Units_Sold: 300";
  const fields = parseRowDetails(raw);
  assert.equal(fields.length, 3);
  assert.equal(fields[0].key, "Date");
  assert.match(fields[0].value, /Mar 15, 2026|2026/);
  assert.equal(fields[1].key, "Region");
  assert.equal(fields[1].value, "North");
});

test("formatReportForCopy produces clean text without raw markdown asterisks or code ticks", () => {
  const md = "### Section 1\n* **Units_Sold** peak is `450`.\n\nSummary paragraph.";
  const text = formatReportForCopy(md, [], { fileName: "Sales.xlsx" });
  assert.equal(text.includes("**"), false);
  assert.equal(text.includes("`"), false);
  assert.match(text, /SECTION 1/);
  assert.match(text, /Units_Sold peak is 450/);
});

test("formatReportForExport produces clean markdown report with structured table", () => {
  const md = "Here are the top findings.";
  const validated = [
    {
      column: "Revenue_INR",
      claimedValue: 154500,
      rawClaimedValue: "154500",
      verificationBadge: "Verified against dataset",
      details: [{ key: "Date", value: "Mar 15, 2026" }],
    },
  ];

  const exportText = formatReportForExport(md, validated, { fileName: "Sales.xlsx", date: "Oct 28, 2026" });
  assert.match(exportText, /# Gemini Intelligence Report/);
  assert.match(exportText, /\| Column \| Maximum Value \| Verification Status \| Row Details \|/);
  assert.match(exportText, /154,500/);
  assert.match(exportText, /Verified against dataset/);
});

test("stripMarkdownMarkers strips bold, italic, code, and strikethrough", () => {
  const res = stripMarkdownMarkers("**Bold** and *Italic* and `Code`");
  assert.equal(res, "Bold and Italic and Code");
});
