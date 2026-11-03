plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.mathsnap"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.mathsnap"
        minSdk = 24
        targetSdk = 34
        versionCode = 7
        versionName = "3.2"
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
    }

    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("stable")
        }
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("stable")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    // Google's text scanner, runs fully on the phone (no internet)
    implementation("com.google.mlkit:text-recognition:16.0.1")
}
