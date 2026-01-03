import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Upload, Save, Lock, Unlock, Download, Eye, ChevronDown, ChevronUp, Clock, AlertTriangle, Check, Users, Calendar, Trophy, Image as ImageIcon, X, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface RealEvent {
  id: string;
  title: string;
  subtitle: string | null;
  status: string;
  start_date: string;
  end_date: string;
  prize_pool: string | null;
  poster_url: string | null;
  league: string;
  ip: string | null;
  location: string | null;
  rules: string[] | null;
  category: string | null;
  region_tags: string[] | null;
  description: string | null;
}

interface RealSubmission {
  id: string;
  user_id: string;
  event_id: string;
  submission_url: string;
  platform: string;
  status: string;
  quality_score: number | null;
  originality_score: number | null;
  impact_score: number | null;
  qoi_score: number | null;
  final_rank: number | null;
  submitted_at: string;
  judged_at: string | null;
  judge_id: string | null;
  username?: string;
}

const CATEGORIES = ["Film", "Trailer", "Music", "Regional", "Global"];
const REGIONS = ["North America", "Europe", "Asia", "Latin America", "Africa", "Oceania", "Middle East"];

function getEventStatusTag(event: RealEvent): { label: string; color: string } {
  const now = new Date();
  const start = new Date(event.start_date);
  const end = new Date(event.end_date);
  const hoursLeft = (end.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (event.status === 'finalized') return { label: 'FINALIZED', color: 'bg-purple-500' };
  if (event.status === 'judging') return { label: 'JUDGING', color: 'bg-orange-500' };
  if (event.status === 'closed' || now > end) return { label: 'CLOSED', color: 'bg-muted-foreground' };
  if (event.status === 'live' && hoursLeft <= 12 && hoursLeft > 0) return { label: 'ENDING SOON', color: 'bg-destructive' };
  if (event.status === 'live' || (now >= start && now <= end)) return { label: 'LIVE', color: 'bg-green-500' };
  if (event.status === 'pending') return { label: 'PENDING', color: 'bg-gold' };
  
  return { label: event.status.toUpperCase(), color: 'bg-muted-foreground' };
}

export default function OpsPanel() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [events, setEvents] = useState<RealEvent[]>([]);
  const [submissions, setSubmissions] = useState<RealSubmission[]>([]);
  const [activeEventFilter, setActiveEventFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Event creation state
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: 'Film',
    region_tags: [] as string[],
    start_date: '',
    end_date: '',
    prize_pool: '',
    league: 'open',
  });
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  
  // Edit event state
  const [editingEvent, setEditingEvent] = useState<RealEvent | null>(null);
  const [editEvent, setEditEvent] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: 'Film',
    region_tags: [] as string[],
    start_date: '',
    end_date: '',
    prize_pool: '',
    league: 'open',
  });
  const [editPosterFile, setEditPosterFile] = useState<File | null>(null);
  const [editPosterPreview, setEditPosterPreview] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  
  // Delete confirmation state
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Scoring state
  const [scoringSubmission, setScoringSubmission] = useState<string | null>(null);
  const [scores, setScores] = useState({ quality: 80, originality: 80, impact: 80 });
  const [saving, setSaving] = useState(false);

  // Admin check disabled during development - will re-enable for production
  // useEffect(() => {
  //   if (!isAdmin && !loading) {
  //     toast.error("Access denied");
  //     navigate('/hub');
  //   }
  // }, [isAdmin, loading, navigate]);

  // Fetch events and submissions
  useEffect(() => {
    fetchData();
    
    // Set up realtime subscriptions for instant updates
    const eventsChannel = supabase
      .channel('admin-events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchData();
      })
      .subscribe();
      
    const submissionsChannel = supabase
      .channel('admin-submissions-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_participations' }, (payload) => {
        console.log('[OPS] New submission received:', payload);
        toast.info('New submission received!');
        fetchData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'event_participations' }, () => {
        fetchData();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(submissionsChannel);
    };
  }, []);

  async function fetchData() {
    try {
      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (eventsError) throw eventsError;
      setEvents(eventsData || []);
      
      if (eventsData && eventsData.length > 0 && !activeEventFilter) {
        setActiveEventFilter(eventsData[0].id);
      }
      
      // Fetch submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('event_participations')
        .select('*')
        .order('submitted_at', { ascending: false });
      
      if (submissionsError) throw submissionsError;
      
      // Fetch usernames for submissions
      const userIds = [...new Set((submissionsData || []).map(s => s.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);
      
      const usernameMap = new Map((profilesData || []).map(p => [p.id, p.username]));
      
      const formattedSubmissions = (submissionsData || []).map(s => ({
        ...s,
        username: usernameMap.get(s.user_id) || 'Unknown'
      }));
      
      setSubmissions(formattedSubmissions);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEvent() {
    if (!newEvent.title || !newEvent.start_date || !newEvent.end_date) {
      toast.error('Please fill in required fields');
      return;
    }
    
    setCreating(true);
    
    try {
      let posterUrl = null;
      
      // Upload poster if provided
      if (posterFile) {
        const fileExt = posterFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('event-posters')
          .upload(fileName, posterFile);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('event-posters')
          .getPublicUrl(fileName);
        
        posterUrl = urlData.publicUrl;
      }
      
      // Create event
      const { error } = await supabase.from('events').insert({
        title: newEvent.title,
        subtitle: newEvent.subtitle || null,
        description: newEvent.description || null,
        category: newEvent.category,
        region_tags: newEvent.region_tags,
        start_date: new Date(newEvent.start_date).toISOString(),
        end_date: new Date(newEvent.end_date).toISOString(),
        prize_pool: newEvent.prize_pool || null,
        league: newEvent.league,
        poster_url: posterUrl,
        status: 'pending',
      });
      
      if (error) throw error;
      
      toast.success('Event created successfully');
      setShowCreateEvent(false);
      setNewEvent({
        title: '',
        subtitle: '',
        description: '',
        category: 'Film',
        region_tags: [],
        start_date: '',
        end_date: '',
        prize_pool: '',
        league: 'open',
      });
      setPosterFile(null);
      setPosterPreview(null);
      fetchData();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleEventStatus(eventId: string, currentStatus: string) {
    const statusOrder = ['pending', 'live', 'judging', 'finalized', 'closed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: nextStatus })
        .eq('id', eventId);
      
      if (error) throw error;
      toast.success(`Event status changed to ${nextStatus}`);
      fetchData();
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  }

  function openEditEvent(event: RealEvent) {
    setEditingEvent(event);
    setEditEvent({
      title: event.title,
      subtitle: event.subtitle || '',
      description: event.description || '',
      category: event.category || 'Film',
      region_tags: event.region_tags || [],
      start_date: event.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : '',
      end_date: event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : '',
      prize_pool: event.prize_pool || '',
      league: event.league,
    });
    setEditPosterPreview(event.poster_url || null);
    setEditPosterFile(null);
  }

  async function handleUpdateEvent() {
    if (!editingEvent || !editEvent.title || !editEvent.start_date || !editEvent.end_date) {
      toast.error('Please fill in required fields');
      return;
    }
    
    setUpdating(true);
    
    try {
      let posterUrl = editingEvent.poster_url;
      
      // Upload new poster if provided
      if (editPosterFile) {
        const fileExt = editPosterFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('event-posters')
          .upload(fileName, editPosterFile);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('event-posters')
          .getPublicUrl(fileName);
        
        posterUrl = urlData.publicUrl;
      }
      
      // Update event
      const { error } = await supabase.from('events').update({
        title: editEvent.title,
        subtitle: editEvent.subtitle || null,
        description: editEvent.description || null,
        category: editEvent.category,
        region_tags: editEvent.region_tags,
        start_date: new Date(editEvent.start_date).toISOString(),
        end_date: new Date(editEvent.end_date).toISOString(),
        prize_pool: editEvent.prize_pool || null,
        league: editEvent.league,
        poster_url: posterUrl,
      }).eq('id', editingEvent.id);
      
      if (error) throw error;
      
      toast.success('Event updated successfully');
      setEditingEvent(null);
      setEditPosterFile(null);
      setEditPosterPreview(null);
      fetchData();
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteEvent() {
    if (!deleteEventId) return;
    
    setDeleting(true);
    
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', deleteEventId);
      
      if (error) throw error;
      
      toast.success('Event deleted');
      setDeleteEventId(null);
      if (activeEventFilter === deleteEventId) {
        setActiveEventFilter(null);
      }
      fetchData();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setDeleting(false);
    }
  }

  function handleEditPosterChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setEditPosterFile(file);
      const reader = new FileReader();
      reader.onload = () => setEditPosterPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function toggleEditRegionTag(region: string) {
    setEditEvent(prev => ({
      ...prev,
      region_tags: prev.region_tags.includes(region)
        ? prev.region_tags.filter(r => r !== region)
        : [...prev.region_tags, region]
    }));
  }

  async function handleScoreSubmission(submissionId: string) {
    setSaving(true);
    
    const qoiTotal = scores.quality + scores.originality + scores.impact;
    
    try {
      const { error } = await supabase
        .from('event_participations')
        .update({
          quality_score: scores.quality,
          originality_score: scores.originality,
          impact_score: scores.impact,
          qoi_score: qoiTotal,
          status: 'scored',
          judged_at: new Date().toISOString(),
          judge_id: user?.id,
        })
        .eq('id', submissionId);
      
      if (error) throw error;
      
      toast.success('Score saved');
      setScoringSubmission(null);
      setScores({ quality: 80, originality: 80, impact: 80 });
      fetchData();
    } catch (error) {
      console.error('Error scoring submission:', error);
      toast.error('Failed to save score');
    } finally {
      setSaving(false);
    }
  }

  function handlePosterChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      const reader = new FileReader();
      reader.onload = () => setPosterPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function toggleRegionTag(region: string) {
    setNewEvent(prev => ({
      ...prev,
      region_tags: prev.region_tags.includes(region)
        ? prev.region_tags.filter(r => r !== region)
        : [...prev.region_tags, region]
    }));
  }

  const filteredSubmissions = activeEventFilter 
    ? submissions.filter(s => s.event_id === activeEventFilter)
    : submissions;
  
  const unratedSubmissions = filteredSubmissions.filter(s => s.status !== 'scored');
  const ratedSubmissions = filteredSubmissions.filter(s => s.status === 'scored');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link to="/hub" className="p-1 -ml-1">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-base font-bold">OPERATOR PANEL</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Admin Access • Restricted
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Event Control */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Events Overview
            </h2>
            <span className="text-xs text-muted-foreground">{events.length} total</span>
          </div>
          
          {events.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <Calendar className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No events yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => {
                const statusTag = getEventStatusTag(event);
                const isRegional = event.region_tags && event.region_tags.length > 0;
                
                return (
                  <div
                    key={event.id}
                    className={`bg-card border rounded-lg p-4 ${
                      activeEventFilter === event.id ? "border-gold" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">{event.title}</h3>
                          <Badge className={`${statusTag.color} text-white text-[10px]`}>
                            {statusTag.label}
                          </Badge>
                          {isRegional && (
                            <Badge variant="outline" className="text-[10px]">REGIONAL</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{event.category || 'Film'}</span>
                          <span>•</span>
                          <span>{event.league.toUpperCase()} League</span>
                          {event.prize_pool && (
                            <>
                              <span>•</span>
                              <span className="text-gold">{event.prize_pool}</span>
                            </>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditEvent(event)}
                          className="p-2 rounded-lg transition-colors bg-surface-1 hover:bg-surface-2"
                          title="Edit event"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteEventId(event.id)}
                          className="p-2 rounded-lg transition-colors bg-surface-1 hover:bg-destructive/20 text-destructive"
                          title="Delete event"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={() => setActiveEventFilter(event.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            activeEventFilter === event.id ? "bg-gold text-black" : "bg-surface-1 hover:bg-surface-2"
                          }`}
                          title="View submissions"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleEventStatus(event.id, event.status)}
                          className={`p-2 rounded-lg transition-colors ${
                            event.status === 'live' ? "bg-green-600" :
                            event.status === 'judging' ? "bg-orange-500" :
                            event.status === 'finalized' ? "bg-purple-500" :
                            "bg-muted hover:bg-muted/80"
                          }`}
                          title="Toggle status"
                        >
                          {event.status === 'live' ? <Unlock size={16} /> : <Lock size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Create Event Button */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Create New Event
          </h2>
          <button 
            onClick={() => setShowCreateEvent(true)}
            className="w-full bg-card border border-dashed border-border rounded-lg p-6 text-center hover:border-gold/50 transition-colors"
          >
            <Plus size={24} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">New Event</p>
          </button>
        </section>

        {/* Submissions & Judging */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Submissions {activeEventFilter && `• ${events.find(e => e.id === activeEventFilter)?.title || ''}`}
            </h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-gold">{unratedSubmissions.length} unrated</span>
              <span className="text-green-500">{ratedSubmissions.length} rated</span>
            </div>
          </div>

          <Tabs defaultValue="unrated" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="unrated" className="flex-1">
                Unrated ({unratedSubmissions.length})
              </TabsTrigger>
              <TabsTrigger value="rated" className="flex-1">
                Rated ({ratedSubmissions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unrated">
              {unratedSubmissions.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-6 text-center">
                  <Check className="w-8 h-8 mx-auto text-green-500 mb-2" />
                  <p className="text-sm text-muted-foreground">All submissions rated!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unratedSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="bg-card border border-border rounded-lg overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{submission.username}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                {submission.platform}
                              </span>
                              <a 
                                href={submission.submission_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gold text-xs hover:underline"
                              >
                                View Edit →
                              </a>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(submission.submitted_at).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => setScoringSubmission(
                              scoringSubmission === submission.id ? null : submission.id
                            )}
                            className="px-3 py-2 bg-gold text-black rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            Rate
                            {scoringSubmission === submission.id ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Scoring Panel */}
                      {scoringSubmission === submission.id && (
                        <div className="border-t border-border p-4 bg-surface-1 space-y-4">
                          <p className="text-xs text-muted-foreground uppercase tracking-widest">
                            QOI Scoring
                          </p>
                          
                          {/* Quality */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium">Quality (Q)</label>
                              <span className="text-gold font-bold">{scores.quality}</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={scores.quality}
                              onChange={(e) => setScores({ ...scores, quality: Number(e.target.value) })}
                              className="w-full accent-gold"
                            />
                          </div>

                          {/* Originality */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium">Originality (O)</label>
                              <span className="text-gold font-bold">{scores.originality}</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={scores.originality}
                              onChange={(e) => setScores({ ...scores, originality: Number(e.target.value) })}
                              className="w-full accent-gold"
                            />
                          </div>

                          {/* Impact */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium">Impact (I)</label>
                              <span className="text-gold font-bold">{scores.impact}</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={scores.impact}
                              onChange={(e) => setScores({ ...scores, impact: Number(e.target.value) })}
                              className="w-full accent-gold"
                            />
                          </div>

                          {/* QOI Total */}
                          <div className="flex items-center justify-between py-3 border-t border-border">
                            <span className="text-sm text-muted-foreground">QOI Total (max 300)</span>
                            <span className="text-2xl font-black text-gold">
                              {scores.quality + scores.originality + scores.impact}
                            </span>
                          </div>

                          <button
                            onClick={() => handleScoreSubmission(submission.id)}
                            disabled={saving}
                            className="w-full py-3 bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <Save size={16} />
                            {saving ? 'Saving...' : 'Submit Score'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="rated">
              {ratedSubmissions.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-6 text-center">
                  <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No rated submissions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ratedSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="bg-card border border-green-500/30 rounded-lg overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{submission.username}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                {submission.platform}
                              </span>
                              <a 
                                href={submission.submission_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gold text-xs hover:underline"
                              >
                                View Edit →
                              </a>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gold">
                              {submission.qoi_score}
                            </p>
                            <p className="text-[10px] text-green-500 uppercase">Scored</p>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-border px-4 py-3 bg-surface-1 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4">
                          <span>Q: <span className="text-foreground font-semibold">{submission.quality_score}</span></span>
                          <span>O: <span className="text-foreground font-semibold">{submission.originality_score}</span></span>
                          <span>I: <span className="text-foreground font-semibold">{submission.impact_score}</span></span>
                        </div>
                        <span className="text-muted-foreground">
                          {submission.judged_at ? new Date(submission.judged_at).toLocaleDateString() : '-'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* Export */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Export
          </h2>
          <button 
            onClick={() => {
              const csv = ratedSubmissions.map(s => 
                `${s.username},${s.qoi_score},${s.quality_score},${s.originality_score},${s.impact_score}`
              ).join('\n');
              const blob = new Blob([`Username,QOI Total,Quality,Originality,Impact\n${csv}`], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `winners-${Date.now()}.csv`;
              a.click();
              toast.success('CSV exported');
            }}
            className="w-full bg-gold text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Export Winners List
          </button>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            CSV export for payout processing
          </p>
        </section>
      </div>

      {/* Create Event Dialog */}
      <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* Poster Upload */}
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Event Poster
              </Label>
              <div className="mt-2">
                {posterPreview ? (
                  <div className="relative">
                    <img 
                      src={posterPreview} 
                      alt="Preview" 
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => { setPosterFile(null); setPosterPreview(null); }}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-gold/50 transition-colors">
                    <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePosterChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="VELOCITY CUP #1"
                className="mt-1"
              />
            </div>

            {/* Subtitle */}
            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={newEvent.subtitle}
                onChange={(e) => setNewEvent({ ...newEvent, subtitle: e.target.value })}
                placeholder="The Ultimate Edit Battle"
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Event description..."
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Category */}
            <div>
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNewEvent({ ...newEvent, category: cat })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      newEvent.category === cat 
                        ? 'bg-gold text-black' 
                        : 'bg-surface-1 text-muted-foreground hover:bg-surface-2'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Region Tags */}
            <div>
              <Label>Region Tags (optional)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {REGIONS.map(region => (
                  <button
                    key={region}
                    onClick={() => toggleRegionTag(region)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      newEvent.region_tags.includes(region)
                        ? 'bg-gold text-black' 
                        : 'bg-surface-1 text-muted-foreground hover:bg-surface-2'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            {/* League */}
            <div>
              <Label>League</Label>
              <div className="flex gap-2 mt-2">
                {['open', 'pro', 'elite'].map(league => (
                  <button
                    key={league}
                    onClick={() => setNewEvent({ ...newEvent, league })}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium uppercase transition-colors ${
                      newEvent.league === league 
                        ? 'bg-gold text-black' 
                        : 'bg-surface-1 text-muted-foreground hover:bg-surface-2'
                    }`}
                  >
                    {league}
                  </button>
                ))}
              </div>
            </div>

            {/* Date/Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="start">Start Date/Time *</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={newEvent.start_date}
                  onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end">End Date/Time *</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={newEvent.end_date}
                  onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Prize Pool */}
            <div>
              <Label htmlFor="prize">Prize Pool</Label>
              <Input
                id="prize"
                value={newEvent.prize_pool}
                onChange={(e) => setNewEvent({ ...newEvent, prize_pool: e.target.value })}
                placeholder="$500"
                className="mt-1"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleCreateEvent}
              disabled={creating || !newEvent.title || !newEvent.start_date || !newEvent.end_date}
              className="w-full py-3 bg-gold text-black font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Create Event
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* Poster Upload */}
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Event Poster
              </Label>
              <div className="mt-2">
                {editPosterPreview ? (
                  <div className="relative">
                    <img 
                      src={editPosterPreview} 
                      alt="Preview" 
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => { setEditPosterFile(null); setEditPosterPreview(null); }}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-gold/50 transition-colors">
                    <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditPosterChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="edit-title">Event Title *</Label>
              <Input
                id="edit-title"
                value={editEvent.title}
                onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })}
                placeholder="VELOCITY CUP #1"
                className="mt-1"
              />
            </div>

            {/* Subtitle */}
            <div>
              <Label htmlFor="edit-subtitle">Subtitle</Label>
              <Input
                id="edit-subtitle"
                value={editEvent.subtitle}
                onChange={(e) => setEditEvent({ ...editEvent, subtitle: e.target.value })}
                placeholder="The Ultimate Edit Battle"
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editEvent.description}
                onChange={(e) => setEditEvent({ ...editEvent, description: e.target.value })}
                placeholder="Event description..."
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Category */}
            <div>
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setEditEvent({ ...editEvent, category: cat })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      editEvent.category === cat 
                        ? 'bg-gold text-black' 
                        : 'bg-surface-1 text-muted-foreground hover:bg-surface-2'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Region Tags */}
            <div>
              <Label>Region Tags (optional)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {REGIONS.map(region => (
                  <button
                    key={region}
                    onClick={() => toggleEditRegionTag(region)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      editEvent.region_tags.includes(region)
                        ? 'bg-gold text-black' 
                        : 'bg-surface-1 text-muted-foreground hover:bg-surface-2'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            {/* League */}
            <div>
              <Label>League</Label>
              <div className="flex gap-2 mt-2">
                {['open', 'pro', 'elite'].map(league => (
                  <button
                    key={league}
                    onClick={() => setEditEvent({ ...editEvent, league })}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium uppercase transition-colors ${
                      editEvent.league === league 
                        ? 'bg-gold text-black' 
                        : 'bg-surface-1 text-muted-foreground hover:bg-surface-2'
                    }`}
                  >
                    {league}
                  </button>
                ))}
              </div>
            </div>

            {/* Date/Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-start">Start Date/Time *</Label>
                <Input
                  id="edit-start"
                  type="datetime-local"
                  value={editEvent.start_date}
                  onChange={(e) => setEditEvent({ ...editEvent, start_date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-end">End Date/Time *</Label>
                <Input
                  id="edit-end"
                  type="datetime-local"
                  value={editEvent.end_date}
                  onChange={(e) => setEditEvent({ ...editEvent, end_date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Prize Pool */}
            <div>
              <Label htmlFor="edit-prize">Prize Pool</Label>
              <Input
                id="edit-prize"
                value={editEvent.prize_pool}
                onChange={(e) => setEditEvent({ ...editEvent, prize_pool: e.target.value })}
                placeholder="$500"
                className="mt-1"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleUpdateEvent}
              disabled={updating || !editEvent.title || !editEvent.start_date || !editEvent.end_date}
              className="w-full py-3 bg-gold text-black font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEventId} onOpenChange={(open) => !open && setDeleteEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this event and all associated submissions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEvent}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete Event'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
