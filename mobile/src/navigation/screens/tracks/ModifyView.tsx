import type { StaticScreenProps } from "@react-navigation/native";

import { useTrack } from "~/queries/track";
import { ModifyTrackBase } from "./ModifyViewBase";

import { PagePlaceholder } from "../../components/Placeholder";

type Props = StaticScreenProps<{ id: string }>;

export default function ModifyTrack({
  route: {
    params: { id },
  },
}: Props) {
  const { isPending, error, data } = useTrack(id);

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;
  return <ModifyTrackBase initialData={data} />;
}
