// L6 — Monthly Report + Health Score Loader
// FortuneMarq FMOS — Monthly Reports System

import reportSchema from './monthly_report_schema.json';
import healthScoreConfig from './client_health_score.json';

export { reportSchema, healthScoreConfig };

// ─── Types ──────────────────────────────────────────────────────────────────

export type HealthTier = 'Excellent' | 'Good' | 'Needs Attention' | 'At Risk';

export interface MonthlyReportData {
  client_business_name: string;
  client_niche: string;
  client_city: string;
  report_month: string; // e.g. "April 2026"
  report_generated_date: string;

  rankings: {
    keywords_tracked: {
      keyword: string;
      current_position: number | null;
      previous_position: number | null;
      change: number | null;
      status: 'Top 3' | 'Top 10' | 'Top 20' | 'Top 50' | 'Not Ranking';
    }[];
    keywords_in_top_10: number;
    keywords_improved: number;
    rankings_summary: string;
  };

  traffic: {
    total_visits: number;
    total_visits_last_month: number;
    traffic_change_percent: number;
    traffic_by_source: {
      organic: number;
      direct: number;
      referral: number;
      social: number;
    };
    top_pages: {
      page_url: string;
      page_name: string;
      visits: number;
    }[];
    traffic_summary: string;
  };

  leads: {
    calls_received: number;
    form_submissions: number;
    whatsapp_enquiries: number;
    total_leads: number;
    total_leads_last_month: number;
    leads_change_percent: number;
    leads_summary: string;
  };

  gmb: {
    profile_views: number;
    search_impressions: number;
    gmb_calls: number;
    direction_requests: number;
    photo_views: number;
    reviews_received: number;
    average_rating: number;
    gmb_summary: string;
  };

  work_done: {
    deliverables: {
      category: string;
      task: string;
      status: 'Completed' | 'In Progress' | 'Scheduled';
    }[];
    work_summary: string;
  };

  next_month: {
    planned_tasks: {
      category: string;
      task: string;
    }[];
    focus_note: string;
  };

  health_score: {
    rankings_score: number;
    traffic_score: number;
    leads_score: number;
    gmb_score: number;
    total_score: number;
    health_tier: HealthTier;
    score_note: string;
  };
}

// ─── Health Score Calculator ────────────────────────────────────────────────

export function calculateHealthScore(data: MonthlyReportData): {
  rankings_score: number;
  traffic_score: number;
  leads_score: number;
  gmb_score: number;
  total_score: number;
  health_tier: HealthTier;
} {
  const { rankings, traffic, leads, gmb } = data;
  const isNewClient = !traffic.total_visits_last_month;

  // Rankings score
  let rankingsScore = isNewClient ? 10 : 0;
  if (!isNewClient) {
    const total = rankings.keywords_tracked.length;
    const inTop10 = rankings.keywords_in_top_10;
    const pct = total > 0 ? (inTop10 / total) * 100 : 0;
    if (pct >= 80) rankingsScore = 25;
    else if (pct >= 60) rankingsScore = 20;
    else if (pct >= 40) rankingsScore = 15;
    else if (pct >= 20) rankingsScore = 10;
    else rankingsScore = 5;
    // Bonuses
    const hasTop3 = rankings.keywords_tracked.some(k => k.current_position !== null && k.current_position <= 3);
    if (hasTop3) rankingsScore += 3;
    if (rankings.keywords_improved >= 3) rankingsScore += 2;
  }

  // Traffic score
  let trafficScore = isNewClient ? 10 : 0;
  if (!isNewClient) {
    const change = traffic.traffic_change_percent;
    if (change >= 20) trafficScore = 25;
    else if (change >= 10) trafficScore = 20;
    else if (change >= 1) trafficScore = 15;
    else if (change === 0) trafficScore = 10;
    else if (change >= -10) trafficScore = 7;
    else trafficScore = 3;
    // Bonus
    const organicPct = traffic.total_visits > 0
      ? (traffic.traffic_by_source.organic / traffic.total_visits) * 100
      : 0;
    if (organicPct >= 70) trafficScore += 3;
  }

  // Leads score
  let leadsScore = isNewClient ? 10 : 0;
  if (!isNewClient) {
    const total = leads.total_leads;
    if (total >= 20) leadsScore = 25;
    else if (total >= 15) leadsScore = 20;
    else if (total >= 10) leadsScore = 16;
    else if (total >= 5) leadsScore = 12;
    else if (total >= 1) leadsScore = 7;
    else leadsScore = 0;
    if (leads.leads_change_percent >= 20) leadsScore += 3;
  }

  // GMB score
  let gmbScore = 0;
  const views = gmb.profile_views;
  const newReviews = gmb.reviews_received;
  if (views >= 500 && newReviews >= 1) gmbScore = 25;
  else if (views >= 300 && newReviews >= 1) gmbScore = 20;
  else if (views >= 200 || newReviews >= 1) gmbScore = 15;
  else if (views >= 100) gmbScore = 10;
  else if (views > 0) gmbScore = 5;
  // Bonuses
  if (newReviews >= 2) gmbScore += 3;
  if (gmb.gmb_calls >= 20) gmbScore += 2;

  // Cap each pillar at 30 (max 25 + 5 bonus), total at 100
  const cap = (score: number, max: number) => Math.min(score, max);
  const r = cap(rankingsScore, 30);
  const t = cap(trafficScore, 30);
  const l = cap(leadsScore, 30);
  const g = cap(gmbScore, 30);
  const total = Math.min(Math.round(r + t + l + g), 100);

  let health_tier: HealthTier;
  if (total >= 80) health_tier = 'Excellent';
  else if (total >= 60) health_tier = 'Good';
  else if (total >= 40) health_tier = 'Needs Attention';
  else health_tier = 'At Risk';

  return {
    rankings_score: r,
    traffic_score: t,
    leads_score: l,
    gmb_score: g,
    total_score: total,
    health_tier,
  };
}

// ─── Tier Config Lookup ──────────────────────────────────────────────────────

export function getTierConfig(tier: HealthTier) {
  return healthScoreConfig.tiers.find(t => t.tier === tier);
}
