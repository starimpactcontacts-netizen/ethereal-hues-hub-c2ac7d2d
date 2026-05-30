import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, ShieldCheck, Pencil, Plus, Save, Clock, Check, X,
  Trash2, AlertTriangle, ChevronRight, Send, Crown, Shield,
  Mail, KeyRound, Loader2, ExternalLink, LogOut, UserX, Eye, EyeOff,
} from "lucide-react";
import { AuthorityGavel } from "@/components/loopgate/LoopgateIcons";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCrewMembership } from "@/hooks/useCrewMembership";
import { useUserRoles } from "@/hooks/useUserRoles";
import VerificationModal from "@/components/loopgate/VerificationModal";
import EditPlatformModal from "@/components/loopgate/EditPlatformModal";
import AddPlatformModal from "@/components/loopgate/AddPlatformModal";
import ArchetypeSelector from "@/components/loopgate/ArchetypeSelector";
import SoftwareSelector from "@/components/loopgate/SoftwareSelector";
import InviteFriendsModal from "@/components/loopgate/InviteFriendsModal";
import ProfileBackgroundSettings from "@/components/loopgate/ProfileBackgroundSettings";
import AccountSecuritySection from "@/components/loopgate/AccountSecuritySection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

const platformLabels: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
};

interface EditingPlatform {
  id: string;
  platform: string;
  platform_username: string;
  platform_url: string;
  follower_count: number;
}

// ─── Reusable row components ─────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-4 pt-6 pb-2">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">{label}</span>
    </div>
  );
}

