package expo.modules.nativeutils.color

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.net.Uri
import androidx.core.graphics.ColorUtils
import androidx.palette.graphics.Palette
import java.io.InputStream
import java.net.URI
import kotlin.math.ceil

private const val DEFAULT_PRIMARY = 0xFF6750A4.toInt()
private const val DEFAULT_SECONDARY = 0xFF625B71.toInt()
private const val DEFAULT_TERTIARY = 0xFF7D5260.toInt()

fun generateMaterial3ColorScheme(context: Context, imageUri: String): Map<String, String>? {
  val bitmap = loadBitmap(context, imageUri)
  if (bitmap == null) {
    return null
  }

  val averageColor = calculateAverageColor(bitmap, 8)
  val palette = Palette.Builder(bitmap).generate()

  val dominant = palette.getDominantColor(averageColor)
  val vibrant = palette.getVibrantColor(averageColor)
  val lightVibrant = palette.getLightVibrantColor(averageColor)
  val darkVibrant = palette.getDarkVibrantColor(averageColor)
  val muted = palette.getMutedColor(averageColor)
  val lightMuted = palette.getLightMutedColor(averageColor)
  val darkMuted = palette.getDarkMutedColor(averageColor)

  val primary = selectColor(listOf(vibrant, darkVibrant, dominant, averageColor), DEFAULT_PRIMARY)
  val secondary = selectColor(listOf(muted, darkMuted, lightMuted, vibrant, averageColor), DEFAULT_SECONDARY)
  val tertiary = selectColor(listOf(lightVibrant, vibrant, dominant, averageColor), DEFAULT_TERTIARY)

  return buildScheme(primary, secondary, tertiary)
}

private fun loadBitmap(context: Context, imageUri: String): Bitmap? {
  return try {
    when {
      imageUri.startsWith("content://") -> {
        context.contentResolver.openInputStream(Uri.parse(imageUri))?.use { stream ->
          BitmapFactory.decodeStream(stream)
        }
      }

      imageUri.startsWith("file://") -> {
        BitmapFactory.decodeFile(Uri.parse(imageUri).path)
      }

      imageUri.startsWith("http://") || imageUri.startsWith("https://") -> {
        val connection = URI(imageUri).toURL().openConnection()
        connection.connectTimeout = 10000
        connection.readTimeout = 10000
        connection.getInputStream().use { stream ->
          BitmapFactory.decodeStream(stream)
        }
      }

      imageUri.startsWith("/") -> {
        BitmapFactory.decodeFile(imageUri)
      }

      else -> {
        val resourceId = context.resources.getIdentifier(imageUri, "drawable", context.packageName)
        if (resourceId != 0) {
          BitmapFactory.decodeResource(context.resources, resourceId)
        } else {
          BitmapFactory.decodeFile(imageUri)
        }
      }
    }
  } catch (_: Exception) {
    null
  }
}

private fun calculateAverageColor(bitmap: Bitmap, pixelSpacing: Int): Int {
  val segmentWidth = 500
  val width = bitmap.width
  val height = bitmap.height
  val numSegments = ceil(width.toDouble() / segmentWidth).toInt()
  val segmentPixels = IntArray(segmentWidth * height)

  var redSum = 0
  var greenSum = 0
  var blueSum = 0
  var pixelCount = 0

  for (index in 0 until numSegments) {
    val xStart = index * segmentWidth
    val xEnd = minOf(width, (index + 1) * segmentWidth)

    bitmap.getPixels(segmentPixels, 0, segmentWidth, xStart, 0, xEnd - xStart, height)

    for (segmentIndex in segmentPixels.indices step pixelSpacing) {
      val pixel = segmentPixels[segmentIndex]
      redSum += Color.red(pixel)
      greenSum += Color.green(pixel)
      blueSum += Color.blue(pixel)
      pixelCount++
    }
  }

  return if (pixelCount == 0) {
    Color.BLACK
  } else {
    val red = redSum / pixelCount
    val green = greenSum / pixelCount
    val blue = blueSum / pixelCount
    Color.rgb(red, green, blue)
  }
}

