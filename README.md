# Assisted Tower Defenses

A single-file, mobile-friendly tower defense game built with HTML5 Canvas and vanilla JavaScript. No build step, dependencies, or backend—open the HTML file in a browser to play.

## Play locally

```bash
open 05302026_tower_defense_q3_coder_next.html
```

Or serve the directory and open the file in your browser:

```bash
python3 -m http.server 8080
# Then visit http://localhost:8080/05302026_tower_defense_q3_coder_next.html
```

## How to play

1. Select **Basic Tower** ($50) or **Sniper Tower** ($120).
2. Tap or click empty ground (not on the brown path) to place a tower.
3. Press **Start Wave** to spawn enemies. Clear the wave to advance; each wave increases enemy health, speed, and rewards.
4. Enemies that reach the end of the path cost one life. The game ends at 0 lives.

## Features

- Two tower types with different range, damage, fire rate, and projectile speed
- Wave-based spawning with scaling difficulty
- Touch and mouse input with coordinate scaling for responsive layout
- Particle effects on kills and heavy hits

## Project layout

| File | Description |
|------|-------------|
| `05302026_tower_defense_q3_coder_next.html` | Entire game: markup, styles, and logic |
| `AGENTS.md` | Instructions for AI coding agents working in this repo |

## Tech stack

- HTML5 `<canvas>` (internal resolution 800×600)
- Vanilla ES6 classes (`Enemy`, `Tower`, `Projectile`, `Particle`)
- CSS for mobile layout (`touch-action`, responsive container, 4:3 aspect ratio)

## Repository

https://github.com/techeretic/assisted-tower-defenses
