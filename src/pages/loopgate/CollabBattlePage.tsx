import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function CollabBattlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("collab_battles")
        .select("slot_a_id, slot_b_id")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        navigate(`/collab/${data.slot_a_id}?vs=${data.slot_b_id}`, { replace: true });
      } else {
        navigate("/collabs", { replace: true });
      }
    })();
  }, [id, navigate]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-white/40 text-sm">Loading battle…</p>
    </div>
  );
}