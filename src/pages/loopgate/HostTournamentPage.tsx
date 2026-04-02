import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Trophy, DollarSign, Users, Clock, Swords, Crown,
  ImagePlus, X, Zap, Shield, Star, ChevronRight, Loader2, Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProposeTournament } from "@/hooks/useSanctionedTournaments";
import { useHostedCompetitions } from "@/hooks/useHostedCompetitions";
import { useCrewMembership } from "@/hooks/useCrewMembership";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion } from "framer-motion";

const teko = { fontFamily: "Teko, sans-serif" };

interface CrewData {
  id: string;
  name: string;
  avatar_url: string | null;
  owner_id: string;
}

export default function HostTournamentPage() {
  const { crewId } = useParams<{ crewId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { proposeTournament, submitting: sanctionedSubmitting } = useProposeTournament();
  const { proposeCompetition } = useHostedCompetitions();

  const isMonetize = searchParams.get("monetize") === "true";
  const [mode, setMode] = useState<"sanctioned" | "monetized">(isMonetize ? "monetized" : "sanctioned");
  const [crew, setCrew] = useState<CrewData | null>(null);
  const [loading, setLoading] = useState(true);

  // Shared fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sanctioned fields
  const [theme, setTheme] = useState("");
  const [rules, setRules] = useState("");
  const [minPlayers, setMinPlayers] = useState("4");
  const [maxPlayers, setMaxPlayers] = useState("32");
  const [durationHours, setDurationHours] = useState("48");
  const [formatType, setFormatType] = useState("battle_royale");
  const [proposedStartDate, setProposedStartDate] = useState("");
  const [tournamentMode, setTournamentMode] = useState<"open" | "crew_vs_crew">("open");

  // Monetized fields
  const [hostName, setHostName] = useState("");
  const [format, setFormat] = useState("battle_royale");
  const [maxSubmissions, setMaxSubmissions] = useState("");
  const [deadline, setDeadline] = useState("");
  const [prizeDescription, setPrizeDescription] = useState("");
  const [communityUrl, setCommunityUrl] = useState("");

  // Fetch crew data
  useEffect(() => {
    if (!crewId) return;
    const fetchCrew = async () => {
      const { data, error } = await supabase
        .from("crews")
        .select("id, name, avatar_url, owner_id")
        .eq("id", crewId)
        .single();

      if (error || !data) {
        navigate("/units");
        return;
      }
      setCrew(data);
      setHostName(data.name);
      setLoading(false);
    };
    fetchCrew();
  }, [crewId, navigate]);

  // Auth check
  useEffect(() => {
    if (!loading && crew && user && crew.owner_id !== user.id) {
      toast.error("Only the unit owner can host tournaments");
      navigate(`/units/${crewId}`);
    }
  }, [loading, crew, user, crewId, navigate]);

  const handlePosterSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setPosterFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPosterPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadPoster = async (): Promise<string | null> => {
    if (!posterFile || !user) return null;
    const ext = posterFile.name.split(".").pop();
    const path = `${user.id}/tournament-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("event-posters").upload(path, posterFile, { upsert: true });
    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    const { data: { publicUrl } } = supabase.storage.from("event-posters").getPublicUrl(path);
    return publicUrl;
  };

  const handleSubmitSanctioned = async () => {
    if (!name.trim() || !crew || !crewId) return;
    setIsSubmitting(true);
    
    let posterUrl: string | undefined;
    if (posterFile) {
      const url = await uploadPoster();
      if (url) posterUrl = url;
    }

    const result = await proposeTournament(crewId, crew.name, crew.avatar_url, {
      name: name.trim(),
      description: description.trim() || undefined,
      theme: theme.trim() || undefined,
      rules: rules.trim() ? rules.split("\n").filter(Boolean) : undefined,
      min_players: parseInt(minPlayers) || 4,
      max_players: parseInt(maxPlayers) || 32,
      duration_hours: parseInt(durationHours) || 48,
      format_type: formatType,
      proposed_start_date: proposedStartDate || undefined,
      poster_url: posterUrl,
      tournament_mode: tournamentMode,
    });

    setIsSubmitting(false);
    if (result) {
      navigate(`/units/${crewId}`);
    }
  };

  const handleSubmitMonetized = async () => {
    if (!name.trim() || !hostName.trim() || !deadline || !crew || !crewId) return;
    setIsSubmitting(true);

    let posterUrl: string | undefined;
    if (posterFile) {
      const url = await uploadPoster();
      if (url) posterUrl = url;
    }

    const result = await proposeCompetition({
      name: name.trim(),
      description: description.trim() || undefined,
      host_name: hostName.trim(),
      format,
      max_submissions: maxSubmissions ? parseInt(maxSubmissions) : undefined,
      submission_deadline: new Date(deadline).toISOString(),
      prize_description: prizeDescription.trim() || undefined,
      host_crew_id: crewId,
      poster_url: posterUrl,
      community_url: communityUrl.trim() || undefined,
      rules: rules.trim() || undefined,
    });

    setIsSubmitting(false);
    if (result) {
      navigate(`/units/${crewId}`);
    }
  };

  if (loading || !crew) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 16);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: mode === "sanctioned"
              ? "linear-gradient(135deg, hsl(0 72% 20%), hsl(0 0% 5%))"
              : "linear-gradient(135deg, hsl(160 84% 15%), hsl(0 0% 5%))",
          }}
        />
        <div className="relative px-4 pt-4 pb-6" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>
          <button
            onClick={() => navigate(`/units/${crewId}`)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Back to {crew.name}</span>
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-card border border-border overflow-hidden">
              {crew.avatar_url ? (
                <img src={crew.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/30">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-wide" style={teko}>
                Host Tournament
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Submit for admin approval · {crew.name}
              </p>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode("sanctioned")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${
                mode === "sanctioned"
                  ? "bg-destructive text-destructive-foreground shadow-lg"
                  : "bg-card/50 text-muted-foreground border border-border"
              }`}
            >
              <Trophy className="w-4 h-4" />
              Free Tournament
            </button>
            <button
              onClick={() => setMode("monetized")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${
                mode === "monetized"
                  ? "bg-emerald-600 text-white shadow-lg"
                  : "bg-card/50 text-muted-foreground border border-border"
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Monetized
            </button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="px-4 mt-4">
        <div className={`rounded-lg p-3 border text-[11px] flex items-start gap-2 ${
          mode === "sanctioned"
            ? "bg-destructive/5 border-destructive/20 text-destructive"
            : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
        }`}>
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            {mode === "sanctioned" ? (
              <p>
                <strong>Free Sanctioned Tournament</strong> — No money involved. Build hype, 
                grow your unit, earn INDEX rewards. Admin reviews and sets prize pool.
              </p>
            ) : (
              <p>
                <strong>Monetized Competition</strong> — Earn revenue based on views generated 
                and competitors who participate. Like streaming — the more engagement, the more 
                you earn. Admin reviews and approves.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 mt-4 space-y-4">
        {/* Poster Upload */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
            Tournament Poster
          </label>
          {posterPreview ? (
            <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border">
              <img src={posterPreview} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => { setPosterFile(null); setPosterPreview(null); }}
                className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 rounded-lg border-2 border-dashed border-border hover:border-muted-foreground/30 transition-colors flex flex-col items-center justify-center gap-2"
            >
              <ImagePlus className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Upload poster (optional)</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePosterSelect} />
        </div>

        {/* Name */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
            Tournament Name *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cartel Clash Vol. 1"
            maxLength={80}
            className="text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
            Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this tournament about?"
            rows={3}
            maxLength={500}
            className="text-sm"
          />
        </div>

        {/* Mode-specific fields */}
        {mode === "sanctioned" ? (
          <SanctionedFields
            theme={theme} setTheme={setTheme}
            rules={rules} setRules={setRules}
            minPlayers={minPlayers} setMinPlayers={setMinPlayers}
            maxPlayers={maxPlayers} setMaxPlayers={setMaxPlayers}
            durationHours={durationHours} setDurationHours={setDurationHours}
            formatType={formatType} setFormatType={setFormatType}
            proposedStartDate={proposedStartDate} setProposedStartDate={setProposedStartDate}
            tournamentMode={tournamentMode} setTournamentMode={setTournamentMode}
            minDateStr={minDateStr}
          />
        ) : (
          <MonetizedFields
            hostName={hostName} setHostName={setHostName}
            format={format} setFormat={setFormat}
            maxSubmissions={maxSubmissions} setMaxSubmissions={setMaxSubmissions}
            deadline={deadline} setDeadline={setDeadline}
            prizeDescription={prizeDescription} setPrizeDescription={setPrizeDescription}
            communityUrl={communityUrl} setCommunityUrl={setCommunityUrl}
            rules={rules} setRules={setRules}
            minDateStr={minDateStr}
          />
        )}

        {/* Submit */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={mode === "sanctioned" ? handleSubmitSanctioned : handleSubmitMonetized}
          disabled={
            isSubmitting || sanctionedSubmitting || !name.trim() ||
            (mode === "monetized" && (!hostName.trim() || !deadline))
          }
          className={`w-full py-4 rounded-lg font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 disabled:opacity-50 transition-all ${
            mode === "sanctioned"
              ? "bg-destructive text-destructive-foreground"
              : "bg-emerald-600 text-white"
          }`}
          style={teko}
        >
          {isSubmitting || sanctionedSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {mode === "sanctioned" ? <Trophy className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
              Submit for Admin Review
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </motion.button>

        <p className="text-[10px] text-muted-foreground text-center pb-4">
          Your proposal will be reviewed by admins. You'll be notified when it's approved.
        </p>
      </div>
    </div>
  );
}

// ━━━ SANCTIONED FIELDS ━━━
function SanctionedFields({
  theme, setTheme, rules, setRules,
  minPlayers, setMinPlayers, maxPlayers, setMaxPlayers,
  durationHours, setDurationHours, formatType, setFormatType,
  proposedStartDate, setProposedStartDate,
  tournamentMode, setTournamentMode, minDateStr,
}: any) {
  return (
    <>
      {/* Theme */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
          Theme / Song
        </label>
        <Input
          value={theme}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTheme(e.target.value)}
          placeholder="e.g. Phonk edits only, or a specific song"
          className="text-sm"
        />
      </div>

      {/* Format & Mode */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
            Format
          </label>
          <Select value={formatType} onValueChange={setFormatType}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="battle_royale">Open Submit</SelectItem>
              <SelectItem value="single_elimination">Single Elimination</SelectItem>
              <SelectItem value="round_robin">Round Robin</SelectItem>
              <SelectItem value="swiss">Swiss</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
            Mode
          </label>
          <Select value={tournamentMode} onValueChange={setTournamentMode}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open (Anyone)</SelectItem>
              <SelectItem value="crew_vs_crew">Unit vs Unit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Player counts */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
            Min Players
          </label>
          <Input type="number" min="2" max="64" value={minPlayers} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinPlayers(e.target.value)} className="text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
            Max Players
          </label>
          <Input type="number" min="2" max="256" value={maxPlayers} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxPlayers(e.target.value)} className="text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
            Duration (hrs)
          </label>
          <Input type="number" min="1" max="168" value={durationHours} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDurationHours(e.target.value)} className="text-sm" />
        </div>
      </div>

      {/* Start Date */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
          Proposed Start Date
        </label>
        <Input type="datetime-local" min={minDateStr} value={proposedStartDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProposedStartDate(e.target.value)} className="text-sm" />
      </div>

      {/* Rules */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
          Rules (one per line)
        </label>
        <Textarea
          value={rules}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRules(e.target.value)}
          placeholder={"No stolen edits\nMust be original content\nMinimum 15 seconds"}
          rows={3}
          className="text-sm"
        />
      </div>
    </>
  );
}

// ━━━ MONETIZED FIELDS ━━━
function MonetizedFields({
  hostName, setHostName, format, setFormat,
  maxSubmissions, setMaxSubmissions, deadline, setDeadline,
  prizeDescription, setPrizeDescription, communityUrl, setCommunityUrl,
  rules, setRules, minDateStr,
}: any) {
  return (
    <>
      {/* Host Name */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
          Host Display Name *
        </label>
        <Input
          value={hostName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHostName(e.target.value)}
          placeholder="Your unit or brand name"
          className="text-sm"
        />
      </div>

      {/* Format & Max Submissions */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
            Format
          </label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="battle_royale">Battle Royale</SelectItem>
              <SelectItem value="ranked">Ranked</SelectItem>
              <SelectItem value="showcase">Showcase</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
            Max Entries
          </label>
          <Input
            type="number"
            min="2"
            value={maxSubmissions}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxSubmissions(e.target.value)}
            placeholder="Unlimited"
            className="text-sm"
          />
        </div>
      </div>

      {/* Deadline */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
          Submission Deadline *
        </label>
        <Input type="datetime-local" min={minDateStr} value={deadline} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeadline(e.target.value)} className="text-sm" />
      </div>

      {/* Revenue Info */}
      <div className="rounded-lg p-3 bg-emerald-500/5 border border-emerald-500/15">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">How You Earn</span>
        </div>
        <div className="space-y-1.5 text-[11px] text-muted-foreground">
          <p>• Revenue is calculated like streaming — based on <strong className="text-foreground">views</strong> and <strong className="text-foreground">participant count</strong></p>
          <p>• More competitors + more engagement = more earnings</p>
          <p>• Earnings are tracked in your Unit dashboard</p>
          <p>• Competitions are always <strong className="text-foreground">free to enter</strong> for participants</p>
        </div>
      </div>

      {/* Prize description */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
          Prize Description (optional)
        </label>
        <Input
          value={prizeDescription}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrizeDescription(e.target.value)}
          placeholder="e.g. Feature on our page, INDEX rewards"
          className="text-sm"
        />
      </div>

      {/* Community URL */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
          Community Link (Discord, etc)
        </label>
        <Input
          value={communityUrl}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommunityUrl(e.target.value)}
          placeholder="https://discord.gg/..."
          className="text-sm"
        />
      </div>

      {/* Rules */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
          Rules
        </label>
        <Textarea
          value={rules}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRules(e.target.value)}
          placeholder="Competition rules and guidelines..."
          rows={3}
          className="text-sm"
        />
      </div>
    </>
  );
}
