import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import * as FileSystem from "expo-file-system";
import { useAtom } from "jotai";
import { forwardRef, useMemo, useState } from "react";
import { Platform, Text, TextInput, View } from "react-native";
import { Toast } from "react-native-toast-notifications";

import { CreateNewFolderOutline } from "@/assets/svgs/MaterialSymbol";
import type { allowListAtom } from "@/features/setting/api/library";
import { settingModalAtom } from "../../store";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";
import { StyledPressable } from "@/components/ui/pressable";
import { Heading } from "@/components/ui/text";
import { ModalBase } from "@/features/modal/components/modal-base";
import { ModalFormButton } from "@/features/modal/components/form-button";

/** List of warning messages we can display. */
const WarningsMap = {
  supersede: "This supersede a previous constraint.",
  used: "This constraint is already in the list.",
} as const;

/** Modal to add a new path to a list. */
export const AddListModal = forwardRef<
  BottomSheetModal,
  {
    name: string;
    store: typeof allowListAtom;
  }
>(function AddListModal({ name, store }, ref) {
  const [listData, setListData] = useAtom(store);
  const [newPath, setNewPath] = useState<string>();

  const isValidPath = useMemo(() => {
    if (!newPath) return false;
    const trimmed = newPath.trim();
    return (
      trimmed !== "/" && trimmed.startsWith("/") && !listData.includes(trimmed)
    );
  }, [newPath, listData]);

  const warningKey = useMemo(() => {
    if (!newPath) return;
    const trimmed = newPath.trim();
    if (trimmed === "" || trimmed === "/") return;
    if (listData.includes(trimmed)) return "used";
    if (listData.some((path) => path.startsWith(trimmed))) return "supersede";
  }, [newPath, listData]);

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

        <TextInput
          value={newPath}
          onChangeText={(text) => setNewPath(text)}
          placeholder="/storage/emulated/0"
          placeholderTextColor={Colors.surface400}
          className={cn(
            "mb-2 border-b border-b-foreground100 p-1",
            "font-geistMonoLight text-base text-foreground100",
          )}
        />
        <Text className="mb-8 text-start font-geistMonoLight text-xs text-accent50">
          {!!warningKey && WarningsMap[warningKey]}
        </Text>

        <View className="flex-row justify-end gap-2">
          <ModalFormButton
            disabled={!isValidPath}
            variant="outline"
            onPress={async () => {
              const trimmed = newPath!.trim();
              // Check to see if directory exists before we add it.
              try {
                const { exists, isDirectory } = await FileSystem.getInfoAsync(
                  `file://${trimmed}`,
                );
                if (!exists || !isDirectory) throw Error();
              } catch {
                Toast.show(`\`${trimmed}\` does not exist.`, {
                  type: "danger",
                });
                return;
              }
              setListData(async (prev) => [...(await prev), trimmed]);
            }}
          >
            ADD
          </ModalFormButton>
        </View>
      </BottomSheetScrollView>
    </ModalBase>
  );
});
