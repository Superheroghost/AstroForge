package com.astroforge.dysonprotocol.core.offline

import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.roundToLong

/**
 * Minimal SNTP client (RFC 4330). Returns NTP epoch offset vs [System.currentTimeMillis].
 */
object SntpClient {
    private const val NTP_PORT = 123
    private const val NTP_MODE_CLIENT = 3
    private const val NTP_VERSION = 3
    private const val ORIGINATE_TIME_OFFSET = 24
    private const val RECEIVE_TIME_OFFSET = 32
    private const val TRANSMIT_TIME_OFFSET = 40
    private const val PACKET_SIZE = 48
    private const val OFFSET_1900_TO_1970 = 2_208_988_800L

    fun requestTimeMs(host: String = "time.google.com", timeoutMs: Int = 1500): Long? {
        return try {
            DatagramSocket().use { socket ->
                socket.soTimeout = timeoutMs
                val address = InetAddress.getByName(host)
                val buffer = ByteArray(PACKET_SIZE)
                buffer[0] = ((NTP_VERSION shl 3) or NTP_MODE_CLIENT).toByte()
                val requestTime = System.currentTimeMillis()
                writeTimestamp(buffer, TRANSMIT_TIME_OFFSET, requestTime)
                val request = DatagramPacket(buffer, buffer.size, address, NTP_PORT)
                socket.send(request)
                val response = DatagramPacket(buffer, buffer.size)
                socket.receive(response)
                val responseTime = System.currentTimeMillis()
                val originate = readTimestamp(buffer, ORIGINATE_TIME_OFFSET)
                val receive = readTimestamp(buffer, RECEIVE_TIME_OFFSET)
                val transmit = readTimestamp(buffer, TRANSMIT_TIME_OFFSET)
                val roundTrip = (responseTime - requestTime) - (transmit - receive)
                val clockOffset = ((receive - originate) + (transmit - responseTime)) / 2.0
                (responseTime + clockOffset.roundToLong())
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun writeTimestamp(buffer: ByteArray, offset: Int, timeMs: Long) {
        val seconds = timeMs / 1000L + OFFSET_1900_TO_1970
        val fraction = ((timeMs % 1000L) * 0x100000000L) / 1000L
        val bb = ByteBuffer.wrap(buffer, offset, 8).order(ByteOrder.BIG_ENDIAN)
        bb.putInt(seconds.toInt())
        bb.putInt(fraction.toInt())
    }

    private fun readTimestamp(buffer: ByteArray, offset: Int): Long {
        val bb = ByteBuffer.wrap(buffer, offset, 8).order(ByteOrder.BIG_ENDIAN)
        val seconds = bb.int.toLong() and 0xFFFFFFFFL
        val fraction = bb.int.toLong() and 0xFFFFFFFFL
        val unixSeconds = seconds - OFFSET_1900_TO_1970
        val millis = (fraction * 1000L) / 0x100000000L
        return unixSeconds * 1000L + millis
    }
}
