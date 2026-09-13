package com.astroforge.dysonprotocol.data.worker

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.astroforge.dysonprotocol.domain.usecase.GameRepository
import com.astroforge.dysonprotocol.domain.usecase.GameSaveScheduler
import com.astroforge.dysonprotocol.domain.usecase.LiveGameSnapshot
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@HiltWorker
class GameSaveWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val repository: GameRepository,
    private val snapshot: LiveGameSnapshot,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val state = snapshot.value ?: return Result.success()
        repository.save(state)
        return Result.success()
    }
}

@Singleton
class GameSaveSchedulerImpl @Inject constructor(
    private val workManager: WorkManager,
) : GameSaveScheduler {

    override fun enqueue() {
        val request = OneTimeWorkRequestBuilder<GameSaveWorker>()
            .setInitialDelay(0, TimeUnit.SECONDS)
            .addTag(WORK_TAG)
            .build()
        workManager.enqueueUniqueWork(WORK_NAME, ExistingWorkPolicy.REPLACE, request)
    }

    private companion object {
        const val WORK_NAME = "astroforge_save"
        const val WORK_TAG = "save"
    }
}
