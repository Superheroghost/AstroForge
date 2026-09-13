package com.astroforge.dysonprotocol.domain.model

import com.astroforge.dysonprotocol.core.math.BigNumber

object GameCatalog {
    const val MINING_DRONE = "mining_drone"
    const val ALLOY_FOUNDRY = "alloy_foundry"
    const val ORBITAL_LASER = "orbital_laser"
    const val FUSION_SIPHON = "fusion_siphon"
    const val DYSON_SWARM = "dyson_swarm"

    const val RESEARCH_FOUNDRY = "research_foundry"
    const val RESEARCH_LASER = "research_laser"
    const val RESEARCH_SIPHON = "research_siphon"
    const val RESEARCH_DYSON = "research_dyson"
    const val RESEARCH_ORE_AMP = "research_ore_amp"
    const val RESEARCH_ENERGY_AMP = "research_energy_amp"
    const val RESEARCH_SWARM_AMP = "research_swarm_amp"

    val generators: List<GeneratorDefinition> = listOf(
        GeneratorDefinition(
            id = MINING_DRONE,
            name = "Mining Drone",
            description = "Autonomous harvester stripping nickel-iron asteroids for stardust ore.",
            produces = ResourceType.ORE,
            baseCost = BigNumber.fromInt(10),
            costMultiplier = 1.15,
            baseProduction = BigNumber.fromDouble(1.0),
            requiredResearchId = null,
        ),
        GeneratorDefinition(
            id = ALLOY_FOUNDRY,
            name = "Alloy Foundry",
            description = "Zero-g smelters folding ore into exotic lattice alloys.",
            produces = ResourceType.ALLOY,
            baseCost = BigNumber.fromInt(100),
            costMultiplier = 1.17,
            baseProduction = BigNumber.fromDouble(0.5),
            requiredResearchId = RESEARCH_FOUNDRY,
        ),
        GeneratorDefinition(
            id = ORBITAL_LASER,
            name = "Orbital Laser",
            description = "Photonic mining array that bleeds raw stellar flux into capacitors.",
            produces = ResourceType.ENERGY,
            baseCost = BigNumber.fromInt(500),
            costMultiplier = 1.18,
            baseProduction = BigNumber.fromDouble(2.0),
            requiredResearchId = RESEARCH_LASER,
        ),
        GeneratorDefinition(
            id = FUSION_SIPHON,
            name = "Fusion Siphon",
            description = "Taps coronal loops and dumps plasma into the swarm bus.",
            produces = ResourceType.ENERGY,
            baseCost = BigNumber.fromInt(8_000),
            costMultiplier = 1.20,
            baseProduction = BigNumber.fromDouble(15.0),
            requiredResearchId = RESEARCH_SIPHON,
        ),
        GeneratorDefinition(
            id = DYSON_SWARM,
            name = "Dyson Swarm Node",
            description = "Statite collector — one more tile in the stellar cage.",
            produces = ResourceType.ENERGY,
            baseCost = BigNumber.fromInt(250_000),
            costMultiplier = 1.22,
            baseProduction = BigNumber.fromDouble(120.0),
            requiredResearchId = RESEARCH_DYSON,
        ),
    )

    val upgrades: List<UpgradeDefinition> = listOf(
        UpgradeDefinition(
            id = RESEARCH_FOUNDRY,
            name = "Vacuum Metallurgy",
            description = "Unlocks Alloy Foundries.",
            cost = BigNumber.fromInt(50),
            costResource = ResourceType.ORE,
            effect = ResearchEffect.UnlockGenerator(ALLOY_FOUNDRY),
            prerequisites = emptySet(),
        ),
        UpgradeDefinition(
            id = RESEARCH_LASER,
            name = "Photonic Mining",
            description = "Unlocks Orbital Lasers.",
            cost = BigNumber.fromInt(250),
            costResource = ResourceType.ALLOY,
            effect = ResearchEffect.UnlockGenerator(ORBITAL_LASER),
            prerequisites = setOf(RESEARCH_FOUNDRY),
        ),
        UpgradeDefinition(
            id = RESEARCH_SIPHON,
            name = "Coronal Tether",
            description = "Unlocks Fusion Siphons.",
            cost = BigNumber.fromInt(2_000),
            costResource = ResourceType.ENERGY,
            effect = ResearchEffect.UnlockGenerator(FUSION_SIPHON),
            prerequisites = setOf(RESEARCH_LASER),
        ),
        UpgradeDefinition(
            id = RESEARCH_DYSON,
            name = "Statite Lattice",
            description = "Unlocks Dyson Swarm Nodes.",
            cost = BigNumber.fromInt(25_000),
            costResource = ResourceType.ENERGY,
            effect = ResearchEffect.UnlockGenerator(DYSON_SWARM),
            prerequisites = setOf(RESEARCH_SIPHON),
        ),
        UpgradeDefinition(
            id = RESEARCH_ORE_AMP,
            name = "Swarm Drone AI",
            description = "Mining drones produce 100% more ore.",
            cost = BigNumber.fromInt(1_000),
            costResource = ResourceType.ORE,
            effect = ResearchEffect.MultiplyGenerator(MINING_DRONE, 2.0),
            prerequisites = emptySet(),
        ),
        UpgradeDefinition(
            id = RESEARCH_ENERGY_AMP,
            name = "Helios Protocol",
            description = "All stellar energy output ×3.",
            cost = BigNumber.fromInt(50_000),
            costResource = ResourceType.ENERGY,
            effect = ResearchEffect.MultiplyResource(ResourceType.ENERGY, 3.0),
            prerequisites = setOf(RESEARCH_LASER),
        ),
        UpgradeDefinition(
            id = RESEARCH_SWARM_AMP,
            name = "Dyson Protocol",
            description = "Swarm nodes produce ×5 energy.",
            cost = BigNumber.fromInt(1_000_000),
            costResource = ResourceType.ENERGY,
            effect = ResearchEffect.MultiplyGenerator(DYSON_SWARM, 5.0),
            prerequisites = setOf(RESEARCH_DYSON),
        ),
    )

    private val generatorById = generators.associateBy { it.id }
    private val upgradeById = upgrades.associateBy { it.id }

    fun generator(id: String): GeneratorDefinition? = generatorById[id]

    fun upgrade(id: String): UpgradeDefinition? = upgradeById[id]

    fun isResearchAvailable(state: GameState, upgradeId: String): Boolean {
        val def = upgrade(upgradeId) ?: return false
        if (state.research.isPurchased(upgradeId)) return false
        return def.prerequisites.all { state.research.isPurchased(it) }
    }

    fun researchUnlocksGenerator(upgradeId: String, generatorId: String): Boolean {
        val effect = upgrade(upgradeId)?.effect
        return effect is ResearchEffect.UnlockGenerator && effect.generatorId == generatorId
    }
}
