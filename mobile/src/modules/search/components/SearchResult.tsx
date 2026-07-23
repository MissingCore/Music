// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { PressProps } from "~/components/Base/Pressable";
import { ListItem } from "~/components/List";
import { MediaImage } from "~/modules/media/components/MediaImage";
import type { MediaType } from "~/stores/Playback/types";

export namespace SearchResult {
  export type Content = {
    title: string;
    description?: string;
    type: MediaType;
    imageSource?: MediaImage.ImageSource;
    /** Renders this instead of the image if provided. */
    Leading?: React.JSX.Element;
    className?: string;
  };

  export type Props = Content &
    PressProps & {
      /** Make this stand out more. */
      poppyLabel?: boolean;
      Trailing?: React.JSX.Element;
    };
}

/** Displays information about a media item. */
export function SearchResult(props: SearchResult.Props) {
  return (
    <ListItem
      {...props}
      labelText={props.title}
      supportingText={props.description}
      Leading={
        props.Leading ? (
          props.Leading
        ) : (
          <MediaImage
            type={props.type}
            size={48}
            source={props.imageSource ?? null}
            className="rounded-xs"
          />
        )
      }
      _labelTextClassName={props.poppyLabel ? "text-primary" : undefined}
    />
  );
}
