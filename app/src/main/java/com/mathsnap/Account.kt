package com.mathsnap

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import androidx.appcompat.app.AppCompatActivity
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.lifecycle.lifecycleScope
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.FirebaseNetworkException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.FirebaseAuthInvalidUserException
import com.google.firebase.auth.FirebaseAuthRecentLoginRequiredException
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.auth.FirebaseAuthWeakPasswordException
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.UserProfileChangeRequest
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.MetadataChanges
import com.google.firebase.firestore.Query
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

/**
 * Accounts and saved problems.
 *
 * Data use is kept small on purpose:
 *  - Solving never touches the internet.
 *  - Only short text is saved (the problem, the answer, a star, a note). Never photos.
 *  - Firestore keeps everything in a local cache and sends changes in the background,
 *    grouped together. Offline changes wait and go out later.
 *  - "Wi-Fi only" turns the network off for syncing whenever the phone is on mobile data.
 */
class Account(private val activity: AppCompatActivity, private val js: (String) -> Unit) {

    private val auth = FirebaseAuth.getInstance()
    private val db = FirebaseFirestore.getInstance()
    private val prefs = activity.getSharedPreferences("mathsnap", Context.MODE_PRIVATE)
    private var history: ListenerRegistration? = null
    private var unmetered = true
    private var networkOn = true

    fun start() {
        auth.addAuthStateListener {
            pushAuth()
            if (it.currentUser != null) listenHistory() else stopHistory()
        }
        watchNetwork()
        countPhone()
    }

    // ---------- counting phones: one anonymous ID per phone, sent at most once a day ----------
    // The ID is a scrambled code made on the phone. No name, email or anything personal is sent.
    private fun countPhone() {
        try {
            val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
            if (prefs.getString("pingDay", "") == today) return
            val raw = android.provider.Settings.Secure.getString(activity.contentResolver, android.provider.Settings.Secure.ANDROID_ID)
                ?: prefs.getString("installId", null)
                ?: java.util.UUID.randomUUID().toString().also { prefs.edit().putString("installId", it).apply() }
            val id = "a" + java.security.MessageDigest.getInstance("SHA-256").digest(("mathsnap:" + raw).toByteArray())
                .joinToString("") { "%02x".format(it) }.take(32)
            @Suppress("DEPRECATION")
            val version = activity.packageManager.getPackageInfo(activity.packageName, 0).versionName ?: ""
            val data = hashMapOf<String, Any>("platform" to "android", "version" to version,
                "last" to FieldValue.serverTimestamp(), "opens" to FieldValue.increment(1))
            if (!prefs.getBoolean("installSent", false)) data["first"] = FieldValue.serverTimestamp()
            db.collection("installs").document(id).set(data, SetOptions.merge())
                .addOnSuccessListener { prefs.edit().putString("pingDay", today).putBoolean("installSent", true).apply() }
        } catch (e: Exception) { /* counting must never get in the way */ }
    }

    /** The page finished loading: send it the current account, history and sync state. */
    fun ready() {
        pushAuth()
        if (auth.currentUser != null) listenHistory()
        pushSync(-1, null)
    }

    // ---------- sign in ----------

    fun state(): String {
        val u = auth.currentUser ?: return JSONObject().put("signedIn", false).toString()
        return JSONObject()
            .put("signedIn", true)
            .put("email", u.email ?: "")
            .put("name", u.displayName ?: "")
            .put("provider", u.providerData.map { it.providerId }.firstOrNull { it != "firebase" } ?: "password")
            .toString()
    }

    private fun pushAuth() = js("window.onAuth && onAuth(" + state() + ")")

    private fun fail(e: Exception?) {
        val code = when (e) {
            is FirebaseAuthWeakPasswordException -> "weak_password"
            is FirebaseAuthUserCollisionException -> "email_in_use"
            is FirebaseAuthInvalidUserException -> "no_user"
            is FirebaseAuthInvalidCredentialsException -> if (e.errorCode == "ERROR_INVALID_EMAIL") "bad_email" else "bad_password"
            is FirebaseNetworkException -> "network"
            else -> "other"
        }
        js("window.onAuthError && onAuthError(" + JSONObject.quote(code) + "," + JSONObject.quote(e?.message ?: "") + ")")
    }

    fun signInEmail(email: String, password: String) {
        auth.signInWithEmailAndPassword(email.trim(), password)
            .addOnFailureListener { fail(it) }
    }

    fun signUpEmail(email: String, password: String, name: String) {
        auth.createUserWithEmailAndPassword(email.trim(), password)
            .addOnSuccessListener { res ->
                if (name.isNotBlank()) {
                    res.user?.updateProfile(UserProfileChangeRequest.Builder().setDisplayName(name.trim()).build())
                        ?.addOnCompleteListener { pushAuth() }
                }
            }
            .addOnFailureListener { fail(it) }
    }

    fun resetPassword(email: String) {
        auth.sendPasswordResetEmail(email.trim())
            .addOnSuccessListener { js("window.onAuthInfo && onAuthInfo('reset_sent')") }
            .addOnFailureListener { fail(it) }
    }

    fun signInGoogle() {
        val option = GetSignInWithGoogleOption.Builder(activity.getString(R.string.default_web_client_id)).build()
        val request = GetCredentialRequest.Builder().addCredentialOption(option).build()
        activity.lifecycleScope.launch {
            try {
                val result = CredentialManager.create(activity).getCredential(activity, request)
                val cred = result.credential
                if (cred is CustomCredential && cred.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                    val token = GoogleIdTokenCredential.createFrom(cred.data).idToken
                    auth.signInWithCredential(GoogleAuthProvider.getCredential(token, null))
                        .addOnFailureListener { fail(it) }
                } else fail(null)
            } catch (e: GetCredentialCancellationException) {
                js("window.onAuthInfo && onAuthInfo('cancelled')")
            } catch (e: GetCredentialException) {
                js("window.onAuthError && onAuthError('google'," + JSONObject.quote(e.message ?: "") + ")")
            } catch (e: Exception) {
                fail(e)
            }
        }
    }

