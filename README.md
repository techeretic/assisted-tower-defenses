# Assisted Tower Defenses

A single-file, mobile-friendly tower defense game built with HTML5 Canvas and vanilla JavaScript. No build step, dependencies, or backend—open the HTML file in a browser to play.

## Play locally

```bash
open tower_defense.html
```

Or serve the directory and open the file in your browser:

```bash
python3 -m http.server 8080
# Then visit http://localhost:8080/tower_defense.html
```

## How to play

1. **Select a tower type** from the controls at the bottom
2. **Place towers** by tapping or clicking empty ground (not on the brown path)
3. **Start waves** to spawn enemies; clear each wave to advance
4. **Collect power-ups** (money, heal, damage) that spawn on enemy death
5. Enemies that reach the end cost one life. The game ends at 0 lives.

## Features

- **4 tower types** with different stats:
  - Basic (balanced range/damage)
  - Sniper (long range, high damage, slow fire rate)
  - Rapid (short range, fast fire rate, low damage)
  - AOE (short range, area damage on impact)
- **4 enemy variations**: Normal, Fast, Tank, Flying
- **Boss enemies** every 10 waves with special visuals and rewards
- **Power-ups** (money, heal, damage) spawn randomly on enemy death
- **5 paths** that regenerate randomly every 5 waves
- **Pause/Resume** functionality
- **Save/Load** game state via localStorage
- **Sound effects** (Web Audio API)
- **Vibration feedback** on mobile devices
- **Touch and mouse input** with coordinate scaling for responsive layout
- **Floating damage numbers** and particle effects

## Project layout

| File | Description |
|------|-------------|
| `05302026_tower_defense_q3_coder_next.html` | Entire game: markup, styles, and logic |
| `AGENTS.md` | Instructions for AI coding agents working in this repo |

## Tech stack

- HTML5 `<canvas>` (internal resolution 800×600)
- Vanilla ES6 classes (`Enemy`, `Tower`, `Projectile`, `Particle`, `PowerUp`, `FloatingText`)
- Web Audio API for sound effects
- localStorage for save/load functionality
- CSS for mobile layout (`touch-action`, responsive container, 4:3 aspect ratio)

## Repository

https://github.com/techeretic/assisted-tower-defenses
