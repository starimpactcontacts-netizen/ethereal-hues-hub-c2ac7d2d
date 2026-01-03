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
      event_participations: {
        Row: {
          event_id: string
          final_rank: number | null
          id: string
          impact_score: number | null
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
          created_at: string | null
          end_date: string
          id: string
          ip: string | null
          league: string
          location: string | null
          poster_url: string | null
          prize_pool: string | null
          rules: string[] | null
          start_date: string
          status: string
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          ip?: string | null
          league?: string
          location?: string | null
          poster_url?: string | null
          prize_pool?: string | null
          rules?: string[] | null
          start_date: string
          status?: string
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          ip?: string | null
          league?: string
          location?: string | null
          poster_url?: string | null
          prize_pool?: string | null
          rules?: string[] | null
          start_date?: string
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          global_index_score: number | null
          id: string
          league: Database["public"]["Enums"]["league_tier"]
          onboarding_completed: boolean | null
          rules_accepted: boolean | null
          total_events: number | null
          total_wins: number | null
          updated_at: string | null
          username: string
          win_rate: number | null
        }
        Insert: {
          created_at?: string | null
          global_index_score?: number | null
          id: string
          league?: Database["public"]["Enums"]["league_tier"]
          onboarding_completed?: boolean | null
          rules_accepted?: boolean | null
          total_events?: number | null
          total_wins?: number | null
          updated_at?: string | null
          username: string
          win_rate?: number | null
        }
        Update: {
          created_at?: string | null
          global_index_score?: number | null
          id?: string
          league?: Database["public"]["Enums"]["league_tier"]
          onboarding_completed?: boolean | null
          rules_accepted?: boolean | null
          total_events?: number | null
          total_wins?: number | null
          updated_at?: string | null
          username?: string
          win_rate?: number | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_username_available: {
        Args: { check_username: string }
        Returns: boolean
      }
      recalculate_user_index: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      update_active_session: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
      league_tier: ["open", "pro", "elite"],
      platform_type: ["tiktok", "instagram", "youtube"],
    },
  },
} as const
