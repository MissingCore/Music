import { ReservedNames } from "@/features/playback/constants";

/**
 * Sanitize playlist name and make sure it meets the minimum requirements.
 * Throws error on failure.
 */
export function sanitizedPlaylistName(name: string) {
  const sanitized = name.trim();

  if (sanitized.length < 1 || sanitized.length > 30) {
    throw new Error("Playlist name must be between 1-30 character.");
  }
  if (ReservedNames.has(sanitized)) {
    throw new Error("That playlist name is reserved.");
  }

  return name;
}
