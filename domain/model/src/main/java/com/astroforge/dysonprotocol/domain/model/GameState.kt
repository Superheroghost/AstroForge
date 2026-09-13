package com.astroforge.dysonprotocol.domain.model

import com.astroforge.dysonprotocol.core.math.BigNumber
import com.astroforge.dysonprotocol.core.math.IdleFormulas

data class Rates(
    val orePerSecond: BigNumber,
    val alloyPerSecond: BigNumber,
    val energyPerSecond: BigNumber,
) {
    fun forResource(type: ResourceType): BigNumber = when (type) {
        ResourceType.ORE -> orePerSecond
        ResourceType.ALLOY -> alloyPerSecond
        ResourceType.ENERGY -> energyPerSecond
        ResourceType.QUARKS -> BigNumber.ZERO
    }

    companion object {
        val ZERO = Rates(BigNumber.ZERO, BigNumber.ZERO, BigNumber.ZERO)
    }
}

data class GameState(
    val ore: BigNumber,
    val alloy: BigNumber,
    val energy: BigNumber,
    val quarks: BigNumber,
    val lifetimeEnergy: BigNumber,
    val generators: Map<String, Generator>,
    val research: ResearchTree,
    val prestige: PrestigeState,
    val tickIndex: Long,
    val lastTickEpochMs: Long,
    val createdEpochMs: Long,
) {
    fun amount(type: ResourceType): BigNumber = when (type) {
        ResourceType.ORE -> ore
        ResourceType.ALLOY -> alloy
        ResourceType.ENERGY -> energy
        ResourceType.QUARKS -> quarks
    }

    fun withAmount(type: ResourceType, value: BigNumber): GameState = when (type) {
        ResourceType.ORE -> copy(ore = value)
        ResourceType.ALLOY -> copy(alloy = value)
        ResourceType.ENERGY -> copy(energy = value)
        ResourceType.QUARKS -> copy(quarks = value, prestige = prestige.copy(quarks = value))
    }

    fun generatorOwned(id: String): Int = generators[id]?.owned ?: 0

    fun rates(): Rates = ProductionMath.rates(this)

    companion object {
        fun newGame(nowMs: Long): GameState {
            val gens = GameCatalog.generators.associate { def ->
                def.id to Generator(def.id, owned = if (def.id == GameCatalog.MINING_DRONE) 1 else 0)
            }
            return GameState(
                ore = BigNumber.ZERO,
                alloy = BigNumber.ZERO,
                energy = BigNumber.ZERO,
                quarks = BigNumber.ZERO,
                lifetimeEnergy = BigNumber.ZERO,
                generators = gens,
                research = ResearchTree(emptySet()),
                prestige = PrestigeState(
                    quarks = BigNumber.ZERO,
                    lifetimeEnergy = BigNumber.ZERO,
                    prestigeCount = 0,
                    lastPrestigeEpochMs = 0L,
                ),
                tickIndex = 0L,
                lastTickEpochMs = nowMs,
                createdEpochMs = nowMs,
            )
        }
    }
}

data class OfflineProgressResult(
    val elapsedMs: Long,
    val oreEarned: BigNumber,
    val alloyEarned: BigNumber,
    val energyEarned: BigNumber,
    val dysonConstructionProgress: Double,
    val nextDysonNodeCost: BigNumber,
    val capped: Boolean,
    val rejectedByAntiCheat: Boolean,
    val applied: GameState,
)

object ProductionMath {
    fun rates(state: GameState): Rates {
        val prestigeMul = IdleFormulas.prestigeMultiplier(state.quarks)
        val resourceMuls = resourceMultipliers(state)
        val ore = accumulate(state, ResourceType.ORE, prestigeMul, resourceMuls)
        val alloy = accumulate(state, ResourceType.ALLOY, prestigeMul, resourceMuls)
        val energy = accumulate(state, ResourceType.ENERGY, prestigeMul, resourceMuls)
        return Rates(ore, alloy, energy)
    }

    fun isGeneratorUnlocked(state: GameState, generatorId: String): Boolean {
        val def = GameCatalog.generator(generatorId) ?: return false
        val req = def.requiredResearchId ?: return true
        return state.research.isPurchased(req)
    }

    private fun accumulate(
        state: GameState,
        type: ResourceType,
        prestigeMul: BigNumber,
        resourceMuls: Map<ResourceType, BigNumber>,
    ): BigNumber {
        var total = BigNumber.ZERO
        for (def in GameCatalog.generators) {
            if (def.produces != type) continue
            if (!isGeneratorUnlocked(state, def.id)) continue
            val owned = state.generatorOwned(def.id)
            val genMul = generatorMultiplier(state, def.id)
            val multipliers = listOf(
                prestigeMul,
                resourceMuls.getValue(type),
                genMul,
            )
            total += IdleFormulas.productionPerSecond(def.baseProduction, owned, multipliers)
        }
        return total
    }

    private fun resourceMultipliers(state: GameState): Map<ResourceType, BigNumber> {
        val map = mutableMapOf(
            ResourceType.ORE to BigNumber.ONE,
            ResourceType.ALLOY to BigNumber.ONE,
            ResourceType.ENERGY to BigNumber.ONE,
            ResourceType.QUARKS to BigNumber.ONE,
        )
        for (id in state.research.purchasedIds) {
            when (val effect = GameCatalog.upgrade(id)?.effect) {
                is ResearchEffect.MultiplyResource -> {
                    map[effect.resource] = map.getValue(effect.resource) * effect.factor
                }
                else -> Unit
            }
        }
        return map
    }

    private fun generatorMultiplier(state: GameState, generatorId: String): BigNumber {
        var mul = BigNumber.ONE
        for (id in state.research.purchasedIds) {
            val effect = GameCatalog.upgrade(id)?.effect
            if (effect is ResearchEffect.MultiplyGenerator && effect.generatorId == generatorId) {
                mul *= effect.factor
            }
        }
        return mul
    }
}
