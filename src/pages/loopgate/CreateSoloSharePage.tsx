import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { SiTiktok, SiInstagram, SiYoutube } from '@icons-pack/react-simple-icons';
import { useAuth } from '@/hooks/useAuth';
import { createSoloShare } from '@/hooks/useSoloShares';
import { detectPlatform } from '@/lib/videoEmbed';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

type Platform = 'tiktok' | 'instagram' | 'youtube';

const PLATFORMS: { id: Platform; label: string; icon: React.ReactNode }[] = [
  { id: 'tiktok', label: 'TikTok', icon: <SiTiktok size={16} /> },
  { id: 'instagram', label: 'Instagram', icon: <SiInstagram size={16} /> },
  { id: 'youtube', label: 'YouTube', icon: <SiYoutube size={16} /> },
];

export default function CreateSoloSharePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [platform, setPlatform] = useState<Platform>('tiktok');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !profile) { toast.error('Sign in first.'); navigate('/start'); return; }
    if (!url.trim()) { toast.error('Paste your video URL.'); return; }
    try { new URL(url.trim()); } catch { toast.error('That URL looks invalid.'); return; }

    setLoading(true);
    const detected = detectPlatform(url.trim());
    const share = await createSoloShare({
      user_id: user.id,
      username: profile.username || 'editor',
      avatar_url: profile.avatar_url || null,
      video_url: url.trim(),
      platform: detected !== 'other' ? detected : platform,
      title: title.trim() || null,
      caption: caption.trim() || null,
    });
    setLoading(false);
    if (!share) { toast.error('Could not create your Solo page. Try again.'); return; }
    toast.success('Your Solo page is live.');
    navigate(`/s/${share.slug}`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SEO title="Create Solo Page" noindex />
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-display text-lg tracking-tight">SOLO</span>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-5">
        <div>
          <h1 className="font-display text-3xl leading-tight">DROP YOUR EDIT.</h1>
          <p className="text-sm text-white/60 mt-1">
            Get a shareable Loopgate page. Anyone can rate. You earn Rings on every rating — up to 100 per page.
          </p>
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-2 block">Platform</label>
          <div className="flex gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  platform === p.id
                    ? 'bg-white text-black border-white'
                    : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                }`}
              >
                {p.icon}
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-2 block">Video URL</label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://tiktok.com/@you/video/..."
            className="bg-white/5 border-white/10"
          />
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-2 block">Title <span className="text-white/30">(optional)</span></label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 80))}
            placeholder="My latest anime edit"
            className="bg-white/5 border-white/10"
          />
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-2 block">Caption <span className="text-white/30">(optional)</span></label>
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 280))}
            placeholder="What should raters look out for?"
            rows={3}
            className="bg-white/5 border-white/10 resize-none"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading || !url.trim()}
          className="w-full bg-white text-black hover:bg-white/90 font-bold h-12"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <><Send className="w-4 h-4 mr-1.5" /> Create Solo Page</>
          )}
        </Button>
      </main>
    </div>
  );
}