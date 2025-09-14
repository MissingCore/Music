import { useLocalSearchParams } from "expo-router";

import { useTrack } from "~/queries/track";

import { ModifyTrack } from "~/screens/ModifyTrack";
import { PagePlaceholder } from "~/components/Transition/Placeholder";

export default function ModifyTrackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isPending, error, data } = useTrack(id);

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;
  return <ModifyTrack initialData={data} />;
}
