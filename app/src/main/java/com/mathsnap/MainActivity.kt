package com.mathsnap

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.os.Bundle
import android.text.InputType
import android.util.Base64
import android.view.View
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.exifinterface.media.ExifInterface
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import kotlin.math.max

class MainActivity : AppCompatActivity() {

    companion object {
        private const val MODEL = "claude-sonnet-5-5"
        private const val PREFS = "mathsnap"
        private const val KEY_API = "api_key"
        private const val MAX_SIDE = 1568
    }

    private lateinit var problem: EditText
    private lateinit var showSteps: CheckBox
    private lateinit var btnSolve: Button
    private lateinit var progress: ProgressBar
    private lateinit var previewRow: LinearLayout
    private lateinit var preview: ImageView
    private lateinit var answerBox: LinearLayout
    private lateinit var answer: TextView
    private lateinit var steps: TextView

    private var photoUri: Uri? = null
    private var cameraUri: Uri? = null
    private var busy = false

    private val takePicture =
        registerForActivityResult(ActivityResultContracts.TakePicture()) { ok ->
            if (ok) cameraUri?.let { setPhoto(it) }
        }

    private val pickImage =
        registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
            if (uri != null) setPhoto(uri)
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        problem = findViewById(R.id.problem)
        showSteps = findViewById(R.id.showSteps)
        btnSolve = findViewById(R.id.btnSolve)
        progress = findViewById(R.id.progress)
        previewRow = findViewById(R.id.previewRow)
        preview = findViewById(R.id.preview)
        answerBox = findViewById(R.id.answerBox)
        answer = findViewById(R.id.answer)
        steps = findViewById(R.id.steps)

        findViewById<Button>(R.id.btnCamera).setOnClickListener { openCamera() }
        findViewById<Button>(R.id.btnGallery).setOnClickListener { pickImage.launch("image/*") }
        findViewById<Button>(R.id.btnClear).setOnClickListener { clearPhoto() }
        findViewById<Button>(R.id.btnKey).setOnClickListener { askForKey() }
        btnSolve.setOnClickListener { solve() }

