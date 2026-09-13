package com.astroforge.dysonprotocol.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction

@Dao
interface GameDao {
    @Query("SELECT * FROM player_stats WHERE id = 1")
    suspend fun player(): PlayerStatsEntity?

    @Query("SELECT * FROM generators")
    suspend fun generators(): List<GeneratorEntity>

    @Query("SELECT * FROM research")
    suspend fun research(): List<ResearchEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertPlayer(entity: PlayerStatsEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertGenerators(entities: List<GeneratorEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertResearch(entities: List<ResearchEntity>)

    @Query("DELETE FROM generators")
    suspend fun clearGenerators()

    @Query("DELETE FROM research")
    suspend fun clearResearch()

    @Transaction
    suspend fun replaceAll(
        player: PlayerStatsEntity,
        generators: List<GeneratorEntity>,
        research: List<ResearchEntity>,
    ) {
        upsertPlayer(player)
        clearGenerators()
        clearResearch()
        upsertGenerators(generators)
        upsertResearch(research)
    }
}
