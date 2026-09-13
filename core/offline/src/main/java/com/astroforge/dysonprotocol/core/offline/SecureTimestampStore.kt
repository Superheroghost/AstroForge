package com.astroforge.dysonprotocol.core.offline

import android.content.Context
import android.content.SharedPreferences
import android.os.SystemClock
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

data class SecureTimestampRecord(
    val lastActiveEpochMs: Long,
    val lastElapsedRealtimeMs: Long,
    val bootId: Long,
    val stateHash: String,
)

@Singleton
class SecureTimestampStore @Inject constructor(
    @ApplicationContext context: Context,
) {
    private val prefs: SharedPreferences = createPrefs(context)

    fun read(): SecureTimestampRecord? {
        if (!prefs.contains(KEY_EPOCH)) return null
        return SecureTimestampRecord(
            lastActiveEpochMs = prefs.getLong(KEY_EPOCH, 0L),
            lastElapsedRealtimeMs = prefs.getLong(KEY_ELAPSED, 0L),
            bootId = prefs.getLong(KEY_BOOT, 0L),
            stateHash = prefs.getString(KEY_HASH, "") ?: "",
        )
    }

    fun write(record: SecureTimestampRecord) {
        prefs.edit()
            .putLong(KEY_EPOCH, record.lastActiveEpochMs)
            .putLong(KEY_ELAPSED, record.lastElapsedRealtimeMs)
            .putLong(KEY_BOOT, record.bootId)
            .putString(KEY_HASH, record.stateHash)
            .apply()
    }

    fun bootId(): Long = SystemClock.elapsedRealtime() - android.os.SystemClock.uptimeMillis() + android.os.Build.TIME

    private fun createPrefs(context: Context): SharedPreferences {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        return EncryptedSharedPreferences.create(
            context,
            PREFS_FILE,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    private companion object {
        const val PREFS_FILE = "astroforge_anticheat"
        const val KEY_EPOCH = "last_active_timestamp"
        const val KEY_ELAPSED = "last_elapsed_realtime"
        const val KEY_BOOT = "boot_id"
        const val KEY_HASH = "state_hash"
    }
}
