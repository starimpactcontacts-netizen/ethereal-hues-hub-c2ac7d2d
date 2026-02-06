import { useState } from 'react';
import { Check, X, Clock, Crown, User } from 'lucide-react';
import { useAdminLeagueApplications } from '@/hooks/useLeagueApplications';
import { Input } from '@/components/ui/input';

export default function LeagueApplicationsAdmin() {
  const { applications, loading, reviewApplication } = useAdminLeagueApplications();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const pending = applications.filter(a => a.status === 'pending');
  const reviewed = applications.filter(a => a.status !== 'pending');

  if (loading) return <div className="text-xs text-muted-foreground py-4">Loading applications...</div>;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Crown size={14} className="text-emerald-400" />
          League Applications
        </h2>
        <span className="text-xs text-muted-foreground">{pending.length} pending</span>
      </div>

      {pending.length === 0 && reviewed.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">No league applications yet</p>
      )}

      {/* Pending */}
      {pending.map(app => (
        <div key={app.id} className="bg-surface-1 border border-border p-4 mb-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-surface-0 border border-border overflow-hidden flex-shrink-0">
              {app.avatar_url ? (
                <img src={app.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-full h-full p-1.5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-display text-sm">{app.username || 'Unknown'}</p>
              <p className="text-[10px] text-muted-foreground">
                {app.current_wins} wins · Applying for {app.target_league.toUpperCase()} League
              </p>
            </div>
            <Clock size={14} className="text-amber-400" />
          </div>
          <Input
            placeholder="Admin notes (optional)"
            value={notes[app.id] || ''}
            onChange={e => setNotes({ ...notes, [app.id]: e.target.value })}
            className="text-xs mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={() => reviewApplication(app.id, 'approved', notes[app.id])}
              className="flex-1 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1"
            >
              <Check size={14} /> Approve
            </button>
            <button
              onClick={() => reviewApplication(app.id, 'rejected', notes[app.id])}
              className="flex-1 py-2 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold flex items-center justify-center gap-1"
            >
              <X size={14} /> Reject
            </button>
          </div>
        </div>
      ))}

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <details className="mt-3">
          <summary className="text-[10px] text-muted-foreground cursor-pointer uppercase tracking-wider mb-2">
            {reviewed.length} reviewed applications
          </summary>
          {reviewed.map(app => (
            <div key={app.id} className="bg-surface-0 border border-border p-3 mb-1 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">{app.username}</p>
                <p className="text-[10px] text-muted-foreground">{app.target_league.toUpperCase()} · {app.current_wins} wins</p>
              </div>
              <span className={`text-[10px] uppercase font-bold ${
                app.status === 'approved' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {app.status}
              </span>
            </div>
          ))}
        </details>
      )}
    </section>
  );
}
