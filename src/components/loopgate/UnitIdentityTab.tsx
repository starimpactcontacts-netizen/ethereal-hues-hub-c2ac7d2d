import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, Save, Swords, FileText, Palette, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  crewId: string;
  isStaff: boolean;
  rivalries: Array<{
    id: string;
    rival_crew?: {
      id: string;
      name: string;
      avatar_url: string | null;
      member_count: number;
      emblem: string;
    } | null;
  }>;
}

interface UnitIdentity {
  unit_standards: string | null;
  content_style: string | null;
  requirements_text: string | null;
}

export default function UnitIdentityTab({ crewId, isStaff, rivalries }: Props) {
  const [identity, setIdentity] = useState<UnitIdentity>({
    unit_standards: null,
    content_style: null,
    requirements_text: null,
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<UnitIdentity>({ unit_standards: null, content_style: null, requirements_text: null });

  const fetchIdentity = useCallback(async () => {
    const { data } = await supabase
      .from("crews")
      .select("unit_standards, content_style, requirements_text")
      .eq("id", crewId)
      .single();

    if (data) {
      setIdentity(data as UnitIdentity);
      setDraft(data as UnitIdentity);
    }
  }, [crewId]);

  useEffect(() => {
    fetchIdentity();
  }, [fetchIdentity]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("crews")
      .update({
        unit_standards: draft.unit_standards || null,
        content_style: draft.content_style || null,
        requirements_text: draft.requirements_text || null,
      })
      .eq("id", crewId);

    if (error) {
      toast.error("Failed to save");
    } else {
      toast.success("Unit identity updated!");
      setIdentity(draft);
      setEditing(false);
    }
    setSaving(false);
  };

  const sections = [
    {
      key: "unit_standards" as const,
      icon: <Shield className="w-4 h-4 text-gold" />,
      title: "Unit Standards",
      placeholder: "Define what your unit stands for, expectations for members, code of conduct...",
    },
    {
      key: "content_style" as const,
      icon: <Palette className="w-4 h-4 text-purple-400" />,
      title: "Content Style",
      placeholder: "Describe your editing style, preferred aesthetics, color grading, transitions...",
    },
    {
      key: "requirements_text" as const,
      icon: <Target className="w-4 h-4 text-blue-400" />,
      title: "Requirements",
      placeholder: "Minimum skill level, software requirements, posting frequency, activity expectations...",
    },
  ];

  return (
    <div className="space-y-5 pb-20">
      {/* Edit Toggle (Staff) */}
      {isStaff && (
        <div className="flex justify-end">
          {editing ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setEditing(false); setDraft(identity); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-gold text-black hover:bg-gold/90 gap-1">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Edit Identity
            </Button>
          )}
        </div>
      )}

      {/* Identity Sections */}
      {sections.map((section, index) => (
        <motion.div
          key={section.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-surface-1 border border-border rounded-xl p-4"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
            {section.icon}
            {section.title}
          </h3>

          {editing ? (
            <Textarea
              value={draft[section.key] || ""}
              onChange={(e) => setDraft({ ...draft, [section.key]: e.target.value })}
              placeholder={section.placeholder}
              className="min-h-[100px] resize-none bg-background text-sm"
            />
          ) : identity[section.key] ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {identity[section.key]}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/40 italic">
              {isStaff ? "Click 'Edit Identity' to fill this in." : "Not set yet."}
            </p>
          )}
        </motion.div>
      ))}

      {/* Rival Units */}
      <div className="bg-surface-1 border border-red-500/20 rounded-xl p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-red-400 flex items-center gap-2 mb-3">
          <Swords className="w-4 h-4" />
          Rival Units
        </h3>

        {rivalries.length === 0 ? (
          <p className="text-sm text-muted-foreground/40 italic">No rival units marked yet.</p>
        ) : (
          <div className="space-y-2">
            {rivalries.map((r) =>
              r.rival_crew ? (
                <div key={r.id} className="flex items-center gap-3 p-2 bg-background/50 rounded-lg">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={r.rival_crew.avatar_url || undefined} />
                    <AvatarFallback>{r.rival_crew.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{r.rival_crew.name}</p>
                    <p className="text-xs text-muted-foreground">{r.rival_crew.member_count} members</p>
                  </div>
                  <Swords className="w-4 h-4 text-red-400/50" />
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}
