// import { useLocalSearchParams } from "expo-router";

import { useTrack } from "~/queries/track";

import { ModifyTrack as ModifyTrackBase } from "~/screens/ModifyTrack";
import { PagePlaceholder } from "~/components/Transition/Placeholder";

export default function ModifyTrack() {
  const id = "1112312";
  // const { id } = useLocalSearchParams<{ id: string }>();
  const { isPending, error, data } = useTrack(id);

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;
  return <ModifyTrackBase initialData={data} />;
}
