import { useNavigation } from "@react-navigation/native";
import { useImperativeHandle } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useLyricForTrack } from "~/queries/lyric";

import { ScrollView } from "~/components/Defaults";
import { DetachedSheet } from "~/components/Sheet/Detached";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";
import { Button } from "~/components/Form/Button";

export function LyricSheet(props: { ref: TrueSheetRef; trackId: string }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { data } = useLyricForTrack(props.trackId);
  const internalSheetRef = useSheetRef();
  // @ts-expect-error - Should be able to synchronize refs.
  useImperativeHandle(props.ref, () => internalSheetRef.current);

  return (
    <DetachedSheet ref={internalSheetRef} contentContainerClassName="pb-0">
      {data?.lyrics ? (
        <ScrollView nestedScrollEnabled contentContainerClassName="pb-4">
          <StyledText>{data.lyrics}</StyledText>
        </ScrollView>
      ) : (
        <View className="items-center gap-8 pb-4">
          <TStyledText
            textKey="feat.lyrics.extra.notFound"
            bold
            className="text-lg"
          />
          <Button
            onPress={() => {
              internalSheetRef.current?.dismiss();
              navigation.navigate("Lyrics");
            }}
            className="w-full rounded-full"
          >
            <StyledText bold className="text-center text-sm">
              {t("template.entryManage", { name: t("feat.lyrics.title") })}
            </StyledText>
          </Button>
        </View>
      )}
    </DetachedSheet>
  );
}
