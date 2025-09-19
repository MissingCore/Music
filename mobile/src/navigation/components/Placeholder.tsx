import type { ParseKeys } from "i18next";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { Colors } from "~/constants/Styles";
import { cn } from "~/lib/style";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";

type ErrorMsgProps = {
  /** Key to error messaeg in translations. */
  errMsgKey?: ParseKeys;
  /** Displays this over the string specified by `errMsgKey`. */
  errMsg?: string;
};

const { neutral10, neutral40, neutral80 } = Colors;

/** Nothing loading animation. */
export function Loading() {
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
            idx === 0 ? neutral80 : idx === 1 ? neutral40 : neutral10,
        }}
        className="size-4 rounded-full"
      />
      <View
        style={{ backgroundColor: idx === 1 ? neutral80 : neutral40 }}
        className="size-4 rounded-full"
      />
      <View
        style={{ backgroundColor: idx === 2 ? neutral80 : neutral10 }}
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
