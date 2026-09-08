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

    return {
      summary: typeof insight.summary === "string" ? insight.summary : "AI analysis completed.",
      risks: Array.isArray(insight.risks) ? insight.risks.map(String) : [],
      recommendations: Array.isArray(insight.recommendations) ? insight.recommendations.map(String) : [],
      confidence: typeof insight.confidence === "number"
        ? Math.max(0, Math.min(1, insight.confidence))
        : 0,
      generatedAt: new Date(),
    };
  }
}