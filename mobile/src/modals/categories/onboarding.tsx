import { useAtom } from "jotai";
import { unwrap } from "jotai/utils";
import { Modal, Pressable, Text, View } from "react-native";

import { createAtomWithStorage } from "@/lib/jotai";
import { Heading } from "@/components/ui/text";

const hasOnboardedAsyncAtom = createAtomWithStorage<boolean | undefined>(
  "shown-intro-modal",
  undefined,
);
export const hasOnboardedAtom = unwrap(hasOnboardedAsyncAtom, (prev) => prev);

/** Displayed during onboarding and informs user of the quirks of the app. */
export function QuickStartModal() {
  const [hasOnboarded, setHasOnboarded] = useAtom(hasOnboardedAtom);

  const onClose = () => {
    setHasOnboarded(true);
  };

  return (
    <Modal
      animationType="fade"
      visible={hasOnboarded === false}
      onRequestClose={onClose}
      transparent
    >
      <View className="flex-1 items-center justify-center bg-canvas/50">
        <View className="m-4 rounded-xl bg-surface800 p-4">
          <Heading as="h2" className="mb-8 font-ndot57">
            Quick Start
          </Heading>

          <Text className="mb-2 font-geistMono text-sm text-foreground50">
            Default Scanning
          </Text>
          <Text className="mb-6 font-geistMonoLight text-xs text-surface400">
            By default, <Text className="font-ndot57">Music</Text> will{" "}
            <Text className="text-foreground100">
              scan for tracks in the top-level `Music` directory
            </Text>{" "}
            on every storage device found. To change this behavior, update the
            filters in the `Library` screen in the settings page.
          </Text>

          <Text className="mb-2 font-geistMono text-sm text-foreground50">
            Artwork Saving
          </Text>
          <Text className="mb-10 font-geistMonoLight text-xs text-surface400">
            Track artwork is being saved in the background in an optimal manner.
            You may experience some UI lag as a result.
          </Text>

          <Pressable
            onPress={onClose}
            className="self-end px-4 py-2 active:opacity-75"
          >
            <Text className="font-geistMono text-base text-foreground100">
              Dismiss
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
