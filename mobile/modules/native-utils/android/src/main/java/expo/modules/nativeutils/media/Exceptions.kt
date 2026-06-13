package expo.modules.nativeutils.media

import expo.modules.kotlin.exception.CodedException

class AssetQueryException :
  CodedException("Could not get asset. Query returns null")

class PermissionsException(message: String) :
  CodedException(message)

class UnableToLoadException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)
