package expo.modules.nativeutils.font

import android.content.Context
import android.net.Uri
import java.io.IOException
import java.nio.charset.StandardCharsets

fun getFontName(context: Context, uri: Uri): String {
  val inputStream = context.contentResolver.openInputStream(uri)
    ?: throw IOException("Unable to open font URI: $uri")

  return inputStream.use { FontNameReader(it.readBytes()).read() }
}

private class FontNameReader(private val data: ByteArray) {
  private data class Name(
    val value: String,
    val namePriority: Int,
    val languagePriority: Int,
    val platformPriority: Int,
    val recordOrder: Int,
  )

  fun read(): String {
    if (data.size < 12) throw IOException("Invalid or unsupported font file")

    val signature = asciiString(0, 4)
    if (signature !in setOf("\u0000\u0001\u0000\u0000", "OTTO", "true", "typ1")) {
      throw IOException("Invalid or unsupported font file")
    }

    val tableCount = readUInt16(4)
    requireRange(12, tableCount.toLong() * 16)

    var nameTableOffset = -1
    var nameTableLength = -1
    for (index in 0 until tableCount) {
      val recordOffset = 12 + index * 16
      if (asciiString(recordOffset, 4) == "name") {
        nameTableOffset = readUInt32(recordOffset + 8).toInt()
        nameTableLength = readUInt32(recordOffset + 12).toInt()
        break
      }
    }

    if (nameTableOffset < 0 || nameTableLength < 6) {
      throw IOException("Font file does not contain a name table")
    }
    requireRange(nameTableOffset.toLong(), nameTableLength.toLong())

    val format = readUInt16(nameTableOffset)
    if (format != 0 && format != 1) throw IOException("Unsupported font name table format")

    val recordCount = readUInt16(nameTableOffset + 2)
    val stringStorageOffset = readUInt16(nameTableOffset + 4)
    val recordsStart = nameTableOffset + 6
    val recordsLength = recordCount.toLong() * 12
    if (recordsLength + 6 > nameTableLength || stringStorageOffset > nameTableLength) {
      throw IOException("Invalid font name table")
    }

    val names = mutableListOf<Name>()
    for (index in 0 until recordCount) {
      val recordOffset = recordsStart + index * 12
      val platformId = readUInt16(recordOffset)
      val languageId = readUInt16(recordOffset + 4)
      val nameId = readUInt16(recordOffset + 6)
      val stringLength = readUInt16(recordOffset + 8)
      val stringOffset = readUInt16(recordOffset + 10)
      val namePriority = when (nameId) {
        16 -> 0
        1 -> 1
        4 -> 2
        else -> continue
      }

      val absoluteStringOffset = nameTableOffset + stringStorageOffset + stringOffset
      val relativeStringEnd = stringStorageOffset.toLong() + stringOffset + stringLength
      if (relativeStringEnd > nameTableLength) throw IOException("Invalid font name record")
      requireRange(absoluteStringOffset.toLong(), stringLength.toLong())

      val charset = if (platformId == 0 || platformId == 3) {
        StandardCharsets.UTF_16BE
      } else {
        StandardCharsets.ISO_8859_1
      }
      val value = String(data, absoluteStringOffset, stringLength, charset).trim('\u0000').trim()
      if (value.isNotEmpty()) {
        names += Name(
          value = value,
          namePriority = namePriority,
          languagePriority = when {
            platformId == 3 && languageId == 0x0409 -> 0
            languageId == 0 -> 1
            else -> 2
          },
          platformPriority = when (platformId) {
            0 -> 0
            3 -> 1
            else -> 2
          },
          recordOrder = index,
        )
      }
    }

    return names.minWithOrNull(
      compareBy<Name> { it.namePriority }
        .thenBy { it.languagePriority }
        .thenBy { it.platformPriority }
        .thenBy { it.recordOrder },
    )?.value ?: throw IOException("Font file does not contain a readable family name")
  }

  private fun readUInt16(offset: Int): Int {
    requireRange(offset.toLong(), 2)
    return ((data[offset].toInt() and 0xff) shl 8) or (data[offset + 1].toInt() and 0xff)
  }

  private fun readUInt32(offset: Int): Long {
    requireRange(offset.toLong(), 4)
    return ((data[offset].toLong() and 0xff) shl 24) or
      ((data[offset + 1].toLong() and 0xff) shl 16) or
      ((data[offset + 2].toLong() and 0xff) shl 8) or
      (data[offset + 3].toLong() and 0xff)
  }

  private fun asciiString(offset: Int, length: Int): String {
    requireRange(offset.toLong(), length.toLong())
    return String(data, offset, length, StandardCharsets.ISO_8859_1)
  }

  private fun requireRange(offset: Long, length: Long) {
    if (offset < 0 || length < 0 || offset > data.size.toLong() - length) {
      throw IOException("Invalid font file structure")
    }
  }
}