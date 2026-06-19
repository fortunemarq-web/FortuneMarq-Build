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

                // 2. Ad Campaigns. Budget comes from manual ad_campaigns; actual spend +
                //    ad-sourced leads come from ad_insights_daily (the CSV import target) when
                //    present, falling back to the manual ad_campaigns.spend_mtd otherwise.
                const { data: activeCampaigns } = await supabase
                    .from('ad_campaigns' as any)
                    .select('spend_mtd, monthly_budget, leads_generated, cpl')
                    .eq('status', 'active')

                const { data: insightsMtd } = await supabase
                    .from('ad_insights_daily')
                    .select('spend, leads')
                    .gte('date', currentMonthStart)

                const totalBudget = (activeCampaigns as any[])?.reduce((sum, c) => sum + c.monthly_budget, 0) || 0
                const manualSpend = (activeCampaigns as any[])?.reduce((sum, c) => sum + (c.spend_mtd || 0), 0) || 0
                const manualLeads = (activeCampaigns as any[])?.reduce((sum, c) => sum + (c.leads_generated || 0), 0) || 0
                const insightSpend = (insightsMtd as any[])?.reduce((sum, x) => sum + Number(x.spend || 0), 0) || 0
                const insightLeads = (insightsMtd as any[])?.reduce((sum, x) => sum + Number(x.leads || 0), 0) || 0

                const totalSpend = insightSpend > 0 ? insightSpend : manualSpend
                const totalLeadsFromAds = insightLeads > 0 ? insightLeads : manualLeads
                const avgCpl = totalLeadsFromAds > 0 ? totalSpend / totalLeadsFromAds : 0

                // 3. Content Pieces
                const { count: contentCount } = await supabase
                    .from('content_pieces' as any)
                    .select('*', { count: 'exact', head: true })
                    .gte('published_date', currentMonthStart)
                    .eq('status', 'published')

                // 4. Leads this month + last month (real delta)
                const { count: leadsCount } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', currentMonthStart)

                const { count: prevLeadsCount } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', lastMonthStart)
                    .lte('created_at', lastMonthEnd)

                const leadsDelta = (prevLeadsCount || 0) > 0
                    ? (((leadsCount || 0) - (prevLeadsCount || 0)) / (prevLeadsCount || 1)) * 100
                    : 0

                // 5. Won this month (real conversion rate)
                const { count: wonCount } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .eq('outreach_stage', 'won')
                    .gte('created_at', currentMonthStart)

                const conversionRate = (leadsCount || 0) > 0
                    ? ((wonCount || 0) / (leadsCount || 1)) * 100
                    : 0

                setData({
                    total_organic_sessions_mtd: currentSessions,
                    organic_sessions_delta_pct: sessionsDelta,
                    total_ad_spend_mtd: totalSpend,
                    total_ad_budget_mtd: totalBudget,
                    total_leads_from_marketing: leadsCount || 0,
                    leads_delta_pct: Math.round(leadsDelta),
                    content_published_mtd: contentCount || 0,
                    content_target_mtd: 8, // Hardcoded target
                    avg_cpl: avgCpl,
                    top_performing_keyword: null,
                    top_performing_campaign: null,
                    won_mtd: wonCount || 0,
                    conversion_rate_pct: Math.round(conversionRate * 10) / 10,
                } as any)
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

/** Real daily inbound-lead counts for the last N days (for the Overview trend chart). */
export function useLeadsByDay(days: number = 7) {
    const [data, setData] = useState<{ name: string; leads: number }[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                const since = new Date(Date.now() - (days - 1) * 86400000)
                since.setHours(0, 0, 0, 0)
                const { data: rows } = await supabase
                    .from('leads')
                    .select('created_at')
                    .gte('created_at', since.toISOString())

                // Bucket per day
                const buckets: { name: string; leads: number; key: string }[] = []
                for (let i = 0; i < days; i++) {
                    const d = new Date(since.getTime() + i * 86400000)
                    buckets.push({
                        name: d.toLocaleDateString('en-IN', days <= 7 ? { weekday: 'short' } : { day: 'numeric', month: 'short' }),
                        leads: 0,
                        key: d.toISOString().split('T')[0],
                    })
                }
                    ; (rows as any[] || []).forEach((r) => {
                        const k = new Date(r.created_at).toISOString().split('T')[0]
                        const b = buckets.find((x) => x.key === k)
                        if (b) b.leads++
                    })
                setData(buckets.map(({ name, leads }) => ({ name, leads })))
            } catch (err) {
                console.error('Error fetching leads by day:', err)
                setData([])
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [days])

    return { data, loading }
}

/** Real lead-source distribution for the current month (for the Overview pie). */
export function useLeadSourceBreakdown() {
    const [data, setData] = useState<{ name: string; value: number; color: string }[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
                const { data: rows } = await supabase
                    .from('leads')
                    .select('source, lead_source')
                    .gte('created_at', monthStart)

                const palette = ['#42CA80', '#3b82f6', '#a855f7', '#fbbf24', '#ef4444', '#06b6d4', '#f97316', '#64748b']
                const counts: Record<string, { label: string; n: number }> = {}
                    ; (rows as any[] || []).forEach((r) => {
                        const key = r.source || 'unknown'
                        const label = r.lead_source || r.source || 'Unknown'
                        counts[key] ??= { label, n: 0 }
                        counts[key].n++
                    })
                const entries = Object.values(counts).sort((a, b) => b.n - a.n)
                setData(entries.map((e, i) => ({ name: e.label, value: e.n, color: palette[i % palette.length] })))
            } catch (err) {
                console.error('Error fetching lead source breakdown:', err)
                setData([])
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    return { data, loading }
}

/** Real weekly CPL per platform from ad_insights_daily (for the Paid Campaigns trend chart). */
export function useCplTrend(weeks: number = 8) {
    const [data, setData] = useState<{ week: string; meta: number | null; google: number | null; linkedin: number | null }[]>([])
    const [loading, setLoading] = useState(true)
    const [hasData, setHasData] = useState(false)

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                const since = new Date(Date.now() - weeks * 7 * 86400000)
                const { data: rows } = await supabase
                    .from('ad_insights_daily')
                    .select('date, platform, spend, leads')
                    .gte('date', since.toISOString().split('T')[0])

                const r = (rows as any[]) || []
                setHasData(r.length > 0)

                const out: { week: string; meta: number | null; google: number | null; linkedin: number | null }[] = []
                for (let w = weeks - 1; w >= 0; w--) {
                    const start = new Date(Date.now() - (w + 1) * 7 * 86400000)
                    const end = new Date(Date.now() - w * 7 * 86400000)
                    const inWeek = r.filter((x) => {
                        const d = new Date(x.date)
                        return d >= start && d < end
                    })
                    const cpl = (platform: string): number | null => {
                        const rows = inWeek.filter((x) => (x.platform || '').toLowerCase() === platform)
                        const spend = rows.reduce((s, x) => s + Number(x.spend || 0), 0)
                        const leads = rows.reduce((s, x) => s + Number(x.leads || 0), 0)
                        return leads > 0 ? Math.round(spend / leads) : null
                    }
                    out.push({ week: `W${weeks - w}`, meta: cpl('meta'), google: cpl('google'), linkedin: cpl('linkedin') })
                }
                setData(out)
            } catch (err) {
                console.error('Error fetching CPL trend:', err)
                setData([])
                setHasData(false)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [weeks])

    return { data, loading, hasData }
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
