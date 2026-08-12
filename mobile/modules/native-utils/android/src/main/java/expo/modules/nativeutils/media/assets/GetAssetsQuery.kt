package expo.modules.nativeutils.media.assets

import android.content.Context
import android.net.Uri
import android.os.Build
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
  val order = MediaStore.Audio.Media.DEFAULT_SORT_ORDER

  return GetAssetsQuery(selection, selectionArgs, order, limit, offset)
}

internal fun getExternalAudioUris(context: Context): List<Uri> {
  val uris = mutableListOf(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI)

  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
    runCatching { MediaStore.getExternalVolumeNames(context) }
      .getOrNull()
      ?.filter { it.isNotBlank() && it != MediaStore.VOLUME_EXTERNAL_PRIMARY }
      ?.map { MediaStore.Audio.Media.getContentUri(it) }
      ?.let { uris.addAll(it) }
  }

  return uris.distinctBy { it.toString() }
}

@Throws(IllegalArgumentException::class)
private fun createSelectionString(input: AssetsOptions): Pair<String, Array<String>?> {
  val selectionBuilder = StringBuilder()
  var selectionArgs: Array<String>? = null

  if (input.fromIds?.isNotEmpty() ?: false) {
    val questionMarks = input.fromIds.joinToString(",") { "?" }
    selectionBuilder.append("${MediaStore.Audio.Media._ID} IN ($questionMarks)")
    selectionBuilder.append(" AND ")
    selectionArgs = input.fromIds.toTypedArray()
  }

  selectionBuilder.append("${MediaStore.Audio.Media.MIME_TYPE} LIKE 'audio/%'")

  return Pair(selectionBuilder.toString(), selectionArgs)
}
