const fs = require('fs');
const path = require('path');

const G = global; // alias for game globals

function setupDOM() {
  document.body.innerHTML = `
    <div id="game-container">
      <canvas id="gameCanvas"></canvas>
      <div class="settings-overlay" id="settings-overlay">
        <div class="settings-content">
          <h2>Settings</h2>
          <div class="setting-row">
            <span>Sound Effects</span>
            <button id="settings-sound" class="settings-toggle">ON</button>
          </div>
          <button class="restart" onclick="toggleSettings()">Close</button>
        </div>
      </div>
      <div id="game-over">
        <h2 style="color: #e74c3c; font-size: 3rem; margin: 0;">GAME OVER</h2>
        <p id="final-score" style="font-size: 1.5rem; margin: 20px 0;">Waves Survived: 0</p>
        <button class="restart" onclick="location.reload()">Play Again</button>
      </div>
      <div id="ui-bar">
        <div class="top-bar">
          <div class="stat-box">
            <span class="stat">Lives: <span id="lives" class="lives">20</span></span>
            <span class="stat">Money: <span id="money" class="money">$100</span></span>
          </div>
          <div class="stat">Wave: <span id="wave" class="stat">1</span></div>
        </div>
        <div class="controls">
          <button id="btn-tower1" class="btn-tower1 active">Basic<br><small>$50</small></button>
          <button id="btn-tower2" class="btn-tower2">Sniper<br><small>$120</small></button>
          <button id="btn-tower3" class="btn-tower3">Rapid<br><small>$80</small></button>
          <button id="btn-tower4" class="btn-tower4">AOE<br><small>$150</small></button>
          <button id="btn-wave" class="btn-wave">Start Wave</button>
          <button id="btn-pause" class="btn-pause">Pause</button>
          <button id="btn-save" class="btn-save">Save</button>
          <button id="btn-clear" class="btn-clear">Clear</button>
          <button id="btn-sound" class="btn-sound">Sound: OFF</button>
        </div>
      </div>
    </div>
  `;
}

function extractGameCode() {
  const html = fs.readFileSync(
    path.resolve(__dirname, '../tower_defense.html'), 'utf-8'
  );
  const m = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('No <script> block found');
  return m[1];
}

// Transform let→var for state vars, and export names to globalThis.
// Indirect eval ((0,eval)(code)) runs in global scope so var creates
// globalThis properties. Class/const declarations need explicit export.
function loadGame(code) {
  const stateVars = [
    'money','lives','wave','gameActive','paused',
    'enemies','towers','projectiles','particles','powerups',
    'floatingTexts','audioCtx','soundEnabled','settingsOpen',
    'selectedTowerType','enemiesToSpawn','spawning','waveActive','gamePaths',
  ];
  let mod = code;
  stateVars.forEach(v => {
    mod = mod.replace(new RegExp(`\\blet\\s+(${v})\\b`, 'g'), 'var $1');
  });

  // Export classes, consts, and DOM refs
  const exports = [
    'Enemy','Tower','Projectile','Particle','PowerUp','FloatingText',
    'towerTypes','path','canvas','ctx',
  ];
  exports.forEach(n => { mod += `\nglobalThis.${n} = ${n};`; });

  (0, eval)(mod);
}

beforeEach(() => {
  setupDOM();

  // Use fake timers and block rAF so game loop doesn't actually run
  jest.useFakeTimers();
  G.requestAnimationFrame = jest.fn();

  // Clean leftover game globals from previous test
  [
    'money','lives','wave','gameActive','paused',
    'enemies','towers','projectiles','particles','powerups',
    'floatingTexts','audioCtx','soundEnabled','settingsOpen',
    'selectedTowerType','enemiesToSpawn','spawning','waveActive','gamePaths',
    'Enemy','Tower','Projectile','Particle','PowerUp','FloatingText',
    'isOnPath','generateRandomPath','createParticles','showFloatingText',
    'getCanvasCoordinates','selectTower','togglePause','toggleSound',
    'clearTowers','startWave','endGame','handleInput','saveGame','loadGame',
    'updateUI','drawPath','toggleSettings','vibrate','initAudio','playSound',
    'towerTypes','path','canvas','ctx',
  ].forEach(k => { delete G[k]; });

  const code = extractGameCode();
  loadGame(code);
});

afterEach(() => {
  jest.useRealTimers();
});

