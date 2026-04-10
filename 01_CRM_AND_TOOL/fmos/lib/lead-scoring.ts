export interface LeadScoreFactors {
    hasPhone: boolean;
    hasBusinessName: boolean;
    isNicheKitComplete: boolean;
    hasFollowUpScheduled: boolean;
    isInterestedOnce: boolean;
    isNotInterested: boolean;
    noContactIn7Days: boolean;
}

export function calculateLeadScore(factors: LeadScoreFactors): number {
    let score = 0;

    if (factors.hasPhone) score += 2;
    if (factors.hasBusinessName) score += 1;
    if (factors.isNicheKitComplete) score += 2;
    if (factors.hasFollowUpScheduled) score += 2;
    if (factors.isInterestedOnce) score += 3;
    if (factors.isNotInterested) score -= 2;
    if (factors.noContactIn7Days) score -= 1;

    // Clamp score between 0 and 10
    return Math.max(0, Math.min(10, score));
}

export function getScoreVisuals(score: number): { label: string; color: string; icon: string } {
    if (score >= 7) return { label: "Hot", color: "text-emerald-500", icon: "🟢" };
    if (score >= 4) return { label: "Warm", color: "text-amber-500", icon: "🟡" };
    return { label: "Cold", color: "text-rose-500", icon: "🔴" };
}
