import { ListLayout } from "~/navigation/layouts/ListLayout";

import { EQGraph } from "~/modules/equalizer/components/EQGraph";

export default function EqualizerSettings() {
  return (
    <ListLayout>
      <EQGraph />
    </ListLayout>
  );
}
