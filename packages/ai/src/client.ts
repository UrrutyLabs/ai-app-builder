import Anthropic from "@anthropic-ai/sdk";
import { env } from "@repo/domain/env";

const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined;
};

export const anthropic =
  globalForAnthropic.anthropic ??
  new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

if (process.env.NODE_ENV !== "production") {
  globalForAnthropic.anthropic = anthropic;
}
