// All arithmetic lives here (not in the AI). Used by the browser AND the server.
// Formulas follow skill/SKILL.md exactly.
(function (root) {
  const FIELDS = [
    { k: "revenue", label: "Revenue", g: "Income Statement", nn: 1 },
    { k: "opex", label: "Operating expenses", g: "Income Statement", nn: 1 },
    { k: "opProfit", label: "Operating profit", g: "Income Statement" },
    { k: "pbt", label: "Profit before tax", g: "Income Statement" },
    { k: "tax", label: "Tax expense", g: "Income Statement" },
    { k: "netProfit", label: "Net profit", g: "Income Statement" },
    { k: "currentAssets", label: "Current assets", g: "Balance Sheet", nn: 1 },
    { k: "currentLiabilities", label: "Current liabilities", g: "Balance Sheet", nn: 1 },
    { k: "totalAssets", label: "Total assets", g: "Balance Sheet", nn: 1 },
    { k: "totalLiabilities", label: "Total liabilities", g: "Balance Sheet", nn: 1 },
    { k: "equity", label: "Shareholders' equity", g: "Balance Sheet" },
    { k: "debt", label: "Total debt", g: "Balance Sheet", nn: 1 },
    { k: "cash", label: "Cash and cash equivalents", g: "Balance Sheet", nn: 1 },
    { k: "cfo", label: "Cash flow from operating activities", g: "Cash Flow" },
    { k: "cfi", label: "Cash flow from investing activities", g: "Cash Flow" },
    { k: "cff", label: "Cash flow from financing activities", g: "Cash Flow" },
  ];

  const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  const has = (v) => v !== null && v !== undefined;

  // Turns "10,00,000" or " 5 " into a number; blank -> null; junk -> NaN
  function parse(v) {
    if (v === null || v === undefined) return null;
    const s = String(v).replace(/[,\s]/g, "");
    if (s === "") return null;
    return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
  }

  function validate(inp) {
    if (!inp || typeof inp !== "object" || !inp.cur || !inp.prev) return "Missing figures.";
    let count = 0;
    for (const p of ["prev", "cur"]) {
      for (const f of FIELDS) {
        const v = parse(inp[p][f.k]);
        if (Number.isNaN(v)) return f.label + " (" + (p === "cur" ? "current" : "previous") + ") must be a number.";
        if (v !== null) {
          count++;
          if (f.nn && v < 0) return f.label + " (" + (p === "cur" ? "current" : "previous") + ") cannot be negative.";
        }
      }
    }
    return count === 0 ? "Enter at least one figure." : null;
  }

  // Percentage Change = (Current - Previous) / Previous x 100
  function change(c, p) {
    if (!has(c) || !has(p)) return { v: null, why: "Needs both periods" };
    if (p === 0) return { v: null, why: "Not defined (previous value is zero)" };
    return { v: r2(((c - p) / p) * 100) };
  }

  function ratio(num, den, mult, needs) {
    if (!has(num) || !has(den)) return { v: null, why: "Missing: " + needs };
    if (den === 0) return { v: null, why: "Not calculated (denominator is zero)" };
    return { v: r2((num / den) * mult) };
  }

  function analyse(inp, threshold) {
    threshold = Number.isFinite(Number(threshold)) ? Number(threshold) : 10;
    const P = {}, C = {};
    FIELDS.forEach((f) => { P[f.k] = parse(inp.prev[f.k]); C[f.k] = parse(inp.cur[f.k]); });

    const items = FIELDS.filter((f) => has(P[f.k]) || has(C[f.k])).map((f) => {
      const ch = change(C[f.k], P[f.k]);
      return {
        key: f.k, group: f.g, label: f.label, prev: P[f.k], cur: C[f.k],
        diff: has(P[f.k]) && has(C[f.k]) ? r2(C[f.k] - P[f.k]) : null,
        pct: ch.v, pctNote: ch.why || null,
        significant: ch.v !== null && Math.abs(ch.v) > threshold,
      };
    });

    const defs = [
      { cat: "Profitability", name: "Operating Profit Margin (%)", formula: "Operating Profit / Revenue x 100", n: "opProfit", d: "revenue", m: 100, needs: "operating profit, revenue" },
      { cat: "Profitability", name: "Net Profit Margin (%)", formula: "Net Profit / Revenue x 100", n: "netProfit", d: "revenue", m: 100, needs: "net profit, revenue" },
      { cat: "Profitability", name: "Return on Equity (%)", formula: "Net Profit / Shareholders' Equity x 100", n: "netProfit", d: "equity", m: 100, needs: "net profit, equity" },
      { cat: "Liquidity", name: "Current Ratio", formula: "Current Assets / Current Liabilities", n: "currentAssets", d: "currentLiabilities", m: 1, needs: "current assets, current liabilities" },
      { cat: "Solvency", name: "Debt-to-Equity Ratio", formula: "Total Debt / Shareholders' Equity", n: "debt", d: "equity", m: 1, needs: "total debt, equity" },
    ];
    const ratios = defs.map((x) => {
      const prev = ratio(P[x.n], P[x.d], x.m, x.needs);
      const cur = ratio(C[x.n], C[x.d], x.m, x.needs);
      const note = (C[x.d] < 0 || P[x.d] < 0) && x.d === "equity" ? "Equity is negative; interpret with care." : null;
      return { cat: x.cat, name: x.name, formula: x.formula, prev, cur, note };
    });

    // Growth figures named in the skill
    const growth = [
      { name: "Revenue Growth %", formula: "(Current Revenue - Previous Revenue) / Previous Revenue x 100", ...change(C.revenue, P.revenue) },
      { name: "Net Profit Growth %", formula: "(Current Net Profit - Previous Net Profit) / Previous Net Profit x 100", ...change(C.netProfit, P.netProfit) },
    ].map((g) => ({ ...g, note: g.name.startsWith("Net") && P.netProfit < 0 ? "Previous net profit is negative; the % is hard to interpret." : null }));

    // Cash flow: generated or used, nothing assumed good/bad
    const cashflow = ["cfo", "cfi", "cff"].map((k) => {
      const f = FIELDS.find((x) => x.k === k);
      const say = (v) => (!has(v) ? "Not provided" : v > 0 ? "Generated cash" : v < 0 ? "Used cash" : "No net cash flow");
      return { label: f.label, prev: P[k], cur: C[k], prevSays: say(P[k]), curSays: say(C[k]) };
    });
    const net = (S) => (has(S.cfo) && has(S.cfi) && has(S.cff) ? r2(S.cfo + S.cfi + S.cff) : null);

    const missing = FIELDS.filter((f) => !has(C[f.k])).map((f) => f.label);
    return { threshold, items, growth, ratios, cashflow, netChangeInCash: { prev: net(P), cur: net(C) }, missingCurrent: missing };
  }

  const api = { FIELDS, parse, validate, analyse };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FSA = api;
})(typeof window !== "undefined" ? window : this);
