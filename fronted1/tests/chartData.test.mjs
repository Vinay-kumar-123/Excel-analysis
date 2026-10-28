import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCategoryChart,
  buildNumericPoints,
  buildSurfaceGrid,
  getRecommendedMappings,
  inferColumnTypes,
  parseNumericValue,
} from "../lib/chartData.mjs";

test("infers date, categorical, numeric, boolean, and mixed columns", () => {
  const rows = [
    ["2025-01-02", "North", "1,200", true, "12"],
    ["2025-01-03", "South", "₹ 800", false, "unknown"],
  ];
  const types = inferColumnTypes(["Date", "Region", "Revenue_INR", "Active", "Value"], rows);

  assert.deepEqual(types.map(({ type }) => type), ["date", "categorical", "numeric", "boolean", "mixed"]);
});

test("parses currency and negative values without coercing labels", () => {
  assert.equal(parseNumericValue("₹ 1,234.50"), 1234.5);
  assert.equal(parseNumericValue("(2,000)"), -2000);
  assert.equal(parseNumericValue("Product 12"), null);
  assert.equal(parseNumericValue(""), null);
});

test("groups duplicate categories and sorts date labels chronologically", () => {
  const result = buildCategoryChart(
    [
      ["2025-02-01", "10"],
      ["2025-01-01", "4"],
      ["2025-02-01", "5"],
      ["2025-03-01", "not numeric"],
    ],
    0,
    1
  );

  assert.deepEqual(result.data.labels, ["2025-01-01", "2025-02-01"]);
  assert.deepEqual(result.data.datasets[0].data, [4, 15]);
  assert.match(result.warning, /1 row/);
});

test("aggregates the requested sales measures by category, date, and region", () => {
  const salesRows = [
    ["2025-02-01", "North", "Accessories", 2, "₹ 200"],
    ["2025-01-01", "South", "Furniture", 3, "₹ 350"],
    ["2025-02-01", "North", "Accessories", 4, "₹ 400"],
  ];

  const byCategory = buildCategoryChart(salesRows, 2, 4);
  assert.deepEqual(byCategory.data.labels, ["Accessories", "Furniture"]);
  assert.deepEqual(byCategory.data.datasets[0].data, [600, 350]);

  const byDate = buildCategoryChart(salesRows, 0, 4);
  assert.deepEqual(byDate.data.labels, ["2025-01-01", "2025-02-01"]);
  assert.deepEqual(byDate.data.datasets[0].data, [350, 600]);

  const unitsByRegion = buildCategoryChart(salesRows, 1, 3);
  assert.deepEqual(unitsByRegion.data.labels, ["North", "South"]);
  assert.deepEqual(unitsByRegion.data.datasets[0].data, [6, 3]);
});

test("pie aggregation excludes non-positive values and reports invalid dimensions", () => {
  const result = buildCategoryChart(
    [
      ["A", "10"],
      ["A", "-3"],
      ["B", "0"],
      ["C", "bad"],
    ],
    0,
    1,
    { positiveOnly: true }
  );
  assert.deepEqual(result.data.labels, ["A"]);
  assert.deepEqual(result.data.datasets[0].data, [7]);
  assert.match(result.warning, /non-positive/);

  const empty = buildCategoryChart([["A", "bad"]], 0, 1);
  assert.ok(empty.error);
});

test("mixed date and text values are not silently classified as categories", () => {
  const types = inferColumnTypes(["Value"], [["2025-01-01"], ["unknown"]]);
  assert.equal(types[0].type, "mixed");
});

test("recommends numeric mappings so scatter, bubble, and 3D charts start with valid axes", () => {
  const columns = [
    { colIndex: 0, type: "date" },
    { colIndex: 1, type: "categorical" },
    { colIndex: 2, type: "numeric" },
    { colIndex: 3, type: "numeric" },
    { colIndex: 4, type: "numeric" },
  ];
  assert.deepEqual(getRecommendedMappings(columns, "2D", "Scatter"), { x: 2, y: 3, size: undefined });
  assert.deepEqual(getRecommendedMappings(columns, "2D", "Bubble"), { x: 2, y: 3, size: 4 });
  assert.deepEqual(getRecommendedMappings(columns, "3D", "Scatter3D"), { x: 2, y: 3, z: 4, size: 4 });
  assert.deepEqual(getRecommendedMappings(columns, "3D", "Pie3D"), { x: 0, z: 2 });
  assert.equal(getRecommendedMappings(columns.slice(0, 4), "3D", "Scatter3D"), null);
});

test("numeric point and surface helpers reject missing/non-numeric dimensions", () => {
  const source = [[1, 2, 3], [2, "bad", 4], [2, 3, 6], [3, 2, 9], [3, 3, 12]];
  const result = buildNumericPoints(source, [0, 1, 2]);
  assert.equal(result.points.length, 4);
  assert.equal(result.skipped, 1);

  const surface = buildSurfaceGrid(source, 0, 1, 2);
  assert.deepEqual(surface.xValues, [1, 2, 3]);
  assert.deepEqual(surface.yValues, [2, 3]);
  assert.deepEqual(surface.zMatrix, [[3, null, 9], [null, 6, 12]]);
});

test("surface construction refuses grids too large to render safely", () => {
  const rows = [];
  for (let x = 0; x < 101; x += 1) {
    for (let y = 0; y < 101; y += 1) rows.push([x, y, x + y]);
  }
  const result = buildSurfaceGrid(rows, 0, 1, 2);
  assert.match(result.error, /10,000 grid cells/);
  assert.deepEqual(result.zMatrix, []);
});
