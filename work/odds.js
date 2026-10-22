// 审计：node work/odds.js [N]
// 1) 性别×城乡四格（每 10,000 个本省新生儿）· 2) 家庭档位 X 表（每 10,000 个本省城/乡新生儿）· 3) 农村在第 10 档、前 1% 的占比
// 4) 全国十等分检查（解析）· 5) 家庭卡在 375×667 下的高度估算（按字宽折行；不是浏览器实测）
const src = require("fs").readFileSync(__dirname + "/verify.js", "utf8");
const head = src.slice(0, src.indexOf("let T;"));
eval(head.replace(/^const /gm, "var "));
let T;
eval(main + "\n;T = { famDist, FAM_NAT, PROV, famOdds, famCell, ODDS_NAT, birthCells, uOf, boyP, srb, B_ALL, birth: () => birth(), famReveal, get S() { return S; } };");
const P = (n) => T.PROV.find((q) => q.n === n), r1w = (v) => (v * 1e4 < 1 ? "<1" : Math.round(v * 1e4).toLocaleString("en-US"));

console.log("== 1) 性别 × 城乡：每 10,000 个本省新生儿里约 X 个 ==");
console.log("省     性别比  城镇占比  城镇男孩 城镇女孩 农村男孩 农村女孩");
["甘肃", "河南", "广东", "上海"].forEach((n) => { const p = P(n), c = T.birthCells(p); console.log(`${n}   ${T.srb(p).toFixed(1).padStart(6)}  ${(T.uOf(p) * 100).toFixed(1).padStart(6)}%  ` + c.map((x) => r1w(x[2]).padStart(8)).join(" ")); });
const natB = T.PROV.reduce((s, p) => s + (p.b / T.B_ALL) * T.boyP(p), 0), natU = T.PROV.reduce((s, p) => s + (p.b / T.B_ALL) * T.uOf(p), 0);
console.log(`全国（出生加权）：男孩 ${(natB * 100).toFixed(2)}%（性别比 ${(natB / (1 - natB) * 100).toFixed(1)}）· 城镇新生儿 ${(natU * 100).toFixed(1)}%`);

console.log("\n== 2) 家庭档位：每 10,000 个本省城/乡新生儿里约 X 个 ==");
console.log("格子           D1     D5     D8    D10   前1%  （前0.1%）");
const rowsX = [["甘肃", 0], ["河南", 0], ["四川", 1], ["广东", 1], ["上海", 1], ["北京", 1]];
rowsX.forEach(([n, u]) => { const o = T.famOdds(P(n), !!u); console.log((n + (u ? "城镇" : "农村")).padEnd(10, "　").slice(0, 6) + "  " + [o.dec[0], o.dec[4], o.dec[7], o.dec[9], o.top[2] + o.top[3], o.top[3]].map((v) => r1w(v).padStart(6)).join(" ")); });
console.log("全国（定义）     1,000  1,000  1,000  1,000    100     10");

console.log("\n== 3) 农村在顶层的占比（解析，出生加权）==");
let d10 = 0, d10r = 0, t1 = 0, t1r = 0, t01 = 0, t01r = 0;
T.PROV.forEach((p) => [1, 0].forEach((u) => { const w = (p.b / T.B_ALL) * (u ? T.uOf(p) : 1 - T.uOf(p)); if (!w) return; const o = T.famOdds(p, !!u); d10 += w * o.dec[9]; t1 += w * (o.top[2] + o.top[3]); t01 += w * o.top[3]; if (!u) { d10r += w * o.dec[9]; t1r += w * (o.top[2] + o.top[3]); t01r += w * o.top[3]; } }));
console.log(`第 10 档里农村 ${(d10r / d10 * 100).toFixed(2)}% · 前 1% 里农村 ${(t1r / t1 * 100).toFixed(3)}% · 前 0.1% 里农村 ${(t01r / t01 * 100).toFixed(4)}%`);

