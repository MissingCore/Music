import type { Href } from "expo-router";
import { Link } from "expo-router";

import { ModalButton } from "./ModalButton";

interface Props<T> extends React.ComponentProps<typeof ModalButton> {
  href: Href<T>;
}

/** @description A `<Link />` for a modal. */
export function ModalLink<T>({ href, ...rest }: Props<T>) {
  return (
    <Link href={href} asChild>
      <ModalButton {...rest} />
    </Link>
  );
}
