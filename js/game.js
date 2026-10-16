(() => {
/* ---------- Hằng số ---------- */
const VIEW_H = 600;      // chiều cao khung nhìn (đơn vị thế giới)
let PX = 1;              // số điểm ảnh canvas trên mỗi đơn vị thế giới; fit() tính theo màn hình để hình luôn nét
const R = 22;            // bán kính bóng
const G = 1900, JUMP = 760, MAXV = 320;
let TIME_LIMIT = 300;                 // phải về đích trong 5 phút (màn 2: 7 phút)
// Bộ chiêu của Pikachu: mọi chiêu tốn điện năng (0–100), nạp khi chạy, nhặt sao, hạ quái, đánh trúng boss
const ENERGY_MAX = 100, ENERGY_START = 50;
const COST = { shock: 5, ball: 20, web: 30, tackle: 25, volt: 100 };
const SHOCK_SPEED = 720, SHOCK_LIFE = .7, SHOCK_CD = .3;            // Tia sét: bấm J
const BALL_HOLD = .25, BALL_FULL = .9;                             // Quả cầu điện: giữ J rồi thả
const WEB_SPEED = 460, WEB_LIFE = .65, WEB_STUN = 2;                // Lưới điện: L
const TACKLE_TIME = .55, TACKLE_DASH = .35, TACKLE_SPEED = 700, TACKLE_CD = 1;   // Lao điện: Shift
// Phong ấn của boss: Pikachu bị đóng băng, laze bắn 1 giây trước khi kết thúc
const TS_DUR = 3.5, LASER_AT = 1, LASER_DUR = .35, LASER_CHARGE = .8, LASER_H = 56;
let LEVEL_W = 7000, DEATH_Y = 900;
const LIVES = 3;
// Đấu trường boss ở cuối màn
const ARENA = { l: 6220, r: 6950, gateX: 6190, floor: 420 };   // loadMap() đặt lại theo màn
let ARENA_MID = (ARENA.l + ARENA.r) / 2;
const BOSS_W = 64, BOSS_H = 112, AURA_R = 105, WARN = .7;
const EXHAUST = 1.4;                  // boss kiệt sức sau mỗi chiêu: đánh lúc này sát thương ×2
const SWEEP_H = 200, SWEEP_SPEED = 420;
const PHASES_LN = [null,
  { tag: 'Giai đoạn 1', hp: 12, every: 3.6, seal: 0,
    note: 'Lilith bay lượn, chỉ hạ xuống đất khi kiệt sức sau mỗi chiêu: lúc đó giẫm hoặc đánh để gây sát thương ×2. Né gai băng (khung xanh báo trước) và mũi băng. Lên bục để bắn trúng khi Lilith bay.' },
  { tag: 'HELL MODE', hp: 12, every: 3, seal: 8,
    note: 'Lilith nhanh hơn, tạo vũng băng trơn trượt và cứ 8 giây phong ấn bạn (Shift để thoát, nhảy né laze). Giữ ít nhất 25 điện năng cho cú đánh úp!' },
  { tag: 'HELL MODE', hp: 12, every: 3.2, seal: 9,
    note: 'Naamah lao ngang để lại vệt lửa, nhảy đập đất tạo sóng chấn động (nhảy qua), ném cầu lửa và dựng cột lửa. Phong ấn mỗi 9 giây.' },
  { tag: 'HỢP THỂ', hp: 20, every: 4, seal: 0,
    note: 'Khiên băng lửa chỉ hở khi bạn đang Lao điện (Shift) hoặc boss kiệt sức sau mỗi chiêu; 100.000 Vôn luôn xuyên khiên. Nhặt vết tích: sát thương ×2.',
    note2: 'Nửa máu sau: laze quét dọc cả đấu trường (lên bục cao nhất để né) và dơi xuất hiện!' },
];
// Màn 2: Zagred (Black Clover) — ma pháp Ngôn Hồn, mỗi lời nói ra đều thành thật
const PHASES_Z = [null,
  { tag: 'Giai đoạn 1', hp: 16, every: 2.9, seal: 0,
    note: 'Zagred bay lơ lửng và dùng Ngôn Hồn: “Xuyên!” gai bóng tối trồi lên chỗ bạn đứng, “Nghiền!” cột bóng tối đè xuống, cầu tối bắn quạt. Hắn hạ xuống khi kiệt sức sau mỗi chiêu: giẫm hoặc đánh để gây ×2.' },
  { tag: 'HÌNH DẠNG THẬT', hp: 22, every: 2.5, seal: 9,
    note: 'Zagred lộ hình dạng thật: “Rơi!” mưa thiên thạch tối, “Diệt!” laze quét cả đấu trường (lên bục cao để né), cứ 9 giây “Đứng yên!” phong ấn bạn (Shift để thoát, nhảy né laze).' },
];
let PHASES = PHASES_LN;
// Thời lượng báo trước của từng chiêu boss
const ACT_WARN = { fan: .5, spikes: .3, puddle: .4, dash: .6, slam: .35, lob: .4, pillar: .3, dual: .5, sweep: 1, xuyen: .4, orbs: .4, nghien: .5, rain: .6 };
// lời Zagred hô khi ra chiêu
const ZAG_WORDS = { xuyen: '“Xuyên!”', orbs: '“Bắn!”', nghien: '“Nghiền!”', rain: '“Rơi!”', sweep: '“Diệt!”' };
// Hợp thể sau khi Naamah bị hạ
const FUSE = { ghost: .5, merge: 1.4, end: 2.2 }, FUSED_HP = 20, FUSED_K = 1.35;
const FW = BOSS_W * FUSED_K, FH = BOSS_H * FUSED_K;
// Màn chuyển cảnh khi Lilith bị hạ: Naamah chui ra, hiện sau lưng Pikachu và đánh úp
const CUT = { burst: .9, emerge: .6, vanish: 1.5, appear: 1.7, strike: 2.5, end: 2.9 };

let CHAR = 'pika';       // nhân vật đang chơi: pika, chii, rimuru, stelle, saiyan, kiem, asta, yuno (xem CHARS, CHAR_UI)
let paused = false;      // đang mở bảng chọn nhân vật

const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
const $ = id => document.getElementById(id);
let viewW = 1000;

/* ---------- Màn chơi ----------
   Màn 1 "Đồng cỏ": đi ngang, boss Lilith & Naamah. Màn 2 "Núi Quỷ": leo chéo lên đỉnh núi, khó hơn, boss Zagred.
   Mọi bảng dưới đây được dựng lại bởi loadMap() khi đổi màn. */
let MAP = 1;
const SOLIDS = [], SPIKES = [], STAR_POS = [], ENEMY_DEF = [], FLOWERS = [], SIGNS = [], CHECKPOINTS = [], TIPS = [], FLYER_DEF = [], GROUNDS = [], HEARTS = [];
const GOAL = {}, TURRET = {}, SPAWN = {};
let CAM_Y = [-250, 100];   // giới hạn camera theo chiều dọc
let ENEMY_SPEED = 70;
const MAX_LIVES = 5;      // tim hồi mạng tối đa
const PIKA_TIP = 'Thanh ⚡ là điện năng. J: tia sét · giữ J rồi thả: Quả cầu điện (chạy càng nhanh càng mạnh) · L: Lưới điện · Shift: Lao điện · U khi đầy: 100.000 Vôn · G: Dynamax (to ×10, bộ chiêu hack) · Z: tuyệt kĩ Z Catastropika.';
// hố do Shinra Tensei khoét vào mặt đất (xoá khi chơi lại hoặc đổi màn)
const CRATERS = [];
function craterAt(x) {
  let d = 0;
  for (const c of CRATERS) { const u = (x - c.x) / c.r; if (u > -1 && u < 1) d += c.d * (1 - u * u); }
  return Math.min(d, 220);
}
// dựng lại đa giác mặt đất theo hàm độ cao (gồm cả hố)
function groundPts(s) {
  const { x0, x1, f } = s.gd, top = [];
  for (let x = x0; x < x1; x += 16) top.push(x, f(x));
  top.push(x1, f(x1));
  s.top = top; s.pts = top.concat([x1, f(x1) + 1400, x0, f(x0) + 1400]);
  let m = Infinity; for (let i = 1; i < top.length; i += 2) m = Math.min(m, top[i]);
  s.minY = m;
}
function reshapeGround(a, b) { for (const s of SOLIDS) if (s.gd && s.maxX > a && s.minX < b) groundPts(s); }
function addGround(x0, x1, base) {
  const f = x => base(x) + (CRATERS.length ? craterAt(x) : 0);
  const s = { kind: 'ground', minX: x0, maxX: x1, gd: { x0, x1, f } };
  groundPts(s); SOLIDS.push(s);
  GROUNDS.push([x0, x1, f]);
  return f;
}
function addBox(x, y, w, h) {
  addSolid([x, y, x + w, y, x + w, y + h, x, y + h], [x, y, x + w, y], 'plat');
}
function addSolid(pts, top, kind) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity;
  for (let i = 0; i < pts.length; i += 2) { minX = Math.min(minX, pts[i]); maxX = Math.max(maxX, pts[i]); minY = Math.min(minY, pts[i + 1]); }
  SOLIDS.push({ pts, top, kind, minX, maxX, minY });
}
// tường phải và cổng trái của đấu trường
function addArenaWalls() {
  addBox(ARENA.r, ARENA.floor - 1220, 80, 1300);
  addBox(ARENA.gateX, ARENA.floor - 1220, 30, 1220);
  SOLIDS[SOLIDS.length - 1].gate = true;
  SOLIDS[SOLIDS.length - 1].fixed = SOLIDS[SOLIDS.length - 2].fixed = true;   // Shinra Tensei không phá được
}
function buildMap1() {
  LEVEL_W = 7000; DEATH_Y = 900; TIME_LIMIT = 300; CAM_Y = [-250, 100]; ENEMY_SPEED = 70;
  Object.assign(ARENA, { l: 6220, r: 6950, gateX: 6190, floor: 420 });
  Object.assign(SPAWN, { x: 120, y: 440 });
  const f1 = addGround(0, 1400, x => x < 350 ? 480 : 480 - 50 * Math.sin((x - 350) / 525 * Math.PI) ** 2);
  addBox(880, 320, 150, 26);
  const f2 = addGround(1540, 2640, x => Math.abs(x - 2090) < 470 ? 480 - 160 * (1 + Math.cos(Math.PI * (x - 2090) / 470)) / 2 : 480);
  addBox(2720, 430, 140, 26);
  addBox(2940, 370, 130, 26);
  addBox(3140, 430, 130, 26);
  const f3 = addGround(3330, 4420, x => x < 3900 ? 480 : x < 4200 ? 480 - (x - 3900) * .4 : 360);
  const f4 = addGround(4540, LEVEL_W, x => x >= 6140 ? 420 : 420 - 22 * Math.sin((x - 4540) / 200 * Math.PI) ** 2);
  addBox(5600, 300, 140, 26);
  addBox(6330, 290, 110, 22);                       // bục nhảy trong đấu trường để né chiêu
  addBox(6535, 200, 120, 22);
  addBox(6750, 290, 110, 22);
  addArenaWalls();
  SPIKES.push({ x0: 3560, x1: 3660, f: f3 }, { x0: 5150, x1: 5230, f: f4 });
  STAR_POS.push([500, 400], [700, 370], [955, 280], [1470, 380], [2090, 260], [2790, 390],
    [3005, 320], [3610, 380], [4050, 370], [4480, 300], [5190, 330], [5670, 250]);
  ENEMY_DEF.push({ min: 3700, max: 3880, f: f3 }, { min: 4800, max: 5050, f: f4 }, { min: 5300, max: 5550, f: f4 },
    { min: 1150, max: 1320, f: f1 });    // quái đầu tiên để tập giẫm
  FLOWERS.push([180, f1, 1], [760, f1, .8], [1700, f2, 1.1], [2470, f2, .9], [3460, f3, 1], [4300, f3, .9], [4700, f4, 1.1], [5800, f4, .8]);
  SIGNS.push([300, f1], [1330, f1], [4370, f3]);
  CHECKPOINTS.push({ x: 3420, f: f3 }, { x: 6080, f: f4 });
  Object.assign(GOAL, { x: 6880, f: f4 });
  // Đường đến boss: mẹo theo từng chặng, tim hồi mạng, ụ băng để tập né đạn như khi đánh boss
  TIPS.push(
    { x: 420,  f: f1, text: PIKA_TIP },
    { x: 960,  f: f1, text: 'Quái vuông phía trước: nhảy giẫm lên đầu để hạ nó.' },
    { x: 1760, f: f2, text: 'Dơi lao xuống khi bạn tới gần: giẫm lên đầu hoặc bắn sét.' },
    { x: 2300, f: f2, text: 'Ma lửa bay xuyên mọi thứ và không giẫm được: chỉ chiêu điện mới hạ được nó.' },
    { x: 2620, f: f2, text: 'Giữ ↑ lâu để nhảy cao và xa qua các bục.' },
    { x: 3500, f: f3, text: 'Gai phía trước: nhảy qua, hoặc Lao điện (Shift) để xuyên qua.' },
    { x: 4560, f: f4, text: 'Chim băng thả cột băng: nhìn bóng đổ dưới đất để né, nhảy lên bắn sét để hạ chim.' },
    { x: 5480, f: f4, text: 'Ụ băng bắn đạn sát đất: nhảy qua, bắn sét phá đạn, hoặc Lao điện phá ụ.' },
    { x: 6130, f: f4, text: 'Boss phía trước! Đánh mạnh nhất khi boss kiệt sức sau mỗi chiêu. Giữ ít nhất 25 điện năng cho cú đánh úp.' });
  // Quái bay: dơi lao xuống, chim băng thả cột băng, ma lửa chỉ hạ được bằng chiêu điện
  FLYER_DEF.push({ type: 'bat', x: 1900, y: 226 }, { type: 'bat', x: 3000, y: 262 }, { type: 'bat', x: 5000, y: 272 },
    { type: 'ghost', x: 2400, y: 330 }, { type: 'ghost', x: 4300, y: 290 },
    { type: 'bird', x: 4800, y: 250, x0: 4620, x1: 4980 }, { type: 'bird', x: 5420, y: 250, x0: 5300, x1: 5560 });
  HEARTS.push([2090, 200], [5990, 372]);
  Object.assign(TURRET, { x: 5940, f: f4, every: 2.4, speed: 260, range: 760, hp: 2 });
}
// Màn 2 "Núi Quỷ": leo chéo từ chân núi lên đỉnh (cao hơn ~2.600), có cầu thang bục, vực sâu (rơi là mất mạng),
// quái nhanh hơn, ụ băng bắn nhanh hơn, boss Zagred trên đỉnh
function buildMap2() {
  LEVEL_W = 8190; DEATH_Y = 900; TIME_LIMIT = 420; CAM_Y = [-2620, 100]; ENEMY_SPEED = 100;
  Object.assign(ARENA, { l: 7300, r: 8110, gateX: 7270, floor: -2100 });
  Object.assign(SPAWN, { x: 120, y: 440 });
  // chân núi: dốc thoải đi lên
  const g1 = addGround(0, 1500, x => x < 300 ? 480 : 480 - (x - 300) * .3);
  // cầu thang bục qua vực thứ nhất
  addBox(1580, 70, 110, 24); addBox(1730, 0, 110, 24); addBox(1880, -70, 110, 24); addBox(2030, -140, 90, 24);
  // sườn núi dốc
  const g2 = addGround(2140, 3400, x => -170 - (x - 2140) * .36);
  // bục lơ lửng zíc zắc qua vực thứ hai
  for (const [x, y, w] of [[3460, -690, 120], [3640, -760, 110], [3820, -840, 110], [3990, -910, 120], [4170, -985, 110], [4350, -1055, 120], [4540, -1115, 130]]) addBox(x, y, w, 22);
  // sườn trên có bãi bằng đặt ụ băng
  const g3 = addGround(4720, 6120, x => x < 5350 ? -1160 - (x - 4720) * .3 : x < 5800 ? -1349 : -1349 - (x - 5800) * .4);
  // cầu thang bục chéo lên đỉnh, bên dưới là vực
  for (let i = 0; i < 6; i++) addBox(6200 + i * 150, -1550 - i * 90, 120, 22);
  // đỉnh núi: đấu trường của Zagred
  const g4 = addGround(7100, LEVEL_W, () => -2100);
  addBox(7410, -2230, 110, 22); addBox(7645, -2320, 120, 22); addBox(7890, -2230, 110, 22);
  addArenaWalls();
  SPIKES.push({ x0: 900, x1: 980, f: g1 }, { x0: 2600, x1: 2700, f: g2 }, { x0: 3100, x1: 3180, f: g2 },
    { x0: 5060, x1: 5150, f: g3 }, { x0: 5880, x1: 5960, f: g3 });
  STAR_POS.push([520, 380], [1180, 160], [1635, 20], [1935, -120], [2450, -320], [2900, -480],
    [3700, -810], [4040, -960], [4400, -1105], [4980, -1290], [5600, -1420], [6260, -1610], [6560, -1790], [6860, -1970]);
  ENEMY_DEF.push({ min: 620, max: 860, f: g1 }, { min: 2300, max: 2520, f: g2 }, { min: 2780, max: 3060, f: g2 },
    { min: 4800, max: 5000, f: g3 }, { min: 5420, max: 5560, f: g3 }, { min: 5880, max: 6080, f: g3 });
  FLOWERS.push([200, g1, .9], [1300, g1, .8], [2250, g2, 1], [4800, g3, .9]);
  SIGNS.push([260, g1], [2200, g2]);
  CHECKPOINTS.push({ x: 2260, f: g2 }, { x: 4790, f: g3 }, { x: 7140, f: g4 });
  Object.assign(GOAL, { x: 8010, f: g4 });
  TIPS.push(
    { x: 400,  f: g1, text: 'Màn 2 — Núi Quỷ: leo lên đỉnh núi đánh Zagred. Quái chạy nhanh hơn, vực sâu rơi là mất mạng.' },
    { x: 1420, f: g1, text: 'Vực phía trước: nhảy lên từng bục để leo sang sườn núi.' },
    { x: 2560, f: g2, text: 'Sườn dốc có gai và quái: nhảy qua gai, giẫm quái từ trên xuống.' },
    { x: 3380, f: g2, text: 'Bục lơ lửng zíc zắc: chim băng thả cột băng, dơi lao xuống. Giữ ↑ để nhảy cao.' },
    { x: 5280, f: g3, text: 'Ụ băng bắn nhanh hơn: nhảy qua đạn hoặc phá ụ.' },
    { x: 6100, f: g3, text: 'Cầu thang bục cuối: nhảy chéo lên đỉnh, bên dưới là vực. Zagred dùng ma pháp Ngôn Hồn: mỗi lời hắn nói đều thành thật!' },
    { x: 7200, f: g4, text: 'Zagred: “Xuyên!” gai trồi lên · “Nghiền!” cột đen đè xuống · “Đứng yên!” phong ấn bạn (Shift để thoát). Đánh khi hắn kiệt sức.' });
  FLYER_DEF.push({ type: 'bat', x: 1800, y: -200 }, { type: 'bat', x: 3750, y: -960 }, { type: 'bat', x: 5200, y: -1480 },
    { type: 'ghost', x: 2950, y: -620 }, { type: 'ghost', x: 4650, y: -1260 }, { type: 'ghost', x: 6000, y: -1700 },
    { type: 'bird', x: 3800, y: -1060, x0: 3550, x1: 4150 }, { type: 'bird', x: 4300, y: -1230, x0: 4100, x1: 4600 },
    { type: 'bird', x: 6600, y: -1950, x0: 6400, x1: 6900 });
  HEARTS.push([1935, -150], [4560, -1160], [6710, -1880]);
  Object.assign(TURRET, { x: 5700, f: g3, every: 1.7, speed: 330, range: 720, hp: 3 });
}
function loadMap(n) {
  MAP = n === 2 ? 2 : 1;
  CRATERS.length = 0;
  for (const a of [SOLIDS, SPIKES, STAR_POS, ENEMY_DEF, FLOWERS, SIGNS, CHECKPOINTS, TIPS, FLYER_DEF, GROUNDS, HEARTS]) a.length = 0;
  (MAP === 2 ? buildMap2 : buildMap1)();
  ARENA_MID = (ARENA.l + ARENA.r) / 2;
  PHASES = MAP === 2 ? PHASES_Z : PHASES_LN;
  ACT_LIST = MAP === 2 ? ACT_LIST_Z : ACT_LIST_LN;
}
const newFlyer = d => ({ ...d, ax: d.x, ay: d.y, t: Math.random() * 6, alive: true, stun: 0, state: 'patrol', cd: 0, dir: 1, dropT: 1.2, dieT: 0, r: d.type === 'ghost' ? 18 : 16 });
// Mặt đất dùng cho Quả cầu điện nảy và cột băng rơi
function groundYAt(x) { for (const [a, b, f] of GROUNDS) if (x >= a && x <= b) return f(x); return null; }

/* ---------- Trạng thái ---------- */
const S = {};
function reset() {
  Object.assign(S, {
    ball: { x: SPAWN.x, y: SPAWN.y, vx: 0, vy: 0, rot: 0, squash: 0, run: 0, face: 1 },
    spawn: { ...SPAWN }, safeY: SPAWN.y,
    cam: { x: 0, y: 0 },
    onGround: false, lastGround: 0, jumpBuf: 0, jumpHeld: false,
    stars: STAR_POS.map(([x, y]) => ({ x, y, got: false })),
    hearts: HEARTS.map(([x, y]) => ({ x, y, got: false })),
    turret: { ...TURRET, t: 0, alive: true, flash: 0 }, tshots: [], tipSeen: TIPS.map(() => false),
    enemies: ENEMY_DEF.map(e => ({ ...e, x: (e.min + e.max) / 2, dir: 1, alive: true, squash: 0, stun: 0 })),
    flyers: FLYER_DEF.map(newFlyer), icicles: [],
    bossKills: 0, submitted: false,
    power: 0, cd: 0, cp: -1, dead: 0, deaths: 0, time: 0, won: false, lost: false, parts: [], t: 0, moved: false,
    lives: LIVES, fight: false, gateClosed: false, safe: 0, tsEsc: false, sky: 0,
    boss: newBoss(),
    traces: 0, pops: [], flash: 0, bolts: [], cast: 0,
    energy: ENERGY_START, shockCd: 0, webCd: 0, charging: false, chargeT: 0, orbs: [], webs: [], dash: null, voltFx: 0, voltStrikes: [], slick: false,
    lastDir: 1,
    bullets: [],
    // chiêu của Chiikawa, Rimuru, Stelle
    waves: [], columns: [], swing: 0, cry: 0, amber: 0, amberCd: 0, resist: 0, maw: null, airJumps: 0, ultKind: CHAR,
    ape: 0, boom: 0, blast: null, whistleCd: 0, regenOn: false,   // Xayda
    kfx: [], ktor: [], timers: [], kpose: null, kposeT: 0, songCd: 0, tamCd: 0, bleed: 0, bleedTick: 0,   // Kiếm khách
    slashes: [], spin: 0, black: 0, ytor: [],   // Asta, Yuno
    shinra: null, chibaku: null, pull: null, pullLines: [], spikeGone: new Set(),   // Pain
    kame: null, ui: 0, uiBurst: null, tele: [],   // Goku
    zCd: 0, zFx: 0, vbeam: null,   // Pikachu: tuyệt kĩ Z, tia 100.000 Vôn
  });
  // địa hình bị Shinra Tensei phá được dựng lại
  for (const s of SOLIDS) s.broken = 0;
  if (CRATERS.length) { CRATERS.length = 0; reshapeGround(-Infinity, Infinity); }
  $('win').hidden = true;
  $('lose').hidden = true;
  $('bossbar').hidden = true;
  $('tsBanner').hidden = true;
  $('hint').classList.remove('gone');
  hud();
}

/* ---------- Điều khiển ---------- */
const keys = { left: false, right: false, jump: false };
/* ---------- Âm thanh (tổng hợp bằng Web Audio) ---------- */
let AC = null, muted = false;
try { muted = localStorage.getItem('bongdo.muted') === '1'; } catch (e) {}
function audio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (AC.state === 'suspended') AC.resume().catch(() => {});
  return AC;
}
function tone(f0, f1, dur, type = 'square', vol = .06, delay = 0) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .02);
}
function noise(dur, vol = .04, freq = 2000, delay = 0) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + delay, n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = vol;
  src.buffer = buf; src.connect(f).connect(g).connect(a.destination); src.start(t);
}
// "Pi-ka": hai tiếng chíp cao vút nhanh; "chuuu": tiếng kéo dài trượt xuống
const SFX = {
  pika()    { tone(1250, 1750, .07, 'square', .05); tone(950, 1450, .1, 'square', .05, .085); },
  pikachu() { tone(1250, 1750, .07, 'square', .05); tone(950, 1450, .09, 'square', .05, .085);
              tone(1500, 900, .32, 'square', .05, .19); noise(.35, .05, 3500, .19); noise(.2, .04, 5000, .45); },
  step()    { noise(.025, .025, 1600); },
  star()    { tone(1320, 1320, .06, 'triangle', .07); tone(1760, 1760, .12, 'triangle', .07, .06); },
  stomp()   { tone(420, 140, .12, 'square', .06); },
  hurt()    { tone(1100, 700, .12, 'square', .05); tone(800, 260, .35, 'square', .05, .13); },
  hit()     { tone(600, 260, .08, 'square', .06); noise(.1, .05, 4000); },
  bolt()    { noise(.12, .05, 5000); tone(2200, 500, .12, 'sawtooth', .035); },
  deny()    { tone(220, 160, .1, 'square', .04); },
  orb()     { tone(500, 1400, .25, 'sine', .06); noise(.2, .04, 3000); },
  web()     { tone(900, 500, .15, 'triangle', .05); noise(.12, .03, 2500); },
  volt()    { SFX.pikachu(); noise(.9, .09, 1400, .25); tone(140, 50, .9, 'sawtooth', .06, .25); },
  screech() { tone(1800, 900, .15, 'square', .025); },
  drop()    { tone(1600, 600, .2, 'triangle', .03); },
  zap()     { noise(.18, .05, 4500); tone(1800, 600, .15, 'sawtooth', .03); },
  win()     { [784, 988, 1175, 1568].forEach((f, i) => tone(f, f, .16, 'triangle', .07, i * .12)); tone(1250, 1750, .07, 'square', .05, .55); tone(950, 1450, .1, 'square', .05, .64); },
  // Chiikawa
  wa()      { tone(1500, 1900, .06, 'sine', .06); },
  bonk()    { tone(380, 200, .07, 'square', .05); noise(.05, .04, 1200); },
  toss()    { tone(500, 900, .15, 'triangle', .05); noise(.12, .03, 2200); },
  cry()     { [0, .14, .28].forEach(d => tone(1100, 700, .12, 'sine', .06, d)); },
  friends() { tone(700, 1400, .1, 'square', .05); tone(1000, 1600, .12, 'square', .05, .14); noise(.6, .07, 1600, .3); tone(200, 70, .6, 'sawtooth', .05, .3); },
  // Rimuru
  boing()   { tone(260, 620, .12, 'sine', .07); },
  water()   { noise(.1, .04, 3000); tone(1200, 700, .08, 'sine', .04); },
  blackbolt() { noise(.35, .08, 900); tone(120, 40, .4, 'sawtooth', .06); },
  gulp()    { tone(300, 90, .2, 'sine', .08); tone(180, 60, .2, 'square', .03, .1); },
  megiddo() { [1760, 2093, 2637].forEach((f, i) => tone(f, f, .3, 'sine', .04, i * .08)); noise(.7, .06, 5000, .3); },
  // Stelle
  hop()     { tone(800, 1100, .06, 'triangle', .05); },
  swing()   { noise(.07, .05, 1800); tone(520, 180, .08, 'square', .05, .03); },
  homerun() { noise(.06, .07, 1500); tone(300, 1300, .2, 'triangle', .06, .04); tone(1600, 1600, .1, 'triangle', .05, .24); },
  amber()   { tone(600, 900, .25, 'sine', .06); tone(900, 1350, .3, 'triangle', .04, .1); },
  ace()     { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, .12, 'triangle', .06, i * .07)); noise(.8, .08, 1200, .3); tone(160, 60, .8, 'sawtooth', .05, .3); },
  dash()    { noise(.15, .05, 2500); tone(300, 800, .12, 'triangle', .05); },
  // Xayda
  roar()    { tone(180, 70, .7, 'sawtooth', .07); noise(.6, .06, 600); },
  whistle() { tone(1800, 2200, .15, 'sine', .06); tone(2200, 1700, .2, 'sine', .06, .17); },
  charge()  { tone(200, 1600, 1.4, 'sawtooth', .04); noise(1.4, .03, 3000); },
  boom()    { noise(1.2, .12, 400); tone(120, 30, 1, 'sawtooth', .08); },
  // Kiếm khách, Asta, Yuno
  slash()   { noise(.09, .06, 3800); tone(1200, 400, .1, 'sawtooth', .03); },
  vanish()  { noise(.15, .05, 5000); tone(1600, 2400, .1, 'sine', .03); },
  twister() { noise(.6, .05, 900); tone(300, 600, .5, 'sine', .03); },
  anti()    { noise(.12, .07, 1200); tone(160, 70, .15, 'square', .05); },
  meteor()  { noise(1, .1, 500); tone(90, 30, 1, 'sawtooth', .07); tone(500, 120, .4, 'square', .04); },
  wind()    { noise(.25, .05, 2200); tone(500, 1100, .18, 'sine', .03); },
  shinra()  { noise(1.4, .14, 300); tone(70, 30, 1.2, 'sawtooth', .08); noise(.8, .07, 2600, .1); tone(900, 200, .6, 'sine', .05); },
  pull()    { tone(200, 900, .4, 'sine', .06); noise(.4, .04, 1500); },
  chibaku() { tone(60, 140, 1.5, 'sawtooth', .05); noise(1.5, .05, 400); },
  storm()   { noise(1.2, .08, 1600); [880, 1175, 1568].forEach((f, i) => tone(f, f * 1.2, .3, 'sine', .04, i * .1)); },
  kame()    { tone(180, 1100, .9, 'sawtooth', .05); noise(1, .08, 1800, .05); tone(90, 60, .9, 'square', .04, .1); },
  tele()    { tone(1800, 500, .12, 'sine', .06); noise(.08, .05, 6000); },
  ki()      { tone(900, 300, .1, 'sine', .06); noise(.08, .04, 3000); },
  ui()      { tone(300, 1600, 1.1, 'sine', .05); tone(450, 2400, 1, 'triangle', .03, .15); noise(1.2, .06, 5200); },
};
const JUMP_SFX = { pika: 'pika', chii: 'wa', rimuru: 'boing', stelle: 'hop', saiyan: 'hop', kiem: 'hop', asta: 'hop', yuno: 'hop', pain: 'hop', goku: 'hop' };
function sfx(name) { if (!muted && audio()) SFX[name](); }
function setMuted(m) {
  muted = m;
  try { localStorage.setItem('bongdo.muted', m ? '1' : '0'); } catch (e) {}
  $('mute').setAttribute('aria-pressed', String(!m));
  $('mute').textContent = m ? 'Âm thanh: Tắt (M)' : 'Âm thanh: Bật (M)';
}

function setKey(k, on) {
  audio();
  if (k === 'jump' && on && !keys.jump) S.jumpBuf = .14;
  if (k === 'bolt') { if (on && !keys.bolt) startCharge(); if (!on && keys.bolt) releaseCharge(); }
  if (k === 'web' && on && !keys.web) MOVES[CHAR].web();
  if (k === 'volt' && on && !keys.volt) (CHAR === 'saiyan' ? apeForm() : CHAR === 'kiem' ? tamKiem() : CHAR === 'pain' ? shinraTensei() : CHAR === 'goku' ? ultraInstinct() : fireVolt());
  if (k === 'boom' && on && !keys.boom && CHAR === 'saiyan') selfDestruct();
  if (k === 'dmax' && on && !keys.dmax && CHAR === 'pika') toggleDmax();
  if (k === 'zmove' && on && !keys.zmove && CHAR === 'pika') zMove();
  if (k === 'whistle' && on && !keys.whistle && CHAR === 'saiyan') whistle();
  if (k === 'skill' && on && !keys.skill) {
    if (S.boss && S.boss.ts > 0 && !S.tsEsc && !S.dead) escapeTimeStop();
    else activateSkill();
  }
  keys[k] = on;
  if (on && !S.moved) { S.moved = true; setTimeout(() => $('hint').classList.add('gone'), 1500); }
}
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', ArrowDown: 'down', KeyS: 'down',
  KeyK: 'skill', ShiftLeft: 'skill', ShiftRight: 'skill', KeyJ: 'bolt', KeyX: 'bolt', KeyL: 'web', KeyC: 'web', KeyU: 'volt', KeyV: 'volt', KeyH: 'regen', KeyI: 'whistle', KeyO: 'boom', KeyG: 'dmax', KeyZ: 'zmove',
};
function escapeTimeStop() {
  sfx('zap');
  S.tsEsc = true;
  const b = S.ball;
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2;
    S.parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, life: .45, c: i % 2 ? '#c9b6ff' : '#ffffff', r: 5, g: 0 });
  }
  tsBanner();
}
// Lao điện (Volt Tackle): lao về phía trước, không bị tổn hại trong lúc lao, đâm trúng thì gây sát thương
function activateSkill() {
  if (S.dead || S.won || S.lost || S.cd > 0) return;
  if (!spend(cost('tackle'))) return;
  const shield = { saiyan: 3, pain: 2.5 }[CHAR];   // Khiên năng lượng (Xayda), Ngạ Quỷ Đạo (Pain)
  S.power = Math.max(S.power, shield || TACKLE_TIME); S.cd = CH().tackleCd;
  if (shield) S.amber = shield;
  const B = S.boss;
  if (B.cut && B.cut.appear && !B.cut.struck) B.cut.blocked = true;   // chặn cú đánh úp của Naamah
  if (!frozenNow() && !shield) S.dash = { dir: S.ball.face || 1, t: TACKLE_DASH };
  sfx(CHAR === 'pika' ? 'pikachu' : shield ? 'amber' : 'dash');
  const b = S.ball;
  for (let i = 0; i < 20; i++) {
    const a = i / 20 * Math.PI * 2;
    S.parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, life: .5, c: i % 2 ? '#ffc21a' : '#ffffff', r: 6, g: 0 });
  }
}
const typing = e => e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT');
addEventListener('keydown', e => {
  if (e.code === 'Escape' && paused) { closeChars(); return; }
  if (typing(e)) return;
  if (e.code === 'KeyP') { if (paused) closeChars(); else openChars(); return; }
  if (paused) return;
  if (e.code === 'KeyR') { reset(); return; }
  if (e.code === 'KeyN') { setMap(MAP === 1 ? 2 : 1); return; }
  if (e.code === 'KeyM') { setMuted(!muted); return; }
  if (e.code === 'KeyB' && TEST_MODE) { warpToBoss(); return; }
  const k = KEYMAP[e.code];
  if (k) { e.preventDefault(); if (!e.repeat) setKey(k, true); }
});
addEventListener('keyup', e => { if (typing(e)) return; const k = KEYMAP[e.code]; if (k) { e.preventDefault(); setKey(k, false); } });
addEventListener('blur', () => { keys.left = keys.right = keys.jump = keys.down = keys.skill = keys.bolt = keys.web = keys.volt = keys.regen = keys.dmax = keys.zmove = false; S.charging = false; });
document.querySelectorAll('[data-key]').forEach(b => {
  const k = b.dataset.key;
  b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); b.classList.add('on'); setKey(k, true); });
  const up = () => { b.classList.remove('on'); setKey(k, false); };
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
});
$('restart').addEventListener('click', e => { reset(); e.currentTarget.blur(); });
$('again').addEventListener('click', reset);
$('mute').addEventListener('click', e => { setMuted(!muted); e.currentTarget.blur(); });
setMuted(muted);
$('again2').addEventListener('click', reset);

/* ---------- Vật lý ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function collideSolid(s, b) {
  const p = s.pts;
  for (let i = 0; i < p.length; i += 2) {
    const ax = p[i], ay = p[i + 1], bx = p[(i + 2) % p.length], by = p[(i + 3) % p.length];
    const ex = bx - ax, ey = by - ay, len2 = ex * ex + ey * ey;
    const t = clamp(((b.x - ax) * ex + (b.y - ay) * ey) / len2, 0, 1);
    const cx = ax + ex * t, cy = ay + ey * t;
    const dx = b.x - cx, dy = b.y - cy, d2 = dx * dx + dy * dy;
    if (d2 >= R * R || d2 === 0) continue;
    const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
    b.x += nx * (R - d); b.y += ny * (R - d);
    const vn = b.vx * nx + b.vy * ny;
    if (vn < 0) {
      if (ny < -.6 && vn < -500) b.squash = Math.min(.35, -vn / 2400);
      b.vx -= vn * nx; b.vy -= vn * ny;
    }
    if (ny < -.55) S.onGround = true;
  }
}
function step(h) {
  const b = S.ball;
  const input = S.dash || S.regenOn || S.boom > 0 ? 0 : (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  // Khựng: đổi hướng thì phanh mạnh, nhả phím thì dừng nhanh. Trên vũng băng thì trơn trượt.
  const slick = S.slick && S.onGround;
  const turning = input && Math.sign(b.vx) === -input;
  const accel = (S.onGround ? 1150 : 800) * (turning ? 2.6 : 1) * (slick ? .4 : 1);
  if (S.dash) { b.vx = S.dash.dir * TACKLE_SPEED; b.vy = Math.min(b.vy, 0); }
  else if (input) b.vx += input * accel * h;
  else b.vx *= 1 - (S.onGround ? (slick ? .5 : 10) : 2) * h;
  if (!input && !slick && S.onGround && Math.abs(b.vx) < 12) b.vx = 0;
  const maxv = S.dash ? TACKLE_SPEED : CH().speed * (S.ape > 0 ? 1.15 : 1) * (S.black > 0 ? 1.2 : 1) * (S.ui > 0 ? 1.3 : 1);
  b.vx = clamp(b.vx, -maxv, maxv);
  if (CH().fly) {
    // Goku bay tự do: ▲ lên, ▼ xuống, không có trọng lực, thả nút thì đứng lơ lửng
    const vin = S.dash || S.boom > 0 ? 0 : (keys.down ? 1 : 0) - (keys.jump ? 1 : 0), fly = maxv * .9;
    if (vin) b.vy = clamp(b.vy + vin * (Math.sign(b.vy) === -vin ? 5000 : 2600) * h, -fly, fly);
    else if (!S.dash) b.vy *= 1 - 10 * h;
  } else b.vy = Math.min(b.vy + G * h, 1400);
  if (CHAR === 'pain' && keys.jump && b.vy > 90) b.vy = 90;   // Pain lơ lửng khi giữ nhảy
  b.x += b.vx * h; b.y += b.vy * h;
  if (CH().fly) {
    // không bay khỏi khung hình, không rơi xuống vực; đang đánh boss thì ở trong đấu trường
    if (b.y < CAM_Y[0] + 40) { b.y = CAM_Y[0] + 40; b.vy = Math.max(0, b.vy); }
    if (b.y > DEATH_Y - 140) { b.y = DEATH_Y - 140; b.vy = Math.min(0, b.vy); }
    if (S.fight && !S.boss.dead) b.x = clamp(b.x, ARENA.l + R, ARENA.r - R);
  }
  S.onGround = false;
  for (const s of SOLIDS) {
    if (b.x + R < s.minX || b.x - R > s.maxX || b.y + R < s.minY) continue;
    if (s.gate && !S.gateClosed) continue;
    if (s.broken) continue;
    collideSolid(s, b);
  }
  if (b.x < R) { b.x = R; b.vx = Math.max(0, b.vx); }
  if (S.onGround) S.lastGround = 0;
}
// rơi khỏi núi: dưới đáy màn, hoặc (màn 2) rơi sâu hơn chỗ đứng gần nhất
const fellOff = () => S.ball.y > DEATH_Y || (MAP === 2 && S.ball.y > S.safeY + 620);
function die() {
  if (S.dead) return;
  // Goku ở trạng thái Bản Năng Vô Cực: cơ thể tự né mọi đòn
  if (S.ui > 0 && !fellOff()) {
    S.safe = Math.max(S.safe, .6);
    S.tele.push({ x: S.ball.x, y: S.ball.y, t: .3 });
    S.pops.push({ x: S.ball.x, y: S.ball.y - 60, t: .6, text: 'Né!', c: '#dfe8ff' });
    sfx('tele');
    return;
  }
  // Rimuru (Đại Hiền Giả): chặn một đòn chí mạng mỗi 15 giây, trừ khi rơi xuống vực
  // Xayda biến khỉ: khỉ khổng lồ chịu đòn thay, mất 6 giây biến hình
  if (S.ape > 0 && !fellOff()) {
    S.ape = Math.max(0, S.ape - 6); S.safe = Math.max(S.safe, 1.2);
    sfx('hit');
    S.pops.push({ x: S.ball.x, y: S.ball.y - 70, t: .9, text: 'Khỉ chịu đòn! -6 giây', c: '#ffb38a' });
    return;
  }
  if (CHAR === 'rimuru' && S.resist <= 0 && !fellOff()) {
    S.resist = 15; S.safe = Math.max(S.safe, 1.2);
    sfx('gulp');
    S.pops.push({ x: S.ball.x, y: S.ball.y - 56, t: 1, text: 'Kháng tính! (Đại Hiền Giả)', c: '#9ef0ff' });
    boltSpark(S.ball.x, S.ball.y, '#5ec8f2', 18);
    return;
  }
  S.dead = .9; S.deaths++; if (!TEST_MODE) S.lives--;
  sfx('hurt');
  const b = S.ball;
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2, sp = 120 + Math.random() * 320;
    S.parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 200, life: .9, c: i % 3 ? '#ffd21f' : (i % 2 ? '#e8402c' : '#ffffff'), r: 4 + Math.random() * 5 });
  }
  hud();
}
function respawn() {
  Object.assign(S.ball, { x: S.spawn.x, y: S.spawn.y, vx: 0, vy: 0, squash: 0 });
  S.power = 0; S.dash = null; S.charging = false; S.amber = 0; S.kame = null;
  S.timers = []; S.ktor = []; S.kfx = []; S.kpose = null; S.bleed = 0;
  S.safe = Math.max(S.safe, 1.2);   // tránh vừa hồi sinh đã chết lại
  S.tshots = []; S.icicles = [];
  const B = S.boss;
  if (!B.dead && S.fight) {
    // Ngã khi đang đánh boss: hồi sinh ngay trong cổng, trận đấu tiếp tục, boss giữ nguyên máu
    Object.assign(S.ball, { x: ARENA.l + 50, y: ARENA.floor - 60 });
    Object.assign(B, { inv: 0, act: null, exhaust: 0, stun: 0, hazards: [], sweep: null, ts: 0, hellT: 0, laserShot: false, atkT: 2.5 });
    if (!B.cut && !B.fuse) {
      const u = B.units[0];
      Object.assign(u, { x: ARENA.r - 160, dir: -1, vy: 0, y: u.kind === 'ice' ? ARENA.floor - 150 : u.kind === 'zag' ? ARENA.floor - 130 : u.kind === 'fused' ? ARENA.floor - 12 : ARENA.floor });
      u.mt = Math.PI / 2;
    }
    S.bullets = [];
    S.safe = 1.5;
  }
  bossBar();
  S.safeY = S.ball.y;
  S.cam.x = clamp(S.ball.x - viewW * .4, 0, Math.max(0, LEVEL_W - viewW));
  S.cam.y = clamp(camTargetY(), camMinY(), CAM_Y[1]);
}

function update(dt) {
  S.t += dt;
  // Bầu trời địa ngục: chuyển dần sang đỏ đen khi Naamah xuất hiện, trở lại khi Naamah bị hạ
  const Bo = S.boss, hellSky = !Bo.dead && (Bo.phase >= (MAP === 2 ? 2 : 3) || !!(Bo.cut && Bo.cut.burst));
  S.flash = Math.max(0, S.flash - dt * 1.8);
  for (const q of S.pops) { q.t -= dt; q.y -= 40 * dt; }
  S.pops = S.pops.filter(q => q.t > 0);
  S.sky += ((hellSky ? 1 : 0) - S.sky) * Math.min(1, dt * (hellSky ? 2 : .8));
  for (const p of S.parts) { p.vy += (p.g ?? 1200) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
  S.parts = S.parts.filter(p => p.life > 0);
  for (const s of S.stars) if (s.got && s.pop > 0) s.pop -= dt;

  for (const e of S.enemies) {
    if (!e.alive) { e.squash = Math.max(0, e.squash - dt); continue; }
    if (e.stun > 0) { e.stun -= dt; continue; }    // dính Lưới điện: đứng yên
    e.x += e.dir * ENEMY_SPEED * dt;
    if (e.x > e.max) { e.x = e.max; e.dir = -1; }
    if (e.x < e.min) { e.x = e.min; e.dir = 1; }
  }

  if (S.won || S.lost) return;
  S.time += dt;
  if (S.time >= TIME_LIMIT) { lose('time'); return; }
  updateBoss(dt);
  if (S.dead) {
    S.dead -= dt;
    if (S.dead <= 0) { S.dead = 0; if (S.lives <= 0) lose(); else respawn(); }
    return;
  }
  S.power = Math.max(0, S.power - dt);
  S.cd = Math.max(0, S.cd - dt);
  S.safe = Math.max(0, S.safe - dt);
  S.voltFx = Math.max(0, S.voltFx - dt);
  const b = S.ball;
  if (S.dash) { S.dash.t -= dt; if (S.dash.t <= 0) S.dash = null; }

  // Thời gian ngưng đọng: bóng bị đóng băng cho tới khi nhấn Shift
  const cut = S.boss.cut;
  const frozen = frozenNow();
  if (frozen) S.dash = null;
  // điện năng tự nạp, chạy nhanh trên mặt đất nạp thêm
  if (!frozen) gainEnergy((3 + (S.onGround && Math.abs(b.vx) > 150 ? 4 : 0)) * dt * CH().regen);
  // Xayda giữ H: Tái tạo năng lượng, đứng yên hồi KI nhanh
  S.regenOn = CHAR === 'saiyan' && !!keys.regen && S.onGround && !frozen && !S.dash;
  if (S.regenOn) gainEnergy(35 * dt);
  const inDir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (inDir) S.lastDir = inDir;
  if (!frozen) {
    S.lastGround += dt;
    S.jumpBuf -= dt;
    if (S.onGround) S.airJumps = CH().airJumps;
    if (CH().fly) S.jumpBuf = 0;
    else if (S.jumpBuf > 0 && S.lastGround < .1) { b.vy = -JUMP; S.jumpBuf = 0; S.lastGround = 1; sfx(JUMP_SFX[CHAR]); }
    else if (S.jumpBuf > 0 && S.airJumps > 0) {
      // nhảy thêm trên không (Rimuru, Stelle)
      S.airJumps--; b.vy = -JUMP * .92; S.jumpBuf = 0; S.lastGround = 1; sfx(JUMP_SFX[CHAR]);
      boltSpark(b.x, b.y + R, CHAR === 'stelle' ? '#ffd65e' : '#9ef0ff', 8);
    }
    if (!keys.jump && b.vy < -320 && !CH().fly) b.vy = -320;   // nhả sớm → nhảy thấp

    const steps = 4;
    for (let i = 0; i < steps; i++) step(dt / steps);
  } else S.jumpBuf = 0;
  b.rot += frozen ? 0 : b.vx * dt / R;
  // nhịp chân chạy theo quãng đường đã đi; mỗi nửa vòng là một bước
  if (!frozen) {
    const before = Math.floor(b.run / Math.PI);
    b.run += Math.abs(b.vx) * dt / 14;
    if (S.onGround && Math.abs(b.vx) > 60 && Math.floor(b.run / Math.PI) !== before) sfx('step');
  }
  if (Math.abs(b.vx) > 8) b.face = Math.sign(b.vx);
  updatePikachuMoves(dt);
  b.squash = Math.max(0, b.squash - dt * 1.6);

  if (S.onGround || CH().fly) S.safeY = b.y;
  if (fellOff()) die();
  if (!S.power && !S.safe) {
    for (const sp of SPIKES) {
      if (S.spikeGone.has(sp)) continue;
      if (b.x > sp.x0 - R * .6 && b.x < sp.x1 + R * .6 && b.y + R > sp.f(b.x) - 16) die();
    }
  }
  for (const e of S.enemies) {
    if (!e.alive) continue;
    const ey = e.f(e.x) - 20;
    const cx = clamp(b.x, e.x - 20, e.x + 20), cy = clamp(b.y, ey - 20, ey + 20);
    if ((b.x - cx) ** 2 + (b.y - cy) ** 2 < R * R) {
      if (S.power || S.ape > 0) {
        e.alive = false; e.squash = 0; sfx('zap'); gainEnergy(8);
        for (let i = 0; i < 18; i++) {
          const a = Math.random() * Math.PI * 2, sp = 150 + Math.random() * 250;
          S.parts.push({ x: e.x, y: ey, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 150, life: .8, c: i % 3 ? '#16181d' : '#ffc21a', r: 5 + Math.random() * 5 });
        }
      }
      else if (b.vy > 0 && b.y < ey - 12) { e.alive = false; e.squash = .4; b.vy = -560; sfx('stomp'); gainEnergy(8); }
      else if (!S.safe && !(e.stun > 0)) die();
    }
  }
  for (const s of S.stars) {
    if (!s.got && Math.hypot(s.x - b.x, s.y - b.y) < R + 16) { s.got = true; s.pop = .3; hud(); sfx('star'); gainEnergy(CHAR === 'chii' ? 30 : 15); }
  }
  for (const h of S.hearts) {
    if (!h.got && Math.hypot(h.x - b.x, h.y - b.y) < R + 16) {
      h.got = true;
      const before = S.lives;
      S.lives = Math.min(MAX_LIVES, S.lives + 1);
      hud(); sfx('star');
      S.pops.push({ x: h.x, y: h.y - 24, t: .9, text: S.lives > before ? '+1 mạng' : 'Đầy mạng', c: '#ff6b81' });
    }
  }
  TIPS.forEach((tp, i) => { if (!S.tipSeen[i] && b.x > tp.x - 220) { S.tipSeen[i] = true; showTip(i === 0 ? CHAR_UI[CHAR].tip : tp.text); } });
  updateTurret(dt);
  if (S.dead) return;
  updateFlyers(dt);
  if (S.dead) return;
  CHECKPOINTS.forEach((c, i) => {
    if (i > S.cp && b.x > c.x) { S.cp = i; S.spawn = { x: c.x, y: c.f(c.x) - 60 }; }
  });
  if (S.boss.dead && b.x > GOAL.x - 10) win();
}

/* ---------- Đường đến boss: mẹo và ụ băng ---------- */
let tipTimer = 0;
function showTip(text) {
  const el = $('tip');
  el.textContent = text; el.hidden = false; el.classList.remove('gone');
  $('hint').classList.add('gone');
  clearTimeout(tipTimer);
  tipTimer = setTimeout(() => el.classList.add('gone'), 4500);
}
function breakTurret() {
  const T = S.turret, gy = T.f(T.x);
  T.alive = false;
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2, sp = 100 + Math.random() * 300;
    S.parts.push({ x: T.x, y: gy - 24, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 150, life: .8, c: ['#7ff0ff', '#d8fbff', '#8a8f98'][i % 3], r: 4 + Math.random() * 5 });
  }
  sfx('stomp');
}
function updateTurret(dt) {
  const T = S.turret, b = S.ball;
  for (const q of S.tshots) q.x += q.vx * dt;
  S.tshots = S.tshots.filter(q => q.alive !== false && q.x > T.x - T.range);
  T.flash = Math.max(0, T.flash - dt);
  if (S.dead) return;
  // đạn của ụ: Vô địch hoặc vừa hồi sinh thì đạn vỡ, không thì mất mạng
  for (const q of S.tshots) {
    if (Math.hypot(q.x - b.x, q.y - b.y) < R + 6) {
      if (S.power || S.safe) { q.alive = false; continue; }
      die(); return;
    }
  }
  if (!T.alive) return;
  const gy = T.f(T.x);
  if (Math.abs(b.x - T.x) < 900) {
    T.t += dt;
    if (T.t >= T.every) { T.t = 0; T.flash = .12; S.tshots.push({ x: T.x - 28, y: gy - 22, vx: -T.speed }); }
  }
  // giẫm từ trên thì phá ụ, chạm ngang thì mất mạng
  const top = gy - 44;
  const cx = clamp(b.x, T.x - 22, T.x + 22), cy = clamp(b.y, top, gy);
  if ((b.x - cx) ** 2 + (b.y - cy) ** 2 < R * R) {
    if (S.power || (b.vy > 0 && b.y < top + 8)) { breakTurret(); if (!S.power) b.vy = -560; }
    else if (S.safe) { b.x = T.x - 22 - R - 1; b.vx = -300; }
    else die();
  }
}

/* ---------- Bộ chiêu của Pikachu ---------- */
function frozenNow() {
  const B = S.boss;
  return (B.ts > 0 && !S.tsEsc) || !!(B.cut && B.cut.t < CUT.strike) || !!B.fuse;
}
const canAct = () => !(S.dead || S.won || S.lost || frozenNow());
function gainEnergy(n) { S.energy = Math.min(ENERGY_MAX, S.energy + n); }
function spend(cost) {
  if (S.energy < cost) {
    S.pops.push({ x: S.ball.x, y: S.ball.y - 50, t: .7, text: `Thiếu ${CHAR_UI[CHAR].energy.toLowerCase()} (${Math.floor(S.energy)}/${cost})`, c: '#fff27a' });
    sfx('deny');
    return false;
  }
  S.energy -= cost;
  return true;
}
function startCharge() { if (canAct()) { S.charging = true; S.chargeT = 0; } }
function releaseCharge() {
  if (!S.charging) return;
  S.charging = false;
  if (!canAct()) return;
  if (S.chargeT < BALL_HOLD) MOVES[CHAR].tap(); else MOVES[CHAR].hold(S.chargeT);
}
// Tia sét (Thunder Shock): bắn thẳng, rẻ, nhanh
function fireShock() {
  if (S.shockCd > 0 || !spend(cost('tap'))) return;
  const b = S.ball, d = b.face || 1;
  S.shockCd = SHOCK_CD; S.cast = .2;
  S.bolts.push({ x: b.x + d * 26, y: b.y - 10, vx: d * SHOCK_SPEED, life: SHOCK_LIFE, seed: Math.random() * 100 });
  sfx('bolt');
}
// Quả cầu điện (Electro Ball): giữ càng lâu cầu càng to; đúng nguyên tác, Pikachu chạy càng nhanh thì càng mạnh
function fireElectroBall(hold) {
  if (!spend(cost('hold'))) return;
  const b = S.ball, d = b.face || 1, k = clamp((hold - BALL_HOLD) / (BALL_FULL - BALL_HOLD), 0, 1);
  const fast = Math.abs(b.vx) >= 250;
  const dmg = 1 + (k >= .99 ? 1 : 0) + (fast ? 1 : 0);
  // cầu to gấp đôi; Dynamax thì to gấp 5 và phóng ra từ má Pikachu khổng lồ
  const big = DMAX ? 5 : 2;
  S.orbs.push({ x: b.x + d * (DMAX ? 120 : 28), y: b.y - (DMAX ? 260 : 14), vx: d * (430 + Math.abs(b.vx) * .8), vy: DMAX ? -60 : -260, r: (9 + k * 9) * big, dmg, bounced: false, life: DMAX ? 2.4 : 1.8, hit: new Set() });
  S.cast = .25;
  sfx('orb');
  S.pops.push({ x: b.x, y: b.y - 58, t: .6, text: `Quả cầu điện ×${dmg}`, c: '#fff27a' });
}
// Lưới điện (Electroweb): quái và boss dính lưới đứng yên, lưới quét sạch đạn trên đường bay
function fireWeb() {
  if (!canAct() || S.webCd > 0 || !spend(cost('web'))) return;
  const b = S.ball, d = b.face || 1;
  S.webCd = .6; S.cast = .25;
  S.webs.push({ x: b.x + d * 26, y: b.y - 10, vx: d * WEB_SPEED, life: WEB_LIFE, r: 24 });
  sfx('web');
}
// 100.000 Vôn (Thunderbolt): cần đầy điện năng; sét giáng khắp màn hình
function fireVolt() {
  if (!canAct()) return;
  const ui = CHAR_UI[CHAR], U = ULTS[CHAR];
  if (S.energy < COST.volt) {
    S.pops.push({ x: S.ball.x, y: S.ball.y - 50, t: .8, text: `${ui.btn.volt[1]} cần đầy ${ui.energy.toLowerCase()} (${Math.floor(S.energy)}/100)`, c: '#fff27a' });
    sfx('deny');
    return;
  }
  S.energy = 0;
  if (CHAR === 'asta') { S.black = 20; S.pops.push({ x: S.ball.x, y: S.ball.y - 80, t: 1.2, text: 'Hắc Hoá!', c: '#9cff7a' }); }
  if (CHAR === 'chii') S.pops.push({ x: S.ball.x - 60, y: S.ball.y - 80, t: 1, text: 'Ura!', c: '#ffe27a' }, { x: S.ball.x + 60, y: S.ball.y - 90, t: 1, text: 'Yaha!', c: '#ffffff' });
  if (CHAR === 'pika') {
    const dir = S.ball.face || 1;
    S.vbeam = { t: .9, dur: .9, dir };
    const o = voltOrigin(), edge = dir > 0 ? S.cam.x + viewW + 60 : S.cam.x - 60, big = DMAX;
    ultBlast(U, 'pika', { x0: Math.min(o.x, edge) - 10, x1: Math.max(o.x, edge) + 10, y0: o.y - (big ? 260 : 130), y1: big ? S.ball.y + R + 40 : o.y + 130 });
  } else ultBlast(U);
}
// điểm phóng tia 100.000 Vôn: má Pikachu (Dynamax thì ở má của thân khổng lồ)
function voltOrigin() {
  const b = S.ball, dir = S.vbeam ? S.vbeam.dir : b.face || 1;
  return DMAX ? { x: b.x + dir * 132 * MAX_K / 10, y: b.y + R - 262 * MAX_K / 10 } : { x: b.x + dir * 20, y: b.y - 12 };
}
// sét/sao/tia sáng khắp màn hình: hạ quái, xoá đạn, đánh và làm choáng boss
// zone (không bắt buộc): chỉ trúng những gì trong khung { x0, x1, y0, y1 }, không có thì cả màn hình
function ultBlast(U, kind = CHAR, zone = null) {
  S.voltFx = U.fx; S.flash = zone ? .45 : .9; S.cast = .6; S.swing = SWING; S.ultKind = kind;
  sfx(U.sfx);
  const x0 = zone ? zone.x0 : S.cam.x - 40, x1 = zone ? zone.x1 : S.cam.x + viewW + 40, n = U.n;
  const y0 = zone ? zone.y0 : -Infinity, y1 = zone ? zone.y1 : Infinity;
  const inZ = (x, y) => x > x0 && x < x1 && y > y0 && y < y1, out = t => !inZ(t.x, t.y);
  S.voltStrikes = zone ? [] : Array.from({ length: n }, (_, i) => x0 + (i + .5) * (x1 - x0) / n + (Math.random() - .5) * 60);
  S.bullets = S.bullets.filter(out); S.tshots = S.tshots.filter(out); S.icicles = S.icicles.filter(out);
  const B = S.boss;
  B.hazards = B.hazards.filter(h => h.type === 'puddle');
  B.sweep = null;
  for (const e of S.enemies) if (e.alive && inZ(e.x, e.f(e.x) - 20)) { e.alive = false; e.squash = 0; boltSpark(e.x, e.f(e.x) - 20, '#16181d', 12); }
  for (const f of S.flyers) if (f.alive && inZ(f.x, f.y)) killFlyer(f);
  const T = S.turret;
  if (T.alive && inZ(T.x, T.f(T.x) - 26)) breakTurret();
  if (S.fight && !B.dead && !B.cut && !B.fuse) {
    const u = B.units[0];
    if (u.x > x0 && u.x < x1 && u.y - BOSS_H < y1 && u.y > y0) { damageBoss(u, U.dmg, 'volt'); if (!B.dead && !B.cut && !B.fuse) { B.stun = Math.max(B.stun, U.stun); B.act = null; } }
  }
}
function boltSpark(x, y, c = '#fff27a', n = 10) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 80 + Math.random() * 220;
    S.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: .35, c: i % 2 ? c : '#ffffff', r: 3 + Math.random() * 3, g: 0 });
  }
}
// Tìm thứ bị trúng tại (x, y) với bán kính r
function enemyAt(x, y, r) {
  return S.enemies.find(e => e.alive && Math.abs(x - e.x) < 20 + r && Math.abs(y - (e.f(e.x) - 20)) < 20 + r);
}
function flyerAt(x, y, r) { return S.flyers.find(f => f.alive && Math.hypot(f.x - x, f.y - y) < f.r + r); }
function bossUnitAt(x, y, r) {
  const B = S.boss;
  if (!S.fight || B.dead || B.cut || B.fuse) return null;
  return B.units.find(u => {
    const w = u.kind === 'fused' ? FW : BOSS_W, h = u.kind === 'fused' ? FH : BOSS_H;
    return !u.hidden && Math.abs(x - u.x) < w / 2 + r && y > u.y - h - r && y < u.y + r;
  }) || null;
}
function turretAt(x, y, r) {
  const T = S.turret;
  return T.alive && Math.abs(x - T.x) < 24 + r && y > T.f(T.x) - 52 - r && y < T.f(T.x) + r;
}
function killEnemy(e, c = '#16181d') { e.alive = false; e.squash = 0; boltSpark(e.x, e.f(e.x) - 20, c, 16); sfx('stomp'); gainEnergy(8); }
function updatePikachuMoves(dt) {
  S.zCd = Math.max(0, S.zCd - dt);
  S.zFx = Math.max(0, S.zFx - dt);
  if (S.vbeam && (S.vbeam.t -= dt) <= 0) S.vbeam = null;
  if (CHAR === 'pika' && DMAX && !S.dead && !S.won) maxStomp();
  S.shockCd = Math.max(0, S.shockCd - dt);
  S.webCd = Math.max(0, S.webCd - dt);
  S.cast = Math.max(0, S.cast - dt);
  if (S.charging) S.chargeT += dt;
  // Tia sét
  for (const q of S.bolts) {
    q.x += q.vx * dt; q.life -= dt;
    let e, f, u;
    if ((e = enemyAt(q.x, q.y, 6))) { killEnemy(e); q.life = 0; continue; }
    if ((f = flyerAt(q.x, q.y, 10))) { killFlyer(f); q.life = 0; continue; }
    const sh = S.tshots.find(t => t.alive !== false && Math.abs(t.x - q.x) < 22 && Math.abs(t.y - q.y) < 22);
    if (sh) { sh.alive = false; q.life = 0; boltSpark(q.x, q.y, '#7ff0ff'); continue; }
    if (turretAt(q.x, q.y, 0)) { const T = S.turret; q.life = 0; T.hp--; T.flash = .15; boltSpark(q.x, q.y, '#7ff0ff', 12); if (T.hp <= 0) breakTurret(); continue; }
    const bu = S.bullets.find(t => Math.abs(t.x - q.x) < 22 && Math.abs(t.y - q.y) < 22);
    if (bu) { bu.dead = true; q.life = 0; boltSpark(q.x, q.y); continue; }
    if ((u = bossUnitAt(q.x, q.y, 4))) { damageBoss(u, q.dmg || 1, 'shock'); boltSpark(q.x, q.y); q.life = 0; }
  }
  S.bolts = S.bolts.filter(q => q.life > 0);
  // Quả cầu điện: bay vòng cung, nảy một lần, xuyên qua quái nhỏ và đạn
  for (const o of S.orbs) {
    o.vy += 900 * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.life -= dt;
    const gy = groundYAt(o.x);
    if (gy != null && o.y + o.r >= gy && o.vy > 0) {
      if (!o.bounced) { o.y = gy - o.r; o.vy = -Math.abs(o.vy) * .55; o.bounced = true; boltSpark(o.x, gy, '#fff27a', 6); }
      else o.life = 0;
    }
    if (o.y > DEATH_Y) o.life = 0;
    for (const e of S.enemies) if (e.alive && !o.hit.has(e) && Math.abs(o.x - e.x) < 20 + o.r && Math.abs(o.y - (e.f(e.x) - 20)) < 20 + o.r) { o.hit.add(e); killEnemy(e); }
    for (const f of S.flyers) if (f.alive && Math.hypot(f.x - o.x, f.y - o.y) < f.r + o.r) killFlyer(f);
    for (const t of S.tshots) if (Math.hypot(t.x - o.x, t.y - o.y) < o.r + 8) t.alive = false;
    for (const t of S.bullets) if (Math.hypot(t.x - o.x, t.y - o.y) < o.r + 8) t.dead = true;
    if (turretAt(o.x, o.y, o.r)) { const T = S.turret; T.hp -= o.dmg; T.flash = .15; if (T.hp <= 0) breakTurret(); o.life = 0; boltSpark(o.x, o.y, '#7ff0ff', 12); continue; }
    const u = bossUnitAt(o.x, o.y, o.r);
    if (u) { damageBoss(u, o.dmg, 'ball'); boltSpark(o.x, o.y, '#fff27a', 16); o.life = 0; }
  }
  S.orbs = S.orbs.filter(o => o.life > 0);
  // Lưới điện
  for (const w of S.webs) {
    w.x += w.vx * dt; w.life -= dt;
    for (const t of S.bullets) if (Math.hypot(t.x - w.x, t.y - w.y) < w.r + 8) { t.dead = true; boltSpark(t.x, t.y, '#fff27a', 4); }
    for (const t of S.tshots) if (Math.hypot(t.x - w.x, t.y - w.y) < w.r + 8) t.alive = false;
    let e, f, u;
    const jail = !w.kind;   // Lưới điện của Pikachu: giam vĩnh viễn
    if ((e = enemyAt(w.x, w.y, w.r - 6))) { e.stun = jail ? FOREVER : WEB_STUN * 1.5; w.life = 0; sfx('web'); continue; }
    if ((f = flyerAt(w.x, w.y, w.r - 6))) { f.stun = jail ? FOREVER : WEB_STUN * 1.5; f.state = 'patrol'; w.life = 0; sfx('web'); continue; }
    if ((u = bossUnitAt(w.x, w.y, w.r - 6))) {
      const B = S.boss;
      if (B.ts > 0) { boltSpark(w.x, w.y, '#9aa3ad', 8); w.life = 0; continue; }
      B.stun = jail ? FOREVER : WEB_STUN; B.act = null; B.sweep = null; w.life = 0; sfx('web');
      S.pops.push({ x: u.x, y: u.y - BOSS_H - 20, t: .8, text: w.kind === 'rope' ? 'Bị trói!' : 'Giam vĩnh viễn!', c: '#fff27a' });
    }
  }
  S.webs = S.webs.filter(w => w.life > 0);
  updateCharMoves(dt);
}

/* ---------- Nhân vật khác: Chiikawa, Rimuru, Stelle ----------
   Mọi nhân vật dùng chung các nút (J, giữ J, L, Shift, U) nhưng mỗi người một bộ chiêu. */
const CHARS = {
  pika:   { cost: { tap: COST.shock, hold: COST.ball, web: COST.web, tackle: COST.tackle }, tackleCd: TACKLE_CD, regen: 1, speed: MAXV, airJumps: 0, dmgK: 1 },
  // Pikachu Dynamax (phím G): to gấp 10 lần, vĩnh viễn, bộ chiêu hack như Stelle
  pikaMax: { cost: { tap: 0, hold: 0, web: 0, tackle: 0 }, tackleCd: .35, regen: 6, speed: 400, airJumps: 2, dmgK: 2, pierce: true },
  chii:   { cost: { tap: 2, hold: 15, web: 25, tackle: 20 }, tackleCd: .8, regen: 1.2, speed: 300, airJumps: 0, dmgK: 1 },
  rimuru: { cost: { tap: 4, hold: 25, web: 20, tackle: 20 }, tackleCd: .8, regen: 1.3, speed: 330, airJumps: 1, dmgK: 1 },
  // Stelle: bộ kĩ năng "hack" — mọi chiêu miễn phí, nhảy 3 lần, sát thương ×2, xuyên khiên boss
  stelle: { cost: { tap: 0, hold: 0, web: 0, tackle: 0 }, tackleCd: .35, regen: 6, speed: 400, airJumps: 2, dmgK: 2, pierce: true },
  // Xayda (Ngọc Rồng Online): Shift là Khiên năng lượng nên hồi chiêu lâu
  saiyan: { cost: { tap: 1, hold: 15, web: 25, tackle: 20 }, tackleCd: 10, regen: 1, speed: 330, airJumps: 0, dmgK: 1 },
  // Kiếm khách (Hải Tặc Tí Hon), Asta, Yuno (Black Clover): bộ kĩ năng tầm cheat như Stelle —
  // mọi chiêu miễn phí, nhảy 3 lần, chạy nhanh, sát thương ×2, xuyên khiên boss. U của Kiếm khách là Tam kiếm (không cần đầy).
  kiem:   { cost: { tap: 0, hold: 0, web: 0, tackle: 0, volt: 0 }, tackleCd: .35, regen: 6, speed: 400, airJumps: 2, dmgK: 2, pierce: true },
  asta:   { cost: { tap: 0, hold: 0, web: 0, tackle: 0 }, tackleCd: .35, regen: 6, speed: 400, airJumps: 2, dmgK: 2, pierce: true },
  yuno:   { cost: { tap: 0, hold: 0, web: 0, tackle: 0 }, tackleCd: .35, regen: 6, speed: 400, airJumps: 2, dmgK: 2, pierce: true },
  // Pain (Naruto): cheat như trên, Shift là khiên Ngạ Quỷ Đạo nên hồi 1,2 giây, giữ nhảy để lơ lửng
  pain:   { cost: { tap: 0, hold: 0, web: 0, tackle: 0 }, tackleCd: 1.2, regen: 6, speed: 400, airJumps: 2, dmgK: 2, pierce: true },
  // Goku (Dragon Ball): cheat như trên, bay tự do bằng nút di chuyển (fly), không bao giờ rơi
  goku:   { cost: { tap: 0, hold: 0, web: 0, tackle: 0 }, tackleCd: .35, regen: 6, speed: 420, airJumps: 0, dmgK: 2, pierce: true, fly: true },
};
const CH = () => CHAR === 'pika' && DMAX ? CHARS.pikaMax : CHARS[CHAR];
const cost = k => CH().cost[k];
/* ---------- Pikachu: Dynamax (G) và tuyệt kĩ Z (Z) ----------
   Dynamax: to gấp 10 lần, vĩnh viễn (lưu trên máy tới khi bấm G lần nữa), bộ chiêu chuyển sang hack.
   Thân khổng lồ chỉ để nhìn và nghiền quái; hitbox vẫn là quả bóng nhỏ ở chân nên vẫn lách qua được địa hình. */
const DMAX_KEY = 'bongdo.dmax', MAX_K = 10, FOREVER = 1e9;
let DMAX = false;
const camTargetY = () => S.ball.y - VIEW_H * (CHAR === 'pika' && DMAX ? .9 : .55);
const camMinY = () => CAM_Y[0] - (CHAR === 'pika' && DMAX ? 260 : 0);
function toggleDmax() {
  if (S.dead || S.won || S.lost) return;
  DMAX = !DMAX;
  lsSet(DMAX_KEY, DMAX ? '1' : '');
  const b = S.ball;
  S.flash = .8; S.safe = Math.max(S.safe, .6);
  sfx(DMAX ? 'volt' : 'pikachu');
  S.pops.push({ x: b.x, y: b.y - (DMAX ? 300 : 60), t: 1.4, text: DMAX ? 'Pikachu DYNAMAX!' : 'Pikachu trở lại bình thường', c: DMAX ? '#ff5a6e' : '#fff27a' });
  for (let i = 0; i < 60; i++) {
    const a = Math.random() * Math.PI * 2, sp = 150 + Math.random() * 500;
    S.parts.push({ x: b.x, y: b.y - (DMAX ? 200 : 20), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: .9, c: ['#ff3355', '#ff9aa8', '#fff27a', '#ffffff'][i % 4], r: 6 + Math.random() * 8, g: 0 });
  }
  S.airJumps = CH().airJumps;
  applyChar();
}
// thân khổng lồ đi tới đâu, quái nhỏ bị nghiền tới đó
function maxStomp() {
  const b = S.ball, feet = b.y + R;
  for (const e of S.enemies) {
    if (!e.alive) continue;
    const ey = e.f(e.x) - 20;
    if (Math.abs(e.x - b.x) < 11 * MAX_K && ey > feet - 50 * MAX_K && ey < feet + 20) killEnemy(e);
  }
  for (const f of S.flyers) if (f.alive && Math.abs(f.x - b.x) < 12 * MAX_K && f.y > feet - 55 * MAX_K && f.y < feet + 20) killFlyer(f);
}
// Tuyệt kĩ Z của Pikachu: Catastropika — lao lên trời, bọc toàn thân bằng điện rồi giáng xuống cả màn hình
const ZMOVE = { dmg: 8, stun: 3, n: 18, fx: 1.4, sfx: 'volt' };
function zMove() {
  if (!canAct()) return;
  if (S.zCd > 0) {
    S.pops.push({ x: S.ball.x, y: S.ball.y - 60, t: .8, text: `Pha lê Z đang nạp (${Math.ceil(S.zCd)} giây)`, c: '#ff9aa8' });
    sfx('deny');
    return;
  }
  S.zCd = DMAX ? 8 : 20; S.zFx = 1.6;
  S.power = Math.max(S.power, 1.2);
  const b = S.ball;
  S.pops.push({ x: b.x, y: b.y - (DMAX ? 360 : 90), t: 1.4, text: 'Tuyệt kĩ Z: CATASTROPIKA!', c: '#ffe14a' });
  ultBlast(ZMOVE, 'pikaZ');
}
const MOVES = {
  pika:   { tap: fireShock, hold: fireElectroBall, web: fireWeb },
  chii:   { tap: chiiBonk, hold: chiiWeeds, web: chiiCry },
  rimuru: { tap: waterBlade, hold: blackLightning, web: predator },
  stelle: { tap: farewellHit, hold: homeRun, web: amberShield },
  saiyan: { tap: galick, hold: antomic, web: bind },
  kiem:   { tap: nhatKiem, hold: nhatKiem, web: songKiem },
  asta:   { tap: astaSlash, hold: magicReturn, web: blackHurricane },
  yuno:   { tap: windBlade, hold: windCrescent, web: toweringTornado },
  pain:   { tap: painRod, hold: banshoTenin, web: chibakuTensei },
  goku:   { tap: kiBlast, hold: kamehameha, web: instantTransmission },
};
// chiêu U: sát thương lên boss (trước hệ số nhân vật), thời gian choáng, số tia, âm thanh
const ULTS = {
  pika:   { dmg: 5, stun: 1.5, n: 7, fx: .9, sfx: 'volt' },
  chii:   { dmg: 5, stun: 2, n: 5, fx: 1.2, sfx: 'friends' },
  rimuru: { dmg: 6, stun: 1.5, n: 11, fx: .9, sfx: 'megiddo' },
  stelle: { dmg: 4, stun: 2.5, n: 9, fx: 1, sfx: 'ace' },
  asta:   { dmg: 6, stun: 1.5, n: 6, fx: 1, sfx: 'meteor' },
  yuno:   { dmg: 5, stun: 2, n: 8, fx: 1.1, sfx: 'storm' },
};
const SWING = .22;
const chargeK = hold => clamp((hold - BALL_HOLD) / (BALL_FULL - BALL_HOLD), 0, 1);
const bossOpen = () => { const B = S.boss; return S.fight && !B.dead && !B.cut && !B.fuse; };
function shoot(kind, speed, life, dmg, cd, dy = -8) {
  const b = S.ball, d = b.face || 1;
  S.shockCd = cd; S.cast = .2;
  S.bolts.push({ kind, x: b.x + d * 24, y: b.y + dy, vx: d * speed, life, seed: Math.random() * 100, dmg });
}
// Chiikawa: gõ gậy tầm gần
function chiiBonk() {
  if (S.shockCd > 0 || !spend(cost('tap'))) return;
  shoot('stick', 640, .2, 1, .28); S.swing = SWING;
  sfx('bonk');
}
// Chiikawa: ném bó cỏ (chứng chỉ nhổ cỏ), bay vòng cung và nảy như Quả cầu điện
function chiiWeeds(hold) {
  if (!spend(cost('hold'))) return;
  const b = S.ball, d = b.face || 1, k = chargeK(hold), dmg = 2 + (k >= .99 ? 1 : 0);
  S.orbs.push({ kind: 'weed', x: b.x + d * 24, y: b.y - 18, vx: d * (380 + k * 240), vy: -380, r: 10 + k * 6, dmg, bounced: false, life: 1.8, hit: new Set() });
  S.cast = .25; S.swing = SWING;
  sfx('toss');
  S.pops.push({ x: b.x, y: b.y - 58, t: .6, text: `Bó cỏ ×${dmg}`, c: '#9cf07a' });
}
// Chiikawa: khóc oà — làm choáng mọi thứ xung quanh và xoá đạn
function chiiCry() {
  if (!canAct() || S.webCd > 0 || !spend(cost('web'))) return;
  const b = S.ball;
  S.webCd = 1; S.cry = .9;
  sfx('cry');
  S.pops.push({ x: b.x, y: b.y - 60, t: .9, text: 'Wa wa wa!', c: '#9fd8ff' });
  stunAround(b.x, b.y, 190, 3);
}
function stunAround(x, y, r, t) {
  const near = (px, py) => Math.hypot(px - x, py - y) < r;
  for (const e of S.enemies) if (e.alive && near(e.x, e.f(e.x) - 20)) e.stun = t;
  for (const f of S.flyers) if (f.alive && near(f.x, f.y)) { f.stun = t; f.state = 'patrol'; }
  for (const q of S.bullets) if (near(q.x, q.y)) q.dead = true;
  for (const q of S.tshots) if (near(q.x, q.y)) q.alive = false;
  for (const c of S.icicles) if (near(c.x, c.y)) c.dead = true;
  const B = S.boss;
  if (bossOpen() && !(B.ts > 0)) {
    const u = B.units[0];
    if (!u.hidden && Math.abs(u.x - x) < r + unitW(u) / 2) {
      B.stun = Math.max(B.stun, t * .7); B.act = null; B.sweep = null;
      S.pops.push({ x: u.x, y: u.y - BOSS_H - 20, t: .8, text: 'Choáng!', c: '#9fd8ff' });
    }
  }
}
// Rimuru: Lưỡi nước (Water Blade)
function waterBlade() {
  if (S.shockCd > 0 || !spend(cost('tap'))) return;
  shoot('water', 860, .6, 1, .24, -4);
  sfx('water');
}
// Rimuru: Sét Đen giáng từ trời ở phía trước; giữ càng lâu càng xa và mạnh
function blackLightning(hold) {
  if (!spend(cost('hold'))) return;
  const b = S.ball, d = b.face || 1, k = chargeK(hold), dmg = 2 + (k >= .99 ? 1 : 0);
  S.cast = .3; S.flash = Math.max(S.flash, .2);
  sfx('blackbolt');
  strikeColumn(b.x + d * (150 + k * 170), dmg);
  S.pops.push({ x: b.x, y: b.y - 58, t: .6, text: `Sét Đen ×${dmg}`, c: '#c9a0ff' });
}
function strikeColumn(x, dmg) {
  S.columns.push({ x, t: .45, seed: Math.random() * 10 });
  const w = 46, inCol = px => Math.abs(px - x) < w;
  for (const e of S.enemies) if (e.alive && inCol(e.x)) killEnemy(e, '#3a1a5a');
  for (const f of S.flyers) if (f.alive && Math.abs(f.x - x) < w + f.r) killFlyer(f);
  for (const q of S.bullets) if (inCol(q.x)) q.dead = true;
  for (const q of S.tshots) if (inCol(q.x)) q.alive = false;
  for (const c of S.icicles) if (inCol(c.x)) c.dead = true;
  const T = S.turret;
  if (T.alive && Math.abs(T.x - x) < w + 24) breakTurret();
  if (bossOpen()) for (const u of S.boss.units) if (!u.hidden && Math.abs(u.x - x) < unitW(u) / 2 + w) { damageBoss(u, dmg, 'ball'); break; }
}
// Rimuru: Kẻ Săn Mồi (Predator) — nuốt quái và đạn trước mặt, mỗi thứ nuốt được hồi ma tố
function predator() {
  if (!canAct() || S.webCd > 0 || !spend(cost('web'))) return;
  const b = S.ball, d = b.face || 1, cx = b.x + d * 70, cy = b.y - 10, r = 110;
  const near = (px, py) => Math.hypot(px - cx, py - cy) < r;
  S.webCd = .9; S.cast = .4; S.maw = { x: cx, y: cy, t: .4 };
  let n = 0;
  for (const e of S.enemies) if (e.alive && near(e.x, e.f(e.x) - 20)) { killEnemy(e, '#5ec8f2'); n++; }
  for (const f of S.flyers) if (f.alive && near(f.x, f.y)) { killFlyer(f); n++; }
  for (const q of S.bullets) if (!q.dead && near(q.x, q.y)) { q.dead = true; n++; }
  for (const q of S.tshots) if (q.alive !== false && near(q.x, q.y)) { q.alive = false; n++; }
  for (const c of S.icicles) if (!c.dead && near(c.x, c.y)) { c.dead = true; n++; }
  if (turretAt(cx, cy, r * .6)) { breakTurret(); n++; }
  const u = bossUnitAt(cx, cy, r * .5) || bossUnitAt(cx, cy - 110, r * .5);
  if (u && damageBoss(u, 1, 'ball')) n++;
  gainEnergy(n * 4);
  sfx('gulp');
  S.pops.push({ x: b.x, y: b.y - 58, t: .7, text: n ? `Kẻ Săn Mồi: nuốt ${n}` : 'Kẻ Săn Mồi', c: '#9ef0ff' });
}
// Stelle: Farewell Hit — vụt gậy phóng ngôi sao
function farewellHit() {
  if (S.shockCd > 0) return;
  shoot('star', 900, .55, 1, .2, -12); S.swing = SWING;
  sfx('swing');
}
// Stelle: RIP Home Run — sóng sao cao, xuyên qua mọi thứ, trúng cả boss đang bay
function homeRun(hold) {
  const b = S.ball, d = b.face || 1, k = chargeK(hold), dmg = 2 + (k >= .99 ? 1 : 0);
  S.waves.push({ x: b.x + d * 30, y: b.y - 14, vx: d * (620 + k * 220), r: 20, rMax: 34 + k * 20, h: 60, life: 1.1, dmg, hitBoss: false });
  S.swing = SWING;
  sfx('homerun');
  S.pops.push({ x: b.x, y: b.y - 58, t: .6, text: `RIP Home Run ×${dmg * CH().dmgK}`, c: '#ffd65e' });
}
// Stelle: Hổ Phách Bất Diệt (Ever-Burning Amber, vận mệnh Bảo Hộ) — khiên vô địch, chạm quái là hạ
function amberShield() {
  if (!canAct()) return;
  if (S.amberCd > 0) { S.pops.push({ x: S.ball.x, y: S.ball.y - 50, t: .6, text: `Khiên hồi ${Math.ceil(S.amberCd)} giây`, c: '#ffb43a' }); sfx('deny'); return; }
  S.amberCd = 5; S.amber = 4; S.power = Math.max(S.power, 4);
  const B = S.boss;
  if (B.cut && B.cut.appear && !B.cut.struck) B.cut.blocked = true;
  sfx('amber');
  boltSpark(S.ball.x, S.ball.y, '#ffb43a', 20);
}
/* Xayda (Ngọc Rồng Online): Đấm Galick, Antomic, Trói, Khiên năng lượng, Biến Khỉ, Tái tạo năng lượng, Huýt sáo, Tự phát nổ */
function galick() {
  if (S.shockCd > 0 || !spend(cost('tap'))) return;
  shoot('punch', 620, .16, S.ape > 0 ? 2 : 1, .25, -10); S.swing = SWING;
  sfx('bonk');
}
function antomic(hold) {
  if (!spend(cost('hold'))) return;
  const k = chargeK(hold), dmg = 2 + (k >= .99 ? 1 : 0);
  shoot('antomic', 760, .85, dmg, .3, -12); S.swing = SWING;
  sfx('orb');
  S.pops.push({ x: S.ball.x, y: S.ball.y - 58, t: .6, text: `Antomic ×${dmg}`, c: '#d9a6ff' });
}
function bind() {
  if (!canAct() || S.webCd > 0 || !spend(cost('web'))) return;
  const b = S.ball, d = b.face || 1;
  S.webCd = .8; S.cast = .25;
  S.webs.push({ kind: 'rope', x: b.x + d * 26, y: b.y - 10, vx: d * 700, life: .5, r: 24 });
  sfx('web');
}
function apeForm() {
  if (!canAct() || S.ape > 0) return;
  if (S.energy < COST.volt) {
    S.pops.push({ x: S.ball.x, y: S.ball.y - 50, t: .8, text: `Biến Khỉ cần đầy KI (${Math.floor(S.energy)}/100)`, c: '#fff27a' });
    sfx('deny'); return;
  }
  S.energy = 0; S.ape = 15; S.flash = .6;
  sfx('roar');
  S.pops.push({ x: S.ball.x, y: S.ball.y - 80, t: 1.2, text: 'Biến Khỉ Khổng Lồ!', c: '#ffb38a' });
  boltSpark(S.ball.x, S.ball.y, '#ffb38a', 24);
}
function whistle() {
  if (!canAct()) return;
  if (S.whistleCd > 0) { S.pops.push({ x: S.ball.x, y: S.ball.y - 50, t: .6, text: `Huýt sáo hồi ${Math.ceil(S.whistleCd)} giây`, c: '#9fd8ff' }); sfx('deny'); return; }
  S.whistleCd = 45;
  const before = S.lives;
  S.lives = Math.min(MAX_LIVES, S.lives + 1);
  gainEnergy(20); hud();
  sfx('whistle');
  S.pops.push({ x: S.ball.x, y: S.ball.y - 60, t: 1, text: S.lives > before ? 'Huýt sáo: +1 mạng' : 'Huýt sáo: đầy mạng', c: '#ff6b81' });
}
function selfDestruct() {
  if (!canAct() || S.boom > 0) return;
  if (S.energy < 50) { S.pops.push({ x: S.ball.x, y: S.ball.y - 50, t: .8, text: `Tự phát nổ cần 50 KI (${Math.floor(S.energy)}/50)`, c: '#fff27a' }); sfx('deny'); return; }
  S.energy = 0; S.boom = 1.5;
  sfx('charge');
  S.pops.push({ x: S.ball.x, y: S.ball.y - 70, t: 1.2, text: 'Tự phát nổ!', c: '#ff6b6b' });
}
// Nổ tung cả vùng quanh mình rồi mất 1 mạng, đúng như chiêu trong game
function explode() {
  const b = S.ball, r = 340, near = (x, y) => Math.hypot(x - b.x, y - b.y) < r;
  S.blast = { x: b.x, y: b.y, t: .7 }; S.flash = 1;
  sfx('boom');
  for (const e of S.enemies) if (e.alive && near(e.x, e.f(e.x) - 20)) killEnemy(e, '#ffd27a');
  for (const f of S.flyers) if (f.alive && near(f.x, f.y)) killFlyer(f);
  for (const q of S.bullets) if (near(q.x, q.y)) q.dead = true;
  for (const q of S.tshots) if (near(q.x, q.y)) q.alive = false;
  for (const c of S.icicles) if (near(c.x, c.y)) c.dead = true;
  const T = S.turret;
  if (T.alive && Math.abs(T.x - b.x) < r) breakTurret();
  if (bossOpen()) {
    const u = S.boss.units[0];
    if (!u.hidden && Math.abs(u.x - b.x) < r + unitW(u) / 2) damageBoss(u, 10, 'volt');
  }
  S.ape = 0; S.amber = 0; S.power = 0; S.safe = 0;
  die();
}
/* Kiếm khách (Hải Tặc Tí Hon): Nhất kiếm, Song kiếm, Tam kiếm — đúng tên, bộ hiệu ứng skill cấp 20 (màu đỏ) của game,
   nhịp và kích thước theo code gốc (đơn vị game × KE). Nội tại của phái: Song kiếm gây xuất huyết 4 giây.
   Ảnh gốc vẽ nhân vật quay sang trái nên khi quay phải thì lật ngang (flip = -hướng). */
const KE = .85;   // nhân vật trong game cao ~82, ở đây ~70
const after = (t, fn) => S.timers.push({ t, fn });
const pose = (p, t) => { S.kpose = p; S.kposeT = t; };
// hiệu ứng ảnh động: s = tên ảnh trong KK, fps, seq = thứ tự khung, flip = lật ngang, ball = bám theo người chơi
function kfx(s, x, y, w, h, o = {}) { S.kfx.push({ s, x, y, w, h, t: 0, fps: 18, loop: false, flip: 1, ...o }); }
function hitFx(x, y, k = 1) { kfx('hit', x, y, 100 * KE * k, 100 * KE * k, { fps: 30 }); }
// cỡ hiệu ứng theo mục tiêu: boss to hơn nhân vật thường
const tScale = t => t && t.kind === 'boss' ? (t.ref.kind === 'fused' ? FH : BOSS_H) / 80 : 1;
// mục tiêu gần nhất phía trước: boss, quái, quái bay, ụ băng
function kkTarget(range) {
  const b = S.ball, d = b.face || 1;
  let best = null, bd = Infinity;
  const cand = (ref, kind) => {
    const p = tPos({ ref, kind }), dx = (p.x - b.x) * d;
    if (dx < -30 || dx > range || Math.abs(p.y - b.y) > 260) return;
    const dist = Math.hypot(p.x - b.x, p.y - b.y) * (kind === 'boss' ? .7 : 1);
    if (dist < bd) { bd = dist; best = { ref, kind }; }
  };
  if (bossOpen()) for (const u of S.boss.units) if (!u.hidden) cand(u, 'boss');
  for (const e of S.enemies) if (e.alive) cand(e, 'enemy');
  for (const f of S.flyers) if (f.alive) cand(f, 'flyer');
  if (S.turret.alive) cand(S.turret, 'turret');
  return best;
}
function tPos(t) {
  const r = t.ref;
  if (t.kind === 'boss') return { x: r.x, y: r.y - (r.kind === 'fused' ? FH : BOSS_H) / 2 };
  if (t.kind === 'enemy') return { x: r.x, y: r.f(r.x) - 20 };
  if (t.kind === 'turret') return { x: r.x, y: r.f(r.x) - 26 };
  return { x: r.x, y: r.y };
}
const tAlive = t => t.kind === 'boss' ? bossOpen() && !t.ref.hidden : t.ref.alive;
function kkHit(t, dmg, bleed) {
  if (!tAlive(t)) return;
  const p = tPos(t);
  hitFx(p.x, p.y, tScale(t));
  if (t.kind === 'boss') {
    if (damageBoss(t.ref, dmg, 'shock') && bleed) { S.bleed = 4; S.bleedTick = 1.3; }
  } else if (t.kind === 'enemy') killEnemy(t.ref, '#c0303a');
  else if (t.kind === 'flyer') killFlyer(t.ref);
  else { const T = S.turret; T.hp -= dmg; T.flash = .15; if (T.hp <= 0) breakTurret(); }
}
// chém mọi thứ trong khung chữ nhật phía trước (dùng cho Nhất kiếm và kiếm của Asta)
function slashArea(x0, x1, y, h, dmg, kind, c) {
  const lo = Math.min(x0, x1), hi = Math.max(x0, x1), inR = (px, py, pad = 0) => px > lo - pad && px < hi + pad && Math.abs(py - y) < h + pad;
  let n = 0;
  for (const e of S.enemies) if (e.alive && inR(e.x, e.f(e.x) - 20, 20)) { killEnemy(e, c); hitFx(e.x, e.f(e.x) - 20); n++; }
  for (const f of S.flyers) if (f.alive && inR(f.x, f.y, f.r)) { killFlyer(f); hitFx(f.x, f.y); n++; }
  for (const q of S.bullets) if (inR(q.x, q.y, 8)) q.dead = true;
  for (const q of S.tshots) if (inR(q.x, q.y, 8)) q.alive = false;
  for (const c2 of S.icicles) if (inR(c2.x, c2.y, 8)) c2.dead = true;
  const T = S.turret;
  if (T.alive && inR(T.x, T.f(T.x) - 26, 24)) { T.hp -= dmg; T.flash = .15; hitFx(T.x, T.f(T.x) - 26); if (T.hp <= 0) breakTurret(); n++; }
  if (bossOpen()) for (const u of S.boss.units) {
    const uh = u.kind === 'fused' ? FH : BOSS_H;
    if (!u.hidden && hi > u.x - unitW(u) / 2 && lo < u.x + unitW(u) / 2 && y + h > u.y - uh && y - h < u.y) {
      if (damageBoss(u, dmg, kind)) hitFx(clamp(u.x, lo, hi), Math.max(y, u.y - uh + 20));
      n++; break;
    }
  }
  return n;
}
// Nhất kiếm: "Đòn đánh cơ bản nhưng lại rất nguy hiểm của kiếm khách" — lưỡi liềm đỏ trước mặt (130×70 trong game),
// tư thế a2 → a3 (0,2 giây) → a2 (0,3 giây); hết hiệu ứng thì mục tiêu trúng đòn
function nhatKiem() {
  if (S.shockCd > 0 || !canAct() || !spend(cost('tap'))) return;
  const b = S.ball, d = b.face || 1, t = kkTarget(320);
  S.shockCd = .4;
  pose('a2', .2); after(.2, () => pose('a3', .1)); after(.3, () => pose('a2', .1));
  kfx('nhat', b.x + d * 95, b.y - 4, 130 * KE, 70 * KE, { fps: 12, flip: -d });
  sfx('slash');
  if (t) after(.33, () => kkHit(t, 1));
  else after(.15, () => slashArea(b.x, b.x + d * 160, b.y - 6, 44, 1, 'shock', '#c0303a'));
}
// Song kiếm: biến mất (0,1 giây), hiện ra sát mục tiêu, 2 dải kiếm đỏ quấn mục tiêu 0,3 giây,
// chém chéo một nhát lửa đỏ rồi một nhát ngược chiều (tư thế a5); gây xuất huyết
function songKiem() {
  if (!canAct()) return;
  if (S.songCd > 0) { S.pops.push({ x: S.ball.x, y: S.ball.y - 50, t: .6, text: `Song kiếm hồi ${S.songCd.toFixed(1)} giây`, c: '#ff8a8a' }); sfx('deny'); return; }
  if (!spend(cost('web'))) return;
  const b = S.ball, d = b.face || 1, t = kkTarget(420);
  S.songCd = .6; S.power = Math.max(S.power, .7);
  kfx('vanish', b.x, b.y - 6, 150 * KE, 150 * KE, { fps: 30, flip: -d });
  sfx('vanish');
  pose('hide', .1);
  after(.1, () => {
    if (S.dead) return;
    const ok = t && tAlive(t), k = tScale(t);
    const p = ok ? tPos(t) : { x: b.x + d * 150, y: b.y - 8 };
    if (ok) {
      const side = Math.sign(b.x - p.x) || -d, gap = t.kind === 'boss' ? unitW(t.ref) / 2 + R + 6 : 50 * KE;
      let nx = p.x + side * gap;
      if (S.gateClosed) nx = clamp(nx, ARENA.l + R + 4, ARENA.r - R - 4);
      b.x = nx; if (t.kind !== 'boss') b.y = Math.min(b.y, p.y + 10); b.vx = 0; b.vy = Math.min(b.vy, 0);
      b.face = Math.sign(p.x - b.x) || d;
    }
    pose('a2', .23);
    for (let i = 0; i < 2; i++) kfx('ribbon', p.x, p.y + (i - .5) * 90 * KE * k, 50 * KE * k, 100 * KE * k, { fps: 30, loop: true, life: .3 });
    kfx('chem', p.x, p.y, 100 * KE * k, 100 * KE * k, { fps: 18, flip: 1 });
    sfx('slash');
    if (ok) kkHit(t, 1, true); else { hitFx(p.x, p.y); slashArea(p.x - 50, p.x + 50, p.y, 50, 1, 'shock', '#c0303a'); }
    after(.23, () => {
      if (S.dead) return;
      const q = t && tAlive(t) ? tPos(t) : p;
      pose('a5', .23);
      kfx('chem', q.x, q.y, 100 * KE * k, 100 * KE * k, { fps: 18, flip: -1 });
      sfx('slash');
      if (ok) kkHit(t, 1, true); else { hitFx(q.x, q.y); slashArea(q.x - 50, q.x + 50, q.y, 50, 1, 'shock', '#c0303a'); }
      after(.23, () => { if (t && tAlive(t)) { const r = tPos(t); hitFx(r.x, r.y, k); } });
    });
  });
}
// Tam kiếm: tư thế a1, sau 0,2 giây tư thế a5 — vòng xoáy đỏ quanh người, bụi dưới chân,
// phóng 3 cơn lốc cách nhau 0,1 giây, mỗi cơn tự lao tới mục tiêu và nổ trúng đòn
function tamKiem() {
  if (!canAct()) return;
  if (S.tamCd > 0) { S.pops.push({ x: S.ball.x, y: S.ball.y - 50, t: .6, text: `Tam kiếm hồi ${Math.ceil(S.tamCd)} giây`, c: '#ff8a8a' }); sfx('deny'); return; }
  if (!spend(cost('volt'))) return;
  const b = S.ball, d = b.face || 1;
  S.tamCd = 2; S.cast = .6;
  pose('a1', .2);
  after(.2, () => {
    if (S.dead) return;
    const t = kkTarget(640), dd = S.ball.face || d;
    pose('a5', .55);
    kfx('dust', -dd * 6, R - 2 - 25 * KE, 100 * KE, 50 * KE, { ball: true, loop: true, life: .55, fps: 18, flip: -dd });
    kfx('aura', 0, -12, 70 * KE, 70 * KE, { ball: true, loop: true, life: .55, fps: 18 });
    sfx('twister');
    for (let i = 0; i < 3; i++) after(.1 * i, () => {
      if (S.dead) return;
      S.ktor.push({ x: S.ball.x, y: S.ball.y - 10, t, d: S.ball.face || dd, life: 1.4, ft: 0, hit: new Set() });
    });
  });
}
function updateKiem(dt) {
  S.kposeT = Math.max(0, S.kposeT - dt); if (S.kposeT <= 0) S.kpose = null;
  S.songCd = Math.max(0, S.songCd - dt); S.tamCd = Math.max(0, S.tamCd - dt);
  const due = S.timers.filter(q => (q.t -= dt) <= 0);
  S.timers = S.timers.filter(q => q.t > 0);
  for (const q of due) q.fn();
  for (const f of S.kfx) f.t += dt;
  S.kfx = S.kfx.filter(f => f.loop ? f.t < f.life : Math.floor(f.t * f.fps) < (f.seq ? f.seq.length : KK[f.s].n));
  // ba cơn lốc của Tam kiếm
  for (const o of S.ktor) {
    o.life -= dt; o.ft += dt;
    if (o.t && tAlive(o.t)) {
      const p = tPos(o.t), dx = p.x - o.x, dy = p.y - o.y, dist = Math.hypot(dx, dy) || 1, sp = 640 * dt;
      if (dist <= Math.max(26, sp)) { kkHit(o.t, 1); o.life = 0; continue; }
      o.x += dx / dist * sp; o.y += dy / dist * sp;
    } else { o.t = null; o.x += o.d * 620 * dt; }
    for (const e of S.enemies) if (e.alive && !o.hit.has(e) && Math.abs(o.x - e.x) < 34 && Math.abs(o.y - (e.f(e.x) - 20)) < 40) { o.hit.add(e); killEnemy(e, '#c0303a'); hitFx(e.x, e.f(e.x) - 20); }
    for (const f of S.flyers) if (f.alive && Math.hypot(f.x - o.x, f.y - o.y) < f.r + 30) { killFlyer(f); hitFx(f.x, f.y); }
    for (const q of S.bullets) if (Math.hypot(q.x - o.x, q.y - o.y) < 36) q.dead = true;
    for (const q of S.tshots) if (Math.hypot(q.x - o.x, q.y - o.y) < 36) q.alive = false;
    if (!o.t) {
      if (turretAt(o.x, o.y, 30)) { const T = S.turret; T.hp--; T.flash = .15; hitFx(o.x, o.y); if (T.hp <= 0) breakTurret(); o.life = 0; continue; }
      const u = bossUnitAt(o.x, o.y, 30);
      if (u) { damageBoss(u, 1, 'shock'); hitFx(o.x, o.y); o.life = 0; }
    }
  }
  S.ktor = S.ktor.filter(o => o.life > 0);
  // nội tại: xuất huyết sau Song kiếm, mất máu từng giọt trong 4 giây
  if (S.bleed > 0) {
    S.bleed -= dt; S.bleedTick -= dt;
    const B = S.boss, u = B.units && B.units[0];
    if (!bossOpen() || !u || u.hidden) S.bleed = 0;
    else {
      if (Math.random() < dt * 14) S.parts.push({ x: u.x + (Math.random() - .5) * 40, y: u.y - BOSS_H * (.3 + Math.random() * .5), vx: 0, vy: 40, life: .6, c: '#c0101e', r: 4 });
      if (S.bleedTick <= 0) {
        S.bleedTick = 1.35;
        if (bossVulnerable(B, 'bleed') && !(B.inv > 0)) { damageBoss(u, 1, 'bleed'); S.pops.push({ x: u.x, y: u.y - BOSS_H - 30, t: .6, text: 'Xuất huyết', c: '#ff5a6a' }); }
      }
    }
  }
}
/* Asta (Black Clover): kiếm phản ma pháp — chém đứt đạn phép, xuyên khiên boss */
function astaSlash() {
  if (S.shockCd > 0 || !canAct() || !spend(cost('tap'))) return;
  const b = S.ball, d = b.face || 1;
  S.shockCd = .3; S.swing = SWING;
  S.slashes.push({ x: b.x + d * 30, y: b.y - 12, d, t: .2, r: 56 });
  sfx('anti');
  slashArea(b.x, b.x + d * 100, b.y - 10, 44, 1, 'anti', '#16161a');
}
// Kiếm Trú Quỷ: Phản Hồi Ma Pháp — trả lại ma lực đã hấp thụ thành nhát chém sóng đen
function magicReturn(hold) {
  if (!spend(cost('hold'))) return;
  const b = S.ball, d = b.face || 1, k = chargeK(hold), dmg = 2 + (k >= .99 ? 1 : 0);
  S.waves.push({ kind: 'asta', x: b.x + d * 30, y: b.y - 14, vx: d * (640 + k * 200), r: 22, rMax: 36 + k * 18, h: 60, life: 1, dmg, hitBoss: false });
  S.swing = SWING;
  sfx('anti');
  S.pops.push({ x: b.x, y: b.y - 58, t: .6, text: `Phản Hồi Ma Pháp ×${dmg}`, c: '#9cff7a' });
}
// Black Hurricane: xoay kiếm thành lốc đen quanh người
function blackHurricane() {
  if (!canAct() || S.webCd > 0 || !spend(cost('web'))) return;
  const b = S.ball;
  S.webCd = .5; S.spin = .45; S.swing = SWING;
  sfx('anti');
  slashArea(b.x - 125, b.x + 125, b.y - 10, 70, 1, 'anti', '#16161a');
  stunAround(b.x, b.y, 140, 1.5);
}
/* Yuno (Black Clover): ma pháp gió */
function windBlade() {
  if (S.shockCd > 0 || !spend(cost('tap'))) return;
  shoot('wind', 940, .5, 1, .22, -10);
  sfx('wind');
}
function windCrescent(hold) {
  if (!spend(cost('hold'))) return;
  const b = S.ball, d = b.face || 1, k = chargeK(hold), dmg = 2 + (k >= .99 ? 1 : 0);
  S.waves.push({ kind: 'yuno', x: b.x + d * 30, y: b.y - 14, vx: d * (700 + k * 220), r: 20, rMax: 34 + k * 20, h: 60, life: 1, dmg, hitBoss: false });
  S.cast = .3;
  sfx('wind');
  S.pops.push({ x: b.x, y: b.y - 58, t: .6, text: `Trăng Khuyết Gió ×${dmg}`, c: '#9cf0b4' });
}
// Lốc Xoáy Chọc Trời: cột lốc tiến chậm về phía trước, cuốn sạch đạn, làm choáng boss
function toweringTornado() {
  if (!canAct() || S.webCd > 0 || !spend(cost('web'))) return;
  const b = S.ball, d = b.face || 1;
  S.webCd = .5; S.cast = .3;
  S.ytor.push({ x: b.x + d * 40, y: b.y + R, vx: d * 280, life: 1.5, hitBoss: false });
  sfx('twister');
}
function updateClover(dt) {
  S.black = Math.max(0, S.black - dt);
  S.spin = Math.max(0, S.spin - dt);
  for (const s of S.slashes) s.t -= dt;
  S.slashes = S.slashes.filter(s => s.t > 0);
  for (const o of S.ytor) {
    o.x += o.vx * dt; o.life -= dt;
    const gy = groundYAt(o.x); if (gy != null) o.y += (gy - o.y) * Math.min(1, dt * 10);
    const inT = (px, py, pad) => Math.abs(px - o.x) < 40 + pad && py < o.y + 10 && py > o.y - 170;
    for (const e of S.enemies) if (e.alive && inT(e.x, e.f(e.x) - 20, 20)) killEnemy(e, '#5fd08a');
    for (const f of S.flyers) if (f.alive && inT(f.x, f.y, f.r)) killFlyer(f);
    for (const q of S.bullets) if (inT(q.x, q.y, 8)) q.dead = true;
    for (const q of S.tshots) if (inT(q.x, q.y, 8)) q.alive = false;
    for (const c of S.icicles) if (inT(c.x, c.y, 8)) c.dead = true;
    if (turretAt(o.x, o.y - 30, 30)) breakTurret();
    if (!o.hitBoss && bossOpen()) {
      const u = bossUnitAt(o.x, o.y - 40, 40) || bossUnitAt(o.x, o.y - 140, 40);
      if (u) {
        o.hitBoss = true; damageBoss(u, 1, 'ball');
        const B = S.boss;
        if (!B.dead && !B.cut && !B.fuse && !(B.ts > 0)) { B.stun = Math.max(B.stun, 1.2); B.act = null; B.sweep = null; S.pops.push({ x: u.x, y: u.y - BOSS_H - 20, t: .8, text: 'Cuốn bay!', c: '#9cf0b4' }); }
      }
    }
  }
  S.ytor = S.ytor.filter(o => o.life > 0);
}
/* Pain (Naruto, Thiên Đạo): bộ tuyệt kĩ cheat — Hắc Bổng, Vạn Tượng Thiên Dẫn, Địa Bộc Thiên Tinh, Ngạ Quỷ Đạo,
   và mạnh nhất: Shinra Tensei toàn lực, quả cầu đẩy lan rộng tiêu diệt mọi thứ xung quanh và phá huỷ địa hình nó quét qua. */
// J: Hắc Bổng — phóng thanh nhận chakra đen
function painRod() {
  if (S.shockCd > 0 || !spend(cost('tap'))) return;
  shoot('rod', 980, .55, 1, .16, -10); S.cast = .2;
  sfx('slash');
}
// giữ J: Vạn Tượng Thiên Dẫn — hút về phía mình: quái và quái bay bị kéo tới rồi vỡ, sao và tim bay về tay
function banshoTenin(hold) {
  if (!spend(cost('hold'))) return;
  const b = S.ball, r = 300 + chargeK(hold) * 160, near = (x, y) => Math.hypot(x - b.x, y - b.y) < r;
  S.cast = .4; S.pull = { t: .45, r };
  sfx('pull');
  const line = (x, y) => S.pullLines.push({ x, y, t: .35 });
  for (const e of S.enemies) if (e.alive && near(e.x, e.f(e.x) - 20)) { line(e.x, e.f(e.x) - 20); killEnemy(e, '#ff9a3c'); }
  for (const f of S.flyers) if (f.alive && near(f.x, f.y)) { line(f.x, f.y); killFlyer(f); }
  for (const q of S.bullets) if (near(q.x, q.y)) q.dead = true;
  for (const q of S.tshots) if (near(q.x, q.y)) q.alive = false;
  for (const c of S.icicles) if (near(c.x, c.y)) c.dead = true;
  for (const st of S.stars) if (!st.got && near(st.x, st.y)) { line(st.x, st.y); st.x = b.x; st.y = b.y; }
  for (const h of S.hearts) if (!h.got && near(h.x, h.y)) { line(h.x, h.y); h.x = b.x; h.y = b.y; }
  if (turretAt(b.x, b.y, r - 30)) breakTurret();
  if (bossOpen()) for (const u of S.boss.units) if (!u.hidden && Math.abs(u.x - b.x) < r) {
    line(u.x, u.y - 60);
    if (damageBoss(u, 2, 'volt')) { const B = S.boss; B.stun = Math.max(B.stun, .8); B.act = null; B.sweep = null; }
  }
  S.pops.push({ x: b.x, y: b.y - 60, t: .7, text: 'Vạn Tượng Thiên Dẫn!', c: '#ffb36b' });
}
// L: Địa Bộc Thiên Tinh — lõi đen trên trời hút đất đá, quái và đạn quanh nó; boss bị giam và mất máu liên tục
function chibakuTensei() {
  if (!canAct() || S.webCd > 0 || !spend(cost('web'))) return;
  const b = S.ball, d = b.face || 1, t = kkTarget(560), p = t ? tPos(t) : { x: b.x + d * 260, y: b.y - 40 };
  S.webCd = 2.5; S.cast = .4;
  S.chibaku = { x: p.x, y: p.y - 150, t: 3, tick: 0, rocks: Array.from({ length: 14 }, (_, i) => ({ a: i * .45, rr: 60 + (i % 4) * 22, s: 6 + (i % 3) * 4 })) };
  sfx('chibaku');
  S.pops.push({ x: b.x, y: b.y - 60, t: .8, text: 'Địa Bộc Thiên Tinh!', c: '#ffb36b' });
}
// U: Shinra Tensei toàn lực (cần đầy chakra)
function shinraTensei() {
  if (!canAct()) return;
  if (S.energy < COST.volt) {
    S.pops.push({ x: S.ball.x, y: S.ball.y - 50, t: .8, text: `Shinra Tensei cần đầy chakra (${Math.floor(S.energy)}/100)`, c: '#fff27a' });
    sfx('deny'); return;
  }
  const b = S.ball;
  S.energy = 0; S.flash = .7; S.cast = 1;
  S.power = Math.max(S.power, 1.2);
  S.shinra = { x: b.x, y: b.y - 10, t: 0, dur: .9, R: 540, hitBoss: false, crater: null };
  sfx('shinra');
  S.pops.push({ x: b.x, y: b.y - 90, t: 1.4, text: 'Shinra Tensei!', c: '#ffffff' });
}
// mặt đất bị khoét theo hố của Shinra Tensei; không đào trong đấu trường boss
function shinraTerrain(sh, r) {
  const inArena = sh.x > ARENA.gateX - 60 && sh.x < ARENA.r + 80;
  const gy = groundYAt(sh.x), cr = sh.x < ARENA.gateX ? Math.min(r, ARENA.gateX - 60 - sh.x) : r;
  if (!inArena && gy != null && cr > 30 && Math.abs(gy - sh.y) < r) {
    if (!sh.crater) { sh.crater = { x: sh.x, r: 1, d: 0 }; CRATERS.push(sh.crater); }
    sh.crater.r = cr * .62; sh.crater.d = 170 * r / sh.R;
    reshapeGround(sh.x - cr, sh.x + cr);
  }
  // bục bị thổi tung (tự hồi lại sau 6 giây)
  for (const s of SOLIDS) {
    if (s.kind !== 'plat' || s.fixed || s.broken) continue;
    const cx = clamp(sh.x, s.minX, s.maxX), cy = clamp(sh.y, s.minY, s.minY + 26);
    if (Math.hypot(cx - sh.x, cy - sh.y) < r) {
      s.broken = S.t + 6;
      for (let i = 0; i < 14; i++) {
        const a = Math.atan2(cy - sh.y, cx - sh.x) + (Math.random() - .5), sp = 300 + Math.random() * 400;
        S.parts.push({ x: s.minX + Math.random() * (s.maxX - s.minX), y: s.minY + 10, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, life: 1, c: i % 2 ? THEMES[MAP].dirt : THEMES[MAP].grass[0], r: 5 + Math.random() * 7 });
      }
    }
  }
  for (const sp of SPIKES) if (!S.spikeGone.has(sp) && sp.x1 > sh.x - r && sp.x0 < sh.x + r && Math.abs(sp.f((sp.x0 + sp.x1) / 2) - sh.y) < r) S.spikeGone.add(sp);
}
function updatePain(dt) {
  if (S.pull && (S.pull.t -= dt) <= 0) S.pull = null;
  for (const l of S.pullLines) l.t -= dt;
  S.pullLines = S.pullLines.filter(l => l.t > 0);
  // bục bị phá hồi lại khi không có ai đứng chỗ đó
  for (const s of SOLIDS) if (s.broken && S.t > s.broken) {
    const b = S.ball;
    if (b.x + R > s.minX && b.x - R < s.maxX && b.y + R > s.minY && b.y - R < s.minY + 26) s.broken = S.t + .5;
    else s.broken = 0;
  }
  const C = S.chibaku;
  if (C) {
    C.t -= dt; C.tick -= dt;
    for (const k of C.rocks) k.a += dt * (1.5 + k.rr / 120);
    const near = (x, y, r) => Math.hypot(x - C.x, y - C.y) < r;
    for (const e of S.enemies) if (e.alive && near(e.x, e.f(e.x) - 20, 240)) killEnemy(e, '#6b5a4a');
    for (const f of S.flyers) if (f.alive && near(f.x, f.y, 240)) killFlyer(f);
    for (const q of S.bullets) if (near(q.x, q.y, 240)) q.dead = true;
    for (const q of S.tshots) if (near(q.x, q.y, 240)) q.alive = false;
    for (const c of S.icicles) if (near(c.x, c.y, 240)) c.dead = true;
    if (turretAt(C.x, C.y + 150, 120)) breakTurret();
    if (bossOpen()) {
      const B = S.boss;
      for (const u of B.units) if (!u.hidden && Math.abs(u.x - C.x) < 260) {
        if (!(B.ts > 0)) { B.stun = Math.max(B.stun, .3); B.act = null; B.sweep = null; }
        if (C.tick <= 0) { C.tick = .5; damageBoss(u, 1, 'volt'); }
      }
    }
    if (Math.random() < dt * 20) {
      const a = Math.random() * Math.PI * 2;
      S.parts.push({ x: C.x + Math.cos(a) * 200, y: C.y + Math.sin(a) * 200, vx: -Math.cos(a) * 260, vy: -Math.sin(a) * 260, life: .7, c: '#6b5a4a', r: 4 + Math.random() * 4, g: 0 });
    }
    if (C.t <= 0) {
      for (let i = 0; i < 30; i++) { const a = Math.random() * Math.PI * 2, sp = 100 + Math.random() * 300; S.parts.push({ x: C.x, y: C.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: .9, c: i % 2 ? '#6b5a4a' : '#2a2430', r: 5 + Math.random() * 6 }); }
      S.chibaku = null;
    }
  }
  const sh = S.shinra;
  if (sh) {
    sh.t += dt;
    const k = Math.min(1, sh.t / sh.dur), r = sh.R * (1 - (1 - k) ** 3);
    sh.r = r;
    const near = (x, y) => Math.hypot(x - sh.x, y - sh.y) < r;
    for (const e of S.enemies) if (e.alive && near(e.x, e.f(e.x) - 20)) killEnemy(e, '#16181d');
    for (const f of S.flyers) if (f.alive && near(f.x, f.y)) killFlyer(f);
    for (const q of S.bullets) if (near(q.x, q.y)) q.dead = true;
    for (const q of S.tshots) if (near(q.x, q.y)) q.alive = false;
    for (const c of S.icicles) if (near(c.x, c.y)) c.dead = true;
    const T = S.turret;
    if (T.alive && near(T.x, T.f(T.x) - 24)) breakTurret();
    if (!sh.hitBoss && bossOpen()) for (const u of S.boss.units) if (!u.hidden && Math.abs(u.x - sh.x) < r + unitW(u) / 2 && u.y - BOSS_H < sh.y + r && u.y > sh.y - r) {
      sh.hitBoss = true;
      const B = S.boss;
      if (damageBoss(u, 8, 'volt') && !B.dead && !B.cut && !B.fuse) { B.stun = Math.max(B.stun, 2); B.act = null; B.sweep = null; B.hazards = B.hazards.filter(h => h.type === 'puddle'); }
      break;
    }
    shinraTerrain(sh, r);
    // đất đá văng ra ở rìa quả cầu
    if (k < 1) for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2, x = sh.x + Math.cos(a) * r, y = sh.y + Math.sin(a) * r, gy = groundYAt(x);
      if (gy != null && y > gy - 10) S.parts.push({ x, y: gy, vx: Math.cos(a) * 420, vy: -200 - Math.random() * 300, life: 1, c: Math.random() < .5 ? THEMES[MAP].dirt : '#8a7a68', r: 5 + Math.random() * 7 });
    }
    if (sh.t >= sh.dur + .35) S.shinra = null;
  }
}
/* Goku (Dragon Ball): bay tự do, bộ chiêu cheat — Chưởng KI, Kamehameha, Thuấn Di, Lướt và Bản Năng Vô Cực */
// J: Chưởng KI — quả cầu năng lượng bắn nhanh (Bản Năng Vô Cực bắn nhanh hơn)
function kiBlast() {
  if (S.shockCd > 0 || !spend(cost('tap'))) return;
  shoot('ki', 1050, .6, 1, S.ui > 0 ? .1 : .16, -14);
  sfx('ki');
}
// giữ J: Kamehameha — tia năng lượng xanh xuyên mọi thứ, giữ càng lâu càng dài và mạnh
function kamehameha(hold) {
  if (!spend(cost('hold'))) return;
  const k = chargeK(hold), dmg = 3 + (k >= .99 ? 2 : 0), d = S.ball.face || 1;
  S.kame = { t: 0, dur: .9, d, x: S.ball.x, y: S.ball.y, len: 0, max: 640 + k * 420, w: 18 + k * 14, dmg, hitBoss: false };
  S.cast = 1.1;
  sfx('kame');
  S.pops.push({ x: S.ball.x, y: S.ball.y - 60, t: .8, text: `Kamehameha! ×${dmg}`, c: '#9fe0ff' });
}
// L: Thuấn Di — biến mất, hiện ra sát kẻ thù gần nhất rồi đấm liên hoàn 3 phát
function instantTransmission() {
  if (!canAct() || S.webCd > 0 || !spend(cost('web'))) return;
  const b = S.ball, t = kkTarget(800);
  S.webCd = .5; S.cast = .35;
  S.tele.push({ x: b.x, y: b.y, t: .35 });
  sfx('tele');
  if (!t) { b.x += (b.face || 1) * 240; b.vx = b.vy = 0; S.tele.push({ x: b.x, y: b.y, t: .35 }); return; }
  const p = tPos(t), side = b.x < p.x ? -1 : 1, half = t.kind === 'boss' ? unitW(t.ref) / 2 : 20;
  b.x = p.x + side * (half + R + 6); b.y = p.y; b.vx = b.vy = 0; b.face = -side;
  S.power = Math.max(S.power, .5);
  S.tele.push({ x: b.x, y: b.y, t: .35 });
  S.pops.push({ x: b.x, y: b.y - 60, t: .6, text: 'Thuấn Di!', c: '#ffd27a' });
  for (let i = 0; i < 3; i++) after(.08 + i * .12, () => {
    if (!tAlive(t)) return;
    const q = tPos(t);
    S.swing = SWING; boltSpark(q.x, q.y, i === 2 ? '#9fe0ff' : '#ffd27a', 10); sfx('hit');
    if (t.kind === 'boss') {
      const B = S.boss;
      if (damageBoss(t.ref, 1, 'volt') && i === 2 && !B.dead && !B.cut && !B.fuse && !(B.ts > 0)) { B.stun = Math.max(B.stun, 1); B.act = null; B.sweep = null; }
    } else if (i === 2) {
      if (t.kind === 'enemy') killEnemy(t.ref, '#f47b20');
      else if (t.kind === 'flyer') killFlyer(t.ref);
      else breakTurret();
    }
  });
}
// U: Bản Năng Vô Cực (cần đầy KI) — 25 giây tóc bạc: tự né mọi đòn, nhanh hơn, sát thương ×2; khi hoá toả sóng KI khắp màn hình
function ultraInstinct() {
  if (!canAct()) return;
  const b = S.ball;
  if (S.ui > 0) { S.pops.push({ x: b.x, y: b.y - 50, t: .8, text: `Đang Bản Năng Vô Cực (${Math.ceil(S.ui)} giây)`, c: '#dfe8ff' }); return; }
  if (S.energy < COST.volt) {
    S.pops.push({ x: b.x, y: b.y - 50, t: .8, text: `Bản Năng Vô Cực cần đầy KI (${Math.floor(S.energy)}/100)`, c: '#fff27a' });
    sfx('deny'); return;
  }
  S.energy = 0; S.ui = 25; S.flash = .9; S.cast = .8;
  S.uiBurst = { x: b.x, y: b.y - 10, t: 0 };
  sfx('ui');
  S.pops.push({ x: b.x, y: b.y - 90, t: 1.6, text: 'Bản Năng Vô Cực!', c: '#ffffff' });
  const x0 = S.cam.x - 40, x1 = S.cam.x + viewW + 40;
  S.bullets = []; S.tshots = []; S.icicles = [];
  const B = S.boss;
  B.hazards = B.hazards.filter(h => h.type === 'puddle');
  B.sweep = null;
  for (const e of S.enemies) if (e.alive && e.x > x0 && e.x < x1) killEnemy(e, '#dfe8ff');
  for (const f of S.flyers) if (f.alive && f.x > x0 && f.x < x1) killFlyer(f);
  const T = S.turret;
  if (T.alive && T.x > x0 && T.x < x1) breakTurret();
  if (bossOpen()) {
    const u = B.units[0];
    if (u.x > x0 && u.x < x1) { damageBoss(u, 6, 'volt'); if (!B.dead && !B.cut && !B.fuse) { B.stun = Math.max(B.stun, 2); B.act = null; } }
  }
}
function updateGoku(dt) {
  S.ui = Math.max(0, S.ui - dt);
  if (S.uiBurst && (S.uiBurst.t += dt) > 1) S.uiBurst = null;
  for (const p of S.tele) p.t -= dt;
  S.tele = S.tele.filter(p => p.t > 0);
  const b = S.ball;
  if (S.ui > 0 && !S.dead && Math.random() < dt * 30) {
    S.parts.push({ x: b.x + (Math.random() - .5) * 40, y: b.y + R - Math.random() * 50, vx: (Math.random() - .5) * 30, vy: -80 - Math.random() * 120, life: .6, c: Math.random() < .5 ? '#ffffff' : '#a9c4ff', r: 2 + Math.random() * 3, g: 0 });
  }
  const K = S.kame;
  if (!K) return;
  K.t += dt;
  // tia bám theo tay Goku
  K.x = b.x + K.d * 24; K.y = b.y - 16;
  K.len = Math.min(K.max, K.len + 3200 * dt);
  if (K.t <= K.dur) {
    const xa = Math.min(K.x, K.x + K.d * K.len), xb = Math.max(K.x, K.x + K.d * K.len);
    const inB = (px, py, pad) => px > xa - pad && px < xb + pad && Math.abs(py - K.y) < K.w + pad;
    for (const e of S.enemies) if (e.alive && inB(e.x, e.f(e.x) - 20, 20)) killEnemy(e, '#5fb8ff');
    for (const f of S.flyers) if (f.alive && inB(f.x, f.y, f.r)) killFlyer(f);
    for (const q of S.bullets) if (inB(q.x, q.y, 8)) q.dead = true;
    for (const q of S.tshots) if (inB(q.x, q.y, 8)) q.alive = false;
    for (const c of S.icicles) if (inB(c.x, c.y, 8)) c.dead = true;
    const T = S.turret;
    if (T.alive && inB(T.x, T.f(T.x) - 26, 26)) breakTurret();
    if (!K.hitBoss && bossOpen()) for (const u of S.boss.units) {
      const h = u.kind === 'fused' ? FH : BOSS_H;
      if (u.hidden || u.x + unitW(u) / 2 < xa || u.x - unitW(u) / 2 > xb || K.y + K.w < u.y - h || K.y - K.w > u.y) continue;
      K.hitBoss = true;
      const B = S.boss;
      if (damageBoss(u, K.dmg, 'volt') && !B.dead && !B.cut && !B.fuse && !(B.ts > 0)) { B.stun = Math.max(B.stun, 1.2); B.act = null; B.sweep = null; }
      boltSpark(u.x, K.y, '#9fe0ff', 18);
      break;
    }
  }
  if (K.t > K.dur + .25) S.kame = null;
}
function updateCharMoves(dt) {
  updateKiem(dt);
  updateGoku(dt);
  updateClover(dt);
  updatePain(dt);
  S.swing = Math.max(0, S.swing - dt);
  S.ape = Math.max(0, S.ape - dt);
  S.whistleCd = Math.max(0, S.whistleCd - dt);
  if (S.blast && (S.blast.t -= dt) <= 0) S.blast = null;
  if (S.boom > 0 && (S.boom -= dt) <= 0) { S.boom = 0; explode(); }
  S.cry = Math.max(0, S.cry - dt);
  S.amber = Math.max(0, S.amber - dt);
  S.amberCd = Math.max(0, S.amberCd - dt);
  S.resist = Math.max(0, S.resist - dt);
  if (S.maw && (S.maw.t -= dt) <= 0) S.maw = null;
  for (const c of S.columns) c.t -= dt;
  S.columns = S.columns.filter(c => c.t > 0);
  for (const w of S.waves) {
    w.x += w.vx * dt; w.life -= dt;
    w.r = Math.min(w.rMax, w.r + 120 * dt); w.h = Math.min(130, w.h + 300 * dt);
    const inW = (px, py, pad) => ((px - w.x) / (w.r + pad)) ** 2 + ((py - w.y) / (w.h + pad)) ** 2 < 1;
    for (const e of S.enemies) if (e.alive && inW(e.x, e.f(e.x) - 20, 20)) killEnemy(e, '#ffd65e');
    for (const f of S.flyers) if (f.alive && inW(f.x, f.y, f.r)) killFlyer(f);
    for (const q of S.bullets) if (inW(q.x, q.y, 8)) q.dead = true;
    for (const q of S.tshots) if (inW(q.x, q.y, 8)) q.alive = false;
    for (const c of S.icicles) if (inW(c.x, c.y, 8)) c.dead = true;
    if (turretAt(w.x, w.y, w.r)) breakTurret();
    if (!w.hitBoss) {
      const u = bossUnitAt(w.x, w.y, w.r) || bossUnitAt(w.x, w.y - w.h * .5, w.r) || bossUnitAt(w.x, w.y - w.h, w.r);
      if (u) { w.hitBoss = true; damageBoss(u, w.dmg, w.kind === 'asta' ? 'anti' : 'volt'); boltSpark(w.x, w.y - 40, w.kind === 'asta' ? '#9cff7a' : w.kind === 'yuno' ? '#9cf0b4' : '#ffd65e', 16); }
    }
  }
  S.waves = S.waves.filter(w => w.life > 0 && w.x > S.cam.x - 200 && w.x < S.cam.x + viewW + 200);
}

/* ---------- Quái bay ---------- */
function killFlyer(f) {
  f.alive = false; f.dieT = .5;
  boltSpark(f.x, f.y, f.type === 'bat' ? '#2a1636' : f.type === 'bird' ? '#7ff0ff' : '#ff6a2a', 14);
  sfx('stomp'); gainEnergy(8);
}
function summonBats() {
  for (const x of [ARENA.l + 130, ARENA.r - 130]) S.flyers.push(newFlyer({ type: 'bat', x, y: ARENA.floor - 190 }));
  S.pops.push({ x: ARENA_MID, y: ARENA.floor - 220, t: 1, text: 'Dơi xuất hiện!', c: '#c9b6ff' });
  sfx('screech');
}
function updateFlyers(dt) {
  const b = S.ball;
  for (const f of S.flyers) {
    if (!f.alive) { f.dieT = Math.max(0, f.dieT - dt); continue; }
    if (f.stun > 0) { f.stun -= dt; continue; }
    f.t += dt;
    const dx = b.x - f.x, dy = b.y - f.y;
    if (f.type === 'bat') {
      f.cd = Math.max(0, f.cd - dt);
      if (f.state === 'patrol') {
        f.x = f.ax + Math.sin(f.t * 1.6) * 90; f.y = f.ay + Math.sin(f.t * 3.2) * 14;
        if (!S.dead && f.cd === 0 && Math.abs(dx) < 210 && dy > 20 && dy < 260) {
          const d = Math.hypot(dx, dy);
          f.state = 'dive'; f.dive = .9; f.vx = dx / d * 340; f.vy = dy / d * 340;
          sfx('screech');
        }
      } else if (f.state === 'dive') {
        f.x += f.vx * dt; f.y += f.vy * dt; f.dive -= dt;
        if (f.dive <= 0 || f.y > b.y + 30) f.state = 'back';
      } else {
        const ex = f.ax + Math.sin(f.t * 1.6) * 90 - f.x, ey = f.ay - f.y, d = Math.hypot(ex, ey);
        if (d < 8) { f.state = 'patrol'; f.cd = 1.6; } else { f.x += ex / d * 200 * dt; f.y += ey / d * 200 * dt; }
      }
    } else if (f.type === 'bird') {
      f.x += f.dir * 90 * dt;
      if (f.x > f.x1) { f.x = f.x1; f.dir = -1; }
      if (f.x < f.x0) { f.x = f.x0; f.dir = 1; }
      f.y = f.ay + Math.sin(f.t * 2.5) * 8;
      if (!S.dead && Math.abs(dx) < 280) {
        f.dropT -= dt;
        if (f.dropT <= 0) { f.dropT = 2; S.icicles.push({ x: f.x, y: f.y + 16, vy: 60 }); sfx('drop'); }
      }
    } else {
      // ma lửa: lững lờ bay về phía Pikachu, xuyên qua địa hình
      if (!S.dead && Math.abs(dx) < 520) { const d = Math.hypot(dx, dy) || 1; f.x += dx / d * 55 * dt; f.y += dy / d * 55 * dt; }
      f.y += Math.sin(f.t * 3) * 10 * dt;
      f.dir = Math.sign(dx) || 1;
    }
  }
  // cột băng rơi
  for (const c of S.icicles) {
    c.vy += 1400 * dt; c.y += c.vy * dt;
    const gy = groundYAt(c.x);
    if (gy != null && c.y >= gy - 4) { c.dead = true; boltSpark(c.x, gy - 6, '#7ff0ff', 8); }
    if (c.y > DEATH_Y) c.dead = true;
  }
  S.icicles = S.icicles.filter(c => !c.dead);
  if (S.dead) return;
  for (const c of S.icicles) {
    if (Math.abs(c.x - b.x) < R && c.y + 14 > b.y - R && c.y - 14 < b.y + R) {
      if (S.power || S.safe) { c.dead = true; continue; }
      die(); return;
    }
  }
  for (const f of S.flyers) {
    if (!f.alive || Math.hypot(f.x - b.x, f.y - b.y) >= f.r + R) continue;
    if (S.power || S.ape > 0) { killFlyer(f); continue; }
    if (f.stun > 0) continue;
    if (f.type !== 'ghost' && b.vy > 0 && b.y < f.y - 6) { killFlyer(f); b.vy = -560; continue; }
    if (!S.safe) { die(); return; }
  }
}

/* ---------- Boss: Lilith (băng) → Naamah (lửa) → Hợp thể ---------- */
function newUnits() {
  if (MAP === 2) return [{ kind: 'zag', x: ARENA_MID + 160, y: ARENA.floor - 130, dir: -1, squash: 0, flash: 0, hurt: 0, mt: 0, vy: 0 }];
  return [{ kind: 'ice', x: ARENA_MID + 140, y: ARENA.floor - 150, dir: -1, squash: 0, flash: 0, hurt: 0, mt: Math.PI / 2, vy: 0 }];
}
function newBoss() {
  return {
    phase: 1, hp: PHASES[1].hp, maxHp: PHASES[1].hp, dead: false, inv: 0, stun: 0, exhaust: 0, atkT: 2.5, act: null, actN: 0,
    ts: 0, hellT: 0, laserShot: false, cut: null, fuse: null, marks: [], hazards: [], sweep: null, half: false, summoned: false, blinkT: 9,
    units: newUnits(),
  };
}
const devilName = B => MAP === 2 ? 'ZAGRED' : B.phase === 4 || B.fuse ? 'LILITH × NAAMAH' : B.units[0].kind === 'ice' ? 'LILITH' : 'NAAMAH';
function bossBar() {
  const B = S.boss, P = PHASES[B.phase];
  $('bossbar').hidden = !(S.fight || B.dead);
  $('bname').textContent = B.dead ? (MAP === 2 ? 'ZAGRED' : 'LILITH × NAAMAH') : devilName(B);
  $('bphase').textContent = B.dead ? 'Đã hạ!' : B.fuse ? 'Đang hợp thể…' : B.cut ? 'Lilith gục…' : `${P.tag} · ${Math.max(0, B.hp)}/${B.maxHp} máu`;
  $('bnote').textContent = B.dead ? 'Lăn tới cờ đích để về đích.' : B.fuse ? 'Lilith và Naamah đang hợp thể!'
    : B.cut ? 'Coi chừng sau lưng!' : (B.phase === 4 && B.half ? P.note2 : P.note);
  document.querySelector('#bossbar .pips').hidden = true;
  $('hpbar').hidden = B.dead || !!B.fuse || !!B.cut;
  $('hpfill').style.width = (Math.max(0, B.hp) / B.maxHp * 100) + '%';
}
const devilColors = u => u.kind === 'ice' ? ['#7ff0ff', '#d8fbff', '#0f2430'] : u.kind === 'zag' ? ['#b04cff', '#e6c8ff', '#14081c'] : ['#ff2f5c', '#ffa0b4', '#1c0c12'];
const arenaLo = w => ARENA.l + w / 2 + 40, arenaHi = w => ARENA.r - w / 2 - 10;
const unitW = u => u.kind === 'fused' ? FW : BOSS_W;

function updateBoss(dt) {
  const B = S.boss, b = S.ball;
  updateBullets(dt, B.ts > 0);
  if (B.dead) return;
  for (const u of B.units) { u.squash = Math.max(0, u.squash - dt); u.flash = Math.max(0, u.flash - dt); u.hurt = Math.max(0, u.hurt - dt); }
  if (!S.fight) {
    if (!S.dead && b.x > ARENA.l + 30) { S.fight = true; S.gateClosed = true; B.atkT = 2.5; bossBar(); }
    return;
  }
  if (B.cut) { updateCut(B, b, dt); return; }
  if (B.fuse) { updateFuse(B, b, dt); return; }
  B.inv = Math.max(0, B.inv - dt);
  updateHazards(B, b, dt);
  if (B.phase === 4) updateMarks(B, b, dt);
  const P = PHASES[B.phase];
  if (B.stun > 0) {
    B.stun -= dt; settleUnits(B, dt);
    if (!S.dead) bossContact(B, b, false);
    return;
  }
  // phong ấn (hell mode)
  if (P.seal) {
    if (B.ts > 0) {
      B.ts -= dt;
      if (B.ts <= LASER_AT && !B.laserShot) B.laserShot = true;
      if (B.ts <= 0) { B.ts = 0; B.hellT = 0; S.tsEsc = false; tsBanner(); }
    } else if (!B.act && !B.exhaust && !S.dead) {
      B.hellT += dt;
      if (B.hellT >= P.seal) startSeal(B, b);
    }
  }
  if (B.ts > 0) { settleUnits(B, dt); if (!S.dead) bossContact(B, b, true); return; }
  if (B.exhaust > 0) { B.exhaust = Math.max(0, B.exhaust - dt); settleUnits(B, dt); }
  else if (B.act) runAction(B, b, dt);
  else {
    moveUnits(B, b, dt);
    B.atkT -= dt;
    if (B.atkT <= 0 && !S.dead) startAction(B, b);
  }
  if (S.dead) return;
  bossContact(B, b, false);
}
function startSeal(B, b) {
  B.ts = TS_DUR; B.laserShot = false; S.tsEsc = false;
  for (const u of B.units) u.dir = Math.sign(b.x - u.x) || u.dir;
  Object.assign(b, { vx: 0, vy: 0 });
  S.dash = null;
  tsBanner();
}
// Đứng yên (kiệt sức, choáng, phong ấn): Lilith hạ xuống đất, Naamah rơi về mặt đất
function settleUnits(B, dt) {
  for (const u of B.units) {
    if (u.kind === 'ice' || u.kind === 'zag') u.y = Math.min(ARENA.floor, u.y + 420 * dt);
    else if (u.kind === 'fire') { if (u.y < ARENA.floor) { u.vy += 1900 * dt; u.y = Math.min(ARENA.floor, u.y + u.vy * dt); } else u.vy = 0; }
    else u.y = ARENA.floor - 12 + Math.sin(S.t * 2) * 6;
  }
}
function moveUnits(B, b, dt) {
  for (const u of B.units) {
    const lo = arenaLo(unitW(u)), hi = arenaHi(unitW(u));
    if (u.kind === 'ice') {
      // Lilith bay theo hình số 8; thỉnh thoảng dịch chuyển qua gương băng sang phía bên kia
      u.mt += dt * .55;
      const tx = ARENA_MID + 230 * Math.sin(u.mt), ty = ARENA.floor - 150 + 36 * Math.sin(u.mt * 2);
      u.x += (tx - u.x) * Math.min(1, dt * 4); u.y += (ty - u.y) * Math.min(1, dt * 3);
      u.dir = Math.cos(u.mt) >= 0 ? 1 : -1;
      B.blinkT -= dt;
      if (B.blinkT <= 0) {
        B.blinkT = 9;
        boltSpark(u.x, u.y - 60, '#7ff0ff', 16);
        u.mt += Math.PI; u.x = ARENA_MID + 230 * Math.sin(u.mt);
        boltSpark(u.x, u.y - 60, '#d8fbff', 16);
      }
    } else if (u.kind === 'zag') {
      // Zagred lơ lửng đối diện bạn, thỉnh thoảng dịch chuyển sang phía bên kia
      u.mt += dt;
      const side = b.x < ARENA_MID ? 1 : -1;
      const tx = clamp(b.x + side * 230, lo, hi), ty = ARENA.floor - 130 + Math.sin(u.mt * 2) * 18;
      u.x += (tx - u.x) * Math.min(1, dt * 1.4); u.y += (ty - u.y) * Math.min(1, dt * 3);
      u.dir = Math.sign(b.x - u.x) || u.dir;
      B.blinkT -= dt;
      if (B.blinkT <= 0) {
        B.blinkT = 6.5;
        boltSpark(u.x, u.y - 60, '#b04cff', 18);
        u.x = clamp(b.x - side * 230, lo, hi);
        boltSpark(u.x, u.y - 60, '#e6c8ff', 18);
      }
    } else if (u.kind === 'fire') {
      settleUnits(B, dt);
      u.x += u.dir * 80 * dt;
      if (u.x > hi) { u.x = hi; u.dir = -1; }
      if (u.x < lo) { u.x = lo; u.dir = 1; }
    } else {
      u.x += u.dir * 60 * dt;
      if (u.x > hi) { u.x = hi; u.dir = -1; }
      if (u.x < lo) { u.x = lo; u.dir = 1; }
      u.y = ARENA.floor - 12 + Math.sin(S.t * 2) * 6;
    }
  }
}
const ACT_LIST_LN = [null, ['fan', 'spikes'], ['spikes', 'fan', 'puddle', 'fan'], ['dash', 'lob', 'slam', 'pillar'], ['dual']];
const ACT_LIST_Z = [null, ['xuyen', 'orbs', 'nghien', 'orbs'], ['rain', 'xuyen', 'sweep', 'nghien', 'orbs']];
let ACT_LIST = ACT_LIST_LN;
function startAction(B, b) {
  const list = B.phase === 4 && B.half ? ['dual', 'sweep'] : ACT_LIST[B.phase];
  const type = list[B.actN++ % list.length];
  const u = B.units[0];
  u.dir = Math.sign(b.x - u.x) || u.dir;
  B.act = { type, t: 0 };
  if (type === 'dash') B.act.dir = u.dir;
  if (u.kind === 'zag') { S.pops.push({ x: u.x, y: u.y - BOSS_H - 30, t: 1, text: ZAG_WORDS[type] || '', c: '#e6c8ff' }); sfx('screech'); }
  B.atkT = PHASES[B.phase].every;
}
function endAction(B) {
  const a = B.act;
  B.act = null; B.sweep = null;
  if (a && a.type === 'dual') dropMarks(B, B.units[0]);
  B.exhaust = EXHAUST;
}
function aimedFan(sx, sy, kind, speed = 360, n = 3) {
  const b = S.ball, ang = Math.atan2(b.y - sy, b.x - sx);
  for (let i = 0; i < n; i++) {
    const k = i - (n - 1) / 2;
    const a = ang + k * .22;
    S.bullets.push({ x: sx, y: sy, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, kind, r: 7 });
  }
}
function lobFire(sx, sy, tx, T = .9) {
  const g = 1200, ty = ARENA.floor - 8;
  S.bullets.push({ x: sx, y: sy, vx: (tx - sx) / T, vy: (ty - sy - .5 * g * T * T) / T, g, kind: 'fireball', r: 9 });
}
function addHazard(type, x, extra) {
  const base = { spike: { w: 56, h: 74, warn: .8, t: .5 }, pillar: { w: 50, h: 150, warn: .8, t: .55 }, puddle: { w: 190, h: 0, warn: 0, t: 5 },
    trail: { w: 40, h: 24, warn: 0, t: 2 }, fire: { w: 44, h: 26, warn: 0, t: 1 }, wave: { w: 26, h: 32, warn: 0, t: 2.2 } }[type];
  S.boss.hazards.push({ type, x: clamp(x, ARENA.l + 30, ARENA.r - 20), ...base, ...extra });
}
function runAction(B, b, dt) {
  const a = B.act, u = B.units[0], prevT = a.t;
  a.t += dt;
  const at = t => prevT < t && a.t >= t;   // đúng mốc thời gian t trong khung này
  const lo = arenaLo(unitW(u)), hi = arenaHi(unitW(u));
  const W = ACT_WARN[a.type];
  if (u.kind === 'ice' || u.kind === 'zag') settleHover(u, dt);
  switch (a.type) {
    case 'xuyen':
      // “Xuyên!”: gai bóng tối trồi lên đúng chỗ bạn đứng, 4 lần liên tiếp
      for (const t of [W, W + .3, W + .6, W + .9]) if (at(t)) addHazard('spike', b.x, { dark: true, w: 64, h: 90 });
      if (a.t >= W + 1.2) endAction(B);
      break;
    case 'orbs':
      // quạt 5 cầu tối, 3 loạt
      if (at(W) || at(W + .35) || at(W + .7)) { aimedFan(u.x + u.dir * 20, u.y - 80, 'dark', 380, 5); u.flash = .1; }
      if (a.t >= W + .9) endAction(B);
      break;
    case 'nghien':
      // “Nghiền!”: cột bóng tối đè xuống chỗ bạn, rồi thêm hai cột hai bên
      if (at(W)) addHazard('pillar', b.x, { dark: true, w: 90, h: 340 });
      if (at(W + .5)) for (const o of [-180, 180]) addHazard('pillar', b.x + o, { dark: true, w: 90, h: 340 });
      if (a.t >= W + 1.5) endAction(B);
      break;
    case 'rain':
      // “Rơi!”: mưa thiên thạch tối khắp đấu trường, rơi xuống thành lửa tím
      a.n = a.n || 0;
      while (a.n < 11 && a.t >= W + a.n * .12) {
        S.bullets.push({ x: ARENA.l + 60 + Math.random() * (ARENA.r - ARENA.l - 100), y: ARENA.floor - 520, vx: 0, vy: 120, g: 900, kind: 'dark', r: 10 });
        a.n++;
      }
      if (a.t >= W + 1.7) endAction(B);
      break;
    case 'fan':
      if (at(W) || at(W + .55)) { aimedFan(u.x + u.dir * 20, u.y - 70, 'ice'); u.flash = .1; }
      if (a.t >= W + .8) endAction(B);
      break;
    case 'spikes':
      for (const t of [W, W + .35, W + .7]) if (at(t)) addHazard('spike', b.x);
      if (a.t >= W + 1) endAction(B);
      break;
    case 'puddle':
      if (at(W)) addHazard('puddle', b.x);
      if (a.t >= W + .4) endAction(B);
      break;
    case 'dash':
      if (a.t >= W) {
        u.x += a.dir * 720 * dt;
        if (a.lastTrail === undefined || Math.abs(u.x - a.lastTrail) >= 36) { addHazard('trail', u.x); a.lastTrail = u.x; }
        if (u.x <= lo || u.x >= hi) { u.x = clamp(u.x, lo, hi); u.dir = -a.dir; endAction(B); }
      }
      break;
    case 'slam':
      if (a.t >= W && !a.jumped) { a.jumped = true; u.vy = -950; a.tx = clamp(b.x, lo, hi); }
      if (a.jumped && !a.landed) {
        u.x += Math.sign(a.tx - u.x) * Math.min(Math.abs(a.tx - u.x), 320 * dt);
        u.vy += 1900 * dt; u.y += u.vy * dt;
        if (u.y >= ARENA.floor && u.vy > 0) {
          u.y = ARENA.floor; u.vy = 0; a.landed = a.t;
          addHazard('wave', u.x - 40, { vx: -400 }); addHazard('wave', u.x + 40, { vx: 400 });
          sfx('stomp');
        }
      }
      if (a.landed && a.t >= a.landed + .25) endAction(B);
      break;
    case 'lob':
      [W, W + .25, W + .5].forEach((t, i) => { if (at(t)) { lobFire(u.x + u.dir * 20, u.y - 80, b.x + (i - 1) * 70); u.flash = .1; } });
      if (a.t >= W + .8) endAction(B);
      break;
    case 'pillar':
      if (at(W)) for (const o of [-130, 0, 130]) addHazard('pillar', b.x + o);
      if (a.t >= W + 1.1) endAction(B);
      break;
    case 'dual':
      // nửa băng bắn quạt mũi băng, nửa lửa ném cầu lửa cùng lúc
      if (at(W) || at(W + .4)) {
        aimedFan(u.x - 30, u.y - 100, 'ice', 340);
        lobFire(u.x + 30, u.y - 110, b.x - 50); lobFire(u.x + 30, u.y - 110, b.x + 50);
        u.flash = .1;
      }
      if (a.t >= W + .9) endAction(B);
      break;
    case 'sweep':
      if (!a.started) {
        a.started = true;
        const dir = b.x < ARENA_MID ? -1 : 1;     // bắt đầu từ phía xa Pikachu rồi quét về phía Pikachu
        B.sweep = { x: dir < 0 ? ARENA.r - 20 : ARENA.l + 20, dir, warn: W };
      }
      if (!B.sweep || B.sweep.x < ARENA.l - 10 || B.sweep.x > ARENA.r + 10) endAction(B);
      break;
  }
}
// Lilith đứng yên tại chỗ khi ra chiêu (vẫn lơ lửng)
function settleHover(u, dt) { u.y += Math.sin(S.t * 3) * 8 * dt; }
function updateBullets(dt, frozen) {
  if (!frozen) for (const q of S.bullets) {
    if (q.g) q.vy += q.g * dt;
    q.x += q.vx * dt; q.y += (q.vy || 0) * dt;
    if (q.g && q.y >= ARENA.floor - 6) { q.dead = true; addHazard('fire', q.x, q.kind === 'dark' ? { dark: true } : undefined); }
  }
  S.bullets = S.bullets.filter(q => !q.dead && q.x > ARENA.gateX && q.x < ARENA.r && q.y > ARENA.floor - 820 && q.y < ARENA.floor + 4);
}
function updateHazards(B, b, dt) {
  for (const h of B.hazards) {
    if (h.warn > 0) { h.warn -= dt; continue; }
    h.t -= dt;
    if (h.vx) h.x += h.vx * dt;
  }
  B.hazards = B.hazards.filter(h => h.t > 0 && h.x > ARENA.gateX && h.x < ARENA.r);
  S.slick = false;
  const W = B.sweep;
  if (W) { if (W.warn > 0) W.warn -= dt; else W.x += W.dir * SWEEP_SPEED * dt; }
  if (S.dead) return;
  for (const h of B.hazards) {
    if (h.warn > 0) continue;
    const inX = Math.abs(b.x - h.x) < h.w / 2 + R * .6;
    if (h.type === 'puddle') { if (inX && b.y > ARENA.floor - 70) S.slick = true; continue; }
    if (inX && b.y + R * .8 > ARENA.floor - h.h) { if (S.power || S.safe) continue; die(); return; }
  }
  if (W && W.warn <= 0 && !S.power && !S.safe && Math.abs(b.x - W.x) < 20 + R * .6 && b.y + R * .8 > ARENA.floor - SWEEP_H) die();
}
const laserOn = B => B.ts > 0 && B.ts <= LASER_AT && B.ts > LASER_AT - LASER_DUR;
function laserSpan(u) {
  return u.dir > 0 ? [u.x + BOSS_W / 2, ARENA.r] : [ARENA.gateX + 30, u.x - BOSS_W / 2];
}
function bossContact(B, b, stopped) {
  // Laze khi phong ấn: chỉ né được bằng cách nhảy (Lao điện không chặn được)
  if (laserOn(B) && !S.safe) {
    for (const u of B.units) {
      const [lo, hi] = laserSpan(u);
      if (b.x + R > lo && b.x - R < hi && b.y + R * .8 > ARENA.floor - LASER_H) { die(); return; }
    }
  }
  for (const q of S.bullets) {
    if (Math.hypot(q.x - b.x, q.y - b.y) < R + (q.r || 6)) {
      if (S.power || S.safe) { q.dead = true; continue; }
      die(); return;
    }
  }
  for (const u of B.units) {
    if (u.hidden) continue;
    const fused = u.kind === 'fused', w = fused ? FW : BOSS_W, h = fused ? FH : BOSS_H, top = u.y - h;
    const nx = clamp(b.x, u.x - w / 2, u.x + w / 2), ny = clamp(b.y, top, u.y);
    if ((b.x - nx) ** 2 + (b.y - ny) ** 2 >= R * R) continue;
    const side = Math.sign(b.x - u.x) || 1;
    if (S.power > 0) {
      // Lao điện đâm trúng
      if (!stopped) damageBoss(u, 2, 'tackle');
      b.x = u.x + side * (w / 2 + R + 1); b.vx = side * 300; b.vy = -340; S.dash = null;
      return;
    }
    if (b.vy > 0 && b.y < top + 10 && (!fused || B.exhaust > 0)) {
      // giẫm từ trên xuống
      b.y = top - R; b.vy = -700; b.squash = .25; b.vx = side * 280;
      if (!stopped) damageBoss(u, 2, 'stomp');
      return;
    }
    if (B.stun > 0 || S.safe || B.inv > .2) { b.x = u.x + side * (w / 2 + R + 1); b.vx = side * 380; b.vy = -320; return; }
    die(); return;
  }
}
function bossVulnerable(B, kind) {
  if (B.dead || B.cut || B.fuse || B.ts > 0) return false;
  if (B.phase === 4) return !!CH().pierce || kind === 'volt' || kind === 'anti' || S.power > 0 || B.exhaust > 0;
  return true;
}
function damageBoss(u, base, kind) {
  const B = S.boss;
  if (B.inv > 0 && kind !== 'volt') return false;
  const h = u.kind === 'fused' ? FH : BOSS_H;
  if (!bossVulnerable(B, kind)) {
    boltSpark(u.x, u.y - h / 2, '#c9b6ff', 8);
    if (B.phase === 4) S.pops.push({ x: u.x, y: u.y - h - 10, t: .6, text: 'Khiên! Cần Lao điện', c: '#c9d1db' });
    return false;
  }
  const tired = B.exhaust > 0;
  let dmg = base * (tired ? 2 : 1) * CH().dmgK * (S.ape > 0 || S.black > 0 || S.ui > 0 ? 2 : 1);
  if (B.phase === 4 && S.traces > 0 && kind !== 'volt') { dmg *= 2; S.traces--; }
  B.hp -= dmg;
  B.inv = kind === 'stomp' || kind === 'tackle' ? .45 : .1;
  u.hurt = .3; u.squash = .15;
  gainEnergy(5);
  sfx(kind === 'stomp' ? 'stomp' : 'hit');
  S.pops.push({ x: u.x, y: u.y - h - 10, t: .8, text: `-${dmg}${tired ? ' kiệt sức!' : ''}`, c: dmg > 2 ? '#ffc21a' : '#ffffff' });
  const [c1, c2] = devilColors(u.kind === 'fused' ? { kind: Math.random() < .5 ? 'ice' : 'fire' } : u);
  for (let i = 0; i < 14; i++) {
    const a = -Math.PI * Math.random(), sp = 150 + Math.random() * 250;
    S.parts.push({ x: u.x, y: u.y - h, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: .6, c: i % 2 ? c1 : c2, r: 4 + Math.random() * 4 });
  }
  if (B.hp <= 0) bossDown(B, u);
  else {
    if (MAP === 1 && B.phase === 1 && B.hp <= PHASES[1].hp / 2) enterHell(B, u);
    if (MAP === 2 && B.phase === 2 && B.hp <= PHASES[2].hp / 2 && !B.summoned) { B.summoned = true; S.bossKills = Math.max(S.bossKills, 2); summonBats(); }
    if (B.phase === 3 && B.hp <= 6 && !B.summoned) { B.summoned = true; summonBats(); }
    if (B.phase === 4 && B.hp <= FUSED_HP / 2 && !B.half) { B.half = true; B.actN = 1; summonBats(); }
    bossBar();
  }
  return true;
}
// Zagred hết máu lần đầu: lộ hình dạng thật, máu đầy lại
function zagTransform(B, u) {
  S.bossKills = Math.max(S.bossKills, 1);
  Object.assign(B, { phase: 2, hp: PHASES[2].hp, maxHp: PHASES[2].hp, inv: 1.6, atkT: 2.2, hellT: 0, actN: 0, summoned: false, blinkT: 6.5 });
  S.flash = 1; S.safe = Math.max(S.safe, 1);
  for (let i = 0; i < 60; i++) {
    const a = Math.random() * Math.PI * 2, sp = 120 + Math.random() * 420;
    S.parts.push({ x: u.x, y: u.y - 60, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, c: ['#b04cff', '#e6c8ff', '#14081c', '#ff2f5c'][i % 4], r: 5 + Math.random() * 7, g: 0 });
  }
  S.pops.push({ x: u.x, y: u.y - BOSS_H - 50, t: 1.6, text: 'Zagred: hình dạng thật!', c: '#e6c8ff' });
  sfx('roar');
}
function enterHell(B, u) {
  Object.assign(B, { phase: 2, inv: 1, hellT: 0, act: null, exhaust: 0, atkT: 1.2, sweep: null });
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2;
    S.parts.push({ x: u.x, y: u.y - 56, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320, life: .6, c: i % 2 ? '#7ff0ff' : '#5a1f6e', r: 7, g: 0 });
  }
  S.pops.push({ x: u.x, y: u.y - BOSS_H - 30, t: 1, text: 'HELL MODE!', c: '#ff4d55' });
}
function bossDown(B, u) {
  Object.assign(B, { act: null, sweep: null, hazards: [], exhaust: 0, stun: 0, ts: 0, hellT: 0 });
  S.bullets = []; S.tsEsc = false;
  if (MAP === 2) {
    if (B.phase === 1) zagTransform(B, u); else killFused(B, u);
    tsBanner(); bossBar();
    return;
  }
  if (B.phase <= 2) {
    // Lilith gục: rơi xuống đất, bắt đầu màn Naamah chui ra
    S.bossKills = Math.max(S.bossKills, 1);
    u.y = ARENA.floor;
    B.cut = { t: 0 };
  } else if (B.phase === 3) {
    // Naamah gục: hợp thể ở phía xa Pikachu
    S.bossKills = Math.max(S.bossKills, 2);
    const mx = S.ball.x < ARENA_MID ? ARENA.r - 190 : ARENA.l + 190;
    B.fuse = { t: 0, nx: u.x, mx, merged: false };
  } else killFused(B, u);
  tsBanner();
  bossBar();
}
function cutBanner(text, warn) {
  const el = $('tsBanner');
  el.hidden = !text;
  if (text) { el.textContent = text; el.dataset.esc = warn ? '1' : '0'; }
}
function updateCut(B, b, dt) {
  const C = B.cut;
  C.t += dt;
  const lo = arenaLo(BOSS_W), hi = arenaHi(BOSS_W);
  if (C.t >= CUT.burst && !C.burst) {
    // Lilith vỡ tung, Naamah chui ra từ chính chỗ đó
    C.burst = true;
    const L = B.units[0];
    for (let i = 0; i < 50; i++) {
      const a = Math.random() * Math.PI * 2, sp = 100 + Math.random() * 420;
      S.parts.push({ x: L.x, y: ARENA.floor - 60, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 200, life: 1, c: ['#7ff0ff', '#d8fbff', '#0f2430', '#ff2f5c'][i % 4], r: 4 + Math.random() * 6 });
    }
    B.units = [{ kind: 'fire', x: L.x, y: ARENA.floor, vy: 0, dir: L.dir, squash: 0, flash: 0, hurt: 0, emerge: 0 }];
    bossBar();
  }
  const N = B.units[0];
  if (C.burst) N.emerge = clamp((C.t - CUT.burst) / CUT.emerge, 0, 1);
  if (C.t >= CUT.vanish && !C.vanish) {
    C.vanish = true; N.hidden = true;
    smoke(N.x, ARENA.floor - 50);
  }
  if (C.t >= CUT.appear && !C.appear) {
    // hiện ra sau lưng Pikachu (phía ngược hướng đang chạy)
    C.appear = true; N.hidden = false;
    let x = b.x - S.lastDir * 90;
    if (x < lo || x > hi) x = b.x + S.lastDir * 90;
    N.x = clamp(x, lo, hi);
    N.dir = Math.sign(b.x - N.x) || 1;
    smoke(N.x, ARENA.floor - 50);
  }
  if (C.appear && !C.struck) {
    const safeNow = S.power > 0 || C.blocked;
    const ui = CHAR_UI[CHAR];
    cutBanner(safeNow ? `Đã ${ui.btn.skill[1]}: sẽ chặn được đòn!`
      : S.energy < cost('tackle') ? `Không đủ ${ui.energy.toLowerCase()} (${Math.floor(S.energy)}/${cost('tackle')}): không thể chặn!`
      : S.cd > 0 ? `${ui.btn.skill[1]} đang hồi…`
      : `Naamah sau lưng! Nhấn Shift (${ui.btn.skill[1]}) để chặn!`, !safeNow);
  }
  if (C.t >= CUT.strike && !C.struck) {
    C.struck = true;
    cutBanner('');
    if (S.power > 0 || C.blocked) {
      for (let i = 0; i < 20; i++) {
        const a = Math.random() * Math.PI * 2;
        S.parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, life: .5, c: i % 2 ? '#ffc21a' : '#ffffff', r: 5, g: 0 });
      }
      b.vx = N.dir * 420; b.vy = -420;
    } else die();
  }
  if (C.t >= CUT.end) {
    B.cut = null; delete N.emerge;
    Object.assign(B, { phase: 3, hp: PHASES[3].hp, maxHp: PHASES[3].hp, inv: 1.2, atkT: 2, hellT: 0, act: null, exhaust: 0, actN: 0, summoned: false });
    bossBar();
  }
}
function smoke(x, y) {
  for (let i = 0; i < 22; i++) {
    const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 160;
    S.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: .6, c: i % 3 ? '#3a1a24' : '#ff2f5c', r: 8 + Math.random() * 8, g: -100 });
  }
}
function updateFuse(B, b, dt) {
  const F = B.fuse;
  F.t += dt;
  if (F.t >= FUSE.merge && !F.merged) {
    F.merged = true;
    for (let i = 0; i < 80; i++) {
      const a = Math.random() * Math.PI * 2, sp = 120 + Math.random() * 480;
      S.parts.push({ x: F.mx, y: ARENA.floor - 80, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 150, life: 1.1, c: ['#7ff0ff', '#ff2f5c', '#ffffff', '#d8fbff', '#ffa0b4'][i % 5], r: 5 + Math.random() * 7 });
    }
    S.flash = 1;
    B.units = [{ kind: 'fused', x: F.mx, y: ARENA.floor - 12, vy: 0, dir: Math.sign(b.x - F.mx) || -1, squash: 0, flash: 0, hurt: 0, grow: 0 }];
  }
  if (F.merged) B.units[0].grow = clamp((F.t - FUSE.merge) / (FUSE.end - FUSE.merge), 0, 1);
  if (F.t >= FUSE.end) {
    B.fuse = null; delete B.units[0].grow;
    Object.assign(B, { phase: 4, hp: FUSED_HP, maxHp: FUSED_HP, inv: 0, atkT: 2.5, act: null, exhaust: 0, actN: 0, half: false, marks: [] });
    S.safe = Math.max(S.safe, 1);
    bossBar();
  }
}
// Vết tích rơi ra sau mỗi đợt tấn công của boss hợp thể: một mảnh băng, một tàn lửa
function dropMarks(B, u) {
  const lo = ARENA.l + 50, hi = ARENA.r - 40;
  for (const kind of ['ice', 'fire']) {
    let x, n = 0;
    do {
      x = kind === 'ice' ? lo + Math.random() * (u.x - 120 - lo) : u.x + 120 + Math.random() * (hi - u.x - 120);
    } while ((x < lo || x > hi) && n++ < 10);
    if (x < lo || x > hi) x = lo + Math.random() * (hi - lo);
    B.marks.push({ x, kind, life: 9 });
  }
}
function updateMarks(B, b, dt) {
  for (const m of B.marks) m.life -= dt;
  B.marks = B.marks.filter(m => m.life > 0);
  if (S.dead) return;
  const gy = ARENA.floor;
  for (const m of B.marks) {
    if (Math.hypot(m.x - b.x, (gy - 18) - b.y) < R + 16) {
      m.life = 0; S.traces = Math.min(5, S.traces + 1);
      for (let i = 0; i < 14; i++) {
        const a = i / 14 * Math.PI * 2;
        S.parts.push({ x: m.x, y: gy - 18, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, life: .4, c: m.kind === 'ice' ? '#7ff0ff' : '#ff9a1f', r: 4, g: 0 });
      }
    }
  }
}
function killFused(B, u) {
  B.dead = true; S.gateClosed = false; S.bullets = []; B.marks = []; B.hazards = []; B.sweep = null; S.flash = .8;
  S.bossKills = 3;
  for (let i = 0; i < 120; i++) {
    const a = Math.random() * Math.PI * 2, sp = 100 + Math.random() * 600;
    S.parts.push({ x: u.x, y: ARENA.floor - 80, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 250, life: 1.4, c: ['#7ff0ff', '#ff2f5c', '#0f2430', '#1c0c12', '#ffffff'][i % 5], r: 5 + Math.random() * 9 });
  }
  bossBar();
}
function tsBanner() {
  const B = S.boss, on = B.ts > 0 && !S.dead;
  $('tsBanner').hidden = !on;
  if (on) $('tsBanner').textContent = S.tsEsc ? 'Nhảy lên để né laze!' : MAP === 2 ? 'Zagred: “Đứng yên!” Nhấn Shift để thoát' : 'Bị phong ấn! Nhấn Shift để thoát';
  $('tsBanner').dataset.esc = S.tsEsc ? '1' : '0';
}
function lose(reason) {
  S.lost = true;
  $('tsBanner').hidden = true;
  $('loseTitle').textContent = reason === 'time' ? 'Hết giờ!' : 'Hết mạng!';
  $('loseProg').textContent = `Bạn đã đi được ${Math.round(progress() * 100)}% chặng đường`;
  $('lose').hidden = false;
  openSubmit('lose');
}
const progress = () => clamp(S.ball.x / GOAL.x, 0, 1);
function win() {
  sfx('win');
  S.won = true;
  const got = S.stars.filter(s => s.got).length;
  $('winStars').textContent = `Sao: ${got}/${S.stars.length}`;
  $('winTime').textContent = `Thời gian: ${fmt(S.time)} (còn dư ${fmt(TIME_LIMIT - S.time)})`;
  $('winDeaths').textContent = `Mạng còn lại: ${S.lives}/${LIVES}`;
  $('win').hidden = false;
  openSubmit('win');
}
/* ---------- Bảng xếp hạng ---------- */
// Dán URL ứng dụng web Apps Script (xem server/leaderboard.gs) vào đây để mọi người dùng chung một bảng.
// Để trống thì bảng chỉ lưu trên máy đang chơi.
const LEADERBOARD_URL = '';
const LB_KEY = 'bongdo.board', NAME_KEY = 'bongdo.name', BOARD_OPEN_KEY = 'bongdo.boardOpen';
let lbRows = [], lbState = 'loading', lbAt = null;
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
// Xếp hạng: nhiều boss hơn > đi xa hơn > nhanh hơn
const rankCmp = (a, b) => b.bosses - a.bosses || b.progress - a.progress || a.seconds - b.seconds;
function cleanRow(r) {
  if (!r || typeof r.name !== 'string') return null;
  const n = (v, lo, hi) => clamp(Math.round(Number(v) || 0), lo, hi);
  return { name: r.name.trim().slice(0, 16) || 'Ẩn danh', bosses: n(r.bosses, 0, 3), seconds: n(r.seconds, 0, TIME_LIMIT), progress: n(r.progress, 0, 100), stars: n(r.stars, 0, 12) };
}
function bestPerName(rows) {
  const m = new Map();
  for (const r of rows) { const k = r.name.toLowerCase(), cur = m.get(k); if (!cur || rankCmp(r, cur) < 0) m.set(k, r); }
  return [...m.values()].sort(rankCmp);
}
const lbKey = () => MAP === 2 ? LB_KEY + '2' : LB_KEY;
function localRows() { try { return (JSON.parse(lsGet(lbKey(), '[]')) || []).map(cleanRow).filter(Boolean); } catch (e) { return []; } }
async function loadBoard() {
  if (LEADERBOARD_URL) {
    try {
      const res = await fetch(LEADERBOARD_URL + '?top=10', { cache: 'no-store' });
      const j = await res.json();
      lbRows = bestPerName((j.rows || []).map(cleanRow).filter(Boolean)).slice(0, 10);
      lbState = 'online'; lbAt = new Date();
    } catch (e) { lbState = 'error'; lbRows = bestPerName(localRows()).slice(0, 10); }
  } else { lbState = 'local'; lbRows = bestPerName(localRows()).slice(0, 10); }
  renderBoard();
}
function renderBoard() {
  const ol = $('boardList'), me = lsGet(NAME_KEY, '').toLowerCase();
  $('boardTitle').textContent = `Bảng xếp hạng · Màn ${MAP}`;
  ol.textContent = '';
  if (!lbRows.length) {
    const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'Chưa có ai. Hãy là người đầu tiên!';
    ol.appendChild(li);
  }
  lbRows.forEach((r, i) => {
    const li = document.createElement('li');
    if (me && r.name.toLowerCase() === me) li.className = 'me';
    const rank = document.createElement('span'); rank.textContent = i + 1;
    const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = r.name; nm.title = `${r.name}: ${r.bosses} boss, ${r.progress}% chặng đường`;
    const bk = document.createElement('span'); bk.className = 'bk'; bk.setAttribute('aria-label', `${r.bosses} boss`);
    for (let k = 0; k < 3; k++) { const d = document.createElement('i'); if (k < r.bosses) d.className = 'on'; bk.appendChild(d); }
    const tm = document.createElement('span'); tm.textContent = r.bosses === 3 ? fmt(r.seconds) : `${r.progress}%`;
    li.append(rank, nm, bk, tm);
    ol.appendChild(li);
  });
  $('boardStatus').textContent = lbState === 'local' ? 'Đang lưu trên máy này'
    : lbState === 'error' ? 'Không tải được bảng chung, đang hiện điểm trên máy này'
    : lbState === 'online' ? `Bảng chung · cập nhật ${String(lbAt.getHours()).padStart(2, '0')}:${String(lbAt.getMinutes()).padStart(2, '0')}`
    : 'Đang tải…';
}
function runRecord() {
  return { bosses: S.bossKills, seconds: Math.round(Math.min(S.time, TIME_LIMIT)), progress: S.won ? 100 : Math.round(progress() * 100), stars: S.stars.filter(s => s.got).length };
}
function openSubmit(k) {
  if (TEST_MODE) {
    // chế độ thử: không lưu điểm để bảng xếp hạng không lẫn kết quả thử
    $(k + 'Save').disabled = true;
    $(k + 'Sent').hidden = false;
    $(k + 'Sent').textContent = 'Chế độ thử (vô hạn mạng): không lưu điểm.';
    return;
  }
  $(k + 'Name').value = lsGet(NAME_KEY, '');
  $(k + 'Save').disabled = false;
  $(k + 'Sent').hidden = true;
  ($(k + 'Name').value ? $(k + 'Save') : $(k + 'Name')).focus();
}
async function submitScore(k) {
  if (S.submitted || TEST_MODE) return;
  const name = $(k + 'Name').value.trim().slice(0, 16) || 'Ẩn danh';
  lsSet(NAME_KEY, name);
  S.submitted = true;
  $(k + 'Save').disabled = true;
  const row = { name, ...runRecord() };
  const list = localRows(); list.push(row); lsSet(lbKey(), JSON.stringify(list.slice(-100)));
  let sentOnline = false;
  if (LEADERBOARD_URL) {
    try { await fetch(LEADERBOARD_URL, { method: 'POST', body: JSON.stringify(row) }); sentOnline = true; } catch (e) {}
  }
  await loadBoard();
  const rank = lbRows.findIndex(r => r.name.toLowerCase() === name.toLowerCase()) + 1;
  const el = $(k + 'Sent');
  el.hidden = false;
  el.textContent = (LEADERBOARD_URL && !sentOnline ? 'Không gửi được lên bảng chung, đã lưu trên máy này. ' : 'Đã lưu! ')
    + `${row.bosses}/3 boss · ${row.progress}% chặng đường` + (rank ? ` · hạng ${rank}` : '');
}
for (const k of ['win', 'lose']) {
  $(k + 'Form').addEventListener('submit', e => { e.preventDefault(); submitScore(k); });
}
$('boardToggle').addEventListener('click', () => {
  const open = $('board').hasAttribute('data-closed');
  $('board').toggleAttribute('data-closed', !open);
  $('boardToggle').setAttribute('aria-expanded', String(open));
  lsSet(BOARD_OPEN_KEY, open ? '1' : '0');
});
if (lsGet(BOARD_OPEN_KEY, matchMedia('(max-width: 640px)').matches ? '0' : '1') === '0') {
  $('board').setAttribute('data-closed', ''); $('boardToggle').setAttribute('aria-expanded', 'false');
}
loadBoard();
if (LEADERBOARD_URL) setInterval(loadBoard, 30000);

const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
let lastSec = -1, lastSkill = '';
function hud() {
  $('stars').textContent = `${S.stars.filter(s => s.got).length}/${S.stars.length}`;
  $('lives').textContent = TEST_MODE ? '♥ ∞ thử' : '♥'.repeat(Math.max(0, S.lives)) + '♡'.repeat(Math.max(0, LIVES - S.lives));
  $('time').textContent = fmt(Math.ceil(TIME_LIMIT - S.time));
}

/* ---------- Chọn nhân vật ----------
   Stelle chỉ mở được bằng mật khẩu; mở rồi thì máy đó nhớ. Mật khẩu chỉ lưu dưới dạng mã băm. */
const CHAR_KEY = 'bongdo.char';
// mật khẩu chỉ lưu dưới dạng mã băm; mở rồi thì máy đó nhớ
const LOCKS = { stelle: { hash: 2576725674, key: 'bongdo.stelle' }, saiyan: { hash: 2743617246, key: 'bongdo.saiyan' } };
let pwFor = null;   // nhân vật đang chờ nhập mật khẩu
const pwHash = s => { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; };
const unlocked = id => !LOCKS[id] || lsGet(LOCKS[id].key, '') === '1';
// short: tên ngắn của 5 chiêu (J, giữ J, L, Shift, U) cho dòng hướng dẫn
const CHAR_UI = {
  pika: { name: 'Pikachu', from: 'Pokémon', tag: 'Hệ Điện: sét, lưới điện, lao điện', energy: 'Điện năng',
    btn: { bolt: ['Sét', 'Tia sét'], web: ['Lưới', 'Lưới điện'], skill: ['⚡', 'Lao điện'], volt: ['100K', '100.000 Vôn'] },
    short: ['tia sét', 'Quả cầu điện', 'Lưới điện', 'Lao điện', '100.000 Vôn'],
    kit: [['J', 'Tia sét (5)'], ['Giữ J', 'Quả cầu điện: chạy càng nhanh càng mạnh (20)'], ['L', 'Lưới điện: trói quái và boss (30)'],
      ['Shift', 'Lao điện: vô địch khi lao (25)'], ['U', '100.000 Vôn: 3 tia sét zíc zắc phóng ngang phía trước tới mép màn hình (cần đầy)'],
      ['G', 'Dynamax: to gấp 10 lần, vĩnh viễn (bấm G lần nữa để thu nhỏ). Bộ chiêu chuyển sang hack: mọi chiêu miễn phí, nhảy 3 lần, chạy nhanh, sát thương ×2, xuyên khiên boss, điện năng nạp ×6, thân khổng lồ nghiền quái'],
      ['Z', 'Tuyệt kĩ Z Catastropika: giáng điện cả màn hình, sát thương 8 lên boss, choáng 3 giây (hồi 20 giây, Dynamax 8 giây)']],
    passive: 'Lưới điện giam quái và boss vĩnh viễn (boss chỉ thoát khi sang giai đoạn mới) · Quả cầu điện to gấp đôi (Dynamax: gấp 5).',
    more: ' · <kbd>G</kbd> Dynamax · <kbd>Z</kbd> Catastropika', moreTap: ' · Max: Dynamax · Z: Catastropika',
    tip: PIKA_TIP },
  chii: { name: 'Chiikawa', from: 'Chiikawa', tag: 'Nhỏ mà có võ: nhổ cỏ, khóc oà, gọi bạn', energy: 'Dũng khí',
    btn: { bolt: ['Gậy', 'Gõ gậy'], web: ['Khóc', 'Khóc oà'], skill: ['Lăn', 'Lăn tròn'], volt: ['Bạn', 'Gọi bạn'] },
    short: ['gõ gậy', 'ném bó cỏ', 'Khóc oà', 'Lăn tròn', 'Gọi Hachiware & Usagi'],
    kit: [['J', 'Gõ gậy: đánh tầm gần (2)'], ['Giữ J', 'Ném bó cỏ (chứng chỉ nhổ cỏ cấp 3): nảy, 2–3 sát thương (15)'],
      ['L', 'Khóc oà “Wa wa wa”: nước mắt làm choáng mọi thứ quanh mình, xoá đạn (25)'], ['Shift', 'Lăn tròn: vô địch khi lăn (20)'],
      ['U', 'Gọi Hachiware & Usagi: “Ura! Yaha!” quét sạch màn hình (cần đầy)']],
    passive: 'nhặt sao được +30 dũng khí.',
    tip: 'Chiikawa: J gõ gậy · giữ J ném bó cỏ · L khóc oà làm choáng xung quanh · Shift lăn tròn · U khi đầy: gọi Hachiware & Usagi.' },
  rimuru: { name: 'Rimuru', from: 'Chuyển sinh thành Slime', tag: 'Slime: lưỡi nước, Sét Đen, Kẻ Săn Mồi', energy: 'Ma tố',
    btn: { bolt: ['Nước', 'Lưỡi nước'], web: ['Nuốt', 'Kẻ Săn Mồi'], skill: ['Lao', 'Biến dạng'], volt: ['Mgd', 'Megiddo'] },
    short: ['Lưỡi nước', 'Sét Đen', 'Kẻ Săn Mồi', 'Biến dạng', 'Megiddo'],
    kit: [['J', 'Lưỡi nước: bắn nhanh (4)'], ['Giữ J', 'Sét Đen: giáng từ trời phía trước, giữ càng lâu càng xa và mạnh, trúng cả boss đang bay (25)'],
      ['L', 'Kẻ Săn Mồi: nuốt quái và đạn trước mặt, mỗi thứ nuốt được hồi ma tố (20)'], ['Shift', 'Biến dạng: lao tới, vô địch (20)'],
      ['U', 'Megiddo: chùm tia sáng từ trời (cần đầy)']],
    passive: 'Đại Hiền Giả chặn 1 đòn chí mạng mỗi 15 giây (trừ rơi vực) · nhảy 2 lần.',
    tip: 'Rimuru: J lưỡi nước · giữ J Sét Đen từ trời · L Kẻ Săn Mồi nuốt quái và đạn · Shift lao tới · U khi đầy: Megiddo. Nhảy được 2 lần.' },
  stelle: { name: 'Stelle', from: 'Honkai: Star Rail', tag: 'Nhà Khai Phá: bộ kĩ năng hack', energy: 'Năng lượng', locked: true,
    btn: { bolt: ['Gậy', 'Farewell Hit'], web: ['Khiên', 'Hổ Phách'], skill: ['Lao', 'Lao gậy'], volt: ['Ult', 'Stardust Ace'] },
    short: ['Farewell Hit', 'RIP Home Run', 'Hổ Phách Bất Diệt', 'Lao gậy', 'Stardust Ace'],
    kit: [['J', 'Farewell Hit: vụt gậy phóng ngôi sao (miễn phí)'], ['Giữ J', 'RIP Home Run: sóng sao xuyên mọi thứ (miễn phí)'],
      ['L', 'Hổ Phách Bất Diệt (Bảo Hộ): khiên vô địch 4 giây, hồi 5 giây'], ['Shift', 'Lao gậy: hồi 0,35 giây (miễn phí)'],
      ['U', 'Stardust Ace: mưa sao băng khắp màn hình (cần đầy, nạp siêu nhanh)']],
    passive: 'hack: nhảy 3 lần, chạy nhanh, sát thương ×2, xuyên khiên boss, năng lượng nạp ×6.',
    tip: 'Stelle (hack): J Farewell Hit · giữ J RIP Home Run · L khiên Hổ Phách · Shift lao gậy · U Stardust Ace. Nhảy 3 lần, sát thương ×2, mọi chiêu miễn phí.' },
  saiyan: { name: 'Xayda', from: 'Ngọc Rồng Online', tag: 'Hành tinh Xayda: Galick, Antomic, Biến Khỉ', energy: 'KI', locked: true,
    btn: { bolt: ['Đấm', 'Đấm Galick'], web: ['Trói', 'Trói'], skill: ['Khiên', 'Khiên năng lượng'], volt: ['Khỉ', 'Biến Khỉ'] },
    short: ['Đấm Galick', 'Antomic', 'Trói', 'Khiên năng lượng', 'Biến Khỉ'],
    more: ' · <kbd>H</kbd> (giữ) Tái tạo năng lượng · <kbd>I</kbd> Huýt sáo · <kbd>O</kbd> Tự phát nổ',
    moreTap: ' · Hồi (giữ) · Sáo · Nổ',
    kit: [['J', 'Đấm Galick: đấm tầm gần (1 KI)'], ['Giữ J', 'Antomic: chưởng năng lượng, 2–3 sát thương (15)'],
      ['L', 'Trói: trói quái và boss đứng yên (25)'], ['Shift', 'Khiên năng lượng: bất tử 3 giây, hồi 10 giây (20)'],
      ['U', 'Biến Khỉ khổng lồ 15 giây: sát thương ×2, chạm là hạ quái, chịu đòn thay mạng (cần đầy KI)'],
      ['H', 'Tái tạo năng lượng: giữ để đứng yên hồi KI thật nhanh'], ['I', 'Huýt sáo: +1 mạng, hồi 45 giây'],
      ['O', 'Tự phát nổ: tụ 1,5 giây rồi nổ tung cả vùng, 10 sát thương lên boss, mất 1 mạng (50 KI)']],
    tip: 'Xayda: J Đấm Galick · giữ J Antomic · L Trói · Shift Khiên năng lượng · U Biến Khỉ · giữ H Tái tạo năng lượng · I Huýt sáo · O Tự phát nổ.' },
  kiem: { name: 'Kiếm khách', from: 'Hải Tặc Tí Hon', tag: 'Phái Kiếm khách: skill cấp 20, đổi trang phục (cheat)', energy: 'MP',
    btn: { bolt: ['Nhất', 'Nhất kiếm'], web: ['Song', 'Song kiếm'], skill: ['Lướt', 'Lướt'], volt: ['Tam', 'Tam kiếm'] },
    short: ['Nhất kiếm', null, 'Song kiếm', 'Lướt', 'Tam kiếm'],
    kit: [['J', 'Nhất kiếm Lv20: “Đòn đánh cơ bản nhưng lại rất nguy hiểm của kiếm khách”, lưỡi liềm đỏ (miễn phí)'],
      ['L', 'Song kiếm Lv20: biến mất, hiện ra sát kẻ thù, 2 dải kiếm đỏ quấn lấy rồi chém hai nhát lửa đỏ, hồi 0,6 giây (miễn phí)'],
      ['U', 'Tam kiếm Lv20: “tạo ra những cơn lốc sát thương từ vòng xoay của thanh kiếm”: vòng xoáy đỏ, 3 cơn lốc tự lao tới kẻ thù, hồi 2 giây (miễn phí)'],
      ['Shift', 'Lướt: vô địch khi lướt, hồi 0,35 giây (miễn phí)']],
    passive: 'Song kiếm gây xuất huyết 4 giây · cheat: nhảy 3 lần, chạy nhanh, sát thương ×2, xuyên khiên boss, MP nạp ×6. Bộ skill cấp 20 (màu đỏ). Đổi tóc, phụ kiện, áo, quần ngay bên dưới.',
    tip: 'Kiếm khách (cheat): J Nhất kiếm · L Song kiếm (dịch chuyển chém 2 nhát, xuất huyết) · U Tam kiếm (3 cơn lốc) · Shift lướt. Mọi chiêu miễn phí, nhảy 3 lần, sát thương ×2.' },
  asta: { name: 'Asta', from: 'Black Clover', tag: 'Hắc Bộc Ngưu: kiếm phản ma pháp, Hắc Hoá (cheat)', energy: 'Thể lực',
    btn: { bolt: ['Kiếm', 'Kiếm Diệt Quỷ'], web: ['Lốc', 'Black Hurricane'], skill: ['Lao', 'Bull Thrust'], volt: ['Hắc', 'Hắc Hoá: Black Meteorite'] },
    short: ['Kiếm Diệt Quỷ', 'Phản Hồi Ma Pháp', 'Black Hurricane', 'Bull Thrust', 'Hắc Hoá'],
    kit: [['J', 'Kiếm Diệt Quỷ: chém tầm gần, chém đứt cả đạn phép (miễn phí)'], ['Giữ J', 'Kiếm Trú Quỷ: Phản Hồi Ma Pháp, sóng chém đen xuyên mọi thứ, 2–3 sát thương (miễn phí)'],
      ['L', 'Black Hurricane: xoay kiếm thành lốc đen quanh người, làm choáng (miễn phí)'], ['Shift', 'Bull Thrust: lao kiếm tới, vô địch (miễn phí)'],
      ['U', 'Hắc Hoá + Black Meteorite: giáng kiếm đen khắp màn hình, 20 giây Hắc Hoá chạy nhanh hơn, sát thương ×4 (cần đầy, nạp siêu nhanh)']],
    passive: 'phản ma pháp · cheat: nhảy 3 lần, chạy nhanh, sát thương ×2, xuyên khiên boss, thể lực nạp ×6.',
    tip: 'Asta: J chém Kiếm Diệt Quỷ · giữ J Phản Hồi Ma Pháp · L Black Hurricane · Shift Bull Thrust · U khi đầy: Hắc Hoá. Cheat: mọi chiêu miễn phí, nhảy 3 lần, sát thương ×2, xuyên khiên boss!' },
  yuno: { name: 'Yuno', from: 'Black Clover', tag: 'Bình Minh Vàng: ma pháp gió, tinh linh Sylph (cheat)', energy: 'Ma lực',
    btn: { bolt: ['Gió', 'Lưỡi Gió'], web: ['Lốc', 'Lốc Xoáy Chọc Trời'], skill: ['Bay', 'Phi Phong'], volt: ['Sylph', 'Spirit Storm'] },
    short: ['Lưỡi Gió', 'Trăng Khuyết Gió', 'Lốc Xoáy Chọc Trời', 'Phi Phong', 'Spirit Storm'],
    kit: [['J', 'Lưỡi Gió: bắn nhanh (miễn phí)'], ['Giữ J', 'Trăng Khuyết Gió: sóng gió hình lưỡi liềm xuyên mọi thứ, 2–3 sát thương (miễn phí)'],
      ['L', 'Lốc Xoáy Chọc Trời: cột lốc tiến tới, cuốn sạch đạn, làm choáng boss (miễn phí)'], ['Shift', 'Phi Phong: lướt gió, vô địch (miễn phí)'],
      ['U', 'Spirit Storm: tinh linh Sylph gọi bão gió khắp màn hình (cần đầy, nạp siêu nhanh)']],
    passive: 'tinh linh gió Sylph (Bell) đi theo · cheat: nhảy 3 lần, chạy nhanh, sát thương ×2, xuyên khiên boss, ma lực nạp ×6.',
    tip: 'Yuno: J Lưỡi Gió · giữ J Trăng Khuyết Gió · L Lốc Xoáy Chọc Trời · Shift Phi Phong · U khi đầy: Spirit Storm. Cheat: mọi chiêu miễn phí, nhảy 3 lần, sát thương ×2, xuyên khiên boss.' },
  pain: { name: 'Pain', from: 'Naruto', tag: 'Thiên Đạo, Luân Hồi Nhãn: Shinra Tensei (cheat)', energy: 'Chakra',
    btn: { bolt: ['Bổng', 'Hắc Bổng'], web: ['Địa', 'Địa Bộc Thiên Tinh'], skill: ['Ngạ', 'Ngạ Quỷ Đạo'], volt: ['Shinra', 'Shinra Tensei'] },
    short: ['Hắc Bổng', 'Vạn Tượng Thiên Dẫn', 'Địa Bộc Thiên Tinh', 'Ngạ Quỷ Đạo', 'Shinra Tensei'],
    kit: [['J', 'Hắc Bổng: phóng thanh nhận chakra đen (miễn phí)'],
      ['Giữ J', 'Vạn Tượng Thiên Dẫn (Bansho Tenin): hút quái, đạn, sao và tim xung quanh về phía mình, kéo boss làm choáng (miễn phí)'],
      ['L', 'Địa Bộc Thiên Tinh (Chibaku Tensei): lõi đen trên trời hút đất đá, quái và đạn, giam boss 3 giây (miễn phí, hồi 2,5 giây)'],
      ['Shift', 'Ngạ Quỷ Đạo: khiên hút mọi nhẫn thuật, bất tử 2,5 giây (hồi 1,2 giây)'],
      ['U', 'SHINRA TENSEI: quả cầu đẩy khổng lồ tiêu diệt mọi quái xung quanh, phá bục và khoét hố mặt đất nó quét qua, 8 sát thương lên boss (cần đầy, nạp siêu nhanh)']],
    passive: 'giữ nhảy để lơ lửng · cheat: nhảy 3 lần, chạy nhanh, sát thương ×2, xuyên khiên boss, chakra nạp ×6. Bục bị phá tự hồi sau 6 giây.',
    tip: 'Pain: J Hắc Bổng · giữ J Vạn Tượng Thiên Dẫn · L Địa Bộc Thiên Tinh · Shift Ngạ Quỷ Đạo · U khi đầy: SHINRA TENSEI phá huỷ mọi thứ xung quanh. Giữ nhảy để lơ lửng.' },
  goku: { name: 'Goku', from: 'Dragon Ball', tag: 'Bay tự do, Kamehameha, Bản Năng Vô Cực (cheat)', energy: 'KI',
    btn: { bolt: ['KI', 'Chưởng KI'], web: ['Thuấn', 'Thuấn Di'], skill: ['Lướt', 'Lướt'], volt: ['UI', 'Bản Năng Vô Cực'] },
    short: ['Chưởng KI', 'Kamehameha', 'Thuấn Di', 'Lướt', 'Bản Năng Vô Cực'],
    more: ' · <kbd>↑</kbd>/<kbd>↓</kbd> (<kbd>W</kbd>/<kbd>S</kbd>) bay lên/xuống',
    moreTap: ' · ▲▼ bay lên/xuống',
    kit: [['↑ ↓ ← →', 'Bay tự do theo mọi hướng, thả nút là đứng lơ lửng, không bao giờ rơi xuống vực'],
      ['J', 'Chưởng KI: bắn nhanh (miễn phí)'],
      ['Giữ J', 'Kamehameha: tia năng lượng xanh xuyên mọi thứ, giữ càng lâu càng dài, 3–5 sát thương (miễn phí)'],
      ['L', 'Thuấn Di: biến mất, hiện ra sát kẻ thù gần nhất và đấm liên hoàn 3 phát, làm choáng boss (miễn phí, hồi 0,5 giây)'],
      ['Shift', 'Lướt: lao tới, vô địch (miễn phí, hồi 0,35 giây)'],
      ['U', 'Bản Năng Vô Cực 25 giây: tóc bạc, tự né mọi đòn, nhanh hơn, sát thương ×4; khi hoá toả sóng KI quét sạch màn hình (cần đầy KI, nạp siêu nhanh)']],
    passive: 'bay tự do, không rơi · cheat: chạy và bay nhanh, sát thương ×2, xuyên khiên boss, KI nạp ×6.',
    tip: 'Goku: ↑ ↓ ← → bay tự do · J Chưởng KI · giữ J Kamehameha · L Thuấn Di · Shift lướt · U khi đầy: BẢN NĂNG VÔ CỰC (tự né mọi đòn). Cheat: mọi chiêu miễn phí, sát thương ×2.' },
};
function applyChar() {
  const u = CHAR_UI[CHAR], s = u.short;
  $('charBtn').textContent = `Nhân vật: ${u.name} (P)`;
  document.querySelector('#hint .keys').innerHTML = `<kbd>←</kbd> <kbd>→</kbd> chạy · <kbd>↑</kbd>/<kbd>Space</kbd> nhảy · <kbd>J</kbd> ${s[0]}${s[1] ? ` (giữ rồi thả: ${s[1]})` : ''} · <kbd>L</kbd> ${s[2]} · <kbd>Shift</kbd> ${s[3]} · <kbd>U</kbd> ${s[4]}${u.more || ''} · <kbd>P</kbd> đổi nhân vật · <kbd>N</kbd> đổi màn · về đích trong ${TIME_LIMIT / 60} phút`;
  document.querySelector('#hint .tap').textContent = `◀ ▶ chạy · ▲ nhảy · ${u.btn.bolt[0]}${s[1] ? ` (giữ: ${s[1]})` : ''} · ${u.btn.web[0]}: ${s[2]} · ${u.btn.skill[0]}: ${s[3]} · ${u.btn.volt[0]}${CH().cost.volt != null ? `: ${s[4]}` : ' khi đầy'}${u.moreTap || ''} · về đích trong ${TIME_LIMIT / 60} phút`;
  document.querySelectorAll('.touch .sx').forEach(el => { el.hidden = CHAR !== 'saiyan'; });
  document.querySelectorAll('.touch .pk').forEach(el => { el.hidden = CHAR !== 'pika'; });
  document.querySelectorAll('.touch .gk').forEach(el => { el.hidden = !CH().fly; });
  document.querySelector('.touch [data-key="jump"]').setAttribute('aria-label', CH().fly ? 'Bay lên' : 'Nhảy');
  $('energyChip').title = `${u.energy}: ` + u.kit.map(([k, t]) => `${k} ${t}`).join(' · ');
  for (const [k, [label, aria]] of Object.entries(u.btn)) {
    const el = document.querySelector(`.touch [data-key="${k}"]`);
    el.textContent = label; el.setAttribute('aria-label', aria);
  }
  const fab = document.querySelector('.boltfab');
  fab.innerHTML = `${u.btn.bolt[0]} <kbd>J</kbd>`;
  fab.setAttribute('aria-label', s[1] ? `${u.btn.bolt[1]}, giữ để dùng ${s[1]}` : u.btn.bolt[1]);
  lastSkill = '';
}
function showKit(id) {
  const u = CHAR_UI[id], el = $('charInfo');
  el.textContent = '';
  const h = document.createElement('b'); h.textContent = `${u.name} · ${u.from}`;
  el.append(h);
  for (const [k, t] of u.kit) {
    const kb = document.createElement('kbd'); kb.textContent = k;
    el.append(document.createElement('br'), kb, ' ' + t);
  }
  if (u.passive) el.append(document.createElement('br'), 'Nội tại: ' + u.passive);
  $('outfit').hidden = id !== 'kiem';
  if (id === 'kiem') drawOutfitPreview();
}
function buildCharList() {
  const list = $('charList');
  list.textContent = '';
  for (const [id, u] of Object.entries(CHAR_UI)) {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'charopt'; btn.dataset.char = id;
    btn.setAttribute('aria-pressed', String(id === CHAR));
    const nm = document.createElement('span'); nm.textContent = u.name + (unlocked(id) ? '' : ' 🔒');
    const sm = document.createElement('small'); sm.textContent = `${u.from} · ${u.tag}`;
    btn.append(nm, sm);
    btn.addEventListener('click', () => pickChar(id));
    btn.addEventListener('mouseenter', () => showKit(id));
    btn.addEventListener('focus', () => showKit(id));
    list.appendChild(btn);
  }
}
function openChars() {
  paused = true;
  for (const k in keys) keys[k] = false;
  S.charging = false;
  buildCharList(); showKit(CHAR);
  $('pwForm').hidden = true; $('pwMsg').hidden = true;
  $('chars').hidden = false;
  document.querySelector(`.charopt[data-char="${CHAR}"]`).focus();
}
function closeChars() {
  $('chars').hidden = true;
  paused = false;
  $('charBtn').blur();
}
function setChar(id) {
  CHAR = id; lsSet(CHAR_KEY, id);
  applyChar(); reset(); closeChars();
}
function pickChar(id) {
  showKit(id);
  if (!unlocked(id)) {
    pwFor = id;
    $('pwLabel').textContent = `${CHAR_UI[id].name} đang khoá: nhập mật khẩu để mở`;
    $('pwForm').hidden = false; $('pwMsg').hidden = true;
    $('pwInput').value = ''; $('pwInput').focus();
    return;
  }
  setChar(id);
}
$('pwForm').addEventListener('submit', e => {
  e.preventDefault();
  const v = $('pwInput').value.trim();
  $('pwInput').value = '';
  const id = pwFor;
  if (id && LOCKS[id] && pwHash(v) === LOCKS[id].hash) {
    lsSet(LOCKS[id].key, '1');
    setChar(id);
    showTip(`Đã mở khoá ${CHAR_UI[id].name}! ` + CHAR_UI[id].tip);
  } else {
    $('pwMsg').hidden = false; $('pwMsg').textContent = 'Sai mật khẩu, thử lại.';
    $('pwInput').focus();
  }
});
$('charBtn').addEventListener('click', openChars);
$('charsClose').addEventListener('click', closeChars);
CHAR = lsGet(CHAR_KEY, 'pika');
DMAX = lsGet(DMAX_KEY, '') === '1';
if (!CHAR_UI[CHAR] || !unlocked(CHAR)) CHAR = 'pika';
applyChar();

/* ---------- Vẽ ---------- */
const CLOUDS = Array.from({ length: 9 }, (_, i) => ({ x: i * 520 + (i * 137) % 200, y: 60 + (i * 71) % 140, s: .7 + (i * 37 % 50) / 100 }));
function drawBackground() {
  const cam = S.cam;
  // trời chuyển màu từ xanh đậm xuống vàng nhạt ở chân trời
  const T = THEMES[MAP];
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, T.sky[0]); g.addColorStop(.55, T.sky[1]); g.addColorStop(1, T.sky[2]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, viewW, VIEW_H);
  // mặt trời có quầng sáng (thị sai rất nhỏ)
  const sx0 = viewW * .78 - cam.x * .02, sy0 = 110 - cam.y * .05;
  const sun = ctx.createRadialGradient(sx0, sy0, 10, sx0, sy0, 190);
  sun.addColorStop(0, T.sunG[0]); sun.addColorStop(.22, T.sunG[1]); sun.addColorStop(1, T.sunG[2]);
  ctx.fillStyle = sun; ctx.fillRect(sx0 - 200, sy0 - 200, 400, 400);
  ctx.fillStyle = T.sun; ctx.beginPath(); ctx.arc(sx0, sy0, 34, 0, Math.PI * 2); ctx.fill();
  // mây bông mềm, đáy hơi xám (thị sai 0.2)
  for (const c of CLOUDS) {
    const x = ((c.x - cam.x * .2) % 4700 + 4700) % 4700 - 200, y = c.y - cam.y * .1;
    if (x > viewW + 200) continue;
    const blob = (dy, col) => {
      ctx.fillStyle = col; ctx.beginPath();
      ctx.arc(x, y + dy, 24 * c.s, 0, Math.PI * 2);
      ctx.arc(x + 28 * c.s, y - 16 * c.s + dy, 32 * c.s, 0, Math.PI * 2);
      ctx.arc(x + 62 * c.s, y - 4 * c.s + dy, 26 * c.s, 0, Math.PI * 2);
      ctx.arc(x + 88 * c.s, y + 6 * c.s + dy, 18 * c.s, 0, Math.PI * 2);
      ctx.fill();
    };
    blob(6 * c.s, T.cloud[0]);
    blob(0, T.cloud[1]);
  }
  // dãy núi xa mờ (thị sai 0.15) rồi đồi gần hơn (thị sai 0.4)
  const ridge = (par, base, amp, f1, f2, top, bot) => {
    const gr = ctx.createLinearGradient(0, base - amp * 1.6 - cam.y * par, 0, VIEW_H);
    gr.addColorStop(0, top); gr.addColorStop(1, bot);
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(0, VIEW_H);
    for (let sx = 0; sx <= viewW + 20; sx += 16) {
      const wx = sx + cam.x * par;
      ctx.lineTo(sx, base - cam.y * par - amp * Math.sin(wx / f1) ** 2 - amp * .5 * Math.sin(wx / f2 + 1) ** 2);
    }
    ctx.lineTo(viewW, VIEW_H); ctx.fill();
  };
  ridge(.15, 360, 90, 310, 130, T.r1[0], T.r1[1]);
  ridge(.4, 410, 60, 230, 97, T.r2[0], T.r2[1]);
}
// màu cảnh: màn 1 đồng cỏ ban ngày, màn 2 núi đá tím lúc hoàng hôn
const THEMES = {
  1: { sky: ['#2f8fe6', '#8fd3ff', '#fff1c9'], sun: '#fffbe6', sunG: ['rgb(255 250 220 / .95)', 'rgb(255 236 170 / .55)', 'rgb(255 236 170 / 0)'],
    cloud: ['rgb(170 200 230 / .55)', 'rgb(255 255 255 / .95)'], r1: ['#9fc3e6', '#cfe6f2'], r2: ['#62c48e', '#a8e3b8'],
    dirt: '#1d5e2a', dirt2: '#174d22', grass: ['#3fb02a', '#5fd83a', '#a8f070'] },
  2: { sky: ['#1c0f2e', '#5b2a5c', '#e98f6a'], sun: '#ffd2b0', sunG: ['rgb(255 200 170 / .95)', 'rgb(255 140 120 / .5)', 'rgb(255 140 120 / 0)'],
    cloud: ['rgb(90 50 90 / .55)', 'rgb(214 160 196 / .85)'], r1: ['#4b3566', '#8a5f86'], r2: ['#2e2440', '#5a4468'],
    dirt: '#3a2f46', dirt2: '#30263b', grass: ['#5f4f78', '#7d6b99', '#c4b2e2'] },
};
function tracePts(p) {
  ctx.beginPath(); ctx.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
}
function drawSolids(x0, x1) {
  for (const s of SOLIDS) {
    if (s.gate || s.broken || s.maxX < x0 || s.minX > x1) continue;   // cổng có hình riêng (drawGate)
    tracePts(s.pts); ctx.closePath();
    const T = THEMES[MAP];
    ctx.fillStyle = T.dirt; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = T.dirt2;
    const gx0 = Math.max(s.minX, x0) - 60, gx1 = Math.min(s.maxX, x1) + 60;
    for (let gx = Math.floor(gx0 / 70) * 70; gx < gx1; gx += 70) {
      for (let gy = 0; gy < 3; gy++) {
        const h = Math.sin(gx * 12.9898 + gy * 78.233) * 43758.5453, r = h - Math.floor(h);
        ctx.beginPath(); ctx.arc(gx + r * 40, s.minY + 70 + gy * 80 + r * 30, 14 + r * 10, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
    // cỏ: dải chính, mép rủ xuống, viền sáng
    const t = s.top;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    tracePts(t); ctx.strokeStyle = T.grass[0]; ctx.lineWidth = 24; ctx.stroke();
    ctx.fillStyle = T.grass[0];
    for (let i = 0; i < t.length - 2; i += 2) {
      const mx = (t[i] + t[i + 2]) / 2, my = (t[i + 1] + t[i + 3]) / 2;
      if (mx < x0 - 20 || mx > x1 + 20) continue;
      ctx.beginPath(); ctx.arc(mx, my + 12, 7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.save(); ctx.translate(0, -4);
    tracePts(t); ctx.strokeStyle = T.grass[1]; ctx.lineWidth = 14; ctx.stroke();
    ctx.translate(0, -5);
    tracePts(t); ctx.strokeStyle = T.grass[2]; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
}
function drawSpikes() {
  for (const sp of SPIKES) {
    if (S.spikeGone.has(sp)) continue;
    for (let x = sp.x0; x < sp.x1; x += 20) {
      const y = sp.f(x + 10) - 4;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10, y - 24); ctx.lineTo(x + 20, y); ctx.closePath();
      ctx.fillStyle = '#c9d1db'; ctx.fill();
      ctx.strokeStyle = '#2b3138'; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 10, y - 22); ctx.lineTo(x + 6, y - 4); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
    }
  }
}
function drawFlower(x, gy, s) {
  ctx.save(); ctx.translate(x, gy - 6); ctx.scale(s, s);
  ctx.strokeStyle = '#2f9e2a'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-6, -40, 0, -78); ctx.stroke();
  ctx.fillStyle = '#4fcf2e'; ctx.strokeStyle = '#1f6b1c'; ctx.lineWidth = 2;
  for (const d of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(d * 16, -22, 16, 7, d * -.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.translate(0, -92);
  for (let i = 0; i < 5; i++) {
    ctx.save(); ctx.rotate(i * Math.PI * 2 / 5 + .3);
    ctx.beginPath(); ctx.ellipse(0, -24, 17, 22, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f0405a'; ctx.fill(); ctx.strokeStyle = '#8c1730'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.strokeStyle = '#c42345'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-5, -14); ctx.lineTo(-6, -34); ctx.moveTo(5, -14); ctx.lineTo(6, -34); ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fillStyle = '#ffc21a'; ctx.fill(); ctx.strokeStyle = '#a86a00'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(-4, -5, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawSign(x, gy) {
  ctx.fillStyle = '#9aa3ad'; ctx.fillRect(x - 4, gy - 70, 8, 70);
  ctx.save(); ctx.translate(x, gy - 96);
  ctx.fillStyle = '#c98a4b'; ctx.strokeStyle = '#5a3416'; ctx.lineWidth = 3;
  ctx.fillRect(-46, -30, 92, 60); ctx.strokeRect(-46, -30, 92, 60);
  ctx.strokeStyle = 'rgb(90 52 22 / .35)'; ctx.lineWidth = 2;
  for (const y of [-12, 8]) { ctx.beginPath(); ctx.moveTo(-44, y); ctx.lineTo(44, y); ctx.stroke(); }
  ctx.beginPath();
  ctx.moveTo(-26, -8); ctx.lineTo(4, -8); ctx.lineTo(4, -20); ctx.lineTo(28, 0); ctx.lineTo(4, 20); ctx.lineTo(4, 8); ctx.lineTo(-26, 8); ctx.closePath();
  ctx.fillStyle = '#ffc21a'; ctx.fill(); ctx.strokeStyle = '#a86a00'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}
function drawFlag(x, gy, color, tall) {
  const h = tall ? 150 : 100;
  ctx.fillStyle = '#5a3416'; ctx.fillRect(x - 4, gy - h, 8, h);
  const wave = Math.sin(S.t * 6) * 4;
  ctx.beginPath(); ctx.moveTo(x + 4, gy - h); ctx.quadraticCurveTo(x + 30, gy - h + 6 + wave, x + 56, gy - h + 14);
  ctx.lineTo(x + 4, gy - h + 34); ctx.closePath();
  ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#14301c'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = '#ffc21a'; ctx.beginPath(); ctx.arc(x, gy - h - 6, 7, 0, Math.PI * 2); ctx.fill();
}
function starPath(x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}
function drawStars() {
  for (const s of S.stars) {
    if (s.got) {
      if (s.pop > 0) { ctx.globalAlpha = s.pop / .3; starPath(s.x, s.y - (.3 - s.pop) * 120, 16 + (.3 - s.pop) * 30); ctx.fillStyle = '#ffc21a'; ctx.fill(); ctx.globalAlpha = 1; }
      continue;
    }
    const y = s.y + Math.sin(S.t * 3 + s.x) * 4;
    starPath(s.x, y, 16); ctx.fillStyle = '#ffc21a'; ctx.fill();
    ctx.strokeStyle = '#a86a00'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(s.x - 4, y - 4, 3, 0, Math.PI * 2); ctx.fill();
  }
}
function drawEnemies() {
  for (const e of S.enemies) {
    const gy = e.f(e.x);
    if (!e.alive) {
      if (e.squash > 0) { ctx.globalAlpha = e.squash / .4; ctx.fillStyle = '#16181d'; ctx.fillRect(e.x - 24, gy - 10, 48, 10); ctx.globalAlpha = 1; }
      continue;
    }
    ctx.fillStyle = '#16181d'; ctx.fillRect(e.x - 20, gy - 40, 40, 40);
    ctx.fillStyle = '#3a3f4a'; ctx.fillRect(e.x - 20, gy - 40, 40, 5);
    const ex = e.dir * 4;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(e.x - 13 + ex, gy - 30, 10, 10); ctx.fillRect(e.x + 3 + ex, gy - 30, 10, 10);
    ctx.fillStyle = '#e3262b';
    ctx.fillRect(e.x - 10 + ex + e.dir * 2, gy - 27, 5, 6); ctx.fillRect(e.x + 6 + ex + e.dir * 2, gy - 27, 5, 6);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(e.x - 15 + ex, gy - 36); ctx.lineTo(e.x - 4 + ex, gy - 32); ctx.moveTo(e.x + 15 + ex, gy - 36); ctx.lineTo(e.x + 4 + ex, gy - 32); ctx.stroke();
    if (e.stun > 0) drawNet(e.x, gy - 20, 28);   // dính Lưới điện
  }
}
function drawGate() {
  if (!S.gateClosed) return;
  const x = ARENA.gateX, gy = ARENA.floor;
  ctx.fillStyle = '#5f6470'; ctx.fillRect(x - 6, gy - 330, 42, 24);
  ctx.fillStyle = '#3d414a';
  for (let i = 0; i < 3; i++) ctx.fillRect(x + i * 11, gy - 306, 6, 306);
  ctx.fillStyle = '#8a8f98';
  for (let y = gy - 290; y < gy; y += 40) ctx.fillRect(x - 2, y, 34, 5);
}
function drawAura(u, cx, cy, r) {
  if (r < 6) return;
  ctx.save(); ctx.translate(cx, cy);
  if (u.kind === 'ice') {
    // vòng tinh thể băng
    ctx.fillStyle = 'rgb(127 240 255 / .22)';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgb(216 251 255 / .85)'; ctx.lineWidth = 3; ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2 + S.t * 1.5, sz = 10 + (i % 3) * 3;
      ctx.save(); ctx.translate(Math.cos(a) * r * .82, Math.sin(a) * r * .82); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(0, -sz); ctx.lineTo(sz * .45, 0); ctx.lineTo(0, sz); ctx.lineTo(-sz * .45, 0); ctx.closePath();
      ctx.fillStyle = '#7ff0ff'; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }
  } else {
    // vòng lửa
    ctx.fillStyle = 'rgb(255 90 40 / .3)';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * Math.PI * 2 + S.t * 3, fl = .75 + Math.sin(S.t * 30 + i * 2.3) * .15, rr = r * fl, k = r / AURA_R;
      ctx.fillStyle = '#ff4a1c'; ctx.beginPath(); ctx.arc(Math.cos(a) * rr * .85, Math.sin(a) * rr * .85, 18 * k, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff9a1f'; ctx.beginPath(); ctx.arc(Math.cos(a) * rr * .72, Math.sin(a) * rr * .72, 12 * k, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(Math.cos(a) * rr * .6, Math.sin(a) * rr * .6, 6 * k, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}
// Vòng phong ấn: hiện giữa đấu trường khi bóng bị phong ấn
function drawSeal() {
  const cx = (ARENA.l + ARENA.r) / 2, cy = ARENA.floor - 170, r = 190;
  ctx.save(); ctx.translate(cx, cy); ctx.globalAlpha = .55; ctx.lineWidth = 4;
  ctx.strokeStyle = '#7ff0ff'; ctx.beginPath(); ctx.arc(0, 0, r, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
  ctx.strokeStyle = '#ff2f5c'; ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  ctx.strokeStyle = '#c9b6ff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, r * .8, 0, Math.PI * 2); ctx.stroke();
  ctx.rotate(S.t * .4);
  ctx.beginPath();
  for (let i = 0; i <= 5; i++) {
    const a = -Math.PI / 2 + (i * 2 % 5) * Math.PI * 2 / 5;
    i ? ctx.lineTo(Math.cos(a) * r * .8, Math.sin(a) * r * .8) : ctx.moveTo(Math.cos(a) * r * .8, Math.sin(a) * r * .8);
  }
  ctx.stroke();
  ctx.restore();
}
function drawWing(ice, GLOW, GLOW2, BODY) {
  if (ice) {
    // cánh lông vũ băng
    for (let k = 0; k < 7; k++) {
      const a = -2.8 + k * .21, len = 62 - k * 3;   // xoè ra phía sau lưng, chếch lên
      ctx.save(); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(len, 0); ctx.lineTo(0, 6); ctx.closePath();
      ctx.fillStyle = GLOW; ctx.fill(); ctx.strokeStyle = GLOW2; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.restore();
    }
  } else {
    // cánh dơi lửa, mép răng cưa
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-16, -34); ctx.lineTo(-50, -32); ctx.lineTo(-64, 0);
    ctx.lineTo(-54, -6); ctx.lineTo(-46, 6); ctx.lineTo(-36, -2); ctx.lineTo(-26, 8); ctx.lineTo(-14, 0); ctx.closePath();
    ctx.fillStyle = GLOW; ctx.fill();
    ctx.strokeStyle = BODY; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-50, -32); ctx.moveTo(0, 0); ctx.lineTo(-40, -4); ctx.moveTo(0, 0); ctx.lineTo(-22, 4); ctx.stroke();
  }
}
// Chibi ác quỷ (fan art vẽ bằng hình khối). Gốc toạ độ ở chân, +x là hướng mặt.
function drawDevil(u, B, x, gy) {
  const ice = u.kind === 'ice';
  const [GLOW, GLOW2, BODY] = devilColors(u);
  const SKIN = ice ? '#4a6470' : '#5a3a40', HAIR = ice ? '#c3d3da' : '#2a1216';
  if (u.hidden) return;
  const moving = u.moving ?? (S.fight && !B.ts && !B.cut && !B.act && !B.exhaust && !B.stun);
  const aim = u.aim ?? (!!B.act || B.ts > 0 || !!(B.cut && B.cut.appear));
  const bob = moving ? Math.abs(Math.sin(S.t * 7 + (ice ? 0 : 1.5))) * 3 : Math.sin(S.t * 2) * 1.5;
  const flap = Math.sin(S.t * (moving ? 9 : 4) + (ice ? 0 : 1)) * .15;
  ctx.save();
  ctx.translate(x, gy);
  ctx.fillStyle = ice ? 'rgb(127 240 255 / .28)' : 'rgb(255 47 92 / .28)';
  ctx.beginPath(); ctx.ellipse(0, -1, 30, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.scale(u.dir * (1 + u.squash * .6), 1 - u.squash);
  if (u.emerge !== undefined) ctx.scale(Math.max(.05, u.emerge), Math.max(.05, u.emerge));   // trồi ra từ xác Lilith
  if (u.hurt > 0 && Math.floor(S.t * 20) % 2) ctx.globalAlpha = .4;
  ctx.translate(0, -bob);

  // đuôi
  ctx.strokeStyle = BODY; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-4, -34); ctx.quadraticCurveTo(-46, -30, -38, -6); ctx.quadraticCurveTo(-32, 6, -22, -2); ctx.stroke();
  // cánh: cánh xa (mờ) rồi cánh gần
  ctx.save(); ctx.translate(-2, -64); ctx.rotate(.35 - flap); ctx.scale(-.7, .7); ctx.globalAlpha *= .55; drawWing(ice, GLOW, GLOW2, BODY); ctx.restore();
  ctx.save(); ctx.translate(-6, -64); ctx.rotate(-.15 + flap); drawWing(ice, GLOW, GLOW2, BODY); ctx.restore();

  // thân: Lilith váy dài đuôi cá, Naamah đôi chân dài
  ctx.fillStyle = BODY;
  if (ice) {
    ctx.beginPath(); ctx.moveTo(-9, -62); ctx.lineTo(9, -62); ctx.lineTo(13, -26); ctx.lineTo(21, 0); ctx.lineTo(-21, 0); ctx.lineTo(-13, -26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgb(127 240 255 / .35)'; ctx.fillRect(-18, -4, 36, 3);
  } else {
    ctx.fillRect(-8, -40, 7, 40); ctx.fillRect(2, -40, 7, 40);
    ctx.beginPath(); ctx.moveTo(-10, -62); ctx.lineTo(10, -62); ctx.lineTo(9, -38); ctx.lineTo(-9, -38); ctx.closePath(); ctx.fill();
    ctx.fillStyle = GLOW; ctx.fillRect(3, -30, 3, 4); ctx.fillRect(4, -20, 3, 3);
  }
  // vân phát sáng trên ngực
  ctx.strokeStyle = GLOW2; ctx.lineWidth = 1.5; ctx.globalAlpha *= .8;
  ctx.beginPath();
  for (let k = 0; k < 4; k++) { ctx.moveTo(-6, -58 + k * 5); ctx.lineTo(0, -56 + k * 5); ctx.lineTo(6, -58 + k * 5); }
  ctx.moveTo(0, -60); ctx.lineTo(0, -38); ctx.stroke();
  ctx.globalAlpha /= .8;

  // cánh tay lớn phát sáng, có móng vuốt
  ctx.save(); ctx.translate(8, -58); ctx.rotate(aim ? -1.5 : .25);
  ctx.fillStyle = BODY; ctx.fillRect(-4, 0, 9, 30);
  ctx.fillStyle = GLOW;
  for (let k = 0; k < 5; k++) ctx.fillRect(-2 + (k % 2) * 3, 3 + k * 5, 3, 3);
  ctx.strokeStyle = GLOW2; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(-4, 37); ctx.moveTo(1, 30); ctx.lineTo(1, 38); ctx.moveTo(2, 30); ctx.lineTo(6, 37); ctx.stroke();
  if (u.flash > 0) { ctx.fillStyle = GLOW2; ctx.beginPath(); ctx.arc(1, 42, 9, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();

  // tóc phía sau: Lilith tóc sáng bồng bềnh, Naamah tóc xoăn sẫm
  const hy = -80;
  ctx.fillStyle = HAIR;
  if (ice) {
    for (let k = 0; k < 7; k++) {
      ctx.beginPath(); ctx.ellipse(-12 - k * 5, hy - 8 + k * 3 + Math.sin(S.t * 3 + k) * 3, 12, 7, .5, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    for (let k = 0; k < 8; k++) {
      const a = Math.PI * (.85 + k * .17);
      ctx.beginPath(); ctx.arc(Math.cos(a) * 18 - 4, hy - 4 + Math.sin(a) * 16 + Math.sin(S.t * 4 + k) * 1.5, 7, 0, Math.PI * 2); ctx.fill();
    }
  }
  // đầu
  ctx.fillStyle = SKIN; ctx.strokeStyle = BODY; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, hy, 17, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = HAIR;
  ctx.beginPath(); ctx.arc(-1, hy - 3, 18, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
  // sừng cong
  ctx.fillStyle = BODY; ctx.strokeStyle = GLOW; ctx.lineWidth = 1.5;
  for (const ox of [-8, 4]) {
    ctx.beginPath(); ctx.moveTo(ox, hy - 14);
    if (ice) ctx.quadraticCurveTo(ox - 16, hy - 26, ox - 8, hy - 42), ctx.quadraticCurveTo(ox - 8, hy - 28, ox + 6, hy - 15);
    else ctx.quadraticCurveTo(ox - 6, hy - 26, ox + 2, hy - 32), ctx.quadraticCurveTo(ox + 2, hy - 24, ox + 7, hy - 15);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // vết ma lực trên mặt + mắt phát sáng
  ctx.strokeStyle = GLOW; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(4, hy - 13); ctx.lineTo(9, hy - 5); ctx.lineTo(5, hy + 3); ctx.stroke();
  ctx.fillStyle = GLOW; ctx.beginPath(); ctx.arc(9, hy - 1, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(9, hy - 1, 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = GLOW; ctx.globalAlpha *= .6; ctx.beginPath(); ctx.arc(-2, hy - 1, 2.2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha /= .6;
  ctx.strokeStyle = BODY; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(5, hy + 9); ctx.quadraticCurveTo(9, hy + (aim ? 12 : 10), 13, hy + 8); ctx.stroke();
  ctx.restore();
}
// Zagred (Black Clover, fan art hình khối): ác quỷ da xám đen, tóc đen dài, cặp sừng cong lớn, mắt đỏ, vân ma lực tím;
// ma pháp Ngôn Hồn — chữ bay quanh người. Hình dạng thật (giai đoạn 2): to hơn, cánh bóng tối, con mắt thứ ba.
// Gốc toạ độ ở chân, +x là hướng mặt.
function drawZagred(u, B, x, gy) {
  if (u.hidden) return;
  const tf = B.phase >= 2, aim = !!B.act || B.ts > 0;
  const bob = Math.sin(S.t * 2.4) * 3, flap = Math.sin(S.t * 5) * .12;
  const SK = '#2c2433', SK2 = '#43394d', HAIR = '#0d0a12', GL = '#b04cff', GL2 = '#e6c8ff', EYE = '#ff2f5c';
  ctx.save();
  ctx.translate(x, gy);
  ctx.fillStyle = 'rgb(176 76 255 / .25)';
  ctx.beginPath(); ctx.ellipse(0, -1, 32, 6, 0, 0, Math.PI * 2); ctx.fill();
  const k = tf ? 1.18 : 1;
  ctx.scale(u.dir * (1 + u.squash * .6) * k, (1 - u.squash) * k);
  if (u.hurt > 0 && Math.floor(S.t * 20) % 2) ctx.globalAlpha = .4;
  ctx.translate(0, -bob);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // cánh bóng tối rách (hình dạng thật): cánh xa mờ rồi cánh gần
  if (tf) {
    for (const [sx, al, rot] of [[-.7, .5, .3 - flap], [1, 1, -.1 + flap]]) {
      ctx.save(); ctx.translate(-4, -74); ctx.rotate(rot); ctx.scale(sx, 1); ctx.globalAlpha *= al;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(-30, -46); ctx.lineTo(-70, -40); ctx.lineTo(-58, -24); ctx.lineTo(-78, -10);
      ctx.lineTo(-56, -4); ctx.lineTo(-66, 16); ctx.lineTo(-40, 8); ctx.lineTo(-34, 28); ctx.lineTo(-16, 8); ctx.closePath();
      ctx.fillStyle = 'rgb(18 8 26 / .92)'; ctx.fill(); ctx.strokeStyle = GL; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }
  }
  // tóc đen dài buông sau lưng
  ctx.fillStyle = HAIR;
  ctx.beginPath(); ctx.moveTo(-6, -104); ctx.quadraticCurveTo(-30, -80 + Math.sin(S.t * 3) * 3, -22, -40);
  ctx.lineTo(-12, -48); ctx.quadraticCurveTo(-14, -70, 2, -96); ctx.closePath(); ctx.fill();
  // chân dài, khố tím
  ctx.fillStyle = SK;
  ctx.fillRect(-8, -42, 7, 42); ctx.fillRect(2, -42, 7, 42);
  ctx.fillStyle = '#3a1550';
  ctx.beginPath(); ctx.moveTo(-10, -46); ctx.lineTo(10, -46); ctx.lineTo(6, -28); ctx.lineTo(0, -24); ctx.lineTo(-6, -28); ctx.closePath(); ctx.fill();
  // thân gầy, vân ma lực phát sáng
  ctx.fillStyle = SK;
  ctx.beginPath(); ctx.moveTo(-12, -84); ctx.lineTo(12, -84); ctx.lineTo(8, -46); ctx.lineTo(-8, -46); ctx.closePath(); ctx.fill();
  ctx.fillStyle = SK2; ctx.fillRect(-2, -82, 4, 34);
  ctx.strokeStyle = GL; ctx.lineWidth = 1.6; ctx.globalAlpha *= .9;
  ctx.beginPath();
  ctx.moveTo(-9, -78); ctx.lineTo(-3, -70); ctx.lineTo(-8, -60); ctx.moveTo(9, -78); ctx.lineTo(3, -70); ctx.lineTo(8, -60);
  ctx.moveTo(-6, -54); ctx.lineTo(0, -50); ctx.lineTo(6, -54);
  ctx.stroke(); ctx.globalAlpha /= .9;
  // tay dài móng vuốt: giơ ra trước khi niệm Ngôn Hồn, trên tay quả cầu tối
  ctx.save(); ctx.translate(9, -80); ctx.rotate(aim ? -1.45 : .2 + Math.sin(S.t * 2) * .05);
  ctx.fillStyle = SK; ctx.fillRect(-3.5, 0, 7, 34);
  ctx.strokeStyle = GL2; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-2, 34); ctx.lineTo(-5, 42); ctx.moveTo(1, 34); ctx.lineTo(1, 43); ctx.moveTo(3, 34); ctx.lineTo(6, 42); ctx.stroke();
  if (aim || u.flash > 0) {
    ctx.fillStyle = 'rgb(176 76 255 / .45)'; ctx.beginPath(); ctx.arc(1, 48, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#14081c'; ctx.beginPath(); ctx.arc(1, 48, 7, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // đầu
  const hy = -98;
  ctx.fillStyle = SK; ctx.strokeStyle = '#14081c'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(1, hy, 12, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // mái tóc đen
  ctx.fillStyle = HAIR;
  ctx.beginPath(); ctx.arc(0, hy - 2, 13, Math.PI * 1.05, Math.PI * 1.95);
  ctx.lineTo(13, hy + 2); ctx.lineTo(7, hy - 5); ctx.lineTo(2, hy); ctx.lineTo(-4, hy - 6); ctx.lineTo(-12, hy + 4); ctx.closePath(); ctx.fill();
  // cặp sừng cong lớn vểnh ra sau
  ctx.fillStyle = '#1a1220'; ctx.strokeStyle = GL; ctx.lineWidth = 1.4;
  for (const [ox, sc] of [[-6, .85], [4, 1]]) {
    ctx.beginPath(); ctx.moveTo(ox - 3, hy - 10);
    ctx.quadraticCurveTo(ox - 20 * sc, hy - 22 * sc, ox - 26 * sc, hy - 44 * sc);
    ctx.quadraticCurveTo(ox - 10 * sc, hy - 30 * sc, ox + 5, hy - 11);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // mắt đỏ xếch phát sáng, con mắt thứ ba khi ở hình dạng thật
  ctx.fillStyle = EYE;
  ctx.beginPath(); ctx.moveTo(4, hy - 1); ctx.lineTo(12, hy - 4); ctx.lineTo(11, hy + 1); ctx.closePath(); ctx.fill();
  ctx.globalAlpha *= .6; ctx.beginPath(); ctx.moveTo(-6, hy - 1); ctx.lineTo(0, hy - 3); ctx.lineTo(0, hy + 1); ctx.closePath(); ctx.fill(); ctx.globalAlpha /= .6;
  if (tf) {
    ctx.fillStyle = GL2; ctx.beginPath(); ctx.ellipse(4, hy - 9, 2, 3.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#14081c'; ctx.fillRect(3.4, hy - 11, 1.2, 4);
  }
  // miệng cười nhe răng khi niệm chú
  ctx.strokeStyle = '#14081c'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(2, hy + 7); ctx.quadraticCurveTo(7, hy + (aim ? 11 : 9), 12, hy + 6); ctx.stroke();
  if (aim) { ctx.fillStyle = '#ffffff'; for (const tx of [5, 8, 11]) ctx.fillRect(tx, hy + 7, 1.4, 2); }
  ctx.restore();
  // chữ Ngôn Hồn bay quanh người (vẽ ngoài phép lật để chữ không bị ngược)
  ctx.font = '700 15px serif'; ctx.textAlign = 'center';
  const words = ['言', '霊', '魂', '死'];
  for (let i = 0; i < words.length; i++) {
    const a = S.t * 1.6 + i * Math.PI / 2, rr = (tf ? 62 : 52);
    ctx.globalAlpha = .55 + Math.sin(S.t * 4 + i) * .25;
    ctx.fillStyle = i % 2 ? GL2 : GL;
    ctx.fillText(words[i], x + Math.cos(a) * rr, gy - 64 * k + Math.sin(a) * rr * .45 - bob);
  }
  ctx.globalAlpha = 1;
}
// Thân hợp thể: nửa trái là Lilith, nửa phải là Naamah
function drawFusedBody(B, u, gy, k) {
  const x = u.x, busyNow = !!B.act;
  for (const [kind, x0] of [['ice', -400], ['fire', 0]]) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x + x0, gy - 400, 400, 430); ctx.clip();
    ctx.translate(x, gy); ctx.scale(k, k); ctx.translate(-x, -gy);
    drawDevil({ ...u, kind, aim: busyNow, moving: !busyNow }, B, x, gy);
    ctx.restore();
  }
  // vết nứt phát sáng ở giữa
  ctx.strokeStyle = `rgb(255 255 255 / ${(.5 + Math.sin(S.t * 8) * .3).toFixed(2)})`; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, gy - 125 * k); ctx.lineTo(x + 3, gy - 90 * k); ctx.lineTo(x - 3, gy - 50 * k); ctx.lineTo(x, gy - 6); ctx.stroke();
}
function drawMarks(B) {
  const gy = ARENA.floor;
  for (const m of B.marks) {
    if (m.life < 2 && Math.floor(S.t * 8) % 2) continue;   // sắp biến mất thì nhấp nháy
    const y = gy - 20 + Math.sin(S.t * 4 + m.x) * 4;
    ctx.fillStyle = m.kind === 'ice' ? 'rgb(127 240 255 / .3)' : 'rgb(255 140 40 / .3)';
    ctx.beginPath(); ctx.arc(m.x, y, 18, 0, Math.PI * 2); ctx.fill();
    if (m.kind === 'ice') {
      ctx.beginPath(); ctx.moveTo(m.x, y - 13); ctx.lineTo(m.x + 7, y); ctx.lineTo(m.x, y + 13); ctx.lineTo(m.x - 7, y); ctx.closePath();
      ctx.fillStyle = '#7ff0ff'; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
    } else {
      ctx.fillStyle = '#ff4a1c'; ctx.beginPath(); ctx.moveTo(m.x, y - 14); ctx.quadraticCurveTo(m.x + 10, y, m.x, y + 10); ctx.quadraticCurveTo(m.x - 10, y, m.x, y - 14); ctx.fill();
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(m.x, y + 3, 4, 0, Math.PI * 2); ctx.fill();
    }
  }
}
function drawFuse(B) {
  const F = B.fuse, gy = ARENA.floor;
  if (!F.merged) {
    const k = clamp(F.t / FUSE.merge, 0, 1), e = k * k;
    const N = B.units[0], nx = F.nx + (F.mx - F.nx) * e + Math.sin(S.t * 60) * 2;
    const lx = F.mx - 220 * (1 - e), ly = -150 * (1 - e);
    // vòng xoáy năng lượng thu nhỏ dần
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#7ff0ff'; ctx.beginPath(); ctx.arc(F.mx, gy - 70, 30 + 140 * (1 - k), S.t * 6, S.t * 6 + Math.PI); ctx.stroke();
    ctx.strokeStyle = '#ff2f5c'; ctx.beginPath(); ctx.arc(F.mx, gy - 70, 30 + 140 * (1 - k), S.t * 6 + Math.PI, S.t * 6 + Math.PI * 2); ctx.stroke();
    // hồn Lilith hiện về từ trên cao
    ctx.save(); ctx.globalAlpha = clamp(F.t / FUSE.ghost, 0, 1) * .8;
    drawDevil({ kind: 'ice', x: lx, dir: 1, squash: 0, flash: 0, hurt: 0, aim: true, moving: false }, B, lx, gy + ly);
    ctx.restore();
    drawDevil({ ...N, x: nx, dir: -1, aim: true, moving: false }, B, nx, gy);
  } else {
    drawFusedBody(B, B.units[0], gy, FUSED_K * (.3 + .7 * B.units[0].grow));
  }
}
function drawFused(B) {
  const u = B.units[0], gy = u.y, cy = gy - 70;
  drawMarks(B);
  const open = S.power > 0 || B.exhaust > 0 || B.stun > 0;
  if (!open) {
    // khiên băng lửa: chỉ hở khi Lao điện hoặc boss kiệt sức
    ctx.save(); ctx.globalAlpha = .35 + Math.sin(S.t * 5) * .1; ctx.lineWidth = 4;
    ctx.strokeStyle = '#7ff0ff'; ctx.beginPath(); ctx.arc(u.x, cy, FH * .62, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
    ctx.strokeStyle = '#ff2f5c'; ctx.beginPath(); ctx.arc(u.x, cy, FH * .62, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    ctx.restore();
  } else if (S.power > 0) {
    ctx.strokeStyle = Math.floor(S.t * 10) % 2 ? '#ffc21a' : '#ffffff'; ctx.lineWidth = 3;
    ctx.strokeRect(u.x - FW / 2 - 6, gy - FH - 6, FW + 12, FH + 12);
  }
  if (B.act && B.act.t < ACT_WARN[B.act.type]) {
    ctx.save(); ctx.setLineDash([10, 10]); ctx.lineDashOffset = -S.t * 60; ctx.lineWidth = 4;
    ctx.strokeStyle = Math.floor(S.t * 14) % 2 ? '#ffc21a' : '#ffffff';
    ctx.strokeRect(u.x - FW / 2 - 12, gy - FH - 12, FW + 24, FH + 24);
    ctx.restore();
  }
  drawFusedBody(B, u, gy, FUSED_K);
  if (B.exhaust > 0) drawDizzy(u.x, gy - FH - 18);
  if (B.stun > 0) drawNet(u.x, cy, 70);
}
function drawPops() {
  ctx.textAlign = 'center'; ctx.font = '800 30px "Baloo 2", sans-serif'; ctx.lineWidth = 5; ctx.strokeStyle = '#14141a';
  for (const q of S.pops) {
    ctx.globalAlpha = clamp(q.t / .4, 0, 1);
    ctx.strokeText(q.text, q.x, q.y); ctx.fillStyle = q.c; ctx.fillText(q.text, q.x, q.y);
  }
  ctx.globalAlpha = 1;
}
function drawFlash() {
  if (S.flash <= 0) return;
  ctx.fillStyle = `rgb(255 255 255 / ${Math.min(1, S.flash).toFixed(2)})`;
  ctx.fillRect(S.cam.x - 10, S.cam.y - 10, viewW + 20, VIEW_H + 20);
}
// Sao xoay trên đầu: boss đang kiệt sức, đánh lúc này sát thương ×2
function drawDizzy(x, y) {
  for (let i = 0; i < 3; i++) {
    const a = S.t * 5 + i * Math.PI * 2 / 3;
    starPath(x + Math.cos(a) * 22, y + Math.sin(a) * 6, 7);
    ctx.fillStyle = '#ffc21a'; ctx.fill(); ctx.strokeStyle = '#a86a00'; ctx.lineWidth = 2; ctx.stroke();
  }
}
// Lưới điện quấn quanh mục tiêu
function drawNet(x, y, r) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(S.t * .5);
  ctx.strokeStyle = Math.floor(S.t * 12) % 2 ? '#fff27a' : '#ffffff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.arc(0, 0, r * .55, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  ctx.stroke();
  ctx.restore();
}
function drawBoss() {
  const B = S.boss;
  drawHazards(B);
  if (B.dead) return;
  if (B.fuse) { drawFuse(B); return; }
  if (B.phase === 4) { drawFused(B); return; }
  const gy = ARENA.floor;
  if (B.ts > 0) drawSeal();
  const C = B.cut, u = B.units[0];
  const tele = B.act && B.act.t < ACT_WARN[B.act.type];
  const shake = C && !C.burst ? Math.sin(S.t * 80) * (2 + C.t * 4) : 0;
  const x = u.x + shake + (tele ? Math.sin(S.t * 70) * 2 : 0), fy = u.y, cy = fy - 56;
  const [GLOW] = devilColors(u);
  // bóng đổ dưới đất khi đang bay
  if (fy < gy - 4 && !u.hidden) {
    const k = clamp(1 - (gy - fy) / 300, .3, 1);
    ctx.fillStyle = 'rgb(0 0 0 / .25)';
    ctx.beginPath(); ctx.ellipse(x, gy - 2, 34 * k, 7 * k, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (B.phase >= 2 && !C) {
    const pr = 62 + Math.sin(S.t * 6) * 6;
    ctx.fillStyle = u.kind === 'ice' ? 'rgb(127 240 255 / .18)' : u.kind === 'zag' ? 'rgb(176 76 255 / .2)' : 'rgb(255 47 92 / .2)';
    ctx.beginPath(); ctx.arc(x, cy, pr, 0, Math.PI * 2); ctx.fill();
  }
  if (tele) {
    // báo trước chiêu: vòng nét đứt quanh boss
    ctx.save(); ctx.setLineDash([10, 10]); ctx.lineDashOffset = -S.t * 60;
    ctx.strokeStyle = Math.floor(S.t * 14) % 2 ? GLOW : '#ffffff'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x, cy, 70, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    if (B.act.type === 'dash') {
      // đường lao sắp tới
      ctx.fillStyle = Math.floor(S.t * 16) % 2 ? 'rgb(255 47 92 / .45)' : 'rgb(255 255 255 / .3)';
      const d = B.act.dir, x0 = d > 0 ? x : ARENA.l, x1 = d > 0 ? ARENA.r : x;
      ctx.fillRect(x0, gy - 30, x1 - x0, 8);
    }
  }
  if (B.act && B.act.type === 'slam' && B.act.jumped && !B.act.landed) {
    // điểm rơi của cú đập đất
    ctx.strokeStyle = Math.floor(S.t * 16) % 2 ? '#ff7b39' : '#ffffff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(B.act.tx, gy - 3, 40, 8, 0, 0, Math.PI * 2); ctx.stroke();
  }
  drawLasers(B);
  (u.kind === 'zag' ? drawZagred : drawDevil)(u, B, x, fy);
  if (B.exhaust > 0) drawDizzy(x, fy - BOSS_H - 16);
  if (B.stun > 0) drawNet(x, cy, 48);
  if (C && !C.burst) {
    // Lilith nứt ra, ánh đỏ bên trong lan dần
    const k = C.t / CUT.burst;
    ctx.fillStyle = `rgb(255 47 92 / ${(.15 + k * .45).toFixed(2)})`;
    ctx.beginPath(); ctx.arc(x, cy - 10, 30 + k * 40, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff2f5c'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 4, gy - 100); ctx.lineTo(x + 6, gy - 80); ctx.lineTo(x - 3, gy - 60); ctx.lineTo(x + 5, gy - 30);
    ctx.moveTo(x + 6, gy - 80); ctx.lineTo(x + 16, gy - 74); ctx.moveTo(x - 3, gy - 60); ctx.lineTo(x - 14, gy - 52);
    ctx.stroke();
  }
  if (C && C.appear && !C.struck) {
    // Naamah vung vuốt: vòng đỏ thu hẹp quanh Pikachu báo hiệu đòn đánh
    const k = (C.t - CUT.appear) / (CUT.strike - CUT.appear), b = S.ball;
    ctx.strokeStyle = Math.floor(S.t * 16) % 2 ? '#ff2f5c' : '#ffffff'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(b.x, b.y, R + 60 * (1 - k) + 6, 0, Math.PI * 2); ctx.stroke();
  }
  if (C && C.struck && C.t < CUT.strike + .3) {
    const b = S.ball, k = (C.t - CUT.strike) / .3;
    ctx.strokeStyle = `rgb(255 47 92 / ${(1 - k).toFixed(2)})`; ctx.lineWidth = 5;
    for (const o of [-14, 0, 14]) { ctx.beginPath(); ctx.moveTo(b.x - 30, b.y - 30 + o); ctx.lineTo(b.x + 30, b.y + 20 + o); ctx.stroke(); }
  }
  // mũi tên chỉ chỗ giẫm: chỉ hiện khi boss đang ở mặt đất và có thể giẫm
  if (!B.inv && !B.ts && !C && S.fight && fy >= gy - 4 && (B.exhaust > 0 || B.stun > 0 || u.kind === 'fire')) {
    const ay = fy - BOSS_H - (B.exhaust > 0 ? 50 : 34) + Math.sin(S.t * 6) * 6;
    ctx.fillStyle = '#ffc21a'; ctx.strokeStyle = '#14301c'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 12, ay - 10); ctx.lineTo(x + 12, ay - 10); ctx.lineTo(x, ay + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
}
function drawHazards(B) {
  const gy = ARENA.floor, blink = Math.floor(S.t * 14) % 2;
  for (const h of B.hazards) {
    const x0 = h.x - h.w / 2;
    if (h.type === 'puddle') {
      // vũng băng trơn
      ctx.fillStyle = 'rgb(160 230 255 / .55)';
      ctx.beginPath(); ctx.ellipse(h.x, gy - 3, h.w / 2, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgb(255 255 255 / .8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(h.x - 50, gy - 5); ctx.lineTo(h.x - 20, gy - 5); ctx.moveTo(h.x + 10, gy - 3); ctx.lineTo(h.x + 50, gy - 3); ctx.stroke();
      continue;
    }
    if (h.warn > 0) {
      // khung báo trước chỗ sắp trồi lên
      ctx.save(); ctx.setLineDash([8, 6]);
      ctx.strokeStyle = blink ? (h.dark ? '#b04cff' : h.type === 'spike' ? '#7ff0ff' : '#ff7b39') : '#ffffff'; ctx.lineWidth = 3;
      ctx.strokeRect(x0, gy - h.h, h.w, h.h);
      ctx.restore();
      ctx.fillStyle = h.dark ? 'rgb(176 76 255 / .3)' : h.type === 'spike' ? 'rgb(127 240 255 / .25)' : 'rgb(255 123 57 / .25)';
      ctx.fillRect(x0, gy - 6, h.w, 6);
      continue;
    }
    if (h.type === 'spike') {
      for (let k = 0; k < 4; k++) {
        const bx = x0 + k * h.w / 4, tip = h.h * (.75 + .25 * ((k * 7) % 3) / 2);
        ctx.beginPath(); ctx.moveTo(bx, gy); ctx.lineTo(bx + h.w / 8, gy - tip); ctx.lineTo(bx + h.w / 4, gy); ctx.closePath();
        ctx.fillStyle = h.dark ? '#2a1238' : '#7ff0ff'; ctx.fill(); ctx.strokeStyle = h.dark ? '#c98cff' : '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
      }
    } else if (h.type === 'pillar') {
      ctx.fillStyle = h.dark ? 'rgb(120 40 200 / .45)' : 'rgb(255 74 28 / .55)'; ctx.fillRect(x0 - 6, gy - h.h - 10, h.w + 12, h.h + 10);
      for (let y = gy; y > gy - h.h; y -= 18) {
        const wob = Math.sin(S.t * 30 + y) * 4;
        ctx.fillStyle = h.dark ? '#1a0a26' : '#ff4a1c'; ctx.beginPath(); ctx.arc(h.x + wob, y - 9, h.w / 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = h.dark ? '#b04cff' : '#ffd23f'; ctx.beginPath(); ctx.arc(h.x + wob, y - 9, h.w / 4, 0, Math.PI * 2); ctx.fill();
      }
    } else if (h.type === 'trail' || h.type === 'fire') {
      const fade = clamp(h.t / .4, 0, 1);
      ctx.globalAlpha = fade;
      for (let k = 0; k < 3; k++) {
        const fx = x0 + 6 + k * (h.w - 12) / 2, fh = h.h * (.7 + .3 * Math.sin(S.t * 20 + k * 2 + h.x));
        ctx.fillStyle = h.dark ? '#7a2ad0' : '#ff4a1c'; ctx.beginPath(); ctx.moveTo(fx - 7, gy); ctx.quadraticCurveTo(fx, gy - fh * 1.4, fx + 7, gy); ctx.fill();
        ctx.fillStyle = h.dark ? '#e6c8ff' : '#ffd23f'; ctx.beginPath(); ctx.moveTo(fx - 3, gy); ctx.quadraticCurveTo(fx, gy - fh * .8, fx + 3, gy); ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (h.type === 'wave') {
      // sóng chấn động lan trên mặt đất
      ctx.fillStyle = 'rgb(255 123 57 / .5)';
      ctx.beginPath(); ctx.ellipse(h.x, gy, h.w * .9, h.h, 0, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(h.x, gy, h.w * .6, h.h * .8, 0, Math.PI, 0); ctx.stroke();
    }
  }
  const W = B.sweep;
  if (W) {
    if (W.warn > 0) {
      ctx.save(); ctx.setLineDash([10, 8]);
      ctx.strokeStyle = blink ? '#ff2f5c' : '#7ff0ff'; ctx.lineWidth = 4;
      ctx.strokeRect(W.x - 20, gy - SWEEP_H, 40, SWEEP_H);
      ctx.restore();
    } else {
      const fl = Math.sin(S.t * 50) * 3;
      ctx.fillStyle = 'rgb(201 182 255 / .4)'; ctx.fillRect(W.x - 30 - fl, gy - SWEEP_H - 10, 60 + fl * 2, SWEEP_H + 10);
      ctx.fillStyle = '#ff2f5c'; ctx.fillRect(W.x - 20, gy - SWEEP_H, 20, SWEEP_H);
      ctx.fillStyle = '#7ff0ff'; ctx.fillRect(W.x, gy - SWEEP_H, 20, SWEEP_H);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(W.x - 5, gy - SWEEP_H, 10, SWEEP_H);
    }
  }
}
function drawLasers(B) {
  if (!B.ts) return;
  const top = ARENA.floor - LASER_H, h = LASER_H;
  for (const u of B.units) {
    const [lo, hi] = laserSpan(u), ice = u.kind === 'ice';
    const [GLOW, GLOW2] = devilColors(u);
    if (B.ts > LASER_AT && B.ts <= LASER_AT + LASER_CHARGE) {
      const k = 1 - (B.ts - LASER_AT) / LASER_CHARGE, hx = u.x + u.dir * (BOSS_W / 2 + 18);
      if (Math.floor(S.t * 16) % 2) { ctx.fillStyle = GLOW; ctx.globalAlpha = .5; ctx.fillRect(lo, top + h / 2 - 2, hi - lo, 4); ctx.globalAlpha = 1; }
      ctx.strokeStyle = GLOW; ctx.lineWidth = 2; ctx.strokeRect(lo, top, hi - lo, h);
      ctx.fillStyle = GLOW; ctx.beginPath(); ctx.arc(hx, top + h / 2, 6 + k * 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(hx, top + h / 2, 3 + k * 10, 0, Math.PI * 2); ctx.fill();
    }
    if (laserOn(B)) {
      const fl = Math.sin(S.t * 60) * 4;
      ctx.fillStyle = ice ? 'rgb(127 240 255 / .45)' : 'rgb(255 40 90 / .45)';
      ctx.fillRect(lo, top - 10 - fl, hi - lo, h + 10 + fl);
      ctx.fillStyle = GLOW; ctx.fillRect(lo, top, hi - lo, h);
      ctx.fillStyle = GLOW2; ctx.fillRect(lo, top + h * .25, hi - lo, h * .5);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(lo, top + h * .4 + fl / 2, hi - lo, h * .2);
    }
  }
}
function drawBullets() {
  for (const u of S.bullets) {
    if (u.kind === 'ice') {
      // mũi băng, xoay theo hướng bay
      ctx.save(); ctx.translate(u.x, u.y); ctx.rotate(Math.atan2(u.vy || 0, u.vx));
      ctx.fillStyle = 'rgb(216 251 255 / .4)'; ctx.fillRect(-40, -2, 30, 4);
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(0, -6); ctx.lineTo(-12, 0); ctx.lineTo(0, 6); ctx.closePath();
      ctx.fillStyle = '#7ff0ff'; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    } else if (u.kind === 'dark') {
      // cầu bóng tối của Zagred
      ctx.fillStyle = 'rgb(176 76 255 / .35)'; ctx.beginPath(); ctx.arc(u.x, u.y, (u.r || 7) + 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a0a26'; ctx.beginPath(); ctx.arc(u.x, u.y, (u.r || 7) + 1, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c98cff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(u.x, u.y, (u.r || 7) + 1, S.t * 8, S.t * 8 + 4); ctx.stroke();
    } else {
      // cầu lửa (ném vòng cung hoặc bắn thẳng)
      const d = Math.atan2(u.vy || 0, u.vx);
      ctx.fillStyle = 'rgb(255 120 40 / .45)';
      ctx.beginPath(); ctx.arc(u.x - Math.cos(d) * 14, u.y - Math.sin(d) * 14, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff4a1c'; ctx.beginPath(); ctx.arc(u.x, u.y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(u.x, u.y, 4, 0, Math.PI * 2); ctx.fill();
    }
  }
}
function drawFlyers() {
  for (const f of S.flyers) {
    if (!f.alive) continue;
    const st = f.stun > 0;
    ctx.save(); ctx.translate(f.x, f.y);
    if (f.type === 'bat') {
      const flap = st ? .2 : Math.sin(S.t * 18 + f.ax) * .6;
      ctx.fillStyle = '#2a1636'; ctx.strokeStyle = '#120818'; ctx.lineWidth = 2;
      for (const sd of [-1, 1]) {
        ctx.save(); ctx.scale(sd, 1); ctx.rotate(flap);
        ctx.beginPath(); ctx.moveTo(4, -2); ctx.lineTo(26, -14); ctx.lineTo(30, 0); ctx.lineTo(22, -3); ctx.lineTo(16, 4); ctx.lineTo(9, 0); ctx.lineTo(4, 6); ctx.closePath();
        ctx.fill(); ctx.stroke(); ctx.restore();
      }
      ctx.beginPath(); ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-7, -7); ctx.lineTo(-4, -16); ctx.lineTo(-1, -9); ctx.moveTo(7, -7); ctx.lineTo(4, -16); ctx.lineTo(1, -9); ctx.fill();
      ctx.fillStyle = '#ff2f5c'; ctx.fillRect(-5, -3, 3, 3); ctx.fillRect(2, -3, 3, 3);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-3, 4, 2, 3); ctx.fillRect(1, 4, 2, 3);
    } else if (f.type === 'bird') {
      ctx.scale(f.dir, 1);
      const flap = st ? 0 : Math.sin(S.t * 10 + f.ax) * .5;
      ctx.fillStyle = '#bfefff'; ctx.strokeStyle = '#2a6f8a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.rotate(-flap); ctx.beginPath(); ctx.moveTo(-4, -4); ctx.lineTo(-18, -22); ctx.lineTo(6, -6); ctx.closePath(); ctx.fillStyle = '#7ff0ff'; ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.fillStyle = '#ffc21a'; ctx.beginPath(); ctx.moveTo(15, -2); ctx.lineTo(24, 1); ctx.lineTo(15, 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#14141a'; ctx.fillRect(8, -5, 3, 3);
      ctx.fillStyle = '#7ff0ff'; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-26, -6); ctx.lineTo(-24, 6); ctx.closePath(); ctx.fill();
    } else {
      // ma lửa bán trong suốt
      ctx.globalAlpha = .75 + Math.sin(S.t * 8 + f.ax) * .15;
      ctx.scale(f.dir || 1, 1);
      ctx.fillStyle = '#ff6a2a';
      ctx.beginPath(); ctx.moveTo(-16, 10);
      ctx.quadraticCurveTo(-20, -14, 0, -24); ctx.quadraticCurveTo(20, -14, 16, 10);
      for (let k = 0; k < 4; k++) ctx.lineTo(16 - (k + .5) * 8, 10 + (k % 2 ? 0 : 8) + Math.sin(S.t * 10 + k) * 2);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.ellipse(0, -2, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#14141a'; ctx.beginPath(); ctx.ellipse(-4, -4, 2.5, 4, 0, 0, Math.PI * 2); ctx.ellipse(5, -4, 2.5, 4, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    if (st) drawNet(f.x, f.y, f.r + 8);
    // chim sắp thả cột băng: bóng đổ báo trước dưới đất
    if (f.type === 'bird' && !st && f.dropT < .6) {
      const gy = groundYAt(f.x);
      if (gy != null) { ctx.fillStyle = 'rgb(0 0 0 / .3)'; ctx.beginPath(); ctx.ellipse(f.x, gy - 2, 14, 4, 0, 0, Math.PI * 2); ctx.fill(); }
    }
  }
}
function drawIcicles() {
  for (const c of S.icicles) {
    const gy = groundYAt(c.x);
    if (gy != null) {
      const k = clamp(1 - (gy - c.y) / 300, .3, 1);
      ctx.fillStyle = 'rgb(0 0 0 / .35)'; ctx.beginPath(); ctx.ellipse(c.x, gy - 2, 16 * k, 4, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.beginPath(); ctx.moveTo(c.x - 7, c.y - 14); ctx.lineTo(c.x + 7, c.y - 14); ctx.lineTo(c.x, c.y + 14); ctx.closePath();
    ctx.fillStyle = '#7ff0ff'; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
  }
}
function drawOrb(x, y, r) {
  ctx.fillStyle = 'rgb(255 242 122 / .3)'; ctx.beginPath(); ctx.arc(x, y, r * 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff27a'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x - r * .25, y - r * .25, r * .45, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = Math.floor(S.t * 30) % 2 ? '#ffffff' : '#ffc21a'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = S.t * 12 + i * Math.PI / 2;
    ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a + .3) * (r + 8), y + Math.sin(a + .3) * (r + 8));
  }
  ctx.stroke();
}
function drawOrbs() {
  for (const o of S.orbs) (o.kind === 'weed' ? drawWeeds : drawOrb)(o.x, o.y, o.r);
  for (const w of S.webs) drawNet(w.x, w.y, w.r);
  drawCharFx();
}
// Đạn của Chiikawa (gậy), Rimuru (lưỡi nước), Stelle (ngôi sao)
function drawShot(q) {
  const d = Math.sign(q.vx) || 1;
  ctx.save(); ctx.translate(q.x, q.y);
  if (q.kind === 'star') {
    ctx.strokeStyle = 'rgb(255 214 110 / .5)'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(-d * 44, 0); ctx.lineTo(0, 0); ctx.stroke();
    ctx.rotate(S.t * 14 * d);
    starPath(0, 0, 12); ctx.fillStyle = '#ffd65e'; ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
  } else if (q.kind === 'antomic') {
    // Antomic: cầu năng lượng tím kéo vệt
    ctx.fillStyle = 'rgb(190 120 255 / .35)'; ctx.fillRect(Math.min(0, -d * 40), -6, 40, 12);
    ctx.fillStyle = 'rgb(190 120 255 / .45)'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9a6ff'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
  } else if (q.kind === 'punch') {
    // Đấm Galick: luồng gió đấm
    ctx.scale(d, 1);
    ctx.strokeStyle = 'rgb(255 255 255 / .8)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(-6, 0, 12, -1, 1); ctx.stroke();
    ctx.fillStyle = '#ffe9a8'; starPath(0, 0, 8); ctx.fill();
  } else if (q.kind === 'rod') {
    // Hắc Bổng của Pain: thanh sắt đen, đầu tròn có rãnh xoắn
    ctx.scale(d, 1);
    ctx.strokeStyle = 'rgb(180 140 255 / .35)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(-14, 0); ctx.stroke();
    ctx.fillStyle = '#1a1a22'; ctx.fillRect(-14, -2, 26, 4);
    ctx.beginPath(); ctx.arc(-14, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6a6a7a'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 4; i++) { ctx.moveTo(-8 + i * 5, -2); ctx.lineTo(-6 + i * 5, 2); } ctx.stroke();
  } else if (q.kind === 'ki') {
    // Chưởng KI của Goku: cầu năng lượng xanh trắng kéo vệt
    ctx.scale(d, 1);
    ctx.fillStyle = 'rgb(120 190 255 / .35)'; ctx.beginPath(); ctx.moveTo(-36, -4); ctx.lineTo(0, -9); ctx.lineTo(0, 9); ctx.lineTo(-36, 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgb(120 190 255 / .5)'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#bfe4ff'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
  } else if (q.kind === 'wind') {
    // Lưỡi Gió của Yuno: lưỡi liềm gió xanh kéo vệt
    ctx.scale(d, 1);
    ctx.strokeStyle = 'rgb(160 240 200 / .45)'; ctx.lineWidth = 2;
    for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(-i * 14, -6 + i * 3); ctx.lineTo(-i * 14 - 12, -6 + i * 3); ctx.stroke(); }
    for (const [w, c] of [[7, 'rgb(120 220 160 / .6)'], [3, '#e9fff3']]) {
      ctx.strokeStyle = c; ctx.lineWidth = w;
      ctx.beginPath(); ctx.ellipse(-4, 0, 10, 18, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    }
  } else if (q.kind === 'water') {
    ctx.scale(d, 1);
    ctx.fillStyle = 'rgb(160 230 255 / .5)';
    for (let i = 1; i <= 3; i++) ctx.fillRect(-i * 12, -2 + Math.sin(q.seed + i) * 3, 6, 3);
    for (const [w, c] of [[6, '#3fb4ef'], [2.5, '#e2f9ff']]) {
      ctx.strokeStyle = c; ctx.lineWidth = w;
      ctx.beginPath(); ctx.ellipse(0, 0, 9, 16, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    }
  } else {
    // gậy Chiikawa xoay tít, kèm chữ "bốp" hình sao
    ctx.rotate(S.t * 30 * d);
    ctx.fillStyle = '#9a6a3a'; ctx.fillRect(-10, -2, 20, 4);
    ctx.fillStyle = '#ffffff'; starPath(0, 0, 7); ctx.fill();
  }
  ctx.restore();
}
function drawWeeds(x, y, r) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(S.t * 8);
  ctx.fillStyle = '#2f8f2a';
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * .4, Math.sin(a) * r * .4);
    ctx.lineTo(Math.cos(a - .3) * r * 1.4, Math.sin(a - .3) * r * 1.4); ctx.lineTo(Math.cos(a + .3) * r * 1.2, Math.sin(a + .3) * r * 1.2);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#7be35a'; ctx.beginPath(); ctx.arc(0, 0, r * .8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a5a30'; ctx.fillRect(-2, r * .3, 4, r * .8);
  ctx.restore();
}
function drawCharFx() {
  const b = S.ball;
  // Xayda: vụ nổ Tự phát nổ
  if (S.blast) {
    const k = 1 - S.blast.t / .7;
    ctx.globalAlpha = S.blast.t / .7;
    ctx.fillStyle = 'rgb(255 230 160 / .5)';
    ctx.beginPath(); ctx.arc(S.blast.x, S.blast.y, 40 + k * 300, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(S.blast.x, S.blast.y, 30 + k * 340, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // Chiikawa khóc oà: vòng nước lan ra
  if (S.cry > 0) {
    const k = 1 - S.cry / .9;
    ctx.globalAlpha = S.cry / .9;
    for (const [m, c] of [[1, '#7cc8ff'], [.65, '#d6efff']]) {
      ctx.strokeStyle = c; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(b.x, b.y, 30 + k * 160 * m, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // Rimuru Kẻ Săn Mồi: khối slime tối khép lại
  if (S.maw) {
    const m = S.maw, k = m.t / .4, r = 20 + 90 * Math.sin(k * Math.PI);
    ctx.fillStyle = 'rgb(20 50 140 / .45)';
    ctx.beginPath(); ctx.arc(m.x, m.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5ec8f2'; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(m.x, m.y, r * (.4 + i * .25), S.t * 6 + i * 2, S.t * 6 + i * 2 + 3.5); ctx.stroke(); }
  }
  // Rimuru Sét Đen
  for (const c of S.columns) {
    const gy = groundYAt(c.x) ?? S.cam.y + VIEW_H;
    const pts = [];
    for (let y = S.cam.y - 20, k = 0; y < gy; y += 36, k++) pts.push([c.x + Math.sin(c.seed + k * 1.9 + S.t * 30) * 22, y]);
    pts.push([c.x, gy]);
    ctx.globalAlpha = clamp(c.t / .3, 0, 1);
    for (const [w, col] of [[22, 'rgb(120 40 200 / .35)'], [9, '#1a0a2a'], [3, '#c9a0ff']]) {
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineJoin = 'round';
      ctx.beginPath(); pts.forEach(([px, py], j) => j ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // Stelle RIP Home Run: sóng sao hình lưỡi liềm
  // sóng lưỡi liềm: Stelle (sao vàng), Asta (chém đen viền xanh lá), Yuno (gió xanh)
  const WAVE_PAL = {
    asta: [[18, 'rgb(20 20 24 / .45)'], [8, '#16161a'], [2.5, '#9cff7a']],
    yuno: [[16, 'rgb(150 240 190 / .35)'], [6, '#7fe0a8'], [2.5, '#ffffff']],
  };
  for (const w of S.waves) {
    const d = Math.sign(w.vx) || 1;
    ctx.save(); ctx.translate(w.x, w.y); ctx.scale(d, 1);
    ctx.globalAlpha = clamp(w.life / .3, 0, 1);
    for (const [lw, c] of WAVE_PAL[w.kind] || [[16, 'rgb(255 214 110 / .35)'], [7, '#ffd65e'], [2.5, '#ffffff']]) {
      ctx.strokeStyle = c; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.ellipse(0, -w.h * .35, w.r, w.h, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    }
    if (w.kind === 'asta') {
      ctx.fillStyle = '#16161a';
      for (let i = 0; i < 4; i++) ctx.fillRect(-14 - i * 13, -w.h * .35 + Math.sin(S.t * 12 + i * 2) * w.h * .7, 8, 3);
    } else if (w.kind === 'yuno') {
      ctx.strokeStyle = 'rgb(255 255 255 / .8)'; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-16 - i * 16, -w.h * .35 + Math.sin(S.t * 9 + i * 2) * w.h * .6, 6, 0, Math.PI * 1.4); ctx.stroke(); }
    } else {
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 4; i++) { starPath(-10 - i * 14, -w.h * .35 + Math.sin(S.t * 10 + i * 2) * w.h * .7, 5); ctx.fill(); }
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  // Asta: nhát chém Kiếm Diệt Quỷ, Black Hurricane
  for (const s of S.slashes) {
    const k = 1 - s.t / .2;
    ctx.save(); ctx.translate(s.x, s.y); ctx.scale(s.d, 1);
    ctx.globalAlpha = clamp(s.t / .12, 0, 1);
    for (const [lw, c] of [[14, 'rgb(20 20 24 / .5)'], [6, '#16161a'], [2, '#9cff7a']]) {
      ctx.strokeStyle = c; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.arc(0, 0, s.r, -1.6 + k * .4, -1.6 + .6 + k * 2.6); ctx.stroke();
    }
    ctx.restore();
  }
  if (S.spin > 0) {
    const k = 1 - S.spin / .45;
    ctx.globalAlpha = clamp(S.spin / .2, 0, 1);
    for (let i = 0; i < 3; i++) {
      for (const [lw, c] of [[12, 'rgb(20 20 24 / .4)'], [5, '#16161a'], [2, '#9cff7a']]) {
        ctx.strokeStyle = c; ctx.lineWidth = lw;
        const a = k * 14 + i * 2.1;
        ctx.beginPath(); ctx.ellipse(b.x, b.y - 8, 70 + i * 22, 30 + i * 10, 0, a, a + 1.6); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }
  // Yuno: Lốc Xoáy Chọc Trời
  for (const o of S.ytor) {
    ctx.globalAlpha = clamp(o.life / .3, 0, 1);
    for (let i = 0; i < 9; i++) {
      const y = o.y - 8 - i * 19, w = 16 + i * 5, a = S.t * 16 + i * .9;
      ctx.strokeStyle = i % 2 ? 'rgb(240 255 248 / .85)' : 'rgb(120 220 160 / .75)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(o.x + Math.sin(S.t * 6 + i) * 4, y, w, 6, 0, a, a + 4.2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  drawPainFx();
  drawGokuFx();
  // Kiếm khách: ảnh hiệu ứng gốc và ba cơn lốc Tam kiếm
  for (const o of S.ktor) drawKK('loc', Math.floor(o.ft * 30) % KK.loc.n, o.x, o.y, 80 * KE, 80 * KE, 1);
  for (const f of S.kfx) {
    let i = Math.floor(f.t * f.fps);
    i = f.seq ? f.seq[Math.min(i, f.seq.length - 1)] : f.loop ? i % KK[f.s].n : Math.min(i, KK[f.s].n - 1);
    drawKK(f.s, i, f.ball ? b.x + f.x : f.x, f.ball ? b.y + f.y : f.y, f.w, f.h, f.flip);
  }
}
// Quả cầu điện đang nạp trên tay Pikachu
function drawCharge() {
  if (!S.charging || S.chargeT < BALL_HOLD || S.dead || CHAR === 'kiem') return;
  const b = S.ball, k = clamp((S.chargeT - BALL_HOLD) / (BALL_FULL - BALL_HOLD), 0, 1);
  if (CHAR === 'chii') drawWeeds(b.x + (b.face || 1) * 22, b.y - 18, 6 + k * 8);
  else if (CHAR === 'pain') {
    // Vạn Tượng Thiên Dẫn đang tụ: vòng hút quanh tay
    const x = b.x + (b.face || 1) * 22, y = b.y - 22;
    ctx.strokeStyle = 'rgb(255 190 120 / .8)'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x, y, 6 + ((S.t * 60 + i * 12) % 36) * (1 - k * .3), 0, Math.PI * 2); ctx.stroke(); }
  }
  else if (CHAR === 'goku') {
    // Kamehameha đang tụ: quả cầu xanh giữa hai bàn tay khum ở hông
    const x = b.x - (b.face || 1) * 8, y = b.y - 20, r = 5 + k * 9;
    ctx.fillStyle = 'rgb(90 170 255 / .35)'; ctx.beginPath(); ctx.arc(x, y, r * 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5fb8ff'; ctx.beginPath(); ctx.arc(x, y, r * 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e6f6ff'; ctx.beginPath(); ctx.arc(x, y, r * .6, 0, Math.PI * 2); ctx.fill();
  }
  else if (CHAR === 'asta' || CHAR === 'yuno') {
    // Asta: kiếm tụ ma lực đen · Yuno: gió xoáy trên tay
    const x = b.x + (b.face || 1) * 24, y = b.y - 20, r = 8 + k * 12, as = CHAR === 'asta';
    ctx.fillStyle = as ? 'rgb(20 20 24 / .35)' : 'rgb(120 220 160 / .3)';
    ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = as ? '#9cff7a' : '#e9fff3'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) { const a = S.t * 14 + i * 2.1; ctx.beginPath(); ctx.arc(x, y, r * (.5 + i * .25), a, a + 2.4); ctx.stroke(); }
  }
  else if (CHAR !== 'pika') {
    // Rimuru tụ Sét Đen, Stelle tụ sao ở đầu gậy
    const x = b.x + (b.face || 1) * (CHAR === 'stelle' ? -14 : 24), y = b.y - (CHAR === 'stelle' ? 44 : 18), r = 5 + k * 10;
    ctx.fillStyle = CHAR === 'stelle' ? 'rgb(255 214 110 / .35)' : 'rgb(120 40 200 / .4)';
    ctx.beginPath(); ctx.arc(x, y, r * 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = CHAR === 'stelle' ? '#ffd65e' : '#1a0a2a';
    starPath(x, y, r); ctx.fill();
    ctx.strokeStyle = CHAR === 'stelle' ? '#ffffff' : '#c9a0ff'; ctx.lineWidth = 2; ctx.stroke();
  } else drawOrb(b.x + (b.face || 1) * 26, b.y - 16, 6 + k * 12);
  if (k >= 1 && Math.floor(S.t * 10) % 2) {
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(b.x + (b.face || 1) * 26, b.y - 16, 26, 0, Math.PI * 2); ctx.stroke();
  }
}
// 100.000 Vôn: các tia sét giáng từ trời xuống
function drawVolt() {
  if (S.voltFx <= 0) return;
  const kind = S.ultKind;
  if (kind === 'chii') { drawFriends(); return; }
  // Pikachu: sét ngoằn ngoèo · Stelle: sao băng vàng · Rimuru: Megiddo tia sáng thẳng qua thấu kính nước
  const pal = {
    pika: [[16, 'rgb(255 242 122 / .35)'], [7, '#fff27a'], [3, '#ffffff']],
    pikaZ: [[30, 'rgb(255 225 74 / .35)'], [12, '#ffd21f'], [4, '#ffffff']],
    stelle: [[18, 'rgb(255 214 110 / .35)'], [8, '#ffd65e'], [3, '#ffffff']],
    rimuru: [[12, 'rgb(170 240 255 / .35)'], [5, '#e8fbff'], [2, '#ffffff']],
    asta: [[26, 'rgb(15 15 18 / .5)'], [12, '#16161a'], [3, '#9cff7a']],
    yuno: [[20, 'rgb(150 240 190 / .3)'], [7, '#9cf0b4'], [2.5, '#ffffff']],
  }[kind];
  const jag = kind === 'pika' || kind === 'pikaZ' ? 18 : kind === 'yuno' ? 26 : kind === 'asta' ? 6 : 0;
  ctx.globalAlpha = clamp(S.voltFx / .5, 0, 1);
  for (const [i, x] of S.voltStrikes.entries()) {
    const gy = groundYAt(x) ?? S.cam.y + VIEW_H;
    const pts = [];
    for (let y = S.cam.y - 20, k = 0; y < gy; y += 40, k++) pts.push([x + Math.sin(i * 3.1 + k * 1.7 + S.t * 30) * jag, y]);
    pts.push([x, gy]);
    for (const [w, c] of pal) {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineJoin = 'round';
      ctx.beginPath(); pts.forEach(([px, py], j) => j ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.stroke();
    }
    if (kind === 'stelle') {
      ctx.fillStyle = '#ffd65e'; starPath(x, gy - 14, 16); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
    } else if (kind === 'rimuru') {
      ctx.strokeStyle = '#bff0ff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, S.cam.y + 40, 16, 5, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (kind === 'asta') {
      // Black Meteorite: kiếm đen cắm xuống, nứt đất toé phản ma pháp
      ctx.fillStyle = '#16161a'; ctx.strokeStyle = '#9cff7a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 9, gy - 70); ctx.lineTo(x + 9, gy - 70); ctx.lineTo(x + 7, gy - 8); ctx.lineTo(x, gy); ctx.lineTo(x - 7, gy - 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillRect(x - 16, gy - 76, 32, 6);
      ctx.strokeStyle = 'rgb(156 255 122 / .7)';
      ctx.beginPath(); ctx.ellipse(x, gy - 2, 40, 7, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (kind === 'yuno') {
      ctx.strokeStyle = 'rgb(240 255 248 / .8)'; ctx.lineWidth = 3;
      for (let j = 0; j < 3; j++) { const a = S.t * 14 + j * 2; ctx.beginPath(); ctx.ellipse(x, gy - 20 - j * 24, 22 + j * 8, 6, 0, a, a + 4); ctx.stroke(); }
    }
  }
  ctx.globalAlpha = 1;
}
// Chiêu U của Chiikawa: Hachiware và Usagi nhảy vào màn hình, mỗi chỗ đáp xuống nổ "bốp"
function drawFriends() {
  const p = 1 - S.voltFx / 1.2, cx = S.cam.x, w = viewW;
  ctx.globalAlpha = clamp(S.voltFx / .3, 0, 1);
  for (const x of S.voltStrikes) {
    const gy = groundYAt(x) ?? S.cam.y + VIEW_H;
    ctx.fillStyle = '#ffe27a'; starPath(x, gy - 20, 14 + 10 * Math.sin(p * Math.PI)); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
  }
  const pal = [
    { x: cx + w * (-.05 + p * .5), y: S.cam.y + 330 - Math.sin(p * Math.PI) * 220, body: '#ffffff', ear: 'cat' },
    { x: cx + w * (1.05 - p * .5), y: S.cam.y + 300 - Math.sin(p * Math.PI) * 260, body: '#ffe27a', ear: 'rabbit' },
  ];
  for (const f of pal) {
    ctx.save(); ctx.translate(f.x, f.y);
    ctx.fillStyle = f.body; ctx.strokeStyle = '#4a3f44'; ctx.lineWidth = 2.5;
    if (f.ear === 'rabbit') for (const ex of [-7, 7]) { ctx.beginPath(); ctx.ellipse(ex, -34, 4.5, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    else for (const ex of [-11, 11]) { ctx.beginPath(); ctx.moveTo(ex - 6, -14); ctx.lineTo(ex, -26); ctx.lineTo(ex + 6, -14); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(0, -8, 17, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (f.ear === 'cat') {
      // vệt lông xanh xám hai bên đỉnh đầu, chừa chữ V trắng ở giữa (Hachiware)
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, -8, 16, 13, 0, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#5f7fa8';
      ctx.beginPath(); ctx.moveTo(-17, -22); ctx.lineTo(-1, -22); ctx.lineTo(-3, -12); ctx.lineTo(-17, -6); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(17, -22); ctx.lineTo(1, -22); ctx.lineTo(3, -12); ctx.lineTo(17, -6); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#1a1a1a';
    for (const ex of [-6, 6]) { ctx.beginPath(); ctx.ellipse(ex, -7, 2, 2.6, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#4a3f44'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(0, -1, 3, 2.4, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
function drawTimeStop() {
  const B = S.boss;
  if (!(B.ts > 0)) return;
  ctx.fillStyle = 'rgb(30 20 60 / .3)';
  ctx.fillRect(S.cam.x - 10, S.cam.y - 10, viewW + 20, VIEW_H + 20);
  if (!S.tsEsc && !S.dead) {
    // bóng bị phong ấn: vòng sáng tím quanh bóng
    const b = S.ball;
    ctx.strokeStyle = Math.floor(S.t * 6) % 2 ? '#c9b6ff' : '#ffffff'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(b.x, b.y, R + 8, 0, Math.PI * 2); ctx.stroke();
  }
}
// Phủ màu đỏ đen lên trời và cảnh vật (nhân vật, đạn, laze vẽ sau nên giữ màu gốc)
function drawHellSky() {
  const k = S.sky;
  if (k < .01) return;
  const x = S.cam.x - 10, y = S.cam.y - 10, w = viewW + 20, h = VIEW_H + 20;
  ctx.save();
  ctx.globalAlpha = k;
  ctx.globalCompositeOperation = 'hue';          // cỏ xanh, trời xanh -> sắc đỏ
  ctx.fillStyle = '#ff1020'; ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'multiply';     // tối lại
  ctx.fillStyle = '#7a3a3a'; ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgb(10 0 2 / .85)'); g.addColorStop(.55, 'rgb(20 0 4 / .35)'); g.addColorStop(1, 'rgb(0 0 0 / 0)');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  // trăng máu
  const mx = S.cam.x + viewW * .78, my = S.cam.y + 110;
  ctx.fillStyle = 'rgb(255 40 40 / .18)';
  ctx.beginPath(); ctx.arc(mx, my, 70, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c4161c';
  ctx.beginPath(); ctx.arc(mx, my, 44, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgb(90 0 6 / .55)';
  ctx.beginPath(); ctx.arc(mx - 12, my - 8, 9, 0, Math.PI * 2); ctx.arc(mx + 14, my + 12, 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
// Biển "!" đánh dấu chỗ có mẹo
function drawTipSign(x, gy) {
  ctx.fillStyle = '#9aa3ad'; ctx.fillRect(x - 3, gy - 56, 6, 56);
  ctx.fillStyle = '#ffc21a'; ctx.strokeStyle = '#5a3416'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, gy - 104); ctx.lineTo(x + 26, gy - 60); ctx.lineTo(x - 26, gy - 60); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#14141a'; ctx.fillRect(x - 3, gy - 92, 6, 18); ctx.fillRect(x - 3, gy - 70, 6, 5);
}
function drawHearts() {
  for (const h of S.hearts) {
    if (h.got) continue;
    const y = h.y + Math.sin(S.t * 3 + h.x) * 4, k = 1 + Math.sin(S.t * 6) * .06;
    ctx.save(); ctx.translate(h.x, y); ctx.scale(k, k);
    ctx.fillStyle = 'rgb(255 80 110 / .25)'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 12); ctx.bezierCurveTo(-20, -2, -12, -18, 0, -8); ctx.bezierCurveTo(12, -18, 20, -2, 0, 12);
    ctx.fillStyle = '#ff4d6d'; ctx.fill(); ctx.strokeStyle = '#7a1028'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-9, -9, 4, 4);
    ctx.restore();
  }
}
function drawTurret() {
  const T = S.turret, gy = T.f(T.x);
  for (const q of S.tshots) {
    ctx.fillStyle = 'rgb(216 251 255 / .4)'; ctx.fillRect(q.x + 6, q.y - 2, 30, 4);
    ctx.beginPath(); ctx.moveTo(q.x - 14, q.y); ctx.lineTo(q.x, q.y - 6); ctx.lineTo(q.x + 12, q.y); ctx.lineTo(q.x, q.y + 6); ctx.closePath();
    ctx.fillStyle = '#7ff0ff'; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  if (!T.alive) {
    ctx.fillStyle = '#7a7f88'; ctx.fillRect(T.x - 24, gy - 10, 48, 10);
    return;
  }
  const fl = T.flash > 0;
  // đế đá
  ctx.fillStyle = fl ? '#ffffff' : '#8a8f98'; ctx.strokeStyle = '#3d414a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(T.x - 24, gy + 2); ctx.lineTo(T.x + 24, gy + 2); ctx.lineTo(T.x + 18, gy - 26); ctx.lineTo(T.x - 18, gy - 26); ctx.closePath(); ctx.fill(); ctx.stroke();
  // nòng pha lê băng hướng sang trái
  ctx.fillStyle = fl ? '#ffffff' : '#7ff0ff'; ctx.strokeStyle = '#d8fbff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(T.x - 30, gy - 24); ctx.lineTo(T.x - 6, gy - 32); ctx.lineTo(T.x + 10, gy - 44); ctx.lineTo(T.x + 12, gy - 24); ctx.lineTo(T.x - 6, gy - 16); ctx.closePath(); ctx.fill(); ctx.stroke();
  // vạch máu nhỏ
  for (let i = 0; i < TURRET.hp; i++) { ctx.fillStyle = i < T.hp ? '#7ff0ff' : 'rgb(255 255 255 / .25)'; ctx.fillRect(T.x - 12 + i * 14, gy - 58, 10, 4); }
}
function drawBolts() {
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const q of S.bolts) {
    if (q.kind) { drawShot(q); continue; }
    const d = Math.sign(q.vx), len = 46, segs = 6;
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const jitter = (i === 0 || i === segs) ? 0 : Math.sin(q.seed + i * 2.7 + S.t * 40) * 7;
      pts.push([q.x - d * len * (i / segs), q.y + jitter]);
    }
    for (const [w, c] of [[9, 'rgb(255 242 122 / .35)'], [4.5, '#fff27a'], [2, '#ffffff']]) {
      ctx.strokeStyle = c; ctx.lineWidth = w;
      ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    }
  }
}
function drawBall() {
  if (S.dead) return;
  if (S.safe && Math.floor(S.t * 12) % 2) return;   // nhấp nháy khi vừa hồi sinh
  const b = S.ball, sq = b.squash;
  // Vô địch: hào quang vàng nhấp nháy, nháy nhanh khi sắp hết
  const pw = S.power > 0;
  const blink = pw && S.power < .6 && Math.floor(S.t * 16) % 2;
  if (pw && !blink) {
    const pulse = 1 + Math.sin(S.t * 20) * .12;
    ctx.fillStyle = 'rgb(255 194 26 / .35)';
    ctx.beginPath(); ctx.arc(b.x, b.y, R * 1.9 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgb(255 255 255 / .45)';
    ctx.beginPath(); ctx.arc(b.x, b.y, R * 1.45 * pulse, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 6; i++) {
      const a = S.t * 8 + i * Math.PI / 3;
      ctx.fillStyle = i % 2 ? '#ffffff' : '#ffc21a';
      ctx.fillRect(b.x + Math.cos(a) * R * 1.7 - 3, b.y + Math.sin(a) * R * 1.7 - 3, 6, 6);
    }
  }
  if (S.dash) {
    for (let i = 1; i <= 3; i++) {
      ctx.globalAlpha = .3 / i; ctx.fillStyle = CHAR_COLOR[CHAR];
      ctx.beginPath(); ctx.arc(b.x - S.dash.dir * i * 16, b.y - 10, R, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // bóng đổ mềm dưới chân, nhạt dần khi nhảy cao
  const gy = groundYAt(b.x);
  if (gy != null && gy - b.y < 260) {
    const k = clamp(1 - (gy - b.y - R) / 240, .25, 1);
    ctx.fillStyle = `rgb(0 0 0 / ${(.25 * k).toFixed(2)})`;
    ctx.beginPath(); ctx.ellipse(b.x, gy - 2, R * 1.1 * k, 5 * k, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (S.amber > 0) drawAmber(b);
  if (CHAR === 'pika' && DMAX) { drawMaxCore(b, pw && !blink); return; }
  CHAR_DRAW[CHAR](b, pw && !blink);
}
const CHAR_COLOR = { pika: '#fff27a', chii: '#ffffff', rimuru: '#5ec8f2', stelle: '#ffd65e', saiyan: '#9fd8ff', kiem: '#e8f6ff', asta: '#2a2a30', yuno: '#9cf0b4', pain: '#ff9a3c', goku: '#f47b20' };
const CHAR_DRAW = { pika: drawPikachu, chii: drawChiikawa, rimuru: drawRimuru, stelle: drawStelle, saiyan: drawSaiyan, kiem: drawKiem, asta: drawAsta, yuno: drawYuno, pain: drawPain, goku: drawGoku };
// Khiên Hổ Phách của Stelle: vỏ lục giác màu hổ phách
function drawAmber(b) {
  const r = R * 1.9 + Math.sin(S.t * 6) * 2, fade = S.amber < .8 && Math.floor(S.t * 14) % 2;
  if (fade) return;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + S.t * .8; ctx.lineTo(b.x + Math.cos(a) * r, b.y - 6 + Math.sin(a) * r); }
  ctx.closePath();
  // Khiên năng lượng của Xayda màu xanh, Ngạ Quỷ Đạo của Pain màu tím
  const [fill, edge] = CHAR === 'saiyan' ? ['rgb(120 200 255 / .22)', '#7cc8ff'] : CHAR === 'pain' ? ['rgb(180 140 255 / .22)', '#b48cff'] : ['rgb(255 170 40 / .22)', '#ffb43a'];
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = edge; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = 'rgb(255 240 200 / .7)'; ctx.lineWidth = 1.5; ctx.stroke();
}
// Chiến binh Xayda (fan art hình khối): tóc đen dựng, giáp Xayda trắng vai vàng, đồ bó xanh, đuôi khỉ.
// Biến Khỉ thì thành khỉ đột khổng lồ lông nâu mắt đỏ.
function drawSaiyan(b, charged) {
  const sq = b.squash, air = !S.onGround, running = !air && Math.abs(b.vx) > 30, ph = b.run;
  const bob = running ? Math.abs(Math.sin(ph)) * 2.5 : 0, ape = S.ape > 0;
  // Tái tạo năng lượng: hào quang xanh bốc lên; Tự phát nổ: quả cầu sáng phình to
  if (S.regenOn || S.boom > 0) {
    const big = S.boom > 0 ? 1 + (1.5 - S.boom) * 1.4 : 1;
    ctx.fillStyle = S.boom > 0 ? (Math.floor(S.t * 20) % 2 ? 'rgb(255 255 255 / .55)' : 'rgb(255 220 120 / .5)') : 'rgb(120 200 255 / .3)';
    ctx.beginPath(); ctx.ellipse(b.x, b.y - 10, R * 1.5 * big, R * 2 * big, 0, 0, Math.PI * 2); ctx.fill();
    if (S.regenOn) {
      ctx.fillStyle = '#bfe6ff';
      for (let i = 0; i < 5; i++) { const y = b.y + 10 - ((S.t * 90 + i * 17) % 70); ctx.fillRect(b.x - 24 + i * 12, y, 3, 8); }
    }
  }
  ctx.save();
  ctx.translate(b.x, b.y + R - 2 + R * sq * .3);
  const k = ape ? 1.6 : 1;
  ctx.scale((b.face || 1) * (1 + sq * .4) * k, (1 - sq * .5) * k);
  ctx.translate(0, -bob);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (ape) { drawApe(running, ph, air); ctx.restore(); return; }
  const SKIN = '#ffd9b0', SUIT = '#2a3f8f', ARM = charged ? '#ffffff' : '#f2f2f2', GOLD = '#e6b422', DK = '#14141a';
  // đuôi khỉ nâu
  ctx.strokeStyle = '#7a4a2a'; ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.moveTo(-6, -17); ctx.quadraticCurveTo(-20, -18 + Math.sin(S.t * 5) * 3, -17, -6); ctx.stroke();
  // chân: đồ bó xanh, ủng trắng mũi vàng
  const legs = air ? [[-4, -.5], [4, .5]] : [[-3, Math.sin(ph) * .8], [3, Math.sin(ph + Math.PI) * .8]];
  for (const [lx, ang] of legs) {
    ctx.save(); ctx.translate(lx, -16); ctx.rotate(ang);
    ctx.fillStyle = SUIT; ctx.fillRect(-3, 0, 6, 10);
    ctx.fillStyle = '#f4f4f4'; ctx.fillRect(-3.2, 9, 6.4, 5);
    ctx.fillStyle = GOLD; ctx.fillRect(-3.2, 13, 6.4, 1.6);
    ctx.restore();
  }
  // thân: đồ bó xanh + giáp ngực trắng, cầu vai vàng
  ctx.fillStyle = SUIT; ctx.fillRect(-7, -34, 14, 18);
  ctx.fillStyle = ARM; ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-8, -34); ctx.lineTo(8, -34); ctx.lineTo(7, -20); ctx.lineTo(-7, -20); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.beginPath(); ctx.ellipse(-8, -33, 4, 3, -.3, 0, Math.PI * 2); ctx.ellipse(8, -33, 4, 3, .3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8e8e8'; ctx.fillRect(-8, -21, 16, 3);
  // tay: đấm thẳng khi ra đòn
  const punch = S.swing > 0 || S.cast > 0;
  ctx.save(); ctx.translate(5, -30); ctx.rotate(punch ? 1.57 : air ? -.4 : running ? Math.sin(ph + Math.PI) * .7 + 3 : 2.9);
  ctx.fillStyle = SUIT; ctx.fillRect(-2.2, -11, 4.4, 11);
  ctx.fillStyle = '#f4f4f4'; ctx.beginPath(); ctx.arc(0, -12, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // đầu + tóc đen dựng nhọn
  const hx = 1, hy = -41;
  ctx.fillStyle = DK;
  ctx.beginPath();
  ctx.moveTo(hx - 10, hy + 2); ctx.lineTo(hx - 14, hy - 10); ctx.lineTo(hx - 7, hy - 9); ctx.lineTo(hx - 8, hy - 20);
  ctx.lineTo(hx - 1, hy - 12); ctx.lineTo(hx + 2, hy - 23); ctx.lineTo(hx + 5, hy - 12); ctx.lineTo(hx + 11, hy - 18);
  ctx.lineTo(hx + 10, hy - 7); ctx.lineTo(hx + 11, hy); ctx.closePath(); ctx.fill();
  ctx.fillStyle = SKIN; ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(hx + 1, hy, 9.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = DK;
  ctx.beginPath(); ctx.moveTo(hx - 9, hy - 3); ctx.lineTo(hx - 4, hy - 11); ctx.lineTo(hx + 3, hy - 7); ctx.lineTo(hx + 7, hy - 11); ctx.lineTo(hx + 10, hy - 2); ctx.lineTo(hx + 6, hy - 6); ctx.lineTo(hx + 1, hy - 3); ctx.closePath(); ctx.fill();
  // mắt sắc, lông mày nhíu, miệng
  ctx.fillStyle = DK; ctx.fillRect(hx + 5, hy, 2.4, 2.4);
  ctx.strokeStyle = DK; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(hx + 3.5, hy - 2.5); ctx.lineTo(hx + 8.5, hy - 1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx + 5, hy + 5.5); ctx.lineTo(hx + 8, hy + 5); ctx.stroke();
  ctx.restore();
}
function drawApe(running, ph, air) {
  const FUR = '#6b3f22', DK = '#2a160a', SKIN = '#d9a877';
  // chân, thân to tròn, tay dài
  const legs = air ? [[-6, -.4], [6, .4]] : [[-6, Math.sin(ph) * .6], [6, Math.sin(ph + Math.PI) * .6]];
  for (const [lx, ang] of legs) { ctx.save(); ctx.translate(lx, -10); ctx.rotate(ang); ctx.fillStyle = FUR; ctx.fillRect(-4, 0, 8, 10); ctx.restore(); }
  ctx.fillStyle = FUR; ctx.strokeStyle = DK; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(0, -20, 13, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = SKIN; ctx.beginPath(); ctx.ellipse(2, -18, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(8, -26); ctx.rotate(S.swing > 0 || S.cast > 0 ? -1.5 : running ? Math.sin(ph) * .6 : .4);
  ctx.fillStyle = FUR; ctx.fillRect(-3, 0, 6, 14); ctx.restore();
  // đầu khỉ: tai, mõm, mắt đỏ, răng nanh
  const hy = -38;
  ctx.fillStyle = FUR;
  ctx.beginPath(); ctx.arc(-6, hy - 6, 3.5, 0, Math.PI * 2); ctx.arc(8, hy - 6, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(1, hy, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = SKIN; ctx.beginPath(); ctx.ellipse(5, hy + 3, 6, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff2020'; ctx.fillRect(3, hy - 4, 2.5, 2); ctx.fillRect(7.5, hy - 4, 2.5, 2);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(3.5, hy + 4, 1.5, 2); ctx.fillRect(7.5, hy + 4, 1.5, 2);
}
// Chiikawa (fan art hình khối): tròn trắng, tai nhỏ, má hồng. Gốc toạ độ ở chân, +x là hướng mặt.
function drawChiikawa(b, charged) {
  const sq = b.squash, air = !S.onGround, running = !air && Math.abs(b.vx) > 30, ph = b.run;
  const bob = running ? Math.abs(Math.sin(ph)) * 2.5 : 0;
  const W = charged ? '#fffbe0' : '#ffffff', OL = '#4a3f44', PK = '#ffb3c1';
  ctx.save();
  ctx.translate(b.x, b.y + R - 2 + R * sq * .3);
  ctx.scale((b.face || 1) * (1 + sq * .4), 1 - sq * .5);
  ctx.translate(0, -bob);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // bàn chân
  const legs = air ? [[-6, -.4], [6, .4]] : [[-6, Math.sin(ph) * .7], [6, Math.sin(ph + Math.PI) * .7]];
  for (const [lx, ang] of legs) {
    ctx.save(); ctx.translate(lx, -5); ctx.rotate(ang);
    ctx.fillStyle = W; ctx.strokeStyle = OL; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 2, 4.5, 3.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // thân
  ctx.fillStyle = W; ctx.strokeStyle = OL; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.ellipse(0, -12, 12, 9.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // tay cầm gậy: vụt khi đánh
  const armA = S.swing > 0 ? -2 + (1 - S.swing / SWING) * 3.4 : air ? -2.2 : running ? Math.sin(ph + Math.PI) * .7 : .4;
  ctx.save(); ctx.translate(8, -14); ctx.rotate(armA);
  if (S.swing > 0 || S.cast > 0) { ctx.fillStyle = '#9a6a3a'; ctx.fillRect(-1.5, -18, 3, 14); }
  ctx.fillStyle = W; ctx.strokeStyle = OL; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, -2, 3.2, 4.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
  // đầu to, tai tròn nhỏ
  const hy = -32;
  for (const ex of [-8, 9]) { ctx.beginPath(); ctx.arc(ex, hy - 11, 4.2, 0, Math.PI * 2); ctx.fillStyle = W; ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = W; ctx.strokeStyle = OL; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.ellipse(1, hy, 16, 13.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // má hồng có vạch
  ctx.fillStyle = PK;
  for (const cx of [-7, 12]) { ctx.beginPath(); ctx.ellipse(cx, hy + 4.5, 3.6, 2.2, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = '#ff8aa0'; ctx.lineWidth = 1;
  ctx.beginPath(); for (const cx of [-7, 12]) for (const o of [-1.5, 0, 1.5]) { ctx.moveTo(cx + o - .6, hy + 5.5); ctx.lineTo(cx + o + .6, hy + 3.5); } ctx.stroke();
  // mắt: khóc thì nhắm tịt "><"
  ctx.strokeStyle = '#1a1a1a'; ctx.fillStyle = '#1a1a1a'; ctx.lineWidth = 1.8;
  if (S.cry > 0) {
    ctx.beginPath();
    ctx.moveTo(-4, hy - 3); ctx.lineTo(-1, hy - 1); ctx.lineTo(-4, hy + 1);
    ctx.moveTo(10, hy - 3); ctx.lineTo(7, hy - 1); ctx.lineTo(10, hy + 1);
    ctx.stroke();
    // dòng nước mắt
    ctx.fillStyle = '#7cc8ff';
    for (const ex of [-3, 8]) for (let i = 0; i < 3; i++) { const y = hy + 3 + ((S.t * 60 + i * 6) % 18); ctx.fillRect(ex - 1, y, 2.5, 4); }
  } else {
    const blinkEye = Math.floor(S.t * 10) % 41 === 0;
    for (const ex of [-2.5, 8.5]) {
      if (blinkEye) { ctx.fillRect(ex - 2, hy - 1, 4, 1.6); continue; }
      ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.ellipse(ex, hy - 1, 2.2, 2.9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex + .7, hy - 2.2, .9, 0, Math.PI * 2); ctx.fill();
    }
  }
  // miệng
  ctx.strokeStyle = OL; ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (air || S.cry > 0 || charged) ctx.ellipse(3, hy + 5, 1.8, 2.2, 0, 0, Math.PI * 2);
  else { ctx.arc(2, hy + 4, 1.2, .2, Math.PI - .2); ctx.arc(4.4, hy + 4, 1.2, .2, Math.PI - .2); }
  ctx.stroke();
  ctx.restore();
}
// Rimuru dạng slime xanh: giọt nước nảy tưng tưng, mắt cong
function drawRimuru(b, charged) {
  const sq = b.squash, air = !S.onGround, running = !air && Math.abs(b.vx) > 30, ph = b.run;
  const wob = running ? Math.sin(ph * 2) * .08 : Math.sin(S.t * 3) * .03;
  const BODY = charged ? '#9ef0ff' : '#5ec8f2', DK = '#1f6fa0', HI = '#e2f9ff';
  ctx.save();
  ctx.translate(b.x, b.y + R - 2 + R * sq * .3);
  ctx.scale((b.face || 1) * (1 + sq * .4 + wob), Math.max(.4, 1 - sq * .5 - wob + (air ? .08 : 0)));
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const g = ctx.createLinearGradient(0, -42, 0, 0);
  g.addColorStop(0, HI); g.addColorStop(.35, BODY); g.addColorStop(1, '#3aa6dc');
  ctx.beginPath();
  ctx.moveTo(-22, -3);
  ctx.quadraticCurveTo(-25, -20, -10, -29);
  ctx.quadraticCurveTo(-1, -35, 2, -42);
  ctx.quadraticCurveTo(6, -33, 14, -29);
  ctx.quadraticCurveTo(26, -19, 22, -3);
  ctx.quadraticCurveTo(0, 3, -22, -3);
  ctx.closePath();
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = DK; ctx.lineWidth = 2.5; ctx.stroke();
  // vệt sáng
  ctx.fillStyle = 'rgb(255 255 255 / .75)';
  ctx.beginPath(); ctx.ellipse(-9, -22, 5, 2.6, -.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-14, -15, 1.6, 0, Math.PI * 2); ctx.fill();
  // mắt cong hình vòm, Kẻ Săn Mồi thì há miệng to
  ctx.strokeStyle = '#123a5a'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(5, -17, 3, Math.PI * 1.1, Math.PI * 1.9);
  ctx.moveTo(17.5, -17.5); ctx.arc(14.5, -17, 3, Math.PI * 1.9, Math.PI * 1.1, true);
  ctx.stroke();
  if (S.maw) { ctx.fillStyle = '#123a5a'; ctx.beginPath(); ctx.ellipse(11, -9, 6, 4.5, 0, 0, Math.PI * 2); ctx.fill(); }
  else if (air || charged) { ctx.beginPath(); ctx.arc(10, -11, 2, 0, Math.PI); ctx.stroke(); }
  ctx.restore();
  // Đại Hiền Giả sẵn sàng: đốm sáng xoay quanh
  if (S.resist <= 0) {
    const a = S.t * 3;
    ctx.fillStyle = '#e2f9ff';
    ctx.fillRect(b.x + Math.cos(a) * (R + 8) - 2, b.y - 6 + Math.sin(a) * (R * .6) - 2, 4, 4);
  }
}
// Stelle (Nhà Khai Phá, fan art hình khối): tóc xám, mắt vàng, áo khoác đen viền vàng, gậy bóng chày
function drawStelle(b, charged) {
  const sq = b.squash, air = !S.onGround, running = !air && Math.abs(b.vx) > 30, ph = b.run;
  const bob = running ? Math.abs(Math.sin(ph)) * 2.5 : 0;
  const HAIR = '#c9c9d3', HAIRD = '#8a8a99', SKIN = '#ffe3d2', JK = '#26262e', GOLD = charged ? '#fff27a' : '#e2b04a', DK = '#14141a', SH = '#f4f4f6';
  ctx.save();
  ctx.translate(b.x, b.y + R - 2 + R * sq * .3);
  ctx.scale((b.face || 1) * (1 + sq * .4), 1 - sq * .5);
  ctx.translate(0, -bob);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // tóc dài phía sau
  ctx.fillStyle = HAIR; ctx.strokeStyle = HAIRD; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-9, -50); ctx.quadraticCurveTo(-18, -36, -14, -21); ctx.lineTo(-5, -25); ctx.quadraticCurveTo(-3, -38, 3, -48); ctx.closePath(); ctx.fill(); ctx.stroke();
  // chân: tất đen, giày nâu
  const legs = air ? [[-4, -.5], [4, .5]] : [[-3, Math.sin(ph) * .8], [3, Math.sin(ph + Math.PI) * .8]];
  for (const [lx, ang] of legs) {
    ctx.save(); ctx.translate(lx, -15); ctx.rotate(ang);
    ctx.fillStyle = DK; ctx.fillRect(-2.5, 0, 5, 12);
    ctx.fillStyle = '#6a4630'; ctx.beginPath(); ctx.ellipse(1.5, 12.5, 4, 2.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // quần short đen
  ctx.fillStyle = DK;
  ctx.beginPath(); ctx.moveTo(-7, -22); ctx.lineTo(7, -22); ctx.lineTo(8.5, -14); ctx.lineTo(-8.5, -14); ctx.closePath(); ctx.fill();
  // áo khoác đen viền vàng, áo sơ mi trắng phía trước
  ctx.fillStyle = JK; ctx.strokeStyle = DK; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-8, -35); ctx.lineTo(8, -35); ctx.lineTo(9.5, -19); ctx.lineTo(-9.5, -19); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = SH;
  ctx.beginPath(); ctx.moveTo(1, -35); ctx.lineTo(6.5, -35); ctx.lineTo(6, -21); ctx.lineTo(2, -21); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = GOLD; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(1, -35); ctx.lineTo(2, -20); ctx.moveTo(-9.5, -19.5); ctx.lineTo(9.5, -19.5); ctx.stroke();
  // đầu
  const hx = 1, hy = -45;
  ctx.fillStyle = SKIN; ctx.strokeStyle = '#7a5a4a'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(hx, hy, 10.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // tóc mái, lọn tóc bên mặt, sợi tóc dựng
  ctx.fillStyle = HAIR; ctx.strokeStyle = HAIRD; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(hx, hy - 1, 11.5, Math.PI * 1.02, Math.PI * 1.98); ctx.lineTo(hx + 11, hy + 1);
  ctx.lineTo(hx + 7, hy - 4); ctx.lineTo(hx + 4, hy + 1); ctx.lineTo(hx + 1, hy - 5); ctx.lineTo(hx - 3, hy - 1); ctx.lineTo(hx - 6, hy - 5); ctx.lineTo(hx - 11, hy + 2);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx + 9, hy - 3); ctx.lineTo(hx + 12, hy + 9); ctx.lineTo(hx + 8.5, hy + 6); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(hx - 1, hy - 11); ctx.quadraticCurveTo(hx + 1, hy - 19, hx + 6, hy - 18); ctx.stroke();
  // mắt vàng, miệng
  const blinkEye = Math.floor(S.t * 10) % 43 === 0;
  if (blinkEye) { ctx.fillStyle = DK; ctx.fillRect(hx + 4, hy + 1, 4, 1.4); }
  else {
    ctx.fillStyle = '#f2b630'; ctx.beginPath(); ctx.ellipse(hx + 6, hy + 1.5, 1.8, 2.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = DK; ctx.beginPath(); ctx.arc(hx + 6.3, hy + 1.8, .9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(hx + 5.2, hy - .2, 1, 1);
  }
  ctx.strokeStyle = '#7a4a3a'; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(hx + 6, hy + 6.5); ctx.lineTo(hx + 8.5, hy + 6.2); ctx.stroke();
  // tay và gậy bóng chày: vác vai, vụt khi đánh, kéo ra sau khi giữ J
  const sw = S.swing > 0 ? 1 - S.swing / SWING : -1;
  const batA = sw >= 0 ? -2.2 + sw * 3.8 : S.charging ? -2.5 + Math.sin(S.t * 40) * .05 : air ? -.3 : -.75 + (running ? Math.sin(ph) * .1 : 0);
  ctx.save(); ctx.translate(3, -32); ctx.rotate(batA);
  if (sw >= 0) {
    ctx.strokeStyle = 'rgb(255 220 120 / .55)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(0, 0, 32, -Math.PI / 2 - Math.min(3.8, sw * 3.8), -Math.PI / 2); ctx.stroke();
  }
  ctx.fillStyle = JK; ctx.fillRect(-2.2, -9, 4.4, 9);
  ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(0, -9.5, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c9ced8'; ctx.strokeStyle = charged || S.charging ? '#ffd65e' : '#5a606c'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-1.3, -9); ctx.lineTo(1.3, -9); ctx.lineTo(3.2, -36); ctx.quadraticCurveTo(0, -39, -3.2, -36); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3a2a2a'; ctx.fillRect(-1.6, -14, 3.2, 5);
  ctx.restore();
  ctx.restore();
}
// Ảnh gốc của Hải Tặc Tí Hon (bộ skill Kiếm khách cấp 20, màu đỏ): Nhất kiếm 24002, Song kiếm 24279 + 24319,
// Tam kiếm vòng xoáy đỏ 24280 + lốc (ảnh 24028 nhuộm đỏ), bụi 24167, trúng đòn 24015, biến mất 24413. Khung xếp dọc.
const KK = {
  nhat: { n: 4, w: 212, h: 116.0, src: 'data:image/png;base64,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' },
  chem: { n: 4, w: 280, h: 280.0, src: 'data:image/png;base64,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' },
  ribbon: { n: 4, w: 128, h: 210.0, src: 'data:image/png;base64,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' },
  aura: { n: 2, w: 200, h: 296.0, src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAJQCAMAAAD8LNurAAADAFBMVEUAAAD/EBD/EBD/EBD/EBD/EBD/EBD/EBD/EBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADS6pZqAAABAHRSTlMA/AjLqypMimwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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' },
  loc: { n: 4, w: 184, h: 200.0, src: 'data:image/png;base64,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' },
  dust: { n: 4, w: 312, h: 88.0, src: 'data:image/png;base64,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' },
  hit: { n: 3, w: 220, h: 220.0, src: 'data:image/png;base64,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' },
  vanish: { n: 3, w: 273, h: 219.0, src: 'data:image/png;base64,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' },
};
// Mảnh ghép nhân vật Kiếm khách (đầu, tóc, phụ kiện, áo, quần, kiếm) theo đúng toạ độ trong game, đơn vị 2× so với game.
// R: ô trong atlas [x, y, w, h]; mỗi trạng thái một mục [ô, x, y]; tóc và phụ kiện [ô thường, ô khi chạy, x, y]; feet: đáy quần.
const KKO = {"R":[[0,0,124,168],[125,0,124,164],[250,0,76,84],[327,0,72,84],[400,0,64,84],[465,0,83,80],[549,0,83,80],[633,0,64,80],[698,0,70,77],[769,0,70,77],[840,0,70,77],[911,0,70,77],[0,169,70,77],[71,169,86,74],[158,169,80,72],[239,169,80,72],[320,169,84,72],[405,169,80,72],[486,169,80,72],[567,169,76,72],[644,169,76,72],[721,169,42,70],[764,169,42,70],[807,169,42,70],[850,169,42,70],[893,169,42,70],[0,247,132,68],[133,247,132,68],[266,247,132,68],[399,247,132,68],[532,247,132,68],[665,247,64,68],[730,247,64,68],[795,247,64,67],[860,247,96,67],[957,247,64,67],[0,316,96,67],[97,316,64,67],[162,316,96,67],[259,316,64,67],[324,316,96,67],[421,316,64,67],[486,316,96,67],[583,316,128,64],[712,316,128,64],[841,316,128,64],[0,384,128,64],[129,384,80,64],[210,384,112,64],[323,384,80,64],[404,384,115,64],[520,384,80,64],[601,384,112,64],[714,384,80,64],[795,384,112,64],[908,384,80,64],[0,449,112,64],[113,449,64,64],[178,449,72,64],[251,449,68,64],[320,449,122,61],[443,449,96,61],[540,449,122,61],[663,449,96,61],[760,449,122,61],[883,449,96,61],[0,514,122,61],[123,514,96,61],[220,514,122,61],[343,514,96,61],[440,514,80,60],[521,514,124,60],[646,514,80,60],[727,514,124,60],[852,514,128,60],[0,576,80,60],[81,576,124,60],[206,576,80,60],[287,576,124,60],[412,576,80,60],[493,576,124,60],[618,576,64,60],[683,576,52,56],[736,576,52,56],[789,576,60,56],[850,576,116,56],[0,637,108,56],[109,637,60,56],[170,637,116,56],[287,637,104,56],[392,637,64,56],[457,637,116,56],[574,637,104,56],[679,637,60,56],[740,637,116,56],[857,637,108,56],[0,694,60,56],[61,694,116,56],[178,694,108,56],[287,694,72,56],[360,694,72,56],[433,694,64,56],[498,694,68,56],[567,694,68,56],[636,694,64,56],[701,694,92,52],[794,694,116,52],[0,751,116,52],[117,751,116,52],[234,751,116,52],[351,751,116,52],[468,751,68,52],[537,751,64,52],[602,751,60,52],[663,751,92,52],[756,751,64,52],[821,751,64,48],[886,751,68,48],[955,751,68,48],[0,804,80,48],[81,804,80,48],[162,804,76,48],[239,804,76,48],[316,804,92,48],[409,804,116,44],[526,804,116,44],[643,804,60,44],[704,804,72,44],[777,804,72,44],[850,804,72,44],[923,804,60,44],[0,853,68,40],[69,853,76,36],[146,853,60,36],[207,853,56,20],[264,853,44,16]],"head":[[82,0,0],[82,0,0],[82,0,0],[82,0,0],[82,0,0],[83,-2,0],[83,-2,0],[83,-2,0],[83,-2,0]],"tay":[[124,4,82],[125,0,80],[125,0,80],[125,0,80],[125,0,80],[125,0,80],[105,34,64],[0,30,-44],[1,44,-38]],"ao":[[[14,-8,50],[70,-14,46],[84,8,46],[26,-32,32],[71,-20,42],[43,-38,46],[106,-38,46],[85,-36,46],[86,-28,46]],[[15,-8,50],[72,-14,46],[87,8,46],[27,-32,32],[73,-20,42],[74,-38,46],[107,-38,46],[88,-36,46],[89,-28,46]],[[16,-8,50],[75,-14,46],[90,8,46],[28,-32,32],[76,-20,42],[44,-38,46],[108,-38,46],[91,-36,46],[92,-28,46]],[[17,-8,50],[77,-14,46],[93,8,46],[29,-32,32],[78,-20,42],[45,-38,46],[109,-38,46],[94,-36,46],[95,-28,46]],[[18,-8,50],[79,-14,46],[96,8,46],[30,-32,32],[80,-20,42],[46,-38,46],[110,-38,46],[97,-36,46],[98,-28,46]]],"quan":[[[47,-12,100],[60,-26,98],[33,20,94],[8,18,92],[34,-16,94],[61,-12,100],[21,24,86],[13,14,94],[48,-10,90]],[[49,-12,100],[62,-26,98],[35,20,94],[9,18,92],[36,-16,94],[63,-12,100],[22,24,86],[5,14,94],[50,-10,90]],[[51,-12,100],[64,-26,98],[37,20,94],[10,18,92],[38,-16,94],[65,-12,100],[23,24,86],[10,14,94],[52,-10,90]],[[53,-12,100],[66,-26,98],[39,20,94],[11,18,92],[40,-16,94],[67,-12,100],[24,24,86],[11,14,94],[54,-10,90]],[[55,-12,100],[68,-26,98],[41,20,94],[12,18,92],[42,-16,94],[69,-12,100],[25,24,86],[6,14,94],[56,-10,90]]],"hair":[[99,99,-8,-10],[99,100,-10,-8],[19,20,-16,-14],[2,3,-14,-16],[111,81,-10,-14],[101,57,-6,-10],[116,112,-6,-10],[7,4,-6,-12],[102,103,-8,-10],[58,59,-10,-12],[31,32,-6,-10],[126,113,-4,-8]],"acc":[[117,131,-8,-12],[127,118,-10,-12],[128,129,-10,-12],[132,130,-12,-10],[119,120,-10,-10],[121,122,-12,-18],[123,114,-20,-18],[133,133,-6,-10],[135,135,0,20],[134,134,-4,18],[104,115,-8,-14]],"feet":[[164,159,161,169,161,161,156,168,154],[164,159,161,169,161,161,156,174,154],[164,159,161,169,161,161,156,171,154],[164,159,161,169,161,161,156,171,154],[164,159,161,169,161,161,156,174,154]],"names":{"ao":["Áo kiếm sĩ","Áo kiếm sĩ tím","Áo cộc tay","Áo X","Áo kiếm khách"],"quan":["Quần vải","Quần vải đen","Quần vải đen 2","Quần vải trắng","Quần vải đen 3"],"hair":["Đen (gốc)","Đen rối","Đỏ","Xanh lá buộc đuôi","Bạc dựng","Cam","Hồng","Đen dài","Đen xù","Đen xoè","Đen gọn","Xanh đen"],"acc":["Khăn đỏ buộc đầu","Khăn nâu","Khăn cam","Khăn vàng nâu","Mũ rơm","Mũ phớt","Mũ cướp biển","Mũ lưỡi trai","Kính đen","Kính hồng","Mũ bơi kính tím"]}};
KKO.src = 'data:image/png;base64,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';
for (const s of [...Object.values(KK), KKO]) { const im = new Image(); im.src = s.src; s.img = im; }
// Vẽ khung i của ảnh KK, tâm tại (cx, cy), cỡ w×h; flip = -1 thì lật ngang
function drawKK(name, i, cx, cy, w, h, flip = 1) {
  const s = KK[name], im = s.img;
  if (!im || !im.complete || !im.naturalWidth) return;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(flip, 1);
  ctx.drawImage(im, 0, i * s.h, s.w, s.h, -w / 2, -h / 2, w, h);
  ctx.restore();
}
// Kiếm khách: ghép từ mảnh gốc theo trang phục đang chọn (ảnh gốc quay sang trái nên lật khi chạy sang phải)
const KK_STATES = ['dungyen', 'move1', 'move2', 'move3', 'move4', 'a1', 'a2', 'a3', 'a5'];
// trang phục: chỉ số tóc, phụ kiện (-1 = không đeo), áo, quần; mỗi máy nhớ riêng
const OUTFIT_KEY = 'bongdo.kiemOutfit';
const kiemOutfit = { hair: 0, acc: -1, ao: 0, quan: 0 };
try { Object.assign(kiemOutfit, JSON.parse(lsGet(OUTFIT_KEY, '{}'))); } catch (e) {}
// Ghép theo thứ tự lớp trong game: quần, áo, đầu, tóc, phụ kiện, kiếm. Gốc là góc trên trái của đầu, đơn vị 2×.
// run: tóc và phụ kiện dùng ảnh bay gió khi chạy
function paintKiem(g, i, o, run) {
  const im = KKO.img;
  if (!im.complete || !im.naturalWidth) return;
  const put = (r, x, y) => { const [sx, sy, w, h] = KKO.R[r]; g.drawImage(im, sx, sy, w, h, x, y, w, h); };
  const lay = l => put(l[0], l[1], l[2]);
  lay(KKO.quan[o.quan] ? KKO.quan[o.quan][i] : KKO.quan[0][i]);
  lay(KKO.ao[o.ao] ? KKO.ao[o.ao][i] : KKO.ao[0][i]);
  lay(KKO.head[i]);
  const h = KKO.hair[o.hair] || KKO.hair[0];
  put(run ? h[1] : h[0], h[2], h[3]);
  const c = KKO.acc[o.acc];
  if (c) put(run ? c[1] : c[0], c[2], c[3]);
  lay(KKO.tay[i]);
}
const kiemFeet = (o, i) => (KKO.feet[o.quan] || KKO.feet[0])[i];
function drawKiem(b, charged) {
  if (S.kpose === 'hide') return;
  const sq = b.squash, air = !S.onGround, running = !air && Math.abs(b.vx) > 30;
  const st = S.kpose || (air ? 'move3' : running ? ['move1', 'move2', 'move3', 'move4'][Math.floor(b.run / 1.3) % 4] : 'dungyen');
  const i = Math.max(0, KK_STATES.indexOf(st));
  const k = .36, bob = st === 'dungyen' && Math.floor(S.t * 5) % 2 ? 2 : 0;   // nhịp thở 200ms như trong game
  ctx.save();
  ctx.translate(b.x, b.y + R - 2 + R * sq * .3);
  ctx.scale(-(b.face || 1) * (1 + sq * .4) * k, (1 - sq * .5) * k);
  if (charged) { ctx.shadowColor = '#ffe27a'; ctx.shadowBlur = 30; }
  ctx.translate(-32, -kiemFeet(kiemOutfit, i) + bob);
  paintKiem(ctx, i, kiemOutfit, running && st === 'move1');
  ctx.restore();
}
// Ô xem trước trang phục trong bảng chọn nhân vật
function drawOutfitPreview() {
  const c = $('outfitPrev'), g = c.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
  const k = .62;
  g.translate(c.width / 2, c.height - 8); g.scale(-k, k);
  g.translate(-32, -kiemFeet(kiemOutfit, 0));
  paintKiem(g, 0, kiemOutfit, false);
}
KKO.img.addEventListener('load', () => { if (!$('outfit').hidden) drawOutfitPreview(); });
for (const [key, id] of [['hair', 'ofHair'], ['acc', 'ofAcc'], ['ao', 'ofAo'], ['quan', 'ofQuan']]) {
  const sel = $(id);
  if (key === 'acc') sel.append(new Option('Không đeo', '-1'));
  KKO.names[key].forEach((n, i) => sel.append(new Option(n, String(i))));
  sel.value = String(kiemOutfit[key]);
  sel.addEventListener('change', () => {
    kiemOutfit[key] = Number(sel.value);
    lsSet(OUTFIT_KEY, JSON.stringify(kiemOutfit));
    drawOutfitPreview();
  });
}
// Asta (fan art hình khối): tóc vàng tro dựng tua tủa, băng đô đen, mắt xanh lá, áo choàng Hắc Bộc Ngưu, kiếm Diệt Quỷ đen to bản.
// Hắc Hoá: hào quang đen, sừng và cánh đen một bên.
function drawAsta(b, charged) {
  const sq = b.squash, air = !S.onGround, running = !air && Math.abs(b.vx) > 30, ph = b.run;
  const bob = running ? Math.abs(Math.sin(ph)) * 2.5 : 0, blk = S.black > 0;
  const HAIR = blk ? '#d8d4c4' : '#e9e3c4', HAIRD = '#a59c74', SKIN = '#ffd9b8', ROBE = '#1d1d24', DK = '#14141a', TOP = '#2e2e36', GR = '#9cff7a';
  if (blk) {
    ctx.fillStyle = 'rgb(10 10 14 / .28)';
    ctx.beginPath(); ctx.ellipse(b.x, b.y - 12, R * 1.6, R * 2.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = GR;
    for (let i = 0; i < 4; i++) { const y = b.y + 12 - ((S.t * 80 + i * 19) % 76); ctx.fillRect(b.x - 20 + i * 13 + Math.sin(S.t * 9 + i) * 3, y, 2.5, 6); }
  }
  ctx.save();
  ctx.translate(b.x, b.y + R - 2 + R * sq * .3);
  ctx.scale((b.face || 1) * (1 + sq * .4), 1 - sq * .5);
  ctx.translate(0, -bob);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // cánh đen rách khi Hắc Hoá
  if (blk) {
    const fl = Math.sin(S.t * 8) * .15;
    ctx.save(); ctx.translate(-5, -34); ctx.rotate(-.5 + fl);
    ctx.fillStyle = '#0c0c10'; ctx.strokeStyle = 'rgb(156 255 122 / .6)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -22); ctx.lineTo(-6, -16); ctx.lineTo(-18, -26); ctx.lineTo(-13, -12); ctx.lineTo(-24, -14); ctx.lineTo(-12, -4); ctx.lineTo(-20, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // áo choàng Hắc Bộc Ngưu bay phía sau
  const sway = running ? Math.sin(ph * 2) * 2 : Math.sin(S.t * 3);
  ctx.fillStyle = ROBE; ctx.strokeStyle = DK; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-6, -36); ctx.lineTo(-15 - sway - (running ? 4 : 0), -14); ctx.lineTo(-6, -17); ctx.closePath(); ctx.fill(); ctx.stroke();
  // chân: quần đen, ủng nâu
  const legs = air ? [[-4, -.5], [4, .5]] : [[-3, Math.sin(ph) * .8], [3, Math.sin(ph + Math.PI) * .8]];
  for (const [lx, ang] of legs) {
    ctx.save(); ctx.translate(lx, -16); ctx.rotate(ang);
    ctx.fillStyle = '#26262c'; ctx.fillRect(-3, 0, 6, 10);
    ctx.fillStyle = '#6a4630'; ctx.fillRect(-3.2, 9, 6.4, 5); ctx.fillRect(-3.2, 12.5, 8, 2);
    ctx.restore();
  }
  // thân: áo ba lỗ tối, thắt lưng, khăn áo choàng quấn vai
  ctx.fillStyle = TOP; ctx.strokeStyle = DK; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-7.5, -35); ctx.lineTo(7.5, -35); ctx.lineTo(7, -18); ctx.lineTo(-7, -18); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5a4030'; ctx.fillRect(-7.5, -21, 15, 3);
  ctx.fillStyle = ROBE;
  ctx.beginPath(); ctx.moveTo(-8, -36); ctx.lineTo(4, -36); ctx.lineTo(-2, -29); ctx.lineTo(-8, -28); ctx.closePath(); ctx.fill();
  // huy hiệu bò tót trên áo choàng
  ctx.fillStyle = '#d63a3a'; ctx.beginPath(); ctx.arc(-4, -32, 1.8, 0, Math.PI * 2); ctx.fill();
  // tay sau (Hắc Hoá thì tay phủ đen)
  ctx.save(); ctx.translate(-4, -32); ctx.rotate(running ? Math.sin(ph) * .7 + 3 : air ? 2.4 : 2.9);
  ctx.fillStyle = blk ? '#121216' : SKIN; ctx.fillRect(-2, -10, 4, 10);
  ctx.restore();
  // đầu
  const hx = 1, hy = -44;
  // tóc vàng tro tua tủa
  ctx.fillStyle = HAIR; ctx.strokeStyle = HAIRD; ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(hx - 11, hy + 3); ctx.lineTo(hx - 17, hy - 4); ctx.lineTo(hx - 11, hy - 6); ctx.lineTo(hx - 16, hy - 14); ctx.lineTo(hx - 8, hy - 12);
  ctx.lineTo(hx - 9, hy - 21); ctx.lineTo(hx - 2, hy - 14); ctx.lineTo(hx + 1, hy - 23); ctx.lineTo(hx + 5, hy - 14); ctx.lineTo(hx + 11, hy - 20);
  ctx.lineTo(hx + 10, hy - 10); ctx.lineTo(hx + 16, hy - 9); ctx.lineTo(hx + 11, hy - 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = SKIN; ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(hx + 1, hy, 9.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // mái tóc + băng đô đen
  ctx.fillStyle = HAIR; ctx.strokeStyle = HAIRD; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(hx - 9, hy - 2); ctx.lineTo(hx - 5, hy - 12); ctx.lineTo(hx + 9, hy - 10); ctx.lineTo(hx + 11, hy - 2); ctx.lineTo(hx + 7, hy - 5); ctx.lineTo(hx + 5, hy - 1); ctx.lineTo(hx + 1, hy - 5); ctx.lineTo(hx - 3, hy - 1); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = DK; ctx.fillRect(hx - 9, hy - 9, 20, 3.2);
  ctx.beginPath(); ctx.moveTo(hx - 9, hy - 8); ctx.lineTo(hx - 15, hy - 4 + sway * .5); ctx.lineTo(hx - 14, hy - 8); ctx.closePath(); ctx.fill();
  // sừng đen khi Hắc Hoá
  if (blk) { ctx.fillStyle = '#0c0c10'; ctx.beginPath(); ctx.moveTo(hx - 5, hy - 10); ctx.lineTo(hx - 9, hy - 22); ctx.lineTo(hx - 1, hy - 11); ctx.closePath(); ctx.fill(); }
  // mắt xanh lá to, lông mày quyết tâm, miệng hét khi chém
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(hx + 6, hy + 1, 2.4, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = blk ? '#c0101e' : '#2f9a3a'; ctx.beginPath(); ctx.arc(hx + 6.6, hy + 1.4, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = DK; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(hx + 3, hy - 3.5); ctx.lineTo(hx + 9, hy - 2); ctx.stroke();
  const yell = S.swing > 0 || S.spin > 0 || charged;
  ctx.fillStyle = '#7a2020';
  if (yell) { ctx.beginPath(); ctx.ellipse(hx + 6.5, hy + 6, 2.2, 2, 0, 0, Math.PI * 2); ctx.fill(); }
  else { ctx.strokeStyle = '#7a4a3a'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(hx + 5, hy + 6); ctx.lineTo(hx + 8.5, hy + 5.5); ctx.stroke(); }
  // tay trước + kiếm Diệt Quỷ: vác vai, vung khi chém, xoay khi Black Hurricane
  const sw = S.swing > 0 ? 1 - S.swing / SWING : -1;
  const ang = S.spin > 0 ? S.t * 30 : sw >= 0 ? -2.3 + sw * 3.9 : S.charging ? -2.6 + Math.sin(S.t * 40) * .05 : air ? -.5 : -.85 + (running ? Math.sin(ph) * .1 : 0);
  ctx.save(); ctx.translate(3, -32); ctx.rotate(ang);
  if (sw >= 0) {
    ctx.strokeStyle = 'rgb(156 255 122 / .5)'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(0, 0, 38, -Math.PI / 2 - Math.min(3.9, sw * 3.9), -Math.PI / 2); ctx.stroke();
  }
  ctx.fillStyle = blk ? '#121216' : SKIN; ctx.fillRect(-2.2, -9, 4.4, 9);
  ctx.fillStyle = '#4a3a2a'; ctx.fillRect(-1.6, -15, 3.2, 7);
  ctx.fillStyle = '#2a2a30'; ctx.fillRect(-6, -17, 12, 2.6);
  ctx.fillStyle = '#18181c'; ctx.strokeStyle = charged || blk || S.charging ? GR : '#4a4a54'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-4.5, -17); ctx.lineTo(4.5, -17); ctx.lineTo(5.5, -42); ctx.lineTo(2, -46); ctx.lineTo(-4.5, -44); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgb(255 255 255 / .12)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, -19); ctx.lineTo(.5, -42); ctx.stroke();
  ctx.restore();
  ctx.restore();
}
// Yuno (fan art hình khối): tóc đen ánh xanh, mắt vàng, áo choàng trắng viền vàng Bình Minh Vàng, mặt dây chuyền đá xanh.
// Tinh linh gió Sylph (Bell) bay theo sau.
function drawYuno(b, charged) {
  const sq = b.squash, air = !S.onGround, running = !air && Math.abs(b.vx) > 30, ph = b.run;
  const bob = running ? Math.abs(Math.sin(ph)) * 2.5 : 0;
  const HAIR = '#1f2a44', HAIRD = '#0f1626', SKIN = '#ffe3d2', ROBE = '#f4f4f6', GOLD = charged ? '#fff27a' : '#e2b04a', DK = '#14141a', IN = '#2b2f3a';
  const d = b.face || 1, wind = S.cast > 0 || S.voltFx > 0 || charged;
  // gió xoáy quanh người khi niệm phép
  if (wind) {
    ctx.strokeStyle = 'rgb(150 240 190 / .6)'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) { const a = S.t * 12 + i * 2.1; ctx.beginPath(); ctx.ellipse(b.x, b.y - 6 - i * 10, 26 + i * 4, 8, 0, a, a + 3.6); ctx.stroke(); }
  }
  ctx.save();
  ctx.translate(b.x, b.y + R - 2 + R * sq * .3);
  ctx.scale(d * (1 + sq * .4), 1 - sq * .5);
  ctx.translate(0, -bob);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // áo choàng trắng viền vàng bay sau lưng
  const sway = running ? Math.sin(ph * 2) * 2.5 : Math.sin(S.t * 3) * 1.2;
  ctx.fillStyle = ROBE; ctx.strokeStyle = GOLD; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-6, -37); ctx.quadraticCurveTo(-16 - sway, -26, -17 - sway - (running ? 5 : 0), -10); ctx.lineTo(-5, -14); ctx.closePath(); ctx.fill(); ctx.stroke();
  // chân: quần tối, ủng
  const legs = air ? [[-4, -.5], [4, .5]] : [[-3, Math.sin(ph) * .8], [3, Math.sin(ph + Math.PI) * .8]];
  for (const [lx, ang] of legs) {
    ctx.save(); ctx.translate(lx, -16); ctx.rotate(ang);
    ctx.fillStyle = IN; ctx.fillRect(-2.6, 0, 5.2, 11);
    ctx.fillStyle = '#3a2a22'; ctx.fillRect(-2.8, 10, 5.6, 4); ctx.fillRect(-2.8, 13, 7, 1.8);
    ctx.restore();
  }
  // thân: áo trong tối, áo choàng trắng mở phía trước, viền vàng
  ctx.fillStyle = ROBE; ctx.strokeStyle = '#b9bcc6'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-8, -36); ctx.lineTo(8, -36); ctx.lineTo(9.5, -16); ctx.lineTo(-9.5, -16); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = IN;
  ctx.beginPath(); ctx.moveTo(1, -36); ctx.lineTo(6, -36); ctx.lineTo(5.5, -17); ctx.lineTo(1.5, -17); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = GOLD; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(1, -36); ctx.lineTo(1.5, -16); ctx.moveTo(6, -36); ctx.lineTo(5.5, -16); ctx.moveTo(-9.5, -16.5); ctx.lineTo(9.5, -16.5); ctx.stroke();
  // mặt dây chuyền đá xanh
  ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(3.5, -30, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3fa4ef'; ctx.beginPath(); ctx.arc(3.5, -30, 1.5, 0, Math.PI * 2); ctx.fill();
  // tay trước: giơ ra niệm phép
  const armA = S.cast > 0 || charged ? -1.55 : air ? -2 : running ? Math.sin(ph + Math.PI) * .7 + 3 : 2.9;
  ctx.save(); ctx.translate(5, -32); ctx.rotate(armA);
  ctx.fillStyle = ROBE; ctx.fillRect(-2.4, -10, 4.8, 10);
  ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(0, -11, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // đầu
  const hx = 1, hy = -45;
  ctx.fillStyle = HAIR; ctx.strokeStyle = HAIRD; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(hx - 10, hy - 4); ctx.quadraticCurveTo(hx - 15, hy + 6, hx - 11, hy + 10); ctx.lineTo(hx - 6, hy + 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = SKIN; ctx.strokeStyle = '#7a5a4a'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(hx, hy, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // tóc: mái lệch che trán, vài lọn nhọn, tóc mai dài
  ctx.fillStyle = HAIR; ctx.strokeStyle = HAIRD; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(hx, hy - 1, 11.2, Math.PI * 1.02, Math.PI * 1.98);
  ctx.lineTo(hx + 11, hy + 2); ctx.lineTo(hx + 8, hy - 3); ctx.lineTo(hx + 6, hy + 3); ctx.lineTo(hx + 3, hy - 4); ctx.lineTo(hx, hy + 1); ctx.lineTo(hx - 4, hy - 4); ctx.lineTo(hx - 10, hy + 2);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx + 9, hy - 2); ctx.lineTo(hx + 12, hy + 10); ctx.lineTo(hx + 8, hy + 6); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(hx - 6, hy - 10); ctx.lineTo(hx - 3, hy - 17); ctx.lineTo(hx + 1, hy - 11); ctx.lineTo(hx + 6, hy - 16); ctx.lineTo(hx + 6, hy - 9); ctx.closePath(); ctx.fill();
  // mắt vàng sắc, miệng điềm tĩnh
  ctx.fillStyle = '#e6b422'; ctx.beginPath(); ctx.ellipse(hx + 6, hy + 1.5, 1.8, 2.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = DK; ctx.beginPath(); ctx.arc(hx + 6.3, hy + 1.7, .9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = DK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(hx + 3.5, hy - 1.5); ctx.lineTo(hx + 8.5, hy - .5); ctx.stroke();
  ctx.strokeStyle = '#7a4a3a'; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(hx + 5.5, hy + 6.5); ctx.lineTo(hx + 8, hy + 6.4); ctx.stroke();
  ctx.restore();
  // Sylph (Bell): tinh linh gió tí hon tóc xanh, cánh trong suốt, bay lượn sau lưng
  const fx = b.x - d * (24 + Math.sin(S.t * 2) * 4), fy = b.y - 46 + Math.sin(S.t * 4) * 5;
  ctx.save(); ctx.translate(fx, fy); ctx.scale(d, 1);
  const wf = Math.abs(Math.sin(S.t * 30));
  ctx.fillStyle = 'rgb(200 255 225 / .55)';
  ctx.beginPath(); ctx.ellipse(-3, -2, 2 + wf * 4, 6, -.5, 0, Math.PI * 2); ctx.ellipse(-3, 2, 1.5 + wf * 3, 4, .6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7fe0a8'; ctx.beginPath(); ctx.ellipse(1, 3, 2.4, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffe3d2'; ctx.beginPath(); ctx.arc(1, -3, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3fbf6a'; ctx.beginPath(); ctx.arc(.5, -4.5, 3.3, Math.PI * .9, Math.PI * 2.1); ctx.fill();
  ctx.fillRect(-3, -5, 2, 6);
  ctx.restore();
}
// Pain (Thiên Đạo, fan art hình khối): tóc cam dựng tua tủa, khuyên đen trên mũi và tai, mắt Luân Hồi tím có vòng đồng tâm,
// băng trán làng Mưa có vạch gạch ngang, áo choàng Akatsuki đen mây đỏ viền trắng, cổ áo cao.
function drawPain(b, charged) {
  const sq = b.squash, air = !S.onGround, running = !air && Math.abs(b.vx) > 30, ph = b.run;
  const bob = running ? Math.abs(Math.sin(ph)) * 2.5 : 0;
  const HAIR = '#e8742a', HAIRD = '#a8481a', SKIN = '#f6dcc4', ROBE = '#15141a', CLOUD = '#d2232a', DK = '#0e0e12', RIN = '#b9a6e8';
  // Shinra Tensei đang toả: Pain lơ lửng giữa luồng chakra
  if (S.cast > 0 || charged) {
    ctx.strokeStyle = 'rgb(200 180 255 / .5)'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { const a = S.t * 6 + i * 2.1; ctx.beginPath(); ctx.ellipse(b.x, b.y - 4, 30 + i * 6, 10 + i * 3, 0, a, a + 3.6); ctx.stroke(); }
  }
  ctx.save();
  ctx.translate(b.x, b.y + R - 2 + R * sq * .3);
  ctx.scale((b.face || 1) * (1 + sq * .4), 1 - sq * .5);
  ctx.translate(0, -bob);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // vạt áo choàng dài phía sau
  const sway = running ? Math.sin(ph * 2) * 2.5 : Math.sin(S.t * 3) * 1.2;
  ctx.fillStyle = ROBE;
  ctx.beginPath(); ctx.moveTo(-8, -36); ctx.lineTo(-12 - sway - (running ? 4 : 0), -6); ctx.lineTo(4, -6); ctx.closePath(); ctx.fill();
  // chân: quần tối, dép ninja
  const legs = air ? [[-4, -.5], [4, .5]] : [[-3, Math.sin(ph) * .8], [3, Math.sin(ph + Math.PI) * .8]];
  for (const [lx, ang] of legs) {
    ctx.save(); ctx.translate(lx, -12); ctx.rotate(ang);
    ctx.fillStyle = '#2c2a36'; ctx.fillRect(-2.6, 0, 5.2, 8);
    ctx.fillStyle = SKIN; ctx.fillRect(-2.6, 8, 5.2, 3);
    ctx.fillStyle = '#3a3a4a'; ctx.fillRect(-2.8, 10.5, 6.6, 2.2);
    ctx.restore();
  }
  // áo choàng Akatsuki: thân dài tới gối, cổ áo cao
  ctx.fillStyle = ROBE; ctx.strokeStyle = '#3a3a48'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-9, -38); ctx.lineTo(9, -38); ctx.lineTo(10.5, -10); ctx.lineTo(-10.5, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-8, -38); ctx.lineTo(-7, -46); ctx.lineTo(9, -46); ctx.lineTo(9, -38); ctx.closePath(); ctx.fill(); ctx.stroke();
  // mây đỏ viền trắng
  const cloud = (cx, cy, s) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(cx - 2.6 * s, cy, 2.6 * s + .8, 0, Math.PI * 2); ctx.arc(cx, cy - 1.4 * s, 3 * s + .8, 0, Math.PI * 2); ctx.arc(cx + 2.8 * s, cy, 2.4 * s + .8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = CLOUD;
    ctx.beginPath(); ctx.arc(cx - 2.6 * s, cy, 2.6 * s, 0, Math.PI * 2); ctx.arc(cx, cy - 1.4 * s, 3 * s, 0, Math.PI * 2); ctx.arc(cx + 2.8 * s, cy, 2.4 * s, 0, Math.PI * 2); ctx.fill();
  };
  cloud(-2, -28, .9); cloud(4, -17, .8);
  // tay: giơ thẳng về trước khi dùng nhẫn thuật
  const armA = S.cast > 0 || charged ? -1.55 : air ? -2 : running ? Math.sin(ph + Math.PI) * .7 + 3 : 2.9;
  ctx.save(); ctx.translate(5, -35); ctx.rotate(armA);
  ctx.fillStyle = ROBE; ctx.fillRect(-2.8, -11, 5.6, 11);
  ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(0, -12, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // đầu
  const hx = 1, hy = -54;
  // tóc cam dựng tua tủa
  ctx.fillStyle = HAIR; ctx.strokeStyle = HAIRD; ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(hx - 11, hy + 4); ctx.lineTo(hx - 17, hy - 2); ctx.lineTo(hx - 11, hy - 5); ctx.lineTo(hx - 16, hy - 13); ctx.lineTo(hx - 8, hy - 11);
  ctx.lineTo(hx - 9, hy - 21); ctx.lineTo(hx - 2, hy - 13); ctx.lineTo(hx + 1, hy - 23); ctx.lineTo(hx + 5, hy - 13); ctx.lineTo(hx + 12, hy - 19);
  ctx.lineTo(hx + 10, hy - 9); ctx.lineTo(hx + 16, hy - 7); ctx.lineTo(hx + 11, hy - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = SKIN; ctx.strokeStyle = '#8a6a5a'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(hx + 1, hy, 9.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // băng trán làng Mưa: tấm kim loại có biểu tượng 4 vạch và vết gạch ngang
  ctx.fillStyle = '#1e1e2a'; ctx.fillRect(hx - 9, hy - 8, 20, 4);
  ctx.fillStyle = '#c9ced8'; ctx.fillRect(hx - 2, hy - 8.5, 10, 5);
  ctx.strokeStyle = '#4a4f5a'; ctx.lineWidth = .9;
  ctx.beginPath(); for (let i = 0; i < 4; i++) { ctx.moveTo(hx - .5 + i * 2.2, hy - 7.5); ctx.lineTo(hx - .5 + i * 2.2, hy - 4.5); } ctx.stroke();
  ctx.strokeStyle = '#2a2a33'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(hx - 3, hy - 6); ctx.lineTo(hx + 9, hy - 6); ctx.stroke();
  // mắt Luân Hồi: tím nhạt, các vòng đồng tâm
  ctx.fillStyle = RIN; ctx.beginPath(); ctx.ellipse(hx + 6, hy + .5, 2.6, 2.8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#5a4a8a'; ctx.lineWidth = .6;
  for (const rr of [.8, 1.6, 2.4]) { ctx.beginPath(); ctx.arc(hx + 6, hy + .5, rr, 0, Math.PI * 2); ctx.stroke(); }
  // khuyên đen: dọc sống mũi, dưới môi, vành tai
  ctx.fillStyle = DK;
  for (const [px, py] of [[hx + 9.5, hy - 1], [hx + 9.8, hy + 1.6], [hx + 9.6, hy + 4], [hx + 7, hy + 7], [hx + 4.5, hy + 7.4]]) { ctx.beginPath(); ctx.arc(px, py, .9, 0, Math.PI * 2); ctx.fill(); }
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(hx - 6.5, hy - 3 + i * 2.4, .8, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = '#6a4a3a'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(hx + 4, hy + 5.5); ctx.lineTo(hx + 7.5, hy + 5.4); ctx.stroke();
  ctx.restore();
}
// Shinra Tensei, Địa Bộc Thiên Tinh, Vạn Tượng Thiên Dẫn
function drawPainFx() {
  const b = S.ball;
  for (const l of S.pullLines) {
    ctx.globalAlpha = clamp(l.t / .35, 0, 1);
    ctx.strokeStyle = 'rgb(255 190 120 / .8)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(b.x, b.y - 10); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (S.pull) {
    const k = S.pull.t / .45;
    ctx.strokeStyle = `rgb(255 200 140 / ${(k * .7).toFixed(2)})`; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(b.x, b.y - 10, S.pull.r * ((k + i / 3) % 1), 0, Math.PI * 2); ctx.stroke(); }
  }
  const C = S.chibaku;
  if (C) {
    const fade = clamp(C.t / .3, 0, 1);
    ctx.globalAlpha = fade;
    const g = ctx.createRadialGradient(C.x, C.y, 4, C.x, C.y, 240);
    g.addColorStop(0, 'rgb(20 10 30 / .5)'); g.addColorStop(1, 'rgb(20 10 30 / 0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(C.x, C.y, 240, 0, Math.PI * 2); ctx.fill();
    for (const k of C.rocks) {
      const x = C.x + Math.cos(k.a) * k.rr, y = C.y + Math.sin(k.a) * k.rr * .8;
      ctx.fillStyle = '#6b5a4a'; ctx.strokeStyle = '#3a3028'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x - k.s, y); ctx.lineTo(x - k.s * .3, y - k.s); ctx.lineTo(x + k.s, y - k.s * .4); ctx.lineTo(x + k.s * .6, y + k.s * .8); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#05030a'; ctx.beginPath(); ctx.arc(C.x, C.y, 16 + Math.sin(S.t * 10) * 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b48cff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.globalAlpha = 1;
  }
  const sh = S.shinra;
  if (sh && sh.r) {
    const k = Math.min(1, sh.t / sh.dur), fade = sh.t > sh.dur ? 1 - (sh.t - sh.dur) / .35 : 1;
    ctx.globalAlpha = clamp(fade, 0, 1);
    const g = ctx.createRadialGradient(sh.x, sh.y, sh.r * .2, sh.x, sh.y, sh.r);
    g.addColorStop(0, 'rgb(255 255 255 / .05)'); g.addColorStop(.85, 'rgb(220 210 255 / .2)'); g.addColorStop(1, 'rgb(255 255 255 / .55)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sh.x, sh.y, sh.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(sh.x, sh.y, sh.r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgb(200 180 255 / .7)'; ctx.lineWidth = 3;
    for (const m of [.75, .5]) { ctx.beginPath(); ctx.arc(sh.x, sh.y, sh.r * m * (1 + Math.sin(S.t * 20) * .02), 0, Math.PI * 2); ctx.stroke(); }
    // vệt gió toả ra
    ctx.strokeStyle = 'rgb(255 255 255 / .6)'; ctx.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2 + k;
      ctx.beginPath(); ctx.moveTo(sh.x + Math.cos(a) * sh.r * .6, sh.y + Math.sin(a) * sh.r * .6); ctx.lineTo(sh.x + Math.cos(a) * sh.r * .95, sh.y + Math.sin(a) * sh.r * .95); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}
// Goku: tia Kamehameha, vệt Thuấn Di, sóng KI bạc khi hoá Bản Năng Vô Cực
function drawGokuFx() {
  for (const p of S.tele) {
    const k = p.t / .35;
    ctx.globalAlpha = clamp(k, 0, 1);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const x = p.x + (i - 3) * 6, h = 30 + (i % 3) * 14;
      ctx.beginPath(); ctx.moveTo(x, p.y + R - (1 - k) * 40); ctx.lineTo(x, p.y + R - h - (1 - k) * 40); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  const K = S.kame;
  if (K && K.len > 0) {
    const fade = K.t > K.dur ? clamp(1 - (K.t - K.dur) / .25, 0, 1) : 1, w = K.w * (1 + Math.sin(S.t * 45) * .07) * (.4 + .6 * fade);
    ctx.save(); ctx.translate(K.x, K.y); ctx.scale(K.d, 1);
    ctx.globalAlpha = fade;
    for (const [s, c] of [[1.7, 'rgb(90 170 255 / .3)'], [1, '#5fb8ff'], [.5, '#e6f6ff']]) {
      const ww = w * s;
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.moveTo(0, -ww * .7); ctx.lineTo(K.len, -ww); ctx.arc(K.len, 0, ww, -Math.PI / 2, Math.PI / 2); ctx.lineTo(0, ww * .7); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, ww * 1.1, 0, Math.PI * 2); ctx.fill();
    }
    // vệt năng lượng chạy dọc tia
    ctx.strokeStyle = 'rgb(255 255 255 / .7)'; ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const x = ((S.t * 1400 + i * 137) % Math.max(1, K.len)), y = Math.sin(i * 2.3 + S.t * 20) * w * .7;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40, y); ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  const U = S.uiBurst;
  if (U) {
    const r = 30 + U.t * 1000;
    ctx.globalAlpha = clamp(1 - U.t, 0, 1);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(U.x, U.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgb(170 200 255 / .8)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(U.x, U.y, r * .8, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
// ngọn lửa hào quang quanh người: cung trên lởm chởm, chập chờn
function drawAura(x, y, w, h, fill, seed) {
  ctx.fillStyle = fill; ctx.beginPath();
  ctx.moveTo(x - w * .6, y);
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI * (1 - i / n), tip = i % 2 ? .78 : 1 + .25 * Math.sin(S.t * 14 + i * 1.7 + seed);
    ctx.lineTo(x + Math.cos(a) * w * tip, y - h * .35 - Math.sin(a) * h * .65 * tip);
  }
  ctx.lineTo(x + w * .6, y);
  ctx.quadraticCurveTo(x, y + h * .2, x - w * .6, y);
  ctx.fill();
}
// Goku (fan art hình khối): tóc đen nhiều chỏm nhọn, võ phục cam, áo lót + đai + bao cổ tay + ủng xanh.
// Bản Năng Vô Cực: tóc và mắt bạc, hào quang bạc xanh cháy quanh người. Đang bay thì nghiêng người, chân co ra sau.
function drawGoku(b, charged) {
  const sq = b.squash, air = !S.onGround, running = !air && Math.abs(b.vx) > 30, ph = b.run, ui = S.ui > 0;
  const flying = air && Math.abs(b.vx) > 80;
  const bob = running ? Math.abs(Math.sin(ph)) * 2.5 : air ? Math.sin(S.t * 4) * 1.5 : 0;
  const HAIR = ui ? '#e4e9f4' : '#17171d', HAIRD = ui ? '#8d9ab6' : '#000000', SKIN = '#ffd9b8', GI = '#f47b20', GID = '#b5520c', BLUE = '#1d4fae', DK = '#14141a';
  const d = b.face || 1;
  if (ui) {
    drawAura(b.x, b.y + R, 30, 78, 'rgb(150 180 255 / .28)', 0);
    drawAura(b.x, b.y + R, 21, 62, 'rgb(235 242 255 / .45)', 2);
  } else if (charged || S.cast > 0) drawAura(b.x, b.y + R, 24, 66, 'rgb(255 236 140 / .3)', 0);
  ctx.save();
  ctx.translate(b.x, b.y + R - 2 + R * sq * .3);
  ctx.scale(d * (1 + sq * .4), 1 - sq * .5);
  ctx.translate(0, -bob);
  if (flying) { ctx.translate(0, -24); ctx.rotate(.3); ctx.translate(0, 24); }
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // tay sau (Kamehameha thì hai tay cùng đẩy ra trước)
  const kame = S.kame && S.kame.t < S.kame.dur;
  const arm = (x, a) => {
    ctx.save(); ctx.translate(x, -33); ctx.rotate(a);
    ctx.fillStyle = SKIN; ctx.strokeStyle = '#a0704a'; ctx.lineWidth = 1;
    ctx.fillRect(-2.4, -10, 4.8, 10); ctx.strokeRect(-2.4, -10, 4.8, 10);
    ctx.fillStyle = BLUE; ctx.fillRect(-2.7, -9.5, 5.4, 3);
    ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(0, -11, 2.7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  };
  const armA = kame || S.cast > 0 || charged ? -1.55 : flying ? -1.7 : air ? 2.3 : running ? Math.sin(ph + Math.PI) * .7 + 3 : 2.9;
  arm(-4, kame ? -1.45 : flying ? 2.6 : air ? 2.6 : running ? Math.sin(ph) * .7 + 3 : 3.1);
  // chân: quần võ cam rộng, ủng xanh; bay thì co chân ra sau
  const legs = air ? [[-3, flying ? 1.1 : .5], [3, flying ? .6 : -.2]] : [[-3, Math.sin(ph) * .8], [3, Math.sin(ph + Math.PI) * .8]];
  for (const [lx, ang] of legs) {
    ctx.save(); ctx.translate(lx, -17); ctx.rotate(ang);
    ctx.fillStyle = GI; ctx.strokeStyle = GID; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-3.6, 0); ctx.lineTo(3.6, 0); ctx.lineTo(3, 10); ctx.lineTo(-3, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = BLUE; ctx.fillRect(-3, 9.5, 6, 5); ctx.fillRect(-3, 13, 7.5, 2);
    ctx.fillStyle = '#d23a2a'; ctx.fillRect(-3, 9.5, 6, 1.4);
    ctx.restore();
  }
  // thân: võ phục cam cổ chữ V lộ áo lót xanh, đai xanh, kí hiệu trên ngực
  ctx.fillStyle = GI; ctx.strokeStyle = GID; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-9.5, -37); ctx.lineTo(9.5, -37); ctx.lineTo(8.5, -17); ctx.lineTo(-8.5, -17); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = BLUE;
  ctx.beginPath(); ctx.moveTo(-3, -37); ctx.lineTo(5, -37); ctx.lineTo(1, -28); ctx.closePath(); ctx.fill();
  ctx.fillRect(-9, -20.5, 18, 3.8);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(5.2, -31.5, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = DK; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(4, -32.5); ctx.lineTo(6.4, -32.5); ctx.moveTo(5.2, -33.5); ctx.lineTo(5.2, -29.8); ctx.stroke();
  // tay trước
  arm(5, armA);
  // đầu: chỏm tóc nhọn phía sau trước, rồi mặt, rồi mái
  const hx = 1, hy = -46;
  ctx.fillStyle = HAIR; ctx.strokeStyle = HAIRD; ctx.lineWidth = 1.2;
  const back = [[8, -6], [7, -17], [2, -11], [-1, -23], [-5, -12], [-12, -20], [-10, -8], [-19, -12], [-12, -2], [-20, 1], [-11, 4], [-16, 10], [-7, 7], [-2, 2]];
  ctx.beginPath(); back.forEach(([x, y], i) => i ? ctx.lineTo(hx + x, hy + y) : ctx.moveTo(hx + x, hy + y)); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = SKIN; ctx.strokeStyle = '#a0704a'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(hx, hy, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = HAIR; ctx.strokeStyle = HAIRD; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(hx, hy - 1, 11, Math.PI * 1.05, Math.PI * 1.95);
  ctx.lineTo(hx + 11, hy + 1); ctx.lineTo(hx + 8, hy - 4); ctx.lineTo(hx + 6, hy + 2); ctx.lineTo(hx + 3, hy - 4); ctx.lineTo(hx, hy); ctx.lineTo(hx - 5, hy - 5); ctx.lineTo(hx - 10, hy + 1);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // chỏm tóc rủ trước trán đặc trưng
  ctx.beginPath(); ctx.moveTo(hx + 2, hy - 7); ctx.lineTo(hx + 7, hy + 3); ctx.lineTo(hx + 7.5, hy - 6); ctx.closePath(); ctx.fill();
  // mắt (Bản Năng Vô Cực: mắt bạc), mày nhíu, miệng cười
  ctx.fillStyle = ui ? '#cfd9f2' : '#ffffff'; ctx.beginPath(); ctx.ellipse(hx + 6, hy + 2, 2, 2.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = ui ? '#6d7fa8' : DK; ctx.beginPath(); ctx.arc(hx + 6.6, hy + 2.2, 1.1, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = DK; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(hx + 3.5, hy - 1.8); ctx.lineTo(hx + 9, hy - .4); ctx.stroke();
  ctx.strokeStyle = '#7a4a3a'; ctx.lineWidth = 1.1; ctx.beginPath();
  if (ui || kame) { ctx.moveTo(hx + 5, hy + 7); ctx.lineTo(hx + 8, hy + 6.8); }
  else ctx.arc(hx + 6.5, hy + 5.5, 2, .3, Math.PI - .3);
  ctx.stroke();
  ctx.restore();
}
// Pikachu chibi (fan art vẽ bằng hình khối). Gốc toạ độ ở tâm hitbox, +x là hướng mặt.
function drawPikachu(b, charged) {
  const sq = b.squash, air = !S.onGround, speed = Math.abs(b.vx);
  const running = !air && speed > 30;
  const ph = b.run;                                   // pha chân chạy
  const bob = running ? Math.abs(Math.sin(ph)) * 3 : 0;
  const Y = charged ? '#fff27a' : '#ffd21f', DK = '#3a2a10', BR = '#a8641e';
  ctx.save();
  ctx.translate(b.x, b.y + R - 2 + R * sq * .3);      // đặt gốc ở chân
  ctx.scale((b.face || 1) * (1 + sq * .4), 1 - sq * .5);
  ctx.translate(0, -bob);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  // đuôi tia sét
  ctx.save(); ctx.translate(-14, -18); ctx.rotate(-.35 + Math.sin(S.t * 6) * .12 + (running ? Math.sin(ph) * .1 : 0));
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(-6, -8); ctx.lineTo(-2, -10); ctx.lineTo(-10, -20); ctx.lineTo(-4, -22); ctx.lineTo(-14, -36);
  ctx.lineTo(6, -24); ctx.lineTo(0, -22); ctx.lineTo(6, -12); ctx.lineTo(2, -10); ctx.lineTo(6, -2); ctx.closePath();
  ctx.fillStyle = Y; ctx.fill(); ctx.strokeStyle = DK; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = BR; ctx.fillRect(-1, -6, 6, 5);
  ctx.restore();

  // chân sau / chân trước: chạy thì đánh qua lại, trên không thì co lại
  const legs = air ? [[-7, -5, -.6], [6, -5, .6]] : [[-6, 0, Math.sin(ph) * .9], [6, 0, Math.sin(ph + Math.PI) * .9]];
  for (const [lx, ly, ang] of legs) {
    ctx.save(); ctx.translate(lx, -8 + ly); ctx.rotate(ang);
    ctx.fillStyle = Y; ctx.strokeStyle = DK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 5, 4.5, 6.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // thân
  ctx.fillStyle = Y; ctx.strokeStyle = DK; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.ellipse(0, -16, 13, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // sọc nâu trên lưng
  ctx.strokeStyle = BR; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-11, -22); ctx.lineTo(-6, -20); ctx.moveTo(-12, -15); ctx.lineTo(-7, -14); ctx.stroke();
  // tay: chạy thì vung, nhảy thì giơ lên
  ctx.fillStyle = Y; ctx.strokeStyle = DK; ctx.lineWidth = 2;
  const armA = S.cast > 0 ? -1.45 : air ? -1.9 : running ? Math.sin(ph + Math.PI) * .8 : .3;
  ctx.save(); ctx.translate(8, -20); ctx.rotate(armA);
  ctx.beginPath(); ctx.ellipse(0, 5, 3.2, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();

  // đầu
  const hy = -34;
  // tai dài, chóp đen; nảy theo nhịp chạy
  const earSwing = running ? Math.sin(ph * 2) * .12 : Math.sin(S.t * 2) * .05;
  for (const [ex, base] of [[-5, -.55], [5, .15]]) {
    ctx.save(); ctx.translate(ex, hy - 9); ctx.rotate(base + earSwing - (air ? .2 : 0));
    ctx.beginPath(); ctx.moveTo(-4.5, 0); ctx.quadraticCurveTo(-5, -14, 0, -24); ctx.quadraticCurveTo(5, -14, 4.5, 0); ctx.closePath();
    ctx.fillStyle = Y; ctx.fill(); ctx.strokeStyle = DK; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-6, -26, 12, 9);
    ctx.restore();
    ctx.restore();
  }
  ctx.fillStyle = Y; ctx.strokeStyle = DK; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.ellipse(2, hy, 14, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // mắt (chớp mắt định kì), má đỏ, mũi, miệng
  const blinkEye = Math.floor(S.t * 10) % 37 === 0;
  ctx.fillStyle = '#1a1a1a';
  if (blinkEye) ctx.fillRect(6, hy - 2, 6, 1.8);
  else {
    ctx.beginPath(); ctx.arc(9, hy - 2, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(9.8, hy - 3, 1, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#e8402c';
  ctx.beginPath(); ctx.arc(11, hy + 5, 3.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-6, hy + 4, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(15, hy + 1, 2, 1.6);
  if (S.cast > 0 || charged) {
    // má toé tia lửa điện
    ctx.strokeStyle = Math.floor(S.t * 30) % 2 ? '#ffffff' : '#fff27a'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(14, hy + 3); ctx.lineTo(18, hy + 1); ctx.lineTo(17, hy + 5); ctx.lineTo(21, hy + 4);
    ctx.moveTo(13, hy + 8); ctx.lineTo(17, hy + 10); ctx.lineTo(15, hy + 12); ctx.stroke();
  }
  ctx.strokeStyle = DK; ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (air || charged) ctx.arc(12, hy + 6, 2.2, 0, Math.PI);        // há miệng "Pika!"
  else ctx.arc(12, hy + 5, 1.6, .2, Math.PI - .2);
  ctx.stroke();
  ctx.restore();

  // tia điện quanh người khi Vô địch
  if (charged) {
    ctx.strokeStyle = Math.floor(S.t * 20) % 2 ? '#ffffff' : '#fff27a'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) {
      const a0 = S.t * 9 + i * Math.PI / 2, r0 = R + 6;
      ctx.beginPath();
      ctx.moveTo(b.x + Math.cos(a0) * r0, b.y + Math.sin(a0) * r0);
      ctx.lineTo(b.x + Math.cos(a0 + .25) * (r0 + 10), b.y + Math.sin(a0 + .25) * (r0 + 10) - 4);
      ctx.lineTo(b.x + Math.cos(a0 + .4) * (r0 + 4), b.y + Math.sin(a0 + .4) * (r0 + 4));
      ctx.lineTo(b.x + Math.cos(a0 + .6) * (r0 + 14), b.y + Math.sin(a0 + .6) * (r0 + 14));
      ctx.stroke();
    }
  }
}
// Pikachu Dynamax: vẽ sau địa hình, trước quái và boss để không che mất chiêu của địch
function drawPikaMaxLayer() {
  if (S.dead) return;
  if (S.safe && Math.floor(S.t * 12) % 2) return;
  const b = S.ball, sq = b.squash, air = !S.onGround;
  const running = !air && Math.abs(b.vx) > 30, feet = b.y + R;
  // bóng đổ dưới chân
  const gy = groundYAt(b.x);
  if (gy != null && gy - feet < 400) {
    const k = clamp(1 - (gy - feet) / 400, .3, 1);
    ctx.fillStyle = `rgb(0 0 0 / ${(.28 * k).toFixed(2)})`;
    ctx.beginPath(); ctx.ellipse(b.x, gy - 2, 15 * MAX_K * k, 2.6 * MAX_K * k, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.save();
  ctx.translate(b.x, feet + R * sq * .3);
  ctx.scale((b.face || 1) * (1 + sq * .4) * MAX_K, (1 - sq * .5) * MAX_K);
  drawPikaHD(running, b.run, air, S.cast > 0 || S.charging || S.zFx > 0 || !!S.vbeam);
  ctx.restore();
}
// Pikachu vẽ kĩ (Dynamax phóng to 10 lần): chân ở y = 0, quay mặt sang phải
function drawPikaHD(running, ph, air, cast) {
  const OL = '#5a3a0e', BR = '#9a5a1c', T = S.t;
  const bob = running ? Math.abs(Math.sin(ph)) * .9 : Math.sin(T * 2.2) * .25;
  const yel = (x, y, r) => {
    const g = ctx.createRadialGradient(x - r * .35, y - r * .45, r * .08, x, y, r * 1.08);
    g.addColorStop(0, '#fff7b0'); g.addColorStop(.45, '#ffd62e'); g.addColorStop(1, '#e09c08');
    return g;
  };
  const ink = (w = .55) => { ctx.strokeStyle = OL; ctx.lineWidth = w; ctx.stroke(); };
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // hào quang Dynamax đỏ hồng phía sau
  const aura = ctx.createRadialGradient(0, -26, 4, 0, -26, 42);
  aura.addColorStop(0, 'rgb(255 60 100 / .38)'); aura.addColorStop(.6, 'rgb(255 40 90 / .16)'); aura.addColorStop(1, 'rgb(255 40 90 / 0)');
  ctx.fillStyle = aura;
  ctx.beginPath(); ctx.arc(0, -26, 42, 0, Math.PI * 2); ctx.fill();
  // mây Gigantamax đỏ lượn vòng trên đầu: nửa sau vẽ trước thân, nửa trước vẽ sau cùng
  const clouds = front => {
    for (let i = 0; i < 8; i++) {
      const a = T * .9 + i * Math.PI / 4, sn = Math.sin(a);
      if ((sn > 0) !== front) continue;
      const cx = Math.cos(a) * 21, cy = -50 + sn * 3, r = 2.8 + (i % 3) * .6;
      const g = ctx.createRadialGradient(cx - r * .3, cy - r * .4, r * .2, cx, cy, r * 1.3);
      g.addColorStop(0, '#ffc2cc'); g.addColorStop(.5, '#ff3d64'); g.addColorStop(1, '#a80c34');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.arc(cx + r * .9, cy + .6, r * .75, 0, Math.PI * 2); ctx.arc(cx - r * .9, cy + .7, r * .7, 0, Math.PI * 2); ctx.fill();
    }
  };
  clouds(false);
  ctx.save(); ctx.translate(0, -bob);
  // đuôi tia sét, gốc nâu
  ctx.save(); ctx.translate(-8, -9); ctx.rotate(-.12 + Math.sin(T * 3) * .07 + (running ? Math.sin(ph) * .06 : 0));
  const tail = [[1.5, -.5], [-3, -3.5], [-1, -6.5], [-8, -10], [-5, -14], [-15, -19], [-10, -25], [-23, -31], [-12, -33], [-16, -27], [-6, -21], [-9, -17], [-1, -12], [-3, -9], [2.5, -4]];
  ctx.beginPath(); tail.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  const tg = ctx.createLinearGradient(0, 0, -18, -32);
  tg.addColorStop(0, '#e8a40c'); tg.addColorStop(.5, '#ffd62e'); tg.addColorStop(1, '#fff3a0');
  ctx.fillStyle = tg; ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = BR; ctx.fillRect(-6, -8, 12, 9); ctx.restore();
  ink();
  ctx.restore();
  // chân sau
  const sw = running ? Math.sin(ph) * 2.2 : 0, lift = air ? -1.5 : 0;
  ctx.fillStyle = yel(-5, -1.5, 5);
  ctx.beginPath(); ctx.ellipse(-5 - sw, -1.6 + lift, 4.6, 2.3, -.1, 0, Math.PI * 2); ctx.fill(); ink();
  // thân hình quả lê
  ctx.beginPath();
  ctx.moveTo(-1, -23);
  ctx.bezierCurveTo(-10, -23, -12.5, -10, -10.5, -4.5);
  ctx.bezierCurveTo(-9, -1, 8, -1, 9.5, -4.5);
  ctx.bezierCurveTo(12, -10, 9, -23, -1, -23);
  ctx.fillStyle = yel(-1, -12, 12); ctx.fill();
  // sọc nâu trên lưng, bụng sáng
  ctx.save(); ctx.clip();
  ctx.fillStyle = BR;
  ctx.beginPath(); ctx.ellipse(-11, -16, 3.2, 1.3, -.25, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-11.5, -11.5, 3, 1.2, -.15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgb(255 248 190 / .45)';
  ctx.beginPath(); ctx.ellipse(3.5, -10, 5, 7, .15, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ink();
  // chân trước có ngón
  ctx.fillStyle = yel(6, -1.5, 5);
  ctx.beginPath(); ctx.ellipse(6 + sw, -1.6 + lift, 5, 2.4, .08, 0, Math.PI * 2); ctx.fill(); ink();
  ctx.beginPath(); ctx.moveTo(8.5 + sw, -2.6 + lift); ctx.lineTo(9 + sw, -.9 + lift); ctx.moveTo(10.2 + sw, -2.3 + lift); ctx.lineTo(10.6 + sw, -.9 + lift); ink(.35);
  // tay: vung khi chạy, giơ khi tung chiêu
  const armA = cast ? -1.9 : air ? -1.4 : running ? Math.sin(ph + Math.PI) * .6 : .25;
  for (const [ax, ay, o] of [[3, -17, -.3], [7.5, -16.5, 0]]) {
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(armA + o);
    ctx.fillStyle = yel(0, 2.5, 3.5);
    ctx.beginPath(); ctx.ellipse(.5, 2.8, 1.9, 3.4, -.2, 0, Math.PI * 2); ctx.fill(); ink(.45);
    ctx.restore();
  }
  // tai dài chóp đen, vẫy theo nhịp
  const hx = 2, hy = -30;
  const earSw = running ? Math.sin(ph * 2) * .08 : Math.sin(T * 1.8) * .04;
  for (const [ex, ey, rot] of [[-5, -38, -.5], [6, -39, .28]]) {
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(rot + earSw - (air ? .12 : 0));
    ctx.beginPath(); ctx.moveTo(-3.2, 2); ctx.bezierCurveTo(-4.4, -7, -2, -14, 0, -18); ctx.bezierCurveTo(2, -14, 4.4, -7, 3.2, 2); ctx.closePath();
    ctx.fillStyle = yel(0, -6, 9); ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#1c1612'; ctx.beginPath(); ctx.moveTo(-6, -11.5); ctx.quadraticCurveTo(0, -9.5, 6, -11.5); ctx.lineTo(6, -20); ctx.lineTo(-6, -20); ctx.fill();
    ctx.fillStyle = 'rgb(255 255 255 / .25)'; ctx.beginPath(); ctx.ellipse(-1, -6, .9, 4.5, -.1, 0, Math.PI * 2); ctx.fill();
    ctx.restore(); ink();
    ctx.restore();
  }
  // đầu tròn, má phúng phính
  ctx.beginPath();
  ctx.moveTo(hx - 13, hy + 1);
  ctx.bezierCurveTo(hx - 14, hy - 10, hx + 14, hy - 12, hx + 14, hy + 1);
  ctx.bezierCurveTo(hx + 14.5, hy + 7, hx + 9, hy + 10, hx, hy + 10);
  ctx.bezierCurveTo(hx - 9, hy + 10, hx - 13.5, hy + 7, hx - 13, hy + 1);
  ctx.fillStyle = yel(hx, hy, 14); ctx.fill(); ink(.6);
  // mắt to tròn có ánh sáng, chớp định kì
  const blinkE = Math.floor(T * 10) % 41 === 0;
  for (const [ex, sc] of [[hx - 2.5, .85], [hx + 7.5, 1]]) {
    if (blinkE) { ctx.beginPath(); ctx.moveTo(ex - 2 * sc, hy - 1.5); ctx.quadraticCurveTo(ex, hy - .5, ex + 2 * sc, hy - 1.5); ink(.5); continue; }
    ctx.fillStyle = '#17120e';
    ctx.beginPath(); ctx.ellipse(ex, hy - 1.8, 2.2 * sc, 2.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(ex - .6 * sc, hy - 2.8, .95, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgb(255 255 255 / .5)';
    ctx.beginPath(); ctx.arc(ex + .7 * sc, hy - .6, .45, 0, Math.PI * 2); ctx.fill();
  }
  // mũi
  ctx.fillStyle = '#17120e';
  ctx.beginPath(); ctx.ellipse(hx + 3.2, hy + 1.4, .55, .35, 0, 0, Math.PI * 2); ctx.fill();
  // má đỏ
  for (const [cx, r] of [[hx - 8.6, 2.6], [hx + 11.2, 3]]) {
    const g = ctx.createRadialGradient(cx - r * .3, hy + 4 - r * .3, r * .1, cx, hy + 4, r);
    g.addColorStop(0, '#ff7a6a'); g.addColorStop(1, '#d8261c');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, hy + 4, r, 0, Math.PI * 2); ctx.fill();
  }
  // miệng: "ω" khi đứng, há to "Pika!" khi nhảy hay tung chiêu
  if (air || cast) {
    ctx.beginPath(); ctx.moveTo(hx + 1.2, hy + 3.2); ctx.quadraticCurveTo(hx + 3.2, hy + 8.5, hx + 5.4, hy + 3.2); ctx.closePath();
    ctx.fillStyle = '#7a1e1a'; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#ff8a8a'; ctx.beginPath(); ctx.ellipse(hx + 3.3, hy + 6.6, 1.6, 1.1, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ink(.4);
  } else {
    ctx.beginPath(); ctx.arc(hx + 2.3, hy + 2.8, 1, .1, Math.PI - .1); ctx.moveTo(hx + 5.1, hy + 2.8); ctx.arc(hx + 4.1, hy + 2.8, 1, .1, Math.PI - .1); ink(.4);
  }
  // má toé điện khi tung chiêu
  if (cast) {
    ctx.strokeStyle = Math.floor(T * 30) % 2 ? '#ffffff' : '#fff27a'; ctx.lineWidth = .5;
    for (const [cx, d] of [[hx + 11.2, 1], [hx - 8.6, -1]]) {
      ctx.beginPath(); ctx.moveTo(cx + d * 2.5, hy + 3); ctx.lineTo(cx + d * 5, hy + 1.5); ctx.lineTo(cx + d * 4.3, hy + 4); ctx.lineTo(cx + d * 7, hy + 3.4);
      ctx.moveTo(cx + d * 2.5, hy + 5.5); ctx.lineTo(cx + d * 5, hy + 7.5); ctx.lineTo(cx + d * 3.6, hy + 8.6); ctx.stroke();
    }
  }
  ctx.restore();
  clouds(true);
}
// hitbox thật của Pikachu Dynamax: vòng điện nhỏ ở chân
function drawMaxCore(b, charged) {
  const p = 1 + Math.sin(S.t * 8) * .1;
  ctx.strokeStyle = charged ? '#ffffff' : 'rgb(255 90 110 / .85)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(b.x, b.y, R * p, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgb(255 242 122 / .35)';
  ctx.beginPath(); ctx.arc(b.x, b.y, R * .55 * p, 0, Math.PI * 2); ctx.fill();
}
// 100.000 Vôn: 3 tia sét zíc zắc phóng ngang từ má Pikachu tới mép màn hình, có nhánh rẽ, chớp đổi hình liên tục
function drawVoltBeam() {
  const V = S.vbeam;
  if (!V) return;
  const big = CHAR === 'pika' && DMAX, o = voltOrigin(), dir = V.dir;
  const p = 1 - V.t / V.dur, reach = Math.min(1, p / .12);
  const edge = dir > 0 ? S.cam.x + viewW + 60 : S.cam.x - 60;
  const len = Math.max(0, (edge - o.x) * dir) * reach;
  const amp = big ? 55 : 26, seg = big ? 56 : 30, W = big ? 2.2 : 1.2;
  let seed = (Math.floor(S.t * 22) % 9973) * 7919 + 1;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const stroke = (pts, layers) => {
    for (const [w, c] of layers) {
      ctx.strokeStyle = c; ctx.lineWidth = w;
      ctx.beginPath(); pts.forEach(([x, y], j) => j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    }
  };
  const MAIN = [[26 * W, 'rgb(255 230 80 / .22)'], [12 * W, 'rgb(255 214 40 / .55)'], [6 * W, '#ffe14a'], [2.6 * W, '#ffffff']];
  const FORK = [[8 * W, 'rgb(255 214 40 / .45)'], [3 * W, '#fff27a'], [1.2 * W, '#ffffff']];
  ctx.save();
  ctx.globalAlpha = clamp(V.t / .2, 0, 1);
  ctx.lineJoin = 'miter'; ctx.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    const slope = (k - 1) * (big ? .16 : .1);   // ba tia toả quạt nhẹ
    const pts = [[o.x, o.y]];
    let i = 0;
    for (let d = seg * .6; d < len; d += seg * (.7 + rnd() * .6), i++) {
      const side = i % 2 ? 1 : -1;
      pts.push([o.x + dir * d, o.y + slope * d + side * amp * (.45 + rnd() * .55) * Math.min(1, d / (seg * 2))]);
    }
    pts.push([o.x + dir * len, o.y + slope * len]);
    stroke(pts, MAIN);
    // nhánh rẽ ngắn
    for (let j = 2; j < pts.length - 1; j += 2) {
      if (rnd() < .45) continue;
      const [fx, fy] = pts[j], f = [[fx, fy]];
      let x = fx, y = fy;
      const up = rnd() < .5 ? -1 : 1;
      for (let s = 0; s < 3; s++) { x += dir * seg * (.4 + rnd() * .4); y += up * seg * (.3 + rnd() * .5) * (s % 2 ? -.4 : 1); f.push([x, y]); }
      stroke(f, FORK);
    }
    // toé lửa điện ở đầu tia
    const [tx, ty] = pts[pts.length - 1];
    ctx.fillStyle = 'rgb(255 250 200 / .8)';
    ctx.beginPath(); ctx.arc(tx, ty, (6 + rnd() * 6) * W, 0, Math.PI * 2); ctx.fill();
  }
  // quả cầu điện sáng chói nơi phóng ra
  const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, 40 * W);
  g.addColorStop(0, '#ffffff'); g.addColorStop(.3, 'rgb(255 240 120 / .9)'); g.addColorStop(1, 'rgb(255 220 40 / 0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y, 40 * W, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
// biểu tượng pha lê Z xoay toả sáng trên đầu màn hình khi dùng tuyệt kĩ Z
function drawZMove() {
  if (S.zFx <= 0) return;
  const p = 1 - S.zFx / 1.6, cx = S.cam.x + viewW / 2, cy = S.cam.y + 170;
  ctx.save();
  ctx.globalAlpha = clamp(S.zFx / .4, 0, 1);
  ctx.translate(cx, cy);
  ctx.save(); ctx.rotate(S.t * 1.5);
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6);
    ctx.fillStyle = i % 2 ? 'rgb(255 225 74 / .28)' : 'rgb(255 255 255 / .22)';
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(0, -420); ctx.lineTo(14, 0); ctx.fill();
  }
  ctx.restore();
  const k = (.5 + Math.min(1, p * 5) * .5) * 1.6;
  ctx.scale(k, k);
  ctx.fillStyle = 'rgb(255 240 150 / .35)';
  ctx.beginPath(); ctx.arc(0, 0, 62, 0, Math.PI * 2); ctx.fill();
  const Z = [[-40, -42], [40, -42], [40, -24], [-10, 24], [40, 24], [40, 42], [-40, 42], [-40, 24], [10, -24], [-40, -24]];
  ctx.beginPath(); Z.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  const g = ctx.createLinearGradient(-40, -42, 40, 42);
  g.addColorStop(0, '#fff8c8'); g.addColorStop(.5, '#ffd21f'); g.addColorStop(1, '#e08a00');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.strokeStyle = '#7a4a00'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}
function drawParts() {
  for (const p of S.parts) {
    ctx.globalAlpha = Math.max(0, p.life / .9);
    ctx.fillStyle = p.c; ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
  }
  ctx.globalAlpha = 1;
}

function render() {
  const b = S.ball, cam = S.cam;
  const tx = clamp(b.x - viewW * .4, 0, Math.max(0, LEVEL_W - viewW));
  const ty = clamp(camTargetY(), camMinY(), CAM_Y[1]);
  cam.x += (tx - cam.x) * .12; cam.y += (ty - cam.y) * .08;
  const cx = Math.round(cam.x), cy = Math.round(cam.y);

  ctx.setTransform(PX, 0, 0, PX, 0, 0);
  ctx.imageSmoothingEnabled = true;
  drawBackground();
  ctx.setTransform(PX, 0, 0, PX, -cx * PX, -cy * PX);
  const x0 = cx - 100, x1 = cx + viewW + 100;
  for (const [x, f, s] of FLOWERS) if (x > x0 && x < x1) drawFlower(x, f(x), s);
  for (const [x, f] of SIGNS) if (x > x0 && x < x1) drawSign(x, f(x));
  for (const tp of TIPS) if (tp.x > x0 && tp.x < x1) drawTipSign(tp.x, tp.f(tp.x));
  CHECKPOINTS.forEach((c, i) => drawFlag(c.x, c.f(c.x), S.cp >= i ? '#4fcf2e' : '#c9d1db', false));
  if (S.boss.dead) drawFlag(GOAL.x, GOAL.f(GOAL.x), '#e3262b', true);
  drawSolids(x0, x1);
  if (CHAR === 'pika' && DMAX) drawPikaMaxLayer();
  drawGate();
  drawSpikes();
  drawHellSky();
  drawStars();
  drawEnemies();
  drawFlyers();
  drawIcicles();
  drawTurret();
  drawHearts();
  drawBoss();
  drawBullets();
  drawBolts();
  drawOrbs();
  drawTimeStop();
  drawBall();
  drawCharge();
  drawVolt();
  drawVoltBeam();
  drawZMove();
  drawParts();
  drawPops();
  drawFlash();
}

/* ---------- Khung hình ---------- */
function fit() {
  const w = innerWidth, h = innerHeight;
  viewW = VIEW_H * w / h;
  // vẽ đúng độ phân giải màn hình (tối đa 2× cho màn retina), giới hạn bề ngang để máy yếu vẫn mượt
  PX = Math.min(2, window.devicePixelRatio || 1) * h / VIEW_H;
  if (viewW * PX > 2800) PX = 2800 / viewW;
  cv.width = Math.round(viewW * PX);
  cv.height = Math.round(VIEW_H * PX);
}
addEventListener('resize', fit);

let last = performance.now();
function loop(now) {
  const dt = Math.min(.033, (now - last) / 1000); last = now;
  if (!paused) update(dt);
  try { render(); } catch (e) { console.error(e); ctx.restore(); }
  const sec = Math.floor(S.time);
  if (sec !== lastSec) {
    lastSec = sec;
    const left = Math.max(0, Math.ceil(TIME_LIMIT - S.time));
    $('time').textContent = fmt(left);
    $('time').classList.toggle('low', left <= 20);
  }
  const pct = (progress() * 100).toFixed(1) + '%';
  $('progFill').style.width = pct; $('progMe').style.left = pct;
  const showTr = S.boss.phase === 4 && !S.boss.dead;
  $('traceChip').hidden = !showTr;
  if (showTr) $('traces').textContent = S.traces;
  const en = Math.floor(S.energy);
  if (en !== lastSkill) {
    lastSkill = en;
    $('energy').textContent = en;
    $('efill').style.width = en + '%';
    $('energyChip').dataset.full = en >= ENERGY_MAX ? '1' : '0';
    $('skillBtn').disabled = en < cost('tackle');
    $('voltBtn').disabled = en < (cost('volt') ?? COST.volt);
  }
  requestAnimationFrame(loop);
}

/* ---------- Chế độ thử (chỉ trên máy đang dùng) ----------
   Mở game với đuôi #vohan để bật: vô hạn mạng, phím B đưa tới trước đấu trường boss, không lưu điểm.
   Mở với đuôi #thuong để tắt. Cài đặt lưu trong trình duyệt của máy đó. */
const TEST_KEY = 'bongdo.test';
// Bản web công khai (github.io) luôn chơi 3 mạng: tắt hẳn chế độ thử và xoá cài đặt cũ đã lưu
const PUBLIC_WEB = /github\.io$/.test(location.hostname || '');
try {
  if (location.hash === '#vohan' && !PUBLIC_WEB) localStorage.setItem(TEST_KEY, '1');
  if (location.hash === '#thuong' || PUBLIC_WEB) localStorage.removeItem(TEST_KEY);
} catch (e) {}
const TEST_MODE = lsGet(TEST_KEY, '') === '1';
function warpToBoss() {
  if (S.won || S.lost || S.fight) return;
  const c = CHECKPOINTS[CHECKPOINTS.length - 1], x = c.x + 20;
  Object.assign(S.ball, { x, y: c.f(x) - 40, vx: 0, vy: 0 });
  S.cp = CHECKPOINTS.length - 1; S.spawn = { x: c.x, y: c.f(c.x) - 60 }; S.safeY = S.ball.y;
  S.tipSeen = S.tipSeen.map(() => true);
  S.cam.x = clamp(x - viewW * .4, 0, Math.max(0, LEVEL_W - viewW));
  S.cam.y = clamp(S.ball.y - VIEW_H * .55, CAM_Y[0], CAM_Y[1]);
  S.pops.push({ x, y: S.ball.y - 60, t: 1, text: 'Tới đấu trường boss', c: '#fff27a' });
}
// Đổi màn: dựng lại địa hình, mốc trên thanh chặng đường, bảng xếp hạng riêng từng màn
const MAP_KEY = 'bongdo.map', MAP_NAMES = { 1: 'Đồng cỏ', 2: 'Núi Quỷ' };
function setMap(n) {
  loadMap(n); lsSet(MAP_KEY, String(MAP));
  $('mapBtn').textContent = `Màn ${MAP}: ${MAP_NAMES[MAP]} (N)`;
  applyChar();
  document.querySelectorAll('#progTrack .cp').forEach(m => m.remove());
  for (const c of CHECKPOINTS) {
    const m = document.createElement('span');
    m.className = 'cp'; m.style.left = (c.x / GOAL.x * 100) + '%';
    $('progTrack').appendChild(m);
  }
  reset(); loadBoard();
}
$('mapBtn').addEventListener('click', e => { setMap(MAP === 1 ? 2 : 1); e.currentTarget.blur(); });
if (TEST_MODE) setTimeout(() => showTip('Chế độ thử: vô hạn mạng · phím B tới thẳng đấu trường boss · không lưu điểm. Mở link với #thuong để tắt.'), 300);

fit();
setMap(Number(lsGet(MAP_KEY, '1')));
requestAnimationFrame(loop);
})();
