"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import {
    ContentPiece,
    ContentStatus,
    ContentPlatform,
    SeoKeyword,
    AdCampaign,
    CampaignStatus,
    OrganicTrafficSnapshot,
    MarketingOverviewStats,
    MarketingWeeklyBrief
} from "@/types/marketing.types"

// Create the browser client once
const supabase = createClient()

export function useContentPieces(filters?: { status?: ContentStatus, platform?: ContentPlatform }) {
    const [data, setData] = useState<ContentPiece[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [refetchTrigger, setRefetchTrigger] = useState(0)

    const refetch = useCallback(() => {
        setRefetchTrigger(prev => prev + 1)
    }, [])

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                let query = supabase
                    .from('content_pieces' as any)
                    .select(`
            *,
            author:profiles(full_name)
          `)
                    .order('created_at', { ascending: false })

                if (filters?.status) {
                    query = (query as any).eq('status', filters.status)
                }
                if (filters?.platform) {
                    query = (query as any).eq('platform', filters.platform)
                }

                const { data: result, error: fetchError } = await query

                if (fetchError) throw fetchError

                // Transform results to include author_name
                const transformedData = result?.map((item: any) => ({
                    ...item,
                    author_name: item.author?.full_name || 'Unknown'
                })) || []

                setData(transformedData)
                setError(null)
            } catch (err: any) {
                console.error("Error fetching content pieces:", err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [filters?.status, filters?.platform, refetchTrigger])

    return { data, loading, error, refetch }
}

export function useSeoKeywords() {
    const [data, setData] = useState<SeoKeyword[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [refetchTrigger, setRefetchTrigger] = useState(0)

    const refetch = useCallback(() => {
        setRefetchTrigger(prev => prev + 1)
    }, [])

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                const { data: result, error: fetchError } = await supabase
                    .from('seo_keywords' as any)
                    .select('*')
                    .eq('is_tracking', true)
                    .order('current_position', { ascending: true, nullsFirst: false });

                if (fetchError) throw fetchError
                setData((result || []) as any as SeoKeyword[])
                setError(null)
            } catch (err: any) {
                console.error("Error fetching SEO keywords:", err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [refetchTrigger])

    return { data, loading, error, refetch }
}

export function useAdCampaigns(status?: CampaignStatus) {
    const [data, setData] = useState<AdCampaign[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [refetchTrigger, setRefetchTrigger] = useState(0)

    const refetch = useCallback(() => {
        setRefetchTrigger(prev => prev + 1)
    }, [])

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                let query = supabase
                    .from('ad_campaigns' as any)
                    .select('*')
                    .order('created_at', { ascending: false })

                if (status) {
                    query = (query as any).eq('status', status)
                }

                const { data: result, error: fetchError } = await query

                if (fetchError) throw fetchError
                setData((result || []) as any as AdCampaign[])
                setError(null)
            } catch (err: any) {
                console.error("Error fetching ad campaigns:", err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [status, refetchTrigger])

    return { data, loading, error, refetch }
}

export function useOrganicTrafficSnapshots(days: 7 | 30 | 90 = 30) {
    const [data, setData] = useState<OrganicTrafficSnapshot[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                const startDate = new Date()
                startDate.setDate(startDate.getDate() - days)

                const { data: result, error: fetchError } = await supabase
                    .from('organic_traffic_snapshots' as any)
                    .select('*')
                    .gte('snapshot_date', startDate.toISOString().split('T')[0])
                    .order('snapshot_date', { ascending: true });

                if (fetchError) throw fetchError
                setData((result || []) as any as OrganicTrafficSnapshot[])
                setError(null)
            } catch (err: any) {
                console.error("Error fetching traffic snapshots:", err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [days])

    return { data, loading, error }
}

export function useMarketingOverviewStats() {
    const [data, setData] = useState<MarketingOverviewStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [refetchTrigger, setRefetchTrigger] = useState(0)

    const refetch = useCallback(() => {
        setRefetchTrigger(prev => prev + 1)
    }, [])

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                const now = new Date()
                const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
                const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
                const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]

                // 1. Organic Traffic
                const { data: currentMonthTraffic } = await supabase
                    .from('organic_traffic_snapshots' as any)
                    .select('organic_sessions')
                    .gte('snapshot_date', currentMonthStart)

                const { data: prevMonthTraffic } = await supabase
                    .from('organic_traffic_snapshots' as any)
                    .select('organic_sessions')
                    .gte('snapshot_date', lastMonthStart)
                    .lte('snapshot_date', lastMonthEnd)

                const currentSessions = (currentMonthTraffic as any[])?.reduce((sum, s) => sum + s.organic_sessions, 0) || 0
                const prevSessions = (prevMonthTraffic as any[])?.reduce((sum, s) => sum + s.organic_sessions, 0) || 0
                const sessionsDelta = prevSessions > 0 ? ((currentSessions - prevSessions) / prevSessions) * 100 : 0

                // 2. Ad Campaigns
                const { data: activeCampaigns } = await supabase
                    .from('ad_campaigns' as any)
                    .select('spend_mtd, monthly_budget, leads_generated, cpl')
                    .eq('status', 'active')

                const totalSpend = (activeCampaigns as any[])?.reduce((sum, c) => sum + c.spend_mtd, 0) || 0
                const totalBudget = (activeCampaigns as any[])?.reduce((sum, c) => sum + c.monthly_budget, 0) || 0
                const totalLeadsFromAds = (activeCampaigns as any[])?.reduce((sum, c) => sum + (c.leads_generated || 0), 0) || 0
                const avgCpl = totalLeadsFromAds > 0 ? totalSpend / totalLeadsFromAds : 0

                // 3. Content Pieces
                const { count: contentCount } = await supabase
                    .from('content_pieces' as any)
                    .select('*', { count: 'exact', head: true })
                    .gte('published_date', currentMonthStart)
                    .eq('status', 'published')

                // 4. Leads by source (simplified for now)
                const { count: leadsCount } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', currentMonthStart)

                setData({
                    total_organic_sessions_mtd: currentSessions,
                    organic_sessions_delta_pct: sessionsDelta,
                    total_ad_spend_mtd: totalSpend,
                    total_ad_budget_mtd: totalBudget,
                    total_leads_from_marketing: leadsCount || 0,
                    leads_delta_pct: 0, // Mock for now
                    content_published_mtd: contentCount || 0,
                    content_target_mtd: 8, // Hardcoded target
                    avg_cpl: avgCpl,
                    top_performing_keyword: null,
                    top_performing_campaign: null
                })
                setError(null)
            } catch (err: any) {
                console.error("Error computing marketing stats:", err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [refetchTrigger])

    return { data, loading, error, refetch }
}

export function useLatestWeeklyBrief() {
    const [data, setData] = useState<MarketingWeeklyBrief | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [refetchTrigger, setRefetchTrigger] = useState(0)

    const refetch = useCallback(() => {
        setRefetchTrigger(prev => prev + 1)
    }, [])

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                const { data: result, error: fetchError } = await supabase
                    .from('marketing_weekly_briefs' as any)
                    .select('*')
                    .order('week_start_date', { ascending: false })
                    .limit(1)
                    .single();

                if (fetchError && fetchError.code !== 'PGRST116') throw fetchError // PGRST116 is 'No rows found'
                setData((result || null) as MarketingWeeklyBrief | null)
                setError(null)
            } catch (err: any) {
                console.error("Error fetching latest weekly brief:", err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [refetchTrigger])

    return { data, loading, error, refetch }
}
