// 总验证：node work/verify.js [N]
// 十等分分布 · 弹性与流动 · 省份考公/创业/外出务工 · 情书与出轨回归 · 错误（含温和模式：奇数条人生开温和模式）
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

// ---- 情书 / 出轨探针（同 letters.js）----
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const TPL = LETTERS99.map((l) => ({ id: l.id, res: l.body.split("\n").slice(1, -1).map((x) => new RegExp(esc(x).replace(/\\\{(me|w|city|year)\\\}/g, "[^\\n]+"))) }));
const idOf = (body) => { const m = TPL.filter((t) => t.res.every((re) => re.test(body))); return m.length === 1 ? m[0].id : null; };
const IDS = new Map(); let wedLetters = 0, unknownId = 0, repeatId = 0, slotLeft = 0;
let life; const fail = []; const bad = (m) => { if (fail.length < 12) fail.push(m); life.bad = 1; };
const LETTER_T = ["一封情书", "一封信", "一张作业本纸"];
const oYear = STORY.year, oEnd = STORY.ending;
function checkRef(text, where) {
  const S = T.S, P = S.N.partner;
  if (!P) return bad(`${where}: 提到信但没有配偶`);
  if (P.cheated && !P.forgiven) bad(`${where}: 引用了出轨且没被原谅的配偶`);
  const mine = life.acc.filter((a) => a.w === P);
  if (!mine.length) return bad(`${where}: 当前配偶没写过信 · ${text.slice(0, 50)}`);
  if (life.acc.some((a) => a.w !== P && text.includes(a.line) && !mine.some((m) => m.line === a.line))) bad(`${where}: 引用了别人的信`);
  if (!mine.some((m) => text.includes(m.line))) bad(`${where}: 没引用配偶那封信的原句`);
}
STORY.year = (s, api) => oYear(s, {
  ...api,
  log: (t, ty) => { if (typeof t === "string" && t.includes("那封信") && !t.includes("同学会")) checkRef(t, "log@" + s.age); return api.log(t, ty); },
  moment: (kind, title, body, opts) => {
    if (kind === "letter" && LETTER_T.includes(title) && opts) {
      if (T.S.wed) { wedLetters++; bad("婚后收到了信"); }
      const id = idOf(body);
      if (id == null) { unknownId++; bad("认不出信的 id"); } else { if (life.ids.includes(id)) { repeatId++; bad("同一生重复了信"); } life.ids.push(id); IDS.set(id, (IDS.get(id) || 0) + 1); }
      if (/\{(me|w|city|year)\}/.test(body)) { slotLeft++; bad("槽位没填"); }
      const w = opts.map((o, i) => [o[0], o[1], () => { o[2](); if (i === 0) { const P = T.S.N.partner; const line = P && P.letter && P.letter.line; if (!P || !body.includes(line) || !body.endsWith("——" + P.n)) bad("收下后 partner/信不匹配"); life.acc.push({ w: P, line }); } }, o[3]]);
      w.auto = opts.auto; global.PICK = opts.auto ? opts.auto() : 0;
      return api.moment(kind, title, body, w);
    }
    if (kind === "letter" && /^结婚 \d+ 周年/.test(title)) { const P = T.S.N.partner; if (!P || !body.includes(P.n)) bad("周年信落款不是配偶"); checkRef(body, "moment"); }
    global.PICK = 0;
    return api.moment(kind, title, body, opts);
  },
});
STORY.ending = (s) => { const r = oEnd(s);
  if (r.epiLine) { const P = s.N.partner; if (!P || !r.epiLine.includes(P.n) || !life.acc.some((a) => a.w === P && r.epiLine.includes(a.line))) bad("墓志铭引用的信句不是配偶写的"); }
  return r; };

