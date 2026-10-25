import React from 'react';
import type { Clinic, ClinicFilterState, NavigationPage } from '../types/clinic';
import { SalesBadge, FollowUpBadge } from '../components/common/Badge';
import { calculateRevenueSummary, formatINR } from '../services/revenue';
import {
  Building2,
  GlobeX,
  PhoneCall,
  CheckCircle2,
  CalendarClock,
  Sparkles,
  ArrowRight,
  Search,
  Plus,
  Phone,
  MapPin,
  Check,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';

interface DashboardPageProps {
  clinics: Clinic[];
  onNavigate: (page: NavigationPage) => void;
  onFilterClinics: (filters: Partial<ClinicFilterState>) => void;
  onOpenAddModal: () => void;
  onSelectClinic: (clinic: Clinic) => void;
  lastBackupTime: string | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  clinics,
  onNavigate,
  onFilterClinics,
  onOpenAddModal,
  onSelectClinic,
  lastBackupTime
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Total clinics saved
  const totalClinics = clinics.length;

  // 2. Clinics without a website
  const noWebsiteClinics = clinics.filter((c) => c.websiteStatus === 'No Website Found');
  const noWebsiteCount = noWebsiteClinics.length;

  // 3. Clinics to call
  const toCallClinics = clinics.filter((c) => c.salesStatus === 'To Call');
  const toCallCount = toCallClinics.length;

  // 4. Calls completed
  const completedCalls = clinics.filter((c) =>
    ['Called', 'No Answer', 'Interested', 'Follow-up', 'Ignored', 'Not Interested', 'Demo Ready', 'Won', 'Lost'].includes(
      c.salesStatus
    )
  );
  const completedCallsCount = completedCalls.length;

  // 5. Follow-ups due (follow-up date is today or overdue)
  const followUpsDue = clinics.filter((c) => Boolean(c.followUpDate) && c.followUpDate! <= todayStr);
  const followUpsDueCount = followUpsDue.length;

  // 6. Interested prospects
  const interestedClinics = clinics.filter((c) => c.salesStatus === 'Interested' || c.salesStatus === 'Demo Ready');
  const interestedCount = interestedClinics.length;

  // Revenue calculation
  const revenueSummary = calculateRevenueSummary(clinics);

  // Metric Click Handlers
  const handleMetricClick = (filterUpdate: Partial<ClinicFilterState>) => {
    onFilterClinics(filterUpdate);
    onNavigate('clinics');
  };

  const hotLeads = noWebsiteClinics.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-[26px] font-semibold text-[#17202F] tracking-tight leading-tight">
            Overview
          </h1>
          <p className="text-[14px] text-[#667085] mt-0.5">
            Manage dental clinic prospects in Indian cities, pitch websites, and track sales outreach.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('find')}
            className="h-10 px-3.5 bg-white hover:bg-[#F9FAFB] text-[#17202F] text-[13px] font-medium rounded-lg border border-[#E5E7EB] flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Search className="w-4 h-4 text-[#667085]" />
            <span>Find on Google Maps</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="h-10 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white text-[13px] font-medium rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>Add Clinic</span>
          </button>
        </div>
      </div>

      {/* Backup Reminder Banner (Compact & Muted) */}
      {totalClinics > 0 && !lastBackupTime && (
        <div className="p-3 bg-[#FFFAEB] border border-[#FEDF89] rounded-lg flex items-center justify-between gap-3 text-[13px] text-[#B54708]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-[#B54708]" />
            <span>
              You have {totalClinics} clinics stored locally. Remember to export a backup to safeguard your data.
            </span>
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="px-2.5 py-1 text-[12px] font-medium text-[#B54708] bg-white border border-[#FEDF89] hover:bg-[#FEF08A] rounded-md transition-colors cursor-pointer shrink-0"
          >
            Backup Settings
          </button>
        </div>
      )}

      {/* Section A: Restrained Revenue Summary Card */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-[#667085]">Website Sales Revenue</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#15803D] border border-[#A7F3D0]">
                {revenueSummary.totalDealsWon} {revenueSummary.totalDealsWon === 1 ? 'deal won' : 'deals won'}
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-3 mt-1">
              <span className="text-[26px] font-bold text-[#17202F] tracking-tight tabular-nums">
                {formatINR(revenueSummary.totalWonRevenue)}
              </span>
              <span className="text-[13px] text-[#667085]">
                Collected: <span className="font-medium text-[#17202F] tabular-nums">{formatINR(revenueSummary.collectedRevenue)}</span>
              </span>
              {revenueSummary.pendingRevenue > 0 && (
                <span className="text-[13px] text-[#667085]">
                  · Pending: <span className="font-medium text-[#B54708] tabular-nums">{formatINR(revenueSummary.pendingRevenue)}</span>
                </span>
              )}
              <span className="text-[13px] text-[#667085]">
                · In Pipeline: <span className="font-medium text-[#0F766E] tabular-nums">{formatINR(revenueSummary.pipelineOpportunityValue)}</span>
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('revenue')}
          className="h-9 px-3.5 bg-white hover:bg-[#F9FAFB] text-[#0F766E] border border-[#CCFBF1] rounded-lg text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <span>View Revenue & Deals</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Section B: Consistent 6-KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* KPI 1: Total Clinics */}
        <div
          onClick={() => handleMetricClick({ websiteStatus: 'ALL', salesStatus: 'ALL', quickNoWebsite: false, quickFollowUpDue: false })}
          className="p-5 bg-white rounded-xl border border-[#E5E7EB] shadow-xs hover:border-[#0F766E]/40 hover:bg-[#F9FAFB]/50 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-[#667085] mb-2">
            <span className="text-[13px] font-medium truncate">Total Clinics</span>
            <Building2 className="w-4 h-4 text-[#98A2B3] group-hover:text-[#0F766E] transition-colors" />
          </div>
          <div>
            <div className="text-[26px] font-semibold text-[#17202F] tracking-tight tabular-nums">
              {totalClinics}
            </div>
            <p className="text-[12px] text-[#98A2B3] mt-0.5">All saved records</p>
          </div>
        </div>

        {/* KPI 2: No Website Found */}
        <div
          onClick={() => handleMetricClick({ websiteStatus: 'No Website Found', quickNoWebsite: true })}
          className="p-5 bg-white rounded-xl border border-[#E5E7EB] shadow-xs hover:border-[#B54708]/40 hover:bg-[#FFFAEB]/30 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-[#667085] mb-2">
            <span className="text-[13px] font-medium truncate">No Website</span>
            <GlobeX className="w-4 h-4 text-[#98A2B3] group-hover:text-[#B54708] transition-colors" />
          </div>
          <div>
            <div className="text-[26px] font-semibold text-[#B54708] tracking-tight tabular-nums">
              {noWebsiteCount}
            </div>
            <p className="text-[12px] text-[#98A2B3] mt-0.5">Primary pitch targets</p>
          </div>
        </div>

        {/* KPI 3: To Call */}
        <div
          onClick={() => handleMetricClick({ salesStatus: 'To Call' })}
          className="p-5 bg-white rounded-xl border border-[#E5E7EB] shadow-xs hover:border-[#0F766E]/40 hover:bg-[#F9FAFB]/50 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-[#667085] mb-2">
            <span className="text-[13px] font-medium truncate">To Call</span>
            <PhoneCall className="w-4 h-4 text-[#98A2B3] group-hover:text-[#0F766E] transition-colors" />
          </div>
          <div>
            <div className="text-[26px] font-semibold text-[#17202F] tracking-tight tabular-nums">
              {toCallCount}
            </div>
            <p className="text-[12px] text-[#98A2B3] mt-0.5">Uncontacted leads</p>
          </div>
        </div>

        {/* KPI 4: Calls Completed */}
        <div
          onClick={() => handleMetricClick({ salesStatus: 'Called' })}
          className="p-5 bg-white rounded-xl border border-[#E5E7EB] shadow-xs hover:border-[#0F766E]/40 hover:bg-[#F9FAFB]/50 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-[#667085] mb-2">
            <span className="text-[13px] font-medium truncate">Calls Done</span>
            <CheckCircle2 className="w-4 h-4 text-[#98A2B3] group-hover:text-[#0F766E] transition-colors" />
          </div>
          <div>
            <div className="text-[26px] font-semibold text-[#17202F] tracking-tight tabular-nums">
              {completedCallsCount}
            </div>
            <p className="text-[12px] text-[#98A2B3] mt-0.5">Outreach initiated</p>
          </div>
        </div>

        {/* KPI 5: Follow-ups Due */}
        <div
          onClick={() => {
            onFilterClinics({ quickFollowUpDue: true, followUpFilter: 'today' });
            onNavigate('followups');
          }}
          className="p-5 bg-white rounded-xl border border-[#E5E7EB] shadow-xs hover:border-[#B54708]/40 hover:bg-[#FFFAEB]/30 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-[#667085] mb-2">
            <span className="text-[13px] font-medium truncate">Follow-ups</span>
            <CalendarClock className="w-4 h-4 text-[#98A2B3] group-hover:text-[#B54708] transition-colors" />
          </div>
          <div>
            <div className={`text-[26px] font-semibold tracking-tight tabular-nums ${followUpsDueCount > 0 ? 'text-[#B54708]' : 'text-[#17202F]'}`}>
              {followUpsDueCount}
            </div>
            <p className="text-[12px] text-[#98A2B3] mt-0.5">
              {followUpsDueCount > 0 ? 'Due today / overdue' : 'All up to date'}
            </p>
          </div>
        </div>

        {/* KPI 6: Interested Prospects */}
        <div
          onClick={() => handleMetricClick({ salesStatus: 'Interested' })}
          className="p-5 bg-white rounded-xl border border-[#E5E7EB] shadow-xs hover:border-[#0F766E]/40 hover:bg-[#F0FDFA]/40 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-[#667085] mb-2">
            <span className="text-[13px] font-medium truncate">Interested</span>
            <Sparkles className="w-4 h-4 text-[#98A2B3] group-hover:text-[#0F766E] transition-colors" />
          </div>
          <div>
            <div className="text-[26px] font-semibold text-[#0F766E] tracking-tight tabular-nums">
              {interestedCount}
            </div>
            <p className="text-[12px] text-[#98A2B3] mt-0.5">Hot pipeline leads</p>
          </div>
        </div>
      </div>

      {/* Section C: Two Column Layout (Urgent Follow-ups & Clinics Without Website) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Column 1: Urgent Follow-ups */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-[#0F766E]" />
                <h3 className="text-[15px] font-semibold text-[#17202F]">Urgent Follow-ups</h3>
              </div>
              <button
                onClick={() => onNavigate('followups')}
                className="text-[13px] font-medium text-[#0F766E] hover:text-[#115E59] flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 divide-y divide-[#F2F4F7]">
              {followUpsDue.length === 0 ? (
                <div className="py-10 text-center text-[#667085] space-y-1.5">
                  <div className="w-8 h-8 rounded-full bg-[#ECFDF5] text-[#15803D] mx-auto flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <p className="text-[13px] font-medium text-[#17202F]">All follow-ups are up to date</p>
                  <p className="text-[12px] text-[#98A2B3]">No calls scheduled for today or overdue.</p>
                </div>
              ) : (
                followUpsDue.slice(0, 5).map((clinic) => (
                  <div
                    key={clinic.id}
                    onClick={() => onSelectClinic(clinic)}
                    className="py-2.5 px-2 hover:bg-[#F9FAFB] rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h4 className="text-[13px] font-medium text-[#17202F] truncate">{clinic.name}</h4>
                      <p className="text-[12px] text-[#667085]">
                        {clinic.locality}, {clinic.city}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <FollowUpBadge date={clinic.followUpDate} size="sm" />
                      {clinic.phone && (
                        <a
                          href={`tel:${clinic.phone.replace(/\s+/g, '')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 w-7 rounded-md border border-[#E5E7EB] hover:border-[#0F766E] text-[#475467] hover:text-[#0F766E] flex items-center justify-center transition-colors"
                          title="Call immediately"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Clinics Without Website */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <GlobeX className="w-4 h-4 text-[#B54708]" />
                <h3 className="text-[15px] font-semibold text-[#17202F]">
                  Clinics Without a Website
                </h3>
              </div>
              <button
                onClick={() => handleMetricClick({ websiteStatus: 'No Website Found', quickNoWebsite: true })}
                className="text-[13px] font-medium text-[#0F766E] hover:text-[#115E59] flex items-center gap-1 cursor-pointer"
              >
                <span>View all ({noWebsiteCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 divide-y divide-[#F2F4F7]">
              {hotLeads.length === 0 ? (
                <div className="py-10 text-center text-[#667085] space-y-1.5">
                  <div className="w-8 h-8 rounded-full bg-[#F2F4F7] text-[#667085] mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <p className="text-[13px] font-medium text-[#17202F]">No clinics tagged without a website</p>
                  <p className="text-[12px] text-[#98A2B3]">
                    Use Google Maps discovery to find dental practices lacking an online presence.
                  </p>
                  <button
                    onClick={() => onNavigate('find')}
                    className="mt-2 text-[12px] font-medium text-[#0F766E] hover:underline"
                  >
                    Start Sourcing Leads &gt;
                  </button>
                </div>
              ) : (
                hotLeads.map((clinic) => (
                  <div
                    key={clinic.id}
                    onClick={() => onSelectClinic(clinic)}
                    className="py-2.5 px-2 hover:bg-[#F9FAFB] rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h4 className="text-[13px] font-medium text-[#17202F] truncate">{clinic.name}</h4>
                      <p className="text-[12px] text-[#667085]">
                        {clinic.locality}, {clinic.city}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <SalesBadge status={clinic.salesStatus} size="sm" />
                      {clinic.phone && (
                        <a
                          href={`tel:${clinic.phone.replace(/\s+/g, '')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 w-7 rounded-md border border-[#E5E7EB] hover:border-[#0F766E] text-[#475467] hover:text-[#0F766E] flex items-center justify-center transition-colors"
                          title="Call clinic"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {clinic.mapsUrl && (
                        <a
                          href={clinic.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 w-7 rounded-md border border-[#E5E7EB] hover:border-[#0F766E] text-[#475467] hover:text-[#0F766E] flex items-center justify-center transition-colors"
                          title="Open Google Maps listing"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
