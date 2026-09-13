package com.astroforge.dysonprotocol.data.db

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters

@Database(
    entities = [
        PlayerStatsEntity::class,
        GeneratorEntity::class,
        ResearchEntity::class,
    ],
    version = 1,
    exportSchema = false,
)
@TypeConverters(BigNumberConverters::class)
abstract class AstroForgeDatabase : RoomDatabase() {
    abstract fun gameDao(): GameDao
}
