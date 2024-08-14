import { MediaModals } from "./categories/media";
import { QuickStartModal } from "./categories/onboarding";
import { SettingModals } from "./categories/settings";

/**
 * Displays modals in the root `_layout.tsx` so that they are on top of
 * all content.
 */
export function ModalPortal() {
  return (
    <>
      <QuickStartModal />
      <MediaModals />
      <SettingModals />
    </>
  );
}
