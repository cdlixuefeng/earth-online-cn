// 验证 drawFam 修复：真实跑改后的 index.html 抽签，统计 L1（很困难）家庭的 famInc 分布
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
global.performance = { now: () => 0 };
global.setTimeout = () => 0; global.clearTimeout = () => {}; global.setInterval = () => 1; global.clearInterval = () => {};
global.getComputedStyle = () => ({ getPropertyValue: () => "" });
global.addEventListener = () => {}; global.innerWidth = 1200; global.innerHeight = 800;
global.Hark = { data: () => ({ features: [] }) };
eval(main + "\n;T = { birth: () => birth(), drawFam: (s) => drawFam(s), weighted: () => weighted(), get S() { return S; } };");
const N = 400000;
const l1 = [];
for (let i = 0; i < N; i++) {
  try { T.birth(); } catch (e) {}
  if (T.S.fam === 0) l1.push(T.S.famInc);
}
l1.sort((a, b) => a - b);
const p = (q) => l1[Math.min(l1.length - 1, Math.floor(q * l1.length))];
const out = [];
out.push("lives " + N + " · L1 样本 " + l1.length + " (" + ((l1.length / N) * 100).toFixed(1) + "%)");
out.push("L1 famInc（人均年，元）：min " + l1[0] + " · p5 " + p(0.05) + " · p25 " + p(0.25) + " · p50 " + p(0.5) + " · p75 " + p(0.75) + " · p95 " + p(0.95) + " · max " + l1[l1.length - 1]);
out.push("对应家庭月收入（×2.8/12）：min " + (l1[0] * 2.8 / 12).toFixed(0) + " · p50 " + (p(0.5) * 2.8 / 12).toFixed(0) + " · max " + (l1[l1.length - 1] * 2.8 / 12).toFixed(0));
out.push("L1 中有人均年 <5000 吗：" + (l1[0] < 5000) + " · 家庭月显示会成 0 元吗：" + (l1[0] * 2.8 / 12 < 50));
fs.writeFileSync(__dirname + "/../_l1_check_out.txt", out.join("\n"), "utf8");
console.log("done");
