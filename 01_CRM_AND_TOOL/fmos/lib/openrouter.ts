import { createServerClientWithCookies } from "./supabase-server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

export async function callOpenRouter(
    systemPrompt: string,
    userPrompt: string,
    feature: string,
    maxTokens: number = 500
): Promise<string> {
    if (!ANTHROPIC_API_KEY) {
        console.error("ANTHROPIC_API_KEY is missing from environment variables.");
        return "AI Error: Configuration missing. Please set ANTHROPIC_API_KEY.";
    }

    try {
        const response = await fetch(ANTHROPIC_URL, {
            method: "POST",
            headers: {
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                model: MODEL,
                max_tokens: maxTokens,
                system: systemPrompt,
                messages: [
                    { role: "user", content: userPrompt }
                ],
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Anthropic API Error:", data);
            return "AI Error: Request failed. Please try again.";
        }

        const aiResponse = data.content?.[0]?.text || "AI Error: No response received.";

        logAIUsage(feature, userPrompt, aiResponse, data.usage?.input_tokens + data.usage?.output_tokens || 0);

        return aiResponse;
    } catch (error) {
        console.error("Anthropic API Exception:", error);
        return "AI Error: Connection failed. Check your internet connection.";
    }
}

async function logAIUsage(feature: string, input: string, output: string, tokens: number) {
    try {
        const supabase = await createServerClientWithCookies();
        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from("ai_usage_logs" as any).insert({
            feature,
            input_summary: input.substring(0, 500),
            output_summary: output.substring(0, 500),
            tokens_used: tokens,
            model: MODEL,
            created_by: user?.id
        });
    } catch (e) {
        console.error("Failed to log AI usage:", e);
    }
}
