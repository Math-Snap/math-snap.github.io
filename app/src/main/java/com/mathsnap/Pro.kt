package com.mathsnap

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.appcompat.app.AppCompatActivity
import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import org.json.JSONObject

/**
 * Math Snap Pro: a monthly subscription sold through Google Play ("pro_monthly").
 * The page asks proState() and gets onPro(...) whenever it changes.
 * Only the copy installed from Google Play can buy; other copies show a link to the store.
 */
class Pro(private val activity: AppCompatActivity, private val js: (String) -> Unit) : PurchasesUpdatedListener {

    companion object {
        const val PRODUCT = "pro_monthly"
        const val STORE = "https://play.google.com/store/apps/details?id=com.mathsnap"
    }

    private val prefs = activity.getSharedPreferences("mathsnap", Context.MODE_PRIVATE)
    private var details: ProductDetails? = null
    private var price = ""

    private val client: BillingClient = BillingClient.newBuilder(activity)
        .setListener(this)
        .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
        .build()

    /** True when this copy was installed from Google Play (so it can buy). */
    val fromPlay: Boolean = try {
        val pm = activity.packageManager
        val installer = if (Build.VERSION.SDK_INT >= 30) pm.getInstallSourceInfo(activity.packageName).installingPackageName
        else @Suppress("DEPRECATION") pm.getInstallerPackageName(activity.packageName)
        installer == "com.android.vending"
    } catch (e: Exception) { false }

    fun start() {
        if (!fromPlay) return
        connect()
    }

    private fun connect(then: (() -> Unit)? = null) {
        if (client.isReady) { then?.invoke(); return }
        try {
            client.startConnection(object : BillingClientStateListener {
                override fun onBillingSetupFinished(r: BillingResult) {
                    if (r.responseCode == BillingClient.BillingResponseCode.OK) {
                        refresh(); loadDetails(then)
                    }
                }
                override fun onBillingServiceDisconnected() {}
            })
        } catch (e: Exception) {}
    }

    fun isPro() = prefs.getBoolean("pro", false)

    fun state(): String = JSONObject()
        .put("pro", isPro())
        .put("price", price)
        .put("play", fromPlay)
        .put("ready", details != null)
        .toString()

    private fun push() = activity.runOnUiThread { js("window.onPro && onPro(" + state() + ")") }
    private fun info(code: String) = activity.runOnUiThread { js("window.onProInfo && onProInfo(" + JSONObject.quote(code) + ")") }

    private fun setPro(on: Boolean) {
        prefs.edit().putBoolean("pro", on).apply()
        push()
    }

    /** Asks Google Play which subscriptions are active right now. */
    fun refresh() {
        if (!client.isReady) return
        client.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build()
        ) { r, list ->
            if (r.responseCode == BillingClient.BillingResponseCode.OK) handle(list, true)
        }
    }

    private fun handle(list: List<Purchase>, complete: Boolean) {
        val mine = list.filter { it.products.contains(PRODUCT) }
        val active = mine.filter { it.purchaseState == Purchase.PurchaseState.PURCHASED }
        for (p in active) if (!p.isAcknowledged) {
            client.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(p.purchaseToken).build()) {}
        }
        if (mine.any { it.purchaseState == Purchase.PurchaseState.PENDING }) info("pending")
        if (complete) setPro(active.isNotEmpty())
        else if (active.isNotEmpty()) { setPro(true); info("thanks") }
    }

    private fun loadDetails(then: (() -> Unit)? = null) {
        val params = QueryProductDetailsParams.newBuilder().setProductList(listOf(
            QueryProductDetailsParams.Product.newBuilder().setProductId(PRODUCT).setProductType(BillingClient.ProductType.SUBS).build()
        )).build()
        client.queryProductDetailsAsync(params) { r, result ->
            if (r.responseCode == BillingClient.BillingResponseCode.OK) {
                details = result.productDetailsList.firstOrNull()
                val offer = baseOffer()
                price = offer?.pricingPhases?.pricingPhaseList?.lastOrNull()?.formattedPrice ?: ""
                push()
            }
            then?.let { activity.runOnUiThread(it) }
        }
    }

    // the plain monthly plan (not a special offer), so the price shown is the real one
    private fun baseOffer() = details?.subscriptionOfferDetails?.let { offers -> offers.firstOrNull { it.offerId == null } ?: offers.firstOrNull() }

    fun buy() {
        if (!fromPlay) { openStore(); return }
        connect {
            val d = details
            val offer = baseOffer()
            if (d == null || offer == null) { info("unavailable"); return@connect }
            val params = BillingFlowParams.newBuilder().setProductDetailsParamsList(listOf(
                BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(d).setOfferToken(offer.offerToken).build()
            )).build()
            client.launchBillingFlow(activity, params)
        }
    }

    override fun onPurchasesUpdated(r: BillingResult, list: MutableList<Purchase>?) {
        when (r.responseCode) {
            BillingClient.BillingResponseCode.OK -> handle(list ?: emptyList(), false)
            BillingClient.BillingResponseCode.USER_CANCELED -> info("cancelled")
            BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> refresh()
            else -> info("error")
        }
    }

    fun manage() = open("https://play.google.com/store/account/subscriptions?sku=$PRODUCT&package=" + activity.packageName)
    fun openStore() = open(STORE)

    fun open(url: String) {
        try { activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (e: Exception) {}
    }

    fun end() { try { client.endConnection() } catch (e: Exception) {} }
}
