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
      activity_feed: {
        Row: {
          activity_type: string
          avatar_url: string | null
          created_at: string
          data: Json | null
          description: string | null
          id: string
          title: string
          user_id: string | null
          username: string
        }
        Insert: {
          activity_type: string
          avatar_url?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: string
          title: string
          user_id?: string | null
          username: string
        }
        Update: {
          activity_type?: string
          avatar_url?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: string
          title?: string
          user_id?: string | null
          username?: string
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
          xp_awarded: number | null
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
          xp_awarded?: number | null
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
          xp_awarded?: number | null
        }
        Relationships: []
      }
      events: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          editor_category: string | null
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
          xp_reward: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          editor_category?: string | null
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
          xp_reward?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          editor_category?: string | null
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
          xp_reward?: number | null
        }
        Relationships: []
      }
      house_applications: {
        Row: {
          created_at: string
          house_id: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          house_id: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          house_id?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "house_applications_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      house_members: {
        Row: {
          house_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["house_role"]
          user_id: string
        }
        Insert: {
          house_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["house_role"]
          user_id: string
        }
        Update: {
          house_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["house_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "house_members_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      houses: {
        Row: {
          avg_qoi: number | null
          bonuses: Json
          created_at: string
          description: string
          id: string
          lore: string | null
          member_count: number
          name: string
          prestige_level: number
          primary_color: string
          requires_approval: boolean
          secondary_color: string
          symbol: string
          type: Database["public"]["Enums"]["house_type"]
          updated_at: string
        }
        Insert: {
          avg_qoi?: number | null
          bonuses?: Json
          created_at?: string
          description: string
          id: string
          lore?: string | null
          member_count?: number
          name: string
          prestige_level?: number
          primary_color: string
          requires_approval?: boolean
          secondary_color: string
          symbol: string
          type?: Database["public"]["Enums"]["house_type"]
          updated_at?: string
        }
        Update: {
          avg_qoi?: number | null
          bonuses?: Json
          created_at?: string
          description?: string
          id?: string
          lore?: string | null
          member_count?: number
          name?: string
          prestige_level?: number
          primary_color?: string
          requires_approval?: boolean
          secondary_color?: string
          symbol?: string
          type?: Database["public"]["Enums"]["house_type"]
          updated_at?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          created_at: string
          first_submission_at: string | null
          id: string
          invite_code: string
          invite_sent_at: string
          invitee_id: string | null
          inviter_id: string
          joined_at: string | null
          status: string
          updated_at: string
          xp_awarded_join: boolean | null
          xp_awarded_send: boolean | null
          xp_awarded_submit: boolean | null
        }
        Insert: {
          created_at?: string
          first_submission_at?: string | null
          id?: string
          invite_code: string
          invite_sent_at?: string
          invitee_id?: string | null
          inviter_id: string
          joined_at?: string | null
          status?: string
          updated_at?: string
          xp_awarded_join?: boolean | null
          xp_awarded_send?: boolean | null
          xp_awarded_submit?: boolean | null
        }
        Update: {
          created_at?: string
          first_submission_at?: string | null
          id?: string
          invite_code?: string
          invite_sent_at?: string
          invitee_id?: string | null
          inviter_id?: string
          joined_at?: string | null
          status?: string
          updated_at?: string
          xp_awarded_join?: boolean | null
          xp_awarded_send?: boolean | null
          xp_awarded_submit?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_status: string | null
          archetype: string | null
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
          house_changed_at: string | null
          house_id: string | null
          id: string
          is_banned: boolean
          is_hidden: boolean
          league: Database["public"]["Enums"]["league_tier"]
          level: number
          onboarding_completed: boolean | null
          portfolio_url: string | null
          region: string | null
          rules_accepted: boolean | null
          software: string[] | null
          spendable_index: number
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
          archetype?: string | null
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
          house_changed_at?: string | null
          house_id?: string | null
          id: string
          is_banned?: boolean
          is_hidden?: boolean
          league?: Database["public"]["Enums"]["league_tier"]
          level?: number
          onboarding_completed?: boolean | null
          portfolio_url?: string | null
          region?: string | null
          rules_accepted?: boolean | null
          software?: string[] | null
          spendable_index?: number
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
          archetype?: string | null
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
          house_changed_at?: string | null
          house_id?: string | null
          id?: string
          is_banned?: boolean
          is_hidden?: boolean
          league?: Database["public"]["Enums"]["league_tier"]
          level?: number
          onboarding_completed?: boolean | null
          portfolio_url?: string | null
          region?: string | null
          rules_accepted?: boolean | null
          software?: string[] | null
          spendable_index?: number
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
          {
            foreignKeyName: "profiles_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      redemptions: {
        Row: {
          admin_notes: string | null
          created_at: string
          fulfilled_at: string | null
          fulfilled_by: string | null
          id: string
          item_id: string
          points_spent: number
          shipping_info: Json | null
          status: Database["public"]["Enums"]["redemption_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          item_id: string
          points_spent: number
          shipping_info?: Json | null
          status?: Database["public"]["Enums"]["redemption_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          item_id?: string
          points_spent?: number
          shipping_info?: Json | null
          status?: Database["public"]["Enums"]["redemption_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          item_type: Database["public"]["Enums"]["shop_item_type"]
          name: string
          price: number
          stock: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_type?: Database["public"]["Enums"]["shop_item_type"]
          name: string
          price?: number
          stock?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_type?: Database["public"]["Enums"]["shop_item_type"]
          name?: string
          price?: number
          stock?: number | null
          updated_at?: string
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
      can_change_house: { Args: { user_uuid: string }; Returns: boolean }
      can_change_username: { Args: { user_uuid: string }; Returns: boolean }
      check_invite_submission_bonus: {
        Args: { p_user_id: string }
        Returns: number
      }
      create_invite: {
        Args: { p_user_id: string }
        Returns: {
          invite_code: string
          xp_awarded: number
        }[]
      }
      days_until_username_change: {
        Args: { user_uuid: string }
        Returns: number
      }
      generate_invite_code: { Args: never; Returns: string }
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
      redeem_invite: {
        Args: { p_code: string; p_user_id: string }
        Returns: {
          inviter_xp: number
          message: string
          success: boolean
        }[]
      }
      spend_index: {
        Args: { p_amount: number; p_user_id: string }
        Returns: boolean
      }
      update_active_session: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "judge" | "dev" | "enterprise"
      crew_role: "owner" | "officer" | "member"
      house_role: "member" | "captain" | "judge"
      house_type: "public" | "prestige"
      league_tier: "open" | "pro" | "elite"
      platform_type: "tiktok" | "instagram" | "youtube"
      redemption_status: "pending" | "approved" | "fulfilled" | "rejected"
      shop_item_type: "cosmetic" | "digital" | "physical"
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
      house_role: ["member", "captain", "judge"],
      house_type: ["public", "prestige"],
      league_tier: ["open", "pro", "elite"],
      platform_type: ["tiktok", "instagram", "youtube"],
      redemption_status: ["pending", "approved", "fulfilled", "rejected"],
      shop_item_type: ["cosmetic", "digital", "physical"],
    },
  },
} as const
