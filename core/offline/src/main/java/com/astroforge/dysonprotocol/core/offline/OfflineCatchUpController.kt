package com.astroforge.dysonprotocol.core.offline

import com.astroforge.dysonprotocol.domain.model.GameState
import com.astroforge.dysonprotocol.domain.model.OfflineProgressResult
import com.astroforge.dysonprotocol.domain.usecase.ApplyOfflineProgressUseCase
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OfflineCatchUpController @Inject constructor(
    private val timeAuthority: TimeAuthority,
    private val timestampStore: SecureTimestampStore,
    private val hasher: StateIntegrityHasher,
    private val applyOfflineProgress: ApplyOfflineProgressUseCase,
) {
    suspend fun catchUp(state: GameState, maxOfflineMs: Long = MAX_OFFLINE_MS): OfflineProgressResult {
        timeAuthority.syncNtp()
        val now = timeAuthority.now()
        val saved = timestampStore.read()
        if (saved == null) {
            persist(state, now)
            return applyOfflineProgress.apply(
                state = state,
                elapsedMs = 0L,
                nowEpochMs = now.epochMs,
                maxElapsedMs = maxOfflineMs,
                rejectedByAntiCheat = false,
            )
        }
        val hashOk = hasher.matches(state, saved.lastActiveEpochMs, saved.stateHash)
        val verdict = timeAuthority.validatedElapsedMs(
            savedEpochMs = saved.lastActiveEpochMs,
            savedElapsedRealtimeMs = saved.lastElapsedRealtimeMs,
            savedBootId = saved.bootId,
            now = now,
            currentBootId = timestampStore.bootId(),
            maxElapsedMs = maxOfflineMs,
        )
        val rejected = !hashOk || verdict.rejected
        val elapsed = if (rejected && !hashOk) 0L else verdict.elapsedMs
        val result = applyOfflineProgress.apply(
            state = state,
            elapsedMs = elapsed,
            nowEpochMs = now.epochMs,
            maxElapsedMs = maxOfflineMs,
            rejectedByAntiCheat = rejected && !hashOk,
        )
        persist(result.applied, now)
        return result
    }

    fun persistOnBackground(state: GameState) {
        persist(state, timeAuthority.now())
    }

    private fun persist(state: GameState, now: TrustedInstant) {
        val hash = hasher.hash(state, now.epochMs)
        timestampStore.write(
            SecureTimestampRecord(
                lastActiveEpochMs = now.epochMs,
                lastElapsedRealtimeMs = now.elapsedRealtimeMs,
                bootId = timestampStore.bootId(),
                stateHash = hash,
            ),
        )
    }

    companion object {
        const val MAX_OFFLINE_MS = 72L * 60L * 60L * 1000L
    }
}
