package com.astroforge.dysonprotocol.core.offline

import android.os.SystemClock
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class TrustedInstant(
    val epochMs: Long,
    val elapsedRealtimeMs: Long,
    val ntpSynced: Boolean,
)

@Singleton
class TimeAuthority @Inject constructor() {

    @Volatile
    private var ntpOffsetMs: Long? = null

    suspend fun syncNtp() {
        val ntp = withContext(Dispatchers.IO) { SntpClient.requestTimeMs() } ?: return
        ntpOffsetMs = ntp - System.currentTimeMillis()
    }

    fun now(): TrustedInstant {
        val wall = System.currentTimeMillis()
        val offset = ntpOffsetMs
        val epoch = if (offset != null) wall + offset else wall
        return TrustedInstant(
            epochMs = epoch,
            elapsedRealtimeMs = SystemClock.elapsedRealtime(),
            ntpSynced = offset != null,
        )
    }

    /**
     * Validates elapsed wall time against monotonic elapsedRealtime when the process
     * (or at least the boot session) can corroborate it. Clock rollback yields zero delta.
     * Forward jumps larger than monotonic corroboration while still in the same boot are rejected.
     */
    fun validatedElapsedMs(
        savedEpochMs: Long,
        savedElapsedRealtimeMs: Long,
        savedBootId: Long,
        now: TrustedInstant,
        currentBootId: Long,
        maxElapsedMs: Long,
    ): ElapsedVerdict {
        if (savedEpochMs <= 0L) {
            return ElapsedVerdict(0L, rejected = false, reason = "first_run")
        }
        val wallDelta = now.epochMs - savedEpochMs
        if (wallDelta < 0L) {
            return ElapsedVerdict(0L, rejected = true, reason = "clock_rollback")
        }
        if (savedBootId == currentBootId && savedElapsedRealtimeMs > 0L) {
            val monoDelta = now.elapsedRealtimeMs - savedElapsedRealtimeMs
            if (monoDelta < 0L) {
                return ElapsedVerdict(0L, rejected = true, reason = "monotonic_rollback")
            }
            val slackMs = 5_000L
            if (wallDelta > monoDelta + slackMs) {
                return ElapsedVerdict(
                    elapsedMs = monoDelta.coerceAtMost(maxElapsedMs),
                    rejected = true,
                    reason = "wall_ahead_of_monotonic",
                )
            }
            return ElapsedVerdict(
                elapsedMs = minOf(wallDelta, monoDelta, maxElapsedMs),
                rejected = false,
                reason = "monotonic_corroborated",
            )
        }
        val elapsed = minOf(wallDelta, maxElapsedMs)
        return ElapsedVerdict(
            elapsedMs = elapsed,
            rejected = false,
            reason = if (wallDelta > maxElapsedMs) "capped" else "wall_clock",
        )
    }
}

data class ElapsedVerdict(
    val elapsedMs: Long,
    val rejected: Boolean,
    val reason: String,
)
