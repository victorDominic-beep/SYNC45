export interface AIInsight {
  summary: string;
  risks: string[];
  recommendations: string[];
  confidence: number;
  generatedAt: Date;
}