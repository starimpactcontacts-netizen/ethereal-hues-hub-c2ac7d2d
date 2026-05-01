import GuestConversionModal from "./GuestConversionModal";
import { useGuestConversion } from "@/hooks/useGuestConversion";

/**
 * Global mount point — listens to the zustand store and renders
 * the conversion modal anywhere in the app.
 */
export default function GlobalGuestConversionModal() {
  const { open, xpEarned, headline, close } = useGuestConversion();
  return (
    <GuestConversionModal
      open={open}
      onClose={close}
      xpEarned={xpEarned}
      headline={headline}
    />
  );
}