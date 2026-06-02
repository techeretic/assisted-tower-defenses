package com.towerdefense

import android.content.Context
import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject

class ScoreStore(context: Context) {
    private val prefs = context.getSharedPreferences("highscores", Context.MODE_PRIVATE)

    @JavascriptInterface
    fun saveHighScore(json: String) {
        val entry = JSONObject(json)
        val scores = JSONArray(getHighScoresRaw())
        scores.put(entry)
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
    fun clearHighScores() {
        prefs.edit().remove("scores").apply()
    }

    private fun getHighScoresRaw(): String = getHighScores()
}
