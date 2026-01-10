import type { PressProps } from "~/components/Form/Button/types";
import { ListItem } from "~/components/List";
import { MediaImage } from "~/modules/media/components/MediaImage";
import type { MediaType } from "~/stores/Playback/types";

export namespace SearchResult {
  export type Content = {
    title: string;
    description?: string;
    type: MediaType;
    imageSource?: MediaImage.ImageSource | MediaImage.ImageSource[];
    /** Renders this instead of the image if provided. */
    LeftElement?: React.JSX.Element;
    className?: string;
  };

  export type Props = Content &
    PressProps & {
      /** Enables press events. */
      button?: boolean;
      /** Make this stand out more. */
      poppyLabel?: boolean;
      RightElement?: React.JSX.Element;
    };
}

/** Displays information about a media item. */
export function SearchResult(props: SearchResult.Props) {
  return (
    <ListItem
      {...props}
      labelText={props.title}
      supportingText={props.description}
      LeftElement={
        props.LeftElement ? (
          props.LeftElement
        ) : (
          /* @ts-expect-error Things should be fine with proper usage. */
          <MediaImage
            type={props.type}
            size={48}
            source={props.imageSource ?? null}
            className="rounded-xs"
          />
        )
      }
      _asView={!props.button}
      _labelTextClassName={props.poppyLabel ? "text-primary" : undefined}
    />
  );
}
