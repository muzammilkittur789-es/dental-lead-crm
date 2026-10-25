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
  autoSync: true, // Enabled by default so saves, edits, and deletions sync automatically
  lastSyncedAt: undefined
};

export function getGoogleSheetsConfig(): GoogleSheetsConfig {
  try {
    const raw = localStorage.getItem(SHEETS_CONFIG_KEY);
    if (!raw) return DEFAULT_SHEETS_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SHEETS_CONFIG,
      ...parsed,
      // If user has a webAppUrl configured, ensure autoSync defaults to true unless explicitly turned off
      autoSync: parsed.autoSync !== undefined ? parsed.autoSync : true
    };
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
 * Includes automatic text wrapping, custom column sizing, and real-time row deletion.
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// Dental Lead Finder & CRM - Google Sheets Sync Script v2
// Features: Automatic Text Wrapping, Header Styling, Real-Time Row Deletion

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
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#0F766E")
    .setFontColor("#FFFFFF")
    .setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
}

function applySheetFormatting(sheet) {
  var lastRow = Math.max(sheet.getLastRow(), 1);
  var lastCol = Math.max(sheet.getLastColumn(), 14);

  // Enable text wrapping across all rows and columns
  sheet.getRange(1, 1, lastRow, lastCol).setWrap(true);
  sheet.getRange(1, 1, lastRow, lastCol).setVerticalAlignment("top");

  // Optimal readable column widths
  sheet.setColumnWidth(1, 110); // Lead ID
  sheet.setColumnWidth(2, 220); // Clinic Name
  sheet.setColumnWidth(3, 120); // City
  sheet.setColumnWidth(4, 140); // Locality
  sheet.setColumnWidth(5, 140); // Contact Number
  sheet.setColumnWidth(6, 150); // Website Status
  sheet.setColumnWidth(7, 130); // Sales Status
  sheet.setColumnWidth(8, 120); // Follow-up Date
  sheet.setColumnWidth(9, 230); // Address
  sheet.setColumnWidth(10, 200); // Google Maps URL
  sheet.setColumnWidth(11, 180); // Website URL
  sheet.setColumnWidth(12, 260); // Outreach Notes
  sheet.setColumnWidth(13, 140); // Date Added
  sheet.setColumnWidth(14, 140); // Last Updated
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ status: "success", clinics: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

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

    // 1. Delete a single clinic row directly
    if (payload.action === "deleteClinic") {
      var targetId = String(payload.clinicId || "").trim();
      var targetName = String(payload.clinicName || "").toLowerCase().trim();
      var data = sheet.getDataRange().getValues();
      var deleted = false;

      // Scan rows from bottom to top so index shift doesn't corrupt deletion
      for (var r = data.length - 1; r >= 1; r--) {
        var rowId = String(data[r][0] || "").trim();
        var rowName = String(data[r][1] || "").toLowerCase().trim();

        if ((targetId && rowId === targetId) || (targetName && rowName === targetName)) {
          sheet.deleteRow(r + 1);
          deleted = true;
        }
      }

      applySheetFormatting(sheet);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", deleted: deleted }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Full Sync (Adds, Updates, Deletions)
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

      applySheetFormatting(sheet);

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
 * Deletes a specific clinic from the Google Sheet.
 * Attempts targeted row deletion; falls back to full sync if needed.
 */
export async function deleteClinicFromGoogleSheet(
  webAppUrl: string,
  clinicId: string,
  clinicName: string,
  remainingClinics: Clinic[]
): Promise<void> {
  const cleanUrl = webAppUrl.trim();
  if (!cleanUrl) return;

  try {
    const payload = {
      action: 'deleteClinic',
      clinicId,
      clinicName
    };

    const response = await fetch(cleanUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data && data.status === 'success') {
      const currentConfig = getGoogleSheetsConfig();
      saveGoogleSheetsConfig({
        ...currentConfig,
        lastSyncedAt: new Date().toISOString()
      });
      return;
    }
  } catch {
    // If targeted deletion wasn't supported by the user's current Apps Script version, fallback to full sync
  }

  // Fallback to sync remaining clinics
  await pushClinicsToGoogleSheet(cleanUrl, remainingClinics);
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
