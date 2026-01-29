import { useState, useRef } from "react";
import { X, Globe, Calendar, Users, Trophy, Loader2, ImagePlus, Trash2, ExternalLink, ListChecks } from "lucide-react";
import { motion } from "framer-motion";
import { useHostedCompetitions } from "@/hooks/useHostedCompetitions";
import { useAuth } from "@/hooks/useAuth";
import { useCrewMembership } from "@/hooks/useCrewMembership";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProposeHostedCompModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ProposeHostedCompModal({ isOpen, onClose, onSuccess }: ProposeHostedCompModalProps) {
  const { user, profile } = useAuth();
  const { proposeCompetition } = useHostedCompetitions();
  const { primaryCrew } = useCrewMembership(user?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hostName, setHostName] = useState("");
  const [format, setFormat] = useState("battle_royale");
  const [maxSubmissions, setMaxSubmissions] = useState("");
  const [deadline, setDeadline] = useState("");
  const [prizeDescription, setPrizeDescription] = useState("");
  const [useCrewAsHost, setUseCrewAsHost] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [communityUrl, setCommunityUrl] = useState("");
  const [rules, setRules] = useState("");

  const handlePosterSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setPosterFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPosterPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePoster = () => {
    setPosterFile(null);
    setPosterPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadPoster = async (): Promise<string | null> => {
    if (!posterFile || !user) return null;

    setIsUploadingPoster(true);
    try {
      const fileExt = posterFile.name.split('.').pop();
      const fileName = `hosted-comp-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-posters')
        .upload(filePath, posterFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-posters')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading poster:', error);
      toast.error("Failed to upload poster");
      return null;
    } finally {
      setIsUploadingPoster(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !hostName.trim() || !deadline) {
      return;
    }

    setIsSubmitting(true);

    // Upload poster if selected
    let posterUrl: string | undefined;
    if (posterFile) {
      const uploadedUrl = await uploadPoster();
      if (uploadedUrl) {
        posterUrl = uploadedUrl;
      }
    }

    const result = await proposeCompetition({
      name: name.trim(),
      description: description.trim() || undefined,
      host_name: hostName.trim(),
      format,
      max_submissions: maxSubmissions ? parseInt(maxSubmissions) : undefined,
      submission_deadline: new Date(deadline).toISOString(),
      prize_description: prizeDescription.trim() || undefined,
      host_crew_id: useCrewAsHost && primaryCrew?.crew ? primaryCrew.crew.id : undefined,
      poster_url: posterUrl,
      community_url: communityUrl.trim() || undefined,
      rules: rules.trim() || undefined
    });

    setIsSubmitting(false);

    if (result) {
      onSuccess?.();
      onClose();
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 16);

  const crewData = primaryCrew?.crew;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-surface-1 border border-cyan-500/30 overflow-hidden max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-cyan-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-sky-500 flex items-center justify-center">
              <Globe className="w-5 h-5 text-background" />
            </div>
            <div>
              <h2 className="font-display text-lg text-foreground">Propose Competition</h2>
              <p className="text-xs text-muted-foreground">Host your own editing comp on Loopgate</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Competition Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Competition Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Edit Battle 2025"
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500"
              required
              maxLength={100}
            />
          </div>

          {/* Host Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Host Name *
            </label>
            <input
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="e.g. Your Discord Server or Creator Name"
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500"
              required
              maxLength={50}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Discord server name, creator name, or organization
            </p>
          </div>

          {/* Use Crew as Host */}
          {crewData && (
            <label className="flex items-center gap-3 p-3 bg-surface-2 border border-border rounded-lg cursor-pointer hover:border-cyan-500/50 transition-colors">
              <input
                type="checkbox"
                checked={useCrewAsHost}
                onChange={(e) => setUseCrewAsHost(e.target.checked)}
                className="w-4 h-4 accent-cyan-500"
              />
              <div className="flex items-center gap-2 flex-1">
                {crewData.avatar_url && (
                  <img src={crewData.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                )}
                <span className="text-sm">Host as {crewData.name}</span>
              </div>
            </label>
          )}

          {/* Poster Image */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              <ImagePlus className="w-3 h-3 inline mr-1" />
              Background Poster (Optional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePosterSelect}
              className="hidden"
            />
            {posterPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-cyan-500/30">
                <img 
                  src={posterPreview} 
                  alt="Poster preview" 
                  className="w-full h-32 object-cover"
                />
                <button
                  type="button"
                  onClick={removePoster}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full hover:bg-red-500/80 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-cyan-500/50 transition-colors bg-surface-2/50"
              >
                <ImagePlus className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Tap to add poster image</span>
              </button>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              Recommended: 16:9 aspect ratio, max 5MB
            </p>
          </div>

          {/* Community Link */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              <ExternalLink className="w-3 h-3 inline mr-1" />
              Community Link *
            </label>
            <input
              type="url"
              value={communityUrl}
              onChange={(e) => setCommunityUrl(e.target.value)}
              placeholder="https://discord.gg/yourserver or website URL"
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500"
              required
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Where participants can join your community/get updates
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this competition about? Theme, etc."
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 min-h-[80px] resize-none"
              maxLength={500}
            />
          </div>

          {/* Rules */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              <ListChecks className="w-3 h-3 inline mr-1" />
              Rules (Optional)
            </label>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="• No teams, solo entries only&#10;• No stealing edits&#10;• Must be 10+ seconds"
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 min-h-[100px] resize-none"
              maxLength={1000}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              List your competition rules (one per line recommended)
            </p>
          </div>

          {/* Format */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'battle_royale', label: 'Battle Royale', desc: 'Best edit wins' },
                { id: 'bracket', label: 'Bracket', desc: 'Elimination rounds' },
                { id: 'round_robin', label: 'Scored', desc: 'Points-based' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id)}
                  className={`p-3 text-center border rounded-lg transition-colors ${
                    format === f.id
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                      : 'bg-surface-2 border-border text-muted-foreground hover:border-cyan-500/50'
                  }`}
                >
                  <span className="block text-xs font-semibold">{f.label}</span>
                  <span className="block text-[9px] mt-0.5 opacity-70">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              <Calendar className="w-3 h-3 inline mr-1" />
              Submission Deadline *
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={minDateStr}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          {/* Max Submissions */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              <Users className="w-3 h-3 inline mr-1" />
              Max Submissions (Optional)
            </label>
            <input
              type="number"
              value={maxSubmissions}
              onChange={(e) => setMaxSubmissions(e.target.value)}
              placeholder="Leave empty for unlimited"
              min={2}
              max={1000}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Prize Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              <Trophy className="w-3 h-3 inline mr-1" />
              Prize Description (Optional)
            </label>
            <input
              type="text"
              value={prizeDescription}
              onChange={(e) => setPrizeDescription(e.target.value)}
              placeholder="e.g. $100 + Discord Nitro"
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500"
              maxLength={100}
            />
          </div>

          {/* Info Box */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
            <p className="text-[11px] text-cyan-300">
              <strong>How it works:</strong> Your proposal will be reviewed by our team. Once approved, 
              your competition goes live and editors can start submitting. You handle the judging - 
              we provide the infrastructure.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || isUploadingPoster || !name.trim() || !hostName.trim() || !deadline || !communityUrl.trim()}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-sky-500 text-background font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                Submit Proposal
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
