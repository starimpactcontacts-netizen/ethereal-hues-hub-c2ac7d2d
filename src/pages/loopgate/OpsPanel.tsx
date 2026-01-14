import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Upload, Save, Lock, Unlock, Download, Eye, ChevronDown, ChevronUp, Clock, AlertTriangle, Check, Users, Calendar, Trophy, Image as ImageIcon, X, Pencil, Trash2, ShieldCheck, BadgeCheck, Ban, EyeOff, Shield, UserX, Sparkles, ThumbsUp, ThumbsDown, ShoppingBag, Package, Gift, Coins, Home, Crown, UserPlus, Search, Send, Zap, Play, Square, LinkIcon } from "lucide-react";
import OpenArenaForm, { getDefaultOpenArenaConfig } from "@/components/loopgate/OpenArenaForm";
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
import VerifiedBadge from "@/components/loopgate/VerifiedBadge";

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
  xp_reward: number | null;
  materials_url: string | null;
  // Open Arena fields
  event_mode: 'standard' | 'open_arena' | null;
  total_rounds: number | null;
  max_editors: number | null;
  winner_logic: 'final_qoi' | 'cumulative_qoi' | 'manual' | null;
  show_eliminated: boolean | null;
  hide_future_rounds: boolean | null;
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
  verification_status?: boolean;
  xp_awarded: number | null;
}

interface VerificationRequest {
  id: string;
  username: string;
  verification_code: string | null;
  verification_requested_at: string | null;
  verification_status: boolean;
  tiktok_username?: string;
}

interface AdminCrew {
  id: string;
  name: string;
  member_count: number;
  owner_id: string;
  owner_username?: string;
  created_at: string;
}

interface AdminUser {
  id: string;
  username: string;
  display_name: string | null;
  email: string | null;
  is_banned: boolean;
  is_hidden: boolean;
  banned_reason: string | null;
  created_at: string;
}

interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  item_type: 'cosmetic' | 'digital' | 'physical';
  price: number;
  image_url: string | null;
  is_active: boolean;
  stock: number | null;
}

interface Redemption {
  id: string;
  user_id: string;
  item_id: string;
  status: 'pending' | 'approved' | 'fulfilled' | 'rejected';
  points_spent: number;
  admin_notes: string | null;
  shipping_info: any;
  created_at: string;
  fulfilled_at: string | null;
  user_username?: string;
  item_name?: string;
  item_type?: string;
}

interface AdminHouse {
  id: string;
  name: string;
  type: 'public' | 'prestige';
  symbol: string;
  member_count: number;
  house_index: number;
}

interface HouseApplication {
  id: string;
  user_id: string;
  house_id: string;
  status: string;
  created_at: string;
  username?: string;
  house_name?: string;
}

interface HouseMember {
  id: string;
  user_id: string;
  house_id: string;
  role: string;
  joined_at: string;
  username?: string;
  global_index_score?: number;
}

interface AdminInvite {
  id: string;
  invite_code: string;
  inviter_id: string;
  invitee_id: string | null;
  status: string;
  created_at: string;
  joined_at: string | null;
  first_submission_at: string | null;
  inviter_username?: string;
  invitee_username?: string;
}

interface InviteStats {
  total_invites: number;
  total_joined: number;
  total_submitted: number;
  conversion_rate: number;
  top_recruiters: { user_id: string; username: string; count: number; xp_earned: number }[];
}

