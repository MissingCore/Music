import { createQueryKeys } from "@lukemorales/query-key-factory";

import { getFolder } from "@/api/new/folder";

/** Query keys used in `useQuery` for folders. */
export const folderKeys = createQueryKeys("folders", {
  detail: (folderPath: string) => ({
    queryKey: [folderPath],
    queryFn: () => getFolder(folderPath),
  }),
});
