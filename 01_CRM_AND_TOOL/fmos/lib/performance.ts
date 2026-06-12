import { createClient } from "@/lib/supabase";

export async function updateTelecallerStats(userId: string, outcome: string) {
    const supabase = createClient();

    // 1. Get current stats
    const { data: stats, error: fetchError } = await (supabase
        .from("telecaller_stats" as any)
        .select("*")
        .eq("user_id", userId)
        .single()) as { data: any, error: any };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let currentStreak = stats?.current_streak || 0;
    let highestStreak = stats?.highest_streak || 0;
    let totalCalls = stats?.total_calls || 0;
    let totalInterested = stats?.total_interested || 0;

    // 2. Increment volume
    totalCalls += 1;
    if (outcome === 'interested' || outcome === 'strategy_booked') {
        totalInterested += 1;
    }

    // 3. Handle Streak Logic
    if (stats?.last_call_at) {
        const lastCall = new Date(stats.last_call_at);
        const lastCallDay = new Date(lastCall.getFullYear(), lastCall.getMonth(), lastCall.getDate());

        const diffTime = today.getTime() - lastCallDay.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            // First call of a new day, following a call yesterday
            currentStreak += 1;
        } else if (diffDays > 1) {
            // Broke the streak
            currentStreak = 1;
        } else if (diffDays === 0) {
            // Already called today, streak stays the same
        }
    } else {
        // Very first call ever
        currentStreak = 1;
    }

    if (currentStreak > highestStreak) {
        highestStreak = currentStreak;
    }

    // 4. Upsert stats
    const { error: upsertError } = await (supabase
        .from("telecaller_stats" as any))
        .upsert({
            user_id: userId,
            current_streak: currentStreak,
            highest_streak: highestStreak,
            total_calls: totalCalls,
            total_interested: totalInterested,
            last_call_at: now.toISOString(),
            updated_at: now.toISOString()
        });

    if (upsertError) {
        console.error("Error updating telecaller stats:", upsertError);
    }

    return { currentStreak, totalCalls };
}

/**
 * Calculate the package tier based on monthly MRR value.
 * Used when creating new clients from confirmed agreements.
 */
export function calculatePackageTier(monthlyMrr: number): string {
  if (monthlyMrr >= 50000) return "custom";
  if (monthlyMrr >= 25000) return "pro";
  if (monthlyMrr >= 10000) return "growth";
  return "starter";
}
