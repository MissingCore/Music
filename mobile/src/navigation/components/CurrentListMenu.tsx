// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { SupportedIconName } from "~/resources/icons";
import { Icon } from "~/resources/icons";
import { Queue } from "~/stores/Playback/actions";

import { IconButton } from "~/components/Form/Button/Icon";
import { ListItem } from "~/components/List";
import { Menu } from "~/components/Menu";

export type MenuAction = {
  icon?: SupportedIconName;
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
        icon: "queue-music",
        labelKey: "feat.queue.extra.playNext",
        onPress: () => Queue.add({ id: props.trackIds, name: props.name }),
      },
      {
        icon: "low-priority",
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
        icon: "image",
        labelKey: "feat.artwork.extra.change",
        onPress: props.presentArtworkSheet,
      });
    }

    if (props.presentSortOptionsSheet) {
      actions.push({
        icon: "sort",
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
          labelText={item.labelKey}
          onPress={() => {
            item.onPress();
            setVisible(false);
          }}
          Leading={item.icon ? <Icon name={item.icon} /> : null}
          className="px-3"
          rippleColor="surfaceContainer"
          _labelTextClassName="text-sm"
        />
      ))}
    </Menu>
  );
}
