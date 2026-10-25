import { useState, useEffect, useCallback } from 'react';
import type {
  Clinic,
  ClinicFormData,
  ClinicFilterState,
  NavigationPage,
  SalesStatus,
  DuplicateMatch,
  PaymentStatus
} from './types/clinic';
import {
  getAllClinics,
  saveClinic,
  deleteClinic,
  clearAllClinics,
  bulkSaveClinics,
  getLastBackupTime
} from './services/db';
import { exportClinicsToCsv } from './services/exportImport';
import {
  getGoogleSheetsConfig,
  pushClinicsToGoogleSheet,
  deleteClinicFromGoogleSheet
} from './services/googleSheets';
import type { GoogleSheetsConfig } from './services/googleSheets';
import { calculateRevenueSummary } from './services/revenue';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { ToastContainer } from './components/common/Toast';
import type { ToastMessage } from './components/common/Toast';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { ClinicFormModal } from './components/clinics/ClinicFormModal';
import { ClinicDetailModal } from './components/clinics/ClinicDetailModal';
import { DuplicateWarningModal } from './components/clinics/DuplicateWarningModal';
import { DashboardPage } from './pages/DashboardPage';
import { FindClinicsPage } from './pages/FindClinicsPage';
import { AllClinicsPage } from './pages/AllClinicsPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { RevenuePage } from './pages/RevenuePage';
import { SettingsBackupPage } from './pages/SettingsBackupPage';

const INITIAL_FILTERS: ClinicFilterState = {
  searchQuery: '',
  city: 'ALL',
  locality: 'ALL',
  websiteStatus: 'ALL',
  salesStatus: 'ALL',
  followUpFilter: 'all',
  quickNoWebsite: false,
  quickFollowUpDue: false,
  sortBy: 'created-desc'
};

