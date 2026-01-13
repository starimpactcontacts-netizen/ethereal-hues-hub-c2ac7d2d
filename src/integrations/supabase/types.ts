export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      active_sessions: {
        Row: {
          created_at: string | null
          id: string
          last_seen: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_seen?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_seen?: string | null
          user_id?: string
        }
        Relationships: []
      }
      arena_messages: {
        Row: {
          arena_id: number
          avatar_url: string | null
          created_at: string
          id: string
          message_text: string
          user_id: string
          username: string
        }
        Insert: {
          arena_id: number
          avatar_url?: string | null
          created_at?: string
          id?: string
          message_text: string
          user_id: string
          username: string
        }
        Update: {
          arena_id?: number
          avatar_url?: string | null
          created_at?: string
          id?: string
          message_text?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      connected_platforms: {
        Row: {
          connected_at: string | null
          follower_count: number | null
          id: string
          is_verified: boolean | null
          platform: Database["public"]["Enums"]["platform_type"]
          platform_url: string
          platform_username: string
          user_id: string
        }
        Insert: {
          connected_at?: string | null
          follower_count?: number | null
          id?: string
          is_verified?: boolean | null
          platform: Database["public"]["Enums"]["platform_type"]
          platform_url: string
          platform_username: string
          user_id: string
        }
        Update: {
          connected_at?: string | null
          follower_count?: number | null
          id?: string
          is_verified?: boolean | null
          platform?: Database["public"]["Enums"]["platform_type"]
          platform_url?: string
          platform_username?: string
          user_id?: string
        }
        Relationships: []
      }
      crew_join_requests: {
        Row: {
          created_at: string
          crew_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          crew_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          crew_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_join_requests_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_members: {
        Row: {
          crew_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["crew_role"]
          user_id: string
        }
        Insert: {
          crew_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["crew_role"]
          user_id: string
        }
        Update: {
          crew_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["crew_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_members_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_messages: {
        Row: {
          avatar_url: string | null
          created_at: string
          crew_id: string
          display_name: string | null
          id: string
          message_text: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          crew_id: string
          display_name?: string | null
          id?: string
          message_text: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          crew_id?: string
          display_name?: string | null
          id?: string
          message_text?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_messages_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      crews: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          emblem: string
          id: string
          join_type: string
          member_count: number
          min_league: Database["public"]["Enums"]["league_tier"]
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          emblem?: string
          id?: string
          join_type?: string
          member_count?: number
          min_league?: Database["public"]["Enums"]["league_tier"]
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          emblem?: string
          id?: string
          join_type?: string
          member_count?: number
          min_league?: Database["public"]["Enums"]["league_tier"]
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_xp_tracking: {
        Row: {
          action_type: string
          date: string
          id: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          action_type: string
          date?: string
          id?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          action_type?: string
          date?: string
          id?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_xp_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_campaigns: {
        Row: {
          asset_urls: string[] | null
          billing_status: string | null
          budget: number | null
          created_at: string | null
          enterprise_user_id: string
          event_id: string | null
          id: string
          invoice_url: string | null
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          asset_urls?: string[] | null
          billing_status?: string | null
          budget?: number | null
          created_at?: string | null
          enterprise_user_id: string
          event_id?: string | null
          id?: string
          invoice_url?: string | null
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          asset_urls?: string[] | null
          billing_status?: string | null
          budget?: number | null
          created_at?: string | null
          enterprise_user_id?: string
          event_id?: string | null
          id?: string
          invoice_url?: string | null
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_campaigns_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participations: {
        Row: {
          event_id: string
          final_rank: number | null
          id: string
          impact_score: number | null
          judge_id: string | null
          judged_at: string | null
          originality_score: number | null
          platform: Database["public"]["Enums"]["platform_type"]
          qoi_score: number | null
          quality_score: number | null
          status: string | null
          submission_url: string
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          event_id: string
          final_rank?: number | null
          id?: string
          impact_score?: number | null
          judge_id?: string | null
          judged_at?: string | null
          originality_score?: number | null
          platform: Database["public"]["Enums"]["platform_type"]
          qoi_score?: number | null
          quality_score?: number | null
          status?: string | null
          submission_url: string
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          event_id?: string
          final_rank?: number | null
          id?: string
          impact_score?: number | null
          judge_id?: string | null
          judged_at?: string | null
          originality_score?: number | null
          platform?: Database["public"]["Enums"]["platform_type"]
          qoi_score?: number | null
          quality_score?: number | null
          status?: string | null
          submission_url?: string
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          ip: string | null
          league: string
          location: string | null
          poster_url: string | null
          prize_pool: string | null
          region_tags: string[] | null
          rules: string[] | null
          start_date: string
          status: string
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          ip?: string | null
          league?: string
          location?: string | null
          poster_url?: string | null
          prize_pool?: string | null
          region_tags?: string[] | null
          rules?: string[] | null
          start_date: string
          status?: string
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          ip?: string | null
          league?: string
          location?: string | null
          poster_url?: string | null
          prize_pool?: string | null
          region_tags?: string[] | null
          rules?: string[] | null
          start_date?: string
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      login_streaks: {
        Row: {
          current_streak: number
          id: string
          last_login_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_login_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_login_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "login_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_status: string | null
          avatar_url: string | null
          banned_at: string | null
          banned_reason: string | null
          bio: string | null
          created_at: string | null
          crew_id: string | null
          discord: string | null
          display_name: string | null
          email: string | null
          global_index_score: number | null
          id: string
          is_banned: boolean
          is_hidden: boolean
          league: Database["public"]["Enums"]["league_tier"]
          level: number
          onboarding_completed: boolean | null
          portfolio_url: string | null
          region: string | null
          rules_accepted: boolean | null
          total_events: number | null
          total_wins: number | null
          updated_at: string | null
          username: string
          username_changed_at: string | null
          verification_code: string | null
          verification_requested_at: string | null
          verification_status: boolean | null
          win_rate: number | null
          xp: number
        }
        Insert: {
          activity_status?: string | null
          avatar_url?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          bio?: string | null
          created_at?: string | null
          crew_id?: string | null
          discord?: string | null
          display_name?: string | null
          email?: string | null
          global_index_score?: number | null
          id: string
          is_banned?: boolean
          is_hidden?: boolean
          league?: Database["public"]["Enums"]["league_tier"]
          level?: number
          onboarding_completed?: boolean | null
          portfolio_url?: string | null
          region?: string | null
          rules_accepted?: boolean | null
          total_events?: number | null
          total_wins?: number | null
          updated_at?: string | null
          username: string
          username_changed_at?: string | null
          verification_code?: string | null
          verification_requested_at?: string | null
          verification_status?: boolean | null
          win_rate?: number | null
          xp?: number
        }
        Update: {
          activity_status?: string | null
          avatar_url?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          bio?: string | null
          created_at?: string | null
          crew_id?: string | null
          discord?: string | null
          display_name?: string | null
          email?: string | null
          global_index_score?: number | null
          id?: string
          is_banned?: boolean
          is_hidden?: boolean
          league?: Database["public"]["Enums"]["league_tier"]
          level?: number
          onboarding_completed?: boolean | null
          portfolio_url?: string | null
          region?: string | null
          rules_accepted?: boolean | null
          total_events?: number | null
          total_wins?: number | null
          updated_at?: string | null
          username?: string
          username_changed_at?: string | null
          verification_code?: string | null
          verification_requested_at?: string | null
          verification_status?: boolean | null
          win_rate?: number | null
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      xp_history: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          user_id: string
          xp_amount: number
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          user_id: string
          xp_amount: number
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          user_id?: string
          xp_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "xp_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_daily_capped_xp: {
        Args: {
          p_action_type: string
          p_amount: number
          p_daily_cap: number
          p_description?: string
          p_user_id: string
        }
        Returns: {
          leveled_up: boolean
          new_level: number
          new_xp: number
          xp_awarded: number
        }[]
      }
      award_xp: {
        Args: {
          p_action: string
          p_amount: number
          p_description?: string
          p_user_id: string
        }
        Returns: {
          leveled_up: boolean
          new_level: number
          new_xp: number
        }[]
      }
      calculate_level_from_xp: { Args: { xp_amount: number }; Returns: number }
      can_change_username: { Args: { user_uuid: string }; Returns: boolean }
      days_until_username_change: {
        Args: { user_uuid: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_crew_owner: {
        Args: { check_crew_id: string; check_user_id: string }
        Returns: boolean
      }
      is_crew_staff: {
        Args: { check_crew_id: string; check_user_id: string }
        Returns: boolean
      }
      is_username_available: {
        Args: { check_username: string }
        Returns: boolean
      }
      process_login_streak: {
        Args: { p_user_id: string }
        Returns: {
          current_streak: number
          leveled_up: boolean
          new_level: number
          new_xp: number
          streak_xp: number
        }[]
      }
      recalculate_user_index: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      update_active_session: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "judge" | "dev" | "enterprise"
      crew_role: "owner" | "officer" | "member"
      league_tier: "open" | "pro" | "elite"
      platform_type: "tiktok" | "instagram" | "youtube"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "judge", "dev", "enterprise"],
      crew_role: ["owner", "officer", "member"],
      league_tier: ["open", "pro", "elite"],
      platform_type: ["tiktok", "instagram", "youtube"],
    },
  },
} as const
