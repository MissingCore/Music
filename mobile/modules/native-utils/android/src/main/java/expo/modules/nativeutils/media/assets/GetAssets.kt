package expo.modules.nativeutils.media.assets

import android.content.Context
import android.os.Build
import android.os.Bundle
import expo.modules.nativeutils.media.ASSET_PROJECTION
import expo.modules.nativeutils.media.AUDIO_METADATA_ASSET_PROJECTION
import expo.modules.nativeutils.media.AssetQueryException
import expo.modules.nativeutils.media.AssetsOptions
import expo.modules.nativeutils.media.EXTERNAL_CONTENT_URI
import expo.modules.nativeutils.media.PermissionsException
import expo.modules.nativeutils.media.UnableToLoadException
import java.io.IOException

fun getAssets(context: Context, assetOptions: AssetsOptions): Bundle {
  val contentResolver = context.contentResolver
  try {
    val (selection, selectionArgs, order, limit, offset) = getQueryFromOptions(assetOptions)
    val returnWithMetadata = assetOptions.returnWithMetadata == true && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
    contentResolver.query(
      EXTERNAL_CONTENT_URI,
      if (returnWithMetadata) AUDIO_METADATA_ASSET_PROJECTION else ASSET_PROJECTION,
      selection,
      selectionArgs,
      order
    ).use { assetsCursor ->
      if (assetsCursor == null) {
        throw AssetQueryException()
      }
      val assetsInfo = ArrayList<Bundle>()
      putAssetsInfo(
        assetsCursor,
        assetsInfo,
        limit.toInt(),
        offset,
        returnWithMetadata,
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
