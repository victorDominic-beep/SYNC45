import { ReconciliationReport } from "../shared/types/ReconciliationReport";
import { CSVExporter } from "./CSVExporter";
import { PDFExporter } from "./PDFExporter";
import { ExcelExporter } from "./ExcelExporter";

export enum ExportFormat {
  CSV = "CSV",
  PDF = "PDF",
  EXCEL = "EXCEL",
}

export class ExportService {
  constructor(
    private readonly csvExporter: CSVExporter,
    private readonly pdfExporter: PDFExporter,
    private readonly excelExporter: ExcelExporter
  ) {}

  export(
    report: ReconciliationReport,
    format: ExportFormat
  ): string | string[][] {
    switch (format) {
      case ExportFormat.CSV:
        return this.csvExporter.export(report);

      case ExportFormat.PDF:
        return this.pdfExporter.export(report);

      case ExportFormat.EXCEL:
        return this.excelExporter.export(report);

      default:
        throw new Error("Unsupported export format.");
    }
  }
}