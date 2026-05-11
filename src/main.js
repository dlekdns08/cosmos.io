import Matter from 'matter-js';
import { TIERS, MAX_TIER } from './config/tiers.js';
import { setupWorld, clearCosmic, WIDTH, HEIGHT, TOP_LINE_Y } from './physics/world.js';
import { Dropper } from './physics/dropper.js';
import { applyGravity } from './physics/gravity.js';
import { setupMerge } from './game/merge.js';
import { runSupernova, runBlackholePhase, runBigBang } from './game/events.js';
import { Score } from './game/score.js';
import { Renderer } from './render/renderer.js';
import { Particles } from './render/particles.js';
import { Shake } from './render/shake.js';
import { Synth } from './audio/synth.js';
import { HUD, toast } from './ui/hud.js';
import { GameOverOverlay } from './ui/gameover.js';

const canvas = document.getElementById('game');
const bigBangBtn = document.getElementById('bigbang');

const { engine, world } = setupWorld();
const renderer = new Renderer(canvas);
const particles = new Particles();
const shake = new Shake();
const synth = new Synth();
const score = new Score();
const hud = new HUD(renderer);
const dropper = new Dropper(world, () => synth.drop());

const state = {
  gameOver: false,
  topOccupiedTime: 0,
  blackholeActive: false,
  bigBangAvailable: true,
  challenges: { firstStar: false, fiveCombo: false, blackhole: false, hundredK: false },
  challengeScoreTarget: 100000,
};

const gameOverOverlay = new GameOverOverlay(() => restart());

function maybeChallenge(key, label, color) {
  if (state.challenges[key]) return;
  state.challenges[key] = true;
  toast(label, color);
}

setupMerge(engine, world, {
  onMerge(body, x, y, newTier) {
    const info = TIERS[newTier];
    const result = score.addMerge(newTier);
    synth.merge(newTier);

    const colorMain = info.color;
    const pCount = 6 + newTier * 2;
    particles.emit(x, y, pCount, colorMain, { speed: 3 + newTier * 0.3, life: 0.8, size: 1 + newTier * 0.15 });
    if (newTier >= 6) {
      particles.ring(x, y, 12 + newTier, colorMain, info.radius * 0.6, { speed: 4 + newTier * 0.2, life: 0.9, size: 1.5 });
    }

    if (newTier === 8) maybeChallenge('firstStar', '첫 항성 탄생', '#ffd96b');
    if (result.combo >= 4.5) maybeChallenge('fiveCombo', '5 콤보 달성', '#ffe066');

    if (newTier === 10) {
      runSupernova(world, body, {
        onSupernova(cx, cy, bonus, count) {
          score.add(bonus);
          shake.add(18);
          synth.boom();
          particles.emit(cx, cy, 60, '#ffe25a', { speed: 11, life: 1.5, size: 3 });
          particles.ring(cx, cy, 30, '#ffffff', 30, { speed: 14, life: 1.3, size: 2.5 });
          toast(`초신성 폭발 +${bonus}`, '#ff8e3a');
        },
      });
    }

    if (newTier === 11) {
      maybeChallenge('blackhole', '블랙홀 생성', '#7f4dff');
      state.blackholeActive = true;
      shake.add(10);
      synth.blackhole();
      toast('블랙홀 흡수 페이즈', '#7f4dff');
      runBlackholePhase(world, body, {
        dropper,
        onAbsorb(b, bx, by, t) {
          particles.emit(bx, by, 6, TIERS[t].color, { speed: 5, life: 0.6, size: 2 });
        },
        onBlackholeEnd(absorbed) {
          score.add(absorbed);
          state.blackholeActive = false;
          shake.add(6);
          toast(`흡수 보너스 +${absorbed.toLocaleString()}`, '#7f4dff');
          particles.emit(WIDTH / 2, HEIGHT / 2, 40, '#7f4dff', { speed: 8, life: 1.2, size: 2.5 });
        },
      });
    }
  },
});

function getPointerX(e) {
  const rect = canvas.getBoundingClientRect();
  const scale = canvas.width / rect.width;
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  return (cx - rect.left) * scale;
}

function handleMove(e) {
  if (state.gameOver) return;
  dropper.setX(getPointerX(e));
}

