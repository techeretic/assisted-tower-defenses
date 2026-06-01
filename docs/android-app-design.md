# Android App: Tower Defense Game — Technical Design

## 1. Overview

Wrap the existing single-file HTML5 game (`tower_defense.html`) into a native Android app using a **WebView** with minimal changes to game code. The app will:

- Play the full game in a fullscreen, landscape WebView
- Save **composite high scores** locally on-device
- Display high scores on the game-over screen

**Distribution:** Personal/sideload (APK or AAB). No Play Store requirements.

---

## 2. Architecture

```
┌──────────────────────────────────────────────┐
│              Android App (Kotlin)             │
│                                                │
│  ┌────────────┐   ┌─────────────────────────┐ │
│  │ MainActivity│──>│      WebView            │ │
│  │ (Fullscreen,│   │  loads tower_defense.html│ │
│  │  Landscape) │   │  from assets/            │ │
│  └──────┬─────┘   └────────┬────────────────┘ │
│         │                  │                    │
│         │    JS Bridge     │                    │
│         │  addJavascript   │                    │
│         │  Interface()     │                    │
│         ▼                  ▼                    │
│  ┌─────────────────────────────────────────┐   │
│  │      ScoreStore (AndroidInterface)       │   │
│  │  - saveHighScore(name, score, wave, ...) │   │
│  │  - getHighScores(): JSON array           │   │
│  │  - clearHighScores()                     │   │
│  │  Backed by SharedPreferences (JSON)      │   │
│  └─────────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
         ▲ JS calls via
         │ AndroidScoreStore.saveHighScore(...)
         │
┌────────┴──────────────────────────────────────┐
│         tower_defense.html (modified)          │
│                                                │
│  New in game-over flow:                        │
│  1. Calculate composite score                  │
│  2. Call Android bridge to save                │
│  3. Display high scores on overlay             │
│  4. Show "New High Score!" if applicable       │
└───────────────────────────────────────────────┘
```

---

## 3. Android App Structure

```
TowerDefenseApp/
├── app/
│   ├── build.gradle.kts          # Min SDK 24, Target 34, Compose/Kotlin
│   └── src/main/
│       ├── AndroidManifest.xml    # Fullscreen, landscape, no title bar
│       ├── assets/
│       │   └── tower_defense.html # (modified) game file
│       ├── java/com/towerdefense/
│       │   ├── MainActivity.kt       # WebView setup + fullscreen
│       │   └── ScoreStore.kt         # @JavascriptInterface bridge
│       └── res/
│           └── values/
│               └── themes.xml        # No action bar theme
├── build.gradle.kts
├── settings.gradle.kts
└── gradle.properties
```

### 3.1 AndroidManifest.xml — Key config

| Setting | Value | Why |
|---------|-------|-----|
| `screenOrientation` | `sensorLandscape` | Force landscape, follow device rotation |
| `android:theme` | `@android:style/Theme.NoTitleBar.Fullscreen` | No status bar |
| `android:configChanges` | `orientation\|screenSize\|screenLayout\|keyboardHidden` | Prevent WebView recreation on rotation |
| `android:hardwareAccelerated` | `true` | Required for smooth Canvas rendering in WebView |

### 3.2 MainActivity.kt — WebView setup

Uses `SYSTEM_UI_FLAG_*` constants (deprecated in API 30+ but functional) for fullscreen/immersive. For a production app targeting API 30+, replace with `WindowInsetsController` API.

```kotlin
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
            View.SYSTEM_UI_FLAG_FULLSCREEN or
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
        )

        val webView = WebView(this)
        setContentView(webView)

        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            loadWithOverviewMode = true
            useWideViewPort = true
            setAppCacheEnabled(true)
        }

        webView.overScrollMode = WebView.OVER_SCROLL_NEVER
        webView.addJavascriptInterface(ScoreStore(this), "AndroidScoreStore")
        webView.webChromeClient = WebChromeClient()

        webView.loadUrl("file:///android_asset/tower_defense.html")
    }
}
```

### 3.3 ScoreStore.kt — JS bridge

```kotlin
class ScoreStore(context: Context) {
    private val prefs = context.getSharedPreferences("highscores", Context.MODE_PRIVATE)

    @JavascriptInterface
    fun saveHighScore(json: String) {
        val entry = JSONObject(json)
        val scores = JSONArray(getHighScoresRaw())
        scores.put(entry)
        // Sort descending by score, keep top 10
        val sorted = (0 until scores.length())
            .map { scores.getJSONObject(it) }
            .sortedByDescending { it.getInt("score") }
            .take(10)
        val trimmed = JSONArray(sorted)
        prefs.edit().putString("scores", trimmed.toString()).apply()
    }

    @JavascriptInterface
    fun getHighScores(): String = prefs.getString("scores", "[]") ?: "[]"

    @JavascriptInterface
    fun clearHighScores() { prefs.edit().remove("scores").apply() }

    private fun getHighScoresRaw(): String = getHighScores()
}
```

---

## 4. Game Modifications (tower_defense.html)

### 4.1 New tracking variables

Add alongside existing globals (`money`, `lives`, `wave`):

```javascript
let totalMoneyEarned = 0;    // accumulates all money gained (kills, power-ups, interest)
let enemiesKilled = 0;       // total enemies killed this game
```

### 4.2 Integrate tracking into existing code

