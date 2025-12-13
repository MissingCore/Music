import { useMemo } from "react";

import { Image } from "~/resources/icons/Image";
import { LowPriority } from "~/resources/icons/LowPriority";
import { QueueMusic } from "~/resources/icons/QueueMusic";
import { Queue } from "~/stores/Playback/actions";

import type { MenuAction } from "~/components/Menu";
import { Menu } from "~/components/Menu";

/** Icon button that opens a menu with some pre-defined options. */
export function CurrentListMenu(props: {
  name: string;
  trackIds: string[];
  actions?: MenuAction[];
  presentArtworkSheet?: VoidFunction;
}) {
  const queueActions = useMemo<MenuAction[]>(
    () => [
      {
        Icon: QueueMusic,
        labelKey: "feat.queue.extra.playNext",
        onPress: () => Queue.add({ id: props.trackIds, name: props.name }),
      },
      {
        Icon: LowPriority,
        labelKey: "feat.queue.extra.playLast",
        onPress: () => Queue.addToEnd({ id: props.trackIds, name: props.name }),
      },
    ],
    [props.name, props.trackIds],
  );

  const menuActions = useMemo(() => {
    const actions: MenuAction[] = [];

    if (props.presentArtworkSheet) {
      actions.push({
        Icon: Image,
        labelKey: "feat.artwork.extra.change",
        onPress: props.presentArtworkSheet,
      });
    }

    return actions.concat(props.actions ?? []).concat(queueActions);
  }, [props.actions, props.presentArtworkSheet, queueActions]);

  return <Menu actions={menuActions} />;
}
