// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import type { CustomFont } from "~/db/schema";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { PagePlaceholder } from "~/navigation/components/Placeholder";
import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { cn } from "~/lib/style";
import { FlatList } from "~/components/Base/List";
import { Pressable } from "~/components/Base/Pressable";
import { FilledIconButton, IconButton } from "~/components/Form/Button/Icon";
import { Radio } from "~/components/Form/Radio";
import { StyledText } from "~/components/Typography/StyledText";
import type { Font } from "../core/constants";
import { BundledFontOptions } from "../core/constants";
import { deleteCustomFont, useCustomFonts } from "../core/data";
import {
  areFontEqual,
  getFont,
  getFontDisplayName,
  isBundledFont,
} from "../utils";

export function AccentFonts() {
  const accentFont = usePreferenceStore((s) => s.accentFont);
  return (
    <FontsScreenBase
      kind="Accent"
      selectedFont={accentFont}
      updateFont={PreferenceSetters.setAccentFont}
    />
  );
}

export function PrimaryFonts() {
  const primaryFont = usePreferenceStore((s) => s.primaryFont);
  return (
    <FontsScreenBase
      kind="Primary"
      selectedFont={primaryFont}
      updateFont={PreferenceSetters.setPrimaryFont}
    />
  );
}

function FontsScreenBase(props: {
  kind: "Accent" | "Primary";
  selectedFont: Font;
  updateFont: (newFont: Font) => void;
}) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isPending, data } = useCustomFonts();
  const canDeleteFont = useCanDeleteFont();

  const fontOptions = useMemo(() => {
    if (!data) return BundledFontOptions;
    return [...BundledFontOptions, ...data];
  }, [data]);

  const headline = props.kind === "Accent";

  if (isPending) return <PagePlaceholder isPending={isPending} />;
  return (
    <>
      <ScreenOptions
        headerRight={() => (
          <FilledIconButton
            icon="add"
            accessibilityLabel={t("form.create")}
            onPress={() => navigation.navigate("CreateFont")}
          />
        )}
      />
      <FlatList
        data={fontOptions}
        keyExtractor={(font) => (isBundledFont(font) ? font : font.id)}
        renderItem={({ item: font, index }) => {
          const selected = areFontEqual(props.selectedFont, font);
          return (
            <Pressable
              onPress={() => props.updateFont(font)}
              className={cn(
                "min-h-14 flex-row items-center gap-2 rounded-md bg-surfaceContainerLowest p-2 pl-4 active:opacity-75",
                {
                  "mt-0.75 rounded-t-xs": index > 0,
                  "rounded-b-xs": index < fontOptions.length - 1,
                },
              )}
            >
              <Radio selected={selected} />
              <StyledText
                style={{ fontFamily: getFont(font, { headline }) }}
                className="shrink grow"
              >
                {getFontDisplayName(font)}
              </StyledText>
              {canDeleteFont(font) ? (
                <IconButton
                  icon="delete"
                  accessibilityLabel={t("form.delete")}
                  onPress={() => deleteCustomFont(font.id)}
                  _iconColor="error"
                />
              ) : (
                <View className="size-10" />
              )}
            </Pressable>
          );
        }}
        contentContainerClassName="p-4"
      />
    </>
  );
}

//#region Deletion Handling
function useCanDeleteFont() {
  const accentFont = usePreferenceStore((s) => s.accentFont);
  const primaryFont = usePreferenceStore((s) => s.primaryFont);
  return useCallback(
    (font: Font): font is CustomFont => {
      if (isBundledFont(font)) return false;
      return (
        !areFontEqual(font, accentFont) && !areFontEqual(font, primaryFont)
      );
    },
    [accentFont, primaryFont],
  );
}
//#endregion