console.log("\n== 4) 全国十等分（解析，出生加权混合）==");
const dec = [...T.FAM_NAT.slice(0, 9), T.FAM_NAT.slice(9).reduce((a, b) => a + b, 0)];
console.log(dec.map((v, i) => `D${i + 1} ${(v * 100).toFixed(2)}`).join(" · "), "· 最大偏差", (Math.max(...dec.map((v) => Math.abs(v - 0.1))) * 100).toFixed(2), "个百分点（容差 1.5）");
console.log("第 10 档内：富裕 / 高净值 / 豪门 %", T.FAM_NAT.slice(10).map((v) => (v * 100).toFixed(3)).join(" / "));

// 5) 尺寸估算：375 宽，gutter 16，卡片边框 1.5 + 内边距 16
const N = +process.argv[2] || 3000, $ = (id) => document.getElementById(id);
const strip = (h) => h.replace(/<br \/>/g, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ");
const wch = (c, fs) => (/[\u3000-\u9fff\uff00-\uffef]/.test(c) ? fs : c === " " ? 0.28 * fs : /[0-9]/.test(c) ? 0.6 * fs : /[–—]/.test(c) ? 0.6 * fs : 0.55 * fs);
const lines = (txt, fs, width) => txt.split("\n").reduce((n, para) => { let l = 1, x = 0; for (const c of para) { const w = wch(c, fs); if (x + w > width) { l++; x = w; } else x += w; } return n + l; }, 0);
const INNER = 375 - 32 - 3 - 32, ODDS_W = INNER - 3 - 24, PRE = 12 + 8 + 1 + 18.2 + 2 + 28.6 + 8;
let worst = 0, worstH = "", over = 0; const hs = [], samples = [];
for (let i = 0; i < N; i++) {
  try { T.birth(); } catch (e) { if (!/classList|getAttribute|undefined/.test(e.message)) throw e; }
  T.famReveal();
  const lad = $("f-lad").innerHTML, facts = $("f-facts").innerHTML, odds = $("f-odds").innerHTML;
  let h = PRE + 27 + 4 * 8 + 44;
  h += lines(strip($("f-label").textContent), 22, INNER) * 26.4;
  const cap = lad.match(/x-lad__cap">([\s\S]*?)<\/p>/)[1], me = lad.match(/x-lad__me">([\s\S]*?)<\/p>/)[1];
  h += lines(strip(cap), 12, INNER) * 15.6 + 4 + 36.6 + 4 + (lad.includes("x-lad__top") ? 20.4 + 4 : 0) + lines(strip(me), 14, INNER) * 20.3;
  const rows = [...facts.matchAll(/<dd>([\s\S]*?)<\/dd>/g)].map((m) => lines(strip(m[1]), 14, INNER - 70 - 12));
  h += rows.reduce((a, b) => a + b * 17.5, 0) + (rows.length - 1) * 4;
  const ps = [...odds.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => strip(m[1]));
  h += 19 + 20.25 + 4 + lines(ps[0], 14, ODDS_W) * 20.3 + 2 + lines(ps[1], 14, ODDS_W) * 20.3 + 4 + lines(ps[2], 14, ODDS_W) * 20.3 + 4 + lines(ps[3], 12, ODDS_W) * 15.6 + 5;
  hs.push(h); if (h > 667) over++;
  if (samples.length < 4 && (T.S.fam >= 9 || !T.S.urban)) samples.push(strip(me).replace(/\n/g, " / ") + " | " + ps[0] + " | " + ps[1]);
  if (h > worst) { worst = h; worstH = `${T.S.p.n}${T.S.urban ? "城镇" : "农村"} · ${strip($("f-label").textContent)} · fam ${T.S.fam} · ${rows.length} 行`; }
}
hs.sort((a, b) => a - b);
console.log(`\n== 5) 家庭卡 375×667 估算（${N} 次）：中位 ${hs[N >> 1].toFixed(0)}px · 95% ${hs[Math.floor(N * 0.95)].toFixed(0)}px · 最高 ${worst.toFixed(0)}px（${worstH}）· 超出 667：${over}`);
samples.forEach((s) => console.log("  样例：" + s));
