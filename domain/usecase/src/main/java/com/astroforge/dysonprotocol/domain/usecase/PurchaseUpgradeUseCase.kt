package com.astroforge.dysonprotocol.domain.usecase

import com.astroforge.dysonprotocol.core.math.BigNumber
import com.astroforge.dysonprotocol.core.math.IdleFormulas
import com.astroforge.dysonprotocol.domain.model.BuyMode
import com.astroforge.dysonprotocol.domain.model.GameCatalog
import com.astroforge.dysonprotocol.domain.model.GameState
import com.astroforge.dysonprotocol.domain.model.Generator
import com.astroforge.dysonprotocol.domain.model.ProductionMath
import javax.inject.Inject

data class PurchaseQuote(
    val generatorId: String,
    val quantity: Int,
    val totalCost: BigNumber,
    val affordable: Boolean,
)

class PurchaseUpgradeUseCase @Inject constructor() {

    fun quote(state: GameState, generatorId: String, mode: BuyMode): PurchaseQuote {
        val def = GameCatalog.generator(generatorId)
            ?: return PurchaseQuote(generatorId, 0, BigNumber.ZERO, false)
        if (!ProductionMath.isGeneratorUnlocked(state, generatorId)) {
            return PurchaseQuote(generatorId, 0, BigNumber.ZERO, false)
        }
        val owned = state.generatorOwned(generatorId)
        val currency = state.ore
        val quantity = when (mode) {
            BuyMode.ONE -> 1
            BuyMode.TEN -> 10
            BuyMode.MAX -> IdleFormulas.maxAffordable(def.baseCost, def.costMultiplier, owned, currency)
        }
        if (quantity <= 0) {
            val oneCost = IdleFormulas.costAtLevel(def.baseCost, def.costMultiplier, owned)
            return PurchaseQuote(generatorId, 0, oneCost, false)
        }
        val total = IdleFormulas.geometricCostSum(def.baseCost, def.costMultiplier, owned, quantity)
        return PurchaseQuote(generatorId, quantity, total, currency >= total)
    }

    fun purchase(state: GameState, generatorId: String, mode: BuyMode): GameState {
        val q = quote(state, generatorId, mode)
        if (!q.affordable || q.quantity <= 0) return state
        val owned = state.generatorOwned(generatorId)
        val updatedGens = state.generators.toMutableMap()
        updatedGens[generatorId] = Generator(generatorId, owned + q.quantity)
        return state.copy(
            ore = state.ore - q.totalCost,
            generators = updatedGens,
        )
    }
}
