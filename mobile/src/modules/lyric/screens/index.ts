import CreateLyric from "./CreateView";
import Lyric from "./CurrentView";
import ModifyLyric from "./ModifyView";
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
  },
} as const;

export default LyricScreenGroup;
