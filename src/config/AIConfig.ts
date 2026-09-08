export class AIConfig {
  static readonly GROQ_API_KEY =
    process.env.GROQ_API_KEY || "";

  static readonly MODEL =
    process.env.GROQ_MODEL ||
    "llama-3.3-70b-versatile";

  static readonly TEMPERATURE = 0.2;

  static readonly MAX_TOKENS = 1000;
}