        showExample()
        if (apiKey().isBlank()) askForKey()
    }

    // ---------- Photo ----------

    private fun openCamera() {
        val dir = File(cacheDir, "photos").apply { mkdirs() }
        val file = File(dir, "problem_${System.currentTimeMillis()}.jpg")
        val uri = FileProvider.getUriForFile(this, "$packageName.fileprovider", file)
        cameraUri = uri
        takePicture.launch(uri)
    }

    private fun setPhoto(uri: Uri) {
        photoUri = uri
        preview.setImageURI(null)
        preview.setImageURI(uri)
        previewRow.visibility = View.VISIBLE
    }

    private fun clearPhoto() {
        photoUri = null
        preview.setImageURI(null)
        previewRow.visibility = View.GONE
    }

    /** Loads the photo, shrinks it, fixes rotation, returns base64 JPEG. */
    private fun loadJpegBase64(uri: Uri): String {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
            ?: throw IOException("Couldn't open that photo.")
        var sample = 1
        while (max(bounds.outWidth, bounds.outHeight) / (sample * 2) >= MAX_SIDE) sample *= 2

        val opts = BitmapFactory.Options().apply { inSampleSize = sample }
        var bmp = contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, opts) }
            ?: throw IOException("Couldn't read that photo. Try another one.")

        val rotation = try {
            contentResolver.openInputStream(uri)?.use { ExifInterface(it).rotationDegrees } ?: 0
        } catch (e: Exception) { 0 }

        val longSide = max(bmp.width, bmp.height)
        if (longSide > MAX_SIDE) {
            val s = MAX_SIDE.toFloat() / longSide
            bmp = Bitmap.createScaledBitmap(bmp, (bmp.width * s).toInt(), (bmp.height * s).toInt(), true)
        }
        if (rotation != 0) {
            val m = Matrix().apply { postRotate(rotation.toFloat()) }
            bmp = Bitmap.createBitmap(bmp, 0, 0, bmp.width, bmp.height, m, true)
        }
        val out = ByteArrayOutputStream()
        bmp.compress(Bitmap.CompressFormat.JPEG, 85, out)
        return Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
    }

    // ---------- API key ----------

    private fun apiKey(): String =
        getSharedPreferences(PREFS, MODE_PRIVATE).getString(KEY_API, "") ?: ""

    private fun askForKey() {
        val input = EditText(this).apply {
            hint = "sk-ant-..."
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            setText(apiKey())
            setPadding(48, 32, 48, 32)
        }
        AlertDialog.Builder(this)
            .setTitle("Claude API key")
            .setMessage("Paste the API key from console.anthropic.com. It stays on this phone only.")
            .setView(input)
            .setPositiveButton("Save") { _, _ ->
                getSharedPreferences(PREFS, MODE_PRIVATE).edit()
                    .putString(KEY_API, input.text.toString().trim()).apply()
                Toast.makeText(this, "Key saved", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    // ---------- Solve ----------

    private fun buildPrompt(typed: String, hasPhoto: Boolean, withSteps: Boolean): String = buildString {
        append("You are a friendly math tutor for a school student. Topics: arithmetic, fractions, equations, algebra, geometry.\n")
        if (hasPhoto) append("The attached photo shows the math problem(s).\n")
        if (typed.isNotBlank()) append("The student typed: ").append(typed).append("\n")
        append("\nSolve it. If there are several problems, solve each one, labelled (a), (b), ...\n")
        append("Write plain text only: no LaTeX, no markdown, no asterisks. Use × ÷ − √ π ² ³ and fractions like 3/4.\n")
        append("Start your reply with ONE line exactly in this form:\nANSWER: <the final answer(s), short>\n")
        if (withSteps) {
            append("Then a blank line, then 'Problem:' restating it, then numbered steps, short and clear, each explaining what is done and why. End with a 'Check:' line where it makes sense.\n")
        } else {
            append("Then one short line restating the problem. No steps.\n")
        }
        append("If the photo is unreadable or there is no math in it, write \"ANSWER: Couldn't read the problem\" and say what to fix.")
    }

    private fun solve() {
        if (busy) return
        val typed = problem.text.toString().trim()
        val photo = photoUri
        if (photo == null && typed.isEmpty()) {
            Toast.makeText(this, "Take a photo or type a problem first", Toast.LENGTH_SHORT).show()
            return
        }
        val key = apiKey()
        if (key.isBlank()) { askForKey(); return }

        val prompt = buildPrompt(typed, photo != null, showSteps.isChecked)
        setBusy(true)
        answerBox.visibility = View.GONE
        steps.setTextColor(getColor(R.color.muted))
        steps.text = "Solving…"

        Thread {
            try {
                val image = photo?.let { loadJpegBase64(it) }
                val text = callClaude(key, prompt, image)
                runOnUiThread { render(text) }
            } catch (e: Exception) {
                runOnUiThread {
                    answerBox.visibility = View.GONE
                    steps.setTextColor(getColor(R.color.warn))
                    steps.text = e.message ?: "Something went wrong. Try again."
                }
            } finally {
                runOnUiThread { setBusy(false) }
            }
        }.start()
    }

    private fun setBusy(b: Boolean) {
        busy = b
        btnSolve.isEnabled = !b
        btnSolve.text = if (b) "Solving…" else "Solve it"
        progress.visibility = if (b) View.VISIBLE else View.GONE
    }

    private fun render(text: String) {
        steps.setTextColor(getColor(R.color.ink))
        val match = Regex("""^\s*ANSWER:\s*(.+)$""", RegexOption.MULTILINE).find(text)
        if (match != null) {
            answer.text = match.groupValues[1].trim()
            answerBox.visibility = View.VISIBLE
            steps.text = text.replace(match.value, "").trim()
        } else {
            answerBox.visibility = View.GONE
            steps.text = text.trim()
        }
    }

    private fun showExample() {
        answer.text = "x = 6"
        answerBox.visibility = View.VISIBLE
        steps.setTextColor(getColor(R.color.muted))
        steps.text = "Example\n\nProblem: 2x + 5 = 17\n\n1. Subtract 5 from both sides:\n   2x = 12\n\n2. Divide both sides by 2:\n   x = 6\n\nCheck: 2(6) + 5 = 17 ✓"
    }

    // ---------- Claude API ----------

    private fun callClaude(key: String, prompt: String, imageB64: String?): String {
        val content = JSONArray()
        if (imageB64 != null) {
            content.put(
                JSONObject()
                    .put("type", "image")
                    .put(
                        "source", JSONObject()
                            .put("type", "base64")
                            .put("media_type", "image/jpeg")
                            .put("data", imageB64)
                    )
            )
        }
        content.put(JSONObject().put("type", "text").put("text", prompt))

        val body = JSONObject()
            .put("model", MODEL)
            .put("max_tokens", 2048)
            .put("messages", JSONArray().put(JSONObject().put("role", "user").put("content", content)))

        val conn = (URL("https://api.anthropic.com/v1/messages").openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            doOutput = true
            connectTimeout = 20_000
            readTimeout = 120_000
            setRequestProperty("x-api-key", key)
            setRequestProperty("anthropic-version", "2023-06-01")
            setRequestProperty("content-type", "application/json")
        }
        try {
            conn.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
            val code = conn.responseCode
            val stream = if (code in 200..299) conn.inputStream else conn.errorStream
            val raw = stream?.bufferedReader()?.use { it.readText() } ?: ""

            if (code !in 200..299) {
                val msg = runCatching {
                    JSONObject(raw).getJSONObject("error").getString("message")
                }.getOrNull() ?: "Error $code"
                throw IOException(
                    when (code) {
                        401 -> "The API key isn't working. Tap \"API key\" at the top and check it."
                        429 -> "Too many requests. Wait a minute and try again."
                        529, 503 -> "Claude is busy right now. Try again in a minute."
                        else -> msg
                    }
                )
            }

            val blocks = JSONObject(raw).getJSONArray("content")
            val sb = StringBuilder()
            for (i in 0 until blocks.length()) {
                val b = blocks.getJSONObject(i)
                if (b.optString("type") == "text") sb.append(b.getString("text"))
            }
            if (sb.isBlank()) throw IOException("No answer came back. Try again.")
            return sb.toString()
        } catch (e: java.net.UnknownHostException) {
            throw IOException("No internet connection.")
        } finally {
            conn.disconnect()
        }
    }
}
