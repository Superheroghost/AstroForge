package com.astroforge.dysonprotocol.data.di

import android.content.Context
import androidx.room.Room
import androidx.work.WorkManager
import com.astroforge.dysonprotocol.data.GameRepositoryImpl
import com.astroforge.dysonprotocol.data.db.AstroForgeDatabase
import com.astroforge.dysonprotocol.data.db.GameDao
import com.astroforge.dysonprotocol.data.worker.GameSaveSchedulerImpl
import com.astroforge.dysonprotocol.domain.usecase.GameRepository
import com.astroforge.dysonprotocol.domain.usecase.GameSaveScheduler
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    @Provides
    @Singleton
    fun database(@ApplicationContext context: Context): AstroForgeDatabase =
        Room.databaseBuilder(context, AstroForgeDatabase::class.java, "astroforge.db")
            .fallbackToDestructiveMigration()
            .build()

    @Provides
    fun gameDao(db: AstroForgeDatabase): GameDao = db.gameDao()

    @Provides
    @Singleton
    fun workManager(@ApplicationContext context: Context): WorkManager = WorkManager.getInstance(context)
}

@Module
@InstallIn(SingletonComponent::class)
abstract class DataBindModule {
    @Binds
    @Singleton
    abstract fun repository(impl: GameRepositoryImpl): GameRepository

    @Binds
    @Singleton
    abstract fun saveScheduler(impl: GameSaveSchedulerImpl): GameSaveScheduler
}
