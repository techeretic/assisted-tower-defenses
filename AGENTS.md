# Agent instructions — Assisted Tower Defenses

## Overview

This repo is a **minimal, single-file browser game** with a **unit-test suite**. All gameplay, rendering, styles, and UI live in one HTML file. The game needs no package manager or build step — Jest is used only for testing.

**Canonical source file:** `tower_defense.html`

## How to run and verify

| Action | Command |
|--------|---------|
| Open game (macOS) | `open tower_defense.html` |
| Local static server | `python3 -m http.server 8080` then open `http://localhost:8080/tower_defense.html` |
| Run automated tests (76) | `npm test` |

After changes, run `npm test` then play-test manually to confirm: tower placement (mouse + touch), wave start/clear, money/lives UI, game over overlay, pause/resume, save/load, settings toggle, and that canvas clicks map correctly when the window is resized.

## Architecture (inside the HTML file)

```
<head>     — meta, title, all CSS
<body>     — h1, hints, #game-container (canvas + settings + #game-over), #ui-bar (stats + buttons)
<script>   — entire game engine
```

### Logical modules (all in one `<script>` block)

| Area | Symbols / IDs | Notes |
|------|----------------|-------|
| Canvas | `#gameCanvas`, `ctx`, fixed `800×600` logic size | Display scaled via CSS; do not change `canvas.width`/`height` at runtime without resetting state |
| Map | `path[]` waypoint segments, `gamePaths[]` for dynamic paths | Enemies follow waypoints; `isOnPath()` blocks tower placement within ~30px of path |
| Towers | `towerTypes`, `Tower`, `selectTower()` | Types `1` (Basic), `2` (Sniper), `3` (Rapid), `4` (AOE); stats: cost, range, damage, cooldown, color, projSpeed, damageType |
| Combat | `Enemy`, `Projectile`, `Particle`, `FloatingText` | `requestAnimationFrame` loop in `gameLoop()` |
| Waves | `startWave()`, `wave`, `waveActive`, `spawning` | Spawns `5 + wave * 2` enemies at 1s intervals; boss waves every 10 waves |
| Power-ups | `PowerUp`, `powerups[]` | 3 types: money (+50), heal (+5 lives), damage ( AoE burst) |
| Input | `handleInput`, `getCanvasCoordinates` | `mousedown` + `touchstart` (passive: false); must scale click coords to logic pixels |
| UI | `updateUI()`, `endGame()`, button handlers | Some handlers use inline `onclick` / `ontouchstart` in HTML |

### Game loop order

1. `drawPath()` → update/draw towers → enemies → projectiles → particles → powerups → floating text  
2. When `enemies.length === 0 && !spawning && waveActive`, increment `wave` and re-enable **Start Wave**

### Global state (top-level `let` bindings)

`money`, `lives`, `wave`, `gameActive`, `paused`, `enemies`, `towers`, `projectiles`, `particles`, `powerups`, `floatingTexts`, `gamePaths`, `selectedTowerType`, `enemiesToSpawn`, `spawning`, `waveActive`, `soundEnabled`, `settingsOpen`, `audioCtx`

## Conventions for edits

- **Keep it single-file** unless the user explicitly asks to split into modules or add a build pipeline.
- **Preserve mobile behavior:** `touch-action: none` on `body`, `getCanvasCoordinates()` for touch/mouse, `preventDefault()` in `handleInput`, and both touch + click on tower/wave buttons.
- **Coordinate system:** Game logic always uses 800×600; map `clientX/Y` through `getCanvasCoordinates()` for any new pointer input.
- **Path and placement:** New towers must respect `isOnPath()` (or update that helper if the path changes).
- **Balance tweaks:** Prefer editing `towerTypes` and `Enemy` constructor scaling (`waveDifficulty`) before scattering magic numbers.
- **Styling:** Game CSS is in `<style>` in the same file; match existing color tokens (e.g. `#3498db`, `#e74c3c`, `#f1c40f`).
- **Audio:** Use `playSound(type)` for sound effects and `vibrate(duration)` for haptic feedback on mobile.

## Known quirks (do not "fix" without intent)

- Page `<h1>` text is ` defenses` (leading space, incomplete title)—may be intentional WIP.
- `resizeCanvas()` sets CSS size only; internal resolution stays 800×600 by design.
- Dead enemies are removed in the loop when `health <= 0`; rewards are applied in `takeDamage()`.
- Restart uses `location.reload()` on the game-over button.
- Sound requires user interaction to initialize (Web Audio API autoplay policy).

## Guardrails

- **Minimize scope:** This is a small hobby project; avoid introducing frameworks, npm, or large refactors unless requested.
- **No secrets:** Nothing to configure; do not add API keys or env files.
- **No test churn:** Do not add trivial test scaffolding unless the user asks. The existing tests in `__tests__/game.test.js` should be sufficient; only add new test files when introducing new functionality.
- **Filename:** The dated HTML filename is the deployed artifact; if renaming, update README and any docs that reference it.

## When to add `.cursor/rules/`

Use scoped `.cursor/rules/*.mdc` only if the project grows (multiple files, build, or strict style policies). For now, this `AGENTS.md` plus the HTML source is sufficient context.

## Related docs

- Human-oriented overview: `README.md`
- Remote: https://github.com/techeretic/assisted-tower-defenses (default branch: `main`)
