(() => {
/* ---------- Hằng số ---------- */
const VIEW_H = 600;      // chiều cao khung nhìn (đơn vị thế giới)
const PX = 0.3;          // vẽ ở độ phân giải thấp rồi phóng to → hạt pixel to
const R = 22;            // bán kính bóng
const G = 1900, JUMP = 760, MAXV = 320;
const SKILL_TIME = 2, SKILL_CD = 8;   // tuyệt kĩ vô địch: 2 giây, hồi 8 giây
const LEVEL_W = 7000, DEATH_Y = 900;
const LIVES = 3;
// Đấu trường boss ở cuối màn
const ARENA = { l: 6220, r: 6950, gateX: 6190, floor: 420 };
const BOSS_W = 64, BOSS_H = 112, CLOCK_R = 105, WARN = .7;
const PHASES = [null,
  { speed: 55, cycle: 0, dur: 0,   shots: 0, gap: 0,   bspeed: 0,   name: 'Giai đoạn 1', note: 'Nhảy giẫm lên đầu Kurumi 3 lần. Chạm phía trước hay phía sau đều mất mạng.' },
  { speed: 55, cycle: 5, dur: 1.4, shots: 3, gap: .3,  bspeed: 380, name: 'Giai đoạn 2', note: 'Cứ 5 giây Kurumi triệu hồi đồng hồ quanh người và bắn đạn thẳng: tránh xa đồng hồ, nhảy qua đạn.' },
  { speed: 85, cycle: 3, dur: 1.3, shots: 4, gap: .25, bspeed: 480, name: 'Giai đoạn 3', note: 'Kurumi chạy nhanh hơn, triệu hồi đồng hồ và bắn mỗi 3 giây. Giẫm thêm 3 lần nữa!' },
];

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
];
const FLOWERS = [[180, f1, 1], [760, f1, .8], [1700, f2, 1.1], [2470, f2, .9], [3460, f3, 1], [4300, f3, .9], [4700, f4, 1.1], [5800, f4, .8]];
const SIGNS = [[300, f1], [1330, f1], [4370, f3]];
const CHECKPOINTS = [{ x: 3420, f: f3 }, { x: 6080, f: f4 }];
const GOAL = { x: 6880, f: f4 };

/* ---------- Trạng thái ---------- */
const S = {};
function reset() {
  Object.assign(S, {
    ball: { x: 120, y: 440, vx: 0, vy: 0, rot: 0, squash: 0 },
    spawn: { x: 120, y: 440 },
    cam: { x: 0, y: 0 },
    onGround: false, lastGround: 0, jumpBuf: 0, jumpHeld: false,
    stars: STAR_POS.map(([x, y]) => ({ x, y, got: false })),
    enemies: ENEMY_DEF.map(e => ({ ...e, x: (e.min + e.max) / 2, dir: 1, alive: true, squash: 0 })),
    power: 0, cd: 0, cp: -1, dead: 0, deaths: 0, time: 0, won: false, lost: false, parts: [], t: 0, moved: false,
    lives: LIVES, fight: false, gateClosed: false, safe: 0,
    boss: { x: 6750, dir: -1, hits: 0, phase: 1, inv: 0, fireT: 0, fire: 0, warn: false, dead: false, squash: 0, shot: 0, flash: 0 },
    bullets: [],
  });
  $('win').hidden = true;
  $('lose').hidden = true;
  $('bossbar').hidden = true;
  $('hint').classList.remove('gone');
  hud();
}

/* ---------- Điều khiển ---------- */
const keys = { left: false, right: false, jump: false };
function setKey(k, on) {
  if (k === 'jump' && on && !keys.jump) S.jumpBuf = .14;
  if (k === 'skill' && on && !keys.skill) activateSkill();
  keys[k] = on;
  if (on && !S.moved) { S.moved = true; setTimeout(() => $('hint').classList.add('gone'), 1500); }
}
const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyK: 'skill', ShiftLeft: 'skill', ShiftRight: 'skill' };
function activateSkill() {
  if (S.dead || S.won || S.cd > 0) return;
  S.power = SKILL_TIME; S.cd = SKILL_CD;
  const b = S.ball;
  for (let i = 0; i < 20; i++) {
    const a = i / 20 * Math.PI * 2;
    S.parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, life: .5, c: i % 2 ? '#ffc21a' : '#ffffff', r: 6, g: 0 });
  }
}
addEventListener('keydown', e => {
  if (e.code === 'KeyR') { reset(); return; }
  const k = KEYMAP[e.code];
  if (k) { e.preventDefault(); if (!e.repeat) setKey(k, true); }
});
addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) { e.preventDefault(); setKey(k, false); } });
addEventListener('blur', () => { keys.left = keys.right = keys.jump = keys.skill = false; });
document.querySelectorAll('[data-key]').forEach(b => {
  const k = b.dataset.key;
  b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); b.classList.add('on'); setKey(k, true); });
  const up = () => { b.classList.remove('on'); setKey(k, false); };
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
});
$('restart').addEventListener('click', e => { reset(); e.currentTarget.blur(); });
$('again').addEventListener('click', reset);
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
  const input = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  // Khựng: đổi hướng thì phanh mạnh, nhả phím thì dừng nhanh
  const turning = input && Math.sign(b.vx) === -input;
  const accel = (S.onGround ? 1150 : 800) * (turning ? 2.6 : 1);
  if (input) b.vx += input * accel * h;
  else b.vx *= 1 - (S.onGround ? 10 : 2) * h;
  if (!input && S.onGround && Math.abs(b.vx) < 12) b.vx = 0;
  b.vx = clamp(b.vx, -MAXV, MAXV);
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
  const b = S.ball;
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2, sp = 120 + Math.random() * 320;
    S.parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 200, life: .9, c: i % 3 ? '#e3262b' : '#ffffff', r: 4 + Math.random() * 5 });
  }
  hud();
}
function respawn() {
  Object.assign(S.ball, { x: S.spawn.x, y: S.spawn.y, vx: 0, vy: 0, squash: 0 });
  S.power = 0;
  const B = S.boss;
  if (!B.dead && S.fight) {
    // Ngã khi đang đánh boss: hồi sinh ngay trong cổng, trận đấu tiếp tục.
    // Kurumi lùi về cuối đấu trường, giữ số đòn đã trúng; bóng được bảo vệ 1.5 giây.
    Object.assign(S.ball, { x: ARENA.l + 50, y: ARENA.floor - 60 });
    Object.assign(B, { x: ARENA.r - 140, dir: -1, inv: 0, fireT: 0, fire: 0, warn: false, shot: 0 });
    S.bullets = [];
    S.safe = 1.5;
  }
  bossBar();
  S.cam.x = clamp(S.ball.x - viewW * .4, 0, Math.max(0, LEVEL_W - viewW));
}

