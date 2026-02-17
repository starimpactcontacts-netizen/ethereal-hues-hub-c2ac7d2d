import { useState } from "react";
import { Music, Plus, Pencil, Trash2, Eye, Play, Square, Trophy, Star, Users, Zap, ChevronDown, ChevronUp, ExternalLink, Loader2 } from "lucide-react";
// Audio files are uploaded directly — no client-side trimming needed
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useAdminFeatured } from "@/hooks/useFeaturedDrops";
import type { FeaturedArtist, FeaturedDrop, FeaturedSubmission } from "@/hooks/useFeaturedDrops";

export default function FeaturedArtistAdmin() {
  const { user } = useAuth();
  const { artists, drops, submissions, loading, refresh } = useAdminFeatured();

  // Create artist state
  const [showCreateArtist, setShowCreateArtist] = useState(false);
  const [newArtist, setNewArtist] = useState({ name: '', slug: '', bio: '', genre: 'phonk', avatar_url: '', banner_url: '' });
  const [creatingArtist, setCreatingArtist] = useState(false);

  // Edit artist state
  const [editingArtist, setEditingArtist] = useState<FeaturedArtist | null>(null);
  const [editArtistForm, setEditArtistForm] = useState({ name: '', slug: '', bio: '', genre: '', avatar_url: '', banner_url: '' });
  const [savingArtist, setSavingArtist] = useState(false);

  // Create drop state
  const [showCreateDrop, setShowCreateDrop] = useState(false);
  const [newDrop, setNewDrop] = useState({ artist_id: '', title: '', song_name: '', song_url: '', song_preview_url: '', poster_url: '', description: '', xp_reward: 30, index_reward: 15, mystery_reward_label: '' });
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [creatingDrop, setCreatingDrop] = useState(false);

  // Edit drop state
  const [editingDrop, setEditingDrop] = useState<FeaturedDrop | null>(null);
  const [editDropForm, setEditDropForm] = useState({ title: '', song_name: '', song_url: '', song_preview_url: '', poster_url: '', description: '', xp_reward: 30, index_reward: 15, mystery_reward_label: '', artist_id: '' });
  const [savingDrop, setSavingDrop] = useState(false);
  const [uploadingEditPreview, setUploadingEditPreview] = useState(false);

  // Scoring state
  const [scoringSub, setScoringSub] = useState<FeaturedSubmission | null>(null);
  const [scores, setScores] = useState({ quality: 70, originality: 70, impact: 70 });
  const [feedback, setFeedback] = useState('');
  const [scoring, setScoring] = useState(false);

  // Expanded drop
  const [expandedDropId, setExpandedDropId] = useState<string | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'artist' | 'drop'; id: string } | null>(null);

  const handleCreateArtist = async () => {
    if (!newArtist.name || !newArtist.slug) return;
    setCreatingArtist(true);
    const slug = newArtist.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const { error } = await supabase.from('featured_artists').insert({
      ...newArtist,
      slug,
      created_by: user?.id,
    });
    if (error) toast.error(error.message);
    else { toast.success('Artist created!'); setShowCreateArtist(false); setNewArtist({ name: '', slug: '', bio: '', genre: 'phonk', avatar_url: '', banner_url: '' }); refresh(); }
    setCreatingArtist(false);
  };

  const openEditArtist = (artist: FeaturedArtist) => {
    setEditingArtist(artist);
    setEditArtistForm({
      name: artist.name,
      slug: artist.slug,
      bio: artist.bio || '',
      genre: artist.genre,
      avatar_url: artist.avatar_url || '',
      banner_url: artist.banner_url || '',
    });
  };

  const handleSaveArtist = async () => {
    if (!editingArtist || !editArtistForm.name || !editArtistForm.slug) return;
    setSavingArtist(true);
    const { error } = await supabase.from('featured_artists').update({
      name: editArtistForm.name,
      slug: editArtistForm.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      bio: editArtistForm.bio || null,
      genre: editArtistForm.genre,
      avatar_url: editArtistForm.avatar_url || null,
      banner_url: editArtistForm.banner_url || null,
    }).eq('id', editingArtist.id);
    if (error) toast.error(error.message);
    else { toast.success('Artist updated!'); setEditingArtist(null); refresh(); }
    setSavingArtist(false);
  };

  const handleCreateDrop = async () => {
    if (!newDrop.artist_id || !newDrop.title || !newDrop.song_name) return;
    setCreatingDrop(true);
    const { error } = await supabase.from('featured_drops').insert({
      ...newDrop,
      status: 'draft',
    });
    if (error) toast.error(error.message);
    else { toast.success('Drop created! Set it live when ready.'); setShowCreateDrop(false); setNewDrop({ artist_id: '', title: '', song_name: '', song_url: '', song_preview_url: '', poster_url: '', description: '', xp_reward: 30, index_reward: 15, mystery_reward_label: '' }); refresh(); }
    setCreatingDrop(false);
  };

  const openEditDrop = (drop: FeaturedDrop) => {
    setEditingDrop(drop);
    setEditDropForm({
      title: drop.title,
      song_name: drop.song_name,
      song_url: drop.song_url || '',
      song_preview_url: drop.song_preview_url || '',
      poster_url: drop.poster_url || '',
      description: drop.description || '',
      xp_reward: drop.xp_reward,
      index_reward: drop.index_reward,
      mystery_reward_label: drop.mystery_reward_label || '',
      artist_id: drop.artist_id,
    });
  };

  const handleSaveDrop = async () => {
    if (!editingDrop) return;
    setSavingDrop(true);
    const { error } = await supabase.from('featured_drops').update({
      title: editDropForm.title,
      song_name: editDropForm.song_name,
      song_url: editDropForm.song_url || null,
      song_preview_url: editDropForm.song_preview_url || null,
      poster_url: editDropForm.poster_url || null,
      description: editDropForm.description || null,
      xp_reward: editDropForm.xp_reward,
      index_reward: editDropForm.index_reward,
      mystery_reward_label: editDropForm.mystery_reward_label || '',
      artist_id: editDropForm.artist_id,
    }).eq('id', editingDrop.id);
    if (error) toast.error(error.message);
    else { toast.success('Drop updated!'); setEditingDrop(null); refresh(); }
    setSavingDrop(false);
  };

  const uploadAudioFile = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file (mp3, m4a, wav, etc.)');
      return null;
    }
    try {
      toast.info('Uploading audio…');
      const ext = file.name.split('.').pop() || 'mp3';
      const contentType = file.type || 'audio/mpeg';
      const fileName = `${Date.now()}-preview.${ext}`;
      const { data, error } = await supabase.storage.from('song-previews').upload(fileName, file, { contentType, upsert: true });
      if (error) { 
        console.error('Storage upload error:', error);
        toast.error('Upload failed: ' + error.message); 
        return null; 
      }
      const { data: urlData } = supabase.storage.from('song-previews').getPublicUrl(data.path);
      toast.success('Audio preview uploaded!');
      return urlData.publicUrl;
    } catch (err: any) {
      console.error('Audio upload failed:', err);
      toast.error('Audio upload failed: ' + (err.message || 'Unknown error'));
      return null;
    }
  };

  const handleUploadPreviewForEdit = async (file: File) => {
    setUploadingEditPreview(true);
    const url = await uploadAudioFile(file);
    if (url) setEditDropForm(prev => ({ ...prev, song_preview_url: url }));
    setUploadingEditPreview(false);
  };

  const handleToggleDropStatus = async (drop: FeaturedDrop) => {
    const next = drop.status === 'draft' ? 'live' : drop.status === 'live' ? 'judging' : drop.status === 'judging' ? 'closed' : 'draft';
    const updates: any = { status: next };
    if (next === 'live') updates.starts_at = new Date().toISOString();
    if (next === 'closed') updates.ends_at = new Date().toISOString();

    const { error } = await supabase.from('featured_drops').update(updates).eq('id', drop.id);
    if (error) toast.error(error.message);
    else { toast.success(`Drop → ${next.toUpperCase()}`); refresh(); }
  };

  const handleScoreSubmission = async () => {
    if (!scoringSub || !user) return;
    setScoring(true);
    const qoi = Math.round((scores.quality + scores.originality + scores.impact) / 3);
    const isGood = qoi >= 50;

    const { error } = await supabase.from('featured_submissions').update({
      quality_score: scores.quality,
      originality_score: scores.originality,
      impact_score: scores.impact,
      qoi_score: qoi,
      feedback,
      status: 'scored',
      judge_id: user.id,
      judge_username: 'Admin',
      judged_at: new Date().toISOString(),
      xp_awarded: isGood ? (drops.find(d => d.id === scoringSub.drop_id)?.xp_reward || 30) : 5,
      index_awarded: isGood ? (drops.find(d => d.id === scoringSub.drop_id)?.index_reward || 15) : 0,
    }).eq('id', scoringSub.id);

    if (!error) {
      if (isGood) {
        const drop = drops.find(d => d.id === scoringSub.drop_id);
        await supabase.rpc('award_xp', {
          p_user_id: scoringSub.user_id,
          p_amount: drop?.xp_reward || 30,
          p_action: 'featured_drop',
          p_description: `Featured drop submission scored ${qoi} QOI`,
        });
        if ((drop?.index_reward || 0) > 0) {
          const { data: profile } = await supabase.from('profiles').select('spendable_index, global_index_score').eq('id', scoringSub.user_id).single();
          if (profile) {
            await supabase.from('profiles').update({
              spendable_index: (profile.spendable_index || 0) + (drop?.index_reward || 0),
              global_index_score: (profile.global_index_score || 0) + (drop?.index_reward || 0),
            }).eq('id', scoringSub.user_id);
          }
        }
      } else {
        await supabase.rpc('award_xp', {
          p_user_id: scoringSub.user_id,
          p_amount: 5,
          p_action: 'featured_drop',
          p_description: `Featured drop submission scored ${qoi} QOI (feedback given)`,
        });
      }

      toast.success(`Scored ${qoi} QOI — ${isGood ? '✅ Good' : '💀 Feedback sent'}`);
      setScoringSub(null);
      setScores({ quality: 70, originality: 70, impact: 70 });
      setFeedback('');
      refresh();
    } else {
      toast.error(error.message);
    }
    setScoring(false);
  };

  const handleRandomPick = async (dropId: string) => {
    const scored = submissions.filter(s => s.drop_id === dropId && s.status === 'scored');
    if (scored.length === 0) { toast.error('No scored submissions'); return; }
    const pick = scored[Math.floor(Math.random() * scored.length)];
    const { error } = await supabase.from('featured_drops').update({
      random_pick_id: pick.user_id,
      random_pick_username: pick.username,
    }).eq('id', dropId);
    if (error) toast.error(error.message);
    else { toast.success(`🎲 Random pick: @${pick.username}`); refresh(); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const table = deleteTarget.type === 'artist' ? 'featured_artists' : 'featured_drops';
    const { error } = await supabase.from(table).delete().eq('id', deleteTarget.id);
    if (error) toast.error(error.message);
    else { toast.success('Deleted'); refresh(); }
    setDeleteTarget(null);
  };

  if (loading) return <div className="text-xs text-muted-foreground">Loading featured data...</div>;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Music size={14} className="text-purple-400" />
          Featured Artists & Drops
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setShowCreateArtist(true)} className="flex items-center gap-1 text-[10px] bg-purple-500/20 border border-purple-500/50 text-purple-300 px-3 py-1.5 rounded-lg font-bold">
            <Plus size={12} /> Artist
          </button>
          <button onClick={() => setShowCreateDrop(true)} className="flex items-center gap-1 text-[10px] bg-pink-500/20 border border-pink-500/50 text-pink-300 px-3 py-1.5 rounded-lg font-bold">
            <Plus size={12} /> Drop
          </button>
        </div>
      </div>

      {/* Artists List */}
      {artists.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <Music className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No featured artists yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {artists.map(artist => (
            <div key={artist.id} className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 text-sm font-bold">
                    {artist.avatar_url ? <img src={artist.avatar_url} className="w-8 h-8 rounded-full object-cover" /> : artist.name[0]}
                  </div>
                  <div>
                    <span className="text-sm font-bold">{artist.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">/{artist.slug}</span>
                  </div>
                  <Badge className="text-[8px] bg-purple-500/10 text-purple-300">{artist.genre}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditArtist(artist)} className="p-1.5 text-purple-400 hover:bg-purple-500/10 rounded" title="Edit artist">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteTarget({ type: 'artist', id: artist.id })} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drops List */}
      <div className="space-y-3 mt-4">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Active Drops</h3>
        {drops.length === 0 ? (
          <p className="text-xs text-muted-foreground">No drops created yet</p>
        ) : (
          drops.map(drop => {
            const dropSubs = submissions.filter(s => s.drop_id === drop.id);
            const pendingSubs = dropSubs.filter(s => s.status === 'pending');
            const scoredSubs = dropSubs.filter(s => s.status === 'scored');
            const isExpanded = expandedDropId === drop.id;

            return (
              <div key={drop.id} className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{drop.title}</span>
                      <Badge className={`text-[8px] ${
                        drop.status === 'live' ? 'bg-emerald-500 text-white' :
                        drop.status === 'judging' ? 'bg-amber-500 text-white' :
                        drop.status === 'closed' ? 'bg-muted-foreground text-white' :
                        'bg-surface-2 text-muted-foreground'
                      }`}>{drop.status.toUpperCase()}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {(drop as any).artist?.name || 'Unknown'} • {drop.song_name} • {dropSubs.length} entries ({pendingSubs.length} pending)
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleToggleDropStatus(drop)}
                      className={`p-1.5 rounded ${drop.status === 'live' ? 'bg-emerald-600' : drop.status === 'judging' ? 'bg-amber-500' : 'bg-muted'}`} title="Toggle status">
                      {drop.status === 'live' ? <Square size={14} /> : <Play size={14} />}
                    </button>
                    <button onClick={() => openEditDrop(drop)}
                      className="p-1.5 rounded text-purple-400 hover:bg-purple-500/10" title="Edit drop">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleRandomPick(drop.id)}
                      className="p-1.5 rounded bg-pink-500/20 text-pink-300" title="Random artist pick">
                      <Star size={14} />
                    </button>
                    <button onClick={() => setExpandedDropId(isExpanded ? null : drop.id)}
                      className="p-1.5 rounded bg-surface-2">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button onClick={() => setDeleteTarget({ type: 'drop', id: drop.id })} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded: show submissions for scoring */}
                {isExpanded && (
                  <div className="border-t border-border p-3 space-y-2">
                    {dropSubs.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No submissions yet</p>
                    ) : (
                      dropSubs.map(sub => (
                        <div key={sub.id} className={`flex items-center justify-between p-2 rounded-lg border ${
                          sub.status === 'scored' ? 'bg-surface-1 border-border' : 'bg-gold/5 border-gold/30'
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold truncate">@{sub.username}</span>
                            <a href={sub.submission_url} target="_blank" rel="noopener noreferrer" className="text-purple-400">
                              <ExternalLink size={12} />
                            </a>
                            <span className="text-[9px] text-muted-foreground">{sub.platform}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {sub.status === 'scored' ? (
                              <span className={`text-sm font-bold tabular-nums ${
                                (sub.qoi_score || 0) >= 70 ? 'text-gold' : (sub.qoi_score || 0) >= 40 ? 'text-foreground' : 'text-red-400'
                              }`}>{Math.round(sub.qoi_score || 0)} QOI</span>
                            ) : (
                              <button onClick={() => { setScoringSub(sub); setScores({ quality: 70, originality: 70, impact: 70 }); setFeedback(''); }}
                                className="text-[10px] bg-gold text-black px-3 py-1 rounded font-bold">
                                Score
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Artist Dialog */}
      <Dialog open={showCreateArtist} onOpenChange={setShowCreateArtist}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Music size={18} className="text-purple-400" /> New Featured Artist</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs">Name *</Label>
              <Input value={newArtist.name} onChange={e => setNewArtist({...newArtist, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')})} placeholder="Artist name" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Slug *</Label>
              <Input value={newArtist.slug} onChange={e => setNewArtist({...newArtist, slug: e.target.value})} placeholder="artist-slug" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Genre</Label>
              <Input value={newArtist.genre} onChange={e => setNewArtist({...newArtist, genre: e.target.value})} placeholder="phonk" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Bio</Label>
              <Textarea value={newArtist.bio} onChange={e => setNewArtist({...newArtist, bio: e.target.value})} placeholder="About the artist..." className="mt-1" rows={3} />
            </div>
            <div>
              <Label className="text-xs">Avatar URL</Label>
              <Input value={newArtist.avatar_url} onChange={e => setNewArtist({...newArtist, avatar_url: e.target.value})} placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Banner URL</Label>
              <Input value={newArtist.banner_url} onChange={e => setNewArtist({...newArtist, banner_url: e.target.value})} placeholder="https://..." className="mt-1" />
            </div>
            <button onClick={handleCreateArtist} disabled={creatingArtist || !newArtist.name || !newArtist.slug}
              className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {creatingArtist ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Plus size={16} /> Create Artist</>}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Artist Dialog */}
      <Dialog open={!!editingArtist} onOpenChange={(open) => !open && setEditingArtist(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil size={18} className="text-purple-400" /> Edit Artist</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs">Name *</Label>
              <Input value={editArtistForm.name} onChange={e => setEditArtistForm({...editArtistForm, name: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Slug *</Label>
              <Input value={editArtistForm.slug} onChange={e => setEditArtistForm({...editArtistForm, slug: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Genre</Label>
              <Input value={editArtistForm.genre} onChange={e => setEditArtistForm({...editArtistForm, genre: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Bio</Label>
              <Textarea value={editArtistForm.bio} onChange={e => setEditArtistForm({...editArtistForm, bio: e.target.value})} className="mt-1" rows={3} />
            </div>
            <div>
              <Label className="text-xs">Avatar URL</Label>
              <Input value={editArtistForm.avatar_url} onChange={e => setEditArtistForm({...editArtistForm, avatar_url: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Banner URL</Label>
              <Input value={editArtistForm.banner_url} onChange={e => setEditArtistForm({...editArtistForm, banner_url: e.target.value})} className="mt-1" />
            </div>
            <button onClick={handleSaveArtist} disabled={savingArtist || !editArtistForm.name || !editArtistForm.slug}
              className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {savingArtist ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Drop Dialog */}
      <Dialog open={showCreateDrop} onOpenChange={setShowCreateDrop}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Zap size={18} className="text-pink-400" /> New Featured Drop</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs">Artist *</Label>
              <select value={newDrop.artist_id} onChange={e => setNewDrop({...newDrop, artist_id: e.target.value})}
                className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Select artist...</option>
                {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Drop Title *</Label>
              <Input value={newDrop.title} onChange={e => setNewDrop({...newDrop, title: e.target.value})} placeholder="e.g. Drift Edit Challenge" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Song Name *</Label>
              <Input value={newDrop.song_name} onChange={e => setNewDrop({...newDrop, song_name: e.target.value})} placeholder="Song title" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Song URL</Label>
              <Input value={newDrop.song_url} onChange={e => setNewDrop({...newDrop, song_url: e.target.value})} placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1.5">🔊 Song Preview (30s clip)</Label>
              {newDrop.song_preview_url ? (
                <div className="mt-1 flex items-center gap-2">
                  <audio src={newDrop.song_preview_url} controls className="h-8 flex-1" />
                  <button onClick={() => setNewDrop({...newDrop, song_preview_url: ''})} className="text-[10px] text-red-400 hover:underline">Remove</button>
                </div>
              ) : (
                <div className="mt-1">
                  <input
                    type="file"
                    accept="audio/*"
                    disabled={uploadingPreview}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingPreview(true);
                      const url = await uploadAudioFile(file);
                      if (url) setNewDrop(prev => ({...prev, song_preview_url: url}));
                      setUploadingPreview(false);
                    }}
                    className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-purple-500/20 file:text-purple-300"
                  />
                  {uploadingPreview && <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Trimming & uploading…</p>}
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs">Poster URL</Label>
              <Input value={newDrop.poster_url} onChange={e => setNewDrop({...newDrop, poster_url: e.target.value})} placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={newDrop.description} onChange={e => setNewDrop({...newDrop, description: e.target.value})} placeholder="What editors should create..." className="mt-1" rows={2} />
            </div>
            <div>
              <Label className="text-xs">Mystery Reward Label</Label>
              <Input value={newDrop.mystery_reward_label} onChange={e => setNewDrop({...newDrop, mystery_reward_label: e.target.value})} placeholder="e.g. Artist Shoutout" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">XP Reward</Label>
                <Input type="number" value={newDrop.xp_reward} onChange={e => setNewDrop({...newDrop, xp_reward: Number(e.target.value)})} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Index Reward</Label>
                <Input type="number" value={newDrop.index_reward} onChange={e => setNewDrop({...newDrop, index_reward: Number(e.target.value)})} className="mt-1" />
              </div>
            </div>
            <button onClick={handleCreateDrop} disabled={creatingDrop || !newDrop.artist_id || !newDrop.title || !newDrop.song_name}
              className="w-full py-3 bg-pink-600 text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {creatingDrop ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Plus size={16} /> Create Drop</>}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Drop Dialog */}
      <Dialog open={!!editingDrop} onOpenChange={(open) => !open && setEditingDrop(null)}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil size={18} className="text-pink-400" /> Edit Drop</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs">Artist</Label>
              <select value={editDropForm.artist_id} onChange={e => setEditDropForm({...editDropForm, artist_id: e.target.value})}
                className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm">
                {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Drop Title *</Label>
              <Input value={editDropForm.title} onChange={e => setEditDropForm({...editDropForm, title: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Song Name *</Label>
              <Input value={editDropForm.song_name} onChange={e => setEditDropForm({...editDropForm, song_name: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Song URL</Label>
              <Input value={editDropForm.song_url} onChange={e => setEditDropForm({...editDropForm, song_url: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1.5">🔊 Song Preview (30s clip)</Label>
              {editDropForm.song_preview_url ? (
                <div className="mt-1 flex items-center gap-2">
                  <audio src={editDropForm.song_preview_url} controls className="h-8 flex-1" />
                  <button onClick={() => setEditDropForm({...editDropForm, song_preview_url: ''})} className="text-[10px] text-red-400 hover:underline">Remove</button>
                </div>
              ) : (
                <div className="mt-1">
                  <input
                    type="file"
                    accept="audio/*"
                    disabled={uploadingEditPreview}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadPreviewForEdit(file);
                    }}
                    className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-purple-500/20 file:text-purple-300"
                  />
                  {uploadingEditPreview && <p className="text-[10px] text-muted-foreground mt-1">Uploading...</p>}
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs">Poster URL</Label>
              <Input value={editDropForm.poster_url} onChange={e => setEditDropForm({...editDropForm, poster_url: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={editDropForm.description} onChange={e => setEditDropForm({...editDropForm, description: e.target.value})} className="mt-1" rows={2} />
            </div>
            <div>
              <Label className="text-xs">Mystery Reward Label</Label>
              <Input value={editDropForm.mystery_reward_label} onChange={e => setEditDropForm({...editDropForm, mystery_reward_label: e.target.value})} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">XP Reward</Label>
                <Input type="number" value={editDropForm.xp_reward} onChange={e => setEditDropForm({...editDropForm, xp_reward: Number(e.target.value)})} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Index Reward</Label>
                <Input type="number" value={editDropForm.index_reward} onChange={e => setEditDropForm({...editDropForm, index_reward: Number(e.target.value)})} className="mt-1" />
              </div>
            </div>
            <button onClick={handleSaveDrop} disabled={savingDrop || !editDropForm.title || !editDropForm.song_name}
              className="w-full py-3 bg-pink-600 text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {savingDrop ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scoring Dialog */}
      <Dialog open={!!scoringSub} onOpenChange={(open) => !open && setScoringSub(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trophy size={18} className="text-gold" /> Score Submission</DialogTitle>
          </DialogHeader>
          {scoringSub && (
            <div className="space-y-4 pt-2">
              <div className="bg-surface-1 border border-border rounded-lg p-3">
                <p className="text-xs font-bold">@{scoringSub.username}</p>
                <a href={scoringSub.submission_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-purple-400 flex items-center gap-1">
                  <ExternalLink size={10} /> View submission
                </a>
              </div>

              {[
                { key: 'quality', label: 'Quality', color: 'text-blue-400' },
                { key: 'originality', label: 'Originality', color: 'text-purple-400' },
                { key: 'impact', label: 'Impact', color: 'text-pink-400' },
              ].map(({ key, label, color }) => (
                <div key={key}>
                  <div className="flex items-center justify-between">
                    <Label className={`text-xs ${color}`}>{label}</Label>
                    <span className="text-sm font-bold tabular-nums">{scores[key as keyof typeof scores]}</span>
                  </div>
                  <input type="range" min="0" max="100" value={scores[key as keyof typeof scores]}
                    onChange={e => setScores({...scores, [key]: Number(e.target.value)})}
                    className="w-full mt-1 accent-purple-500" />
                </div>
              ))}

              <div className="bg-surface-1 border border-border rounded-lg p-3 text-center">
                <span className="text-2xl font-bold text-gold tabular-nums">
                  {Math.round((scores.quality + scores.originality + scores.impact) / 3)}
                </span>
                <span className="text-xs text-muted-foreground ml-2">QOI</span>
              </div>

              <div>
                <Label className="text-xs">Feedback {Math.round((scores.quality + scores.originality + scores.impact) / 3) < 50 ? '(Required for low scores)' : '(Optional)'}</Label>
                <Textarea value={feedback} onChange={e => setFeedback(e.target.value)}
                  placeholder="What could be improved..." className="mt-1" rows={3} />
              </div>

              <button onClick={handleScoreSubmission} disabled={scoring}
                className="w-full py-3 bg-gold text-black font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {scoring ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : 'Submit Score'}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type}?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this {deleteTarget?.type} and all associated data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
