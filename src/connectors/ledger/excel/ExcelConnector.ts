import * as XLSX from "xlsx";
import { ExcelConfig } from "./ExcelConfig";
import { Connector } from "../../../shared/interfaces/Connector";

export class ExcelConnector implements Connector {
  constructor(private readonly config: ExcelConfig) {}

  async connect(): Promise<void> {
    XLSX.readFile(this.config.filePath);
  }

  async fetchTransactions(): Promise<any[]> {
    const workbook = XLSX.readFile(this.config.filePath);

    const worksheet = workbook.Sheets[this.config.sheetName];

    if (!worksheet) {
      throw new Error(
        `Sheet "${this.config.sheetName}" not found.`
      );
    }

    return XLSX.utils.sheet_to_json(worksheet);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const workbook = XLSX.readFile(this.config.filePath);

      return Boolean(
        workbook.Sheets[this.config.sheetName]
      );
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    // No persistent connection to close.
  }
}