import CreateLyric from "./CreateView";
import Lyric from "./CurrentView";
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
    LyricsProviders: {
      screen: LyricsProviders,
      option: { title: "feat.lyrics.extra.providers" },
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
  },
} as const;

export default LyricScreenGroup;
