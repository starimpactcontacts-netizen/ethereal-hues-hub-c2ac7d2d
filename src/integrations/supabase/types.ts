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
          device_name: string | null
          id: string
          ip_address: string | null
          last_seen: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          ip_address?: string | null
          last_seen?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          ip_address?: string | null
          last_seen?: string | null
          user_agent?: string | null
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
      battle_invites: {
        Row: {
          battle_id: string
          created_at: string
          id: string
          recipient_id: string
          responded_at: string | null
          sender_avatar_url: string | null
          sender_id: string
          sender_username: string
          status: string
        }
        Insert: {
          battle_id: string
          created_at?: string
          id?: string
          recipient_id: string
          responded_at?: string | null
          sender_avatar_url?: string | null
          sender_id: string
          sender_username: string
          status?: string
        }
        Update: {
          battle_id?: string
          created_at?: string
          id?: string
          recipient_id?: string
          responded_at?: string | null
          sender_avatar_url?: string | null
          sender_id?: string
          sender_username?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_invites_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_invites_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_invites_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_views: {
        Row: {
          battle_id: string
          created_at: string
          id: string
          viewer_id: string | null
          viewer_ip: string | null
        }
        Insert: {
          battle_id: string
          created_at?: string
          id?: string
          viewer_id?: string | null
          viewer_ip?: string | null
        }
        Update: {
          battle_id?: string
          created_at?: string
          id?: string
          viewer_id?: string | null
          viewer_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "battle_views_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_votes: {
        Row: {
          battle_id: string
          created_at: string
          id: string
          user_id: string
          voted_for: string
        }
        Insert: {
          battle_id: string
          created_at?: string
          id?: string
          user_id: string
          voted_for: string
        }
        Update: {
          battle_id?: string
          created_at?: string
          id?: string
          user_id?: string
          voted_for?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_votes_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_votes_voted_for_fkey"
            columns: ["voted_for"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      battles: {
        Row: {
          accepted_at: string | null
          challenge_type: string
          challenger_avatar_url: string | null
          challenger_id: string
          challenger_score: number | null
          challenger_submission_platform: string | null
          challenger_submission_url: string | null
          challenger_submitted_at: string | null
          challenger_username: string
          challenger_votes: number
          created_at: string
          duration_hours: number
          ends_at: string | null
          id: string
          judge_claimed_at: string | null
          judge_id: string | null
          judge_notes: string | null
          judged_at: string | null
          league_tier: string
          loser_index_penalty: number | null
          opponent_avatar_url: string | null
          opponent_id: string | null
          opponent_score: number | null
          opponent_submission_platform: string | null
          opponent_submission_url: string | null
          opponent_submitted_at: string | null
          opponent_username: string | null
          opponent_votes: number
          starts_at: string | null
          status: string
          updated_at: string
          view_count: number
          winner_id: string | null
          winner_index_awarded: number | null
        }
        Insert: {
          accepted_at?: string | null
          challenge_type?: string
          challenger_avatar_url?: string | null
          challenger_id: string
          challenger_score?: number | null
          challenger_submission_platform?: string | null
          challenger_submission_url?: string | null
          challenger_submitted_at?: string | null
          challenger_username: string
          challenger_votes?: number
          created_at?: string
          duration_hours?: number
          ends_at?: string | null
          id?: string
          judge_claimed_at?: string | null
          judge_id?: string | null
          judge_notes?: string | null
          judged_at?: string | null
          league_tier?: string
          loser_index_penalty?: number | null
          opponent_avatar_url?: string | null
          opponent_id?: string | null
          opponent_score?: number | null
          opponent_submission_platform?: string | null
          opponent_submission_url?: string | null
          opponent_submitted_at?: string | null
          opponent_username?: string | null
          opponent_votes?: number
          starts_at?: string | null
          status?: string
          updated_at?: string
          view_count?: number
          winner_id?: string | null
          winner_index_awarded?: number | null
        }
        Update: {
          accepted_at?: string | null
          challenge_type?: string
          challenger_avatar_url?: string | null
          challenger_id?: string
          challenger_score?: number | null
          challenger_submission_platform?: string | null
          challenger_submission_url?: string | null
          challenger_submitted_at?: string | null
          challenger_username?: string
          challenger_votes?: number
          created_at?: string
          duration_hours?: number
          ends_at?: string | null
          id?: string
          judge_claimed_at?: string | null
          judge_id?: string | null
          judge_notes?: string | null
          judged_at?: string | null
          league_tier?: string
          loser_index_penalty?: number | null
          opponent_avatar_url?: string | null
          opponent_id?: string | null
          opponent_score?: number | null
          opponent_submission_platform?: string | null
          opponent_submission_url?: string | null
          opponent_submitted_at?: string | null
          opponent_username?: string | null
          opponent_votes?: number
          starts_at?: string | null
          status?: string
          updated_at?: string
          view_count?: number
          winner_id?: string | null
          winner_index_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "battles_challenger_id_fkey"
            columns: ["challenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battles_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battles_opponent_id_fkey"
            columns: ["opponent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battles_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      connection_request_limits: {
        Row: {
          id: string
          requests_sent: number
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          id?: string
          requests_sent?: number
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          id?: string
          requests_sent?: number
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_request_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          responded_at: string | null
          sender_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          responded_at?: string | null
          sender_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          responded_at?: string | null
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          label_1: string | null
          label_2: string | null
          last_message_at: string | null
          last_message_preview: string | null
          participant_1_id: string
          participant_2_id: string
          unread_count_1: number
          unread_count_2: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label_1?: string | null
          label_2?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          participant_1_id: string
          participant_2_id: string
          unread_count_1?: number
          unread_count_2?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label_1?: string | null
          label_2?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          participant_1_id?: string
          participant_2_id?: string
          unread_count_1?: number
          unread_count_2?: number
          updated_at?: string
        }
        Relationships: []
      }
      crew_activity: {
        Row: {
          activity_type: string
          created_at: string
          crew_id: string
          data: Json | null
          description: string | null
          id: string
          title: string
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          crew_id: string
          data?: Json | null
          description?: string | null
          id?: string
          title: string
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          crew_id?: string
          data?: Json | null
          description?: string | null
          id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_activity_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_announcement_reads: {
        Row: {
          crew_id: string
          id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          crew_id: string
          id?: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          crew_id?: string
          id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_announcement_reads_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_announcements: {
        Row: {
          author_id: string
          created_at: string
          crew_id: string
          id: string
          message: string
        }
        Insert: {
          author_id: string
          created_at?: string
          crew_id: string
          id?: string
          message: string
        }
        Update: {
          author_id?: string
          created_at?: string
          crew_id?: string
          id?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_announcements_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_assets: {
        Row: {
          asset_type: string
          asset_url: string
          created_at: string
          crew_id: string
          description: string | null
          id: string
          min_tier_order: number | null
          name: string
        }
        Insert: {
          asset_type?: string
          asset_url: string
          created_at?: string
          crew_id: string
          description?: string | null
          id?: string
          min_tier_order?: number | null
          name: string
        }
        Update: {
          asset_type?: string
          asset_url?: string
          created_at?: string
          crew_id?: string
          description?: string | null
          id?: string
          min_tier_order?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_assets_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_challenge_progress: {
        Row: {
          challenge_id: string
          completed_at: string | null
          crew_id: string
          current_value: number
          id: string
          started_at: string
          updated_at: string
          xp_claimed: boolean
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          crew_id: string
          current_value?: number
          id?: string
          started_at?: string
          updated_at?: string
          xp_claimed?: boolean
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          crew_id?: string
          current_value?: number
          id?: string
          started_at?: string
          updated_at?: string
          xp_claimed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "crew_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "crew_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_challenge_progress_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_challenge_templates: {
        Row: {
          challenge_type: string
          created_at: string
          description: string
          difficulty: string
          id: string
          is_active: boolean
          target_metric: string
          target_value: number
          title: string
          xp_reward: number
        }
        Insert: {
          challenge_type?: string
          created_at?: string
          description: string
          difficulty?: string
          id?: string
          is_active?: boolean
          target_metric: string
          target_value?: number
          title: string
          xp_reward?: number
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string
          difficulty?: string
          id?: string
          is_active?: boolean
          target_metric?: string
          target_value?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      crew_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string
          ends_at: string
          id: string
          is_active: boolean
          starts_at: string
          target_metric: string
          target_value: number
          title: string
          xp_reward: number
        }
        Insert: {
          challenge_type?: string
          created_at?: string
          description: string
          ends_at: string
          id?: string
          is_active?: boolean
          starts_at?: string
          target_metric?: string
          target_value?: number
          title: string
          xp_reward?: number
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string
          ends_at?: string
          id?: string
          is_active?: boolean
          starts_at?: string
          target_metric?: string
          target_value?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      crew_channel_messages: {
        Row: {
          avatar_url: string | null
          channel_id: string
          created_at: string
          crew_id: string
          display_name: string | null
          id: string
          is_bot: boolean | null
          is_pinned: boolean | null
          message_text: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          channel_id: string
          created_at?: string
          crew_id: string
          display_name?: string | null
          id?: string
          is_bot?: boolean | null
          is_pinned?: boolean | null
          message_text: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          channel_id?: string
          created_at?: string
          crew_id?: string
          display_name?: string | null
          id?: string
          is_bot?: boolean | null
          is_pinned?: boolean | null
          message_text?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_channel_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "crew_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_channel_messages_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_channels: {
        Row: {
          category: string | null
          category_order: number | null
          channel_order: number | null
          channel_type: string
          created_at: string
          crew_id: string
          description: string | null
          id: string
          is_editor_only: boolean | null
          is_locked: boolean | null
          min_tier_order: number | null
          name: string
        }
        Insert: {
          category?: string | null
          category_order?: number | null
          channel_order?: number | null
          channel_type?: string
          created_at?: string
          crew_id: string
          description?: string | null
          id?: string
          is_editor_only?: boolean | null
          is_locked?: boolean | null
          min_tier_order?: number | null
          name: string
        }
        Update: {
          category?: string | null
          category_order?: number | null
          channel_order?: number | null
          channel_type?: string
          created_at?: string
          crew_id?: string
          description?: string | null
          id?: string
          is_editor_only?: boolean | null
          is_locked?: boolean | null
          min_tier_order?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_channels_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_editor_applications: {
        Row: {
          avatar_url: string | null
          created_at: string
          crew_id: string
          id: string
          message: string | null
          platform: string
          proof_url: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          software_used: string | null
          status: string
          submission_url: string
          tier_id: string
          user_id: string
          username: string
          wants_feedback: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          crew_id: string
          id?: string
          message?: string | null
          platform: string
          proof_url?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          software_used?: string | null
          status?: string
          submission_url: string
          tier_id: string
          user_id: string
          username: string
          wants_feedback?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          crew_id?: string
          id?: string
          message?: string | null
          platform?: string
          proof_url?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          software_used?: string | null
          status?: string
          submission_url?: string
          tier_id?: string
          user_id?: string
          username?: string
          wants_feedback?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_editor_applications_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_editor_applications_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "crew_editor_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_editor_tiers: {
        Row: {
          application_url: string | null
          color: string | null
          created_at: string
          crew_id: string
          description: string | null
          icon: string | null
          id: string
          name: string
          perks: Json | null
          requirements: string | null
          tier_order: number
          updated_at: string
        }
        Insert: {
          application_url?: string | null
          color?: string | null
          created_at?: string
          crew_id: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          perks?: Json | null
          requirements?: string | null
          tier_order?: number
          updated_at?: string
        }
        Update: {
          application_url?: string | null
          color?: string | null
          created_at?: string
          crew_id?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          perks?: Json | null
          requirements?: string | null
          tier_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_editor_tiers_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_editors: {
        Row: {
          approved_at: string
          approved_by: string | null
          crew_id: string
          id: string
          tier_id: string
          user_id: string
        }
        Insert: {
          approved_at?: string
          approved_by?: string | null
          crew_id: string
          id?: string
          tier_id: string
          user_id: string
        }
        Update: {
          approved_at?: string
          approved_by?: string | null
          crew_id?: string
          id?: string
          tier_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_editors_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_editors_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "crew_editor_tiers"
            referencedColumns: ["id"]
          },
        ]
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
          extended_role:
            | Database["public"]["Enums"]["crew_extended_role"]
            | null
          id: string
          is_primary: boolean
          joined_at: string
          role: Database["public"]["Enums"]["crew_role"]
          user_id: string
        }
        Insert: {
          crew_id: string
          extended_role?:
            | Database["public"]["Enums"]["crew_extended_role"]
            | null
          id?: string
          is_primary?: boolean
          joined_at?: string
          role?: Database["public"]["Enums"]["crew_role"]
          user_id: string
        }
        Update: {
          crew_id?: string
          extended_role?:
            | Database["public"]["Enums"]["crew_extended_role"]
            | null
          id?: string
          is_primary?: boolean
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
      crew_rivalries: {
        Row: {
          created_at: string
          created_by: string
          crew_id: string
          id: string
          rival_crew_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          crew_id: string
          id?: string
          rival_crew_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          crew_id?: string
          id?: string
          rival_crew_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_rivalries_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_rivalries_rival_crew_id_fkey"
            columns: ["rival_crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      crews: {
        Row: {
          avatar_url: string | null
          banner_color: string | null
          banner_url: string | null
          content_style: string | null
          created_at: string
          description: string | null
          discord_url: string | null
          emblem: string
          featured_at: string | null
          id: string
          is_featured: boolean | null
          join_type: string
          max_members: number | null
          member_count: number
          min_league: Database["public"]["Enums"]["league_tier"]
          name: string
          owner_id: string
          requirements_text: string | null
          unit_standards: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          banner_color?: string | null
          banner_url?: string | null
          content_style?: string | null
          created_at?: string
          description?: string | null
          discord_url?: string | null
          emblem?: string
          featured_at?: string | null
          id?: string
          is_featured?: boolean | null
          join_type?: string
          max_members?: number | null
          member_count?: number
          min_league?: Database["public"]["Enums"]["league_tier"]
          name: string
          owner_id: string
          requirements_text?: string | null
          unit_standards?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          banner_color?: string | null
          banner_url?: string | null
          content_style?: string | null
          created_at?: string
          description?: string | null
          discord_url?: string | null
          emblem?: string
          featured_at?: string | null
          id?: string
          is_featured?: boolean | null
          join_type?: string
          max_members?: number | null
          member_count?: number
          min_league?: Database["public"]["Enums"]["league_tier"]
          name?: string
          owner_id?: string
          requirements_text?: string | null
          unit_standards?: string | null
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
      direct_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message_text: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message_text: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message_text?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
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
          thumbnail_url: string | null
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
          thumbnail_url?: string | null
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
          thumbnail_url?: string | null
          user_id?: string
          xp_awarded?: number | null
        }
        Relationships: []
      }
      event_rounds: {
        Row: {
          advancement_type: Database["public"]["Enums"]["advancement_type"]
          advancement_value: number | null
          auto_start_next: boolean | null
          bonus_multiplier: number | null
          created_at: string | null
          duration_hours: number | null
          ends_at: string | null
          event_id: string
          id: string
          index_reward: number | null
          max_submissions: number | null
          round_number: number
          round_type: Database["public"]["Enums"]["round_type"]
          show_leaderboard: boolean | null
          starts_at: string | null
          status: Database["public"]["Enums"]["round_status"] | null
          threshold_qoi: number | null
          updated_at: string | null
        }
        Insert: {
          advancement_type?: Database["public"]["Enums"]["advancement_type"]
          advancement_value?: number | null
          auto_start_next?: boolean | null
          bonus_multiplier?: number | null
          created_at?: string | null
          duration_hours?: number | null
          ends_at?: string | null
          event_id: string
          id?: string
          index_reward?: number | null
          max_submissions?: number | null
          round_number: number
          round_type?: Database["public"]["Enums"]["round_type"]
          show_leaderboard?: boolean | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["round_status"] | null
          threshold_qoi?: number | null
          updated_at?: string | null
        }
        Update: {
          advancement_type?: Database["public"]["Enums"]["advancement_type"]
          advancement_value?: number | null
          auto_start_next?: boolean | null
          bonus_multiplier?: number | null
          created_at?: string | null
          duration_hours?: number | null
          ends_at?: string | null
          event_id?: string
          id?: string
          index_reward?: number | null
          max_submissions?: number | null
          round_number?: number
          round_type?: Database["public"]["Enums"]["round_type"]
          show_leaderboard?: boolean | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["round_status"] | null
          threshold_qoi?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_rounds_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          editor_category: string | null
          end_date: string
          event_mode: Database["public"]["Enums"]["event_mode"] | null
          hide_future_rounds: boolean | null
          id: string
          ip: string | null
          league: string
          location: string | null
          materials_url: string | null
          max_editors: number | null
          poster_url: string | null
          prize_pool: string | null
          region_tags: string[] | null
          rules: string[] | null
          show_eliminated: boolean | null
          start_date: string
          status: string
          subtitle: string | null
          title: string
          total_rounds: number | null
          updated_at: string | null
          winner_logic: Database["public"]["Enums"]["winner_logic"] | null
          xp_reward: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          editor_category?: string | null
          end_date: string
          event_mode?: Database["public"]["Enums"]["event_mode"] | null
          hide_future_rounds?: boolean | null
          id?: string
          ip?: string | null
          league?: string
          location?: string | null
          materials_url?: string | null
          max_editors?: number | null
          poster_url?: string | null
          prize_pool?: string | null
          region_tags?: string[] | null
          rules?: string[] | null
          show_eliminated?: boolean | null
          start_date: string
          status?: string
          subtitle?: string | null
          title: string
          total_rounds?: number | null
          updated_at?: string | null
          winner_logic?: Database["public"]["Enums"]["winner_logic"] | null
          xp_reward?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          editor_category?: string | null
          end_date?: string
          event_mode?: Database["public"]["Enums"]["event_mode"] | null
          hide_future_rounds?: boolean | null
          id?: string
          ip?: string | null
          league?: string
          location?: string | null
          materials_url?: string | null
          max_editors?: number | null
          poster_url?: string | null
          prize_pool?: string | null
          region_tags?: string[] | null
          rules?: string[] | null
          show_eliminated?: boolean | null
          start_date?: string
          status?: string
          subtitle?: string | null
          title?: string
          total_rounds?: number | null
          updated_at?: string | null
          winner_logic?: Database["public"]["Enums"]["winner_logic"] | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      feed_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "feed_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          like_count: number
          parent_id: string | null
          reply_count: number
          submission_id: string
          submission_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          like_count?: number
          parent_id?: string | null
          reply_count?: number
          submission_id: string
          submission_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          like_count?: number
          parent_id?: string | null
          reply_count?: number
          submission_id?: string
          submission_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "feed_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      friendly_tournament_participants: {
        Row: {
          avatar_url: string | null
          bracket_position: number | null
          eliminated_at: string | null
          final_rank: number | null
          id: string
          joined_at: string
          submission_platform: string | null
          submission_url: string | null
          submitted_at: string | null
          tournament_id: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bracket_position?: number | null
          eliminated_at?: string | null
          final_rank?: number | null
          id?: string
          joined_at?: string
          submission_platform?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          tournament_id: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bracket_position?: number | null
          eliminated_at?: string | null
          final_rank?: number | null
          id?: string
          joined_at?: string
          submission_platform?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          tournament_id?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendly_tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "friendly_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      friendly_tournaments: {
        Row: {
          bracket_data: Json | null
          completed_at: string | null
          created_at: string
          creator_id: string
          current_players: number
          description: string | null
          duration_minutes: number
          id: string
          judge_id: string | null
          judge_username: string | null
          max_players: number
          name: string
          started_at: string | null
          status: string
        }
        Insert: {
          bracket_data?: Json | null
          completed_at?: string | null
          created_at?: string
          creator_id: string
          current_players?: number
          description?: string | null
          duration_minutes?: number
          id?: string
          judge_id?: string | null
          judge_username?: string | null
          max_players?: number
          name: string
          started_at?: string | null
          status?: string
        }
        Update: {
          bracket_data?: Json | null
          completed_at?: string | null
          created_at?: string
          creator_id?: string
          current_players?: number
          description?: string | null
          duration_minutes?: number
          id?: string
          judge_id?: string | null
          judge_username?: string | null
          max_players?: number
          name?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      gatekeeper_submissions: {
        Row: {
          age_range: string | null
          confidence_level: number | null
          created_at: string
          creativity_score: number | null
          editing_goal: string | null
          editing_software: string | null
          editing_speed: string | null
          editing_style: string | null
          editor_type: string | null
          emotional_score: number | null
          gqt_rank: string | null
          house_fit: Json | null
          id: string
          impact_score: number | null
          judge_archetype: string | null
          judge_commentary: string | null
          judge_id: string | null
          judged_at: string | null
          originality_score: number | null
          platform: string
          qoi_score: number | null
          quality_score: number | null
          rank_projection: string | null
          rhythm_score: number | null
          status: string
          style_score: number | null
          submission_url: string
          suggested_action: string | null
          technical_score: number | null
          test_purpose: string | null
          updated_at: string
          user_id: string
          years_editing: string | null
        }
        Insert: {
          age_range?: string | null
          confidence_level?: number | null
          created_at?: string
          creativity_score?: number | null
          editing_goal?: string | null
          editing_software?: string | null
          editing_speed?: string | null
          editing_style?: string | null
          editor_type?: string | null
          emotional_score?: number | null
          gqt_rank?: string | null
          house_fit?: Json | null
          id?: string
          impact_score?: number | null
          judge_archetype?: string | null
          judge_commentary?: string | null
          judge_id?: string | null
          judged_at?: string | null
          originality_score?: number | null
          platform: string
          qoi_score?: number | null
          quality_score?: number | null
          rank_projection?: string | null
          rhythm_score?: number | null
          status?: string
          style_score?: number | null
          submission_url: string
          suggested_action?: string | null
          technical_score?: number | null
          test_purpose?: string | null
          updated_at?: string
          user_id: string
          years_editing?: string | null
        }
        Update: {
          age_range?: string | null
          confidence_level?: number | null
          created_at?: string
          creativity_score?: number | null
          editing_goal?: string | null
          editing_software?: string | null
          editing_speed?: string | null
          editing_style?: string | null
          editor_type?: string | null
          emotional_score?: number | null
          gqt_rank?: string | null
          house_fit?: Json | null
          id?: string
          impact_score?: number | null
          judge_archetype?: string | null
          judge_commentary?: string | null
          judge_id?: string | null
          judged_at?: string | null
          originality_score?: number | null
          platform?: string
          qoi_score?: number | null
          quality_score?: number | null
          rank_projection?: string | null
          rhythm_score?: number | null
          status?: string
          style_score?: number | null
          submission_url?: string
          suggested_action?: string | null
          technical_score?: number | null
          test_purpose?: string | null
          updated_at?: string
          user_id?: string
          years_editing?: string | null
        }
        Relationships: []
      }
      hosted_comp_messages: {
        Row: {
          avatar_url: string | null
          competition_id: string
          created_at: string
          id: string
          is_system: boolean | null
          message_text: string
          message_type: string | null
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          competition_id: string
          created_at?: string
          id?: string
          is_system?: boolean | null
          message_text: string
          message_type?: string | null
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          competition_id?: string
          created_at?: string
          id?: string
          is_system?: boolean | null
          message_text?: string
          message_type?: string | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "hosted_comp_messages_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "hosted_competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      hosted_competition_judges: {
        Row: {
          accepted_at: string | null
          avatar_url: string | null
          competition_id: string
          id: string
          invited_at: string
          invited_by: string
          status: string
          user_id: string
          username: string
        }
        Insert: {
          accepted_at?: string | null
          avatar_url?: string | null
          competition_id: string
          id?: string
          invited_at?: string
          invited_by: string
          status?: string
          user_id: string
          username: string
        }
        Update: {
          accepted_at?: string | null
          avatar_url?: string | null
          competition_id?: string
          id?: string
          invited_at?: string
          invited_by?: string
          status?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "hosted_competition_judges_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "hosted_competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      hosted_competition_participants: {
        Row: {
          avatar_url: string | null
          competition_id: string
          id: string
          is_ready: boolean | null
          joined_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          competition_id: string
          id?: string
          is_ready?: boolean | null
          joined_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          competition_id?: string
          id?: string
          is_ready?: boolean | null
          joined_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "hosted_competition_participants_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "hosted_competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      hosted_competition_submissions: {
        Row: {
          avatar_url: string | null
          competition_id: string
          creativity_score: number | null
          final_rank: number | null
          id: string
          impact_score: number | null
          is_winner: boolean | null
          judge_notes: string | null
          platform: string
          quality_score: number | null
          score: number | null
          scored_at: string | null
          scored_by: string | null
          submission_url: string
          submitted_at: string
          user_id: string
          username: string
          winner_place: number | null
        }
        Insert: {
          avatar_url?: string | null
          competition_id: string
          creativity_score?: number | null
          final_rank?: number | null
          id?: string
          impact_score?: number | null
          is_winner?: boolean | null
          judge_notes?: string | null
          platform: string
          quality_score?: number | null
          score?: number | null
          scored_at?: string | null
          scored_by?: string | null
          submission_url: string
          submitted_at?: string
          user_id: string
          username: string
          winner_place?: number | null
        }
        Update: {
          avatar_url?: string | null
          competition_id?: string
          creativity_score?: number | null
          final_rank?: number | null
          id?: string
          impact_score?: number | null
          is_winner?: boolean | null
          judge_notes?: string | null
          platform?: string
          quality_score?: number | null
          score?: number | null
          scored_at?: string | null
          scored_by?: string | null
          submission_url?: string
          submitted_at?: string
          user_id?: string
          username?: string
          winner_place?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hosted_competition_submissions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "hosted_competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      hosted_competitions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          community_url: string | null
          created_at: string
          description: string | null
          featured_at: string | null
          format: string
          host_avatar_url: string | null
          host_crew_id: string | null
          host_name: string
          host_user_id: string
          id: string
          is_featured: boolean | null
          is_premium: boolean | null
          is_trending: boolean | null
          max_submissions: number | null
          name: string
          participant_count: number | null
          poster_url: string | null
          poster_urls: string[] | null
          premium_at: string | null
          premium_steps: Json | null
          prize_description: string | null
          rejection_reason: string | null
          rules: string | null
          slug: string | null
          status: string
          submission_deadline: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          community_url?: string | null
          created_at?: string
          description?: string | null
          featured_at?: string | null
          format?: string
          host_avatar_url?: string | null
          host_crew_id?: string | null
          host_name: string
          host_user_id: string
          id?: string
          is_featured?: boolean | null
          is_premium?: boolean | null
          is_trending?: boolean | null
          max_submissions?: number | null
          name: string
          participant_count?: number | null
          poster_url?: string | null
          poster_urls?: string[] | null
          premium_at?: string | null
          premium_steps?: Json | null
          prize_description?: string | null
          rejection_reason?: string | null
          rules?: string | null
          slug?: string | null
          status?: string
          submission_deadline: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          community_url?: string | null
          created_at?: string
          description?: string | null
          featured_at?: string | null
          format?: string
          host_avatar_url?: string | null
          host_crew_id?: string | null
          host_name?: string
          host_user_id?: string
          id?: string
          is_featured?: boolean | null
          is_premium?: boolean | null
          is_trending?: boolean | null
          max_submissions?: number | null
          name?: string
          participant_count?: number | null
          poster_url?: string | null
          poster_urls?: string[] | null
          premium_at?: string | null
          premium_steps?: Json | null
          prize_description?: string | null
          rejection_reason?: string | null
          rules?: string | null
          slug?: string | null
          status?: string
          submission_deadline?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hosted_competitions_host_crew_id_fkey"
            columns: ["host_crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
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
      judge_applications: {
        Row: {
          admin_notes: string | null
          bio: string | null
          created_at: string
          experience_years: string | null
          id: string
          judging_experience: string | null
          motivation: string | null
          portfolio_url: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          specialty: string | null
          status: string
          test_accuracy: number | null
          test_edit_1_baseline: number | null
          test_edit_1_score: number | null
          test_edit_2_baseline: number | null
          test_edit_2_score: number | null
          test_edit_3_baseline: number | null
          test_edit_3_score: number | null
          updated_at: string
          user_id: string
          video_platform: string | null
          video_url: string | null
        }
        Insert: {
          admin_notes?: string | null
          bio?: string | null
          created_at?: string
          experience_years?: string | null
          id?: string
          judging_experience?: string | null
          motivation?: string | null
          portfolio_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialty?: string | null
          status?: string
          test_accuracy?: number | null
          test_edit_1_baseline?: number | null
          test_edit_1_score?: number | null
          test_edit_2_baseline?: number | null
          test_edit_2_score?: number | null
          test_edit_3_baseline?: number | null
          test_edit_3_score?: number | null
          updated_at?: string
          user_id: string
          video_platform?: string | null
          video_url?: string | null
        }
        Update: {
          admin_notes?: string | null
          bio?: string | null
          created_at?: string
          experience_years?: string | null
          id?: string
          judging_experience?: string | null
          motivation?: string | null
          portfolio_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialty?: string | null
          status?: string
          test_accuracy?: number | null
          test_edit_1_baseline?: number | null
          test_edit_1_score?: number | null
          test_edit_2_baseline?: number | null
          test_edit_2_score?: number | null
          test_edit_3_baseline?: number | null
          test_edit_3_score?: number | null
          updated_at?: string
          user_id?: string
          video_platform?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      judge_badges: {
        Row: {
          color: string
          description: string | null
          emoji: string
          id: string
          label: string
        }
        Insert: {
          color?: string
          description?: string | null
          emoji: string
          id: string
          label: string
        }
        Update: {
          color?: string
          description?: string | null
          emoji?: string
          id?: string
          label?: string
        }
        Relationships: []
      }
      judge_rating_videos: {
        Row: {
          bonus_xp_awarded: number | null
          current_views: number | null
          id: string
          judge_id: string
          platform: string
          submitted_at: string
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          video_url: string
          views_at_submission: number | null
          viral_bonus_awarded: boolean | null
        }
        Insert: {
          bonus_xp_awarded?: number | null
          current_views?: number | null
          id?: string
          judge_id: string
          platform: string
          submitted_at?: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          video_url: string
          views_at_submission?: number | null
          viral_bonus_awarded?: boolean | null
        }
        Update: {
          bonus_xp_awarded?: number | null
          current_views?: number | null
          id?: string
          judge_id?: string
          platform?: string
          submitted_at?: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          video_url?: string
          views_at_submission?: number | null
          viral_bonus_awarded?: boolean | null
        }
        Relationships: []
      }
      login_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used_at?: string | null
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
      practice_matches: {
        Row: {
          compensation_xp_awarded: number | null
          created_at: string
          duration_minutes: number
          ends_at: string | null
          id: string
          judge_auto_assigned: boolean | null
          judge_claimed_at: string | null
          judge_id: string | null
          judge_notes: string | null
          judged_at: string | null
          loser_xp_awarded: number | null
          match_type: string
          matched_at: string | null
          player_1_id: string
          player_1_platform: string | null
          player_1_score: number | null
          player_1_submission_url: string | null
          player_1_submitted_at: string | null
          player_2_id: string | null
          player_2_platform: string | null
          player_2_score: number | null
          player_2_submission_url: string | null
          player_2_submitted_at: string | null
          starts_at: string | null
          status: string
          updated_at: string
          winner_id: string | null
          winner_xp_awarded: number | null
        }
        Insert: {
          compensation_xp_awarded?: number | null
          created_at?: string
          duration_minutes?: number
          ends_at?: string | null
          id?: string
          judge_auto_assigned?: boolean | null
          judge_claimed_at?: string | null
          judge_id?: string | null
          judge_notes?: string | null
          judged_at?: string | null
          loser_xp_awarded?: number | null
          match_type?: string
          matched_at?: string | null
          player_1_id: string
          player_1_platform?: string | null
          player_1_score?: number | null
          player_1_submission_url?: string | null
          player_1_submitted_at?: string | null
          player_2_id?: string | null
          player_2_platform?: string | null
          player_2_score?: number | null
          player_2_submission_url?: string | null
          player_2_submitted_at?: string | null
          starts_at?: string | null
          status?: string
          updated_at?: string
          winner_id?: string | null
          winner_xp_awarded?: number | null
        }
        Update: {
          compensation_xp_awarded?: number | null
          created_at?: string
          duration_minutes?: number
          ends_at?: string | null
          id?: string
          judge_auto_assigned?: boolean | null
          judge_claimed_at?: string | null
          judge_id?: string | null
          judge_notes?: string | null
          judged_at?: string | null
          loser_xp_awarded?: number | null
          match_type?: string
          matched_at?: string | null
          player_1_id?: string
          player_1_platform?: string | null
          player_1_score?: number | null
          player_1_submission_url?: string | null
          player_1_submitted_at?: string | null
          player_2_id?: string | null
          player_2_platform?: string | null
          player_2_score?: number | null
          player_2_submission_url?: string | null
          player_2_submitted_at?: string | null
          starts_at?: string | null
          status?: string
          updated_at?: string
          winner_id?: string | null
          winner_xp_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_matches_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_matches_player_1_id_fkey"
            columns: ["player_1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_matches_player_2_id_fkey"
            columns: ["player_2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_queue: {
        Row: {
          duration_minutes: number
          expires_at: string
          id: string
          match_type: string
          queued_at: string
          skill_tier: string
          user_id: string
        }
        Insert: {
          duration_minutes?: number
          expires_at?: string
          id?: string
          match_type?: string
          queued_at?: string
          skill_tier?: string
          user_id: string
        }
        Update: {
          duration_minutes?: number
          expires_at?: string
          id?: string
          match_type?: string
          queued_at?: string
          skill_tier?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_queue_user_id_fkey"
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
          archetype: string | null
          avatar_url: string | null
          banned_at: string | null
          banned_reason: string | null
          best_gatekeeper_qoi: number | null
          bio: string | null
          connection_count: number
          created_at: string | null
          crew_id: string | null
          discord: string | null
          display_name: string | null
          email: string | null
          global_index_score: number | null
          has_password: boolean | null
          house_changed_at: string | null
          house_id: string | null
          id: string
          is_banned: boolean
          is_founding_member: boolean | null
          is_hidden: boolean
          judge_badge: string | null
          judge_bio: string | null
          judge_review_count: number
          judge_specialty: string | null
          judge_xp: number
          league: Database["public"]["Enums"]["league_tier"]
          level: number
          onboarding_completed: boolean | null
          portfolio_url: string | null
          primary_crew_changed_at: string | null
          profile_bg_color: string | null
          profile_bg_image_url: string | null
          recovery_code: string | null
          region: string | null
          review_style: string | null
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
          best_gatekeeper_qoi?: number | null
          bio?: string | null
          connection_count?: number
          created_at?: string | null
          crew_id?: string | null
          discord?: string | null
          display_name?: string | null
          email?: string | null
          global_index_score?: number | null
          has_password?: boolean | null
          house_changed_at?: string | null
          house_id?: string | null
          id: string
          is_banned?: boolean
          is_founding_member?: boolean | null
          is_hidden?: boolean
          judge_badge?: string | null
          judge_bio?: string | null
          judge_review_count?: number
          judge_specialty?: string | null
          judge_xp?: number
          league?: Database["public"]["Enums"]["league_tier"]
          level?: number
          onboarding_completed?: boolean | null
          portfolio_url?: string | null
          primary_crew_changed_at?: string | null
          profile_bg_color?: string | null
          profile_bg_image_url?: string | null
          recovery_code?: string | null
          region?: string | null
          review_style?: string | null
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
          best_gatekeeper_qoi?: number | null
          bio?: string | null
          connection_count?: number
          created_at?: string | null
          crew_id?: string | null
          discord?: string | null
          display_name?: string | null
          email?: string | null
          global_index_score?: number | null
          has_password?: boolean | null
          house_changed_at?: string | null
          house_id?: string | null
          id?: string
          is_banned?: boolean
          is_founding_member?: boolean | null
          is_hidden?: boolean
          judge_badge?: string | null
          judge_bio?: string | null
          judge_review_count?: number
          judge_specialty?: string | null
          judge_xp?: number
          league?: Database["public"]["Enums"]["league_tier"]
          level?: number
          onboarding_completed?: boolean | null
          portfolio_url?: string | null
          primary_crew_changed_at?: string | null
          profile_bg_color?: string | null
          profile_bg_image_url?: string | null
          recovery_code?: string | null
          region?: string | null
          review_style?: string | null
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
      review_requests: {
        Row: {
          avatar_url: string | null
          claimed_at: string | null
          created_at: string
          creativity_score: number | null
          emotion_score: number | null
          execution_score: number | null
          id: string
          identity_score: number | null
          judge_avatar_url: string | null
          judge_comment: string | null
          judge_id: string | null
          judge_username: string | null
          platform: string
          rating_mode: string | null
          requested_at: string
          reviewed_at: string | null
          selected_tier: string | null
          status: string
          submission_url: string
          sync_score: number | null
          total_score: number | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          claimed_at?: string | null
          created_at?: string
          creativity_score?: number | null
          emotion_score?: number | null
          execution_score?: number | null
          id?: string
          identity_score?: number | null
          judge_avatar_url?: string | null
          judge_comment?: string | null
          judge_id?: string | null
          judge_username?: string | null
          platform: string
          rating_mode?: string | null
          requested_at?: string
          reviewed_at?: string | null
          selected_tier?: string | null
          status?: string
          submission_url: string
          sync_score?: number | null
          total_score?: number | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          claimed_at?: string | null
          created_at?: string
          creativity_score?: number | null
          emotion_score?: number | null
          execution_score?: number | null
          id?: string
          identity_score?: number | null
          judge_avatar_url?: string | null
          judge_comment?: string | null
          judge_id?: string | null
          judge_username?: string | null
          platform?: string
          rating_mode?: string | null
          requested_at?: string
          reviewed_at?: string | null
          selected_tier?: string | null
          status?: string
          submission_url?: string
          sync_score?: number | null
          total_score?: number | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      review_styles: {
        Row: {
          description: string | null
          id: string
          label: string
          pillars: Json
        }
        Insert: {
          description?: string | null
          id: string
          label: string
          pillars?: Json
        }
        Update: {
          description?: string | null
          id?: string
          label?: string
          pillars?: Json
        }
        Relationships: []
      }
      round_participations: {
        Row: {
          created_at: string | null
          cumulative_qoi: number | null
          event_id: string
          id: string
          impact_score: number | null
          judge_id: string | null
          judged_at: string | null
          originality_score: number | null
          platform: Database["public"]["Enums"]["platform_type"] | null
          qoi_score: number | null
          quality_score: number | null
          round_number: number
          status: Database["public"]["Enums"]["participant_status"] | null
          submission_url: string | null
          submitted_at: string | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
          xp_awarded: number | null
        }
        Insert: {
          created_at?: string | null
          cumulative_qoi?: number | null
          event_id: string
          id?: string
          impact_score?: number | null
          judge_id?: string | null
          judged_at?: string | null
          originality_score?: number | null
          platform?: Database["public"]["Enums"]["platform_type"] | null
          qoi_score?: number | null
          quality_score?: number | null
          round_number: number
          status?: Database["public"]["Enums"]["participant_status"] | null
          submission_url?: string | null
          submitted_at?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
          xp_awarded?: number | null
        }
        Update: {
          created_at?: string | null
          cumulative_qoi?: number | null
          event_id?: string
          id?: string
          impact_score?: number | null
          judge_id?: string | null
          judged_at?: string | null
          originality_score?: number | null
          platform?: Database["public"]["Enums"]["platform_type"] | null
          qoi_score?: number | null
          quality_score?: number | null
          round_number?: number
          status?: Database["public"]["Enums"]["participant_status"] | null
          submission_url?: string | null
          submitted_at?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
          xp_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "round_participations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      sanctioned_tournament_participants: {
        Row: {
          avatar_url: string | null
          bracket_position: number | null
          eliminated_at: string | null
          final_rank: number | null
          id: string
          is_ready: boolean
          joined_at: string
          qoi_score: number | null
          ready_at: string | null
          submission_platform: string | null
          submission_url: string | null
          submitted_at: string | null
          thumbnail_url: string | null
          tournament_id: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bracket_position?: number | null
          eliminated_at?: string | null
          final_rank?: number | null
          id?: string
          is_ready?: boolean
          joined_at?: string
          qoi_score?: number | null
          ready_at?: string | null
          submission_platform?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          thumbnail_url?: string | null
          tournament_id: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bracket_position?: number | null
          eliminated_at?: string | null
          final_rank?: number | null
          id?: string
          is_ready?: boolean
          joined_at?: string
          qoi_score?: number | null
          ready_at?: string | null
          submission_platform?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          thumbnail_url?: string | null
          tournament_id?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "sanctioned_tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "sanctioned_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      sanctioned_tournaments: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          challenge_accepted: boolean | null
          challenge_accepted_at: string | null
          challenged_crew_avatar_url: string | null
          challenged_crew_id: string | null
          challenged_crew_name: string | null
          created_at: string
          crew_avatar_url: string | null
          crew_id: string
          crew_name: string
          description: string | null
          duration_hours: number
          end_date: string | null
          first_place_index: number | null
          format_type: string
          id: string
          index_prize: number | null
          max_players: number
          min_players: number
          name: string
          participation_index: number | null
          per_win_index: number | null
          player_count: number
          poster_url: string | null
          proposed_by: string
          proposed_start_date: string | null
          ready_count: number
          ready_up_deadline: string | null
          rejection_reason: string | null
          rules: string[] | null
          second_place_index: number | null
          slug: string
          start_date: string | null
          status: string
          submission_deadline: string | null
          theme: string | null
          third_place_index: number | null
          tournament_mode: string
          updated_at: string
          xp_reward: number | null
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          challenge_accepted?: boolean | null
          challenge_accepted_at?: string | null
          challenged_crew_avatar_url?: string | null
          challenged_crew_id?: string | null
          challenged_crew_name?: string | null
          created_at?: string
          crew_avatar_url?: string | null
          crew_id: string
          crew_name: string
          description?: string | null
          duration_hours?: number
          end_date?: string | null
          first_place_index?: number | null
          format_type?: string
          id?: string
          index_prize?: number | null
          max_players?: number
          min_players?: number
          name: string
          participation_index?: number | null
          per_win_index?: number | null
          player_count?: number
          poster_url?: string | null
          proposed_by: string
          proposed_start_date?: string | null
          ready_count?: number
          ready_up_deadline?: string | null
          rejection_reason?: string | null
          rules?: string[] | null
          second_place_index?: number | null
          slug: string
          start_date?: string | null
          status?: string
          submission_deadline?: string | null
          theme?: string | null
          third_place_index?: number | null
          tournament_mode?: string
          updated_at?: string
          xp_reward?: number | null
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          challenge_accepted?: boolean | null
          challenge_accepted_at?: string | null
          challenged_crew_avatar_url?: string | null
          challenged_crew_id?: string | null
          challenged_crew_name?: string | null
          created_at?: string
          crew_avatar_url?: string | null
          crew_id?: string
          crew_name?: string
          description?: string | null
          duration_hours?: number
          end_date?: string | null
          first_place_index?: number | null
          format_type?: string
          id?: string
          index_prize?: number | null
          max_players?: number
          min_players?: number
          name?: string
          participation_index?: number | null
          per_win_index?: number | null
          player_count?: number
          poster_url?: string | null
          proposed_by?: string
          proposed_start_date?: string | null
          ready_count?: number
          ready_up_deadline?: string | null
          rejection_reason?: string | null
          rules?: string[] | null
          second_place_index?: number | null
          slug?: string
          start_date?: string | null
          status?: string
          submission_deadline?: string | null
          theme?: string | null
          third_place_index?: number | null
          tournament_mode?: string
          updated_at?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sanctioned_tournaments_challenged_crew_id_fkey"
            columns: ["challenged_crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanctioned_tournaments_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
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
      tournament_messages: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          message_text: string
          tournament_id: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          message_text: string
          tournament_id: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          message_text?: string
          tournament_id?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_messages_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "sanctioned_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_feed_comments: {
        Row: {
          avatar_url: string | null
          content: string
          created_at: string
          display_name: string | null
          id: string
          parent_id: string | null
          post_id: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          content: string
          created_at?: string
          display_name?: string | null
          id?: string
          parent_id?: string | null
          post_id: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          content?: string
          created_at?: string
          display_name?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_feed_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "unit_feed_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_feed_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "unit_feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_feed_posts: {
        Row: {
          avatar_url: string | null
          content: string | null
          created_at: string
          crew_id: string
          display_name: string | null
          id: string
          is_pinned: boolean
          media_platform: string | null
          media_url: string | null
          post_type: string
          thumbnail_url: string | null
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          content?: string | null
          created_at?: string
          crew_id: string
          display_name?: string | null
          id?: string
          is_pinned?: boolean
          media_platform?: string | null
          media_url?: string | null
          post_type?: string
          thumbnail_url?: string | null
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          content?: string | null
          created_at?: string
          crew_id?: string
          display_name?: string | null
          id?: string
          is_pinned?: boolean
          media_platform?: string | null
          media_url?: string | null
          post_type?: string
          thumbnail_url?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      unit_feed_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_feed_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "unit_feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_logo_previews: {
        Row: {
          created_at: string
          crew_id: string
          id: string
          image_url: string
          status: string
          title: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          crew_id: string
          id?: string
          image_url: string
          status?: string
          title?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          crew_id?: string
          id?: string
          image_url?: string
          status?: string
          title?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_logo_previews_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_logo_votes: {
        Row: {
          created_at: string
          emoji: string
          id: string
          preview_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          id?: string
          preview_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          preview_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_logo_votes_preview_id_fkey"
            columns: ["preview_id"]
            isOneToOne: false
            referencedRelation: "unit_logo_previews"
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
      advance_round_participants: {
        Args: {
          p_advancement_type: Database["public"]["Enums"]["advancement_type"]
          p_advancement_value?: number
          p_event_id: string
          p_round_number: number
        }
        Returns: number
      }
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
      award_judge_xp: {
        Args: {
          p_action: string
          p_amount: number
          p_description?: string
          p_judge_id: string
        }
        Returns: {
          new_judge_xp: number
          new_review_count: number
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
      claim_practice_match: {
        Args: { p_judge_id: string; p_match_id: string }
        Returns: boolean
      }
      cleanup_expired_login_codes: { Args: never; Returns: undefined }
      create_invite:
        | {
            Args: { p_user_id: string }
            Returns: {
              invite_code: string
              xp_awarded: number
            }[]
          }
        | {
            Args: { p_custom_code?: string; p_user_id: string }
            Returns: {
              invite_code: string
              xp_awarded: number
            }[]
          }
      days_until_username_change: {
        Args: { user_uuid: string }
        Returns: number
      }
      end_event_round: {
        Args: { p_event_id: string; p_round_number: number }
        Returns: number
      }
      find_practice_match: {
        Args: { p_duration: number; p_match_type: string; p_user_id: string }
        Returns: string
      }
      generate_crew_challenges: { Args: { p_crew_id: string }; Returns: number }
      generate_hosted_comp_slug: {
        Args: { comp_name: string }
        Returns: string
      }
      generate_invite_code: { Args: never; Returns: string }
      get_channel_unread_counts: {
        Args: { p_crew_id: string; p_user_id: string }
        Returns: {
          channel_id: string
          unread_count: number
        }[]
      }
      get_or_create_conversation: {
        Args: { p_user_1: string; p_user_2: string }
        Returns: string
      }
      get_skill_tier: { Args: { qoi_score: number }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_hosted_comp_views: {
        Args: { comp_id: string }
        Returns: undefined
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
      mark_conversation_read: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: undefined
      }
      post_hosted_comp_system_message: {
        Args: {
          p_competition_id: string
          p_message: string
          p_message_type?: string
        }
        Returns: undefined
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
      start_event_round: {
        Args: { p_event_id: string; p_round_number: number }
        Returns: boolean
      }
      update_active_session: { Args: never; Returns: undefined }
    }
    Enums: {
      advancement_type: "top_x" | "percentage" | "manual" | "none"
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "judge"
        | "dev"
        | "enterprise"
        | "trial_judge"
      crew_extended_role:
        | "ace_editor"
        | "veteran"
        | "challenger"
        | "recruiter"
        | "judge"
      crew_role: "owner" | "officer" | "member"
      event_mode: "standard" | "open_arena"
      house_role: "member" | "captain" | "judge"
      house_type: "public" | "prestige"
      league_tier: "open" | "pro" | "elite"
      participant_status: "active" | "advanced" | "eliminated" | "pending"
      platform_type: "tiktok" | "instagram" | "youtube"
      redemption_status: "pending" | "approved" | "fulfilled" | "rejected"
      round_status: "pending" | "active" | "completed"
      round_type: "open" | "elimination" | "threshold"
      shop_item_type: "cosmetic" | "digital" | "physical"
      winner_logic: "final_qoi" | "cumulative_qoi" | "manual"
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
      advancement_type: ["top_x", "percentage", "manual", "none"],
      app_role: [
        "admin",
        "moderator",
        "user",
        "judge",
        "dev",
        "enterprise",
        "trial_judge",
      ],
      crew_extended_role: [
        "ace_editor",
        "veteran",
        "challenger",
        "recruiter",
        "judge",
      ],
      crew_role: ["owner", "officer", "member"],
      event_mode: ["standard", "open_arena"],
      house_role: ["member", "captain", "judge"],
      house_type: ["public", "prestige"],
      league_tier: ["open", "pro", "elite"],
      participant_status: ["active", "advanced", "eliminated", "pending"],
      platform_type: ["tiktok", "instagram", "youtube"],
      redemption_status: ["pending", "approved", "fulfilled", "rejected"],
      round_status: ["pending", "active", "completed"],
      round_type: ["open", "elimination", "threshold"],
      shop_item_type: ["cosmetic", "digital", "physical"],
      winner_logic: ["final_qoi", "cumulative_qoi", "manual"],
    },
  },
} as const
