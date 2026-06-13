package expo.modules.nativeutils.media.assets

import android.provider.MediaStore
import expo.modules.nativeutils.media.AssetsOptions

data class GetAssetsQuery(
  val selection: String,
  val order: String,
  val limit: Double,
  val offset: Int,
)

@Throws(IllegalArgumentException::class)
internal fun getQueryFromOptions(input: AssetsOptions): GetAssetsQuery {
  val limit = input.first
  val offset = input.after
    ?.runCatching { toInt() }
    ?.getOrNull()
    ?: 0
  val selection = createSelectionString(input)
  val order = MediaStore.Images.Media.DEFAULT_SORT_ORDER

  return GetAssetsQuery(selection, order, limit, offset)
}

@Throws(IllegalArgumentException::class)
private fun createSelectionString(input: AssetsOptions): String {
  val selectionBuilder = StringBuilder()

  selectionBuilder.append("${MediaStore.Audio.Media.MIME_TYPE} LIKE 'audio/%'")

  return selectionBuilder.toString()
}