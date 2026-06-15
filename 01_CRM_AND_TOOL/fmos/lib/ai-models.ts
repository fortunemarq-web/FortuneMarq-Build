/**
 * Single source of truth for Anthropic model IDs.
 * Update model versions HERE only — do not hardcode model strings elsewhere.
 * This module is pure (no server imports) so client components can use it too.
 */
export const ANTHROPIC_MODELS = {
  // High-volume, low-cost features (call scripts, objection handlers, briefs)
  fast: "claude-haiku-4-5-20251001",
  // Higher-quality reasoning (strategy generation, weekly/daily reports)
  smart: "claude-sonnet-4-6",
} as const;

export type AnthropicModel = (typeof ANTHROPIC_MODELS)[keyof typeof ANTHROPIC_MODELS];