let T;
eval(main + "\n;T = { tick: () => tick(), get S() { return S; }, birth: () => birth(), unblock: () => { blocked = false; Q = []; }, famDist, FAM_NAT, weighted, drawFam, drawBirth, birthCells, famCell, uOf, boyP, srb, PROV, FAM, famReveal, die: () => die(), FAM_L, decOf, reveal, FLV };");
const $ = (id) => document.getElementById(id);
const ERR = new Map(), err = (e, soft) => { const k = (soft ? "[温和] " : "") + e.message + " @ " + ((e.stack || "").split("\n")[1] || "").trim(); ERR.set(k, (ERR.get(k) || 0) + 1); };
const pc = (v) => (v * 100).toFixed(1) + "%";

// 1) 出生十等分：抽 100 万次
const M = 1e6, cnt = Array(10).fill(0); let boys = 0, urb = 0, r5 = 0, r6 = 0, rBadSrc = 0, badInc = 0;
const srcBy = {}, SRCS = ["biz", "exec", "fang", "cadre", "pro", "inv", "dual"];
const grpOf = (s) => (s.srcG >= 0 ? ["L3上段", "L4下段", "L4上段", "L5", "L6", "L7", "L8–10"][s.srcG] : null);
const LV = [3000, 8000, 15000, 30000, 100000, 300000].map((m) => (m * 12) / 2.8).concat([1e7, 5e7, 1e8].map((y) => y / 2.8));
for (let i = 0; i < M; i++) {
  const p = T.weighted(), s = { p, ...T.drawBirth(p), chai: false }; T.drawFam(s); cnt[s.fam]++;
  if (LV.filter((c) => s.famInc >= c).length !== s.fam) badInc++;
  if (s.male) boys++; if (s.urban) urb++; if (s.fam >= 4 && !s.urban) r5++; if (s.fam >= 5 && !s.urban) { r6++; if (!/乡镇企业主|养殖大户|城中村拆迁/.test(s.srcSub)) rBadSrc++; }
  const g = grpOf(s); if (g) { const b = (srcBy[g] ||= { n: 0 }); b.n++; b[s.src] = (b[s.src] || 0) + 1; }
}
const dec = cnt;
console.log("== 出生十级（100 万次抽样 · 解析期望 FAM_NAT · 目标）每 10,000 ==");
T.FAM.forEach((f, i) => console.log(`  L${i + 1} ${f.n.padEnd(6, "　")} 抽样 ${(cnt[i] / M * 1e4).toFixed(2).padStart(8)} · 期望 ${(T.FAM_NAT[i] * 1e4).toFixed(3).padStart(9)} · 目标 ${(f.sh * 1e4).toFixed(2).padStart(7)} · 偏差 ${(T.FAM_NAT[i] < 0.01 ? ((T.FAM_NAT[i] / f.sh - 1) * 100).toFixed(0) + "%" : ((T.FAM_NAT[i] - f.sh) * 100).toFixed(2) + " 点")}`));
console.log(`收入与级不符 ${badInc} · 男孩 ${pc(boys / M)}（性别比 ${(boys / (M - boys) * 100).toFixed(1)}）· 城镇新生儿 ${pc(urb / M)} · 农村占第 5 级及以上 ${(r5 / cnt.slice(4).reduce((a, b) => a + b, 0) * 100).toFixed(2)}% · 农村占第 6 级及以上 ${(r6 / cnt.slice(5).reduce((a, b) => a + b, 0) * 100).toFixed(2)}%（n=${r6}，来源不符 ${rBadSrc}）`);
{ // 解析：农村占第 5 级+ / 第 6 级+
  let a5 = 0, a6 = 0, r5a = 0, r6a = 0; const BA = T.PROV.reduce((s, p) => s + p.b, 0);
  T.PROV.forEach((p) => { const u = T.uOf(p); [[1, u], [0, 1 - u]].forEach(([ub, w]) => { if (w <= 0) return; const d = T.famDist(p, !!ub), x5 = (p.b / BA) * w * d.slice(4).reduce((a, b) => a + b, 0), x6 = (p.b / BA) * w * d.slice(5).reduce((a, b) => a + b, 0); a5 += x5; a6 += x6; if (!ub) { r5a += x5; r6a += x6; } }); });
  console.log(`解析：农村占第 5 级及以上 ${(r5a / a5 * 100).toFixed(2)}% · 第 6 级及以上 ${(r6a / a6 * 100).toFixed(3)}%`);
}
console.log("各地每 10,000 个新生儿（P(级 | 省, 城乡)，抽签同一函数）：L1 · L3 · L5 · L6+");
[["甘肃", 0], ["河南", 0], ["四川", 1], ["广东", 1], ["上海", 1], ["北京", 1]].forEach(([n, u]) => { const p = T.PROV.find((q) => q.n === n), d = T.famDist(p, !!u), f = (v) => (v * 1e4 >= 1 ? (v * 1e4).toFixed(0) : (v * 1e4).toFixed(2)); console.log(`  ${n}${u ? "城镇" : "农村"} ${f(d[0])} · ${f(d[2])} · ${f(d[4])} · ${f(d.slice(5).reduce((a, b) => a + b, 0))}`); });
console.log("家底来源（出生抽样，组内 %）：");
Object.entries(srcBy).forEach(([g, b]) => console.log(`  ${g.padEnd(6, "　")} n=${String(b.n).padStart(6)} ` + SRCS.map((k) => `${k} ${((b[k] || 0) / b.n * 100).toFixed(1)}`).join(" · ")));

