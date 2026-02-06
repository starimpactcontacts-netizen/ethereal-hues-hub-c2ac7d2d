import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Shield, Users, ChevronRight, ArrowUpCircle, ArrowDownCircle, UserMinus, MoreVertical, Star, Sword, Eye, UserCheck, Gavel } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

interface Member {
  id: string;
  user_id: string;
  role: "owner" | "officer" | "member";
  extended_role: "ace_editor" | "veteran" | "challenger" | "recruiter" | "judge" | null;
  joined_at: string;
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    league: string;
    xp?: number;
  } | null;
}

interface UnitRolesPanelProps {
  crewId: string;
  members: Member[];
  isOwner: boolean;
  onRefresh: () => void;
}

const ROLE_HIERARCHY = [
  { role: "owner" as const, label: "Captain", icon: <Crown className="w-4 h-4" />, color: "text-gold", bg: "bg-gold/10 border-gold/30", desc: "Full control of the Unit" },
  { role: "officer" as const, label: "Officer", icon: <Shield className="w-4 h-4" />, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30", desc: "Can manage members, announcements, applications" },
  { role: "member" as const, label: "Member", icon: <Users className="w-4 h-4" />, color: "text-muted-foreground", bg: "bg-muted/20 border-border", desc: "Standard unit member" },
];

const EXTENDED_ROLES: { id: Member["extended_role"]; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "ace_editor", label: "Ace Editor", icon: <Star className="w-3.5 h-3.5" />, color: "text-gold" },
  { id: "veteran", label: "Veteran", icon: <Shield className="w-3.5 h-3.5" />, color: "text-purple-400" },
  { id: "challenger", label: "Challenger", icon: <Sword className="w-3.5 h-3.5" />, color: "text-red-400" },
  { id: "recruiter", label: "Recruiter", icon: <UserCheck className="w-3.5 h-3.5" />, color: "text-emerald-400" },
  { id: "judge", label: "Judge", icon: <Gavel className="w-3.5 h-3.5" />, color: "text-blue-400" },
];

