(() => {
/* ---------- Hằng số ---------- */
const VIEW_H = 600;      // chiều cao khung nhìn (đơn vị thế giới)
let PX = 1;              // số điểm ảnh canvas trên mỗi đơn vị thế giới; fit() tính theo màn hình để hình luôn nét
const R = 22;            // bán kính bóng
const G = 1900, JUMP = 760, MAXV = 320;
const TIME_LIMIT = 300;               // phải về đích trong 5 phút
// Bộ chiêu của Pikachu: mọi chiêu tốn điện năng (0–100), nạp khi chạy, nhặt sao, hạ quái, đánh trúng boss
const ENERGY_MAX = 100, ENERGY_START = 50;
const COST = { shock: 5, ball: 20, web: 30, tackle: 25, volt: 100 };
const SHOCK_SPEED = 720, SHOCK_LIFE = .7, SHOCK_CD = .3;            // Tia sét: bấm J
const BALL_HOLD = .25, BALL_FULL = .9;                             // Quả cầu điện: giữ J rồi thả
const WEB_SPEED = 460, WEB_LIFE = .65, WEB_STUN = 2;                // Lưới điện: L
const TACKLE_TIME = .55, TACKLE_DASH = .35, TACKLE_SPEED = 700, TACKLE_CD = 1;   // Lao điện: Shift
// Phong ấn của boss: Pikachu bị đóng băng, laze bắn 1 giây trước khi kết thúc
const TS_DUR = 3.5, LASER_AT = 1, LASER_DUR = .35, LASER_CHARGE = .8, LASER_H = 56;
const LEVEL_W = 7000, DEATH_Y = 900;
const LIVES = 3;
// Đấu trường boss ở cuối màn
const ARENA = { l: 6220, r: 6950, gateX: 6190, floor: 420 };
const ARENA_MID = (ARENA.l + ARENA.r) / 2;
const BOSS_W = 64, BOSS_H = 112, AURA_R = 105, WARN = .7;
const EXHAUST = 1.4;                  // boss kiệt sức sau mỗi chiêu: đánh lúc này sát thương ×2
const SWEEP_H = 200, SWEEP_SPEED = 420;
const PHASES = [null,
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
// Thời lượng báo trước của từng chiêu boss
const ACT_WARN = { fan: .5, spikes: .3, puddle: .4, dash: .6, slam: .35, lob: .4, pillar: .3, dual: .5, sweep: 1 };
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

/* ---------- Màn chơi ---------- */
const SOLIDS = [];
function addGround(x0, x1, f) {
  const top = [];
  for (let x = x0; x < x1; x += 16) top.push(x, f(x));
  top.push(x1, f(x1));
  addSolid(top.concat([x1, 1400, x0, 1400]), top, 'ground');
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
addBox(ARENA.r, -800, 80, 1300);                 // tường phải của đấu trường
addBox(ARENA.gateX, -800, 30, 1220);             // cổng trái, chỉ chặn khi đang đánh boss
SOLIDS[SOLIDS.length - 1].gate = true;

const SPIKES = [
  { x0: 3560, x1: 3660, f: f3 },
  { x0: 5150, x1: 5230, f: f4 },
];
const STAR_POS = [
  [500, 400], [700, 370], [955, 280], [1470, 380], [2090, 260], [2790, 390],
  [3005, 320], [3610, 380], [4050, 370], [4480, 300], [5190, 330], [5670, 250],
];
const ENEMY_DEF = [
  { min: 3700, max: 3880, f: f3 },
  { min: 4800, max: 5050, f: f4 },
  { min: 5300, max: 5550, f: f4 },
  { min: 1150, max: 1320, f: f1 },    // quái đầu tiên để tập giẫm
];
const FLOWERS = [[180, f1, 1], [760, f1, .8], [1700, f2, 1.1], [2470, f2, .9], [3460, f3, 1], [4300, f3, .9], [4700, f4, 1.1], [5800, f4, .8]];
const SIGNS = [[300, f1], [1330, f1], [4370, f3]];
const CHECKPOINTS = [{ x: 3420, f: f3 }, { x: 6080, f: f4 }];
const GOAL = { x: 6880, f: f4 };
// Đường đến boss: mẹo theo từng chặng, tim hồi mạng, ụ băng để tập né đạn như khi đánh boss
const MAX_LIVES = 5;
const TIPS = [
  { x: 420,  f: f1, text: 'Thanh ⚡ là điện năng. J: tia sét · giữ J rồi thả: Quả cầu điện (chạy càng nhanh càng mạnh) · L: Lưới điện · Shift: Lao điện · U khi đầy: 100.000 Vôn.' },
  { x: 960,  f: f1, text: 'Quái vuông phía trước: nhảy giẫm lên đầu để hạ nó.' },
  { x: 1760, f: f2, text: 'Dơi lao xuống khi bạn tới gần: giẫm lên đầu hoặc bắn sét.' },
  { x: 2300, f: f2, text: 'Ma lửa bay xuyên mọi thứ và không giẫm được: chỉ chiêu điện mới hạ được nó.' },
  { x: 2620, f: f2, text: 'Giữ ↑ lâu để nhảy cao và xa qua các bục.' },
  { x: 3500, f: f3, text: 'Gai phía trước: nhảy qua, hoặc Lao điện (Shift) để xuyên qua.' },
  { x: 4560, f: f4, text: 'Chim băng thả cột băng: nhìn bóng đổ dưới đất để né, nhảy lên bắn sét để hạ chim.' },
  { x: 5480, f: f4, text: 'Ụ băng bắn đạn sát đất: nhảy qua, bắn sét phá đạn, hoặc Lao điện phá ụ.' },
  { x: 6130, f: f4, text: 'Boss phía trước! Đánh mạnh nhất khi boss kiệt sức sau mỗi chiêu. Giữ ít nhất 25 điện năng cho cú đánh úp.' },
];
// Quái bay: dơi lao xuống, chim băng thả cột băng, ma lửa chỉ hạ được bằng chiêu điện
const FLYER_DEF = [
  { type: 'bat', x: 1900, y: 226 }, { type: 'bat', x: 3000, y: 262 }, { type: 'bat', x: 5000, y: 272 },
  { type: 'ghost', x: 2400, y: 330 }, { type: 'ghost', x: 4300, y: 290 },
  { type: 'bird', x: 4800, y: 250, x0: 4620, x1: 4980 }, { type: 'bird', x: 5420, y: 250, x0: 5300, x1: 5560 },
];
const newFlyer = d => ({ ...d, ax: d.x, ay: d.y, t: Math.random() * 6, alive: true, stun: 0, state: 'patrol', cd: 0, dir: 1, dropT: 1.2, dieT: 0, r: d.type === 'ghost' ? 18 : 16 });
// Mặt đất dùng cho Quả cầu điện nảy và cột băng rơi
const GROUNDS = [[0, 1400, f1], [1540, 2640, f2], [3330, 4420, f3], [4540, LEVEL_W, f4]];
function groundYAt(x) { for (const [a, b, f] of GROUNDS) if (x >= a && x <= b) return f(x); return null; }
const HEARTS = [[2090, 200], [5990, 372]];
const TURRET = { x: 5940, f: f4, every: 2.4, speed: 260, range: 760, hp: 2 };

/* ---------- Trạng thái ---------- */
const S = {};
function reset() {
  Object.assign(S, {
    ball: { x: 120, y: 440, vx: 0, vy: 0, rot: 0, squash: 0, run: 0, face: 1 },
    spawn: { x: 120, y: 440 },
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
  });
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
  storm()   { noise(1.2, .08, 1600); [880, 1175, 1568].forEach((f, i) => tone(f, f * 1.2, .3, 'sine', .04, i * .1)); },
};
const JUMP_SFX = { pika: 'pika', chii: 'wa', rimuru: 'boing', stelle: 'hop', saiyan: 'hop', kiem: 'hop', asta: 'hop', yuno: 'hop' };
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
  if (k === 'volt' && on && !keys.volt) (CHAR === 'saiyan' ? apeForm() : CHAR === 'kiem' ? tamKiem() : fireVolt());
  if (k === 'boom' && on && !keys.boom && CHAR === 'saiyan') selfDestruct();
  if (k === 'whistle' && on && !keys.whistle && CHAR === 'saiyan') whistle();
  if (k === 'skill' && on && !keys.skill) {
    if (S.boss && S.boss.ts > 0 && !S.tsEsc && !S.dead) escapeTimeStop();
    else activateSkill();
  }
  keys[k] = on;
  if (on && !S.moved) { S.moved = true; setTimeout(() => $('hint').classList.add('gone'), 1500); }
}
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
  KeyK: 'skill', ShiftLeft: 'skill', ShiftRight: 'skill', KeyJ: 'bolt', KeyX: 'bolt', KeyL: 'web', KeyC: 'web', KeyU: 'volt', KeyV: 'volt', KeyH: 'regen', KeyI: 'whistle', KeyO: 'boom',
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
  S.power = Math.max(S.power, CHAR === 'saiyan' ? 3 : TACKLE_TIME); S.cd = CH().tackleCd;
  if (CHAR === 'saiyan') S.amber = 3;   // Khiên năng lượng
  const B = S.boss;
  if (B.cut && B.cut.appear && !B.cut.struck) B.cut.blocked = true;   // chặn cú đánh úp của Naamah
  if (!frozenNow() && CHAR !== 'saiyan') S.dash = { dir: S.ball.face || 1, t: TACKLE_DASH };
  sfx(CHAR === 'pika' ? 'pikachu' : CHAR === 'saiyan' ? 'amber' : 'dash');
  const b = S.ball;
  for (let i = 0; i < 20; i++) {
    const a = i / 20 * Math.PI * 2;
    S.parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, life: .5, c: i % 2 ? '#ffc21a' : '#ffffff', r: 6, g: 0 });
  }
}
const typing = e => e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
addEventListener('keydown', e => {
  if (e.code === 'Escape' && paused) { closeChars(); return; }
  if (typing(e)) return;
  if (e.code === 'KeyP') { if (paused) closeChars(); else openChars(); return; }
  if (paused) return;
  if (e.code === 'KeyR') { reset(); return; }
  if (e.code === 'KeyM') { setMuted(!muted); return; }
  if (e.code === 'KeyB' && TEST_MODE) { warpToBoss(); return; }
  const k = KEYMAP[e.code];
  if (k) { e.preventDefault(); if (!e.repeat) setKey(k, true); }
});
addEventListener('keyup', e => { if (typing(e)) return; const k = KEYMAP[e.code]; if (k) { e.preventDefault(); setKey(k, false); } });
addEventListener('blur', () => { keys.left = keys.right = keys.jump = keys.skill = keys.bolt = keys.web = keys.volt = keys.regen = false; S.charging = false; });
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
  const maxv = S.dash ? TACKLE_SPEED : CH().speed * (S.ape > 0 ? 1.15 : 1) * (S.black > 0 ? 1.2 : 1);
  b.vx = clamp(b.vx, -maxv, maxv);
  b.vy = Math.min(b.vy + G * h, 1400);
  b.x += b.vx * h; b.y += b.vy * h;
  S.onGround = false;
  for (const s of SOLIDS) {
    if (b.x + R < s.minX || b.x - R > s.maxX || b.y + R < s.minY) continue;
    if (s.gate && !S.gateClosed) continue;
    collideSolid(s, b);
  }
  if (b.x < R) { b.x = R; b.vx = Math.max(0, b.vx); }
  if (S.onGround) S.lastGround = 0;
}
function die() {
  if (S.dead) return;
  // Rimuru (Đại Hiền Giả): chặn một đòn chí mạng mỗi 15 giây, trừ khi rơi xuống vực
  // Xayda biến khỉ: khỉ khổng lồ chịu đòn thay, mất 6 giây biến hình
  if (S.ape > 0 && S.ball.y <= DEATH_Y) {
    S.ape = Math.max(0, S.ape - 6); S.safe = Math.max(S.safe, 1.2);
    sfx('hit');
    S.pops.push({ x: S.ball.x, y: S.ball.y - 70, t: .9, text: 'Khỉ chịu đòn! -6 giây', c: '#ffb38a' });
    return;
  }
  if (CHAR === 'rimuru' && S.resist <= 0 && S.ball.y <= DEATH_Y) {
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
  S.power = 0; S.dash = null; S.charging = false; S.amber = 0;
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
      Object.assign(u, { x: ARENA.r - 160, dir: -1, vy: 0, y: u.kind === 'ice' ? ARENA.floor - 150 : u.kind === 'fused' ? ARENA.floor - 12 : ARENA.floor });
      u.mt = Math.PI / 2;
    }
    S.bullets = [];
    S.safe = 1.5;
  }
  bossBar();
  S.cam.x = clamp(S.ball.x - viewW * .4, 0, Math.max(0, LEVEL_W - viewW));
}

