import { TABS, columnLetter, type TabName } from "../data/sheets/schema";
import { googleFetch } from "./auth";

const BASE = "https://sheets.googleapis.com/v4/spreadsheets";

function spreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
  if (!id) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not set (see .env.example)");
  return id;
}

/** Data rows of a tab (header excluded) as objects keyed by the header names. */
export async function readTab(tab: TabName): Promise<Record<string, string>[]> {
  const header = TABS[tab];
  const range = encodeURIComponent(`${tab}!A2:${columnLetter(header.length - 1)}`);
  const body = await googleFetch<{ values?: string[][] }>(`${BASE}/${spreadsheetId()}/values/${range}`);
  return (body.values ?? []).map((row) =>
    Object.fromEntries(header.map((name, i) => [name, (row[i] ?? "").toString()])),
  );
}

/** Appends rows below the last row of the tab, in chunks to keep requests small. */
export async function appendRows(tab: TabName, rows: (string | number)[][], chunkSize = 1000): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    await googleFetch(
      `${BASE}/${spreadsheetId()}/values/${encodeURIComponent(`${tab}!A1`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      { method: "POST", body: JSON.stringify({ values: rows.slice(i, i + chunkSize) }) },
    );
  }
}

/** Writes several ranges at once, e.g. [{ range: "reviews!A12:G12", values: [[...]] }]. */
export async function updateRanges(data: { range: string; values: (string | number)[][] }[]): Promise<void> {
  if (data.length === 0) return;
  await googleFetch(`${BASE}/${spreadsheetId()}/values:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({ valueInputOption: "RAW", data }),
  });
}
