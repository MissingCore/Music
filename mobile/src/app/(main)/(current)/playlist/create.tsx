import { ModifyPlaylist } from "@/screens/ModifyPlaylist";

/** Screen for creating a playlist. */
export default function CreatePlaylistScreen() {
  return (
    <ModifyPlaylist
      onSubmit={async () => console.log("Creating playlist...")}
    />
  );
}
