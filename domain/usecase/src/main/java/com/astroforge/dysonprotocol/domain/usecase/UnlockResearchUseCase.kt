package com.astroforge.dysonprotocol.domain.usecase

import com.astroforge.dysonprotocol.domain.model.GameCatalog
import com.astroforge.dysonprotocol.domain.model.GameState
import javax.inject.Inject

class UnlockResearchUseCase @Inject constructor() {

    fun canUnlock(state: GameState, upgradeId: String): Boolean {
        if (!GameCatalog.isResearchAvailable(state, upgradeId)) return false
        val def = GameCatalog.upgrade(upgradeId) ?: return false
        return state.amount(def.costResource) >= def.cost
    }

    fun unlock(state: GameState, upgradeId: String): GameState {
        if (!canUnlock(state, upgradeId)) return state
        val def = GameCatalog.upgrade(upgradeId) ?: return state
        val paid = state.withAmount(def.costResource, state.amount(def.costResource) - def.cost)
        return paid.copy(research = paid.research.withPurchased(upgradeId))
    }
}