// ─────────────────────────────────────────────────────────────────────────────
//  isOnPath
// ─────────────────────────────────────────────────────────────────────────────
describe('isOnPath()', () => {
  test('true for points directly on the path', () => {
    expect(G.isOnPath(0, 100)).toBe(true);
    expect(G.isOnPath(200, 100)).toBe(true);
    expect(G.isOnPath(200, 400)).toBe(true);
  });
  test('true for points near path (within 30px)', () => {
    expect(G.isOnPath(15, 100)).toBe(true);
    expect(G.isOnPath(200, 415)).toBe(true);
    expect(G.isOnPath(200, 385)).toBe(true);
  });
  test('false for points far from path', () => {
    expect(G.isOnPath(50, 0)).toBe(false);
    expect(G.isOnPath(300, 300)).toBe(false);
    expect(G.isOnPath(700, 700)).toBe(false);
  });
  test('false near corner but off path', () => {
    expect(G.isOnPath(150, 250)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  generateRandomPath
// ─────────────────────────────────────────────────────────────────────────────
describe('generateRandomPath()', () => {
  test('returns array of waypoints', () => {
    const p = G.generateRandomPath();
    expect(Array.isArray(p)).toBe(true);
    expect(p.length).toBeGreaterThanOrEqual(2);
  });
  test('starts at (0,100) and ends at x:800', () => {
    const p = G.generateRandomPath();
    expect(p[0]).toEqual({ x: 0, y: 100 });
    expect(p[p.length - 1].x).toBe(800);
  });
  test('y stays within [50,550]', () => {
    for (let i = 20; i--;) {
      G.generateRandomPath().forEach(pt => {
        expect(pt.y).toBeGreaterThanOrEqual(50);
        expect(pt.y).toBeLessThanOrEqual(550);
      });
    }
  });
  test('x is strictly increasing', () => {
    for (let i = 20; i--;) {
      const p = G.generateRandomPath();
      for (let j = 1; j < p.length; j++)
        expect(p[j].x).toBeGreaterThan(p[j - 1].x);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Enemy
// ─────────────────────────────────────────────────────────────────────────────
describe('Enemy', () => {
  test('constructor wave 1', () => {
    const e = new G.Enemy(1);
    expect(e.health).toBeCloseTo(100, 0);
    expect(e.speed).toBeCloseTo(1.5, 1);
    expect(e.reward).toBe(20);
    expect(e.x).toBe(0);
    expect(e.y).toBe(100);
    expect(e.maxHealth).toBe(e.health);
  });
  test('scales with wave', () => {
    const e1 = new G.Enemy(1);
    expect(e1.health).toBeCloseTo(100, 0);
    expect(e1.speed).toBeCloseTo(1.5, 1);
    const e5 = new G.Enemy(5);
    const m = 2 * (1 + 4 * 0.15);
    expect(e5.health).toBeCloseTo(100 * m, 0);
    expect(e5.speed).toBeCloseTo(1.5 * m, 1);
  });
  test('types: fast', () => {
    const e = new G.Enemy(1, 'fast');
    expect(e.radius).toBe(8); expect(e.speed).toBe(2.5);
    expect(e.health).toBe(50); expect(e.reward).toBe(25);
  });
  test('types: tank', () => {
    const e = new G.Enemy(1, 'tank');
    expect(e.radius).toBe(18); expect(e.speed).toBeCloseTo(0.8, 1);
    expect(e.health).toBe(200); expect(e.reward).toBe(35);
  });
  test('types: flying', () => {
    const e = new G.Enemy(1, 'flying');
    expect(e.radius).toBe(10); expect(e.speed).toBe(2);
    expect(e.health).toBe(80); expect(e.reward).toBe(38);
  });
  test('boss overrides', () => {
    const e = new G.Enemy(1, 'boss');
    expect(e.radius).toBe(25); expect(e.speed).toBeCloseTo(0.5, 1);
    expect(e.health).toBe(1000); expect(e.reward).toBe(600);
    expect(e.boss).toBe(true);
  });
  test('update moves along path', () => {
    const e = new G.Enemy(1);
    const ox = e.x;
    e.update();
    expect(e.x).toBeGreaterThan(ox);
  });
  test('update advances pathIndex', () => {
    const e = new G.Enemy(1);
    for (let i = 140; i--;) e.update();
    expect(e.pathIndex).toBeGreaterThan(0);
  });
  test('reachEnd decrements lives at 0 => endGame', () => {
    G.lives = 1;
    new G.Enemy(1).reachEnd();
    expect(G.lives).toBe(0);
    expect(G.gameActive).toBe(false);
  });
  test('reachEnd decrements lives if still alive', () => {
    G.lives = 5;
    new G.Enemy(1).reachEnd();
    expect(G.lives).toBe(4);
    expect(G.gameActive).toBe(true);
  });
  test('takeDamage subtracts health', () => {
    const e = new G.Enemy(1);
    e.takeDamage(30);
    expect(e.health).toBeCloseTo(70, 0);
  });
  test('takeDamage awards reward on death', () => {
    G.money = 0;
    const e = new G.Enemy(1);
    e.takeDamage(e.health);
    expect(G.money).toBe(e.reward);
  });
  test('boss takeDamage awards reward', () => {
    G.money = 0;
    const e = new G.Enemy(1, 'boss');
    e.takeDamage(e.health);
    expect(G.money).toBe(e.reward);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Tower
// ─────────────────────────────────────────────────────────────────────────────
describe('Tower', () => {
  test('constructor', () => {
    const t = new G.Tower(300, 300, 1);
    expect(t.x).toBe(300); expect(t.y).toBe(300);
    expect(t.type).toBe(1);
    expect(t.stats).toEqual(G.towerTypes[1]);
    expect(t.cooldownTimer).toBe(0);
  });
  test('shoot creates projectile', () => {
    G.enemies.push(new G.Enemy(1));
    G.enemies[0].x = 400; G.enemies[0].y = 300;
    new G.Tower(300, 300, 1).shoot(G.enemies[0]);
    expect(G.projectiles.length).toBe(1);
    expect(G.projectiles[0].damage).toBe(20);
    G.enemies = []; G.projectiles = [];
  });
  test('update resets cooldown after shooting', () => {
    G.enemies.push(new G.Enemy(1));
    G.enemies[0].x = 400; G.enemies[0].y = 300;
    const t = new G.Tower(300, 300, 1);
    t.cooldownTimer = 0; t.update();
    expect(t.cooldownTimer).toBe(t.stats.cooldown);
    G.enemies = []; G.projectiles = [];
  });
  test('no shoot when out of range', () => {
    G.enemies.push(new G.Enemy(1));
    G.enemies[0].x = 800; G.enemies[0].y = 600;
    const t = new G.Tower(300, 300, 1);
    t.cooldownTimer = 0; t.update();
    expect(G.projectiles.length).toBe(0);
    G.enemies = []; G.projectiles = [];
  });
  test('cooldown decrements each frame', () => {
    const t = new G.Tower(300, 300, 1);
    t.cooldownTimer = 10; t.update();
    expect(t.cooldownTimer).toBe(9);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Projectile
// ─────────────────────────────────────────────────────────────────────────────
describe('Projectile', () => {
  test('constructor', () => {
    const e = new G.Enemy(1);
    const p = new G.Projectile(300, 300, e, G.towerTypes[1]);
    expect(p.x).toBe(300); expect(p.y).toBe(300);
    expect(p.target).toBe(e); expect(p.damage).toBe(20);
    expect(p.active).toBe(true);
  });
  test('update moves toward target', () => {
    const e = new G.Enemy(1); e.x = 400; e.y = 300;
    const p = new G.Projectile(300, 300, e, G.towerTypes[1]);
    const ox = p.x; p.update();
    expect(p.x).toBeGreaterThan(ox);
  });
  test('update hits target when close', () => {
    const e = new G.Enemy(1); e.x = 305; e.y = 300;
    const p = new G.Projectile(300, 300, e, G.towerTypes[1]);
    const hp = e.health; p.update();
    expect(p.active).toBe(false);
    expect(e.health).toBeLessThan(hp);
  });
  test('explode damages enemies in radius', () => {
    const e1 = new G.Enemy(1); e1.x = 200; e1.y = 200;
    const e2 = new G.Enemy(1); e2.x = 220; e2.y = 200;
    G.enemies = [e1, e2];
    const p = new G.Projectile(200, 200, e1, G.towerTypes[4]);
    p.explode();
    expect(e1.health).toBeLessThan(100);
    expect(e2.health).toBeLessThan(100);
    G.enemies = [];
  });
  test('explode respects radius', () => {
    const e1 = new G.Enemy(1); e1.x = 200; e1.y = 200;
    const e2 = new G.Enemy(1); e2.x = 500; e2.y = 500;
    const hp2 = e2.health;
    G.enemies = [e1, e2];
    new G.Projectile(200, 200, e1, G.towerTypes[4]).explode();
    expect(e2.health).toBe(hp2);
    G.enemies = [];
  });
  test('out of bounds deactivates', () => {
    const e = new G.Enemy(1); e.x = 900; e.y = 700;
    const p = new G.Projectile(300, 300, e, G.towerTypes[1]);
    for (let i = 100; i--;) p.update();
    expect(p.active).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Particle / FloatingText / PowerUp
// ─────────────────────────────────────────────────────────────────────────────
describe('Particle', () => {
  test('constructor and update', () => {
    const p = new G.Particle(100, 200, '#ff0');
    expect(p.x).toBe(100); expect(p.y).toBe(200);
    expect(p.color).toBe('#ff0'); expect(p.life).toBe(1.0);
    p.life = 0.5; p.update();
    expect(p.life).toBeCloseTo(0.45, 5);
  });
});

describe('FloatingText', () => {
  test('constructor and update', () => {
    const ft = new G.FloatingText(300, 200, '99', '#e74c3c');
    expect(ft.text).toBe('99'); expect(ft.color).toBe('#e74c3c');
    expect(ft.life).toBe(1.0);
    const oy = ft.y; ft.update();
    expect(ft.y).toBeLessThan(oy);
    expect(ft.life).toBeCloseTo(0.98, 5);
  });
});

describe('PowerUp', () => {
  test('random type is valid', () => {
    for (let i = 20; i--;) {
      expect(['heal','damage']).toContain(new G.PowerUp(100,100).type);
    }
  });
  test('life countdown', () => {
    const p = new G.PowerUp(100, 100);
    p.life = 1; p.update();
    expect(p.life).toBe(0); expect(p.active).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  createParticles / showFloatingText
// ─────────────────────────────────────────────────────────────────────────────
describe('createParticles()', () => {
  test('creates 8 particles', () => {
    G.particles = [];
    G.createParticles(200, 200, '#ff0');
    expect(G.particles.length).toBe(8);
  });
  test('uses given color', () => {
    G.particles = [];
    G.createParticles(200, 200, '#abc');
    G.particles.forEach(p => expect(p.color).toBe('#abc'));
  });
});

describe('showFloatingText()', () => {
  test('adds FloatingText', () => {
    G.floatingTexts = [];
    G.showFloatingText(200, 200, '+50', '#f1c40f');
    expect(G.floatingTexts.length).toBe(1);
    expect(G.floatingTexts[0].text).toBe('+50');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  getCanvasCoordinates
// ─────────────────────────────────────────────────────────────────────────────
describe('getCanvasCoordinates()', () => {
  function mockRect(l, t, w, h) {
    document.getElementById('gameCanvas').getBoundingClientRect = () =>
      ({ left: l, top: t, width: w, height: h });
  }
  test('mouse event', () => {
    mockRect(0, 0, 800, 600);
    const c = G.getCanvasCoordinates({ clientX: 400, clientY: 300 });
    expect(c.x).toBeCloseTo(400, 0); expect(c.y).toBeCloseTo(300, 0);
  });
  test('touch event', () => {
    mockRect(0, 0, 800, 600);
    const c = G.getCanvasCoordinates({ touches: [{ clientX: 200, clientY: 150 }] });
    expect(c.x).toBeCloseTo(200, 0); expect(c.y).toBeCloseTo(150, 0);
  });
  test('scales with CSS size', () => {
    mockRect(0, 0, 400, 300);
    const c = G.getCanvasCoordinates({ clientX: 200, clientY: 150 });
    expect(c.x).toBeCloseTo(400, 0); expect(c.y).toBeCloseTo(300, 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  selectTower
// ─────────────────────────────────────────────────────────────────────────────
describe('selectTower()', () => {
  test('updates selectedTowerType', () => {
    G.selectTower(2);
    expect(G.selectedTowerType).toBe(2);
  });
  test('highlights correct button', () => {
    G.selectTower(3);
    expect(document.getElementById('btn-tower3').classList.contains('active')).toBe(true);
  });
  test('deselects others', () => {
    G.selectTower(1);
    G.selectTower(4);
    expect(document.getElementById('btn-tower1').classList.contains('active')).toBe(false);
    expect(document.getElementById('btn-tower4').classList.contains('active')).toBe(true);
  });
  test('invalid type does not crash', () => {
    expect(() => G.selectTower(99)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  togglePause
// ─────────────────────────────────────────────────────────────────────────────
describe('togglePause()', () => {
  test('toggles paused state', () => {
    G.paused = false; G.togglePause();
    expect(G.paused).toBe(true);
    G.togglePause();
    expect(G.paused).toBe(false);
  });
  test('updates button text', () => {
    G.paused = false; G.togglePause();
    expect(document.getElementById('btn-pause').innerText).toBe('Resume');
    G.togglePause();
    expect(document.getElementById('btn-pause').innerText).toBe('Pause');
  });
  test('does nothing when game not active', () => {
    G.gameActive = false; G.paused = false;
    G.togglePause();
    expect(G.paused).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  toggleSound
// ─────────────────────────────────────────────────────────────────────────────
describe('toggleSound()', () => {
  test('toggles soundEnabled', () => {
    G.soundEnabled = false; G.toggleSound();
    expect(G.soundEnabled).toBe(true);
    G.toggleSound();
    expect(G.soundEnabled).toBe(false);
  });
  test('updates UI', () => {
    G.soundEnabled = false;
    G.toggleSound();
    expect(document.getElementById('btn-sound').innerText).toBe('Sound: ON');
    expect(document.getElementById('settings-sound').innerText).toBe('ON');
    G.toggleSound();
    expect(document.getElementById('btn-sound').innerText).toBe('Sound: OFF');
    expect(document.getElementById('settings-sound').innerText).toBe('OFF');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  clearTowers
// ─────────────────────────────────────────────────────────────────────────────
describe('clearTowers()', () => {
  test('removes all towers', () => {
    G.towers.push(new G.Tower(100, 100, 1), new G.Tower(200, 200, 2));
    G.money = 0;
    G.clearTowers();
    expect(G.towers.length).toBe(0);
    expect(G.money).toBe(0);
  });
  test('empty towers does not error', () => {
    G.towers = [];
    expect(() => G.clearTowers()).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  startWave
// ─────────────────────────────────────────────────────────────────────────────
describe('startWave()', () => {
  beforeEach(() => {
    G.spawning = false; G.waveActive = false;
    G.enemies = []; G.enemiesToSpawn = 0; G.wave = 1;
  });
  test('sets waveActive and spawning true', () => {
    G.startWave();
    expect(G.waveActive).toBe(true);
    expect(G.spawning).toBe(true);
  });
  test('enemiesToSpawn based on wave', () => {
    G.wave = 1; G.startWave();
    expect(G.enemiesToSpawn).toBe(8);
  });
  test('idempotent when active', () => {
    G.waveActive = true;
    G.startWave();
    expect(G.spawning).toBe(false);
  });
  test('spawns enemies over time', () => {
    G.startWave();
    expect(G.enemies.length).toBe(0);
    jest.advanceTimersByTime(1000);
    expect(G.enemies.length).toBe(1);
    expect(G.enemiesToSpawn).toBe(7);
    jest.advanceTimersByTime(1000);
    expect(G.enemies.length).toBe(2);
  });
  test('stops spawning after all enemies', () => {
    G.startWave();
    jest.advanceTimersByTime((G.enemiesToSpawn + 1) * 1000);
    expect(G.spawning).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  endGame
// ─────────────────────────────────────────────────────────────────────────────
describe('endGame()', () => {
  test('deactivates game, shows overlay, disables wave btn', () => {
    G.gameActive = true;
    document.getElementById('game-over').style.display = 'none';
    G.endGame();
    expect(G.gameActive).toBe(false);
    expect(document.getElementById('game-over').style.display).toBe('block');
    expect(document.getElementById('btn-wave').disabled).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  handleInput
// ─────────────────────────────────────────────────────────────────────────────
describe('handleInput()', () => {
  function mockEvt(cx, cy) {
    return { clientX: cx, clientY: cy, preventDefault: jest.fn() };
  }
  function mockRect() {
    document.getElementById('gameCanvas').getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 800, height: 600 });
  }
  beforeEach(() => {
    G.gameActive = true; G.paused = false;
    G.money = 500; G.towers = [];
  });
  test('places tower on empty ground', () => {
    mockRect();
    // (500,400) is away from the path (closest segment is 100+ px away)
    G.handleInput(mockEvt(500, 400));
    expect(G.towers.length).toBe(1);
    expect(G.towers[0].x).toBeCloseTo(500, 0);
    expect(G.towers[0].y).toBeCloseTo(400, 0);
  });
  test('does not place on path', () => {
    mockRect();
    G.handleInput(mockEvt(0, 100));
    expect(G.towers.length).toBe(0);
  });
  test('does not place when broke', () => {
    mockRect(); G.money = 0;
    G.handleInput(mockEvt(400, 300));
    expect(G.towers.length).toBe(0);
  });
  test('does nothing when paused', () => {
    mockRect(); G.paused = true;
    G.handleInput(mockEvt(400, 300));
    expect(G.towers.length).toBe(0);
  });
  test('does nothing when game inactive', () => {
    mockRect(); G.gameActive = false;
    G.handleInput(mockEvt(400, 300));
    expect(G.towers.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  saveGame / loadGame
// ─────────────────────────────────────────────────────────────────────────────
describe('saveGame / loadGame', () => {
  beforeEach(() => {
    G.localStorage.clear();
    G.money = 999; G.lives = 15; G.wave = 7;
    G.towers = [new G.Tower(100, 100, 1), new G.Tower(200, 200, 2)];
    G.enemies = []; G.waveActive = true;
    G.paused = false; G.selectedTowerType = 3;
  });
  test('saveGame persists to localStorage', () => {
    G.saveGame();
    const data = JSON.parse(G.localStorage.getItem('towerDefenseSave'));
    expect(data.money).toBe(999); expect(data.lives).toBe(15);
    expect(data.wave).toBe(7); expect(data.towers.length).toBe(2);
  });
  test('loadGame restores state', () => {
    G.saveGame();
    G.money = 0; G.lives = 0; G.wave = 1;
    G.towers = []; G.selectedTowerType = 1;
    expect(G.loadGame()).toBe(true);
    expect(G.money).toBe(999); expect(G.lives).toBe(15);
    expect(G.wave).toBe(7); expect(G.towers.length).toBe(2);
  });
  test('loadGame false when no save', () => {
    G.localStorage.clear();
    expect(G.loadGame()).toBe(false);
  });
  test('loadGame false on corrupted data', () => {
    G.localStorage.setItem('towerDefenseSave', 'garbage');
    expect(G.loadGame()).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  updateUI
// ─────────────────────────────────────────────────────────────────────────────
describe('updateUI()', () => {
  test('reflects current state', () => {
    G.lives = 7; G.money = 350; G.wave = 4;
    G.updateUI();
    expect(document.getElementById('lives').innerText).toBe(7);
    expect(document.getElementById('money').innerText).toBe(350);
    expect(document.getElementById('wave').innerText).toBe(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  towerTypes
// ─────────────────────────────────────────────────────────────────────────────
describe('towerTypes', () => {
  test('all 4 defined', () => {
    expect(Object.keys(G.towerTypes).length).toBe(4);
    expect(G.towerTypes[1].name).toBe('Basic');
    expect(G.towerTypes[2].name).toBe('Sniper');
    expect(G.towerTypes[3].name).toBe('Rapid');
    expect(G.towerTypes[4].name).toBe('AOE');
  });
  test('costs', () => {
    expect(G.towerTypes[1].cost).toBe(50);
    expect(G.towerTypes[2].cost).toBe(120);
    expect(G.towerTypes[3].cost).toBe(80);
    expect(G.towerTypes[4].cost).toBe(150);
  });
  test('damage types', () => {
    expect(G.towerTypes[1].damageType).toBe('single');
    expect(G.towerTypes[2].damageType).toBe('single');
    expect(G.towerTypes[3].damageType).toBe('single');
    expect(G.towerTypes[4].damageType).toBe('area');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Edge cases
// ─────────────────────────────────────────────────────────────────────────────
describe('edge cases', () => {
  test('tower at map boundary', () => {
    const t = new G.Tower(0, 0, 1);
    expect(t.x).toBe(0); expect(t.y).toBe(0);
  });
  test('many towers', () => {
    for (let i = 10; i--;) G.towers.push(new G.Tower(100 + i * 20, 300, 1));
    expect(G.towers.length).toBe(10);
  });
  test('enemy mutation during iteration', () => {
    const e = new G.Enemy(1); e.health = 0;
    G.enemies = [e];
    for (let i = G.enemies.length - 1; i >= 0; i--)
      if (G.enemies[i].health <= 0) G.enemies.splice(i, 1);
    expect(G.enemies.length).toBe(0);
  });
  test('wave progression', () => {
    G.wave = 1; G.waveActive = true;
    G.enemies = []; G.spawning = false;
    if (G.enemies.length === 0 && !G.spawning && G.waveActive) {
      G.waveActive = false; G.wave++;
    }
    expect(G.wave).toBe(2);
  });
});