    fun signOut() {
        stopHistory()
        auth.signOut()
        activity.lifecycleScope.launch {
            try { CredentialManager.create(activity).clearCredentialState(androidx.credentials.ClearCredentialStateRequest()) } catch (_: Exception) {}
        }
    }

    /** Deletes the account for good: all saved problems first, then the sign-in itself. */
    fun deleteAccount() {
        val u = auth.currentUser ?: return
        val c = col() ?: return
        stopHistory()
        c.get().addOnCompleteListener { t ->
            val batch = db.batch()
            t.result?.documents?.forEach { batch.delete(it.reference) }
            batch.delete(db.collection("users").document(u.uid))
            batch.commit().addOnCompleteListener {
                u.delete()
                    .addOnSuccessListener {
                        activity.lifecycleScope.launch {
                            try { CredentialManager.create(activity).clearCredentialState(androidx.credentials.ClearCredentialStateRequest()) } catch (_: Exception) {}
                        }
                        js("window.onAuthInfo && onAuthInfo('deleted')")
                    }
                    .addOnFailureListener { e ->
                        if (e is FirebaseAuthRecentLoginRequiredException) {
                            auth.signOut()
                            js("window.onAuthError && onAuthError('relogin','')")
                        } else { listenHistory(); fail(e) }
                    }
            }
        }
    }

    // ---------- saved problems ----------

    private fun col() = auth.currentUser?.let { db.collection("users").document(it.uid).collection("problems") }

    /** Saves one problem. Returns its id right away; the upload happens later in the background. */
    fun save(json: String): String {
        val c = col() ?: return ""
        val o = JSONObject(json)
        val ref = c.document()
        val data = hashMapOf<String, Any>(
            "kind" to o.optString("kind", "solve").take(10),
            "input" to o.optString("input").take(2000),
            "answer" to o.optString("answer").take(1000),
            "tool" to o.optString("tool").take(40),
            "vals" to o.optString("vals").take(500),
            "fav" to o.optBoolean("fav", false),
            "note" to o.optString("note").take(2000),
            "created" to System.currentTimeMillis(),
        )
        ref.set(data)
        return ref.id
    }

    fun update(id: String, json: String) {
        val c = col() ?: return
        val o = JSONObject(json)
        val data = hashMapOf<String, Any>()
        if (o.has("fav")) data["fav"] = o.getBoolean("fav")
        if (o.has("note")) data["note"] = o.getString("note").take(2000)
        if (data.isNotEmpty()) c.document(id).update(data)
    }

    fun delete(id: String) { col()?.document(id)?.delete() }

    private fun listenHistory() {
        stopHistory()
        val c = col() ?: return
        history = c.orderBy("created", Query.Direction.DESCENDING).limit(300)
            .addSnapshotListener(MetadataChanges.INCLUDE) { snap, err ->
                if (err != null || snap == null) return@addSnapshotListener
                val arr = JSONArray()
                var pending = 0
                for (d in snap.documents) {
                    val p = d.metadata.hasPendingWrites()
                    if (p) pending++
                    arr.put(JSONObject()
                        .put("id", d.id)
                        .put("kind", d.getString("kind") ?: "solve")
                        .put("input", d.getString("input") ?: "")
                        .put("answer", d.getString("answer") ?: "")
                        .put("tool", d.getString("tool") ?: "")
                        .put("vals", d.getString("vals") ?: "")
                        .put("fav", d.getBoolean("fav") ?: false)
                        .put("note", d.getString("note") ?: "")
                        .put("created", d.getLong("created") ?: 0L)
                        .put("pending", p))
                }
                js("window.onHistory && onHistory(" + arr.toString() + ")")
                pushSync(pending, snap.metadata.isFromCache)
            }
    }

    private fun stopHistory() {
        history?.remove(); history = null
        js("window.onHistory && onHistory([])")
    }

    // ---------- saving data: Wi-Fi only ----------

    fun wifiOnly() = prefs.getBoolean("wifiOnly", false)

    fun setWifiOnly(on: Boolean) {
        prefs.edit().putBoolean("wifiOnly", on).apply()
        applyNetwork()
    }

    private fun applyNetwork() {
        val allow = !wifiOnly() || unmetered
        if (allow != networkOn) {
            networkOn = allow
            if (allow) db.enableNetwork() else db.disableNetwork()
        }
        pushSync(-1, null)
    }

    private fun pushSync(pending: Int, fromCache: Boolean?) {
        val o = JSONObject().put("paused", !networkOn).put("wifiOnly", wifiOnly())
        if (pending >= 0) o.put("pending", pending)
        if (fromCache != null) o.put("offline", fromCache)
        js("window.onSync && onSync(" + o.toString() + ")")
    }

    private fun watchNetwork() {
        val cm = activity.getSystemService(ConnectivityManager::class.java) ?: return
        cm.activeNetwork?.let { n -> cm.getNetworkCapabilities(n)?.let { unmetered = it.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED) } }
        applyNetwork()
        cm.registerDefaultNetworkCallback(object : ConnectivityManager.NetworkCallback() {
            override fun onCapabilitiesChanged(network: Network, caps: NetworkCapabilities) {
                unmetered = caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED)
                activity.runOnUiThread { applyNetwork() }
            }
        })
    }
}
