import { MediaModals } from "./categories/media";
import { QuickStartModal } from "./categories/onboarding";

/**
 * Displays modals in the root `_layout.tsx` so that they are on top of
 * all content.
 */
export function ModalPortal() {
  return (
    <>
      <QuickStartModal />
      <MediaModals />
    </>
  );
}
