(() => {
/* ---------- Hằng số ---------- */
const VIEW_H = 600;      // chiều cao khung nhìn (đơn vị thế giới)
const PX = 0.3;          // vẽ ở độ phân giải thấp rồi phóng to → hạt pixel to
const R = 22;            // bán kính bóng
const G = 1900, JUMP = 760, MAXV = 320;
const SKILL_TIME = 2, SKILL_CD = 10;  // tuyệt kĩ vô địch: 2 giây, hồi 10 giây
const TIME_LIMIT = 120;               // phải về đích trong 2 phút
// Hell mode (từ giai đoạn 2): ngưng đọng thời gian mỗi 5 giây, laze 1 giây trước khi kết thúc
const TS_EVERY = 5, TS_DUR = 3.5, LASER_AT = 1, LASER_DUR = .35, LASER_CHARGE = .8, LASER_H = 56;
const LEVEL_W = 7000, DEATH_Y = 900;
const LIVES = 3;
// Đấu trường boss ở cuối màn
const ARENA = { l: 6220, r: 6950, gateX: 6190, floor: 420 };
const BOSS_W = 64, BOSS_H = 112, AURA_R = 105, WARN = .7;
const PHASES = [null,
  { speed: 55, cycle: 0, dur: 0,   shots: 0, gap: 0,   bspeed: 0,   name: 'Giai đoạn 1', note: 'Lilith xuất hiện trước. Giẫm lên đầu 3 lần. Chạm phía trước hay phía sau đều mất mạng.' },
  { speed: 55, cycle: 5, dur: 1.4, shots: 3, gap: .3,  bspeed: 380, name: 'HELL MODE', note: 'Lilith tạo vòng băng và bắn mũi băng; cứ 5 giây phong ấn bạn (Shift để thoát, nhảy né laze). Giẫm 3 lần để hạ Lilith… nhưng hãy giữ sẵn Vô địch!' },
  { speed: 85, cycle: 3, dur: 1.3, shots: 4, gap: .25, bspeed: 480, name: 'HELL MODE', note: 'Naamah nhanh hơn: vòng lửa và cầu lửa mỗi 3 giây, vẫn phong ấn mỗi 5 giây. Giẫm 3 lần để hạ Naamah!' },
  { speed: 70, cycle: 5, dur: 1.4, shots: 3, gap: .3,  bspeed: 420, name: 'HỢP THỂ', note: 'Chỉ gây sát thương khi đang Vô địch (Shift): lao vào thân boss. Nhặt vết tích băng / lửa rơi ra sau mỗi đợt tấn công: Vô địch + vết tích = sát thương gấp đôi.' },
];
// Hợp thể sau khi Naamah bị hạ
const FUSE = { ghost: .5, merge: 1.4, end: 2.2 }, FUSED_HP = 20, FUSED_K = 1.35;
const FW = BOSS_W * FUSED_K, FH = BOSS_H * FUSED_K;
// Màn chuyển cảnh khi Lilith bị hạ: Naamah chui ra, hiện sau lưng bóng và đánh úp
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
    lives: LIVES, fight: false, gateClosed: false, safe: 0, tsEsc: false, sky: 0,
    boss: { hits: 0, phase: 1, inv: 0, fireT: 0, fire: 0, warn: false, dead: false, shot: 0, hellT: 0, ts: 0, laserShot: false, att: 0, cut: null, fuse: null, hp: FUSED_HP, hitCd: 0, marks: [], units: newUnits() },
    traces: 0, pops: [], flash: 0,
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
function setKey(k, on) {
  if (k === 'jump' && on && !keys.jump) S.jumpBuf = .14;
  if (k === 'skill' && on && !keys.skill) {
    if (S.boss && S.boss.ts > 0 && !S.tsEsc && !S.dead) escapeTimeStop();
    else activateSkill();
  }
  keys[k] = on;
  if (on && !S.moved) { S.moved = true; setTimeout(() => $('hint').classList.add('gone'), 1500); }
}
const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyK: 'skill', ShiftLeft: 'skill', ShiftRight: 'skill' };
function escapeTimeStop() {
  S.tsEsc = true;
  const b = S.ball;
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2;
    S.parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, life: .45, c: i % 2 ? '#c9b6ff' : '#ffffff', r: 5, g: 0 });
  }
  tsBanner();
}
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
    // Ác quỷ lùi về cuối đấu trường, giữ số đòn đã trúng; bóng được bảo vệ 1.5 giây.
    Object.assign(S.ball, { x: ARENA.l + 50, y: ARENA.floor - 60 });
    Object.assign(B, { inv: 0, fireT: 0, fire: 0, warn: false, shot: 0, hellT: 0, ts: 0, laserShot: false });
    if (!B.cut) Object.assign(B.units[0], { x: ARENA.r - 160, dir: -1 });
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
  const b = S.ball;

  // Thời gian ngưng đọng: bóng bị đóng băng cho tới khi nhấn Shift
  const cut = S.boss.cut;
  const frozen = (S.boss.ts > 0 && !S.tsEsc) || (cut && cut.t < CUT.strike) || !!S.boss.fuse;
  const inDir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (inDir) S.lastDir = inDir;
  if (!frozen) {
    S.lastGround += dt;
    S.jumpBuf -= dt;
    if (S.jumpBuf > 0 && S.lastGround < .1) { b.vy = -JUMP; S.jumpBuf = 0; S.lastGround = 1; }
    if (!keys.jump && b.vy < -320) b.vy = -320;   // nhả sớm → nhảy thấp

    const steps = 4;
    for (let i = 0; i < steps; i++) step(dt / steps);
  } else S.jumpBuf = 0;
  b.rot += frozen ? 0 : b.vx * dt / R;
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

