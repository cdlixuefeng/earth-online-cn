// 验证"每 100,000"口径：出生卡 odds() + 家庭卡 famReveal() 渲染抽查
const fs = require("fs");
const html = fs.readFileSync(__dirname + "/../index.html", "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const main = scripts.find((s) => s.includes("function tick()"));
function el(id) {
  const e = {
    id, children: [], textContent: "", dataset: {}, style: { setProperty() {} },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute() {}, removeAttribute() {}, focus() {}, addEventListener() {},
    getBoundingClientRect() { return { width: 0, height: 0 }; },
    querySelector() { return this.children[0] || el("q"); }, querySelectorAll() { return []; },
    appendChild(c) { this.children.push(c); return c; }, prepend(c) { this.children.unshift(c); if (this.children.length > 30) this.children.length = 30; },
    scrollTo() {}, remove() {}, cloneNode() { return el("clone"); },
    get lastElementChild() { return this.children[this.children.length - 1] || null; },
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
eval(main + "\n;T = { odds, birthCells, famDist, famReveal, birth: () => birth(), PROV, weighted: () => weighted(), get S() { return S; } };");
const out = [];
const HB = T.PROV.find((p) => p.n === "湖北");
out.push("== 出生卡（湖北 · 城镇男孩）==");
out.push(T.odds(HB, true, true).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
out.push("== 四格（湖北，每 100,000）==");
out.push(T.birthCells(HB).map((c) => (c[0] ? "城镇" : "农村") + (c[1] ? "男" : "女") + " " + (c[2] * 1e5).toFixed(0) + "/10万").join(" · "));
// 家庭卡：循环出生直到抽到巨富(8)/顶级(9)，读 f-odds
let got = {};
for (let i = 0; i < 200000; i++) {
  try { T.birth(); } catch (e) {}
  if (T.S.fam >= 7 && !got[T.S.fam]) {
    T.famReveal();
    got[T.S.fam] = (els["f-odds"] || {})._h || "?";
    if (Object.keys(got).length >= 3) break;
  }
}
out.push("== 家庭卡 odds 显示（每 100,000）==");
for (const [f, h] of Object.entries(got)) {
  out.push("L" + (+f + 1) + ": " + h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}
fs.writeFileSync(__dirname + "/../_p10w_check_out.txt", out.join("\n"), "utf8");
console.log("done");