export default function UnitRolesPanel({ crewId, members, isOwner, onRefresh }: UnitRolesPanelProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const membersByRole = ROLE_HIERARCHY.map((rh) => ({
    ...rh,
    members: members.filter((m) => m.role === rh.role),
  }));

  const handlePromote = async (memberId: string) => {
    const { error } = await supabase.from("crew_members").update({ role: "officer" }).eq("id", memberId);
    if (error) toast.error("Failed to promote");
    else { toast.success("Promoted to Officer"); onRefresh(); }
  };

  const handleDemote = async (memberId: string) => {
    const { error } = await supabase.from("crew_members").update({ role: "member" }).eq("id", memberId);
    if (error) toast.error("Failed to demote");
    else { toast.success("Demoted to Member"); onRefresh(); }
  };

  const handleKick = async (memberId: string) => {
    const { error } = await supabase.from("crew_members").delete().eq("id", memberId);
    if (error) toast.error("Failed to kick");
    else { toast.success("Member removed"); onRefresh(); }
  };

  const handleSetExtendedRole = async (memberId: string, extRole: Member["extended_role"]) => {
    const { error } = await supabase.from("crew_members").update({ extended_role: extRole }).eq("id", memberId);
    if (error) toast.error("Failed to set role");
    else { toast.success(extRole ? `Set to ${EXTENDED_ROLES.find(r => r.id === extRole)?.label}` : "Role tag removed"); onRefresh(); }
  };

  const MemberActions = ({ member }: { member: Member }) => (
    <div className="p-4 space-y-1">
      <div className="flex items-center gap-3 px-3 py-2 mb-2">
        <Avatar className="w-10 h-10">
          <AvatarImage src={member.profile?.avatar_url || ""} />
          <AvatarFallback>{(member.profile?.username || "?")[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm">{member.profile?.display_name || member.profile?.username}</p>
          <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
        </div>
      </div>

      {member.role === "member" && (
        <button onClick={() => handlePromote(member.id)} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/30 transition-colors text-sm touch-manipulation">
          <ArrowUpCircle className="w-4 h-4 text-emerald-400" />
          Promote to Officer
        </button>
      )}
      {member.role === "officer" && (
        <button onClick={() => handleDemote(member.id)} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/30 transition-colors text-sm touch-manipulation">
          <ArrowDownCircle className="w-4 h-4 text-orange-400" />
          Demote to Member
        </button>
      )}

      <div className="px-3 py-2 mt-2">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Role Tags</p>
        <div className="flex flex-wrap gap-1.5">
          {EXTENDED_ROLES.map((er) => (
            <button
              key={er.id}
              onClick={() => handleSetExtendedRole(member.id, member.extended_role === er.id ? null : er.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all touch-manipulation ${
                member.extended_role === er.id
                  ? `${er.color} bg-current/10 border-current/30`
                  : "text-muted-foreground bg-muted/20 border-border"
              }`}
            >
              {er.icon}
              {er.label}
            </button>
          ))}
          {member.extended_role && (
            <button
              onClick={() => handleSetExtendedRole(member.id, null)}
              className="px-2.5 py-1.5 rounded-full text-xs text-muted-foreground border border-border hover:border-destructive/50 hover:text-destructive transition-colors touch-manipulation"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {member.role !== "owner" && (
        <button onClick={() => handleKick(member.id)} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-destructive/10 transition-colors text-sm text-destructive touch-manipulation mt-2">
          <UserMinus className="w-4 h-4" />
          Remove from Unit
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Hierarchy Overview */}
      <div className="bg-surface-1 border border-border rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-3">Role Hierarchy</h3>
        <div className="space-y-2">
          {ROLE_HIERARCHY.map((rh, i) => (
            <div key={rh.role} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${rh.bg} ${rh.color}`}>
                {rh.icon}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${rh.color}`}>{rh.label}</p>
                <p className="text-[11px] text-muted-foreground">{rh.desc}</p>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {members.filter((m) => m.role === rh.role).length}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Extended Roles Legend */}
      <div className="bg-surface-1 border border-border rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-3">Role Tags</h3>
        <p className="text-xs text-muted-foreground mb-3">Optional tags that add flavor. No permissions, just recognition.</p>
        <div className="flex flex-wrap gap-2">
          {EXTENDED_ROLES.map((er) => {
            const count = members.filter((m) => m.extended_role === er.id).length;
            return (
              <div key={er.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-muted/10 border-border ${er.color}`}>
                {er.icon}
                {er.label}
                {count > 0 && <span className="text-muted-foreground ml-1">({count})</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Members by Role */}
      {membersByRole.map(({ role, label, icon, color, bg, members: roleMembers }) => {
        if (roleMembers.length === 0) return null;

        return (
          <div key={role}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className={`w-6 h-6 rounded flex items-center justify-center border ${bg} ${color}`}>
                {icon}
              </div>
              <h3 className={`font-semibold text-sm ${color}`}>{label}s</h3>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{roleMembers.length}</Badge>
            </div>

            <div className="space-y-1.5">
              {roleMembers.map((member, index) => {
                const extRole = EXTENDED_ROLES.find((r) => r.id === member.extended_role);

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-card border border-border/50 rounded-lg p-3 flex items-center gap-3 active:bg-muted/20 touch-manipulation"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => navigate(`/editor/${member.user_id}`)}
                    >
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={member.profile?.avatar_url || ""} />
                        <AvatarFallback className="text-xs">{(member.profile?.username || "?")[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-sm truncate">{member.profile?.display_name || member.profile?.username}</p>
                          {extRole && (
                            <span className={`flex items-center gap-0.5 text-[10px] ${extRole.color}`}>
                              {extRole.icon}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {(member.profile?.xp || 0).toLocaleString()} XP
                          {extRole && <span className="ml-1">• {extRole.label}</span>}
                        </p>
                      </div>
                    </div>

                    {isOwner && member.role !== "owner" && (
                      isMobile ? (
                        <Drawer>
                          <DrawerTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 touch-manipulation">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </DrawerTrigger>
                          <DrawerContent>
                            <MemberActions member={member} />
                          </DrawerContent>
                        </Drawer>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {member.role === "member" && (
                              <DropdownMenuItem onClick={() => handlePromote(member.id)}>
                                <ArrowUpCircle className="w-4 h-4 mr-2 text-emerald-400" />
                                Promote to Officer
                              </DropdownMenuItem>
                            )}
                            {member.role === "officer" && (
                              <DropdownMenuItem onClick={() => handleDemote(member.id)}>
                                <ArrowDownCircle className="w-4 h-4 mr-2 text-orange-400" />
                                Demote to Member
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {EXTENDED_ROLES.map((er) => (
                              <DropdownMenuItem
                                key={er.id}
                                onClick={() => handleSetExtendedRole(member.id, member.extended_role === er.id ? null : er.id)}
                              >
                                <span className={`mr-2 ${er.color}`}>{er.icon}</span>
                                {member.extended_role === er.id ? `Remove ${er.label}` : `Tag as ${er.label}`}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleKick(member.id)} className="text-destructive">
                              <UserMinus className="w-4 h-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
