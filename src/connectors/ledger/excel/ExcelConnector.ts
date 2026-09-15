import * as XLSX from "xlsx";
import { promises as fs } from "fs";
import path from "path";
import { ExcelConfig } from "./ExcelConfig";
import { Connector } from "../../../shared/interfaces/Connector";

export interface CSVConfig {
  filePath: string;
}

export class CSVConnector implements Connector {
  private static readonly canonicalColumnAliases: Record<string, string[]> = {
    reference: [
      "reference",
      "transactionReference",
      "transactionRef",
      "transaction_ref",
      "transactionId",
      "transaction_id",
      "txnRef",
      "ref",
      "referenceNo",
      "reference_no",
    ],
    amount: [
      "amount",
      "amountPaid",
      "amount_paid",
      "amountPaidNGN",
      "amount_paid_ngn",
      "value",
      "ledgerAmount",
    ],
    currency: [
      "currency",
      "currencyCode",
      "currency_code",
      "ledgerCurrency",
    ],
    status: [
      "status",
      "paymentStatus",
      "payment_status",
      "transactionStatus",
      "transaction_status",
      "state",
    ],
    customer: [
      "customer",
      "senderName",
      "customerEmail",
      "customer_email",
      "customerName",
      "customer_name",
      "email",
      "payerEmail",
      "payer_email",
    ],
    paidAt: [
      "paidAt",
      "paid_at",
      "createdAt",
      "created_at",
      "transactionDate",
      "transaction_date",
      "processedAt",
      "processed_at",
    ],
  };

  static readonly canonicalColumns = Object.keys(
    CSVConnector.canonicalColumnAliases
  );

  constructor(private readonly config: CSVConfig) {}

  static async validateFile(filePath: string): Promise<void> {
    const ext = path.extname(filePath).toLowerCase();

    if (ext !== ".csv") {
      throw new Error("Uploaded ledger file must be a CSV file.");
    }

    try {
      await fs.access(filePath);
    } catch {
      throw new Error("Uploaded CSV file is unreadable or missing.");
    }

    const workbook = XLSX.readFile(filePath);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: null });

    if (!rows.length) {
      throw new Error("Uploaded CSV file contains no rows.");
    }

    const headerMap = CSVConnector.getCanonicalHeaders(rows[0] as Record<string, any>);
    const requiredColumns = CSVConnector.canonicalColumns.filter(
      (column) => column !== "currency" && column !== "customer"
    );
    const missing = requiredColumns.filter(
      (column) => !headerMap[column]
    );

    if (missing.length) {
      throw new Error(
        `Uploaded CSV file is missing required columns: ${missing.join(", ")}.`
      );
    }

    for (const row of rows as Array<Record<string, any>>) {
      const reference = CSVConnector.getMappedValue(row, "reference");
      const amount = CSVConnector.getMappedValue(row, "amount");
      const status = CSVConnector.getMappedValue(row, "status");
      const paidAt = CSVConnector.getMappedValue(row, "paidAt");

      if (
        !reference ||
        !status ||
        !paidAt ||
        amount === undefined ||
        amount === null ||
        Number.isNaN(Number(amount))
      ) {
        throw new Error(
          "Uploaded CSV file contains a malformed row or unsupported value."
        );
      }
    }
  }

  private static getCanonicalHeaders(row: Record<string, any>): Record<string, string> {
    const headers: Record<string, string> = {};
    const keys = Object.keys(row).map((key) => key.toLowerCase());

    for (const canonical of CSVConnector.canonicalColumns) {
      const aliases = CSVConnector.canonicalColumnAliases[canonical]
        .map((alias) => alias.toLowerCase());
      const found = keys.find((key) => aliases.includes(key));
      if (found) {
        headers[canonical] = found;
      }
    }

    return headers;
  }

  private static getMappedValue(row: Record<string, any>, canonical: string): string | undefined {
    const aliases = CSVConnector.canonicalColumnAliases[canonical].map(
      (alias) => alias.toLowerCase()
    );

    const key = Object.keys(row).find((field) =>
      aliases.includes(field.toLowerCase())
    );

    if (!key) {
      return undefined;
    }

    return String(row[key] ?? "");
  }

  private static toCanonicalTransaction(row: Record<string, any>): Record<string, any> {
    return {
      reference: CSVConnector.getMappedValue(row, "reference")?.trim(),
      amount: Number(CSVConnector.getMappedValue(row, "amount") ?? 0),
      currency: String(CSVConnector.getMappedValue(row, "currency") ?? "NGN")
        .trim()
        .toUpperCase(),
      status: String(CSVConnector.getMappedValue(row, "status") ?? "")
        .trim()
        .toLowerCase(),
      customer: String(CSVConnector.getMappedValue(row, "customer") ?? "")
        .trim(),
      paidAt: String(CSVConnector.getMappedValue(row, "paidAt") ?? "")
        .trim(),
    };
  }

  async connect(): Promise<void> {
    await CSVConnector.validateFile(this.config.filePath);
  }

  async fetchTransactions(): Promise<any[]> {
    await CSVConnector.validateFile(this.config.filePath);

    const workbook = XLSX.readFile(this.config.filePath);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet, {
      defval: null,
    }) as Array<Record<string, any>>;

    return rows.map((row) => CSVConnector.toCanonicalTransaction(row));
  }

  async healthCheck(): Promise<boolean> {
    try {
      await CSVConnector.validateFile(this.config.filePath);
      return true;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    // CSV parse is file-backed; no long-lived connection.
  }
}

export class ExcelConnector implements Connector {
  constructor(private readonly config: ExcelConfig) {}

  static async validateFile(filePath: string): Promise<void> {
    if (!path.extname(filePath).match(/^\.xlsx?$/i)) {
      throw new Error("Uploaded ledger file must be an Excel file.");
    }

    await fs.access(filePath);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null }) as Array<Record<string, any>>;
    const requiredColumns = ["reference", "amount", "currency", "status", "customer", "paidAt"];
    const headers = new Set(Object.keys(rows[0] || {}).map((key) => key.toLowerCase()));
    const missing = requiredColumns.filter((column) => !headers.has(column.toLowerCase()));

    if (!rows.length) {
      throw new Error("Uploaded Excel file contains no rows.");
    }

    if (missing.length) {
      throw new Error(`Uploaded Excel file is missing required columns: ${missing.join(", ")}.`);
    }
  }

  async connect(): Promise<void> {
    await ExcelConnector.validateFile(this.config.filePath);
  }

  async fetchTransactions(): Promise<any[]> {
    const workbook = XLSX.readFile(this.config.filePath);

    const worksheet = workbook.Sheets[
      this.config.sheetName || workbook.SheetNames[0]
    ];

    if (!worksheet) {
      throw new Error(
        `Sheet "${this.config.sheetName || workbook.SheetNames[0]}" not found.`
      );
    }

    return XLSX.utils.sheet_to_json(worksheet);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const workbook = XLSX.readFile(this.config.filePath);

      return Boolean(workbook.Sheets[this.config.sheetName || workbook.SheetNames[0]]);
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    // No persistent connection to close.
  }
}