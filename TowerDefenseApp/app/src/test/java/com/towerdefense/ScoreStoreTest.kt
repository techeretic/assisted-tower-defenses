package com.towerdefense

import android.content.Context
import android.content.SharedPreferences
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.ArgumentCaptor
import org.mockito.ArgumentMatchers.anyString
import org.mockito.Mockito.`when`
import org.mockito.Mockito.mock
import org.mockito.Mockito.times
import org.mockito.Mockito.verify

class ScoreStoreTest {

    private lateinit var prefs: SharedPreferences
    private lateinit var editor: SharedPreferences.Editor
    private lateinit var store: ScoreStore

    @Before
    fun setUp() {
        prefs = mock(SharedPreferences::class.java)
        editor = mock(SharedPreferences.Editor::class.java)
        val context = mock(Context::class.java)

        `when`(context.getSharedPreferences("highscores", Context.MODE_PRIVATE)).thenReturn(prefs)
        `when`(prefs.edit()).thenReturn(editor)
        `when`(editor.putString(anyString(), anyString())).thenReturn(editor)
        `when`(editor.remove(anyString())).thenReturn(editor)

        store = ScoreStore(context)
    }

    @Test
    fun `getHighScores returns empty array when no scores saved`() {
        `when`(prefs.getString("scores", "[]")).thenReturn("[]")
        assertEquals("[]", store.getHighScores())
    }

    @Test
    fun `saveHighScore stores a single entry`() {
        `when`(prefs.getString("scores", "[]")).thenReturn("[]")

        store.saveHighScore("""{"score":100,"wave":5,"kills":10,"money":50}""")

        val captor = ArgumentCaptor.forClass(String::class.java)
        verify(editor).putString(anyString(), captor.capture())
        val saved = captor.value
        assertTrue(saved.contains("\"score\":100"))
        assertTrue(saved.contains("\"wave\":5"))
    }

    @Test
    fun `saveHighScore keeps at most 10 entries`() {
        `when`(prefs.getString("scores", "[]")).thenReturn("[]")

        repeat(12) {
            store.saveHighScore("""{"score":${it + 1},"wave":${it + 1},"kills":0,"money":0}""")
            val saved = captureCurrentSaved()
            `when`(prefs.getString("scores", "[]")).thenReturn(saved)
        }

        val allsaved = captureAllSaved()
        val lastSaved = allsaved.last()
        val parsed = org.json.JSONArray(lastSaved)
        assertTrue("Should have at most 10 entries, got ${parsed.length()}", parsed.length() <= 10)
    }

    @Test
    fun `saveHighScore sorts descending by score`() {
        `when`(prefs.getString("scores", "[]")).thenReturn("[]")

        store.saveHighScore("""{"score":50,"wave":1,"kills":5,"money":20}""")
        val saved = captureCurrentSaved()
        `when`(prefs.getString("scores", "[]")).thenReturn(saved)

        store.saveHighScore("""{"score":100,"wave":2,"kills":10,"money":50}""")
        val afterSecond = captureCurrentSaved()
        val parsed = org.json.JSONArray(afterSecond)
        assertEquals(100, parsed.getJSONObject(0).getInt("score"))
        assertEquals(50, parsed.getJSONObject(1).getInt("score"))
    }

    @Test
    fun `clearHighScores removes scores from prefs`() {
        store.clearHighScores()
        verify(editor).remove("scores")
        verify(editor).apply()
    }

    @Test
    fun `saveHighScore includes all fields`() {
        `when`(prefs.getString("scores", "[]")).thenReturn("[]")

        store.saveHighScore("""{"score":250,"wave":3,"kills":15,"money":80}""")

        val captor = ArgumentCaptor.forClass(String::class.java)
        verify(editor).putString(anyString(), captor.capture())
        val saved = captor.value
        assertTrue(saved.contains("\"score\":250"))
        assertTrue(saved.contains("\"wave\":3"))
        assertTrue(saved.contains("\"kills\":15"))
        assertTrue(saved.contains("\"money\":80"))
    }

    @Test
    fun `saveHighScore with existing scores merges correctly`() {
        `when`(prefs.getString("scores", "[]")).thenReturn(
            """[{"score":50,"wave":1,"kills":5,"money":20}]"""
        )

        store.saveHighScore("""{"score":75,"wave":2,"kills":8,"money":30}""")

        val captor = ArgumentCaptor.forClass(String::class.java)
        verify(editor).putString(anyString(), captor.capture())
        val parsed = org.json.JSONArray(captor.value)
        assertEquals(2, parsed.length())
        assertEquals(75, parsed.getJSONObject(0).getInt("score"))
        assertEquals(50, parsed.getJSONObject(1).getInt("score"))
    }

    @Test
    fun `saveHighScore trims to 10 when full`() {
        val existing = (1..10).joinToString(",", "[", "]") { i ->
            """{"score":$i,"wave":$i,"kills":0,"money":0}"""
        }
        `when`(prefs.getString("scores", "[]")).thenReturn(existing)

        store.saveHighScore("""{"score":100,"wave":11,"kills":0,"money":0}""")

        val captor = ArgumentCaptor.forClass(String::class.java)
        verify(editor).putString(anyString(), captor.capture())
        val parsed = org.json.JSONArray(captor.value)
        assertEquals(10, parsed.length())
        assertEquals(100, parsed.getJSONObject(0).getInt("score"))
    }

    private var putCount = 0

    private fun captureCurrentSaved(): String {
        putCount++
        val captor = ArgumentCaptor.forClass(String::class.java)
        verify(editor, times(putCount)).putString(anyString(), captor.capture())
        return captor.value
    }

    private fun captureAllSaved(): List<String> {
        val captor = ArgumentCaptor.forClass(String::class.java)
        verify(editor, times(putCount)).putString(anyString(), captor.capture())
        return captor.allValues
    }
}
