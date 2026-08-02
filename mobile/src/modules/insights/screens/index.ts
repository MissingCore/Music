// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import HiddenTracks from "./HiddenTracksView";
import MostPlayed from "./MostPlayedView";
import RecentlyPlayed from "./RecentlyPlayedView";
import SaveErrors from "./SaveErrorsView";
import Insights from "./View";

const InsightsScreenGroup = {
  screenOptions: {
    animation: "fade",
  },
  screens: {
    RecentlyPlayed: {
      screen: RecentlyPlayed,
      options: { title: "feat.playedRecent.title", animation: "default" },
    },

    Insights: {
      screen: Insights,
      options: { title: "feat.insights.title" },
    },
    HiddenTracks: {
      screen: HiddenTracks,
      options: { title: "feat.hiddenTracks.title" },
    },
    MostPlayed: {
      screen: MostPlayed,
      options: { title: "feat.mostPlayed.title" },
    },
    SaveErrors: {
      screen: SaveErrors,
      options: { title: "feat.saveErrors.title" },
    },
  },
} as const;

export default InsightsScreenGroup;
