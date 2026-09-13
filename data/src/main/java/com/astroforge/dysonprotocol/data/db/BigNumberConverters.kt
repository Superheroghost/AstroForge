package com.astroforge.dysonprotocol.data.db

import androidx.room.TypeConverter
import com.astroforge.dysonprotocol.core.math.BigNumber

class BigNumberConverters {
    @TypeConverter
    fun toString(value: BigNumber): String = "${value.mantissa}|${value.exponent}"

    @TypeConverter
    fun fromString(raw: String): BigNumber {
        val parts = raw.split('|')
        if (parts.size != 2) return BigNumber.ZERO
        val man = parts[0].toDoubleOrNull() ?: return BigNumber.ZERO
        val exp = parts[1].toLongOrNull() ?: return BigNumber.ZERO
        return BigNumber.fromScientific(man, exp)
    }
}

object BigNumberCodec {
    fun encode(value: BigNumber): String = "${value.mantissa}|${value.exponent}"

    fun decode(raw: String): BigNumber {
        val parts = raw.split('|')
        if (parts.size != 2) return BigNumber.ZERO
        val man = parts[0].toDoubleOrNull() ?: return BigNumber.ZERO
        val exp = parts[1].toLongOrNull() ?: return BigNumber.ZERO
        return BigNumber.fromScientific(man, exp)
    }
}
