import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Crown, Users, Star, Zap, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PageTransition from "@/components/loopgate/PageTransition";

const emblems = [
  { id: "shield", icon: Shield, label: "Shield" },
  { id: "crown", icon: Crown, label: "Crown" },
  { id: "users", icon: Users, label: "Team" },
  { id: "star", icon: Star, label: "Star" },
  { id: "zap", icon: Zap, label: "Lightning" },
  { id: "award", icon: Award, label: "Award" },
];

const leagues = [
  { id: "open", label: "Open", description: "Anyone can join" },
  { id: "pro", label: "Pro", description: "Pro League and above" },
  { id: "elite", label: "Elite", description: "Elite League only" },
];

const joinTypes = [
  { id: "open", label: "Open", description: "Anyone can join instantly" },
  { id: "invite_only", label: "Invite Only", description: "Requires approval" },
];

export default function CreateCrewPage() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ownedCrewsCount, setOwnedCrewsCount] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    emblem: "shield",
    min_league: "open" as "open" | "pro" | "elite",
    join_type: "open",
  });

  // Only admins can create crews
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/crews');
    }
  }, [authLoading, isAdmin, navigate]);

  // Check how many crews user already owns
  useEffect(() => {
    const checkOwnedCrews = async () => {
      if (!user) return;
      const { count, error } = await supabase
        .from("crews")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id);
      
      if (!error) {
        setOwnedCrewsCount(count || 0);
      }
    };
    checkOwnedCrews();
  }, [user]);

  const handleCreate = async () => {
    if (!user || !formData.name.trim() || (ownedCrewsCount !== null && ownedCrewsCount >= 2)) return;

    setLoading(true);

    // Create the crew
    const { data: crew, error: crewError } = await supabase
      .from("crews")
      .insert({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        emblem: formData.emblem,
        min_league: formData.min_league,
        join_type: formData.join_type,
        owner_id: user.id,
        member_count: 0, // Will be incremented by trigger
      })
      .select()
      .single();

    if (crewError) {
      console.error("Error creating crew:", crewError);
      if (crewError.code === "23505") {
        alert("A crew with this name already exists.");
      }
      setLoading(false);
      return;
    }

    // Add creator as owner
    const { error: memberError } = await supabase.from("crew_members").insert({
      crew_id: crew.id,
      user_id: user.id,
      role: "owner",
    });

    if (memberError) {
      console.error("Error adding owner:", memberError);
      setLoading(false);
      return;
    }

    navigate(`/crews/${crew.id}`);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="px-4 py-4 flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">Create Crew</h1>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Max crews limit warning */}
          {ownedCrewsCount !== null && ownedCrewsCount >= 2 && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive">
                You already own 2 crews (maximum limit). Delete one to create a new crew.
              </p>
            </div>
          )}

          {/* Crew Name */}
          <div className="space-y-2">
            <Label>Crew Name</Label>
            <Input
              placeholder="Enter crew name..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={24}
              className="bg-muted/50"
              disabled={ownedCrewsCount !== null && ownedCrewsCount >= 2}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Tell others about your crew..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={200}
              className="bg-muted/50 resize-none"
              rows={3}
            />
          </div>

          {/* Emblem */}
          <div className="space-y-3">
            <Label>Emblem</Label>
            <div className="grid grid-cols-6 gap-2">
              {emblems.map((emblem) => (
                <button
                  key={emblem.id}
                  onClick={() => setFormData({ ...formData, emblem: emblem.id })}
                  className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                    formData.emblem === emblem.id
                      ? "bg-gold/20 border-2 border-gold text-gold"
                      : "bg-muted/50 border border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <emblem.icon className="w-6 h-6" />
                </button>
              ))}
            </div>
          </div>

          {/* Minimum League */}
          <div className="space-y-3">
            <Label>Minimum League Requirement</Label>
            <div className="space-y-2">
              {leagues.map((league) => (
                <button
                  key={league.id}
                  onClick={() =>
                    setFormData({ ...formData, min_league: league.id as "open" | "pro" | "elite" })
                  }
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    formData.min_league === league.id
                      ? "bg-gold/10 border border-gold"
                      : "bg-muted/50 border border-border hover:bg-muted"
                  }`}
                >
                  <p className="font-semibold text-sm">{league.label}</p>
                  <p className="text-xs text-muted-foreground">{league.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Join Type */}
          <div className="space-y-3">
            <Label>Join Type</Label>
            <div className="space-y-2">
              {joinTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFormData({ ...formData, join_type: type.id })}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    formData.join_type === type.id
                      ? "bg-gold/10 border border-gold"
                      : "bg-muted/50 border border-border hover:bg-muted"
                  }`}
                >
                  <p className="font-semibold text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Create Button */}
          <Button
            onClick={handleCreate}
            disabled={loading || !formData.name.trim() || (ownedCrewsCount !== null && ownedCrewsCount >= 2)}
            className="w-full bg-gold text-black hover:bg-gold/90"
          >
            {loading ? "Creating..." : "Create Crew"}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