// 2) N 条人生
const N = +process.argv[2] || 5000;
const rows = [], prov = {}, byDec = Array.from({ length: 10 }, () => ({ n: 0, lb: 0, key: 0, ben: 0, start: 0, abroad: 0, bail: 0, ken: 0 }));
const AF = { tempt: 0, sp: 0, div: 0, livesDiv: 0 }, MAR = [];
let softLives = 0, fallen = 0; const WEALTH = {}, TOPW = {}, TEX = {};
const med = (a) => { const b = [...a].sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : 0; };
for (let L = 0; L < N; L++) {
  life = { acc: [], ids: [] };
  els.soft = el("soft"); els.soft.checked = L % 2 === 1;
  try { T.birth(); } catch (e) { if (!/classList|getAttribute/.test(e.message)) err(e); }
  try { T.famReveal(); T.reveal(); } catch (e) { err(e); }
  const soft = !!T.S.soft; if (soft) softLives++;
  $("b-start").onclick();
  $("modal").hidden = true; $("reflect").hidden = true; $("moment").hidden = true;
  let guard = 0, boss = 0, at23 = 0, fw = null, a30 = 0, a50 = 0; const avg = [];
  while (!T.S.dead && guard++ < 400) {
    try {
      if (!$("modal").hidden) { const o = $("m-opts").children; o[Math.floor(Math.random() * o.length)].onclick(); continue; }
      if (!$("reflect").hidden) { $("r-go").onclick(); continue; }
      if (!$("moment").hidden) { const o = $("mo-opts").children; if (!$("mo-opts").hidden && o.length) (o[global.PICK] || o[0]).onclick(); else $("mo-go").onclick(); continue; }
      T.tick();
    } catch (e) { err(e, soft); $("modal").hidden = true; $("moment").hidden = true; T.unblock(); }
    const S = T.S;
    if (S.sit === "boss") boss = 1;
    if (S.age >= 23 && !S.dead) at23 = 1;
    if (S.wed && fw == null) fw = S.F.wedAge != null ? S.F.wedAge : S.age;
    if (S.age >= 30 && !S.dead) a30 = 1;
    if (S.age >= 50 && !S.dead) a50 = 1;
    if (S.age >= 43 && S.age <= 47 && !S.dead && avg.length < S.age - 42) avg.push(S.yinc);
  }
  if (!T.S.dead) err(new Error("life did not end"), soft);
  timers.length = 0; try { T.die(); timers.forEach((f) => f()); } catch (e) { err(e, soft); } timers.length = 0;
  const S = T.S, d = T.decOf(S.fam0) - 1, F = S.F;
  const bd = byDec[d]; bd.n++; if (F.lb) bd.lb++; if (S.school === "key") bd.key++; if ((S.tierK || 0) >= 3) bd.ben++; if (S.abroad) bd.abroad++; if (S.bailed) bd.bail++;
  if (S.fam < S.fam0) fallen++;
  if (S.src) { const w = (WEALTH[S.src] ||= { net: [], fall: 0, heir: 0, sold: 0, tex: {} }); w.net.push(S.netEnd || 0); (S.fam0 >= 4 ? (w.hi ||= []) : (w.lo ||= [])).push(S.netEnd || 0); if (S.fam < S.fam0) w.fall++; if (S.heir) w.heir++; if (S.famCap && !S.biz && S.src === "biz") w.sold++; }
  if (S.fam0 >= 3) { const k = S.fam0 >= 5 ? "L6+" : "L" + (S.fam0 + 1); const w = (TOPW[k] ||= { net: [], fall: 0 }); w.net.push(S.netEnd || 0); if (S.fam < S.fam0) w.fall++; }
  ["car", "abroadM", "trust", "intl", "abroad"].forEach((k) => { if (S[k]) TEX[k] = (TEX[k] || 0) + 1; });
  ["ly", "scamI", "cq", "tp", "heirAsk"].forEach((k) => { if (S.seen && S.seen[k]) TEX[k] = (TEX[k] || 0) + 1; });
  if (avg.length === 5) rows.push({ d, famInc: S.famInc, famPct: S.famPct, inc: avg.reduce((a, b) => a + b, 0) / 5 });
  if (at23) { const P = (prov[S.p.n] ||= { n: 0, gk: 0, boss: 0, out: 0, b: S.p.b }); P.n++; if (S.gkTry) P.gk++; if (boss) P.boss++; if (S.migr) P.out++; }
  { const eg = S.edu < 1 ? "初中及以下" : S.ky || (S.tierK || 0) >= 5 ? "硕士/985+" : (S.tierK || 0) >= 3 ? "本科" : "高中/专科";
    MAR.push({ m: S.male, u: S.urban, eg, d, p: S.p.n, fw, a30, a50, nm: !!F.noMarry, ss: F.single || 0, cuihun: F.nCuihun || 0, sheng: F.nSheng || 0 }); }
  AF.tempt += F.nTempt || 0; AF.sp += F.nSpCheat || 0; AF.div += F.affairDivorce || 0; if (F.affairDivorce) AF.livesDiv++;
}
const errN = [...ERR.values()].reduce((a, b) => a + b, 0);
console.log(`\n== ${N} 条人生（其中温和模式 ${softLives}）· 错误 ${errN} ==`);
ERR.forEach((v, k) => console.log("  ERR x" + v, k));

