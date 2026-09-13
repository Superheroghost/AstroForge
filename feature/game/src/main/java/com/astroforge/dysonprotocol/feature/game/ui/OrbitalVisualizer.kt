package com.astroforge.dysonprotocol.feature.game.ui

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin

@Composable
fun OrbitalVisualizer(
    droneCount: Int,
    swarmCount: Int,
    modifier: Modifier = Modifier,
) {
    val infinite = rememberInfiniteTransition(label = "orbit")
    val phase by infinite.animateFloat(
        initialValue = 0f,
        targetValue = (Math.PI * 2.0).toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 16_000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "phase",
    )
    val pulse by infinite.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2_400, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "pulse",
    )

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(220.dp),
    ) {
        val cx = size.width / 2f
        val cy = size.height / 2f
        val radius = min(size.width, size.height) * 0.38f
        val starR = 14f * pulse

        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(Color(0xFFFFF4C2), Color(0xFFFFB020), Color(0x00FF6A00)),
                center = Offset(cx, cy),
                radius = starR * 4f,
            ),
            radius = starR * 4f,
            center = Offset(cx, cy),
        )
        drawCircle(color = Color(0xFFFFF1A8), radius = starR, center = Offset(cx, cy))

        val swarmR = radius * 1.15f
        drawCircle(
            color = Color(0x664DE1FF),
            radius = swarmR,
            center = Offset(cx, cy),
            style = Stroke(
                width = 2f,
                pathEffect = PathEffect.dashPathEffect(floatArrayOf(12f, 10f), phase * 8f),
            ),
        )
        val nodes = (swarmCount.coerceAtLeast(0) + 6).coerceAtMost(48)
        for (i in 0 until nodes) {
            val a = phase * 0.35f + i * (Math.PI * 2.0 / nodes).toFloat()
            val p = Offset(cx + cos(a) * swarmR, cy + sin(a) * swarmR)
            val lit = i < swarmCount.coerceAtLeast(6)
            drawCircle(
                color = if (lit) Color(0xFF4DE1FF) else Color(0x334DE1FF),
                radius = if (lit) 4.2f else 2.4f,
                center = p,
            )
        }

        val drones = droneCount.coerceIn(1, 24)
        for (i in 0 until drones) {
            val orbit = radius * (0.42f + (i % 3) * 0.16f)
            val speed = 1.2f + (i % 5) * 0.17f
            val a = phase * speed + i * 0.9f
            val p = Offset(cx + cos(a) * orbit, cy + sin(a) * orbit)
            drawLine(
                color = Color(0x55C9D4E5),
                start = Offset(cx, cy),
                end = p,
                strokeWidth = 1f,
            )
            drawCircle(color = Color(0xFFE8F4FF), radius = 5f, center = p)
            drawCircle(color = Color(0xFFFF4D9A), radius = 2f, center = p)
        }
    }
}
