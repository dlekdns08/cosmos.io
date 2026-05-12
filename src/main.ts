import Matter from 'matter-js';
import { TIERS, tierInfo } from './config/tiers.js';
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
import { LeaderboardPanel } from './ui/leaderboard.js';
import { NetClient } from './net/client.js';
import { applyOrbitForces, markOrbitActive, isOrbitActive } from './game/orbit.js';
import { runSlingshot, wasJustSlung } from './game/slingshot.js';
import { CosmicCharge, type ChargeKind } from './game/cosmicCharge.js';
import { ChargePanel } from './ui/charge.js';
import { applyChargeAttractors, registerAttractDrop, resetChargeAttractors } from './game/chargeEffects.js';
import { Meta } from './game/meta.js';
import { NebulaPanel } from './ui/nebula.js';
import { UNLOCK_TRACK } from './config/unlocks.js';
import { Popups } from './render/popups.js';
import { DailyChallenges } from './game/dailyChallenge.js';
import { DailyPanel } from './ui/daily.js';
import { downloadShareCard } from './ui/shareCard.js';

interface Challenges {
  firstStar: boolean;
  fiveCombo: boolean;
  blackhole: boolean;
  hundredK: boolean;
  threeSlingshots: boolean;
  fiveCharges: boolean;
  blackholeNoBigBang: boolean;
}

interface GameState {
  gameOver: boolean;
  topOccupiedTime: number;
  blackholeActive: boolean;
  bigBangAvailable: boolean;
  bigBangCountThisGame: number;
  bigBangMaxThisGame: number;
  bigBangUsedThisGame: boolean;
  challenges: Challenges;
  challengeScoreTarget: number;
  slingshotCount: number;
  blackholesThisGame: number;
  firstAchievementsThisGame: number;
}

const canvas = document.getElementById('game') as HTMLCanvasElement | null;
const bigBangBtn = document.getElementById('bigbang') as HTMLButtonElement | null;
const openNebulaBtn = document.getElementById('open-nebula') as HTMLButtonElement | null;
const shareBtn = document.getElementById('share-card') as HTMLButtonElement | null;
if (!canvas || !bigBangBtn || !openNebulaBtn || !shareBtn) throw new Error('Required DOM elements missing');

const meta = new Meta();
const nebula = new NebulaPanel();
openNebulaBtn.addEventListener('click', () => nebula.show(meta));

const daily = new DailyChallenges();
const dailyPanel = new DailyPanel(daily);

let lastAwardedNp = 0;
shareBtn.addEventListener('click', () => downloadShareCard(score, lastAwardedNp));

const { engine, world } = setupWorld();
const renderer = new Renderer(canvas);
const particles = new Particles();
const shake = new Shake();
const synth = new Synth();
const score = new Score();
const hud = new HUD(renderer);
const popups = new Popups();

const charge = new CosmicCharge({
  onReady() {
    synth.chargeReady();
    toast('차지 100% — 1·2·3 선택', '#7f4dff');
  },
});
const chargePanel = new ChargePanel(charge, (kind) => onChargeSelect(kind));

const dropper = new Dropper(world, () => synth.drop());

function applyUnlocks(): void {
  if (meta.hasUnlock('startingSeed5')) dropper.startingSeedMax = 5;
  else if (meta.hasUnlock('startingSeed4')) dropper.startingSeedMax = 4;
  else dropper.startingSeedMax = 3;

  if (meta.hasUnlock('chargeRate15')) charge.setRate(1.5);
  else if (meta.hasUnlock('chargeRate12')) charge.setRate(1.2);
  else charge.setRate(1);
}

function maxBigBangs(): number {
  return meta.hasUnlock('bigBangPlus1') ? 2 : 1;
}

const state: GameState = {
  gameOver: false,
  topOccupiedTime: 0,
  blackholeActive: false,
  bigBangAvailable: true,
  bigBangCountThisGame: 0,
  bigBangMaxThisGame: maxBigBangs(),
  bigBangUsedThisGame: false,
  challenges: {
    firstStar: false,
    fiveCombo: false,
    blackhole: false,
    hundredK: false,
    threeSlingshots: false,
    fiveCharges: false,
    blackholeNoBigBang: false,
  },
  challengeScoreTarget: 100000,
  slingshotCount: 0,
  blackholesThisGame: 0,
  firstAchievementsThisGame: 0,
};

applyUnlocks();

const gameOverOverlay = new GameOverOverlay(() => restart());
const leaderboard = new LeaderboardPanel();
const net = new NetClient({
  onConnect() { leaderboard.setConnected(true); },
  onDisconnect() { leaderboard.setConnected(false); },
  onLeaderboard(entries, yourSessionId) {
    leaderboard.setYourSessionId(yourSessionId);
    leaderboard.render(entries);
  },
});
leaderboard.setYourSessionId(net.sessionId);
net.connect();