const CATEGORIES = ["Film", "Trailer", "Music", "Regional", "Global"];
const REGIONS = ["North America", "Europe", "Asia", "Latin America", "Africa", "Oceania", "Middle East"];
const EDITOR_CATEGORIES = [
  { id: 'film', label: 'Film Editor' },
  { id: 'music', label: 'Music Editor' },
  { id: 'anime', label: 'Anime Editor' },
  { id: 'sports', label: 'Sports Editor' },
  { id: 'gaming', label: 'Gaming Editor' },
  { id: 'trailer', label: 'Trailer Editor' },
  { id: 'abstract', label: 'Abstract / FX' },
  { id: 'meme', label: 'Meme / Shortform' },
];

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
  const { user, hasOpsAccess } = useAuth();
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
    xp_reward: 50,
    editor_category: '',
    event_mode: 'standard' as 'standard' | 'open_arena',
    materials_url: '',
    rules: [] as string[],
  });
  const [newRuleInput, setNewRuleInput] = useState('');
  const [openArenaConfig, setOpenArenaConfig] = useState(getDefaultOpenArenaConfig());
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
    xp_reward: 50,
    editor_category: '',
    materials_url: '',
    rules: [] as string[],
    status: 'pending' as string,
  });
  const [editRuleInput, setEditRuleInput] = useState('');
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

  // Verification state
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [verifyingUserId, setVerifyingUserId] = useState<string | null>(null);

  // Admin management state
  const [crews, setCrews] = useState<AdminCrew[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [deletingCrewId, setDeletingCrewId] = useState<string | null>(null);
  const [banningUserId, setBanningUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Shop management state
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    item_type: 'digital' as 'cosmetic' | 'digital' | 'physical',
    price: 100,
    stock: null as number | null,
  });
  const [itemImageFile, setItemImageFile] = useState<File | null>(null);
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null);
  const [creatingItem, setCreatingItem] = useState(false);
  const [processingRedemption, setProcessingRedemption] = useState<string | null>(null);
  const [redemptionNotes, setRedemptionNotes] = useState('');
  
  // Edit shop item state
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [editItem, setEditItem] = useState({
    name: '',
    description: '',
    item_type: 'digital' as 'cosmetic' | 'digital' | 'physical',
    price: 100,
    stock: null as number | null,
  });
  const [editItemImageFile, setEditItemImageFile] = useState<File | null>(null);
  const [editItemImagePreview, setEditItemImagePreview] = useState<string | null>(null);
  const [updatingItem, setUpdatingItem] = useState(false);

  // House management state
  const [houses, setHouses] = useState<AdminHouse[]>([]);
  const [houseApplications, setHouseApplications] = useState<HouseApplication[]>([]);
  const [houseMembers, setHouseMembers] = useState<HouseMember[]>([]);
  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [invitingUser, setInvitingUser] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  // Invite analytics state
  const [inviteAnalytics, setInviteAnalytics] = useState<InviteStats>({
    total_invites: 0,
    total_joined: 0,
    total_submitted: 0,
    conversion_rate: 0,
    top_recruiters: [],
  });
  const [recentInvites, setRecentInvites] = useState<AdminInvite[]>([]);

  // Open Arena round management state
  interface EventRound {
    id: string;
    event_id: string;
    round_number: number;
    round_type: 'open' | 'elimination' | 'threshold';
    advancement_type: 'top_x' | 'percentage' | 'manual' | 'none';
    advancement_value: number | null;
    threshold_qoi: number | null;
    max_submissions: number;
    index_reward: number;
    bonus_multiplier: number;
    duration_hours: number;
    auto_start_next: boolean;
    show_leaderboard: boolean;
    status: 'pending' | 'active' | 'completed';
    starts_at: string | null;
    ends_at: string | null;
  }
  const [eventRounds, setEventRounds] = useState<EventRound[]>([]);
  const [selectedArenaEventId, setSelectedArenaEventId] = useState<string | null>(null);
  const [roundActionLoading, setRoundActionLoading] = useState<string | null>(null);

  // Role check - redirect if no ops access (handled by ProtectedRoute, but double-check)
  useEffect(() => {
    if (!hasOpsAccess && !loading && !(window as any).__LOOPGATE_DEV_AUTH__) {
      toast.error("Access denied");
      navigate('/hub');
    }
  }, [hasOpsAccess, loading, navigate]);

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
    
    // Subscribe to Open Arena round submissions too
    const roundSubmissionsChannel = supabase
      .channel('admin-round-submissions-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'round_participations' }, (payload) => {
        console.log('[OPS] New Open Arena submission received:', payload);
        toast.info('New Open Arena submission received!');
        fetchData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'round_participations' }, () => {
        fetchData();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(submissionsChannel);
      supabase.removeChannel(roundSubmissionsChannel);
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
      
      // Fetch submissions from both tables (standard + Open Arena)
      const { data: standardSubmissions, error: standardError } = await supabase
        .from('event_participations')
        .select('*')
        .order('submitted_at', { ascending: false });
      
      if (standardError) throw standardError;
      
      // Fetch Open Arena round submissions
      const { data: roundSubmissions, error: roundError } = await supabase
        .from('round_participations')
        .select('*')
        .not('submission_url', 'is', null)
        .order('submitted_at', { ascending: false });
      
      if (roundError) throw roundError;
      
      // Merge both submission types, normalizing the structure
      const allSubmissions = [
        ...(standardSubmissions || []).map(s => ({
          ...s,
          source: 'standard' as const,
        })),
        ...(roundSubmissions || []).map(s => ({
          id: s.id,
          user_id: s.user_id,
          event_id: s.event_id,
          submission_url: s.submission_url,
          platform: s.platform,
          status: s.status,
          quality_score: s.quality_score,
          originality_score: s.originality_score,
          impact_score: s.impact_score,
          qoi_score: s.qoi_score,
          final_rank: null,
          submitted_at: s.submitted_at || s.created_at,
          judged_at: s.judged_at,
          judge_id: s.judge_id,
          xp_awarded: null,
          source: 'open_arena' as const,
          round_number: s.round_number,
        })),
      ];
      
      // Sort by submitted_at descending
      allSubmissions.sort((a, b) => {
        const dateA = new Date(a.submitted_at || '').getTime();
        const dateB = new Date(b.submitted_at || '').getTime();
        return dateB - dateA;
      });
      
      // Fetch usernames and verification status for submissions
      const userIds = [...new Set(allSubmissions.map(s => s.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, verification_status')
        .in('id', userIds.length > 0 ? userIds : ['']);
      
      const profileMap = new Map((profilesData || []).map(p => [p.id, p]));
      
      const formattedSubmissions = allSubmissions.map(s => ({
        ...s,
        username: profileMap.get(s.user_id)?.username || 'Unknown',
        verification_status: profileMap.get(s.user_id)?.verification_status || false
      }));
      
      setSubmissions(formattedSubmissions);

      // Fetch verification requests (users with pending verification codes)
      const { data: verificationData } = await supabase
        .from('profiles')
        .select('id, username, verification_code, verification_requested_at, verification_status')
        .not('verification_code', 'is', null)
        .eq('verification_status', false)
        .order('verification_requested_at', { ascending: false });

      if (verificationData) {
        // Fetch TikTok usernames for these users
        const verUserIds = verificationData.map(v => v.id);
        const { data: platformsData } = await supabase
          .from('connected_platforms')
          .select('user_id, platform_username')
          .in('user_id', verUserIds)
          .eq('platform', 'tiktok');

        const tiktokMap = new Map((platformsData || []).map(p => [p.user_id, p.platform_username]));

        setVerificationRequests(verificationData.map(v => ({
          ...v,
          tiktok_username: tiktokMap.get(v.id) || undefined
        })));
      }

      // Fetch all crews for admin management
      const { data: crewsData } = await supabase
        .from('crews')
        .select('id, name, member_count, owner_id, created_at')
        .order('created_at', { ascending: false });

      if (crewsData) {
        // Fetch owner usernames
        const ownerIds = [...new Set(crewsData.map(c => c.owner_id))];
        const { data: ownerProfiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', ownerIds);
        
        const ownerMap = new Map((ownerProfiles || []).map(p => [p.id, p.username]));
        
        setCrews(crewsData.map(c => ({
          ...c,
          owner_username: ownerMap.get(c.owner_id) || 'Unknown'
        })));
      }

      // Fetch users for admin management (including banned/hidden)
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, username, display_name, email, is_banned, is_hidden, banned_reason, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (usersData) {
        setUsers(usersData);
      }

      // Fetch shop items
      const { data: shopItemsData } = await supabase
        .from('shop_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (shopItemsData) {
        setShopItems(shopItemsData as ShopItem[]);
      }

      // Fetch redemptions with user and item info
      const { data: redemptionsData } = await supabase
        .from('redemptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (redemptionsData) {
        // Get user IDs and item IDs
        const redemptionUserIds = [...new Set(redemptionsData.map(r => r.user_id))];
        const itemIds = [...new Set(redemptionsData.map(r => r.item_id))];

        const { data: redemptionProfiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', redemptionUserIds);

        const { data: itemsForRedemptions } = await supabase
          .from('shop_items')
          .select('id, name, item_type')
          .in('id', itemIds);

        const profileMap = new Map((redemptionProfiles || []).map(p => [p.id, p.username]));
        const itemMap = new Map((itemsForRedemptions || []).map(i => [i.id, i]));

        setRedemptions(redemptionsData.map(r => ({
          ...r,
          user_username: profileMap.get(r.user_id) || 'Unknown',
          item_name: itemMap.get(r.item_id)?.name || 'Unknown',
          item_type: itemMap.get(r.item_id)?.item_type || 'digital',
        })) as Redemption[]);
      }

      // Fetch houses with calculated house index
      const { data: housesData } = await supabase
        .from('houses')
        .select('id, name, type, symbol, member_count')
        .order('name');

      if (housesData) {
        // Calculate house index for each house
        const housesWithIndex: AdminHouse[] = await Promise.all(
          housesData.map(async (house) => {
            const { data: members } = await supabase
              .from('house_members')
              .select('user_id')
              .eq('house_id', house.id);

            if (members && members.length > 0) {
              const memberIds = members.map(m => m.user_id);
              const { data: profiles } = await supabase
                .from('profiles')
                .select('global_index_score')
                .in('id', memberIds);

              const totalIndex = (profiles || []).reduce((sum, p) => sum + (p.global_index_score || 0), 0);
              return { ...house, house_index: Math.round(totalIndex * 10) / 10 };
            }
            return { ...house, house_index: 0 };
          })
        );
        setHouses(housesWithIndex as AdminHouse[]);
      }

      // Fetch pending house applications
      const { data: applicationsData } = await supabase
        .from('house_applications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (applicationsData) {
        const appUserIds = [...new Set(applicationsData.map(a => a.user_id))];
        const { data: appProfiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', appUserIds);

        const appProfileMap = new Map((appProfiles || []).map(p => [p.id, p.username]));

        setHouseApplications(applicationsData.map(a => ({
          ...a,
          username: appProfileMap.get(a.user_id) || 'Unknown',
          house_name: housesData?.find(h => h.id === a.house_id)?.name || 'Unknown',
        })));
      }

      // Fetch invite analytics
      const { data: invitesData } = await supabase
        .from('invites')
        .select('*')
        .order('created_at', { ascending: false });

      if (invitesData) {
        // Get all inviter IDs for username lookup
        const inviterIds = [...new Set(invitesData.map(i => i.inviter_id))];
        const inviteeIds = invitesData.filter(i => i.invitee_id).map(i => i.invitee_id!);
        const allUserIds = [...new Set([...inviterIds, ...inviteeIds])];
        
        const { data: inviteProfiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', allUserIds);

        const inviteProfileMap = new Map((inviteProfiles || []).map(p => [p.id, p.username]));

        // Calculate stats
        const totalInvites = invitesData.length;
        const totalJoined = invitesData.filter(i => i.status === 'joined' || i.status === 'submitted').length;
        const totalSubmitted = invitesData.filter(i => i.status === 'submitted').length;
        const conversionRate = totalInvites > 0 ? Math.round((totalJoined / totalInvites) * 100) : 0;

        // Calculate top recruiters
        const recruiterCounts = new Map<string, { count: number; joined: number; submitted: number }>();
        invitesData.forEach(invite => {
          const current = recruiterCounts.get(invite.inviter_id) || { count: 0, joined: 0, submitted: 0 };
          current.count++;
          if (invite.status === 'joined' || invite.status === 'submitted') current.joined++;
          if (invite.status === 'submitted') current.submitted++;
          recruiterCounts.set(invite.inviter_id, current);
        });

        const topRecruiters = Array.from(recruiterCounts.entries())
          .map(([userId, data]) => ({
            user_id: userId,
            username: inviteProfileMap.get(userId) || 'Unknown',
            count: data.count,
            xp_earned: (data.count * 20) + (data.joined * 50) + (data.submitted * 100),
          }))
          .sort((a, b) => b.xp_earned - a.xp_earned)
          .slice(0, 10);

        setInviteAnalytics({
          total_invites: totalInvites,
          total_joined: totalJoined,
          total_submitted: totalSubmitted,
          conversion_rate: conversionRate,
          top_recruiters: topRecruiters,
        });

        // Set recent invites with usernames
        setRecentInvites(invitesData.slice(0, 20).map(invite => ({
          ...invite,
          inviter_username: inviteProfileMap.get(invite.inviter_id) || 'Unknown',
          invitee_username: invite.invitee_id ? inviteProfileMap.get(invite.invitee_id) || 'Unknown' : undefined,
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleManualVerify(userId: string) {
    setVerifyingUserId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          verification_status: true,
          verification_code: null 
        })
        .eq('id', userId);

      if (error) throw error;
      toast.success('User verified successfully');
      fetchData();
    } catch (error) {
      console.error('Error verifying user:', error);
      toast.error('Failed to verify user');
    } finally {
      setVerifyingUserId(null);
    }
  }

  async function handleRejectVerification(userId: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          verification_code: null,
          verification_requested_at: null
        })
        .eq('id', userId);

      if (error) throw error;
      toast.success('Verification request rejected');
      fetchData();
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error('Failed to reject verification');
    }
  }

  // Open Arena round management functions
  async function fetchEventRounds(eventId: string) {
    const { data, error } = await supabase
      .from('event_rounds')
      .select('*')
      .eq('event_id', eventId)
      .order('round_number');
    
    if (!error && data) {
      setEventRounds(data as any);
      setSelectedArenaEventId(eventId);
    }
  }

  async function handleStartRound(eventId: string, roundNumber: number) {
    setRoundActionLoading(`start-${roundNumber}`);
    try {
      const { error } = await supabase.rpc('start_event_round', {
        p_event_id: eventId,
        p_round_number: roundNumber
      });
      if (error) throw error;
      toast.success(`Round ${roundNumber} started!`);
      fetchEventRounds(eventId);
    } catch (error) {
      console.error('Error starting round:', error);
      toast.error('Failed to start round');
    } finally {
      setRoundActionLoading(null);
    }
  }

  async function handleEndRound(eventId: string, roundNumber: number) {
    setRoundActionLoading(`end-${roundNumber}`);
    try {
      const { data, error } = await supabase.rpc('end_event_round', {
        p_event_id: eventId,
        p_round_number: roundNumber
      });
      if (error) throw error;
      toast.success(`Round ${roundNumber} ended! ${data} users processed.`);
      fetchEventRounds(eventId);
    } catch (error) {
      console.error('Error ending round:', error);
      toast.error('Failed to end round');
    } finally {
      setRoundActionLoading(null);
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
      
      // Create event with Open Arena fields if applicable
      const isOpenArena = newEvent.event_mode === 'open_arena';
      const { data: eventData, error } = await supabase.from('events').insert({
        title: newEvent.title,
        subtitle: newEvent.subtitle || null,
        description: newEvent.description || null,
        category: newEvent.category,
        region_tags: newEvent.region_tags,
        rules: newEvent.rules.length > 0 ? newEvent.rules : null,
        start_date: new Date(newEvent.start_date).toISOString(),
        end_date: new Date(newEvent.end_date).toISOString(),
        prize_pool: newEvent.prize_pool || null,
        league: newEvent.league,
        poster_url: posterUrl,
        status: 'pending',
        xp_reward: newEvent.xp_reward,
        editor_category: newEvent.editor_category || null,
        event_mode: newEvent.event_mode,
        materials_url: newEvent.materials_url || null,
        total_rounds: isOpenArena ? openArenaConfig.total_rounds : 1,
        max_editors: isOpenArena ? openArenaConfig.max_editors : null,
        winner_logic: isOpenArena ? openArenaConfig.winner_logic : 'final_qoi',
        show_eliminated: isOpenArena ? openArenaConfig.show_eliminated : true,
        hide_future_rounds: isOpenArena ? openArenaConfig.hide_future_rounds : false,
      }).select().single();
      
      if (error) throw error;
      
      // Create rounds for Open Arena events
      if (isOpenArena && eventData) {
        const roundsToInsert = openArenaConfig.rounds.map((round, index) => ({
          event_id: eventData.id,
          round_number: index + 1,
          round_type: round.round_type as 'open' | 'elimination' | 'threshold',
          advancement_type: round.advancement_type as 'top_x' | 'percentage' | 'manual' | 'none',
          advancement_value: round.advancement_value,
          threshold_qoi: round.threshold_qoi,
          max_submissions: round.max_submissions,
          index_reward: round.index_reward,
          bonus_multiplier: round.bonus_multiplier,
          duration_hours: round.duration_hours,
          auto_start_next: round.auto_start_next,
          show_leaderboard: round.show_leaderboard,
          status: 'pending' as const,
        }));

        const { error: roundsError } = await supabase
          .from('event_rounds')
          .insert(roundsToInsert);

        if (roundsError) {
          console.error('Error creating rounds:', roundsError);
          toast.error('Event created but failed to create rounds');
        }
      }
      
      toast.success(isOpenArena ? 'Open Arena event created!' : 'Event created successfully');
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
        xp_reward: 50,
        editor_category: '',
        event_mode: 'standard',
        materials_url: '',
        rules: [],
      });
      setNewRuleInput('');
      setOpenArenaConfig(getDefaultOpenArenaConfig());
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
      xp_reward: event.xp_reward || 50,
      editor_category: (event as any).editor_category || '',
      materials_url: event.materials_url || '',
      rules: event.rules || [],
      status: event.status,
    });
    setEditRuleInput('');
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
        rules: editEvent.rules.length > 0 ? editEvent.rules : null,
        start_date: new Date(editEvent.start_date).toISOString(),
        end_date: new Date(editEvent.end_date).toISOString(),
        prize_pool: editEvent.prize_pool || null,
        league: editEvent.league,
        poster_url: posterUrl,
        xp_reward: editEvent.xp_reward,
        materials_url: editEvent.materials_url || null,
        editor_category: editEvent.editor_category || null,
        status: editEvent.status,
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

  async function handleScoreSubmission(submission: RealSubmission & { source?: string }) {
    setSaving(true);
    
    const qoiTotal = scores.quality + scores.originality + scores.impact;
    
    // Determine which table to update based on source
    const tableName = submission.source === 'open_arena' ? 'round_participations' : 'event_participations';
    
    try {
      const { error } = await supabase
        .from(tableName)
        .update({
          quality_score: scores.quality,
          originality_score: scores.originality,
          impact_score: scores.impact,
          qoi_score: qoiTotal,
          status: 'scored',
          judged_at: new Date().toISOString(),
          judge_id: user?.id,
        })
        .eq('id', submission.id);
      
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

  // Approve submission and award XP
  async function handleApproveSubmission(submission: RealSubmission & { source?: string }) {
    setActionLoading(true);
    try {
      // Get event XP reward
      const event = events.find(e => e.id === submission.event_id);
      const xpReward = event?.xp_reward || 50;

      // Determine which table to update based on source
      // For round_participations, use 'active' status (participant_status enum)
      // For event_participations, use 'approved' status (string field)
      if (submission.source === 'open_arena') {
        // Open Arena uses round_participations with participant_status enum
        // 'active' means approved and ready for scoring
        const { error: updateError } = await supabase
          .from('round_participations')
          .update({ status: 'active' })
          .eq('id', submission.id);

        if (updateError) throw updateError;
      } else {
        // Standard events use event_participations with string status
        const { error: updateError } = await supabase
          .from('event_participations')
          .update({
            status: 'approved',
            xp_awarded: xpReward,
          })
          .eq('id', submission.id);

        if (updateError) throw updateError;
      }

      // Award XP to user
      await supabase.rpc('award_xp', {
        p_user_id: submission.user_id,
        p_amount: xpReward,
        p_action: 'event_submission',
        p_description: `Approved submission for ${event?.title || 'event'}`,
      });

      toast.success(`Submission approved! +${xpReward} XP awarded`);
      fetchData();
    } catch (error) {
      console.error('Error approving submission:', error);
      toast.error('Failed to approve submission');
    } finally {
      setActionLoading(false);
    }
  }

  // Decline submission (no XP, or revoke if previously awarded)
  async function handleDeclineSubmission(submission: RealSubmission & { source?: string }) {
    setActionLoading(true);
    try {
      const previouslyAwarded = submission.xp_awarded || 0;

      // Determine which table to update based on source
      const tableName = submission.source === 'open_arena' ? 'round_participations' : 'event_participations';

      // Update submission status to declined
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          status: 'declined',
          ...(tableName === 'event_participations' ? { xp_awarded: 0 } : {}),
        })
        .eq('id', submission.id);

      if (updateError) throw updateError;

      // If XP was previously awarded, revoke it
      if (previouslyAwarded > 0) {
        await supabase.rpc('award_xp', {
          p_user_id: submission.user_id,
          p_amount: -previouslyAwarded,
          p_action: 'submission_declined',
          p_description: 'Submission declined - XP revoked',
        });
        toast.success(`Submission declined. ${previouslyAwarded} XP revoked.`);
      } else {
        toast.success('Submission declined');
      }
      
      fetchData();
    } catch (error) {
      console.error('Error declining submission:', error);
      toast.error('Failed to decline submission');
    } finally {
      setActionLoading(false);
    }
  }

  // Delete submission completely (for stolen/invalid edits)
  async function handleDeleteSubmission(submission: RealSubmission & { source?: string }) {
    setActionLoading(true);
    try {
      const xpToRevoke = submission.xp_awarded || 0;

      // Determine which table to delete from based on source
      const tableName = submission.source === 'open_arena' ? 'round_participations' : 'event_participations';

      // Delete the submission
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', submission.id);

      if (deleteError) throw deleteError;

      // Revoke XP if any was awarded
      if (xpToRevoke > 0) {
        await supabase.rpc('award_xp', {
          p_user_id: submission.user_id,
          p_amount: -xpToRevoke,
          p_action: 'submission_deleted',
          p_description: 'Submission removed by admin - XP revoked',
        });
      }

      // Recalculate user's index score since we removed a scored submission
      if (submission.status === 'scored') {
        await supabase.rpc('recalculate_user_index', {
          user_uuid: submission.user_id,
        });
      }

      toast.success(`Submission deleted${xpToRevoke > 0 ? `. ${xpToRevoke} XP revoked.` : ''}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast.error('Failed to delete submission');
    } finally {
      setActionLoading(false);
    }
  }

  // Admin: Delete crew
  async function handleDeleteCrew(crewId: string) {
    setActionLoading(true);
    try {
      // First remove all members
      await supabase.from('crew_members').delete().eq('crew_id', crewId);
      // Then delete the crew
      const { error } = await supabase.from('crews').delete().eq('id', crewId);
      if (error) throw error;
      toast.success('Crew deleted');
      setDeletingCrewId(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting crew:', error);
      toast.error('Failed to delete crew');
    } finally {
      setActionLoading(false);
    }
  }

  // Admin: Ban user
  async function handleBanUser(userId: string, ban: boolean) {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_banned: ban,
          banned_at: ban ? new Date().toISOString() : null,
          banned_reason: ban ? (banReason || 'Violation of terms') : null
        })
        .eq('id', userId);
      
      if (error) throw error;
      toast.success(ban ? 'User banned' : 'User unbanned');
      setBanningUserId(null);
      setBanReason('');
      fetchData();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setActionLoading(false);
    }
  }

  // Admin: Hide/unhide profile
  async function handleToggleHidden(userId: string, hide: boolean) {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_hidden: hide })
        .eq('id', userId);
      
      if (error) throw error;
      toast.success(hide ? 'Profile hidden' : 'Profile visible');
      fetchData();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setActionLoading(false);
    }
  }

  // Shop: Create item with image upload
  async function handleCreateShopItem() {
    if (!newItem.name || newItem.price <= 0) {
      toast.error('Please fill in item name and price');
      return;
    }

    setCreatingItem(true);
    try {
      let imageUrl: string | null = null;

      // Upload image if provided
      if (itemImageFile) {
        const fileExt = itemImageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('shop-items')
          .upload(fileName, itemImageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('shop-items')
          .getPublicUrl(fileName);
        
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('shop_items')
        .insert({
          name: newItem.name,
          description: newItem.description || null,
          item_type: newItem.item_type,
          price: newItem.price,
          stock: newItem.stock,
          is_active: true,
          image_url: imageUrl,
        });

      if (error) throw error;

      toast.success('Shop item created!');
      setShowCreateItem(false);
      setNewItem({ name: '', description: '', item_type: 'digital', price: 100, stock: null });
      setItemImageFile(null);
      setItemImagePreview(null);
      fetchData();
    } catch (error) {
      console.error('Error creating shop item:', error);
      toast.error('Failed to create item');
    } finally {
      setCreatingItem(false);
    }
  }

  // Shop: Edit item
  function openEditItem(item: ShopItem) {
    setEditingItem(item);
    setEditItem({
      name: item.name,
      description: item.description || '',
      item_type: item.item_type,
      price: item.price,
      stock: item.stock,
    });
    setEditItemImagePreview(item.image_url);
    setEditItemImageFile(null);
  }

  async function handleUpdateShopItem() {
    if (!editingItem || !editItem.name || editItem.price <= 0) {
      toast.error('Please fill in item name and price');
      return;
    }

    setUpdatingItem(true);
    try {
      let imageUrl: string | null = editingItem.image_url;

      // Upload new image if provided
      if (editItemImageFile) {
        const fileExt = editItemImageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('shop-items')
          .upload(fileName, editItemImageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('shop-items')
          .getPublicUrl(fileName);
        
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('shop_items')
        .update({
          name: editItem.name,
          description: editItem.description || null,
          item_type: editItem.item_type,
          price: editItem.price,
          stock: editItem.stock,
          image_url: imageUrl,
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      toast.success('Shop item updated!');
      setEditingItem(null);
      setEditItemImageFile(null);
      setEditItemImagePreview(null);
      fetchData();
    } catch (error) {
      console.error('Error updating shop item:', error);
      toast.error('Failed to update item');
    } finally {
      setUpdatingItem(false);
    }
  }

  // Handle item image selection
  function handleItemImageChange(e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) {
    const file = e.target.files?.[0];
    if (file) {
      if (isEdit) {
        setEditItemImageFile(file);
        setEditItemImagePreview(URL.createObjectURL(file));
      } else {
        setItemImageFile(file);
        setItemImagePreview(URL.createObjectURL(file));
      }
    }
  }

  // Shop: Toggle item active status
  async function handleToggleItemActive(item: ShopItem) {
    try {
      const { error } = await supabase
        .from('shop_items')
        .update({ is_active: !item.is_active })
        .eq('id', item.id);

      if (error) throw error;
      toast.success(item.is_active ? 'Item hidden from shop' : 'Item now visible in shop');
      fetchData();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  }

  // Shop: Delete item
  async function handleDeleteShopItem(itemId: string) {
    try {
      const { error } = await supabase
        .from('shop_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      toast.success('Item deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  }

  // Shop: Process redemption
  async function handleProcessRedemption(redemption: Redemption, action: 'approved' | 'fulfilled' | 'rejected') {
    setProcessingRedemption(redemption.id);
    try {
      const updateData: any = {
        status: action,
        admin_notes: redemptionNotes || null,
      };

      if (action === 'fulfilled') {
        updateData.fulfilled_at = new Date().toISOString();
      }

      // If rejecting, refund the points
      if (action === 'rejected') {
        await supabase.rpc('award_xp', {
          p_user_id: redemption.user_id,
          p_amount: 0, // We'll handle this differently
          p_action: 'refund',
          p_description: 'Shop order refunded',
        });
        
        // Manually add back the spendable index
        const { data: profile } = await supabase
          .from('profiles')
          .select('spendable_index')
          .eq('id', redemption.user_id)
          .single();
        
        if (profile) {
          await supabase
            .from('profiles')
            .update({ spendable_index: (profile.spendable_index || 0) + redemption.points_spent })
            .eq('id', redemption.user_id);
        }
      }

      const { error } = await supabase
        .from('redemptions')
        .update(updateData)
        .eq('id', redemption.id);

      if (error) throw error;

      const actionText = action === 'approved' ? 'Approved' : action === 'fulfilled' ? 'Fulfilled' : 'Rejected & refunded';
      toast.success(`${actionText} successfully`);
      setRedemptionNotes('');
      fetchData();
    } catch (error) {
      console.error('Error processing redemption:', error);
      toast.error('Failed to process redemption');
    } finally {
      setProcessingRedemption(null);
    }
  }

  // House: Fetch members for a house
  async function fetchHouseMembers(houseId: string) {
    setSelectedHouseId(houseId);
    try {
      const { data: membersData } = await supabase
        .from('house_members')
        .select('*')
        .eq('house_id', houseId);

      if (membersData) {
        const memberUserIds = membersData.map(m => m.user_id);
        const { data: memberProfiles } = await supabase
          .from('profiles')
          .select('id, username, global_index_score')
          .in('id', memberUserIds);

        const memberProfileMap = new Map((memberProfiles || []).map(p => [p.id, p]));

        setHouseMembers(membersData.map(m => ({
          ...m,
          username: memberProfileMap.get(m.user_id)?.username || 'Unknown',
          global_index_score: memberProfileMap.get(m.user_id)?.global_index_score || 0,
        })));
      }
    } catch (error) {
      console.error('Error fetching house members:', error);
      toast.error('Failed to load members');
    }
  }

  // House: Approve application
  async function handleApproveHouseApplication(application: HouseApplication) {
    setActionLoading(true);
    try {
      // Check cooldown
      const { data: profile } = await supabase
        .from('profiles')
        .select('house_id, house_changed_at')
        .eq('id', application.user_id)
        .single();

      if (profile?.house_id) {
        toast.error('User is already in a house');
        return;
      }

      // Get house name for notification
      const { data: houseData } = await supabase
        .from('houses')
        .select('name')
        .eq('id', application.house_id)
        .single();

      // Add member to house
      const { error: insertError } = await supabase
        .from('house_members')
        .insert({
          house_id: application.house_id,
          user_id: application.user_id,
          role: 'member',
        });

      if (insertError) throw insertError;

      // Update profile
      await supabase
        .from('profiles')
        .update({ 
          house_id: application.house_id,
          house_changed_at: new Date().toISOString(),
        })
        .eq('id', application.user_id);

      // Update application status
      const { error: updateError } = await supabase
        .from('house_applications')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', application.id);

      if (updateError) throw updateError;

      // Send notification to user
      await supabase
        .from('notifications')
        .insert({
          user_id: application.user_id,
          type: 'house_accepted',
          title: 'Welcome to ' + (houseData?.name || 'the House') + '!',
          message: 'Your application has been approved. You are now a member of ' + (houseData?.name || 'the House') + '.',
          data: { house_id: application.house_id, house_name: houseData?.name },
        });

      toast.success('Application approved & user notified');
      fetchData();
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error('Failed to approve');
    } finally {
      setActionLoading(false);
    }
  }

  // House: Reject application
  async function handleRejectHouseApplication(applicationId: string) {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('house_applications')
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast.success('Application rejected');
      fetchData();
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Failed to reject');
    } finally {
      setActionLoading(false);
    }
  }

  // House: Invite user to house (for prestige houses)
  async function handleInviteToHouse() {
    if (!selectedHouseId || !inviteUsername.trim()) {
      toast.error('Please enter a username');
      return;
    }

    setInvitingUser(true);
    try {
      // Find user by username
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('id, house_id')
        .eq('username', inviteUsername.trim().toLowerCase())
        .single();

      if (!targetProfile) {
        toast.error('User not found');
        return;
      }

      if (targetProfile.house_id) {
        toast.error('User is already in a house');
        return;
      }

      // Get house name for notification
      const selectedHouse = houses.find(h => h.id === selectedHouseId);
      const houseName = selectedHouse?.name || 'the House';

      // Add member directly (admin invite bypasses application)
      const { error: insertError } = await supabase
        .from('house_members')
        .insert({
          house_id: selectedHouseId,
          user_id: targetProfile.id,
          role: 'member',
        });

      if (insertError) throw insertError;

      // Update profile
      await supabase
        .from('profiles')
        .update({ 
          house_id: selectedHouseId,
          house_changed_at: new Date().toISOString(),
        })
        .eq('id', targetProfile.id);

      // Send notification to user
      await supabase
        .from('notifications')
        .insert({
          user_id: targetProfile.id,
          type: 'house_invited',
          title: 'You have been invited to ' + houseName + '!',
          message: 'You have been personally invited to join ' + houseName + '. Welcome to the family.',
          data: { house_id: selectedHouseId, house_name: houseName },
        });

      toast.success(`Invited ${inviteUsername} to house & notified`);
      setInviteUsername('');
      setShowInviteModal(false);
      fetchData();
      fetchHouseMembers(selectedHouseId);
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('Failed to invite user');
    } finally {
      setInvitingUser(false);
    }
  }

  // House: Remove member
  async function handleRemoveHouseMember(memberId: string, userId: string) {
    setRemovingMemberId(memberId);
    try {
      const { error } = await supabase
        .from('house_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      // Update profile
      await supabase
        .from('profiles')
        .update({ house_id: null })
        .eq('id', userId);

      toast.success('Member removed');
      if (selectedHouseId) {
        fetchHouseMembers(selectedHouseId);
      }
      fetchData();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    } finally {
      setRemovingMemberId(null);
    }
  }

  // Filter users by search
  const filteredUsers = userSearch 
    ? users.filter(u => 
        u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.display_name?.toLowerCase().includes(userSearch.toLowerCase())) ||
        (u.email?.toLowerCase().includes(userSearch.toLowerCase()))
      )
    : users;

  const pendingRedemptions = redemptions.filter(r => r.status === 'pending');
  const approvedRedemptions = redemptions.filter(r => r.status === 'approved');
  const fulfilledRedemptions = redemptions.filter(r => r.status === 'fulfilled');

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
  
  // For pending: 'pending' status in both tables
  const pendingSubmissions = filteredSubmissions.filter(s => s.status === 'pending');
  // For approved: 'approved' for standard events, 'active' for Open Arena (participant_status enum)
  const approvedSubmissions = filteredSubmissions.filter(s => 
    s.status === 'approved' || ((s as any).source === 'open_arena' && s.status === 'active')
  );
  const declinedSubmissions = filteredSubmissions.filter(s => s.status === 'declined' || s.status === 'eliminated');
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
        {/* Quick Actions - Hyper Growth Mode */}
        <section className="bg-gradient-to-r from-gold/5 to-transparent border border-gold/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gold flex items-center gap-2">
              <Sparkles size={14} />
              Quick Actions
            </h2>
            <span className="text-[10px] text-gold bg-gold/10 px-2 py-0.5 rounded-full">
              {inviteAnalytics.total_invites} invites • {inviteAnalytics.conversion_rate}% conv
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setShowCreateEvent(true)}
              className="flex items-center justify-center gap-2 bg-gold text-black font-semibold py-3 rounded-lg text-sm"
            >
              <Calendar size={16} />
              New Event
            </button>
            <button 
              onClick={() => setShowCreateItem(true)}
              className="flex items-center justify-center gap-2 bg-surface-1 border border-border font-semibold py-3 rounded-lg text-sm hover:border-gold/50 transition-colors"
            >
              <ShoppingBag size={16} />
              Add Shop Item
            </button>
          </div>
          
          {/* Live Stats Bar */}
          <div className="mt-3 pt-3 border-t border-gold/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-muted-foreground">{pendingSubmissions.length} pending</span>
              </span>
              <span className="text-muted-foreground">{pendingRedemptions.length} orders</span>
              <span className="text-muted-foreground">{verificationRequests.length} verifications</span>
            </div>
            <span className="text-muted-foreground">{users.length} users</span>
          </div>
        </section>

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
                const isOpenArena = (event as any).event_mode === 'open_arena';
                const isExpanded = selectedArenaEventId === event.id;
                
                return (
                  <div key={event.id} className="bg-card border border-border rounded-lg overflow-hidden">
                    <div
                      className={`p-4 ${
                        activeEventFilter === event.id ? "border-l-2 border-gold" : ""
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
                            {isOpenArena && (
                              <Badge className="bg-gold/20 text-gold text-[10px] flex items-center gap-1">
                                <Zap size={10} />
                                OPEN ARENA
                              </Badge>
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
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Sparkles size={10} className="text-gold" />
                              {event.xp_reward || 50} XP
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOpenArena && (
                            <button
                              onClick={() => {
                                if (isExpanded) {
                                  setSelectedArenaEventId(null);
                                  setEventRounds([]);
                                } else {
                                  fetchEventRounds(event.id);
                                }
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                isExpanded ? "bg-gold text-black" : "bg-surface-1 hover:bg-gold/20 text-gold"
                              }`}
                              title="Manage Rounds"
                            >
                              <Zap size={16} />
                            </button>
                          )}
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
                    
                    {/* Open Arena Round Controls */}
                    {isOpenArena && isExpanded && (
                      <div className="border-t border-border bg-surface-1 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Zap size={12} className="text-gold" />
                            Round Management
                          </p>
                          <span className="text-[10px] text-muted-foreground">
                            {event.total_rounds || 3} total rounds
                          </span>
                        </div>
                        
                        {eventRounds.length === 0 ? (
                          <div className="text-center py-4">
                            <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Loading rounds...</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {eventRounds.map((round) => (
                              <div 
                                key={round.id} 
                                className={`p-3 rounded-lg border ${
                                  round.status === 'active' ? 'border-green-500 bg-green-500/10' :
                                  round.status === 'completed' ? 'border-muted bg-muted/20' :
                                  'border-border bg-card'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm">Round {round.round_number}</span>
                                      <Badge className={`text-[9px] ${
                                        round.status === 'active' ? 'bg-green-500' :
                                        round.status === 'completed' ? 'bg-muted-foreground' :
                                        'bg-gold/20 text-gold'
                                      }`}>
                                        {round.status.toUpperCase()}
                                      </Badge>
                                      <Badge variant="outline" className="text-[9px]">
                                        {round.round_type.toUpperCase()}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                                      <span>{round.duration_hours}h duration</span>
                                      {round.advancement_type !== 'none' && (
                                        <span>
                                          {round.advancement_type === 'top_x' ? `Top ${round.advancement_value}` : 
                                           round.advancement_type === 'percentage' ? `Top ${round.advancement_value}%` :
                                           round.advancement_type === 'manual' ? 'Manual' : ''}
                                          {' '}advance
                                        </span>
                                      )}
                                      {round.threshold_qoi && (
                                        <span>Min QOI: {round.threshold_qoi}</span>
                                      )}
                                      <span>+{round.index_reward} INDEX</span>
                                    </div>
                                    {round.starts_at && (
                                      <p className="text-[10px] text-muted-foreground mt-1">
                                        {round.status === 'active' ? 'Started' : 'Ended'}: {new Date(round.starts_at).toLocaleString()}
                                        {round.ends_at && round.status === 'active' && (
                                          <> → Ends: {new Date(round.ends_at).toLocaleString()}</>
                                        )}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {round.status === 'pending' && (
                                      <button
                                        onClick={() => handleStartRound(event.id, round.round_number)}
                                        disabled={roundActionLoading === `start-${round.round_number}`}
                                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                                      >
                                        {roundActionLoading === `start-${round.round_number}` ? (
                                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <Play size={12} />
                                        )}
                                        Start
                                      </button>
                                    )}
                                    {round.status === 'active' && (
                                      <button
                                        onClick={() => handleEndRound(event.id, round.round_number)}
                                        disabled={roundActionLoading === `end-${round.round_number}`}
                                        className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                                      >
                                        {roundActionLoading === `end-${round.round_number}` ? (
                                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <Square size={12} />
                                        )}
                                        End Round
                                      </button>
                                    )}
                                    {round.status === 'completed' && (
                                      <Badge className="bg-green-500/20 text-green-400 text-[9px]">
                                        <Check size={10} className="mr-1" />
                                        Done
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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
              <span className="text-orange-400">{pendingSubmissions.length} pending</span>
              <span className="text-green-500">{approvedSubmissions.length} approved</span>
              <span className="text-gold">{ratedSubmissions.length} rated</span>
            </div>
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="w-full mb-4 grid grid-cols-4">
              <TabsTrigger value="pending">
                Pending ({pendingSubmissions.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approvedSubmissions.length})
              </TabsTrigger>
              <TabsTrigger value="rated">
                Rated ({ratedSubmissions.length})
              </TabsTrigger>
              <TabsTrigger value="declined">
                Declined ({declinedSubmissions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingSubmissions.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-6 text-center">
                  <Check className="w-8 h-8 mx-auto text-green-500 mb-2" />
                  <p className="text-sm text-muted-foreground">No pending submissions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="bg-card border border-border rounded-lg overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{submission.username}</p>
                              {submission.verification_status && <VerifiedBadge size="sm" />}
                            </div>
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
                          <div className="flex items-center gap-2">
                            {/* Decline button */}
                            <button
                              onClick={() => handleDeclineSubmission(submission)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-colors flex items-center gap-2"
                              title="Decline (stolen/invalid)"
                            >
                              <ThumbsDown size={16} />
                              <span className="text-sm font-medium">Decline</span>
                            </button>
                            {/* Approve button */}
                            <button
                              onClick={() => handleApproveSubmission(submission)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-2"
                              title={`Approve (+${events.find(e => e.id === submission.event_id)?.xp_reward || 50} XP)`}
                            >
                              <ThumbsUp size={16} />
                              <span className="text-sm font-medium">Approve</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved">
              {approvedSubmissions.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-6 text-center">
                  <ThumbsUp className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No approved submissions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvedSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="bg-card border border-green-500/30 rounded-lg overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{submission.username}</p>
                              {submission.verification_status && <VerifiedBadge size="sm" />}
                            </div>
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
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-500/20 text-green-500 flex items-center gap-1">
                              <Sparkles size={10} />
                              +{submission.xp_awarded || 0} XP
                            </Badge>
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
                            <button
                              onClick={() => handleDeclineSubmission(submission)}
                              disabled={actionLoading}
                              className="p-2 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-colors"
                              title="Decline & revoke XP"
                            >
                              <ThumbsDown size={14} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* QOI Scoring Panel - Only visible when Rating */}
                      {scoringSubmission === submission.id && (
                        <div className="border-t border-border p-4 bg-surface-1 space-y-4 animate-in slide-in-from-top-2 duration-200">
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
                            onClick={() => handleScoreSubmission(submission)}
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
                      className="bg-card border border-gold/30 rounded-lg overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{submission.username}</p>
                              {submission.verification_status && <VerifiedBadge size="sm" />}
                            </div>
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
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-lg font-bold text-gold">
                                {submission.qoi_score}
                              </p>
                              <p className="text-[10px] text-green-500 uppercase">Scored</p>
                            </div>
                            <button
                              onClick={() => handleDeleteSubmission(submission)}
                              disabled={actionLoading}
                              className="p-2 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-colors"
                              title="Delete submission & revoke score"
                            >
                              <Trash2 size={16} />
                            </button>
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

            <TabsContent value="declined">
              {declinedSubmissions.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-6 text-center">
                  <ThumbsDown className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No declined submissions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {declinedSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="bg-card border border-destructive/30 rounded-lg overflow-hidden opacity-60"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{submission.username}</p>
                              {submission.verification_status && <VerifiedBadge size="sm" />}
                            </div>
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
                          <Badge variant="destructive" className="text-[10px]">
                            DECLINED
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* Verification Requests */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Verification Requests
            </h2>
            <span className="text-xs text-gold">{verificationRequests.length} pending</span>
          </div>

          {verificationRequests.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <ShieldCheck className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No pending verifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {verificationRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-card border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{req.username}</p>
                      {req.tiktok_username && (
                        <a 
                          href={`https://www.tiktok.com/@${req.tiktok_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gold text-xs hover:underline"
                        >
                          @{req.tiktok_username} →
                        </a>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono bg-surface-1 px-2 py-1 text-gold">
                          {req.verification_code}
                        </span>
                        {req.verification_requested_at && (
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(req.verification_requested_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRejectVerification(req.id)}
                        className="px-3 py-2 bg-destructive/20 text-destructive rounded-lg text-xs font-semibold"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleManualVerify(req.id)}
                        disabled={verifyingUserId === req.id}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                      >
                        <BadgeCheck size={14} />
                        {verifyingUserId === req.id ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Admin: House Management */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Home size={14} className="text-gold" />
              House Management
            </h2>
            <span className="text-xs text-gold">{houseApplications.length} pending</span>
          </div>

          {/* House Applications */}
          {houseApplications.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Applications</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {houseApplications.map((app) => (
                  <div key={app.id} className="bg-card border border-gold/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">@{app.username}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Applying to {app.house_name} • {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRejectHouseApplication(app.id)}
                          disabled={actionLoading}
                          className="p-2 bg-destructive/20 text-destructive rounded-lg"
                          title="Reject"
                        >
                          <X size={14} />
                        </button>
                        <button
                          onClick={() => handleApproveHouseApplication(app)}
                          disabled={actionLoading}
                          className="p-2 bg-green-500/20 text-green-400 rounded-lg"
                          title="Approve"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Houses List */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">All Houses</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {houses.map((house) => (
                <div 
                  key={house.id} 
                  className={`bg-card border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedHouseId === house.id ? 'border-gold' : 'border-border hover:border-gold/50'
                  }`}
                  onClick={() => fetchHouseMembers(house.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        house.type === 'prestige' ? 'bg-gold/20' : 'bg-surface-2'
                      }`}>
                        {house.type === 'prestige' ? (
                          <Crown size={14} className="text-gold" />
                        ) : (
                          <Home size={14} className="text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{house.name}</p>
                          {house.type === 'prestige' && (
                            <Badge className="bg-gold/20 text-gold text-[8px] border border-gold/50">PRESTIGE</Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {house.member_count} members • Index: <span className="text-gold">{house.house_index}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {house.type === 'prestige' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHouseId(house.id);
                            setShowInviteModal(true);
                          }}
                          className="p-2 rounded-lg bg-gold/20 text-gold hover:bg-gold/30"
                          title="Invite user"
                        >
                          <UserPlus size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchHouseMembers(house.id);
                        }}
                        className="p-2 rounded-lg bg-surface-1 hover:bg-surface-2"
                        title="View members"
                      >
                        <Users size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected House Members */}
          {selectedHouseId && houseMembers.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Members of {houses.find(h => h.id === selectedHouseId)?.name}
                </p>
                {houses.find(h => h.id === selectedHouseId)?.type === 'prestige' && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-1 text-[10px] text-gold hover:underline"
                  >
                    <UserPlus size={12} />
                    Invite
                  </button>
                )}
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto bg-surface-1 rounded-lg p-2">
                {houseMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-surface-2">
                    <div>
                      <p className="text-sm font-medium">@{member.username}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Index: {member.global_index_score?.toFixed(1) || '0'} • {member.role}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveHouseMember(member.id, member.user_id)}
                      disabled={removingMemberId === member.id}
                      className="p-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30"
                      title="Remove member"
                    >
                      {removingMemberId === member.id ? (
                        <div className="w-3 h-3 border border-destructive border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <X size={12} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Admin: Crew Management */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Crew Management</h2>
            <span className="text-xs text-muted-foreground">{crews.length} crews</span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {crews.map((crew) => (
              <div key={crew.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{crew.name}</p>
                  <p className="text-[10px] text-muted-foreground">{crew.member_count} members • @{crew.owner_username}</p>
                </div>
                <button onClick={() => setDeletingCrewId(crew.id)} className="p-2 rounded-lg bg-destructive/20 text-destructive"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </section>

        {/* Admin: User Management */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">User Management</h2>
          </div>
          <Input placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="mb-3" />
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredUsers.slice(0, 50).map((u) => (
              <div key={u.id} className={`bg-card border rounded-lg p-3 ${u.is_banned ? 'border-destructive/50' : u.is_hidden ? 'border-orange-500/50' : 'border-border'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{u.display_name || u.username}</p>
                      {u.is_banned && <Badge variant="destructive" className="text-[9px]">BANNED</Badge>}
                      {u.is_hidden && <Badge className="bg-orange-500 text-[9px]">HIDDEN</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground">@{u.username}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleToggleHidden(u.id, !u.is_hidden)} disabled={actionLoading} className={`p-2 rounded-lg ${u.is_hidden ? 'bg-orange-500 text-white' : 'bg-surface-1'}`} title={u.is_hidden ? 'Unhide' : 'Hide'}><EyeOff size={14} /></button>
                    <button onClick={() => u.is_banned ? handleBanUser(u.id, false) : setBanningUserId(u.id)} disabled={actionLoading} className={`p-2 rounded-lg ${u.is_banned ? 'bg-destructive text-white' : 'bg-surface-1 text-destructive'}`} title={u.is_banned ? 'Unban' : 'Ban'}><Ban size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Shop Management */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <ShoppingBag size={14} className="text-gold" />
              Shop Management
            </h2>
            <button
              onClick={() => setShowCreateItem(true)}
              className="flex items-center gap-1 text-xs bg-gold text-black px-3 py-1.5 rounded-lg font-semibold"
            >
              <Plus size={14} />
              Add Item
            </button>
          </div>

          {/* Shop Items */}
          <div className="space-y-2 mb-6">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Items ({shopItems.length})</p>
            {shopItems.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <ShoppingBag className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No shop items yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {shopItems.map((item) => (
                  <div key={item.id} className={`bg-card border rounded-lg p-3 ${item.is_active ? 'border-border' : 'border-muted-foreground/30 opacity-60'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center overflow-hidden">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <>
                              {item.item_type === 'cosmetic' && <Sparkles size={16} className="text-gold" />}
                              {item.item_type === 'digital' && <Gift size={16} className="text-blue-400" />}
                              {item.item_type === 'physical' && <Package size={16} className="text-green-400" />}
                            </>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{item.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="uppercase">{item.item_type}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-gold">
                              <Coins size={10} />
                              {item.price}
                            </span>
                            {item.stock !== null && (
                              <>
                                <span>•</span>
                                <span>{item.stock} left</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditItem(item)}
                          className="p-2 rounded-lg bg-surface-1 hover:bg-gold/20 text-muted-foreground hover:text-gold transition-colors"
                          title="Edit item"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleItemActive(item)}
                          className={`p-2 rounded-lg ${item.is_active ? 'bg-green-500/20 text-green-400' : 'bg-surface-1'}`}
                          title={item.is_active ? 'Hide item' : 'Show item'}
                        >
                          {item.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button
                          onClick={() => handleDeleteShopItem(item.id)}
                          className="p-2 rounded-lg bg-destructive/20 text-destructive"
                          title="Delete item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Redemption Requests */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Redemption Queue ({pendingRedemptions.length} pending, {approvedRedemptions.length} approved)
            </p>
            
            {redemptions.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <Package className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No redemptions yet</p>
              </div>
            ) : (
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-surface-1">
                  <TabsTrigger value="pending" className="text-xs">
                    Pending ({pendingRedemptions.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="text-xs">
                    Approved ({approvedRedemptions.length})
                  </TabsTrigger>
                  <TabsTrigger value="fulfilled" className="text-xs">
                    Fulfilled ({fulfilledRedemptions.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-2 mt-2 max-h-64 overflow-y-auto">
                  {pendingRedemptions.map((r) => (
                    <div key={r.id} className="bg-card border border-gold/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm">{r.item_name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            @{r.user_username} • {new Date(r.created_at).toLocaleDateString()} • <span className="text-gold">{r.points_spent} INDEX</span>
                          </p>
                        </div>
                        <Badge className={`text-[9px] ${r.item_type === 'physical' ? 'bg-green-500' : r.item_type === 'digital' ? 'bg-blue-500' : 'bg-gold text-black'}`}>
                          {(r.item_type || 'digital').toUpperCase()}
                        </Badge>
                      </div>
                      {r.shipping_info && (
                        <div className="bg-surface-2 rounded-lg p-2 mb-2 text-xs">
                          <p className="font-semibold">{r.shipping_info.name}</p>
                          <p className="text-muted-foreground">{r.shipping_info.address}, {r.shipping_info.city}, {r.shipping_info.country}</p>
                          {r.shipping_info.phone && <p className="text-muted-foreground">{r.shipping_info.phone}</p>}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleProcessRedemption(r, 'approved')}
                          disabled={processingRedemption === r.id}
                          className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                        >
                          <Check size={14} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleProcessRedemption(r, 'rejected')}
                          disabled={processingRedemption === r.id}
                          className="flex-1 py-2 bg-destructive text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                        >
                          <X size={14} />
                          Reject & Refund
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingRedemptions.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">No pending redemptions</p>
                  )}
                </TabsContent>

                <TabsContent value="approved" className="space-y-2 mt-2 max-h-64 overflow-y-auto">
                  {approvedRedemptions.map((r) => (
                    <div key={r.id} className="bg-card border border-blue-500/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm">{r.item_name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            @{r.user_username} • Approved
                          </p>
                        </div>
                      </div>
                      {r.shipping_info && (
                        <div className="bg-surface-2 rounded-lg p-2 mb-2 text-xs">
                          <p className="font-semibold">{r.shipping_info.name}</p>
                          <p className="text-muted-foreground">{r.shipping_info.address}, {r.shipping_info.city}, {r.shipping_info.country}</p>
                        </div>
                      )}
                      <button
                        onClick={() => handleProcessRedemption(r, 'fulfilled')}
                        disabled={processingRedemption === r.id}
                        className="w-full py-2 bg-gold text-black rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <Check size={14} />
                        Mark as Fulfilled
                      </button>
                    </div>
                  ))}
                  {approvedRedemptions.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">No approved redemptions awaiting fulfillment</p>
                  )}
                </TabsContent>

                <TabsContent value="fulfilled" className="space-y-2 mt-2 max-h-64 overflow-y-auto">
                  {fulfilledRedemptions.map((r) => (
                    <div key={r.id} className="bg-card border border-green-500/50 rounded-lg p-3 opacity-70">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{r.item_name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            @{r.user_username} • Fulfilled {r.fulfilled_at ? new Date(r.fulfilled_at).toLocaleDateString() : ''}
                          </p>
                        </div>
                        <Badge className="bg-green-500 text-[9px]">COMPLETE</Badge>
                      </div>
                    </div>
                  ))}
                  {fulfilledRedemptions.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">No fulfilled redemptions</p>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </section>

        {/* Invite Analytics - Quick Growth Dashboard */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Send className="w-4 h-4 text-gold" />
              Invite Analytics
            </h2>
            <span className="text-xs text-gold font-semibold">Hyper Growth Mode</span>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="font-display text-2xl">{inviteAnalytics.total_invites}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Total Sent</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="font-display text-2xl text-green-400">{inviteAnalytics.total_joined}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Joined</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="font-display text-2xl text-gold">{inviteAnalytics.total_submitted}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Submitted</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="font-display text-2xl">{inviteAnalytics.conversion_rate}%</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Conversion</p>
            </div>
          </div>

          {/* Top Recruiters */}
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              <Crown size={12} className="text-gold" />
              Top Recruiters
            </p>
            {inviteAnalytics.top_recruiters.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <UserPlus className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">No recruiters yet</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {inviteAnalytics.top_recruiters.map((recruiter, idx) => (
                  <div 
                    key={recruiter.user_id} 
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      idx === 0 ? 'bg-gold/10 border border-gold/30' : 
                      idx < 3 ? 'bg-card border border-border' : 
                      'bg-surface-1'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                        idx === 0 ? 'bg-gold text-black' : 
                        idx === 1 ? 'bg-gray-400 text-black' : 
                        idx === 2 ? 'bg-amber-700 text-white' : 
                        'bg-surface-2'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-sm">@{recruiter.username}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">{recruiter.count} sent</span>
                      <span className="text-gold font-semibold">+{recruiter.xp_earned} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Invites */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Recent Activity
            </p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {recentInvites.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-4">No invites yet</p>
              ) : (
                recentInvites.map(invite => (
                  <div 
                    key={invite.id} 
                    className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                      invite.status === 'submitted' ? 'bg-gold/5 border border-gold/20' :
                      invite.status === 'joined' ? 'bg-green-500/5 border border-green-500/20' :
                      'bg-surface-1'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-muted-foreground">{invite.invite_code}</code>
                      <span className="text-muted-foreground">by @{invite.inviter_username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {invite.invitee_username && (
                        <span className="text-green-400">→ @{invite.invitee_username}</span>
                      )}
                      <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase ${
                        invite.status === 'submitted' ? 'bg-gold/20 text-gold' :
                        invite.status === 'joined' ? 'bg-green-500/20 text-green-400' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {invite.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
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

            {/* Editor Category (Archetype) */}
            <div>
              <Label>Editor Category (Archetype)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {EDITOR_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setNewEvent({ ...newEvent, editor_category: cat.id })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      newEvent.editor_category === cat.id
                        ? 'bg-gold text-black' 
                        : 'bg-surface-1 text-muted-foreground hover:bg-surface-2'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Optional: Target specific editor archetypes</p>
            </div>

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

            {/* XP Reward */}
            <div>
              <Label htmlFor="xp-reward" className="flex items-center gap-1">
                <Sparkles size={14} className="text-gold" />
                XP Reward per Submission
              </Label>
              <Input
                id="xp-reward"
                type="number"
                min="0"
                max="500"
                value={newEvent.xp_reward}
                onChange={(e) => setNewEvent({ ...newEvent, xp_reward: Number(e.target.value) })}
                placeholder="50"
                className="mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                XP awarded when a submission is approved
              </p>
            </div>

            {/* Materials URL */}
            <div>
              <Label htmlFor="materials-url" className="flex items-center gap-1">
                <LinkIcon size={14} className="text-gold" />
                Materials / Assets URL
              </Label>
              <Input
                id="materials-url"
                type="url"
                value={newEvent.materials_url}
                onChange={(e) => setNewEvent({ ...newEvent, materials_url: e.target.value })}
                placeholder="https://drive.google.com/... or sound link"
                className="mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Link to sounds, footage, or assets for participants
              </p>
            </div>

            {/* Rules Editor */}
            <div>
              <Label className="flex items-center gap-1">
                Rules
                <span className="text-muted-foreground text-[10px]">({newEvent.rules.length} added)</span>
              </Label>
              <div className="mt-2 space-y-2">
                {newEvent.rules.map((rule, index) => (
                  <div key={index} className="flex items-center gap-2 bg-surface-1 rounded-lg px-3 py-2">
                    <span className="text-gold text-xs">•</span>
                    <span className="flex-1 text-sm">{rule}</span>
                    <button
                      type="button"
                      onClick={() => setNewEvent({ ...newEvent, rules: newEvent.rules.filter((_, i) => i !== index) })}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newRuleInput}
                    onChange={(e) => setNewRuleInput(e.target.value)}
                    placeholder="Add a rule..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newRuleInput.trim()) {
                        e.preventDefault();
                        setNewEvent({ ...newEvent, rules: [...newEvent.rules, newRuleInput.trim()] });
                        setNewRuleInput('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newRuleInput.trim()) {
                        setNewEvent({ ...newEvent, rules: [...newEvent.rules, newRuleInput.trim()] });
                        setNewRuleInput('');
                      }
                    }}
                    className="px-3 py-2 bg-gold text-black rounded-lg text-sm font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Press Enter or click Add to add rules
              </p>
            </div>

            {/* Event Mode Toggle */}
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Event Mode</Label>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setNewEvent({ ...newEvent, event_mode: 'standard' })}
                  className={`flex-1 px-3 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    newEvent.event_mode === 'standard'
                      ? 'bg-surface-2 border-2 border-border text-foreground'
                      : 'bg-surface-1 text-muted-foreground hover:bg-surface-2'
                  }`}
                >
                  <Calendar size={16} />
                  Standard
                </button>
                <button
                  onClick={() => setNewEvent({ ...newEvent, event_mode: 'open_arena' })}
                  className={`flex-1 px-3 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    newEvent.event_mode === 'open_arena'
                      ? 'bg-gold/20 border-2 border-gold text-gold'
                      : 'bg-surface-1 text-muted-foreground hover:bg-surface-2'
                  }`}
                >
                  <Zap size={16} />
                  Open Arena
                </button>
              </div>
            </div>

            {/* Open Arena Configuration */}
            {newEvent.event_mode === 'open_arena' && (
              <OpenArenaForm
                config={openArenaConfig}
                onChange={setOpenArenaConfig}
              />
            )}

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

            {/* Event Status */}
            <div>
              <Label>Event Status</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['pending', 'live', 'judging', 'finalized', 'closed'].map(status => (
                  <button
                    key={status}
                    onClick={() => setEditEvent({ ...editEvent, status })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium uppercase transition-colors ${
                      editEvent.status === status 
                        ? status === 'live' ? 'bg-green-600 text-white' :
                          status === 'judging' ? 'bg-orange-500 text-white' :
                          status === 'finalized' ? 'bg-purple-500 text-white' :
                          status === 'closed' ? 'bg-muted-foreground text-white' :
                          'bg-gold text-black'
                        : 'bg-surface-1 text-muted-foreground hover:bg-surface-2'
                    }`}
                  >
                    {status}
                  </button>
                ))}
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

            {/* XP Reward */}
            <div>
              <Label htmlFor="edit-xp-reward" className="flex items-center gap-1">
                <Sparkles size={14} className="text-gold" />
                XP Reward per Submission
              </Label>
              <Input
                id="edit-xp-reward"
                type="number"
                min="0"
                max="500"
                value={editEvent.xp_reward}
                onChange={(e) => setEditEvent({ ...editEvent, xp_reward: Number(e.target.value) })}
                placeholder="50"
                className="mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                XP awarded when a submission is approved
              </p>
            </div>

            {/* Materials URL */}
            <div>
              <Label htmlFor="edit-materials-url" className="flex items-center gap-1">
                <LinkIcon size={14} className="text-gold" />
                Materials / Assets URL
              </Label>
              <Input
                id="edit-materials-url"
                type="url"
                value={editEvent.materials_url}
                onChange={(e) => setEditEvent({ ...editEvent, materials_url: e.target.value })}
                placeholder="https://drive.google.com/... or sound link"
                className="mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Link to sounds, footage, or assets for participants
              </p>
            </div>

            {/* Rules Editor */}
            <div>
              <Label className="flex items-center gap-1">
                Rules
                <span className="text-muted-foreground text-[10px]">({editEvent.rules.length} added)</span>
              </Label>
              <div className="mt-2 space-y-2">
                {editEvent.rules.map((rule, index) => (
                  <div key={index} className="flex items-center gap-2 bg-surface-1 rounded-lg px-3 py-2">
                    <span className="text-gold text-xs">•</span>
                    <span className="flex-1 text-sm">{rule}</span>
                    <button
                      type="button"
                      onClick={() => setEditEvent({ ...editEvent, rules: editEvent.rules.filter((_, i) => i !== index) })}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={editRuleInput}
                    onChange={(e) => setEditRuleInput(e.target.value)}
                    placeholder="Add a rule..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && editRuleInput.trim()) {
                        e.preventDefault();
                        setEditEvent({ ...editEvent, rules: [...editEvent.rules, editRuleInput.trim()] });
                        setEditRuleInput('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editRuleInput.trim()) {
                        setEditEvent({ ...editEvent, rules: [...editEvent.rules, editRuleInput.trim()] });
                        setEditRuleInput('');
                      }
                    }}
                    className="px-3 py-2 bg-gold text-black rounded-lg text-sm font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Press Enter or click Add to add rules
              </p>
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

      {/* Delete Crew Confirmation */}
      <AlertDialog open={!!deletingCrewId} onOpenChange={(open) => !open && setDeletingCrewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Crew?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this crew and remove all members.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingCrewId && handleDeleteCrew(deletingCrewId)} disabled={actionLoading} className="bg-destructive text-destructive-foreground">
              {actionLoading ? 'Deleting...' : 'Delete Crew'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban User Dialog */}
      <Dialog open={!!banningUserId} onOpenChange={(open) => !open && setBanningUserId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ban User</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Reason (optional)</Label>
              <Input value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Violation of terms..." className="mt-1" />
            </div>
            <button onClick={() => banningUserId && handleBanUser(banningUserId, true)} disabled={actionLoading} className="w-full py-3 bg-destructive text-white font-bold rounded-lg">
              {actionLoading ? 'Banning...' : 'Confirm Ban'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Shop Item Dialog */}
      <Dialog open={showCreateItem} onOpenChange={(open) => {
        if (!open) {
          setShowCreateItem(false);
          setItemImageFile(null);
          setItemImagePreview(null);
        }
      }}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Shop Item</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Image Upload */}
            <div>
              <Label>Item Image</Label>
              <div className="mt-1">
                {itemImagePreview ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                    <img src={itemImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setItemImageFile(null); setItemImagePreview(null); }}
                      className="absolute top-1 right-1 p-1 bg-background/80 rounded-full"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-24 h-24 bg-surface-1 border border-dashed border-border rounded-lg cursor-pointer hover:border-gold/50 transition-colors">
                    <input type="file" accept="image/*" onChange={(e) => handleItemImageChange(e, false)} className="hidden" />
                    <div className="text-center">
                      <ImageIcon size={20} className="mx-auto text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground mt-1">Upload</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
            <div>
              <Label>Item Name *</Label>
              <Input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Discord Nitro" className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} placeholder="1 month of Discord Nitro" className="mt-1" rows={2} />
            </div>
            <div>
              <Label>Type</Label>
              <div className="flex gap-2 mt-1">
                {(['cosmetic', 'digital', 'physical'] as const).map(type => (
                  <button key={type} onClick={() => setNewItem({ ...newItem, item_type: type })} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium capitalize ${newItem.item_type === type ? 'bg-gold text-black' : 'bg-surface-1'}`}>
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price (INDEX) *</Label>
                <Input type="number" min="1" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })} className="mt-1" />
              </div>
              <div>
                <Label>Stock (empty = ∞)</Label>
                <Input type="number" min="0" value={newItem.stock || ''} onChange={(e) => setNewItem({ ...newItem, stock: e.target.value ? Number(e.target.value) : null })} className="mt-1" placeholder="∞" />
              </div>
            </div>
            <button onClick={handleCreateShopItem} disabled={creatingItem || !newItem.name} className="w-full py-3 bg-gold text-black font-bold rounded-lg disabled:opacity-50">
              {creatingItem ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Shop Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => {
        if (!open) {
          setEditingItem(null);
          setEditItemImageFile(null);
          setEditItemImagePreview(null);
        }
      }}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Shop Item</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Image Upload */}
            <div>
              <Label>Item Image</Label>
              <div className="mt-1">
                {editItemImagePreview ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                    <img src={editItemImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setEditItemImageFile(null); setEditItemImagePreview(null); }}
                      className="absolute top-1 right-1 p-1 bg-background/80 rounded-full"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-24 h-24 bg-surface-1 border border-dashed border-border rounded-lg cursor-pointer hover:border-gold/50 transition-colors">
                    <input type="file" accept="image/*" onChange={(e) => handleItemImageChange(e, true)} className="hidden" />
                    <div className="text-center">
                      <ImageIcon size={20} className="mx-auto text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground mt-1">Upload</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
            <div>
              <Label>Item Name *</Label>
              <Input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} placeholder="Discord Nitro" className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={editItem.description} onChange={(e) => setEditItem({ ...editItem, description: e.target.value })} placeholder="1 month of Discord Nitro" className="mt-1" rows={2} />
            </div>
            <div>
              <Label>Type</Label>
              <div className="flex gap-2 mt-1">
                {(['cosmetic', 'digital', 'physical'] as const).map(type => (
                  <button key={type} onClick={() => setEditItem({ ...editItem, item_type: type })} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium capitalize ${editItem.item_type === type ? 'bg-gold text-black' : 'bg-surface-1'}`}>
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price (INDEX) *</Label>
                <Input type="number" min="1" value={editItem.price} onChange={(e) => setEditItem({ ...editItem, price: Number(e.target.value) })} className="mt-1" />
              </div>
              <div>
                <Label>Stock (empty = ∞)</Label>
                <Input type="number" min="0" value={editItem.stock || ''} onChange={(e) => setEditItem({ ...editItem, stock: e.target.value ? Number(e.target.value) : null })} className="mt-1" placeholder="∞" />
              </div>
            </div>
            <button onClick={handleUpdateShopItem} disabled={updatingItem || !editItem.name} className="w-full py-3 bg-gold text-black font-bold rounded-lg disabled:opacity-50">
              {updatingItem ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite to House Dialog */}
      <Dialog open={showInviteModal} onOpenChange={(open) => {
        if (!open) {
          setShowInviteModal(false);
          setInviteUsername('');
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown size={18} className="text-gold" />
              Invite to House
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Invite a user to <span className="text-gold font-semibold">{houses.find(h => h.id === selectedHouseId)?.name}</span>
            </p>
            <div>
              <Label>Username *</Label>
              <div className="relative mt-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  value={inviteUsername} 
                  onChange={(e) => setInviteUsername(e.target.value)} 
                  placeholder="Enter username..." 
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleInviteToHouse();
                    }
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Enter the exact username (without @)
              </p>
            </div>
            <button 
              onClick={handleInviteToHouse} 
              disabled={invitingUser || !inviteUsername.trim()} 
              className="w-full py-3 bg-gold text-black font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {invitingUser ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Inviting...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Send Invite
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
