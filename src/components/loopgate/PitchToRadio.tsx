import { useState } from 'react';
import { Send, Music, Loader2, Check, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PitchToRadioProps {
  userId: string | null;
}

export default function PitchToRadio({ userId }: PitchToRadioProps) {
  const [songName, setSongName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [link, setLink] = useState('');
  const [genre, setGenre] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!userId) {
    return (
      <div className="p-6 text-center">
        <Music className="w-5 h-5 mx-auto mb-2 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">Sign in to pitch a track</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
          <Check className="w-5 h-5 text-emerald-500" />
        </div>
        <p className="text-sm font-display text-foreground">Pitch Submitted</p>
        <p className="text-[10px] text-muted-foreground mt-1">Our team will review your submission</p>
        <button
          onClick={() => { setSubmitted(false); setSongName(''); setArtistName(''); setLink(''); setGenre(''); setMessage(''); }}
          className="mt-3 text-[10px] text-emerald-500 hover:text-emerald-400 font-bold"
        >
          Submit another
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songName.trim() || !artistName.trim() || !link.trim()) {
      toast.error('Fill in song name, artist, and link');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('radio_pitches').insert({
      user_id: userId,
      song_name: songName.trim(),
      artist_name: artistName.trim(),
      link: link.trim(),
      genre: genre.trim() || null,
      message: message.trim() || null,
    } as any);
    if (error) {
      toast.error('Failed to submit pitch');
      console.error(error);
    } else {
      setSubmitted(true);
      toast.success('Track pitched to Loopgate Radio!');
    }
    setSubmitting(false);
  };

  const genres = ['Phonk', 'Trap', 'Drill', 'Lo-Fi', 'Electronic', 'Hip-Hop', 'R&B', 'Other'];

  return (
    <form onSubmit={handleSubmit} className="p-3 space-y-2.5">
      <div className="flex items-center gap-2 mb-1">
        <Send className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Pitch to Radio</span>
      </div>
      <p className="text-[9px] text-muted-foreground/60">
        Submit a track for our curators. If selected, it'll play on Loopgate Radio for all users.
      </p>

      <input
        value={songName}
        onChange={e => setSongName(e.target.value)}
        placeholder="Song name *"
        required
        className="w-full bg-surface-1 border border-border/30 rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-emerald-500/40"
      />

      <input
        value={artistName}
        onChange={e => setArtistName(e.target.value)}
        placeholder="Artist name *"
        required
        className="w-full bg-surface-1 border border-border/30 rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-emerald-500/40"
      />

      <input
        value={link}
        onChange={e => setLink(e.target.value)}
        placeholder="Link (SoundCloud, YouTube, Spotify, etc.) *"
        required
        type="url"
        className="w-full bg-surface-1 border border-border/30 rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-emerald-500/40"
      />

      {/* Genre chips */}
      <div>
        <p className="text-[9px] text-muted-foreground/60 mb-1.5">Genre</p>
        <div className="flex flex-wrap gap-1">
          {genres.map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setGenre(genre === g ? '' : g)}
              className={`px-2 py-1 rounded-full text-[9px] font-bold transition-colors ${
                genre === g
                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                  : 'bg-surface-1 text-muted-foreground border border-border/30 hover:text-foreground'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Why this track belongs on Loopgate Radio... (optional)"
        rows={2}
        maxLength={300}
        className="w-full bg-surface-1 border border-border/30 rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-emerald-500/40 resize-none"
      />

      <button
        type="submit"
        disabled={submitting || !songName.trim() || !artistName.trim() || !link.trim()}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            <Send className="w-3.5 h-3.5" />
            Submit Pitch
          </>
        )}
      </button>
    </form>
  );
}
