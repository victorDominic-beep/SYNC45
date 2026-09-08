import { ReconciliationReport } from "../../shared/types/ReconciliationReport";
import { AIInsight } from "../models/AIInsight";

export interface AIProvider {
  generateInsights(
    report: ReconciliationReport
  ): Promise<AIInsight>;
}