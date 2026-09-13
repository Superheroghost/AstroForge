package com.astroforge.dysonprotocol.core.math

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class BigNumberTest {

    @Test
    fun addAlignsExponents() {
        val a = BigNumber.fromDouble(1.5e10)
        val b = BigNumber.fromDouble(2.5e8)
        val sum = a + b
        assertEquals(1.525e10, sum.toDouble(), 1.0)
    }

    @Test
    fun multiplyAddsExponents() {
        val a = BigNumber.fromScientific(2.0, 1000)
        val b = BigNumber.fromScientific(3.0, 50)
        val p = a * b
        assertEquals(6.0, p.mantissa, 1e-9)
        assertEquals(1050L, p.exponent)
    }

    @Test
    fun geometricSumMatchesManualSeries() {
        val base = BigNumber.fromInt(10)
        val sum = IdleFormulas.geometricCostSum(base, 1.15, 0, 5)
        var manual = BigNumber.ZERO
        repeat(5) { level ->
            manual += IdleFormulas.costAtLevel(base, 1.15, level)
        }
        assertEquals(0, sum.compareTo(manual))
    }

    @Test
    fun prestigeQuarksUsesSquareRootCurve() {
        val energy = BigNumber.E12
        val quarks = IdleFormulas.prestigeQuarks(energy)
        assertEquals(1000L, quarks.toLongClamped())
    }

    @Test
    fun suffixFormatsQa() {
        val value = BigNumber.fromScientific(1.234, 15)
        assertTrue(value.formatSuffix().contains("Qa"))
    }
}
