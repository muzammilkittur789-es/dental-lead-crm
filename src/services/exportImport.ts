import type { Clinic, BackupData, PaymentStatus } from '../types/clinic';
import { recordBackupTime } from './db';
import { findDuplicates } from './duplicateDetector';

/**
 * Escapes a cell value for CSV output in accordance with RFC 4180.
 * Wraps values in double quotes and escapes internal quotes as ""
 */
function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const stringValue = String(value);
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Exports clinics to CSV and triggers a download in the user's browser.
 */
export function exportClinicsToCsv(clinics: Clinic[], fileNamePrefix = 'dental_leads'): void {
  const headers = [
    'Clinic Name',
    'City',
    'Locality',
    'Contact Number',
    'Website Status',
    'Sales Status',
    'Deal Value (INR)',
    'Payment Status',
    'Website Package',
    'Follow-up Date',
    'Full Address',
    'Website URL',
    'Google Maps URL',
    'Outreach Notes',
    'Date Added',
    'Last Updated',
    'Lead ID'
  ];

  const rows = clinics.map((c) => [
    escapeCsvCell(c.name),
    escapeCsvCell(c.city),
    escapeCsvCell(c.locality),
    escapeCsvCell(c.phone || ''),
    escapeCsvCell(c.websiteStatus),
    escapeCsvCell(c.salesStatus),
    escapeCsvCell(c.dealValue !== undefined ? c.dealValue : ''),
    escapeCsvCell(c.paymentStatus || ''),
    escapeCsvCell(c.dealPlan || ''),
    escapeCsvCell(c.followUpDate || ''),
    escapeCsvCell(c.address || ''),
    escapeCsvCell(c.websiteUrl || ''),
    escapeCsvCell(c.mapsUrl || ''),
    escapeCsvCell(c.notes || ''),
    escapeCsvCell(c.createdAt ? new Date(c.createdAt).toLocaleString() : ''),
    escapeCsvCell(c.updatedAt ? new Date(c.updatedAt).toLocaleString() : ''),
    escapeCsvCell(c.id)
  ]);

  const csvContent = [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  // Prepend UTF-8 BOM so Excel opens with proper encoding
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${fileNamePrefix}_${dateStr}.csv`;

  downloadBlob(blob, filename);
  recordBackupTime();
}

/**
 * Exports full JSON backup and triggers download
 */
export function exportClinicsToJson(clinics: Clinic[]): void {
  const backup: BackupData = {
    app: 'Dental Lead Finder & CRM',
    version: '1.1',
    exportedAt: new Date().toISOString(),
    totalClinics: clinics.length,
    clinics
  };

  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `dental_crm_backup_${dateStr}.json`;

  downloadBlob(blob, filename);
  recordBackupTime();
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.setAttribute('download', filename);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export interface ImportValidationResult {
  validClinics: Clinic[];
  newClinics: Clinic[];
  duplicateMatches: { importedClinic: Clinic; existingMatch: Clinic; reason: string }[];
  invalidCount: number;
  totalParsed: number;
  error?: string;
}

/**
 * Parses and validates an imported JSON file string against existing database records.
 */
export function parseAndValidateImport(jsonString: string, existingClinics: Clinic[]): ImportValidationResult {
  try {
    const parsed = JSON.parse(jsonString);

    let incomingList: unknown[] = [];
    if (Array.isArray(parsed)) {
      incomingList = parsed;
    } else if (parsed && Array.isArray(parsed.clinics)) {
      incomingList = parsed.clinics;
    } else {
      return {
        validClinics: [],
        newClinics: [],
        duplicateMatches: [],
        invalidCount: 0,
        totalParsed: 0,
        error: 'Invalid file format: JSON must contain a clinic array or backup object with a "clinics" array.'
      };
    }

    const validClinics: Clinic[] = [];
    let invalidCount = 0;

    for (const item of incomingList) {
      if (!item || typeof item !== 'object') {
        invalidCount++;
        continue;
      }

      const raw = item as Record<string, unknown>;
      const name = typeof raw.name === 'string' ? raw.name.trim() : '';
      const city = typeof raw.city === 'string' ? raw.city.trim() : '';
      const locality = typeof raw.locality === 'string' ? raw.locality.trim() : '';

      if (!name || !city || !locality) {
        invalidCount++;
        continue;
      }

      const validWebsiteStatuses = ['No Website Found', 'Has Website', 'Needs Verification'];
      const websiteStatus = validWebsiteStatuses.includes(raw.websiteStatus as string)
        ? (raw.websiteStatus as Clinic['websiteStatus'])
        : 'Needs Verification';

      const validSalesStatuses = [
        'To Call',
        'Called',
        'No Answer',
        'Interested',
        'Follow-up',
        'Ignored',
        'Not Interested',
        'Demo Ready',
        'Won',
        'Lost'
      ];
      const salesStatus = validSalesStatuses.includes(raw.salesStatus as string)
        ? (raw.salesStatus as Clinic['salesStatus'])
        : 'To Call';

      const validPaymentStatuses = ['Pending', 'Advance Paid', 'Fully Paid'];
      const paymentStatus = validPaymentStatuses.includes(raw.paymentStatus as string)
        ? (raw.paymentStatus as PaymentStatus)
        : undefined;

      const now = new Date().toISOString();
      const clinic: Clinic = {
        id: typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : crypto.randomUUID(),
        name,
        city,
        locality,
        address: typeof raw.address === 'string' ? raw.address.trim() : undefined,
        phone: typeof raw.phone === 'string' ? raw.phone.trim() : undefined,
        mapsUrl: typeof raw.mapsUrl === 'string' ? raw.mapsUrl.trim() : undefined,
        websiteUrl: typeof raw.websiteUrl === 'string' ? raw.websiteUrl.trim() : undefined,
        websiteStatus,
        salesStatus,
        notes: typeof raw.notes === 'string' ? raw.notes : undefined,
        followUpDate: typeof raw.followUpDate === 'string' && raw.followUpDate ? raw.followUpDate : undefined,
        dealValue: typeof raw.dealValue === 'number' ? raw.dealValue : undefined,
        paymentStatus,
        dealPlan: typeof raw.dealPlan === 'string' ? raw.dealPlan : undefined,
        dealDate: typeof raw.dealDate === 'string' ? raw.dealDate : undefined,
        createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
        updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now
      };

      validClinics.push(clinic);
    }

    // Duplicate detection against existing database
    const newClinics: Clinic[] = [];
    const duplicateMatches: { importedClinic: Clinic; existingMatch: Clinic; reason: string }[] = [];

    for (const incoming of validClinics) {
      const matches = findDuplicates(incoming, existingClinics);
      if (matches.length > 0) {
        duplicateMatches.push({
          importedClinic: incoming,
          existingMatch: matches[0].clinic,
          reason: matches[0].matchReason === 'both'
            ? 'Name and phone match'
            : matches[0].matchReason === 'phone'
            ? 'Phone number matches'
            : 'Clinic name matches'
        });
      } else {
        newClinics.push(incoming);
      }
    }

    return {
      validClinics,
      newClinics,
      duplicateMatches,
      invalidCount,
      totalParsed: incomingList.length
    };
  } catch (err) {
    return {
      validClinics: [],
      newClinics: [],
      duplicateMatches: [],
      invalidCount: 0,
      totalParsed: 0,
      error: `Failed to parse JSON file: ${err instanceof Error ? err.message : 'Unknown error'}`
    };
  }
}
