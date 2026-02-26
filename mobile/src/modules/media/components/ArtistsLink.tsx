import { useNavigation } from "@react-navigation/native";

import {
  navigateToArtist,
  presentArtistsSheet,
} from "~/stores/Session/actions";

import type { ColorRole } from "~/lib/style";
import { cn } from "~/lib/style";
import { Pressable } from "~/components/Base/Pressable";
import { Marquee } from "~/components/Marquee";
import { StyledText } from "~/components/Typography/StyledText";
import type { PopStrategy } from "~/stores/Session/types";

/** Renders display string for artists, with different onPress actions based on the number of artists. */
export function ArtistsLink(props: {
  artists: string[] | null;
  /** Function called before we navigate away from the current screen. */
  beforeNavigation?: VoidFunction;
  /** Optional screen popping strategy to navigate to the artist screen. */
  popStrategy?: PopStrategy;
  marqueeShadowColor?: ColorRole;
  className?: string;
}) {
  const navigation = useNavigation();

  if (props.artists === null || props.artists.length === 0) return null;
  const artists = props.artists as [string, ...string[]];
  return (
    <Marquee color={props.marqueeShadowColor}>
      <Pressable
        onPress={() => {
          if (props.beforeNavigation) props.beforeNavigation();
          if (artists.length === 1) {
            navigateToArtist(navigation, artists[0], props.popStrategy);
          } else {
            presentArtistsSheet(artists, props.popStrategy);
          }
        }}
      >
        <StyledText className={cn("text-xs text-primary", props.className)}>
          {props.artists.join(", ")}
        </StyledText>
      </Pressable>
    </Marquee>
  );
}
