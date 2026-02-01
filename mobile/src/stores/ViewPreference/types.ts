/** Screens where the layout of the content can be change. */
export type MutableViewLayout = "album" | "artist" | "playlist";

/** Fields that get rendered in our mutable layout. */
export type LayoutItem = {
  id: string;
  title: string;
  description: string;
  imageSource: string | null | Array<string | null>;
};

/** Screens where the order of the content can be change. */
export type MutableViewOrder = "album" | "artist" | "playlist";
