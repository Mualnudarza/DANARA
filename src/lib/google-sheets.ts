import type { AllocationLog, FinanceData, IncomeType, LedgerEntry, Wallet } from "./types";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: { client_id: string; scope: string; callback: (response: { access_token?: string; error?: string }) => void }) => { requestAccessToken: (config?: { prompt?: string }) => void };
        };
      };
    };
  }
}

const API = "https://sheets.googleapis.com/v4/spreadsheets";
const HEADERS = {
  SETTING: ["id", "name", "allocationsJson"],
  DOMPET: ["id", "name", "account", "color"],
  TRANSAKSI: ["id", "date", "note", "walletId", "kind", "amount", "groupId", "incomeTypeId"],
  ALOKASI: ["id", "date", "incomeTypeId", "amount", "groupId"],
  TRANSFER: ["groupId", "date", "fromWalletId", "toWalletId", "amount", "note"],
};

function value(value: unknown) {
  return value == null ? "" : String(value);
}

async function request(path: string, token: string, init?: RequestInit) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error?.message ?? "Google Sheets menolak permintaan.");
  return response.json();
}

export async function loadGoogleIdentity() {
  if (window.google) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Identity gagal dimuat."));
    document.head.append(script);
  });
}

export async function getAccessToken(clientId: string) {
  await loadGoogleIdentity();
  return new Promise<string>((resolve, reject) => {
    const client = window.google?.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      callback: (response) => response.access_token ? resolve(response.access_token) : reject(new Error(response.error ?? "Otorisasi Google gagal.")),
    });
    client?.requestAccessToken({ prompt: "consent" });
  });
}

export async function createSpreadsheet(token: string) {
  const result = await request("", token, {
    method: "POST",
    body: JSON.stringify({ properties: { title: "Danara Keuangan Personal" }, sheets: Object.keys(HEADERS).map((title) => ({ properties: { title } })) }),
  });
  return result.spreadsheetId as string;
}

export async function ensureTemplate(spreadsheetId: string, token: string) {
  const sheet = await request(`/${spreadsheetId}?fields=sheets.properties`, token);
  const existing = new Set<string>(sheet.sheets.map((item: { properties: { title: string } }) => item.properties.title));
  const missing = Object.keys(HEADERS).filter((name) => !existing.has(name));
  if (missing.length) {
    await request(`/${spreadsheetId}:batchUpdate`, token, { method: "POST", body: JSON.stringify({ requests: missing.map((title) => ({ addSheet: { properties: { title } } })) }) });
  }
  for (const [tab, header] of Object.entries(HEADERS)) {
    await request(`/${spreadsheetId}/values/${tab}!A1:Z1?valueInputOption=RAW`, token, { method: "PUT", body: JSON.stringify({ values: [header] }) });
  }
}

export async function readFinanceData(spreadsheetId: string, token: string): Promise<FinanceData> {
  const result = await request(`/${spreadsheetId}/values:batchGet?ranges=SETTING!A2:C&ranges=DOMPET!A2:D&ranges=TRANSAKSI!A2:H&ranges=ALOKASI!A2:E`, token);
  const rows = result.valueRanges.map((range: { values?: string[][] }) => range.values ?? []);
  const [settings, wallets, entries, allocations] = rows;
  return {
    incomeTypes: settings.filter((row: string[]) => row[0]).map((row: string[]) => ({ id: row[0], name: row[1], allocations: JSON.parse(row[2] || "{}") })) as IncomeType[],
    wallets: wallets.filter((row: string[]) => row[0]).map((row: string[]) => ({ id: row[0], name: row[1], account: row[2], color: row[3] })) as Wallet[],
    entries: entries.filter((row: string[]) => row[0]).map((row: string[]) => ({ id: row[0], date: row[1], note: row[2], walletId: row[3], kind: row[4], amount: Number(row[5]), groupId: row[6] || undefined, incomeTypeId: row[7] || undefined })) as LedgerEntry[],
    allocations: allocations.filter((row: string[]) => row[0]).map((row: string[]) => ({ id: row[0], date: row[1], incomeTypeId: row[2], amount: Number(row[3]), groupId: row[4] })) as AllocationLog[],
  };
}

export async function saveFinanceData(spreadsheetId: string, token: string, data: FinanceData) {
  const transfers = data.entries.filter((entry) => entry.kind === "transfer-out").map((entry) => {
    const destination = data.entries.find((other) => other.groupId === entry.groupId && other.kind === "transfer-in");
    return [entry.groupId, entry.date, entry.walletId, destination?.walletId ?? "", entry.amount, entry.note];
  });
  const values: Record<string, string[][]> = {
    SETTING: [HEADERS.SETTING, ...data.incomeTypes.map((item) => [item.id, item.name, JSON.stringify(item.allocations)])],
    DOMPET: [HEADERS.DOMPET, ...data.wallets.map((item) => [item.id, item.name, item.account, item.color])],
    TRANSAKSI: [HEADERS.TRANSAKSI, ...data.entries.map((item) => [item.id, item.date, item.note, item.walletId, item.kind, value(item.amount), item.groupId ?? "", item.incomeTypeId ?? ""])],
    ALOKASI: [HEADERS.ALOKASI, ...data.allocations.map((item) => [item.id, item.date, item.incomeTypeId, value(item.amount), item.groupId])],
    TRANSFER: [HEADERS.TRANSFER, ...transfers.map((row) => row.map(value))],
  };
  await Promise.all(Object.entries(values).map(([tab, rows]) => request(`/${spreadsheetId}/values/${tab}!A:Z:clear`, token, { method: "POST", body: "{}" }).then(() => request(`/${spreadsheetId}/values/${tab}!A1?valueInputOption=RAW`, token, { method: "PUT", body: JSON.stringify({ values: rows }) }))));
}
