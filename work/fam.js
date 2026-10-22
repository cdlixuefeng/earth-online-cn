// 家庭背景验证：node work/fam.js [N]
const fs = require("fs");
const html = fs.readFileSync(__dirname + "/../index.html", "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const main = scripts.find((s) => s.includes("function tick()"));
function el(id) {
  const e = {
    id, children: [], hidden: false, textContent: "", value: "", checked: false, dataset: {}, style: { setProperty() {} },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute() {}, removeAttribute() {}, focus() {}, addEventListener() {}, getBoundingClientRect() { return { width: 0, height: 0 }; },
    querySelector() { return this.children[0] || el("q"); }, querySelectorAll() { return []; },
    appendChild(c) { this.children.push(c); return c; }, prepend(c) { this.children.unshift(c); if (this.children.length > 30) this.children.length = 30; },
    scrollTo() {}, remove() {}, cloneNode() { return el("clone"); }, get lastElementChild() { return this.children[this.children.length - 1] || null; },
    get firstElementChild() { return this.children[0] || null; }, get parentNode() { const p = el("parent"); p.children.push(el("lbl")); return p; }, get firstChild() { return this.children[0] || null; },
    set innerHTML(v) { this._h = v; this.children = v ? [el("ul")] : []; }, get innerHTML() { return this._h || ""; },
  };
  return e;
}
const els = {};
global.document = {
  getElementById: (id) => (els[id] ||= el(id)), querySelectorAll: () => [], querySelector: () => el("x"),
  createElement: () => el("c"), documentElement: el("html"), body: el("body"), addEventListener() {},
};
global.window = global; global.matchMedia = () => ({ matches: true, addEventListener() {} });
global.requestAnimationFrame = () => 0; global.cancelAnimationFrame = () => {}; global.scrollTo = () => {};
let clock = 0; global.performance = { now: () => (clock += 1000) };
const timers = []; global.setTimeout = (f) => { timers.push(f); return timers.length; }; global.clearTimeout = () => {}; global.setInterval = () => 1; global.clearInterval = () => {};
global.getComputedStyle = () => ({ getPropertyValue: () => "" });
global.addEventListener = () => {}; global.innerWidth = 1200; global.innerHeight = 800;
global.Hark = { data: () => ({ features: [] }) };
eval(fs.readFileSync(__dirname + "/../letters-pack.js", "utf8") + "\n" + fs.readFileSync(__dirname + "/../story.js", "utf8"));
let T;
eval(main + "\n;T = { tick: () => tick(), get S() { return S; }, birth: () => birth(), unblock: () => { blocked = false; Q = []; }, famDist, FAM_NAT, PROV, weighted, drawFam, famReveal, famStep, die: () => die(), FAM_L };");
const $ = (id) => document.getElementById(id);
const ERR = new Map(), err = (e) => { if (process.env.DEBUG && !ERR.has(e.message)) console.log(e.stack.split("\n").slice(0, 3).join("\n")); ERR.set(e.message, (ERR.get(e.message) || 0) + 1); };

// 1) 出生分布：100 万次只抽出生
const M = 1e6, cnt = Array(8).fill(0), pedC = [0, 0, 0, 0], pedHi = Array(8).fill(0);
for (let i = 0; i < M; i++) {
  const p = T.weighted(), urban = Math.random() * 100 < p.u, s = { p, urban };
  T.drawFam(s); cnt[s.fam]++; pedC[s.parEdu]++; if (s.parEdu >= 2) pedHi[s.fam]++;
}
const pc = (v) => (v * 100).toFixed(2) + "%";
console.log("== 出生档位：抽样 100 万 vs 目标 ==");
const TGT = [null, null, null, null, null, 0.006, 0.0037, 0.0003];
cnt.forEach((c, i) => console.log(T.FAM_L[i].padEnd(6, "　"), pc(c / M), "期望", pc(T.FAM_NAT[i]), TGT[i] ? `胡润目标 ${pc(TGT[i])} 偏差 ${(((c / M) / TGT[i] - 1) * 100).toFixed(1)}%` : ""));
console.log("父母学历：", ["初中及以下", "高中中专", "大专本科", "高知"].map((n, i) => n + " " + pc(pedC[i] / M)).join(" · "), "· 大专+", pc((pedC[2] + pedC[3]) / M));
const hq = [0, 1, 2, 3, 4].map((i) => cnt[i] / M); console.log("五等份(高收入含富裕档)：", hq.map((v, i) => pc(i < 4 ? v : v + cnt[5] / M + cnt[6] / M + cnt[7] / M)).join(" "));

// 2) 3000 条人生
const N = +process.argv[2] || 3000, POL = process.env.POLICY || "random";
// random：每个抉择随机点；smart：中考按成绩分流、高考多选稳妥、富裕档一半出国，其余随机
function pickOpt(o, title, S) {
  const rand = () => o[Math.floor(Math.random() * o.length)], by = (l) => o.find((b) => b._h.startsWith(l)) || rand();
  if (POL !== "smart") return rand();
  if (title.includes("小升初")) return by(S.iq >= 35 ? "考重点" : "就近");
  if (title.includes("中考")) { const r = Math.random(); return S.iq >= 55 ? by("冲重点") : S.iq >= 40 ? by(r < 0.75 ? "读普通中学" : "读职校") : by(r < 0.3 ? "读普通中学" : r < 0.85 ? "读职校" : "打工"); }
  if (title.includes("选择去处")) { const r = Math.random(); return by(r < 0.3 ? "考公" : r < 0.65 ? "去大城市" : r < 0.9 ? "回老家" : "创业"); }
  if (title.includes("高考")) { const r = Math.random(); if (o.length > 3 && r < 0.5) return by("出国留学"); return by(r < 0.75 ? "稳妥" : "冲名校"); }
  return rand();
}
const G = (k) => Math.min(k, 5); // 富裕/高净值/豪门合并为 5 “富裕+”
const GL = ["困难", "偏下", "普通", "中产", "富足", "富裕+"];
const by = () => Array.from({ length: 6 }, () => []);
const lb = by(), ben = by(), inc45 = by(), rows45 = [], nAbroad = [0], heir = [0], drop = [0];
let lives = 0, ends = 0;
for (let L = 0; L < N; L++) {
  try { T.birth(); } catch (e) { if (!/classList/.test(e.message)) err(e); } // 地图在无头环境里没有路径：hop 报错前 S 已抽好
  try { T.famReveal(); } catch (e) { err(e); }
  $("b-start").onclick();
  $("modal").hidden = true; $("reflect").hidden = true; $("moment").hidden = true;
  let guard = 0; const S0 = T.S; let at45 = null, bk = 0, lastA = -1; const avg = [];
  while (!T.S.dead && guard++ < 400) {
    try {
      if (!$("modal").hidden) { const o = $("m-opts").children; pickOpt(o, $("m-title").textContent, T.S).onclick(); continue; }
      if (!$("reflect").hidden) { $("r-go").onclick(); continue; }
      if (!$("moment").hidden) { const o = $("mo-opts").children; if (!$("mo-opts").hidden && o.length) o[0].onclick(); else $("mo-go").onclick(); continue; }
      T.tick();
    } catch (e) { err(e); $("modal").hidden = true; $("moment").hidden = true; T.unblock(); }
    const S = T.S;
    if (S.age === 23 && !bk) bk = 1;
    if (S.age >= 43 && S.age <= 47 && !S.dead && S.age !== lastA) { lastA = S.age; avg.push(S.yinc); }
    if (S.age === 45 && !S.dead && !at45) at45 = { inc: S.yinc, g: G(S.fam0), q: Math.min(4, S.fam0), famInc: S.famInc, sit: S.sit + (S.urban ? "U" : "R") };
    if (S.age === 47 && at45 && at45.avg == null) at45.avg = avg.reduce((a, b) => a + b, 0) / avg.length;
  }
  lives++; const S = T.S, g = G(S.fam0);
  lb[g].push(S.F && S.F.lb ? 1 : 0);
  if (S.age >= 23) ben[g].push((S.tierK || 0) >= 3 ? 1 : 0);
  if (at45) { inc45[g].push(at45.inc); rows45.push(at45); }
  if (S.abroad) nAbroad[0]++; if (S.heir) heir[0]++; if (S.fam < S.fam0) drop[0]++;
  // 结局屏也跑一遍
  timers.length = 0; try { T.die(); timers.forEach((f) => f()); ends++; } catch (e) { err(e); }
  timers.length = 0;
}
const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN);
const med = (a) => { if (!a.length) return NaN; const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
console.log(`\n== ${lives} 条人生 · 错误 ${[...ERR.values()].reduce((s, v) => s + v, 0)} ==`);
ERR.forEach((v, k) => console.log("  ERR", v, k));
console.log("档位      人数   留守率   本科+   45岁年收入中位(万)");
GL.forEach((n, i) => console.log(n.padEnd(4, "　"), String(lb[i].length).padStart(6), pc(mean(lb[i])).padStart(8), pc(mean(ben[i])).padStart(8), med(inc45[i]).toFixed(1).padStart(8), `(n45=${inc45[i].length})`));
console.log("全体留守率", pc(mean(lb.flat())), "· 出国留学", nAbroad[0], "· 接班", heir[0], "· 家道中落", drop[0]);
// 流动矩阵：出生五等份 × 45 岁收入五等份
const sorted = rows45.map((r) => r.inc).sort((a, b) => a - b), cut = [0.2, 0.4, 0.6, 0.8].map((q) => sorted[Math.floor(q * sorted.length)]);
const qOf = (v) => cut.filter((c) => v >= c).length;
const MX = Array.from({ length: 5 }, () => Array(5).fill(0));
rows45.forEach((r) => MX[r.q][qOf(r.inc)]++);
console.log("\n== 流动矩阵（行：出生五等份；列：45 岁收入五等份；行内 %）==");
console.log("        Q1    Q2    Q3    Q4    Q5");
MX.forEach((row, i) => { const s = row.reduce((a, b) => a + b, 0); console.log(["低收入", "偏下  ", "中间  ", "偏上  ", "高收入"][i], row.map((v) => ((v / s) * 100).toFixed(0).padStart(5)).join(" "), ` n=${s}`); });
// 代际收入弹性：log(45 岁收入) 对 log(家庭人均收入) 回归（收入 > 0，非富裕档）
const ige = (k, f = () => true) => {
  const xy = rows45.filter((r) => r[k] > 0.5 && r.famInc > 0 && f(r)).map((r) => [Math.log(r.famInc), Math.log(r[k])]);
  const mx = mean(xy.map((v) => v[0])), my = mean(xy.map((v) => v[1]));
  return [xy.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0) / xy.reduce((s, [x]) => s + (x - mx) ** 2, 0), xy.length];
};
const [b1, n1] = ige("inc"), [b2, n2] = ige("avg");
console.log(`代际收入弹性（log-log，对家庭人均收入）：45 岁单年 ≈ ${b1.toFixed(2)} (n=${n1}) · 43–47 岁平均 ≈ ${b2.toFixed(2)} (n=${n2})`);
const [b3, n3] = ige("avg", (r) => !/^boss/.test(r.sit)); console.log(`  不含创业者 ≈ ${b3.toFixed(2)} (n=${n3})`);
if (process.env.SIT) { const sits = [...new Set(rows45.map((r) => r.sit))]; sits.forEach((s) => { const a = rows45.filter((r) => r.sit === s); console.log(s.padEnd(7), "n", a.length, "中位", med(a.map((r) => r.inc)).toFixed(1), "按出生五等份占比", [0, 1, 2, 3, 4].map((q) => pc(a.filter((r) => r.q === q).length / rows45.filter((r) => r.q === q).length)).join(" ")); }); }
// 秩-秩斜率：父母（档位 + 人均收入）百分位 vs 子女 43–47 岁平均收入百分位
{
  const rr = rows45.filter((r) => r.avg != null), rk = (arr) => { const o = arr.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]); const out = Array(arr.length); o.forEach(([, i], j) => (out[i] = j / (arr.length - 1))); return out; };
  const px = rk(rr.map((r) => r.q * 1e6 + (r.famInc || 2e5))), cy = rk(rr.map((r) => r.avg + Math.random() * 1e-6));
  const mx = mean(px), my = mean(cy), sl = px.reduce((s, x, i) => s + (x - mx) * (cy[i] - my), 0) / px.reduce((s, x) => s + (x - mx) ** 2, 0);
  console.log("秩-秩斜率（43–47 岁平均）≈", sl.toFixed(2));
}
// 与 45 岁同五等份的比例（对角线）
console.log("对角线合计：", pc(MX.reduce((s, r, i) => s + r[i], 0) / rows45.length), "（完全随机为 20%）");
