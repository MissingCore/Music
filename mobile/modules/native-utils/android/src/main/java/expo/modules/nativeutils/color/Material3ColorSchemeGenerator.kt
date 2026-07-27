package expo.modules.nativeutils.color

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.net.Uri
import androidx.core.graphics.ColorUtils
import androidx.palette.graphics.Palette
import java.io.BufferedInputStream
import java.io.IOException
import java.io.InputStream

private const val DEFAULT_PRIMARY = 0xFF6750A4.toInt()
private const val DEFAULT_SECONDARY = 0xFF625B71.toInt()
private const val DEFAULT_TERTIARY = 0xFF7D5260.toInt()

fun generateMaterial3ColorScheme(context: Context, imageUri: String): Map<String, String> {
  val bitmap = loadBitmap(context, imageUri)
  val palette = bitmap?.let { Palette.from(it).generate() }

  val primary = palette?.getVibrantColor(DEFAULT_PRIMARY) ?: DEFAULT_PRIMARY
  val secondary = palette?.getMutedColor(DEFAULT_SECONDARY) ?: DEFAULT_SECONDARY
  val tertiary = palette?.getLightVibrantColor(DEFAULT_TERTIARY) ?: DEFAULT_TERTIARY

  val primaryContainer = makeContainerColor(primary)
  val secondaryContainer = makeContainerColor(secondary)
  val tertiaryContainer = makeContainerColor(tertiary)

  val surface = makeSurfaceColor(primary, secondary)
  val surfaceVariant = makeSurfaceVariantColor(surface, secondary)
  val background = makeBackgroundColor(surface)
  val outline = makeOutlineColor(surface, primary)
  val inverseSurface = if (isLight(surface)) darkenColor(surface, 0.18f) else lightenColor(surface, 0.2f)

  val scheme = linkedMapOf(
    "primary" to colorToHex(primary),
    "onPrimary" to colorToHex(contrastColor(primary)),
    "primaryContainer" to colorToHex(primaryContainer),
    "onPrimaryContainer" to colorToHex(contrastColor(primaryContainer)),
    "secondary" to colorToHex(secondary),
    "onSecondary" to colorToHex(contrastColor(secondary)),
    "secondaryContainer" to colorToHex(secondaryContainer),
    "onSecondaryContainer" to colorToHex(contrastColor(secondaryContainer)),
    "tertiary" to colorToHex(tertiary),
    "onTertiary" to colorToHex(contrastColor(tertiary)),
    "tertiaryContainer" to colorToHex(tertiaryContainer),
    "onTertiaryContainer" to colorToHex(contrastColor(tertiaryContainer)),
    "surface" to colorToHex(surface),
    "onSurface" to colorToHex(contrastColor(surface)),
    "surfaceVariant" to colorToHex(surfaceVariant),
    "onSurfaceVariant" to colorToHex(contrastColor(surfaceVariant)),
    "background" to colorToHex(background),
    "onBackground" to colorToHex(contrastColor(background)),
    "error" to "#BA1A1A",
    "onError" to "#FFFFFF",
    "errorContainer" to "#FFDAD6",
    "onErrorContainer" to "#410002",
    "outline" to colorToHex(outline),
    "outlineVariant" to colorToHex(mixColors(surface, outline, 0.55f)),
    "shadow" to "#000000",
    "scrim" to "#000000",
    "inverseSurface" to colorToHex(inverseSurface),
    "inverseOnSurface" to colorToHex(contrastColor(inverseSurface)),
    "inversePrimary" to colorToHex(mixColors(primary, Color.WHITE, 0.6f))
  )

  return scheme
}

private fun loadBitmap(context: Context, imageUri: String): Bitmap? {
  return try {
    val uri = Uri.parse(imageUri)
    val inputStream = resolveInputStream(context, uri) ?: return null
    inputStream.buffered().use { stream ->
      val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
      BitmapFactory.decodeStream(stream, null, bounds)
      stream.reset()

      val options = BitmapFactory.Options().apply {
        inPreferredConfig = Bitmap.Config.ARGB_8888
        inSampleSize = calculateInSampleSize(bounds)
      }
      stream.reset()
      BitmapFactory.decodeStream(stream, null, options)
    }
  } catch (_: Exception) {
    null
  }
}

private fun resolveInputStream(context: Context, uri: Uri): InputStream? {
  return when (uri.scheme) {
    "content", "file", "android.resource" -> context.contentResolver.openInputStream(uri)
    else -> null
  }
}

private fun calculateInSampleSize(bounds: BitmapFactory.Options): Int {
  val height = bounds.outHeight
  val width = bounds.outWidth
  var inSampleSize = 1
  var target = 256

  while ((height / inSampleSize) > target || (width / inSampleSize) > target) {
    inSampleSize *= 2
  }
  return inSampleSize
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
