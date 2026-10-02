// Run: node test.js   (checks the maths against the worked example in SKILL.md)
const assert = require("assert");
const { analyse } = require("./analysis.js");
const a = analyse({
  prev: { revenue: "1000000", opProfit: "200000", netProfit: "150000" },
  cur: { revenue: "1200000", opProfit: "240000", netProfit: "180000", currentAssets: "600000", currentLiabilities: "300000", equity: "500000", debt: "200000" },
});
const r = (n) => a.ratios.find((x) => x.name.startsWith(n)).cur.v;
assert.strictEqual(a.growth[0].v, 20);
assert.strictEqual(a.growth[1].v, 20);
assert.strictEqual(r("Net Profit Margin"), 15);
assert.strictEqual(r("Current Ratio"), 2);
assert.strictEqual(r("Debt-to-Equity"), 0.4);
assert.strictEqual(analyse({ prev: { revenue: "0" }, cur: { revenue: "5" } }).growth[0].v, null);
console.log("All tests passed");
