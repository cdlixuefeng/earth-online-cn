// 人情 + 知识检查：node work/rel.js [N] [default|random]
const src = require("fs").readFileSync(__dirname + "/sim.js", "utf8");
const setup = src.slice(0, src.indexOf("const N =")).replace(/__dirname/g, JSON.stringify(__dirname)).replace(/^(const|let) /gm, "var ");
eval(setup);
const N = +process.argv[2] || 2000, MODE = process.argv[3] || "default";
if (process.env.SOFT) $("soft").checked = true;
const ERR = new Map(); const err = (e) => { const k = String(e && e.stack ? e.stack.split("\n").slice(0, 2).join(" | ") : e); ERR.set(k, (ERR.get(k) || 0) + 1); };
const r45 = [], g45 = { uni: [], hs: [], zk: [] }, circ = { Rf: [], Rp: [], Rw: [] };
let ever90 = 0, streak = 0, dep = 0, grief = 0;
for (let L = 0; L < N; L++) {
  try { T.birth(); } catch (e) {}
  try { $("b-start").onclick(); } catch (e) { err(e); }
  $("modal").hidden = true; $("reflect").hidden = true; $("moment").hidden = true;
  let guard = 0, mx = 0, run = 0, best = 0;
  while (!T.S.dead && guard++ < 400) {
    try {
      if (!$("modal").hidden) { const o = $("m-opts").children; o[Math.floor(Math.random() * o.length)].onclick(); continue; }
      if (!$("reflect").hidden) { $("r-go").onclick(); continue; }
      if (!$("moment").hidden) { const o = $("mo-opts").children; if (!$("mo-opts").hidden && o.length) o[0].onclick(); else $("mo-go").onclick(); continue; }
      if (MODE === "random") { const k = T.stage(T.S.age + 1); T.S.pick = k ? T.focus()[k][Math.floor(Math.random() * T.focus()[k].length)][0] : "均衡"; }
      T.tick();
    } catch (e) { err(e); $("modal").hidden = true; $("moment").hidden = true; T.unblock(); continue; }
    const S = T.S; if (S.dead) break;
    for (const k of ["rel", "Rf", "Rp", "Rw", "G", "iq", "joy", "hp"]) if (!Number.isFinite(S[k])) err("non-finite " + k);
    mx = Math.max(mx, S.iq);
    run = S.rel >= 100 ? run + 1 : 0; best = Math.max(best, run);
    if (S.age === 45) { r45.push(S.rel); circ.Rf.push(S.Rf); circ.Rp.push(S.Rp); circ.Rw.push(S.Rw); (S.edu >= 1.3 ? g45.uni : S.uni === "专科" ? g45.zk : g45.hs).push(S.iq); }
  }
  if (mx >= 90) ever90++;
  if (best >= 5) streak++;
  if (T.S.dep) dep++;
  if (T.S.G > 0 || T.S.done.parent_pass || T.S.done.l_widow || T.S.done.gp_pass) grief++;
}
const pc = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))]) : "-"; };
const sd = (a) => { const m = a.reduce((s, v) => s + v, 0) / a.length; return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length).toFixed(1); };
const pct = (v) => ((v / N) * 100).toFixed(1) + "%";
console.log(`lives ${N} (${MODE}${process.env.SOFT ? ", soft" : ""}) errors ${[...ERR.values()].reduce((s, v) => s + v, 0)}`);
for (const [k, v] of ERR) console.log("  ERR x" + v + " " + k.slice(0, 300));
console.log(`人情@45 p10 ${pc(r45, 0.1)} p50 ${pc(r45, 0.5)} p90 ${pc(r45, 0.9)} sd ${sd(r45)}  | 家人 p50 ${pc(circ.Rf, 0.5)} 朋友 p50 ${pc(circ.Rp, 0.5)} 同事 p50 ${pc(circ.Rw, 0.5)}`);
console.log(`  sd 家人 ${sd(circ.Rf)} 朋友 ${sd(circ.Rp)} 同事 ${sd(circ.Rw)}  p10/p90 家人 ${pc(circ.Rf, 0.1)}/${pc(circ.Rf, 0.9)} 朋友 ${pc(circ.Rp, 0.1)}/${pc(circ.Rp, 0.9)} 同事 ${pc(circ.Rw, 0.1)}/${pc(circ.Rw, 0.9)}`);
console.log(`人情=100 连续≥5年 ${pct(streak)}  知识曾≥90 ${pct(ever90)}  抑郁事件 ${pct(dep)}`);
console.log(`知识@45 p50 本科+ ${pc(g45.uni, 0.5)} 专科 ${pc(g45.zk, 0.5)} 高中及以下 ${pc(g45.hs, 0.5)}`);
