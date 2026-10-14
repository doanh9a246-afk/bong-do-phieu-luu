(() => {
/* ---------- Hằng số ---------- */
const VIEW_H = 600;      // chiều cao khung nhìn (đơn vị thế giới)
const PX = 0.3;          // vẽ ở độ phân giải thấp rồi phóng to → hạt pixel to
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
};
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
  if (k === 'web' && on && !keys.web) fireWeb();
  if (k === 'volt' && on && !keys.volt) fireVolt();
  if (k === 'skill' && on && !keys.skill) {
    if (S.boss && S.boss.ts > 0 && !S.tsEsc && !S.dead) escapeTimeStop();
    else activateSkill();
  }
  keys[k] = on;
  if (on && !S.moved) { S.moved = true; setTimeout(() => $('hint').classList.add('gone'), 1500); }
}
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
  KeyK: 'skill', ShiftLeft: 'skill', ShiftRight: 'skill', KeyJ: 'bolt', KeyX: 'bolt', KeyL: 'web', KeyC: 'web', KeyU: 'volt', KeyV: 'volt',
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
  if (!spend(COST.tackle)) return;
  S.power = TACKLE_TIME; S.cd = TACKLE_CD;
  const B = S.boss;
  if (B.cut && B.cut.appear && !B.cut.struck) B.cut.blocked = true;   // chặn cú đánh úp của Naamah
  if (!frozenNow()) S.dash = { dir: S.ball.face || 1, t: TACKLE_DASH };
  sfx('pikachu');
  const b = S.ball;
  for (let i = 0; i < 20; i++) {
    const a = i / 20 * Math.PI * 2;
    S.parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, life: .5, c: i % 2 ? '#ffc21a' : '#ffffff', r: 6, g: 0 });
  }
}
const typing = e => e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
addEventListener('keydown', e => {
  if (typing(e)) return;
  if (e.code === 'KeyR') { reset(); return; }
  if (e.code === 'KeyM') { setMuted(!muted); return; }
  const k = KEYMAP[e.code];
  if (k) { e.preventDefault(); if (!e.repeat) setKey(k, true); }
});
addEventListener('keyup', e => { if (typing(e)) return; const k = KEYMAP[e.code]; if (k) { e.preventDefault(); setKey(k, false); } });
addEventListener('blur', () => { keys.left = keys.right = keys.jump = keys.skill = keys.bolt = keys.web = keys.volt = false; S.charging = false; });
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
  const input = S.dash ? 0 : (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  // Khựng: đổi hướng thì phanh mạnh, nhả phím thì dừng nhanh. Trên vũng băng thì trơn trượt.
  const slick = S.slick && S.onGround;
  const turning = input && Math.sign(b.vx) === -input;
  const accel = (S.onGround ? 1150 : 800) * (turning ? 2.6 : 1) * (slick ? .4 : 1);
  if (S.dash) { b.vx = S.dash.dir * TACKLE_SPEED; b.vy = Math.min(b.vy, 0); }
  else if (input) b.vx += input * accel * h;
  else b.vx *= 1 - (S.onGround ? (slick ? .5 : 10) : 2) * h;
  if (!input && !slick && S.onGround && Math.abs(b.vx) < 12) b.vx = 0;
  b.vx = clamp(b.vx, -(S.dash ? TACKLE_SPEED : MAXV), S.dash ? TACKLE_SPEED : MAXV);
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
  S.dead = .9; S.deaths++; S.lives--;
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
  S.power = 0; S.dash = null; S.charging = false;
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
  if (!frozen) gainEnergy((3 + (S.onGround && Math.abs(b.vx) > 150 ? 4 : 0)) * dt);
  const inDir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (inDir) S.lastDir = inDir;
  if (!frozen) {
    S.lastGround += dt;
    S.jumpBuf -= dt;
    if (S.jumpBuf > 0 && S.lastGround < .1) { b.vy = -JUMP; S.jumpBuf = 0; S.lastGround = 1; sfx('pika'); }
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
      if (S.power) {
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
    if (!s.got && Math.hypot(s.x - b.x, s.y - b.y) < R + 16) { s.got = true; s.pop = .3; hud(); sfx('star'); gainEnergy(15); }
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
  TIPS.forEach((tp, i) => { if (!S.tipSeen[i] && b.x > tp.x - 220) { S.tipSeen[i] = true; showTip(tp.text); } });
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
    S.pops.push({ x: S.ball.x, y: S.ball.y - 50, t: .7, text: `Thiếu điện (${Math.floor(S.energy)}/${cost})`, c: '#fff27a' });
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
  if (S.chargeT < BALL_HOLD) fireShock(); else fireElectroBall(S.chargeT);
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
  if (S.energy < COST.volt) {
    S.pops.push({ x: S.ball.x, y: S.ball.y - 50, t: .8, text: `100.000 Vôn cần đầy điện (${Math.floor(S.energy)}/100)`, c: '#fff27a' });
    sfx('deny');
    return;
  }
  S.energy = 0;
  S.voltFx = .9; S.flash = .9; S.cast = .6;
  sfx('volt');
  const x0 = S.cam.x - 40, x1 = S.cam.x + viewW + 40;
  S.voltStrikes = Array.from({ length: 7 }, (_, i) => x0 + (i + .5) * (x1 - x0) / 7 + (Math.random() - .5) * 60);
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
    if (u.x > x0 && u.x < x1) { damageBoss(u, 5, 'volt'); if (!B.dead && !B.cut && !B.fuse) { B.stun = Math.max(B.stun, 1.5); B.act = null; } }
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
    if ((u = bossUnitAt(q.x, q.y, 4))) { damageBoss(u, 1, 'shock'); boltSpark(q.x, q.y); q.life = 0; }
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
      S.pops.push({ x: u.x, y: u.y - BOSS_H - 20, t: .8, text: 'Dính lưới!', c: '#fff27a' });
    }
  }
  S.webs = S.webs.filter(w => w.life > 0);
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
    if (S.power) { killFlyer(f); continue; }
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
  if (B.phase === 4) return kind === 'volt' || S.power > 0 || B.exhaust > 0;
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
  let dmg = base * (tired ? 2 : 1);
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
    cutBanner(safeNow ? 'Đã Lao điện: sẽ chặn được đòn!'
      : S.energy < COST.tackle ? `Không đủ điện năng (${Math.floor(S.energy)}/${COST.tackle}): không thể chặn!`
      : S.cd > 0 ? 'Lao điện đang hồi…'
      : 'Naamah sau lưng! Nhấn Shift (Lao điện) để chặn!', !safeNow);
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
  $(k + 'Name').value = lsGet(NAME_KEY, '');
  $(k + 'Save').disabled = false;
  $(k + 'Sent').hidden = true;
  ($(k + 'Name').value ? $(k + 'Save') : $(k + 'Name')).focus();
}
async function submitScore(k) {
  if (S.submitted) return;
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
  $('lives').textContent = '♥'.repeat(Math.max(0, S.lives)) + '♡'.repeat(Math.max(0, LIVES - S.lives));
  $('time').textContent = fmt(Math.ceil(TIME_LIMIT - S.time));
}

