package expo.modules.nativeutils.media.assets

import android.content.Context
import android.os.Bundle
import expo.modules.nativeutils.media.ASSET_PROJECTION
import expo.modules.nativeutils.media.AUDIO_METADATA_ASSET_PROJECTION
import expo.modules.nativeutils.media.AssetsOptions
import expo.modules.nativeutils.media.PermissionsException
import expo.modules.nativeutils.media.UnableToLoadException
import java.io.IOException

fun getAssets(context: Context, assetOptions: AssetsOptions): Bundle {
  val contentResolver = context.contentResolver
  try {
    val query = getQueryFromOptions(assetOptions)
    val returnWithMetadata = assetOptions.returnWithMetadata == true && isMetadataSupported()
    val projection = if (returnWithMetadata) AUDIO_METADATA_ASSET_PROJECTION else ASSET_PROJECTION
    val allAssets = ArrayList<Bundle>()

    for (queryUri in getExternalAudioUris(context)) {
      contentResolver.query(
        queryUri,
        projection,
        query.selection,
        query.selectionArgs,
        query.order,
      )?.use { assetsCursor ->
        val volumeAssets = ArrayList<Bundle>()
        putAssetsInfo(
          assetsCursor,
          volumeAssets,
          Int.MAX_VALUE,
          0,
          returnWithMetadata,
          queryUri,
        )
        allAssets.addAll(volumeAssets)
      }
    }

    val pageSize = query.limit.toInt().coerceAtLeast(0)
    val startIndex = query.offset.coerceAtLeast(0)
    val endIndex = minOf(startIndex + pageSize, allAssets.size)
    val pagedAssets = if (startIndex >= allAssets.size) {
      ArrayList()
    } else {
      ArrayList(allAssets.subList(startIndex, endIndex))
    }

    return Bundle().apply {
      putParcelableArrayList("assets", pagedAssets)
      putBoolean("hasNextPage", endIndex < allAssets.size)
      putInt("endCursor", endIndex)
      putInt("totalCount", allAssets.size)
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