| Location | Change |
|----------|--------|
| `enemy` death check (`health <= 0` in game loop) | `enemiesKilled++` |
| `money += enemy.reward` (at death) | also add to `totalMoneyEarned += enemy.reward` |
| `money += 50` (money power-up) | also `totalMoneyEarned += 50` |
| `money += 25` (clear towers refund) | also `totalMoneyEarned += 25` |

### 4.3 Composite score formula

```javascript
function calculateScore(wave, totalMoneyEarned, enemiesKilled) {
    return (wave * 1000) + (totalMoneyEarned * 2) + (enemiesKilled * 50);
}
```

Weights:
- Wave progression is the primary achievement (1000 pts/wave)
- Economy management is secondary (2 pts per $1 earned)
- Combat efficiency is tertiary (50 pts per kill)

### 4.4 Modified game-over flow

In `endGame()`:

```javascript
function endGame() {
    gameActive = false;
    const score = calculateScore(wave, totalMoneyEarned, enemiesKilled);

    // Try to save via Android bridge; fallback to localStorage
    if (window.AndroidScoreStore) {
        const entry = JSON.stringify({
            score: score,
            wave: wave,
            money: totalMoneyEarned,
            kills: enemiesKilled,
            date: new Date().toISOString().split('T')[0]
        });
        const existing = JSON.parse(window.AndroidScoreStore.getHighScores());
        const isNewHigh = existing.length === 0 || score > existing[0].score;

        window.AndroidScoreStore.saveHighScore(entry);
        const allScores = JSON.parse(window.AndroidScoreStore.getHighScores());

        document.getElementById('final-score').innerHTML =
            `<div style="font-size:1.3rem; margin-bottom:8px;">
                Score: <strong style="color:#f1c40f;">${score}</strong>
                ${isNewHigh ? '<span style="color:#e74c3c;"> ★ NEW BEST!</span>' : ''}
            </div>
            <div style="font-size:0.9rem; color:#bbb; margin-bottom:12px;">
                Wave ${wave} · $${totalMoneyEarned} earned · ${enemiesKilled} kills
            </div>
            <div style="font-size:1rem; margin-top:10px;">
                <strong style="color:#3498db;">High Scores</strong>
            </div>
            <div style="font-size:0.85rem; margin-top:6px;">
                ${allScores.slice(0, 5).map((s, i) =>
                    `<div style="padding:3px 0;">
                        ${i+1}. ${s.score} pts — Wave ${s.wave}
                        <span style="color:#666;">(${s.date})</span>
                    </div>`
                ).join('')}
            </div>`;
    }

    document.getElementById('game-over').style.display = 'block';
    document.getElementById('btn-wave').disabled = true;
}
```

### 4.5 High score persistence fallback

When running in a browser (not Android), fall back to localStorage for high scores so the feature works during development and in the browser:

```javascript
if (!window.AndroidScoreStore) {
    window.AndroidScoreStore = {
        getHighScores: function() {
            return localStorage.getItem('towerDefenseHighScores') || '[]';
        },
        saveHighScore: function(json) {
            const scores = JSON.parse(this.getHighScores());
            scores.push(JSON.parse(json));
            scores.sort((a, b) => b.score - a.score);
            const trimmed = scores.slice(0, 10);
            localStorage.setItem('towerDefenseHighScores', JSON.stringify(trimmed));
        },
        clearHighScores: function() {
            localStorage.removeItem('towerDefenseHighScores');
        }
    };
}
```

---

## 5. High Score Storage Schema

Stored as JSON array in SharedPreferences (key: `"scores"`):

```json
[
  {
    "score": 12350,
    "wave": 12,
    "money": 1575,
    "kills": 84,
    "date": "2026-06-01"
  },
  ...
]
```

- Max 10 entries, sorted descending by `score`
- Oldest entry dropped when exceeding the limit
- Each new entry is inserted in sorted position

---

## 6. Build & Run

```bash
# Prerequisites: Android Studio Hedgehog+ or command-line build tools
# No package manager or build system needed for the HTML game itself

# Clone or copy project
# Open in Android Studio
# Build signed APK:
./gradlew assembleRelease
# APK at: app/build/outputs/apk/release/app-release.apk
```

No keystore is needed for sideload installs; a debug build works for personal use.

---

## 7. Files Changed

| File | Change |
|------|--------|
| `tower_defense.html` | Add high-score JS bridge code, tracking vars, modified `endGame()` |
| **New:** `MainActivity.kt` | WebView setup, fullscreen, JS bridge injection |
| **New:** `ScoreStore.kt` | `@JavascriptInterface` class for data persistence |
| **New:** `AndroidManifest.xml` | Landscape, fullscreen, no title, WebView config |
| **New:** `build.gradle.kts` (x2) | App + project-level Gradle config, compile SDK 34 |
| **New:** `settings.gradle.kts` | Project module settings |

---

## 8. Future Enhancements (not in scope)

- **Native launcher screen** — Android Activity showing high scores before loading game
- **Cloud save / Google Play Games** — REST API for leaderboards
- **Achievements** — via Play Games Services or local logic (e.g., "Reach wave 20")
- **Game controller support** — Map Bluetooth keyboard/gamepad to game actions
- **Customizable controls** — Tower selection via touch buttons on native overlay instead of HTML buttons
- **Theme / Dark mode** — Android-native theme toggle
