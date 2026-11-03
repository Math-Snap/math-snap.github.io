package com.mathsnap

import android.annotation.SuppressLint
import android.net.Uri
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
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
        web.addJavascriptInterface(Bridge(), "Android")
        setContentView(web)
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

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (web.canGoBack()) web.goBack() else super.onBackPressed()
    }
}
