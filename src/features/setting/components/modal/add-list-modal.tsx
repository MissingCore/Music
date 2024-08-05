import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { forwardRef, useState } from "react";
import { Platform, Text, View } from "react-native";

import { CreateNewFolderOutline } from "@/assets/svgs/MaterialSymbol";
import type { allowListAtom } from "@/features/setting/api/library";
import { settingModalAtom } from "../../store";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";
import { StyledPressable } from "@/components/ui/pressable";
import { Heading } from "@/components/ui/text";
import { ModalBase } from "@/features/modal/components/modal-base";
import { ModalFormButton } from "@/features/modal/components/form-button";

/** Modal to add a new path to a list. */
export const AddListModal = forwardRef<
  BottomSheetModal,
  {
    name: string;
    store: typeof allowListAtom;
  }
>(function AddListModal({ name, store }, ref) {
  const [newPath, setNewPath] = useState<string>();

  return (
    <ModalBase ref={ref} modalControlAtom={settingModalAtom} detached>
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        className="px-4"
      >
        <Heading as="h2" className="mb-6">
          Add to {name}
        </Heading>

        <View className="mb-6 overflow-hidden rounded border border-surface500">
          <StyledPressable
            onPress={() => {}}
            className={cn(
              "h-[58px] flex-row items-center justify-between p-1 pl-2 pr-0",
              {
                "active:bg-surface700 active:opacity-100":
                  Platform.OS !== "android",
              },
            )}
          >
            <Text className="font-geistMono text-base text-foreground50">
              Find Directory
            </Text>
            <View className="pointer-events-none shrink-0 p-3">
              <CreateNewFolderOutline size={24} />
            </View>
          </StyledPressable>
        </View>

        <BottomSheetTextInput
          value={newPath}
          maxLength={30}
          onChangeText={(text) => setNewPath(text)}
          placeholder="/storage/emulated/0"
          placeholderTextColor={Colors.surface400}
          className={cn(
            "mb-2 border-b border-b-foreground100 p-1",
            "font-geistMonoLight text-base text-foreground100",
          )}
        />
        <View className="mb-8 flex-row gap-2">
          <Text className="text-start font-geistMonoLight text-xs text-accent50">
            This supersede a previous constraint.
          </Text>
        </View>

        <View className="flex-row justify-end gap-2">
          <ModalFormButton disabled={true} variant="outline" onPress={() => {}}>
            ADD
          </ModalFormButton>
        </View>
      </BottomSheetScrollView>
    </ModalBase>
  );
});
