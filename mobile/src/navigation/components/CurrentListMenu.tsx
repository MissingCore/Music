import type { ParseKeys } from "i18next";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Icon } from "~/resources/icons/type";
import { Image } from "~/resources/icons/Image";
import { LowPriority } from "~/resources/icons/LowPriority";
import { QueueMusic } from "~/resources/icons/QueueMusic";
import { Sort } from "~/resources/icons/Sort";
import { Queue } from "~/stores/Playback/actions";

import { IconButton } from "~/components/Form/Button/Icon";
import { ListItem } from "~/components/List";
import { Menu } from "~/components/Menu";

export type MenuAction = {
  Icon?: (props: Icon) => React.ReactNode;
  labelKey: ParseKeys;
  onPress: VoidFunction;
};

/** Icon button that opens a menu with some pre-defined options. */
export function CurrentListMenu(props: {
  name: string;
  trackIds: string[];
  actions?: MenuAction[];
  presentArtworkSheet?: VoidFunction;
  presentSortOptionsSheet?: VoidFunction;
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

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

    if (props.presentSortOptionsSheet) {
      actions.push({
        Icon: Sort,
        labelKey: "feat.modalViewPreference.extra.sort",
        onPress: props.presentSortOptionsSheet,
      });
    }

    return actions.concat(props.actions ?? []).concat(queueActions);
  }, [
    props.actions,
    props.presentArtworkSheet,
    props.presentSortOptionsSheet,
    queueActions,
  ]);

  return (
    <Menu
      visible={visible}
      anchor={
        <IconButton
          icon="more-horiz"
          accessibilityLabel={t("term.more")}
          onPress={() => setVisible((prev) => !prev)}
        />
      }
      dismissHandling
      onDismiss={() => setVisible(false)}
      menuClassName="overflow-hidden rounded-md bg-surfaceContainerLowest"
    >
      {menuActions.map((item) => (
        <ListItem
          key={item.labelKey}
          labelTextKey={item.labelKey}
          onPress={() => {
            item.onPress();
            setVisible(false);
          }}
          LeftElement={item.Icon ? <item.Icon /> : null}
          className="px-3"
          _labelTextClassName="text-sm"
          _psuedoClassName="active:bg-surfaceContainer/50"
        />
      ))}
    </Menu>
  );
}
