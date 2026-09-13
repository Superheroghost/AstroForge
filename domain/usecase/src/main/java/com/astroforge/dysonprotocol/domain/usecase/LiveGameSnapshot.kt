package com.astroforge.dysonprotocol.domain.usecase

import com.astroforge.dysonprotocol.domain.model.GameState
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LiveGameSnapshot @Inject constructor() {
    @Volatile
    var value: GameState? = null
        private set

    fun publish(state: GameState) {
        value = state
    }
}
