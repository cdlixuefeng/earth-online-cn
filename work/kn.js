// 知识模型检查：node work/kn.js [N] [mode]，复用 sim.js 的无头环境
const src = require("fs").readFileSync(__dirname + "/sim.js", "utf8");
const setup = src.slice(0, src.indexOf("const N =")).replace(/__dirname/g, JSON.stringify(__dirname)).replace(/^(const|let) /gm, "var ");
eval(setup);
const N = +process.argv[2] || 2000, MODE = process.argv[3] || "default";
const g45 = { uni: [], hs: [], zk: [] }, at70 = [], at85 = [];
const ERR = new Map(); const err = (e) => { const k = String(e && e.stack ? e.stack.split("\n").slice(0, 2).join(" | ") : e); ERR.set(k, (ERR.get(k) || 0) + 1); };
let ever90 = 0, cog3 = 0, ai = 0;
for (let L = 0; L < N; L++) {
  try { T.birth(); } catch (e) {} // 抽签动画在无头环境里没有 DOM，S 已建好
  try { $("b-start").onclick(); } catch (e) { err(e); }
  $("modal").hidden = true; $("reflect").hidden = true; $("moment").hidden = true;
  let guard = 0, mx = 0;
  while (!T.S.dead && guard++ < 400) {
    try {
      if (!$("modal").hidden) { const o = $("m-opts").children; o[Math.floor(Math.random() * o.length)].onclick(); continue; }
      if (!$("reflect").hidden) { $("r-go").onclick(); continue; }
      if (!$("moment").hidden) { const o = $("mo-opts").children; if (!$("mo-opts").hidden && o.length) o[0].onclick(); else $("mo-go").onclick(); continue; }
      if (MODE === "learn") { const k = T.stage(T.S.age + 1); T.S.pick = k === "kid" ? "学习" : k === "adult" ? "自我提升" : k === "old" ? "老年大学" : "均衡"; }
      if (MODE === "random") { const k = T.stage(T.S.age + 1); T.S.pick = k ? T.focus()[k][Math.floor(Math.random() * T.focus()[k].length)][0] : "均衡"; }
      T.tick();
    } catch (e) { err(e); $("modal").hidden = true; $("moment").hidden = true; T.unblock(); continue; }
    const S = T.S; if (S.dead) break;
    if (!Number.isFinite(S.iq) || !Number.isFinite(S.Ka) || !Number.isFinite(S.Kb)) err("non-finite iq");
    mx = Math.max(mx, S.iq);
    if (S.age === 45) (S.edu >= 1.3 ? g45.uni : S.uni === "专科" ? g45.zk : g45.hs).push(S.iq);
    if (S.age === 70) at70.push(S.iq);
    if (process.env.TR && [12, 18, 22, 30, 45, 60, 70, 80, 85].includes(S.age)) ((global.TRK ||= {})[S.age] ||= []).push([S.Kb, S.Ka]);
    if (S.age === 85) at85.push(S.iq);
  }
  if (mx >= 90) ever90++;
  (global.MX ||= []).push(mx);
  if ((T.S.cog || 0) >= 3) cog3++;
}
const pc = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : "-"; };
const row = (n, a) => `${n} n=${a.length} p10 ${pc(a, 0.1)} p50 ${pc(a, 0.5)} p90 ${pc(a, 0.9)}`;
console.log(`lives ${N} (${MODE}) errors ${[...ERR.values()].reduce((s, v) => s + v, 0)}`);
for (const [k, v] of ERR) console.log("  ERR x" + v + " " + k.slice(0, 300));
console.log("@45 " + row("本科及以上", g45.uni)); console.log("@45 " + row("专科", g45.zk)); console.log("@45 " + row("高中及以下", g45.hs));
console.log(`ever>=90 ${((ever90 / N) * 100).toFixed(1)}%  median@70 ${pc(at70, 0.5)} (n=${at70.length})  median@85 ${pc(at85, 0.5)} (n=${at85.length})  阿尔茨海默 ${((cog3 / N) * 100).toFixed(1)}%`);
console.log(`lifetime max: p50 ${pc(MX, 0.5)} p95 ${pc(MX, 0.95)} p99 ${pc(MX, 0.99)} max ${Math.max(...MX)}`);
if (global.TRK) for (const a in TRK) { const v = TRK[a]; console.log(a, "Kb", pc(v.map(x=>x[0]),0.5).toFixed(1), "Ka", pc(v.map(x=>x[1]),0.5).toFixed(1), "Ka p90", pc(v.map(x=>x[1]),0.9).toFixed(1)); }
