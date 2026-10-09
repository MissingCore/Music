// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { getFontName } from "@missingcore/native-utils";
import { toast } from "@missingcore/ui/toast";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import type { CustomFont } from "~/db/schema";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { pickFile } from "~/lib/file-system";
import { cn } from "~/lib/style";
import { Button } from "~/components/next/base/button";
import { IconButton } from "~/components/next/base/button-icon";
import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet } from "~/components/next/base/sheet";
import { Text } from "~/components/next/base/typography";
import type { Font } from "./core/constants";
import { BundledFontOptions } from "./core/constants";
import { deleteCustomFont, saveCustomFont, useCustomFonts } from "./core/data";
import {
  areFontEqual,
  getFont,
  getFontDisplayName,
  isBundledFont,
  loadCustomFont,
} from "./utils";

export function AccentFontSheet(props: { ref: SheetRef }) {
  return <FontSheet ref={props.ref} type="Accent" />;
}

export function PrimaryFontSheet(props: { ref: SheetRef }) {
  return <FontSheet ref={props.ref} type="Primary" />;
}

const FontConfig = {
  Accent: {
    label: "feat.font.extra.accent",
    setFont: PreferenceSetters.setAccentFont,
    headline: true,
  },
  Primary: {
    label: "feat.font.extra.primary",
    setFont: PreferenceSetters.setPrimaryFont,
    headline: false,
  },
} as const;

function FontSheet(props: { ref: SheetRef; type: "Accent" | "Primary" }) {
  const { t } = useTranslation();

  const { data } = useCustomFonts();
  const fontOptions = useMemo(() => {
    if (!data) return BundledFontOptions;
    return [...BundledFontOptions, ...data];
  }, [data]);

  const accentFont = usePreferenceStore((s) => s.accentFont);
  const primaryFont = usePreferenceStore((s) => s.primaryFont);

  const { label, setFont, headline } = FontConfig[props.type];
  const selectedFont = props.type === "Accent" ? accentFont : primaryFont;

  //#region Helpers
  const canDeleteFont = useCallback(
    (font: Font): font is CustomFont => {
      if (isBundledFont(font)) return false;
      return (
        !areFontEqual(font, accentFont) && !areFontEqual(font, primaryFont)
      );
    },
    [accentFont, primaryFont],
  );
  //#endregion

  return (
    <Sheet ref={props.ref}>
      <Sheet.Header
        label={t(label)}
        Trailing={
          <IconButton
            icon="upload"
            accessibilityLabel={t("feat.backup.extra.import")}
            onPress={() => importFont(setFont)}
            _iconSize={32}
          />
        }
      />
      <Sheet.List
        numColumns={2}
        data={fontOptions}
        keyExtractor={(font) => (isBundledFont(font) ? font : font.id)}
        extraData={selectedFont}
        renderItem={({ item: font }) => {
          const selected = areFontEqual(selectedFont, font);
          return (
            <View
              className={cn(
                "relative flex-1 rounded-[27] border border-transparent p-0.5",
                { "border-onSurfaceVariant": selected },
              )}
            >
              <Button
                onPress={() => setFont(font)}
                disabled={selected}
                className="h-24 p-2 disabled:opacity-100"
              >
                <Text
                  numberOfLines={2}
                  center
                  size="lg"
                  style={{ fontFamily: getFont(font, { headline }) }}
                  className="leading-tight"
                >
                  {getFontDisplayName(font)}
                </Text>
              </Button>
              {canDeleteFont(font) ? (
                <IconButton
                  icon="delete"
                  accessibilityLabel={t("form.delete")}
                  onPress={() => deleteCustomFont(font.id)}
                  intent="error"
                  filled
                  size="xs"
                  hitSlop={4}
                  className="absolute top-2 right-2"
                />
              ) : null}
            </View>
          );
        }}
      />
    </Sheet>
  );
}

//#region Helpers
async function importFont(setFont: (font: Font) => void) {
  try {
    const { uri } = await pickFile(["font/otf", "font/ttf"]);
    const name = await getFontName(uri);
    const result = await saveCustomFont({ name, uri });
    if (result) {
      await loadCustomFont(result.uri);
      setFont(result);
    }
  } catch (err) {
    toast.error((err as Error).message);
  }
}
//#endregion
