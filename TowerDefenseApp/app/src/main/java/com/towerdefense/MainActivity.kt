package com.towerdefense

import android.graphics.Color
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WindowCompat.setDecorFitsSystemWindows(window, false)

        window.statusBarColor = Color.parseColor("#CF222222")
        window.navigationBarColor = Color.parseColor("#CF222222")

        WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightStatusBars = false

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
        }

        webView.overScrollMode = WebView.OVER_SCROLL_NEVER
        webView.addJavascriptInterface(ScoreStore(this), "AndroidScoreStore")
        webView.webChromeClient = WebChromeClient()
        webView.webViewClient = WebViewClient()

        ViewCompat.setOnApplyWindowInsetsListener(webView) { view, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        webView.loadUrl("file:///android_asset/tower_defense.html")
    }

    override fun onBackPressed() {
        finishAffinity()
    }
}
