package com.astroforge.dysonprotocol.domain.usecase

import com.astroforge.dysonprotocol.core.math.IdleFormulas
import com.astroforge.dysonprotocol.domain.model.GameState
import com.astroforge.dysonprotocol.domain.model.ResourceType
import javax.inject.Inject

class TickUseCase @Inject constructor() {

    fun apply(state: GameState, deltaSeconds: Double, nowEpochMs: Long): GameState {
        if (deltaSeconds <= 0.0) return state.copy(lastTickEpochMs = nowEpochMs)
        val rates = state.rates()
        val oreGain = IdleFormulas.integrateConstantRate(rates.orePerSecond, deltaSeconds)
        val alloyGain = IdleFormulas.integrateConstantRate(rates.alloyPerSecond, deltaSeconds)
        val energyGain = IdleFormulas.integrateConstantRate(rates.energyPerSecond, deltaSeconds)
        val newEnergy = state.energy + energyGain
        val newLifetime = state.lifetimeEnergy + energyGain
        return state.copy(
            ore = state.ore + oreGain,
            alloy = state.alloy + alloyGain,
            energy = newEnergy,
            lifetimeEnergy = newLifetime,
            prestige = state.prestige.copy(lifetimeEnergy = newLifetime),
            tickIndex = state.tickIndex + 1,
            lastTickEpochMs = nowEpochMs,
        )
    }

    fun applyForResourcePreview(state: GameState, type: ResourceType, deltaSeconds: Double) =
        IdleFormulas.integrateConstantRate(state.rates().forResource(type), deltaSeconds)
}
