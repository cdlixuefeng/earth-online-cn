// 情书验证：node work/letters.js [N]
// 跑 N 条人生（页面自己的逻辑），断言：周年 / 丧偶 / 临终 / 墓志铭提到的那封信，写信人 === 当时的配偶
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
let SRC = fs.readFileSync(__dirname + "/../story.js", "utf8");
// PATCH='[["from","to"],...]'：只在内存里试参数，不改文件
for (const [a, b] of JSON.parse(process.env.PATCH || "[]")) { if (!SRC.includes(a)) throw new Error("patch miss: " + a); SRC = SRC.replace(a, b); }
// 信库从页面自带的 letters-pack.js 读（与 letters99.js 资产无关）
eval(fs.readFileSync(__dirname + "/../letters-pack.js", "utf8") + "\n" + SRC);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const TPL = LETTERS99.map((l) => ({ id: l.id, res: l.body.split("\n").slice(1, -1).map((x) => new RegExp(esc(x).replace(/\\\{(me|w|city|year)\\\}/g, "[^\\n]+"))) }));
const idOf = (body) => { const m = TPL.filter((t) => t.res.every((re) => re.test(body))); return m.length === 1 ? m[0].id : null; };
const IDS = new Map(); let slotLeft = 0, repeatId = 0, unknownId = 0, epiChecks = 0, wedLetters = 0;
const AF = { tempt: 0, cross: 0, flirt: 0, sp: 0, found: 0, caught: 0, rep: 0, div: 0, livesMe: 0, livesSp: 0, livesCross: 0, livesDiv: 0, wedYears: 0, divAll: 0 };

// ---- 探针 ----
let life; // 当前人生的记录
const ERR = new Map(); const err = (m) => ERR.set(m, (ERR.get(m) || 0) + 1);
const fail = []; const bad = (m) => { if (fail.length < 12) fail.push(m); life.bad = 1; };
const LETTER_T = ["一封情书", "一封信", "一张作业本纸"];
const oYear = STORY.year, oEnd = STORY.ending;
function checkRef(text, where) {
  const S = T.S, P = S.N.partner;
  if (!P) return bad(`${where}: 提到信但没有配偶 · ${text.slice(0, 60)}`);
  if (P.cheated && !P.forgiven) bad(`${where}: 引用了出轨且没被原谅的配偶 · ${text.slice(0, 40)}`);
  if (S.F.noRomance === S.age) bad(`${where}: 出轨 / 发现那一年还在引用信 · ${text.slice(0, 40)}`);
  const mine = life.acc.filter((a) => a.w === P);
  if (!mine.length) return bad(`${where}: 当前配偶 ${P.n} 没写过信 · ${text.slice(0, 60)}`);
  const other = life.acc.filter((a) => a.w !== P && text.includes(a.line) && !mine.some((m) => m.line === a.line));
  if (other.length) bad(`${where}: 引用了别人的信 · ${text.slice(0, 60)}`);
  if (!mine.some((m) => text.includes(m.line))) bad(`${where}: 没引用配偶那封信的原句 · ${text.slice(0, 60)}`);
  life.refs++;
}
STORY.year = (s, api) => oYear(s, {
  ...api,
  log: (t, ty) => {
    if (typeof t === "string" && t.includes("那封信") && !t.includes("同学会")) checkRef(t, "log@" + s.age);
    if (typeof t === "string") { const k = t.includes("落款是") && t.includes("旧书") ? "故人信回响" : t.includes("你还记得那封信吗") ? "同学会回响" : t.includes("志愿填了不同") ? "高考分手" : ""; if (k) (global.ECHO ||= {})[k] = (ECHO[k] || 0) + 1; }
    return api.log(t, ty);
  },
  moment: (kind, title, body, opts) => {
    if (kind === "letter" && LETTER_T.includes(title) && opts) {
      life.got++; life.bodies.push(body);
      if (T.S.wed) { wedLetters++; bad("婚后收到了信 · " + title); }
      const id = idOf(body);
      if (id == null) { unknownId++; bad("认不出信的 id · " + body.slice(0, 40)); }
      else { if (life.ids.includes(id)) { repeatId++; bad("同一生重复了信 #" + id); } life.ids.push(id); IDS.set(id, (IDS.get(id) || 0) + 1); }
      if (/\{(me|w|city|year)\}/.test(body)) { slotLeft++; bad("槽位没填 · " + body.slice(0, 40)); }
      const w = opts.map((o, i) => [o[0], o[1], () => { o[2](); if (i === 0) { const P = T.S.N.partner; const line = P && P.letter && P.letter.line; if (!P || !body.includes(line) || !body.endsWith("——" + P.n)) bad("收下后 partner/信不匹配"); life.acc.push({ w: P, line }); } }, o[3]]);
      w.auto = opts.auto; global.PICK = opts.auto ? opts.auto() : 0;
      return api.moment(kind, title, body, w);
    }
    if (kind === "letter" && /^结婚 \d+ 周年/.test(title)) { const P = T.S.N.partner; if (!P || !body.includes(P.n)) bad("周年信落款不是配偶"); checkRef(body, "moment"); }
    global.PICK = 0;
    return api.moment(kind, title, body, opts);
  },
});
STORY.ending = (s) => { const r = oEnd(s); life.ep = r.epitaph; life.hl = r.highlights; if (r.epitaph.includes("被爱过")) { const P = s.N.partner; if (!P || !life.acc.some((a) => a.w === P)) bad("墓志铭：被爱过，但配偶没写信"); else life.refs++; }
  if (r.epiLine) { epiChecks++; const P = s.N.partner; if (!P || !r.epiLine.includes(P.n) || !life.acc.some((a) => a.w === P && r.epiLine.includes(a.line) && a.line === P.line)) bad("墓志铭引用的信句不是配偶写的"); if (/\{(me|w|city|year)\}/.test(r.epiLine)) { slotLeft++; bad("墓志铭槽位没填"); } }
  return r; };

