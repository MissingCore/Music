import { toast } from "@missingcore/toast";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { getDocumentAsync } from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";

import { db } from "~/db";
import { customFonts } from "./schema";

import i18next from "~/modules/i18n";

import { queryClient } from "~/lib/react-query";

const queryKey = ["custom-fonts"] as const;

//#region Font Management
const FontDirectory = Paths.join(Paths.document, "fonts");

export function createFontDirectory() {
  const fontDir = new Directory(FontDirectory);
  if (!fontDir.exists) fontDir.create();
}

export async function pickFont() {
  const { assets, canceled } = await getDocumentAsync({
    type: ["font/otf", "font/ttf"],
  });
  if (canceled) throw new Error(i18next.t("err.msg.actionCancel"));
  if (!assets[0]) throw new Error(i18next.t("err.msg.noSelect"));
  return assets[0].uri;
}

/** Saves font in correct directory and create a new database entry. */
export async function saveCustomFont(entry: { name: string; uri: string }) {
  const fontExtension = entry.uri.split(".").at(-1)!;
  const cachedFont = new File(entry.uri);
  const finalDestination = new File(
    FontDirectory,
    `${createId()}.${fontExtension}`,
  );

  try {
    //? Save font to dedicated fonts directory that we control.
    cachedFont.copy(finalDestination);

    //? Create new entry in database.
    const fontEntry = { name: entry.name, uri: finalDestination.uri };
    const [result] = await db.insert(customFonts).values(fontEntry).returning();
    queryClient.invalidateQueries({ queryKey });
    return result;
  } catch {
    toast.tError("err.flow.generic.title");
    //! Delete font if we failed at inserting font into the database.
    if (finalDestination.exists) finalDestination.delete();
  } finally {
    //! Delete cached file. This will be unnecessary in Expo SDK 56 as it
    //! adds support for directly copying files from `content://` URIs.
    if (cachedFont.exists) cachedFont.delete();
  }
}

/** Delete font database entry and font file. */
export async function deleteCustomFont(fontId: string) {
  try {
    const [result] = await db
      .delete(customFonts)
      .where(eq(customFonts.id, fontId))
      .returning();
    queryClient.invalidateQueries({ queryKey });
    if (!result) return;

    const fontFile = new File(result.uri);
    if (fontFile.exists) fontFile.delete();
  } catch {}
}
//#endregion
