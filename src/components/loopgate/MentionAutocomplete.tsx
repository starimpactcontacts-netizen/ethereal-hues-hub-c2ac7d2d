import { useEffect, useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface Member {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface MentionAutocompleteProps {
  crewId: string;
  searchQuery: string;
  onSelect: (username: string) => void;
  visible: boolean;
}

export default function MentionAutocomplete({
  crewId,
  searchQuery,
  onSelect,
  visible,
}: MentionAutocompleteProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fetch crew members on mount
  const fetchMembers = useCallback(async () => {
    const { data: membersData } = await supabase
      .from("crew_members")
      .select("user_id")
      .eq("crew_id", crewId);

    if (membersData && membersData.length > 0) {
      const userIds = membersData.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds);

      if (profiles) {
        setMembers(
          profiles.map((p) => ({
            user_id: p.id,
            username: p.username,
            display_name: p.display_name,
            avatar_url: p.avatar_url,
          }))
        );
      }
    }
  }, [crewId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Filter members based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredMembers(members.slice(0, 6));
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = members
        .filter(
          (m) =>
            m.username.toLowerCase().includes(query) ||
            m.display_name?.toLowerCase().includes(query)
        )
        .slice(0, 6);
      setFilteredMembers(filtered);
    }
    setSelectedIndex(0);
  }, [searchQuery, members]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredMembers.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        if (filteredMembers[selectedIndex]) {
          e.preventDefault();
          onSelect(filteredMembers[selectedIndex].username);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, filteredMembers, selectedIndex, onSelect]);

  if (!visible || filteredMembers.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 w-64 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50">
      <div className="p-2 border-b border-border">
        <span className="text-xs text-muted-foreground">Members matching @{searchQuery}</span>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {filteredMembers.map((member, index) => (
          <button
            key={member.user_id}
            onClick={() => onSelect(member.username)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
              index === selectedIndex
                ? "bg-primary/20"
                : "hover:bg-muted/50"
            }`}
          >
            <Avatar className="w-7 h-7">
              <AvatarImage src={member.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {(member.display_name || member.username)[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {member.display_name || member.username}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                @{member.username}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
