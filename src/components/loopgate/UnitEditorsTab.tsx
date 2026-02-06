import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, MoreVertical, UserMinus, ArrowUpCircle, ArrowDownCircle, Users, Shield, ChevronRight } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useCrewEditorSystem, CrewEditor, EditorTier } from "@/hooks/useCrewEditorSystem";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDistanceToNow } from "date-fns";

interface UnitEditorsTabProps {
  crewId: string;
  isOfficer: boolean;
}

export default function UnitEditorsTab({ crewId, isOfficer }: UnitEditorsTabProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { editors, tiers, removeEditor, changeEditorTier } = useCrewEditorSystem(crewId);

  const editorsByTier = tiers.map((tier) => ({
    tier,
    editors: editors.filter((e) => e.tier_id === tier.id),
  }));

  const handleChangeTier = async (editor: CrewEditor, newTier: EditorTier) => {
    if (editor.tier_id === newTier.id) return;
    await changeEditorTier(editor.id, newTier.id);
  };

  if (editors.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 opacity-30" />
        </div>
        <p className="font-medium text-sm">No Verified Editors Yet</p>
        <p className="text-xs mt-1 text-muted-foreground/60">Approve applications to add editors</p>
      </div>
    );
  }

  // Mobile editor actions drawer
  const EditorActions = ({ editor, tier }: { editor: CrewEditor; tier: EditorTier }) => (
    <div className="p-4 space-y-1">
      <div className="flex items-center gap-3 px-3 py-2 mb-2">
        <Avatar className="w-10 h-10">
          <AvatarImage src={editor.profile?.avatar_url || ""} />
          <AvatarFallback>{(editor.profile?.username || "?")[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm">{editor.profile?.display_name || editor.profile?.username}</p>
          <p className="text-xs text-muted-foreground">{tier.icon} {tier.name}</p>
        </div>
      </div>
      {tiers.map((t) => {
        if (t.id === tier.id) return null;
        const isPromotion = t.tier_order > tier.tier_order;
        return (
          <button
            key={t.id}
            onClick={() => handleChangeTier(editor, t)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/30 transition-colors text-sm touch-manipulation"
          >
            {isPromotion ? (
              <ArrowUpCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <ArrowDownCircle className="w-4 h-4 text-orange-400" />
            )}
            Move to {t.icon} {t.name}
          </button>
        );
      })}
      <button
        onClick={() => removeEditor(editor.id)}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-destructive/10 transition-colors text-sm text-destructive touch-manipulation"
      >
        <UserMinus className="w-4 h-4" />
        Remove Editor
      </button>
    </div>
  );

  return (
    <div className="space-y-5 pb-20">
      {/* Summary */}
      <div className="flex items-center gap-3 bg-surface-1 border border-border rounded-lg p-3">
        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-gold" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{editors.length} Verified Editor{editors.length !== 1 ? "s" : ""}</p>
          <p className="text-xs text-muted-foreground">{tiers.length} tier{tiers.length !== 1 ? "s" : ""} configured</p>
        </div>
      </div>

      {editorsByTier.map(({ tier, editors: tierEditors }) => {
        if (tierEditors.length === 0) return null;

        return (
          <div key={tier.id}>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-lg">{tier.icon}</span>
              <h3 className="font-semibold text-sm" style={{ color: tier.color }}>
                {tier.name}
              </h3>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {tierEditors.length}
              </Badge>
            </div>

            <div className="space-y-1.5">
              {tierEditors.map((editor, index) => (
                <motion.div
                  key={editor.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-card border border-border/50 rounded-lg p-3 flex items-center justify-between active:bg-muted/20 touch-manipulation"
                  style={{ borderLeftColor: tier.color, borderLeftWidth: 3 }}
                >
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => navigate(`/editor/${editor.user_id}`)}
                  >
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={editor.profile?.avatar_url || ""} />
                      <AvatarFallback className="text-xs">
                        {(editor.profile?.username || "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {editor.profile?.display_name || editor.profile?.username || "Unknown"}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60">
                        Verified {formatDistanceToNow(new Date(editor.approved_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {isOfficer && (
                    isMobile ? (
                      <Drawer>
                        <DrawerTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 touch-manipulation">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                          <EditorActions editor={editor} tier={tier} />
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
                          {tiers.map((t) => {
                            if (t.id === tier.id) return null;
                            const isPromotion = t.tier_order > tier.tier_order;
                            return (
                              <DropdownMenuItem
                                key={t.id}
                                onClick={() => handleChangeTier(editor, t)}
                              >
                                {isPromotion ? (
                                  <ArrowUpCircle className="w-4 h-4 mr-2 text-emerald-400" />
                                ) : (
                                  <ArrowDownCircle className="w-4 h-4 mr-2 text-orange-400" />
                                )}
                                Move to {t.name}
                              </DropdownMenuItem>
                            );
                          })}
                          <DropdownMenuItem
                            onClick={() => removeEditor(editor.id)}
                            className="text-destructive"
                          >
                            <UserMinus className="w-4 h-4 mr-2" />
                            Remove Editor
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
