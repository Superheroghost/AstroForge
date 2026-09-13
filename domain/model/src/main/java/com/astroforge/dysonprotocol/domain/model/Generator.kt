package com.astroforge.dysonprotocol.domain.model

import com.astroforge.dysonprotocol.core.math.BigNumber

enum class BuyMode(val quantity: Int?) {
    ONE(1),
    TEN(10),
    MAX(null),
}

data class GeneratorDefinition(
    val id: String,
    val name: String,
    val description: String,
    val produces: ResourceType,
    val baseCost: BigNumber,
    val costMultiplier: Double,
    val baseProduction: BigNumber,
    val requiredResearchId: String?,
)

data class Generator(
    val id: String,
    val owned: Int,
) {
    init {
        require(owned >= 0)
    }
}

data class UpgradeDefinition(
    val id: String,
    val name: String,
    val description: String,
    val cost: BigNumber,
    val costResource: ResourceType,
    val effect: ResearchEffect,
    val prerequisites: Set<String>,
)

sealed class ResearchEffect {
    data class UnlockGenerator(val generatorId: String) : ResearchEffect()
    data class MultiplyResource(val resource: ResourceType, val factor: Double) : ResearchEffect()
    data class MultiplyGenerator(val generatorId: String, val factor: Double) : ResearchEffect()
}

data class ResearchNode(
    val id: String,
    val purchased: Boolean,
)

data class ResearchTree(
    val purchasedIds: Set<String>,
) {
    fun isPurchased(id: String): Boolean = id in purchasedIds

    fun withPurchased(id: String): ResearchTree = copy(purchasedIds = purchasedIds + id)
}

data class PrestigeState(
    val quarks: BigNumber,
    val lifetimeEnergy: BigNumber,
    val prestigeCount: Int,
    val lastPrestigeEpochMs: Long,
)

data class Upgrade(
    val id: String,
    val purchased: Boolean,
)
