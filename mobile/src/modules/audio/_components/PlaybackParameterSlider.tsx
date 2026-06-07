import { useCallback } from "react";
import { View } from "react-native";
import type { SharedValue } from "react-native-reanimated";

import type { Icon } from "~/resources/icons/type";
import { sessionStore, useSessionStore } from "~/stores/Session/store";

import { capitalize } from "~/utils/string";
import { Button } from "~/components/Form/Button";
import { Em } from "~/components/Typography/StyledText";
import { AudioEffectSlider } from "./AudioEffectSlider";

const PRESET_OPTIONS = [1, 1.25, 1.5, 2] as const;

export function PlaybackParameterSlider(props: {
  field: "pitch" | "speed";
  onUpdate: (value: number) => void;
  Icon: (props: Icon) => React.JSX.Element;
}) {
  const fieldName = `playback${capitalize(props.field)}` as const;
  const fieldNameKey = `feat.playback.extra.${props.field}` as const;

  const storedValue = useSessionStore((s) => s[fieldName]);

  const setField = useCallback(
    (value: number) => {
      sessionStore.setState({ [fieldName]: value });
      props.onUpdate(value);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.onUpdate, fieldName],
  );

  const PresetButtons = useCallback(
    ({ liveValue }: { liveValue: SharedValue<number> }) => {
      return (
        <View className="flex-row items-center gap-4">
          {PRESET_OPTIONS.map((preset) => (
            <Button
              key={preset}
              onPress={() => {
                setField(preset);
                liveValue.set(preset);
              }}
              className="min-h-8 flex-1 rounded-full bg-surfaceContainerLow py-2 active:bg-surfaceContainer"
            >
              <Em>{formatValue(preset)}</Em>
            </Button>
          ))}
        </View>
      );
    },
    [setField],
  );

  return (
    <AudioEffectSlider
      labelKey={fieldNameKey}
      value={storedValue}
      min={0.25}
      max={2}
      step={0.05}
      onChange={setField}
      displayedValue={`${numberFormatter.format(storedValue)}x`}
      Icon={props.Icon}
      ExtraContent={PresetButtons}
    />
  );
}

//#region Helpers
const numberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

function formatValue(val: number) {
  return `${numberFormatter.format(val)}x`;
}
//#endregion
