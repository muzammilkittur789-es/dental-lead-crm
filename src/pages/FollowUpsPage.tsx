import React, { useState } from 'react';
import type { Clinic, SalesStatus } from '../types/clinic';
import { WebsiteBadge, FollowUpBadge } from '../components/common/Badge';
import {
  CalendarClock,
  Phone,
  AlertTriangle,
  Clock,
  Calendar,
  Edit,
  Check
} from 'lucide-react';

interface FollowUpsPageProps {
  clinics: Clinic[];
  onSelectClinic: (clinic: Clinic) => void;
  onEditClinic: (clinic: Clinic) => void;
  onQuickUpdateStatus: (id: string, salesStatus: SalesStatus, notes?: string) => Promise<void>;
  onRescheduleFollowUp: (id: string, newDate: string) => Promise<void>;
}

export const FollowUpsPage: React.FC<FollowUpsPageProps> = ({
  clinics,
  onSelectClinic,
  onEditClinic,
  onQuickUpdateStatus,
  onRescheduleFollowUp
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate 7 days ahead for upcoming
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

  // Categorize follow-ups
  const overdueList: Clinic[] = [];
  const todayList: Clinic[] = [];
  const upcomingList: Clinic[] = [];
  const laterList: Clinic[] = [];

  clinics.forEach((c) => {
    if (!c.followUpDate) return;

    if (c.followUpDate < todayStr) {
      overdueList.push(c);
    } else if (c.followUpDate === todayStr) {
      todayList.push(c);
    } else if (c.followUpDate <= sevenDaysStr) {
      upcomingList.push(c);
    } else {
      laterList.push(c);
    }
  });

  // Sort each category by date
  overdueList.sort((a, b) => a.followUpDate!.localeCompare(b.followUpDate!));
  todayList.sort((a, b) => a.name.localeCompare(b.name));
  upcomingList.sort((a, b) => a.followUpDate!.localeCompare(b.followUpDate!));
  laterList.sort((a, b) => a.followUpDate!.localeCompare(b.followUpDate!));

  const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');
  const [rescheduleClinicId, setRescheduleClinicId] = useState<string | null>(null);
  const [newDateInput, setNewDateInput] = useState('');

  const handleOpenReschedule = (c: Clinic) => {
    setRescheduleClinicId(c.id);
    setNewDateInput(c.followUpDate || todayStr);
  };

  const handleSaveReschedule = async (id: string) => {
    if (!newDateInput) return;
    await onRescheduleFollowUp(id, newDateInput);
    setRescheduleClinicId(null);
  };

  const handleMarkCalled = async (id: string) => {
    await onQuickUpdateStatus(id, 'Called');
  };

  const renderClinicCard = (clinic: Clinic, isOverdue = false) => {
    const isRescheduling = rescheduleClinicId === clinic.id;

    return (
      <div
        key={clinic.id}
        className={`p-4 rounded-xl border bg-white shadow-xs hover:border-[#0F766E] transition-all space-y-3 ${
          isOverdue ? 'border-[#FECDCA]' : 'border-[#E5E7EB]'
        }`}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4
              onClick={() => onSelectClinic(clinic)}
              className="text-sm font-semibold text-[#17202F] hover:text-[#0F766E] transition-colors cursor-pointer truncate"
            >
              {clinic.name}
            </h4>
            <p className="text-[11px] text-[#667085]">
              {clinic.locality}, {clinic.city}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <FollowUpBadge date={clinic.followUpDate} size="sm" />
            <WebsiteBadge status={clinic.websiteStatus} size="sm" />
          </div>
        </div>

        {/* Notes preview */}
        {clinic.notes && (
          <div className="text-xs text-[#475467] bg-[#F9FAFB] p-2.5 rounded-lg border border-[#F2F4F7] line-clamp-2">
            <span className="font-medium text-[#17202F]">Note: </span>
            {clinic.notes}
          </div>
        )}

        {/* Reschedule inline date picker */}
        {isRescheduling ? (
          <div className="p-2.5 bg-[#F0FDFA] border border-[#CCFBF1] rounded-lg flex items-center justify-between gap-2 text-xs">
            <input
              type="date"
              value={newDateInput}
              onChange={(e) => setNewDateInput(e.target.value)}
              className="px-2 py-1 text-xs border border-[#CCFBF1] rounded-lg bg-white text-[#17202F] focus:outline-hidden focus:border-[#0F766E]"
            />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRescheduleClinicId(null)}
                className="px-2 py-1 text-xs text-[#667085] hover:bg-white rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveReschedule(clinic.id)}
                className="px-2.5 py-1 text-xs font-medium bg-[#0F766E] text-white rounded hover:bg-[#115E59] cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        ) : null}

        {/* Action Toolbar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#F2F4F7] text-xs">
          <div className="flex items-center gap-1.5">
            {clinic.phone ? (
              <a
                href={`tel:${clinic.phone.replace(/\s+/g, '')}`}
                className="px-2.5 py-1 bg-[#0F766E] hover:bg-[#115E59] text-white font-medium rounded-lg flex items-center gap-1.5 text-[11px] transition-colors"
              >
                <Phone className="w-3 h-3" />
                <span>Call {clinic.phone}</span>
              </a>
            ) : (
              <span className="text-[11px] text-[#98A2B3] italic">No phone saved</span>
            )}

            <button
              onClick={() => handleMarkCalled(clinic.id)}
              className="px-2 py-1 text-[11px] font-medium text-[#667085] hover:text-[#15803D] hover:bg-[#ECFDF5] rounded-md transition-colors cursor-pointer"
              title="Mark as Called"
            >
              <Check className="w-3 h-3 inline mr-1 text-[#15803D]" />
              Mark Called
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleOpenReschedule(clinic)}
              className="px-2 py-1 text-[11px] font-medium text-[#667085] hover:text-[#17202F] hover:bg-[#F2F4F7] rounded-md transition-colors cursor-pointer"
              title="Reschedule Follow-up date"
            >
              <Calendar className="w-3 h-3 inline mr-1 text-[#98A2B3]" />
              Reschedule
            </button>
            <button
              onClick={() => onEditClinic(clinic)}
              className="px-2 py-1 text-[11px] font-medium text-[#667085] hover:text-[#0F766E] hover:bg-[#F0FDFA] rounded-md transition-colors cursor-pointer"
              title="Edit record"
            >
              <Edit className="w-3 h-3 inline mr-1 text-[#98A2B3]" />
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  };

  const totalFollowUps = overdueList.length + todayList.length + upcomingList.length + laterList.length;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#17202F] tracking-tight">
          Sales Outreach Follow-ups
        </h1>
        <p className="text-sm text-[#667085] mt-0.5">
          Schedule, track, and complete follow-up calls with clinic prospects to sell website design.
        </p>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveTab('overdue')}
          className={`p-4 rounded-xl border bg-white transition-all cursor-pointer ${
            activeTab === 'overdue'
              ? 'border-[#0F766E] ring-1 ring-[#0F766E]'
              : 'border-[#E5E7EB] hover:border-[#0F766E]'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
            <span>Overdue Calls</span>
            <AlertTriangle className="w-3.5 h-3.5 text-[#B42318]" />
          </div>
          <div className="text-2xl font-semibold tabular-nums mt-1 text-[#B42318]">{overdueList.length}</div>
        </div>

        <div
          onClick={() => setActiveTab('today')}
          className={`p-4 rounded-xl border bg-white transition-all cursor-pointer ${
            activeTab === 'today'
              ? 'border-[#0F766E] ring-1 ring-[#0F766E]'
              : 'border-[#E5E7EB] hover:border-[#0F766E]'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
            <span>Due Today</span>
            <Clock className="w-3.5 h-3.5 text-[#B45309]" />
          </div>
          <div className="text-2xl font-semibold tabular-nums mt-1 text-[#B45309]">{todayList.length}</div>
        </div>

        <div
          onClick={() => setActiveTab('upcoming')}
          className={`p-4 rounded-xl border bg-white transition-all cursor-pointer ${
            activeTab === 'upcoming'
              ? 'border-[#0F766E] ring-1 ring-[#0F766E]'
              : 'border-[#E5E7EB] hover:border-[#0F766E]'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
            <span>Next 7 Days</span>
            <Calendar className="w-3.5 h-3.5 text-[#0F766E]" />
          </div>
          <div className="text-2xl font-semibold tabular-nums mt-1 text-[#17202F]">{upcomingList.length}</div>
        </div>

        <div
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-xl border bg-white transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'border-[#0F766E] ring-1 ring-[#0F766E]'
              : 'border-[#E5E7EB] hover:border-[#0F766E]'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
            <span>Total Scheduled</span>
            <CalendarClock className="w-3.5 h-3.5 text-[#667085]" />
          </div>
          <div className="text-2xl font-semibold tabular-nums mt-1 text-[#17202F]">{totalFollowUps}</div>
        </div>
      </div>

      {/* Main Content Area */}
      {totalFollowUps === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center text-[#98A2B3] space-y-3">
          <CalendarClock className="w-12 h-12 mx-auto text-[#98A2B3] stroke-1" />
          <div>
            <h3 className="font-semibold text-sm text-[#17202F]">No Follow-ups Scheduled</h3>
            <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
              When you call dental clinics or log a prospect, assign a follow-up date so you never miss a sales opportunity.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overdue Section */}
          {(activeTab === 'all' || activeTab === 'overdue') && overdueList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#B42318] font-semibold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Overdue Follow-ups ({overdueList.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {overdueList.map((c) => renderClinicCard(c, true))}
              </div>
            </div>
          )}

          {/* Today Section */}
          {(activeTab === 'all' || activeTab === 'today') && todayList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#B45309] font-semibold text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Due Today ({todayList.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {todayList.map((c) => renderClinicCard(c, false))}
              </div>
            </div>
          )}

          {/* Upcoming (Next 7 Days) Section */}
          {(activeTab === 'all' || activeTab === 'upcoming') && upcomingList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#0F766E] font-semibold text-xs uppercase tracking-wider">
                <Calendar className="w-4 h-4" />
                <span>Upcoming This Week ({upcomingList.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {upcomingList.map((c) => renderClinicCard(c, false))}
              </div>
            </div>
          )}

          {/* Later / Future */}
          {activeTab === 'all' && laterList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#667085] font-semibold text-xs uppercase tracking-wider">
                <CalendarClock className="w-4 h-4" />
                <span>Scheduled for Later ({laterList.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {laterList.map((c) => renderClinicCard(c, false))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