function update(dt) {
  S.t += dt;
  for (const p of S.parts) { p.vy += (p.g ?? 1200) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
  S.parts = S.parts.filter(p => p.life > 0);
  for (const s of S.stars) if (s.got && s.pop > 0) s.pop -= dt;

  for (const e of S.enemies) {
    if (!e.alive) { e.squash = Math.max(0, e.squash - dt); continue; }
    e.x += e.dir * 70 * dt;
    if (e.x > e.max) { e.x = e.max; e.dir = -1; }
    if (e.x < e.min) { e.x = e.min; e.dir = 1; }
  }

  if (S.won || S.lost) return;
  updateBoss(dt);
  if (S.dead) {
    S.dead -= dt;
    if (S.dead <= 0) { S.dead = 0; if (S.lives <= 0) lose(); else respawn(); }
    return;
  }
  S.time += dt;
  S.power = Math.max(0, S.power - dt);
  S.cd = Math.max(0, S.cd - dt);
  S.safe = Math.max(0, S.safe - dt);
  const b = S.ball;

  S.lastGround += dt;
  S.jumpBuf -= dt;
  if (S.jumpBuf > 0 && S.lastGround < .1) { b.vy = -JUMP; S.jumpBuf = 0; S.lastGround = 1; }
  if (!keys.jump && b.vy < -320) b.vy = -320;   // nhả sớm → nhảy thấp

  const steps = 4;
  for (let i = 0; i < steps; i++) step(dt / steps);
  b.rot += b.vx * dt / R;
  b.squash = Math.max(0, b.squash - dt * 1.6);

  if (b.y > DEATH_Y) die();
  if (!S.power) {
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
        e.alive = false; e.squash = 0;
        for (let i = 0; i < 18; i++) {
          const a = Math.random() * Math.PI * 2, sp = 150 + Math.random() * 250;
          S.parts.push({ x: e.x, y: ey, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 150, life: .8, c: i % 3 ? '#16181d' : '#ffc21a', r: 5 + Math.random() * 5 });
        }
      }
      else if (b.vy > 0 && b.y < ey - 12) { e.alive = false; e.squash = .4; b.vy = -560; }
      else die();
    }
  }
  for (const s of S.stars) {
    if (!s.got && Math.hypot(s.x - b.x, s.y - b.y) < R + 16) { s.got = true; s.pop = .3; hud(); }
  }
  CHECKPOINTS.forEach((c, i) => {
    if (i > S.cp && b.x > c.x) { S.cp = i; S.spawn = { x: c.x, y: c.f(c.x) - 60 }; }
  });
  if (S.boss.dead && b.x > GOAL.x - 10) win();
}

