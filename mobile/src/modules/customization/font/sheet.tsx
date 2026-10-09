// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { getFontName } from "@missingcore/native-utils";
import { toast } from "@missingcore/ui/toast";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import type { CustomFont } from "~/db/schema";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";
import { useGetLayoutConfig } from "~/hooks/useLayoutConfigs";

import { pickFile } from "~/lib/file-system";
import { cn } from "~/lib/style";
import { useLegendListRef } from "~/components/Base/LegendList";
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

const columnConfigs = { minWidth: 160, minCols: 1.75, gap: 6 };

export function FontSheet(props: {
  ref: SheetRef;
  type: "Accent" | "Primary";
}) {
  const { t } = useTranslation();
  const { width } = useGetLayoutConfig(columnConfigs);

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
  const isFontSelected = useCallback(
    (font: Font) => areFontEqual(selectedFont, font),
    [selectedFont],
  );

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

  //#region Auto-Scroll
  const listRef = useLegendListRef();
  const prevSelectedFont = useRef<Font | null>(null);

  const scrollSelectedIntoView = useCallback(
    (animated = true) =>
      listRef.current?.scrollToIndex({
        index: fontOptions.findIndex(isFontSelected),
        animated,
        viewPosition: 0.5,
      }),
    [listRef, fontOptions, isFontSelected],
  );

  useEffect(() => {
    if (prevSelectedFont.current !== selectedFont) {
      prevSelectedFont.current = selectedFont;
      scrollSelectedIntoView();
    }
  }, [fontOptions, selectedFont, scrollSelectedIntoView]);
  //#endregion

  //#region Actions
  const importFont = useCallback(async () => {
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
  }, [setFont]);

  const deleteFont = useCallback(
    async (id: string, index: number) => {
      await deleteCustomFont(id);
      listRef.current?.scrollToOffset({
        offset: (index - 1) * (width + 6),
      });
    },
    [listRef, width],
  );
  //#endregion

  return (
    <Sheet ref={props.ref}>
      <Sheet.Header label={t(label)} />
      <Sheet.List
        ref={listRef}
        onLayout={() => scrollSelectedIntoView(false)}
        horizontal
        data={fontOptions}
        keyExtractor={(font) => (isBundledFont(font) ? font : font.id)}
        extraData={isFontSelected}
        renderItem={({ item: font, index }) => {
          const selected = isFontSelected(font);
          return (
            <View
              className={cn(
                "relative mx-0.75 rounded-[27] border border-transparent p-0.5",
                { "border-onSurfaceVariant": selected },
              )}
            >
              <Button
                onPress={() => setFont(font)}
                disabled={selected}
                filled
                style={{ width }}
                className="aspect-video disabled:opacity-100"
              >
                <Text
                  numberOfLines={2}
                  center
                  size="2xl"
                  style={{ fontFamily: getFont(font, { headline }) }}
                >
                  {getFontDisplayName(font)}
                </Text>
              </Button>
              {canDeleteFont(font) ? (
                <IconButton
                  icon="delete"
                  accessibilityLabel={t("form.delete")}
                  onPress={() => deleteFont(font.id, index)}
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
        className="-mx-4.75 mb-0"
        contentContainerClassName="px-4 pb-0"
      />
      <Sheet.Footer>
        <IconButton
          icon="upload"
          accessibilityLabel={t("feat.backup.extra.import")}
          onPress={importFont}
          filled
          wide
          className="self-center"
        />
      </Sheet.Footer>
    </Sheet>
  );
}
