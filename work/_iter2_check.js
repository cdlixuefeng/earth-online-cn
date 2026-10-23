// 迭代2验证：①0–5岁 baby 随机事件能触发 ②DAILY 池已扩容 ③择校/落榜彩蛋分支运行验证
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
eval(main + "\n;T = { STORY, birth: () => birth(), choose12: () => choose12(), choose15: () => choose15(), gaokao: (n) => gaokao(n), driveQ: () => { let n = 0; while (Q.length && n++ < 6) { const f = Q.shift(); try { f(); } catch (e) { return 'qerr:' + e.message; } } return null; }, clearQ: () => { Q.length = 0; }, setS: (v) => { S = v; }, getS: () => S, stubModal: (fn) => { modal = fn; } }");
const out = []; let fails = 0;
const ok = (cond, msg) => { out.push((cond ? "PASS " : "FAIL ") + msg); if (!cond) fails++; };

// 1. DAILY 池扩容
out.push("== 1. DAILY 池 ==");
ok(/baby: \[[^\]]{200,}/.test(story), "baby 池台词量已扩容 ≥200 字符");
ok(/kid: \[[^\]]{200,}/.test(story), "kid 池已扩容");
ok(/teen: \[[^\]]{200,}/.test(story), "teen 池已扩容");

// 2. baby 事件结构
out.push("== 2. 幼儿事件 ==");
const BABY_IDS = ["baby_walk", "baby_ill", "baby_toys", "baby_family", "baby_crawl", "baby_market", "baby_animal", "baby_night", "baby_neighbor", "baby_photo"];
for (const id of BABY_IDS) {
  const e = T.STORY.events.find((x) => x.id === id);
  ok(e && Array.isArray(e.a) && e.a[0] >= 0 && e.a[1] <= 6 && typeof e.run === "function", `${id} 存在且年龄窗 0–6 岁`);
}

// 3. 0–6 岁随机性：用真 birth() 构造 S，统计触发事件数量
out.push("== 3. 0–6 岁随机性 ==");
let totalHits = 0, per = 0, zeroCnt = 0;
const api = { log: () => {}, modal: () => {}, moment: () => {}, kfx: () => {}, rel: () => {}, q: () => {} };
for (let i = 0; i < 100; i++) {
  try { T.birth(); } catch (e) {} // stub 下出生动画受限，S 已构造
  let s;
  try { s = T.getS(); } catch (e) { ok(false, "birth 未构造 S: " + e.message); break; }
  try { T.STORY.init(s); } catch (e) { ok(false, "init:" + e.message); }
  for (let a = 1; a <= 6; a++) {
    s.age = a;
    try { T.STORY.year(s, api); } catch (e) { ok(false, "baby年异常@" + a + ":" + e.message); break; }
  }
  const d = s.done;
  const n = BABY_IDS.filter((id) => d[id]).length;
  totalHits += n;
  if (d.baby_ill) per++;
  if (n === 0) zeroCnt++;
}
const avg = (totalHits / 100).toFixed(2);
ok(avg >= 3, `100 次模拟 0–6 岁平均触发 ${avg} 个幼儿事件（期望 ≥3）`);
ok(zeroCnt <= 3, `${100 - zeroCnt}/100 次至少触发 1 个（期望几乎必有）`);
ok(per > 0 && per < 100, `幼儿生病 ${per} 次（存在但非必然）`);

