package com.astroforge.dysonprotocol.data

import com.astroforge.dysonprotocol.core.math.BigNumber
import com.astroforge.dysonprotocol.data.db.BigNumberCodec
import com.astroforge.dysonprotocol.data.db.GameDao
import com.astroforge.dysonprotocol.data.db.GeneratorEntity
import com.astroforge.dysonprotocol.data.db.PlayerStatsEntity
import com.astroforge.dysonprotocol.data.db.ResearchEntity
import com.astroforge.dysonprotocol.domain.model.GameCatalog
import com.astroforge.dysonprotocol.domain.model.GameState
import com.astroforge.dysonprotocol.domain.model.Generator
import com.astroforge.dysonprotocol.domain.model.PrestigeState
import com.astroforge.dysonprotocol.domain.model.ResearchTree
import com.astroforge.dysonprotocol.domain.usecase.GameRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GameRepositoryImpl @Inject constructor(
    private val dao: GameDao,
) : GameRepository {

    override suspend fun load(): GameState? {
        val player = dao.player() ?: return null
        val gens = dao.generators().associate { it.id to Generator(it.id, it.owned) }
        val mergedGens = GameCatalog.generators.associate { def ->
            def.id to (gens[def.id] ?: Generator(def.id, 0))
        }
        val researchIds = if (player.researchCsv.isBlank()) {
            dao.research().filter { it.purchased }.map { it.id }.toSet()
        } else {
            player.researchCsv.split(',').filter { it.isNotBlank() }.toSet()
        }
        val quarks = BigNumberCodec.decode(player.quarks)
        val lifetime = BigNumberCodec.decode(player.lifetimeEnergy)
        return GameState(
            ore = BigNumberCodec.decode(player.ore),
            alloy = BigNumberCodec.decode(player.alloy),
            energy = BigNumberCodec.decode(player.energy),
            quarks = quarks,
            lifetimeEnergy = lifetime,
            generators = mergedGens,
            research = ResearchTree(researchIds),
            prestige = PrestigeState(
                quarks = quarks,
                lifetimeEnergy = lifetime,
                prestigeCount = player.prestigeCount,
                lastPrestigeEpochMs = player.lastPrestigeEpochMs,
            ),
            tickIndex = player.tickIndex,
            lastTickEpochMs = player.lastTickEpochMs,
            createdEpochMs = player.createdEpochMs,
        )
    }

    override suspend fun save(state: GameState) {
        val player = PlayerStatsEntity(
            ore = BigNumberCodec.encode(state.ore),
            alloy = BigNumberCodec.encode(state.alloy),
            energy = BigNumberCodec.encode(state.energy),
            quarks = BigNumberCodec.encode(state.quarks),
            lifetimeEnergy = BigNumberCodec.encode(state.lifetimeEnergy),
            prestigeCount = state.prestige.prestigeCount,
            lastPrestigeEpochMs = state.prestige.lastPrestigeEpochMs,
            tickIndex = state.tickIndex,
            lastTickEpochMs = state.lastTickEpochMs,
            createdEpochMs = state.createdEpochMs,
            researchCsv = state.research.purchasedIds.sorted().joinToString(","),
        )
        val generators = GameCatalog.generators.map { def ->
            GeneratorEntity(def.id, state.generatorOwned(def.id))
        }
        val research = state.research.purchasedIds.map { ResearchEntity(it, true) }
        dao.replaceAll(player, generators, research)
    }
}