/* ---------- Boss ---------- */
function bossBar() {
  const B = S.boss;
  $('bossbar').hidden = !(S.fight || B.dead);
  $('bphase').textContent = B.dead ? 'Đã hạ!' : `${PHASES[B.phase].name}/3`;
  $('bnote').textContent = B.dead ? 'Lăn tới cờ đích để về đích.' : PHASES[B.phase].note;
  document.querySelectorAll('#bossbar .pips i').forEach((p, i) => p.classList.toggle('on', !B.dead && i < 3 - B.hits));
}
// Đồng hồ Zafkiel: to dần khi xuất hiện, thu lại khi sắp tắt
function clockScale(B) {
  const P = PHASES[B.phase];
  return Math.min(1, (P.dur - B.fire) / .25, B.fire / .15);
}
function shoot(B, P) {
  S.bullets.push({ x: B.x + B.dir * (BOSS_W / 2 + 22), y: ARENA.floor - 24, vx: B.dir * P.bspeed });
  B.flash = .08;
}
function updateBoss(dt) {
  const B = S.boss, b = S.ball;
  for (const u of S.bullets) u.x += u.vx * dt;
  S.bullets = S.bullets.filter(u => u.x > ARENA.gateX && u.x < ARENA.r);
  if (B.dead) return;
  B.squash = Math.max(0, B.squash - dt);
  B.flash = Math.max(0, B.flash - dt);
  if (!S.fight) {
    if (!S.dead && b.x > ARENA.l + 30) { S.fight = true; S.gateClosed = true; B.fireT = 0; bossBar(); }
    return;
  }
  const P = PHASES[B.phase];
  B.inv = Math.max(0, B.inv - dt);
  if (P.cycle) {
    if (B.fire > 0) {
      const el = P.dur - B.fire;
      while (B.shot < P.shots && el >= .15 + B.shot * P.gap) { shoot(B, P); B.shot++; }
      B.fire -= dt; if (B.fire <= 0) { B.fire = 0; B.fireT = 0; }
    } else { B.fireT += dt; if (B.fireT >= P.cycle) { B.fire = P.dur; B.shot = 0; } }
  }
  const wasWarn = B.warn;
  B.warn = !!P.cycle && !B.fire && B.fireT > P.cycle - WARN;
  if (B.warn && !wasWarn && !S.dead) B.dir = Math.sign(b.x - B.x) || B.dir;   // quay về phía bóng rồi mới bắn
  if (!B.fire && !B.warn) {
    B.x += B.dir * P.speed * dt;
    const lo = ARENA.l + BOSS_W / 2 + 40, hi = ARENA.r - BOSS_W / 2 - 10;
    if (B.x > hi) { B.x = hi; B.dir = -1; }
    if (B.x < lo) { B.x = lo; B.dir = 1; }
  }
  if (S.dead) return;

  // Đạn
  for (const u of S.bullets) {
    if (Math.hypot(u.x - b.x, u.y - b.y) < R + 5) {
      if (S.power || S.safe) { u.x = -1e9; continue; }
      die(); return;
    }
  }
  // Đồng hồ quanh người
  const gy = ARENA.floor, top = gy - BOSS_H, cx = B.x;
  if (B.fire && !S.power && !S.safe && Math.hypot(b.x - cx, b.y - (gy - 56)) < CLOCK_R * clockScale(B) + R * .3) { die(); return; }
  const nx = clamp(b.x, cx - BOSS_W / 2, cx + BOSS_W / 2), ny = clamp(b.y, top, gy);
  if ((b.x - nx) ** 2 + (b.y - ny) ** 2 >= R * R) return;
  // Giẫm từ trên xuống: cách duy nhất để gây sát thương
  if (b.vy > 0 && b.y < top + 10) {
    b.y = top - R; b.vy = -700; b.squash = .25;
    b.vx = (Math.sign(b.x - cx) || -B.dir) * 280;   // văng sang bên, không giẫm liên tục được
    if (!B.inv && (!B.fire || S.power)) hitBoss();
    return;
  }
  // Chạm phía trước hoặc phía sau
  const side = Math.sign(b.x - cx) || 1;
  if (S.power || S.safe || B.inv) { b.x = cx + side * (BOSS_W / 2 + R + 1); b.vx = side * 380; b.vy = -320; return; }
  die();
}
function hitBoss() {
  const B = S.boss;
  B.hits++; B.inv = 1; B.squash = .3;
  const top = ARENA.floor - BOSS_H, cy = ARENA.floor - BOSS_H / 2;
  for (let i = 0; i < 20; i++) {
    const a = -Math.PI * Math.random(), sp = 150 + Math.random() * 250;
    S.parts.push({ x: B.x, y: top, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: .7, c: i % 2 ? '#ffc21a' : '#ffffff', r: 5 + Math.random() * 4 });
  }
  if (B.hits >= 3) {
    if (B.phase === 3) {
      B.dead = true; S.gateClosed = false; S.bullets = [];
      for (let i = 0; i < 70; i++) {
        const a = Math.random() * Math.PI * 2, sp = 100 + Math.random() * 500;
        S.parts.push({ x: B.x, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 250, life: 1.2, c: ['#16101a', '#c0182b', '#ffc21a', '#ffffff'][i % 4], r: 5 + Math.random() * 8 });
      }
    } else {
      B.phase++; B.hits = 0; B.fireT = 0; B.fire = 0; B.shot = 0; B.inv = 1.6;
      for (let i = 0; i < 30; i++) {
        const a = i / 30 * Math.PI * 2;
        S.parts.push({ x: B.x, y: cy, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320, life: .6, c: i % 2 ? '#ffc21a' : '#5a1f6e', r: 7, g: 0 });
      }
    }
  }
  bossBar();
}
function lose() {
  S.lost = true;
  $('loseProg').textContent = `Bạn đã đi được ${Math.round(progress() * 100)}% chặng đường`;
  $('lose').hidden = false;
  $('again2').focus();
}
const progress = () => clamp(S.ball.x / GOAL.x, 0, 1);
function win() {
  S.won = true;
  const got = S.stars.filter(s => s.got).length;
  $('winStars').textContent = `Sao: ${got}/${S.stars.length}`;
  $('winTime').textContent = `Thời gian: ${fmt(S.time)}`;
  $('winDeaths').textContent = `Mạng còn lại: ${S.lives}/${LIVES}`;
  $('win').hidden = false;
  $('again').focus();
}
const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
let lastSec = -1, lastSkill = '';
function hud() {
  $('stars').textContent = `${S.stars.filter(s => s.got).length}/${S.stars.length}`;
  $('lives').textContent = '♥'.repeat(Math.max(0, S.lives)) + '♡'.repeat(LIVES - Math.max(0, S.lives));
  $('time').textContent = fmt(S.time);
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
function drawClock(cx, cy, r, alpha) {
  if (r < 20) return;   // vòng trong có bán kính r - 10: arc() âm sẽ ném lỗi
  ctx.save(); ctx.translate(cx, cy); ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgb(30 10 40 / .45)';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffc21a'; ctx.lineWidth = 8; ctx.stroke();
  ctx.strokeStyle = '#7a4a1e'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, r - 10, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#ffc21a';
  for (let i = 0; i < 12; i++) {
    ctx.save(); ctx.rotate(i * Math.PI / 6);
    ctx.fillRect(-3, -r + 14, 6, i % 3 ? 10 : 18);
    ctx.restore();
  }
  // kim quay ngược
  ctx.lineCap = 'round';
  ctx.save(); ctx.rotate(-S.t * 4); ctx.strokeStyle = '#ffc21a'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r * .5); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.rotate(-S.t * 11); ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r * .75); ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#ffc21a'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
