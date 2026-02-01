/** Screens where the layout of the content can be change. */
export type MutableLayout = "album" | "artist" | "playlist";

/** Fields that get rendered in our mutable layout. */
export type LayoutItem = {
  id: string;
  title: string;
  description: string;
  imageSource: string | null;
};

/** Screens where the order of the content can be change. */
export type MutableOrder = "album" | "artist" | "playlist";
