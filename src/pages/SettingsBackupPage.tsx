import React, { useState, useRef, useEffect } from 'react';
import type { Clinic } from '../types/clinic';
import { exportClinicsToCsv, exportClinicsToJson, parseAndValidateImport } from '../services/exportImport';
import type { ImportValidationResult } from '../services/exportImport';
import {
  getGoogleSheetsConfig,
  saveGoogleSheetsConfig,
  pushClinicsToGoogleSheet,
  pullClinicsFromGoogleSheet,
  testGoogleSheetConnection,
  GOOGLE_APPS_SCRIPT_TEMPLATE
} from '../services/googleSheets';
import type { GoogleSheetsConfig } from '../services/googleSheets';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import {
  Database,
  FileSpreadsheet,
  Download,
  Upload,
  Trash2,
  HardDrive,
  CheckCircle2,
  TableProperties,
  ExternalLink,
  Copy,
  Check,
  HelpCircle
} from 'lucide-react';

interface SettingsBackupPageProps {
  clinics: Clinic[];
  lastBackupTime: string | null;
  onRefreshClinics: () => Promise<void>;
  onClearAllClinics: () => Promise<void>;
  onBulkImportClinics: (clinicsToSave: Clinic[], mode: 'skip' | 'overwrite' | 'all') => Promise<{ saved: number; overwritten: number }>;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const SettingsBackupPage: React.FC<SettingsBackupPageProps> = ({
  clinics,
  lastBackupTime,
  onClearAllClinics,
  onBulkImportClinics,
  onShowToast
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear Database State
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  // Import State
  const [importResult, setImportResult] = useState<ImportValidationResult | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStrategy, setImportStrategy] = useState<'skip' | 'overwrite' | 'all'>('skip');
  const [isImporting, setIsImporting] = useState(false);

  // Google Sheets Integration State
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(getGoogleSheetsConfig());
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    setSheetsConfig(getGoogleSheetsConfig());
  }, []);

  const handleSaveSheetsConfig = (updated: GoogleSheetsConfig) => {
    setSheetsConfig(updated);
    saveGoogleSheetsConfig(updated);
  };

  const handleTestConnection = async () => {
    if (!sheetsConfig.webAppUrl) {
      onShowToast('error', 'Please enter your Google Apps Script Web App URL first.', 'URL Required');
      return;
    }
    try {
      setIsTestingConnection(true);
      const ok = await testGoogleSheetConnection(sheetsConfig.webAppUrl);
      if (ok) {
        onShowToast('success', 'Connected to Google Sheet successfully!', 'Connection Verified');
      } else {
        onShowToast('error', 'Could not reach your Google Sheet script. Check your Web App URL and deployment access permissions (must be "Anyone").', 'Connection Failed');
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handlePushToSheets = async () => {
    if (!sheetsConfig.webAppUrl) {
      onShowToast('error', 'Please enter your Google Apps Script Web App URL first.', 'URL Required');
      return;
    }
    try {
      setIsSyncingSheets(true);
      const res = await pushClinicsToGoogleSheet(sheetsConfig.webAppUrl, clinics);
      setSheetsConfig(getGoogleSheetsConfig());
      onShowToast('success', `Synced ${res.count} clinics to your Google Sheet!`, 'Google Sheet Updated');
    } catch (err) {
      onShowToast('error', err instanceof Error ? err.message : 'Sync failed.', 'Sync Error');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handlePullFromSheets = async () => {
    if (!sheetsConfig.webAppUrl) {
      onShowToast('error', 'Please enter your Google Apps Script Web App URL first.', 'URL Required');
      return;
    }
    try {
      setIsSyncingSheets(true);
      const pulledClinics = await pullClinicsFromGoogleSheet(sheetsConfig.webAppUrl);
      if (pulledClinics.length === 0) {
        onShowToast('info', 'Google Sheet is currently empty or has no clinic rows.', 'No Records');
      } else {
        await onBulkImportClinics(pulledClinics, 'overwrite');
        setSheetsConfig(getGoogleSheetsConfig());
        onShowToast('success', `Pulled ${pulledClinics.length} clinics from Google Sheet into CRM!`, 'Data Pulled');
      }
    } catch (err) {
      onShowToast('error', err instanceof Error ? err.message : 'Pull failed.', 'Pull Error');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleCopyScriptCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
    onShowToast('success', 'Google Apps Script code copied to clipboard!', 'Code Copied');
  };

  // Storage estimation
  const jsonSize = new Blob([JSON.stringify(clinics)]).size;
  const formattedSize =
    jsonSize < 1024
      ? `${jsonSize} Bytes`
      : jsonSize < 1024 * 1024
      ? `${(jsonSize / 1024).toFixed(1)} KB`
      : `${(jsonSize / (1024 * 1024)).toFixed(2)} MB`;

  const handleExportCsv = () => {
    if (clinics.length === 0) {
      onShowToast('info', 'No clinic records to export yet.', 'Export Empty');
      return;
    }
    exportClinicsToCsv(clinics);
    onShowToast('success', `Exported ${clinics.length} clinics to CSV.`, 'CSV Downloaded');
  };

  const handleExportJson = () => {
    if (clinics.length === 0) {
      onShowToast('info', 'No clinic records to backup yet.', 'Backup Empty');
      return;
    }
    exportClinicsToJson(clinics);
    onShowToast('success', `Exported full JSON backup of ${clinics.length} clinics.`, 'JSON Backup Saved');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = parseAndValidateImport(content, clinics);

      if (result.error) {
        onShowToast('error', result.error, 'Import Validation Failed');
      } else {
        setImportResult(result);
        setIsImportModalOpen(true);
      }
    };

    reader.onerror = () => {
      onShowToast('error', 'Could not read the uploaded JSON file.', 'Read Error');
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExecuteImport = async () => {
    if (!importResult) return;

    try {
      setIsImporting(true);
      let clinicsToProcess: Clinic[] = [];

      if (importStrategy === 'skip') {
        clinicsToProcess = importResult.newClinics;
      } else if (importStrategy === 'overwrite') {
        clinicsToProcess = importResult.validClinics;
      } else {
        clinicsToProcess = importResult.validClinics.map((c) => ({
          ...c,
          id: crypto.randomUUID()
        }));
      }

      const result = await onBulkImportClinics(clinicsToProcess, importStrategy);
      setIsImportModalOpen(false);
      setImportResult(null);

      onShowToast(
        'success',
        `Imported ${result.saved} clinics successfully (${result.overwritten} updated).`,
        'Import Completed'
      );
    } catch (err) {
      onShowToast('error', err instanceof Error ? err.message : 'Import failed.', 'Import Error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmClearAll = async () => {
    await onClearAllClinics();
    setIsClearModalOpen(false);
    setConfirmDeleteText('');
    onShowToast('info', 'All clinic records have been deleted from local storage.', 'Database Reset');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#17202F] tracking-tight">
          Settings, Storage & Cloud Backup
        </h1>
        <p className="text-sm text-[#667085] mt-0.5">
          Connect your Google Sheet as a free cloud database, manage local IndexedDB storage, and export files.
        </p>
      </div>

      {/* FEATURE: Google Sheets Integration Section */}
      <div className="bg-white rounded-xl border border-[#CCFBF1] bg-[#F0FDFA]/40 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#CCFBF1]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0F766E] text-white shadow-xs">
              <TableProperties className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#17202F]">
                  Google Sheets Cloud Database (100% Free)
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">
                  Cloud Sync
                </span>
              </div>
              <p className="text-xs text-[#667085] mt-0.5">
                Save your dental leads directly into a Google Sheet in your Google Drive. Free, private, and secure.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsInstructionsModalOpen(true)}
            className="px-3 py-1.5 bg-white hover:bg-[#F2F4F7] text-[#17202F] border border-[#E5E7EB] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <HelpCircle className="w-4 h-4 text-[#0F766E]" />
            <span>Setup Instructions (1 Min)</span>
          </button>
        </div>

        {/* URL Inputs */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#344054] mb-1 flex items-center justify-between">
              <span>Google Apps Script Web App URL:</span>
              {sheetsConfig.lastSyncedAt && (
                <span className="text-[11px] text-[#667085] font-normal">
                  Last synced: {new Date(sheetsConfig.lastSyncedAt).toLocaleString()}
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={sheetsConfig.webAppUrl}
                onChange={(e) => handleSaveSheetsConfig({ ...sheetsConfig, webAppUrl: e.target.value })}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3 py-2 text-xs border border-[#E5E7EB] rounded-lg bg-white text-[#17202F] focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] font-mono"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingConnection || !sheetsConfig.webAppUrl}
                className="px-3.5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-medium shrink-0 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isTestingConnection ? 'Testing...' : 'Test'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#344054] mb-1">
                Your Google Sheet URL (Optional - for quick opening):
              </label>
              <input
                type="url"
                value={sheetsConfig.sheetUrl || ''}
                onChange={(e) => handleSaveSheetsConfig({ ...sheetsConfig, sheetUrl: e.target.value })}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full px-3 py-2 text-xs border border-[#E5E7EB] rounded-lg bg-white text-[#17202F] focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 p-2 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#344054] cursor-pointer w-full">
                <input
                  type="checkbox"
                  checked={sheetsConfig.autoSync}
                  onChange={(e) => handleSaveSheetsConfig({ ...sheetsConfig, autoSync: e.target.checked })}
                  className="rounded text-[#0F766E] focus:ring-[#0F766E]"
                />
                <span className="font-medium">
                  Auto-sync changes to Google Sheet on save
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Sync Actions */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-[#CCFBF1]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePushToSheets}
              disabled={isSyncingSheets || !sheetsConfig.webAppUrl || clinics.length === 0}
              className="px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isSyncingSheets ? 'Syncing...' : `Push All (${clinics.length}) to Sheet`}</span>
            </button>

            <button
              type="button"
              onClick={handlePullFromSheets}
              disabled={isSyncingSheets || !sheetsConfig.webAppUrl}
              className="px-4 py-2 bg-white hover:bg-[#F7F8FA] text-[#17202F] border border-[#E5E7EB] text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Pull from Google Sheet</span>
            </button>
          </div>

          {sheetsConfig.sheetUrl && (
            <a
              href={sheetsConfig.sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-medium text-[#0F766E] hover:text-[#115E59] flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Google Sheet</span>
            </a>
          )}
        </div>
      </div>

      {/* Storage Health & Statistics */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-[#17202F] flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-[#0F766E]" />
          Local Storage Health & Statistics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
            <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">
              Storage Engine
            </span>
            <span className="text-sm font-semibold text-[#17202F] font-mono mt-0.5 block">
              IndexedDB + LocalStorage
            </span>
            <span className="text-[11px] text-[#15803D] font-medium">✓ High speed offline cache</span>
          </div>

          <div className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
            <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">
              Clinics Stored
            </span>
            <span className="text-sm font-semibold text-[#17202F] font-mono mt-0.5 block tabular-nums">
              {clinics.length} Records
            </span>
            <span className="text-[11px] text-[#667085]">Approx. {formattedSize}</span>
          </div>

          <div className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
            <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">
              Last Backup
            </span>
            <span className="text-sm font-semibold text-[#17202F] mt-0.5 block">
              {lastBackupTime ? new Date(lastBackupTime).toLocaleDateString() : 'Never Backed Up'}
            </span>
            <span className={`text-[11px] font-medium ${lastBackupTime ? 'text-[#15803D]' : 'text-[#B45309]'}`}>
              {lastBackupTime ? '✓ Recent file backup' : '⚠️ File backup recommended'}
            </span>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-[#17202F] flex items-center gap-2">
          <Download className="w-4 h-4 text-[#0F766E]" />
          File Export & Spreadsheets
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* CSV Export Card */}
          <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 font-semibold text-[#17202F] text-xs sm:text-sm">
                <FileSpreadsheet className="w-4 h-4 text-[#0F766E]" />
                <span>Export to CSV Spreadsheet</span>
              </div>
              <p className="text-xs text-[#667085] mt-1 leading-normal">
                Formatted CSV spreadsheet ready for Microsoft Excel, Google Sheets, or Apple Numbers. Includes all clinic fields, contact numbers, and follow-up dates.
              </p>
            </div>

            <button
              onClick={handleExportCsv}
              disabled={clinics.length === 0}
              className="w-full py-2.5 px-4 bg-white hover:bg-[#F2F4F7] text-[#17202F] border border-[#E5E7EB] text-xs font-medium rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#0F766E]" />
              <span>Download CSV File (.csv)</span>
            </button>
          </div>

          {/* JSON Backup Card */}
          <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 font-semibold text-[#17202F] text-xs sm:text-sm">
                <Database className="w-4 h-4 text-[#0F766E]" />
                <span>Complete JSON Database Backup</span>
              </div>
              <p className="text-xs text-[#667085] mt-1 leading-normal">
                Exports an exact JSON snapshot of all saved clinics, schema version, notes, and metadata. Use this to restore your database or move records to another browser.
              </p>
            </div>

            <button
              onClick={handleExportJson}
              disabled={clinics.length === 0}
              className="w-full py-2.5 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Backup (.json)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-[#17202F] flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#0F766E]" />
          Restore JSON Backup
        </h2>
        <p className="text-xs text-[#667085]">
          Restore records from a previously exported JSON backup file. Before saving, the app validates each record and checks for duplicates.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2.5 bg-white hover:bg-[#F7F8FA] text-[#17202F] border border-[#E5E7EB] text-xs font-medium rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
        >
          <Upload className="w-4 h-4 text-[#0F766E]" />
          <span>Select JSON Backup File to Restore</span>
        </button>
      </div>

      {/* Danger Zone: Reset All Data */}
      <div className="bg-white rounded-xl border border-[#FECDCA] p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-semibold text-[#B42318] flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-[#B42318]" />
          Danger Zone: Clear Local Database
        </h2>
        <p className="text-xs text-[#667085]">
          Permanently delete all {clinics.length} dental clinics from this browser&apos;s IndexedDB database. (Does not delete your Google Sheet if connected).
        </p>

        <button
          onClick={() => {
            setConfirmDeleteText('');
            setIsClearModalOpen(true);
          }}
          disabled={clinics.length === 0}
          className="px-4 py-2 bg-[#FEF3F2] hover:bg-[#FEE4E2] text-[#B42318] border border-[#FECDCA] text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All Local Records</span>
        </button>
      </div>

      {/* Clear All Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isClearModalOpen}
        title="Delete All Clinic Records?"
        message={`Are you sure you want to permanently delete all ${clinics.length} clinics from local storage? This action cannot be undone.`}
        confirmLabel="Delete Everything"
        cancelLabel="Keep Data"
        requiredWord="DELETE ALL"
        userWordInput={confirmDeleteText}
        onUserWordChange={setConfirmDeleteText}
        onConfirm={handleConfirmClearAll}
        onCancel={() => setIsClearModalOpen(false)}
      />

      {/* Google Sheets Setup Instructions Modal */}
      <Modal
        isOpen={isInstructionsModalOpen}
        onClose={() => setIsInstructionsModalOpen(false)}
        title="Connect Your Google Sheet in 4 Easy Steps"
        subtitle="100% free, private, and powered by Google Apps Script"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs text-[#344054]">
          <ol className="space-y-3 list-decimal list-inside font-medium leading-relaxed">
            <li>
              <strong className="text-[#17202F]">Create a New Google Sheet:</strong> Open{' '}
              <a
                href="https://sheets.new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0F766E] underline font-semibold"
              >
                sheets.new
              </a>{' '}
              in your browser and name it <em>&quot;Dental Leads CRM&quot;</em>.
            </li>

            <li>
              <strong className="text-[#17202F]">Open Apps Script:</strong> In the top menu of your Google Sheet, click{' '}
              <span className="font-mono bg-[#F2F4F7] px-1.5 py-0.5 rounded border border-[#E5E7EB] text-[#17202F]">
                Extensions &gt; Apps Script
              </span>.
            </li>

            <li>
              <strong className="text-[#17202F]">Paste Script Code:</strong> Delete whatever code is there, and paste the code below:
              <div className="mt-2 relative">
                <button
                  type="button"
                  onClick={handleCopyScriptCode}
                  className="absolute right-2 top-2 px-2.5 py-1 bg-white hover:bg-[#F2F4F7] text-[#17202F] rounded border border-[#E5E7EB] text-[11px] font-medium flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5 text-[#667085]" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
                <pre className="p-3 bg-[#17202F] text-[#5EEAD4] rounded-lg text-[11px] font-mono overflow-x-auto max-h-48 border border-[#344054]">
                  {GOOGLE_APPS_SCRIPT_TEMPLATE}
                </pre>
              </div>
            </li>

            <li>
              <strong className="text-[#17202F]">Deploy as Web App:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 font-normal text-[#667085] space-y-1">
                <li>Click the blue <strong>Deploy</strong> button at top right &gt; <strong>New deployment</strong>.</li>
                <li>Click the gear icon next to &quot;Select type&quot; and choose <strong>Web app</strong>.</li>
                <li>Set <strong>Execute as:</strong> <em>Me</em>.</li>
                <li>Set <strong>Who has access:</strong> <em>Anyone</em> (this allows your browser to save records).</li>
                <li>Click <strong>Deploy</strong> and copy the <strong>Web app URL</strong>!</li>
              </ul>
            </li>
          </ol>

          <div className="p-3 bg-[#F0FDFA] border border-[#CCFBF1] rounded-lg text-[#115E59] text-[11px]">
            Paste that <strong>Web app URL</strong> into the Google Sheets section on the Settings page, and click <strong>Test</strong>.
            That&apos;s it! All your clinic data will now sync directly to your personal Google Sheet!
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setIsInstructionsModalOpen(false)}
              className="px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg font-medium text-xs cursor-pointer shadow-xs"
            >
              Done / Got It
            </button>
          </div>
        </div>
      </Modal>

      {/* JSON Import Validation & Duplicate Resolution Modal */}
      {importResult && (
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => {
            setIsImportModalOpen(false);
            setImportResult(null);
          }}
          title="Review Backup Import"
          subtitle="Validate imported records and choose duplicate resolution strategy"
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                <span className="text-[#667085] block text-[11px] uppercase">Total Records</span>
                <span className="text-base font-semibold text-[#17202F] tabular-nums">{importResult.totalParsed}</span>
              </div>
              <div className="p-3 bg-[#ECFDF5] rounded-lg border border-[#A7F3D0]">
                <span className="text-[#15803D] block text-[11px] uppercase">New Clinics</span>
                <span className="text-base font-semibold text-[#15803D] tabular-nums">{importResult.newClinics.length}</span>
              </div>
              <div className="p-3 bg-[#FFFAEB] rounded-lg border border-[#FEDF89]">
                <span className="text-[#B54708] block text-[11px] uppercase">Duplicates</span>
                <span className="text-base font-semibold text-[#B54708] tabular-nums">{importResult.duplicateMatches.length}</span>
              </div>
            </div>

            {importResult.invalidCount > 0 && (
              <div className="p-2.5 bg-[#FEF3F2] border border-[#FECDCA] rounded-lg text-xs text-[#B42318]">
                Skipping {importResult.invalidCount} invalid rows with missing required clinic name or city.
              </div>
            )}

            {importResult.duplicateMatches.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#F2F4F7]">
                <label className="block text-xs font-semibold text-[#17202F]">
                  Duplicate Resolution Strategy:
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="importStrategy"
                      checked={importStrategy === 'skip'}
                      onChange={() => setImportStrategy('skip')}
                      className="mt-0.5 text-[#0F766E]"
                    />
                    <div>
                      <span className="font-medium text-[#17202F] block">
                        Skip Duplicates (Recommended)
                      </span>
                      <span className="text-[11px] text-[#667085]">
                        Only import the {importResult.newClinics.length} new clinics. Existing records are untouched.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="importStrategy"
                      checked={importStrategy === 'overwrite'}
                      onChange={() => setImportStrategy('overwrite')}
                      className="mt-0.5 text-[#0F766E]"
                    />
                    <div>
                      <span className="font-medium text-[#17202F] block">
                        Overwrite Existing Records
                      </span>
                      <span className="text-[11px] text-[#667085]">
                        Update the {importResult.duplicateMatches.length} matching clinics with the imported details.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="importStrategy"
                      checked={importStrategy === 'all'}
                      onChange={() => setImportStrategy('all')}
                      className="mt-0.5 text-[#0F766E]"
                    />
                    <div>
                      <span className="font-medium text-[#17202F] block">
                        Import All (Create Copies)
                      </span>
                      <span className="text-[11px] text-[#667085]">
                        Import every record with new IDs regardless of duplicate names or phone numbers.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#F2F4F7]">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportResult(null);
                }}
                className="px-4 py-2 text-xs font-medium text-[#667085] hover:bg-[#F2F4F7] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isImporting}
                onClick={handleExecuteImport}
                className="px-4 py-2 text-xs font-medium bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm & Import Records</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
