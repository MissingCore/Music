// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import HiddenTracks from "./HiddenTracksView";
import Recap from "./RecapView";
import RecentlyPlayed from "./RecentlyPlayedView";
import SaveErrors from "./SaveErrorsView";
import Insights from "./View";

const InsightsScreenGroup = {
  screenOptions: { animation: "fade" },
  screens: {
    RecentlyPlayed: {
      screen: RecentlyPlayed,
      options: { animation: "default" },
    },

    Insights,
    HiddenTracks,
    Recap,
    SaveErrors,
  },
} as const;

export default InsightsScreenGroup;
