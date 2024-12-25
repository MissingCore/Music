import { useAlbumsForCards } from "@/queries/album";
import { StickyActionListLayout } from "@/layouts";

import { useMediaCardListPreset } from "@/modules/media/components";

/** Screen for `/album` route. */
export default function AlbumScreen() {
  const { isPending, data } = useAlbumsForCards();
  const presets = useMediaCardListPreset({
    ...{ data, isPending },
    emptyMsgKey: "response.noAlbums",
  });

  return <StickyActionListLayout titleKey="common.albums" {...presets} />;
}
