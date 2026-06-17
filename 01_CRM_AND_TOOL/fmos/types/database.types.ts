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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      acquisition_targets: {
        Row: {
          city: string
          city_slug: string
          created_at: string | null
          id: string
          is_active: boolean | null
          next_actions: string | null
          niche: string
          notes: string | null
        }
        Insert: {
          city: string
          city_slug: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          next_actions?: string | null
          niche: string
          notes?: string | null
        }
        Update: {
          city?: string
          city_slug?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          next_actions?: string | null
          niche?: string
          notes?: string | null
        }
        Relationships: []
      }
      activity_events: {
        Row: {
          body: string | null
          created_at: string | null
          created_by: string | null
          entity_id: string
          entity_type: string
          event_type: string
          id: string
          metadata: Json | null
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          entity_id: string
          entity_type: string
          event_type: string
          id?: string
          metadata?: Json | null
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ad_campaigns: {
        Row: {
          campaign_name: string
          clicks: number | null
          conversions: number | null
          cpc: number | null
          cpl: number | null
          cpl_target: number | null
          created_at: string | null
          end_date: string | null
          external_campaign_id: string | null
          id: string
          impressions: number | null
          leads_generated: number | null
          monthly_budget: number | null
          notes: string | null
          objective: string | null
          platform: string | null
          roas: number | null
          spend_mtd: number | null
          start_date: string | null
          status: string | null
        }
        Insert: {
          campaign_name: string
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          cpl?: number | null
          cpl_target?: number | null
          created_at?: string | null
          end_date?: string | null
          external_campaign_id?: string | null
          id?: string
          impressions?: number | null
          leads_generated?: number | null
          monthly_budget?: number | null
          notes?: string | null
          objective?: string | null
          platform?: string | null
          roas?: number | null
          spend_mtd?: number | null
          start_date?: string | null
          status?: string | null
        }
        Update: {
          campaign_name?: string
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          cpl?: number | null
          cpl_target?: number | null
          created_at?: string | null
          end_date?: string | null
          external_campaign_id?: string | null
          id?: string
          impressions?: number | null
          leads_generated?: number | null
          monthly_budget?: number | null
          notes?: string | null
          objective?: string | null
          platform?: string | null
          roas?: number | null
          spend_mtd?: number | null
          start_date?: string | null
          status?: string | null
        }
        Relationships: []
      }
      ad_insights_daily: {
        Row: {
          ad_name: string | null
          adset_name: string | null
          campaign_external_id: string | null
          campaign_id: string | null
          clicks: number | null
          created_at: string | null
          date: string
          id: string
          impressions: number | null
          leads: number | null
          platform: string
          spend: number | null
        }
        Insert: {
          ad_name?: string | null
          adset_name?: string | null
          campaign_external_id?: string | null
          campaign_id?: string | null
          clicks?: number | null
          created_at?: string | null
          date: string
          id?: string
          impressions?: number | null
          leads?: number | null
          platform: string
          spend?: number | null
        }
        Update: {
          ad_name?: string | null
          adset_name?: string | null
          campaign_external_id?: string | null
          campaign_id?: string | null
          clicks?: number | null
          created_at?: string | null
          date?: string
          id?: string
          impressions?: number | null
          leads?: number | null
          platform?: string
          spend?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_insights_daily_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_kpi_snapshots: {
        Row: {
          created_at: string | null
          day: string
          id: string
          metrics: Json
        }
        Insert: {
          created_at?: string | null
          day?: string
          id?: string
          metrics: Json
        }
        Update: {
          created_at?: string | null
          day?: string
          id?: string
          metrics?: Json
        }
        Relationships: []
      }
      agency_growth_metrics: {
        Row: {
          created_at: string | null
          current_value: number | null
          icon: string | null
          id: string
          last_month_value: number | null
          metric_key: string
          metric_label: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          icon?: string | null
          id?: string
          last_month_value?: number | null
          metric_key: string
          metric_label: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          icon?: string | null
          id?: string
          last_month_value?: number | null
          metric_key?: string
          metric_label?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_growth_metrics_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_growth_metrics_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "agency_growth_metrics_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      agreements: {
        Row: {
          agreement_number: string | null
          confirmed_at: string | null
          created_at: string | null
          created_by: string | null
          id: string
          lead_id: string | null
          proposal_id: string | null
          proposal_ref: string | null
          services: Json | null
          start_date: string | null
          status: string | null
          total_monthly: number | null
          total_setup: number | null
        }
        Insert: {
          agreement_number?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id?: string | null
          proposal_id?: string | null
          proposal_ref?: string | null
          services?: Json | null
          start_date?: string | null
          status?: string | null
          total_monthly?: number | null
          total_setup?: number | null
        }
        Update: {
          agreement_number?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id?: string | null
          proposal_id?: string | null
          proposal_ref?: string | null
          services?: Json | null
          start_date?: string | null
          status?: string | null
          total_monthly?: number | null
          total_setup?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agreements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "agreements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "agreements_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          created_at: string | null
          created_by: string | null
          feature: string
          id: string
          input_summary: string | null
          model: string
          output_summary: string | null
          tokens_used: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          feature: string
          id?: string
          input_summary?: string | null
          model: string
          output_summary?: string | null
          tokens_used?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          feature?: string
          id?: string
          input_summary?: string | null
          model?: string
          output_summary?: string | null
          tokens_used?: number | null
        }
        Relationships: []
      }
      alert_rules: {
        Row: {
          condition: Json
          created_at: string | null
          id: string
          is_enabled: boolean | null
          name: string
          severity: string | null
          type: string
        }
        Insert: {
          condition: Json
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          severity?: string | null
          type: string
        }
        Update: {
          condition?: Json
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          severity?: string | null
          type?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          body: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          resolved_at: string | null
          rule_id: string | null
          severity: string
          status: string | null
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          body?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          resolved_at?: string | null
          rule_id?: string | null
          severity: string
          status?: string | null
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          body?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          resolved_at?: string | null
          rule_id?: string | null
          severity?: string
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      assignment_pools: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          pool_name: string
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          pool_name: string
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          pool_name?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      assignment_state: {
        Row: {
          last_user_id: string | null
          pool_name: string
          updated_at: string | null
        }
        Insert: {
          last_user_id?: string | null
          pool_name: string
          updated_at?: string | null
        }
        Update: {
          last_user_id?: string | null
          pool_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      attendance_adjustments: {
        Row: {
          adjustment_minutes: number
          created_at: string | null
          created_by: string | null
          day: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          adjustment_minutes?: number
          created_at?: string | null
          created_by?: string | null
          day: string
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          adjustment_minutes?: number
          created_at?: string | null
          created_by?: string | null
          day?: string
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      attendance_breaks: {
        Row: {
          break_end_at: string | null
          break_start_at: string
          created_at: string | null
          id: string
          session_id: string
        }
        Insert: {
          break_end_at?: string | null
          break_start_at: string
          created_at?: string | null
          id?: string
          session_id: string
        }
        Update: {
          break_end_at?: string | null
          break_start_at?: string
          created_at?: string | null
          id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_breaks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_daily_summary: {
        Row: {
          break_minutes: number
          day: string
          flags: Json
          gross_minutes: number
          id: string
          is_complete: boolean
          net_minutes: number
          sessions_count: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          break_minutes?: number
          day: string
          flags?: Json
          gross_minutes?: number
          id?: string
          is_complete?: boolean
          net_minutes?: number
          sessions_count?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          break_minutes?: number
          day?: string
          flags?: Json
          gross_minutes?: number
          id?: string
          is_complete?: boolean
          net_minutes?: number
          sessions_count?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      attendance_policies: {
        Row: {
          break_required_after_minutes: number
          created_at: string | null
          grace_late_minutes: number
          id: string
          is_enabled: boolean | null
          max_session_hours: number
          name: string
          standard_daily_minutes: number
          timezone: string
        }
        Insert: {
          break_required_after_minutes?: number
          created_at?: string | null
          grace_late_minutes?: number
          id?: string
          is_enabled?: boolean | null
          max_session_hours?: number
          name: string
          standard_daily_minutes?: number
          timezone?: string
        }
        Update: {
          break_required_after_minutes?: number
          created_at?: string | null
          grace_late_minutes?: number
          id?: string
          is_enabled?: boolean | null
          max_session_hours?: number
          name?: string
          standard_daily_minutes?: number
          timezone?: string
        }
        Relationships: []
      }
      attendance_sessions: {
        Row: {
          clock_in_at: string
          clock_out_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          session_date: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          clock_in_at: string
          clock_out_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          session_date: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          clock_in_at?: string
          clock_out_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          session_date?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          request_id: string | null
          resource_id: string | null
          resource_label: string | null
          resource_type: string | null
          summary: string | null
          user_agent: string | null
          user_name: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          request_id?: string | null
          resource_id?: string | null
          resource_label?: string | null
          resource_type?: string | null
          summary?: string | null
          user_agent?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          request_id?: string | null
          resource_id?: string | null
          resource_label?: string | null
          resource_type?: string | null
          summary?: string | null
          user_agent?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          entity_type: string
          id: string
          is_enabled: boolean | null
          name: string
          priority: number | null
          throttle_minutes: number | null
          trigger: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entity_type: string
          id?: string
          is_enabled?: boolean | null
          name: string
          priority?: number | null
          throttle_minutes?: number | null
          trigger: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entity_type?: string
          id?: string
          is_enabled?: boolean | null
          name?: string
          priority?: number | null
          throttle_minutes?: number | null
          trigger?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_runs: {
        Row: {
          actions_executed: Json | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          input_snapshot: Json | null
          reason: string | null
          rule_id: string | null
          status: string
          trigger: string
        }
        Insert: {
          actions_executed?: Json | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          input_snapshot?: Json | null
          reason?: string | null
          rule_id?: string | null
          status: string
          trigger: string
        }
        Update: {
          actions_executed?: Json | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          input_snapshot?: Json | null
          reason?: string | null
          rule_id?: string | null
          status?: string
          trigger?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_throttle: {
        Row: {
          entity_id: string
          entity_type: string
          id: string
          last_ran_at: string
          rule_id: string
        }
        Insert: {
          entity_id: string
          entity_type: string
          id?: string
          last_ran_at?: string
          rule_id: string
        }
        Update: {
          entity_id?: string
          entity_type?: string
          id?: string
          last_ran_at?: string
          rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_throttle_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      backlinks: {
        Row: {
          acquired_date: string | null
          anchor_text: string | null
          created_at: string | null
          domain_authority: number | null
          id: string
          notes: string | null
          source_domain: string
          source_url: string | null
          status: string | null
          target_url: string | null
        }
        Insert: {
          acquired_date?: string | null
          anchor_text?: string | null
          created_at?: string | null
          domain_authority?: number | null
          id?: string
          notes?: string | null
          source_domain: string
          source_url?: string | null
          status?: string | null
          target_url?: string | null
        }
        Update: {
          acquired_date?: string | null
          anchor_text?: string | null
          created_at?: string | null
          domain_authority?: number | null
          id?: string
          notes?: string | null
          source_domain?: string
          source_url?: string | null
          status?: string | null
          target_url?: string | null
        }
        Relationships: []
      }
      build_tracker_modules: {
        Row: {
          created_at: string | null
          id: string
          last_updated: string | null
          module_name: string
          notes: string | null
          priority: string
          sort_order: number | null
          status: string
          system_id: number
          system_name: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_updated?: string | null
          module_name: string
          notes?: string | null
          priority?: string
          sort_order?: number | null
          status?: string
          system_id: number
          system_name: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_updated?: string | null
          module_name?: string
          notes?: string | null
          priority?: string
          sort_order?: number | null
          status?: string
          system_id?: number
          system_name?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "build_tracker_modules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "build_tracker_modules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "build_tracker_modules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      business_settings: {
        Row: {
          account_name: string | null
          account_number: string | null
          address_line1: string | null
          address_line2: string | null
          bank_name: string | null
          business_name: string | null
          city: string | null
          email: string | null
          gst_rate: number | null
          gstin: string | null
          id: string
          ifsc: string | null
          invoice_prefix: string | null
          payment_terms_days: number | null
          phone: string | null
          pincode: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          address_line1?: string | null
          address_line2?: string | null
          bank_name?: string | null
          business_name?: string | null
          city?: string | null
          email?: string | null
          gst_rate?: number | null
          gstin?: string | null
          id?: string
          ifsc?: string | null
          invoice_prefix?: string | null
          payment_terms_days?: number | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          address_line1?: string | null
          address_line2?: string | null
          bank_name?: string | null
          business_name?: string | null
          city?: string | null
          email?: string | null
          gst_rate?: number | null
          gstin?: string | null
          id?: string
          ifsc?: string | null
          invoice_prefix?: string | null
          payment_terms_days?: number | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      call_activities: {
        Row: {
          call_outcome: string | null
          created_at: string
          created_by: string
          duration: number | null
          id: string
          lead_id: string
          notes: string | null
          outcome: string | null
        }
        Insert: {
          call_outcome?: string | null
          created_at?: string
          created_by: string
          duration?: number | null
          id?: string
          lead_id: string
          notes?: string | null
          outcome?: string | null
        }
        Update: {
          call_outcome?: string | null
          created_at?: string
          created_by?: string
          duration?: number | null
          id?: string
          lead_id?: string
          notes?: string | null
          outcome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_activities_user_id_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_activities_user_id_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "call_activities_user_id_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      call_logs: {
        Row: {
          city: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          lead_id: string | null
          niche: string | null
          outcome: string
          telecaller_id: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          lead_id?: string | null
          niche?: string | null
          outcome: string
          telecaller_id?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          lead_id?: string | null
          niche?: string | null
          outcome?: string
          telecaller_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      change_requests: {
        Row: {
          created_at: string | null
          created_by: string | null
          decision_at: string | null
          decision_by: string | null
          decision_note: string | null
          description: string
          id: string
          impact_cost: number | null
          impact_timeline_days: number | null
          priority: string | null
          project_id: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          decision_at?: string | null
          decision_by?: string | null
          decision_note?: string | null
          description: string
          id?: string
          impact_cost?: number | null
          impact_timeline_days?: number | null
          priority?: string | null
          project_id: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          decision_at?: string | null
          decision_by?: string | null
          decision_note?: string | null
          description?: string
          id?: string
          impact_cost?: number | null
          impact_timeline_days?: number | null
          priority?: string | null
          project_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          state: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          state?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          state?: string | null
        }
        Relationships: []
      }
      client_asset_vault: {
        Row: {
          asset_id: string
          asset_name: string
          client_id: string | null
          created_at: string | null
          file_url: string | null
          id: string
          notes: string | null
          received_at: string | null
          required: boolean | null
          service_id: string
          status: string | null
        }
        Insert: {
          asset_id: string
          asset_name: string
          client_id?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          received_at?: string | null
          required?: boolean | null
          service_id: string
          status?: string | null
        }
        Update: {
          asset_id?: string
          asset_name?: string
          client_id?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          received_at?: string | null
          required?: boolean | null
          service_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_asset_vault_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_asset_vault_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "renewal_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      client_assets: {
        Row: {
          category: string
          client_id: string
          created_at: string | null
          file_type: string | null
          file_url: string | null
          id: string
          label: string
          link_url: string | null
          notes: string | null
          password_encrypted: string | null
          updated_at: string | null
          url: string | null
          username: string | null
        }
        Insert: {
          category: string
          client_id: string
          created_at?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          label: string
          link_url?: string | null
          notes?: string | null
          password_encrypted?: string | null
          updated_at?: string | null
          url?: string | null
          username?: string | null
        }
        Update: {
          category?: string
          client_id?: string
          created_at?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          label?: string
          link_url?: string | null
          notes?: string | null
          password_encrypted?: string | null
          updated_at?: string | null
          url?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_assets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "renewal_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      client_call_logs: {
        Row: {
          call_date: string
          client_id: string
          created_at: string | null
          duration_minutes: number | null
          id: string
          logged_by: string | null
          notes: string | null
          outcome: string | null
        }
        Insert: {
          call_date?: string
          client_id: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          logged_by?: string | null
          notes?: string | null
          outcome?: string | null
        }
        Update: {
          call_date?: string
          client_id?: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          logged_by?: string | null
          notes?: string | null
          outcome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_call_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_call_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "renewal_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_call_logs_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_call_logs_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "client_call_logs_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      client_deliverables: {
        Row: {
          client_feedback: string | null
          created_at: string | null
          deliverable_type: string
          description: string | null
          file_url: string | null
          id: string
          project_id: string | null
          reviewed_at: string | null
          status: string
          title: string
        }
        Insert: {
          client_feedback?: string | null
          created_at?: string | null
          deliverable_type: string
          description?: string | null
          file_url?: string | null
          id?: string
          project_id?: string | null
          reviewed_at?: string | null
          status?: string
          title: string
        }
        Update: {
          client_feedback?: string | null
          created_at?: string | null
          deliverable_type?: string
          description?: string | null
          file_url?: string | null
          id?: string
          project_id?: string | null
          reviewed_at?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_onboarding_tasks: {
        Row: {
          client_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          due_by: string | null
          id: string
          notes: string | null
          owner: string
          service_id: string
          status: string | null
          task: string
          task_id: string
        }
        Insert: {
          client_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          due_by?: string | null
          id?: string
          notes?: string | null
          owner: string
          service_id: string
          status?: string | null
          task: string
          task_id: string
        }
        Update: {
          client_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          due_by?: string | null
          id?: string
          notes?: string | null
          owner?: string
          service_id?: string
          status?: string | null
          task?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_onboarding_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_onboarding_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "renewal_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_onboarding_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_onboarding_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "client_onboarding_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      client_packages: {
        Row: {
          client_id: string
          created_at: string | null
          health_score: number | null
          health_updated_at: string | null
          hs_engagement: number | null
          hs_payment: number | null
          hs_results: number | null
          hs_risk: number | null
          hs_tenure: number | null
          id: string
          monthly_value: number | null
          notes: string | null
          onetime_value: number | null
          package_name: string
          renewal_date: string | null
          services: string[] | null
          start_date: string
          status: string
          updated_at: string | null
          upsell_eligible: boolean | null
          upsell_last_attempt_at: string | null
          upsell_last_outcome: string | null
          upsell_target: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          health_score?: number | null
          health_updated_at?: string | null
          hs_engagement?: number | null
          hs_payment?: number | null
          hs_results?: number | null
          hs_risk?: number | null
          hs_tenure?: number | null
          id?: string
          monthly_value?: number | null
          notes?: string | null
          onetime_value?: number | null
          package_name: string
          renewal_date?: string | null
          services?: string[] | null
          start_date: string
          status?: string
          updated_at?: string | null
          upsell_eligible?: boolean | null
          upsell_last_attempt_at?: string | null
          upsell_last_outcome?: string | null
          upsell_target?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          health_score?: number | null
          health_updated_at?: string | null
          hs_engagement?: number | null
          hs_payment?: number | null
          hs_results?: number | null
          hs_risk?: number | null
          hs_tenure?: number | null
          id?: string
          monthly_value?: number | null
          notes?: string | null
          onetime_value?: number | null
          package_name?: string
          renewal_date?: string | null
          services?: string[] | null
          start_date?: string
          status?: string
          updated_at?: string | null
          upsell_eligible?: boolean | null
          upsell_last_attempt_at?: string | null
          upsell_last_outcome?: string | null
          upsell_target?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_packages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_packages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "renewal_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      client_reports: {
        Row: {
          ai_summary: string | null
          client_id: string | null
          created_at: string | null
          created_by: string | null
          data_snapshot: Json | null
          id: string
          is_published: boolean | null
          magic_link_expires_at: string | null
          magic_link_token: string | null
          pdf_url: string | null
          project_id: string | null
          report_month: string
          report_type: string
        }
        Insert: {
          ai_summary?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_snapshot?: Json | null
          id?: string
          is_published?: boolean | null
          magic_link_expires_at?: string | null
          magic_link_token?: string | null
          pdf_url?: string | null
          project_id?: string | null
          report_month: string
          report_type: string
        }
        Update: {
          ai_summary?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_snapshot?: Json | null
          id?: string
          is_published?: boolean | null
          magic_link_expires_at?: string | null
          magic_link_token?: string | null
          pdf_url?: string | null
          project_id?: string | null
          report_month?: string
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "renewal_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_resources: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          resource_type: string | null
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          resource_type?: string | null
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          resource_type?: string | null
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_resources_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_resources_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "renewal_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          business_name: string
          city: string | null
          created_at: string
          health_score: number | null
          id: string
          last_upsell_attempt: string | null
          monthly_value: number | null
          niche: string | null
          notes: string | null
          onboarding_completed: boolean | null
          owner_name: string | null
          package_tier: string | null
          phone: string | null
          primary_email: string | null
          renewal_date: string | null
          services: string[] | null
          services_active: Json | null
          start_date: string | null
          status: string | null
          upsell_eligible: boolean | null
          upsell_notes: string | null
          user_id: string | null
        }
        Insert: {
          business_name: string
          city?: string | null
          created_at?: string
          health_score?: number | null
          id?: string
          last_upsell_attempt?: string | null
          monthly_value?: number | null
          niche?: string | null
          notes?: string | null
          onboarding_completed?: boolean | null
          owner_name?: string | null
          package_tier?: string | null
          phone?: string | null
          primary_email?: string | null
          renewal_date?: string | null
          services?: string[] | null
          services_active?: Json | null
          start_date?: string | null
          status?: string | null
          upsell_eligible?: boolean | null
          upsell_notes?: string | null
          user_id?: string | null
        }
        Update: {
          business_name?: string
          city?: string | null
          created_at?: string
          health_score?: number | null
          id?: string
          last_upsell_attempt?: string | null
          monthly_value?: number | null
          niche?: string | null
          notes?: string | null
          onboarding_completed?: boolean | null
          owner_name?: string | null
          package_tier?: string | null
          phone?: string | null
          primary_email?: string | null
          renewal_date?: string | null
          services?: string[] | null
          services_active?: Json | null
          start_date?: string | null
          status?: string | null
          upsell_eligible?: boolean | null
          upsell_notes?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      content_pieces: {
        Row: {
          author_id: string | null
          channel: string | null
          comments: number | null
          content_type: string | null
          created_at: string | null
          engagement_rate: number | null
          id: string
          leads_attributed: number | null
          likes: number | null
          platform: string | null
          published_date: string | null
          reach: number | null
          saves: number | null
          scheduled_date: string | null
          shares: number | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          channel?: string | null
          comments?: number | null
          content_type?: string | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          leads_attributed?: number | null
          likes?: number | null
          platform?: string | null
          published_date?: string | null
          reach?: number | null
          saves?: number | null
          scheduled_date?: string | null
          shares?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          channel?: string | null
          comments?: number | null
          content_type?: string | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          leads_attributed?: number | null
          likes?: number | null
          platform?: string | null
          published_date?: string | null
          reach?: number | null
          saves?: number | null
          scheduled_date?: string | null
          shares?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_pieces_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_pieces_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_pieces_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      csv_uploads: {
        Row: {
          city: string | null
          created_at: string | null
          filename: string
          has_market_data: boolean | null
          id: string
          import_batch_id: string | null
          industry: string | null
          lead_type: string | null
          leads_count: number
          source: string | null
          uploaded_by: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          filename: string
          has_market_data?: boolean | null
          id?: string
          import_batch_id?: string | null
          industry?: string | null
          lead_type?: string | null
          leads_count?: number
          source?: string | null
          uploaded_by?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          filename?: string
          has_market_data?: boolean | null
          id?: string
          import_batch_id?: string | null
          industry?: string | null
          lead_type?: string | null
          leads_count?: number
          source?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      dashboard_state: {
        Row: {
          id: number
          state: Json
        }
        Insert: {
          id: number
          state?: Json
        }
        Update: {
          id?: number
          state?: Json
        }
        Relationships: []
      }
      deals: {
        Row: {
          contract_link: string | null
          created_at: string
          deal_value: number | null
          id: string
          lead_id: string | null
          meeting_link: string | null
          next_step_date: string | null
          proposal_url: string | null
          service_type: string | null
          status: string | null
          strategist_id: string | null
          strategy_session_date: string | null
        }
        Insert: {
          contract_link?: string | null
          created_at?: string
          deal_value?: number | null
          id?: string
          lead_id?: string | null
          meeting_link?: string | null
          next_step_date?: string | null
          proposal_url?: string | null
          service_type?: string | null
          status?: string | null
          strategist_id?: string | null
          strategy_session_date?: string | null
        }
        Update: {
          contract_link?: string | null
          created_at?: string
          deal_value?: number | null
          id?: string
          lead_id?: string | null
          meeting_link?: string | null
          next_step_date?: string | null
          proposal_url?: string | null
          service_type?: string | null
          status?: string | null
          strategist_id?: string | null
          strategy_session_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_strategist_id_fkey"
            columns: ["strategist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_strategist_id_fkey"
            columns: ["strategist_id"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "deals_strategist_id_fkey"
            columns: ["strategist_id"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      deliverables: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          milestone_id: string | null
          project_id: string
          storage_path: string | null
          title: string
          type: string
          uploaded_by: string | null
          url: string | null
          version: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          milestone_id?: string | null
          project_id: string
          storage_path?: string | null
          title: string
          type: string
          uploaded_by?: string | null
          url?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          milestone_id?: string | null
          project_id?: string
          storage_path?: string | null
          title?: string
          type?: string
          uploaded_by?: string | null
          url?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      duplicate_candidates: {
        Row: {
          confidence: number
          created_at: string | null
          created_by: string | null
          duplicate_id: string
          entity_type: string
          id: string
          match_type: string
          primary_id: string
          reason: Json | null
          status: string
        }
        Insert: {
          confidence: number
          created_at?: string | null
          created_by?: string | null
          duplicate_id: string
          entity_type?: string
          id?: string
          match_type: string
          primary_id: string
          reason?: Json | null
          status?: string
        }
        Update: {
          confidence?: number
          created_at?: string | null
          created_by?: string | null
          duplicate_id?: string
          entity_type?: string
          id?: string
          match_type?: string
          primary_id?: string
          reason?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "duplicate_candidates_duplicate_id_fkey"
            columns: ["duplicate_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicate_candidates_primary_id_fkey"
            columns: ["primary_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_tags: {
        Row: {
          created_at: string | null
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          tag: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          tag: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          tag?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          client_id: string | null
          created_at: string | null
          created_by: string | null
          description: string
          expense_date: string
          id: string
          is_recurring: boolean | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          expense_date?: string
          id?: string
          is_recurring?: boolean | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          expense_date?: string
          id?: string
          is_recurring?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "renewal_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string | null
          file_type: string | null
          id: string
          is_client_visible: boolean | null
          lead_id: string | null
          name: string
          project_id: string | null
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          file_type?: string | null
          id?: string
          is_client_visible?: boolean | null
          lead_id?: string | null
          name: string
          project_id?: string | null
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          file_type?: string | null
          id?: string
          is_client_visible?: boolean | null
          lead_id?: string | null
          name?: string
          project_id?: string | null
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          follow_up_type: string | null
          id: string
          lead_id: string | null
          notes: string | null
          outcome_note: string | null
          scheduled_at: string
          status: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          follow_up_type?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          outcome_note?: string | null
          scheduled_at: string
          status?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          follow_up_type?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          outcome_note?: string | null
          scheduled_at?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      gmb_checklist_items: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          item_text: string
          sort_order: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          item_text: string
          sort_order?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          item_text?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      gmb_snapshots: {
        Row: {
          calls: number | null
          created_at: string | null
          direction_requests: number | null
          id: string
          photo_views: number | null
          profile_views: number | null
          snapshot_month: string
          website_clicks: number | null
        }
        Insert: {
          calls?: number | null
          created_at?: string | null
          direction_requests?: number | null
          id?: string
          photo_views?: number | null
          profile_views?: number | null
          snapshot_month: string
          website_clicks?: number | null
        }
        Update: {
          calls?: number | null
          created_at?: string | null
          direction_requests?: number | null
          id?: string
          photo_views?: number | null
          profile_views?: number | null
          snapshot_month?: string
          website_clicks?: number | null
        }
        Relationships: []
      }
      inbound_events: {
        Row: {
          channel: string
          created_at: string | null
          error: string | null
          external_id: string | null
          id: string
          lead_id: string | null
          payload: Json
          status: string
        }
        Insert: {
          channel: string
          created_at?: string | null
          error?: string | null
          external_id?: string | null
          id?: string
          lead_id?: string | null
          payload?: Json
          status?: string
        }
        Update: {
          channel?: string
          created_at?: string | null
          error?: string | null
          external_id?: string | null
          id?: string
          lead_id?: string | null
          payload?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbound_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          invoice_id: string | null
          sort_order: number | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          invoice_id?: string | null
          sort_order?: number | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_by: string | null
          due_date: string
          gst_amount: number
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_method: string | null
          pdf_url: string | null
          revenue_type: string | null
          status: string | null
          subtotal: number
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date: string
          gst_amount?: number
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          pdf_url?: string | null
          revenue_type?: string | null
          status?: string | null
          subtotal?: number
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string
          gst_amount?: number
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          pdf_url?: string | null
          revenue_type?: string | null
          status?: string | null
          subtotal?: number
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "renewal_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lead_outcomes: {
        Row: {
          actor_id: string
          call_notes: string | null
          created_at: string | null
          id: string
          lead_id: string
          next_action_date: string | null
          outcome: string
          reason_code: string | null
          reason_note: string | null
        }
        Insert: {
          actor_id: string
          call_notes?: string | null
          created_at?: string | null
          id?: string
          lead_id: string
          next_action_date?: string | null
          outcome: string
          reason_code?: string | null
          reason_note?: string | null
        }
        Update: {
          actor_id?: string
          call_notes?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string
          next_action_date?: string | null
          outcome?: string
          reason_code?: string | null
          reason_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_outcomes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_reason_codes: {
        Row: {
          code: string
          id: string
          is_active: boolean | null
          label: string
          outcome: string
          sort_order: number | null
        }
        Insert: {
          code: string
          id?: string
          is_active?: boolean | null
          label: string
          outcome: string
          sort_order?: number | null
        }
        Update: {
          code?: string
          id?: string
          is_active?: boolean | null
          label?: string
          outcome?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      lead_redirects: {
        Row: {
          created_at: string | null
          merged_id: string
          survivor_id: string
        }
        Insert: {
          created_at?: string | null
          merged_id: string
          survivor_id: string
        }
        Update: {
          created_at?: string | null
          merged_id?: string
          survivor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_redirects_merged_id_fkey"
            columns: ["merged_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_redirects_survivor_id_fkey"
            columns: ["survivor_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_source_attribution: {
        Row: {
          ad_campaign_id: string | null
          content_piece_id: string | null
          created_at: string | null
          id: string
          landing_page: string | null
          lead_id: string | null
          referrer_url: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          ad_campaign_id?: string | null
          content_piece_id?: string | null
          created_at?: string | null
          id?: string
          landing_page?: string | null
          lead_id?: string | null
          referrer_url?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          ad_campaign_id?: string | null
          content_piece_id?: string | null
          created_at?: string | null
          id?: string
          landing_page?: string | null
          lead_id?: string | null
          referrer_url?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_source_attribution_ad_campaign_id_fkey"
            columns: ["ad_campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_source_attribution_content_piece_id_fkey"
            columns: ["content_piece_id"]
            isOneToOne: false
            referencedRelation: "content_pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_source_attribution_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_sales_exec: string | null
          assigned_strategist: string | null
          call_attempts: number | null
          captured_at: string | null
          city: string | null
          company_name: string
          contact_person: string | null
          created_at: string
          current_traffic_estimate: string | null
          deal_probability: number | null
          email: string | null
          email_normalized: string | null
          first_contact_at: string | null
          follow_up_date: string | null
          gatekeeper_count: number | null
          gmb_link: string | null
          has_gmb: boolean | null
          has_website: boolean | null
          id: string
          import_batch_id: string | null
          industry: string | null
          intent_score: number | null
          is_merged: boolean | null
          last_activity_at: string | null
          last_call_outcome: string | null
          last_connected_at: string | null
          last_contacted_at: string | null
          last_interaction_note: string | null
          last_outcome: string | null
          last_outcome_reason: string | null
          last_outreach_at: string | null
          lead_quality_score: number | null
          lead_source: string | null
          lead_type: string | null
          meeting_booked_at: string | null
          meeting_link: string | null
          meeting_notes: string | null
          merged_into: string | null
          next_action_date: string | null
          no_answer_count: number | null
          notes: string | null
          outreach_stage: string | null
          pdf_name: string | null
          pdf_sent_at: string | null
          phone: string | null
          phone_normalized: string | null
          is_low_volume: boolean
          phone_raw: string | null
          pitch_type: string | null
          proposal_link: string | null
          proposal_sent_at: string | null
          search_volume: number | null
          serp_ranked: boolean | null
          serp_source: string | null
          source: string | null
          stale_flag: boolean | null
          stale_reason: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          strategy_session_at: string | null
          tags: string[] | null
          website_domain: string | null
          website_link: string | null
          website_url: string | null
        }
        Insert: {
          assigned_sales_exec?: string | null
          assigned_strategist?: string | null
          call_attempts?: number | null
          captured_at?: string | null
          city?: string | null
          company_name: string
          contact_person?: string | null
          created_at?: string
          current_traffic_estimate?: string | null
          deal_probability?: number | null
          email?: string | null
          email_normalized?: string | null
          first_contact_at?: string | null
          follow_up_date?: string | null
          gatekeeper_count?: number | null
          gmb_link?: string | null
          has_gmb?: boolean | null
          has_website?: boolean | null
          id?: string
          import_batch_id?: string | null
          industry?: string | null
          intent_score?: number | null
          is_merged?: boolean | null
          last_activity_at?: string | null
          last_call_outcome?: string | null
          last_connected_at?: string | null
          last_contacted_at?: string | null
          last_interaction_note?: string | null
          last_outcome?: string | null
          last_outcome_reason?: string | null
          last_outreach_at?: string | null
          lead_quality_score?: number | null
          lead_source?: string | null
          lead_type?: string | null
          meeting_booked_at?: string | null
          meeting_link?: string | null
          meeting_notes?: string | null
          merged_into?: string | null
          next_action_date?: string | null
          no_answer_count?: number | null
          notes?: string | null
          outreach_stage?: string | null
          pdf_name?: string | null
          pdf_sent_at?: string | null
          phone?: string | null
          phone_normalized?: string | null
          is_low_volume?: boolean
          phone_raw?: string | null
          pitch_type?: string | null
          proposal_link?: string | null
          proposal_sent_at?: string | null
          search_volume?: number | null
          serp_ranked?: boolean | null
          serp_source?: string | null
          source?: string | null
          stale_flag?: boolean | null
          stale_reason?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          strategy_session_at?: string | null
          tags?: string[] | null
          website_domain?: string | null
          website_link?: string | null
          website_url?: string | null
        }
        Update: {
          assigned_sales_exec?: string | null
          assigned_strategist?: string | null
          call_attempts?: number | null
          captured_at?: string | null
          city?: string | null
          company_name?: string
          contact_person?: string | null
          created_at?: string
          current_traffic_estimate?: string | null
          deal_probability?: number | null
          email?: string | null
          email_normalized?: string | null
          first_contact_at?: string | null
          follow_up_date?: string | null
          gatekeeper_count?: number | null
          gmb_link?: string | null
          has_gmb?: boolean | null
          has_website?: boolean | null
          id?: string
          import_batch_id?: string | null
          industry?: string | null
          intent_score?: number | null
          is_merged?: boolean | null
          last_activity_at?: string | null
          last_call_outcome?: string | null
          last_connected_at?: string | null
          last_contacted_at?: string | null
          last_interaction_note?: string | null
          last_outcome?: string | null
          last_outcome_reason?: string | null
          last_outreach_at?: string | null
          lead_quality_score?: number | null
          lead_source?: string | null
          lead_type?: string | null
          meeting_booked_at?: string | null
          meeting_link?: string | null
          meeting_notes?: string | null
          merged_into?: string | null
          next_action_date?: string | null
          no_answer_count?: number | null
          notes?: string | null
          outreach_stage?: string | null
          pdf_name?: string | null
          pdf_sent_at?: string | null
          phone?: string | null
          phone_normalized?: string | null
          is_low_volume?: boolean
          phone_raw?: string | null
          pitch_type?: string | null
          proposal_link?: string | null
          proposal_sent_at?: string | null
          search_volume?: number | null
          serp_ranked?: boolean | null
          serp_source?: string | null
          source?: string | null
          stale_flag?: boolean | null
          stale_reason?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          strategy_session_at?: string | null
          tags?: string[] | null
          website_domain?: string | null
          website_link?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_sales_exec_fkey"
            columns: ["assigned_sales_exec"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assigned_sales_exec_fkey"
            columns: ["assigned_sales_exec"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "leads_assigned_sales_exec_fkey"
            columns: ["assigned_sales_exec"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "leads_assigned_strategist_fkey"
            columns: ["assigned_strategist"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assigned_strategist_fkey"
            columns: ["assigned_strategist"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "leads_assigned_strategist_fkey"
            columns: ["assigned_strategist"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "leads_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      market_insights: {
        Row: {
          city: string
          competitor_insights: Json | null
          created_at: string
          general_insights: Json | null
          id: string
          industry: string
          market_difficulty: string | null
          pitch_angle: string | null
          search_volume: string | null
          top_competitors: Json | null
        }
        Insert: {
          city: string
          competitor_insights?: Json | null
          created_at?: string
          general_insights?: Json | null
          id?: string
          industry: string
          market_difficulty?: string | null
          pitch_angle?: string | null
          search_volume?: string | null
          top_competitors?: Json | null
        }
        Update: {
          city?: string
          competitor_insights?: Json | null
          created_at?: string
          general_insights?: Json | null
          id?: string
          industry?: string
          market_difficulty?: string | null
          pitch_angle?: string | null
          search_volume?: string | null
          top_competitors?: Json | null
        }
        Relationships: []
      }
      marketing_weekly_briefs: {
        Row: {
          created_at: string | null
          generated_by: string | null
          id: string
          key_concerns: string[] | null
          key_wins: string[] | null
          leads_delta: number | null
          organic_sessions_delta: number | null
          paid_spend_delta: number | null
          recommended_action: string | null
          summary_text: string | null
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          created_at?: string | null
          generated_by?: string | null
          id?: string
          key_concerns?: string[] | null
          key_wins?: string[] | null
          leads_delta?: number | null
          organic_sessions_delta?: number | null
          paid_spend_delta?: number | null
          recommended_action?: string | null
          summary_text?: string | null
          week_end_date: string
          week_start_date: string
        }
        Update: {
          created_at?: string | null
          generated_by?: string | null
          id?: string
          key_concerns?: string[] | null
          key_wins?: string[] | null
          leads_delta?: number | null
          organic_sessions_delta?: number | null
          paid_spend_delta?: number | null
          recommended_action?: string | null
          summary_text?: string | null
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          booked_by: string | null
          cancelled_reason: string | null
          conducted_by: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          lead_id: string
          location: string | null
          notes: string | null
          outcome: string | null
          rescheduled_to: string | null
          scheduled_at: string
          sequence_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          booked_by?: string | null
          cancelled_reason?: string | null
          conducted_by?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id: string
          location?: string | null
          notes?: string | null
          outcome?: string | null
          rescheduled_to?: string | null
          scheduled_at: string
          sequence_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          booked_by?: string | null
          cancelled_reason?: string | null
          conducted_by?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string
          location?: string | null
          notes?: string | null
          outcome?: string | null
          rescheduled_to?: string | null
          scheduled_at?: string
          sequence_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "outreach_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      merges: {
        Row: {
          created_at: string | null
          entity_type: string
          id: string
          is_undone: boolean | null
          merge_strategy: Json | null
          merged_by: string | null
          merged_id: string
          survivor_id: string
          undo_until: string
        }
        Insert: {
          created_at?: string | null
          entity_type?: string
          id?: string
          is_undone?: boolean | null
          merge_strategy?: Json | null
          merged_by?: string | null
          merged_id: string
          survivor_id: string
          undo_until: string
        }
        Update: {
          created_at?: string | null
          entity_type?: string
          id?: string
          is_undone?: boolean | null
          merge_strategy?: Json | null
          merged_by?: string | null
          merged_id?: string
          survivor_id?: string
          undo_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "merges_merged_id_fkey"
            columns: ["merged_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merges_survivor_id_fkey"
            columns: ["survivor_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_approvals: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          feedback: string | null
          id: string
          milestone_id: string
          requested_at: string | null
          requested_by: string | null
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          milestone_id: string
          requested_at?: string | null
          requested_by?: string | null
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          milestone_id?: string
          requested_at?: string | null
          requested_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_approvals_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_templates: {
        Row: {
          id: string
          name: string
          order_index: number | null
          service_type: Database["public"]["Enums"]["service_type"]
        }
        Insert: {
          id?: string
          name: string
          order_index?: number | null
          service_type: Database["public"]["Enums"]["service_type"]
        }
        Update: {
          id?: string
          name?: string
          order_index?: number | null
          service_type?: Database["public"]["Enums"]["service_type"]
        }
        Relationships: []
      }
      niche_kits: {
        Row: {
          case_study_url: string | null
          created_at: string | null
          id: string
          landing_page_url: string | null
          market_research_url: string | null
          niche_id: string
          updated_at: string | null
        }
        Insert: {
          case_study_url?: string | null
          created_at?: string | null
          id?: string
          landing_page_url?: string | null
          market_research_url?: string | null
          niche_id: string
          updated_at?: string | null
        }
        Update: {
          case_study_url?: string | null
          created_at?: string | null
          id?: string
          landing_page_url?: string | null
          market_research_url?: string | null
          niche_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "niche_kits_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: true
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      niches: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          link: string | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      objection_bank: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          industry: string | null
          objection: string
          rebuttal: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          industry?: string | null
          objection: string
          rebuttal: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          industry?: string | null
          objection?: string
          rebuttal?: string
        }
        Relationships: []
      }
      onboarding_checklists: {
        Row: {
          category: string
          client_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          item_text: string
          notes: string | null
          sort_order: number | null
        }
        Insert: {
          category: string
          client_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          item_text: string
          notes?: string | null
          sort_order?: number | null
        }
        Update: {
          category?: string
          client_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          item_text?: string
          notes?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_checklists_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklists_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "renewal_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklists_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklists_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "onboarding_checklists_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      organic_traffic_snapshots: {
        Row: {
          avg_session_duration: number | null
          bounce_rate: number | null
          created_at: string | null
          id: string
          new_users: number | null
          organic_sessions: number | null
          snapshot_date: string
          source: string | null
          top_landing_page: string | null
          total_sessions: number | null
        }
        Insert: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          created_at?: string | null
          id?: string
          new_users?: number | null
          organic_sessions?: number | null
          snapshot_date: string
          source?: string | null
          top_landing_page?: string | null
          total_sessions?: number | null
        }
        Update: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          created_at?: string | null
          id?: string
          new_users?: number | null
          organic_sessions?: number | null
          snapshot_date?: string
          source?: string | null
          top_landing_page?: string | null
          total_sessions?: number | null
        }
        Relationships: []
      }
      outreach_logs: {
        Row: {
          actor_id: string | null
          created_at: string | null
          id: string
          lead_id: string | null
          note: string | null
          outcome: string | null
          pdf_name: string | null
          touch_type: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          note?: string | null
          outcome?: string | null
          pdf_name?: string | null
          touch_type: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          note?: string | null
          outcome?: string | null
          pdf_name?: string | null
          touch_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "outreach_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "outreach_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_sequences: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          followup_scheduled_at: string | null
          id: string
          lead_id: string
          meeting_booked_at: string | null
          meeting_booked_by: string | null
          meeting_date: string | null
          notes: string | null
          outcome: string | null
          outcome_at: string | null
          outcome_notes: string | null
          pdf_name: string | null
          pdf_sent_at: string | null
          pdf_sent_by: string | null
          proposal_sent_at: string | null
          proposal_sent_by: string | null
          proposal_type: string | null
          stage: string
          touch1_message: string | null
          touch1_sent_at: string | null
          touch1_sent_by: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          followup_scheduled_at?: string | null
          id?: string
          lead_id: string
          meeting_booked_at?: string | null
          meeting_booked_by?: string | null
          meeting_date?: string | null
          notes?: string | null
          outcome?: string | null
          outcome_at?: string | null
          outcome_notes?: string | null
          pdf_name?: string | null
          pdf_sent_at?: string | null
          pdf_sent_by?: string | null
          proposal_sent_at?: string | null
          proposal_sent_by?: string | null
          proposal_type?: string | null
          stage?: string
          touch1_message?: string | null
          touch1_sent_at?: string | null
          touch1_sent_by?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          followup_scheduled_at?: string | null
          id?: string
          lead_id?: string
          meeting_booked_at?: string | null
          meeting_booked_by?: string | null
          meeting_date?: string | null
          notes?: string | null
          outcome?: string | null
          outcome_at?: string | null
          outcome_notes?: string | null
          pdf_name?: string | null
          pdf_sent_at?: string | null
          pdf_sent_by?: string | null
          proposal_sent_at?: string | null
          proposal_sent_by?: string | null
          proposal_type?: string | null
          stage?: string
          touch1_message?: string | null
          touch1_sent_at?: string | null
          touch1_sent_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_sequences_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_deliveries: {
        Row: {
          confirmed_read: boolean | null
          confirmed_read_at: string | null
          created_at: string | null
          delivery_method: string | null
          id: string
          lead_id: string
          notes: string | null
          pdf_name: string
          pdf_type: string
          sent_at: string | null
          sent_by: string | null
          sequence_id: string | null
        }
        Insert: {
          confirmed_read?: boolean | null
          confirmed_read_at?: string | null
          created_at?: string | null
          delivery_method?: string | null
          id?: string
          lead_id: string
          notes?: string | null
          pdf_name: string
          pdf_type?: string
          sent_at?: string | null
          sent_by?: string | null
          sequence_id?: string | null
        }
        Update: {
          confirmed_read?: boolean | null
          confirmed_read_at?: string | null
          created_at?: string | null
          delivery_method?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
          pdf_name?: string
          pdf_type?: string
          sent_at?: string | null
          sent_by?: string | null
          sequence_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdf_deliveries_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_deliveries_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "outreach_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          role: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          role?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          role?: string | null
        }
        Relationships: []
      }
      project_files: {
        Row: {
          category: string | null
          created_at: string | null
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          project_id: string
          uploader_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          project_id: string
          uploader_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          project_id?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          project_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          project_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          project_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          approval_date: string | null
          client_notified_at: string | null
          created_at: string
          due_date: string | null
          id: string
          name: string
          order_index: number | null
          project_id: string
          status: Database["public"]["Enums"]["milestone_status"] | null
        }
        Insert: {
          approval_date?: string | null
          client_notified_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          name: string
          order_index?: number | null
          project_id: string
          status?: Database["public"]["Enums"]["milestone_status"] | null
        }
        Update: {
          approval_date?: string | null
          client_notified_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          name?: string
          order_index?: number | null
          project_id?: string
          status?: Database["public"]["Enums"]["milestone_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_qa_items: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          item_text: string
          project_id: string
          sort_order: number | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          item_text: string
          project_id: string
          sort_order?: number | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          item_text?: string
          project_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_qa_items_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_qa_items_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_qa_items_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_qa_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          assigned_pm: string | null
          assigned_to: string | null
          build_type: string | null
          client_id: string
          completion_percentage: number | null
          created_at: string
          deadline: string | null
          deal_id: string | null
          delivery_stage: string | null
          health_status: string | null
          id: string
          name: string | null
          project_type: string | null
          service_type: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
        }
        Insert: {
          assigned_pm?: string | null
          assigned_to?: string | null
          build_type?: string | null
          client_id: string
          completion_percentage?: number | null
          created_at?: string
          deadline?: string | null
          deal_id?: string | null
          delivery_stage?: string | null
          health_status?: string | null
          id?: string
          name?: string | null
          project_type?: string | null
          service_type?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
        }
        Update: {
          assigned_pm?: string | null
          assigned_to?: string | null
          build_type?: string | null
          client_id?: string
          completion_percentage?: number | null
          created_at?: string
          deadline?: string | null
          deal_id?: string | null
          delivery_stage?: string | null
          health_status?: string | null
          id?: string
          name?: string | null
          project_type?: string | null
          service_type?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "projects_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "renewal_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          agreement_sent_at: string | null
          closed_at: string | null
          created_at: string | null
          created_by: string | null
          id: string
          lead_id: string
          meeting_id: string | null
          monthly_value: number | null
          notes: string | null
          onetime_value: number | null
          proposal_number: string
          proposal_type: string | null
          quotation_sent_at: string | null
          sent_at: string | null
          sent_by: string | null
          sequence_id: string | null
          services: Json | null
          start_date: string | null
          status: string
          total_monthly: number | null
          total_setup: number | null
          updated_at: string | null
        }
        Insert: {
          agreement_sent_at?: string | null
          closed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id: string
          meeting_id?: string | null
          monthly_value?: number | null
          notes?: string | null
          onetime_value?: number | null
          proposal_number: string
          proposal_type?: string | null
          quotation_sent_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          sequence_id?: string | null
          services?: Json | null
          start_date?: string | null
          status?: string
          total_monthly?: number | null
          total_setup?: number | null
          updated_at?: string | null
        }
        Update: {
          agreement_sent_at?: string | null
          closed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id?: string
          meeting_id?: string | null
          monthly_value?: number | null
          notes?: string | null
          onetime_value?: number | null
          proposal_number?: string
          proposal_type?: string | null
          quotation_sent_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          sequence_id?: string | null
          services?: Json | null
          start_date?: string | null
          status?: string
          total_monthly?: number | null
          total_setup?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "outreach_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      review_requests: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          method: string | null
          notes: string | null
          rating: number | null
          requested_at: string
          review_received: boolean | null
          review_text: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          rating?: number | null
          requested_at?: string
          review_received?: boolean | null
          review_text?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          rating?: number | null
          requested_at?: string
          review_received?: boolean | null
          review_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "renewal_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_daily_metrics: {
        Row: {
          calls_made: number | null
          connected: number | null
          created_at: string | null
          day: string
          followups_set: number | null
          id: string
          not_interested: number | null
          strategy_booked: number | null
          user_id: string | null
        }
        Insert: {
          calls_made?: number | null
          connected?: number | null
          created_at?: string | null
          day: string
          followups_set?: number | null
          id?: string
          not_interested?: number | null
          strategy_booked?: number | null
          user_id?: string | null
        }
        Update: {
          calls_made?: number | null
          connected?: number | null
          created_at?: string | null
          day?: string
          followups_set?: number | null
          id?: string
          not_interested?: number | null
          strategy_booked?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      sales_scripts: {
        Row: {
          city: string | null
          created_at: string | null
          created_by: string | null
          id: string
          industry: string | null
          language: string | null
          script_body: string
          script_title: string
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          industry?: string | null
          language?: string | null
          script_body: string
          script_title: string
        }
        Update: {
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          industry?: string | null
          language?: string | null
          script_body?: string
          script_title?: string
        }
        Relationships: []
      }
      saved_views: {
        Row: {
          columns: Json
          created_at: string | null
          entity_type: string
          filters: Json
          id: string
          is_default: boolean
          name: string
          owner_id: string | null
          role_scope: string | null
          sort: Json
          updated_at: string | null
          visibility: string
        }
        Insert: {
          columns?: Json
          created_at?: string | null
          entity_type: string
          filters?: Json
          id?: string
          is_default?: boolean
          name: string
          owner_id?: string | null
          role_scope?: string | null
          sort?: Json
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          columns?: Json
          created_at?: string | null
          entity_type?: string
          filters?: Json
          id?: string
          is_default?: boolean
          name?: string
          owner_id?: string | null
          role_scope?: string | null
          sort?: Json
          updated_at?: string | null
          visibility?: string
        }
        Relationships: []
      }
      seo_keywords: {
        Row: {
          belongs_to: string | null
          created_at: string | null
          current_position: number | null
          difficulty: number | null
          id: string
          is_tracking: boolean | null
          keyword: string
          previous_position: number | null
          search_volume: number | null
          target_url: string | null
        }
        Insert: {
          belongs_to?: string | null
          created_at?: string | null
          current_position?: number | null
          difficulty?: number | null
          id?: string
          is_tracking?: boolean | null
          keyword: string
          previous_position?: number | null
          search_volume?: number | null
          target_url?: string | null
        }
        Update: {
          belongs_to?: string | null
          created_at?: string | null
          current_position?: number | null
          difficulty?: number | null
          id?: string
          is_tracking?: boolean | null
          keyword?: string
          previous_position?: number | null
          search_volume?: number | null
          target_url?: string | null
        }
        Relationships: []
      }
      seo_pages: {
        Row: {
          created_at: string | null
          current_ranking: number | null
          id: string
          last_updated: string | null
          page_name: string
          status: string | null
          target_keyword: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          current_ranking?: number | null
          id?: string
          last_updated?: string | null
          page_name: string
          status?: string | null
          target_keyword?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          current_ranking?: number | null
          id?: string
          last_updated?: string | null
          page_name?: string
          status?: string | null
          target_keyword?: string | null
          url?: string
        }
        Relationships: []
      }
      sla_policies: {
        Row: {
          condition: Json | null
          contact_within_minutes: number | null
          created_at: string | null
          entity_type: string
          followup_missed_minutes: number | null
          id: string
          is_enabled: boolean | null
          lead_type: string | null
          name: string
        }
        Insert: {
          condition?: Json | null
          contact_within_minutes?: number | null
          created_at?: string | null
          entity_type?: string
          followup_missed_minutes?: number | null
          id?: string
          is_enabled?: boolean | null
          lead_type?: string | null
          name: string
        }
        Update: {
          condition?: Json | null
          contact_within_minutes?: number | null
          created_at?: string | null
          entity_type?: string
          followup_missed_minutes?: number | null
          id?: string
          is_enabled?: boolean | null
          lead_type?: string | null
          name?: string
        }
        Relationships: []
      }
      sops: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          estimated_minutes: number | null
          id: string
          steps: Json
          title: string
          tools_required: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          estimated_minutes?: number | null
          id?: string
          steps: Json
          title: string
          tools_required?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          estimated_minutes?: number | null
          id?: string
          steps?: Json
          title?: string
          tools_required?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sops_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sops_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "sops_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      strategy_run_tasks: {
        Row: {
          id: string
          strategy_run_id: string | null
          task_id: string | null
        }
        Insert: {
          id?: string
          strategy_run_id?: string | null
          task_id?: string | null
        }
        Update: {
          id?: string
          strategy_run_id?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strategy_run_tasks_strategy_run_id_fkey"
            columns: ["strategy_run_id"]
            isOneToOne: false
            referencedRelation: "strategy_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_run_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_runs: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_by: string | null
          destination: string
          id: string
          strategy_text: string
          strategy_type: string | null
          tasks_generated: number | null
          timeframe: string | null
          title: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          destination: string
          id?: string
          strategy_text: string
          strategy_type?: string | null
          tasks_generated?: number | null
          timeframe?: string | null
          title: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          destination?: string
          id?: string
          strategy_text?: string
          strategy_type?: string | null
          tasks_generated?: number | null
          timeframe?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_runs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_runs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "renewal_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_runs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_runs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "strategy_runs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      task_checklist_items: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          id: string
          is_done: boolean | null
          sort_order: number | null
          task_id: string
          title: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          is_done?: boolean | null
          sort_order?: number | null
          task_id: string
          title: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          is_done?: boolean | null
          sort_order?: number | null
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string | null
          dependency_type: string
          depends_on_task_id: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          dependency_type?: string
          depends_on_task_id: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          dependency_type?: string
          depends_on_task_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          build_type: string | null
          created_at: string | null
          default_role: Database["public"]["Enums"]["user_role"] | null
          id: string
          name: string
          offset_days: number | null
          phase_group: string | null
          service_type: string
        }
        Insert: {
          build_type?: string | null
          created_at?: string | null
          default_role?: Database["public"]["Enums"]["user_role"] | null
          id?: string
          name: string
          offset_days?: number | null
          phase_group?: string | null
          service_type: string
        }
        Update: {
          build_type?: string | null
          created_at?: string | null
          default_role?: Database["public"]["Enums"]["user_role"] | null
          id?: string
          name?: string
          offset_days?: number | null
          phase_group?: string | null
          service_type?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          client_id: string | null
          completion_date: string | null
          created_at: string
          description: string | null
          drive_edited_url: string | null
          drive_final_url: string | null
          drive_raw_url: string | null
          due_date: string | null
          estimated_hours: number | null
          estimated_minutes: number | null
          id: string
          milestone_id: string | null
          priority: string | null
          project_id: string | null
          revision_count: number | null
          revision_notes: string | null
          section_tag: string | null
          sop_content: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          strategy_run_id: string | null
          submission_notes: string | null
          tags: string[] | null
          title: string
          type: string | null
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          client_id?: string | null
          completion_date?: string | null
          created_at?: string
          description?: string | null
          drive_edited_url?: string | null
          drive_final_url?: string | null
          drive_raw_url?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          estimated_minutes?: number | null
          id?: string
          milestone_id?: string | null
          priority?: string | null
          project_id?: string | null
          revision_count?: number | null
          revision_notes?: string | null
          section_tag?: string | null
          sop_content?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          strategy_run_id?: string | null
          submission_notes?: string | null
          tags?: string[] | null
          title: string
          type?: string | null
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          client_id?: string | null
          completion_date?: string | null
          created_at?: string
          description?: string | null
          drive_edited_url?: string | null
          drive_final_url?: string | null
          drive_raw_url?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          estimated_minutes?: number | null
          id?: string
          milestone_id?: string | null
          priority?: string | null
          project_id?: string | null
          revision_count?: number | null
          revision_notes?: string | null
          section_tag?: string | null
          sop_content?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          strategy_run_id?: string | null
          submission_notes?: string | null
          tags?: string[] | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "renewal_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_strategy_run_id_fkey"
            columns: ["strategy_run_id"]
            isOneToOne: false
            referencedRelation: "strategy_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      team_targets: {
        Row: {
          created_at: string | null
          id: string
          target_type: string
          target_value: number
          updated_at: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          target_type: string
          target_value?: number
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          target_type?: string
          target_value?: number
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_targets_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_targets_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_targets_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_targets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_targets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_targets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      telecaller_stats: {
        Row: {
          current_streak: number | null
          highest_streak: number | null
          last_call_at: string | null
          total_calls: number | null
          total_interested: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_streak?: number | null
          highest_streak?: number | null
          last_call_at?: string | null
          total_calls?: number | null
          total_interested?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_streak?: number | null
          highest_streak?: number | null
          last_call_at?: string | null
          total_calls?: number | null
          total_interested?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      upsell_attempts: {
        Row: {
          attempt_date: string
          attempted_by: string | null
          client_id: string
          converted_value: number | null
          created_at: string | null
          current_services: string[] | null
          follow_up_date: string | null
          id: string
          method: string | null
          notes: string | null
          outcome: string | null
          package_id: string | null
          target_service: string
        }
        Insert: {
          attempt_date?: string
          attempted_by?: string | null
          client_id: string
          converted_value?: number | null
          created_at?: string | null
          current_services?: string[] | null
          follow_up_date?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          outcome?: string | null
          package_id?: string | null
          target_service: string
        }
        Update: {
          attempt_date?: string
          attempted_by?: string | null
          client_id?: string
          converted_value?: number | null
          created_at?: string | null
          current_services?: string[] | null
          follow_up_date?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          outcome?: string | null
          package_id?: string | null
          target_service?: string
        }
        Relationships: [
          {
            foreignKeyName: "upsell_attempts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_attempts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "renewal_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_attempts_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          active_city: string | null
          active_industry: string | null
          last_updated: string | null
          user_id: string
        }
        Insert: {
          active_city?: string | null
          active_industry?: string | null
          last_updated?: string | null
          user_id: string
        }
        Update: {
          active_city?: string | null
          active_industry?: string | null
          last_updated?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          ended_reason: string | null
          id: string
          ip_address: string | null
          last_seen_at: string
          login_at: string
          logout_at: string | null
          metadata: Json
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          ended_reason?: string | null
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          login_at?: string
          logout_at?: string | null
          metadata?: Json
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          ended_reason?: string | null
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          login_at?: string
          logout_at?: string | null
          metadata?: Json
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          preferred_filters: Json | null
          user_id: string
        }
        Insert: {
          preferred_filters?: Json | null
          user_id: string
        }
        Update: {
          preferred_filters?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_logs: {
        Row: {
          delivery_status: string | null
          direction: string
          id: string
          lead_id: string | null
          message_sent: string | null
          message_type: string | null
          outcome: string | null
          phone: string | null
          sent_at: string | null
          sent_by: string | null
          template_id: string | null
          wa_message_id: string | null
        }
        Insert: {
          delivery_status?: string | null
          direction?: string
          id?: string
          lead_id?: string | null
          message_sent?: string | null
          message_type?: string | null
          outcome?: string | null
          phone?: string | null
          sent_at?: string | null
          sent_by?: string | null
          template_id?: string | null
          wa_message_id?: string | null
        }
        Update: {
          delivery_status?: string | null
          direction?: string
          id?: string
          lead_id?: string | null
          message_sent?: string | null
          message_type?: string | null
          outcome?: string | null
          phone?: string | null
          sent_at?: string | null
          sent_by?: string | null
          template_id?: string | null
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          lead_type: string | null
          meta_category: string | null
          name: string
          requires_meta_approval: boolean | null
          sent_by: string | null
          variables: Json | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id: string
          lead_type?: string | null
          meta_category?: string | null
          name: string
          requires_meta_approval?: boolean | null
          sent_by?: string | null
          variables?: Json | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          lead_type?: string | null
          meta_category?: string | null
          name?: string
          requires_meta_approval?: boolean | null
          sent_by?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      campaign_analytics: {
        Row: {
          city: string | null
          contacted_leads: number | null
          industry: string | null
          strategy_leads: number | null
          total_leads: number | null
          total_revenue: number | null
          won_leads: number | null
        }
        Relationships: []
      }
      city_rankings: {
        Row: {
          city: string | null
          fresh_opportunity: number | null
          pending_calls: number | null
          total_leads: number | null
        }
        Relationships: []
      }
      renewal_alerts: {
        Row: {
          business_name: string | null
          city: string | null
          created_at: string | null
          days_until_renewal: number | null
          health_score: number | null
          id: string | null
          last_upsell_attempt: string | null
          monthly_value: number | null
          niche: string | null
          notes: string | null
          onboarding_completed: boolean | null
          owner_name: string | null
          phone: string | null
          primary_email: string | null
          renewal_date: string | null
          services: string[] | null
          start_date: string | null
          status: string | null
          upsell_notes: string | null
          user_id: string | null
        }
        Insert: {
          business_name?: string | null
          city?: string | null
          created_at?: string | null
          days_until_renewal?: never
          health_score?: number | null
          id?: string | null
          last_upsell_attempt?: string | null
          monthly_value?: number | null
          niche?: string | null
          notes?: string | null
          onboarding_completed?: boolean | null
          owner_name?: string | null
          phone?: string | null
          primary_email?: string | null
          renewal_date?: string | null
          services?: string[] | null
          start_date?: string | null
          status?: string | null
          upsell_notes?: string | null
          user_id?: string | null
        }
        Update: {
          business_name?: string | null
          city?: string | null
          created_at?: string | null
          days_until_renewal?: never
          health_score?: number | null
          id?: string | null
          last_upsell_attempt?: string | null
          monthly_value?: number | null
          niche?: string | null
          notes?: string | null
          onboarding_completed?: boolean | null
          owner_name?: string | null
          phone?: string | null
          primary_email?: string | null
          renewal_date?: string | null
          services?: string[] | null
          start_date?: string | null
          status?: string | null
          upsell_notes?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "telecaller_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "telecaller_leaderboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      telecaller_analytics: {
        Row: {
          activity_date: string | null
          calls_connected: number | null
          calls_made: number | null
          full_name: string | null
          sessions_booked: number | null
          user_id: string | null
        }
        Relationships: []
      }
      telecaller_leaderboard: {
        Row: {
          avatar_url: string | null
          conversion_rate: number | null
          full_name: string | null
          interested_count: number | null
          streak: number | null
          total_calls: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_sessions_clamped: {
        Row: {
          created_at: string | null
          duration_hours_clamped: number | null
          ended_reason: string | null
          id: string | null
          ip_address: string | null
          last_seen_at: string | null
          login_at: string | null
          logout_at: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_hours_clamped?: never
          ended_reason?: string | null
          id?: string | null
          ip_address?: string | null
          last_seen_at?: string | null
          login_at?: string | null
          logout_at?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_hours_clamped?: never
          ended_reason?: string | null
          id?: string | null
          ip_address?: string | null
          last_seen_at?: string | null
          login_at?: string | null
          logout_at?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_sessions_view: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          ended_reason: string | null
          id: string | null
          ip_address: string | null
          last_seen_at: string | null
          login_at: string | null
          logout_at: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: never
          ended_reason?: string | null
          id?: string | null
          ip_address?: string | null
          last_seen_at?: string | null
          login_at?: string | null
          logout_at?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: never
          ended_reason?: string | null
          id?: string | null
          ip_address?: string | null
          last_seen_at?: string | null
          login_at?: string | null
          logout_at?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_inactive_sessions: {
        Args: { timeout_minutes?: number }
        Returns: number
      }
      create_default_onboarding: {
        Args: { p_client_id: string }
        Returns: undefined
      }
      create_default_qa_checklist: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      extract_domain: { Args: { url: string }; Returns: string }
      fmos_client_id: { Args: never; Returns: string }
      fmos_is_staff: { Args: never; Returns: boolean }
      fmos_jsonb_diff: { Args: { new_row: Json; old_row: Json }; Returns: Json }
      fmos_role: { Args: never; Returns: string }
      get_dashboard_state: { Args: never; Returns: Json }
      get_my_role: { Args: never; Returns: string }
      increment_package_value: {
        Args: { p_amount: number; p_package_id: string }
        Returns: undefined
      }
      normalize_email: { Args: { raw_email: string }; Returns: string }
      normalize_phone: { Args: { raw_phone: string }; Returns: string }
      save_dashboard_state: { Args: { new_state: Json }; Returns: undefined }
    }
    Enums: {
      lead_status:
        | "new"
        | "first_call_pending"
        | "calling"
        | "contacted"
        | "qualified"
        | "strategy_booked"
        | "strategy_completed"
        | "nurture"
        | "disqualified"
        | "closed_won"
        | "closed_lost"
        | "proposal_sent"
      milestone_status:
        | "not_started"
        | "in_progress"
        | "ready_for_approval"
        | "approved"
      project_status:
        | "not_started"
        | "in_progress"
        | "needs_attention"
        | "on_hold"
        | "completed"
        | "closed"
      service_type:
        | "web_dev"
        | "local_seo"
        | "seo"
        | "performance_marketing"
        | "social_media"
        | "whatsapp_marketing"
      task_status:
        | "not_started"
        | "in_progress"
        | "in_review"
        | "needs_revision"
        | "blocked"
        | "completed"
        | "pending"
      user_role:
        | "admin"
        | "sales_executive"
        | "marketing_strategist"
        | "project_manager"
        | "execution_specialist"
        | "client"
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
      lead_status: [
        "new",
        "first_call_pending",
        "calling",
        "contacted",
        "qualified",
        "strategy_booked",
        "strategy_completed",
        "nurture",
        "disqualified",
        "closed_won",
        "closed_lost",
        "proposal_sent",
      ],
      milestone_status: [
        "not_started",
        "in_progress",
        "ready_for_approval",
        "approved",
      ],
      project_status: [
        "not_started",
        "in_progress",
        "needs_attention",
        "on_hold",
        "completed",
        "closed",
      ],
      service_type: [
        "web_dev",
        "local_seo",
        "seo",
        "performance_marketing",
        "social_media",
        "whatsapp_marketing",
      ],
      task_status: [
        "not_started",
        "in_progress",
        "in_review",
        "needs_revision",
        "blocked",
        "completed",
        "pending",
      ],
      user_role: [
        "admin",
        "sales_executive",
        "marketing_strategist",
        "project_manager",
        "execution_specialist",
        "client",
      ],
    },
  },
} as const
