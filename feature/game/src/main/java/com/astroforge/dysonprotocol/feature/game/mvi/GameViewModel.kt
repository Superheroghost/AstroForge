package com.astroforge.dysonprotocol.feature.game.mvi

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.astroforge.dysonprotocol.core.engine.GameEngine
import com.astroforge.dysonprotocol.domain.model.BuyMode
import com.astroforge.dysonprotocol.domain.model.OfflineProgressResult
import com.astroforge.dysonprotocol.domain.usecase.PurchaseUpgradeUseCase
import com.astroforge.dysonprotocol.domain.usecase.TriggerPrestigeUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

@HiltViewModel
class GameViewModel @Inject constructor(
    private val engine: GameEngine,
    private val purchaseUseCase: PurchaseUpgradeUseCase,
    private val prestigeUseCase: TriggerPrestigeUseCase,
) : ViewModel() {

    private val buyMode = MutableStateFlow(BuyMode.ONE)
    private val offline = MutableStateFlow<OfflineProgressResult?>(null)

    val uiState: StateFlow<GameUiState> = combine(
        engine.gameState,
        buyMode,
        offline,
    ) { state, mode, summary ->
        state.toUi(mode, summary, purchaseUseCase, prestigeUseCase)
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = engine.gameState.value.toUi(
            buyMode.value,
            null,
            purchaseUseCase,
            prestigeUseCase,
        ),
    )

    init {
        viewModelScope.launch {
            engine.offlineSummary.collect { result ->
                if (result.elapsedMs > 0L || result.rejectedByAntiCheat) {
                    offline.value = result
                }
            }
        }
    }

    fun onIntent(intent: GameIntent) {
        when (intent) {
            is GameIntent.BuyGenerator -> engine.buyGenerator(intent.generatorId, buyMode.value)
            is GameIntent.SetBuyMode -> buyMode.value = intent.mode
            is GameIntent.UnlockResearch -> engine.unlockResearch(intent.upgradeId)
            GameIntent.Prestige -> engine.prestige()
            GameIntent.DismissOffline -> offline.value = null
        }
    }
}
