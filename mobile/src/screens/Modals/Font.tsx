import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";

import { useUserPreferencesStore } from "@/services/UserPreferences";

import { Radio } from "@/components/new/Form";
import { ModalHeader, ModalSheet } from "@/components/new/Modal";

/** Modal to change the app's accent font. */
export const FontModal = forwardRef<BottomSheetModal, {}>(
  function FontModal(_props, ref) {
    const { t } = useTranslation();
    const accentFont = useUserPreferencesStore((state) => state.accentFont);
    const setAccentFont = useUserPreferencesStore(
      (state) => state.setAccentFont,
    );

    return (
      <ModalSheet ref={ref} enableOverDrag={false}>
        <BottomSheetView className="gap-1">
          <ModalHeader title={t("title.font")} />
          <Radio
            selected={accentFont === "NDot"}
            onSelect={() => setAccentFont("NDot")}
          >
            <Text className="font-ndot text-base leading-tight text-foreground">
              NDot
            </Text>
          </Radio>
          <Radio
            selected={accentFont === "NType"}
            onSelect={() => setAccentFont("NType")}
            containerClassName="mb-3"
          >
            <Text className="font-ntype text-base leading-tight text-foreground">
              NType
            </Text>
          </Radio>
        </BottomSheetView>
      </ModalSheet>
    );
  },
);
