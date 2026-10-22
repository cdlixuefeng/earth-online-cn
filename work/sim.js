// 无头模拟：用页面自己的逻辑跑 N 条人生，统计 45 岁时知识/人情分布和满格连续年数
// 用法：node work/sim.js [N] [mode]   mode: default（重心保持默认）| random（成年后每年随机重心）
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
    get firstElementChild() { return this.children[0] || null; }, get firstChild() { return this.children[0] || null; },
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
global.setTimeout = () => 0; global.clearTimeout = () => {}; global.setInterval = () => 1; global.clearInterval = () => {};
global.getComputedStyle = () => ({ getPropertyValue: () => "" });
global.addEventListener = () => {}; global.innerWidth = 1200; global.innerHeight = 800;
global.Hark = { data: () => ({ features: [] }) };
eval(fs.readFileSync(__dirname + "/../story.js", "utf8"));
let T;
try { eval(main + "\n;T = { tick: () => tick(), get S() { return S; }, birth: () => birth(), focus: () => FOCUS, stage: (a) => fStage(a), unblock: () => { blocked = false; Q = []; } };"); }
catch (e) { console.error("load:", e.message); }
const $ = (id) => document.getElementById(id);
const N = +process.argv[2] || 2000, MODE = process.argv[3] || "default";
const at45 = { uni: { iq: [], rel: [] }, hs: { iq: [], rel: [] }, zk: { iq: [], rel: [] }, all: { iq: [], rel: [] } };
let streakIq = 0, streakRel = 0, reached = 0, sample = null;
for (let L = 0; L < N; L++) {
  try { T.birth(); } catch (e) {}
  $("b-start").onclick();
  $("modal").hidden = true; $("reflect").hidden = true; $("moment").hidden = true;
  let guard = 0, ri = 0, rr = 0, mi = 0, mr = 0; const tr = [];
  while (!T.S.dead && guard++ < 400) {
    if (!$("modal").hidden) { const o = $("m-opts").children; try { o[Math.floor(Math.random() * o.length)].onclick(); } catch (e) { (global.ERRS ||= new Set()).add(e.message); $("modal").hidden = true; T.unblock(); } continue; }
    if (!$("reflect").hidden) { $("r-go").onclick(); continue; }
    if (!$("moment").hidden) { const o = $("mo-opts").children; if (!$("mo-opts").hidden && o.length) o[0].onclick(); else $("mo-go").onclick(); continue; }
    if (MODE === "random") { const k = T.stage(T.S.age + 1); T.S.pick = k ? T.focus()[k][Math.floor(Math.random() * T.focus()[k].length)][0] : "均衡"; }
    T.tick();
    const S = T.S; if (S.dead) break;
    tr.push([S.age, S.iq, S.rel, S.focus]);
    ri = S.iq >= 100 ? ri + 1 : 0; rr = S.rel >= 100 ? rr + 1 : 0; mi = Math.max(mi, ri); mr = Math.max(mr, rr);
    if (S.age === 45) {
      reached++;
      const g = S.edu >= 1.3 ? "uni" : S.uni === "专科" ? "zk" : "hs";
      at45[g].iq.push(S.iq); at45[g].rel.push(S.rel); at45.all.iq.push(S.iq); at45.all.rel.push(S.rel);
    }
  }
  if (tr.some((t) => t[1] >= 95)) global.HI95 = (global.HI95 || 0) + 1;
  if (mi >= 5) streakIq++; if (mr >= 5) streakRel++;
  if (!sample && T.S.age > 80) sample = tr;
}
const pc = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : "-"; };
const row = (n, a) => `${n.padEnd(10)} n=${String(a.length).padEnd(5)} p10 ${pc(a, 0.1)}  p25 ${pc(a, 0.25)}  p50 ${pc(a, 0.5)}  p75 ${pc(a, 0.75)}  p90 ${pc(a, 0.9)}`;
console.log(`lives ${N} (${MODE}), reached 45: ${reached}`);
console.log("知识 @45"); for (const g of ["uni", "zk", "hs", "all"]) console.log("  " + row({ uni: "本科及以上", zk: "专科", hs: "高中及以下", all: "全部" }[g], at45[g].iq));
console.log("人情 @45"); for (const g of ["uni", "zk", "hs", "all"]) console.log("  " + row({ uni: "本科及以上", zk: "专科", hs: "高中及以下", all: "全部" }[g], at45[g].rel));
console.log(`知识=100 连续≥5年: ${((streakIq / N) * 100).toFixed(1)}%   人情=100 连续≥5年: ${((streakRel / N) * 100).toFixed(1)}%   一生中知识曾到 95+: ${(((global.HI95 || 0) / N) * 100).toFixed(1)}%`);
if (process.env.SHOW && sample) console.log(sample.filter((t) => t[0] % 5 === 0).map((t) => t.join(":")).join("  "));
