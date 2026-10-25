import type { Clinic } from '../types/clinic';

const SHEETS_CONFIG_KEY = 'dental_crm_google_sheets_config';

export interface GoogleSheetsConfig {
  webAppUrl: string;
  sheetUrl?: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}

export const DEFAULT_SHEETS_CONFIG: GoogleSheetsConfig = {
  webAppUrl: '',
  sheetUrl: '',
  autoSync: false,
  lastSyncedAt: undefined
};

export function getGoogleSheetsConfig(): GoogleSheetsConfig {
  try {
    const raw = localStorage.getItem(SHEETS_CONFIG_KEY);
    if (!raw) return DEFAULT_SHEETS_CONFIG;
    return { ...DEFAULT_SHEETS_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SHEETS_CONFIG;
  }
}

export function saveGoogleSheetsConfig(config: GoogleSheetsConfig): void {
  try {
    localStorage.setItem(SHEETS_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

/**
 * Standard copyable Google Apps Script code for the user to paste into their Google Sheet.
 * Extensions > Apps Script > Paste and Deploy as Web App.
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// Dental Lead Finder & CRM - Google Sheets Sync Script
// Paste this code into: Extensions > Apps Script in your Google Sheet, then click 'Deploy > New deployment'
// Set 'Execute as': 'Me' and 'Who has access': 'Anyone'.

function setupSheetHeaders(sheet) {
  var headers = [
    "Lead ID",
    "Clinic Name",
    "City",
    "Locality",
    "Contact Number",
    "Website Status",
    "Sales Status",
    "Follow-up Date",
    "Address",
    "Google Maps URL",
    "Website URL",
    "Outreach Notes",
    "Date Added",
    "Last Updated"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#EEF2FF");
  sheet.setFrozenRows(1);
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ status: "success", clinics: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var headers = data[0];
  var clinics = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[1]) continue; // Skip empty rows

    clinics.push({
      id: String(row[0] || ""),
      name: String(row[1] || ""),
      city: String(row[2] || ""),
      locality: String(row[3] || ""),
      phone: String(row[4] || ""),
      websiteStatus: String(row[5] || "No Website Found"),
      salesStatus: String(row[6] || "To Call"),
      followUpDate: String(row[7] || ""),
      address: String(row[8] || ""),
      mapsUrl: String(row[9] || ""),
      websiteUrl: String(row[10] || ""),
      notes: String(row[11] || ""),
      createdAt: String(row[12] || new Date().toISOString()),
      updatedAt: String(row[13] || new Date().toISOString())
    });
  }

  return ContentService.createTextOutput(JSON.stringify({ status: "success", clinics: clinics }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    if (payload.action === "syncAll") {
      var clinics = payload.clinics || [];
      sheet.clearContents();
      setupSheetHeaders(sheet);

      if (clinics.length > 0) {
        var rows = clinics.map(function(c) {
          return [
            c.id || "",
            c.name || "",
            c.city || "",
            c.locality || "",
            c.phone || "",
            c.websiteStatus || "No Website Found",
            c.salesStatus || "To Call",
            c.followUpDate || "",
            c.address || "",
            c.mapsUrl || "",
            c.websiteUrl || "",
            c.notes || "",
            c.createdAt || new Date().toISOString(),
            c.updatedAt || new Date().toISOString()
          ];
        });
        sheet.getRange(2, 1, rows.length, 14).setValues(rows);
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success", count: clinics.length }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;

/**
 * Pushes all local clinics to the Google Sheet via the Apps Script Web App.
 * Uses text/plain to avoid CORS preflight issues with Google Apps Script redirects.
 */
export async function pushClinicsToGoogleSheet(webAppUrl: string, clinics: Clinic[]): Promise<{ count: number }> {
  const cleanUrl = webAppUrl.trim();
  if (!cleanUrl) {
    throw new Error('Please enter your Google Apps Script Web App URL first.');
  }

  const payload = {
    action: 'syncAll',
    clinics,
    syncedAt: new Date().toISOString()
  };

  // Google Apps Script requires text/plain for simple CORS POST requests
  const response = await fetch(cleanUrl, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(data.message || 'Google Sheets sync failed.');
  }

  // Update last synced time in config
  const currentConfig = getGoogleSheetsConfig();
  saveGoogleSheetsConfig({
    ...currentConfig,
    lastSyncedAt: new Date().toISOString()
  });

  return { count: clinics.length };
}

/**
 * Pulls clinics from the Google Sheet into the CRM.
 */
export async function pullClinicsFromGoogleSheet(webAppUrl: string): Promise<Clinic[]> {
  const cleanUrl = webAppUrl.trim();
  if (!cleanUrl) {
    throw new Error('Please enter your Google Apps Script Web App URL first.');
  }

  const response = await fetch(cleanUrl, {
    method: 'GET',
    mode: 'cors'
  });

  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(data.message || 'Failed to pull from Google Sheet.');
  }

  const list = data.clinics || [];
  const validClinics: Clinic[] = [];

  for (const item of list) {
    if (!item.name || !item.city) continue;
    validClinics.push({
      id: item.id || crypto.randomUUID(),
      name: item.name,
      city: item.city,
      locality: item.locality || '',
      phone: item.phone || undefined,
      websiteStatus: item.websiteStatus || 'No Website Found',
      salesStatus: item.salesStatus || 'To Call',
      followUpDate: item.followUpDate || undefined,
      address: item.address || undefined,
      mapsUrl: item.mapsUrl || undefined,
      websiteUrl: item.websiteUrl || undefined,
      notes: item.notes || undefined,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString()
    });
  }

  // Update last synced time in config
  const currentConfig = getGoogleSheetsConfig();
  saveGoogleSheetsConfig({
    ...currentConfig,
    lastSyncedAt: new Date().toISOString()
  });

  return validClinics;
}

/**
 * Quick test to verify the Web App URL responds properly.
 */
export async function testGoogleSheetConnection(webAppUrl: string): Promise<boolean> {
  const cleanUrl = webAppUrl.trim();
  if (!cleanUrl) return false;

  try {
    const response = await fetch(cleanUrl, { method: 'GET', mode: 'cors' });
    const data = await response.json();
    return data && data.status === 'success';
  } catch {
    return false;
  }
}
