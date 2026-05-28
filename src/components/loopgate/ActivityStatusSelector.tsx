import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ActivityStatusSelectorProps {
  userId: string;
  username?: string;
  currentStatus: "online" | "offline" | "busy" | "dev";
  onStatusChange: () => void;
}

const statuses = [
  { value: "online",  label: "Online",   color: "bg-green-500" },
  { value: "offline", label: "Offline",  color: "bg-muted-foreground" },
  { value: "busy",    label: "Editing",  color: "bg-gold" },
] as const;

const DEV_STATUS = { value: "dev", label: "Dev", color: "bg-red-500" } as const;

export default function ActivityStatusSelector({
  userId,
  username,
  currentStatus,
  onStatusChange,
}: ActivityStatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const isAmid = username === "amid";
  const allStatuses = isAmid ? [...statuses, DEV_STATUS] : statuses;
  const currentConfig = allStatuses.find(s => s.value === currentStatus) || statuses[0];

  const handleSelect = async (newStatus: "online" | "offline" | "busy" | "dev") => {
    if (newStatus === currentStatus) { setIsOpen(false); return; }
    setUpdating(true);
    setIsOpen(false);
    const { error } = await supabase.from("profiles").update({ activity_status: newStatus }).eq("id", userId);
    if (error) toast.error("Failed to update status");
    else onStatusChange();
    setUpdating(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={updating}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-2 border border-border hover:border-gold transition-colors text-sm"
      >
        <span className={`w-2 h-2 rounded-full ${currentConfig.color} ${currentStatus === 'online' || currentStatus === 'dev' ? 'animate-pulse' : ''}`} />
        <span className="uppercase text-[10px] font-semibold tracking-wider">{currentConfig.label}</span>
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-surface-1 border border-border min-w-[140px]">
            {allStatuses.map((status) => (
              <button
                key={status.value}
                onClick={() => handleSelect(status.value as any)}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-surface-2 transition-colors text-left"
              >
                <span className={`w-2 h-2 rounded-full ${status.color}`} />
                <span className="text-xs uppercase tracking-wider flex-1">{status.label}</span>
                {currentStatus === status.value && <Check size={12} className="text-gold" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
