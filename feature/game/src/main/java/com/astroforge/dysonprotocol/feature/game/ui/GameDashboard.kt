package com.astroforge.dysonprotocol.feature.game.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.astroforge.dysonprotocol.domain.model.BuyMode
import com.astroforge.dysonprotocol.feature.game.mvi.GameIntent
import com.astroforge.dysonprotocol.feature.game.mvi.GameUiState
import com.astroforge.dysonprotocol.feature.game.mvi.GameViewModel
import com.astroforge.dysonprotocol.feature.game.mvi.GeneratorUi
import com.astroforge.dysonprotocol.feature.game.mvi.ResearchUi
import com.astroforge.dysonprotocol.feature.game.ui.theme.AstroForgeTheme

@Composable
fun GameRoute(viewModel: GameViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    AstroForgeTheme {
        GameDashboard(
            state = state,
            onIntent = viewModel::onIntent,
        )
    }
}

@Composable
fun GameDashboard(
    state: GameUiState,
    onIntent: (GameIntent) -> Unit,
) {
    val haptics = LocalHapticFeedback.current
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item(key = "header") {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("ASTROFORGE", style = MaterialTheme.typography.headlineLarge, color = MaterialTheme.colorScheme.primary)
                    Text("Dyson Protocol  ·  Cycle ${state.prestigeCount}", style = MaterialTheme.typography.bodyMedium)
                }
            }
            item(key = "orbit") {
                OrbitalVisualizer(droneCount = state.droneCount, swarmCount = state.swarmCount)
            }
            item(key = "resources") {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        ResourceCounter(state.ore, Modifier.weight(1f))
                        ResourceCounter(state.alloy, Modifier.weight(1f))
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        ResourceCounter(state.energy, Modifier.weight(1f))
                        ResourceCounter(state.quarks, Modifier.weight(1f))
                    }
                }
            }
            item(key = "buy-mode") {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Deploy", style = MaterialTheme.typography.titleMedium)
                    BuyMode.entries.forEach { mode ->
                        FilterChip(
                            selected = state.buyMode == mode,
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                onIntent(GameIntent.SetBuyMode(mode))
                            },
                            label = { Text(mode.name) },
                        )
                    }
                }
            }
            items(
                items = state.generators,
                key = { it.id },
                contentType = { "generator" },
            ) { gen ->
                GeneratorCard(
                    generator = gen,
                    onBuy = {
                        if (gen.affordable && gen.unlocked) {
                            haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                            onIntent(GameIntent.BuyGenerator(gen.id))
                        }
                    },
                )
            }
            item(key = "research-header") {
                Text("Research DAG", style = MaterialTheme.typography.titleMedium)
            }
            items(
                items = state.research,
                key = { it.id },
                contentType = { "research" },
            ) { node ->
                ResearchCard(
                    node = node,
                    onUnlock = {
                        if (node.available) {
                            haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                            onIntent(GameIntent.UnlockResearch(node.id))
                        }
                    },
                )
            }
            item(key = "prestige") {
                Button(
                    onClick = {
                        if (state.canPrestige) {
                            haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                            onIntent(GameIntent.Prestige)
                        }
                    },
                    enabled = state.canPrestige,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.tertiary),
                ) {
                    Text(state.prestigeLabel)
                }
            }
        }
        if (state.offline != null) {
            OfflineProgressDialog(
                result = state.offline,
                onDismiss = { onIntent(GameIntent.DismissOffline) },
            )
        }
        }
    }
}

@Composable
private fun GeneratorCard(generator: GeneratorUi, onBuy: () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(generator.name, style = MaterialTheme.typography.titleMedium)
                Text("×${generator.owned}", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
            }
            Text(generator.description, style = MaterialTheme.typography.bodyMedium)
            Text("${generator.producesLabel}  ${generator.rateText}", color = MaterialTheme.colorScheme.secondary)
            if (!generator.unlocked) {
                Text(generator.lockedHint ?: "Locked", color = MaterialTheme.colorScheme.outline)
            } else {
                Button(
                    onClick = onBuy,
                    enabled = generator.affordable,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    val qty = if (generator.quantity > 0) generator.quantity else 1
                    Text("Commission ×$qty  ·  ${generator.costText} ore")
                }
            }
        }
    }
}

@Composable
private fun ResearchCard(node: ResearchUi, onUnlock: () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(node.name, style = MaterialTheme.typography.titleMedium)
            Text(node.description, style = MaterialTheme.typography.bodyMedium)
            if (node.purchased) {
                Text("Installed", color = MaterialTheme.colorScheme.primary)
            } else {
                TextButton(onClick = onUnlock, enabled = node.available) {
                    Text("Research  ${node.costText}")
                }
            }
        }
    }
}
