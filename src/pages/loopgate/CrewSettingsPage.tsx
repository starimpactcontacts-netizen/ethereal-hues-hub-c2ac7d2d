import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Shield, Crown, Users, Star, Zap, Award, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PageTransition from "@/components/loopgate/PageTransition";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

export default function CrewSettingsPage() {
  const { crewId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    emblem: "shield",
    min_league: "open" as "open" | "pro" | "elite",
    join_type: "open",
  });

  useEffect(() => {
    if (crewId && user) {
      fetchCrew();
    }
  }, [crewId, user]);

  const fetchCrew = async () => {
    if (!crewId) return;

    const { data: crew, error } = await supabase
      .from("crews")
      .select("*")
      .eq("id", crewId)
      .single();

    if (error || !crew) {
      console.error("Error fetching crew:", error);
      navigate("/crews");
      return;
    }

    // Verify user is the owner
    if (crew.owner_id !== user?.id) {
      navigate(`/crews/${crewId}`);
      return;
    }

    setFormData({
      name: crew.name,
      description: crew.description || "",
      emblem: crew.emblem,
      min_league: crew.min_league as "open" | "pro" | "elite",
      join_type: crew.join_type,
    });

    setLoading(false);
  };

  const handleSave = async () => {
    if (!crewId || !formData.name.trim()) return;

    setSaving(true);

    const { error } = await supabase
      .from("crews")
      .update({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        emblem: formData.emblem,
        min_league: formData.min_league,
        join_type: formData.join_type,
      })
      .eq("id", crewId);

    if (error) {
      console.error("Error updating crew:", error);
      if (error.code === "23505") {
        alert("A crew with this name already exists.");
      }
      setSaving(false);
      return;
    }

    navigate(`/crews/${crewId}`);
  };

  const handleDelete = async () => {
    if (!crewId) return;

    setDeleting(true);

    // Delete all members first (this will cascade via foreign key, but let's be explicit)
    await supabase.from("crew_members").delete().eq("crew_id", crewId);
    await supabase.from("crew_messages").delete().eq("crew_id", crewId);
    await supabase.from("crew_join_requests").delete().eq("crew_id", crewId);

    // Delete the crew
    const { error } = await supabase.from("crews").delete().eq("id", crewId);

    if (error) {
      console.error("Error deleting crew:", error);
      setDeleting(false);
      return;
    }

    navigate("/crews");
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="px-4 py-4 flex items-center gap-4">
            <button onClick={() => navigate(`/crews/${crewId}`)} className="text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">Crew Settings</h1>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Crew Name */}
          <div className="space-y-2">
            <Label>Crew Name</Label>
            <Input
              placeholder="Enter crew name..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={24}
              className="bg-muted/50"
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

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving || !formData.name.trim()}
            className="w-full bg-gold text-black hover:bg-gold/90"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-border">
            <h3 className="text-sm font-semibold text-red-500 mb-3">Danger Zone</h3>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={deleting}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleting ? "Deleting..." : "Delete Crew"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Crew?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the crew, all messages, and remove all members.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
