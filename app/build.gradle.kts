plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.gms.google-services")
}

android {
    namespace = "com.mathsnap"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.mathsnap"
        minSdk = 24
        targetSdk = 36
        versionCode = 30
        versionName = "8.1"
        ndk { abiFilters += listOf("arm64-v8a", "armeabi-v7a") }
    }

    // A fixed signing key, so each new build installs as an update over the last one.
    signingConfigs {
        create("stable") {
            storeFile = file("mathsnap.keystore")
            storePassword = "mathsnap"
            keyAlias = "mathsnap"
            keyPassword = "mathsnap"
        }
        // The Google Play upload key. It is never in the code: the build reads it from
        // GitHub secrets (UPLOAD_KEYSTORE_B64 and UPLOAD_KEY_PASSWORD).
        val uploadStore = System.getenv("UPLOAD_KEYSTORE_FILE")
        if (uploadStore != null && file(uploadStore).exists()) {
            create("play") {
                storeFile = file(uploadStore)
                storePassword = System.getenv("UPLOAD_KEY_PASSWORD")
                keyAlias = "upload"
                keyPassword = System.getenv("UPLOAD_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("stable")
        }
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.findByName("play") ?: signingConfigs.getByName("stable")
        }
    }
    lint {
        checkReleaseBuilds = false
        abortOnError = false
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    // Google's text scanner, runs fully on the phone (no internet)
    implementation("com.google.mlkit:text-recognition:16.0.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")

    // Optional account: sign-in and synced history (short text only)
    implementation(platform("com.google.firebase:firebase-bom:35.1.0"))
    implementation("com.google.firebase:firebase-auth")
    implementation("com.google.firebase:firebase-firestore")
    // Sign in with Google
    implementation("androidx.credentials:credentials:1.3.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.3.0")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")
    // Pro subscription through Google Play
    implementation("com.android.billingclient:billing-ktx:8.0.0")
}
