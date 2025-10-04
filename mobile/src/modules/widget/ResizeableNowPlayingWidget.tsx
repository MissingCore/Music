import type { TextWidgetProps } from "react-native-android-widget";
import {
  FlexWidget,
  OverlapWidget,
  TextWidget,
} from "react-native-android-widget";

import { Colors } from "~/constants/Styles";
import type { PlayerWidgetData, WithDimensions } from "./types";
import { Action, withAction } from "./constants/Action";
import { Styles } from "./constants/Styles";
import { WidgetArtwork } from "./components/WidgetArtwork";
import { WidgetBaseLayout } from "./components/WidgetBaseLayout";
import { WidgetCell } from "./components/WidgetCell";
import { WidgetSVG } from "./components/WidgetSVG";

type WidgetProps = WithDimensions<PlayerWidgetData & { openApp?: boolean }>;

export function ResizeableNowPlayingWidget(props: WidgetProps) {
  const canUseFullArea = props.width - props.height > 2 * props.height;
  let widgetHeight = props.height;

  // We want the width to be ~(2x the widget height + Styles.layoutGap).
  if (!canUseFullArea) {
    const threshold = (props.width - Styles.layoutGap) / 2;
    while (widgetHeight > threshold) {
      widgetHeight -= 1;
    }
  }

  const contentPadding = Styles.layoutGap / 2;
  const contentWidth = props.width - widgetHeight - 2 * contentPadding;

  // Calculate scaled font size for text.
  const maxTextHeight = widgetHeight / 2 - 3 * contentPadding;
  const textFontSize = maxTextHeight / 4;

  const openApp = props.openApp || props.track === undefined;

  return (
    <WidgetBaseLayout
      clickAction={Action.Open}
      height={widgetHeight}
      width={props.width}
    >
      <OverlapWidget>
        <WidgetCell size={widgetHeight} style={{ borderRadius: 0 }}>
          <WidgetArtwork
            size={widgetHeight}
            artwork={props.track?.artwork ?? null}
          />
        </WidgetCell>
        <FlexWidget
          style={{
            height: widgetHeight,
            justifyContent: "flex-end",
            padding: contentPadding,
            marginLeft: widgetHeight,
          }}
        >
          <WidgetText
            text={props.track?.title ?? "—"}
            maxLines={2}
            style={{ fontSize: textFontSize, color: Colors.neutral100 }}
          />
          <WidgetText
            text={props.track?.artist ?? "—"}
            maxLines={1}
            style={{ fontSize: textFontSize, color: `${Colors.neutral100}99` }} // 60% opacity
          />
          <MediaControls
            maxWidth={contentWidth}
            maxHeight={widgetHeight / 4}
            openApp={openApp}
            isPlaying={props.isPlaying}
          />
        </FlexWidget>
      </OverlapWidget>
    </WidgetBaseLayout>
  );
}

//#region Layout Helpers
function WidgetText({ style, ...props }: TextWidgetProps) {
  return (
    <TextWidget
      truncate="END"
      allowFontScaling={false}
      style={{ fontFamily: "Inter-Regular", ...style }}
      {...props}
    />
  );
}

function MediaControls(props: {
  maxWidth: number;
  maxHeight: number;
  openApp: boolean;
  isPlaying: boolean;
}) {
  const svgSize = Math.min(props.maxWidth / 6, (props.maxHeight * 2) / 3);
  const paddingY = svgSize / 8;
  const paddingX = paddingY * 4;

  return (
    <FlexWidget
      style={{
        width: props.maxWidth,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-evenly",
        paddingTop: Styles.layoutGap / 2,
      }}
    >
      <WidgetSVG
        clickAction={withAction(Action.Prev, props.openApp)}
        name="prev"
        size={svgSize}
      />
      <FlexWidget
        clickAction={withAction(Action.PlayPause, props.openApp)}
        style={{
          paddingHorizontal: paddingX,
          paddingVertical: paddingY,
          backgroundColor: !props.isPlaying ? Colors.red : Colors.neutral20,
          borderRadius: 999,
        }}
      >
        <WidgetSVG name={props.isPlaying ? "pause" : "play"} size={svgSize} />
      </FlexWidget>
      <WidgetSVG
        clickAction={withAction(Action.Next, props.openApp)}
        name="next"
        size={svgSize}
      />
    </FlexWidget>
  );
}
//#endregion
