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
import org.json.JSONObject
import java.io.File

/**
 * Math Snap: the screen is a local web page (assets/index.html) with an offline math engine.
 * This activity adds the camera and Google's on-device text scanner (ML Kit). No internet, no API key.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var web: WebView
    private var cameraUri: Uri? = null
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
            .addOnSuccessListener { result -> js("onOcr(" + JSONObject.quote(result.text) + ")") }
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
