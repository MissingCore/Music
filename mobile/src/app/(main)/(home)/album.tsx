import { useAlbumsForCards } from "~/queries/album";
import { StickyActionListLayout } from "~/layouts/StickyActionScroll";

import { useMediaCardListPreset } from "~/modules/media/components/MediaCard";

/** Screen for `/album` route. */
export default function AlbumScreen() {
  const { isPending, data } = useAlbumsForCards();
  const presets = useMediaCardListPreset({
    data,
    isPending,
    errMsgKey: "err.msg.noAlbums",
  });

  return <StickyActionListLayout titleKey="term.albums" {...presets} />;
}
