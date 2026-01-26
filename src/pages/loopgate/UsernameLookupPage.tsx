import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/loopgate/LoadingScreen";

export default function UsernameLookupPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    async function lookupUser() {
      if (!username) {
        navigate("/404", { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();

      if (profile) {
        navigate(`/editor/${profile.id}`, { replace: true });
      } else {
        navigate("/404", { replace: true });
      }
    }

    lookupUser();
  }, [username, navigate]);

  return <LoadingScreen />;
}
