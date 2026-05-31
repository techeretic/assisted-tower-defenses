# Tower Defense Game - Requirements Specification

## Overview
A single-file HTML5 tower defense game played in the browser.

## Core Gameplay Mechanics

### 1. Map / Path
- **Fixed path**: A single brown path from left (start) to right (end)
- Path waypoints: (0,100) → (200,100) → (200,400) → (400,400) → (400,200) → (600,200) → (600,500) → (800,500)
- Path width: ~40px
- Path color: #5d4037 (dark brown)
- **Path zone**: Cannot place towers within 30px of any path segment

### 2. Towers
4 tower types available:

| Type | Cost | Range | Damage | Cooldown | Color | Speed | Special |
|------|------|-------|--------|----------|-------|-------|---------|
| 1. Basic | $50 | 150px | 20 | 40 frames | Blue (#3498db) | 7 | Single target |
| 2. Sniper | $120 | 300px | 100 | 120 frames | Red (#e74c3c) | 15 | Single target, long range |
| 3. Rapid | $80 | 120px | 10 | 15 frames | Orange (#f39c12) | 10 | Single target, fast fire |
| 4. AOE | $150 | 100px | 30 | 60 frames | Purple (#9b59b6) | 5 | Area burst on hit |

**Display**:Tower body is gray square with colored circle and barrel pointing at target

### 3. Enemies
Enemies scale with difficulty: `enemiesToSpawn = 5 + (wave * 3)`, +15% HP/speed per wave

**Enemy Types:**
- **Normal**: Speed 1.5, HP 100*diff, Reward 15+(wave*5), Radius 12, Purple circle
- **Fast**: Speed 2.5, HP 50*diff, Reward 20+(wave*5), Radius 8, Blue triangle
- **Tank**: Speed 0.8, HP 200*diff, Reward 25+(wave*10), Radius 18, Red tank with border
- **Flying**: Speed 2.0, HP 80*diff, Reward 30+(wave*8), Radius 10, Blue circle with wings
- **Boss**: Speed 0.5, HP 1000*diff, Reward 500+(wave*100), Radius 25, Red with "BOSS" label (every 10th wave)

### 4. Game Flow
1. Player selects tower + places on empty ground
2. Press "Start Wave" button → spawns enemies over 1 second intervals
3. Enemies move along path, towers shoot nearest within range
4. Enemies reaching end cost 1 life
5. Wave clear when `enemies.length === 0 && !spawning && waveActive`
6. Game over when lives reach 0
7. **Difficulty scaling**: Each wave increases enemy HP/speed by 15%, adds 1 more enemy per wave

### 5. UI Elements
**Top Bar** (top-right of canvas or separate):
- Lives: 20 (red)
- Money: $100 (yellow)
- Wave: 1

**Bottom Bar** (controls):
- Tower buttons (Basic $50, Sniper $120, Rapid $80, AOE $150)
- Start Wave button
- Pause/Resume button
- Sound toggle button
- Save button
- Clear towers button
- Settings button (sound toggle in overlay)

**Overlay**:
- Settings menu with sound toggle
- Game over screen with "Play Again" button

### 6. Visual Effects
- **Particles**: 8 particles explosion on kill
- **Floating damage text**: White number above enemy when hit (only show every 500ms)
- **Power-ups**: 20% chance on enemy death
  - Money: +$50, Yellow box with "$"
  - Heal: +5 lives, Green box with "+"
  - Damage: AoE 25 damage, Red box with "B"

### 7. Audio
Use Web Audio API (require user interaction to initialize):
- Shoot: 800Hz sine → 200Hz, 0.1s, volume 0.1
- Enemy hit: 400Hz square, 0.1s, volume 0.05
- Explosion: 100Hz sawtooth → 50Hz, 0.3s, volume 0.2
- Wave start: 400→600→800Hz triangle, 0.4s, volume 0.1
- Vibration on hit (50ms) and explosion (200ms)

### 8. Persistence
- Save game state to localStorage
- Load on startup if available

### 9. Input Handling
- **Mouse**: click on canvas
- **Touch**: tap on canvas
- **Coordinate scaling**: Map clientX/Y to 800x600 logic pixels
- `e.preventDefault()` to prevent default touch actions

### 10. Technical Requirements
- Canvas internal resolution: 800x600 pixels
- Display scaled via CSS
- Fixed aspect ratio 4:3
- Responsive container (max-width: 800px)
- touch-action: none on body to prevent scrolling

### 11. Code Structure (all in single HTML file)
- `<head>`: meta, title, CSS styles
- `<body>`: h1, #game-container (canvas + game-over), #ui-bar (stats + buttons)
- `<script>`: Game engine with ES6 classes

### 12. Game Loop Order
1. Clear canvas
2. Draw path
3. Update & draw towers
4. Update & draw enemies (remove if dead)
5. Update & draw projectiles (remove if inactive)
6. Update & draw particles (remove if expired)
7. Update & draw powerups (remove if expired, trigger on contact)
8. Check wave completion → increment wave, re-enable Start Wave
9. requestAnimationFrame for next frame
