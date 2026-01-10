import type { ParseKeys } from "i18next";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { useTheme } from "~/hooks/useTheme";

import { cn } from "~/lib/style";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";

type ErrorMsgProps = {
  /** Key to error messaeg in translations. */
  errMsgKey?: ParseKeys;
  /** Displays this over the string specified by `errMsgKey`. */
  errMsg?: string;
};

/** Nothing loading animation. */
export function Loading() {
  const { onSurfaceVariant, outline, outlineVariant } = useTheme();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((prev) => (prev + 1) % 3);
    }, 250);
    return () => clearInterval(interval);
  }, []);

  return (
    <View className="w-full flex-row justify-center gap-3">
      <View
        style={{
          backgroundColor:
            idx === 0 ? outlineVariant : idx === 1 ? outline : onSurfaceVariant,
        }}
        className="size-4 rounded-full"
      />
      <View
        style={{ backgroundColor: idx === 1 ? outlineVariant : outline }}
        className="size-4 rounded-full"
      />
      <View
        style={{
          backgroundColor: idx === 2 ? outlineVariant : onSurfaceVariant,
        }}
        className="size-4 rounded-full"
      />
    </View>
  );
}

/** Placeholder to render inside a list. */
export function ContentPlaceholder(
  props: ErrorMsgProps & {
    isPending?: boolean;
    className?: string;
  },
) {
  return (
    <View className={cn("p-4", props.className)}>
      {props.isPending ? (
        <Loading />
      ) : props.errMsg ? (
        <StyledText center>{props.errMsg}</StyledText>
      ) : (
        <TStyledText textKey={props.errMsgKey ?? "err.msg.noContent"} center />
      )}
    </View>
  );
}

/** Placeholder to render while waiting for data from React Query. */
export function PagePlaceholder(props: ErrorMsgProps & { isPending: boolean }) {
  return (
    <View className="w-full flex-1 p-4">
      <ContentPlaceholder {...props} />
    </View>
  );
}
