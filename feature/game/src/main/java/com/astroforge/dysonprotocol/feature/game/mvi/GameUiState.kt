package com.astroforge.dysonprotocol.feature.game.mvi

import com.astroforge.dysonprotocol.core.math.IdleFormulas
import com.astroforge.dysonprotocol.domain.model.BuyMode
import com.astroforge.dysonprotocol.domain.model.GameCatalog
import com.astroforge.dysonprotocol.domain.model.GameState
import com.astroforge.dysonprotocol.domain.model.OfflineProgressResult
import com.astroforge.dysonprotocol.domain.model.ProductionMath
import com.astroforge.dysonprotocol.domain.model.ResourceType
import com.astroforge.dysonprotocol.domain.usecase.PurchaseUpgradeUseCase
import com.astroforge.dysonprotocol.domain.usecase.TriggerPrestigeUseCase

sealed interface GameIntent {
    data class BuyGenerator(val generatorId: String) : GameIntent
    data class SetBuyMode(val mode: BuyMode) : GameIntent
    data class UnlockResearch(val upgradeId: String) : GameIntent
    data object Prestige : GameIntent
    data object DismissOffline : GameIntent
}

data class ResourceUi(
    val type: ResourceType,
    val label: String,
    val amount: String,
    val perSecond: String,
)

data class GeneratorUi(
    val id: String,
    val name: String,
    val description: String,
    val owned: Int,
    val producesLabel: String,
    val rateText: String,
    val costText: String,
    val quantity: Int,
    val affordable: Boolean,
    val unlocked: Boolean,
    val lockedHint: String?,
)

data class ResearchUi(
    val id: String,
    val name: String,
    val description: String,
    val costText: String,
    val available: Boolean,
    val purchased: Boolean,
)

data class GameUiState(
    val ore: ResourceUi,
    val alloy: ResourceUi,
    val energy: ResourceUi,
    val quarks: ResourceUi,
    val buyMode: BuyMode,
    val generators: List<GeneratorUi>,
    val research: List<ResearchUi>,
    val prestigeLabel: String,
    val canPrestige: Boolean,
    val prestigeCount: Int,
    val droneCount: Int,
    val swarmCount: Int,
    val offline: OfflineProgressResult?,
    val tickIndex: Long,
)

fun GameState.toUi(
    buyMode: BuyMode,
    offline: OfflineProgressResult?,
    purchase: PurchaseUpgradeUseCase,
    prestige: TriggerPrestigeUseCase,
): GameUiState {
    val rates = rates()
    return GameUiState(
        ore = ResourceUi(ResourceType.ORE, "Stardust Ore", ore.formatSuffix(), "+${rates.orePerSecond.formatSuffix()}/s"),
        alloy = ResourceUi(ResourceType.ALLOY, "Exotic Alloy", alloy.formatSuffix(), "+${rates.alloyPerSecond.formatSuffix()}/s"),
        energy = ResourceUi(ResourceType.ENERGY, "Stellar Energy", energy.formatSuffix(), "+${rates.energyPerSecond.formatSuffix()}/s"),
        quarks = ResourceUi(ResourceType.QUARKS, "Quarks", quarks.formatSuffix(), "×${IdleFormulas.prestigeMultiplier(quarks).formatSuffix()}"),
        buyMode = buyMode,
        generators = GameCatalog.generators.map { def ->
            val quote = purchase.quote(this, def.id, buyMode)
            val unlocked = ProductionMath.isGeneratorUnlocked(this, def.id)
            GeneratorUi(
                id = def.id,
                name = def.name,
                description = def.description,
                owned = generatorOwned(def.id),
                producesLabel = def.produces.name.lowercase().replaceFirstChar { it.titlecase() },
                rateText = IdleFormulas.productionPerSecond(
                    def.baseProduction,
                    generatorOwned(def.id),
                    listOf(IdleFormulas.prestigeMultiplier(quarks)),
                ).formatSuffix() + "/s",
                costText = if (quote.quantity > 0) quote.totalCost.formatSuffix() else quote.totalCost.formatSuffix(),
                quantity = quote.quantity,
                affordable = quote.affordable,
                unlocked = unlocked,
                lockedHint = def.requiredResearchId?.let { GameCatalog.upgrade(it)?.name }?.let { "Requires $it" },
            )
        },
        research = GameCatalog.upgrades.map { def ->
            ResearchUi(
                id = def.id,
                name = def.name,
                description = def.description,
                costText = "${def.cost.formatSuffix()} ${def.costResource.name.lowercase()}",
                available = GameCatalog.isResearchAvailable(this, def.id) && amount(def.costResource) >= def.cost,
                purchased = research.isPurchased(def.id),
            )
        },
        prestigeLabel = "Supernova Reset  +${prestige.previewQuarks(this).formatSuffix()} Quarks",
        canPrestige = prestige.canPrestige(this),
        prestigeCount = this.prestige.prestigeCount,
        droneCount = generatorOwned(GameCatalog.MINING_DRONE),
        swarmCount = generatorOwned(GameCatalog.DYSON_SWARM),
        offline = offline,
        tickIndex = tickIndex,
    )
}
