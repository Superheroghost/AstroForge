package com.astroforge.dysonprotocol.domain.usecase

import com.astroforge.dysonprotocol.core.math.IdleFormulas
import com.astroforge.dysonprotocol.domain.model.GameCatalog
import com.astroforge.dysonprotocol.domain.model.GameState
import com.astroforge.dysonprotocol.domain.model.OfflineProgressResult
import javax.inject.Inject
import kotlin.math.min

class ApplyOfflineProgressUseCase @Inject constructor(
    private val tickUseCase: TickUseCase,
) {

    fun apply(
        state: GameState,
        elapsedMs: Long,
        nowEpochMs: Long,
        maxElapsedMs: Long,
        rejectedByAntiCheat: Boolean,
    ): OfflineProgressResult {
        if (rejectedByAntiCheat || elapsedMs <= 0L) {
            return OfflineProgressResult(
                elapsedMs = 0L,
                oreEarned = com.astroforge.dysonprotocol.core.math.BigNumber.ZERO,
                alloyEarned = com.astroforge.dysonprotocol.core.math.BigNumber.ZERO,
                energyEarned = com.astroforge.dysonprotocol.core.math.BigNumber.ZERO,
                dysonConstructionProgress = 0.0,
                nextDysonNodeCost = nextDysonCost(state),
                capped = false,
                rejectedByAntiCheat = rejectedByAntiCheat,
                applied = state.copy(lastTickEpochMs = nowEpochMs),
            )
        }
        val cappedMs = min(elapsedMs, maxElapsedMs)
        val capped = cappedMs < elapsedMs
        val dt = cappedMs / 1000.0
        val before = state
        val after = tickUseCase.apply(state, dt, nowEpochMs)
        val swarmDef = GameCatalog.generator(GameCatalog.DYSON_SWARM)!!
        val nextCost = IdleFormulas.costAtLevel(
            swarmDef.baseCost,
            swarmDef.costMultiplier,
            after.generatorOwned(GameCatalog.DYSON_SWARM),
        )
        val progress = if (nextCost.isZero) {
            1.0
        } else {
            val ratio = (after.energy / nextCost).toDouble()
            when {
                ratio.isNaN() -> 0.0
                ratio.isInfinite() -> 1.0
                else -> ratio.coerceIn(0.0, 1.0)
            }
        }
        return OfflineProgressResult(
            elapsedMs = cappedMs,
            oreEarned = after.ore - before.ore,
            alloyEarned = after.alloy - before.alloy,
            energyEarned = after.energy - before.energy,
            dysonConstructionProgress = progress,
            nextDysonNodeCost = nextCost,
            capped = capped,
            rejectedByAntiCheat = false,
            applied = after,
        )
    }

    private fun nextDysonCost(state: GameState) = IdleFormulas.costAtLevel(
        GameCatalog.generator(GameCatalog.DYSON_SWARM)!!.baseCost,
        GameCatalog.generator(GameCatalog.DYSON_SWARM)!!.costMultiplier,
        state.generatorOwned(GameCatalog.DYSON_SWARM),
    )
}
