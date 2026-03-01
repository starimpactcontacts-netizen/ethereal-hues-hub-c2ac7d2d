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
      artist_campaign_edits: {
        Row: {
          campaign_id: string
          comment_count: number
          created_at: string
          editor_id: string | null
          editor_username: string | null
          id: string
          like_count: number
          platform: string | null
          published_at: string | null
          share_count: number
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
          view_count: number
        }
        Insert: {
          campaign_id: string
          comment_count?: number
          created_at?: string
          editor_id?: string | null
          editor_username?: string | null
          id?: string
          like_count?: number
          platform?: string | null
          published_at?: string | null
          share_count?: number
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
          view_count?: number
        }
        Update: {
          campaign_id?: string
          comment_count?: number
          created_at?: string
          editor_id?: string | null
          editor_username?: string | null
          id?: string
          like_count?: number
          platform?: string | null
          published_at?: string | null
          share_count?: number
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "artist_campaign_edits_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "artist_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_campaigns: {
        Row: {
          budget_cents: number | null
          client_id: string
          client_name: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          end_date: string | null
          featured_artist_id: string | null
          goal_label: string | null
          goal_posts: number
          goal_views: number
          id: string
          name: string
          password_hash: string | null
          roi_percentage: number | null
          slug: string | null
          spent_cents: number | null
          start_date: string | null
          status: string
          total_clicks: number
          total_engagements: number
          total_impressions: number
          total_views: number
          updated_at: string
        }
        Insert: {
          budget_cents?: number | null
          client_id: string
          client_name?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          featured_artist_id?: string | null
          goal_label?: string | null
          goal_posts?: number
          goal_views?: number
          id?: string
          name: string
          password_hash?: string | null
          roi_percentage?: number | null
          slug?: string | null
          spent_cents?: number | null
          start_date?: string | null
          status?: string
          total_clicks?: number
          total_engagements?: number
          total_impressions?: number
          total_views?: number
          updated_at?: string
        }
        Update: {
          budget_cents?: number | null
          client_id?: string
          client_name?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          featured_artist_id?: string | null
          goal_label?: string | null
          goal_posts?: number
          goal_views?: number
          id?: string
          name?: string
          password_hash?: string | null
          roi_percentage?: number | null
          slug?: string | null
          spent_cents?: number | null
          start_date?: string | null
          status?: string
          total_clicks?: number
          total_engagements?: number
          total_impressions?: number
          total_views?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "enterprise_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_campaigns_featured_artist_id_fkey"
            columns: ["featured_artist_id"]
            isOneToOne: false
            referencedRelation: "featured_artists"
            referencedColumns: ["id"]
          },
        ]
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
      battle_messages: {
        Row: {
          avatar_url: string | null
          battle_id: string
          created_at: string
          id: string
          is_public: boolean | null
          is_system: boolean | null
          message_text: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          battle_id: string
          created_at?: string
          id?: string
          is_public?: boolean | null
          is_system?: boolean | null
          message_text: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          battle_id?: string
          created_at?: string
          id?: string
          is_public?: boolean | null
          is_system?: boolean | null
          message_text?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_messages_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
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
          challenger_author_username: string | null
          challenger_avatar_url: string | null
          challenger_id: string
          challenger_score: number | null
          challenger_submission_platform: string | null
          challenger_submission_url: string | null
          challenger_submitted_at: string | null
          challenger_thumbnail_url: string | null
          challenger_username: string
          challenger_video_title: string | null
          challenger_votes: number
          created_at: string
          duration_hours: number
          ends_at: string | null
          id: string
          is_rapid: boolean | null
          judge_claimed_at: string | null
          judge_id: string | null
          judge_notes: string | null
          judge_status: string | null
          judged_at: string | null
          league_tier: string
          loser_index_penalty: number | null
          opponent_author_username: string | null
          opponent_avatar_url: string | null
          opponent_id: string | null
          opponent_score: number | null
          opponent_submission_platform: string | null
          opponent_submission_url: string | null
          opponent_submitted_at: string | null
          opponent_thumbnail_url: string | null
          opponent_username: string | null
          opponent_video_title: string | null
          opponent_votes: number
          requested_judge_id: string | null
          requested_judge_username: string | null
          starts_at: string | null
          status: string
          submission_mode: string | null
          theme_drop_id: string | null
          theme_song_name: string | null
          theme_song_preview_url: string | null
          updated_at: string
          view_count: number
          winner_id: string | null
          winner_index_awarded: number | null
        }
        Insert: {
          accepted_at?: string | null
          challenge_type?: string
          challenger_author_username?: string | null
          challenger_avatar_url?: string | null
          challenger_id: string
          challenger_score?: number | null
          challenger_submission_platform?: string | null
          challenger_submission_url?: string | null
          challenger_submitted_at?: string | null
          challenger_thumbnail_url?: string | null
          challenger_username: string
          challenger_video_title?: string | null
          challenger_votes?: number
          created_at?: string
          duration_hours?: number
          ends_at?: string | null
          id?: string
          is_rapid?: boolean | null
          judge_claimed_at?: string | null
          judge_id?: string | null
          judge_notes?: string | null
          judge_status?: string | null
          judged_at?: string | null
          league_tier?: string
          loser_index_penalty?: number | null
          opponent_author_username?: string | null
          opponent_avatar_url?: string | null
          opponent_id?: string | null
          opponent_score?: number | null
          opponent_submission_platform?: string | null
          opponent_submission_url?: string | null
          opponent_submitted_at?: string | null
          opponent_thumbnail_url?: string | null
          opponent_username?: string | null
          opponent_video_title?: string | null
          opponent_votes?: number
          requested_judge_id?: string | null
          requested_judge_username?: string | null
          starts_at?: string | null
          status?: string
          submission_mode?: string | null
          theme_drop_id?: string | null
          theme_song_name?: string | null
          theme_song_preview_url?: string | null
          updated_at?: string
          view_count?: number
          winner_id?: string | null
          winner_index_awarded?: number | null
        }
        Update: {
          accepted_at?: string | null
          challenge_type?: string
          challenger_author_username?: string | null
          challenger_avatar_url?: string | null
          challenger_id?: string
          challenger_score?: number | null
          challenger_submission_platform?: string | null
          challenger_submission_url?: string | null
          challenger_submitted_at?: string | null
          challenger_thumbnail_url?: string | null
          challenger_username?: string
          challenger_video_title?: string | null
          challenger_votes?: number
          created_at?: string
          duration_hours?: number
          ends_at?: string | null
          id?: string
          is_rapid?: boolean | null
          judge_claimed_at?: string | null
          judge_id?: string | null
          judge_notes?: string | null
          judge_status?: string | null
          judged_at?: string | null
          league_tier?: string
          loser_index_penalty?: number | null
          opponent_author_username?: string | null
          opponent_avatar_url?: string | null
          opponent_id?: string | null
          opponent_score?: number | null
          opponent_submission_platform?: string | null
          opponent_submission_url?: string | null
          opponent_submitted_at?: string | null
          opponent_thumbnail_url?: string | null
          opponent_username?: string | null
          opponent_video_title?: string | null
          opponent_votes?: number
          requested_judge_id?: string | null
          requested_judge_username?: string | null
          starts_at?: string | null
          status?: string
          submission_mode?: string | null
          theme_drop_id?: string | null
          theme_song_name?: string | null
          theme_song_preview_url?: string | null
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
            foreignKeyName: "battles_requested_judge_id_fkey"
            columns: ["requested_judge_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battles_theme_drop_id_fkey"
            columns: ["theme_drop_id"]
            isOneToOne: false
            referencedRelation: "featured_drops"
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
          category: string
          created_at: string
          crew_id: string
          id: string
          is_pinned: boolean
          message: string
          thumbnail_url: string | null
        }
        Insert: {
          author_id: string
          category?: string
          created_at?: string
          crew_id: string
          id?: string
          is_pinned?: boolean
          message: string
          thumbnail_url?: string | null
        }
        Update: {
          author_id?: string
          category?: string
          created_at?: string
          crew_id?: string
          id?: string
          is_pinned?: boolean
          message?: string
          thumbnail_url?: string | null
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
          bot_avatar_url: string | null
          bot_name: string | null
          content_style: string | null
          created_at: string
          description: string | null
          discord_url: string | null
          emblem: string
          featured_at: string | null
          id: string
          is_featured: boolean | null
          is_judge_division: boolean
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
          bot_avatar_url?: string | null
          bot_name?: string | null
          content_style?: string | null
          created_at?: string
          description?: string | null
          discord_url?: string | null
          emblem?: string
          featured_at?: string | null
          id?: string
          is_featured?: boolean | null
          is_judge_division?: boolean
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
          bot_avatar_url?: string | null
          bot_name?: string | null
          content_style?: string | null
          created_at?: string
          description?: string | null
          discord_url?: string | null
          emblem?: string
          featured_at?: string | null
          id?: string
          is_featured?: boolean | null
          is_judge_division?: boolean
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
      dashboard_update_requests: {
        Row: {
          campaign_id: string | null
          client_id: string
          created_at: string
          id: string
          message: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          campaign_id?: string | null
          client_id: string
          created_at?: string
          id?: string
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string | null
          client_id?: string
          created_at?: string
          id?: string
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_update_requests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "artist_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboard_update_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "enterprise_clients"
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
      editorium_articles: {
        Row: {
          author_name: string
          body: string
          category: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          featured: boolean | null
          header_image_url: string | null
          id: string
          is_breaking: boolean
          is_daily_cover: boolean
          priority: number
          published_at: string | null
          read_time_minutes: number | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          slug: string
          status: string
          subtitle: string | null
          tags: string[] | null
          title: string
          unit_id: string | null
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_name?: string
          body: string
          category?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean | null
          header_image_url?: string | null
          id?: string
          is_breaking?: boolean
          is_daily_cover?: boolean
          priority?: number
          published_at?: string | null
          read_time_minutes?: number | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug: string
          status?: string
          subtitle?: string | null
          tags?: string[] | null
          title: string
          unit_id?: string | null
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_name?: string
          body?: string
          category?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean | null
          header_image_url?: string | null
          id?: string
          is_breaking?: boolean
          is_daily_cover?: boolean
          priority?: number
          published_at?: string | null
          read_time_minutes?: number | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug?: string
          status?: string
          subtitle?: string | null
          tags?: string[] | null
          title?: string
          unit_id?: string | null
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "editorium_articles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      email_notifications_log: {
        Row: {
          email_type: string
          id: string
          resend_id: string | null
          sent_at: string
          subject: string
          user_id: string
        }
        Insert: {
          email_type: string
          id?: string
          resend_id?: string | null
          sent_at?: string
          subject: string
          user_id: string
        }
        Update: {
          email_type?: string
          id?: string
          resend_id?: string | null
          sent_at?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
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
      enterprise_clients: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          otp_code: string | null
          otp_expires_at: string | null
          password_hash: string | null
          session_expires_at: string | null
          session_token: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          otp_code?: string | null
          otp_expires_at?: string | null
          password_hash?: string | null
          session_expires_at?: string | null
          session_token?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          otp_code?: string | null
          otp_expires_at?: string | null
          password_hash?: string | null
          session_expires_at?: string | null
          session_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      event_participations: {
        Row: {
          author_username: string | null
          custom_title: string | null
          embed_html: string | null
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
          view_count: number | null
          xp_awarded: number | null
        }
        Insert: {
          author_username?: string | null
          custom_title?: string | null
          embed_html?: string | null
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
          view_count?: number | null
          xp_awarded?: number | null
        }
        Update: {
          author_username?: string | null
          custom_title?: string | null
          embed_html?: string | null
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
          view_count?: number | null
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
          slug: string | null
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
          slug?: string | null
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
          slug?: string | null
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
      featured_artists: {
        Row: {
          achievements: Json | null
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string | null
          created_by: string | null
          genre: string | null
          id: string
          is_active: boolean | null
          monthly_streams: number | null
          name: string
          slug: string
          social_links: Json | null
          updated_at: string | null
          verified: boolean | null
          website_url: string | null
        }
        Insert: {
          achievements?: Json | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          created_by?: string | null
          genre?: string | null
          id?: string
          is_active?: boolean | null
          monthly_streams?: number | null
          name: string
          slug: string
          social_links?: Json | null
          updated_at?: string | null
          verified?: boolean | null
          website_url?: string | null
        }
        Update: {
          achievements?: Json | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          created_by?: string | null
          genre?: string | null
          id?: string
          is_active?: boolean | null
          monthly_streams?: number | null
          name?: string
          slug?: string
          social_links?: Json | null
          updated_at?: string | null
          verified?: boolean | null
          website_url?: string | null
        }
        Relationships: []
      }
      featured_drop_messages: {
        Row: {
          avatar_url: string | null
          created_at: string
          drop_id: string
          id: string
          is_system: boolean | null
          message_text: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          drop_id: string
          id?: string
          is_system?: boolean | null
          message_text: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          drop_id?: string
          id?: string
          is_system?: boolean | null
          message_text?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_drop_messages_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "featured_drops"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_drop_queue: {
        Row: {
          author_username: string | null
          avatar_url: string | null
          claim_token: string | null
          created_at: string
          drop_id: string
          embed_html: string | null
          id: string
          platform: string
          promoted_to_round_id: string | null
          queue_position: number
          status: string
          submission_url: string
          thumbnail_url: string | null
          user_id: string | null
          username: string
          video_title: string | null
        }
        Insert: {
          author_username?: string | null
          avatar_url?: string | null
          claim_token?: string | null
          created_at?: string
          drop_id: string
          embed_html?: string | null
          id?: string
          platform?: string
          promoted_to_round_id?: string | null
          queue_position?: number
          status?: string
          submission_url: string
          thumbnail_url?: string | null
          user_id?: string | null
          username: string
          video_title?: string | null
        }
        Update: {
          author_username?: string | null
          avatar_url?: string | null
          claim_token?: string | null
          created_at?: string
          drop_id?: string
          embed_html?: string | null
          id?: string
          platform?: string
          promoted_to_round_id?: string | null
          queue_position?: number
          status?: string
          submission_url?: string
          thumbnail_url?: string | null
          user_id?: string | null
          username?: string
          video_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "featured_drop_queue_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "featured_drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_drop_queue_promoted_to_round_id_fkey"
            columns: ["promoted_to_round_id"]
            isOneToOne: false
            referencedRelation: "featured_drop_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_drop_rounds: {
        Row: {
          created_at: string
          drop_id: string
          ends_at: string | null
          id: string
          judge_avatar_url: string | null
          judge_id: string | null
          judge_username: string | null
          judge_video_url: string | null
          max_submissions: number
          round_number: number
          starts_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          drop_id: string
          ends_at?: string | null
          id?: string
          judge_avatar_url?: string | null
          judge_id?: string | null
          judge_username?: string | null
          judge_video_url?: string | null
          max_submissions?: number
          round_number?: number
          starts_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          drop_id?: string
          ends_at?: string | null
          id?: string
          judge_avatar_url?: string | null
          judge_id?: string | null
          judge_username?: string | null
          judge_video_url?: string | null
          max_submissions?: number
          round_number?: number
          starts_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_drop_rounds_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "featured_drops"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_drops: {
        Row: {
          artist_id: string
          created_at: string | null
          description: string | null
          ends_at: string | null
          id: string
          index_reward: number | null
          is_promoted: boolean
          mystery_reward_label: string | null
          poster_url: string | null
          random_pick_id: string | null
          random_pick_username: string | null
          slug: string | null
          song_name: string
          song_preview_url: string | null
          song_url: string | null
          starts_at: string | null
          status: string | null
          submission_count: number | null
          title: string
          top_score: number | null
          top_scorer_id: string | null
          top_scorer_username: string | null
          updated_at: string | null
          xp_reward: number | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          index_reward?: number | null
          is_promoted?: boolean
          mystery_reward_label?: string | null
          poster_url?: string | null
          random_pick_id?: string | null
          random_pick_username?: string | null
          slug?: string | null
          song_name: string
          song_preview_url?: string | null
          song_url?: string | null
          starts_at?: string | null
          status?: string | null
          submission_count?: number | null
          title: string
          top_score?: number | null
          top_scorer_id?: string | null
          top_scorer_username?: string | null
          updated_at?: string | null
          xp_reward?: number | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          index_reward?: number | null
          is_promoted?: boolean
          mystery_reward_label?: string | null
          poster_url?: string | null
          random_pick_id?: string | null
          random_pick_username?: string | null
          slug?: string | null
          song_name?: string
          song_preview_url?: string | null
          song_url?: string | null
          starts_at?: string | null
          status?: string | null
          submission_count?: number | null
          title?: string
          top_score?: number | null
          top_scorer_id?: string | null
          top_scorer_username?: string | null
          updated_at?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "featured_drops_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "featured_artists"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_round_rankings: {
        Row: {
          created_at: string
          id: string
          index_awarded: number
          rank: number
          round_id: string
          submission_id: string
          xp_awarded: number
        }
        Insert: {
          created_at?: string
          id?: string
          index_awarded?: number
          rank: number
          round_id: string
          submission_id: string
          xp_awarded?: number
        }
        Update: {
          created_at?: string
          id?: string
          index_awarded?: number
          rank?: number
          round_id?: string
          submission_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "featured_round_rankings_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "featured_drop_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_round_rankings_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "featured_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_submission_votes: {
        Row: {
          created_at: string
          id: string
          submission_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          submission_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          submission_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_submission_votes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "featured_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_submissions: {
        Row: {
          author_username: string | null
          avatar_url: string | null
          claim_token: string | null
          created_at: string | null
          downvotes: number
          drop_id: string
          embed_html: string | null
          feedback: string | null
          id: string
          impact_score: number | null
          index_awarded: number | null
          judge_id: string | null
          judge_username: string | null
          judged_at: string | null
          originality_score: number | null
          platform: string | null
          qoi_score: number | null
          quality_score: number | null
          round_id: string | null
          status: string | null
          submission_url: string
          thumbnail_url: string | null
          upvotes: number
          user_id: string | null
          username: string
          video_title: string | null
          view_count: number | null
          xp_awarded: number | null
        }
        Insert: {
          author_username?: string | null
          avatar_url?: string | null
          claim_token?: string | null
          created_at?: string | null
          downvotes?: number
          drop_id: string
          embed_html?: string | null
          feedback?: string | null
          id?: string
          impact_score?: number | null
          index_awarded?: number | null
          judge_id?: string | null
          judge_username?: string | null
          judged_at?: string | null
          originality_score?: number | null
          platform?: string | null
          qoi_score?: number | null
          quality_score?: number | null
          round_id?: string | null
          status?: string | null
          submission_url: string
          thumbnail_url?: string | null
          upvotes?: number
          user_id?: string | null
          username: string
          video_title?: string | null
          view_count?: number | null
          xp_awarded?: number | null
        }
        Update: {
          author_username?: string | null
          avatar_url?: string | null
          claim_token?: string | null
          created_at?: string | null
          downvotes?: number
          drop_id?: string
          embed_html?: string | null
          feedback?: string | null
          id?: string
          impact_score?: number | null
          index_awarded?: number | null
          judge_id?: string | null
          judge_username?: string | null
          judged_at?: string | null
          originality_score?: number | null
          platform?: string | null
          qoi_score?: number | null
          quality_score?: number | null
          round_id?: string | null
          status?: string | null
          submission_url?: string
          thumbnail_url?: string | null
          upvotes?: number
          user_id?: string | null
          username?: string
          video_title?: string | null
          view_count?: number | null
          xp_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "featured_submissions_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "featured_drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_submissions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "featured_drop_rounds"
            referencedColumns: ["id"]
          },
        ]
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
      feed_post_bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_post_reactions: {
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
            foreignKeyName: "feed_post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          bookmark_count: number
          comment_count: number
          content: string
          created_at: string
          data: Json | null
          id: string
          is_system: boolean
          like_count: number
          media_platform: string | null
          media_url: string | null
          post_type: string
          share_count: number
          submission_id: string | null
          uploaded_media_type: string | null
          uploaded_media_url: string | null
          user_id: string
        }
        Insert: {
          bookmark_count?: number
          comment_count?: number
          content: string
          created_at?: string
          data?: Json | null
          id?: string
          is_system?: boolean
          like_count?: number
          media_platform?: string | null
          media_url?: string | null
          post_type?: string
          share_count?: number
          submission_id?: string | null
          uploaded_media_type?: string | null
          uploaded_media_url?: string | null
          user_id: string
        }
        Update: {
          bookmark_count?: number
          comment_count?: number
          content?: string
          created_at?: string
          data?: Json | null
          id?: string
          is_system?: boolean
          like_count?: number
          media_platform?: string | null
          media_url?: string | null
          post_type?: string
          share_count?: number
          submission_id?: string | null
          uploaded_media_type?: string | null
          uploaded_media_url?: string | null
          user_id?: string
        }
        Relationships: []
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
      judge_division_standings: {
        Row: {
          division: string
          id: string
          judge_id: string
          peak_division: string | null
          reviews_this_season: number
          season_id: string
          seasonal_jxp: number
          updated_at: string
          videos_this_season: number
        }
        Insert: {
          division?: string
          id?: string
          judge_id: string
          peak_division?: string | null
          reviews_this_season?: number
          season_id: string
          seasonal_jxp?: number
          updated_at?: string
          videos_this_season?: number
        }
        Update: {
          division?: string
          id?: string
          judge_id?: string
          peak_division?: string | null
          reviews_this_season?: number
          season_id?: string
          seasonal_jxp?: number
          updated_at?: string
          videos_this_season?: number
        }
        Relationships: [
          {
            foreignKeyName: "judge_division_standings_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "judge_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_inbox: {
        Row: {
          added_at: string
          dismissed: boolean
          dismissed_at: string | null
          id: string
          judge_id: string
          review_request_id: string
        }
        Insert: {
          added_at?: string
          dismissed?: boolean
          dismissed_at?: string | null
          id?: string
          judge_id: string
          review_request_id: string
        }
        Update: {
          added_at?: string
          dismissed?: boolean
          dismissed_at?: string | null
          id?: string
          judge_id?: string
          review_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "judge_inbox_review_request_id_fkey"
            columns: ["review_request_id"]
            isOneToOne: false
            referencedRelation: "review_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_mission_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          current_count: number
          id: string
          judge_id: string
          jxp_claimed: boolean
          mission_id: string
          period_start: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_count?: number
          id?: string
          judge_id: string
          jxp_claimed?: boolean
          mission_id: string
          period_start: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_count?: number
          id?: string
          judge_id?: string
          jxp_claimed?: boolean
          mission_id?: string
          period_start?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "judge_mission_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "judge_mission_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_mission_templates: {
        Row: {
          action_type: string
          created_at: string
          description: string
          icon: string | null
          id: string
          is_active: boolean
          jxp_reward: number
          mission_type: string
          target_count: number
          title: string
        }
        Insert: {
          action_type: string
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          is_active?: boolean
          jxp_reward?: number
          mission_type?: string
          target_count?: number
          title: string
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          jxp_reward?: number
          mission_type?: string
          target_count?: number
          title?: string
        }
        Relationships: []
      }
      judge_rating_videos: {
        Row: {
          author_username: string | null
          bonus_xp_awarded: number | null
          current_views: number | null
          embed_html: string | null
          id: string
          judge_id: string
          platform: string
          submitted_at: string
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          video_url: string
          view_count: number | null
          views_at_submission: number | null
          viral_bonus_awarded: boolean | null
        }
        Insert: {
          author_username?: string | null
          bonus_xp_awarded?: number | null
          current_views?: number | null
          embed_html?: string | null
          id?: string
          judge_id: string
          platform: string
          submitted_at?: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          video_url: string
          view_count?: number | null
          views_at_submission?: number | null
          viral_bonus_awarded?: boolean | null
        }
        Update: {
          author_username?: string | null
          bonus_xp_awarded?: number | null
          current_views?: number | null
          embed_html?: string | null
          id?: string
          judge_id?: string
          platform?: string
          submitted_at?: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          video_url?: string
          view_count?: number | null
          views_at_submission?: number | null
          viral_bonus_awarded?: boolean | null
        }
        Relationships: []
      }
      judge_seasons: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          is_active: boolean
          season_name: string
          season_number: number
          starts_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          is_active?: boolean
          season_name: string
          season_number: number
          starts_at: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          is_active?: boolean
          season_name?: string
          season_number?: number
          starts_at?: string
        }
        Relationships: []
      }
      judge_spotlights: {
        Row: {
          created_at: string
          headline: string | null
          id: string
          judge_id: string
          spotlight_date: string
          spotlight_type: string
          stat_value: number
        }
        Insert: {
          created_at?: string
          headline?: string | null
          id?: string
          judge_id: string
          spotlight_date: string
          spotlight_type: string
          stat_value?: number
        }
        Update: {
          created_at?: string
          headline?: string | null
          id?: string
          judge_id?: string
          spotlight_date?: string
          spotlight_type?: string
          stat_value?: number
        }
        Relationships: []
      }
      league_applications: {
        Row: {
          admin_notes: string | null
          created_at: string
          current_wins: number
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_league: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          current_wins?: number
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_league?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          current_wins?: number
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_league?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          source: string
          subscribed_at: string
          user_id: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          source?: string
          subscribed_at?: string
          user_id?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          source?: string
          subscribed_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_subscribers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
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
      pinned_edits: {
        Row: {
          created_at: string
          id: string
          pin_order: number
          platform: string
          thumbnail_url: string | null
          title: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pin_order?: number
          platform?: string
          thumbnail_url?: string | null
          title?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pin_order?: number
          platform?: string
          thumbnail_url?: string | null
          title?: string | null
          url?: string
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
          player_1_theme_drop_id: string | null
          player_1_theme_song_name: string | null
          player_1_theme_song_preview_url: string | null
          player_2_id: string | null
          player_2_platform: string | null
          player_2_score: number | null
          player_2_submission_url: string | null
          player_2_submitted_at: string | null
          player_2_theme_drop_id: string | null
          player_2_theme_song_name: string | null
          player_2_theme_song_preview_url: string | null
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
          player_1_theme_drop_id?: string | null
          player_1_theme_song_name?: string | null
          player_1_theme_song_preview_url?: string | null
          player_2_id?: string | null
          player_2_platform?: string | null
          player_2_score?: number | null
          player_2_submission_url?: string | null
          player_2_submitted_at?: string | null
          player_2_theme_drop_id?: string | null
          player_2_theme_song_name?: string | null
          player_2_theme_song_preview_url?: string | null
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
          player_1_theme_drop_id?: string | null
          player_1_theme_song_name?: string | null
          player_1_theme_song_preview_url?: string | null
          player_2_id?: string | null
          player_2_platform?: string | null
          player_2_score?: number | null
          player_2_submission_url?: string | null
          player_2_submitted_at?: string | null
          player_2_theme_drop_id?: string | null
          player_2_theme_song_name?: string | null
          player_2_theme_song_preview_url?: string | null
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
            foreignKeyName: "practice_matches_player_1_theme_drop_id_fkey"
            columns: ["player_1_theme_drop_id"]
            isOneToOne: false
            referencedRelation: "featured_drops"
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
            foreignKeyName: "practice_matches_player_2_theme_drop_id_fkey"
            columns: ["player_2_theme_drop_id"]
            isOneToOne: false
            referencedRelation: "featured_drops"
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
          notification_email: string | null
          notify_battles: boolean
          notify_connections: boolean
          notify_drops: boolean
          notify_scores: boolean
          onboarding_completed: boolean | null
          playlist_name: string | null
          portfolio_url: string | null
          primary_crew_changed_at: string | null
          profile_bg_color: string | null
          profile_bg_image_url: string | null
          recovery_code: string | null
          region: string | null
          review_style: string | null
          rules_accepted: boolean | null
          software: string[] | null
          solo_cancel_count: number
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
          notification_email?: string | null
          notify_battles?: boolean
          notify_connections?: boolean
          notify_drops?: boolean
          notify_scores?: boolean
          onboarding_completed?: boolean | null
          playlist_name?: string | null
          portfolio_url?: string | null
          primary_crew_changed_at?: string | null
          profile_bg_color?: string | null
          profile_bg_image_url?: string | null
          recovery_code?: string | null
          region?: string | null
          review_style?: string | null
          rules_accepted?: boolean | null
          software?: string[] | null
          solo_cancel_count?: number
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
          notification_email?: string | null
          notify_battles?: boolean
          notify_connections?: boolean
          notify_drops?: boolean
          notify_scores?: boolean
          onboarding_completed?: boolean | null
          playlist_name?: string | null
          portfolio_url?: string | null
          primary_crew_changed_at?: string | null
          profile_bg_color?: string | null
          profile_bg_image_url?: string | null
          recovery_code?: string | null
          region?: string | null
          review_style?: string | null
          rules_accepted?: boolean | null
          software?: string[] | null
          solo_cancel_count?: number
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
      quick_fight_messages: {
        Row: {
          avatar_url: string | null
          created_at: string
          fight_id: string
          id: string
          is_auto_text: boolean | null
          is_system: boolean | null
          message_text: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          fight_id: string
          id?: string
          is_auto_text?: boolean | null
          is_system?: boolean | null
          message_text: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          fight_id?: string
          id?: string
          is_auto_text?: boolean | null
          is_system?: boolean | null
          message_text?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "quick_fight_messages_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "quick_fights"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_fight_queue: {
        Row: {
          avatar_url: string | null
          expires_at: string
          id: string
          queued_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          expires_at?: string
          id?: string
          queued_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          expires_at?: string
          id?: string
          queued_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      quick_fight_votes: {
        Row: {
          created_at: string
          fight_id: string
          id: string
          user_id: string
          voted_for: string
        }
        Insert: {
          created_at?: string
          fight_id: string
          id?: string
          user_id: string
          voted_for: string
        }
        Update: {
          created_at?: string
          fight_id?: string
          id?: string
          user_id?: string
          voted_for?: string
        }
        Relationships: [
          {
            foreignKeyName: "quick_fight_votes_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "quick_fights"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_fights: {
        Row: {
          created_at: string
          duration_minutes: number
          ends_at: string | null
          id: string
          judge_id: string | null
          judge_notes: string | null
          judge_username: string | null
          judge_video_url: string | null
          judged_at: string | null
          loser_score: number | null
          matched_at: string | null
          player_1_avatar_url: string | null
          player_1_id: string
          player_1_submission_url: string | null
          player_1_submitted_at: string | null
          player_1_thumbnail_url: string | null
          player_1_username: string
          player_1_votes: number
          player_2_avatar_url: string | null
          player_2_id: string | null
          player_2_submission_url: string | null
          player_2_submitted_at: string | null
          player_2_thumbnail_url: string | null
          player_2_username: string | null
          player_2_votes: number
          starts_at: string | null
          status: string
          theme_drop_id: string | null
          theme_song_name: string | null
          theme_song_preview_url: string | null
          updated_at: string
          view_count: number | null
          winner_id: string | null
          winner_score: number | null
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          ends_at?: string | null
          id?: string
          judge_id?: string | null
          judge_notes?: string | null
          judge_username?: string | null
          judge_video_url?: string | null
          judged_at?: string | null
          loser_score?: number | null
          matched_at?: string | null
          player_1_avatar_url?: string | null
          player_1_id: string
          player_1_submission_url?: string | null
          player_1_submitted_at?: string | null
          player_1_thumbnail_url?: string | null
          player_1_username: string
          player_1_votes?: number
          player_2_avatar_url?: string | null
          player_2_id?: string | null
          player_2_submission_url?: string | null
          player_2_submitted_at?: string | null
          player_2_thumbnail_url?: string | null
          player_2_username?: string | null
          player_2_votes?: number
          starts_at?: string | null
          status?: string
          theme_drop_id?: string | null
          theme_song_name?: string | null
          theme_song_preview_url?: string | null
          updated_at?: string
          view_count?: number | null
          winner_id?: string | null
          winner_score?: number | null
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          ends_at?: string | null
          id?: string
          judge_id?: string | null
          judge_notes?: string | null
          judge_username?: string | null
          judge_video_url?: string | null
          judged_at?: string | null
          loser_score?: number | null
          matched_at?: string | null
          player_1_avatar_url?: string | null
          player_1_id?: string
          player_1_submission_url?: string | null
          player_1_submitted_at?: string | null
          player_1_thumbnail_url?: string | null
          player_1_username?: string
          player_1_votes?: number
          player_2_avatar_url?: string | null
          player_2_id?: string | null
          player_2_submission_url?: string | null
          player_2_submitted_at?: string | null
          player_2_thumbnail_url?: string | null
          player_2_username?: string | null
          player_2_votes?: number
          starts_at?: string | null
          status?: string
          theme_drop_id?: string | null
          theme_song_name?: string | null
          theme_song_preview_url?: string | null
          updated_at?: string
          view_count?: number | null
          winner_id?: string | null
          winner_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quick_fights_theme_drop_id_fkey"
            columns: ["theme_drop_id"]
            isOneToOne: false
            referencedRelation: "featured_drops"
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
      revenue_share_applications: {
        Row: {
          admin_notes: string | null
          applicant_email: string
          applicant_name: string | null
          created_at: string
          current_revenue: string | null
          id: string
          pitch: string
          project_name: string
          project_type: string
          project_url: string | null
          proposed_percentage: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          social_links: string[] | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          applicant_email: string
          applicant_name?: string | null
          created_at?: string
          current_revenue?: string | null
          id?: string
          pitch: string
          project_name: string
          project_type?: string
          project_url?: string | null
          proposed_percentage?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_links?: string[] | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          applicant_email?: string
          applicant_name?: string | null
          created_at?: string
          current_revenue?: string | null
          id?: string
          pitch?: string
          project_name?: string
          project_type?: string
          project_url?: string | null
          proposed_percentage?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_links?: string[] | null
          status?: string
          updated_at?: string
        }
        Relationships: []
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
          notes: string | null
          platform: string
          rating_mode: string | null
          requested_at: string
          review_tag: string | null
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
          notes?: string | null
          platform: string
          rating_mode?: string | null
          requested_at?: string
          review_tag?: string | null
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
          notes?: string | null
          platform?: string
          rating_mode?: string | null
          requested_at?: string
          review_tag?: string | null
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
          author_username: string | null
          created_at: string | null
          cumulative_qoi: number | null
          custom_title: string | null
          embed_html: string | null
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
          view_count: number | null
          xp_awarded: number | null
        }
        Insert: {
          author_username?: string | null
          created_at?: string | null
          cumulative_qoi?: number | null
          custom_title?: string | null
          embed_html?: string | null
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
          view_count?: number | null
          xp_awarded?: number | null
        }
        Update: {
          author_username?: string | null
          created_at?: string | null
          cumulative_qoi?: number | null
          custom_title?: string | null
          embed_html?: string | null
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
          view_count?: number | null
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
          custom_title: string | null
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
          custom_title?: string | null
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
          custom_title?: string | null
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
          available_until: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_limited: boolean
          item_type: Database["public"]["Enums"]["shop_item_type"]
          name: string
          price: number
          stock: number | null
          total_claimed: number
          updated_at: string
        }
        Insert: {
          available_until?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_limited?: boolean
          item_type?: Database["public"]["Enums"]["shop_item_type"]
          name: string
          price?: number
          stock?: number | null
          total_claimed?: number
          updated_at?: string
        }
        Update: {
          available_until?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_limited?: boolean
          item_type?: Database["public"]["Enums"]["shop_item_type"]
          name?: string
          price?: number
          stock?: number | null
          total_claimed?: number
          updated_at?: string
        }
        Relationships: []
      }
      shop_purchases: {
        Row: {
          id: string
          item_id: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          id?: string
          item_id: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          id?: string
          item_id?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_purchases_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      solo_submission_votes: {
        Row: {
          created_at: string
          id: string
          submission_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          submission_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          submission_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "solo_submission_votes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "solo_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      solo_submissions: {
        Row: {
          artist_name: string | null
          avatar_url: string | null
          comment_count: number
          created_at: string
          disqualify_reason: string | null
          downvotes: number
          drop_id: string | null
          id: string
          impact_score: number | null
          index_awarded: number | null
          is_disqualified: boolean | null
          judge_claimed_at: string | null
          judge_id: string | null
          judge_notes: string | null
          judged_at: string | null
          originality_score: number | null
          qoi_score: number | null
          quality_score: number | null
          song_name: string
          status: string
          submission_platform: string | null
          submission_url: string | null
          submitted_at: string | null
          theme: string
          thumbnail_url: string | null
          updated_at: string
          upvotes: number
          user_id: string
          username: string
          video_title: string | null
        }
        Insert: {
          artist_name?: string | null
          avatar_url?: string | null
          comment_count?: number
          created_at?: string
          disqualify_reason?: string | null
          downvotes?: number
          drop_id?: string | null
          id?: string
          impact_score?: number | null
          index_awarded?: number | null
          is_disqualified?: boolean | null
          judge_claimed_at?: string | null
          judge_id?: string | null
          judge_notes?: string | null
          judged_at?: string | null
          originality_score?: number | null
          qoi_score?: number | null
          quality_score?: number | null
          song_name: string
          status?: string
          submission_platform?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          theme: string
          thumbnail_url?: string | null
          updated_at?: string
          upvotes?: number
          user_id: string
          username: string
          video_title?: string | null
        }
        Update: {
          artist_name?: string | null
          avatar_url?: string | null
          comment_count?: number
          created_at?: string
          disqualify_reason?: string | null
          downvotes?: number
          drop_id?: string | null
          id?: string
          impact_score?: number | null
          index_awarded?: number | null
          is_disqualified?: boolean | null
          judge_claimed_at?: string | null
          judge_id?: string | null
          judge_notes?: string | null
          judged_at?: string | null
          originality_score?: number | null
          qoi_score?: number | null
          quality_score?: number | null
          song_name?: string
          status?: string
          submission_platform?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          theme?: string
          thumbnail_url?: string | null
          updated_at?: string
          upvotes?: number
          user_id?: string
          username?: string
          video_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solo_submissions_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "featured_drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solo_submissions_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solo_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      unit_bot_commands: {
        Row: {
          channel_id: string
          command_type: string
          created_at: string
          created_by: string
          crew_id: string
          data: Json | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          message_id: string | null
          title: string
        }
        Insert: {
          channel_id: string
          command_type: string
          created_at?: string
          created_by: string
          crew_id: string
          data?: Json | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message_id?: string | null
          title: string
        }
        Update: {
          channel_id?: string
          command_type?: string
          created_at?: string
          created_by?: string
          crew_id?: string
          data?: Json | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_bot_commands_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "crew_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_bot_commands_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_bot_commands_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "crew_channel_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_bot_poll_votes: {
        Row: {
          command_id: string
          created_at: string
          id: string
          option_index: number
          user_id: string
        }
        Insert: {
          command_id: string
          created_at?: string
          id?: string
          option_index: number
          user_id: string
        }
        Update: {
          command_id?: string
          created_at?: string
          id?: string
          option_index?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_bot_poll_votes_command_id_fkey"
            columns: ["command_id"]
            isOneToOne: false
            referencedRelation: "unit_bot_commands"
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
          media_type: string
          status: string
          title: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          crew_id: string
          id?: string
          image_url: string
          media_type?: string
          status?: string
          title?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          crew_id?: string
          id?: string
          image_url?: string
          media_type?: string
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
      user_radio_tracks: {
        Row: {
          artist_name: string | null
          audio_url: string
          created_at: string
          duration_seconds: number | null
          id: string
          is_public: boolean
          track_name: string
          track_order: number
          user_id: string
        }
        Insert: {
          artist_name?: string | null
          audio_url: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_public?: boolean
          track_name: string
          track_order?: number
          user_id: string
        }
        Update: {
          artist_name?: string | null
          audio_url?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_public?: boolean
          track_name?: string
          track_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_radio_tracks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      ensure_default_channels: {
        Args: { p_crew_id: string }
        Returns: undefined
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
      increment_editorium_views: {
        Args: { article_id: string }
        Returns: undefined
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
      pick_practice_song: {
        Args: {
          p_drop_id: string
          p_match_id: string
          p_song_name: string
          p_song_preview_url: string
          p_user_id: string
        }
        Returns: Json
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
      quick_fight_match: {
        Args: { p_avatar_url?: string; p_user_id: string; p_username: string }
        Returns: string
      }
      quick_fight_submit: {
        Args: { p_fight_id: string; p_url: string; p_user_id: string }
        Returns: boolean
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
      resolve_expired_quick_fights: { Args: never; Returns: number }
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