// 梯度
console.log("\n档位  人数  留守   重点中学  本科+  出国  创业兜底");
byDec.forEach((b, i) => console.log(`L${String(i + 1).padEnd(3)} ${String(b.n).padStart(5)} ${pc(b.lb / b.n).padStart(6)} ${pc(b.key / b.n).padStart(8)} ${pc(b.ben / b.n).padStart(6)} ${String(b.abroad).padStart(5)} ${String(b.bail).padStart(5)}`));
console.log("家道中落", fallen);
console.log("\n家底来源 · 一生结束时净资产中位数（万）· 家道中落 · 接班");
Object.entries(WEALTH).sort((a, b) => med(b[1].net) - med(a[1].net)).forEach(([k, w]) => console.log(`  ${k.padEnd(6)} n=${String(w.net.length).padStart(4)}  中位 ${String(Math.round(med(w.net))).padStart(6)}  P75 ${String(Math.round([...w.net].sort((x, y) => x - y)[Math.floor(w.net.length * 0.75)])).padStart(6)}  P10 ${String(Math.round([...w.net].sort((x, y) => x - y)[Math.floor(w.net.length * 0.1)])).padStart(5)}  （D8–9 ${Math.round(med(w.lo || []))} n=${(w.lo || []).length} · D10+ ${Math.round(med(w.hi || []))} n=${(w.hi || []).length}）  中落 ${pc(w.fall / w.net.length)}  接班 ${w.heir}  卖掉 ${w.sold}`));
console.log("顶层 · 净资产中位数：" + Object.entries(TOPW).map(([k, w]) => `${k} n=${w.net.length} 中位 ${Math.round(med(w.net))} 中落 ${pc(w.fall / w.net.length)}`).join(" · "));
console.log("顶层稀有事件（人生数）：" + Object.entries(TEX).map(([k, v]) => `${k} ${v}`).join(" · "));
// 弹性：log(43–47 岁平均收入) 对 log(家庭人均收入)
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const xy = rows.filter((r) => r.inc > 0.5 && r.famInc > 0).map((r) => [Math.log(r.famInc), Math.log(r.inc)]);
const mx = mean(xy.map((v) => v[0])), my = mean(xy.map((v) => v[1]));
const ige = xy.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0) / xy.reduce((s, [x]) => s + (x - mx) ** 2, 0);
// 流动：出生五等份（D1–2 … D9–10）→ 43–47 岁收入五等份
const sorted = rows.map((r) => r.inc).sort((a, b) => a - b), cut = [0.2, 0.4, 0.6, 0.8].map((q) => sorted[Math.floor(q * sorted.length)]);
const qOf = (v) => cut.filter((c) => v >= c).length, MX = Array.from({ length: 5 }, () => Array(5).fill(0));
rows.forEach((r) => MX[Math.min(4, Math.floor(r.famPct / 20))][qOf(r.inc + Math.random() * 1e-9)]++);
console.log("各档 43–47 岁年收入几何均值（万）：" + Array.from({ length: 10 }, (_, d) => { const a = rows.filter((r) => r.d === d && r.inc > 0.5); return `D${d + 1} ${Math.exp(mean(a.map((r) => Math.log(r.inc)))).toFixed(1)}`; }).join(" · ") + " · 家庭人均几何均值 " + Array.from({ length: 10 }, (_, d) => { const a = rows.filter((r) => r.d === d); return Math.round(Math.exp(mean(a.map((r) => Math.log(r.famInc)))) / 100) / 10 + "k"; }).join(" "));
console.log(`\n代际收入弹性（log-log，43–47 岁平均年收入对家庭人均收入，n=${xy.length}）≈ ${ige.toFixed(3)}`);
console.log("流动矩阵（行：出生五等份；列：43–47 岁收入五等份；行内 %）");
MX.forEach((row, i) => { const s = row.reduce((a, b) => a + b, 0); console.log(`  Q${i + 1}`, row.map((v) => ((v / s) * 100).toFixed(1).padStart(5)).join(" "), ` n=${s}`); });
const b2t = MX[0][4] / MX[0].reduce((a, b) => a + b, 0);
console.log(`底层五分之一 → 顶层五分之一：${pc(b2t)}`);