function SettingRow({
  label, value, action, actionLabel, danger = false, children,
}: {
  label: string;
  value?: string;
  action?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  danger?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05]">
      <div className="flex-1 min-w-0 mr-3">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/40 mb-0.5">{label}</p>
        {value && <p className={`text-[14px] font-medium ${danger ? 'text-red-400' : 'text-white/80'} truncate`}>{value}</p>}
        {children}
      </div>
      {action && actionLabel && (
        <button
          onClick={action}
          className={`shrink-0 text-[11px] font-bold px-3 py-1.5 border transition-colors ${
            danger
              ? 'border-red-500/40 text-red-400 hover:bg-red-500/10'
              : 'border-white/10 text-white/50 hover:text-white hover:border-white/20'
          }`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function ToggleRow({ label, description, value, onChange }: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05]">
      <div className="flex-1 mr-4">
        <p className="text-[13px] font-medium text-white/80">{label}</p>
        {description && <p className="text-[11px] text-white/35 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 ${value ? 'bg-white' : 'bg-white/10'}`}
        style={{ height: '22px', width: '40px' }}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${value ? 'translate-x-[18px] bg-black' : 'bg-white/40'}`} />
      </button>
    </div>
  );
}

function NavRow({ label, value, onClick, chevron = true }: {
  label: string;
  value?: string;
  onClick?: () => void;
  chevron?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors text-left"
    >
      <div>
        <p className="text-[13px] font-medium text-white/80">{label}</p>
        {value && <p className="text-[11px] text-white/35 mt-0.5">{value}</p>}
      </div>
      {chevron && <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function ProfileSettingsPage() {
  const navigate = useNavigate();
  const { user, profile, platforms, refreshProfile, signOut, needsPasswordSetup, updatePassword, loading: authLoading } = useAuth();
  const { primaryCrew } = useCrewMembership(profile?.id);
  const { isAnyJudge } = useUserRoles(profile?.id);

  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<EditingPlatform | null>(null);
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [bio, setBio] = useState("");
  const [discord, setDiscord] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [daysUntilUsernameChange, setDaysUntilUsernameChange] = useState(0);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [contactEdited, setContactEdited] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchetypeSelector, setShowArchetypeSelector] = useState(false);
  const [showSoftwareSelector, setShowSoftwareSelector] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [judgeBio, setJudgeBio] = useState("");
  const [judgeSpecialty, setJudgeSpecialty] = useState("");
  const [judgeEdited, setJudgeEdited] = useState(false);
  const [isSavingJudge, setIsSavingJudge] = useState(false);
  const [showBgSettings, setShowBgSettings] = useState(false);

  useEffect(() => {
    if (profile) {
      setBio((profile as any).bio || "");
      setDiscord((profile as any).discord || "");
      setPortfolioUrl((profile as any).portfolio_url || "");
      setDisplayName((profile as any).display_name || "");
      setUsername(profile.username || "");
      setJudgeBio((profile as any).judge_bio || "");
      setJudgeSpecialty((profile as any).judge_specialty || "");
      setContactEdited(false);
      setJudgeEdited(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.id) {
      supabase.rpc('days_until_username_change', { user_uuid: profile.id })
        .then(({ data }) => setDaysUntilUsernameChange(data || 0));
    }
  }, [profile?.id]);

  const verifiablePlatform = platforms.find(p => p.platform === 'tiktok')
    || platforms.find(p => p.platform === 'instagram')
    || platforms.find(p => p.platform === 'youtube');
  const canVerify = verifiablePlatform && !profile?.verification_status;

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-white/30" />
      </div>
    );
  }

  const handleSaveContact = async () => {
    if (!profile?.id) return;
    setIsSavingContact(true);
    const { error } = await supabase.from("profiles").update({
      bio: bio.trim() || null,
      discord: discord.trim() || null,
      portfolio_url: portfolioUrl.trim() || null,
      display_name: displayName.trim() || null,
    }).eq("id", profile.id);
    setIsSavingContact(false);
    if (error) { toast.error("Failed to save"); return; }
    setContactEdited(false);
    refreshProfile();
    toast.success("Saved");
  };

  const handleSaveJudge = async () => {
    if (!profile?.id) return;
    setIsSavingJudge(true);
    const { error } = await supabase.from("profiles").update({
      judge_bio: judgeBio.trim() || null,
      judge_specialty: judgeSpecialty.trim() || null,
    }).eq("id", profile.id);
    setIsSavingJudge(false);
    if (error) { toast.error("Failed to save"); return; }
    setJudgeEdited(false);
    refreshProfile();
    toast.success("Judge profile saved");
  };

  const handleSaveUsername = async () => {
    if (!profile?.id || !username.trim()) return;
    const newUsername = username.trim().toLowerCase();
    if (newUsername === profile.username) { setIsEditingUsername(false); return; }
    const { data: isAvailable } = await supabase.rpc('is_username_available', { check_username: newUsername });
    if (!isAvailable) { toast.error('Username already taken'); return; }
    setIsSavingUsername(true);
    const { error } = await supabase.from("profiles").update({
      username: newUsername,
      username_changed_at: new Date().toISOString(),
    }).eq("id", profile.id);
    setIsSavingUsername(false);
    if (error) { toast.error('Failed to update username'); return; }
    toast.success('Username updated');
    setIsEditingUsername(false);
    setDaysUntilUsernameChange(14);
    refreshProfile();
  };

  const handleDeleteAccount = async () => {
    if (!profile?.id || deleteConfirmText !== 'DELETE') return;
    setIsDeletingAccount(true);
    try {
      // Clean up profile data first
      await supabase.from('user_roles').delete().eq('user_id', profile.id);
      await supabase.from('profiles').update({ username: `deleted_${Date.now()}`, bio: null, avatar_url: null } as any).eq('id', profile.id);
      // Attempt RPC deletion
      const { error } = await supabase.rpc('delete_user_account' as any);
      if (error) {
        // Fallback: sign out so account is inaccessible
        console.error('RPC delete error:', error);
        toast.error(`Deletion error: ${error.message}. Signing you out.`);
        await signOut();
        navigate('/start');
        return;
      }
      await signOut();
      navigate('/start');
      toast.success('Account deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-[13px] text-white placeholder:text-white/25 outline-none focus:border-white/20 transition-colors";
  const textareaCls = `${inputCls} resize-none`;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b border-white/[0.07]" style={{ background: '#0a0a0a' }}>
        <button onClick={() => navigate('/profile')} className="p-1.5 -ml-1.5 text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[15px] font-black uppercase tracking-[0.15em] text-white">Settings</h1>
      </div>

      {/* ─── PROFILE ─── */}
      <SectionLabel label="Profile" />

      {/* Avatar + identity row */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.05]">
        <Avatar className="w-12 h-12 shrink-0 border border-white/10">
          <AvatarImage src={profile.avatar_url || ''} />
          <AvatarFallback className="bg-white/5 text-white font-black text-[15px]">{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-black text-white truncate">{profile.display_name || profile.username}</p>
          <p className="text-[11px] text-white/35">@{profile.username}</p>
        </div>
        <Link to="/profile" className="text-[11px] font-bold text-white/40 hover:text-white/70 border border-white/10 px-2.5 py-1.5 transition-colors">
          View →
        </Link>
      </div>

      {/* Username */}
      <div className="px-4 py-3.5 border-b border-white/[0.05]">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/40">Username</p>
          {daysUntilUsernameChange > 0 && (
            <span className="text-[9px] text-white/25 flex items-center gap-1"><Clock className="w-3 h-3" />{daysUntilUsernameChange}d cooldown</span>
          )}
        </div>
        {isEditingUsername ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className={`${inputCls} flex-1`}
              maxLength={20}
              autoFocus
            />
            <button onClick={handleSaveUsername} disabled={isSavingUsername} className="p-2 text-white/60 hover:text-white border border-white/10 transition-colors">
              {isSavingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button onClick={() => { setUsername(profile.username || ''); setIsEditingUsername(false); }} className="p-2 text-white/30 hover:text-white/60 border border-white/[0.06] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-white/80">@{profile.username}</span>
            {daysUntilUsernameChange === 0 && (
              <button onClick={() => setIsEditingUsername(true)} className="text-[11px] font-bold text-white/40 hover:text-white border border-white/10 px-2.5 py-1.5 transition-colors">Edit</button>
            )}
          </div>
        )}
      </div>

      {/* Display Name */}
      <div className="px-4 py-3.5 border-b border-white/[0.05]">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/40 mb-1.5">Display Name</p>
        <input type="text" value={displayName} onChange={(e) => { if (e.target.value.length <= 50) { setDisplayName(e.target.value); setContactEdited(true); } }}
          placeholder="Your public name" className={inputCls} />
      </div>

      {/* Bio */}
      <div className="px-4 py-3.5 border-b border-white/[0.05]">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/40">Bio</p>
          <span className="text-[9px] text-white/25">{bio.length}/200</span>
        </div>
        <textarea value={bio} onChange={(e) => { if (e.target.value.length <= 200) { setBio(e.target.value); setContactEdited(true); } }}
          placeholder="Short bio..." className={textareaCls} rows={3} />
      </div>

      {/* Discord */}
      <div className="px-4 py-3.5 border-b border-white/[0.05]">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/40 mb-1.5">Discord</p>
        <input type="text" value={discord} onChange={(e) => { setDiscord(e.target.value); setContactEdited(true); }}
          placeholder="username" className={inputCls} />
      </div>

      {/* Portfolio */}
      <div className="px-4 py-3.5 border-b border-white/[0.05]">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/40 mb-1.5">Portfolio URL</p>
        <input type="url" value={portfolioUrl} onChange={(e) => { setPortfolioUrl(e.target.value); setContactEdited(true); }}
          placeholder="https://yourportfolio.com" className={inputCls} />
      </div>

      {contactEdited && (
        <div className="px-4 py-3">
          <button onClick={handleSaveContact} disabled={isSavingContact}
            className="w-full h-10 bg-white text-black text-[12px] font-black uppercase tracking-[0.1em] disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity">
            {isSavingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSavingContact ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* ─── STYLE ─── */}
      <SectionLabel label="Style" />
      <div className="border-b border-white/[0.05]">
        {showBgSettings ? (
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-medium text-white/80">Profile Background</p>
              <button onClick={() => setShowBgSettings(false)} className="text-[11px] text-white/35 hover:text-white/60">Done</button>
            </div>
            <ProfileBackgroundSettings
              userId={profile.id}
              currentColor={(profile as any).profile_bg_color || 'gold'}
              currentImageUrl={(profile as any).profile_bg_image_url || null}
              userLevel={profile.level || 1}
              onUpdate={refreshProfile}
            />
          </div>
        ) : (
          <NavRow label="Profile Background" value="Customize your card style" onClick={() => setShowBgSettings(true)} />
        )}
      </div>

      {/* ─── COMPETITION ─── */}
      <SectionLabel label="Competition" />

      {/* Unit */}
      {primaryCrew?.crew ? (
        <NavRow label="Unit" value={primaryCrew.crew.name} onClick={() => navigate(`/units/${primaryCrew.crew_id}`)} />
      ) : (
        <NavRow label="Unit" value="Not in a unit — join one" onClick={() => navigate('/units')} />
      )}

      {/* Verification */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05]">
        <div>
          <p className="text-[13px] font-medium text-white/80">Verification</p>
          <p className="text-[11px] mt-0.5">
            {profile.verification_status
              ? <span className="text-emerald-400">✓ Verified Editor</span>
              : <span className="text-white/35">Not verified</span>}
          </p>
        </div>
        {canVerify && (
          <button onClick={() => setShowVerificationModal(true)}
            className="text-[11px] font-bold text-white border border-white/20 px-3 py-1.5 hover:bg-white/5 transition-colors">
            Verify
          </button>
        )}
      </div>

      {/* Archetype */}
      <NavRow
        label="Archetype"
        value={(profile as any).archetype ? `${(profile as any).archetype}` : 'Not set'}
        onClick={() => setShowArchetypeSelector(true)}
      />

      {/* ─── PLATFORMS ─── */}
      <SectionLabel label="Platforms" />
      {platforms.length > 0 ? (
        platforms.map((p) => (
          <button key={p.id}
            onClick={() => setEditingPlatform({ id: p.id, platform: p.platform, platform_username: p.platform_username, platform_url: p.platform_url, follower_count: p.follower_count })}
            className="w-full flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors text-left"
          >
            <div>
              <p className="text-[13px] font-medium text-white/80">{platformLabels[p.platform] || p.platform}</p>
              <p className="text-[11px] text-white/35">@{p.platform_username}</p>
            </div>
            <Pencil className="w-3.5 h-3.5 text-white/25" />
          </button>
        ))
      ) : null}
      {platforms.length < 3 && (
        <button onClick={() => setShowAddPlatform(true)}
          className="w-full flex items-center gap-2 px-4 py-3.5 border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors text-left text-[13px] text-white/40">
          <Plus className="w-4 h-4" /> Add platform
        </button>
      )}

      {/* ─── SECURITY ─── */}
      <SectionLabel label="Security" />
      <AccountSecuritySection user={user} needsPasswordSetup={needsPasswordSetup} updatePassword={updatePassword} />

      {/* ─── PRIVACY ─── */}
      <SectionLabel label="Privacy" />
      <ToggleRow
        label="Show Earnings on Profile"
        description="Let others see your total earnings"
        value={!!(profile as any).show_earnings}
        onChange={async (v) => {
          await supabase.from('profiles').update({ show_earnings: v }).eq('id', profile.id);
          refreshProfile();
          toast.success(v ? 'Earnings visible' : 'Earnings hidden');
        }}
      />

      {/* ─── JUDGE PROFILE ─── */}
      {isAnyJudge && (
        <>
          <SectionLabel label="Judge Profile" />
          <Link to={`/judge/${profile.username}`}
            className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors">
            <div>
              <p className="text-[13px] font-medium text-white/80">Your Judge Page</p>
              <p className="text-[11px] text-white/35">loopgate.gg/judge/{profile.username}</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-white/25" />
          </Link>
          <div className="px-4 py-3.5 border-b border-white/[0.05]">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/40 mb-1.5">Judge Bio</p>
            <textarea value={judgeBio} onChange={(e) => { if (e.target.value.length <= 200) { setJudgeBio(e.target.value); setJudgeEdited(true); } }}
              placeholder="What editors can expect..." className={textareaCls} rows={3} />
          </div>
          <div className="px-4 py-3.5 border-b border-white/[0.05]">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/40 mb-1.5">Specialty</p>
            <input type="text" value={judgeSpecialty} onChange={(e) => { setJudgeSpecialty(e.target.value); setJudgeEdited(true); }}
              placeholder="e.g. Film, AMV, Phonk" className={inputCls} />
          </div>
          {judgeEdited && (
            <div className="px-4 py-3">
              <button onClick={handleSaveJudge} disabled={isSavingJudge}
                className="w-full h-10 bg-white text-black text-[12px] font-black uppercase tracking-[0.1em] disabled:opacity-40 flex items-center justify-center gap-2">
                {isSavingJudge ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSavingJudge ? 'Saving...' : 'Save Judge Profile'}
              </button>
            </div>
          )}
        </>
      )}

      {/* ─── ACCOUNT ACTIONS ─── */}
      <SectionLabel label="Account" />
      <NavRow label="Invite Friends" onClick={() => setShowInviteModal(true)} />
      <button
        onClick={async () => { await signOut(); navigate('/login'); }}
        className="w-full flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <LogOut className="w-4 h-4 text-white/30" />
          <span className="text-[13px] font-medium text-white/60">Sign Out</span>
        </div>
      </button>

      {/* ─── DANGER ZONE ─── */}
      <SectionLabel label="Danger Zone" />
      {!showDeleteConfirm ? (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.05] hover:bg-red-500/5 transition-colors text-left"
        >
          <UserX className="w-4 h-4 text-red-400/60" />
          <span className="text-[13px] font-medium text-red-400/80">Delete Account</span>
        </button>
      ) : (
        <div className="px-4 py-4 border border-red-500/20 mx-4 mt-2 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-[12px] font-black text-red-400 uppercase tracking-[0.1em]">Permanent Deletion</p>
          </div>
          <p className="text-[12px] text-white/45 mb-4 leading-relaxed">
            All your battles, edits, XP, and data will be permanently gone. Type <span className="text-white font-bold">DELETE</span> to confirm.
          </p>
          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
            placeholder="Type DELETE"
            className={`${inputCls} mb-3 font-mono tracking-wider`}
            maxLength={6}
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
              className="flex-1 h-9 border border-white/10 text-[12px] font-bold text-white/40 hover:text-white/60 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
              className="flex-1 h-9 bg-red-600 text-white text-[12px] font-black uppercase tracking-[0.1em] disabled:opacity-30 transition-opacity flex items-center justify-center gap-2"
            >
              {isDeletingAccount ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {isDeletingAccount ? 'Deleting...' : 'Delete Forever'}
            </button>
          </div>
        </div>
      )}

      <div className="h-8" />

      {/* ═══ MODALS ═══ */}
      {showVerificationModal && verifiablePlatform && (
        <VerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          userId={profile.id}
          platform={verifiablePlatform.platform as "tiktok" | "instagram" | "youtube"}
          platformUsername={verifiablePlatform.platform_username}
          existingCode={(profile as any).verification_code}
          onVerified={() => { setShowVerificationModal(false); refreshProfile(); }}
        />
      )}
      {editingPlatform && (
        <EditPlatformModal
          isOpen={!!editingPlatform}
          onClose={() => setEditingPlatform(null)}
          platform={editingPlatform}
          onUpdated={() => { setEditingPlatform(null); refreshProfile(); }}
        />
      )}
      {showAddPlatform && (
        <AddPlatformModal
          isOpen={showAddPlatform}
          onClose={() => setShowAddPlatform(false)}
          userId={profile.id}
          existingPlatforms={platforms.map(p => p.platform)}
          onAdded={() => { setShowAddPlatform(false); refreshProfile(); }}
        />
      )}
      {showArchetypeSelector && (
        <ArchetypeSelector
          isOpen={showArchetypeSelector}
          onClose={() => setShowArchetypeSelector(false)}
          value={(profile as any).archetype}
          onChange={async (archetype) => {
            if (!profile?.id) return;
            await supabase.from("profiles").update({ archetype }).eq("id", profile.id);
            setShowArchetypeSelector(false);
            refreshProfile();
            toast.success("Archetype updated");
          }}
        />
      )}
      {showSoftwareSelector && (
        <SoftwareSelector
          isOpen={showSoftwareSelector}
          onClose={() => setShowSoftwareSelector(false)}
          value={(profile as any).software || []}
          onChange={async (software) => {
            if (!profile?.id) return;
            await supabase.from("profiles").update({ software }).eq("id", profile.id);
            setShowSoftwareSelector(false);
            refreshProfile();
            toast.success("Software updated");
          }}
        />
      )}
      <InviteFriendsModal open={showInviteModal} onOpenChange={setShowInviteModal} />
    </div>
  );
}