export function App() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');
  const [filters, setFilters] = useState<ClinicFilterState>(INITIAL_FILTERS);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(getGoogleSheetsConfig());

  // Modals & Dialogs State
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Deletion Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clinicToDelete, setClinicToDelete] = useState<Clinic | null>(null);

  // Duplicate Warning Modal State
  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
  const [pendingDuplicateMatches] = useState<DuplicateMatch[]>([]);
  const [pendingSaveData, setPendingSaveData] = useState<{ data: ClinicFormData; id?: string } | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string, title?: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load clinics from IndexedDB
  const refreshClinics = useCallback(async () => {
    try {
      const data = await getAllClinics();
      setClinics(data);
      setLastBackupTime(getLastBackupTime());
      setSheetsConfig(getGoogleSheetsConfig());
    } catch {
      addToast('error', 'Could not access IndexedDB storage.', 'Storage Error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    refreshClinics();
  }, [refreshClinics]);

  // Background Auto-sync helper for Google Sheets
  const triggerGoogleSheetsAutoSync = useCallback(
    async (updatedClinics: Clinic[]) => {
      const config = getGoogleSheetsConfig();
      if (config.webAppUrl && config.autoSync) {
        try {
          await pushClinicsToGoogleSheet(config.webAppUrl, updatedClinics);
          setSheetsConfig(getGoogleSheetsConfig());
        } catch {
          // Silent background fail
        }
      }
    },
    []
  );

  // Save / Update Clinic in IndexedDB
  const handleSaveClinic = async (data: ClinicFormData, id?: string) => {
    const now = new Date().toISOString();
    const clinicToSave: Clinic = {
      ...data,
      id: id || crypto.randomUUID(),
      createdAt: id ? (clinics.find((c) => c.id === id)?.createdAt || now) : now,
      updatedAt: now
    };

    await saveClinic(clinicToSave);
    const updatedClinics = await getAllClinics();
    setClinics(updatedClinics);

    // If detail modal was viewing this clinic, update it
    if (selectedClinic && selectedClinic.id === clinicToSave.id) {
      setSelectedClinic(clinicToSave);
    }

    addToast('success', `${clinicToSave.name} saved successfully.`, id ? 'Clinic Updated' : 'Clinic Added');
    triggerGoogleSheetsAutoSync(updatedClinics);
  };

  // Open Edit Modal
  const handleOpenEdit = (clinic: Clinic) => {
    setEditingClinic(clinic);
    setIsAddEditModalOpen(true);
    setIsDetailModalOpen(false);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingClinic(null);
    setIsAddEditModalOpen(true);
  };

  // Delete Clinic
  const handleOpenDelete = (clinic: Clinic) => {
    setClinicToDelete(clinic);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!clinicToDelete) return;
    const targetClinic = clinicToDelete;
    try {
      await deleteClinic(targetClinic.id);
      const updatedClinics = await getAllClinics();
      setClinics(updatedClinics);
      setIsDeleteDialogOpen(false);

      if (selectedClinic && selectedClinic.id === targetClinic.id) {
        setIsDetailModalOpen(false);
        setSelectedClinic(null);
      }

      const config = getGoogleSheetsConfig();
      if (config.webAppUrl) {
        try {
          await deleteClinicFromGoogleSheet(
            config.webAppUrl,
            targetClinic.id,
            targetClinic.name,
            updatedClinics
          );
          setSheetsConfig(getGoogleSheetsConfig());
          addToast('info', `Deleted "${targetClinic.name}" from CRM & Google Sheet.`, 'Clinic Removed');
        } catch {
          addToast('info', `Deleted "${targetClinic.name}" from CRM.`, 'Clinic Removed');
        }
      } else {
        addToast('info', `Deleted "${targetClinic.name}" from CRM.`, 'Clinic Removed');
      }
    } catch {
      addToast('error', 'Failed to delete clinic.', 'Delete Error');
    }
  };

  // Quick Status update from detail or follow-up view
  const handleQuickUpdateStatus = async (id: string, salesStatus: SalesStatus, notes?: string) => {
    const existing = clinics.find((c) => c.id === id);
    if (!existing) return;

    const updated: Clinic = {
      ...existing,
      salesStatus,
      notes: notes !== undefined ? notes : existing.notes,
      updatedAt: new Date().toISOString()
    };

    await saveClinic(updated);
    const updatedClinics = await getAllClinics();
    setClinics(updatedClinics);

    if (selectedClinic && selectedClinic.id === id) {
      setSelectedClinic(updated);
    }

    addToast('success', `Status updated to "${salesStatus}"`, existing.name);
    triggerGoogleSheetsAutoSync(updatedClinics);
  };

  // Update Clinic Payment & Deal info
  const handleUpdateClinicPayment = async (id: string, paymentStatus: PaymentStatus, dealValue?: number) => {
    const existing = clinics.find((c) => c.id === id);
    if (!existing) return;

    const updated: Clinic = {
      ...existing,
      paymentStatus,
      dealValue: dealValue !== undefined ? dealValue : existing.dealValue,
      updatedAt: new Date().toISOString()
    };

    await saveClinic(updated);
    const updatedClinics = await getAllClinics();
    setClinics(updatedClinics);

    if (selectedClinic && selectedClinic.id === id) {
      setSelectedClinic(updated);
    }

    addToast('success', `Payment status updated to "${paymentStatus}"`, existing.name);
    triggerGoogleSheetsAutoSync(updatedClinics);
  };

  // Reschedule Follow-up
  const handleRescheduleFollowUp = async (id: string, newDate: string) => {
    const existing = clinics.find((c) => c.id === id);
    if (!existing) return;

    const updated: Clinic = {
      ...existing,
      followUpDate: newDate,
      updatedAt: new Date().toISOString()
    };

    await saveClinic(updated);
    const updatedClinics = await getAllClinics();
    setClinics(updatedClinics);

    if (selectedClinic && selectedClinic.id === id) {
      setSelectedClinic(updated);
    }

    addToast('success', `Follow-up set to ${newDate}`, existing.name);
    triggerGoogleSheetsAutoSync(updatedClinics);
  };

  // Bulk Import from JSON Backup
  const handleBulkImport = async (clinicsToSave: Clinic[], mode: 'skip' | 'overwrite' | 'all') => {
    await bulkSaveClinics(clinicsToSave);
    const updatedClinics = await getAllClinics();
    setClinics(updatedClinics);
    triggerGoogleSheetsAutoSync(updatedClinics);
    return {
      saved: clinicsToSave.length,
      overwritten: mode === 'overwrite' ? clinicsToSave.length : 0
    };
  };

  // Clear Database
  const handleClearAll = async () => {
    await clearAllClinics();
    await refreshClinics();
    const config = getGoogleSheetsConfig();
    if (config.webAppUrl) {
      try {
        await pushClinicsToGoogleSheet(config.webAppUrl, []);
        setSheetsConfig(getGoogleSheetsConfig());
      } catch {
        // Ignore background sync error
      }
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    if (clinics.length === 0) {
      addToast('info', 'No clinic records to export yet.', 'Export Empty');
      return;
    }
    exportClinicsToCsv(clinics);
    setLastBackupTime(getLastBackupTime());
    addToast('success', `Exported ${clinics.length} clinics to CSV spreadsheet.`, 'CSV Exported');
  };

  // Metrics & Revenue counts
  const todayStr = new Date().toISOString().split('T')[0];
  const followUpsDueCount = clinics.filter((c) => Boolean(c.followUpDate) && c.followUpDate! <= todayStr).length;
  const noWebsiteCount = clinics.filter((c) => c.websiteStatus === 'No Website Found').length;
  const hasUnbackedData = clinics.length > 0 && !lastBackupTime && !sheetsConfig.webAppUrl;
  const revenueSummary = calculateRevenueSummary(clinics);

  // View clinic details
  const handleSelectClinic = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-[#F7F8FA] overflow-hidden font-sans text-[#17202F] antialiased">
      {/* Sidebar for Desktop */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onOpenAddModal={handleOpenAdd}
        followUpsDueCount={followUpsDueCount}
        totalClinicsCount={clinics.length}
        noWebsiteCount={noWebsiteCount}
        totalRevenueWon={revenueSummary.totalWonRevenue}
        hasUnbackedData={hasUnbackedData}
        isGoogleSheetsConnected={Boolean(sheetsConfig.webAppUrl)}
        sheetUrl={sheetsConfig.sheetUrl}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <Navbar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          onOpenAddModal={handleOpenAdd}
          followUpsDueCount={followUpsDueCount}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1440px] mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-24 text-[#98A2B3] text-xs">
                <span>Loading database...</span>
              </div>
            ) : currentPage === 'dashboard' ? (
              <DashboardPage
                clinics={clinics}
                onNavigate={setCurrentPage}
                onFilterClinics={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
                onOpenAddModal={handleOpenAdd}
                onSelectClinic={handleSelectClinic}
                lastBackupTime={lastBackupTime}
              />
            ) : currentPage === 'find' ? (
              <FindClinicsPage
                onSaveClinic={(data) => handleSaveClinic(data)}
                allClinics={clinics}
                onSelectClinic={handleSelectClinic}
                onNavigateToClinics={() => setCurrentPage('clinics')}
              />
            ) : currentPage === 'clinics' ? (
              <AllClinicsPage
                clinics={clinics}
                filters={filters}
                onUpdateFilters={(update) => setFilters((prev) => ({ ...prev, ...update }))}
                onResetFilters={() => setFilters(INITIAL_FILTERS)}
                onSelectClinic={handleSelectClinic}
                onEditClinic={handleOpenEdit}
                onDeleteClinic={handleOpenDelete}
                onOpenAddModal={handleOpenAdd}
                onExportCsv={handleExportCsv}
              />
            ) : currentPage === 'followups' ? (
              <FollowUpsPage
                clinics={clinics}
                onSelectClinic={handleSelectClinic}
                onEditClinic={handleOpenEdit}
                onQuickUpdateStatus={handleQuickUpdateStatus}
                onRescheduleFollowUp={handleRescheduleFollowUp}
              />
            ) : currentPage === 'revenue' ? (
              <RevenuePage
                clinics={clinics}
                onSelectClinic={handleSelectClinic}
                onEditClinic={handleOpenEdit}
                onOpenAddModal={handleOpenAdd}
                onUpdateClinicPayment={handleUpdateClinicPayment}
                onNavigateToClinics={() => setCurrentPage('clinics')}
              />
            ) : (
              <SettingsBackupPage
                clinics={clinics}
                lastBackupTime={lastBackupTime}
                onRefreshClinics={refreshClinics}
                onClearAllClinics={handleClearAll}
                onBulkImportClinics={handleBulkImport}
                onShowToast={addToast}
              />
            )}
          </div>
        </main>
      </div>

      {/* Add / Edit Clinic Form Modal */}
      <ClinicFormModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        onSave={handleSaveClinic}
        initialData={editingClinic}
        allClinics={clinics}
        onViewExisting={(c) => handleSelectClinic(c)}
      />

      {/* View Clinic Full Details Modal */}
      <ClinicDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedClinic(null);
        }}
        clinic={selectedClinic}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        onQuickUpdateStatus={handleQuickUpdateStatus}
      />

      {/* Delete Single Clinic Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Clinic Record?"
        message={`Are you sure you want to delete "${clinicToDelete?.name}"? All outreach notes and contact history will be removed.`}
        confirmLabel="Delete Record"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />

      {/* Duplicate Warning Dialog */}
      <DuplicateWarningModal
        isOpen={duplicateWarningOpen}
        onClose={() => setDuplicateWarningOpen(false)}
        matches={pendingDuplicateMatches}
        pendingClinicName={pendingSaveData?.data.name || ''}
        onSaveAnyway={async () => {
          if (pendingSaveData) {
            await handleSaveClinic(pendingSaveData.data, pendingSaveData.id);
            setDuplicateWarningOpen(false);
            setPendingSaveData(null);
            setIsAddEditModalOpen(false);
          }
        }}
        onViewExisting={(c) => {
          setDuplicateWarningOpen(false);
          setIsAddEditModalOpen(false);
          handleSelectClinic(c);
        }}
      />

      {/* Floating Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
export default App;
