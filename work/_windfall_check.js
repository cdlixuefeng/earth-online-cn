// 意外之财弹窗验证：房二代拆迁/彩票/老家拆迁触发 moment 弹窗（Q 队列可消费、桩 DOM 下不炸）
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
eval(main + "\n;T = { getS: () => S, setS: (v) => { S = v; }, srcYear: (a, t) => srcYear(a, t), qLen: () => Q.length, stubModal: (fn) => { modal = fn; }, driveQ: () => { let n = 0; while (Q.length && n++ < 6) { const f = Q.shift(); try { f(); } catch (e) { return 'qerr:' + e.message + '|' + (e.stack || '').split('\\n').slice(0, 4).join('\\n'); } } return null; }, clearQ: () => { Q.length = 0; }, setR: (fn) => { global.Math.random = fn; }, restoreR: () => { global.Math.random = Math.random; } }");
const out = []; let fails = 0;
const ok = (cond, msg) => { out.push((cond ? "PASS " : "FAIL ") + msg); if (!cond) fails++; };

// 1. 房二代拆迁：1% 年概率，循环驱动直到触发（R 是 Math.random 直接引用，替换无效），验证 Q 可消费 moment
out.push("== 1. 房二代拆迁弹窗 ==");
let ok1 = true, got = 0, srcErr = "";
try {
  T.setS({ age: 22, src: "fang", srcG: 2, fam: 3, fam0: 3, famPot: 100, money: 5, joy: 50, urban: 1, seen: {}, sibs: 0, srcSub: "五套房收租", rent: 0, sit: "boss" });
  const modalCalls = [];
  T.stubModal((t, sub, opts) => { modalCalls.push({ t, sub, opts }); });
  for (let i = 0; i < 2000 && !got; i++) {
    T.clearQ();
    T.getS().seen.cq = undefined;
    try { T.srcYear(22, 3); } catch (e) { srcErr = e.message; break; }
    if (T.getS().seen.cq) got = T.qLen(); // 拆迁真实触发（seen.cq 落定）
  }
  ok1 = !srcErr;
  if (srcErr) out.push("srcYear 异常: " + srcErr);
  const qErr = got ? T.driveQ() : null;
  if (qErr) { ok1 = false; out.push("Q 消费异常: " + qErr); }
  ok(ok1 && got >= 1, `拆迁事件推入弹窗队列（${got} 次）且消费无异常`);
  const mo = els["mo-card"];
  ok(!!mo && !!mo.innerHTML && mo.innerHTML.includes("拆迁"), "人生时刻弹窗已渲染且含拆迁文案");
} catch (e) { ok(false, "未捕获异常: " + e.message); }

// 2. 快进速度条置顶：CSS 断言（style 在 html 而非 main）
out.push("== 2. 速度条置顶 ==");
ok(/\.x-tools \{[\s\S]{0,420}z-index: 65/.test(html), "速度条 z-index 65（高于抉择 50 / 人生时刻 55）");
ok(/\.x-tools \{[\s\S]{0,420}position: fixed/.test(html), "速度条 position fixed 置顶");

// 3. 彩票/老家拆迁弹窗代码存在
out.push("== 3. 意外之财弹窗 ==");
ok(/彩票中了头奖/.test(main) && /moment\("note", "意外之财"/.test(main), "彩票中奖已改弹窗说明");
ok(/moment\("note", "老家拆迁"/.test(main), "老家拆迁已改弹窗说明");
ok(/moment\("note", "家里拆迁"/.test(main), "房二代拆迁已改弹窗说明");

fs.writeFileSync(__dirname + "/_windfall_check_out.txt", out.join("\n") + "\n\nfails=" + fails, "utf8");
console.log("fails=" + fails);
