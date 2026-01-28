/** Screens where the layout of the content can change. */
export type MutableLayout = "artist";

/** Fields that get rendered in our mutable layout. */
export type LayoutItem = {
  id: string;
  title: string;
  description: string;
  imageSource: string | null;
};
