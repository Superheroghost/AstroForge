package com.astroforge.dysonprotocol.core.math

import kotlin.math.floor
import kotlin.math.max
import java.util.Locale
import kotlin.math.abs

object BigNumberFormat {

    private val SUFFIXES = arrayOf(
        "", "K", "M", "B", "T",
        "Qa", "Qi", "Sx", "Sp", "Oc", "No",
        "Dc", "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Ocd", "Nod",
        "Vg", "Uvg", "Dvg", "Tvg", "Qavg", "Qivg", "Sxvg", "Spvg", "Ocvg", "Novg",
        "Tg",
    )

    fun scientific(value: BigNumber, fractionDigits: Int = 3): String {
        if (value.isZero) return "0"
        val digits = fractionDigits.coerceIn(0, 8)
        val pattern = "%." + digits + "fe%d"
        return String.format(Locale.US, pattern, value.mantissa, value.exponent)
    }

    /**
     * Engineering notation groups exponents in threes (10.50e12).
     */
    fun engineering(value: BigNumber, fractionDigits: Int = 2): String {
        if (value.isZero) return "0"
        val remainder = Math.floorMod(value.exponent, 3L)
        val engExp = value.exponent - remainder
        val engMantissa = value.mantissa * pow10Int(remainder.toInt())
        val digits = fractionDigits.coerceIn(0, 8)
        val pattern = "%." + digits + "fe%d"
        return String.format(Locale.US, pattern, engMantissa, engExp)
    }

    /**
     * Standard idle suffixes: `10.50 Qa`, `5.00 Sx`. Falls back to scientific past the table.
     */
    fun suffix(value: BigNumber, fractionDigits: Int = 2): String {
        if (value.isZero) return "0"
        val absVal = value.abs()
        if (absVal.exponent < 3L) {
            val raw = absVal.toDouble()
            val digits = fractionDigits.coerceIn(0, 8)
            val formatted = String.format(Locale.US, "%." + digits + "f", raw)
            return if (value.isNegative) "-$formatted" else formatted
        }
        val group = (absVal.exponent / 3L).toInt()
        if (group !in SUFFIXES.indices) {
            return scientific(value, max(3, fractionDigits))
        }
        val remainder = absVal.exponent - group * 3L
        val display = absVal.mantissa * pow10Int(remainder.toInt())
        val digits = fractionDigits.coerceIn(0, 8)
        val formatted = String.format(Locale.US, "%." + digits + "f %s", display, SUFFIXES[group]).trimEnd()
        return if (value.isNegative) "-$formatted" else formatted
    }

    private fun pow10Int(n: Int): Double {
        var r = 1.0
        repeat(n) { r *= 10.0 }
        return r
    }
}
