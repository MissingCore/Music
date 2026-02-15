import { View } from "react-native";

import { Schedule } from "~/resources/icons/Schedule";

import { Marquee } from "~/components/Marquee";
import { Em, StyledText } from "~/components/Typography/StyledText";
import { ArtistsLink } from "~/modules/media/components/ArtistsLink";

//#region List Info
type CurrentListInfoProps = {
  title: string;
  artists?: string[];
  metadata: string[];
  Actions: React.ReactNode;
};

function CurrentListInfo(props: CurrentListInfoProps) {
  return (
    <View className="flex-row items-center gap-4">
      <View className="shrink grow gap-1">
        <Marquee>
          <Em className="text-lg">{props.title}</Em>
        </Marquee>
        {props.artists ? (
          <ArtistsLink
            artistNames={props.artists}
            popStrategy="popTo"
            className="text-sm"
          />
        ) : null}
        <Marquee contentContainerClassName="gap-0">
          <StyledText dim className="text-xxs">
            {props.metadata.toSpliced(-1).join(" • ")}
          </StyledText>
          {/* Work around for RTL languages. */}
          <StyledText dim className="text-xxs">
            {" • "}
          </StyledText>
          <Schedule size={12} color="onSurfaceVariant" />
          <StyledText dim className="text-xxs">
            {` ${props.metadata.at(-1)!}`}
          </StyledText>
        </Marquee>
      </View>
      {props.Actions}
    </View>
  );
}
//#endregion
