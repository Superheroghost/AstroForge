package com.astroforge.dysonprotocol.core.math

import kotlin.math.floor
import kotlin.math.log10
import kotlin.math.pow
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

/**
 * Scientific-notation numeric type for idle-game magnitudes far beyond Double (~1e308).
 *
 * Representation: `value = mantissa × 10^exponent` where mantissa is 0 or in ±[1, 10).
 * Operations allocate a single result instance; hot paths should reuse [BigNumberScratch]
 * when a loop would otherwise churn wrappers.
 */
data class BigNumber(
    val mantissa: Double,
    val exponent: Long,
) : Comparable<BigNumber> {

    init {
        require(mantissa.isFinite()) { "mantissa must be finite, was $mantissa" }
    }

    val isZero: Boolean get() = mantissa == 0.0
    val isPositive: Boolean get() = mantissa > 0.0
    val isNegative: Boolean get() = mantissa < 0.0
    val sign: Int get() = when {
        mantissa > 0.0 -> 1
        mantissa < 0.0 -> -1
        else -> 0
    }

    operator fun plus(other: BigNumber): BigNumber = add(other)

    operator fun minus(other: BigNumber): BigNumber = add(other.unaryMinus())

    operator fun times(other: BigNumber): BigNumber {
        if (isZero || other.isZero) return ZERO
        return fromScientific(mantissa * other.mantissa, exponent + other.exponent)
    }

    operator fun times(scalar: Double): BigNumber {
        if (isZero || scalar == 0.0) return ZERO
        require(scalar.isFinite()) { "scalar must be finite" }
        return fromScientific(mantissa * scalar, exponent)
    }

    operator fun times(scalar: Int): BigNumber = times(scalar.toDouble())

    operator fun times(scalar: Long): BigNumber = times(scalar.toDouble())

    operator fun div(other: BigNumber): BigNumber {
        if (isZero) return ZERO
        if (other.isZero) return ZERO
        return fromScientific(mantissa / other.mantissa, exponent - other.exponent)
    }

    operator fun div(scalar: Double): BigNumber {
        if (isZero) return ZERO
        if (scalar == 0.0) return ZERO
        require(scalar.isFinite()) { "scalar must be finite" }
        return fromScientific(mantissa / scalar, exponent)
    }

    operator fun unaryMinus(): BigNumber = if (isZero) ZERO else copy(mantissa = -mantissa)

    operator fun inc(): BigNumber = this + ONE

    fun abs(): BigNumber = if (mantissa < 0.0) copy(mantissa = -mantissa) else this

    fun floor(): BigNumber {
        if (isZero) return ZERO
        if (exponent < 0L) return if (isPositive) ZERO else -ONE
        if (exponent >= 15L) return this
        val value = mantissa * 10.0.pow(exponent.toDouble())
        return fromDouble(floor(value))
    }

    /**
     * Integer power via exponentiation by squaring. Negative exponents invert the value.
     */
    fun pow(power: Int): BigNumber {
        if (isZero) return if (power > 0) ZERO else if (power == 0) ONE else ZERO
        if (power == 0) return ONE
        if (power == 1) return this
        if (power < 0) return ONE / pow(-power)
        var result = ONE
        var base = this
        var exp = power
        while (exp > 0) {
            if (exp and 1 == 1) result *= base
            exp = exp ushr 1
            if (exp > 0) base *= base
        }
        return result
    }

    /**
     * Real power using logarithms: a^p = 10^(p · log10(a)).
     * Negative bases are rejected; zero to a positive power is zero.
     */
    fun pow(power: Double): BigNumber {
        require(power.isFinite()) { "power must be finite" }
        if (power == 0.0) return ONE
        if (isZero) return if (power > 0.0) ZERO else ZERO
        require(!isNegative) { "real power is undefined for negative BigNumber" }
        if (power == 1.0) return this
        val log = log10()
        val resultLog = log * power
        if (!resultLog.isFinite()) {
            return if (resultLog > 0.0) fromScientific(1.0, Long.MAX_VALUE / 4) else ZERO
        }
        val expPart = floor(resultLog)
        var exp = expPart.toLong()
        var man = 10.0.pow(resultLog - expPart)
        if (!man.isFinite() || man == 0.0) {
            return if (resultLog > 0.0) fromScientific(1.0, Long.MAX_VALUE / 4) else ZERO
        }
        while (man >= 10.0) {
            man /= 10.0
            exp += 1
        }
        while (man > 0.0 && man < 1.0) {
            man *= 10.0
            exp -= 1
        }
        return BigNumber(man, exp)
    }

    fun log10(): Double {
        if (isZero || isNegative) return Double.NEGATIVE_INFINITY
        return log10(mantissa) + exponent.toDouble()
    }

    fun ln(): Double = log10() * LN_10

    fun toDouble(): Double {
        if (isZero) return 0.0
        if (exponent > 308L) return if (isPositive) Double.POSITIVE_INFINITY else Double.NEGATIVE_INFINITY
        if (exponent < -308L) return 0.0
        return mantissa * 10.0.pow(exponent.toDouble())
    }

    fun toLongClamped(): Long {
        val floored = floor()
        if (floored.isZero) return 0L
        if (floored.exponent > 18L) return if (isPositive) Long.MAX_VALUE else Long.MIN_VALUE
        val v = floored.toDouble()
        return if (v > Long.MAX_VALUE) Long.MAX_VALUE else if (v < Long.MIN_VALUE) Long.MIN_VALUE else v.toLong()
    }

    fun formatScientific(fractionDigits: Int = 3): String = BigNumberFormat.scientific(this, fractionDigits)

    fun formatEngineering(fractionDigits: Int = 2): String = BigNumberFormat.engineering(this, fractionDigits)

    fun formatSuffix(fractionDigits: Int = 2): String = BigNumberFormat.suffix(this, fractionDigits)

    override fun compareTo(other: BigNumber): Int {
        if (isZero && other.isZero) return 0
        val signCmp = sign.compareTo(other.sign)
        if (signCmp != 0) return signCmp
        if (isZero) return 0
        val expCmp = exponent.compareTo(other.exponent)
        if (expCmp != 0) return if (isPositive) expCmp else -expCmp
        return mantissa.compareTo(other.mantissa)
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is BigNumber) return false
        if (isZero && other.isZero) return true
        return exponent == other.exponent && abs(mantissa - other.mantissa) < 1e-12
    }

    override fun hashCode(): Int {
        if (isZero) return 0
        return 31 * mantissa.hashCode() + exponent.hashCode()
    }

    override fun toString(): String = formatScientific()

    companion object {
        val ZERO = BigNumber(0.0, 0L)
        val ONE = BigNumber(1.0, 0L)
        val TEN = BigNumber(1.0, 1L)
        val HUNDRED = BigNumber(1.0, 2L)
        val THOUSAND = BigNumber(1.0, 3L)
        val MILLION = BigNumber(1.0, 6L)
        val E12 = BigNumber(1.0, 12L)

        private const val LN_10 = 2.302585092994046
        private const val ALIGN_LIMIT = 18

        fun fromDouble(value: Double): BigNumber {
            if (value == 0.0 || !value.isFinite()) {
                require(value.isFinite() || value == 0.0) { "non-finite double: $value" }
                return ZERO
            }
            return fromScientific(value, 0L)
        }

        fun fromLong(value: Long): BigNumber {
            if (value == 0L) return ZERO
            return fromDouble(value.toDouble())
        }

        fun fromInt(value: Int): BigNumber = fromLong(value.toLong())

        /**
         * Builds a normalized value from a raw mantissa/exponent pair.
         */
        fun fromScientific(rawMantissa: Double, rawExponent: Long): BigNumber {
            if (rawMantissa == 0.0 || !rawMantissa.isFinite()) return ZERO
            var man = rawMantissa
            var exp = rawExponent
            val negative = man < 0.0
            man = abs(man)
            val log = log10(man)
            if (log.isFinite()) {
                val shift = floor(log).toLong()
                man /= 10.0.pow(shift.toDouble())
                exp += shift
            } else {
                while (man >= 10.0) {
                    man /= 10.0
                    exp += 1
                    if (exp == Long.MAX_VALUE) break
                }
                while (man > 0.0 && man < 1.0) {
                    man *= 10.0
                    exp -= 1
                    if (exp == Long.MIN_VALUE) break
                }
            }
            if (man >= 10.0) {
                man /= 10.0
                exp += 1
            }
            if (man > 0.0 && man < 1.0) {
                man *= 10.0
                exp -= 1
            }
            if (negative) man = -man
            return BigNumber(man, exp)
        }

        operator fun invoke(value: Double): BigNumber = fromDouble(value)
        operator fun invoke(value: Int): BigNumber = fromInt(value)
        operator fun invoke(value: Long): BigNumber = fromLong(value)
    }

    private fun add(other: BigNumber): BigNumber {
        if (isZero) return other
        if (other.isZero) return this
        val expDelta = exponent - other.exponent
        if (expDelta >= ALIGN_LIMIT) return this
        if (expDelta <= -ALIGN_LIMIT) return other
        val (hi, lo) = if (exponent >= other.exponent) this to other else other to this
        val scale = 10.0.pow((lo.exponent - hi.exponent).toDouble())
        val summed = hi.mantissa + lo.mantissa * scale
        return fromScientific(summed, hi.exponent)
    }
}

