package com.astroforge.dysonprotocol.feature.game.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.compose.material3.Typography

val Void = Color(0xFF070B14)
val Panel = Color(0xFF101828)
val Cyan = Color(0xFF4DE1FF)
val Amber = Color(0xFFFFB020)
val Magenta = Color(0xFFFF4D9A)
val Mist = Color(0xFFC9D4E5)

private val colors = darkColorScheme(
    primary = Cyan,
    onPrimary = Color(0xFF003544),
    secondary = Amber,
    onSecondary = Color(0xFF2A1C00),
    tertiary = Magenta,
    background = Void,
    surface = Panel,
    onBackground = Mist,
    onSurface = Mist,
    surfaceVariant = Color(0xFF182338),
    outline = Color(0xFF3A4A66),
)

private val typography = Typography(
    headlineLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 28.sp,
        letterSpacing = 0.6.sp,
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontSize = 14.sp,
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
    ),
)

@Composable
fun AstroForgeTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = colors,
        typography = typography,
        content = content,
    )
}
