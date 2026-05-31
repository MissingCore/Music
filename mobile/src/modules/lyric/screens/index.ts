import CreateLyricProvider from "./CreateProviderView";
import CreateLyric from "./CreateView";
import Lyric from "./CurrentView";
import ModifyLyricProvider from "./ModifyProviderView";
import ModifyLyric from "./ModifyView";
import LyricsProviders from "./ProviderView";
import Lyrics from "./View";

const LyricScreenGroup = {
  screenOptions: {
    animation: "fade",
  },
  screens: {
    Lyrics: {
      screen: Lyrics,
      options: { title: "feat.lyrics.title" },
    },
    CreateLyric: {
      screen: CreateLyric,
      options: { title: "form.create" },
    },
    ModifyLyric: {
      screen: ModifyLyric,
      options: { title: "form.edit" },
    },
    Lyric,

    LyricsProviders: {
      screen: LyricsProviders,
      option: { title: "feat.lyrics.extra.providers" },
    },
    CreateLyricProvider: {
      screen: CreateLyricProvider,
      options: { title: "form.create" },
    },
    ModifyLyricProvider: {
      screen: ModifyLyricProvider,
      options: { title: "form.edit" },
    },
  },
} as const;

export default LyricScreenGroup;
