// 拟合城/乡人均收入分布（两段对数正态 + 尾部弯曲），使出生加权混合 ≈ 全国十等分：node work/fit.js [iters]
// ln Q(z) = ln(med) + z·(z<0 ? sL : sH) + kt·max(0, z−zt)² − kb·max(0, −z−zb)²，z = Φ⁻¹(q)
const fs = require("fs");
const html = fs.readFileSync(__dirname + "/../index.html", "utf8");
const RAW = html.match(/const RAW = "([^"]+)"[\s\S]*?\+ ";([^"]+)"/);
const PROV = (RAW[1] + ";" + RAW[2]).split(";").map((r) => { const [n, b, le, u] = r.split(","); return { n, b: +b, u: +u }; });
const SAR = (p) => p.n === "香港" || p.n === "澳门";
const DEC_P = [[0, 2500], [10, 4000], [20, 10700], [30, 17900], [40, 25700], [50, 34700], [60, 45600], [70, 59300], [80, 78700], [90, 117000], [95, 170000], [99, 424000], [99.9, 1580000], [100, 6000000]];
const incAt = (q) => { for (let i = 1; i < DEC_P.length; i++) { const [q0, v0] = DEC_P[i - 1], [q1, v1] = DEC_P[i]; if (q <= q1) return v0 * Math.pow(v1 / v0, (q - q0) / (q1 - q0)); } return 6e6; };
const UR = { 北京: [92000, 40000], 上海: [94000, 45000], 浙江: [80000, 43000], 江苏: [68000, 32000], 天津: [57000, 31000], 广东: [62000, 26000], 福建: [60000, 28000], 山东: [54000, 25000], 内蒙古: [52000, 23000], 辽宁: [49000, 23000], 重庆: [49000, 22000], 湖北: [47000, 23000], 安徽: [50000, 23000], 湖南: [50000, 22000], 江西: [48000, 23000], 海南: [45000, 22000], 河北: [46000, 22000], 四川: [47000, 21000], 陕西: [46000, 18000], 宁夏: [43000, 19000], 山西: [43000, 19000], 河南: [41000, 21000], 吉林: [39000, 21000], 黑龙江: [38000, 21000], 西藏: [53000, 21000], 广西: [44000, 19500], 新疆: [43000, 19500], 云南: [46000, 17500], 青海: [43000, 16500], 贵州: [44000, 15500], 甘肃: [42000, 14500] };
const FX = { 台湾: [1.55, 2.6], 香港: [1.7, 1.7], 澳门: [1.9, 1.9] };
const fOf = (p, urban) => (FX[p.n] ? FX[p.n][urban ? 0 : 1] : UR[p.n][urban ? 0 : 1] / (urban ? 54188 : 23119));
const ub = (p) => (SAR(p) ? 1 : (p.u - 5) / 100);
const cells = []; PROV.forEach((p) => { const u = ub(p); if (u > 0) cells.push({ p, g: 1, w: p.b * u, lf: Math.log(fOf(p, 1)) }); if (u < 1) cells.push({ p, g: 0, w: p.b * (1 - u), lf: Math.log(fOf(p, 0)) }); });
const W = cells.reduce((s, c) => s + c.w, 0); cells.forEach((c) => (c.w /= W));
const WG = [0, 1].map((g) => cells.filter((c) => c.g === g).reduce((s, c) => s + c.w, 0));
console.log("城镇新生儿占比", (WG[1] * 100).toFixed(1) + "%");
const Phi = (z) => { const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2), p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; };
const lq = (P, z) => P[0] + z * (z < 0 ? P[1] : P[2]) + (z > P[3] ? P[4] * (z - P[3]) ** 2 : 0) - (z < -P[5] ? P[6] * (z + P[5]) ** 2 : 0) + (z > P[7] ? P[8] * (z - P[7]) ** 2 : 0);
const ZM = 5;
const zAt = (P, l) => { let lo = -ZM, hi = ZM; if (l <= lq(P, lo)) return lo; if (l >= lq(P, hi)) return hi; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; lq(P, m) < l ? (lo = m) : (hi = m); } return (lo + hi) / 2; };
const NZ = 1500, ZG = Array.from({ length: NZ }, (_, i) => -ZM + (2 * ZM * (i + 0.5)) / NZ), ZW = ZG.map((z) => Math.exp(-z * z / 2)), ZS = ZW.reduce((a, b) => a + b, 0); ZW.forEach((v, i) => (ZW[i] = v / ZS));
const TH = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 99.6, 99.9, 99.97].map((q) => Math.log(incAt(q)));
const NBS = { 0: { med: 19605, mean: 23119, qm: [5500, 14000, 20000, 28500, 53000] }, 1: { med: 49302, mean: 54188, qm: [18003, 34600, 49000, 68000, 115000] } };
function stats(PP) {
  const above = TH.map(() => 0), abR = TH.map(() => 0);
  cells.forEach((c) => { const P = PP[c.g]; TH.forEach((t, k) => { const v = c.w * (1 - Phi(zAt(P, t - c.lf))); above[k] += v; if (!c.g) abR[k] += v; }); });
  const G = [0, 1].map((g) => {
    const pts = []; cells.filter((c) => c.g === g).forEach((c) => ZG.forEach((z, i) => pts.push([Math.exp(lq(PP[g], z) + c.lf), (c.w / WG[g]) * ZW[i]])));
    pts.sort((a, b) => a[0] - b[0]);
    let cw = 0, k = 0; const qm = [0, 0, 0, 0, 0], cuts = []; let med = 0, mean = 0;
    for (const [v, w] of pts) { const q0 = cw; cw += w; mean += v * w; if (q0 < 0.5 && cw >= 0.5) med = v; while (k < 4 && cw >= 0.2 * (k + 1)) { cuts.push(v); k++; } qm[Math.min(4, Math.floor(((q0 + cw) / 2) * 5))] += (v * w) / 0.2; }
    return { med, mean, qm, cuts };
  });
  return { above, abR, G };
}
const TA = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.05, 0.01, 0.004, 0.001, 0.0003];
const TOL = +process.env.TOL || 0.004;
function loss(x) {
  const PP = [x.slice(0, 9), x.slice(9)]; PP.forEach((P) => (P[8] = 0, P[7] = 9));
  for (const P of PP) if (P[1] <= 0.05 || P[2] <= 0.05 || P[4] < 0 || P[6] < 0 || P[3] < 0 || P[5] < 0 || P[8] < 0 || P[7] < P[3]) return 1e12;
  const S = stats(PP); let e = 0;
  const dec = TA.slice(0, 9).map((t, k) => (k ? S.above[k - 1] : 1) - S.above[k]).concat([S.above[8]]);
  dec.forEach((d) => (e += ((d - 0.1) / TOL) ** 2));
  S.above.slice(9).forEach((a, k) => (e += (Math.log((a + 1e-7) / TA[k + 9]) / (+process.env.TW || 0.08)) ** 2));
  [0, 1].forEach((g) => { const s = S.G[g], n = NBS[g]; e += (Math.log(s.med / n.med) / 0.01) ** 2 + (Math.log(s.mean / n.mean) / 0.05) ** 2; s.qm.forEach((v, i) => (e += (Math.log(v / n.qm[i]) / 0.12) ** 2)); });
  e += ((S.abR[8] / S.above[8] - 0.025) / 0.004) ** 2 + ((S.abR[10] / S.above[10] - 0.01) / 0.004) ** 2;
  if (process.env.UCAP) { const lo = cells.filter((c) => c.g === 1).reduce((s, c) => s + c.w * Phi(zAt(PP[1], Math.log(4000) - c.lf)), 0) / WG[1]; e += (Math.max(0, lo - +process.env.UCAP) / 0.003) ** 2; }
  return e;
}
let x0 = fs.existsSync(__dirname + "/fit.json") && !process.env.FRESH ? JSON.parse(fs.readFileSync(__dirname + "/fit.json")).x : [Math.log(19605), 0.8, 0.55, 1.5, 0.1, 1.5, 0.2, Math.log(49302), 0.6, 0.55, 1.5, 0.1, 1.5, 0.2];
let x = x0.length === 14 ? [...x0.slice(0, 7), 4, 0, ...x0.slice(7), 3, 0] : x0;
let best = loss(x), step = 0.1;
for (let it = 0; it < (+process.argv[2] || 60) && step > 2e-4; it++) {
  let imp = false;
  for (let i = 0; i < x.length; i++) for (const d of [step, -step]) { const y = [...x]; y[i] += d; const l = loss(y); if (l < best) { best = l; x = y; imp = true; } }
  if (!imp) step /= 2;
  if (it % 10 === 0) { console.log("it", it, "loss", best.toFixed(2), "step", step); fs.writeFileSync(__dirname + "/fit.json", JSON.stringify({ x })); }
}
fs.writeFileSync(__dirname + "/fit.json", JSON.stringify({ x }));
const PP = [x.slice(0, 9), x.slice(9)], S = stats(PP);
const dec = TA.slice(0, 9).map((t, k) => (k ? S.above[k - 1] : 1) - S.above[k]).concat([S.above[8]]);
console.log("loss", best.toFixed(2)); console.log("城镇低于 4000 元", (cells.filter((c) => c.g === 1).reduce((s, c) => s + c.w * Phi(zAt(PP[1], Math.log(4000) - c.lf)), 0) / WG[1] * 100).toFixed(2) + "%");
console.log("十档 %", dec.map((v) => (v * 100).toFixed(2)).join(" "));
console.log("顶层 前5/前1/前0.4/前0.1/前0.03 %", S.above.slice(9).map((v) => (v * 100).toFixed(3)).join(" "));
console.log("农村占第10档", (S.abR[8] / S.above[8] * 100).toFixed(2) + "% · 前1%", (S.abR[10] / S.above[10] * 100).toFixed(2) + "% · 前0.1%", (S.abR[12] / S.above[12] * 100).toFixed(3) + "%");
["农村", "城镇"].forEach((n, g) => { const s = S.G[g]; console.log(n, "中位", Math.round(s.med), "均值", Math.round(s.mean), "五等份均值", s.qm.map(Math.round).join(" / "), "分界", s.cuts.map(Math.round).join(" / ")); });
console.log("参数", JSON.stringify(PP.map((P) => [Math.round(Math.exp(P[0])), ...P.slice(1).map((v) => +v.toFixed(4))])));