function maybeChallenge(key: keyof Challenges, label: string, color: string): void {
  if (state.challenges[key]) return;
  state.challenges[key] = true;
  toast(label, color);
  if (meta.registerFirstAchievement(key)) {
    state.firstAchievementsThisGame += 1;
  }
}

function onChargeSelect(kind: ChargeKind): void {
  if (!charge.ready) return;
  charge.select(kind);
  chargePanel.syncFromCharge();
}

setupMerge(engine, world, {
  onMerge({ body, x, y, newTier, parents }) {
    const info = tierInfo(newTier);

    // detect modifiers from parents
    const isOrbit = parents.some((p) => isOrbitActive(p));
    const isSling = parents.some((p) => wasJustSlung(p));
    const isCharge = parents.some((p) => p._chargeMod === 'charged' || p._chargeMod === 'slow' || p._chargeMod === 'attract');

    const result = score.addMerge(newTier, { orbit: isOrbit, slingshot: isSling, charge: isCharge });
    synth.merge(newTier);
    charge.addMerge(newTier);
    chargePanel.syncFromCharge();

    // mark tier 5 result as orbit-active
    if (info.orbitBonus) {
      markOrbitActive(body);
    }

    const popupSize = 14 + newTier * 1.5;
    const popupColor = result.multiplier >= 4 ? '#ffe066' : result.multiplier >= 2 ? '#ff9d3a' : info.color;
    popups.emit(`+${result.gained.toLocaleString()}`, x, y - 8, { size: popupSize, color: popupColor });
    const pCount = 6 + newTier * 2;
    particles.emit(x, y, pCount, info.color, { speed: 3 + newTier * 0.3, life: 0.8, size: 1 + newTier * 0.15 });
    if (newTier >= 6) {
      particles.ring(x, y, 12 + newTier, info.color, info.radius * 0.6, { speed: 4 + newTier * 0.2, life: 0.9, size: 1.5 });
    }
    if (isOrbit) particles.emit(x, y, 8, '#ffe066', { speed: 5, life: 0.7, size: 1.5 });
    if (isSling) particles.ring(x, y, 16, '#ffd76b', info.radius * 0.5, { speed: 8, life: 0.7, size: 2 });

    if (newTier === 8) maybeChallenge('firstStar', '첫 항성 탄생', '#ffd96b');
    if (result.combo >= 4.5) maybeChallenge('fiveCombo', '5 콤보 달성', '#ffe066');

    if (newTier === 10) {
      runSupernova(world, body, {
        onSupernova(cx, cy, bonus) {
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
      if (!state.bigBangUsedThisGame) {
        maybeChallenge('blackholeNoBigBang', '빅뱅 없이 블랙홀', '#ff4dc4');
      }
      state.blackholesThisGame += 1;
      meta.registerBlackhole();
      state.blackholeActive = true;
      shake.add(10);
      synth.blackhole();
      toast('블랙홀 흡수 페이즈', '#7f4dff');
      runBlackholePhase(world, body, {
        dropper,
        onAbsorb(_b, bx, by, t) {
          const tInfo = TIERS[t];
          if (tInfo) particles.emit(bx, by, 6, tInfo.color, { speed: 5, life: 0.6, size: 2 });
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

function getPointerX(e: MouseEvent | TouchEvent): number {
  const rect = canvas!.getBoundingClientRect();
  const scale = canvas!.width / rect.width;
  const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
  return (cx - rect.left) * scale;
}

function handleMove(e: MouseEvent | TouchEvent): void {
  if (state.gameOver) return;
  dropper.setX(getPointerX(e));
}

function handleDrop(e: MouseEvent | TouchEvent): void {
  if (state.gameOver || state.blackholeActive) return;
  synth.ensure();
  if ('touches' in e) e.preventDefault();
  dropper.setX(getPointerX(e));
  const modifier = charge.consume();
  const body = dropper.drop(modifier);
  chargePanel.syncFromCharge();
  if (body && modifier) {
    synth.chargeUse(modifier);
    if (modifier === 'attract') registerAttractDrop(body);
    if (state.challenges.fiveCharges === false && charge.usedCount >= 5) {
      maybeChallenge('fiveCharges', '코스믹 차지 5회', '#7f4dff');
    }
  }
}

canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('mousedown', handleDrop);
canvas.addEventListener('touchmove', (e) => { handleMove(e); e.preventDefault(); }, { passive: false });
canvas.addEventListener('touchstart', handleDrop, { passive: false });

document.addEventListener('keydown', (e) => {
  if (state.gameOver) return;
  if (e.key === '1') onChargeSelect('charged');
  else if (e.key === '2') onChargeSelect('slow');
  else if (e.key === '3') onChargeSelect('attract');
});

bigBangBtn.addEventListener('click', () => {
  if (!state.bigBangAvailable || state.gameOver || state.blackholeActive) return;
  state.bigBangCountThisGame += 1;
  state.bigBangAvailable = state.bigBangCountThisGame < state.bigBangMaxThisGame;
  state.bigBangUsedThisGame = true;
  state.topOccupiedTime = 0;
  score.countBigBang();
  synth.bigbang();
  shake.add(28);
  charge.fillFull();
  chargePanel.syncFromCharge();
  runBigBang(world, {
    onBigBang() {
      const all = Matter.Composite.allBodies(world).filter((b) => b.label === 'cosmic');
      for (const b of all) {
        if (b.tier == null) continue;
        const info = TIERS[b.tier];
        if (info) particles.emit(b.position.x, b.position.y, 4, info.color, { speed: 5, life: 0.6, size: 1.5 });
      }
      particles.ring(WIDTH / 2, HEIGHT / 2, 60, '#ff4d6d', 40, { speed: 14, life: 1.5, size: 3 });
      toast('빅뱅 — 우주 재배치 + 차지 충전', '#ff4d6d');
    },
  });
  updateBigBangVisibility(true);
});

function updateBigBangVisibility(forceHide: boolean): void {
  if (forceHide || !state.bigBangAvailable) {
    bigBangBtn!.classList.remove('show');
    bigBangBtn!.disabled = true;
    return;
  }
  if (state.topOccupiedTime > 1.2 && !state.gameOver && !state.blackholeActive) {
    bigBangBtn!.classList.add('show');
    bigBangBtn!.disabled = false;
  } else {
    bigBangBtn!.classList.remove('show');
  }
}

function checkTopOccupation(bodies: Matter.Body[], dt: number): void {
  let occupied = false;
  const now = performance.now();
  for (const b of bodies) {
    if (b.tier == null) continue;
    const info = TIERS[b.tier];
    if (!info) continue;
    if (now - (b._spawnT ?? 0) < 1500) continue;
    if (b.position.y - info.radius < TOP_LINE_Y - 6 && Math.abs(b.velocity.y) < 1.2) {
      occupied = true;
      break;
    }
  }
  if (occupied) state.topOccupiedTime += dt;
  else state.topOccupiedTime = Math.max(0, state.topOccupiedTime - dt * 0.5);
}

function triggerGameOver(): void {
  if (state.gameOver) return;
  state.gameOver = true;
  dropper.enabled = false;
  score.finalize();
  synth.gameover();
  shake.add(20);
  net.notifyGameOver(score.value);
  const award = meta.awardForGame(score.value, state.blackholesThisGame, state.firstAchievementsThisGame);
  setTimeout(() => {
    gameOverOverlay.show(score, award.npGained);
    if (award.newUnlocks.length) {
      const names = award.newUnlocks
        .map((id) => UNLOCK_TRACK.find((n) => n.id === id)?.name ?? id)
        .join(', ');
      toast(`해금: ${names}`, '#ff4dc4');
    }
  }, 600);
}

function restart(): void {
  clearCosmic(world);
  particles.reset();
  popups.reset();
  dropper.reset();
  score.reset();
  charge.reset();
  chargePanel.syncFromCharge();
  resetChargeAttractors();
  applyUnlocks();
  state.gameOver = false;
  state.topOccupiedTime = 0;
  state.blackholeActive = false;
  state.bigBangAvailable = true;
  state.bigBangCountThisGame = 0;
  state.bigBangMaxThisGame = maxBigBangs();
  state.bigBangUsedThisGame = false;
  state.slingshotCount = 0;
  state.blackholesThisGame = 0;
  state.firstAchievementsThisGame = 0;
  state.challenges = {
    firstStar: false,
    fiveCombo: false,
    blackhole: false,
    hundredK: false,
    threeSlingshots: false,
    fiveCharges: false,
    blackholeNoBigBang: false,
  };
  hud.resetPreview();
  gameOverOverlay.hide();
  updateBigBangVisibility(true);
}

let last = performance.now();
function loop(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (!state.gameOver) {
    Matter.Engine.update(engine, 1000 / 60);
    const bodies = Matter.Composite.allBodies(world).filter((b) => b.label === 'cosmic');
    applyGravity(bodies);
    applyOrbitForces(bodies, now);
    applyChargeAttractors(bodies);
    runSlingshot(bodies, () => {
      state.slingshotCount += 1;
      synth.slingshot();
      if (state.slingshotCount >= 3) {
        maybeChallenge('threeSlingshots', '슬링샷 3회', '#ffd76b');
      }
    });
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
  popups.update(dt);
  shake.update(dt);

  const bodiesForRender = Matter.Composite.allBodies(world).filter((b) => b.label === 'cosmic');
  renderer.draw(bodiesForRender, particles, shake, dropper, state.blackholeActive);
  popups.draw(canvas!.getContext('2d')!);
  hud.update(score, dropper);

  net.pushScore(score.value, !state.gameOver);

  requestAnimationFrame(loop);
}

chargePanel.syncFromCharge();
requestAnimationFrame(loop);
