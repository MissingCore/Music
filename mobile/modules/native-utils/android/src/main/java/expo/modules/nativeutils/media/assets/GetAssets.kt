package expo.modules.nativeutils.media.assets

import android.content.Context
import android.os.Bundle
import expo.modules.nativeutils.media.ASSET_PROJECTION
import expo.modules.nativeutils.media.AUDIO_ASSET_PROJECTION
import expo.modules.nativeutils.media.AssetQueryException
import expo.modules.nativeutils.media.AssetsOptions
import expo.modules.nativeutils.media.EXTERNAL_CONTENT_URI
import expo.modules.nativeutils.media.PermissionsException
import expo.modules.nativeutils.media.UnableToLoadException
import java.io.IOException

fun getAssets(context: Context, assetOptions: AssetsOptions): Bundle {
  val contentResolver = context.contentResolver
  try {
    val (selection, order, limit, offset) = getQueryFromOptions(assetOptions)
    val resolveWithFullInfo = assetOptions.resolveWithFullInfo ?: false
    val projection = if (resolveWithFullInfo) AUDIO_ASSET_PROJECTION else ASSET_PROJECTION
    contentResolver.query(
      EXTERNAL_CONTENT_URI,
      projection,
      selection,
      null,
      order
    ).use { assetsCursor ->
      if (assetsCursor == null) {
        throw AssetQueryException()
      }
      val assetsInfo = ArrayList<Bundle>()
      putAssetsInfo(
        context,
        assetsCursor,
        assetsInfo,
        limit.toInt(),
        offset,
        resolveWithFullInfo
      )
      return Bundle().apply {
        putParcelableArrayList("assets", assetsInfo)
        putBoolean("hasNextPage", !assetsCursor.isAfterLast)
        putInt("endCursor", assetsCursor.position)
        putInt("totalCount", assetsCursor.count)
      }
    }
  } catch (e: Exception) {
    throw when (e) {
      is SecurityException -> UnableToLoadException("Could not get asset: need read_external_storage permission", e)
      is IOException -> UnableToLoadException("Could not read file: ${e.message}", e)
      is IllegalArgumentException -> UnableToLoadException(e.message ?: "Invalid MediaType ${e.message}", e)
      is UnsupportedOperationException -> PermissionsException(e.message ?: "Permission denied: ${e.message}")
      else -> e
    }
  }
}
