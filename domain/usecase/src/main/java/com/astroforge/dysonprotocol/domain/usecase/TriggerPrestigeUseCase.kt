package com.astroforge.dysonprotocol.domain.usecase

import com.astroforge.dysonprotocol.core.math.BigNumber
import com.astroforge.dysonprotocol.core.math.IdleFormulas
import com.astroforge.dysonprotocol.domain.model.GameCatalog
import com.astroforge.dysonprotocol.domain.model.GameState
import com.astroforge.dysonprotocol.domain.model.Generator
import com.astroforge.dysonprotocol.domain.model.PrestigeState
import javax.inject.Inject

class TriggerPrestigeUseCase @Inject constructor() {

    fun previewQuarks(state: GameState): BigNumber = IdleFormulas.prestigeQuarks(state.lifetimeEnergy)

    fun canPrestige(state: GameState): Boolean = previewQuarks(state) > BigNumber.ZERO

    fun execute(state: GameState, nowEpochMs: Long): GameState {
        val gained = previewQuarks(state)
        if (gained.isZero) return state
        val newQuarks = state.quarks + gained
        val gens = GameCatalog.generators.associate { def ->
            def.id to Generator(def.id, owned = if (def.id == GameCatalog.MINING_DRONE) 1 else 0)
        }
        return GameState(
            ore = BigNumber.ZERO,
            alloy = BigNumber.ZERO,
            energy = BigNumber.ZERO,
            quarks = newQuarks,
            lifetimeEnergy = state.lifetimeEnergy,
            generators = gens,
            research = state.research,
            prestige = PrestigeState(
                quarks = newQuarks,
                lifetimeEnergy = state.lifetimeEnergy,
                prestigeCount = state.prestige.prestigeCount + 1,
                lastPrestigeEpochMs = nowEpochMs,
            ),
            tickIndex = state.tickIndex + 1,
            lastTickEpochMs = nowEpochMs,
            createdEpochMs = state.createdEpochMs,
        )
    }
}