/* ---------- Vẽ ---------- */
const CLOUDS = Array.from({ length: 9 }, (_, i) => ({ x: i * 520 + (i * 137) % 200, y: 60 + (i * 71) % 140, s: .7 + (i * 37 % 50) / 100 }));
function drawBackground() {
  const cam = S.cam;
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#4aa8f0'); g.addColorStop(1, '#a9e2ff');
  ctx.fillStyle = g; ctx.fillRect(0, 0, viewW, VIEW_H);
  // mây (thị sai 0.2)
  ctx.fillStyle = '#ffffff';
  for (const c of CLOUDS) {
    const x = ((c.x - cam.x * .2) % 4700 + 4700) % 4700 - 200, y = c.y - cam.y * .1;
    if (x > viewW + 200) continue;
    ctx.beginPath();
    ctx.arc(x, y, 26 * c.s, 0, Math.PI * 2);
    ctx.arc(x + 30 * c.s, y - 14 * c.s, 32 * c.s, 0, Math.PI * 2);
    ctx.arc(x + 64 * c.s, y, 24 * c.s, 0, Math.PI * 2);
    ctx.fillRect(x, y, 64 * c.s, 24 * c.s);
    ctx.fill();
  }
  // đồi xa (thị sai 0.4)
  ctx.fillStyle = '#7fd3a8';
  ctx.beginPath(); ctx.moveTo(0, VIEW_H);
  for (let sx = 0; sx <= viewW + 20; sx += 20) {
    const wx = sx + cam.x * .4;
    ctx.lineTo(sx, 400 - cam.y * .3 - 60 * Math.sin(wx / 230) ** 2 - 30 * Math.sin(wx / 97 + 1) ** 2);
  }
  ctx.lineTo(viewW, VIEW_H); ctx.fill();
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
  for (const o of S.orbs) drawOrb(o.x, o.y, o.r);
  for (const w of S.webs) drawNet(w.x, w.y, w.r);
}
// Quả cầu điện đang nạp trên tay Pikachu
function drawCharge() {
  if (!S.charging || S.chargeT < BALL_HOLD || S.dead) return;
  const b = S.ball, k = clamp((S.chargeT - BALL_HOLD) / (BALL_FULL - BALL_HOLD), 0, 1);
  drawOrb(b.x + (b.face || 1) * 26, b.y - 16, 6 + k * 12);
  if (k >= 1 && Math.floor(S.t * 10) % 2) {
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(b.x + (b.face || 1) * 26, b.y - 16, 26, 0, Math.PI * 2); ctx.stroke();
  }
}
// 100.000 Vôn: các tia sét giáng từ trời xuống
function drawVolt() {
  if (S.voltFx <= 0) return;
  ctx.globalAlpha = clamp(S.voltFx / .5, 0, 1);
  for (const [i, x] of S.voltStrikes.entries()) {
    const gy = groundYAt(x) ?? S.cam.y + VIEW_H;
    const pts = [];
    for (let y = S.cam.y - 20, k = 0; y < gy; y += 40, k++) pts.push([x + Math.sin(i * 3.1 + k * 1.7 + S.t * 30) * 18, y]);
    pts.push([x, gy]);
    for (const [w, c] of [[16, 'rgb(255 242 122 / .35)'], [7, '#fff27a'], [3, '#ffffff']]) {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineJoin = 'round';
      ctx.beginPath(); pts.forEach(([px, py], j) => j ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.stroke();
    }
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
      ctx.globalAlpha = .3 / i; ctx.fillStyle = '#fff27a';
      ctx.beginPath(); ctx.arc(b.x - S.dash.dir * i * 16, b.y - 10, R, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  drawPikachu(b, pw && !blink);
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
  ctx.imageSmoothingEnabled = false;
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
  cv.width = Math.round(viewW * PX);
  cv.height = Math.round(VIEW_H * PX);
}
addEventListener('resize', fit);

let last = performance.now();
function loop(now) {
  const dt = Math.min(.033, (now - last) / 1000); last = now;
  update(dt);
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
    $('skillBtn').disabled = en < COST.tackle;
    $('voltBtn').disabled = en < COST.volt;
  }
  requestAnimationFrame(loop);
}

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