function handleDrop(e) {
  if (state.gameOver || state.blackholeActive) return;
  synth.ensure();
  if (e.touches) e.preventDefault();
  dropper.setX(getPointerX(e));
  dropper.drop();
}

canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('mousedown', handleDrop);
canvas.addEventListener('touchmove', (e) => { handleMove(e); e.preventDefault(); }, { passive: false });
canvas.addEventListener('touchstart', handleDrop, { passive: false });

bigBangBtn.addEventListener('click', () => {
  if (!state.bigBangAvailable || state.gameOver || state.blackholeActive) return;
  state.bigBangAvailable = false;
  state.topOccupiedTime = 0;
  score.countBigBang();
  synth.bigbang();
  shake.add(28);
  runBigBang(world, {
    onBigBang() {
      const all = Matter.Composite.allBodies(world).filter(b => b.label === 'cosmic');
      for (const b of all) {
        particles.emit(b.position.x, b.position.y, 4, TIERS[b.tier].color, { speed: 5, life: 0.6, size: 1.5 });
      }
      particles.ring(WIDTH / 2, HEIGHT / 2, 60, '#ff4d6d', 40, { speed: 14, life: 1.5, size: 3 });
      toast('빅뱅 — 우주 재배치', '#ff4d6d');
    },
  });
  updateBigBangVisibility(true);
});

function updateBigBangVisibility(forceHide) {
  if (forceHide || !state.bigBangAvailable) {
    bigBangBtn.classList.remove('show');
    bigBangBtn.disabled = true;
    return;
  }
  if (state.topOccupiedTime > 1.2 && !state.gameOver && !state.blackholeActive) {
    bigBangBtn.classList.add('show');
    bigBangBtn.disabled = false;
  } else {
    bigBangBtn.classList.remove('show');
  }
}

function checkTopOccupation(bodies, dt) {
  let occupied = false;
  const now = performance.now();
  for (const b of bodies) {
    if (!b.tier) continue;
    const info = TIERS[b.tier];
    if (!info) continue;
    if (now - (b._spawnT || 0) < 1500) continue;
    if (b.position.y - info.radius < TOP_LINE_Y - 6 && Math.abs(b.velocity.y) < 1.2) {
      occupied = true;
      break;
    }
  }
  if (occupied) state.topOccupiedTime += dt;
  else state.topOccupiedTime = Math.max(0, state.topOccupiedTime - dt * 0.5);
}

function triggerGameOver() {
  if (state.gameOver) return;
  state.gameOver = true;
  dropper.enabled = false;
  score.finalize();
  synth.gameover();
  shake.add(20);
  setTimeout(() => gameOverOverlay.show(score), 600);
}

function restart() {
  clearCosmic(world);
  particles.reset();
  dropper.reset();
  score.reset();
  state.gameOver = false;
  state.topOccupiedTime = 0;
  state.blackholeActive = false;
  state.bigBangAvailable = true;
  state.challenges = { firstStar: false, fiveCombo: false, blackhole: false, hundredK: false };
  hud.resetPreview();
  gameOverOverlay.hide();
  updateBigBangVisibility(true);
}

// resize: keep CSS scaling crisp on HiDPI
function fitCanvas() {
  // Vite served canvas remains logical 480x720; CSS handles display scaling.
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (!state.gameOver) {
    Matter.Engine.update(engine, 1000 / 60);
    const bodies = Matter.Composite.allBodies(world).filter((b) => b.label === 'cosmic');
    applyGravity(bodies);
    dropper.update(dt);
    score.comboDecay(now);
    checkTopOccupation(bodies, dt);
    updateBigBangVisibility(false);

    if (state.topOccupiedTime >= 3) {
      triggerGameOver();
    }

    if (!state.challenges.hundredK && score.value >= state.challengeScoreTarget) {
      maybeChallenge('hundredK', '100,000 점 돌파', '#7f4dff');
    }
  }

  particles.update(dt);
  shake.update(dt);

  const bodiesForRender = Matter.Composite.allBodies(world).filter((b) => b.label === 'cosmic');
  renderer.draw(bodiesForRender, particles, shake, dropper, state.blackholeActive);
  hud.update(score, dropper);

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
