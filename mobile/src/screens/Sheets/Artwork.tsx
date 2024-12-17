import { View, useWindowDimensions } from "react-native";

import { usePlaylist, useUpdatePlaylist } from "@/queries/playlist";

import { pickImage } from "@/lib/file-system";
import { mutateGuard } from "@/lib/react-query";
import { Marquee } from "@/components/Containment";
import { Button } from "@/components/Form";
import { Sheet } from "@/components/Sheet";
import { StyledText, TStyledText } from "@/components/Typography";
import { MediaImage } from "@/modules/media/components";
import type { MediaType } from "@/modules/media/types";

/** Sheet allowing us to change the artwork of a playlist. */
export function PlaylistArtworkSheet(props: { payload: { id: string } }) {
  const { data } = usePlaylist(props.payload.id);
  const updatePlaylist = useUpdatePlaylist(props.payload.id);

  return (
    <BaseArtworkSheet
      id="PlaylistArtworkSheet"
      type="playlist"
      imageSource={data?.imageSource ?? null}
      onChange={async (artwork) => mutateGuard(updatePlaylist, { artwork })}
      onRemove={async () => mutateGuard(updatePlaylist, { artwork: null })}
    />
  );
}

/** Reusable sheet for changing the artwork of some media. */
function BaseArtworkSheet(props: {
  id: string;
  type: MediaType;
  imageSource: MediaImage.ImageSource | Array<string | null>;
  onChange: (newUri: string) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const { height, width } = useWindowDimensions();
  return (
    <Sheet id={props.id} contentContainerClassName="items-center gap-6">
      <View className="items-center gap-3">
        {/* @ts-expect-error Things should be fine with proper usage. */}
        <MediaImage
          type={props.type}
          source={props.imageSource ?? null}
          size={width - 64 > height - 256 ? height - 256 : width - 64}
        />
        {typeof props.imageSource === "string" ? (
          <Marquee center>
            <StyledText preset="dimOnCanvas">{props.imageSource}</StyledText>
          </Marquee>
        ) : undefined}
      </View>

      <View className="flex-row gap-2">
        <Button
          onPress={props.onRemove}
          disabled={
            props.imageSource === null || Array.isArray(props.imageSource)
          }
        >
          <TStyledText
            textKey="playlist.artworkRemove"
            bold
            className="text-center text-sm"
          />
        </Button>
        <Button
          onPress={async () => {
            try {
              await props.onChange(await pickImage());
            } catch {}
          }}
        >
          <TStyledText
            textKey="playlist.artworkChange"
            bold
            className="text-center text-sm"
          />
        </Button>
      </View>
    </Sheet>
  );
}