operator fun Double.times(other: BigNumber): BigNumber = other * this
operator fun Int.times(other: BigNumber): BigNumber = other * this
operator fun Long.times(other: BigNumber): BigNumber = other * this

/**
 * Mutable accumulator for high-frequency loops that must not allocate per tick.
 * Not thread-safe. Convert to [BigNumber] only when publishing state.
 */
class BigNumberScratch {
    var mantissa: Double = 0.0
    var exponent: Long = 0L

    fun set(value: BigNumber) {
        mantissa = value.mantissa
        exponent = value.exponent
    }

    fun setZero() {
        mantissa = 0.0
        exponent = 0L
    }

    fun toBigNumber(): BigNumber = BigNumber.fromScientific(mantissa, exponent)

    fun add(other: BigNumber) {
        if (mantissa == 0.0) {
            set(other)
            return
        }
        if (other.isZero) return
        val delta = exponent - other.exponent
        if (delta >= 18) return
        if (delta <= -18) {
            set(other)
            return
        }
        if (delta >= 0) {
            mantissa += other.mantissa * 10.0.pow(-delta.toDouble())
        } else {
            mantissa = mantissa * 10.0.pow(delta.toDouble()) + other.mantissa
            exponent = other.exponent
        }
        normalizeInPlace()
    }

    fun mulScalar(scalar: Double) {
        mantissa *= scalar
        normalizeInPlace()
    }

    private fun normalizeInPlace() {
        if (mantissa == 0.0 || !mantissa.isFinite()) {
            mantissa = 0.0
            exponent = 0L
            return
        }
        val negative = mantissa < 0.0
        var man = abs(mantissa)
        val log = log10(man)
        if (log.isFinite()) {
            val shift = floor(log).toLong()
            man /= 10.0.pow(shift.toDouble())
            exponent += shift
        }
        if (negative) man = -man
        mantissa = man
    }
}
