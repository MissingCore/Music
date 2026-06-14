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
  val selection = "${MediaStore.Audio.Media.MIME_TYPE} LIKE 'audio/%'"
  val order = MediaStore.Audio.Media.DATE_MODIFIED

  return GetAssetsQuery(selection, order, limit, offset)
}
