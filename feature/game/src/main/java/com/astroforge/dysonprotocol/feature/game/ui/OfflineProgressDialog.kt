package com.astroforge.dysonprotocol.feature.game.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.astroforge.dysonprotocol.domain.model.OfflineProgressResult
import java.util.Locale
import java.util.concurrent.TimeUnit

@Composable
fun OfflineProgressDialog(
    result: OfflineProgressResult,
    onDismiss: () -> Unit,
) {
    val hours = TimeUnit.MILLISECONDS.toHours(result.elapsedMs)
    val minutes = TimeUnit.MILLISECONDS.toMinutes(result.elapsedMs) % 60
    val away = String.format(Locale.US, "%dh %02dm", hours, minutes)
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Command Link Restored") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                if (result.rejectedByAntiCheat) {
                    Text(
                        "Integrity check rejected the last timestamp. Offline yield was zeroed.",
                        color = MaterialTheme.colorScheme.tertiary,
                    )
                } else {
                    Text("Time away: $away${if (result.capped) " (capped)" else ""}")
                    Text("Ore +${result.oreEarned.formatSuffix()}")
                    Text("Alloy +${result.alloyEarned.formatSuffix()}")
                    Text("Energy +${result.energyEarned.formatSuffix()}")
                    Text("Dyson swarm construction")
                    LinearProgressIndicator(
                        progress = { result.dysonConstructionProgress.toFloat() },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Text(
                        "${(result.dysonConstructionProgress * 100).toInt()}% of next node (${result.nextDysonNodeCost.formatSuffix()})",
                        style = MaterialTheme.typography.labelLarge,
                    )
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss, modifier = Modifier.padding(8.dp)) {
                Text("Resume Protocol")
            }
        },
    )
}
