// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";

import { getArtistsString } from "~/data/artist/utils";
import {
  navigateToArtist,
  presentArtistsSheet,
} from "~/stores/Session/actions";
import type { PopStrategy } from "~/stores/Session/types";

import { cn } from "~/lib/style";
import { Text } from "~/components/next/base/typography";
import { Marquee } from "~/components/next/blocks/marquee";
import { Pressable } from "~/components/next/primitive/pressable";

/** Renders display string for artists, with different onPress actions based on the number of artists. */
export function ArtistsLink(props: {
  artists: string[] | null;
  /** Function called before we navigate away from the current screen. */
  beforeNavigation?: VoidFunction;
  /** Optional screen popping strategy to navigate to the artist screen. */
  popStrategy?: PopStrategy;
  center?: boolean;
  className?: string;
}) {
  const navigation = useNavigation();

  if (props.artists === null || props.artists.length === 0) return null;
  const artists = props.artists as [string, ...string[]];
  return (
    <Marquee center={props.center}>
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
        <Text size="xs" className={cn("text-primary", props.className)}>
          {getArtistsString(props.artists)}
        </Text>
      </Pressable>
    </Marquee>
  );
}
