// 十级家庭（按家庭月收入）拟合城/乡人均收入梯子：node work/fit10.js [iters]
// ln Q(z) = ln(med) + z·(z<0 ? sL : sH) + kt·max(0, z−zt)² − kb·max(0, −z−zb)² + kt2·max(0, z−zt2)²
// 目标：出生加权混合 → 十级份额 15 / 35 / 30 / 13 / 6 / 0.9 / 0.1 / 0.02 / 0.002 / 0.001 %；
// 中段分位点 P10–P80（国家统计局 2024 折算）；城乡中位数 19,605 / 49,302（强）、均值、五等份均值（弱）
const fs = require("fs");
const html = fs.readFileSync(__dirname + "/../index.html", "utf8");
const RAW = html.match(/const RAW = "([^"]+)"[\s\S]*?\+ ";([^"]+)"/);
const PROV = (RAW[1] + ";" + RAW[2]).split(";").map((r) => { const [n, b, le, u] = r.split(","); return { n, b: +b, u: +u }; });
const SAR = (p) => p.n === "香港" || p.n === "澳门";
const UR = { 北京: [92000, 40000], 上海: [94000, 45000], 浙江: [80000, 43000], 江苏: [68000, 32000], 天津: [57000, 31000], 广东: [62000, 26000], 福建: [60000, 28000], 山东: [54000, 25000], 内蒙古: [52000, 23000], 辽宁: [49000, 23000], 重庆: [49000, 22000], 湖北: [47000, 23000], 安徽: [50000, 23000], 湖南: [50000, 22000], 江西: [48000, 23000], 海南: [45000, 22000], 河北: [46000, 22000], 四川: [47000, 21000], 陕西: [46000, 18000], 宁夏: [43000, 19000], 山西: [43000, 19000], 河南: [41000, 21000], 吉林: [39000, 21000], 黑龙江: [38000, 21000], 西藏: [53000, 21000], 广西: [44000, 19500], 新疆: [43000, 19500], 云南: [46000, 17500], 青海: [43000, 16500], 贵州: [44000, 15500], 甘肃: [42000, 14500] };
const FX = { 台湾: [1.55, 2.6], 香港: [1.7, 1.7], 澳门: [1.9, 1.9] };
const fOf = (p, urban) => (FX[p.n] ? FX[p.n][urban ? 0 : 1] : UR[p.n][urban ? 0 : 1] / (urban ? 54188 : 23119));
const ub = (p) => (SAR(p) ? 1 : Math.max(0, p.u - 5) / 100);
const cells = []; PROV.forEach((p) => { const u = ub(p); if (u > 0) cells.push({ p, g: 1, w: p.b * u, lf: Math.log(fOf(p, 1)) }); if (u < 1) cells.push({ p, g: 0, w: p.b * (1 - u), lf: Math.log(fOf(p, 0)) }); });
const W = cells.reduce((s, c) => s + c.w, 0); cells.forEach((c) => (c.w /= W));
const WG = [0, 1].map((g) => cells.filter((c) => c.g === g).reduce((s, c) => s + c.w, 0));
const Phi = (z) => { const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2), p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; };
const lq = (P, z) => P[0] + z * (z < 0 ? P[1] : P[2]) + (z > P[3] ? P[4] * (z - P[3]) ** 2 : 0) - (z < -P[5] ? P[6] * (z + P[5]) ** 2 : 0) + (z > P[7] ? P[8] * (z - P[7]) ** 2 : 0);
const ZM = 5;
const zAt = (P, l) => { let lo = -ZM, hi = ZM; if (l <= lq(P, lo)) return lo; if (l >= lq(P, hi)) return hi; for (let i = 0; i < 44; i++) { const m = (lo + hi) / 2; lq(P, m) < l ? (lo = m) : (hi = m); } return (lo + hi) / 2; };
const NZ = 1500, ZG = Array.from({ length: NZ }, (_, i) => -ZM + (2 * ZM * (i + 0.5)) / NZ), ZW = ZG.map((z) => Math.exp(-z * z / 2)), ZS = ZW.reduce((a, b) => a + b, 0); ZW.forEach((v, i) => (ZW[i] = v / ZS));
// 十级分界（人均年收入）= 家庭月收入 × 12 / 2.8；第 8 级起按家庭年收入 1,000 万 / 5,000 万 / 1 亿
const LV = [3000, 8000, 15000, 30000, 100000, 300000, 833333].map((m) => (m * 12) / 2.8).concat([5e7 / 2.8, 1e8 / 2.8]);
const LT = [0.15, 0.35, 0.30, 0.13, 0.0598, 0.009, 0.001, 0.0002, 0.00002, 0.00001];
const AT = LT.map((_, k) => LT.slice(k + 1).reduce((a, b) => a + b, 0)).slice(0, 9); // above(LV[k])
const MID = [[10, 9000], [20, 16000], [30, 22000], [40, 28300], [50, 34700], [60, 42000], [70, 51000], [80, 65000]];
const NBS = { 0: { med: 19605, mean: 23119, qm: [5500, 14000, 20000, 28500, 53000] }, 1: { med: 49302, mean: 54188, qm: [18003, 34600, 49000, 68000, 115000] } };
const TH = LV.concat(MID.map((m) => m[1])).map(Math.log);
function stats(PP, full) {
  const above = TH.map(() => 0), abR = TH.map(() => 0);
  cells.forEach((c) => { const P = PP[c.g]; TH.forEach((t, k) => { const v = c.w * (1 - Phi(zAt(P, t - c.lf))); above[k] += v; if (!c.g) abR[k] += v; }); });
  const G = [0, 1].map((g) => {
    const pts = []; cells.filter((c) => c.g === g).forEach((c) => ZG.forEach((z, i) => pts.push([Math.exp(lq(PP[g], z) + c.lf), (c.w / WG[g]) * ZW[i]])));
    pts.sort((a, b) => a[0] - b[0]);
    let cw = 0, k = 0; const qm = [0, 0, 0, 0, 0]; let med = 0, mean = 0;
    for (const [v, w] of pts) { const q0 = cw; cw += w; mean += v * w; if (q0 < 0.5 && cw >= 0.5) med = v; qm[Math.min(4, Math.floor(((q0 + cw) / 2) * 5))] += (v * w) / 0.2; }
    return { med, mean, qm };
  });
  return { above, abR, G };
}
function loss(x) {
  const PP = [x.slice(0, 9), x.slice(9)];
  for (const P of PP) if (P[1] <= 0.05 || P[2] <= 0.05 || P[4] < 0 || P[6] < 0 || P[3] < 0 || P[5] < 0 || P[8] < 0 || P[7] < P[3]) return 1e12;
  const S = stats(PP); let e = 0;
  const lv = LT.map((_, k) => (k ? S.above[k - 1] : 1) - (k < 9 ? S.above[k] : 0));
  for (let k = 0; k < 4; k++) e += ((lv[k] - LT[k]) / 0.0025) ** 2;
  e += ((lv[4] - LT[4]) / 0.002) ** 2;
  for (let k = 5; k < 10; k++) e += (Math.log((lv[k] + 1e-9) / LT[k]) / 0.08) ** 2;
  MID.forEach(([q], i) => (e += ((S.above[9 + i] - (1 - q / 100)) / 0.015) ** 2));
  [0, 1].forEach((g) => { const s = S.G[g], n = NBS[g]; e += (Math.log(s.med / n.med) / 0.0025) ** 2 + (Math.log(s.mean / n.mean) / 0.25) ** 2; s.qm.forEach((v, i) => (e += (Math.log(v / n.qm[i]) / 0.15) ** 2)); });
  // 农村占第 5 级及以上约 2.5%，占第 6 级及以上不到 0.5%
  e += ((S.abR[3] / S.above[3] - 0.025) / 0.005) ** 2 + (Math.max(0, S.abR[4] / S.above[4] - 0.005) / 0.002) ** 2;
  return e;
}
const OUT = __dirname + "/fit10.json";
let x = fs.existsSync(OUT) && !process.env.FRESH ? JSON.parse(fs.readFileSync(OUT)).x
  : [Math.log(20992), 1.0391, 0.6598, 1.8, 0, 0.4371, 0.5312, 3.5, 0, Math.log(51729), 0.7344, 0.7531, 0.8988, 0.3133, 0.3937, 1.3844, 3.2, 0.2];
