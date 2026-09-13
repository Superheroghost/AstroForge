package com.astroforge.dysonprotocol.domain.usecase

import com.astroforge.dysonprotocol.domain.model.GameState

interface GameRepository {
    suspend fun load(): GameState?
    suspend fun save(state: GameState)
}
