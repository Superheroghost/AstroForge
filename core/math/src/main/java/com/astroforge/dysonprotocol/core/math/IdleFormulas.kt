package com.astroforge.dysonprotocol.core.math

import kotlin.math.floor
import kotlin.math.ln
import kotlin.math.log10
import kotlin.math.min

/**
 * Closed-form idle/incremental formulas. All sums are geometric identities —
 * never iterate per level inside a tick or catch-up.
 */
object IdleFormulas {

    /**
     * `Cost = BaseCost × (CostMultiplier)^Level`
     */
    fun costAtLevel(baseCost: BigNumber, costMultiplier: Double, level: Int): BigNumber {
        require(level >= 0) { "level must be >= 0" }
        require(costMultiplier > 0.0 && costMultiplier.isFinite()) { "invalid multiplier" }
        if (level == 0) return baseCost
        if (costMultiplier == 1.0) return baseCost
        return baseCost * BigNumber.fromDouble(costMultiplier).pow(level)
    }

    /**
     * Exact geometric series for buying [quantity] levels starting from [owned]:
     * `S = firstCost × (m^n − 1) / (m − 1)` when m ≠ 1, else `firstCost × n`.
     */
    fun geometricCostSum(
        baseCost: BigNumber,
        costMultiplier: Double,
        owned: Int,
        quantity: Int,
    ): BigNumber {
        require(quantity >= 0 && owned >= 0)
        if (quantity == 0) return BigNumber.ZERO
        val first = costAtLevel(baseCost, costMultiplier, owned)
        if (costMultiplier == 1.0) return first * quantity
        val m = BigNumber.fromDouble(costMultiplier)
        val mPowN = m.pow(quantity)
        return first * (mPowN - BigNumber.ONE) / (m - BigNumber.ONE)
    }

    /**
     * Largest n such that [geometricCostSum] ≤ [currency], using the closed-form logarithm.
     *
     * `n = floor( log(1 + currency*(m-1)/firstCost) / log(m) )`
     */
    fun maxAffordable(
        baseCost: BigNumber,
        costMultiplier: Double,
        owned: Int,
        currency: BigNumber,
        hardCap: Int = 1_000_000,
    ): Int {
        if (currency.isZero || currency.isNegative) return 0
        val first = costAtLevel(baseCost, costMultiplier, owned)
        if (currency < first) return 0
        if (costMultiplier == 1.0) {
            val n = (currency / first).floor().toLongClamped()
            return min(hardCap.toLong(), n).toInt().coerceAtLeast(1)
        }
        val mMinusOne = costMultiplier - 1.0
        val inner = BigNumber.ONE + currency * mMinusOne / first
        val nReal = inner.log10() / log10(costMultiplier)
        if (!nReal.isFinite()) return hardCap
        val n = min(hardCap, floor(nReal).toInt().coerceAtLeast(0))
        if (n <= 0) return if (currency >= first) 1 else 0
        var affordable = n
        while (affordable > 0 && geometricCostSum(baseCost, costMultiplier, owned, affordable) > currency) {
            affordable--
        }
        if (affordable < hardCap &&
            geometricCostSum(baseCost, costMultiplier, owned, affordable + 1) <= currency
        ) {
            affordable++
        }
        return affordable
    }

    /**
     * `Production = BaseProd × Level × Π(Multipliers)`
     */
    fun productionPerSecond(
        baseProd: BigNumber,
        level: Int,
        multipliers: List<BigNumber>,
    ): BigNumber {
        if (level <= 0 || baseProd.isZero) return BigNumber.ZERO
        var product = baseProd * level
        for (multiplier in multipliers) {
            if (multiplier.isZero) return BigNumber.ZERO
            product *= multiplier
        }
        return product
    }

    /**
     * `Quarks = floor(1000 × (TotalLifetimeEnergy / 10^12)^0.5)`
     */
    fun prestigeQuarks(totalLifetimeEnergy: BigNumber): BigNumber {
        if (totalLifetimeEnergy.isZero || totalLifetimeEnergy.isNegative) return BigNumber.ZERO
        val ratio = totalLifetimeEnergy / BigNumber.E12
        val scaled = BigNumber.fromInt(1000) * ratio.pow(0.5)
        return scaled.floor()
    }

    /**
     * Permanent production multiplier from prestige currency.
     * `1 + 0.02 × quarks` (2% per quark), remaining in BigNumber space.
     */
    fun prestigeMultiplier(quarks: BigNumber): BigNumber {
        if (quarks.isZero || quarks.isNegative) return BigNumber.ONE
        return BigNumber.ONE + quarks * 0.02
    }

    /**
     * Closed-form catch-up: constant rate ⇒ `earned = rate × Δt`.
     * Callers must pass a frozen rate snapshot (no discrete ticks).
     */
    fun integrateConstantRate(ratePerSecond: BigNumber, deltaSeconds: Double): BigNumber {
        if (deltaSeconds <= 0.0 || ratePerSecond.isZero) return BigNumber.ZERO
        return ratePerSecond * deltaSeconds
    }

    /** Natural log helper for diagnostics; wraps [BigNumber.ln]. */
    fun ln(value: BigNumber): Double = value.ln()
}
