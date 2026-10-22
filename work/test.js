const fs = require("fs");
const html = fs.readFileSync(__dirname + "/../index.html", "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const main = scripts[scripts.length - 1];
function el(id) {
  const e = {
    id, children: [], hidden: false, textContent: "", value: "", checked: process.env.SOFT === "1", dataset: {}, style: { setProperty() {} },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute() {}, removeAttribute() {}, focus() {}, addEventListener() {},
    querySelector() { return this.children[0] || el("q"); }, querySelectorAll() { return []; },
    appendChild(c) { this.children.push(c); return c; }, prepend(c) { this.children.unshift(c); },
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
global.window = global; global.matchMedia = () => ({ matches: false, addEventListener() {} });
global.requestAnimationFrame = () => 0; global.cancelAnimationFrame = () => {}; global.scrollTo = () => {};
global.performance = { now: () => 0 };
const timers = []; global.setTimeout = (f, ms) => { timers.push([f, ms]); return timers.length; }; global.clearTimeout = () => {};
global.setInterval = () => 1; global.clearInterval = () => {};
global.getComputedStyle = () => ({ getPropertyValue: () => "" });
eval(fs.readFileSync(__dirname + "/../story.js", "utf8"));
eval(main + "\n;globalThis.__t = { tick: () => tick(), get S() { return S; }, yearMs: () => yearMs() };");
const T = globalThis.__t, $ = (id) => document.getElementById(id);
$("modal").hidden = true; $("reflect").hidden = true; $("moment").hidden = true;
let lives = +process.env.N || 50, maxD = 0, stories = 0, ages = [];
for (let L = 0; L < lives; L++) {
  $("b-born").onclick(); $("b-start").onclick();
  let guard = 0;
  while (!T.S.dead && guard++ < 200) {
    if (!$("modal").hidden) { const o = $("m-opts").children; o[Math.floor(Math.random() * o.length)].onclick(); continue; }
    if (!$("reflect").hidden) { $("r-go").onclick(); continue; }
    if (!$("moment").hidden) { globalThis.MOMENTS = (globalThis.MOMENTS || 0) + 1; $("mo-go").onclick(); continue; }
    T.tick(); maxD = Math.max(maxD, T.yearMs());
  }
  stories += T.S.story; ages.push(T.S.age);
  if (L === 0 && process.env.SHOW) { const walk = (e, d) => { if (e.textContent) console.log(e.textContent); e.children.forEach((c) => walk(c, d + 1)); }; }
}
console.log("ok lives", lives, "avg age", (ages.reduce((a, b) => a + b, 0) / lives).toFixed(1), "avg story events", (stories / lives).toFixed(1), "max delay", maxD);
