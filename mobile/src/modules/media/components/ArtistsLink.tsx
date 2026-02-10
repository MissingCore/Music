import { useNavigation } from "@react-navigation/native";
import { Pressable } from "react-native";

import type { PopStrategy } from "~/services/SessionStore";
import { navigateToArtist, presentArtistsSheet } from "~/services/SessionStore";

import type { ColorRole } from "~/lib/style";
import { cn } from "~/lib/style";
import { Marquee } from "~/components/Marquee";
import { StyledText } from "~/components/Typography/StyledText";

/** Renders display string for artists, with different onPress actions based on the number of artists. */
export function ArtistsLink(props: {
  artistNames: string[];
  /** Function called before we navigate away from the current screen. */
  beforeNavigation?: VoidFunction;
  /** Optional screen popping strategy to navigate to the artist screen. */
  popStrategy?: PopStrategy;
  marqueeShadowColor?: ColorRole;
  className?: string;
}) {
  const navigation = useNavigation();

  if (props.artistNames.length === 0) return null;
  return (
    <Marquee color={props.marqueeShadowColor}>
      <Pressable
        onPress={() => {
          if (props.beforeNavigation) props.beforeNavigation();
          if (props.artistNames.length === 1) {
            navigateToArtist(
              navigation,
              props.artistNames[0]!,
              props.popStrategy,
            );
          } else {
            presentArtistsSheet(props.artistNames, props.popStrategy);
          }
        }}
      >
        <StyledText className={cn("text-xs text-primary", props.className)}>
          {props.artistNames.join(", ")}
        </StyledText>
      </Pressable>
    </Marquee>
  );
}
