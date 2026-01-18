import { useState, useEffect } from 'react';
import { 
  Gavel, CheckCircle, XCircle, Clock, Video, Target, 
  ExternalLink, ChevronDown, ChevronUp, User, Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface JudgeApplication {
  id: string;
  user_id: string;
  status: string;
  video_url: string;
  video_platform: string;
  test_edit_1_score: number | null;
  test_edit_1_baseline: number | null;
  test_edit_2_score: number | null;
  test_edit_2_baseline: number | null;
  test_edit_3_score: number | null;
  test_edit_3_baseline: number | null;
  test_accuracy: number | null;
  specialty: string | null;
  experience_years: string | null;
  motivation: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  username?: string;
  avatar_url?: string;
}

export default function JudgeApplicationsSection() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JudgeApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('judge_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch usernames
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(a => a.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        setApplications(data.map(app => ({
          ...app,
          username: profileMap.get(app.user_id)?.username || 'Unknown',
          avatar_url: profileMap.get(app.user_id)?.avatar_url,
        })));
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(application: JudgeApplication) {
    setProcessingId(application.id);
    try {
      // Update application status
      const { error: updateError } = await supabase
        .from('judge_applications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', application.id);

      if (updateError) throw updateError;

      // Grant judge role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: application.user_id,
          role: 'judge',
        });

      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }

      // Update profile with specialty if provided
      if (application.specialty) {
        await supabase
          .from('profiles')
          .update({ judge_specialty: application.specialty })
          .eq('id', application.user_id);
      }

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: application.user_id,
          type: 'judge_approved',
          title: 'Welcome to the Judge Panel!',
          message: 'Your judge application has been approved. You can now review edits and rate submissions.',
          data: {},
        });

      toast.success(`Approved ${application.username} as a judge!`);
      fetchApplications();
    } catch (error: any) {
      console.error('Error approving application:', error);
      toast.error(error.message || 'Failed to approve');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(application: JudgeApplication) {
    setProcessingId(application.id);
    try {
      const { error } = await supabase
        .from('judge_applications')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          rejection_reason: rejectionReason || 'Application did not meet requirements.',
        })
        .eq('id', application.id);

      if (error) throw error;

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: application.user_id,
          type: 'judge_rejected',
          title: 'Judge Application Update',
          message: rejectionReason || 'Your application was not approved at this time. You can reapply in the future.',
          data: {},
        });

      toast.success('Application rejected');
      setShowRejectModal(null);
      setRejectionReason('');
      fetchApplications();
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      toast.error(error.message || 'Failed to reject');
    } finally {
      setProcessingId(null);
    }
  }

  const pendingApps = applications.filter(a => a.status === 'pending');
  const approvedApps = applications.filter(a => a.status === 'approved');
  const rejectedApps = applications.filter(a => a.status === 'rejected');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-1 border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{pendingApps.length}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </div>
        <div className="bg-surface-1 border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{approvedApps.length}</div>
          <div className="text-xs text-muted-foreground">Approved</div>
        </div>
        <div className="bg-surface-1 border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{rejectedApps.length}</div>
          <div className="text-xs text-muted-foreground">Rejected</div>
        </div>
      </div>

      {/* Pending Applications */}
      <div>
        <h3 className="font-display text-sm uppercase tracking-widest text-gold mb-3 flex items-center gap-2">
          <Clock size={14} />
          Pending Review ({pendingApps.length})
        </h3>
        
        {pendingApps.length === 0 ? (
          <div className="bg-surface-1 border border-border rounded-xl p-6 text-center">
            <Gavel className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No pending applications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingApps.map(app => (
              <div key={app.id} className="bg-surface-1 border border-border rounded-xl overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                  className="w-full p-4 flex items-center gap-3 text-left"
                >
                  {app.avatar_url ? (
                    <img src={app.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                      <User size={16} className="text-gold" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">@{app.username}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{app.specialty || 'No specialty'}</span>
                      <span>•</span>
                      <span>{app.experience_years || '?'} years</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                      {app.test_accuracy?.toFixed(0) || '?'}% accuracy
                    </Badge>
                    {expandedId === app.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {/* Expanded content */}
                {expandedId === app.id && (
                  <div className="border-t border-border p-4 space-y-4">
                    {/* Video link */}
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Rating Video</p>
                      <a
                        href={app.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gold hover:underline"
                      >
                        <Video size={14} />
                        <span className="truncate">{app.video_url}</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>

                    {/* Skill test scores */}
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Skill Test Scores</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map(i => {
                          const score = app[`test_edit_${i}_score` as keyof JudgeApplication] as number | null;
                          const baseline = app[`test_edit_${i}_baseline` as keyof JudgeApplication] as number | null;
                          const diff = score && baseline ? Math.abs(score - baseline) : null;
                          return (
                            <div key={i} className="bg-black/30 rounded-lg p-2 text-center">
                              <div className="text-lg font-bold">{score ?? '?'}</div>
                              <div className="text-[10px] text-muted-foreground">
                                Baseline: {baseline ?? '?'}
                              </div>
                              {diff !== null && (
                                <div className={`text-[10px] ${diff <= 10 ? 'text-green-400' : diff <= 20 ? 'text-amber-400' : 'text-red-400'}`}>
                                  {diff === 0 ? 'Perfect!' : `±${diff} off`}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Motivation */}
                    {app.motivation && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Motivation</p>
                        <p className="text-sm text-muted-foreground">{app.motivation}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleApprove(app)}
                        disabled={processingId === app.id}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => setShowRejectModal(app.id)}
                        disabled={processingId === app.id}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>

                    {/* Reject modal inline */}
                    {showRejectModal === app.id && (
                      <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-4 space-y-3">
                        <p className="text-sm font-medium text-red-400">Rejection Reason</p>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Optional reason for rejection..."
                          className="w-full bg-black/30 border border-border rounded-lg p-3 text-sm resize-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setShowRejectModal(null); setRejectionReason(''); }}
                            className="flex-1 py-2 bg-surface-1 border border-border rounded-lg text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleReject(app)}
                            disabled={processingId === app.id}
                            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                          >
                            Confirm Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recently Approved */}
      {approvedApps.length > 0 && (
        <div>
          <h3 className="font-display text-sm uppercase tracking-widest text-green-400 mb-3 flex items-center gap-2">
            <CheckCircle size={14} />
            Recently Approved ({approvedApps.length})
          </h3>
          <div className="space-y-2">
            {approvedApps.slice(0, 5).map(app => (
              <div key={app.id} className="bg-surface-1 border border-green-500/20 rounded-lg p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle size={14} className="text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">@{app.username}</p>
                  <p className="text-xs text-muted-foreground">{app.specialty || 'General'}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {app.reviewed_at ? new Date(app.reviewed_at).toLocaleDateString() : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Rejected */}
      {rejectedApps.length > 0 && (
        <div>
          <h3 className="font-display text-sm uppercase tracking-widest text-red-400 mb-3 flex items-center gap-2">
            <XCircle size={14} />
            Recently Rejected ({rejectedApps.length})
          </h3>
          <div className="space-y-2">
            {rejectedApps.slice(0, 5).map(app => (
              <div key={app.id} className="bg-surface-1 border border-red-500/20 rounded-lg p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <XCircle size={14} className="text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">@{app.username}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{app.rejection_reason || 'No reason provided'}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {app.reviewed_at ? new Date(app.reviewed_at).toLocaleDateString() : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
