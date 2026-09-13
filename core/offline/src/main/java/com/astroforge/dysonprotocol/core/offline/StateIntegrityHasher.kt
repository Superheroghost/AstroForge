package com.astroforge.dysonprotocol.core.offline

import com.astroforge.dysonprotocol.domain.model.GameCatalog
import com.astroforge.dysonprotocol.domain.model.GameState
import java.security.MessageDigest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class StateIntegrityHasher @Inject constructor() {

    fun hash(state: GameState, timestampMs: Long): String {
        val gens = GameCatalog.generators.joinToString(",") { def ->
            "${def.id}:${state.generatorOwned(def.id)}"
        }
        val research = state.research.purchasedIds.sorted().joinToString(",")
        val canonical = buildString {
            append("ore=").append(state.ore.mantissa).append('e').append(state.ore.exponent).append('|')
            append("alloy=").append(state.alloy.mantissa).append('e').append(state.alloy.exponent).append('|')
            append("energy=").append(state.energy.mantissa).append('e').append(state.energy.exponent).append('|')
            append("quarks=").append(state.quarks.mantissa).append('e').append(state.quarks.exponent).append('|')
            append("life=").append(state.lifetimeEnergy.mantissa).append('e').append(state.lifetimeEnergy.exponent).append('|')
            append("gens=").append(gens).append('|')
            append("rs=").append(research).append('|')
            append("pc=").append(state.prestige.prestigeCount).append('|')
            append("ts=").append(timestampMs)
        }
        val digest = MessageDigest.getInstance("SHA-256").digest(canonical.toByteArray(Charsets.UTF_8))
        return digest.joinToString("") { b -> "%02x".format(b) }
    }

    fun matches(state: GameState, timestampMs: Long, expected: String): Boolean {
        if (expected.isEmpty()) return false
        return hash(state, timestampMs).equals(expected, ignoreCase = true)
    }
}
