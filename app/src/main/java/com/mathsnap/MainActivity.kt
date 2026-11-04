package com.mathsnap

import android.annotation.SuppressLint
import android.net.Uri
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * Math Snap: the screen is a local web page (assets/index.html) with an offline math engine.
 * This activity adds the camera and Google's on-device text scanner (ML Kit), both offline,
 * and the optional account (sign-in, saved history, favorites) in Account.kt.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var web: WebView
    private var cameraUri: Uri? = null
    private lateinit var account: Account
    private val recognizer by lazy { TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS) }

    private val takePicture =
        registerForActivityResult(ActivityResultContracts.TakePicture()) { ok ->
            val uri = cameraUri
            if (ok && uri != null) readText(uri) else js("onPhotoCancelled()")
        }

    private val pickImage =
        registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
            if (uri != null) readText(uri) else js("onPhotoCancelled()")
        }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this)
        web.setBackgroundColor(getColor(R.color.paper))
        web.settings.javaScriptEnabled = true
        web.settings.allowFileAccess = false
        web.settings.domStorageEnabled = true
        web.settings.cacheMode = android.webkit.WebSettings.LOAD_NO_CACHE
        web.clearCache(true)
        web.addJavascriptInterface(Bridge(), "Android")
        // Android 15+ draws apps under the status and navigation bars, so the page sits inside
        // a frame padded by the bars (and by the keyboard when it is open).
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val root = android.widget.FrameLayout(this)
        root.setBackgroundColor(getColor(R.color.paper))
        root.addView(web, android.widget.FrameLayout.LayoutParams(-1, -1))
        setContentView(root)
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            val ime = insets.getInsets(WindowInsetsCompat.Type.ime())
            v.setPadding(bars.left, bars.top, bars.right, maxOf(bars.bottom, ime.bottom))
            WindowInsetsCompat.CONSUMED
        }
        WindowCompat.getInsetsController(window, root).apply {
            val light = resources.getBoolean(R.bool.light_bars)
            isAppearanceLightStatusBars = light
            isAppearanceLightNavigationBars = light
        }
        // Back button: first let the page close its pop-ups, then go back, then leave.
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("(window.onBack && window.onBack()) ? 'y' : 'n'") { r ->
                    if (r != null && r.contains("y")) return@evaluateJavascript
                    if (web.canGoBack()) web.goBack() else finish()
                }
            }
        })
        cameraUri = savedInstanceState?.getString("cameraUri")?.let { Uri.parse(it) }
        account = Account(this) { code -> js(code) }
        account.start()
        web.loadUrl("file:///android_asset/index.html")
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        cameraUri?.let { outState.putString("cameraUri", it.toString()) }
    }

    inner class Bridge {
        @JavascriptInterface
        fun takePhoto() = runOnUiThread { openCamera() }

        @JavascriptInterface
        fun pickPhoto() = runOnUiThread { pickImage.launch("image/*") }

        // ---- account ----
        @JavascriptInterface fun ready() = runOnUiThread { account.ready() }
        @JavascriptInterface fun authState(): String = account.state()
        @JavascriptInterface fun signInEmail(email: String, password: String) = runOnUiThread { account.signInEmail(email, password) }
        @JavascriptInterface fun signUpEmail(email: String, password: String, name: String) = runOnUiThread { account.signUpEmail(email, password, name) }
        @JavascriptInterface fun resetPassword(email: String) = runOnUiThread { account.resetPassword(email) }
        @JavascriptInterface fun signInGoogle() = runOnUiThread { account.signInGoogle() }
        @JavascriptInterface fun signOut() = runOnUiThread { account.signOut() }
        @JavascriptInterface fun saveProblem(json: String): String = account.save(json)
        @JavascriptInterface fun updateProblem(id: String, json: String) = account.update(id, json)
        @JavascriptInterface fun deleteProblem(id: String) = account.delete(id)
        @JavascriptInterface fun wifiOnly(): Boolean = account.wifiOnly()
        @JavascriptInterface fun setWifiOnly(on: Boolean) = runOnUiThread { account.setWifiOnly(on) }

        // ---- look: the status and navigation bars follow the theme chosen in the app ----
        @JavascriptInterface fun setBars(bg: String, nav: String, lightIcons: Boolean) = runOnUiThread {
            try {
                window.statusBarColor = android.graphics.Color.parseColor(bg)
                window.navigationBarColor = android.graphics.Color.parseColor(nav)
                web.setBackgroundColor(android.graphics.Color.parseColor(bg))
                val c = androidx.core.view.WindowInsetsControllerCompat(window, window.decorView)
                c.isAppearanceLightStatusBars = lightIcons
                c.isAppearanceLightNavigationBars = lightIcons
            } catch (_: Exception) { }
        }
    }

    private fun openCamera() {
        try {
            val dir = File(cacheDir, "photos").apply { mkdirs() }
            dir.listFiles()?.forEach { it.delete() }
            val file = File(dir, "problem_${System.currentTimeMillis()}.jpg")
            val uri = FileProvider.getUriForFile(this, "$packageName.fileprovider", file)
            cameraUri = uri
            takePicture.launch(uri)
        } catch (e: Exception) {
            js("onOcrError('camera')")
        }
    }

    private fun readText(uri: Uri) {
        js("onPhotoStart()")
        val image = try {
            InputImage.fromFilePath(this, uri)
        } catch (e: Exception) {
            js("onOcrError('open')")
            return
        }
        recognizer.process(image)
            .addOnSuccessListener { result ->
                // Every word with its position in the photo, so a drawing's labels can be matched to vertices
                val items = JSONArray()
                result.textBlocks.forEachIndexed { bi, block ->
                    block.lines.forEachIndexed { li, line ->
                        for (word in line.elements) {
                            val box = word.boundingBox ?: continue
                            items.put(JSONObject()
                                .put("t", word.text)
                                .put("x", box.exactCenterX().toDouble())
                                .put("y", box.exactCenterY().toDouble())
                                .put("h", box.height())
                                .put("line", line.text)
                                .put("id", "$bi.$li"))
                        }
                    }
                }
                js("onOcr(" + JSONObject.quote(result.text) + "," + items.toString() + ")")
            }
            .addOnFailureListener {
                js("onOcrError('read')")
            }
    }

    private fun js(code: String) = web.post { web.evaluateJavascript(code, null) }
}
