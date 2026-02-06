import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, MoreVertical, UserMinus, ArrowUpCircle, ArrowDownCircle, Users } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCrewEditorSystem, CrewEditor, EditorTier } from "@/hooks/useCrewEditorSystem";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface UnitEditorsTabProps {
  crewId: string;
  isOfficer: boolean;
}

export default function UnitEditorsTab({ crewId, isOfficer }: UnitEditorsTabProps) {
  const navigate = useNavigate();
  const { editors, tiers, removeEditor, changeEditorTier } = useCrewEditorSystem(crewId);

  // Group editors by tier
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
      <div className="text-center py-12 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No verified editors yet</p>
        <p className="text-sm mt-1">Approve applications to add editors</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {editorsByTier.map(({ tier, editors: tierEditors }) => {
        if (tierEditors.length === 0) return null;

        return (
          <div key={tier.id}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{tier.icon}</span>
              <h3 className="font-semibold" style={{ color: tier.color }}>
                {tier.name}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {tierEditors.length}
              </Badge>
            </div>

            <div className="grid gap-2">
              {tierEditors.map((editor, index) => (
                <motion.div
                  key={editor.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-xl p-3 flex items-center justify-between"
                  style={{ borderColor: `${tier.color}20` }}
                >
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => navigate(`/editor/${editor.user_id}`)}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={editor.profile?.avatar_url || ""} />
                      <AvatarFallback>
                        {(editor.profile?.username || "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {editor.profile?.display_name || editor.profile?.username || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Verified {formatDistanceToNow(new Date(editor.approved_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {isOfficer && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
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
                                <ArrowUpCircle className="w-4 h-4 mr-2 text-green-400" />
                              ) : (
                                <ArrowDownCircle className="w-4 h-4 mr-2 text-orange-400" />
                              )}
                              Move to {t.name}
                            </DropdownMenuItem>
                          );
                        })}
                        <DropdownMenuItem
                          onClick={() => removeEditor(editor.id)}
                          className="text-red-400"
                        >
                          <UserMinus className="w-4 h-4 mr-2" />
                          Remove Editor
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
