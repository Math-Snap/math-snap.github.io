package com.mathsnap

import android.content.Intent
import android.os.Build
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * Updates for the APK downloaded from the website (Google Play updates its own copies).
 * Each GitHub release has version.json ({"versionCode": 33, "versionName": "8.4"}) next to
 * MathSnap.apk. If it is newer than this app, the APK is downloaded and Android's installer opens.
 * Every build is signed with the same key, so it installs over the old app and keeps the data.
 * Results go to the page as window.onUpdateStatus({state, ...}).
 */
class Updater(private val activity: AppCompatActivity, private val fromPlay: Boolean, private val js: (String) -> Unit) {

    private val base = "https://github.com/Math-Snap/math-snap.github.io/releases/latest/download/"
    @Volatile private var busy = false
    private var newest: JSONObject? = null

    private fun info() = activity.packageManager.getPackageInfo(activity.packageName, 0)
    private fun currentCode(): Long = if (Build.VERSION.SDK_INT >= 28) info().longVersionCode else @Suppress("DEPRECATION") info().versionCode.toLong()
    private fun currentName(): String = info().versionName ?: ""

    /** The website APK can update itself; a copy from Google Play can't (and doesn't need to). */
    fun canUpdate(): Boolean = !fromPlay

    private fun send(o: JSONObject) = js("window.onUpdateStatus && window.onUpdateStatus(" + o.toString() + ")")

    private fun open(url: String): HttpURLConnection {
        var u = URL(url); var hops = 0
        while (true) {   // GitHub sends release files through a redirect to another https host
            val c = u.openConnection() as HttpURLConnection
            c.instanceFollowRedirects = false
            c.connectTimeout = 15000; c.readTimeout = 30000
            c.setRequestProperty("User-Agent", "MathSnap-Android")
            val code = c.responseCode
            if (code in 300..399 && hops < 6) {
                val next = c.getHeaderField("Location") ?: throw Exception("redirect")
                c.disconnect(); u = URL(u, next); hops++
                if (u.protocol != "https") throw Exception("not https")
                continue
            }
            if (code != 200) { c.disconnect(); throw Exception("http $code") }
            return c
        }
    }

    /** quiet = checked by itself when the app opens: only says something when there is an update */
    fun check(quiet: Boolean) {
        if (!canUpdate() || busy) return
        Thread {
            val out = JSONObject().put("current", currentName()).put("quiet", quiet)
            try {
                val c = open(base + "version.json")
                val j = JSONObject(c.inputStream.bufferedReader().readText()); c.disconnect()
                newest = j
                if (j.optLong("versionCode") > currentCode()) out.put("state", "available").put("version", j.optString("versionName"))
                else out.put("state", "latest")
            } catch (e: Exception) { out.put("state", "error") }
            send(out)
        }.start()
    }

    fun install() {
        if (!canUpdate() || busy) return
        busy = true
        Thread {
            try {
                val dir = File(activity.cacheDir, "updates").apply { mkdirs() }
                val apk = File(dir, "MathSnap.apk"); val part = File(dir, "MathSnap.apk.part")
                val c = open(base + "MathSnap.apk")
                val total = c.contentLengthLong
                var got = 0L; var last = -1
                c.inputStream.use { input -> part.outputStream().use { o ->
                    val buf = ByteArray(64 * 1024)
                    while (true) {
                        val n = input.read(buf); if (n < 0) break
                        o.write(buf, 0, n); got += n
                        val pc = if (total > 0) (got * 100 / total).toInt() else -1
                        if (pc != last && pc % 5 == 0) { last = pc; send(JSONObject().put("state", "downloading").put("percent", pc)) }
                    }
                } }
                c.disconnect()
                if (total > 0 && got != total) throw Exception("short")
                apk.delete(); part.renameTo(apk)
                send(JSONObject().put("state", "installing"))
                activity.runOnUiThread {
                    val uri = FileProvider.getUriForFile(activity, activity.packageName + ".fileprovider", apk)
                    val i = Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive")
                        .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
                    try { activity.startActivity(i) } catch (e: Exception) { send(JSONObject().put("state", "error")) }
                }
            } catch (e: Exception) { send(JSONObject().put("state", "error")) }
            busy = false
        }.start()
    }
}
