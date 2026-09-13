package com.astroforge.dysonprotocol.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "player_stats")
data class PlayerStatsEntity(
    @PrimaryKey val id: Int = 1,
    val ore: String,
    val alloy: String,
    val energy: String,
    val quarks: String,
    val lifetimeEnergy: String,
    val prestigeCount: Int,
    val lastPrestigeEpochMs: Long,
    val tickIndex: Long,
    val lastTickEpochMs: Long,
    val createdEpochMs: Long,
    val researchCsv: String,
)

@Entity(tableName = "generators")
data class GeneratorEntity(
    @PrimaryKey val id: String,
    val owned: Int,
)

@Entity(tableName = "research")
data class ResearchEntity(
    @PrimaryKey val id: String,
    val purchased: Boolean,
)