function update(dt) {
  S.t += dt;
  // Bầu trời địa ngục: chuyển dần sang đỏ đen khi Naamah xuất hiện, trở lại khi Naamah bị hạ
  const Bo = S.boss, hellSky = !Bo.dead && (Bo.phase >= 3 || !!(Bo.cut && Bo.cut.burst));
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
    e.x += e.dir * 70 * dt;
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
    if (S.jumpBuf > 0 && S.lastGround < .1) { b.vy = -JUMP; S.jumpBuf = 0; S.lastGround = 1; sfx(JUMP_SFX[CHAR]); }
    else if (S.jumpBuf > 0 && S.airJumps > 0) {
      // nhảy thêm trên không (Rimuru, Stelle)
      S.airJumps--; b.vy = -JUMP * .92; S.jumpBuf = 0; S.lastGround = 1; sfx(JUMP_SFX[CHAR]);
      boltSpark(b.x, b.y + R, CHAR === 'stelle' ? '#ffd65e' : '#9ef0ff', 8);
    }
    if (!keys.jump && b.vy < -320) b.vy = -320;   // nhả sớm → nhảy thấp

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

  if (b.y > DEATH_Y) die();
  if (!S.power && !S.safe) {
    for (const sp of SPIKES) {
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
  if (S.shockCd > 0 || !spend(COST.shock)) return;
  const b = S.ball, d = b.face || 1;
  S.shockCd = SHOCK_CD; S.cast = .2;
  S.bolts.push({ x: b.x + d * 26, y: b.y - 10, vx: d * SHOCK_SPEED, life: SHOCK_LIFE, seed: Math.random() * 100 });
  sfx('bolt');
}
// Quả cầu điện (Electro Ball): giữ càng lâu cầu càng to; đúng nguyên tác, Pikachu chạy càng nhanh thì càng mạnh
function fireElectroBall(hold) {
  if (!spend(COST.ball)) return;
  const b = S.ball, d = b.face || 1, k = clamp((hold - BALL_HOLD) / (BALL_FULL - BALL_HOLD), 0, 1);
  const fast = Math.abs(b.vx) >= 250;
  const dmg = 1 + (k >= .99 ? 1 : 0) + (fast ? 1 : 0);
  S.orbs.push({ x: b.x + d * 28, y: b.y - 14, vx: d * (430 + Math.abs(b.vx) * .8), vy: -260, r: 9 + k * 9, dmg, bounced: false, life: 1.8, hit: new Set() });
  S.cast = .25;
  sfx('orb');
  S.pops.push({ x: b.x, y: b.y - 58, t: .6, text: `Quả cầu điện ×${dmg}`, c: '#fff27a' });
}
// Lưới điện (Electroweb): quái và boss dính lưới đứng yên, lưới quét sạch đạn trên đường bay
function fireWeb() {
  if (!canAct() || S.webCd > 0 || !spend(COST.web)) return;
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
  S.voltFx = U.fx; S.flash = .9; S.cast = .6; S.swing = SWING; S.ultKind = CHAR;
  sfx(U.sfx);
  if (CHAR === 'chii') S.pops.push({ x: S.ball.x - 60, y: S.ball.y - 80, t: 1, text: 'Ura!', c: '#ffe27a' }, { x: S.ball.x + 60, y: S.ball.y - 90, t: 1, text: 'Yaha!', c: '#ffffff' });
  const x0 = S.cam.x - 40, x1 = S.cam.x + viewW + 40, n = U.n;
  S.voltStrikes = Array.from({ length: n }, (_, i) => x0 + (i + .5) * (x1 - x0) / n + (Math.random() - .5) * 60);
  S.bullets = []; S.tshots = []; S.icicles = [];
  const B = S.boss;
  B.hazards = B.hazards.filter(h => h.type === 'puddle');
  B.sweep = null;
  for (const e of S.enemies) if (e.alive && e.x > x0 && e.x < x1) { e.alive = false; e.squash = 0; boltSpark(e.x, e.f(e.x) - 20, '#16181d', 12); }
  for (const f of S.flyers) if (f.alive && f.x > x0 && f.x < x1) killFlyer(f);
  const T = S.turret;
  if (T.alive && T.x > x0 && T.x < x1) breakTurret();
  if (S.fight && !B.dead && !B.cut && !B.fuse) {
    const u = B.units[0];
    if (u.x > x0 && u.x < x1) { damageBoss(u, U.dmg, 'volt'); if (!B.dead && !B.cut && !B.fuse) { B.stun = Math.max(B.stun, U.stun); B.act = null; } }
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
    if ((e = enemyAt(w.x, w.y, w.r - 6))) { e.stun = WEB_STUN * 1.5; w.life = 0; sfx('web'); continue; }
    if ((f = flyerAt(w.x, w.y, w.r - 6))) { f.stun = WEB_STUN * 1.5; f.state = 'patrol'; w.life = 0; sfx('web'); continue; }
    if ((u = bossUnitAt(w.x, w.y, w.r - 6))) {
      const B = S.boss;
      if (B.ts > 0) { boltSpark(w.x, w.y, '#9aa3ad', 8); w.life = 0; continue; }
      B.stun = WEB_STUN; B.act = null; B.sweep = null; w.life = 0; sfx('web');
      S.pops.push({ x: u.x, y: u.y - BOSS_H - 20, t: .8, text: w.kind === 'rope' ? 'Bị trói!' : 'Dính lưới!', c: '#fff27a' });
    }
  }
  S.webs = S.webs.filter(w => w.life > 0);
  updateCharMoves(dt);
}

/* ---------- Nhân vật khác: Chiikawa, Rimuru, Stelle ----------
   Mọi nhân vật dùng chung các nút (J, giữ J, L, Shift, U) nhưng mỗi người một bộ chiêu. */
const CHARS = {
  pika:   { cost: { tackle: COST.tackle }, tackleCd: TACKLE_CD, regen: 1, speed: MAXV, airJumps: 0, dmgK: 1 },
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
};
const CH = () => CHARS[CHAR];
const cost = k => CH().cost[k];
const MOVES = {
  pika:   { tap: fireShock, hold: fireElectroBall, web: fireWeb },
  chii:   { tap: chiiBonk, hold: chiiWeeds, web: chiiCry },
  rimuru: { tap: waterBlade, hold: blackLightning, web: predator },
  stelle: { tap: farewellHit, hold: homeRun, web: amberShield },
  saiyan: { tap: galick, hold: antomic, web: bind },
  kiem:   { tap: nhatKiem, hold: nhatKiem, web: songKiem },
  asta:   { tap: astaSlash, hold: magicReturn, web: blackHurricane },
  yuno:   { tap: windBlade, hold: windCrescent, web: toweringTornado },
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
/* Kiếm khách (Hải Tặc Tí Hon): Nhất kiếm, Song kiếm, Tam kiếm — đúng tên, đúng ảnh hiệu ứng skill cấp 25 (bậc >14) của game.
   Nội tại của phái: Song kiếm gây xuất huyết 4 giây. */
const after = (t, fn) => S.timers.push({ t, fn });
const pose = (p, t) => { S.kpose = p; S.kposeT = t; };
// hiệu ứng ảnh động: s = tên ảnh trong KK, fps, seq = thứ tự khung, flip = lật ngang, ball = bám theo người chơi
function kfx(s, x, y, w, h, o = {}) { S.kfx.push({ s, x, y, w, h, t: 0, fps: 18, loop: false, flip: 1, ...o }); }
function hitFx(x, y) { kfx('hit', x, y, 90, 90, { fps: 24 }); }
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
  hitFx(p.x, p.y);
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
// Nhất kiếm: "Đòn đánh cơ bản nhưng lại rất nguy hiểm của kiếm khách" — nhát chém lưỡi liềm xanh băng
function nhatKiem() {
  if (S.shockCd > 0 || !canAct() || !spend(cost('tap'))) return;
  const b = S.ball, d = b.face || 1;
  S.shockCd = .4;
  pose('a2', .2); after(.2, () => pose('a3', .1)); after(.3, () => pose('a2', .1));
  kfx('nhat', b.x + d * 54, b.y - 6, 120, 64, { fps: 12, seq: [1, 2, 1, 2, 1], flip: d });
  sfx('slash');
  slashArea(b.x, b.x + d * 115, b.y - 6, 42, 1, 'shock', '#c0303a');
}
// Song kiếm: biến mất, hiện ra sát mục tiêu rồi chém chéo hai nhát lửa tím (gây xuất huyết)
function songKiem() {
  if (!canAct()) return;
  if (S.songCd > 0) { S.pops.push({ x: S.ball.x, y: S.ball.y - 50, t: .6, text: `Song kiếm hồi ${S.songCd.toFixed(1)} giây`, c: '#e7a6ff' }); sfx('deny'); return; }
  if (!spend(cost('web'))) return;
  const b = S.ball, d = b.face || 1, t = kkTarget(420);
  S.songCd = .6; S.power = Math.max(S.power, .6);
  kfx('vanish', b.x, b.y - 8, 130, 130, { fps: 30, flip: d });
  sfx('vanish');
  pose('hide', .1);
  after(.1, () => {
    if (S.dead) return;
    let p = t && tAlive(t) ? tPos(t) : { x: b.x + d * 150, y: b.y - 8 };
    if (t && tAlive(t)) {
      const side = Math.sign(b.x - p.x) || -d, gap = t.kind === 'boss' ? unitW(t.ref) / 2 + R + 6 : 50;
      let nx = p.x + side * gap;
      if (S.gateClosed) nx = clamp(nx, ARENA.l + R + 4, ARENA.r - R - 4);
      b.x = nx; if (t.kind !== 'boss') b.y = Math.min(b.y, p.y + 10); b.vx = 0; b.vy = Math.min(b.vy, 0);
      b.face = Math.sign(p.x - b.x) || d;
    }
    pose('a2', .25);
    for (let i = 0; i < 2; i++) kfx('ribbon', p.x, p.y - 30 + i * 70, 44, 90, { fps: 30, loop: true, life: .3 });
    kfx('chem', p.x, p.y, 110, 110, { fps: 18, flip: 1 });
    sfx('slash');
    if (t) kkHit(t, 1, true); else slashArea(p.x - 50, p.x + 50, p.y, 50, 1, 'shock', '#c0303a');
    after(.23, () => {
      if (S.dead) return;
      const q = t && tAlive(t) ? tPos(t) : p;
      pose('a5', .25);
      kfx('chem', q.x, q.y, 110, 110, { fps: 18, flip: -1 });
      sfx('slash');
      if (t) kkHit(t, 1, true); else slashArea(q.x - 50, q.x + 50, q.y, 50, 1, 'shock', '#c0303a');
      after(.23, () => { if (t && tAlive(t)) { const r = tPos(t); hitFx(r.x, r.y); } });
    });
  });
}
// Tam kiếm: tụ khí rồi phóng ba cơn lốc từ vòng xoay của thanh kiếm, mỗi cơn tự lao tới mục tiêu
function tamKiem() {
  if (!canAct()) return;
  if (S.tamCd > 0) { S.pops.push({ x: S.ball.x, y: S.ball.y - 50, t: .6, text: `Tam kiếm hồi ${Math.ceil(S.tamCd)} giây`, c: '#d8dde8' }); sfx('deny'); return; }
  if (!spend(cost('volt'))) return;
  const b = S.ball, d = b.face || 1;
  S.tamCd = 2; S.cast = .6;
  pose('a1', .2);
  after(.2, () => {
    if (S.dead) return;
    pose('a5', .6);
    kfx('dust', 0, R - 22, 100, 50, { ball: true, loop: true, life: .65, flip: d });
    kfx('aura', 0, -14, 76, 76, { ball: true, loop: true, life: .65 });
    sfx('twister');
    const t = kkTarget(640);
    for (let i = 0; i < 3; i++) after(.12 * i, () => {
      if (S.dead) return;
      S.ktor.push({ x: S.ball.x, y: S.ball.y - 10, t, d: S.ball.face || d, life: 1.4, ft: 0, hit: new Set() });
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
    for (const e of S.enemies) if (e.alive && !o.hit.has(e) && Math.abs(o.x - e.x) < 34 && Math.abs(o.y - (e.f(e.x) - 20)) < 40) { o.hit.add(e); killEnemy(e, '#c9ced8'); hitFx(e.x, e.f(e.x) - 20); }
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
function updateCharMoves(dt) {
  updateKiem(dt);
  updateClover(dt);
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
  for (const x of [ARENA.l + 130, ARENA.r - 130]) S.flyers.push(newFlyer({ type: 'bat', x, y: 230 }));
  S.pops.push({ x: ARENA_MID, y: 200, t: 1, text: 'Dơi xuất hiện!', c: '#c9b6ff' });
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
  return [{ kind: 'ice', x: ARENA_MID + 140, y: ARENA.floor - 150, dir: -1, squash: 0, flash: 0, hurt: 0, mt: Math.PI / 2, vy: 0 }];
}
function newBoss() {
  return {
    phase: 1, hp: PHASES[1].hp, maxHp: PHASES[1].hp, dead: false, inv: 0, stun: 0, exhaust: 0, atkT: 2.5, act: null, actN: 0,
    ts: 0, hellT: 0, laserShot: false, cut: null, fuse: null, marks: [], hazards: [], sweep: null, half: false, summoned: false, blinkT: 9,
    units: newUnits(),
  };
}
const devilName = B => B.phase === 4 || B.fuse ? 'LILITH × NAAMAH' : B.units[0].kind === 'ice' ? 'LILITH' : 'NAAMAH';
function bossBar() {
  const B = S.boss, P = PHASES[B.phase];
  $('bossbar').hidden = !(S.fight || B.dead);
  $('bname').textContent = B.dead ? 'LILITH × NAAMAH' : devilName(B);
  $('bphase').textContent = B.dead ? 'Đã hạ!' : B.fuse ? 'Đang hợp thể…' : B.cut ? 'Lilith gục…' : `${P.tag} · ${Math.max(0, B.hp)}/${B.maxHp} máu`;
  $('bnote').textContent = B.dead ? 'Lăn tới cờ đích để về đích.' : B.fuse ? 'Lilith và Naamah đang hợp thể!'
    : B.cut ? 'Coi chừng sau lưng!' : (B.phase === 4 && B.half ? P.note2 : P.note);
  document.querySelector('#bossbar .pips').hidden = true;
  $('hpbar').hidden = B.dead || !!B.fuse || !!B.cut;
  $('hpfill').style.width = (Math.max(0, B.hp) / B.maxHp * 100) + '%';
}
const devilColors = u => u.kind === 'ice' ? ['#7ff0ff', '#d8fbff', '#0f2430'] : ['#ff2f5c', '#ffa0b4', '#1c0c12'];
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
    if (u.kind === 'ice') u.y = Math.min(ARENA.floor, u.y + 420 * dt);
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
const ACT_LIST = [null, ['fan', 'spikes'], ['spikes', 'fan', 'puddle', 'fan'], ['dash', 'lob', 'slam', 'pillar'], ['dual']];
function startAction(B, b) {
  const list = B.phase === 4 && B.half ? ['dual', 'sweep'] : ACT_LIST[B.phase];
  const type = list[B.actN++ % list.length];
  const u = B.units[0];
  u.dir = Math.sign(b.x - u.x) || u.dir;
  B.act = { type, t: 0 };
  if (type === 'dash') B.act.dir = u.dir;
  B.atkT = PHASES[B.phase].every;
}
function endAction(B) {
  const a = B.act;
  B.act = null; B.sweep = null;
  if (a && a.type === 'dual') dropMarks(B, B.units[0]);
  B.exhaust = EXHAUST;
}
function aimedFan(sx, sy, kind, speed = 360) {
  const b = S.ball, ang = Math.atan2(b.y - sy, b.x - sx);
  for (const k of [-1, 0, 1]) {
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
  if (u.kind === 'ice') settleHover(u, dt);
  switch (a.type) {
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
    if (q.g && q.y >= ARENA.floor - 6) { q.dead = true; addHazard('fire', q.x); }
  }
  S.bullets = S.bullets.filter(q => !q.dead && q.x > ARENA.gateX && q.x < ARENA.r && q.y > -400 && q.y < ARENA.floor + 4);
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
  let dmg = base * (tired ? 2 : 1) * CH().dmgK * (S.ape > 0 || S.black > 0 ? 2 : 1);
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
    if (B.phase === 1 && B.hp <= PHASES[1].hp / 2) enterHell(B, u);
    if (B.phase === 3 && B.hp <= 6 && !B.summoned) { B.summoned = true; summonBats(); }
    if (B.phase === 4 && B.hp <= FUSED_HP / 2 && !B.half) { B.half = true; B.actN = 1; summonBats(); }
    bossBar();
  }
  return true;
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
  if (on) $('tsBanner').textContent = S.tsEsc ? 'Nhảy lên để né laze!' : 'Bị phong ấn! Nhấn Shift để thoát';
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
function localRows() { try { return (JSON.parse(lsGet(LB_KEY, '[]')) || []).map(cleanRow).filter(Boolean); } catch (e) { return []; } }
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
  const list = localRows(); list.push(row); lsSet(LB_KEY, JSON.stringify(list.slice(-100)));
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
      ['Shift', 'Lao điện: vô địch khi lao (25)'], ['U', '100.000 Vôn: sét khắp màn hình (cần đầy)']],
    tip: TIPS[0].text },
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
  kiem: { name: 'Kiếm khách', from: 'Hải Tặc Tí Hon', tag: 'Phái Kiếm khách: Nhất kiếm, Song kiếm, Tam kiếm (cheat)', energy: 'MP',
    btn: { bolt: ['Nhất', 'Nhất kiếm'], web: ['Song', 'Song kiếm'], skill: ['Lướt', 'Lướt'], volt: ['Tam', 'Tam kiếm'] },
    short: ['Nhất kiếm', null, 'Song kiếm', 'Lướt', 'Tam kiếm'],
    kit: [['J', 'Nhất kiếm: “Đòn đánh cơ bản nhưng lại rất nguy hiểm của kiếm khách” (miễn phí)'],
      ['L', 'Song kiếm: biến mất, hiện ra sát kẻ thù và chém hai nhát bằng hai thanh kiếm, hồi 0,6 giây (miễn phí)'],
      ['U', 'Tam kiếm: “tạo ra những cơn lốc sát thương từ vòng xoay của thanh kiếm”: 3 cơn lốc tự lao tới kẻ thù, hồi 2 giây (miễn phí)'],
      ['Shift', 'Lướt: vô địch khi lướt, hồi 0,35 giây (miễn phí)']],
    passive: 'Song kiếm gây xuất huyết 4 giây · cheat: nhảy 3 lần, chạy nhanh, sát thương ×2, xuyên khiên boss, MP nạp ×6. Hiệu ứng chiêu cấp 25.',
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
};
function applyChar() {
  const u = CHAR_UI[CHAR], s = u.short;
  $('charBtn').textContent = `Nhân vật: ${u.name} (P)`;
  document.querySelector('#hint .keys').innerHTML = `<kbd>←</kbd> <kbd>→</kbd> chạy · <kbd>↑</kbd>/<kbd>Space</kbd> nhảy · <kbd>J</kbd> ${s[0]}${s[1] ? ` (giữ rồi thả: ${s[1]})` : ''} · <kbd>L</kbd> ${s[2]} · <kbd>Shift</kbd> ${s[3]} · <kbd>U</kbd> ${s[4]}${u.more || ''} · <kbd>P</kbd> đổi nhân vật · về đích trong 5 phút`;
  document.querySelector('#hint .tap').textContent = `◀ ▶ chạy · ▲ nhảy · ${u.btn.bolt[0]}${s[1] ? ` (giữ: ${s[1]})` : ''} · ${u.btn.web[0]}: ${s[2]} · ${u.btn.skill[0]}: ${s[3]} · ${u.btn.volt[0]}${CH().cost.volt != null ? `: ${s[4]}` : ' khi đầy'}${u.moreTap || ''} · về đích trong 5 phút`;
  document.querySelectorAll('.touch .sx').forEach(el => { el.hidden = CHAR !== 'saiyan'; });
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
if (!CHAR_UI[CHAR] || !unlocked(CHAR)) CHAR = 'pika';
applyChar();

/* ---------- Vẽ ---------- */
const CLOUDS = Array.from({ length: 9 }, (_, i) => ({ x: i * 520 + (i * 137) % 200, y: 60 + (i * 71) % 140, s: .7 + (i * 37 % 50) / 100 }));
function drawBackground() {
  const cam = S.cam;
  // trời chuyển màu từ xanh đậm xuống vàng nhạt ở chân trời
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#2f8fe6'); g.addColorStop(.55, '#8fd3ff'); g.addColorStop(1, '#fff1c9');
  ctx.fillStyle = g; ctx.fillRect(0, 0, viewW, VIEW_H);
  // mặt trời có quầng sáng (thị sai rất nhỏ)
  const sx0 = viewW * .78 - cam.x * .02, sy0 = 110 - cam.y * .05;
  const sun = ctx.createRadialGradient(sx0, sy0, 10, sx0, sy0, 190);
  sun.addColorStop(0, 'rgb(255 250 220 / .95)'); sun.addColorStop(.22, 'rgb(255 236 170 / .55)'); sun.addColorStop(1, 'rgb(255 236 170 / 0)');
  ctx.fillStyle = sun; ctx.fillRect(sx0 - 200, sy0 - 200, 400, 400);
  ctx.fillStyle = '#fffbe6'; ctx.beginPath(); ctx.arc(sx0, sy0, 34, 0, Math.PI * 2); ctx.fill();
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
    blob(6 * c.s, 'rgb(170 200 230 / .55)');
    blob(0, 'rgb(255 255 255 / .95)');
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
  ridge(.15, 360, 90, 310, 130, '#9fc3e6', '#cfe6f2');
  ridge(.4, 410, 60, 230, 97, '#62c48e', '#a8e3b8');
}
function tracePts(p) {
  ctx.beginPath(); ctx.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
}
function drawSolids(x0, x1) {
  for (const s of SOLIDS) {
    if (s.gate || s.maxX < x0 || s.minX > x1) continue;   // cổng có hình riêng (drawGate)
    tracePts(s.pts); ctx.closePath();
    ctx.fillStyle = '#1d5e2a'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#174d22';
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
    tracePts(t); ctx.strokeStyle = '#3fb02a'; ctx.lineWidth = 24; ctx.stroke();
    ctx.fillStyle = '#3fb02a';
    for (let i = 0; i < t.length - 2; i += 2) {
      const mx = (t[i] + t[i + 2]) / 2, my = (t[i + 1] + t[i + 3]) / 2;
      if (mx < x0 - 20 || mx > x1 + 20) continue;
      ctx.beginPath(); ctx.arc(mx, my + 12, 7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.save(); ctx.translate(0, -4);
    tracePts(t); ctx.strokeStyle = '#5fd83a'; ctx.lineWidth = 14; ctx.stroke();
    ctx.translate(0, -5);
    tracePts(t); ctx.strokeStyle = '#a8f070'; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
}
function drawSpikes() {
  for (const sp of SPIKES) {
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
    ctx.fillStyle = u.kind === 'ice' ? 'rgb(127 240 255 / .18)' : 'rgb(255 47 92 / .2)';
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
  drawDevil(u, B, x, fy);
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
      ctx.strokeStyle = blink ? (h.type === 'spike' ? '#7ff0ff' : '#ff7b39') : '#ffffff'; ctx.lineWidth = 3;
      ctx.strokeRect(x0, gy - h.h, h.w, h.h);
      ctx.restore();
      ctx.fillStyle = h.type === 'spike' ? 'rgb(127 240 255 / .25)' : 'rgb(255 123 57 / .25)';
      ctx.fillRect(x0, gy - 6, h.w, 6);
      continue;
    }
    if (h.type === 'spike') {
      for (let k = 0; k < 4; k++) {
        const bx = x0 + k * h.w / 4, tip = h.h * (.75 + .25 * ((k * 7) % 3) / 2);
        ctx.beginPath(); ctx.moveTo(bx, gy); ctx.lineTo(bx + h.w / 8, gy - tip); ctx.lineTo(bx + h.w / 4, gy); ctx.closePath();
        ctx.fillStyle = '#7ff0ff'; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
      }
    } else if (h.type === 'pillar') {
      ctx.fillStyle = 'rgb(255 74 28 / .55)'; ctx.fillRect(x0 - 6, gy - h.h - 10, h.w + 12, h.h + 10);
      for (let y = gy; y > gy - h.h; y -= 18) {
        const wob = Math.sin(S.t * 30 + y) * 4;
        ctx.fillStyle = '#ff4a1c'; ctx.beginPath(); ctx.arc(h.x + wob, y - 9, h.w / 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(h.x + wob, y - 9, h.w / 4, 0, Math.PI * 2); ctx.fill();
      }
    } else if (h.type === 'trail' || h.type === 'fire') {
      const fade = clamp(h.t / .4, 0, 1);
      ctx.globalAlpha = fade;
      for (let k = 0; k < 3; k++) {
        const fx = x0 + 6 + k * (h.w - 12) / 2, fh = h.h * (.7 + .3 * Math.sin(S.t * 20 + k * 2 + h.x));
        ctx.fillStyle = '#ff4a1c'; ctx.beginPath(); ctx.moveTo(fx - 7, gy); ctx.quadraticCurveTo(fx, gy - fh * 1.4, fx + 7, gy); ctx.fill();
        ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(fx - 3, gy); ctx.quadraticCurveTo(fx, gy - fh * .8, fx + 3, gy); ctx.fill();
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
  // Kiếm khách: ảnh hiệu ứng gốc và ba cơn lốc Tam kiếm
  for (const o of S.ktor) drawKK('loc', Math.floor(o.ft * 30), o.x, o.y, 80, 80, 1);
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
    stelle: [[18, 'rgb(255 214 110 / .35)'], [8, '#ffd65e'], [3, '#ffffff']],
    rimuru: [[12, 'rgb(170 240 255 / .35)'], [5, '#e8fbff'], [2, '#ffffff']],
    asta: [[26, 'rgb(15 15 18 / .5)'], [12, '#16161a'], [3, '#9cff7a']],
    yuno: [[20, 'rgb(150 240 190 / .3)'], [7, '#9cf0b4'], [2.5, '#ffffff']],
  }[kind];
  const jag = kind === 'pika' ? 18 : kind === 'yuno' ? 26 : kind === 'asta' ? 6 : 0;
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
  CHAR_DRAW[CHAR](b, pw && !blink);
}
const CHAR_COLOR = { pika: '#fff27a', chii: '#ffffff', rimuru: '#5ec8f2', stelle: '#ffd65e', saiyan: '#9fd8ff', kiem: '#e8f6ff', asta: '#2a2a30', yuno: '#9cf0b4' };
const CHAR_DRAW = { pika: drawPikachu, chii: drawChiikawa, rimuru: drawRimuru, stelle: drawStelle, saiyan: drawSaiyan, kiem: drawKiem, asta: drawAsta, yuno: drawYuno };
// Khiên Hổ Phách của Stelle: vỏ lục giác màu hổ phách
function drawAmber(b) {
  const r = R * 1.9 + Math.sin(S.t * 6) * 2, fade = S.amber < .8 && Math.floor(S.t * 14) % 2;
  if (fade) return;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + S.t * .8; ctx.lineTo(b.x + Math.cos(a) * r, b.y - 6 + Math.sin(a) * r); }
  ctx.closePath();
  const ki = CHAR === 'saiyan';   // Khiên năng lượng của Xayda màu xanh
  ctx.fillStyle = ki ? 'rgb(120 200 255 / .22)' : 'rgb(255 170 40 / .22)'; ctx.fill();
  ctx.strokeStyle = ki ? '#7cc8ff' : '#ffb43a'; ctx.lineWidth = 3; ctx.stroke();
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
// Ảnh gốc của Hải Tặc Tí Hon: thân Kiếm khách ghép từ các mảnh (tóc, đầu, áo, quần, kiếm) theo đúng toạ độ trong game,
// và ảnh hiệu ứng skill bậc cao nhất (cấp >14, dùng cho cấp 25) của Nhất kiếm, Song kiếm, Tam kiếm. Khung xếp dọc, riêng thân xếp ngang.
const KK = {
  body: { n: 9, w: 205, h: 213, hz: true, src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABzUAAADVCAMAAADpR11DAAADAFBMVEVkIgMqWBykUQeI12hQNylZJxpKJARdnUdoUkw5iiOeKwDSvKg+P0GmUQV8foy+kl//AACgUw0CRFhcSRusqaeqqqrg4OAqJAza2NcUExNnY2Bra2oDP1IGRFg9MST/fwDKeR8BOEr/qgD/qlWIbmOYRQDIxMFgmT7emlL//wB/SBB/fwC+ubUAAAACAQAzFgP2x5BQJwX7+PQoDAX+/v5tJCRpNgv35tNJGwvXhyry1bWMSA/stXauZyqDOjkDAQEYFRHvzaZHCgqyViTnq2buvYUlJCKTUxcCAAAnEgHlpFevYxY2NTMCAQACAQCnVxLz3cTIeiV3QhK7u7sBAAD+/v4CAQEoEwXcl0dZMQz///9LSkj///93MC8qDQmhSQFZVVN2dHPckDUnEQaSSUhIOzD47OCpRjImEgEoEQQmEgK4lW2Ih4dlY2LSc0j+0Jf///9zZlmFNhv+/v41Iw/Sp3dxyVHb2tp40VWycy7Ccx0cawslEgEpDQghcRGJakfgnE7EZTfhjCikpKS7cB4qDApzVTf1w4iSYixIQjuLemiWdVJXV1kqDAtCQkKme06sZGQSEg+ni21gLQ+VhHL1wYYnDQ1PojQ1NTXdoFzDikhAQEApDQksNw9mWE5OnDOurq5JSEivh1yzXFCbm5uDLx6RWCQqDAvwuHbxunrxvoDzv4LcoV7xkHinnJNdW1qrrKyVlJcoKSlGREHYtIr3x47VhikvLi3nmzhkYFzZizBVVFTWiConUxX2woeeYhjyvHzzvoCtra35rJhKQjjDwsFIZyghaxD3xoxoSS7UiDDboqK1pJFSizP3xo1cWVdeWFL2oCcVFBLlpFblp1yWSCIoKCh7e3x+e3dhYWJEVCMrRhDzvoHOkZHioFAUExEZMhMaEgvfm0bkpVm+fX29oH0VFRXMqohptUoRJAuXUk8qKio3IgnKmmn2w4jYiSu5dDZKdTBBFwLXxbU2Rijqq2HZiSpkpUaqmohFUxs6cyjxunmecTtcWlkZGRk4ODjDskkQAAABAHRSTlML/xn/cfKc/+n/CP7/0f//AV4K9p1vXQuwaFOkaFHQAlw/AwP/gsr/UAFPAsIA/f7+/v79qP7+//7+/v7+/v/N/v7//v7//P4uC/7+/q5P/v/+/v2SjXEr/v4M/Cz+Cf78/f6S//7//9FNcP79/f//Uf7/bPz//////v//sdD//v////7/sP8H/v///g8oE/7+Df7+/m1v/yX+/mSO//7/iNn+/8T/+FbSslEjDP/+ixT/C7b+0hXR/6B6TE7/j/8tB0X/kv///yX+yv///0q00/+Pnj3+NIYdPP//jv/Z2v+puWr//1b+////ZJT/tb0h/1b+/xmS/w79/4n/YDxGruytrgAAgkZJREFUeNrtvQt8W9d958m0TZptt7szbWdmZ3Z3Zt9v3oPLa11e4AIBaAEECAggAcEkQcmyRIaKSEm2bFF2qEgWK9EKbTVRbNlOxFhyo7RKm7aaceukbhvF05naqXfidpw287CnidO0E6eTpHnNZJvZ1///P+fcBx4kQJHAvdQ5n9iSZVnBH+fe8z3/1+/f16+WWmqppZZa7a6pvbe3/X3qEVBLLbXUUqt9ah5X1FRLLbXUUkut9taxu6YUNdVSSy211FKrLVfzLkVNtdRSSy211GqTmncoaqqlllpqqaVWe+vYHXcoaqqlllpqqaVWewHabU/NqampvXv3Hjt27Lhcx47t3Ts1paipllpqqaVWh2vvHXfcsXfb4hJgefz4XXAxaFx33XWck1NRUy211FJLrf72A7TbkJqcl01p6UfnsSlFTbXUUksttToJ0G4zak4hL9cHJnc3j+2dUtRUSy211FKrv/0A7fah5tRUWx4mEROBiQFaRU211FJLLbX6OwjQbhNqAjHbAyb4mMfcYiAVoVVLLbXUUquTAO02oGb7PuYdsgioX1FTLbXUUkut/s4DtGGnZvtO5h3oZParfk211FJLLbX6NxygDTU1p/a272Q2QaaiplpqqaWWWp0FaMOrctAJMvdOKW0gtdRSSy21+m85QBtSam4KMhU11VJLLbXU6u8oQBtG9fYOkHls75TSoVVLLbXUUmuzArSho+YmIlNRUy211FJLrf6OArTHb2NkKmqqpZZaaqnV30mANkzU5Gp57ejltYlMRU211FJLLbU6CtDecSw8A79ogsn62GwfmYqaaqmlllpq9XcSoA0NNXFG5nGBzc1CpqKmWmqppZZa7a3jAjN7Q0PN9bHZKTIVNdVSSy211OrI1QxLuyZSk7DZMka7dl+moqZaaqmlllq37mqGpvHEj83NQaaiplpqqaWWWp3UAoWMmnubxmg3jExFTbXUUksttfrbbztprxho71SQnc27jt3Kx1PUVEsttdRSq21Xsx1qTt01FSBn04/NDdT/KGqqpZZaaqm1QVeznWKg4wGJ4jY4m7cSmVXUVEsttdRSq2NXsw0gHrsjSNR0M5vHNyVwrKipllpqqaVW267m8XZaVI4HRR7IdTaPH5vaHJQraqqlllpqqdWuq7m+xgH+3mNBK6M9tnn1SYqaaqmlllpqtetqrpvWJMDu7Q+Ss7l3U0t6b52aue30aChjlDHKGGWMMmYNV3O92OvU8a2QD8rdgrM5NbW5n+bWqVktbaPnTBmjjFHGKGOUMWu4msfa+a2bXgy0YWM2G5mbQs1kchvdz5QxyhhljDJGGdPa1VzPizy2NVNRgrQzm0BNrbh9HjRljDJGGaOMUca0djWPt6Xwvnc778ytUTOXy/WPa1pyW4Q1lDHKGGWMMkYZ08TV9Ai47m1rLMrUdt6ZjVOzVEwmNbAE/6Ylq+OhftaUMcoYZYwyRhnTv+awk3UTlnvv2mx99yDuzMao+XipSkb4VrI4HspnTBmjjFHGKGOUMevP1VwvYemkP49t651pn5of/N0PPk4/fuR3/2Gy0Ra+qiF5tpQxyhhljDJGGbOprqZbM7R3W+9M+9T8V7/4i3/0+x/96O//5m8Np7SWK1kNRTJdGaOMUcYoY5Qxm+lqdqRUG+adWZeaH/wN8ZOf/4Xdu/fPzu4a1tZZxQBfypQxyhhljDJGGdO/sa6TtXA4dbwDpdpQ78y61PyXH+13zTmyrim0ApsRUMYoY5QxyhhlTP/Guk7WcjU90NxAgDZUO7MuNX/xwAddy47sasuawPY8KWOUMcoYZYwyZgtczWPt1tmGf2fWpeY/OfKxf/i7P//Bj/yL/3e8OLwrpbW5gnlBU8YoY5QxyhhlzOa7mt7fdnyb78y61PxHvzi7a8/+/XvaCDQHv/5MGaOMUcYoY5Qxm+5qeqG5kQraUO3M+jW0v7Bf04Z37RpOaVr4HzRljDJGGaOMUcb0b6DrZA0a+qC5oQraMO3M+tT8R0eGtQ2tIIY1lDHKGGWMMkYZ07+BrpPWNPRBc2MSB2HamTb6NX/h6AbNCWISXRmjjFHGKGOUMZ3HZ1u7mnt90NygxEGIdqavnYjz0dkN2ZMMZC5AGaOMUcYoY5Qxnbqax9uE5vGp7b4z7WgD/V+/fXT/rtQ2iWooY5QxyhhljDJm01zNOmhuWE0vPDvTnqLeR39zz4auAf1BXMoYZYwyRhmjjOnflK6Temge2/47064O7b/btRFrAip/rIxRxihjlDHKmA7GarYqBdp7lx+atzYjLBw70yY1P/JbG8vUBvIxU8YoY5QxyhhlTH8HXSfH2oPmLUw7Cc/OtEfN390/u7HypiAOd1XGKGOUMcoYZUz/rXedbC40w7IzbVHzXx85mtqYNQEsPFPGKGOUMcoYZcwmlAJN3bV5Sc0Q7Uwb1PxXv7D7wAY7aYJ3PVPGKGOUMcoYZcz6xhxb19VsgObxqdtiZ9an5j/ZvftAaqPGBK1cWxmjjFHGKGOUMesbs76r2QDNW6kECtPOrEfNfwTDzvZoG1/FID1lyhhljDJGGaOMaceY4+sJHDRCc+9tsjPrUPMjv3hLtmip4ceD85gpY5QxyhhljDKmHWN8bZhT7UDzFiqBQrYz61DzN/5FNZksFqtfaBpwfnTPenHo4SA9Z8oYZYwyZoPGLChjbitjfEw81hY0j902O9Nmv+bvNrsJPHr//fuHQ/ScKWOUMcqYja0fU8bcXsasVwq0qdAM2860R82f/+1mfTT3P/bYeubs+q3fCNxjpoxRxihjOjTmj5Qxt5Ux65UCNULz+G20M+1R81+7Q1xS7sd/8onDjx1dOxy962PBe86UMcoYZczmGPMXypjtacw6rmYTaE7dRjvTHjV/2/nMOG1bftLnDx8+fP/RR9e25oOBe86UMcoYZcymGPMEeAHKmG1ozN67YLV2NRuhedfU7bQzbVHzXzndp6n9+x/dI7pqHo1kTuARsFaTza5/GLjHTBmjjFHGbIox5584fPgJZcz2M2bq+F13Odw81jVohmZn+toaF7pHusy77ofM7C7+SS9EIs8fXucSELznTBmjjFHGbIoxs4cjz/8FBM+UMdvNmL133eVgsxGITaC59/bamXao+QtH0JAUDgzddf+TT96/n1P/wn2Rw+evwhHAP3dTo4b/+c8H7DlTxihjlDGbYsyZ+yKRE+gFKGO2lzHS1SRqHlsfmnfsvc12pq8dqaP95DRjoBmsOXziSf7B7z9xfvbCNw8/Rm516v79Ta3ZH7DrmTJGGaOMuSVj/uJrwpjz8QgGnJUx282YY8dhCWw2uJpbBs0Q7UxfO1eAFPTDfKE0DJeAYTgBMp/n4eeF2TPpSDz+xBH0pHc9dpVuBpW66POeo/86YJczZYwyRhnTuTFf1ha4MX8REcbUovkMHGiHlTHby5ipY8eOOdjcuz40j912O9OOevv+XXs+9tH+/vk9u7B35olM5PNUILxQOHN+lrGFA0j/Ry+QNWxxuP4SEKiohjJGGaOM2ZAxc4wJYyLCmFo0Op3ORJ5/kow5s18Zsy2Mmdp77BhxE6F5rGvQDNPOrE/Nf3ngn//2/4OfaITNDmv7H3vi+RMnbtwPH5rpGtuz5+iePQfgU6+cwV/S9Gh9m+qu/b8doAdNGaOMUcZsyJgRZtQe5cbc98RjV9GYs+VsNjo5+YQyZjsZM7V3795j0t2c6hY0Q7Uz61Pzgz8vP80M25XCcNMsW3iSnGf23G5Y5w4g+7k1Kw3WgDl/FJwuJ2WMMkYZszFj5hm7TsY8dl5LPQHGMNMAI6LRRTBmQRmzTYxBaHJuAjX3dg2aodqZvg5+77yxsGsYLgEXVhKJi0fwY+/BE2A3lD7VuDXgTPusoeDzMMWqgraUMcoYZUwnC7yAwgoYc/+jKVYoH0VjDBNOs2j0sWGtoIzZJsZMTU052Dw2tR40N0USKHQ70wk1J5ie2LXr6pP/+WQ0WniFNI7O8RPgP9UTZ+7X9BfBtF1eY3bBGgaZh13BO86UMdvSmFypSL92an5E7cwmrxkje/YaGHNhsbzItF1H95yfTOeXJqejZ4az0cULypjtYcyU4CZgswfQDMXOdELNkUPs5OKju3b93/nJ6ZMMJ2+z3Q/Beu7Ic7OLi5Us3gcWfdbM7tmz52O/+fsf/UjwzmZlzDY0BpDJ9JcZXT2LEyNqZzbZb85G4yfQmCx1BDwBBRu44tdWwAhhTEIZE3ZjpgQ3j+3tBTTDsDOdUjOfeeLMxaV8fpqdg67TowO4Htp9bnaxHKW1AtZYuhNr/hduhieAZ7MyZlsZU4Vc4coJfL9OrL4M5AyCu7mddmbOMM/GI5lrK4tnIGh2GLoBImJlJqPCluh1MIZpypgwGyOxOeXXC7pja3T0QrgznVIzTdRPp9Nn4MMefWhAHAFZbkv55Cu7NGbbjjX/X39QlzJmGxnzhWq1VII7JzEzEonFYpETK5pWUjuzyU7ANB1e8Uw8HvGvJXGaFdAY3VDGhNoYjs3eQDMMO9MJNaGVpszNAHNO/GdHzw3I9VA8PQ22TOcnoVTYvMe9N/9+YM9mZcw2Moaat1IvnyBg4oKfRFZTAcDmdtoZSDgtRVottGVyKV/eM8weYCypjAm1MYTNqZ5AMww709eROfq0+PDxeHz3bucAeO4wSAVORqfj953YdeGMoTuu8/CejwT3QVPGbB9jVkzN5H6my83IKkvm1M5sottsZNMtj7N4NJqP3AfGMFxJZUy4jWmApmdy2NZCMww709eROWbeY8BuEWsaOMrwwEpH0/elVy7el3EdZyiz/6PfCOyDpozZPsYcSadMz3/DuZlZZVpO7Uz/ppUDs2gm0toLgNtBfvKJwxcMg1WVMSE3pgk07+oKNEOxMx1RkxW8cebDR5/DcsBze9hhugWAOQX7nvh95z0nwPCe3/xIUJNnyphtZMyBSupEAzbjPfc2t9HOjIDb3DpyBimn9H2T99jl+04w49S4Mibsxnipufd4AzU3ZzZYWHemM2pGvZ8/c2YWvWRt9sR99M/pyOQ999xzMnKGefUBZz/20Y8E82xWxmwjYx69mjofqcMmUGklVVQ7s3luc3yN4yyeyRTAlnRcNw4llTHbyJi97gSULYdmOHams7zmeaxrcgy4D8aeXTzsXPEzkcI9J+8pZC7SvXn4t76QFB2o/64/kNkzZcx2MGb/gQVhzIL/9aIYbXolVVI7s0lOANMPRzIZHj2LX3jPBf/hlomk7yks3jMpjzNlzDYxZq9Ucvdgc+/tvTOddZ4Ys1Dz57Xivvvu8/zTZKFwcjJyng6AjwH5x5PJZLE4/nhA02fKmPAbc3RscOjJXWzXo48yrcnNNJM3exuj7ciYPX83lxM70z8yMhKwfZk4ZLAz05NUqXHil3Adrq/UKCxCfzozisF/zJQxbRozNbX3mIvNLYdmOHamr1ODzItrOM+Tk5n7DmOwaddvfrA/4EsZEwBAjjSDQwfGHBiEyprBwSFwLbPaiSbUhNRmNSw7Q3In9P7ncv3BzJ8xPQsXgPvgNHsPLP95BjXCUehOP2+wYgjeGWVMW2tqylFyd7G593bfmb6Oj4ATItLUeEJNRtMROAAMbXjXR/uDv5QxPX/ZJ+ZPnTo1MzeyIWNSw7vOITIHBwaxz6SsrXJOpnFJ5w5itGw8BDsDxjwRtU0m85tAzkCmnI0L90Xui7+HTrP3vOcB70XlRBT4j6fZqWQY3hllTFvU9AxAkdTce9vvTF/HTdtYx5A5cfjEibpwM0TDwKu+CKVNyd/6SH8YljKmx47mPINbpQ6fa2QDxjw6vH8MoBmLATaRmunUClxD0/l8fnV1ZVXGRDPxvK2NB35nauzR52NjsSH4uPnJkwXq3hwP5EMGbaYn5GkGy2NLPJ+57wScZqwUjndGGdOur+l3NveqnenrvLoBLs0gDcbY7BlPrubwGbxKHz7f5AgM7lLG9DQ4C5P0Vk6cOLHS5JOtb8xVjM2Slxnj1IyYLI9rdcUE+XYQgJbO5qqulQK+M7MnAPiRoaGYlGjI5AtvQrS2GjCPE6Y4nb/3Pb/knmaOF3AGLwbxCzq4ABNr/QFzM4dwnZoLhzGyRNO8LkSNR0ZKgTwSbnln2sVmF6C5dcb0ipoTzDiDdYCHsRTQPQAys8b5i1BVb7CZ8HBmfWMOzY9sG2OMZCkXqOjsKSPFToDOXGZVN+Y7NGbhSYIm4RKcTaJmNrWaX02YeNJB+3Mi6hQEJVLdFDtozNSu+5hdn4zTygA4+QJwRqlFRUsGyuWcYeyXHnAOs4/f+/EL4gLA9DMXzuvQeb7WGzMyf8gwNHATwOaJMBijZ8u4ChWYh4zcHCklQZCmWArg639rO9MGNgU194bamB5RE0dtX4SYcyTuSdPcd2LWoMVmJvrDtNY2BtepuZHtYQy/MyeL1WCwc2TiEFtZWY1QTHWVGXMdGXP/SwPS03SomYmmElkmUoIlzSjnnRitqVW7tYsT4Es1ZGrXNuaVxegk+MiCmxKckUmTnTxZCFioFrwA3T3Nfv3X730P5WvPMG7K2rdM2HKmm2cuXrt82TYOTQTdmNqF56XvH8vgRhRLyYVabWFhoVdn9u/xVXdJm8A1so4xEH45NLOx2Xk+Z3MroflpWm3sDCtWi+6q5oJPTZCkxyMg4tRbwC0arGHveMehQzNz/SFbLYyxK7p+/nC+gNwMETabG5OFGhNzcTFr1mTAqdprcI6cOsWMFR5ApVlZxqGR9oxhldnZ+39ywIEm9nWR6Cz4lKkUnmzctpJmRtNOjJZ1ybWBZjO+6kLOLYyBa7N+9fAQaGtO4sL4suNvQksKO3n2bNRGf7MUpIiGzr2Aj3/83l//p7/+nsx9kcOmYbzjHadOzcOpvEbDDGaxz1wWX4GtHRoJrDHnL75y9cmv8Xj52OAY5yb4m8wsQKFZuVxh3d8RoOU/hvVJWPgjx+fv/R48cfhGM3boVCtjnnjl6mNfex4+tCbBObJBbG4iND/trs+463fgr0//CKwfa2EM86qBOKvr51nfRtI0dATI9/8wecx2Gd5vtnBq/rsTIyGK0TY1Rr82hK0McHTFkZunJkJtTCFa0/Q81pVCoUkU4En+WG+bGE9BERAogMQBI0TNaGOMtvlj9koqOjg44IWmaIdGlxK8MtescS2bl3KW+Wx3crpgF7tw+PCF83CIjaxvzBOxGCdkPCrXZJyczcgQVNeeZIWz0SjnZjUXIGyyX+IewK//UzjOTlww4Vcujf5U4af+t/mZU4eauNryQmHoy5cvC2zGm+x4UIw5n4k5Geaxg1RxNjQ0NglR2nIaHqn0ZLTCuu5uEjQ/+dR//BW+nvrkU7B+JVPQWLaQrVRqjOLejcZcHROvy8F0Aa/Nh+YnNh6j3TxPE1j5O7T+T7GiUfwLJ+eVC4XRUbupMbpdGYVVKESX0kuwoFY+Hp+G+0w18NQcgZsz1TFAvzbVMoA11xMwLhTKIXEd+sZ3J0IDzibGwJBGCPoN4jszFDmrh8jdbGJMpRw1NS2a5omzOGcnBjLHewlNw4QqoEwaWM59zWiCsZH1jTGXV1lUDg0ZHOTQ5NiEhpOo5hM0KKZkjDaCmdO57sTID1ND2WG9DpuNxhj68/CQDY5RFlNiMx8nTzOSp+EOzD4bPXkyGj1psgCFaakBFU6zfwrr1+/9JR0DAGYBl55K4fufSqUONb4x8wjN6ei0dDavsZkt/JDvr1uef5WjaEQOVml+vsgajFl4LOZZouZsKJZZ0BZu0AMH1ARsasWR7oVlXWwSN39Zrni8ok1yJo7Fxn5yttGYGwOeNQjgBL+040itaNo8vpnh2U9/xiWm4CUSk9LIuLL6OjuDZzSugwdj0QWtGHRq0hswexhL6c+cx3dGt1cSiXJ5pQL9p/B3Rj5naMBZZ0xlMp4ZEjuCd8w0YnMmrMYsRsHT1BaBThliDCdnPp/t5TE8YegnqE40n0/nswl6X0xjZv3HLJFIsPKA62pmeC4Q7QKjElrSu005TZd1tJF8gnUhIDgnoAl2Aejqg7Q+YwzNlM8YeZt57mhyaMI/gQgffCdm9CScHwDOk2aAwrSQnjRMPM4g3UT3ZD1L55yd0suXYT8uLwM+6wM0oJGkl2E4okPNi8apLYTmr37Ss371Vz3YnCclCVfBlNUZc7+TzBzDJagZi9S0GkX8OTWjlYVubQiPzFJ0ltzLX+HUFLfgGou5VHxott6YhwbqViwqIrUdx2iPHdu72UlMHpVtTk3AZp0xV782xKvMIRAYGZJbROCMVLqLzY34mhPfwGDALJiCbqZu2lmEZkIvC5uWEvCvFr4RFm7OHXKNYYsvIDTlPQbNeQF37PRc+IypZYGZApriqILAX4Y3Nb6o9aodA+oW2CpnGSyIP2bxfck2w5rHmEOmfQ/EZhIpDzVRnh0FDdDZzJfNVF3NTxVitI4Il7n1AUFozkYBeYQmnKt2vS/lNUbT7MEB/ohxZzN6EiqCRBFtLEM/hz9CP4lC1fcAOClMW8wFp6Vef8/H38P9TN0eLQhXs8xds4FIWQd3sz5EvTwtzsXLRE1tC3PNQM2n3EXYpPWrv/ptjVV4bozVKtevXy8/P+s1RqsMeJEpsgGDsbE9AppUdkYHvMmSXTkTfo97mP/RR0vBzPgkqw16mHjQZ8zV7w00WWPpLDqcX5nrJMMJ2NxcaEI04NM8SovEnBaLPx8FsXSvMa98nl6UIZjlXsAgbXqIZ525vxmrdDVI27chZurXaxhkYnrNtG07uwK+5kq2goHNMcydQ6amrGNCMByomTjFjanYeuWFfCYmXhYZpV0GM8Pjbgpj3l4p0Mtd4+HZiFubidwkbzPZK6lpw1ilwhiEJp4+WaImG2lpzKl3vJ2YOTqa1fzUBHeTArRRHQ/CuntAUkvIzGa6vPXO5jzT4w41z54t1D8y0pgZcHQKEpqCmgU9ikW0GRGuxbKgaLTA7pHr5Ml79MCkN7EWFgyhd8a0Kc+EC8yXfs9Y3E6xeZ8bbth4JhZG4bywCZumtjVltL/G15/8CXmZuDwAfaoGDxD/yiVtDh51jLk+C/FO9ywelNQcG7zgQjM9Wp5Mg78J5TVdcjYBmxSWjTeuSS3rQ+LB+6Uxs082ZSa9ORnK0VDBc7tyx4DNTUUm/PUHTz312c9+9luO25yGVCWAU1BzlGNTGHNGMDNdpgcI1zTCxtknwOZ4cKk58o0Fpq/QMafXKtksMFOsSlR4aGO8yCGqs4WQYBP6yPQKhJlq+tkX0jH38sapmdFZfrmhLDLAxoBI3Y+JkIeAJvgwscEBEXMm0bl8vqZVe1ToC1o5wO10PM8v7TpL4N+aUg2MOVQ89VPADYLmKNOinlogJ/6qp1ASoB4pJU1Pd68gaARqYqmUly4DWOFUbxLtzFwuqbE8XcroYsaP8LxWQP8SIrQxdGX4n+GhJi47GF0oIE6R0l98RV/QITQ7ChgkaC6Dr7/sBgvH4K6ZcgtmIJOtg1nLcNgVlpfLcV4PpM1sITUBm3/yJ79GDuZT/wYXr6KpaZkGirwIYVr9lZ9ZiaaZNjSIzDx40AvNg2M32B7n/mXqk5TcLJfNrkVrfu8f82ymUIt0V0EruKfVIFQuDXz+qr4we/+T5w4OtF5wDKRPgsvNZtoPoU31bzY1n/rst77lcZ6pvAf8TU5N/rrbGJrVzMOyOGvJdlf5ICU1acHPhipdDJ71dezJEDOxW6CSWFnJ2gKbwtUU2MT48xDEaRbCUX766f+G3vwKK7zwQmbQQ0xaQxV2diivsxApHvTPmRidXYQhWtG4hCa9WC42o5qW61l4lrgdLfNKIN0sJ1rcSuA+A0A0BTMTWS0VcW/Mcezl4MjUmoroFLVVedjFV3U2t9WlQNLVxMrXsydZU5sAmnrEc9KN8RCAySgsGx+KUIaTgrwFZt/TwM1kj+WCRmZSzI6jluFlKJxfXi5wV7MMEZn4oPdgLgM2vcO5pxGao8uY2eT5gmtbI3UgHc2nvoqsRP+SE5M/CTVtqDFmCVnjC+A+pie1BdgQycpBN0Bb06SnecEwzAwIu2EV22hx63H5yac+KYLNv/LLTbzNCtwiDwpAEkX4T9ZCJmU3sZWGHM5TvTrV3v/+P/jDpz7rwWaasAngjDox2lFsjl3Q3hyVq1Kr1SrC1Yw5hvO4IGxtKZjUHPkGqzhV8pXEajmRBWhCgLacAFfT8Zd5kGMsltcPhQGbP/I3cRsKNqtMv5Af5DVzojoT6T90llUiQ9Nh6tyEUpgFDAdoTEIz5sac4YzOYIzW7IGzCU4HtWkStst2lrgJqU1sxWoSAx85lUqZ2RTj1IRaIC3hDTSl0zZDZCZbvPpVbcVxSNPZ1JY6m1AKRGOxiZpmAV1NuCjPN26MZnrhIqgZi2o2shJibg41J22tjpr33ENtQz0F50SKTQ9RN8OQri+Xl/n5trxspqIxvz8Tdc2fQFcToElZA6cgSDe2hprgZCIpfX1JctVTkywZvK5peyDsekG7PjA4NlgPobFYjWVcaKal7n55YcuP6X9MucxMvNUCnOMHFZ/4oPzE4p9bU5N/GVRSe6gXyjQQAgBmfvZbn/IPM+HwFDnOcmGhWXOmtlCzR6dj9e7z2MH4Qtew2eHME6ZzYuKloFxZXVpNZAGZq6CXnSVXc0BQU1zY8uwbISDNj/wU3V5Y7ez0CxlipisWTO10rPZCBkJOLEQiDkkNm7MWODRjApocmVQUFCdnsxeFJBCdzSBbhJdJP0CsL9vEMwNo6nAWlzWbmJlIaKmMe7lEbMKfkm3tM1c1030pV5k2t6WGmRmXmsw0gZyFRpOSmNKEj19PzQxjSMtJ0baZh5+Bs3pP4zJ7rOw+kyrwp2lgEFpjZOHG8iizh7x1KTiIZjkl35h5w5yOjnJoeqgJGzKyNd4mlgPxmGzav+oitIMxjpYLGrqbeyCtOTjooaaMOu3RbkhoXsiISlos/N7qzCbUz4oWzTxfk3yJMG16krGM+0F5qHKgjRUvx7DuPA5WYMvDfI98zc9+6lONo/MwVkvMBKTXok1XvPE+cBCx2bXoWWfU/AZLLBE0cQeXKtnVfHklAcxcvVbJx+RDholNuXtZ9t2wUFPXo2en84NuaJZKZ6jnHEK005lIgYVIy72KVYIv8goT0XY2KIq2qYAGK4JY90O0EKDF8LBIaQIvbZ4iT1DL5nwjNONYkslMLNKGRBKWnkpo4opgnLd1NXBSW3HHQWe2tP5JxGcprzmJHZYmFASdbEjWjms6nwgqPRpKZyA2TY0zJVoA3OLJCAVOehNqQhsKBWrneqULwNyan4I+Kqmp6xG/q4nHwHKKx5qgxdOeXrZHuYHTIkIL9UATW0FN8DW/CnVAf/JVvuqpGfVTU+wDgFGDrzUz4GBHEuggUbOGsLwB0JSuK1Kzom0xNqlFE1OaAppRoSIlV1lSc9BxNtvg5sGBgyfTGT5SL5OJQkRqvvvMhL8BNr/1KZGtXRJZzWiZqxzgWtDiA20vtHu6WxWOfR1eqKNxgiZJzUR1bDhZXS2XVyuJIecc4K4m/6d4KEiDEVqdLZ89+8KgPJAlNqn2dBn+3TRIUYYoRlsVzHShKa8DVERLdbTZ7rsscwaLA1cSZlZiM4u4TPBAbZ0ywKkUS9NTlEgRNEGFPe+8I3yjEJusVaS5pLHVuM/ZHN/iUiDhbGJOEtQJoo3U1HhTOpaai1ZASc2CZgJtbfQkGRamFyDZptv+EC20bt4Df+xZkj3ozbM4n7KHpNrMwJDN5Q2WywV2OTZWd4hBzMamqDgo8BiF6VG7LKkZkfJAQM2RLaDmV7/6x7/yx7B+Jf2lL9X5mhiE9dfFyJ+m4QuH8K2TLJOBT9irNIQK90QyFxaMC57BqHSNYyNb36sJ3JSeZtTPTaQmJyVqGElqNmJTFM24kdtJqmgibBawILrLctuY08QK2m/9cpynMt12TX4Lo59pWmw9/HudzcGDg7Uu+QEdUXNiobIE7ZgATYoP5CvYcYKRswrFZ93b85izd5UwFAT9j7ZdQ2iejTlejOymJWrmWeXs2Wms5wqNuB4IynEJgKFBeZ8eFC7nUEY0bUa733wC1DxBYVUem4Ugl55lBkyWiEJJed3XO5eSQkCZ1Ap3Nc1Bb4AWdwnMaJWfzWmpRNpDTchsbtlLNS/isw42zyLd7Po7Y05jY+IdQZE2+tmQTGwyHnz1L9Q7tx03E0B8D31tNvwbYzMrOUYm5uZhoQ742nlpSF+6p/LQX49CQdByOarbQ7H6uz/YGNehIgj1E1khKuKzdDZS60mcgbLFVlAT3Mw//tKX/gyXYKWHM1Dw05ya8JhVRg96j2FRWjMIydAFjV2oGMZ151m6AKJbZcy8zW+xr/nvcf3Of/irv/orb4xShGkxQitLMA/KCiY/NjkrKeVJFaf8FyZPojgI/hmTNZaFclqju2VBgM0/pMaTz/6OT1hvWgAUE5vl9ajpq3oi06NdKtXojJoMqAkOGB7HGOOLVsABwEqglbgDzYEx2fBE/xRl88FHTB/IONoAzbOuF8OpmeHUzOg17L+r1UKCTWjCKmkvZvzQlNSEHwmb8MJ0v4oWAnyrFJ1N2KaoBAIFkFFsLLmnjpojLOX0otkY1Si7bSeSmtB+koap08Wm0IRi1XzcmzKBmOdWvVSHmDsCLMO9TSCcXv/wg6a8JAo0n2Ei0KFmniAJ81pA6W28Wq3icJrSeJGjU0dwigBugbxNoGnBZIfmNm1SCxMTWA6tWR3S5wnQUixJXwZ4RJfB1RxsiJjBSYA1dBMp/Yxml4WrWcBsyDIflogbviUh2q/+8Z99iRYCs+xVnIHZJRlPo8bBsaFWAU3hmQFsKpjyxO9HQjMDBNWBmoVyRdtSqYN//5nPIDQ/00BNSc4aSw96sCmoOTboKS8dkA0aTm8j/Lt0FpKasTi5q1DfCW0ohtHFsYhCdALQ+dnPOuKAnjpa0pid1rQId5Ndf9m7OQedei2HmvEu+QEdUjObhhd8bCyCqQmwMouHWaJSjjghWR4HdG88g+xQ8KOacJaDM3m2lncfNB6hpTJantgEQVr0SE9PBJyX4gegpigEoqYTMCgvi4KkFl06v9D1EC3W0IqcZtbEZCZoFyM0sSHT9D0qAE0WcQ/nFNQLaa56GH+8kJpxVNJr9n9VTJn5eMZLTRi0uVUvlcE8fJbY5K7miC8CcNJLTVGjJcqBtPFmQ9xyRE7wOE+eFdhElxPCaiBSW2CbI68LeUcU+eI60msOL/xfoL/EF4ktY3ngtG4OjTXmmbDNCVKbp1IXr0GwmbKa1KQ+Whb1QGegY3MLTof3f/KPydH8sy9x/9LVaoPlJDYPjonm8nX8mYEMM3kh0PWMbNmkoQjAYYhMb2mIFnD5H34HkBlttaDzxKEmCc3TTyD43+iHyd9G53KmBvKNmVg6OlkwKFlC3OzanAok5h/8AfRrfuqXub6Bs1CRna84xMWXPKXMfjea6C/vANLEWLe6TzqlZpxkNXiLOah+ZVej0HOCEVlZFhhzhY74axUC92yO6QDNZRbx6xugs8lFziCxWWDYKATYDPIlYGRCUnNeM6lpHoe30K5kXsx61Kg5NrM9CdGuijc+qycSpqnrApq2r0YZe07KnlL5BHaYZL1HskPNclOXuYpJTR80IxnwVktdoKYI0p5sjEwUeWLWkZ+VDxvezMzWjn8OxHiYpCbpucOXBRNRzp7UN+NOCtDUL16OX748jS4ZpFZbDr/8kb9K+UtlBwYL5vT0GXA1m1RnUBzaTKV0CMZqbHSaoDkK8dxpUUZ7eWuu1BSihSWp6VnRyevc3afgOAf72BrMRPikIacJqFzQRPkspDf10TLvKiwvbKmv+enmXqa7slphjDiJA80Am4Ncne3gQH01rfRChbLuWA1mnsWhZxNuXlneN43c7FpgkHdrOspAvtSzaKqJgLhseczxjoUFYzF/PaDbo0pX0UJ3QrSdUjMSWYqQuDlm/dDZTHBNIFmxHRty9QH5eReC5pM5cjUrtYE6alLlDGITtWhr1J5SC3R5E2Sn5uaeeeQ0jaHLTvLGGaLmUCavTbpTHGLUAhbtvhgtqsTIshAbc3bghIgOft83O5dK2b7XPhK1zbTf1ST8g8ucamIFQjMT8VMTQ7TjWx+hFd5mY1YT05oxp1KGBoI5j9tQzF7js4EMoe6clPcUsG8TeltsjNTOb4Zckw3zlmRJBqgR6K2w+Tf1VLQeMiCQpy/HBgdaYPMy086AooGuoaKe03zCK4LiW0JNkjmAxKbMZno8TeDcdc3pPRFX46G1PE1YGUYFtHDlqt2g4KxRKTu6b2yLqYlSrZ+RU7X+A6y/4hQtZEnXP6tVUDKXhHNjXP5rjL/jjVVBBBZRszlYq2AlEDibQE3n2wGZ1InulQN9Fn3NT9UrN3jeogIYF3OlDSU2x+ocaElNrKtb6o4f0BE1v8tWhtLZyBCfCRJDZ1MnaLqvSjxKzPRmNoNfDzRHWc1awU9NLnBE2IyjSDVfQdYIGpl7BMvntVr2RRyjWYuirin6Bsj/eK3GC5xiLjZ742zqOlc3SCAxeYCWpLPq4rOZNYrMnVY6EGnJN2HhuJZabWgFi2ydsANUA8V91ITJJ419cEXNdlJ+RM2ozNFCNcCatVkkEyB8TX7FgNmbtglaCrfOnYlDeiTudWCmo4jNicbX9h0sVSBX0xuljeimGRlrsUtwhC9rF0msHXzNslMRxKl5bQvqBL797W+jlh44myJC6w7T4B0NC6DQ7tHIcV3+VtQc3KNdICljKAm6TsFZ+qOo1HOrqclX4y9h8dbMV04dAh8eZn76h2cRPjkjWzehZGtYTQTKellWcKLX5Yrxle5A8w8/G1l/pbUFrjc3Rn70QUewdWzQcwuQ/UHwL+AettCVUo32qbkPz4bEUL4S4UFaUgKNJ3zQHIhFsnFq13SpOagH3tnkvibLu2/8EBp59iymArEgCKRoK1L/MMD9JxOnWc3MZmvma7BwrqaZJl9zkKi5qEVJ8yg+5GBzknU/swnhQOhmxF4TG5XyTJCNI2YaHm0gHO8cbadJi8aeNJYDgQLPSqYpNYtbN+8k48NmJgMTwfwXrJxwcyQ0h4YKQokqBr+SWWsvJgwmeHMWx6Do3PU0dVs3Rm7d1bwYuewP/JVxaHa9WNPIfAqkZunEmvY20i2nfPHZWHzQ72wSNa9poHNQkFGGKI/QXtQ239f8Ni4BzS85IVpPWwM4m+6jhTHkWHSyNTXxjL7BFkAPKA1aQBqUBJkCv92g5no1fyNzh2h4SxaS3eg6jon6f+mZtcbmSYb1s+lYpmIUyifFgjRtd6pQwNWESqA/xGKgT3lWxC96AAhcAlu4K31wwFWeG6Jh4QP833hkzyLxSHdE3Dui5jdYeSifJWpSJnNQ/MRzig2VydkUWQOe2Qy8iDtRs+DWmsS4h1mo5DOib7PiUrMS2Bgt6Gq/+Fr0tdcWzUX84TVQzTHzeMMZImrmtZqcSUlxwghlNrUeOJsmBBjtBAZnEwnAJjDThNntnq/1b7JUYtAbim3uchI1M+nGxCaICaymG6G5umXURKydr/u/A2wyX31FklxNZ7wBqs9yioppYWuUNEM/6ElRDATflS7TnPA93vIxB65mvJ6acONiZ0zDj835FCuLa370sleUbtmTGoQT4PJyxGk+AVMjqTOXIY8JxXSFOlcTx55swav0bYjQksaBIOeX6lzOirejAYNK6YWhVllNHsTFiSeQAsT5PFA7WyaXtTBaQXCy4kivZzUcEpPPkJ5l7EjJUBDTnwasX2l2EjtXQGLQKJx0V82Y6LJAEF9cXu9TdVpBFQjRAmEo5efWAPP5mmOYdvIMDufUhKRTsT9A1Ny3D1Voo0hNkbh0UrJeNcCh9MrQoBNY5zm0YIi4j0xA0m/m1OnTmnZ6fqKOmgVvWjNG85sjQ7UCCINGCJsFkdbkMdqJoLqaC9HJ6OIilKfiEfHaay8ucGymSbEd4rH5QR6ZhTZGQM4QhhG7rw8EU09sOvihmBIqsKHlBPsqdJeaOFXDjrmFmIOtA7UxKr1pSGwWtWxiNRKvg2YedA6KW3gZqMdm5ALzupvjVEk/4DITqDkpR4TgGKQ1GmMcahZM/ObMgslravVbv8LNGXpERGhJmQV/mDYxGXnGNyYGoDkti0mWL/tUTV3oICaHouZlT89mzDRxGvUZDbZdurJcwR1kDthWDQt7//t/7ds8WPtJqa33x3LV3EEh5EzGCrXBpsjkrswQYnPhOn7w61DUVBZC4joKI5V731g3ggebCNciO4Ge2Ww0MzboCdd6W2nEZaGSRWdzEqiZ9VKze6qh7+eFtOhxcmTWC+vFI9B7khbjTnnBrMjfRnihIx+AGBtwCuzQD+hKiLYTak4s6HGipieeXOcKwDGWSMutkkBNBKEgaGLmNAITLmTQnKn5p0zPIzVlWlOMoAJu6tP5fJqyBlBE61KzFlA92pE5rQaBWQjQLqDPCf1cr8HQE6x6zkfogYpCESqikmrWwN+EqSHg38x1f2qGAQKr2IHAFX9GqRxIl2OjR2CqRsqOyDsZdGRGWo07EtRM682oWV5NYLONmyWJroL6e3VkK7EZrxfVND3upsYPa6+vqUed2yaIHpxs7Wzi0BBRQwveJmg/4sjqs6SjcOufG8eCorNZtrH7BCq0lss6hVXPeHr4AZrRMRlYKkz7t8JXAQRes37ZQ83L1Jxiw4FeoLnU1LFJLZvXulN9QjOq/41cTz31VdgJ8MhQNWuMf0RI+TcdFSIatwGbMK9qtAC+JrsOoi6Li2fO331+cRWKTxf+3hSuQDSdcXoeEjO3C+Uo+p2ZmCPa5GlvHBw8WYsiNdM+aha6dba9X/Zs/gEXO/iWE6SV0KRi2oo26mRsx2heE7mXEWe6GF3/vdSMj3ajiraTCO08y0KVUjbiqWsaGGxINEXLMTdjK7rteu9sjpxCmZUajGl4AXpMIEjjHZk9g8JAIq3JDzQUOD9bQRUrwuZQ1KVmhQVSuGEEXDRQ0XvttcnD583zi/nXUIHrtReZ9iI8g3gxS6Pw7JAoA8JBXZlIfhGup8+M9GAwNSQzOTM5N6m+Zc6ZDcbKrrIhjkcZbJHSjAlqQlFTri6BmEhAsVGCIgWxCL5m+dXEaiK1lTXDc4eYfrje3TwMfRzzoqpX9yX88CkTyVteUhuLt1Zl91DzbJSSmgDMk6ijMLcJw1qu0Tk1rZOrYmB3qKFfJs27U56W5rKbjbHLa8TNwRaT+lM4kaBva5moicIAovkEBoxFKURrbNkh/Wvvdxad0DCd+pNi/eq8FF6qVa6PFoAeBW0h46OKGzwTp3Z6T20Bvhtw8xOLq5NPPPbk53mB+o3/4q677joO6xisvbB6DtGRuVNQCFhhUlsKXE85jUb0NlCKcJKdpE6cipEtFLpPzfeL6KyUCPIw0yN3ALmXuDuxUYxFkUyl35KOuYEB+vdL3cg59XVU8QDKQNGVyJB/0rmrDIohGhAui48NOvFm+rVK72OacxpIYJw9G60VgJovvFDwuZtIzWU25LSb0rseqSxz5UC8k551amgBmqfngqkHNA9vSjYaj1DDBckY5EEZfSE6RBFnkq6OiTIgVBHO0lSUGhvpRQIWsemhJkZsaT/Q0TSjrrAhdpbkIwP1DxoPzvJaLQgvprRizt93kk1k4Y9cSRM2YxlQVli1V7JbK4aETnRTdxPzg+May/g6zeA8zjDZvokBWnA9W5bRQnmUoCZoG5j856Z+zya4mvBa88kw8enl0QLyDJJ3Gluexl+znRcX9GclNOHvBXtsjQqtoSEbtdwlNGHQLlFTI2rK5hOqB7K3LNKBY098i/TCuYPTP1KaLxaLyaRPu1A8dAfrRAFlkHYoM1keLUxfXTi/uPiXVx/7GrxSYNr3zt3hX3dxiHKE9oifIzMagzws1j4JIk462IyNidBtrFaBdI6gZkGAM8vYSDdzmpyZ3/L7mEtSyR0iExBMd6GJTCRS4lAU+h1L6aGDctiLpGo3plP3dTQmLF5HzUGf5DyvPo2vlGM8sCHdzTjrua8Jp87yNES0XijUUDnv7AvLULPNj2lOzelaTRYHiDqtNDubT1NdZAyVwXQHmsGsoQVqPsOyNUhkenqe4vlJk9WiPJoBOucLJB6ayeQXs3QXhQ7nbC/izSPg4JgCm4KZjCuTQMtJOeY6mgTNfD7W0NLAeSmxma3DZk7TszAyhGFNEDmacEyv6qa+1dEbGNrOzh9uLAo6NAdK8nlvazadyAU+1AHf+DGspM23LqOF1pazdO0r2CejBf0kqerpmzKhcp4Z13iIlno2p6eRmzYV7FyUYXMYELYse/3gR9uOrUXNWBnKannHAK9zgmgh1E3DWxb1TD7ZYmo6zqbDzYbflEP5Qoeg5YHBsTH/BvGP71ljQ1eHZ+9+5xMnMl97Hqj5k+fqqVlHUOAnwrPb79dXtKz8wGO+g3rM/RVUCK0VgJqQBs0SXQtwj57p7+qQzfdLdrpLCNN+hta4tsCdzaH4NKAd9WklUmFBmmnQGZEWE8nQbtQDdULNBSihpRpa78s/4C91xBBtJSLSBdwtgJKFnuc15zRU/ynUChVqzZyefuFsjWNzgqgZjbKC1xHAVGbthXRmSITS84KagYUmpjUeATNMSFd4W4XjgM2FFyd5TJZBvCM++aJZo+Gu588vwun1InukF/YAX7CEljMTOv5MaDAFfo/AKLGIUwZE0IxGIUwuVAHpRiP0DiMebELziR+b4zDomiVMloVyLnQ0ExieZankllcKzJ1yp584UVoTVSeiTiSWDi7UNmdaREAzRjFbzGyWWsZRC9GTMDkdlfTOYqcmhmc3JS3Inc1pt4B2FHSadFJYv+aU6J4CagpXE1gICnprUvMytajIDpuxaQgUQsOpCc7m6KinjDaub2Fe89ec+Kw8odf63bl5wqarbCabg3zQhH8Xuzp794UTJ74G1Hz+a2tC06UnoHOq2xKhkwKapBvketBcRwh/Ic0ofEt/p/rbLBR8BE7+tKgtULlyTUykXlioQe0yDnuojMJ0dK4aRL2clMuBPGe8C4NPOonQfhdyG5F0JQ5Vv4ONS25LJF9ZGnMkD4do7OlMz3syIOb0AmITno/oC7iglZvU8Yia+tmKt1uTTrdKJZ8eEuEZOOCYDM8GtI0GqHka05qLkz5qZoCScD+I5pGaWZohiKt2/nAmgiMCo4sLbKQ3YSSoqeRjllGbPAG1KAabA+ik8sLnj9Ds7HzZ5ullTP2j6x/zQNO9HAA2vX7kyDg4mgkY3AmGryYgOquvZlOpZDeUkCbqdIJgTUJCgKsCybMYnypovCjgbQArgeiYjuAvtcAmdrDq9D+qj9YhRlvQNyfBDnJNQE1P2wlkHmFuHmLNS82CS80hU48MrhWhjQNWYwI94CbYBhbQTi+Dc2yWndHCSE0WnJep5GKzDpRjY55/GozOnp/85jeBms9//kZb0JTk7KbLOQ+9MuICMDY2VhcUFLnNrHZo7pSmfeUrXHwY16nAdQfk+PwCLVksVkmReYHgWRstL0VEllbOdCFswts2uvXOZl9nVRyVRLySB1dyoBU0KUS7IuuF4ivwmlcSenKk552MgM2z+Uj8xIkTpHqYf2G6QBpu+Mnm9bO1ir9ybijDCtCtKYvoIjXGoRlcPT2gJlUD5f2yVNCniW19EIulAc7wxJlZICu5oXR69aokGA5rxqkJKU7wOnE6NQPB1VRC1DFnyD/OJ/QyIZ/ICWr6Yk+wytlrpunHZn8Jqanrq6h3u5rQ2YqeOlTqko5DnbwejGQCbJpiHLV0YUAzk2UoY4byTejBxfMxUBFrcVMGZxNHn6AqEEodsAJo0Rojm/R5r/nEgYCaEE3F6dFl+bzPoZosb5rn1IzHWhUD0cXAZnFBzdhlEyPJSE2QUNQciSOE8mXGAvQCATZBdcKLS1+wVv5iXFDz8zdu/E93dLLuOt49jxOKHwmbY179HK/eEaAGZDVmRuahM2pkbgaFjg/NBDKKBjF0Z6oBYHM0TS7lELwvg7yH86Cr3k5HNTSfFHMBUtQDNczKSjZKszRbuZpjQyCzF6dfGVqBF72SWFrK9roaCKgJLn4F85R81DRUx+ShJIjU8UBhgxX0jK8MMDZ0FtKaQ+6oTWzYrPHf3x9cZaCF7IvRST81MdofOQwFgBDbwOvkQnZRjBkSx1eNPdOjTTlkmKgOZ98jqInzqWHcph6BHSBVOmRlFBTe80LfGX3NmIjQEo28bGL+ClRgQQKEFMCH1VPZBEulUmwul+tGLTPqBhyOOBq4NMwUkpCETUeCFpOaqNVEa4zTJh7N43TqFmHkGUwFkyzQSdI3MDerlhvCeZd9EdoC+Zr4s2VRbTSBtxlbVM0jNVm8RRetCEJHU2UUFOc6tGYBuQnUnB41TP5/sQztJ5dR5aA/WNisZQYEIQcPulOefdiMnZ/9ywuHbzxxA8pn7+hw3dW1UC1iM+5g0xujFdhErQrN6SyCSNXcSIDPtn6nzE+rTXsEA5yRKJ6tGgRNoS1OxXREzWfYCjT3Yj1/y/gs9qDm9Sz+BgiB6tfS8TwUELNn9vW8GGiZseV03B2DAdxE33FuAqQPcIKEJ3NGmKxNx2POBSYG5f56gLX0pMjBYvbFBmoKaw8fPn/ehAKAmvniok8Ghj3Sqw98iMdoAZrYhkLYTMDnSfBKIIrP5ssJO1Xmc+lo7waF6nakDpsxLKT167+Bs2lDd10qlQAnR4Nx9SNdOBhGuGpsHD9dRmrSxicJmyKzEeOeplbIxBxojhE1o3kM0hZbuYSITcxsUt8J26x5iJyal73UhD99mZosDYrQYubzsp5aFoq5Y+RK+lXBvK4mZTTsIcygwcwTDUOzy6MaSRxg5Jf+XMM4A+2gAdMLKSW1hdig42mKs5jnBl1qRi7ef/WxJ5/8P6DY547O1/G9XcNmJePFprtbBwc5RQcLWgjGODZskbZQgfrGobGDziXgoH+uyyCkNre2kLYjahbh+l7Rs/l0Aza97U0wWgJU3iMQb1vhpZtLS72W04Hg5fILUTvqpSYcZy8UaKIgXwUUaBMjWyBAq1emI4MuNfMU9Q/0Mwa+ZvS1aF1es46d6MAdXqTlUvN0f++wKanJsYmjixM4+JjrEpCraYOQOzX38XpmWQxUl9iEw65e+Adk9YCZCWgUhJrQZFev0nOGybGZ4a4mRMkRm3pmUOgAoKdZiAtPk5cAxJCa0chYy1nhcwZhE7xMqHc0Ny9XMMGMi9R5EqVif5QhgH5Nu7CM8zvZqfn5+UOafvnyMmBzTHRj2FAjKwo0G9ob6Q1CrgJeY2PTBv6nbLnMsO9kukBNmzb88degQNcIXONzUvsz6Wwibw462Iy5PShws37y6M8ev2tj1Lzjjq6Fcjg2peK5x98cFBsXq2inwoZN5OZoFHpOIjLa4R+KdpDOhsrWYrOjvGZSh6JHvbK0lI/HWkIT1IEwjVYBR1M0POSXKj0WBgBq1qLTL7wgCkpcbFKtklgVlDkHfQN6OV6A6qEhd0A1tNYFekTY448LI1+LTqbjmXWGCWTSUReb2d4ll0bmDd2hJhcKojM1m+GT9uDRyeopDK5GpcpPzOkO8pETf4HV95WUwC3D2S8puvCMdFdsF7FJ/nGcU5OwaWbE8YvQzMe90BwjakKINvL3W7WfSGzaiE5jZDP19LFgNrJs2iYOPNV1DeUOR0d1XiMC7AQPETzGlJkWacvUdKwem1x1Vl47p6GKFv/pjHYmDsBdBveSCoHAi4Vorb4cR2GgmcC9R0WgppygQU/ZQXdClaci6CcP/OKGoXlH9+6khM0xTP+NxXzcRGwepOHU2ldCh82ihtc77NX0TKT2UhMfwcTw8N/b66ypqc0Vn+iAmvvmWQXONagt9WKzsSk4AowEHQ22spTnDQ/5pUSPq2jBDQOVg2kvNa/NDj967QToGJyAEhOoEToBmE+jBi1KG0J6iZ1NxzxFZzE9wNO1H/+3yS9/ZQ46T7AcCKjZxhQeamGk9WIPSzKwfNPjbOKKlissVbs4ieU/+TLMNGYzc4dSel4wMuaE0aUMLe8/iaXjjc2O45jOTGnV+Ymu52ygvzKPwLwIj9nFb9K3TdiM0Dt9EqGZ5/M/h2LClxmCTDOm3c2WTZugPsTommGyzXTToFSOsHkGC6xhkJuJ6vrwd+gWQXaOgvwdrxKCr7P2xE8SNe0h+tz1N2Y3jAlltvAaxRm4mpfLenm6DPLt6G0uQ3OuCbVA11gQw4NFGAaG8uyF9Pe+N8RJ49GlFV4bPH+T+38WtAzu2hA6uxjKIY0ACjUPyvKmg6LnlhsGQ4/m+0O2kihYg/kDx930cOjgoIgHXNz1z/823yBnOeoTt6zg1JHKAVsBapomgjDdgE3nOpaHcvWR7ybB31yV1Cyz3lbRAjUrhcrytBOhPfEouTDs/BNunhPczrM0JAxOsggEaDPeqeFxalMJaGj2KxoaYxzCCpHFSTdAm4nHW/udMDiZKoJe7F2Elp4p2/U2YcFoXDKGvXIRymchODuP85BSqajQxqMALYxrETvJWYqFc/lmw6lL1WSyWuqJZfPQ9RL/pnjMXrkYFdi08ZXm0IxjnRbuUca5x2S4iHtpjXJXvg7NbW7WX7MhszldXrYxMBtdhhpamCMJ1c3l5WUh4ARJZ7EzV29AGZ1+WTTP1r/+Y+LHZQa1TrFpw0RqgpuJJesgcMuVFEDxlrWafN0fhEYHlKJ75+GfjPk0zqRfQ6GnIndf6Aw+Rut4mxztZpd6LSPVZgZl9yYvnhFRgoMFjQV+/HF/Q0UQ79ysFJYi/BYwKFpQaEgNRTvGLu/a87eOtwqjOwzduzEFpw50aGfI1Txf0zk1ZW7TG6EZ4wFaFDVAsVGR1wRsst7uDab8QH3WyWueGB4+cO4IJTVnz3wzwytL4gUa6jiIRRwvsMILQ57RGukaC+ydbOLLjjFWRbddajZOR2+GzZ5SE6OODjbJr2GOMXqNpXgqGQSDojHnBIPtgG0UuoBpkm8CU/L1rSdS/qVXlgE2FxdcYyoJahjRCkMUnp2czKMJziZRGxA2osBTuEaX9sQh7Kw7tcml3OCUnBHiQAQ1bNhEP9M0UWttma+CuzPYIWTTkMDBulKgMVmsFYtjdwqMpLYvA40pODuKwVkT254haq4dCmg5eg7yZg8/+3DKmDWM2f/ha0NNuIm/1LyV3gEph2jzI7uLoRwsERD1wHxbODfpn0SMloUvtZlLal9/882vEzsLcdlEPObo0yA244/u+i+PHW8n+UwE7VDBqa8TtyBRvg5NpqlZiJ9hyUnMkXCXxUtETdFnAluWQKmGICQ2IeUH+rNRRzZnNnXuod27j1g76BB45doJ7pdF4SlDamYiBRZdiknZhmkqGpoL6DP0eNJnjL7yzbgPmq3ZidjEvObp3s42ZaYHm7rPGIOPdBtJpcr8js9f+IwsbaIrGa0oxHI1LRekjYFro88YM1vGSeE2h+Zkns874nlPkD6MTkZwTADkFNcarIstAnObXvU74xtMXaaGTXvU5tTkq35nWIKczebDaGKkqmdH4IJgo3dJ06inl2HKGWjDG6h5MB9cDyf59QcffPCKce7cVbDynUe+5+cmzxFOtvOscYQSQL1ndzcjOeRrivTzmCPZANw8OCZc0JMaC2GM9sPv/fD7Hn7fzZso2LI0Jl1pZ5xQLDM7/Pf/9rGOYuidKDi1PynsGXA1K9rw7CyBBnI1DjZ90o0gCsqpCQrdS3HhB0DHZrGn1AQNjMpZFC6kA/dwav/AABwBex7YufMBOgTOHybPBboyB2F+1hMXFlILjz6JuwHaRvgbrlwJbDHQv9UajKGwc0bUYl1ceXRh4dEzk/GI20Pop+Yj/UHAJnGzUm+MMTMHI+pSqSwvaP78kf27dj164YSsB5bMtHEcRUorBWljoPa/fmd0Ls1k45jk+NC1M48OD+957EScNgLHmmXA0XzzbVqxy9NyYOTpRY/OAVJTNxGdOEJSLLvBmKs3vM7m7huwM/ufG5MTECD3mTILOm/QXJaKQNinCbHZADMTNIyRmgvG7oGB56BBxmBXP/+SE1PjwzUyBa2jdCDhk+DZZWqC1IHsmxH1cyKHTppBdMWJakbY2k9y2s33EjU/DD+8qWlvLg0MOJXPyMzB2Cup4d/ce6zjzDMKUUxtJjXR1XxFm31p4KVZZuFLc/2at29zbMyhphinCQHdPFETj7YVltzX235NuJScldR8NHUO3/Pd+3fs3HnvTh5z0ldW89PTFWhAyVxPpYaHIYWz6wZ2dF55+dkff9/73nclqPH/r2iNxswCVzgzJ88LYxYupGXLI3c80VPDCK3Z67vmhMQm9vA3Meb00xMwPMyOwsP2mDBm+FoaGzmh4NO0s1lMkjH26qtasKjZdGcM6DezSWUic0Ya8yTKNMWHsGVLY297+C2mdfuTzhg2tZ5IakKgHOefmlgNJF3NZo/Zke9JbD4p35lzgpoRnR2ipK497e0Onp622aGJgJ/Jkpo3jB0WQ3C+cuMhNz6bHsW7z0bCGsjO48e7GaHVaidRUAs8zkxszNGlpUYUcjXHyuzmFWOuP1RrXPuhQ034EbmZ9owRB7sSqe9/f9ffOraReq22FJz62g+RryRSwy/BN32EffGLlxCcb7/wfMylJmzD0OcPP/nktUk+TvMZl5ppqOvoaTkQJFltGDozLcpLhyU19Z07f+7nmC4uz2YCxFBY/onUnnO7H9p97mgKSgKu4Cv0YICp+fiXtabGvPIECJ8vggatNCa1Msknn8mFac1J1KHt9UsDrQ9C7gDUCJoZY5zGYlg9ccHdmQX4BUMu2KaHH37w1YBFaFvsDJTZYEnq5JOOManHhvBci4P1bz788MNvvdl1O2ZoxiZ4m5xwMPSEqKlT/wlfzXdm4ernCZvnXGOOiHZa/RAMSZ57B4oyeLg5XWYBLz/xUxOWRTKtC+cTUbxkFiBHVbvZcqRbG+js6tAKmK5ZyIIye7ZSmfT6OLBQVC/Lsu991QhZ90lR+7CXmg8jN38Yd1MEsdHU93/0x5285hYoOK1LzX37hMBBpfyKdgA/1EvW3Tt3Ju5mPBj4PWcnblzdRfGn2Qo5myC/R9SMYOddmbHeUlOzz1YqTal5r2XthB9EzQbMo0zt4RfLhw4Ma9//3MOhoqbXGDjTYNaGx5jzkEzj4ExTJm2Su5q9Lw5GSVqUcK+jptcY7BxMeY3Z9cbLL798BRb88Cqwhqg5Eo6dgUqbxRXPY5a6nzuab36HDHnbWonNrepRAAH3ayhtAK0/EFc1aMQPa0VNrzGzj33veze8xhyV1PyRfj6HTF/2YFMPeqtDiVOT7X7oIU5NTk64nInq2oVnH3y2y0H0jTubVwAsz8LxVYjCrM2T0MydceR1D8ZATfNV+PdXQlZGq339vX5qfvjDkOCEgYg4hHMoDvear/84UPNjf3ujvUGo4DS1Cb4mtmouLtCLMzAwewmCNAmmk8PJznyNb8MBKBM6cOTAbEpLLWCkHCakrKYdava23RFmnsCksKiM0PqpqeMJcO+7SDIPlpbaLe4sDx1IaW8LGTX9xhh+Y66DsgGCk4uhEzWzgShzGpmDTnvTrqfmWjuT+vEHH/wwMOY/wf0h2DyoaXOh2Zk6Y27A7UV721vckO9oX+h+lFwDZ/MMaGDiMk1Dx7Qm79eksiA9tYYx4Ph7jfk85ZfM1Lws+9Vdd9MOfBZtXnuWqPncbqTmu971Lg84ob7hJt6jgZqhcM9GDklqPgs/vspngsFQMB51rzH+6zeN+dClNf3UhB9uegaM33zvj/7oD3bt+tmNUxMczrW42dfuQGpQBZLU3AMvTuJeC/7+xbsRnK88CQ7n57XUEfq3N4ZBjGWCYrpZEaJNpxM9FgmAcqDaWdAGknnNI3QC7NnhngA72Y6dD+zQ0Z4DToXD/tSuHwacmpA9a9uYYa5Biy7nJDETh1MHowNgZB57KgAdbRvz/QZqXglYEX0nO8PYm9+RhvSAmv2nQIs2Pg1ieiBxAB4njZMFOQLoEtE5GVPtG7NHKDeL/OUERBJM0kmAYloj8H5NUbv57LPPLrAjUDBM1HS4ycG5cOXVtx78erCSAWvUc7z3rddfv8npSPQsFwoVDs9XX5U0Nb4SJmqWMK1ZT0348eabb9588+tff/Mm/POP/uhb79zzzuMblz1cm5t97VYCJdDXvOGhJn9x7ualQVfP7BLQBGyCt/m4KKKliVTx3lMTsakvS2peg4ASlAOesx6gaJO+U6Rq6PoMa7+8OR/Zo70t6NT8t1r7xnz/jQUcFCbE9BZhdrumBWbQ2Tycrqx9Y8DZrKMmhGgnwrozu3hQgwzpRfxvBvTmL0e5BkHBLkAJLbZsIjABFDBDaqIDY4Sz+TMpKQgGNyLkZnnZNILf5lAid8VAah5gOzg2veDEL+SNN0IiqfMV9uzLEFteeONVj89Z/+Or4aqiHXep+eBbbz3r0vNh+vHhh4maP3gZZA6OSeGJTfY3+9qtBCp7qHnJpeYX2SVeGqSlXpLXTYjVfkE2bKaJmvmeUxNbNpmjcvBo6sBuCDbhCXAvf/V/7l4mDwKsyDzA0zRQ3fCmQ82AVpo9/pUOjPnwh1/9a5yHjqNPzNrCGw8HhpoEzlNQ9dO2Md+vpyY4m9WRsO7M51xqvsWS/d3XZLgmh4WVqXjWNimbfOjQzDwpTXRizH6E5rTuUBPurPDv4TeFojcQ9YHg4x557rkDIq/5rgaPE9Yzn/gAL/nYF2BbZpCaB/YA6F9/9cFW1Hw2XIlNuNb8kPdrfvhZg33/5ufqfE7549e1caE/OyXkaI854hPtcrTFhJp2qJlkWRQJtRe0q9TiM8upSffMBIN/gJpaLAs4J9ucZ7UvP86raNNUf0PU7HVXAI71Xc5Hp0Fydhla4vcc2G/pDzzwAJwAO3a6BQ50i97BjKM83ARlJ4KaN9lMf1C1gdo35sMPYlzzjTfe+GtYb8ARHSRqdmhMqoGaQaui7WRnfNTsvhk43IzrHIBSrK1jeBYkiOY8Ar6d7AyM1YRXzNthAolrWKcmwtFED6kC48CRI1edaqB6j5OT85GnP+AgM5jsnDFefdk4N/DSUXQ4b76tBTXfFy6hA5TU++EP0ad8GRWcIGT+YNOIbatCZ68UYksFJ7mOTW2MmkWtQuMo7FqKqmgGqYb2XgtwCT8wAU94jtjVlxxnEx+i7zJ91aXmfAAmaTGqdmCMC00yC0+Ad4kTgPETgFzon3uA7eYnwB7tZU7N94kBvUGM0SbbNuZtD/JsoHNEB42aHRiTevnZOmo+GDCdg0525srnekrNkRlDP8NFZ229udRtBztzpsD80MTE9czM/EhIfBldUtPasaMFOHms1jjtuJxBpubAOYM+7cKV7zzYjJpXWHhCtLlxrhX85vve9+HXjd27QcHJ+P533mqk5vvau0MLhNYrOK0Zpu1rg+wsChOcEliIrg3fGBy4wb4onUxRFEQMBX/TsLi7eUNL4RhqSIdewxAtp+ZMEAKAGEpGZp6e+7tfhg5s+PD36gzOgQfcE4Dx8+AArwjcD3LVL//gc0TNkeDOPOnEmGBTsyNjoKKxjprjYd6ZHkZosWlWo0slj8sempm4FWMgIhjcW+a6B55h1sCC2atXjTstDzcbwCnJ+UhgyVkU1HwOvWZKyV55+QdNfM2QVNGWqsWkWyr79bd931VweuONukjtwzc7jDwJAcRGdh6f6piaJY2Bn5m1bSi3NHUNJPUsC6n5ReNuLzV1XlE7Sz3PL6U0uITNfUBSM55f1YPwEoGG58ypU6egtmGExmvBBcyCYvsHeNDJdwLo+/kJcDSFpP06bEmw52t2YMyVNz4XZGp2uDM333Kp+eGgqQN1ujPf+VyvqoHgjjs/c4jijmwG4rIjt2xMwCWA1tIGh2kvuhDQuPPOpuD0ktPi5Ayc05kDxmjGzZvs3MGDzxkezC9ceVt9XjOw6Sf/ACM5jsbSoXAba7Y4NfkWsIWX3/LnNTf2GiE7/ehscDfXoea+UpKtRhOsgoXoWsXGostUChxLcB6/iKFZSc1LwgGleqGXhjV84uY81KywQ8E7nfdNPILd85a+Y+e9OzD2JE8AuE3rWNvw0JEDKWuHxRUDgj0boDNj3ngrwNTs0Jgr33lLUDOlJcO/M58DbaAv9OaTgpgPrImRzTIm+XQIwTkOria127jc9JOzEZxIThed+4ITx2SkNXnupZeewx4aLzhv/uBBh5o3jeDOpnDtSYq0Gm8pRmzCFADHjxbFza8/+6qg5g+1WypyIHK2dDfXo2ZVex3isxojqRBdr9jQ0kwzqSifSWIHLjXB8+T1QsOpPdbpuRJRM04y4SuMBTKIMfE0HQI7HqCEzQM/51yfxQlwNGWJPaFDYF+gH61OjLnynR98LrDU7NQYaKJDjaBUan4bGJPSAu6lTfApn9vjnelvrAXSzRqeypDe9JJzHZfTQSdnZ2/hSWXAqNFMEs3PnePU9Ag2IDhff5lXByE0g67XVOTdQOhk6nSn4bl3g5176CHpR3OvH++doBUEc8SKt1ocgKrBdznuZicRWniGYB4tDHsngS34O6hkf+dnuN75pS9i54mPmpcoRAvUPPDOvomkQ810GkK048HckX0Tc/z2jPfmex8QNfXiBDhAJ8Dd8qVgyZlgHwIdGbNw5eYbwaVmh8bQSxTgcMA2esxgNvazrz7Ktss701ALZBI1Gf7E4WYjOJuSk18VODsfeeZpoGcvwrYwIlTPJhKjMNgAJzY9d+6c23kqPygX14XRFDdBKjDQnmauKtxMy0JkmuYl8jQ5NW/sfui5BgUn2LpkcXMK6lxyeotp1/M1k1gLhB+QtEIQna9C/ujmFTEo5G4nUGvt9FJz+MCPQUIUesDiaT7qEaaHJPuDfHtGi0CSml+f772X7ZcnwJ077n7Xu+7eEZ5DAJK3p9s1Bh6v7WPMttqZwBqTg8vwG9gbf/PKwrbZmX5v8aOpU4RWwyNaKFN6ydkkWOsnJxptyf/m9OlHPtD1GLNmEjMBmqZpSWo2VDMJu5gTytwXWNUJQ3iZpsk9TSG0bbRScNrM2uYpQU5PlHZ9al5Z0kHkgEFqE//i1Pzc5z538+UF/snvptog6XISNV/Shn8McHvNO8pxVTOCW2oGylMPPvsyXQV0ytQ8wHu2d0M94J38abvbDcOQVkqwXU5+PLdlzGlljDKm/fV4UTPZX4taku+0/84EfmekyCnWApnC1azgTywhkbROsLYZO/nRfvoD3YfmztFRDk346Aeee+6o0bwMmN8ItOQn9gXY9zcolwlKj7g4NS0PNVGL4l3NhCi87bSbQM67jrVLzZGqduXayrXoil6BxwipqQtqQnvZ//wdemegNuiLlnA5daLmDe2dIJce9w5ATi9RVVpQ25tOMRADf/Bz4vYMLdv7z+EJcO7AHobRJr4nd3tuz0bQEzb7JoRfsz2Moejm9jAGGqBZaI35B1XNdqn57Hsf/MHN7fPOEHKYCcJZpGNUIccGw4K6D5xNorVedjbA03hkX3ehaS8CNJGaJqfmAVAHatk/09B3ui9gtxi4tiAws2iSzT1NXaZkjCM3bqyl4HR6ExWcptr2NSdK2pXIUOQaWwFwIiMr+usONTFU+4aI1V7ayQO1VwdJ5WBGY15oorOZWBCPXRDJOY/1MbjEdhzdvRtPgCMHhhl/O+6+u+EQYMaMOAUCehRMPLJtjCnx8rltYUzVsSWExoxrNpTPQ2+pp9tvYRu9M9R2UkPWQCmHib6aJWo2aTaq5iWn1Yyc7xbLq4dgfKKrmKksJmBlyTHDzOyeo0DNOxsZvyMEig3QO2OZ9k40KLEzazr1s5KavVFwWs/X7K+yoUj6ypVoNFtJrzCc0+ylJv7kO7wwAIqDEpesI0jNPVqRZeN+bEZW2d13W/KZC9oGPT5/SpxlRmr/gaPnQHGTgk1HU648iLw9++Ivnutz8M6BfdvFGAw62Wx7GCMuAOE0JqdVEtkKFmb+9cturzzbNu8MrwUCXxMACdTEEK1DTQvLAKofePqR063SnPzkRmZ+iJZkJ+uis1nV9EWOGB7NJHIMD+OnXbt9RpLz6SCdzOhq6naCL+lock/TouRxbxSc1strwnP0euR1di1+jSWi2ZUKvPGvv/46emWvv+785GeuiMHB1pGXBlHkIKWxpXwdNeOMvfvdd++4FFByVnmVFiiBHT0CwXI6AY6A0pnvYWs4BPCZPD0T1MDT41/eFsZAHT2MRwZqbgdjStRGp4fzMcthmQmFyfBtf0NS8+vb5p2hWiCAJvbQQ1bQlge1xYQSZxV+0wc+8cxpYy1y7iCfU3ATqXm6e7YmGUdMlnuanrqk+sbTZn2nPM/5SGDQSeqG3NNMXDdF2wl30gif7Sk4WZut4NTXxgdnr0Ndz+vX4tnKUkVLsuYrNbtn9uqNl5CaR2DAZmWJpoR5V0X7+Ic+9PF6cs7tC0gkQJMatXvkCbD7AExyrg/F+PM1Trnc6eLTuX0BnL25IWMeeTpIlRtYoJEdTST07WAMQhPCMjoLozG5JNVminQZrDdefpVTcxvsjFMLVOMBWpY1zayXmlRyXux/nLwJj8spcVSPzh1Oi+Sd3aNmCe813NWskKtJLpnMybaj2LBDtp0+EwDJhqLrau4UFbQWiQWIbWkRLt9qBac21Nu/C6nNyLVrkWt6Nsq0cRHJdAIXfKVSVw8cABEK1G+fhd8SzefrnM2hFe1Df/rP/tmf/nk9OYOgRVWkpDNhU0sdOELRJhA5GdZY41sh0jV1p4C8QO8L1oTH8BtT0vhBsLOyDYyBtwfO5UvhfMwImolRm5/HoohRf+ON970ttU3eGdQF0iU1RytNqOmRbNz3gWfqyIkGN7Jzh9VFao5rJgVoR0V8Vi7WUupoTcUGZOfTn+gZPeHdt8wspyaEy9H1t6htk/bEa5bRoYLTrRGnnUlh34WH5Uok/nqlrGv43ltUCUw9p5eoiYZKzvZIaoIKraYvgRzQii9Am05ob3/3x/8cwPnP/vRP//zjiM7A+JxVCU140FLa8AE4AR6CA2A/nHA8wFF/nZSHgHsKOE7nI1hiH5BzIOczRnaehcoYeHEq/BiAKu6wGwPPmUEVmZAJCJ0xjycvJcjVtCvS2TTEX+F/zDy1QCgNZEFaE6jpFG0SNeEX0dn0rg94ySnQWcdOy7rT6B41q9oXgZo7eQEtgUWik/kJc+e6fafe/wi6TgGfH+hB14mOpUA7MalpU7ycmCmrgSjVrBldV3Ban5rw5/7EM9C2+TqMMWDfpaIm9DRNmZrljvMCvDeCmjeGU5qehwZNbdV1NONZ+IW3Y6L84x//0J8SOrnT6fE55+d69Oagp8mkMYhNKG04BwdACq2s6SIzUH8INFyf6UG7kz9lj8xA+KnnJ0FV8xgDwQ73NQiNMUkRcqr4d4bpnv7zsBhTxauzKd56rzE0i8cItjGPJ3WeLxORMqeMkTUYo+vhfGd4syaW0IKcnrnTtneO2qQThBsG1CTt8HqJs32Q5vSQ02HnnRxW8BOji60nVe066Rtw3lu+5dFrWIuczdpOxX/0dLe3A6A5uhMuAVjb1AhNpkk5d39pc/sKTsbGFJza8DV/Av/67jPJZHGmj0a2csJImQb+EtVS4GzeQGoOHrn6hSSLLrHKimzZjF+LJ7L5hPZuZ338Q3/enJy9iNYWhYy+sMVCU45Aj1OqJlLqTrPWna1PAe/9GV8WJk+CmR560bBZjjFMs5wStPAYk9N4dYNd8+3MgrfVOSzGwHNm8mQTXZPdneEHQLCNebyoc5efJM281KTlMwbv1BWpRheidwabNYX0DBQD7bRHE66vyalpWE01wfcBOiHR6WWnb3XPSasyfrGx66ipC1BoRgM522w7pRbIp7vcdcJMhCaqHGGEw9934o4M07xPYmcKTs5/1ZGCUzsR2p/gf/8Jp25el7pGlxxqgrMJJQFQDPTS1T2zj5e0SlbLLjERo60AMrNL5tvf7VuSnBSuvbt3tbUETe9FgKWG9+zfM5xC+WO8tFVILMRa70jzHgPiDo03caO7Tc51WTQmjVmAmJMMDugWC4sxOeFq2ty/kcbIY4B66LQWVRkBMwahaYs7GF7SpDHMS836/FNQjPnvqwTNneIWCREY36c1/MbAQ1axR69/cV1yBuudwQramqRmFqmJvqYTHcA9guLaYqugHKLzmSbs7KY2UBXGz4D4LGyAS03+6TXNh5k2FRv8pGFd5D+hBl1N9DOzTjUzLENakSwWq6Ucb+XSG96eLVRw6tvAQWxJZnp8TdOEbZk9cAOKAbRH+vc9AzZVQHs2H792Lb6kr+QTpv12el3qyMkTndzpvHuHq94I5OwJNOUlOpV69BX6FdSk4FWDl3ijs+c64zkF7nZ3xXcOdF8bxOdqGnRGp1Kzr8BoVH5R03XTVT8OvDE5Td9JwiDiqknGzHpqt52rZtCNgedMRi7cK7NjjKt8AD99xH9rDoIxVe7yj0pJM45+120xvMaQs2lTFcf1ih48Y9ao2JSCbZq2M5HdyV1rjk1L55u0zgxXh52nCZ+QEHy6m5YANUehoVa3dNF3YvGLpaBMdVyMdcYy7pbBWoGZv8QF7TN/+ZcOa4xnujodHKi5E3O02WzFfW9QPLsKuCzlch7nALaH6TwGsvUKTn0bUAPTHUfTdKEJ489TMHoTx29CCwbM5YSWzbIeXcrqS0uV65OJt+/wvC515PSEaz3kfOQT3Ww58VhCJ8ICZW7hL8hCU4TAdBQQm58C8hjgwiC+mgdjrmeupnjSoAXNQ01+C9XrhggG05ikhq9MpSKOa/j6F6xmzPTcNANpDOQ0bdEN4O3VXpB2GK4RYipSkIwpadcXqZ9B9M4z5pM193587mzifXMUsXkxYcI14HQo3hmkJq/OhEgm1aDAZa0i3BwLfRzaq+L6f9I+gCdfXU7Twu1mlLxMnUR0OesBM+MuZHJVahnm27g+OblgA6Kzy52nhBqbdPS8nibsTTLXtC7FYkKs1vT2qG6FglPfhmQBOWV0vJkJ0uCztZDCJe5i+4raytLq0tIKlNOKQA3UDF9yX5eW4VqXnM/s6wU0JTetSwKbpILIuSlHu7XsccZTwBEHwV25u8vaID7gaBRL4xE1QU3d8lLTooMgyMZUNROOLufKr3uQKfHiHNXWGsmNHhvDoSmvXuYlR0pTwr/5PwXFmKQpVdqEOCspgnip6cemLp3NxUXEZjKHA0YD/84IajLMYDptj7bIbVJak29PQGce8ueMUx4vxxUuctDoHuP4TcsUA9EaCoSaSDaQ24mAMbqp1yCoiVla2/QKNI03oZIsTIGzepQUEdga2oe3quDU17HXbNE7Twu+ekmbii0vBFCcvY8qb5OsnF/KJ/T8kuvTEDrXISd3Onfgb/5Et/o0az5kihiNG7bFA8/LTQ85m/Zp3S21QT6EralwjdnXW1fTT02BTUFNq+54DpgxILIBLprro1lWQxmAe1TTO3X6dPCMgToTzJDbpnxhXPpbRH+vHQaVqTeCs3fGVNmir34WS2S9WU1e/i8NssQgRDy+LuL/dC0p5qQF+50Zp5GavDHTFtSkU5uHaOUuNS0I6g+M+rx0jXUhDYSp2Lrvsg9zN07suaG0trlmQ5c7TyU1bVP3nMqNzT+OsBsl02ntFPp7rDMFJ2OrqJl0ArSXCJBOZrNC/lilRgdxad8IfACYSl2G6Gw2ij3DM0/PP+ImQXwxmoZEJ6Lzz9+NorWPdKflpOb3M3W3RAutxetAhZdxebCpUyR9zRZnij7hvfnOnlCzSJw0BTQtSU1nGrrrazaezwEyJom354r3i+dOZrFaB03RjAJnmt+xCYAx45Qm49CpeEQCPM+Zj5rMRarlD6P3xJhckuKzmN+vSQ+FGT5oerEpHzJxfCUu7tTFSbcvcDvTRBqIP0Sitx5Sm6bpjKmWO1YNLDVzvOVUtNNzX7NJJhZ+G3OxKSoEm/TO1EOz+76mLQObPHCOOc3mIVAajZLdiXfTLL/woNi70eBJW60UnIytombOkdC5xIuZdNNxx2iUi01Pl5g/PQEVQVkGzenFeVLO+gB2NrXhdAI5IU77boC/0Q1omnXMlNCsloqcm+glZCkr7cOmTlPFLdbQ4Ww13NB6Qc0cdzXlQ+elpsfZlFXb5COwJu3aPTcG5Kg5NE3X0bHo4CrWUZMXCxr0+MEcy0cCY0wJXRd8nyFJluVlTVZLZvoqgyigjm9UT40Z1x29Gd3xT0QJEKdm0otNS2Y8eGYTwrRZS6v2uRNGHzEC+s5AKI2HARxq8qphPzXhJ8EN0aJyq+7EmHiAttpC4NUNrXHdHWY0aTu90+lewdbTblNTVgHBh6NSH8mWps4mWIGSCKOjdFujIk4Ic3iYs6aC05ZRs+RQU1QzMU+Ilj6rTbFAEXj+Lj1oyfkRyo+LnuC5eU9PcOtwLVDT2mJqVuuh6anSIBv6eHmWLt8gMbLOFDLCJhyAeFFgrHmDs6MN0qMTQNNbU1OiX0RoDdGbrmnuMxYQY3Kko+272eD+jHvHh7mnNUMFF3FKTLjnc0+NKfHhTXD55eXYnlZTHme26qlpedxn2CzYll4a83eScvZUxb24CHkDGmqsVXPjDd4mrz+HxCZhk/mSUUHZmWYKblyM2hDv/CiNC6uFh5pEfia9TYtumLnmoVzdPfYoH0hU0k6fbibZwFdXdQ54XLPmXADwI+otqJkTcUE5VEzkpME4tB4VnIz1FZy2ipoop+ejpuYpB+KEr+imW2U2Mf+M8DP3NchpuD5n82gtSNVuLTXrPE1faaMT1OD9qdcbsEl/p1IB3fEOGp80fkG7sydl9ElyNWnCLmmEeampm/JphE+OR50moIOXBTzSThvBMaao6U2oWe1v5Wz68k4BMCYnhXRHPQJt0tEslkoNBaiGL+iMDV7iceyRMVBAm/BR85IuRIFEfLYoZOm93qaIPwExydusGPVnd9AeM08BHQTR2KjUQHeSAyGhJsoC6kyXwu1Wq3gy/jbn6BO1p4TNcd4601Su4Zl93R3e7iAT/wf+sNWCmmJordPw5PiaAKNSGwpOVmcKTn0dzwjVfdQkFRCiZpZTM0tesay/bv1HcadToqZJuHbHFvuafk/T10XnzQRgBoBZthebl8R/Q0WRFu+zd0bX1G8M/WyiN2McOTVBjbrmUtOqo6ZBxKQpabSjMgE1NzNzOhjGIHXqocmpOe5304TYlmxEd0fR9tYYOJ54hixhm3XQLJb6G13mulQtBgoM9+TrgTHUq4mhL9txNimYrwloJp1pLobkpkW123SEQREtrwgq9jfMBg7SY+YYwYNoWbrneFMyRkioicFXizny5s2qZ4RSvbdxAKsdKxybpVaSDae72nrK43xSPh9MArK3itDSfcfpeNopy5/RICiF2udTcDJuXcGpr3On2T18sZYEbyl4H6tkhW8Mftg6jcAtnE5fuPbuHVtMTS6jV8dMoRPh//z0OytebOq8YthxNIWMLXwVpqE9XXcOwB1mojcVtHjjr4lFetS6zGbqNUc5DIlpaZKautdP2zfRcKj1xBiUbJFXYvBzeK5mXBYB+KmpsxaN6D0zpiQ0AYE7O033Zma5x1m1BTYNTVKz/rDoqjH/HY5spFyRyOtLtTyiJFiRc+6XbgeKJbJlo/Lmb7asPA3KY+YMpaFvnlPTbRbCw07KabQ8ugM0Ktg9zlp9WpzC5cGm04oLfUL7vJINTz/D19Of2Nf1aBnzRgBNHOCQXHvYO08MYImNLEOBIMe+JioUxq0oOG2QmvytwJqmS9y5hzIHQc0sesXJ9muz/ZlOb6zZ2EJqFp2riT802+zQpafQFEffKFd5BL0tc7QioGnQt0LfBAUE8BwAePL19ESPFOkNDzV51EncPz3UNIiahubUcBiN6tQ9N0Y4mzWvPgD/mH7eOLtotLhe98SYqpzdBCVlWNXH9QEsw+MDFJthE58rGRho3uzQJWP6khY897BGR0UpE740snTWG/+rehtoLV04m3zZ66gDBOGdkd4m8hF5TwKoeEUQgTWHmsGtoZXPE77sQrC91XUlx+/VjrMpO6OMtTequxd/yxMChEQNa/3Vj7snOsrSOD0PejMXrsGVfuTpzdah9Rf48rNJnFAaFp3xLhmn6KxCPZvrT1Jp6XRyclpb2a8pZfQuuW2AcmpbE+RXPclNdPypOBAs1rmjaVjc0zQvwS8FpQW6SHVbNZeazKGmeFdqfBi61NeRQfdqEC/PegM1S/Iahw1pHmo2bevu7UbYvBbTtuWgYGqj93zRlAVoYCaGnzk1L1m97KzvwwjzqHN7J2Egk7zNOmgCcpIebPqoudO2gh3X9EkAYAwNM06jVDbMGgK0pf7gYxOzRtaaH9cfo63YojXVCkpnzbjmOpsiV76WO8ajh5cc9QBbSHK0tsYRcNqCmSdNNBiYS01sl62gT+wUL9k8p9z+H7uvmdOJa34ruzLEe+0frt0UmnzQG9N3SilO8qthSyhpIMqKRXJADwp1eDGQE6GlPXF9Ta6BqHulaCh6a+pBbOGWmU3d07GZc9trLN3bJ8gLgor9wSnOsBOjvBgTZbWFdL7/BWlIbQqHx9IbE5tdXyMQrqSLuxCWpG8b0pZGs47zqhul5dSE4Ax/a/Tgw8YTpYURVVmbJA7EYcfc+0DAA7TivMLHh9fHtzyLk94Yrc3F6s1OT+8tdpktXgrEb/psrcPJqaN15eo4NYv/q/e3/fR/+1/91z99qxfJDk8vixcquupG6G3qUArkFPwmsqaud/hkuWVDbq3T6UfmtvYWI4S/RN8lr9K2WgSXMWcjvU28dVP+lvenFD3UzAaWmpSX0Z02TdMdWSVKAy1BTSOIemFVWSZfk7e1pCcMIDOFuld1Kygn9L4kirZnMQRjYu2YzLyON30gnYaUqizn4s5mT09qeMNtd0lZI+5sFptFOHmBH1ETExpZLisU+MCmz91EdRMxfVsmo2RvcwjsoBgME1GYlp+35InRVihaOGoGCJtJ/o1bYhwAnE1rJ/54Nbon5iyomXy87jf+9K1ys3NqktynezolefeJm/bnNQ/rx2h7e5s0vN6JK2/WMqZP2HRKaakxFcNsRbwRSQExuK3ZQYrQutQk2mia7hFoqEhFB3GFJido7cxBb6+dMmlR43KHOb+QsMW8jcRWgKwAasK3PZpAP7Mmz7GGj1f1qOgJR7SKATQuXnmppypu+OCAnww1fxj5ohAFupMWOZu5ZrOEqZSWtFrQeYEeOnRSQ+Cj+RRCTBmOFgKbEpth8Jl9t7DWR3FVY65KDY+gSWyWguIwO8y01v1QIrUJR1lNSKPzqO7jm/3RNkBN51pPhYBJzGziR3TcTaKmFehny0dNnx54ce2D29zpQNMSvztpWE4KOkDUJJEDCU1Hk8L0UNPpHmJc0x2paZtBCm56zeGpGktI6+PUo5KzL5bbUuNQUwtWdDmbsOUr07wZIOlJmyVL4iGVgxIu9fR1Smp+AS0xi0EIHDR78oSvaXIxIWgFgFIAWw+yfmuTSgbd9TTxypksCRSFAv7eTHnrD8z1w7AigyY7YXdRRWIzFwC5Bi74afGwnlOsvU71MJMnnKTm5h8FfZ0WNXnrLriStqSmU0QrTuMAP1w+anqzScX1+4d2UknQJUs4DLmkQccD13KyWVAuCxTgM11Pk8sGm442EEmKmg41cUKCZZlZPaDUhOR3qYohG8t0lGiTJU8sWhZ1OSrP44GhJn3dnJpC86/JkZTTnJEaIg7Fd9Apou3Zc4VS38ynxuhSs1kTxriHmryBfnTU5NQM8LCQVrOQ8JDTRYUMHcrhYP+4b2Brae0JDyhyZgq3hw8Y0APQXUPgx3eCO/rFUrtNN6INsCJmJfSamlKLxXKOKE5NiXZeMFeBsNIlPdDJf0lNy+dqrhdVFkPDTZ7bEWdAjqYHCD97tFECpadBJsCm6UBT12QpqskfKRH24JFbOuGwLDjIWRvqpjNle4l4wjwyj5Zoi8bcQfFvBIaa+IXvzMpm7RYRDd7u6H0Ikw41e3v3L2ouNi2sA1qbmjkhEiSmBGBxJrqctslCk9iUGRnZ8iC//2RD1XA4nM3WRzElcmoYSRfUhKoUiwtwjvf+2i+KLoxWsoBrYrNikym9pqZT6ecGw+AZkiL7ly5R/7PQPzGD0/bT1BLDKbu03Gdrvfeh5IbRDPkkIp1kgT0EogLjYYt655rbXctDtE6mnNogLEpMM7NCzxhWM7FAOwRFzPWJ+IAlj+yk5rkA6WJoTVA2QlLT9lKz+YM2Xnco87F82B1l9fRlopCrByFeBaxmX3OSl9GK0ToYhrIplsECfCI0r+B0TgkR8c8Vi8WQFAJ7y7KN1swRTZtwsRHU3GmvrZPeVUE9ofXZSVG8g03uFMALtAVhp74NeGieakXYDrj/6zW9cQU5lJHz+JrtQ1P2cmkkI1by3Na4CO8oXqfHAwQYi+lus4moovWNQ6VwIMo907h0fHeCWUPr3ThXX0feh2URAG+JwIeRqLkvGB9ZULNiczFNa60izFK1ON4gish7BXM9Bb/hVWb3DdYsNvdNDV5fZslxGvgVWOEpB3KaT2kF+zBrw9k0Wvc58voHjKKL3kFb51fPHlucqxvUnuvgjqfJAiL0F8wtiHr2dVb/X0dNupAUndpMv6BrQEK0OVgtL2JSP6PtoXlV8SK5mWkq3xbOW5CSuRS49AgbcKl2ncY70v2/QvH1EhlAsohYA2wFvEKQq+s5WgdJj0iAJXXDe9ux+fMNp5cosTbdvGa1M3dH6/GmVGUzCX9l3EkFWtM4XlVQk/emU0qTlI+tsKFHYJOFkppV71CANU433rTpCKKOmqLeo8cWF30zDTp5m0tJb8oG/eZNN6Wv42IgEtJ3qZlDoU0p1ejlphWE5H+Jai+TxfFcfU+ZnPrrPFZtftjSeLVYrI7X76/Ve5egyZnLe4QcaqLQQQWbASo2bwWQLQ5w70FvMztqBv14oHG6OnMan8b7/Srukqc9aqqDpyMJQbyR+uHgplO0bHXwrDl3tF6/SUmBTcM3wFzzRFway4FoYCunpihFDR16SuK5svRQVTK5qQFvHW1uzTEPplREzdZEE1eP6xo36mrKiKBBwtrkNsDsymSud9VASREJszwF/jmKUcqhgZajGYC5mPEgiGMZXNfDE/oqcRU8vxbL+K08ntRZpGkB89OS9dhklIMlmReMmjnVmkls6UB9J9MKfF19VcTMvHK0bjSKXM2eUZNuuXSXHK9zWCznOml1dAbk4NqX7H0uLSelCwzvVM1WvQAlz8wwLlqLSsdWODodmx7dAW8JWMNTdmO01TXeKMvBJuRodJHu6OHxnatTmO40cCSC6+74HRh80svOE18tkFQ2S1IdqUgRun5or9+REh1XdIVCH0q+4hSeNfTNgqYnAVLMBe22qQmpPEv6wqR5kvVDUwgGimtQNejUZFIH0ZU9GRc9m7wxolfUxNt9FscwV+ByWy25Zb+y+Y8ymyzYAiCtXyVRNutCs1paKw/qUrNmiVLI0IU5iw41rfDtGknrOMWOa1C/6GCTBjk71OzJSZArjRc9zNuo8G+p6spSEDarPaMm3QAsb3ccfw/Qp7NM09khKxDVQDk+x8yducAhgfWz8BL4oXmLfC+VxmGVAlk+LxRmhZQmFczaPDybzPkGPXAh92Tg0zUcQDUvNYUSki6EhXtEzaRmeiZ8ADjHS1grx6t+dZQCZhZRM2Qel/OEeOKza8ZVim71EE8zG5SkCh81q3w4gHh5imHbMeYtdiyu15xqmlyBTucneC+oiZEVTeLObW/Y0DefS/LMKPXbbnLXU1/ndQFuvyZzDtlx0fXnGQ/c886TIm+0EKIXoybPTZT4XC9qAdJEA0MYj7G2sSl6BkQWusqrG/S6vjNRHBw4d7nZroo64JqXms5cAXeweLH7tzSLxMq54oUpYvZy3Bcv17ZC4M23fpTEGyPCs7m1YlIuNXU5tj3wcymbdqjRbACBzWq40prMlJOp13sfqppHKYS3dXVd7qQvV+Udy7oz8/jWnJqq5g19buoh37eRiadUEmQhbqo5r1tzyZTV/+TX9NrVZKa3PZFqqYpSc0kqTgQvG7n5aUD0cCwK0MKpVSo2xyNm0IrVXPAPA+YKu3mEqUui2NERe+r+rpag1KrCZ/phAy9MXzX4uC/yMJkzt6kY0kepJE41MSJsjdfbbVWxpJCTYQVmlEaH1HRkt0P1+UscmryAfk0Jd+eeYzlaSHRCGt01l+7tzBkTUOEl59atSBgmNW/KcDMPhL4NqLM4vRq+yqRxapenHhkCUrLU+/PVVVmjsWu6Z/ofdzK1AHzQLlSo8MSm6NoqFZPJ4nh/WG8BelNqCokA8mnWqxrcOmp6xFqhIJnmsxv+WSYh9TS9gXzZdJJbr1XFE87FtHkITecF2565iGGq/jV9oZd1mOG0a8jD0WJdvSVgyQwprO0cFfdOLsNyC9QseXIK1ubGCvo2qpjRmB7PFXnVg85l2npf98ecoL7oiMFTzD+PCQoUS7n+bb3o4SFqdh8km732VaWrWfNVA3FDfVUE3bc255kpg7c0cjvlmAyxktVQ7wDe3tuhpmxVEap7FHYLYRUqKQA4Au4sPM5mzjvfyFpnLIWvXUNcOq1Oetg355CyPfOZpURrhbdebyhqWfUU0W62OX2dvzeGJqiZa1osxMUOWACo6a340c3GoWDaeP9tsDArzpuXwk/NohOf1Rup2S/DzyKh1u0oghPc0F3ND+eahk9bLvT3M2xNdlBYWi+h7ggIGdDYZIXudUP3y7QdV1MPx2RN8e3rcqZR+/mK8aKoCWSyfIu1qZm+GR84uyigOWqbnheIq4KUNloI6c3ZbGJ2pG/DKNKKLVXcLulBmJiVbI5NXRxktwk0pcqG1Xu5j01Ifei2C02rSbbGfT4bunS3fD2e1OTNzH3tdYN1+dq+hd9/VSY41qWm0KJ3ejyDPnC3ue/FzGzF8hQ/hsVdLmp8NqhT2tNmaXxuvOhEReRjC+GR/i7EZ53qc4jQehXmNkrNorc8cNOx2bfBATTNNQxQuYXSiCBjXg2SfrFvAjW++8ZtA02pnKMHewxNW9dHs2BXKO2hW6K/ZLxRR8yZU8GM7matxz3tcRikFQMa1xECDZXv5crprXcNyEldIwnNUL1v2DHEKtezNhcFdC5pobh2VjUTKrldveZOFBllsaDMbbKubFxRE3p+O0FqBT57xXSm/hHsShuSE9XdOgPJzU0ypq/jEJkIfDffiJJoNzdtLfl3ApCWMOq5aTllQLcLNOXtgbzsYn+ooYlvFTZi13TWgpo0YoSXPYoqiGRX035W3SVNYNMIv6vJc2VePb1SW6MOqPUJyKlV+0JiaR8Rv4IjmmlohswHWOHwNaEqrZAVsyWpOLMzDyGXqzpJDtFqkNv6igDBTKwAqtiib9RismtmfAPZOSEOzquK+B+3aaX1nT3J+1wh/Rb1ZEleR2sGYjxzVWt0Ny1ZCHTbQDMpq4FCWcbogWYFUx+jWV5aZ7W4uo1zbMoSAKubJue81zRfdCjsz1vf4/AYZW15ZefUTLZVcU/90aTkWiztC0ls1mAVPMRNXpRSMR2frRqG240xioWoGJXh5TQdf+xxzRGBa3o13XzOm4msl3A1X1y1c4UCEgl0pHUTWdv1Nzfl4tMRNfsw2Cf7f4prCJ6ZelYPgl9T1fzupnuKJbd55WxdfYwVrDk0G8vVLIpiASfu2ewV+BtSJogZ60qJbUnlVVNsGmEObXCRM5ZNyLennSpa9xqBtUCo5GSEQEODh2a4CifGNTC0URF3MCMcqdkkVKPu3Dm6UxTWbMhDEM+x7pcS6d/CtCa1mXjTmc4wqo0olqDEq+4U5ULMwE3ybsoJ2Nf+q5MrFUUjudX6MBrXeKOHbQciB8B7Z91lOSOmbgdq5qiJkTFn6El4sQkFqolGaDY1huKk7nWpq1vdCpuhpabQOINXenSnk94z2gvRCi1UQ0gKXrqkh+C1gwlO1xexKAXnNGM6gA+lCE2rbdUtrEGhjQ3KHouRtbyGdcufXaCm6Zn/V7c2EBjHPlsz634PMlxgbdIdoK+94rmiM2lO5gZbxMpL4pJij4KzmdsXDGerzt0MTzHcLZcBOVvmGRZWCqe6gcknzZuO3rHVIllYkkJ21gamDG3qXEBviHY8pFXLWEl6ncJcjrQEa6f3xN/ezWcILl6H4qy/8w/6gz3mxHZOWreMhMqxQ3HRTjIHFllzo9DMSWhSOrALEVr3nTEaV+fXFU5Nic1RmlZh0oBBa1NqO/raKzjnYT5TDgSjC0CxxfdNd7PKaNYKyJM2XudukuxFsb9/+/dparVslgcnLEt3RPXDeGHoK7KKjdV1LjRbd24XRUmalLDr7jNY9DxtVEmrs25EubYo2qcnrl27Jm4rHi+/TWqKCWM8+pS1E9+8jsNuq+OlILua8KBhiJPSbDIZFpacLLQ/6d6+xw32WlSpg1AU0XShcNKZI9t8dRyhKOIQLtseFa0sFbPiNnl3hZrETEv2nHpUApqfvtR7QsWDfMSxOzIpOGFadjv4mlg5i6EmCk6ILEF4nc2RJHMaNa31eq+qmjcz0vVMQR02N7EIofv3TXPx4sVElrtdODjXP5R6vJ0qdt55ggWCo4lr30zcTfHq5HhgTbYQ8E5KU1QBlUJ00SG9AJr5ZdY2VkLOZyGIEShdkafIldZaGxJ1ErJ8ssLI6UDpRoSWDzOpV6FvdRrt6+PSjQRZG10DFoh0wHiyrgkl5P3+bTnYPL8xKnQdPSm2EFKzL8l1d2oeaFZb2+4Vger+kVetw6bFwiRh6j+B4dmx619/J3A23kZaU0JTzD2+tlrGcbeBLawhgSeapUfXzR49Qbf28GWRmTZXpkpueFoIV4Q0Q1kKgS7DrNls6ZtyB+hbv4T3kmn6FRbWbtg0eIsTkn4UYmqVYLQ7jPuVgrY7NeG2SH0aMLgqm5X3LT45L5SmQ2Ws7xnU1jp2S5r3ae3BLWG8DpshfeCAIBTf9xVqeNNNbVCTwrOOVFIFNO159NAKasg6qTEnrGaFUdapyIsZLC7ss5GnrkTQpEoojMmH8dGFLyElR/Vphv9nua2mZqleBZh5J4aUmqc1LUto7wI1IT8wagbiscsVfdPBt3kNLbRf4Gh2dDQrENWvVJw+Xy2UXg+ByJOqXFPyx6Emj9H2oBCnDpthvaahRCAfCuhqAnmguf4XW+TTTlxVOtMZBRXUkDWvgiDzuPy8FrbgevUWEoKORr/J5USImslQeg2t1vhW92viDR/uG5cuXfJIf7rkKTU9rXUhDjSKzNwpsBkEH9+DzfAOOexAx4VXzttetXO6dCXDOiiUydGOybU1pSU1LZFSLPYkRGS43U5hpWbVIyVbX9aotXNrL8ox1lJqUKqc2fZCUL+Q8VuuRel9w1kVhwFWN1iKSS33NofmpZBSc4vX2r6mZkhPs9bobzZBYc5tqEdsSj1eMxhnhsSmxbb1IGpH2NCTA8et40ddSArom8fY6RBb14Bx7RJV2vayEKdUV4AWTg8/uWZlY1uNJ0K+ndDpFkjZZnCvEaXquFhVXNv7pGganyVoZkVeU1GzQ2qCOJMuezU8P7bOF2EaWXfGoznYtAPSrlZ1gtzV7V4LZFiW7hscwGc8hnq8Yw5XW7ejSyYfPGL1rny15C1As8J69IwXxUq6C1z9drtHivW+qqTmJWPb1+OFdMHkHsBllkQebLp8Kmp2Sk2NtVrNqkqoWZO7OBX65qWQvR4QTMnoS/X2EGy33JyU0eWxWb0NT/vH2Cd73+8U+pTA39icEK8ceBzGwOft4mrqCRo8kkUdXkXNDURoi2s2n+aayelZTrkcYnMn733Qg3JoYMi/WNz+QRcKreE4YI2mAlMW/HY5pZKigs1pHEj2OKYceid/E4synKSogmZQw1QgY4sVKdDqzSVFwn7h6zo1fS9+e9QUs5IcdHKFDfXN97akIXn7nNpFnLpj6h41tGTvxjjz16c6frsiItfq3q3Og/6gVoDtdAT56BUybp/xUJuoDeSRbQAF9xz+XfxT83SaZTH+l+7Woxi3zzTLwJQ0VJ1cVHG8dDu99YZbA2VZvZblaTcXu325WeJlNTw32n4hkVq9en+uJzxzEvRtXznZhanU60ufYnMATAeqk+JRoXG1upXR5Xc1XvVtqYdPLbU6oqYtJvLZfJCten22mJqNvU5hbXlSqz+s8VnokjL9E6HVa6+WWp0NFxp1NA6Uq7nV1Owfb74UNNXq71I+F3uLa7hkCa3Ky6ilVn/77ZpyuNAlGnii7pxbTk211OpxKZDuV4BUhSdqqdVxNZ1Q61dhQkVNtba/r2nUjYRTnqZaavV31rUmhSDhyqmgqaipVv92bxD0M1NBUy21Oq7p1G4TORhFTbXUIv3XzZ5woJZat1nbGu9aq6pCIEVNtbb7+t/7SP/VaaVXZWhqqaXWZq//H1PW6Z//1kmvAAAAAElFTkSuQmCC' },
  nhat: { n: 3, w: 320, h: 128.0, src: 'data:image/png;base64,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' },
  chem: { n: 4, w: 210, h: 210.0, src: 'data:image/png;base64,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' },
  ribbon: { n: 4, w: 96, h: 157.5, src: 'data:image/png;base64,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' },
  vanish: { n: 3, w: 273, h: 219.0, src: 'data:image/png;base64,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' },
  aura: { n: 3, w: 108, h: 200.0, src: 'data:image/png;base64,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' },
  dust: { n: 4, w: 312, h: 88.0, src: 'data:image/png;base64,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' },
  loc: { n: 4, w: 184, h: 200.0, src: 'data:image/png;base64,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' },
  hit: { n: 3, w: 220, h: 220.0, src: 'data:image/png;base64,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' },
};
for (const k in KK) { const im = new Image(); im.src = KK[k].src; KK[k].img = im; }
// Vẽ khung i của ảnh KK, tâm tại (cx, cy), cỡ w×h; flip = -1 thì lật ngang
function drawKK(name, i, cx, cy, w, h, flip = 1) {
  const s = KK[name], im = s.img;
  if (!im || !im.complete || !im.naturalWidth) return;
  const sx = s.hz ? i * s.w : 0, sy = s.hz ? 0 : i * s.h;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(flip, 1);
  ctx.drawImage(im, sx, sy, s.w, s.h, -w / 2, -h / 2, w, h);
  ctx.restore();
}
// Kiếm khách: đúng model trong game (ảnh gốc mặt quay sang trái nên lật khi chạy sang phải)
const KK_STATES = ['dungyen', 'move1', 'move2', 'move3', 'move4', 'a1', 'a2', 'a3', 'a5'];
const KK_FEET = [208, 203, 205, 213, 205, 205, 200, 212, 198];
function drawKiem(b, charged) {
  if (S.kpose === 'hide') return;
  const sq = b.squash, air = !S.onGround, running = !air && Math.abs(b.vx) > 30;
  const st = S.kpose || (air ? 'move3' : running ? ['move1', 'move2', 'move3', 'move4'][Math.floor(b.run / 1.3) % 4] : 'dungyen');
  const i = Math.max(0, KK_STATES.indexOf(st)), s = KK.body, im = s.img;
  if (!im.complete || !im.naturalWidth) return;
  const k = .36, bob = st === 'dungyen' && Math.floor(S.t * 5) % 2 ? 2 : 0;   // nhịp thở 200ms như trong game
  ctx.save();
  ctx.translate(b.x, b.y + R - 2 + R * sq * .3);
  ctx.scale(-(b.face || 1) * (1 + sq * .4) * k, (1 - sq * .5) * k);
  if (charged) { ctx.shadowColor = '#ffe27a'; ctx.shadowBlur = 30; }
  ctx.drawImage(im, i * s.w, 0, s.w, s.h, -70, -KK_FEET[i] + bob, s.w, s.h);
  ctx.restore();
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
  const ty = clamp(b.y - VIEW_H * .55, -250, 100);
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
  const x = CHECKPOINTS[1].x + 20;
  Object.assign(S.ball, { x, y: f4(x) - 40, vx: 0, vy: 0 });
  S.cp = 1; S.spawn = { x: CHECKPOINTS[1].x, y: f4(CHECKPOINTS[1].x) - 60 };
  S.tipSeen = S.tipSeen.map(() => true);
  S.cam.x = clamp(x - viewW * .4, 0, Math.max(0, LEVEL_W - viewW));
  S.pops.push({ x, y: S.ball.y - 60, t: 1, text: 'Tới đấu trường boss', c: '#fff27a' });
}
if (TEST_MODE) setTimeout(() => showTip('Chế độ thử: vô hạn mạng · phím B tới thẳng đấu trường boss · không lưu điểm. Mở link với #thuong để tắt.'), 300);

fit();
// mốc trên thanh chặng đường
for (const c of CHECKPOINTS) {
  const m = document.createElement('span');
  m.className = 'cp'; m.style.left = (c.x / GOAL.x * 100) + '%';
  $('progTrack').appendChild(m);
}
reset();
requestAnimationFrame(loop);
})();
