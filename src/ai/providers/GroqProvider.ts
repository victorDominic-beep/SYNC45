import Groq from "groq-sdk";

import { AIConfig } from "../../config/AIConfig";
import { ReconciliationReport } from "../../shared/types/ReconciliationReport";

import { AIInsight } from "../models/AIInsight";
import { AIProvider } from "./AIProvider";
import { InsightPrompt } from "../prompts/InsightPrompt";

export class GroqProvider implements AIProvider {
  private readonly client: Groq;

  constructor() {
    this.client = new Groq({
      apiKey: AIConfig.GROQ_API_KEY,
    });
  }

  async generateInsights(
    report: ReconciliationReport
  ): Promise<AIInsight> {
    const prompt = InsightPrompt.build(report);

    const completion =
      await this.client.chat.completions.create({
        model: AIConfig.MODEL,
        temperature: AIConfig.TEMPERATURE,
        max_completion_tokens: AIConfig.MAX_TOKENS,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

    const response = completion.choices[0]?.message?.content ?? "";
    const json = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/)?.[1] ?? response;
    const insight = JSON.parse(json);

    if (!insight || typeof insight !== "object" || Array.isArray(insight)) {
      throw new Error("AI response must be a JSON object.");
    }

    const confidence = Number(insight.confidence);

    return {
      summary: typeof insight.summary === "string" && insight.summary.trim()
        ? insight.summary.trim()
        : "AI analysis completed.",
      risks: Array.isArray(insight.risks)
        ? insight.risks.filter((item: unknown): item is string => typeof item === "string" && item.trim() !== "").map((item: string) => item.trim())
        : [],
      recommendations: Array.isArray(insight.recommendations)
        ? insight.recommendations.filter((item: unknown): item is string => typeof item === "string" && item.trim() !== "").map((item: string) => item.trim())
        : [],
      confidence: Number.isFinite(confidence)
        ? Math.max(0, Math.min(1, confidence > 1 ? confidence / 100 : confidence))
        : 0,
      generatedAt: new Date(),
    };
  }
}