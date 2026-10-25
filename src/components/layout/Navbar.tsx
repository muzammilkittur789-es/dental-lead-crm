import React, { useState } from 'react';
import type { NavigationPage } from '../../types/clinic';
import {
  LayoutDashboard,
  Search,
  Building2,
  CalendarClock,
  IndianRupee,
  Database,
  Plus,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  onOpenAddModal: () => void;
  followUpsDueCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenAddModal,
  followUpsDueCount
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as NavigationPage, label: 'Overview', icon: LayoutDashboard },
    { id: 'find' as NavigationPage, label: 'Find Clinics', icon: Search },
    { id: 'clinics' as NavigationPage, label: 'All Clinics', icon: Building2 },
    {
      id: 'followups' as NavigationPage,
      label: 'Follow-ups',
      icon: CalendarClock,
      badge: followUpsDueCount > 0 ? String(followUpsDueCount) : null
    },
    { id: 'revenue' as NavigationPage, label: 'Revenue & Deals', icon: IndianRupee },
    { id: 'settings' as NavigationPage, label: 'Data & Backup', icon: Database }
  ];

  const handleNavClick = (page: NavigationPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-[#E5E7EB] px-4 py-2.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-[#475467] hover:text-[#17202F] rounded-lg hover:bg-[#F2F4F7] transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#F7F8FA] border border-[#E5E7EB] p-0.5 flex items-center justify-center shrink-0">
              <img
                src="/logo.png"
                alt="Dental Lead CRM"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-semibold text-[14px] text-[#17202F] tracking-tight">Dental Lead CRM</span>
          </div>
        </div>

        <button
          onClick={onOpenAddModal}
          className="h-8 px-3 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-xs pt-12">
          <div className="bg-white border-b border-[#E5E7EB] p-3 space-y-0.5 shadow-lg">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#F0FDFA] text-[#0F766E] font-semibold'
                      : 'text-[#475467] hover:bg-[#F2F4F7] hover:text-[#17202F]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[11px] bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
