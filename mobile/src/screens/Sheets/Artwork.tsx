import { useState } from "react";
import { View, useWindowDimensions } from "react-native";

import { usePlaylist, useUpdatePlaylist } from "@/queries/playlist";

import { pickImage } from "@/lib/file-system";
import { mutateGuard } from "@/lib/react-query";
import { Button } from "@/components/Form";
import { Sheet } from "@/components/Sheet";
import { TStyledText } from "@/components/Typography";
import { MediaImage } from "@/modules/media/components";
import type { MediaType } from "@/modules/media/types";

/** Sheet allowing us to change the artwork of a playlist. */
export function PlaylistArtworkSheet(props: { payload: { id: string } }) {
  const { data } = usePlaylist(props.payload.id);
  const updatePlaylist = useUpdatePlaylist(props.payload.id);

  return (
    <Sheet
      id="PlaylistArtworkSheet"
      contentContainerClassName="items-center gap-6"
    >
      <BaseArtworkSheetContent
        type="playlist"
        imageSource={data?.imageSource ?? null}
        onChange={async (artwork) => mutateGuard(updatePlaylist, { artwork })}
        onRemove={async () => mutateGuard(updatePlaylist, { artwork: null })}
      />
    </Sheet>
  );
}

/** Reusable sheet for changing the artwork of some media. */
function BaseArtworkSheetContent(props: {
  type: MediaType;
  imageSource: MediaImage.ImageSource | Array<string | null>;
  onChange: (newUri: string) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const { height, width } = useWindowDimensions();
  const [disabled, setDisable] = useState(false);

  const disableRemove =
    disabled || props.imageSource === null || Array.isArray(props.imageSource);

  return (
    <>
      {/* @ts-expect-error Things should be fine with proper usage. */}
      <MediaImage
        type={props.type}
        source={props.imageSource ?? null}
        size={width - 96 > height - 256 ? height - 256 : width - 96}
        className="mx-4"
      />
      <View className="flex-row gap-2">
        <Button
          onPress={async () => {
            setDisable(true);
            try {
              await props.onRemove();
            } catch {}
            setDisable(false);
          }}
          disabled={disableRemove}
          className="flex-1"
        >
          <TStyledText
            textKey="playlist.artworkRemove"
            bold
            className="text-center text-sm"
          />
        </Button>
        <Button
          onPress={async () => {
            setDisable(true);
            try {
              await props.onChange(await pickImage());
            } catch {}
            setDisable(false);
          }}
          disabled={disabled}
          className="flex-1"
        >
          <TStyledText
            textKey="playlist.artworkChange"
            bold
            className="text-center text-sm"
          />
        </Button>
      </View>
    </>
  );
}
