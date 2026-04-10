export type ContentType = 'blog' | 'reel' | 'carousel' | 'story' | 'video' | 'email' | 'case_study' | 'other'
export type ContentPlatform = 'instagram' | 'linkedin' | 'website' | 'youtube' | 'facebook' | 'whatsapp' | 'multiple'
export type ContentStatus = 'idea' | 'draft' | 'in_review' | 'scheduled' | 'published'
export type AdPlatform = 'meta' | 'google' | 'linkedin' | 'youtube' | 'other'
export type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft'
export type CampaignObjective = 'lead_generation' | 'brand_awareness' | 'traffic' | 'conversions' | 'reach'

export interface ContentPiece {
    id: string
    title: string
    content_type: ContentType
    platform: ContentPlatform
    target_keyword: string | null
    status: ContentStatus
    scheduled_date: string | null
    published_date: string | null
    author_id: string | null
    notes: string | null
    content_url: string | null
    impressions: number
    clicks: number
    engagement_rate: number
    leads_attributed: number
    created_at: string
    updated_at: string
    // Joined fields (from profiles join)
    author_name?: string | null
}

export interface SeoKeyword {
    id: string
    keyword: string
    target_url: string | null
    current_position: number | null
    previous_position: number | null
    search_volume: number
    difficulty: 'low' | 'medium' | 'high' | null
    last_checked_at: string | null
    notes: string | null
    is_tracking: boolean
    created_at: string
    updated_at: string
}

export interface OrganicTrafficSnapshot {
    id: string
    snapshot_date: string
    total_sessions: number
    organic_sessions: number
    new_users: number
    bounce_rate: number
    avg_session_duration: number
    top_landing_page: string | null
    source: 'manual' | 'google_analytics' | 'google_search_console'
    created_at: string
}

export interface AdCampaign {
    id: string
    campaign_name: string
    platform: AdPlatform
    status: CampaignStatus
    objective: CampaignObjective | null
    monthly_budget: number
    spend_mtd: number
    impressions: number
    clicks: number
    leads_generated: number
    conversions: number
    cpc: number
    cpl: number
    roas: number
    start_date: string | null
    end_date: string | null
    external_campaign_id: string | null
    notes: string | null
    created_at: string
    updated_at: string
}

export interface LeadSourceAttribution {
    id: string
    lead_id: string
    utm_source: string | null
    utm_medium: string | null
    utm_campaign: string | null
    utm_content: string | null
    utm_term: string | null
    referrer_url: string | null
    landing_page: string | null
    content_piece_id: string | null
    ad_campaign_id: string | null
    created_at: string
}

export interface MarketingWeeklyBrief {
    id: string
    week_start_date: string
    week_end_date: string
    summary_text: string | null
    key_wins: string[]
    key_concerns: string[]
    recommended_action: string | null
    organic_sessions_delta: number | null
    paid_spend_delta: number | null
    leads_delta: number | null
    generated_by: 'manual' | 'ai'
    created_at: string
}

// Dashboard aggregate types (used for computed display data)
export interface MarketingOverviewStats {
    total_organic_sessions_mtd: number
    organic_sessions_delta_pct: number
    total_ad_spend_mtd: number
    total_ad_budget_mtd: number
    total_leads_from_marketing: number
    leads_delta_pct: number
    content_published_mtd: number
    content_target_mtd: number
    avg_cpl: number
    top_performing_keyword: string | null
    top_performing_campaign: string | null
}
