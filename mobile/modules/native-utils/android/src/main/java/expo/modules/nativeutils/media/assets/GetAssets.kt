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

    val assets = ArrayList<Bundle>()
    val pageSize = query.limit.toInt().coerceAtLeast(0)

    var remainingOffset = query.offset.coerceAtLeast(0)
    var remainingLimit = pageSize
    var hasNextPage = false

    for (queryUri in getExternalAudioUris(context)) {
      // Stop if we've already filled the requested page.
      if (remainingLimit == 0) {
        hasNextPage = true
        break
      }

      contentResolver.query(
        queryUri,
        projection,
        query.selection,
        query.selectionArgs,
        query.order,
      )?.use { assetsCursor ->
        val volumeSize = assetsCursor.count

        // Skip volume if offset is beyond this volume.
        if (remainingOffset >= volumeSize) {
          remainingOffset -= volumeSize
          return@use
        }

        val priorAssetsCount = assets.size
        putAssetsInfo(
          assetsCursor,
          assets,
          remainingLimit,
          remainingOffset,
          returnWithMetadata,
          queryUri,
        )

        if (volumeSize > remainingLimit + remainingOffset) {
          hasNextPage = true
        }

        remainingLimit -= assets.size - priorAssetsCount
        remainingOffset = 0
      }
    }

    return Bundle().apply {
      putParcelableArrayList("assets", assets)
      putBoolean("hasNextPage", hasNextPage)
      putInt("endCursor", query.offset.coerceAtLeast(0) + assets.size)
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
