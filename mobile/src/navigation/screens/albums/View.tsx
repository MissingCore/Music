import { useAlbumsForCards } from "~/queries/album";
import { StickyActionListLayout } from "../../layouts/StickyActionScroll";

import { useMediaCardListPreset } from "~/modules/media/components/MediaCard";

export default function Albums() {
  const { isPending, data } = useAlbumsForCards();
  const presets = useMediaCardListPreset({
    data,
    isPending,
    errMsgKey: "err.msg.noAlbums",
  });

  return <StickyActionListLayout titleKey="term.albums" {...presets} />;
}
