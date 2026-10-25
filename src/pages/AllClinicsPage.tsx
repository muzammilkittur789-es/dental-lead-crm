import React, { useMemo } from 'react';
import type { Clinic, ClinicFilterState } from '../types/clinic';
import { WebsiteBadge, SalesBadge, FollowUpBadge } from '../components/common/Badge';
import {
  Search,
  ArrowUpDown,
  Phone,
  Globe,
  MapPin,
  Eye,
  Edit,
  Trash2,
  X,
  FileSpreadsheet,
  AlertCircle,
  Plus
} from 'lucide-react';

interface AllClinicsPageProps {
  clinics: Clinic[];
  filters: ClinicFilterState;
  onUpdateFilters: (update: Partial<ClinicFilterState>) => void;
  onResetFilters: () => void;
  onSelectClinic: (clinic: Clinic) => void;
  onEditClinic: (clinic: Clinic) => void;
  onDeleteClinic: (clinic: Clinic) => void;
  onOpenAddModal: () => void;
  onExportCsv: () => void;
}

export const AllClinicsPage: React.FC<AllClinicsPageProps> = ({
  clinics,
  filters,
  onUpdateFilters,
  onResetFilters,
  onSelectClinic,
  onEditClinic,
  onDeleteClinic,
  onOpenAddModal,
  onExportCsv
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Distinct cities and localities in current database for dropdown filters
  const distinctCities = useMemo(() => {
    const set = new Set<string>();
    clinics.forEach((c) => {
      if (c.city) set.add(c.city);
    });
    return Array.from(set).sort();
  }, [clinics]);

  const distinctLocalities = useMemo(() => {
    const set = new Set<string>();
    clinics.forEach((c) => {
      if (c.locality) {
        if (!filters.city || c.city === filters.city) {
          set.add(c.locality);
        }
      }
    });
    return Array.from(set).sort();
  }, [clinics, filters.city]);

  // Filter & Sort Logic
  const filteredClinics = useMemo(() => {
    return clinics.filter((c) => {
      // Search query (matches name, city, locality, phone, notes)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchName = c.name.toLowerCase().includes(query);
        const matchCity = c.city.toLowerCase().includes(query);
        const matchLoc = c.locality.toLowerCase().includes(query);
        const matchPhone = c.phone ? c.phone.toLowerCase().includes(query) : false;
        const matchNotes = c.notes ? c.notes.toLowerCase().includes(query) : false;

        if (!matchName && !matchCity && !matchLoc && !matchPhone && !matchNotes) {
          return false;
        }
      }

      // City filter
      if (filters.city && filters.city !== 'ALL' && c.city !== filters.city) {
        return false;
      }

      // Locality filter
      if (filters.locality && filters.locality !== 'ALL' && c.locality !== filters.locality) {
        return false;
      }

      // Website Status filter
      if (filters.websiteStatus && filters.websiteStatus !== 'ALL' && c.websiteStatus !== filters.websiteStatus) {
        return false;
      }

      // Sales Status filter
      if (filters.salesStatus && filters.salesStatus !== 'ALL' && c.salesStatus !== filters.salesStatus) {
        return false;
      }

      // Quick filter: clinics without a website
      if (filters.quickNoWebsite && c.websiteStatus !== 'No Website Found') {
        return false;
      }

      // Quick filter: follow-up due today or overdue
      if (filters.quickFollowUpDue) {
        if (!c.followUpDate || c.followUpDate > todayStr) {
          return false;
        }
      }

      // Follow-up status filter
      if (filters.followUpFilter === 'today') {
        if (c.followUpDate !== todayStr) return false;
      } else if (filters.followUpFilter === 'overdue') {
        if (!c.followUpDate || c.followUpDate >= todayStr) return false;
      } else if (filters.followUpFilter === 'upcoming') {
        if (!c.followUpDate || c.followUpDate <= todayStr) return false;
      } else if (filters.followUpFilter === 'none') {
        if (c.followUpDate) return false;
      }

      return true;
    });
  }, [clinics, filters, todayStr]);

  // Sorting
  const sortedClinics = useMemo(() => {
    const list = [...filteredClinics];
    switch (filters.sortBy) {
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case 'created-asc':
        return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'created-desc':
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'followup-asc':
        return list.sort((a, b) => {
          if (!a.followUpDate) return 1;
          if (!b.followUpDate) return -1;
          return a.followUpDate.localeCompare(b.followUpDate);
        });
      case 'followup-desc':
        return list.sort((a, b) => {
          if (!a.followUpDate) return 1;
          if (!b.followUpDate) return -1;
          return b.followUpDate.localeCompare(a.followUpDate);
        });
      default:
        return list;
    }
  }, [filteredClinics, filters.sortBy]);

  const hasActiveFilters =
    Boolean(filters.searchQuery) ||
    (filters.city !== '' && filters.city !== 'ALL') ||
    (filters.locality !== '' && filters.locality !== 'ALL') ||
    (filters.websiteStatus !== '' && filters.websiteStatus !== 'ALL') ||
    (filters.salesStatus !== '' && filters.salesStatus !== 'ALL') ||
    filters.followUpFilter !== 'all' ||
    filters.quickNoWebsite ||
    filters.quickFollowUpDue;

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#17202F] tracking-tight">
            Clinic Directory & Leads
          </h1>
          <p className="text-sm text-[#667085] mt-0.5">
            Showing {sortedClinics.length} of {clinics.length} saved dental clinics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportCsv}
            disabled={clinics.length === 0}
            className="px-3.5 py-2 bg-white hover:bg-[#F7F8FA] text-[#17202F] text-xs font-medium rounded-lg border border-[#E5E7EB] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Download formatted CSV spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#0F766E]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Clinic</span>
          </button>
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] mr-1">
          Quick Filters:
        </span>

        <button
          onClick={() => onUpdateFilters({ quickNoWebsite: !filters.quickNoWebsite })}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            filters.quickNoWebsite
              ? 'bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]'
              : 'bg-white hover:bg-[#F2F4F7] text-[#344054] border border-[#E5E7EB]'
          }`}
        >
          <span>Clinics Without Website</span>
          {filters.quickNoWebsite && <X className="w-3.5 h-3.5 ml-0.5" />}
        </button>

        <button
          onClick={() => onUpdateFilters({ quickFollowUpDue: !filters.quickFollowUpDue })}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            filters.quickFollowUpDue
              ? 'bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89]'
              : 'bg-white hover:bg-[#F2F4F7] text-[#344054] border border-[#E5E7EB]'
          }`}
        >
          <span>Follow-ups Due Today / Overdue</span>
          {filters.quickFollowUpDue && <X className="w-3.5 h-3.5 ml-0.5" />}
        </button>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#667085] hover:text-[#17202F] hover:bg-[#F2F4F7] flex items-center gap-1 transition-colors cursor-pointer ml-auto"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar Controls Card */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
        {/* Search Input Row */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#98A2B3] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onUpdateFilters({ searchQuery: e.target.value })}
            placeholder="Search by clinic name, city, locality, phone number, or notes..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-[#E5E7EB] rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] bg-white text-[#17202F] placeholder-[#98A2B3]"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onUpdateFilters({ searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#98A2B3] hover:text-[#17202F] rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1 text-xs">
          {/* City Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#667085] uppercase tracking-wider mb-1">
              City
            </label>
            <select
              value={filters.city || 'ALL'}
              onChange={(e) => onUpdateFilters({ city: e.target.value, locality: 'ALL' })}
              className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded-lg bg-white text-[#17202F] focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
            >
              <option value="ALL">All Cities ({distinctCities.length})</option>
              {distinctCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Locality Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#667085] uppercase tracking-wider mb-1">
              Locality
            </label>
            <select
              value={filters.locality || 'ALL'}
              onChange={(e) => onUpdateFilters({ locality: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded-lg bg-white text-[#17202F] focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
            >
              <option value="ALL">All Localities</option>
              {distinctLocalities.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Website Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#667085] uppercase tracking-wider mb-1">
              Website Status
            </label>
            <select
              value={filters.websiteStatus || 'ALL'}
              onChange={(e) => onUpdateFilters({ websiteStatus: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded-lg bg-white text-[#17202F] focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
            >
              <option value="ALL">All Website Statuses</option>
              <option value="No Website Found">No Website Found</option>
              <option value="Has Website">Has Website</option>
              <option value="Needs Verification">Needs Verification</option>
            </select>
          </div>

          {/* Sales Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#667085] uppercase tracking-wider mb-1">
              Sales Status
            </label>
            <select
              value={filters.salesStatus || 'ALL'}
              onChange={(e) => onUpdateFilters({ salesStatus: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded-lg bg-white text-[#17202F] focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
            >
              <option value="ALL">All Sales Statuses</option>
              <option value="To Call">To Call</option>
              <option value="Called">Called</option>
              <option value="No Answer">No Answer</option>
              <option value="Interested">Interested</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Demo Ready">Demo Ready</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Ignored">Ignored</option>
            </select>
          </div>

          {/* Follow-up Date Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#667085] uppercase tracking-wider mb-1">
              Follow-up
            </label>
            <select
              value={filters.followUpFilter}
              onChange={(e) => onUpdateFilters({ followUpFilter: e.target.value as ClinicFilterState['followUpFilter'] })}
              className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded-lg bg-white text-[#17202F] focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
            >
              <option value="all">All Dates</option>
              <option value="today">Due Today</option>
              <option value="overdue">Overdue</option>
              <option value="upcoming">Upcoming</option>
              <option value="none">No Follow-up Set</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <label className="block text-[11px] font-semibold text-[#667085] uppercase tracking-wider mb-1 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-[#98A2B3]" />
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => onUpdateFilters({ sortBy: e.target.value as ClinicFilterState['sortBy'] })}
              className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded-lg bg-white text-[#17202F] focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
            >
              <option value="created-desc">Date Added (Newest)</option>
              <option value="created-asc">Date Added (Oldest)</option>
              <option value="name-asc">Clinic Name (A-Z)</option>
              <option value="name-desc">Clinic Name (Z-A)</option>
              <option value="followup-asc">Follow-up Date (Earliest)</option>
              <option value="followup-desc">Follow-up Date (Latest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clinic Management Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[11px] font-semibold text-[#475467] uppercase tracking-wider select-none">
                <th className="py-3 px-4">Clinic Name</th>
                <th className="py-3 px-3">Locality & City</th>
                <th className="py-3 px-3">Contact Number</th>
                <th className="py-3 px-3">Website Status</th>
                <th className="py-3 px-3">Sales Status</th>
                <th className="py-3 px-3">Follow-up Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F4F7] text-xs">
              {sortedClinics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-[#98A2B3]">
                    {clinics.length === 0 ? (
                      <div className="max-w-xs mx-auto space-y-3">
                        <AlertCircle className="w-10 h-10 mx-auto text-[#98A2B3] stroke-1" />
                        <div>
                          <p className="font-semibold text-sm text-[#17202F]">No Clinics Saved Yet</p>
                          <p className="text-xs text-[#667085] mt-1">
                            Search on Google Maps or use manual entry to add your first dental clinic lead.
                          </p>
                        </div>
                        <button
                          onClick={onOpenAddModal}
                          className="px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          Add First Clinic
                        </button>
                      </div>
                    ) : (
                      <div className="max-w-xs mx-auto space-y-2">
                        <p className="font-semibold text-sm text-[#17202F]">No Clinics Matched Your Filters</p>
                        <p className="text-xs text-[#667085]">
                          Try adjusting search terms or resetting the active filters.
                        </p>
                        <button
                          onClick={onResetFilters}
                          className="mt-2 px-3 py-1.5 bg-[#F2F4F7] hover:bg-[#E5E7EB] text-[#17202F] text-xs font-medium rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                sortedClinics.map((clinic) => (
                  <tr
                    key={clinic.id}
                    className="hover:bg-[#F8F9FA] transition-colors group cursor-pointer"
                    onClick={() => onSelectClinic(clinic)}
                  >
                    {/* Clinic Name Column */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#17202F] group-hover:text-[#0F766E] transition-colors">
                        {clinic.name}
                      </div>
                      {clinic.address && (
                        <div className="text-[11px] text-[#667085] truncate max-w-xs mt-0.5">
                          {clinic.address}
                        </div>
                      )}
                    </td>

                    {/* Locality & City */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-[#17202F]">{clinic.locality}</div>
                      <div className="text-[11px] text-[#667085]">{clinic.city}</div>
                    </td>

                    {/* Contact Number (clickable tel: link) */}
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      {clinic.phone ? (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${clinic.phone.replace(/\s+/g, '')}`}
                            className="font-mono text-xs font-medium text-[#0F766E] hover:text-[#115E59] hover:underline flex items-center gap-1"
                            title="Click to call via telephone"
                          >
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{clinic.phone}</span>
                          </a>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#98A2B3] italic">No phone</span>
                      )}
                    </td>

                    {/* Website Status */}
                    <td className="py-3 px-3">
                      <WebsiteBadge status={clinic.websiteStatus} size="sm" />
                    </td>

                    {/* Sales Status */}
                    <td className="py-3 px-3">
                      <SalesBadge status={clinic.salesStatus} size="sm" />
                    </td>

                    {/* Follow-up Date */}
                    <td className="py-3 px-3">
                      <FollowUpBadge date={clinic.followUpDate} size="sm" />
                    </td>

                    {/* Actions Column */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {/* 1. Call clinic phone when available */}
                        {clinic.phone && (
                          <a
                            href={`tel:${clinic.phone.replace(/\s+/g, '')}`}
                            className="p-1.5 text-[#667085] hover:text-[#0F766E] hover:bg-[#F0FDFA] rounded-md transition-colors"
                            title={`Call ${clinic.phone}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* 2. Open Google Maps listing when available */}
                        {clinic.mapsUrl && (
                          <a
                            href={clinic.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-[#667085] hover:text-[#0F766E] hover:bg-[#F0FDFA] rounded-md transition-colors"
                            title="Open Google Maps listing"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* 3. Open website when available */}
                        {clinic.websiteUrl && (
                          <a
                            href={clinic.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-[#667085] hover:text-[#0F766E] hover:bg-[#F0FDFA] rounded-md transition-colors"
                            title="Open clinic website"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* 4. View Details */}
                        <button
                          type="button"
                          onClick={() => onSelectClinic(clinic)}
                          className="p-1.5 text-[#667085] hover:text-[#17202F] hover:bg-[#F2F4F7] rounded-md transition-colors cursor-pointer"
                          title="View complete details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* 5. Edit */}
                        <button
                          type="button"
                          onClick={() => onEditClinic(clinic)}
                          className="p-1.5 text-[#667085] hover:text-[#0F766E] hover:bg-[#F0FDFA] rounded-md transition-colors cursor-pointer"
                          title="Edit clinic"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* 6. Delete */}
                        <button
                          type="button"
                          onClick={() => onDeleteClinic(clinic)}
                          className="p-1.5 text-[#667085] hover:text-[#B42318] hover:bg-[#FEF3F2] rounded-md transition-colors cursor-pointer"
                          title="Delete clinic"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