// 省份
const big = Object.entries(prov).sort((a, b) => b[1].b - a[1].b);
const showP = (k, lbl) => { const L = big.filter(([, v]) => v.n >= 60).map(([n, v]) => [n, v[k] / v.n, v.n]).sort((a, b) => b[1] - a[1]); console.log(`\n${lbl}（样本 ≥ 60 的省，由高到低）`); console.log("  " + L.map(([n, r, c]) => `${n} ${pc(r)}(${c})`).join(" · ")); return L; };
const g = showP("gk", "考公（尝试过）"), b = showP("boss", "创业（做过老板）"), o = showP("out", "外出务工（离开本省打工）");
const LARGE = big.slice(0, 10).map(([n]) => n);
console.log(`\n出生人数前十的大省：${LARGE.join(" ")}`);
console.log(`  考公在大省里最高：${g.filter(([n]) => LARGE.includes(n))[0][0]}`);
console.log(`  创业前三：${b.slice(0, 3).map((x) => x[0]).join(" ")}`);
console.log(`  外出务工前三：${o.slice(0, 3).map((x) => x[0]).join(" ")}`);

// 回归
console.log(`\n情书 id ${IDS.size}/99 · 认不出 ${unknownId} · 同生重复 ${repeatId} · 槽位未填 ${slotLeft} · 婚后收到的信 ${wedLetters} · 写信人错配的人生 ${fail.length ? "见下" : 0}`);
fail.forEach((f) => console.log("  FAIL " + f));
console.log(`出轨：你被诱惑 ${AF.tempt} 次 · 伴侣出轨 ${AF.sp} 次（比值 ${(AF.tempt / AF.sp).toFixed(2)}）· 出轨导致的离婚 ${AF.div}（${pc(AF.livesDiv / N)} 的人生）`);
// 婚姻：50 岁时从未结婚（只算活到 50 岁的人）· 30 岁前结过婚（只算活到 30 岁的人）· 初婚年龄中位数
{
  const nv = (a) => { const b = a.filter((r) => r.a50); return b.length ? `${pc(b.filter((r) => r.fw == null || r.fw > 50).length / b.length)} (n=${b.length})` : "–"; };
  const by30 = (a) => { const b = a.filter((r) => r.a30); return pc(b.filter((r) => r.fw != null && r.fw <= 30).length / b.length); };
  const mfa = (a) => med(a.filter((r) => r.fw != null).map((r) => r.fw + Math.random() - 0.5)).toFixed(1);
  const M_ = MAR.filter((r) => r.m), W_ = MAR.filter((r) => !r.m);
  console.log("\n== 婚姻 ==");
  console.log(`50 岁从未结婚：全体 ${nv(MAR)} · 男 ${nv(M_)} · 女 ${nv(W_)}`);
  console.log(`  城乡×性别：城镇男 ${nv(M_.filter((r) => r.u))} · 农村男 ${nv(M_.filter((r) => !r.u))} · 城镇女 ${nv(W_.filter((r) => r.u))} · 农村女 ${nv(W_.filter((r) => !r.u))}`);
  ["初中及以下", "高中/专科", "本科", "硕士/985+"].forEach((e) => console.log(`  ${e.padEnd(6, "　")} 男 ${nv(M_.filter((r) => r.eg === e))} · 女 ${nv(W_.filter((r) => r.eg === e))}`));
  console.log(`  农村男 L1–L2 初中及以下 ${nv(M_.filter((r) => !r.u && r.d <= 1 && r.eg === "初中及以下"))} · 农村男 L1–L2 ${nv(M_.filter((r) => !r.u && r.d <= 1))} · 城镇男本科+ ${nv(M_.filter((r) => r.u && (r.eg === "本科" || r.eg === "硕士/985+")))}`);
  console.log(`  城镇女 硕士/985+ ${nv(W_.filter((r) => r.u && r.eg === "硕士/985+"))} · 城镇女 L4+ 本科+ ${nv(W_.filter((r) => r.u && r.d >= 3 && (r.eg === "本科" || r.eg === "硕士/985+")))}`);
  console.log(`30 岁前结过婚：全体 ${by30(MAR)} · 男 ${by30(M_)} · 女 ${by30(W_)}`);
  console.log(`初婚年龄中位数：全体 ${mfa(MAR)} · 男 ${mfa(M_)} · 女 ${mfa(W_)} · 北京/上海 ${mfa(MAR.filter((r) => r.p === "北京" || r.p === "上海"))} · 本科+ ${mfa(MAR.filter((r) => r.eg === "本科" || r.eg === "硕士/985+"))} · 农村 ${mfa(MAR.filter((r) => !r.u))} · 城镇 ${mfa(MAR.filter((r) => r.u))}`);
  const al = MAR.filter((r) => r.a50);
  console.log(`主动不婚（活到 50 岁的人里）${pc(al.filter((r) => r.nm).length / al.length)} · 催婚事件 ${MAR.reduce((s, r) => s + r.cuihun, 0)} 次 · 剩男事件 ${MAR.reduce((s, r) => s + r.sheng, 0)} 次`);
}
if (process.env.JSON) fs.writeFileSync(process.env.JSON, JSON.stringify({ dec, cnt, ige, MX, prov, IDS: [...IDS], AF, errN, ERR: [...ERR], fail, wedLetters, unknownId, repeatId, slotLeft, MAR, N }));
