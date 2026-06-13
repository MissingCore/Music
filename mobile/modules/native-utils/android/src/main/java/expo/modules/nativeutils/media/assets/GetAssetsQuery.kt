package expo.modules.nativeutils.media.assets

import android.provider.MediaStore
import expo.modules.nativeutils.media.AssetsOptions

data class GetAssetsQuery(
  val selection: String,
  val selectionArgs: Array<String>?,
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
  val (selection, selectionArgs) = createSelectionString(input)
  val order = MediaStore.Images.Media.DEFAULT_SORT_ORDER

  return GetAssetsQuery(selection, selectionArgs, order, limit, offset)
}

@Throws(IllegalArgumentException::class)
private fun createSelectionString(input: AssetsOptions): Pair<String, Array<String>?> {
  val selectionBuilder = StringBuilder()

  if (input.fromIds?.isNotEmpty() ?: false) {
    val questionMarks = input.fromIds.joinToString(",") { "?" }
    selectionBuilder.append("${MediaStore.Audio.Media._ID} IN ($questionMarks)")
    selectionBuilder.append(" AND ")
  }

  selectionBuilder.append("${MediaStore.Audio.Media.MIME_TYPE} LIKE 'audio/%'")

  return Pair(selectionBuilder.toString(), input.fromIds?.toTypedArray())
}
