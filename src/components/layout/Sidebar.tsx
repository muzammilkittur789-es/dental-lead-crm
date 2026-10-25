import React from 'react';
import type { NavigationPage } from '../../types/clinic';
import {
  LayoutDashboard,
  Search,
  Building2,
  CalendarClock,
  IndianRupee,
  Database,
  Plus,
  ShieldCheck,
  TableProperties
} from 'lucide-react';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  onOpenAddModal: () => void;
  followUpsDueCount: number;
  totalClinicsCount: number;
  noWebsiteCount: number;
  totalRevenueWon: number;
  hasUnbackedData: boolean;
  isGoogleSheetsConnected?: boolean;
  sheetUrl?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onOpenAddModal,
  followUpsDueCount,
  totalClinicsCount,
  isGoogleSheetsConnected
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavigationPage,
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'find' as NavigationPage,
      label: 'Find Clinics',
      icon: Search,
      badge: null
    },
    {
      id: 'clinics' as NavigationPage,
      label: 'All Clinics',
      icon: Building2,
      badge: totalClinicsCount > 0 ? String(totalClinicsCount) : null
    },
    {
      id: 'followups' as NavigationPage,
      label: 'Follow-ups',
      icon: CalendarClock,
      badge: followUpsDueCount > 0 ? String(followUpsDueCount) : null,
      badgeColor: 'bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]'
    },
    {
      id: 'revenue' as NavigationPage,
      label: 'Revenue & Deals',
      icon: IndianRupee,
      badge: null
    },
    {
      id: 'settings' as NavigationPage,
      label: 'Data & Backup',
      icon: Database,
      badge: null
    }
  ];

  return (
    <aside className="hidden md:flex flex-col w-[240px] bg-white border-r border-[#E5E7EB] shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#F7F8FA] border border-[#E5E7EB] p-1 flex items-center justify-center shrink-0">
            <img
              src="/logo.png"
              alt="Dental Lead CRM"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-[#17202F] text-[15px] leading-tight tracking-tight truncate">
              Dental Lead CRM
            </h1>
            <p className="text-[12px] text-[#667085] leading-none mt-0.5 font-normal">
              Sales Outreach
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onOpenAddModal}
          className="mt-3.5 w-full h-10 px-3 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg font-medium text-[13px] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#0F766E]/20"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>Add Clinic</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#F0FDFA] text-[#0F766E] font-semibold'
                  : 'text-[#475467] hover:bg-[#F2F4F7] hover:text-[#17202F]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 stroke-[1.75] ${
                    isActive ? 'text-[#0F766E]' : 'text-[#667085]'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge !== null && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[11px] font-medium tabular-nums ${
                    item.badgeColor || 'bg-[#F2F4F7] text-[#475467]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Compact Storage / Status Footer */}
      <div className="p-3 border-t border-[#E5E7EB] bg-[#F7F8FA]/60 text-[12px] text-[#667085] space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[#15803D] font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>IndexedDB Storage</span>
          </div>
          {isGoogleSheetsConnected && (
            <span
              className="inline-flex items-center gap-1 text-[11px] text-[#0F766E] font-medium"
              title="Google Sheets connected"
            >
              <TableProperties className="w-3 h-3" />
              <span>Synced</span>
            </span>
          )}
        </div>
        <p className="text-[11px] text-[#98A2B3] leading-snug">
          Stored privately in this browser.{' '}
          <button
            onClick={() => onNavigate('settings')}
            className="text-[#0F766E] hover:underline cursor-pointer font-medium"
          >
            Backup settings
          </button>
        </p>
      </div>
    </aside>
  );
};