// 4. 富家高考落榜 → 三选彩蛋（驱动真实 Q）
out.push("== 4. 富家落榜彩蛋 ==");
{
  T.clearQ();
  try { T.birth(); } catch (e) {}
  const s = T.getS();
  // 覆盖成富家、18 岁、高家底，确保够出国
  s.age = 18; s.fam = 5; s.fam0 = 4; s.famPot = 300; s.track = "high"; s.retake = false;
  s.iq = 50; s.urban = 1; s.school = "key"; s.p = { t: 1 }; s.parEdu = 0; s.famPct = 60; s.xq = 0;
  s.joy = 50; s.hp = 80; s.money = 10; s.uni = ""; s.tierK = 0; s.edu = 1; s.src = ""; s.intl = 0; s.ky = 0;
  let modalTitle = "", modalOpts = [];
  T.stubModal((t, sub, opts) => { modalTitle = t; modalOpts = (opts || []).map((o) => o[0]); });
  let ran = 0;
  for (let i = 0; i < 300; i++) {
    modalTitle = ""; modalOpts = []; T.clearQ();
    // 每次重置落榜相关的可变状态
    s.retake = false; s.track = "high"; s.uni = ""; s.tierK = 0; s.edu = 1; s.joy = 50; s.famPot = 300;
    try { T.gaokao("稳妥"); } catch (e) { ok(false, "gaokao 异常: " + e.message); break; }
    const qErr = T.driveQ();
    if (qErr) { ok(false, "Q 驱动异常: " + qErr); break; }
    if (modalTitle === "18 岁 · 落榜之后") { ran++; break; }
    if (s.track === "grad") { ran = -1; break; } // 走了认命分支（不该发生：家底够必弹彩蛋）
  }
  ok(ran === 1, `300 次富家高考中捕获到落榜三选彩蛋（ran=${ran}）`);
  if (ran === 1) {
    ok(modalOpts.includes("家里安排出国读预科") && modalOpts.includes("复读一年"), "彩蛋选项含出国+复读");
  }
  // 穷家落榜不弹彩蛋直接打工
  s.fam = 0; s.fam0 = 0; s.famPot = 0; s.retake = false; s.track = "high"; s.uni = ""; s.tierK = 0; s.edu = 1;
  T.clearQ(); modalTitle = ""; let gradSeen = false;
  for (let i = 0; i < 300; i++) {
    s.retake = false; s.track = "high"; s.uni = ""; s.tierK = 0; s.edu = 1;
    try { T.gaokao("稳妥"); } catch (e) { ok(false, "穷家 gaokao 异常: " + e.message); break; }
    T.driveQ();
    if (s.track === "grad") { gradSeen = true; break; }
  }
  ok(gradSeen, "穷家落榜直接高中毕业打工（无彩蛋）");
}

// 5. 小升初择校彩蛋（富家 + 反复投掷直到落榜）
out.push("== 5. 小升初择校彩蛋 ==");
{
  T.clearQ();
  try { T.birth(); } catch (e) {}
  const s = T.getS();
  s.age = 12; s.fam = 5; s.fam0 = 4; s.famPot = 60; s.iq = 20; s.urban = 1; s.xq = 0; s.p = { t: 1 };
  s.school = ""; s.joy = 50; s.track = "high";
  s.tags = new Set(); // stub 下 birth 构造不完整，补齐
  let modalTitle = "", modalOpts = [], got = false;
  T.stubModal((t, sub, opts) => {
    modalTitle = t; modalOpts = (opts || []).map((o) => o[0]);
    // 主弹窗：模拟点击第一个选项（考重点中学），落榜分支才会入队
    if (t === "12 岁 · 小升初" && opts && opts.length) opts[0][2]();
  });
  // 落榜概率约 58%，重试 30 次必中；考上分支会调 kUp→moodOf（需要完整 tags）
  for (let i = 0; i < 30 && !got; i++) {
    modalTitle = ""; modalOpts = []; T.clearQ();
    s.school = ""; s.joy = 50; s.famPot = 60; s.tags = new Set();
    try { T.choose12(); } catch (e) { ok(false, "choose12 异常: " + e.message); break; }
    const qErr = T.driveQ();
    if (qErr) { ok(false, "Q 驱动异常: " + qErr); break; }
    if (modalTitle === "12 岁 · 差几分") got = true;
  }
  ok(got, "小升初落榜触发择校弹窗");
  if (got) {
    ok(modalOpts.includes("家里交择校费，上重点"), "彩蛋选项含择校费");
  }
}

fs.writeFileSync(__dirname + "/../_iter2_check_out.txt", out.join("\n"), "utf8");
console.log("fails=" + fails);
