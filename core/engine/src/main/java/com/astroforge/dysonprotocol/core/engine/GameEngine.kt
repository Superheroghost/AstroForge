package com.astroforge.dysonprotocol.core.engine

import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import com.astroforge.dysonprotocol.core.offline.OfflineCatchUpController
import com.astroforge.dysonprotocol.domain.model.BuyMode
import com.astroforge.dysonprotocol.domain.model.GameState
import com.astroforge.dysonprotocol.domain.model.OfflineProgressResult
import com.astroforge.dysonprotocol.domain.usecase.GameRepository
import com.astroforge.dysonprotocol.domain.usecase.GameSaveScheduler
import com.astroforge.dysonprotocol.domain.usecase.LiveGameSnapshot
import com.astroforge.dysonprotocol.domain.usecase.PurchaseUpgradeUseCase
import com.astroforge.dysonprotocol.domain.usecase.TickUseCase
import com.astroforge.dysonprotocol.domain.usecase.TriggerPrestigeUseCase
import com.astroforge.dysonprotocol.domain.usecase.UnlockResearchUseCase
import java.util.concurrent.atomic.AtomicBoolean
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.min
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

@Singleton
class GameEngine @Inject constructor(
    private val repository: GameRepository,
    private val snapshot: LiveGameSnapshot,
    private val tickUseCase: TickUseCase,
    private val purchaseUseCase: PurchaseUpgradeUseCase,
    private val prestigeUseCase: TriggerPrestigeUseCase,
    private val researchUseCase: UnlockResearchUseCase,
    private val offlineCatchUp: OfflineCatchUpController,
    private val saveScheduler: GameSaveScheduler,
) : DefaultLifecycleObserver {

    private val engineJob = SupervisorJob()
    private val engineScope = CoroutineScope(engineJob + Dispatchers.Default)
    private val mutex = Mutex()
    private val started = AtomicBoolean(false)

    private var loopJob: Job? = null
    private var saveJob: Job? = null
    private var latest: GameState = GameState.newGame(System.currentTimeMillis())

    private val _gameState = MutableStateFlow(latest)
    val gameState: StateFlow<GameState> = _gameState.asStateFlow()

    private val _offlineSummary = MutableSharedFlow<OfflineProgressResult>(
        extraBufferCapacity = 1,
        onBufferOverflow = BufferOverflow.DROP_OLDEST,
    )
    val offlineSummary: SharedFlow<OfflineProgressResult> = _offlineSummary.asSharedFlow()

    override fun onStart(owner: LifecycleOwner) {
        engineScope.launch { startInternal() }
    }

    override fun onStop(owner: LifecycleOwner) {
        engineScope.launch { stopInternal() }
    }

    fun buyGenerator(id: String, mode: BuyMode) {
        engineScope.launch {
            mutex.withLock {
                latest = purchaseUseCase.purchase(latest, id, mode)
                snapshot.publish(latest)
            }
        }
    }

    fun unlockResearch(id: String) {
        engineScope.launch {
            mutex.withLock {
                latest = researchUseCase.unlock(latest, id)
                snapshot.publish(latest)
            }
        }
    }

    fun prestige() {
        engineScope.launch {
            mutex.withLock {
                latest = prestigeUseCase.execute(latest, System.currentTimeMillis())
                snapshot.publish(latest)
                persistLocked()
            }
        }
    }

    private suspend fun startInternal() {
        mutex.withLock {
            if (started.get()) {
                resumeLoopLocked()
                return
            }
            val loaded = repository.load() ?: GameState.newGame(System.currentTimeMillis())
            val result = offlineCatchUp.catchUp(loaded)
            latest = result.applied
            snapshot.publish(latest)
            publishThrottled(latest)
            started.set(true)
            if (result.elapsedMs > 1_000L || result.rejectedByAntiCheat) {
                _offlineSummary.emit(result)
            }
            resumeLoopLocked()
        }
    }

    private suspend fun stopInternal() {
        mutex.withLock {
            loopJob?.cancel()
            loopJob = null
            saveJob?.cancel()
            saveJob = null
            persistLocked()
            offlineCatchUp.persistOnBackground(latest)
        }
    }

    private fun resumeLoopLocked() {
        if (loopJob?.isActive == true) return
        loopJob = engineScope.launch { runLoop() }
        saveJob = engineScope.launch { runAutosave() }
    }

    private suspend fun runLoop() {
        var lastNanos = System.nanoTime()
        var lastPublishNanos = lastNanos
        while (engineScope.isActive) {
            delay(TICK_PERIOD_MS)
            val nowNanos = System.nanoTime()
            val dt = min((nowNanos - lastNanos) / 1_000_000_000.0, MAX_FRAME_DT)
            lastNanos = nowNanos
            mutex.withLock {
                latest = tickUseCase.apply(latest, dt, System.currentTimeMillis())
                snapshot.publish(latest)
                if (nowNanos - lastPublishNanos >= UI_PUBLISH_PERIOD_NANOS) {
                    lastPublishNanos = nowNanos
                    publishThrottled(latest)
                }
            }
        }
    }

    private suspend fun runAutosave() {
        while (engineScope.isActive) {
            delay(SAVE_PERIOD_MS)
            mutex.withLock { persistLocked() }
        }
    }

    private suspend fun persistLocked() {
        val toSave = latest
        withContext(Dispatchers.IO) {
            repository.save(toSave)
            saveScheduler.enqueue()
        }
        offlineCatchUp.persistOnBackground(toSave)
    }

    private fun publishThrottled(state: GameState) {
        _gameState.value = state
    }

    companion object {
        const val TICK_HZ = 20
        const val TICK_PERIOD_MS = 1000L / TICK_HZ
        const val UI_PUBLISH_HZ = 10
        const val UI_PUBLISH_PERIOD_NANOS = 1_000_000_000L / UI_PUBLISH_HZ
        const val SAVE_PERIOD_MS = 30_000L
        const val MAX_FRAME_DT = 0.25
    }
}