/* ---------- Boss: Lilith (băng) & Naamah (lửa) ---------- */
// S.boss giữ trạng thái chung (giai đoạn, số đòn, hell mode); S.boss.units là hai ác quỷ
function newUnits() {
  return [{ kind: 'ice', x: 6720, dir: -1, squash: 0, flash: 0, hurt: 0 }];
}
const devilName = B => B.units[0].kind === 'ice' ? 'LILITH' : 'NAAMAH';
function bossBar() {
  const B = S.boss;
  $('bossbar').hidden = !(S.fight || B.dead);
  const fused = B.phase === 4 || !!B.fuse;
  $('bname').textContent = B.dead || fused ? 'LILITH × NAAMAH' : devilName(B);
  $('bphase').textContent = B.dead ? 'Đã hạ!' : B.fuse ? 'Đang hợp thể…'
    : B.phase === 4 ? `HỢP THỂ · ${Math.max(0, B.hp)}/${FUSED_HP} máu` : `${PHASES[B.phase].name} (${B.phase}/3)`;
  $('bnote').textContent = B.dead ? 'Lăn tới cờ đích để về đích.' : B.fuse ? 'Lilith và Naamah đang hợp thể!' : PHASES[B.phase].note;
  document.querySelector('#bossbar .pips').hidden = fused;
  $('hpbar').hidden = !(B.phase === 4) || B.dead;
  $('hpfill').style.width = (Math.max(0, B.hp) / FUSED_HP * 100) + '%';
  document.querySelectorAll('#bossbar .pips i').forEach((p, i) => p.classList.toggle('on', !B.dead && i < 3 - B.hits));
}
// Vòng ma lực: to dần khi xuất hiện, thu lại khi sắp tắt
function auraScale(B) {
  const P = PHASES[B.phase];
  return Math.min(1, (P.dur - B.fire) / .25, B.fire / .15);
}
function shoot(u, P) {
  S.bullets.push({ x: u.x + u.dir * (BOSS_W / 2 + 22), y: ARENA.floor - 24, vx: u.dir * P.bspeed, kind: u.kind });
  u.flash = .08;
}
const busy = (B, u) => u === B.units[B.att] && (B.fire > 0 || B.warn);
function updateBoss(dt) {
  const B = S.boss, b = S.ball, U = B.units;
  if (!B.ts) for (const u of S.bullets) u.x += u.vx * dt;   // đạn cũng đứng yên khi bị phong ấn
  S.bullets = S.bullets.filter(u => u.x > ARENA.gateX && u.x < ARENA.r);
  if (B.dead) return;
  for (const u of U) { u.squash = Math.max(0, u.squash - dt); u.flash = Math.max(0, u.flash - dt); u.hurt = Math.max(0, u.hurt - dt); }
  if (!S.fight) {
    if (!S.dead && b.x > ARENA.l + 30) { S.fight = true; S.gateClosed = true; B.fireT = 0; bossBar(); }
    return;
  }
  if (B.cut) { updateCut(B, b, dt); return; }
  if (B.fuse) { updateFuse(B, b, dt); return; }
  if (B.phase === 4) { updateFused(B, b, dt); return; }
  const P = PHASES[B.phase];
  B.inv = Math.max(0, B.inv - dt);
  // Hell mode: phong ấn (đóng băng bóng) rồi bắn laze
  if (B.phase >= 2) {
    if (B.ts > 0) {
      B.ts -= dt;
      if (B.ts <= LASER_AT && !B.laserShot) B.laserShot = true;
      if (B.ts <= 0) { B.ts = 0; B.hellT = 0; S.tsEsc = false; tsBanner(); }
    } else if (!B.fire && !B.warn && !S.dead) {
      B.hellT += dt;
      if (B.hellT >= TS_EVERY) {
        B.ts = TS_DUR; B.laserShot = false; S.tsEsc = false;
        for (const u of U) u.dir = Math.sign(b.x - u.x) || u.dir;   // cả hai quay về phía bóng
        Object.assign(b, { vx: 0, vy: 0 });
        tsBanner();
      }
    }
  }
  if (B.ts > 0) {
    if (!S.dead) bossTouch(B, b, true);
    return;
  }
  // Hai ác quỷ thay phiên nhau tấn công
  const A = U[B.att];
  if (P.cycle) {
    if (B.fire > 0) {
      const el = P.dur - B.fire;
      while (B.shot < P.shots && el >= .15 + B.shot * P.gap) { shoot(A, P); B.shot++; }
      B.fire -= dt;
      if (B.fire <= 0) { B.fire = 0; B.fireT = 0; B.att = (B.att + 1) % U.length; }
    } else { B.fireT += dt; if (B.fireT >= P.cycle) { B.fire = P.dur; B.shot = 0; } }
  }
  const wasWarn = B.warn;
  B.warn = !!P.cycle && !B.fire && B.fireT > P.cycle - WARN;
  if (B.warn && !wasWarn && !S.dead) U[B.att].dir = Math.sign(b.x - U[B.att].x) || U[B.att].dir;
  const lo = ARENA.l + BOSS_W / 2 + 40, hi = ARENA.r - BOSS_W / 2 - 10;
  for (const u of U) {
    if (busy(B, u)) continue;
    u.x += u.dir * P.speed * dt;
    if (u.x > hi) { u.x = hi; u.dir = -1; }
    if (u.x < lo) { u.x = lo; u.dir = 1; }
  }
  // giữ khoảng cách để hai ác quỷ không chồng lên nhau
  const [u0, u1] = U, GAP = 130, d = u1 ? Math.abs(u0.x - u1.x) : Infinity;
  if (d < GAP) {
    const sg = Math.sign(u1.x - u0.x) || 1, push = (GAP - d) / 2;
    if (!busy(B, u0)) { u0.x = clamp(u0.x - sg * push, lo, hi); u0.dir = -sg; }
    if (!busy(B, u1)) { u1.x = clamp(u1.x + sg * push, lo, hi); u1.dir = sg; }
  }
  if (S.dead) return;
  bossTouch(B, b, false);
}
const laserOn = B => B.ts > 0 && B.ts <= LASER_AT && B.ts > LASER_AT - LASER_DUR;
function laserSpan(u) {
  return u.dir > 0 ? [u.x + BOSS_W / 2, ARENA.r] : [ARENA.gateX + 30, u.x - BOSS_W / 2];
}
function bossTouch(B, b, stopped) {
  // Laze: mỗi ác quỷ bắn một luồng sát mặt đất về phía bóng, chỉ né được bằng cách nhảy (vô địch không chặn được)
  if (laserOn(B) && !S.safe) {
    for (const u of B.units) {
      const [lo, hi] = laserSpan(u);
      if (b.x + R > lo && b.x - R < hi && b.y + R * .8 > ARENA.floor - LASER_H) { die(); return; }
    }
  }
  // Đạn băng / cầu lửa
  for (const u of S.bullets) {
    if (Math.hypot(u.x - b.x, u.y - b.y) < R + 5) {
      if (S.power || S.safe) { u.x = -1e9; continue; }
      die(); return;
    }
  }
  const gy = ARENA.floor, top = gy - BOSS_H;
  for (let i = 0; i < B.units.length; i++) {
    const u = B.units[i], cx = u.x;
    const attacking = B.fire > 0 && i === B.att;
    // Vòng ma lực quanh ác quỷ đang tấn công
    if (attacking && !S.power && !S.safe && Math.hypot(b.x - cx, b.y - (gy - 56)) < AURA_R * auraScale(B) + R * .3) { die(); return; }
    const nx = clamp(b.x, cx - BOSS_W / 2, cx + BOSS_W / 2), ny = clamp(b.y, top, gy);
    if ((b.x - nx) ** 2 + (b.y - ny) ** 2 >= R * R) continue;
    // Giẫm từ trên xuống: cách duy nhất để gây sát thương
    if (b.vy > 0 && b.y < top + 10) {
      b.y = top - R; b.vy = -700; b.squash = .25;
      b.vx = (Math.sign(b.x - cx) || -u.dir) * 280;   // văng sang bên, không giẫm liên tục được
      if (!stopped && !B.inv && (!attacking || S.power)) hitBoss(u);
      return;
    }
    // Chạm phía trước hoặc phía sau
    const side = Math.sign(b.x - cx) || 1;
    if (S.power || S.safe || B.inv) { b.x = cx + side * (BOSS_W / 2 + R + 1); b.vx = side * 380; b.vy = -320; return; }
    die(); return;
  }
}
function cutBanner(text, warn) {
  const el = $('tsBanner');
  el.hidden = !text;
  if (text) { el.textContent = text; el.dataset.esc = warn ? '1' : '0'; }
}
function updateCut(B, b, dt) {
  const C = B.cut;
  C.t += dt;
  const lo = ARENA.l + BOSS_W / 2 + 40, hi = ARENA.r - BOSS_W / 2 - 10;
  if (C.t >= CUT.burst && !C.burst) {
    // Lilith vỡ tung, Naamah chui ra từ chính chỗ đó
    C.burst = true;
    const L = B.units[0];
    for (let i = 0; i < 50; i++) {
      const a = Math.random() * Math.PI * 2, sp = 100 + Math.random() * 420;
      S.parts.push({ x: L.x, y: ARENA.floor - 60, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 200, life: 1, c: ['#7ff0ff', '#d8fbff', '#0f2430', '#ff2f5c'][i % 4], r: 4 + Math.random() * 6 });
    }
    B.units = [{ kind: 'fire', x: L.x, dir: L.dir, squash: 0, flash: 0, hurt: 0, emerge: 0 }];
    B.att = 0;
    bossBar();
  }
  const N = B.units[0];
  if (C.burst) N.emerge = clamp((C.t - CUT.burst) / CUT.emerge, 0, 1);
  if (C.t >= CUT.vanish && !C.vanish) {
    C.vanish = true; N.hidden = true;
    smoke(N.x, ARENA.floor - 50);
  }
  if (C.t >= CUT.appear && !C.appear) {
    // hiện ra sau lưng bóng (phía ngược hướng bóng đang lăn)
    C.appear = true; N.hidden = false;
    let x = b.x - S.lastDir * 90;
    if (x < lo || x > hi) x = b.x + S.lastDir * 90;
    N.x = clamp(x, lo, hi);
    N.dir = Math.sign(b.x - N.x) || 1;
    smoke(N.x, ARENA.floor - 50);
  }
  if (C.appear && !C.struck) {
    cutBanner(S.power > 0 ? 'Đang vô địch: sẽ chặn được đòn!'
      : S.cd > 0 ? `Vô địch còn hồi ${Math.ceil(S.cd)} giây: không thể chặn!`
      : 'Naamah sau lưng! Nhấn Shift để chặn!', S.power <= 0);
  }
  if (C.t >= CUT.strike && !C.struck) {
    C.struck = true;
    cutBanner('');
    if (S.power > 0) {
      // chặn được: bóng văng ra, không mất mạng
      for (let i = 0; i < 20; i++) {
        const a = Math.random() * Math.PI * 2;
        S.parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, life: .5, c: i % 2 ? '#ffc21a' : '#ffffff', r: 5, g: 0 });
      }
      b.vx = N.dir * 420; b.vy = -420;
    } else die();
  }
  if (C.t >= CUT.end) {
    B.cut = null; delete N.emerge;
    Object.assign(B, { phase: 3, hits: 0, inv: 1.2, fireT: 0, hellT: 0, att: 0 });
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
    B.units = [{ kind: 'fused', x: F.mx, dir: Math.sign(b.x - F.mx) || -1, squash: 0, flash: 0, hurt: 0, grow: 0 }];
  }
  if (F.merged) B.units[0].grow = clamp((F.t - FUSE.merge) / (FUSE.end - FUSE.merge), 0, 1);
  if (F.t >= FUSE.end) {
    B.fuse = null; delete B.units[0].grow;
    Object.assign(B, { phase: 4, hp: FUSED_HP, hits: 0, inv: 0, fireT: 0, fire: 0, warn: false, shot: 0, att: 0, hitCd: 0, marks: [] });
    S.safe = Math.max(S.safe, 1);
    bossBar();
  }
}
// Vết tích rơi ra sau mỗi đợt tấn công: một mảnh băng bên trái, một tàn lửa bên phải
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
function updateFused(B, b, dt) {
  const P = PHASES[4], u = B.units[0], gy = ARENA.floor;
  B.hitCd = Math.max(0, B.hitCd - dt);
  for (const m of B.marks) m.life -= dt;
  B.marks = B.marks.filter(m => m.life > 0);
  // Đồng loạt tấn công mỗi 5 giây: mũi băng sang trái, cầu lửa sang phải
  if (B.fire > 0) {
    const el = P.dur - B.fire;
    while (B.shot < P.shots && el >= .15 + B.shot * P.gap) {
      S.bullets.push({ x: u.x - FW / 2 - 20, y: gy - 24, vx: -P.bspeed, kind: 'ice' });
      S.bullets.push({ x: u.x + FW / 2 + 20, y: gy - 24, vx: P.bspeed, kind: 'fire' });
      B.shot++; u.flash = .08;
    }
    B.fire -= dt;
    if (B.fire <= 0) { B.fire = 0; B.fireT = 0; dropMarks(B, u); }
  } else { B.fireT += dt; if (B.fireT >= P.cycle) { B.fire = P.dur; B.shot = 0; } }
  B.warn = !B.fire && B.fireT > P.cycle - WARN;
  if (!B.fire && !B.warn) {
    const lo = ARENA.l + FW / 2 + 40, hi = ARENA.r - FW / 2 - 10;
    u.x += u.dir * P.speed * dt;
    if (u.x > hi) { u.x = hi; u.dir = -1; }
    if (u.x < lo) { u.x = lo; u.dir = 1; }
  }
  if (S.dead) return;
  // nhặt vết tích
  for (const m of B.marks) {
    if (Math.hypot(m.x - b.x, (gy - 18) - b.y) < R + 16) {
      m.life = 0; S.traces = Math.min(5, S.traces + 1);
      for (let i = 0; i < 14; i++) {
        const a = i / 14 * Math.PI * 2;
        S.parts.push({ x: m.x, y: gy - 18, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, life: .4, c: m.kind === 'ice' ? '#7ff0ff' : '#ff9a1f', r: 4, g: 0 });
      }
    }
  }
  // đạn
  for (const q of S.bullets) {
    if (Math.hypot(q.x - b.x, q.y - b.y) < R + 5) {
      if (S.power || S.safe) { q.x = -1e9; continue; }
      die(); return;
    }
  }
  // vòng băng lửa quanh thân
  if (B.fire && !S.power && !S.safe && Math.hypot(b.x - u.x, b.y - (gy - 70)) < AURA_R * 1.25 * auraScale(B) + R * .3) { die(); return; }
  // chạm thân: chỉ gây sát thương khi đang Vô địch
  const top = gy - FH;
  const nx = clamp(b.x, u.x - FW / 2, u.x + FW / 2), ny = clamp(b.y, top, gy);
  if ((b.x - nx) ** 2 + (b.y - ny) ** 2 >= R * R) return;
  const side = Math.sign(b.x - u.x) || 1;
  if (S.power > 0) {
    if (!B.hitCd) {
      const dmg = S.traces > 0 ? 2 : 1;
      if (S.traces > 0) S.traces--;
      B.hp -= dmg; B.hitCd = .25; u.hurt = .3; u.squash = .15;
      S.pops.push({ x: u.x, y: top - 10, t: .8, text: `-${dmg}`, c: dmg > 1 ? '#ffc21a' : '#ffffff' });
      for (let i = 0; i < 16; i++) {
        const a = Math.random() * Math.PI * 2, sp = 120 + Math.random() * 220;
        S.parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: .5, c: i % 2 ? '#ffc21a' : (dmg > 1 ? '#ff2f5c' : '#ffffff'), r: 5 });
      }
      if (B.hp <= 0) { killFused(B, u); return; }
      bossBar();
    }
    b.x = u.x + side * (FW / 2 + R + 1); b.vx = side * 240; b.vy = -320;
    return;
  }
  if (S.safe) { b.x = u.x + side * (FW / 2 + R + 1); b.vx = side * 380; b.vy = -320; return; }
  die();
}
function killFused(B, u) {
  B.dead = true; S.gateClosed = false; S.bullets = []; B.marks = []; S.flash = .8;
  for (let i = 0; i < 120; i++) {
    const a = Math.random() * Math.PI * 2, sp = 100 + Math.random() * 600;
    S.parts.push({ x: u.x, y: ARENA.floor - 80, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 250, life: 1.4, c: ['#7ff0ff', '#ff2f5c', '#0f2430', '#1c0c12', '#ffffff'][i % 5], r: 5 + Math.random() * 9 });
  }
  bossBar();
}
const devilColors = u => u.kind === 'ice' ? ['#7ff0ff', '#d8fbff', '#0f2430'] : ['#ff2f5c', '#ffa0b4', '#1c0c12'];
function hitBoss(u) {
  const B = S.boss;
  B.hits++; B.inv = 1; u.squash = .3; u.hurt = 1;
  const top = ARENA.floor - BOSS_H, cy = ARENA.floor - BOSS_H / 2;
  const [c1, c2] = devilColors(u);
  for (let i = 0; i < 20; i++) {
    const a = -Math.PI * Math.random(), sp = 150 + Math.random() * 250;
    S.parts.push({ x: u.x, y: top, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: .7, c: i % 2 ? c1 : c2, r: 5 + Math.random() * 4 });
  }
  if (B.hits >= 3) {
    if (B.phase === 3) {
      // Naamah gục: bắt đầu hợp thể ở phía xa quả bóng
      const center = (ARENA.l + ARENA.r) / 2;
      const mx = S.ball.x < center ? ARENA.r - 190 : ARENA.l + 190;
      Object.assign(B, { hits: 0, fire: 0, warn: false, ts: 0, shot: 0, fuse: { t: 0, nx: u.x, mx, merged: false } });
      S.tsEsc = false; S.bullets = [];
      tsBanner();
    } else if (B.phase === 2) {
      // Lilith bị hạ: bắt đầu màn Naamah chui ra
      Object.assign(B, { hits: 0, fire: 0, warn: false, shot: 0, ts: 0, hellT: 0, cut: { t: 0 } });
      S.tsEsc = false; S.bullets = [];
      tsBanner();
    } else {
      B.phase++; B.hits = 0; B.fireT = 0; B.fire = 0; B.shot = 0; B.inv = 1.6; B.hellT = 0; B.att = 0;
      for (const v of B.units) {
        const [d1, d2] = devilColors(v);
        for (let i = 0; i < 24; i++) {
          const a = i / 24 * Math.PI * 2;
          S.parts.push({ x: v.x, y: cy, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320, life: .6, c: i % 2 ? d1 : d2, r: 7, g: 0 });
        }
      }
    }
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
  $('again2').focus();
}
const progress = () => clamp(S.ball.x / GOAL.x, 0, 1);
function win() {
  S.won = true;
  const got = S.stars.filter(s => s.got).length;
  $('winStars').textContent = `Sao: ${got}/${S.stars.length}`;
  $('winTime').textContent = `Thời gian: ${fmt(S.time)} (còn dư ${fmt(TIME_LIMIT - S.time)})`;
  $('winDeaths').textContent = `Mạng còn lại: ${S.lives}/${LIVES}`;
  $('win').hidden = false;
  $('again').focus();
}
const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
let lastSec = -1, lastSkill = '';
function hud() {
  $('stars').textContent = `${S.stars.filter(s => s.got).length}/${S.stars.length}`;
  $('lives').textContent = '♥'.repeat(Math.max(0, S.lives)) + '♡'.repeat(LIVES - Math.max(0, S.lives));
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
  const moving = u.moving ?? (S.fight && !B.ts && !B.cut && !busy(B, u));
  const aim = u.aim ?? (busy(B, u) || B.ts > 0 || (B.cut && B.cut.appear));
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
  const x = u.x, busyNow = B.fire > 0 || B.warn;
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
  const u = B.units[0], gy = ARENA.floor, cy = gy - 70;
  drawMarks(B);
  if (B.warn) {
    ctx.save(); ctx.setLineDash([10, 10]); ctx.lineDashOffset = -S.t * 60; ctx.lineWidth = 4;
    ctx.strokeStyle = '#7ff0ff'; ctx.beginPath(); ctx.arc(u.x, cy, AURA_R * 1.25, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
    ctx.strokeStyle = '#ff2f5c'; ctx.beginPath(); ctx.arc(u.x, cy, AURA_R * 1.25, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    ctx.restore();
  }
  if (B.fire) {
    const r = AURA_R * 1.25 * auraScale(B);
    for (const [kind, x0] of [['ice', -400], ['fire', 0]]) {
      ctx.save(); ctx.beginPath(); ctx.rect(u.x + x0, cy - 300, 400, 600); ctx.clip();
      drawAura({ kind }, u.x, cy, r);
      ctx.restore();
    }
  }
  // hào quang vàng khi bóng đang Vô địch: báo hiệu có thể tấn công
  if (S.power > 0) {
    ctx.strokeStyle = Math.floor(S.t * 10) % 2 ? '#ffc21a' : '#ffffff'; ctx.lineWidth = 3;
    ctx.strokeRect(u.x - FW / 2 - 6, gy - FH - 6, FW + 12, FH + 12);
  }
  drawFusedBody(B, u, gy, FUSED_K);
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
function drawBoss() {
  const B = S.boss;
  if (B.dead) return;
  if (B.fuse) { drawFuse(B); return; }
  if (B.phase === 4) { drawFused(B); return; }
  const gy = ARENA.floor, cy = gy - 56;
  if (B.ts > 0) drawSeal();
  const C = B.cut;
  const shake = C && !C.burst ? Math.sin(S.t * 80) * (2 + C.t * 4) : 0;
  const xs = B.units.map(u => u.x + shake + (u === B.units[B.att] && B.warn ? Math.sin(S.t * 70) * 2 : 0));
  B.units.forEach((u, i) => {
    const [GLOW] = devilColors(u), x = xs[i];
    if (B.phase >= 2) {
      const pr = 62 + Math.sin(S.t * 6 + i) * 6;
      ctx.fillStyle = u.kind === 'ice' ? 'rgb(127 240 255 / .18)' : 'rgb(255 47 92 / .2)';
      ctx.beginPath(); ctx.arc(x, cy, pr, 0, Math.PI * 2); ctx.fill();
    }
    if (i === B.att && B.warn) {
      ctx.save();
      ctx.setLineDash([10, 10]); ctx.lineDashOffset = -S.t * 60;
      ctx.strokeStyle = Math.floor(S.t * 14) % 2 ? GLOW : '#ffffff'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x, cy, AURA_R, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    if (i === B.att && B.fire) drawAura(u, x, cy, AURA_R * auraScale(B));
  });
  drawLasers(B);
  B.units.forEach((u, i) => drawDevil(u, B, xs[i], gy));
  if (C && !C.burst) {
    // Lilith nứt ra, ánh đỏ bên trong lan dần
    const k = C.t / CUT.burst, x = xs[0];
    ctx.fillStyle = `rgb(255 47 92 / ${(.15 + k * .45).toFixed(2)})`;
    ctx.beginPath(); ctx.arc(x, cy - 10, 30 + k * 40, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff2f5c'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 4, gy - 100); ctx.lineTo(x + 6, gy - 80); ctx.lineTo(x - 3, gy - 60); ctx.lineTo(x + 5, gy - 30);
    ctx.moveTo(x + 6, gy - 80); ctx.lineTo(x + 16, gy - 74); ctx.moveTo(x - 3, gy - 60); ctx.lineTo(x - 14, gy - 52);
    ctx.stroke();
  }
  if (C && C.appear && !C.struck) {
    // Naamah vung vuốt: vòng đỏ thu hẹp quanh bóng báo hiệu đòn đánh
    const k = (C.t - CUT.appear) / (CUT.strike - CUT.appear), b = S.ball;
    ctx.strokeStyle = Math.floor(S.t * 16) % 2 ? '#ff2f5c' : '#ffffff'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(b.x, b.y, R + 60 * (1 - k) + 6, 0, Math.PI * 2); ctx.stroke();
  }
  if (C && C.struck && C.t < CUT.strike + .3) {
    // vết cào
    const b = S.ball, k = (C.t - CUT.strike) / .3;
    ctx.strokeStyle = `rgb(255 47 92 / ${(1 - k).toFixed(2)})`; ctx.lineWidth = 5;
    for (const o of [-14, 0, 14]) { ctx.beginPath(); ctx.moveTo(b.x - 30, b.y - 30 + o); ctx.lineTo(b.x + 30, b.y + 20 + o); ctx.stroke(); }
  }
  // mũi tên chỉ chỗ giẫm
  if (!B.inv && !B.ts && !B.cut && S.fight) {
    B.units.forEach((u, i) => {
      if (i === B.att && B.fire) return;
      const ay = gy - BOSS_H - 34 + Math.sin(S.t * 6 + i) * 6, x = xs[i];
      ctx.fillStyle = '#ffc21a'; ctx.strokeStyle = '#14301c'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x - 12, ay - 10); ctx.lineTo(x + 12, ay - 10); ctx.lineTo(x, ay + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    });
  }
}
function drawLasers(B) {
  if (!B.ts) return;
  const top = ARENA.floor - LASER_H, h = LASER_H;
  for (const u of B.units) {
    const [lo, hi] = laserSpan(u), ice = u.kind === 'ice';
    const [GLOW, GLOW2] = devilColors(u);
    if (B.ts > LASER_AT && B.ts <= LASER_AT + LASER_CHARGE) {
      // nạp năng lượng: vạch ngắm nhấp nháy + quả cầu sáng ở tay
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
function drawBullets() {
  for (const u of S.bullets) {
    const d = Math.sign(u.vx);
    if (u.kind === 'ice') {
      // mũi băng
      ctx.fillStyle = 'rgb(216 251 255 / .4)'; ctx.fillRect(u.x - d * 40, u.y - 2, d * 30, 4);
      ctx.beginPath(); ctx.moveTo(u.x + d * 14, u.y); ctx.lineTo(u.x, u.y - 6); ctx.lineTo(u.x - d * 12, u.y); ctx.lineTo(u.x, u.y + 6); ctx.closePath();
      ctx.fillStyle = '#7ff0ff'; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
    } else {
      // cầu lửa
      ctx.fillStyle = 'rgb(255 120 40 / .45)'; ctx.beginPath(); ctx.arc(u.x - d * 14, u.y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff4a1c'; ctx.beginPath(); ctx.arc(u.x, u.y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(u.x + d * 2, u.y, 4, 0, Math.PI * 2); ctx.fill();
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
  drawHellSky();
  drawStars();
  drawEnemies();
  drawBoss();
  drawBullets();
  drawTimeStop();
  drawBall();
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
