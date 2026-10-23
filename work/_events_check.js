// 事件迭代冒烟验证：worthOf / inherit 单元测 + STORY 事件年循环（穷/中/富）
const fs = require("fs");
const html = fs.readFileSync(__dirname + "/../index.html", "utf8");
const story = fs.readFileSync(__dirname + "/../story.js", "utf8");
const letters = fs.readFileSync(__dirname + "/../letters-pack.js", "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const main = scripts.find((s) => s.includes("function tick()"));
function el(id) {
  const pseudo = () => el("p" + (Math.random() * 1e9 | 0));
  const e = {
    id, children: [], textContent: "", dataset: {}, style: { setProperty() {} },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute() {}, removeAttribute() {}, focus() {}, addEventListener() {}, hidden: true,
    getBoundingClientRect() { return { width: 0, height: 0 }; },
    querySelector() { return this.children[0] || el("q"); }, querySelectorAll() { return []; },
    appendChild(c) { this.children.push(c); return c; }, prepend(c) { this.children.unshift(c); if (this.children.length > 30) this.children.length = 30; },
    scrollTo() {}, scrollBy() {}, remove() {}, cloneNode() { return el("clone"); },
    get lastElementChild() { return this.children[this.children.length - 1] || null; },
    get firstElementChild() { return this.children[this.children.length - 1] || pseudo(); },
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
eval(letters);
eval(story);
eval(main + "\n;T = { worthOf, inherit, birth: () => birth(), render: () => render(), STORY, els, get S() { return S; }, set S(v) { S = v; } };");
const out = [];
let fails = 0;
const ok = (cond, msg) => { out.push((cond ? "PASS " : "FAIL ") + msg); if (!cond) fails++; };

// A. worthOf 单元测
out.push("== A. worthOf ==");
{
  const s = { money: 50, house: { P: 100, left: 30 }, famProp: 0, famPropDebt: 0, inhProp: 0, inhDebt: 0, famCap: 0 };
  ok(T.worthOf(s) === 50 + 30, "纯现金+自购房净值(100-70)=80 → " + T.worthOf(s)); // 50 + (100-100*0.7*30/30)=50+30
}
{
  const s = { money: -20, house: null, famProp: 300, famPropDebt: 120, inhProp: 200, inhDebt: 260, famCap: 40, trust: 5 };
  const w = T.worthOf(s); // -20 + 0 + 180 + (-60) + 40 + 100 = 240
  ok(w === 240, "带债组合 → " + w);
}
{
  const s = { money: -80, house: null, famProp: 0, famPropDebt: 0, inhProp: 0, inhDebt: 0, famCap: 0 };
  ok(T.worthOf(s) === -80, "纯负债 → " + T.worthOf(s));
}

// B. inherit 单元测（构造真 S 片段，直接调 inherit）
out.push("== B. inherit ==");
{
  // 穷家庭：v < 1 → 无钱
  T.S = { famPot: 0, fam0: 0, sibs: 0, heir: 0, top: 0, Rf: 50, joy: 50, inh: 0, money: 0, famCap: 0, inhProp: 0, inhDebt: 0 };
  T.inherit();
  const s = T.S;
  ok(s.inh === 1 && s.money === 0, "穷家庭无遗产可继");
}
{
  // 中产：v 大，可能继承房/带债
  T.S = { famPot: 200, fam0: 3, sibs: 1, heir: 0, top: 0, Rf: 55, joy: 50, inh: 0, money: 0, famCap: 0, inhProp: 0, inhDebt: 0 };
  T.inherit();
  const s = T.S;
  ok(s.inh === 1 && s.money + s.famCap + (s.inhProp || 0) - (s.inhDebt || 0) > 0, `中产继承总值=现金+房净值 → money=${s.money} famCap=${s.famCap} inhProp=${s.inhProp||0} inhDebt=${s.inhDebt||0}`);
  ok((s.inhDebt || 0) >= 0 && (s.inhDebt || 0) <= (s.inhProp || 0) * 1.1 + 1, "继承负债不越界（可略超=负资产）");
}

// C. STORY 事件年循环：穷/中/富三档，每档 60 年
out.push("== C. STORY 事件年循环 ==");
function runLife(label, forceFam) {
  let errs = [], logs = [], qarr = [], birthErr = "";
  const api = {
    log: (t) => logs.push(String(t)), 
    modal: (t, sub, opts) => { if (opts && opts.length) { try { opts[0][2](); } catch (e) { errs.push("modal:" + e.message); } } },
    moment: () => {},
    kfx: (v) => { const s = T.S; s.iq = Math.max(0, Math.min(100, (s.iq || 0) + v)); },
    rel: (k, v) => { const s = T.S; s.rel = Math.max(0, Math.min(100, (s.rel || 0) + v)); },
    q: (f) => qarr.push(f),
  };
  try { T.birth(); } catch (e) { birthErr = e.message.slice(0, 40); } // 出生动画需真 DOM，stub 下抛错但 S 已构造
  if (forceFam != null) { const s = T.S; s.fam0 = forceFam; s.fam = forceFam; s.dec = ["D1","D2","D3","D4","D5","D6","D7","D8","D9","D10"][forceFam]; }
  try { T.STORY.init(T.S); } catch (e) { errs.push("init:" + e.message); }
  for (let a = T.S.age + 1; a <= 60; a++) {
    qarr = [];
    T.S.age = a;
    try { T.STORY.year(T.S, api); } catch (e) { errs.push("year@" + a + ":" + e.message); }
    try { qarr.forEach((f) => f()); } catch (e) { errs.push("q@" + a + ":" + e.message); }
  }
  const txt = logs.join(" ");
  out.push(label + "：年数 60 · 事件错误 " + errs.length + (errs.length ? "（" + errs.slice(0, 3).join("; ") + "）" : "") + (birthErr ? " · 出生动画(stub限制) " + birthErr : "") + " · 日志 " + logs.length + " 条 · " + (txt.includes("结婚") || txt.includes("婚礼") ? "含结婚事件" : "无结婚") + " / " + (txt.includes("病了") || txt.includes("重病") ? "含父母病事件" : "无父母病") + " / 存款=" + Math.round((T.S.money || 0)));
  if (errs.length) out.push(errs.slice(0, 5).join(" | "));
}
runLife("穷档 L1", 0);
runLife("中档 L3", 2);
runLife("富档 L7", 6);

// D. 面板渲染：财富总额显示
out.push("== D. render 财富总额显示 ==");
{
  try { T.birth(); } catch (e) {} // 出生动画需真 DOM，stub 下忽略
  const s = T.S;
  s.money = 100; s.house = { P: 200, left: 20 }; s.famProp = 300; s.famPropDebt = 100;
  try { T.render(); } catch (e) { out.push("FAIL render:" + e.message); fails++; }
  const h = (els["l-money"] || {})._h || "";
  ok(h.includes("财富总额"), "l-money 含财富总额 → " + h.replace(/<[^>]+>/g, " ").slice(0, 80));
}

fs.writeFileSync(__dirname + "/../_events_check_out.txt", out.join("\n"), "utf8");
console.log("fails=" + fails);
