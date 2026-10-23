/* 十四亿分之一 · 故事引擎 v1
 * 原则：没有纯随机事件。每条事件的年概率 = 基础值 × 你的决策/重心/属性/伏笔修正。
 * 页面接口：STORY.init(S) 出生时调用；STORY.year(S, api) 每年调用，api = { log(text,type), modal(title,sub,opts), q(fn) }。
 * 依赖 S 字段：age male urban p.n loc sit track edu iq hp joy rel money lvl cut house kids wed date focus juan y0 name。
 */
(function () {
  const R = Math.random, pick = (a) => a[Math.floor(R() * a.length)], cl = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const SUR = "王李张刘陈杨黄赵吴周徐孙马朱胡郭何高林罗郑梁谢宋唐许韩冯邓曹彭曾田董袁潘蒋蔡余杜叶程魏苏吕丁沈姚卢姜崔钟谭陆汪范金石廖贾夏韦方白邹孟熊秦邱江薛段雷侯龙陶黎贺顾毛郝龚邵万严武戴孔汤";
  const MG = "伟强磊军洋勇杰涛明超辉刚健鹏浩宇俊峰斌博轩晨阳睿泽一鸣子豪", FG = "芳娜敏静丽艳娟霞玲婷雪慧琳欣怡萱悦佳雨涵彤瑶琪梦晓";
  const nm = (m, sur) => (sur || pick(SUR)) + (R() < 0.5 ? pick(m ? MG : FG) : pick(m ? MG : FG) + pick(m ? MG : FG));
  const given = (n) => (n.length <= 2 ? n : n.slice(1));
  const HIGH_CAILI = ["江西", "甘肃", "河南", "山西", "安徽", "福建", "贵州", "宁夏"];

  // ---------- 小工具 ----------
  let S, A, N, F;
  const has = (k) => !!F[k];
  const say = (t, ty) => A.log(t, ty);
  // 边际递减：知识越高越难涨；人情 70 以上越来越难涨。只作用于正向增益
  const gain = (k, v, cur) => (!(v > 0) ? v : k === "iq" ? v * Math.max(0.15, (100 - cur) / 70) : k === "rel" && cur > 70 ? v * Math.max(0.15, (100 - cur) / 30) : v);
  // 人情分三圈：工作/同事/领导 → Rw，家人/伴侣/孩子/父母 → Rf，朋友/同学/邻居 → Rp（默认）
  let CUR = "";
  const ROUTE_X = { l_reunion: "Rp", kind_callback: "Rp", o_health_scam: "Rw" };
  const route = (id) => ROUTE_X[id] || (/^(w_|g_|f_|b_|ai_wave|retire_|hukou)/.test(id) ? "Rw" : /^(lb_|l_|k_|parent_|mom_|spring_home|o_plane|o_nursing|o_last|grand_|gp_|house_drop|gaokao_call)/.test(id) ? "Rf" : "Rp");
  const fx = (o) => { for (const k in o) { if (k === "money") S.money += o[k]; else if (k === "iq" && A && A.kfx) A.kfx(o[k]); else if (k === "rel" && A && A.rel) A.rel(route(CUR), o[k]); else S[k] = cl(Math.round((S[k] || 0) + gain(k, o[k], S[k] || 0)), 0, 100); } };
  // 选项回调稍后才执行：记住它属于哪件事，人情才能记到对的圈子
  const bind = (id, opts) => opts.map((o) => o && [o[0], o[1], () => { const p = CUR; CUR = id; try { o[2](); } finally { CUR = p; } }, o[3]]);
  // 借钱：家人朋友越亲越借得到
  // 家境越好，亲戚圈子手头越宽
  // 家庭的级 S.fam：0–9 = 第 1–10 级（很困难家庭 … 顶级富豪家庭）；S.famPct = 出生时在全国的收入百分位
  const borrowOK = (s) => R() < 0.2 + 0.5 * (s.Rf != null ? s.Rf : 55) / 100 + 0.3 * (s.Rp != null ? s.Rp : 45) / 100 + (s.fam != null ? [-0.14, -0.055, 0.05, 0.125, 0.146, 0.16, 0.16, 0.16, 0.16, 0.16][s.fam] : 0);
  // 父母生病的花费倍数与医保：每往上一级，自付越少；第 6 级及以上父母自己出
  const ILLB = () => [1.7, 1.24, 0.7, 0.325, 0.205, 0.1, 0, 0, 0, 0][S.fam || 0];
  const YIBAO = () => (S.fam >= 5 ? "家里有商业保险和积蓄，钱不是问题，难的是有人陪。" : S.fam >= 3 ? "父亲有职工医保，家里还有积蓄和一份商业保险，钱上不太慌。" : S.urban && S.fam >= 2 ? "父亲有职工医保，住院能报七成左右。" : "父亲只有城乡居民医保，住院报销五到六成，进口药和护工全要自付。");
  // 地方特色（页面在出生时写进 S.pf）：彩礼倍数 cl、婚育节奏 wed、留守 lb
  const PF = (k, d = 1) => (S.pf && S.pf[k] != null ? S.pf[k] : d);
  const wk = () => 0.6 + (S.Rw || 0) / 100; // 同事社会圈：升职、猎头机会
  const tag = (t) => S.tags && S.tags.add(t);
  const focus = (f) => S.focus === f;
  const working = () => S.age >= 18 && S.age < 60 && !(S.track === "high" && S.age <= 22);
  const city = () => (S.loc === "big" ? "大城市" : S.loc === "county" ? "县城" : S.loc === "rural" ? "村里" : "省城");
  const ta = () => (N.partner && N.partner.m ? "他" : "她");
  const kidN = () => (N.kids.length ? given(pick(N.kids).n) : "孩子");
  const heavy = (t) => (S.soft ? "这一年，生活很艰难。" : t);
  const HOT = "如果你也正经历类似的事：全国心理援助热线 12356。";
  const BOSS = () => S.sit === "gov" ? "科长" : S.sit === "work" ? "车间主任" : S.sit === "boss" ? "投资人" : "主管";
  const BIG = () => S.sit === "gov" ? "局长" : S.sit === "work" ? "厂长" : "总监";
  const moment = (kind, title, body) => { if (A.moment) A.q(() => A.moment(kind, title, body)); };
  const stf = () => (N.staff ? given(N.staff.n) : "老员工"); // 员工 NPC 可能不存在
  // 选项第 4 项可选：弹窗打开时才判断的条件，不满足就不显示
  const ask = (title, sub, opts) => { const b = bind(CUR, opts); A.q(() => A.modal(`${S.age} 岁 · ${title}`, sub, b.filter((o) => o && (!o[3] || o[3]())))); };

  // ---------- 感情：分手统一出口 + 信写在人身上 ----------
  // 任何结束一段感情的路径都走这里：前任进 N.exes，N.partner 清空
  const breakUp = (reason) => { S.date = 0; if (N.partner) { N.partner.end = reason; N.partner.endAge = S.age; N.exes = (N.exes || []).concat(N.partner); } N.partner = null; };
  // 回放只引用现在这个人婚前写的最新一封。出轨过的配偶：原谅了才引用；出轨 / 发现的那一年，什么浪漫的都不加
  const quoteOK = (w) => !!(w && w.letter && (!w.cheated || w.forgiven) && F.noRomance !== S.age && !(F.spCheat && !F.spCheat.found));
  const myLetter = () => (quoteOK(N.partner) ? N.partner.letter : null); // 现在这个人写的信
  const exLetter = () => (N.exes || []).find((e) => e.letter && e.end !== "scam" && !e.cheated); // 故人写的信（出轨离开的人不算）
  const mkWriter = (how) => ({ n: nm(!S.male), m: !S.male, how, dAge: Math.round(R() * 4 - 2) });

  // ---------- 初婚市场（只管第一次结婚；离婚 / 丧偶后的再婚照旧）----------
  // 锚定七普：50 岁未婚 男≈8% 女≈4%；30 岁前结婚≈72%；初婚中位 男≈29.5 女≈27.5，北京上海晚两年、本科+ 晚一点、农村早一点
  // 学历档：0 初中及以下 · 1 高中/职校/专科 · 2 本科/211 · 3 硕士/985/C9
  const eduG = () => (S.edu < 1 ? 0 : S.ky || (S.tierK || 0) >= 5 ? 3 : (S.tierK || 0) >= 3 ? 2 : 1);
  const firstWed = () => F.wedAge == null; // 还没结过婚
  // 「相当的年龄」：同样的实际年龄，男性更晚、女性更早走进婚姻
  const eAge = () => S.age + (S.male ? -0.8 : 1) + (S.p.n === "北京" || S.p.n === "上海" ? -2 : 0) + (eduG() >= 2 ? -1 : 0) + (S.urban ? 0 : 1);
  // 择偶梯度：男看家底、学历、彩礼（农村低档男最难）；女向上找（城镇高学历、高档位的女性最难找到"更高"的人），农村女最抢手
  // 慢热：约七分之一的人社交圈小、不主动，哪一档都有；遇见人和走到最后都更难
  function mkt() {
    const e = eduG(), d = S.famPct != null ? Math.min(9, Math.floor(S.famPct / 10)) : 4, cli = PF("cl", HIGH_CAILI.includes(S.p.n) ? 2 : 1);
    if (F.slow == null) F.slow = R() < 0.12 ? 1 : 0;
    let m;
    if (S.male) {
      // 已含出生性别比失衡：适婚男性比女性多，挤压落在低学历、低档位的男性身上
      m = [0.88, 0.92, 1.06, 1.14][e] * (d <= 2 ? (S.urban ? 0.92 : 0.9) : d <= 4 ? 0.96 : d >= 7 ? 1.08 : 1);
      if (!S.urban) m /= 1 + 0.07 * Math.max(0, cli - 1); // 彩礼越高的省，农村男越难
    } else m = (S.urban ? 0.97 : 1.22) * [1.1, 1.05, 0.95, 0.9][e] * (S.urban && d >= 7 ? 0.88 : 1);
    return m * (F.slow ? 0.55 : 1) * Math.pow(0.9, F.nSheng || 0) * (F.push != null && S.age - F.push <= 1 ? 1.3 : 1);
  }
  const STEP = (x, t) => { for (const [k, v] of t) if (x < k) return v; return t[t.length - 1][1]; };
  // 35 岁以后初婚越来越少：错过了窗口，多半就一直单着
  const meetP1 = () => cl((STEP(eAge(), [[20, 0.03], [22, 0.06], [24, 0.12], [26, 0.24], [28, 0.38], [33, 0.4], [37, 0.16], [42, 0.08], [99, 0.04]]) + (focus("恋爱") ? 0.15 : 0) + (S.joy > 60 ? 0.03 : 0) + (S.rel > 60 ? 0.03 : 0)) * mkt(), 0, 0.6);
  const wedP1 = () => STEP(eAge(), [[24, 0.1], [26, 0.22], [28, 0.42], [31, 0.58], [35, 0.55], [99, 0.35]]) * Math.sqrt(mkt()) + (focus("恋爱") ? 0.1 : 0) + (myLetter() ? 0.1 : 0) + (N.partner.yes ? 0.2 : 0) + (has("paidCaili") ? 0.3 : 0) + (F.push != null && S.age - F.push <= 1 ? 0.12 : 0);
  const breakK1 = () => (eAge() >= 27 ? 0.6 : 1) / mkt();

  // 情书：从 99 封信库 LETTERS99（letters-pack.js）里挑。年龄、相识方式、年代、城乡、写信人身份都要对得上，一生里同一封不出现两次
  // 槽位：{me} 读信人全名 · {w} 写信人全名 · {city} 现在住的城市/县 · {year} 当年年份
  const LPS = {
    文艺: ["PS：信纸是我特意挑的，有一点点桂花香。", "PS：你借我的那本书，我想晚一点再还。"],
    理工: ["PS：以上数据均真实有效，可复核。", "PS：错别字检查了三遍，如有遗漏，算我紧张。"],
    土味直球: ["PS：我妈说想见见你，不急，你慢慢想。", "PS：你要是不同意，我就再写一封。"],
    克制含蓄: ["PS：不回也没关系。", "PS：今晚的月亮很好看。"],
    幽默自嘲: ["PS：看完请销毁，太丢人了。", "PS：如果要拒绝，请委婉一点，我玻璃心。"],
    少年青涩: ["PS：看完别给别人看！", "PS：明天还你橡皮。"],
    质朴乡土: ["PS：我娘腌的咸菜，给你捎了一罐。", "PS：字写得丑，你别笑话。"],
    成熟稳重: ["PS：不用急着回，想好了再说。", "PS：周末天气不错，适合散步。"],
    异地: ["PS：车票我已经开始看了。", "PS：你那边降温了，记得加衣服。"],
    "二婚/中年": ["PS：老花镜忘在你那儿了，下次去拿。", "PS：降压药按时吃。"],
  };
  // 所有信都写在婚前：结婚以后不再收到任何信。信里写着「我们都结过一次婚」的，只给离过婚 / 丧偶的读信人
  const L_REWED = [91, 97];
  // 相识方式的近亲：大学同学也算同学，图书馆也是大学里的相遇
  const HOW_ALIAS = { uni: ["uni", "classmate", "library"], library: ["library", "uni"] };
  const CAP = { 天津: "天津", 浙江: "杭州", 江苏: "南京", 广东: "广州", 山东: "济南", 海南: "海口", 福建: "福州", 辽宁: "沈阳", 重庆: "重庆", 吉林: "长春", 黑龙江: "哈尔滨", 广西: "南宁", 湖北: "武汉", 安徽: "合肥", 四川: "成都", 山西: "太原", 湖南: "长沙", 陕西: "西安", 河北: "石家庄", 江西: "南昌", 河南: "郑州", 内蒙古: "呼和浩特", 宁夏: "银川", 新疆: "乌鲁木齐", 甘肃: "兰州", 贵州: "贵阳", 云南: "昆明", 青海: "西宁", 西藏: "拉萨", 台湾: "台北" };
  const placeName = () => {
    const p = S.p.n, cap = CAP[p] || p;
    if (S.loc === "county") return "县城";
    if (S.loc === "rural") return "镇上";
    if (S.loc !== "big" || S.p.t === 1) return cap;
    return (F.bigCity ||= p === "广东" ? pick(["广州", "深圳"]) : pick(["北京", "上海", "广州", "深圳", "杭州"]));
  };
  function letterText(w, me, from) {
    // 乡土的信：住在村里，或农村出身、住在县城的人
    const age = S.age, yr = S.y0 + age, rural = S.loc === "rural" || (S.loc === "county" && !S.urban), used = (N.lettersUsed ||= []);
    if (S.wed) return null; // 婚后没有信
    const hows = HOW_ALIAS[w.how] || [w.how || "party"];
    const rewed = (N.exes || []).some((e) => e.wed) || has("widowed");
    const pool = LETTERS99.filter((l) => !used.includes(l.id) && age >= l.ages[0] && age <= l.ages[1]
      && (l.how.includes("any") || l.how.some((h) => hows.includes(h)))
      && (l.era === "any" || (l.era === "post2030" ? yr >= 2030 : yr < 2030))
      && (l.rural === null || l.rural === rural)
      && (l.from === "any" || l.from === from)
      && (!L_REWED.includes(l.id) || rewed));
    if (!pool.length) return null;
    // 条件越窄的信越难碰上，碰上了就更优先：具体相识场景、城乡、年代、再婚各加一份权重
    const wt = pool.map((l) => (l.how.includes("any") ? 1 : 3) * (l.rural === null ? 1 : l.rural ? 2.5 : 1.3) * (l.era === "any" ? 1 : 1.5) * (L_REWED.includes(l.id) ? 4 : 1)), tot = wt.reduce((a, b) => a + b, 0);
    let r = R() * tot, l = pool[pool.length - 1];
    for (let i = 0; i < pool.length; i++) if ((r -= wt[i]) < 0) { l = pool[i]; break; }
    const city = placeName();
    const fill = (s) => s.replace(/\{me\}/g, me).replace(/\{w\}/g, w.n).replace(/\{city\}/g, city).replace(/\{year\}/g, yr);
    const lines = fill(l.body).split("\n"), sign = lines.pop();
    if (LPS[l.style] && R() < 0.4) lines.push(pick(LPS[l.style]));
    lines.push("", sign);
    used.push(l.id);
    const line = fill(l.line);
    return { id: l.id, text: lines.join("\n"), line, style: l.style, paper: age <= 17 };
  }
  // 递信：弹窗一直开着，直到点“收下”或“婉拒”；自动模式 10 秒后按心情和人情替你选
  // ok：弹窗真正打开时再确认一次（同一年里先分了手、或先遇见了别人，这封信就不再递出）
  function offerLetter(title, L, yes, no, ok, intro) {
    const b = bind(CUR, [yes, no]);
    b.auto = () => (R() < cl(0.4 + (S.joy - 50) / 100 + (S.rel - 50) / 150, 0.15, 0.9) ? 0 : 1);
    const can = () => !S.wed && (!ok || ok()); // 弹窗打开前已经结了婚：这封信不再递出
    const show = () => { if (!can()) return false; F.gotLetter = 1; say(intro, "warm"); A.moment("letter", title, L.text, b); };
    if (A.moment) A.q(show); else if (can()) { F.gotLetter = 1; say(intro, "warm"); b[b.auto()][2](); }
  }
  // 收下才记到写信人身上：这句话只属于这个人，回放时只引用这一句
  const keepLetter = (w, L) => { w.line = L.line; w.letterId = L.id; w.letter = { age: S.age, id: L.id, line: L.line, style: L.style }; };

  // ---------- 出轨：夫妻双方同一个年概率，与性别无关 ----------
  // 每一方基础 0.75%/年；异地 ×1.8；婚姻满意度 <40 ×1.6、<55 ×1.25；这一方 35–50 岁 ×1.3。不看孩子
  const apart = () => (F.apartTill || 0) > S.age;
  const msat = () => cl(60 + ((S.Rf != null ? S.Rf : 55) - 55) * 0.6 + (S.joy - 50) * 0.3 - (F.marriageStrain || 0) * 8 - (F.cold ? 12 : 0), 0, 100);
  const cheatP = (age) => 0.0075 * (apart() ? 1.8 : 1) * (msat() < 40 ? 1.6 : msat() < 55 ? 1.25 : 1) * (age >= 35 && age <= 50 ? 1.3 : 1);
  const spAge = () => S.age + ((N.partner && N.partner.dAge) || 0);
  const soft = (full, gentle) => (S.soft ? gentle : full);
  // 离婚统一出口：share 是你分到的存款比例（过错方少分），房子跟无过错方；孩子跟谁、受多大影响都在这里
  function divorce(share, keepHouse, kidKeep, why) {
    const pn = N.partner ? given(N.partner.n) : "对方", nk = N.kids.length;
    S.wed = 0; tag("divorce"); F.divorced = 1; if (why === "affair") F.affairDivorce = (F.affairDivorce || 0) + 1;
    S.money = S.money > 0 ? S.money * share : S.money * 0.5; const hadHouse = !!S.house; if (S.house && !keepHouse) S.house = null;
    const young = N.kids.filter((k) => S.age - k.b < 18).length, keep = young && R() < kidKeep, kn = kidN();
    if (young) { F.ptmMiss = (F.ptmMiss || 0) + 1; F.kidsSplit = 1; }
    breakUp("离婚");
    const kids = young ? (keep ? `孩子判给了你。开学第一周，班主任打来电话，说${kn}上课总发呆。` : `孩子跟了${pn}，你每两周可以见一次，每次分开，${kn}都不回头。`) : nk ? `孩子已经成年，${kn}只说了一句：“你们自己的事，自己想清楚。”` : "";
    return `${share > 0.5 ? "存款你分到六成" : share < 0.5 ? "存款你只分到四成" : "存款对半分"}${hadHouse ? (keepHouse ? "，房子留给了你" : `，房子归了${pn}`) : ""}。` + kids;
  }

  // ---------- 事件库 ----------
  // a:[最小,最大年龄]  c:前置条件  p:年概率(决策驱动)  once:一生一次  cd:冷却年数  run:发生
  const E = [
    /* ===== 童年 ===== */
    // 留守：农村低收入、偏下家庭最常见，城镇中间偏上以上几乎没有（3–6 岁四年累计：农村 约 60/45/25/10/4%）
    { id: "lb_start", a: [3, 6], once: 1, c: () => S.p.n !== "香港" && S.p.n !== "澳门", p: () => (S.urban ? [0.045, 0.02, 0.002, 0, 0, 0, 0, 0, 0, 0] : [0.23, 0.144, 0.039, 0.007, 0.003, 0, 0, 0, 0, 0])[S.fam || 0] * (S.p.t === 3 ? 1.1 : 0.95) * PF("lb"),
      run() { F.lb = 1; tag("sad"); say(`那年开春，爸妈背着蛇皮袋去了南方的工厂。临走前妈妈蹲下来给你系好鞋带，说过年就回来。你站在村口，看大巴车的尾灯一点一点变小，直到奶奶把你抱回屋里。`, "bad"); fx({ joy: -6, rel: -10 }); } },
    { id: "lb_call", a: [6, 14], cd: 3, c: () => has("lb"), p: () => 0.45,
      run() { say(pick([`每周六晚上八点，奶奶的老人机会响。妈妈在电话那头问你吃饱没有，你说吃饱了，其实想说的是“你什么时候回来”。`, `过年爸妈回来了，给你带了一个书包，可你已经不太会喊“爸爸”了。初六他们又走了，你把书包抱在怀里睡了一晚。`, `开家长会，别人的爸妈都来了，你的座位旁边坐着奶奶。她看不懂成绩单，只一遍遍摸着你的名字。`]), "plain"); fx({ rel: 1, joy: -2 }); F.lbYears = (F.lbYears || 0) + 1; } },
    { id: "desk_mate", a: [7, 9], once: 1, p: () => 0.9,
      run() { N.desk = { n: nm(R() < 0.5) }; say(`新学期，班主任把你和${N.desk.n}安排成同桌。${given(N.desk.n)}的铅笔盒是铁皮的，上面印着孙悟空。你们用粉笔在桌上画了一条“三八线”，谁也不许越过。`, "warm"); } },
    { id: "desk_money", a: [8, 11], once: 1, c: () => N.desk, p: () => 0.5,
      run() { ask("同桌的压岁钱", `${given(N.desk.n)}的压岁钱被高年级的人抢走了，趴在桌上哭。你的口袋里还有过年攒下的五十块。`, [
        ["分一半给他", "关系+ · 会被记住很久", () => { F.kindDesk = 1; fx({ rel: 4, joy: 2 }); say(`你把二十五块塞进${given(N.desk.n)}的铅笔盒，假装什么都没发生。那天放学，你们一起买了两根五毛钱的冰棍。`, "warm"); }],
        ["陪他去告诉老师", "正直 · 知识+", () => { F.braveDesk = 1; fx({ iq: 2, rel: 2 }); say(`你拉着${given(N.desk.n)}去了办公室。钱没追回来，但那几个高年级再也没来过你们班门口。`, "warm"); }],
        ["假装没看见", "什么也不会发生", () => { F.coldDesk = 1; say(`你低头写作业，假装没听见旁边的抽泣声。很多年后你还会偶尔想起那个下午。`); }],
      ]); } },
    { id: "bully", a: [10, 15], once: 1, p: () => 0.06 + (S.rel < 45 ? 0.08 : 0) + (has("lb") ? 0.05 : 0),
      run() { tag("sad"); ask("被欺负了", "放学路上，几个人把你的书包扔进了水沟。他们说明天还来。", [
        ["告诉老师和家长", "安全 · 关系+", () => { fx({ rel: 2, joy: -2 }); say("你哭着把事情说了出来。第二天班主任把那几个人叫进了办公室，事情慢慢过去了。"); }],
        ["和他们打一架", "健康− · 会被记过，但没人再敢惹你", () => { F.fighter = 1; fx({ hp: -5, joy: 2 }); say("你攥紧拳头冲了上去，鼻子流了血，也被记了过。可从那以后，再没人碰过你的书包。", "bad"); }],
        ["忍着，绕路回家", "幸福− · 关系−", () => { F.bulliedSilent = 1; fx({ joy: -8, rel: -4 }); say("你开始每天多绕二十分钟的路回家。这件事你谁也没说。", "bad"); }],
      ]); } },
    { id: "first_phone", a: [11, 15], once: 1, p: () => (S.urban ? 0.5 : 0.3),
      run() { say(pick([`你有了人生第一部手机，是爸爸换下来的旧款，屏幕右上角裂了一道缝。你把它当宝贝，每天睡前都要擦一遍。`, `你用攒了两年的压岁钱买了第一部手机。第一条消息发给了最好的朋友，只有三个字：“在吗？”`]), "warm"); F.phone = 1; } },
    { id: "game_addict", a: [12, 17], once: 1, c: () => has("phone"), p: () => 0.08 + (focus("玩耍") ? 0.15 : 0) + (has("lb") ? 0.1 : 0),
      run() { F.gamer = 1; fx({ iq: -5, joy: 4 }); say("你迷上了一款手游，段位从青铜打到了王者，成绩却从班级前十掉到了三十名开外。班主任在家长群里点了你的名。", "bad"); } },
    { id: "teacher_praise", a: [8, 17], cd: 4, p: () => 0.05 + (focus("学习") ? 0.12 : 0) + (S.iq > 60 ? 0.05 : 0),
      run() { F.teacherFav = 1; fx({ joy: 5, iq: 2 }); say(pick([`语文老师把你的作文当范文在全班念，念到最后一段时，教室里很安静。下课后她对你说：“你以后可以试着多写写。”`, `数学竞赛拿了市二等奖，校长在升旗仪式上念了你的名字。你站在队伍里，耳朵烫得厉害。`]), "warm"); } },
    { id: "crush", a: [13, 17], once: 1, p: () => 0.35 + (focus("玩耍") ? 0.1 : 0),
      run() { N.crush = { n: nm(!S.male), m: !S.male }; tag("love"); ask("心动", `你发现自己总在偷看${N.crush.n}。课间操时${N.crush.m ? "他" : "她"}站在你斜前方第三个位置。`, [
        ["写一张纸条", "可能被拒绝，也可能被记住一辈子", () => { const ok = R() < 0.4 + (S.joy - 50) / 200; F.crushNote = ok ? 2 : 1; if (ok) { fx({ joy: 8, iq: -2 }); say(`你在纸条上写了一句“放学可以一起走吗”，夹在${given(N.crush.n)}的练习册里。第二天，练习册还回来，背面多了一个字：“好。”`, "warm"); } else { fx({ joy: -6 }); say(`纸条被${given(N.crush.n)}的同桌抢去，在全班念了出来。那个学期，你一直低着头走路。`, "bad"); } }],
        ["藏在心里", "安安静静地喜欢", () => { F.crushSecret = 1; fx({ joy: 1 }); say(`你什么也没说，只是在毕业那天，偷偷在${given(N.crush.n)}的同学录上写了一句“祝你前程似锦”。`); }],
      ]); } },
    { id: "gaokao_call", a: [17, 18], once: 1, c: () => has("lb") && (F.lbYears || 0) >= 3 && S.track === "high", p: () => 0.9,
      run() { tag("love"); fx({ joy: 6 }); say(`高考前一天晚上，电话响了。是外婆，她不识字，只会按那一个号码。她说：“娃，别怕，考成啥样外婆都给你煮鸡蛋。”你挂了电话，在宿舍楼道里哭了很久。`, "warm"); moment("call", "外婆的电话", `“娃，别怕。\n考成啥样，外婆都给你煮鸡蛋。”`); } },

    /* ===== 职场 · 白领/大厂 ===== */
    { id: "w_mentor", a: [22, 30], once: 1, c: () => working() && ["white", "gov", "work"].includes(S.sit), p: () => 0.3 + (S.rel > 55 ? 0.2 : 0),
      run() { N.mentor = { n: "老" + pick(SUR) }; F.mentor = 1; fx({ iq: 3, joy: 2, rel: 4 }); say(`入职第一个月你搞砸了一份报表，是工位对面的${N.mentor.n}陪你加班到十点改完。他递给你一罐咖啡：“谁没搞砸过？我第一年把公章盖反了。”`, "warm"); } },
    { id: "w_credit", a: [24, 45], cd: 8, c: () => working() && ["white", "gov"].includes(S.sit), p: () => 0.06 + (focus("拼事业") ? 0.08 : 0) + (S.lvl > 0.5 ? 0.04 : 0),
      run() { N.rival = N.rival || { n: nm(R() < 0.5) }; tag("bad"); fx({ rel: -3 }); ask("功劳被抢了", `你熬了三个通宵做的方案，在季度会上被${N.rival.n}当成自己的成果讲了一遍。${BOSS()}点头说“不错”。`, [
        ["会上当场澄清", "可能得罪人，也可能被看见", () => { if (R() < 0.45 + (S.iq - 50) / 150) { F.bossFav = (F.bossFav || 0) + 2; F.rivalBeaten = 1; fx({ joy: 6 }); say(`你站起来，把每一版修改记录投到大屏上。会议室安静了几秒，${BOSS()}看了${given(N.rival.n)}一眼，说：“方案的事，会后你来找我。”`, "warm"); } else { F.rivalFeud = 1; fx({ joy: -6, rel: -3 }); say(`你站起来解释，却被${BOSS()}打断：“团队的成果，分什么你我。”散会后，${given(N.rival.n)}在茶水间笑着拍了拍你的肩。`, "bad"); } }],
        [`会后私下找${BOSS()}`, `稳妥 · ${BOSS()}会记住`, () => { F.bossFav = (F.bossFav || 0) + 1; fx({ joy: -2 }); say(`你把聊天记录和文件版本整理好，敲开了${BOSS()}办公室的门。${BOSS()}没多说什么，只是下个项目点名让你牵头。`); }],
        ["忍了", "幸福− · 他会更加得寸进尺", () => { F.rivalWin = (F.rivalWin || 0) + 1; fx({ joy: -8 }); say(`你什么都没说。回家路上地铁很挤，你盯着车窗里自己的倒影，觉得很陌生。`, "bad"); }],
      ]); } },
    { id: "w_rival_boss", a: [32, 50], once: 1, c: () => working() && (F.rivalWin || 0) >= 1 && N.rival, p: () => 0.25 * F.rivalWin,
      run() { tag("bad"); fx({ joy: -10 }); S.cut *= 0.95; say(`人事发了任命邮件：${N.rival.n}升任部门总监，你的直属上级。第一次一对一面谈，${given(N.rival.n)}靠在椅背上说：“以后还要多仰仗你啊。”`, "bad"); } },
    { id: "w_rival_respect", a: [32, 50], once: 1, c: () => working() && has("rivalBeaten") && N.rival, p: () => 0.2,
      run() { fx({ rel: 4, joy: 3 }); say(`${N.rival.n}跳槽前一天，特意来你工位前站了一会儿：“那年会上的事，是我不对。你是我见过最较真的人。”你们第一次一起吃了顿饭。`, "warm"); } },
    { id: "w_boss_notice", a: [24, 55], cd: 3, c: () => working() && !["farm", "boss"].includes(S.sit), p: () => 0.05 + 0.04 * (F.bossFav || 0) + (focus("拼事业") ? 0.06 : 0) + (S.iq > 65 ? 0.04 : 0),
      run() { fx({ joy: 6, rel: 3 }); F.bossFav = (F.bossFav || 0) + 1; say(pick([`年终总结会上，${BIG()}翻到你那一页停了一下：“这个项目，是谁在推？”你的直属${BOSS()}说了你的名字。散会时，${BIG()}经过你身边，拍了拍你的肩。`, `凌晨一点，你收到${BOSS()}的一条微信：“方案看了，很扎实。早点休息。”你盯着屏幕看了很久，那一晚睡得特别香。`, `客户在邮件里专门抄送了你的${BOSS()}，写道：“感谢贵司${S.name}的专业，这是我们合作过最省心的一次。”`]), "warm"); } },
    { id: "w_promote", a: [24, 58], cd: 3, c: () => working() && ["white", "gov", "work"].includes(S.sit) && S.lvl < 1, p: () => cl(0.03 + 0.05 * Math.min(3, F.bossFav || 0) + (focus("自我提升") ? 0.05 : 0) + (focus("拼事业") ? 0.04 : 0) + (S.iq - 50) / 600 - (has("rivalFeud") ? 0.04 : 0), 0.01, 0.4) * wk(),
      run() { S.lvl = Math.min(1, S.lvl + 0.18 * (["white", "gov"].includes(S.sit) ? 0.8 + 0.1 * (S.tierK || 0) : 1)); F.promos = (F.promos || 0) + 1; fx({ joy: 8, rel: 3 }); tag("up");
        const t = S.sit === "gov" ? pick([`公示名单贴在一楼公告栏，你的名字后面写着“拟提任副科级”。公示七天，你每天上班都假装不经意地路过一次。`, `组织部的人找你谈话，问了你三个问题。一个月后，你搬进了有窗户的办公室。`]) : S.sit === "work" ? `车间主任退休，厂长把班组长的工牌交到你手里：“${S.name}，你干活最踏实，这些人交给你了。”工资多了八百，你给爸妈打了个电话。` : pick([`绩效面谈时，${BOSS()}推过来一张纸：职级上调一档，薪资涨了 ${15 + Math.floor(R() * 20)}%。你努力保持平静，出了会议室才在楼梯间握了一下拳。`, `你升成了组长，手下有了五个人。第一次开组会，你提前准备了三页讲稿，结果一紧张全忘了。`]);
        say(t + (has("mentor") && F.promos === 1 ? `你第一个告诉的人是${N.mentor.n}。` : ""), "warm"); } },
    { id: "w_cheer", a: [23, 58], cd: 4, c: () => working() && S.joy < 45, p: () => 0.1 + (S.rel > 50 ? 0.15 : 0) + (has("mentor") ? 0.05 : 0),
      run() { fx({ joy: 7, rel: 2 }); say(pick([`你在工位上发呆的时候，隔壁的同事悄悄放了一杯奶茶在你桌上，便利贴上写着：“撑住，周五请你吃火锅。”`, `部门群里你被客户投诉的事刚传开，就有三个同事私聊你：“那个客户谁接都一样，别往心里去。”`, `${N.mentor ? N.mentor.n : "老同事"}拉你下楼抽了根烟（你其实不抽）：“这行干久了就知道，没有过不去的季度。”`]), "warm"); } },
    { id: "w_996", a: [23, 50], cd: 5, c: () => working() && (S.juan || 0) >= 4, p: () => 0.06 + 0.02 * Math.min(6, S.juan - 4) + (S.hp < 50 ? 0.08 : 0),
      run() { tag("ill"); ask("凌晨的写字楼", "连续第三周加班到凌晨。你起身倒水时眼前一黑，扶住了桌角。体检报告上多了好几个向上的箭头。", [
        ["请一个月假", `健康+ 收入− · ${BOSS()}会不高兴`, () => { fx({ hp: 10, joy: 4 }); S.cut *= 0.97; F.bossFav = Math.max(0, (F.bossFav || 0) - 1); say("你第一次请了长假，回老家住了一个月。妈妈每天炖汤，你胖了四斤。"); }],
        ["吃片药继续扛", "健康−− · 项目能按时上线", () => { fx({ hp: -12 }); F.bossFav = (F.bossFav || 0) + 1; F.pushed = 1; say("你吞了两片药，回到工位。项目按时上线了，庆功宴上你喝的是热水。", "bad"); }],
        ["辞职", "健康+ 幸福+ · 要重新找工作", () => { fx({ hp: 8, joy: 8 }); S.cut *= 0.85; say("你交了辞职信，走出大楼那天阳光很好，你在路边坐了一个下午。"); }],
      ]); } },
    { id: "w_headhunt", a: [26, 48], cd: 6, c: () => working() && ["white"].includes(S.sit), p: () => (0.04 + (focus("自我提升") ? 0.1 : 0) + (S.iq > 65 ? 0.05 : 0) + 0.02 * (F.promos || 0)) * wk() * ((S.tierK || 0) >= 5 ? 1.5 : 1), // 名校校友内推
      run() { ask("猎头的电话", `一家正在扩张的新公司开出涨薪 40%、给期权的 offer，但那边出了名的“大小周”，B 轮还没融到。${BOSS()}刚暗示过你，明年有机会升经理。`, [
        ["接 offer，去新公司搏期权", "收入+40% · 更卷 · 公司若倒闭期权清零", () => { S.cut *= 1.4; F.jumped = 1; F.bossFav = 0; S.juan = (S.juan || 0) + 1; if (R() < 0.3) F.jumpBust = S.age + 2; fx({ joy: 4 }); say(`你签了 offer。离职那天，${BOSS()}在电梯口拍了拍你：“外面要是待得不舒服，随时回来。”你知道这多半是客气话，心里还是暖了一下。`); }],
        ["拿 offer 回去找主管谈加薪", "可能涨薪，也可能被记上“不稳定”", () => { if (R() < 0.5 + 0.1 * (F.bossFav || 0)) { S.cut *= 1.2; fx({ joy: 5 }); say(`你把 offer 截图发给了${BOSS()}。第二天，HR 约你谈话：涨 20%，提前半年参加经理评审。`, "warm"); } else { F.bossFav = Math.max(0, (F.bossFav || 0) - 1); fx({ joy: -4 }); say(`${BOSS()}看了 offer，只说了一句“尊重你的选择”。那之后，重要的项目再没叫过你。`, "bad"); } }],
        ["婉拒，等明年的经理评审", "领导会记住你的忠诚 · 收入暂时不变", () => { F.bossFav = (F.bossFav || 0) + 1; fx({ rel: 2 }); say(`你婉拒了猎头。后来${BOSS()}不知从哪听说了，年底给你多批了半个月奖金，还在部门会上说：“有人挖${S.name}，${S.name}没走。”`); }],
      ]); } },
    { id: "w_jump_bust", a: [26, 55], once: 1, c: () => F.jumpBust && S.age >= F.jumpBust, p: () => 0.8,
      run() { tag("layoff"); S.money -= 3; fx({ joy: -10 }); say("新公司的融资没谈下来。周一早上，全员大会只开了十分钟，HR 在门口发着离职协议，股票期权变成了一张废纸。", "bad"); } },
    { id: "w_side", a: [25, 55], once: 1, c: () => working() && focus("家人朋友") === false && (S.joy < 40 || has("pushed")), p: () => 0.05 + (has("rivalWin") ? 0.03 : 0),
      run() { F.burnout = 1; tag("sad"); fx({ joy: -8 }); say(heavy(`有一段时间，你每天早上坐在车里，要在地下车库待二十分钟才能推开车门上楼。你不知道这算不算抑郁，只知道什么都提不起劲。`) + (S.soft ? "" : " " + HOT), "bad"); } },
    { id: "g_wine", a: [23, 50], cd: 6, c: () => working() && ["gov", "work", "boss"].includes(S.sit) && S.loc !== "big", p: () => 0.08 + (S.sit === "gov" ? 0.06 : 0),
      run() { ask("酒桌", `饭局上，${BOSS()}端着分酒器走过来：“年轻人，这杯得干了。”`, [
        ["干了", `${BOSS()}满意 · 健康−`, () => { fx({ hp: -4 }); F.bossFav = (F.bossFav || 0) + 1; say(`你一口闷了，胃里像着了火。${BOSS()}大笑着拍你的背，说你实在。那晚你在马路牙子上吐到半夜。`); }],
        ["以茶代酒", "有人会觉得你不懂事", () => { if (R() < 0.5) { F.bossFav = Math.max(0, (F.bossFav || 0) - 1); say(`你端起茶杯说开车了。${BOSS()}笑了笑没说什么，但之后的饭局没再叫过你。`); } else { fx({ rel: 2 }); say(`你端起茶杯说开车了。${BOSS()}摆摆手：“开车好，开车好，不勉强。”后来你发现，他自己也早就不喝了。`); } }],
      ]); } },
    /* ===== 职场 · 打工 / 务农 / 创业 ===== */
    { id: "f_line", a: [16, 45], cd: 5, c: () => working() && S.sit === "work", p: () => 0.12,
      run() { say(pick([`流水线上一天要拧四千颗螺丝，你闭着眼都能拧。午休时你躺在纸箱上，用手机看一集电视剧，看到一半就睡着了。`, `宿舍八个人一间，上铺的小伙子每晚给老家的女朋友打电话，声音压得很低。你戴着耳机，假装没听见那句“等我攒够钱”。`, `今年送外卖，你记住了整片城区每一个小区的后门。暴雨那天，一个阿姨开门时塞给你一杯热姜茶：“孩子，慢点骑。”`]), "plain"); fx({ hp: -1 }); } },
    { id: "f_injury", a: [18, 55], cd: 10, c: () => working() && S.sit === "work", p: () => 0.02 + 0.006 * (S.juan || 0) + (S.hp < 45 ? 0.02 : 0),
      run() { tag("ill"); fx({ hp: -15 }); const comp = R() < 0.5; S.money += comp ? 3 : -2; say(comp ? "机器卡住时你伸手去拨，左手两根手指被压伤。厂里赔了三万块，工友们凑钱买了一篮水果来看你。" : "你从脚手架上摔了下来，腰伤了。包工头跑了，医药费全是自己掏的。", "bad"); } },
    { id: "farm_year", a: [18, 65], cd: 3, c: () => S.sit === "farm" && S.age < 70, p: () => 0.3,
      run() { const good = R() < 0.55 + (focus("拼事业") ? 0.1 : 0); S.money += good ? 1 : -0.8; fx({ joy: good ? 4 : -4 }); say(good ? pick([`今年雨水匀，玉米收成好。你蹲在地头剥开一穗，粒粒饱满，像小时候爷爷给你看的那样。`, `你试着在抖音上直播卖自家的橙子，第一晚只有十二个人看。第三个月，有一单卖到了哈尔滨。`]) : pick([`夏天一场冰雹，果园里一半的果子落了地。你蹲着一个个捡，捡到天黑。`, `猪价跌了，栏里的二十头猪卖一头亏一头。你算了一晚上的账，最后只抽完了一包烟。`]), good ? "warm" : "bad"); } },
    { id: "ai_wave", a: [25, 58], once: 1, c: () => working() && S.y0 + S.age >= 2035 && ["white", "work"].includes(S.sit), p: () => 0.08 + (focus("自我提升") ? -0.05 : 0.03),
      run() { tag("layoff"); ask("AI 来了", "公司上线了新一代 AI 系统，你们组十二个人裁到了三个。名单上有你。", [
        ["重新学一门手艺", "一年没收入 · 知识+", () => { S.money -= 6; fx({ iq: 8 }); S.lvl = Math.max(0.3, S.lvl); say("你报了夜校，学起了你从没碰过的东西。四十岁的人，坐在一群二十岁的人中间做笔记。一年后，你被 AI 取代的那份工作，变成了你训练 AI 的工作。", "warm"); }],
        ["去跑网约车", "马上有收入 · 健康−", () => { S.sit = "work"; S.lvl = 0.5; fx({ hp: -4 }); say("你注册了网约车。第一单的乘客是个刚毕业的大学生，一路都在打电话说要去大厂面试。"); }],
      ]); } },

    /* ===== 春节 / 父母 ===== */
    { id: "spring_home", a: [19, 40], cd: 3, c: () => S.loc === "big" || S.loc === "prov", p: () => 0.35,
      run() { ask("除夕前一周", "公司说春节值班给三倍工资。老家的妈妈在电话里问：“今年回吗？”", [
        ["回家", "抢票很难 · 关系+", () => { F.homeNY = (F.homeNY || 0) + 1; fx({ rel: 5, joy: 4 }); say(R() < 0.4 ? "抢了十天都没抢到坐票。你买了一张站票，在绿皮车的连接处站了三十个小时。推开家门时，桌上的饺子刚出锅。" : "你拖着行李箱走进村口，大黄狗先认出了你。妈妈在厨房里应了一声，没回头，你看见她在抹眼睛。", "warm"); }],
        ["留下值班", "收入+ · 妈妈会说没事", () => { F.missNY = (F.missNY || 0) + 1; S.money += 1; fx({ rel: -3 }); say("除夕夜你一个人在出租屋里吃速冻饺子，和家里视频。妈妈把手机举着转了一圈，说你看，都挺好的，就是少了你。", "bad"); }],
      ]); } },
    { id: "parent_ill", a: [35, 62], once: 1, p: () => (0.12 + (S.age > 45 ? 0.08 : 0) + (S.urban ? 0 : 0.04)) * [1.5, 1.25, 0.95, 0.825, 0.77, 0.7, 0.7, 0.7, 0.7, 0.7][S.fam0 || 0],
      run() { tag("ill"); const k = ILLB(); ask("父亲病了", "医生把你叫到走廊：“需要做手术，后面还要长期有人照顾。”" + YIBAO(), [
        ["辞职回去照顾", "家人++ 收入归零 · 医疗自付一大笔", () => { F.caredParent = 1; S.cut *= 0.85; const pay = Math.round((2 + 8 * k) * (0.7 + 0.6 * R())); S.money -= pay; fx({ rel: 5, joy: -4 }); say(pay >= 12 ? `你辞了工作，在病床边的折叠椅上睡了四个月。父亲的病，医保报销后自付 ${pay} 万，家里掏空了积蓄还借了一圈。有一天夜里，父亲突然说：“小时候没怎么陪你，现在倒让你陪我了。”` : `你辞了工作，在病床边的折叠椅上睡了四个月。父亲的病，医保报销后自付 ${pay} 万。有一天夜里，父亲突然说：“小时候没怎么陪你，现在倒让你陪我了。”`, "warm"); }],
        ["请护工，周末回去", "花钱最多 · 心里会悬着", () => { const pay = Math.round((4 + 12 * k) * (0.7 + 0.6 * R())); S.money -= pay; fx({ rel: 2, joy: -3 }); say(pay >= 18 ? `你每个月给护工打六千块，周五下班直接去高铁站。一年下来，父亲的病自付了 ${pay} 万，你第一次知道什么叫“病不起”。` : `你每个月给护工打六千块，周五下班直接去高铁站。父亲的病，前后自付 ${pay} 万。`); }],
        ["接到身边住", "家里会很挤 · 伴侣的态度很重要", () => { F.parentLive = 1; const pay = Math.round((1 + 6 * k) * (0.7 + 0.6 * R())); S.money -= pay; fx({ rel: 4 }); if (S.wed && R() < 0.4) { F.marriageStrain = (F.marriageStrain || 0) + 1; say(`父亲住进了次卧。${N.partner ? given(N.partner.n) : "另一半"}嘴上没说什么，但你们吵架的次数多了起来。父亲的病前后自付 ${pay} 万。`, "bad"); } else say(`父亲住进了次卧。每天早上他都起得比你早，把阳台的花浇了一遍。他的病前后自付 ${pay} 万。`); }],
      ]); } },
    { id: "gp_pass", a: [8, 40], once: 1, p: () => 0.03 + (has("lb") ? 0.01 : 0),
      run() { tag("death"); S.loss = "祖辈"; say(heavy(has("lb") ? "奶奶走了。小时候每个下雨的晚上，都是她把你搂在被窝里。你跪在灵前，想起那台只会拨一个号码的老人机。" : "爷爷走了。你赶回老家，堂屋里摆着他的黑白照片，笑得跟过年时一样。"), "bad"); } },
    { id: "parent_pass", a: [40, 75], once: 1, p: () => 0.03 + Math.max(0, S.age - 45) * 0.006,
      run() { tag("death"); fx({ rel: -5 }); S.loss = "父亲"; let t = "父亲走了。走得很安静，在一个下着小雨的清晨。";
        if ((F.missNY || 0) >= 2) t += `收拾遗物时，你在他枕头下找到一本日历，每年除夕那一页都画了个圈，旁边写着：“娃没回。”`;
        else if (has("caredParent")) t += "你想起陪床的那四个月，他说过的每一句话，你都记得。";
        else t += "葬礼上来了很多你不认识的人，他们都说，你爸这辈子没跟人红过脸。";
        say(heavy(t), "bad"); } },

    /* ===== 恋爱 · 婚姻 ===== */
    // 相识：相亲、图书馆、团建、聚会，也有邻居、老同学、网友；36 岁以后也会遇见人，只是少一些
    { id: "l_meet", a: [18, 55], cd: 2, pri: 1, c: () => !S.date && !S.wed && !(firstWed() && has("noMarry")), p: () => firstWed() ? meetP1() : cl((0.06 + (focus("恋爱") ? 0.2 : 0) + (S.joy > 60 ? 0.04 : 0) + (S.rel > 60 ? 0.04 : 0) + (S.age > 27 && S.loc !== "big" ? 0.08 : 0)) * (S.age > 42 ? 0.45 : S.age > 35 ? 0.6 : 1) * (S.age < 30 ? PF("wed") : 1), 0, 0.5),
      run() { N.partner = mkWriter("party"); S.date = 1; F.dateAge = S.age; tag("love"); const P = N.partner, r = R();
        let how;
        if (S.age > 26 && S.loc !== "big" && R() < 0.6) { F.blind = 1; P.how = "blind"; how = S.age > 35 ? `朋友张罗了一场相亲，地点在${city()}的一家老茶馆。${P.n}比照片上显老一点，坐下第一句是：“我们这个岁数，就不绕弯子了。”你笑了，觉得这人实在。` : `过年回家，姑妈安排你在县城的茶馆相亲。对面坐着${P.n}，你们聊了十分钟天气，然后${ta()}突然问：“你也是被逼来的吧？”你们同时笑出了声。`; }
        else if (r < 0.14) (P.how = "neighbor"), how = `楼道里的灯坏了一个月，那天你摸黑上楼，撞上了提着灯泡的${P.n}。“我住你对门，”${ta()}说，“换个灯泡，顺便认识一下。”`;
        else if (r < 0.24) (P.how = "classmate"), how = S.age > 30 ? `同学群里有人张罗聚会，你在包厢门口一眼认出了${P.n}。散场时${ta()}说顺路，送你走了三站地铁。` : `毕业后第一次同学聚会，${P.n}坐在你旁边，说起当年你借过${ta()}一支笔，一直没还。`;
        else if (r < 0.36) (P.how = "online"), how = `你在一个兴趣小组里和${P.n}聊了三个月，从一本书聊到一座城。第一次见面约在地铁站口，你们都提前到了二十分钟。`;
        else if (S.edu > 1 && S.age < 24) (P.how = "library"), how = `图书馆闭馆音乐响起时，${P.n}的书掉在你脚边。你帮${ta()}捡起来，发现你们借的是同一本书的上下册。`;
        else if (working()) (P.how = "hike"), how = `公司团建爬山，你在半山腰崴了脚，是隔壁部门的${P.n}扶你走完了剩下的路。下山后${ta()}加了你微信，备注写着：“崴脚的那位”。`;
        else how = `朋友聚会上，你和${P.n}因为一首歌的歌词争了半个晚上，最后谁也没说服谁，却交换了微信。`;
        say(how, "warm"); fx({ joy: 8 }); } },
    // 暗恋者的信：没在恋爱时才会收到；收下就在一起，婉拒的人记在 N.admirers
    // 36–55 岁单身、离异、丧偶时也可能收到（中年的同事、邻居、同学会上重逢的老同学）；来源也包括网友、相亲对象
    { id: "a_admirer", a: [15, 55], cd: 4, c: () => !S.date && !S.wed && !N.partner, p: () => cl(0.03 + (focus("恋爱") ? 0.04 : 0) + (S.joy > 65 ? 0.01 : 0) + (S.rel > 65 ? 0.01 : 0), 0, 0.12) * (S.age > 35 ? 0.8 : 1),
      run() { const a = S.age, kid = a <= 17, r = R(); let how, who;
        if (kid) {
          if (S.track === "work") { how = "colleague"; who = "厂里的工友"; }
          else if (r < 0.1) { how = "library"; who = "常在学校图书馆遇见的"; }
          else if (r < 0.18) { how = "party"; who = "联欢会上坐你旁边的"; }
          else if (r < 0.26) { how = "online"; who = "网上聊了半年的"; }
          else { how = "classmate"; who = S.track === "high" ? "高中同学" : "职高同学"; }
        } else if (a <= 35) {
          const wk = working(), src = [
            a <= 22 && S.track === "high" && S.edu > 1 && ["uni", "大学同学", 5], S.edu > 1 && ["library", "常在图书馆遇见的", a <= 24 ? 1.5 : 0.8],
            a <= 24 && ["classmate", "高中时的老同学", 1], ["online", "聊了很久的网友", 1.5], a > 24 && ["blind", "相亲时见过一面的", S.loc === "rural" || S.loc === "county" ? 2.4 : 1.3], wk && ["hike", "团建时扶过你的", 1], ["party", "聚会上坐你旁边的", 1.1],
            wk && ["colleague", "同事", 2.5], ["neighbor", "邻居", wk ? 1.7 : 2.5],
          ].filter(Boolean);
          let x = r * src.reduce((s, o) => s + o[2], 0), o = src[src.length - 1];
          for (const c of src) if ((x -= c[2]) < 0) { o = c; break; }
          [how, who] = o;
        } else {
          // 36–55 岁：只会是单身、离异、丧偶的你
          const src = [working() && ["colleague", "同事", 2.2], ["neighbor", "邻居", 1.8], ["classmate", "同学会上重逢的老同学", 1.3], ["online", "聊了很久的网友", 1.3], ["blind", "朋友介绍认识的", 1.6],
            ["library", "常在图书馆遇见的", 0.5], ["party", "朋友聚会上认识的", 0.6], ["hike", "徒步群里认识的", 0.5]].filter(Boolean);
          let x = r * src.reduce((s, o) => s + o[2], 0), o = src[src.length - 1];
          for (const c of src) if ((x -= c[2]) < 0) { o = c; break; }
          [how, who] = o;
        }
        let w;
        if (kid && how === "classmate" && N.crush && !N.crush.wrote && N.crush !== N.partner && R() < 0.35) { w = N.crush; w.how = "classmate"; w.dAge = 0; who = "你偷偷喜欢的"; }
        else w = mkWriter(how);
        const L = letterText(w, S.name, "admirer");
        if (!L) return; // 信库里没有对得上的信：这一年不写
        w.wrote = 1;
        const p = given(w.n), paper = kid && how !== "online";
        const intro = how === "online" ? `深夜，${who}${w.n}发来一封很长的信。` : kid ? (how === "library" ? `你还回去的那本书里夹着一张叠成方块的作业本纸，是${who}${w.n}写的。` : how === "party" ? `联欢会散了，你在书包里摸到一张叠成方块的作业本纸，是${who}${w.n}写的。` : `晚自习下课，你在课桌里摸到一张叠成方块的作业本纸，是${who}${w.n}写的。`)
          : how === "colleague" ? `周一早上，你的工位抽屉里多了一个信封，落款是${who}${w.n}。` : how === "uni" || how === "library" ? `你借的那本书里夹着一个信封，是${who}${w.n}写的。`
          : how === "blind" ? `过了几天，介绍人捎来一个信封，是${who}${w.n}写的。` : how === "hike" ? `你的背包侧袋里多了一个信封，是${who}${w.n}写的。`
          : how === "party" ? `散场后，你在外套口袋里摸到一个信封，是${who}${w.n}写的。` : how === "classmate" ? `同学会散场，${who}${w.n}追出来，往你手里塞了一个信封。` : `门缝里塞进来一个信封，是楼下的${who}${w.n}。`;
        offerLetter(paper ? "一张作业本纸" : "一封信", L,
          ["收下", `和${p}试试看`, () => { N.partner = w; w.teen = kid ? 1 : 0; S.date = 1; F.dateAge = S.age; keepLetter(w, L); tag("love"); fx({ joy: 8, rel: 2 }); say(paper ? `第二天课间，你在${p}的文具盒里放了一块新橡皮，上面用圆珠笔写了一个字：“好。”` : `你给${p}回了一条消息：“信收到了。周末有空吗？”发出去以后，你盯着屏幕等了整整一分钟。`, "warm"); }],
          ["婉拒", "把信还回去", () => { w.declined = { age: S.age, line: L.line }; N.admirers = (N.admirers || []).concat(w); fx({ joy: -1 }); say(kid ? `你把纸条折好，悄悄放回了${p}的课桌里。那之后好几天，你们谁也没看谁。` : `你约${p}喝了杯咖啡，把信还了回去：“谢谢你，真的。”${p}笑着说：“那以后还是朋友。”`); }], () => !S.date && !S.wed && !N.partner, intro); } },
    { id: "l_gaokao_split", a: [18, 19], once: 1, c: () => S.date && !S.wed && N.partner && N.partner.teen, p: () => 1,
      run() { const p = given(N.partner.n);
        if (R() >= 0.7) { fx({ joy: 6 }); return say(S.track === "high" ? `高考志愿，你和${p}偷偷对过，填了同一座城市。录取通知书到的那天，你们在电话里笑了很久。` : `毕业以后，你和${p}都留在了${city()}。那张作业本纸，被你压在了新宿舍的枕头底下。`, "warm"); }
        tag("sad"); fx({ joy: -8 }); say(S.track === "high" ? `高考结束，你和${p}的志愿填了不同的城市。送站那天，${p}把那张作业本纸的复印件塞给你：“原件我留着。”火车开动以后，你们的消息从每天一百条，慢慢变成了每周一条。` : `毕业那年夏天，${p}跟着亲戚去了南方，你留在了${city()}。你们说好每天视频，后来变成了逢年过节发一句“新年快乐”。`, "bad"); breakUp("gaokao"); } },
    // 恋爱中的信：每段感情一封，在一起头两年里的某个生日。15–17 岁的早恋也会有（一张作业本纸）
    { id: "l_letter", a: [15, 55], cd: 1, c: () => S.date && !S.wed && N.partner && !N.partner.pl && (S.age >= 18 || N.partner.teen) && S.age - (F.dateAge || S.age) <= 2, p: () => (S.age <= 17 ? 0.35 : 0.3),
      run() { const w = N.partner, p = given(w.n), kid = S.age <= 17; w.pl = 1; const L = letterText(w, S.name, "partner");
        if (!L) return;
        // 收下 ≠ 结婚：之后的分手、彩礼、骗婚照常会发生，只是这个人更可能走到最后
        const yes = () => { keepLetter(w, L); tag("love"); fx({ joy: 10, rel: 3 }); say(kid ? `你把那张纸折回方块，夹进了语文书最后一页。第二天早读，你偷偷回头看了${p}一眼，${ta()}正好也在看你。` : `你把信看了三遍，然后小心地夹进了最常看的那本书里。那天晚上，你给${p}回了一条很长的消息。`, "warm"); };
        const no = () => { F.letterNo = 1; tag("sad"); fx({ joy: -6 }); say(kid ? `你把纸条还给了${p}，小声说：“我们还是好好学习吧。”${p}点点头，那天放学，${ta()}一个人先走了。` : `你把信还给了${p}，说：“对不起，我还没准备好。”${p}笑了笑说没关系，转身的时候，你看见${ta()}抬手擦了一下眼睛。`, "bad"); breakUp("letter"); };
        offerLetter(kid ? "一张作业本纸" : "一封情书", L, ["收下这封信", "和" + p + "认真走下去", yes], ["婉拒", "这段感情到此为止", no], () => N.partner === w && S.date && !S.wed, kid ? `你生日那天，${p}在你课桌里塞了一张叠成方块的作业本纸。` : `你生日那天，${p}没送礼物，只给了你一个信封。`); } },
    // 求婚的信：在一起一年以上、还没结婚。收下离结婚更近；「再等等」不分手
    { id: "l_propose", a: [20, 58], cd: 2, c: () => S.date && !S.wed && N.partner && !N.partner.dead && !N.partner.prop && S.age - (F.dateAge || S.age) >= 1, p: () => 0.14 + (S.age > 35 ? 0.1 : 0),
      run() { const w = N.partner, p = given(w.n); w.prop = 1; const L = letterText(w, S.name, "partner");
        if (!L) return;
        const yes = () => { keepLetter(w, L); w.yes = 1; tag("love"); fx({ joy: 10, rel: 3 }); say(`你看完信，把它折好放进包里，抬头说：“好。”${p}愣了两秒，转身去叫服务员：“再加一个菜。”`, "warm"); };
        const no = () => { fx({ joy: -3 }); say(`你把信推了回去：“再给我一点时间。”${p}说好，把信收进了口袋。那顿饭你们吃得很慢。`); };
        offerLetter("一封信", L, ["收下", "答应 · 离领证更近一步", yes], ["再等等", "信还回去 · 感情还在", no], () => N.partner === w && S.date && !S.wed, S.age > 35 ? `${p}约你吃饭，点完菜，从外套内袋里拿出一个信封：“这个岁数说不出口，我写下来了。”` : `${p}约你去吃饭，菜还没上，先推过来一个信封：“你先看，看完再说。”`); } },
    // 彩礼：省份倍数 cl（江西最高，浙闽高，山东中高，东北、上海低）；家里能出的份额按档位 CAILI_S
    { id: "l_caili", a: [20, 45], once: 1, c: () => S.date && N.partner && !S.wed && S.male && (!S.urban || HIGH_CAILI.includes(S.p.n) || PF("cl") >= 1.8), p: () => (0.35 + (focus("恋爱") ? 0.1 : 0)) * Math.min(1.2, Math.max(0.5, PF("cl"))),
      run() { const lv = PF("cl", HIGH_CAILI.includes(S.p.n) ? 2.2 : 1), amt = Math.max(3, Math.round((6 + 7 * R()) * lv)); F.cailiAmt = amt; const pn = given(N.partner.n);
        const sh = [0, 0.213, 0.65, 0.95, 1, 1, 1, 1, 1, 1][S.fam || 0], can = S.src === "fang" ? amt : Math.min(amt * sh, Math.max(0, S.famPot || 0)), big = can >= amt * 0.6;
        ask("彩礼", `${pn}家里开口了：彩礼 ${amt} 万，${lv >= 1.6 ? "外加县城一套房" : "外加三金"}。${big ? "这笔钱你家拿得出来。" : can >= amt * 0.3 ? "你家的存折上只有一半。" : "你家的存折上连三成都不到。"}`, [
          ["全家凑，借也要给", big ? "爸妈出大头 · 婚能结成" : "负债 · 婚能结成", () => { if (big) { const pay = can; S.famPot = (S.famPot || 0) - pay; S.money -= amt - pay; F.paidCaili = 1; return say(`爸妈二话没说，把 ${Math.round(pay)} 万转了过去${pay < amt ? "，剩下的你自己补上" : ""}。`); } if (can >= 1) { S.famPot -= can; S.money += can; } if (!borrowOK(S)) { S.money -= amt * 1.15; F.paidCaili = 1; fx({ joy: -5 }); return say("亲戚们手头都紧，没凑够。差的那一半，你爸去借了高息贷款。", "bad"); } S.money -= amt; F.paidCaili = 1; fx({ joy: -3 }); say(`爸妈把攒了半辈子的钱取了出来，又向三个舅舅各借了几万。送彩礼那天，你爸穿着唯一一件西装，在${pn}家门口站了很久才敲门。`); }],
          ["好好谈一谈", "看对方家里", () => { if (R() < 0.55 + (S.rel - 50) / 150) { S.money -= amt * 0.5; say(`${pn}回家和父母吵了一架，最后彩礼减了一半：“钱是给咱俩过日子的，不是给别人看的。”`, "warm"); } else { tag("sad"); fx({ joy: -12 }); say(`谈崩了。${pn}在电话里哭着说“对不起”，你们就这样散了。`, "bad"); breakUp("caili"); } }],
          ["不结了", "分手", () => { tag("sad"); fx({ joy: -10 }); say("你说出“那就算了”的时候，自己都没想到会这么平静。挂了电话，你在河边坐到半夜。", "bad"); breakUp("caili"); }],
        ]); } },
    { id: "l_scam", a: [22, 45], once: 1, c: () => S.date && !S.wed && S.male && has("blind") && has("paidCaili"), p: () => 0.1 + (S.urban ? 0 : 0.06),
      run() { tag("sad"); fx({ joy: -20, rel: -6 }); S.money -= 2; F.scammed = 1; say(heavy(`婚礼办完第二十三天，${given(N.partner.n)}说回娘家住几天，就再也没回来。电话成了空号。后来你才知道，那个“介绍人”在邻县也用同样的方式办过三场婚礼。彩礼一分没追回来。`) + (S.soft ? "" : " " + HOT), "bad"); breakUp("scam"); } },
    // 催婚：27–35 岁、还没结过婚。恋爱中的人被问日子；单身的人被安排相亲。第三次被催起，可以摊牌「不打算结婚」（主动不婚，之后不再被催）
    { id: "l_cuihun", a: [27, 35], cd: 2, c: () => !S.wed && firstWed() && !has("noMarry"), p: () => (S.date ? 0.25 : 0.4) + (S.urban ? 0 : 0.1),
      run() { F.nCuihun = (F.nCuihun || 0) + 1; F.push = S.age;
        if (S.date && N.partner) return say(`过年带${given(N.partner.n)}回家，饭还没吃完，你妈就问：“日子看了没有？”${given(N.partner.n)}在桌子底下捏了捏你的手。`, "plain");
        ask("催婚", pick([`过年回家，饭桌上七大姑八大姨轮番上阵：“${S.age} 了，还挑什么？”你妈在旁边不说话，眼圈红了。`, `你妈在电话里说，楼下王阿姨的孙子都会打酱油了，又说她托人给你物色了一个，周末就能见。`]), [
          ["去相亲", "家人+ · 多半能见到人", () => { fx({ rel: 2, joy: -1 }); if (!S.date && !S.wed && R() < cl(0.55 * mkt(), 0.1, 0.85)) { const P = (N.partner = mkWriter("blind")); S.date = 1; F.dateAge = S.age; F.blind = 1; tag("love"); say(`约在${city()}的一家咖啡馆。${P.n}迟到了五分钟，一坐下就说：“我妈也逼我来的。”你们聊到了打烊。`, "warm"); } else say("你一个月见了四个人。回家你妈问怎么样，你说：“都挺好的。”然后就没有然后了。"); }],
          ["再等等", "家人− · 年夜饭有点难熬", () => { F.push = null; fx({ rel: -3, joy: -2 }); say("你说工作忙，过两年再说。你妈没接话，把一块排骨夹进了你碗里。"); }],
          ["不打算结婚", "主动不婚 · 家人−− · 以后不再被催", () => { F.noMarry = S.age; F.push = null; fx({ rel: -6, joy: 4 }); say("你放下筷子，说：“我想好了，不结婚。”桌上安静了很久。你爸先开口：“你自己过得好就行。”你妈那晚没睡，第二天还是给你包了饺子。", "big"); }, () => (F.nCuihun || 0) >= 2 && S.age >= 30 && (S.urban || !S.male || eduG() >= 2)],
        ]); } },
    // 剩男：农村、家底 D1–D3 或初中及以下的男性。介绍对象难；谈着的，彩礼和县城的房谈不拢就黄了。每来一次，之后遇见人更难一点
    { id: "l_shengnan", a: [26, 45], cd: 2, c: () => S.male && !S.urban && !S.wed && firstWed() && !has("noMarry") && ((S.famPct != null ? S.famPct : 45) < 30 || S.edu < 1), p: () => 0.25 + (S.age >= 30 ? 0.1 : 0),
      run() { F.nSheng = (F.nSheng || 0) + 1; tag("sad");
        if (S.date && N.partner) { const pn = given(N.partner.n), amt = Math.max(8, Math.round((10 + 8 * R()) * PF("cl", HIGH_CAILI.includes(S.p.n) ? 2.2 : 1))); fx({ joy: -8 }); say(`${pn}家里托媒人带话：彩礼 ${amt} 万，县城一套房，少一样都不行。你爸蹲在门口抽了半包烟，最后说：“咱家拿不出。”这门亲事就这么黄了。`, "bad"); return breakUp("caili"); }
        fx({ joy: -4 }); say(pick(["媒人这一年给你介绍了三个，人家一听你家在村里、没房没车，连面都没见。你妈跟邻居说：“我家娃老实，就是命不好。”", "村里和你同岁的男人，一半还没成家。过年喝酒，有人说要组团去外省找媳妇，没人笑。", "你在县城相了一次亲，对方第一句问的是：“县城有房吗？”你说村里有。她低头看了一眼手机，说家里有事，先走了。"]), "bad"); } },
    // 一生可以结第二次婚：前一段婚姻以离婚或丧偶结束之后
    { id: "l_wed", a: [20, 58], pri: 1, c: () => S.date && !S.wed && N.partner && !N.partner.dead && (F.wedAge == null || has("divorced") || has("widowed")) && S.age - (F.dateAge || S.age) >= (S.age < 25 ? 2 : 1) && !(firstWed() && has("noMarry")), p: () => firstWed() ? wedP1() : 0.25 + (focus("恋爱") ? 0.1 : 0) + (myLetter() ? 0.1 : 0) + (N.partner.yes ? 0.25 : 0) + (has("paidCaili") ? 0.3 : 0) - (S.age < 30 && PF("wed") < 1 ? 0.08 : 0),
      run() { S.wed = 1; F.wedAge = S.age; N.partner.wed = 1; F.marriageStrain = 0; F.cold = 0; F.apartTill = 0; tag("marriage"); fx({ joy: 12, rel: 4 }); S.money -= S.urban ? 6 : 10; moment("cert", "结婚证", `持证人：${S.name}　${N.partner.n}\n登记日期：${S.y0 + S.age} 年\n\n从今天起，家里多了一个人。`);
        say(pick([`婚礼办在${city()}的一家酒店，摆了二十八桌。司仪让你们说誓词，你准备了一晚上的稿子，开口只说出一句“以后我做饭”，全场哄堂大笑。`, `你们没办婚礼，领完证去吃了一顿火锅。${given(N.partner.n)}举着结婚证拍照，红底照片上你们笑得像两个傻子。`, `接亲那天，伴娘把鞋藏在了吊灯上，你找了四十分钟。${given(N.partner.n)}隔着门喊：“笨蛋，在上面！”`]), "big");
        // 结婚的财产变化：家境越厚，父母给得越多——过户婚房 / 一大笔成家钱；困难家庭给不出钱，但把旧的传下去
        if (S.fam0 >= 6 && !S.famProp && !F.wedHouse && (S.famPot || 0) > 50 && R() < 0.6) {
          F.wedHouse = 1; const v = Math.min(S.famPot * 0.5, 150 + 250 * R()); S.famPot -= v; S.famProp = (S.famProp || 0) + v;
          say(`爸妈把一套约 ${Math.round(v)} 万的房子过户到你们名下：“婚房早就备好了，好好过日子。”`, "big");
        } else if ((S.famPot || 0) > 2 && !F.marryAid) {
          F.marryAid = 1; const gv = [0, 0, 0, 4, 10, 22, 40, 80, 150, 300][S.fam0] * (0.6 + 0.8 * R());
          if (gv >= 1) { const pay = Math.min(S.famPot, gv); S.famPot -= pay; S.money += pay; say(gv >= 40 ? `结婚那天，爸妈把一张卡塞进你手里：“密码是你生日，${Math.round(pay)} 万，好好过日子。”` : pay >= 5 ? `婚礼前，爸妈把攒的钱取了 ${Math.round(pay)} 万给你压箱：“穷家富路。”` : `爸妈翻出存折，给了你 ${f1(pay)} 万：“就这些了，好好过日子。”`, "warm"); }
          else say(S.famPot > 0.3 ? `爸妈把一对旧镯子塞进你手里：“家里没什么钱，这是你奶奶留下的。”` : `爸妈什么都没说，只是把家里的钥匙多配了一把给你。`, "plain");
        } } },
    { id: "l_breakup", a: [18, 45], cd: 3, pri: 1, c: () => S.date && !S.wed, p: () => (firstWed() ? breakK1() : 1) * (0.06 + (S.joy < 40 ? 0.08 : 0) + ((S.juan || 0) >= 4 ? 0.05 : 0) + (S.loc === "big" && !S.urban ? 0.03 : 0) + (S.age - (F.dateAge || S.age) <= 2 ? 0.22 : 0) - (myLetter() ? 0.03 : 0)),
      run() { tag("sad"); fx({ joy: -10 }); say(pick([`你们在一起的第三年，${given(N.partner.n)}说：“我们好像只剩下'到家了吗'和'早点睡'。”那天你们都没有哭。`, `异地第二年，${given(N.partner.n)}在电话里沉默了很久，说：“我累了。”你看着窗外，城市的灯一盏盏亮起来。`]), "bad"); breakUp("breakup"); } },
    // 异地：一方被派去外地两到四年。出轨的风险会高一些
    { id: "l_apart", a: [24, 55], cd: 6, c: () => S.wed && N.partner && !N.partner.dead && working() && !apart(), p: () => 0.02 + (S.sit === "work" || S.sit === "farm" || S.loc === "rural" ? 0.025 : 0),
      run() { const y = 2 + Math.floor(R() * 3), pn = given(N.partner.n); F.apartTill = S.age + y; fx({ joy: -3 });
        say(R() < 0.5 ? `${pn}被单位派去外地，一去${y}年。每天晚上九点视频，信号不好的时候，你们就对着卡住的画面说晚安。` : `你被派去外地的项目，一去${y}年。${pn}在电话里总说：“家里都好。”`, "plain"); } },
    // 出轨：每年先看这一对夫妻有没有事，再按两边各自的概率决定是谁。两边概率的算法完全一样，不看性别
    { id: "l_cheat", a: [22, 70], cd: 3, pri: 1, first: 1, c: () => S.wed && N.partner && !N.partner.dead && S.age > F.wedAge && !F.cheat && !F.spCheat, p: () => cheatP(S.age) + cheatP(spAge()),
      run() { const me = cheatP(S.age), sp = cheatP(spAge()), pn = given(N.partner.n); F.noRomance = S.age;
        if (R() * (me + sp) >= me) { // 伴侣这一边：你还不知道
          F.spCheat = { age: S.age }; N.partner.cheated = 1; F.nSpCheat = (F.nSpCheat || 0) + 1;
          return say(soft(`${pn}最近总说加班，手机屏幕朝下扣在桌上。你问了一句，${ta()}说：“项目忙。”`, `${pn}最近回家很晚。`), "plain"); }
        F.nTempt = (F.nTempt || 0) + 1;
        const ctx = apart() ? "在外地的第二年，同一栋宿舍楼的人常约你吃饭。今晚对方说：“一个人多没意思，上来坐坐？”" : pick(["出差时认识的人，最近总在深夜给你发消息。今晚，对方说：“要不要出来喝一杯？”", "同学会以后，当年的老同学天天找你聊天，聊到了以前没说出口的话。今晚对方问：“明天能单独见一面吗？”", "健身房认识的人，最近总在你下课时“刚好”也在。今天对方说：“我送你回家吧。”"]);
        ask("深夜的消息", soft(ctx, "有人走近了你的婚姻。"), [
          ["拒绝", "什么都不会发生 · 家人+", () => { F.loyal = 1; fx({ rel: 3 }); say(soft(`你回了句“不了，早点休息”，然后把对方设成了免打扰。到家时，${pn}已经睡了，床头给你留了一盏灯。`, "你拒绝了，回了家。"), "warm"); }],
          ["暧昧", "幸福+ · 家人− · 可能被发现", () => { F.cheat = { kind: "flirt", age: S.age }; F.nFlirt = (F.nFlirt || 0) + 1; fx({ joy: 3, rel: -4 }); say(soft("你没有答应，也没有拒绝。聊天记录每天睡前删一遍，你告诉自己这不算什么。", "你没有走远，也没有回头。"), "bad"); }],
          ["越界", "幸福+ · 家人−− · 离婚风险大", () => { F.cheat = { kind: "affair", age: S.age }; F.nCross = (F.nCross || 0) + 1; F.marriageStrain = (F.marriageStrain || 0) + 1; fx({ joy: 5, rel: -8 }); say(soft("你回了一个“好”。那晚之后，手机开始设置密码，回家的时间越来越晚。", "你越过了那条线。"), "bad"); }],
        ]); } },
    // 你的事被发现了：伴侣来决定。越界比暧昧更容易走到离婚；你是过错方，财产少分
    { id: "l_caught", a: [22, 80], pri: 1, first: 1, c: () => F.cheat && S.wed && N.partner && S.age > F.cheat.age && S.age - F.cheat.age <= 6, p: () => (F.cheat.kind === "affair" ? 0.3 : 0.15),
      run() { const k = F.cheat.kind, pn = given(N.partner.n); F.noRomance = S.age;
        say(soft(k === "affair" ? `${pn}拿着你的手机坐在沙发上，没有哭，也没有吵，只说了一句：“我们的结婚照，你还记得是在哪拍的吗？”` : `${pn}看到了你没来得及删的那条消息。${ta()}把手机放回桌上，说：“你们聊得挺好的。”`, "这一年，你们的婚姻经历了一场风波。"), "bad");
        caughtOutcome(k); } },
    // 被举报 / 被闹到单位：少见。等于被发现，还要在同事面前抬不起头
    { id: "w_cheat_report", a: [24, 60], once: 1, pri: 1, first: 1, c: () => F.cheat && F.cheat.kind === "affair" && S.wed && N.partner && working() && S.age > F.cheat.age, p: () => 0.04,
      run() { F.noRomance = S.age; F.reported = 1; fx({ joy: -10, rel: -14 });
        say(soft(S.sit === "gov" ? "对方的配偶写了一封实名举报信，寄到了你单位的纪检部门。你被约谈、写检查，年底评优的名单上没有了你的名字。" : "对方的配偶找到你单位，在前台大吵了一场。第二天，整层楼都知道了。", "这一年，家里的事闹到了单位，很难堪。"), "bad");
        caughtOutcome("affair"); } },
    // 你发现伴侣出轨：你来决定。你是无过错方，离婚时多分
    { id: "l_found", a: [22, 80], pri: 1, first: 1, c: () => F.spCheat && !F.spCheat.found && S.wed && N.partner && S.age > F.spCheat.age && S.age - F.spCheat.age <= 6, p: () => 0.25,
      run() { const w = N.partner, pn = given(w.n), young = N.kids.some((k) => S.age - k.b < 18), loud = R() < 0.1; F.spCheat.found = 1; F.noRomance = S.age; F.nFound = (F.nFound || 0) + 1; tag("divorce");
        fx({ joy: -18, rel: -6 }); if (loud) { const p = CUR; CUR = "w_cheat_report"; fx({ rel: -4 }); CUR = p; }
        say(soft(loud ? `一个陌生人找到你单位，把一沓聊天截图拍在你桌上：“管好你家${pn}。”同事们都低着头，假装在看电脑。` : pick([`你在${pn}的车里发现了一张不属于你的电影票根，日期是你出差的那天。你坐在驾驶座上，很久没有发动车子。`, `家里的平板同步了${pn}的聊天记录。你从第一条翻到最后一条，天亮了。`]), "这一年，你发现婚姻里有了第三个人。"), "bad");
        ask("婚姻里的第三个人", soft(`${pn}没有否认。` + (young ? "孩子在房间里写作业，门没关严。" : ""), "怎么走下去，由你决定。"), [
          ["原谅", "再给一次机会 · 伤口好得很慢", () => { if (N.partner === w) w.forgiven = 1; F.spCheat = null; F.marriageStrain = (F.marriageStrain || 0) + 1; fx({ joy: -4, rel: 2 }); say(soft(`你们去做了半年婚姻咨询。最难的那天，咨询师让你们说出对方的三个优点，你想了很久，还是说出来了。`, "你选择了原谅。")); }],
          ["冷战", "不离，也不说话" + (young ? " · 孩子会察觉" : ""), () => { F.spCheat = null; F.cold = 1; F.marriageStrain = (F.marriageStrain || 0) + 2; if (young) F.ptmMiss = (F.ptmMiss || 0) + 1; fx({ joy: -8, rel: -6 }); say(soft(`你搬进了次卧。家里安静得只剩碗筷声。` + (young ? `${kidN()}开始在饭桌上看你们的脸色。` : ""), "你们不吵，也不说话。"), "bad"); }],
          ["离婚", "你分六成存款" + (S.house ? "，房子归你" : "") + (young ? " · 孩子要跟一方" : ""), () => { F.spCheat = null; fx({ joy: -10, rel: -6 }); const t = divorce(0.6, true, 0.65, "affair"); say(soft(`你请了律师。离婚协议上写着“过错方：${w.n}”。签完字，你一个人在民政局门口站了很久。` + t, "这一年，你们离婚了。"), "bad"); }],
        ]); } },
    { id: "l_strain", a: [28, 60], cd: 5, c: () => S.wed && N.partner && (F.marriageStrain || 0) >= 2 && !F.cheat && !F.spCheat, p: () => 0.15 + (S.money < 0 ? 0.1 : 0),
      run() { tag("divorce"); fx({ rel: -3 }); say(`你们为了一笔房贷、一次家长会、一句没回的消息吵了一整晚。凌晨三点，${given(N.partner.n)}说：“我们是不是该谈谈了。”`, "bad"); A.q(divorceAsk); } },
    { id: "l_anniv", a: [30, 90], cd: 10, c: () => S.wed && N.partner && S.age - F.wedAge >= 10 && F.noRomance !== S.age && !F.spCheat, p: () => 0.7,
      run() { const y = S.age - F.wedAge, L = myLetter(), p = given(N.partner.n); fx({ joy: 6, rel: 4 });
        if (L) { const w = N.partner; if (A.moment) A.q(() => (N.partner === w && S.wed && quoteOK(w) ? A.moment("letter", `结婚 ${y} 周年`, `那封信已经发黄了。\n“${L.line}”\n——${L.age} 岁那年，${w.n}写的。`) : false)); say(`结婚${y}周年，你翻书时掉出一个发黄的信封，是${p}当年写的那封信。“${L.line}”你转头看了一眼，${ta()}${pick(["正在沙发上打呼噜", "正戴着老花镜剥橘子", "正在厨房里哼歌", "正对着电视打瞌睡"])}。`, "warm"); }
        else say(`结婚${y}周年，你们去了第一次约会的那家小馆子。老板换了，菜也变了味，但你们还是点了当年那两道。`, "warm"); } },
    { id: "l_widow", a: [60, 100], once: 1, c: () => S.wed && N.partner, p: () => 0.008 + Math.max(0, S.age - 65) * 0.003,
      run() { const L = myLetter(); tag("death"); fx({ rel: -10 }); S.loss = "配偶"; N.partner.dead = 1; S.wed = 0; S.date = 0; F.widowed = 1; say(heavy(`${N.partner.n}走了。你们在一起${S.age - (F.wedAge || S.age)}年。出殡那天下着雨，你一直攥着${ta()}最后用过的那块手帕。` + (L ? `晚上你一个人把${given(N.partner.n)}写的那封信读了一遍又一遍：“${L.line}”` : "")), "bad"); } },
    // 故人的信：搬家、大扫除时翻出来
    { id: "l_letter_echo", a: [35, 70], once: 1, c: () => !!exLetter(), p: () => 0.05,
      run() { const ex = exLetter(), up = R() < 0.5; fx({ joy: up ? 2 : -2 });
        let t = `${pick(["搬家收拾书柜时", "年底大扫除时", "整理旧箱子时"])}，你在旧书里翻出一封信，落款是${ex.n}。你站着读完，又夹回了原处。` + (up ? "那几年，原来也挺好的。" : "有些事过去了，就让它过去吧。");
        if (S.wed && N.partner && R() < 0.2) { const p = given(N.partner.n); if (R() < 0.5) { fx({ rel: -2 }); t += `${p}看见了，问了一句“谁写的”。那天晚饭，你们都没怎么说话。`; } else t += `${p}看见了，笑着说：“哟，还留着呢？”你也笑了。`; }
        say(t, up ? "warm" : "plain"); } },
    { id: "a_admirer_echo", a: [35, 65], once: 1, c: () => (N.admirers || []).some((x) => x.how === "classmate" || x.how === "uni"), p: () => 0.04,
      run() { const x = N.admirers.find((x) => x.how === "classmate" || x.how === "uni"); fx({ joy: 3, rel: 2 }); say(`同学会上，${x.n}端着杯子过来，笑着问：“你还记得那封信吗？”你说记得。${given(x.n)}摆摆手：“那时候真傻。”${pick(["你们碰了一下杯，像两个老朋友。", "你没说的是，那张纸你其实看了很多遍。", "旁边的人起哄，你们俩都笑红了脸。"])}`, "warm"); } },
    { id: "l_reunion", a: [40, 70], once: 1, c: () => N.crush && N.crush !== N.partner && !(N.exes || []).includes(N.crush), p: () => 0.01 + (F.crushNote === 2 ? 0.015 : 0) + (has("crushSecret") ? 0.008 : 0),
      run() { fx({ joy: 5, rel: 4 }); const q = F.crushNote === 2 ? "那张纸条吗？我一直留着。" : "毕业那天你在同学录上写的话吗？"; say(`同学会上，你一眼就认出了${N.crush.n}，鬓角也白了。${N.crush.m ? "他" : "她"}端着杯子过来，笑着说：“你还记得${q}”你们都笑了，像两个十五岁的孩子。`, "warm"); } },

    /* ===== 生育 · 孩子 ===== */
    { id: "k_preg", a: [22, 44], cd: 2, c: () => S.wed && S.kids.length < 3 && !has("dink") && !(F.delayKid && S.age < F.delayKid), p: () => cl((S.kids.length ? 0.1 : 0.3) * (S.age > 35 ? 0.5 : 1) * (S.money < 0 ? 0.6 : 1) * (focus("拼事业") ? 0.7 : 1) * (focus("家人朋友") ? 1.3 : 1) * (S.age < 32 ? PF("wed") : 1), 0, 0.5),
      run() { const lose = R() < 0.08 + (S.age > 35 ? 0.1 : 0) + ((S.juan || 0) >= 5 ? 0.04 : 0);
        if (lose && !F.lost) { F.lost = 1; tag("sad"); fx({ joy: -14 }); return say(heavy(`验孕棒上出现两道杠的那天，你们去超市买了一个小小的袜子。可第十一周的检查，屏幕上没有了心跳。回家的路上，你们谁也没说话，只是一直握着手。`) + (S.soft ? "" : " " + HOT), "bad"); }
        const twin = R() < 0.012; const add = () => { const k = { n: nm(R() < 0.51, S.male ? S.name[0] : N.partner ? N.partner.n[0] : S.name[0]), b: S.age }; N.kids.push(k); S.kids.push(S.age); return k; };
        const k = add(); let t = `${S.age} 岁这年，${given(k.n)}出生了。护士把孩子抱过来时，${given(k.n)}攥住了你的一根手指，攥得很紧。`;
        if (twin && S.kids.length < 3) { const k2 = add(); t = `B 超医生说：“恭喜，两个。”${given(k.n)}和${given(k2.n)}前后差了四分钟出生，从此家里的一切都要买两份。`; }
        tag("love"); fx({ joy: 12, rel: 3 }); say(t, "big"); moment("baby", "出生证明", `${N.kids[N.kids.length - 1].n}\n${S.y0 + S.age} 年 · ${S.p.n}\n\n攥住你手指的那一刻，你成了${S.male ? "爸爸" : "妈妈"}。`); } },
    { id: "k_dink", a: [26, 36], once: 1, c: () => S.wed && N.partner && !S.kids.length && (S.money < 5 || S.loc === "big"), p: () => 0.12,
      run() { const pn = given(N.partner.n); ask("要不要孩子", `长辈们每次打电话都要问一句。你和${pn}在餐桌上算了一笔账：房贷、奶粉、学区、补习班，算到第三页纸，两个人都不说话了。`, [
        ["现在就要，咬咬牙", "生育概率↑ · 钱会更紧", () => { F.wantKid = 1; say(`${pn}把那几页纸揉成一团扔进垃圾桶：“算这些干嘛，我们爸妈当年哪有钱。”第二天，你们一起去医院做了孕前检查。`); }],
        ["先攒两年钱，三十二岁前再要", "生育推迟 · 年龄越大越难", () => { F.delayKid = S.age + 2; say(`你们约好再拼两年。${pn}在手机备忘录里写：“${S.y0 + S.age + 2} 年，要个宝宝。”`); }],
        ["丁克，两个人好好过", "不会有孩子 · 父母那关要过", () => { F.dink = 1; fx({ joy: 3, rel: -3 }); say(`你们决定不要孩子。过年回家，你妈一晚上没跟你说话，临睡前才敲门：“你们自己想好了就行，妈就是怕你们老了没人管。”`); }],
      ]); } },
    { id: "k_ptm", a: [30, 60], cd: 3, c: () => N.kids.some((k) => S.age - k.b >= 7 && S.age - k.b <= 15), p: () => 0.25 + (focus("拼事业") ? 0.1 : 0),
      run() { const kn = given(N.kids.find((k) => S.age - k.b >= 7 && S.age - k.b <= 15).n);
        ask("家长会", `班主任在家长群里@了你：“${kn}家长，本周四下午两点家长会，请务必本人到场。”那天你有一个推不掉的会。`, [
          ["请假去", `关系+ · ${BOSS()}会皱眉`, () => { F.ptmGo = (F.ptmGo || 0) + 1; fx({ rel: 4 }); moment("note", "家长会", `${kn}在课桌里给你留了一张纸条：\n“爸爸妈妈，谢谢你们来。\n我这次数学进步了十二名！”`); say(`你坐在${kn}的小椅子上，膝盖顶着课桌。班主任念到“进步最大的同学”时，${kn}回头冲你挤了挤眼睛。`, "warm"); }],
          ["让另一半去", "看伴侣有没有空", () => { if (S.wed) say(`${N.partner ? given(N.partner.n) : "另一半"}去了，回来拍了张照片给你：黑板上写着${kn}的名字，被贴了一朵小红花。`); else { F.ptmMiss = (F.ptmMiss || 0) + 1; say(`没有人去。第二天${kn}说：“老师问我爸爸妈妈是不是很忙。”`, "bad"); } }],
          ["视频参会", "老师会不高兴", () => { F.ptmMiss = (F.ptmMiss || 0) + 1; say(`你在会议室的角落里开着静音。班主任点名：“${kn}家长，孩子上课总走神，你们要多关心。”你在屏幕那头连声说“好的好的”。`, "bad"); }],
        ]); } },
    { id: "k_teacher", a: [30, 60], cd: 4, c: () => N.kids.some((k) => S.age - k.b >= 8 && S.age - k.b <= 16), p: () => 0.08 + 0.05 * (F.ptmMiss || 0) + (has("lbKid") ? 0.08 : 0),
      run() { tag("bad"); fx({ joy: -5 }); say(pick([`班主任打来电话，语气很重：“你家孩子今天在班上和同学动手了，对方家长要个说法，你现在能来一趟学校吗？”你在办公室门口站了五分钟，才想好进去第一句说什么。`, `老师发来一张照片：${kidN()}的作业本上，一整页都是空的。“孩子说家里没人看着写。家长，教育不能全交给学校。”`]), "bad"); } },
    { id: "k_tutor", a: [32, 55], once: 1, c: () => N.kids.some((k) => S.age - k.b >= 6 && S.age - k.b <= 12), p: () => 0.5,
      run() { ask("鸡娃还是放养", "家长群里，别人家孩子都报了五个班：奥数、英语、编程、钢琴、游泳。", [
        ["报，砸钱也报", "每年 −3 万 · 孩子高考+", () => { F.jiwa = 1; S.money -= 3; say(`你给${kidN()}报了四个班，周末的日程表比你的还满。有天晚上你听见孩子在被窝里小声说：“我好累。”`); }],
        ["只报一个孩子喜欢的", "平衡", () => { F.kidHobby = 1; S.money -= 1; say(`${kidN()}选了画画。每次接下课，孩子都举着一张画跑向你，画里总有一个大大的太阳。`, "warm"); }],
        ["不报，多陪陪", "关系+ · 孩子更快乐", () => { F.freeKid = 1; fx({ rel: 4 }); say(`周末你带${kidN()}去河边抓蝌蚪。别的家长说你心大，你笑笑没回。`, "warm"); }],
      ]); } },
    { id: "k_lb", a: [24, 45], once: 1, c: () => N.kids.length && S.loc === "big" && !S.urban, p: () => 0.5,
      run() { F.lbKid = 1; tag("sad"); fx({ joy: -6, rel: -3 }); say(`大城市的学校进不去，你只能把${kidN()}送回老家给爸妈带。走的那天孩子没哭，只是一直趴在车窗上看你。你突然想起很多年前，自己也是这样看着一辆大巴车开走的。`, "bad"); } },
    { id: "k_gaokao", a: [40, 70], cd: 3, c: () => N.kids.some((k) => S.age - k.b === 18), p: () => 1,
      run() { const k = N.kids.find((k) => S.age - k.b === 18), kn = given(k.n);
        const pp = cl(0.3 + (F.jiwa ? 0.15 : 0) + (F.freeKid ? 0.05 : 0) + (S.iq - 50) / 200 + (S.urban ? 0.1 : 0) - (has("lbKid") ? 0.12 : 0) - 0.04 * (F.ptmMiss || 0), 0.05, 0.9);
        if (R() < pp) { k.uni = 1; fx({ joy: 12 }); say(`查分那天，${kn}比你还冷静。分数出来，比你当年高出一大截。${kn}说：“爸妈，我考得比你们好。”你转过身去，假装在找眼镜。`, "big"); }
        else { fx({ joy: -3 }); say(`${kn}没考上本科，去读了一所职业学院。出发那天，孩子说：“你们别担心，我想学修车，我喜欢。”你忽然觉得，这样也挺好。`); } } },
    { id: "k_distant", a: [45, 80], once: 1, c: () => N.kids.length && (has("lbKid") || (F.ptmMiss || 0) >= 2), p: () => 0.25,
      run() { tag("sad"); fx({ joy: -8, rel: -5 }); say(`${kidN()}很少主动打电话。你在家族群里发了一张老照片，配文“还记得吗”，等了一天，只有一个“嗯”。你忽然明白，有些年错过了，是补不回来的。`, "bad"); } },
    { id: "k_wedding", a: [48, 75], once: 1, c: () => N.kids.some((k) => S.age - k.b >= 25), p: () => 0.25,
      run() { S.money -= S.urban ? 15 : 10; fx({ joy: 8, rel: -3 }); say(`${kidN()}结婚了。婚礼上你上台讲话，准备了一页纸，念到“你小时候……”就念不下去了。台下的亲家递过来一张纸巾。`, "big"); F.grandOK = 1; } },
    { id: "k_grandkid", a: [52, 85], once: 1, c: () => has("grandOK"), p: () => 0.35,
      run() { N.grand = { n: nm(R() < 0.5) }; fx({ joy: 10, rel: 6 }); say(`你当${S.male ? "爷爷" : "奶奶"}了。${given(N.grand.n)}第一次冲你笑的时候，你把手机里所有的照片都翻出来，找到了${kidN()}小时候同样的那个表情。`, "big"); } },
    { id: "kind_callback", a: [36, 48], once: 1, c: () => has("kindDesk") && N.desk && N.kids.some((k) => S.age - k.b >= 7 && S.age - k.b <= 12), p: () => 0.5,
      run() { fx({ joy: 8, rel: 5 }); moment("note", "老同桌", `那年你塞进铁皮铅笔盒的二十五块钱，\n${given(N.desk.n)}记了三十年。\n“你家孩子，交给我。”`); say(`新学期第一次家长会，讲台上的班主任看到你，愣了一下，然后笑了：“你是不是……${S.name}？”是${N.desk.n}。“那年的二十五块钱，我一直记着。你家孩子，交给我。”`, "warm"); } },

    /* ===== 老年 ===== */
    { id: "o_pension", a: [60, 63], once: 1, p: () => 1,
      run() { const gov = S.sit === "gov", u = S.urban || gov; const m = gov ? 5800 : u ? 3500 : 250;
        tag(u ? "up" : "sad"); say(u ? `第一笔养老金到账了，${m} 元。你在银行门口给老伴打了个电话：“以后每个月都有了。”` : `你领到了第一个月的城乡居民养老金：${m} 元。同一个月，城里退休的表哥说他一个月拿三千五。你把存折收进铁盒，第二天照常去地里。`, u ? "warm" : "bad"); } },
    { id: "o_dance", a: [60, 85], once: 1, c: () => S.hp > 60, p: () => 0.03 + (focus("广场舞") ? 0.35 : 0),
      run() { fx({ joy: 8, hp: 3 }); say("你在小区广场舞队站上了 C 位。领舞的老李说你有天赋，你说年轻时没机会学。每天晚上七点，音箱一响，你比谁都准时。", "warm"); } },
    { id: "o_uni", a: [60, 85], once: 1, c: () => focus("老年大学"), p: () => 0.4,
      run() { fx({ iq: 4, joy: 6 }); say(has("teacherFav") ? "老年大学的写作班上，你写了一篇《我的外婆》。老师念完后说：“你应该早点写的。”你忽然想起几十年前，也有一个老师这样说过。" : "你在老年大学学了书法，写的第一幅字是“家和万事兴”，裱起来挂在了客厅。", "warm"); } },
    { id: "o_lonely", a: [65, 95], cd: 6, c: () => N.kids.length && !S.wed, p: () => 0.2,
      run() { tag("sad"); fx({ joy: -4 }); say(`孩子们都在外地。你学会了用视频通话，每次挂断前都要说三遍“我挺好的”，然后一个人对着电视吃饭。`); } },
    { id: "o_corgi", a: [62, 95], once: 1, c: () => !S.wed, p: () => 0.015 + (S.money > 50 ? 0.02 : 0),
      run() { F.dog = 1; fx({ joy: 10 }); say("你从邻居家抱回来一只小柯基，取名叫“馒头”。从此每天早上六点，有个毛茸茸的家伙准时舔醒你。", "warm"); } },
    { id: "o_school_gone", a: [50, 80], once: 1, c: () => !S.urban, p: () => 0.1,
      run() { tag("sad"); say("回老家扫墓，你特意绕路去看了一眼小学。教学楼没了，变成了一片玉米地，只有那棵老槐树还在。你在树下站了很久。"); } },
    { id: "o_plane", a: [28, 50], once: 1, c: () => S.money > 10, p: () => 0.03 + (focus("家人朋友") ? 0.08 : 0),
      run() { fx({ rel: 6, joy: 6 }); say("你第一次带爸妈坐飞机。起飞时妈妈攥紧了你的胳膊，后来一直趴在舷窗上看云，说跟棉花一样。下了飞机，她给老家的姐妹们挨个打电话。", "warm"); } },
    { id: "o_lottery10", a: [30, 70], once: 1, c: () => S.money > -10, p: () => 0.006,
      run() { F.lotto = S.age; say("你开始每周买一注双色球，号码是全家人的生日。"); } },
    { id: "o_lottery_win", a: [41, 90], once: 1, c: () => F.lotto && S.age - F.lotto >= 10, p: () => 0.6,
      run() { S.money += 0.0005; fx({ joy: 3 }); say("坚持买了十年双色球，今天终于中奖了：五块钱。你兑了奖，又买了一注。", "warm"); } },

    /* ===== 批次二：求学 · 上岸 · 落户 · 照护 · 晚年 ===== */
    { id: "u_dorm", a: [18, 20], once: 1, c: () => S.track === "high" && S.edu > 1, p: () => 0.8,
      run() { N.roomie = { n: nm(S.male) }; say(`开学那天，你拖着一个比你还重的编织袋走进宿舍。上铺的${N.roomie.n}已经到了，正蹲在地上拼一张书架，抬头冲你笑：“来得正好，帮我扶一下。”那张歪歪扭扭的书架，后来陪了你们四年。`, "warm"); fx({ rel: 3, joy: 4 }); } },
    { id: "u_major", a: [18, 19], once: 1, c: () => S.track === "high" && S.edu > 1, p: () => 0.9,
      run() { ask("填专业", "志愿表上只剩最后一栏。爸妈说学计算机好找工作，你心里想的却是另一个。", [
        ["听爸妈的，学热门", "收入+ · 幸福−", () => { F.majorParents = 1; S.lvl = Math.min(1, S.lvl + 0.1); fx({ joy: -4 }); say("你在专业栏写下“计算机科学与技术”。交表的时候，你把那张写着另一个专业的草稿纸折成了一架纸飞机。"); }],
        ["学自己喜欢的", "幸福+ · 前几年收入−", () => { F.majorLove = 1; S.lvl = Math.max(0, S.lvl - 0.1); fx({ joy: 8, iq: 3 }); say("你填了自己喜欢的专业。爸爸在电话里沉默了很久，最后说：“你自己选的，就别后悔。”"); }],
      ]); } },
    { id: "u_kaoyan", a: [21, 22], once: 1, c: () => S.track === "high" && S.edu > 1, p: () => 0.4 + (focus("自我提升") ? 0.2 : 0),
      run() { ask("考研还是工作", "大四上学期，图书馆的座位要早上六点去占。室友一半在背单词，一半在投简历。", [
        ["考研", "多读三年 · 起点更高", () => { const ok = R() < 0.3 + (S.iq - 50) / 100; if (ok) { S.edu = Math.max(S.edu, 1.6); if (!S.ky) { S.ky = 1; S.tierK = (S.tierK || 0) + 1; } S.money -= 3; fx({ joy: 8 }); say("查到成绩那天，你在宿舍楼下给爸妈打电话，说着说着声音就哑了。复试通过，你成了研究生。", "warm"); } else { fx({ joy: -8 }); say("差了七分。你把考研资料打包卖给了收废品的大爷，三十多斤，卖了十一块。", "bad"); } }],
        ["直接工作", "早点挣钱", () => { S.money += 1; say("你穿上第一套西装去参加校招，在一张又一张宣讲会的桌子前，把自我介绍背得滚瓜烂熟。"); }],
      ]); } },
    { id: "g_shore", a: [23, 35], once: 1, c: () => S.sit === "gov", p: () => 0.8,
      run() { F.shore = 1; say(pick([`笔试第七，面试逆袭到第一。体检那天你一夜没睡，生怕血压高。公示名单上看到自己名字的时候，你截了图发进家族群，三分钟里收到二十七个“大拇指”。`, `考了三年，这是第四次。进面那天你穿着借来的西装，手心全是汗。走出考场，你给妈妈发了一句：“这次应该稳了。”一个月后，你上岸了。`]), "big"); fx({ joy: 10 }); } },
    { id: "hukou", a: [24, 40], once: 1, c: () => S.loc === "big" && working(), p: () => 0.12 + (S.edu > 1.5 ? 0.1 : 0) + (focus("拼事业") ? 0.05 : 0),
      run() { ask("积分落户", "落户积分还差 6 分。社保还要再交两年，或者去读一个在职学历。", [
        ["再熬两年", "大概率成功", () => { if (R() < 0.7) { F.bigHukou = 1; fx({ joy: 10 }); say("两年后，你拿到了那张薄薄的户口卡。你把它放在出租屋的桌上，拍了一张照片，配文：“我是这里的人了。”", "warm"); } else { fx({ joy: -8 }); say("政策调整，积分门槛又涨了。你看着新闻，把手机扣在了桌上。", "bad"); } }],
        ["算了，不落了", "以后可能回老家", () => { F.noHukou = 1; say("你想通了：户口只是一张纸。可每次孩子上学的事被提起，你还是会沉默一会儿。"); }],
      ]); } },
    { id: "house_life", a: [27, 50], once: 1, c: () => S.house && S.house.left > 20, p: () => 0.5,
      run() { say(pick([`搬家那天，你在毛坯墙上用铅笔写下了日期。晚上没有窗帘，你们躺在地板的床垫上，看着对面楼的灯光，觉得这里终于是“家”了。`, `交房那天，你一个人在空荡荡的客厅里站了很久。三十年房贷，还完的时候你${S.age + S.house.left}岁。你掏出手机算了一遍，又算了一遍。`]), "warm"); } },
    { id: "house_drop", a: [30, 55], once: 1, c: () => S.house && S.house.left > 0 && S.money < -15, p: () => 0.25,
      run() { tag("debt"); ask("断供", "连续三个月没还上房贷，银行打来了电话。房价比你买的时候跌了三成。", [
        ["咬牙借钱继续还", "负债更深 · 家人朋友越亲越借得到", () => {
          if (borrowOK(S) || !S.house) { S.money -= 5; fx({ joy: -6 }); if (R() < 0.25) { fx({ rel: -6 }); say("你把能借的人都借了一遍。后来为了还钱的事，和亲戚闹得很僵。", "bad"); } else say("你把能借的人都借了一遍。最难开口的那一通，是打给小时候借过你橡皮的发小。"); }
          else { S.money += S.house.P * 0.6 - S.house.P * 0.7 * S.house.left / 30; S.house = null; fx({ joy: -10 }); say("能开口的人都问遍了，没借到。房子被银行收走拍卖了。", "bad"); } }],
        ["卖房止损", "房子没了 · 一身轻", () => { if (!S.house) return; S.money += S.house.P * 0.7 - S.house.P * 0.7 * S.house.left / 30; S.house = null; fx({ joy: -8 }); say(`你签了卖房合同。中介说“这个价已经很好了”，你点点头，搬回了出租屋。那面写着日期的墙，留给了下一家人。`, "bad"); }, () => S.house],
      ]); } },
    { id: "mom_care", a: [45, 72], once: 1, c: () => has("parentLive") || has("caredParent") || S.rel > 50, p: () => 0.012 + Math.max(0, S.age - 55) * 0.002,
      run() { tag("ill"); ask("妈妈开始忘事", "妈妈第三次把你认成了你舅舅。医生说是阿尔茨海默病，会越来越严重。", [
        ["接回家亲自照顾", "家人+ 健康− 很累 · 护理开销不小", () => { F.momCare = 1; const pay = Math.round(2 + 5 * R()); S.money -= pay; fx({ rel: 5, hp: -6, joy: -4 }); say(pay >= 4 ? `你在妈妈的房门上贴了一张纸：“这是你的房间。”每天晚上你给她洗脚，她有时叫你的名字，有时叫你“同志”。请住家护工加上药费，一年自掏 ${pay} 万。有一晚她突然清醒，摸着你的头说：“你小时候头发可软了。”` : `你在妈妈的房门上贴了一张纸：“这是你的房间。”每天晚上你给她洗脚，她有时叫你的名字，有时叫你“同志”。一年护理加药费自掏 ${pay} 万。有一晚她突然清醒，摸着你的头说：“你小时候头发可软了。”`, "warm"); }],
        ["送去养老院", "每月 6000 · 每周去看", () => { S.money -= 7; fx({ joy: -5 }); say("你挑了一家离家最近的养老院。每周六你去看她，她总问你：“我什么时候能回家？”你说快了。"); }],
        ["和兄弟姐妹轮流", "看家里有没有人", () => { if (R() < 0.5) { fx({ rel: 3 }); say("你们兄弟姐妹排了值班表，一家一个月。妈妈像候鸟一样在几个城市之间迁徙，每到一家，都说这家的饭最好吃。"); } else { F.sibFight = 1; fx({ rel: -6, joy: -6 }); say("轮到二哥那个月，他说工作忙推了。你们在家族群里吵了起来，妈妈在旁边问：“你们在说谁呀？”", "bad"); } }],
      ]); } },
    { id: "retire_delay", a: [58, 62], once: 1, c: () => working() || S.age >= 58, p: () => 0.6,
      run() { say(S.y0 + S.age >= 2040 ? `新的退休政策下来了，你的退休年龄往后推了三年。同事们在群里发了一排“流泪”表情，你回了一个“加油”。` : `你算了算，再干${60 - S.age > 0 ? 60 - S.age : 1}年就退休了。抽屉里的保温杯、老花镜和一盆绿萝，好像比你更早准备好了。`); } },
    { id: "retire_day", a: [60, 65], once: 1, c: () => S.sit !== "farm", p: () => 0.9,
      run() { fx({ joy: 4 }); say(has("mentor") ? `退休那天，你把工位收拾干净，在键盘下面压了一张便利贴，留给新来的年轻人：“谁没搞砸过？我第一年……”写到一半，你笑了，想起了${N.mentor.n}。` : "退休那天，同事们送了你一束花和一张贺卡。你抱着纸箱走出大楼，回头看了一眼，十几楼的那扇窗，你在里面坐了半辈子。", "warm"); } },
    { id: "grand_clash", a: [55, 80], once: 1, c: () => N.grand, p: () => 0.25,
      run() { ask("带孙子", `你坚持给${given(N.grand.n)}多穿一件，孩子妈妈说你的老一套不科学。饭桌上，气氛有点僵。`, [
        ["听年轻人的", "关系+", () => { fx({ rel: 4 }); say("你把那件毛衣收回了柜子。晚上孩子妈妈悄悄给你买了一个按摩仪，说：“妈，您辛苦了。”", "warm"); }],
        ["坚持自己的", "幸福+ 关系−", () => { fx({ rel: -5, joy: 2 }); say("你还是给孩子穿上了。第二天，孩子出了一身汗。没人说什么，但你知道大家都在想什么。", "bad"); }],
      ]); } },
    { id: "o_health_scam", a: [62, 90], once: 1, c: () => S.money > 5 && !(S.wed && R() < 0.5), p: () => 0.006 + (S.iq < 50 ? 0.01 : 0) + (has("widowed") ? 0.01 : 0) + (N.kids.length && has("lbKid") ? 0.008 : 0),
      run() { tag("sad"); const l = Math.min(S.money * 0.3, 8); S.money -= l; fx({ joy: -6, rel: -3 }); say(`楼下的“健康讲座”每天送鸡蛋，讲师小王一口一个“阿${S.male ? "叔" : "姨"}”，比亲儿子还亲。你买了 ${l.toFixed(1)} 万的“量子保健床垫”。后来讲座搬走了，小王的电话也打不通了。你没好意思告诉孩子。`, "bad"); } },
    { id: "o_nursing", a: [78, 100], once: 1, c: () => S.hp < 45 && !S.wed, p: () => 0.3,
      run() { ask("一个人住不动了", "你在厨房摔了一跤，半个小时才爬起来。孩子们在电话里商量了一晚上。", [
        ["住养老院", "有人照看 · 要离开老房子", () => { fx({ hp: 4, joy: -4 }); say("你只带了三样东西去养老院：老伴的照片、一个搪瓷缸、一台收音机。隔壁床的老头每天下午拉二胡，拉得不怎么样，你也跟着哼。"); }],
        ["请保姆在家", "花钱 · 熟悉的家", () => { S.money -= 6; say("保姆小周是你老家隔壁县的，说话口音一样。她每天给你做一碗疙瘩汤，你吃着吃着，就想起了妈妈。", "warm"); }],
        ["搬去和孩子住", "看孩子怎么说", () => { if (N.kids.length && !has("lbKid") && R() < 0.6) { fx({ rel: 6, joy: 6 }); say(`${kidN()}二话没说，把书房腾了出来。你每天坐在阳台上晒太阳，等孙辈放学。`, "warm"); } else { fx({ joy: -8 }); say("孩子说房子小，过阵子再说。你挂了电话，把那句“没事，我一个人挺好”又对自己说了一遍。", "bad"); } }],
      ]); } },
    { id: "o_last_words", a: [75, 110], once: 1, c: () => S.hp < 35, p: () => 0.5,
      run() { const L = myLetter(), w = L && N.partner.wed && !N.partner.dead ? `你拉着${given(N.partner.n)}的手说：“那封信，我一直留着。‘${L.line}’——你都做到了。”` : N.kids.length ? `你对${kidN()}说：“别总惦记我，好好过你们的日子。”` : `你对着窗外的天说：“这辈子，还行。”`; say(`住院的那段日子，病房的窗外有一棵树，叶子一天比一天少。${w}`, "plain"); } },
    { id: "g_side", a: [28, 55], once: 1, c: () => working() && S.sit === "gov", p: () => 0.08,
      run() { ask("局里要换届", "老局长要退了。张副局是从基层一路干上来的改革派，做事雷厉风行；王副局和老局长是党校同学，人脉深、求稳。两边的人都约你周五吃饭。", [
        ["赴张副局的饭局", "他看重能干活的人 · 他若上位，你会很忙也会被重用", () => { F.side = "zhang"; F.bossFav = (F.bossFav || 0) + 1; fx({ hp: -2 }); say("饭桌上张副局没怎么喝酒，一直在问你手上那个老旧小区改造项目的进度。临走时他说：“下周把方案拿给我看看。”"); }],
        ["赴王副局的饭局", "他看重靠得住的人 · 他若上位，你会安稳也会被照顾", () => { F.side = "wang"; fx({ rel: 2 }); say("王副局给你倒了杯茶，聊了一晚上他年轻时下乡的事。散场时他拍着你的肩：“小同志，踏实，好。”"); }],
        ["两边都推掉，把手上的项目做完", "谁上位都不会记恨你 · 项目做好了会被看见", () => { F.side = "work"; F.bossFav = (F.bossFav || 0) + 1; fx({ joy: 1 }); say("那个周五，你在社区里陪施工队量了一下午的楼道。晚上回家，你把两条邀请都回了：“孩子要辅导作业，改天一定。”"); }],
      ]); } },
    { id: "g_side_res", a: [30, 58], once: 1, c: () => F.side, p: () => 0.5,
      run() { const z = R() < 0.5 + (S.y0 + S.age > 2035 ? 0.1 : 0); const winner = z ? "zhang" : "wang";
        if (F.side === "work") { if (R() < 0.5 + 0.1 * (F.bossFav || 0)) { S.lvl = Math.min(1, S.lvl + 0.15); fx({ joy: 6 }); say(`${z ? "张" : "王"}局长上任后翻了一遍各科室的项目台账，你做的那个改造项目被拿到全市会议上当典型。年底，你的名字出现在提拔名单里。`, "warm"); } else say(`${z ? "张" : "王"}局长上任了。局里的人事动了一大半，你还在原来的位置上，项目照常推进，日子照常过。`); return; }
        if (F.side === winner) { S.lvl = Math.min(1, S.lvl + 0.25); fx({ joy: 8 }); say(winner === "zhang" ? "张副局扶正了。第一次局务会，他点名让你牵头全区的改造工程。你忙得三个月没休周末，也是这三个月，你的职级往上走了一格。" : "王副局扶正了。他没有忘记那顿饭，你被调去了一个人人羡慕的科室，事少、体面，离家还近。", "warm"); }
        else { S.lvl = Math.max(0, S.lvl - 0.1); fx({ joy: -8 }); say(winner === "zhang" ? `张副局扶正了。他没为难你，只是新成立的专班里没有你的名字。你看着同事们加班到深夜，自己五点半准时下班，不知道该松口气还是该着急。` : `王副局扶正了。你被调去了档案室，窗外正对着锅炉房。同事说：“熬吧，王局还有三年就到点了。”`, "bad"); } } },

    /* ===== 创业线：合伙人 · 投资人 · 员工 ===== */
    { id: "b_start", a: [22, 55], once: 1, c: () => S.sit === "boss", p: () => 1,
      run() { N.cofounder = { n: nm(R() < 0.6) }; N.staff = { n: nm(R() < 0.5) }; say(`你和大学时的好友${N.cofounder.n}在城中村租了一间二十平的办公室，两张桌子、一台二手打印机。第一个员工是刚毕业的${N.staff.n}，面试那天${stf()}说："我不要高工资，我想学东西。"你当场就拍了板。`, "warm"); } },
    { id: "b_client", a: [23, 56], once: 1, c: () => S.sit === "boss" && N.cofounder && N.staff, p: () => 0.6,
      run() { S.money += 3; fx({ joy: 10 }); say(`第一单生意是${given(N.cofounder.n)}在酒桌上喝到吐才拿下的。合同签完那晚，你们三个人蹲在办公室门口吃烧烤，${stf()}举着啤酒说："老板，以后我们会上市吗？"你们都笑了，谁也没回答。`, "warm"); } },
    { id: "b_vam", a: [25, 55], once: 1, c: () => S.sit === "boss" && S.done.b_client, p: () => 0.35 + (focus("拼事业") ? 0.15 : 0),
      run() { N.investor = { n: pick(SUR) + "总" }; ask("投资人来了", `一家机构的${N.investor.n}看中了你们，愿意投 2000 万，条件是三年内营收翻五倍，否则你个人回购股份。${given(N.cofounder.n)}想签，你还在犹豫。`, [
        ["签对赌，拿 2000 万全速扩张", "三年后要么起飞，要么背上巨债 · 拼事业、知识高时更容易成", () => { F.vam = S.age + 3; F.bigMoney = 1; S.juan = (S.juan || 0) + 2; fx({ joy: 6, hp: -4 }); say(`你签了字。钱到账的第二周，公司从二十平搬进了写字楼的一整层，员工从八个变成八十个。${stf()}成了第一个部门经理。`); }],
        ["只拿 300 万天使轮，不签对赌", "慢一些，股权和退路都留在手里", () => { F.angel = 1; S.money += 5; fx({ joy: 2 }); say(`你跟${N.investor.n}谈了三轮，最后只拿了一小笔钱，不签任何回购条款。${N.investor.n}临走说："你会后悔的。"你说："也许吧。"`); }],
        ["不融资，用利润一点点滚", "公司不会很大，但每一分都是自己的 · 合伙人可能不满", () => { F.bootstrap = 1; F.coRift = (F.coRift || 0) + 1; say(`你婉拒了。回去的路上${given(N.cofounder.n)}一句话没说，到楼下才开口："我们不是来开小卖部的。"`); }],
      ]); } },
    { id: "b_vam_res", a: [28, 60], once: 1, c: () => F.vam && S.age >= F.vam, p: () => 1,
      run() { const ok = R() < 0.3 + (S.iq - 50) / 150 + (focus("拼事业") ? 0.1 : 0) + (S.rel > 55 ? 0.05 : 0);
        if (ok) { S.money += 80 + 120 * R(); fx({ joy: 15 }); say(`第三年的最后一个季度，营收曲线终于越过了那条线。${N.investor.n}打来电话，第一句话是："下一轮，我们领投。"你挂了电话，给全公司发了一个八百八十八的红包。`, "big"); }
        else { S.money -= 150 + 100 * R(); tag("debt"); fx({ joy: -18, hp: -6, rel: -5 }); say(heavy(`差了三成。回购条款生效，你个人要背上一笔这辈子都没见过的债。签字那天，${N.investor.n}的律师很客气，一直给你续茶。`), "bad"); } } },
    { id: "b_payroll", a: [24, 58], once: 1, c: () => S.sit === "boss" && (S.money < 5 || has("bootstrap")), p: () => 0.2,
      run() { tag("debt"); ask("发不出工资", `月底了，账上的钱只够发一半工资。三十个员工，有人刚生了孩子，有人在还房贷。`, [
        ["抵押房子，工资一分不少", "个人负债 · 员工会记住你", () => { S.money -= 20; F.loyalTeam = 1; fx({ joy: -6, rel: 6 }); say("你偷偷把房子押给了银行。发工资那天，没有人知道这笔钱是怎么来的，除了你和银行的信贷员。"); }],
        ["开全员会，坦白后先发一半", "有人会走，留下的会更齐心", () => { F.honestTeam = 1; fx({ rel: 3 }); if (R() < 0.6) say(`你站在会议室前面，把账本投在屏幕上。沉默了很久，${stf()}第一个举手："我先拿一半，剩下的等公司好了再说。"那个月走了五个人，留下的二十五个，后来成了公司的骨架。`, "warm"); else { F.teamLeft = 1; say("你把账本投在屏幕上。第二周，十二个人交了辞职信，其中有两个是骨干。", "bad"); } }],
        ["裁掉一半人", "公司活下来 · 你会失眠", () => { S.money += 5; fx({ joy: -10 }); F.cutTeam = 1; say(`你一个一个约人谈话。谈到第九个时，对方哭了，说老婆下个月预产期。那天晚上，你在办公室坐到天亮。`, "bad"); }],
      ]); } },
    { id: "b_poach", a: [26, 58], once: 1, c: () => S.sit === "boss" && N.staff && S.age - 0 > 25, p: () => 0.15 + (has("loyalTeam") ? -0.08 : 0) + (has("cutTeam") ? 0.1 : 0),
      run() { ask("核心员工要走", `${stf()}拿着大厂的 offer 来找你，年薪是你给的两倍。"老板，我不想走，可我爸要做手术。"`, [
        ["给期权，再借他手术费", "钱紧 · 他会成为你的左膀右臂", () => { S.money -= 8; F.staffStay = 1; fx({ rel: 6 }); say(`你把手术费转了过去，又签了一份期权协议。${stf()}在你办公室门口站了很久，最后鞠了一个躬。`, "warm"); }],
        ["真心祝福他走", "失去骨干 · 多一个朋友", () => { F.staffGone = 1; fx({ rel: 3, joy: -3 }); say(`你请${stf()}吃了顿饭，说："去吧，大厂能学到更多。"很多年后，${stf()}成了那家大厂的总监，给你介绍了一个大客户。`); }],
        ["拿竞业协议压他", "他留下，但心不在了", () => { F.staffBitter = 1; fx({ rel: -6 }); say(`你把竞业协议拍在桌上。${stf()}没再说话，留了下来。从那以后，每天下午六点，${stf()}的工位准时空了。`, "bad"); }],
      ]); } },
    { id: "b_split", a: [28, 58], once: 1, c: () => S.sit === "boss" && N.cofounder, p: () => 0.06 + 0.08 * (F.coRift || 0) + (has("bigMoney") ? 0.04 : 0),
      run() { tag("sad"); ask("合伙人分歧", `${given(N.cofounder.n)}想把公司卖给一家上市公司，套现走人；你想再干五年。你们在办公室吵到凌晨，烟灰缸满了两次。`, [
        ["借钱买下他的股份", "负债 · 公司彻底归你", () => { S.money -= borrowOK(S) ? 30 : 36; F.soleOwner = 1; fx({ joy: -4 }); say(`签股权转让协议那天，${given(N.cofounder.n)}把城中村那间办公室的钥匙还给了你："留个念想。"`); }],
        ["听他的，卖掉公司", "一次性套现 · 从头再来", () => { S.money += 60 + 80 * R(); S.sit = "white"; S.lvl = 0.7; fx({ joy: 4 }); say(`公司卖了。交接那天你最后一次走过每一个工位，${stf()}的桌上还贴着那张写着"我们会上市吗"的便利贴。`); }],
        ["分家，各带一半人", "两败俱伤，但都还在牌桌上", () => { S.money -= 5; F.coEnemy = 1; fx({ rel: -6 }); say(`你们分了家。后来在同一个行业展会上遇见，隔着三个展位，谁都没有先打招呼。`, "bad"); }],
      ]); } },
    { id: "b_thanks", a: [30, 65], once: 1, c: () => S.sit === "boss" && N.staff && (has("loyalTeam") || has("honestTeam") || has("staffStay")), p: () => 0.3,
      run() { fx({ joy: 10, rel: 4 }); say(`公司十周年，员工们偷偷做了一本相册。最后一页是${stf()}写的："谢谢那年发不出工资的时候，你没有放弃我们。"你翻到那一页，把相册合上，说去趟洗手间。`, "warm"); moment("letter", "十周年相册", `老板：\n那年账上只剩一半工资，你没有放弃我们。\n这十年，谢谢你。\n——全体员工`); } },
    { id: "b_staff_cheer", a: [24, 60], cd: 5, c: () => S.sit === "boss" && S.joy < 45 && N.staff, p: () => 0.25,
      run() { fx({ joy: 6 }); say(`你一个人在办公室对着报表发呆，${stf()}敲门进来，放下一份做好的方案："老板，这个客户我盯了三个月，下周签。你先回家睡一觉吧。"`, "warm"); } },
  ];

  // 你的出轨被发现以后，伴侣的反应：原谅 / 冷战 / 离婚（你是过错方：存款四成，房子归对方）。不看孩子
  function caughtOutcome(k) {
    const prev = CUR; CUR = "l_caught";
    try {
      const pn = given(N.partner.n), young = N.kids.some((x) => S.age - x.b < 18), dv = (k === "affair" ? 0.4 : 0.1) + (msat() < 40 ? 0.15 : 0), r = R();
      F.cheat = null; tag("divorce"); F.caught = (F.caught || 0) + 1;
      if (r < dv) { fx({ joy: -14, rel: -12 }); const t = divorce(0.4, false, 0.35, "affair"); say(soft(`${pn}请了律师。离婚协议上写着“过错方：${S.name}”。` + t, "这一年，婚姻走到了尽头。"), "bad"); }
      else if (r < dv + (1 - dv) / 2) { F.cold = 1; F.marriageStrain = (F.marriageStrain || 0) + 2; if (young) F.ptmMiss = (F.ptmMiss || 0) + 1; fx({ joy: -8, rel: -8 }); say(soft(`${pn}没有提离婚，搬进了次卧。家里安静得只剩碗筷声。` + (young ? `${kidN()}开始在饭桌上看你们的脸色。` : ""), "你们不吵，也不说话。"), "bad"); }
      else { F.marriageStrain = (F.marriageStrain || 0) + 1; fx({ joy: -6, rel: -6 }); say(soft(`${pn}哭了一整晚。第二天早上，${ta()}把早饭放在你面前，只说了一句：“最后一次。”`, `${pn}原谅了你。`), "bad"); }
    } finally { CUR = prev; }
  }
  function divorceAsk() {
    A.modal(`${S.age} 岁 · 婚姻的十字路口`, `你们坐在餐桌两边，中间放着一张纸。${N.kids.length ? "孩子在房间里，门没关严。" : ""}`, bind("l_divorce", [
      ["离婚", "财产对半分" + (N.kids.length ? " · 要争抚养权" : ""), () => { fx({ joy: -10, rel: -10 }); const pn = N.partner ? given(N.partner.n) : "对方"; const t = divorce(0.5, false, 0.5 + (F.ptmGo || 0) * 0.1); say(`民政局排号的人很多。签完字，你们站在门口，${pn}说了句“保重”。` + t, "bad"); }],
      ["再给一次机会", "去做婚姻咨询 · 慢慢修补", () => { F.marriageStrain = Math.max(0, (F.marriageStrain || 0) - 2); fx({ rel: 3 }); say("你们去做了半年婚姻咨询。最难的那天，咨询师让你们说出对方的三个优点，你们都想了很久，但都说出来了。"); }],
      ["为了孩子，凑合过", "表面平静", () => { F.marriageStrain = (F.marriageStrain || 0) + 1; F.cold = 1; fx({ joy: -6 }); say("你们分房睡了。在孩子面前，你们依然一起吃饭，一起笑。", "bad"); }],
    ]));
  }

  // ---------- 日常纹理：无事件时的小故事 ----------
  const DAILY = {
    baby: [`你学会了走路，第一步是朝着${"厨房"}的方向，那里有妈妈和蒸笼里的馒头香。`, `发了一场高烧，奶奶抱着你在屋里走了一整夜，嘴里哼着一首你后来再也没听到过的歌。`, `你第一次叫了“妈妈”，妈妈愣了一下，然后抱着你在院子里转了好几圈。`, `上幼儿园第一天，你扒着铁门哭了一个上午，下午却舍不得走了，因为认识了一个会叠纸飞机的小朋友。`],
    kid: [`暑假去了外婆家，你在田埂上追蜻蜓，晒得像块黑炭。外婆每天晚上给你切一个西瓜，中间那一勺永远留给你。`, `你偷偷在课本上画小人，画了一整本，被同桌传遍了全班。`, `除夕夜全家围着电视看春晚，你守到零点放完鞭炮才肯睡，第二天醒来口袋里多了一个红包。`, `你在作文里写“我的理想是当科学家”，老师给了一个大大的红勾。`],
    teen: [`晚自习停电，全班点着蜡烛，不知谁先唱起了歌，一首接一首，直到来电也没人愿意停。`, `你和父母因为玩手机大吵一架，摔门进了房间。半夜出来喝水，发现桌上留着一碗盖着盘子的面。`, `运动会上你跑了八百米，最后一圈腿像灌了铅，听见全班在看台上喊你的名字。`, `你在课桌里藏了一本小说，晚自习偷偷看到结局，哭得被老师以为身体不舒服。`],
    work: [`早高峰的地铁上，你被挤得双脚离地，手里的煎饼果子举过了头顶。`, `你在工位上吃完了今年的第三百份外卖，备注永远写着“不要香菜，谢谢”。`, `周末你终于睡到自然醒，阳光从窗帘缝里漏进来，你躺着刷了一上午手机，觉得这就是幸福。`, `过年回家，七大姑八大姨轮流问你：工资多少？对象呢？什么时候买房？你笑着剥了一下午的瓜子。`, `楼下新开了一家面馆，老板记住了你“加个蛋，多放葱”，你开始每天准时去。`],
    farm: [`天刚亮你就下地了，露水打湿了裤脚。远处的高速公路上，车一辆接一辆，都在往城里开。`, `农闲时你在村口小卖部门口打牌，输了三块钱，赢回来一包烟。`, `你在院子里种的葡萄架今年终于爬满了，晚上一家人坐在下面乘凉。`],
    mid: [`体检报告出来了，血压、血脂、尿酸都多了个箭头。医生说少熬夜，你点点头，当晚还是十二点才睡。`, `你发现自己开始看养生公众号，转发到家族群里，配文“大家都看看”。`, `孩子的作业你已经辅导不动了，一道数学题看了二十分钟，最后偷偷拍照搜答案。`, `你和老同学吃饭，聊房贷、聊孩子、聊谁谁谁离婚了，散场时有人说：“我们怎么就到这个年纪了。”`],
    old: [`你每天早上去公园打太极，打完和老伙计们坐在长椅上，聊一上午谁家孙子考了多少分。`, `你学会了用手机刷短视频，一刷就是一下午，看到好玩的就转给孩子，孩子很少回。`, `膝盖开始疼了，上下楼要扶着栏杆。你说这是老天爷给的天气预报，比手机还准。`, `你把一辈子的老照片翻出来，一张张扫描进手机，标注了每个人的名字，怕以后没人认得。`],
  };
  function daily() {
    const a = S.age;
    const k = a < 6 ? "baby" : a < 12 ? "kid" : a < 18 ? "teen" : a >= 60 ? "old" : S.sit === "farm" && a >= 18 ? "farm" : a >= 40 ? "mid" : "work";
    return pick(DAILY[k]);
  }

  // ---------- 结局：人生签 + 墓志铭 + 高光 ----------
  const SIGNS = {
    "家拼人明": ["老黄牛", "一生耕在一块地里，犁出的是别人的路。"],
    "家拼人今": ["灶膛火", "烧得最旺的时候，满屋子都是暖的。"],
    "家拼己明": ["石磨", "转了一圈又一圈，磨出的都是日子。"],
    "家拼己今": ["鞭炮", "响过一声，就把这一年都照亮了。"],
    "家稳人明": ["老槐树", "站在村口几十年，等每一个回家的人。"],
    "家稳人今": ["炉上茶", "不烫嘴，也不凉，刚好。"],
    "家稳己明": ["井", "不声不响，深处有水。"],
    "家稳己今": ["竹椅", "坐上去吱呀一声，就是一个下午。"],
    "远拼人明": ["孺子牛", "走到哪里，就把那里的土翻一遍。"],
    "远拼人今": ["萤火", "自己不大，却替别人照了一段夜路。"],
    "远拼己明": ["候鸟", "一辈子在飞，没忘记来的方向。"],
    "远拼己今": ["风筝", "线攥在手里，人在天上。"],
    "远稳人明": ["渡船", "来来回回，把人送到对岸。"],
    "远稳人今": ["路灯", "站在陌生的街上，亮给每一个晚归的人。"],
    "远稳己明": ["闲云", "不急着去哪，却也没停过。"],
    "远稳己今": ["蒲公英", "风吹到哪，就在哪里开花。"],
  };
  function ending(s) {
    S = s; F = s.F; N = s.N;
    const far = S.loc === "big" || S.loc === "prov" ? 1 : 0;
    const grind = (S.juan || 0) >= 6 || S.sit === "boss" || has("jumped") || has("pushed") ? 1 : 0;
    const others = (has("caredParent") ? 2 : 0) + (has("momCare") ? 2 : 0) + (has("kindDesk") ? 1 : 0) + (F.ptmGo || 0) + (F.homeNY || 0) + (S.rel > 60 ? 1 : 0) >= 3 ? 1 : 0;
    const tomorrow = S.peak > 50 || has("jiwa") || S.house ? 1 : 0;
    const key = (far ? "远" : "家") + (grind ? "拼" : "稳") + (others ? "人" : "己") + (tomorrow ? "明" : "今");
    const [sign, verse] = SIGNS[key];
    const hl = [];
    if (has("gotLetter")) { const L = N.partner && N.partner.letter, ex = (N.exes || []).some((e) => e.letter);
      hl.push(L && N.partner.wed ? `收到过一封情书，后来${S.male ? "娶" : "嫁"}了写信的人` : ex ? "收到过一封情书，写信的人后来成了故人" : L ? "收到过一封情书，写信的人一直在身边" : "收到过一封情书，没有收下，却记了很多年"); }
    if (has("kindDesk") && S.done.kind_callback) hl.push("小时候分出去的二十五块钱，几十年后回来了");
    if (has("caredParent") || has("momCare")) hl.push("在父母最需要的时候，守在了床边");
    if ((F.promos || 0) >= 2) hl.push(`升职 ${F.promos} 次`);
    if (has("rivalBeaten")) hl.push("在会议室里，为自己站起来过一次");
    if (N.kids.some((k) => k.uni)) hl.push("孩子考得比自己好");
    if (S.done.o_plane) hl.push("带爸妈坐了第一次飞机");
    if (has("dog")) hl.push("晚年有一只叫馒头的柯基");
    if (S.done.o_lottery_win) hl.push("坚持十年，中了五块钱");
    if ((F.missNY || 0) >= 2) hl.push(`有 ${F.missNY} 个除夕没回家`);
    if (has("divorced")) hl.push("离过一次婚");
    if (has("noMarry") && F.wedAge == null) hl.push("没有结婚，按自己的意思过了一辈子");
    const loved = N.partner && N.partner.wed && quoteOK(N.partner); // 出轨过、没被原谅的配偶：不写「被爱过」，也不引用那封信
    const ep = loved ? `这里睡着一个被爱过的人。` : N.kids.length ? `这里睡着${N.kids.length > 1 ? N.kids.length + "个孩子" : "一个孩子"}的${S.male ? "父亲" : "母亲"}。` : grind ? "这里睡着一个从没停下来过的人。" : "这里睡着一个认真活过的人。";
    // 墓志铭下的那句信：只引用配偶自己写的那一句
    const epiLine = loved ? `“${N.partner.letter.line}”——${N.partner.n}` : "";
    return { sign, verse, epitaph: ep, epiLine, highlights: hl.slice(0, 5), stories: S.story };
  }

  // ---------- 主循环 ----------
  function init(s) {
    S = s; s.F = {}; s.N = { kids: [] }; s.cool = {}; s.done = {}; s.story = 0;
    if (R() < 1 / 1461) { s.F.feb29 = 1; }
  }
  function year(s, api) {
    S = s; A = api; N = s.N; F = s.F; S.juan = S.juan || 0;
    if (S.age === 1 && F.feb29) say("你出生在 2 月 29 日。每四年，你才能真正过一次生日。", "warm");
    if (S.age === 100) say(`你活到了一百岁。街道办送来一块“人瑞”的牌匾，你戴着老花镜看了半天，说字写得不错。`, "big");
    // 婚姻结束，出轨的线也就断了；没被发现的，六年后悄悄结束
    if (!S.wed) { F.cheat = null; F.spCheat = null; }
    if (F.cheat && S.age - F.cheat.age > 6) F.cheat = null;
    if (F.spCheat && !F.spCheat.found && S.age - F.spCheat.age > 6) F.spCheat = null;
    const fired = [];
    for (const e of E) {
      if (S.age < e.a[0] || S.age > e.a[1]) continue;
      if (e.once && S.done[e.id]) continue;
      if (S.cool[e.id] && S.cool[e.id] > S.age) continue;
      if (e.c && !e.c()) continue;
      const p = cl(e.p ? e.p() : 0.1, 0, 1);
      if (R() < p) fired.push(e);
    }
    // 每年最多 2 件故事：优先一次性的人生大事
    fired.sort((x, y) => (y.once || y.pri ? 1 : 0) - (x.once || x.pri ? 1 : 0) + (R() - 0.5) * 0.5); // pri：和一次性大事同等优先（如分手）
    const take = fired.slice(0, 2).sort((x, y) => (y.first ? 1 : 0) - (x.first ? 1 : 0)); // 出轨类的事先发生：同一年里的周年纪念就不再浪漫
    for (const e of take) {
      if (e.c && !e.c()) continue; // 同一年先发生的事（如分手）可能已让它不成立
      S.done[e.id] = 1; if (e.cd) S.cool[e.id] = S.age + e.cd;
      CUR = e.id; e.run(); CUR = ""; S.story++;
    }
    if (!take.length) say(daily(), "plain");
  }
  window.STORY = { init, year, ending, events: E, gain, borrowOK };
})();