private fun buildScheme(primary: Int, secondary: Int, tertiary: Int): Map<String, String> {
  val primaryContainer = makeContainerColor(primary)
  val secondaryContainer = makeContainerColor(secondary)
  val tertiaryContainer = makeContainerColor(tertiary)

  val surface = makeSurfaceColor(primary, secondary)
  val surfaceVariant = makeSurfaceVariantColor(surface, secondary)
  val background = makeBackgroundColor(surface)
  val outline = makeOutlineColor(surface, primary)
  val inverseSurface = if (isLight(surface)) darkenColor(surface, 0.18f) else lightenColor(surface, 0.2f)
  val primaryDim = darkenColor(primary, 0.12f)
  val secondaryDim = darkenColor(secondary, 0.12f)
  val surfaceDim = darkenColor(surface, 0.08f)
  val surfaceBright = lightenColor(surface, 0.08f)
  val surfaceContainerLowest = lightenColor(surface, 0.04f)
  val surfaceContainerLow = mixColors(surface, primary, 0.12f)
  val surfaceContainer = mixColors(surface, secondary, 0.16f)
  val surfaceContainerHigh = mixColors(surface, secondary, 0.24f)
  val surfaceContainerHighest = mixColors(surface, primary, 0.28f)

  return linkedMapOf(
    "primary" to colorToHex(primary),
    "primaryDim" to colorToHex(primaryDim),
    "onPrimary" to colorToHex(contrastColor(primary)),
    "onPrimaryVariant" to colorToHex(contrastColor(primaryDim)),
    "secondary" to colorToHex(secondary),
    "secondaryDim" to colorToHex(secondaryDim),
    "onSecondary" to colorToHex(contrastColor(secondary)),
    "onSecondaryVariant" to colorToHex(contrastColor(secondaryDim)),
    "surfaceDim" to colorToHex(surfaceDim),
    "surface" to colorToHex(surface),
    "surfaceBright" to colorToHex(surfaceBright),
    "surfaceContainerLowest" to colorToHex(surfaceContainerLowest),
    "surfaceContainerLow" to colorToHex(surfaceContainerLow),
    "surfaceContainer" to colorToHex(surfaceContainer),
    "surfaceContainerHigh" to colorToHex(surfaceContainerHigh),
    "surfaceContainerHighest" to colorToHex(surfaceContainerHighest),
    "onSurface" to colorToHex(contrastColor(surface)),
    "onSurfaceVariant" to colorToHex(contrastColor(surfaceVariant)),
    "outline" to colorToHex(outline),
    "outlineVariant" to colorToHex(mixColors(surface, outline, 0.55f)),
    "inverseSurface" to colorToHex(inverseSurface),
    "inverseOnSurface" to colorToHex(contrastColor(inverseSurface)),
    "placeholder" to colorToHex(mixColors(surface, contrastColor(surface), 0.2f))
  )
}

private fun selectColor(candidates: List<Int>, fallback: Int): Int {
  return candidates.firstOrNull { it != 0 && Color.alpha(it) == 255 } ?: fallback
}

private fun makeContainerColor(color: Int): Int {
  return if (isLight(color)) {
    adjustTone(color, -0.18f)
  } else {
    adjustTone(color, 0.22f)
  }
}

private fun makeSurfaceColor(primary: Int, secondary: Int): Int {
  return if (isLight(primary)) {
    mixColors(Color.WHITE, secondary, 0.16f)
  } else {
    mixColors(Color.BLACK, primary, 0.18f)
  }
}

private fun makeSurfaceVariantColor(surface: Int, secondary: Int): Int {
  return mixColors(surface, secondary, 0.3f)
}

private fun makeBackgroundColor(surface: Int): Int {
  return if (isLight(surface)) {
    lightenColor(surface, 0.04f)
  } else {
    darkenColor(surface, 0.04f)
  }
}

private fun makeOutlineColor(surface: Int, primary: Int): Int {
  return if (isLight(surface)) {
    mixColors(surface, primary, 0.25f)
  } else {
    mixColors(surface, primary, 0.4f)
  }
}

private fun contrastColor(background: Int): Int {
  val whiteContrast = contrastRatio(background, Color.WHITE)
  val blackContrast = contrastRatio(background, Color.BLACK)
  return if (whiteContrast >= blackContrast) Color.WHITE else Color.BLACK
}

private fun contrastRatio(foreground: Int, background: Int): Double {
  val foregroundLuminance = ColorUtils.calculateLuminance(foreground)
  val backgroundLuminance = ColorUtils.calculateLuminance(background)
  val lighter = maxOf(foregroundLuminance, backgroundLuminance)
  val darker = minOf(foregroundLuminance, backgroundLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}

private fun isLight(color: Int): Boolean {
  return ColorUtils.calculateLuminance(color) >= 0.5
}

private fun adjustTone(color: Int, amount: Float): Int {
  val hsl = FloatArray(3)
  ColorUtils.colorToHSL(color, hsl)
  hsl[2] = (hsl[2] + amount).coerceIn(0f, 1f)
  return ColorUtils.HSLToColor(hsl)
}

private fun lightenColor(color: Int, amount: Float): Int {
  val hsl = FloatArray(3)
  ColorUtils.colorToHSL(color, hsl)
  hsl[2] = (hsl[2] + amount).coerceIn(0f, 1f)
  return ColorUtils.HSLToColor(hsl)
}

private fun darkenColor(color: Int, amount: Float): Int {
  val hsl = FloatArray(3)
  ColorUtils.colorToHSL(color, hsl)
  hsl[2] = (hsl[2] - amount).coerceIn(0f, 1f)
  return ColorUtils.HSLToColor(hsl)
}

private fun mixColors(colorA: Int, colorB: Int, ratio: Float): Int {
  val clampedRatio = ratio.coerceIn(0f, 1f)
  val red = (Color.red(colorA) * (1f - clampedRatio) + Color.red(colorB) * clampedRatio).toInt()
  val green = (Color.green(colorA) * (1f - clampedRatio) + Color.green(colorB) * clampedRatio).toInt()
  val blue = (Color.blue(colorA) * (1f - clampedRatio) + Color.blue(colorB) * clampedRatio).toInt()
  return Color.rgb(red, green, blue)
}

private fun colorToHex(color: Int): String {
  return String.format("#%06X", 0xFFFFFF and color)
}