// Chibi Kurumi (fan art vẽ bằng hình khối). Gốc toạ độ ở chân, +x là hướng mặt.
function drawKurumi(B, x, gy) {
  const walking = S.fight && !B.fire && !B.warn;
  const bob = walking ? Math.abs(Math.sin(S.t * 8)) * 3 : 0;
  const step = walking ? Math.sin(S.t * 8) * 4 : 0;
  const HAIR = '#1a1020', RED = '#c0182b', BLK = '#16101a', SKIN = '#ffe3d3', GOLD = '#ffc21a';
  ctx.save();
  ctx.translate(x, gy);
  // bóng tối dưới chân
  ctx.fillStyle = 'rgb(60 15 70 / .5)';
  ctx.beginPath(); ctx.ellipse(0, -1, 44 + Math.sin(S.t * 3) * 4, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.scale(B.dir * (1 + B.squash * .6), 1 - B.squash);
  if (B.inv > 0 && Math.floor(S.t * 20) % 2) ctx.globalAlpha = .4;

  // chân + giày đỏ
  ctx.fillStyle = BLK;
  ctx.fillRect(-12 + step, -20, 9, 16); ctx.fillRect(4 - step, -20, 9, 16);
  ctx.fillStyle = RED;
  ctx.fillRect(-14 + step, -6, 12, 6); ctx.fillRect(3 - step, -6, 13, 6);

  ctx.translate(0, -bob);
  // bím tóc sau (dài) và trước (ngắn hơn) — kiểu tóc lệch
  ctx.fillStyle = HAIR;
  ctx.save(); ctx.translate(-30, -70); ctx.rotate(.25 + Math.sin(S.t * 4) * .06);
  ctx.beginPath(); ctx.ellipse(0, 22, 11, 32, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(26, -78); ctx.rotate(-.2 + Math.sin(S.t * 4 + 1) * .06);
  ctx.beginPath(); ctx.ellipse(0, 16, 9, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();

  // váy chuông đỏ, viền đăng ten đen
  ctx.fillStyle = RED;
  ctx.beginPath(); ctx.moveTo(-13, -50); ctx.lineTo(13, -50);
  ctx.quadraticCurveTo(26, -36, 31, -20); ctx.lineTo(-31, -20);
  ctx.quadraticCurveTo(-26, -36, -13, -50); ctx.fill();
  ctx.fillStyle = BLK;
  for (let fx = -28; fx <= 28; fx += 9.3) { ctx.beginPath(); ctx.arc(fx, -20, 6, 0, Math.PI); ctx.fill(); }
  ctx.fillRect(-5, -48, 10, 28);
  ctx.fillStyle = '#ffffff';
  for (let fx = -26; fx <= 26; fx += 9.3) ctx.fillRect(fx, -17, 2, 2);
  // thân áo đen + nơ đỏ
  ctx.fillStyle = BLK; ctx.fillRect(-12, -64, 24, 16);
  ctx.fillStyle = RED;
  ctx.beginPath(); ctx.moveTo(0, -59); ctx.lineTo(-7, -64); ctx.lineTo(-7, -54); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -59); ctx.lineTo(7, -64); ctx.lineTo(7, -54); ctx.closePath(); ctx.fill();

  // tay cầm súng kíp
  const aim = B.fire || B.warn;
  ctx.save(); ctx.translate(9, -58); ctx.rotate(aim ? .05 : .95);
  ctx.fillStyle = BLK; ctx.fillRect(0, -3, 15, 7);
  ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(16, 0, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a4a1e'; ctx.fillRect(13, -1, 5, 10);
  ctx.fillStyle = '#3a3f4a'; ctx.fillRect(15, -6, 24, 6);
  ctx.fillStyle = GOLD; ctx.fillRect(20, -7, 8, 2); ctx.fillRect(36, -7, 3, 8);
  if (B.flash > 0) {
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.moveTo(40, -3); ctx.lineTo(54, -10); ctx.lineTo(50, -3); ctx.lineTo(56, 4); ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  // đầu chibi
  const hy = -88;
  ctx.fillStyle = SKIN; ctx.strokeStyle = '#2a1a20'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, hy, 25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // tóc: chỏm, mái răng cưa, tóc mai
  ctx.fillStyle = HAIR;
  ctx.beginPath(); ctx.arc(0, hy - 2, 27, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-27, hy - 2);
  for (let i = 0; i <= 8; i++) ctx.lineTo(-27 + i * 6.75, hy + (i % 2 ? 10 : -2));
  ctx.lineTo(27, hy - 2); ctx.fill();
  ctx.fillRect(-27, hy - 4, 7, 26); ctx.fillRect(21, hy - 4, 6, 20);
  ctx.fillStyle = '#3a2440'; ctx.fillRect(-14, hy - 24, 12, 3);
  // băng đô lolita đỏ đen
  ctx.fillStyle = RED; ctx.fillRect(-20, hy - 30, 40, 7);
  ctx.fillStyle = BLK;
  for (let i = -18; i <= 18; i += 9) { ctx.beginPath(); ctx.arc(i, hy - 30, 4.5, Math.PI, 0); ctx.fill(); }
  // mắt phải đỏ, mắt trái là mặt đồng hồ vàng
  ctx.fillStyle = '#e3262b';
  ctx.beginPath(); ctx.ellipse(1, hy + 2, 4, 5.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, hy - 1, 2, 2);
  ctx.fillStyle = GOLD;
  ctx.beginPath(); ctx.arc(15, hy + 2, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#5a3416'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(15, hy + 2); ctx.lineTo(15, hy - 2);
  ctx.moveTo(15, hy + 2); ctx.lineTo(15 + Math.cos(-S.t * 3) * 3.5, hy + 2 + Math.sin(-S.t * 3) * 3.5); ctx.stroke();
  if (B.warn && Math.floor(S.t * 14) % 2) {
    ctx.strokeStyle = GOLD; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(15, hy + 2, 8, 0, Math.PI * 2); ctx.stroke();
  }
  // má hồng + miệng
  ctx.fillStyle = 'rgb(255 120 140 / .55)';
  ctx.beginPath(); ctx.ellipse(-5, hy + 11, 4, 2.5, 0, 0, Math.PI * 2); ctx.ellipse(21, hy + 11, 3.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#7a1a2a'; ctx.lineWidth = 2;
  ctx.beginPath();
  if (B.phase === 3 || aim) ctx.arc(9, hy + 11, 4, .1, Math.PI - .1);
  else ctx.arc(9, hy + 10, 3, .3, Math.PI - .3);
  ctx.stroke();
  ctx.restore();
}
function drawBoss() {
  const B = S.boss;
  if (B.dead) return;
  const gy = ARENA.floor, P = PHASES[B.phase];
  const x = B.x + (B.warn ? Math.sin(S.t * 70) * 2 : 0);
  const cy = gy - 56;
  if (B.warn) {
    ctx.save();
    ctx.setLineDash([10, 10]); ctx.lineDashOffset = -S.t * 60;
    ctx.strokeStyle = Math.floor(S.t * 14) % 2 ? '#ffc21a' : '#ffe9a8'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x, cy, CLOCK_R, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  if (B.fire) drawClock(x, cy, CLOCK_R * clockScale(B), 1);
  drawKurumi(B, x, gy);
  // mũi tên chỉ chỗ giẫm
  if (!B.fire && !B.inv && S.fight) {
    const ay = gy - BOSS_H - 30 + Math.sin(S.t * 6) * 6;
    ctx.fillStyle = '#ffc21a'; ctx.strokeStyle = '#14301c'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 12, ay - 10); ctx.lineTo(x + 12, ay - 10); ctx.lineTo(x, ay + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
}
function drawBullets() {
  for (const u of S.bullets) {
    const d = Math.sign(u.vx);
    ctx.fillStyle = 'rgb(255 210 63 / .35)'; ctx.fillRect(u.x - d * 40, u.y - 2, d * 30, 4);
    ctx.fillStyle = '#2b2b33'; ctx.fillRect(u.x - 9, u.y - 4, 18, 8);
    ctx.fillStyle = '#ffc21a'; ctx.beginPath(); ctx.arc(u.x + d * 9, u.y, 4, 0, Math.PI * 2); ctx.fill();
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
  ctx.save();
  ctx.translate(b.x, b.y + R * sq * .6);
  ctx.scale(1 + sq * .5, 1 - sq * .6);
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fillStyle = pw && !blink ? '#ffb000' : '#e3262b'; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = pw && !blink ? '#e07800' : '#b5161b';
  ctx.beginPath(); ctx.arc(6, 8, R, 0, Math.PI * 2); ctx.arc(-4, -4, R, 0, Math.PI * 2, true); ctx.fill('evenodd');
  // vệt xoay để thấy bóng lăn
  ctx.rotate(b.rot);
  ctx.fillStyle = 'rgb(255 255 255 / .12)';
  ctx.fillRect(-R, -3, R * 2, 6);
  ctx.restore();
  ctx.lineWidth = 3.5; ctx.strokeStyle = '#14141a';
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(-8, -10, 6, 4, -.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgb(255 255 255 / .5)';
  ctx.beginPath(); ctx.arc(-14, -2, 2, 0, Math.PI * 2); ctx.fill();
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
  CHECKPOINTS.forEach((c, i) => drawFlag(c.x, c.f(c.x), S.cp >= i ? '#4fcf2e' : '#c9d1db', false));
  if (S.boss.dead) drawFlag(GOAL.x, GOAL.f(GOAL.x), '#e3262b', true);
  drawSolids(x0, x1);
  drawGate();
  drawSpikes();
  drawStars();
  drawEnemies();
  drawBoss();
  drawBullets();
  drawBall();
  drawParts();
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
  if (sec !== lastSec) { lastSec = sec; $('time').textContent = fmt(S.time); }
  const pct = (progress() * 100).toFixed(1) + '%';
  $('progFill').style.width = pct; $('progMe').style.left = pct;
  const sk = S.power > 0 ? `Vô địch ${S.power.toFixed(1)}s` : S.cd > 0 ? `Hồi ${Math.ceil(S.cd)}s` : 'Vô địch: K';
  if (sk !== lastSkill) {
    lastSkill = sk;
    $('skill').textContent = sk;
    $('skillChip').dataset.state = S.power > 0 ? 'on' : S.cd > 0 ? 'cd' : 'ready';
    $('skillBtn').disabled = S.cd > 0 && !S.power;
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
