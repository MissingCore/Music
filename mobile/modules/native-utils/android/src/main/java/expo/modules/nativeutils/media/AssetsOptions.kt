package expo.modules.nativeutils.media

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
data class AssetsOptions(
  @Field val first: Double,
  @Field val after: Double?,
  @Field val fromIds: List<String>?,
) : Record