let T;
eval(main + "\n;T = { tick: () => tick(), get S() { return S; }, birth: () => birth(), unblock: () => { blocked = false; Q = []; } };");
const $ = (id) => document.getElementById(id);
const N = +process.argv[2] || 2000;
const st = { got: 0, acc: 0, married: 0, accAny: 0, refs: 0, refLives: 0, bad: 0, exThenOther: 0, bodies: [], hlS: 0, hlE: 0, adm: 0, teen: 0, split: 0 };
for (let L = 0; L < N; L++) {
  life = { got: 0, acc: [], bodies: [], refs: 0, ids: [] };
  try { T.birth(); } catch (e) {}
  $("b-start").onclick();
  $("modal").hidden = true; $("reflect").hidden = true; $("moment").hidden = true;
  let guard = 0;
  while (!T.S.dead && guard++ < 400) {
    try {
      if (!$("modal").hidden) { const o = $("m-opts").children; o[Math.floor(Math.random() * o.length)].onclick(); continue; }
      if (!$("reflect").hidden) { $("r-go").onclick(); continue; }
      if (!$("moment").hidden) { const o = $("mo-opts").children; if (!$("mo-opts").hidden && o.length) (o[global.PICK] || o[0]).onclick(); else $("mo-go").onclick(); continue; }
      T.tick();
    } catch (e) { err(e.message + " @ " + (e.stack.split("\n")[1] || "").trim()); $("modal").hidden = true; $("moment").hidden = true; T.unblock(); }
  }
  if (!T.S.dead) err("life did not end");
  try { STORY.ending(T.S); } catch (e) { err("ending: " + e.message); }
  const S = T.S, Nn = S.N, Fx = S.F;
  AF.tempt += Fx.nTempt || 0; AF.cross += Fx.nCross || 0; AF.flirt += Fx.nFlirt || 0; AF.sp += Fx.nSpCheat || 0; AF.found += Fx.nFound || 0; AF.caught += Fx.caught || 0; AF.rep += Fx.reported || 0; AF.div += Fx.affairDivorce || 0;
  if (Fx.nTempt) AF.livesMe++; if (Fx.nSpCheat) AF.livesSp++; if (Fx.nCross) AF.livesCross++; if (Fx.affairDivorce) AF.livesDiv++; if (Fx.divorced) AF.divAll++;
  if (life.got) st.got++; if (S.F.wedAge) st.wed1 = (st.wed1 || 0) + 1; if ((Nn.exes || []).length) st.hadEx = (st.hadEx || 0) + 1;
  if (life.acc.length) st.accAny++;
  st.acc += life.acc.length;
  st.married += life.acc.filter((a) => a.w && a.w.wed).length;
  for (const a of life.acc) { const k = a.w && a.w.wrote ? "kAdm" : "kBday"; st[k] = st[k] || [0, 0]; st[k][0]++; if (a.w && a.w.wed) st[k][1]++; }
  if (life.acc.some((a) => a.w && !a.w.wed && (Nn.exes || []).includes(a.w)) && (Nn.exes || []).concat(Nn.partner || []).some((p) => p && p.wed && !p.letter)) st.exThenOther++;
  st.lettersSeen = (st.lettersSeen || 0) + life.got;
  if (life.refs) st.refLives++;
  st.refs += life.refs; if (life.bad) st.bad++;
  st.bodies.push(...life.bodies);
  if ((life.hl || []).some((h) => h.includes("嫁了写信") || h.includes("娶了写信"))) st.hlS++;
  if ((life.hl || []).some((h) => h.includes("故人"))) st.hlE++;
  if ((Nn.admirers || []).length || life.acc.some((a) => a.w && a.w.wrote)) st.adm++;
  if (life.acc.some((a) => a.w && a.w.teen)) st.teen++;
  if (life.acc.some((a) => a.w && a.w.teen && a.w.end === "gaokao")) st.split++;
}
const pc = (a, b) => (b ? ((a / b) * 100).toFixed(1) + "%" : "-");
console.log(`lives ${N} · errors ${[...ERR.values()].reduce((a, b) => a + b, 0)}`);
for (const [m, c] of ERR) console.log("  ERR x" + c + " " + m);
console.log(`收到过信的人生 ${pc(st.got, N)} · 信总数 ${st.lettersSeen} · 收下的信 ${st.acc}（${pc(st.acc, st.lettersSeen)}）· 至少收下一封的人生 ${pc(st.accAny, N)}`);
console.log(`收下后嫁/娶了写信人 ${st.married}/${st.acc} = ${pc(st.married, st.acc)}`);
console.log(`  其中 生日信 ${st.kBday && st.kBday.join("/")} · 暗恋者信 ${st.kAdm && st.kAdm.join("/")}（收下/结婚）`);
console.log(`暗恋者来信的人生 ${pc(st.adm, N)} · 早恋收下 ${st.teen}，其中高考散了 ${st.split}（${pc(st.split, st.teen)}）`);
console.log(`收过前任的信又和别人结婚的人生 ${st.exThenOther} · 高光「嫁/娶了写信的人」${st.hlS} ·「成了故人」${st.hlE}`);
console.log(`提到信的人生 ${st.refLives} · 引用检查 ${st.refs} 次 · 写信人≠配偶的人生 ${st.bad}`);
for (const f of fail) console.log("  FAIL " + f);
console.log(`结过婚的人生 ${pc(st.wed1, N)} · 有过前任的人生 ${pc(st.hadEx, N)}`);
console.log(`不同信件 ${new Set(st.bodies).size}/${st.bodies.length}`);
console.log(`信库 id 出现 ${IDS.size}/99 种 · 认不出 id ${unknownId} · 同生重复 id ${repeatId} · 槽位未填 ${slotLeft} · 墓志铭信句检查 ${epiChecks} 次`);
console.log(`最少见的 20 封：${LETTERS99.map((l) => [l.id, IDS.get(l.id) || 0]).sort((a, b) => a[1] - b[1]).slice(0, 20).map(([i, c]) => "#" + i + "×" + c).join(" ")}`);
console.log(`婚后收到的信 ${wedLetters}`);
console.log(`出轨 · 你被诱惑 ${AF.tempt} 次（${pc(AF.livesMe, N)} 的人生）· 伴侣出轨 ${AF.sp} 次（${pc(AF.livesSp, N)} 的人生）`);
console.log(`  你的选择：越界 ${AF.cross}（${pc(AF.livesCross, N)} 的人生）· 暧昧 ${AF.flirt} · 拒绝 ${AF.tempt - AF.cross - AF.flirt}`);
console.log(`  你被发现 ${AF.caught}（其中闹到单位 ${AF.rep}）· 你发现伴侣 ${AF.found} · 出轨导致的离婚 ${AF.div}（${pc(AF.livesDiv, N)} 的人生；离过婚的人生 ${pc(AF.divAll, N)}）`);
console.log(`  没出现过的 id：${LETTERS99.map((l) => l.id).filter((i) => !IDS.has(i)).join(",")}`);
if (process.env.SHOW) { const seen = new Set(); let k = 0; for (const b of st.bodies) { const s = b.split("\n").length; if (k < 3 && !seen.has(s)) { seen.add(s); console.log("\n" + b); k++; } } }