let best = loss(x), step = +process.env.STEP || 0.05;
for (let it = 0; it < (+process.argv[2] || 40) && step > 2e-4; it++) {
  let imp = false;
  for (let i = 0; i < x.length; i++) for (const d of [step, -step]) { const y = [...x]; y[i] += d; const l = loss(y); if (l < best) { best = l; x = y; imp = true; } }
  if (!imp) step /= 2;
  if (it % 5 === 0) { console.log("it", it, "loss", best.toFixed(2), "step", step); fs.writeFileSync(OUT, JSON.stringify({ x })); }
}
fs.writeFileSync(OUT, JSON.stringify({ x }));
const PP = [x.slice(0, 9), x.slice(9)], S = stats(PP);
const lv = LT.map((_, k) => (k ? S.above[k - 1] : 1) - (k < 9 ? S.above[k] : 0));
console.log("loss", best.toFixed(2));
console.log("十级 %  实际 / 目标");
lv.forEach((v, k) => console.log(`  L${k + 1}`, (v * 100).toFixed(4), "/", (LT[k] * 100).toFixed(4), "· 每万", (v * 1e4).toFixed(2)));
console.log("中段分位 above 实际/目标", MID.map(([q], i) => `P${q} ${(1 - S.above[9 + i]) * 100 | 0}`).join(" "));
console.log("农村占 L5+", (S.abR[3] / S.above[3] * 100).toFixed(2) + "% · L6+", (S.abR[4] / S.above[4] * 100).toFixed(3) + "%");
["农村", "城镇"].forEach((n, g) => { const s = S.G[g]; console.log(n, "中位", Math.round(s.med), "均值", Math.round(s.mean), "五等份均值", s.qm.map(Math.round).join(" / ")); });
console.log("参数", JSON.stringify(PP.map((P) => [Math.round(Math.exp(P[0])), ...P.slice(1).map((v) => +v.toFixed(4))])));
