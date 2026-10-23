// 父母学历 × 家庭来源自洽性验证：高收入家庭必须是高学历，或做生意
const fs = require("fs");
const html = fs.readFileSync(__dirname + "/../index.html", "utf8");
const story = fs.readFileSync(__dirname + "/../story.js", "utf8");
const letters = fs.readFileSync(__dirname + "/../letters-pack.js", "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const main = scripts.find((s) => s.includes("function tick()"));
function el(id) {
  const e = { id, children: [], textContent: "", dataset: {}, style: { setProperty() {} },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute() {}, removeAttribute() {}, focus() {}, addEventListener() {}, hidden: true,
    getBoundingClientRect() { return { width: 0, height: 0 }; },
    querySelector() { return this.children[0] || el("q"); }, querySelectorAll() { return []; },
    appendChild(c) { this.children.push(c); return c; }, prepend(c) { this.children.unshift(c); if (this.children.length > 30) this.children.length = 30; },
    scrollTo() {}, scrollBy() {}, remove() {}, cloneNode() { return el("clone"); },
    get lastElementChild() { return this.children[this.children.length - 1] || null; },
    get firstElementChild() { return this.children[this.children.length - 1] || null; },
    set innerHTML(v) { this._h = v; this.children = v ? [el("ul")] : []; }, get innerHTML() { return this._h || ""; } };
  return e;
}
const els = {};
global.document = { getElementById: (id) => (els[id] ||= el(id)), querySelectorAll: () => [], querySelector: () => el("x"),
  createElement: () => el("c"), documentElement: el("html"), body: el("body"), addEventListener() {} };
global.window = global; global.matchMedia = () => ({ matches: true, addEventListener() {} });
global.requestAnimationFrame = () => 0; global.cancelAnimationFrame = () => {}; global.scrollTo = () => {};
global.performance = { now: () => 0 };
global.setTimeout = () => 0; global.clearTimeout = () => {}; global.setInterval = () => 1; global.clearInterval = () => {};
global.getComputedStyle = () => ({ getPropertyValue: () => "" });
global.addEventListener = () => {}; global.innerWidth = 1200; global.innerHeight = 800;
global.Hark = { data: () => ({ features: [] }) };
eval(letters); eval(story);
eval(main + "\n;T = { STORY, birth: () => birth(), getS: () => S, setS: (v) => { S = v; }, FAM }");
const out = []; let fails = 0;
const ok = (cond, msg) => { out.push((cond ? "PASS " : "FAIL ") + msg); if (!cond) fails++; };

out.push("== 1. 档位名称 ==");
ok(T.FAM[4].n === "小资家庭" && T.FAM[4].s === "小资", `第 5 级显示名 → ${T.FAM[4].n} / ${T.FAM[4].s}`);

out.push("== 2. 学历 × 来源自洽（模拟 500 次出生）==");
let execLow = 0, cadreLow = 0, bizLowHigh = 0, execHi = 0, execCnt = 0, proLow = 0;
const PED_L = ["初中及以下", "高中、中专", "大专、本科", "高知"];
for (let i = 0; i < 500; i++) {
  try { T.birth(); } catch (e) {} // stub 下出生动画/UI 受限，S 在崩前已完整构造（与 _iter2_check 相同）
  const s = T.getS();
  if (!s || s.src === undefined) { ok(false, "S 未构造"); break; }
  if (s.src === "exec") { execCnt++; if (s.parEdu < 2) execLow++; if (s.parEdu === 3) execHi++; }
  if (s.src === "cadre" && s.parEdu < 2) cadreLow++;
  if (s.src === "pro" && s.parEdu < 2) proLow++;
  if (s.fam >= 4 && s.src === "biz" && s.parEdu <= 1) bizLowHigh++;
}
ok(execLow === 0, `高管来源低学历（<大专）${execLow} 例（必须 0）`);
ok(cadreLow === 0, `干部来源低学历 ${cadreLow} 例（必须 0）`);
ok(proLow === 0, `专业人士来源低学历 ${proLow} 例（必须 0）`);
ok(bizLowHigh > 0, `学历不高 + 做生意的高收入家庭 ${bizLowHigh} 例（通路保留）`);
ok(execHi / Math.max(1, execCnt) > 0.4, `高管中高知占比 ${(execHi / Math.max(1, execCnt) * 100).toFixed(0)}%（${execHi}/${execCnt}，应过半接近）`);

fs.writeFileSync(__dirname + "/_paredu_check_out.txt", out.join("\n") + "\n\nfails=" + fails, "utf8");
console.log("fails=" + fails);
