import { useState, useRef } from "react";
import { X, Globe, Calendar, Users, Trophy, Loader2, ImagePlus, Trash2, ExternalLink, ListChecks, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

interface PosterImage {
  file: File;
  preview: string;
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
  const [posterImages, setPosterImages] = useState<PosterImage[]>([]);
  const [currentPosterIndex, setCurrentPosterIndex] = useState(0);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [communityUrl, setCommunityUrl] = useState("");
  const [rules, setRules] = useState("");

  const handlePosterSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: PosterImage[] = [];
    
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select image files only");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Each image must be under 5MB");
        return;
      }

      if (posterImages.length + newImages.length >= 5) {
        toast.error("Maximum 5 images allowed");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterImages(prev => [...prev, { file, preview: reader.result as string }]);
      };
      reader.readAsDataURL(file);
      newImages.push({ file, preview: '' });
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePoster = (index: number) => {
    setPosterImages(prev => prev.filter((_, i) => i !== index));
    if (currentPosterIndex >= posterImages.length - 1) {
      setCurrentPosterIndex(Math.max(0, posterImages.length - 2));
    }
  };

  const uploadPosters = async (): Promise<string[]> => {
    if (posterImages.length === 0 || !user) return [];

    setIsUploadingPoster(true);
    const uploadedUrls: string[] = [];

    try {
      for (const poster of posterImages) {
        const fileExt = poster.file.name.split('.').pop();
        const fileName = `hosted-comp-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-posters')
          .upload(filePath, poster.file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-posters')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }
      return uploadedUrls;
    } catch (error: any) {
      console.error('Error uploading posters:', error);
      toast.error("Failed to upload images");
      return [];
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

    // Upload posters if selected
    let posterUrls: string[] = [];
    if (posterImages.length > 0) {
      posterUrls = await uploadPosters();
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
      poster_url: posterUrls[0], // Keep backward compat with first image
      poster_urls: posterUrls.length > 0 ? posterUrls : undefined,
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

          {/* Poster Images Carousel */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              <ImagePlus className="w-3 h-3 inline mr-1" />
              Background Images (Optional, up to 5)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePosterSelect}
              className="hidden"
            />
            
            {posterImages.length > 0 ? (
              <div className="space-y-2">
                {/* Carousel Container */}
                <div className="relative rounded-lg overflow-hidden border border-cyan-500/30">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentPosterIndex}
                      src={posterImages[currentPosterIndex]?.preview}
                      alt={`Poster ${currentPosterIndex + 1}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-32 object-cover"
                    />
                  </AnimatePresence>
                  
                  {/* Navigation Arrows */}
                  {posterImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setCurrentPosterIndex(prev => (prev - 1 + posterImages.length) % posterImages.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/70 rounded-full hover:bg-cyan-500/80 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentPosterIndex(prev => (prev + 1) % posterImages.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/70 rounded-full hover:bg-cyan-500/80 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  
                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => removePoster(currentPosterIndex)}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full hover:bg-red-500/80 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/70 rounded-full text-[10px] text-white">
                    {currentPosterIndex + 1} / {posterImages.length}
                  </div>
                </div>
                
                {/* Thumbnail Strip + Add More */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {posterImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentPosterIndex(idx)}
                      className={`shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-colors ${
                        idx === currentPosterIndex ? 'border-cyan-500' : 'border-transparent hover:border-cyan-500/50'
                      }`}
                    >
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {posterImages.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="shrink-0 w-12 h-12 rounded border-2 border-dashed border-border flex items-center justify-center hover:border-cyan-500/50 transition-colors bg-surface-2/50"
                    >
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-cyan-500/50 transition-colors bg-surface-2/50"
              >
                <ImagePlus className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Tap to add background images</span>
              </button>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              Recommended: 16:9 aspect ratio, max 5MB each. Multiple images will display as carousel.
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
                { id: 'battle_royale', label: 'Battle Royale', desc: 'Best edit wins', comingSoon: false },
                { id: 'bracket', label: 'Bracket', desc: 'Elimination rounds', comingSoon: true },
                { id: 'round_robin', label: 'Scored', desc: 'Points-based', comingSoon: true }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => !f.comingSoon && setFormat(f.id)}
                  disabled={f.comingSoon}
                  className={`p-3 text-center border rounded-lg transition-colors relative ${
                    f.comingSoon
                      ? 'bg-surface-2/50 border-border/50 text-muted-foreground/50 cursor-not-allowed'
                      : format === f.id
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                        : 'bg-surface-2 border-border text-muted-foreground hover:border-cyan-500/50'
                  }`}
                >
                  {f.comingSoon && (
                    <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-amber-500/80 text-[7px] font-bold uppercase tracking-wide text-background rounded">
                      Soon
                    </span>
                  )}
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
              Prize Breakdown (Optional)
            </label>
            <textarea
              value={prizeDescription}
              onChange={(e) => setPrizeDescription(e.target.value)}
              placeholder={"BEST EDIT — $500\n🥇 1st: $300\n🥈 2nd: $125\n🥉 3rd: $75\n\nMOST VIEWS — $300\n🥇 1st: $175\n🥈 2nd: $85\n🥉 3rd: $40"}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 min-h-[120px] resize-none"
              maxLength={2000}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Supports multiple prize categories - format as you'd like it displayed
            </p>
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
