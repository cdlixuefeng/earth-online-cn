// 按学历档统计：23–59 岁平均年收入、45 岁知识、考公通过率。用法：node work/tier.js [N]
const fs = require("fs");
const src = fs.readFileSync(__dirname + "/sim.js", "utf8");
const head = src.slice(0, src.indexOf("const N =")).replace(/^(const|let) /gm, "var ").replace('var fs = require("fs");', "");
eval(head);
const N = +process.argv[2] || 2000, ERR = new Set();
const G = { C9: [], "985": [], "211": [], 普通本科: [], 专科: [], 高中及以下: [] };
const grp = (S) => (S.uni === "C9" || S.uni === "985" || S.uni === "211" || S.uni === "普通本科" || S.uni === "专科" ? S.uni : "高中及以下");
const gk = {}; for (const k in G) gk[k] = [0, 0];
for (let L = 0; L < N; L++) {
  try { T.birth(); } catch (e) {}
  try { $("b-start").onclick(); } catch (e) { ERR.add("start " + e.message); }
  $("modal").hidden = true; $("reflect").hidden = true; $("moment").hidden = true;
  let guard = 0, inc = 0, yrs = 0, iq45 = null;
  while (!T.S.dead && guard++ < 400) {
    try {
      if (!$("modal").hidden) { const o = $("m-opts").children; o[Math.floor(Math.random() * o.length)].onclick(); continue; }
      if (!$("reflect").hidden) { $("r-go").onclick(); continue; }
      if (!$("moment").hidden) { const o = $("mo-opts").children; if (!$("mo-opts").hidden && o.length) o[0].onclick(); else $("mo-go").onclick(); continue; }
      if (process.argv[3] === "random") { const k = T.stage(T.S.age + 1); T.S.pick = k ? T.focus()[k][Math.floor(Math.random() * T.focus()[k].length)][0] : "均衡"; }
      T.tick();
    } catch (e) { ERR.add(e.message + " " + (e.stack || "").split("\n")[1]); $("modal").hidden = true; T.unblock(); }
    const S = T.S;
    if (S.age >= 23 && S.age <= 59 && !S.dead) { inc += S.yinc || 0; yrs++; }
    if (S.age === 45) iq45 = S.iq;
  }
  const S = T.S, g = grp(S);
  if (yrs >= 30) G[g].push({ inc: inc / yrs, iq: iq45 });
  if (S.gkTry) { gk[g][0]++; if (S.gkPass) gk[g][1]++; }
}
const med = (a) => { const s = a.filter((v) => v != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
console.log(`lives ${N}, errors ${ERR.size}`); ERR.forEach((e) => console.log("  ERR", e));
const base = med(G.高中及以下.map((r) => r.inc));
for (const k in G) {
  const r = G[k], mi = med(r.map((x) => x.inc));
  console.log(`${k.padEnd(6)} n=${String(r.length).padEnd(5)} 收入中位 ${mi.toFixed(1)} 万 (×${(mi / base).toFixed(2)})  45岁知识中位 ${med(r.map((x) => x.iq))}  考公 ${gk[k][1]}/${gk[k][0]} = ${gk[k][0] ? ((100 * gk[k][1]) / gk[k][0]).toFixed(0) : "-"}%`);
}
