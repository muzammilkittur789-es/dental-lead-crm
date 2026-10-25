import React, { useState } from 'react';
import { POPULAR_INDIAN_CITIES } from '../data/indianCities';
import type { Clinic, ClinicFormData, DuplicateMatch } from '../types/clinic';
import { findDuplicates } from '../services/duplicateDetector';
import {
  Search,
  ExternalLink,
  AlertTriangle,
  Plus,
  Save,
  CheckCircle2,
  Phone,
  Info,
  Calendar
} from 'lucide-react';

interface FindClinicsPageProps {
  onSaveClinic: (data: ClinicFormData) => Promise<void>;
  allClinics: Clinic[];
  onSelectClinic: (clinic: Clinic) => void;
  onNavigateToClinics: () => void;
}

export const FindClinicsPage: React.FC<FindClinicsPageProps> = ({
  onSaveClinic,
  allClinics,
  onSelectClinic,
  onNavigateToClinics
}) => {
  const [selectedCity, setSelectedCity] = useState('Bengaluru');
  const [customCity, setCustomCity] = useState('');
  const [locality, setLocality] = useState('Koramangala');
  const [isCustomCityMode, setIsCustomCityMode] = useState(false);

  // Quick Add Lead Form state
  const activeCity = isCustomCityMode ? customCity : selectedCity;

  const [formData, setFormData] = useState<ClinicFormData>({
    name: '',
    city: activeCity,
    locality: locality,
    address: '',
    phone: '',
    mapsUrl: '',
    websiteUrl: '',
    websiteStatus: 'No Website Found',
    salesStatus: 'To Call',
    notes: '',
    followUpDate: ''
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([]);
  const [duplicateAcknowledged, setDuplicateAcknowledged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedClinic, setLastSavedClinic] = useState<string | null>(null);

  // Keep form city/locality synced when user changes search location
  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setIsCustomCityMode(false);
    const preset = POPULAR_INDIAN_CITIES.find((c) => c.city === city);
    const newLocality = preset && preset.popularLocalities.length > 0 ? preset.popularLocalities[0] : '';
    setLocality(newLocality);
    setFormData((prev) => ({ ...prev, city, locality: newLocality }));
  };

  const handleLocalitySelect = (loc: string) => {
    setLocality(loc);
    setFormData((prev) => ({ ...prev, locality: loc }));
  };

  const handleCustomCityChange = (city: string) => {
    setCustomCity(city);
    setFormData((prev) => ({ ...prev, city }));
  };

  const handleLocalityInputChange = (loc: string) => {
    setLocality(loc);
    setFormData((prev) => ({ ...prev, locality: loc }));
  };

  // Google Maps Search Trigger
  const handleSearchGoogleMaps = () => {
    const finalCity = isCustomCityMode ? customCity.trim() : selectedCity.trim();
    const finalLocality = locality.trim();

    if (!finalCity) {
      alert('Please enter or select a city.');
      return;
    }

    const searchQuery = finalLocality
      ? `dental clinics in ${finalLocality}, ${finalCity}`
      : `dental clinics in ${finalCity}`;

    // Standard Google Maps search URL
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  // Duplicate detection on form typing
  const handleFieldChange = (field: keyof ClinicFormData, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    if (field === 'name' || field === 'phone' || field === 'city' || field === 'locality') {
      if (!updated.name.trim() && !updated.phone?.trim()) {
        setDuplicateMatches([]);
      } else {
        const matches = findDuplicates(
          {
            name: updated.name,
            phone: updated.phone,
            city: updated.city,
            locality: updated.locality
          },
          allClinics
        );
        setDuplicateMatches(matches);
      }
    }
  };

  const handleSaveLead = async (e: React.FormEvent, addAnother = false) => {
    e.preventDefault();

    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) errors.name = 'Clinic name is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.locality.trim()) errors.locality = 'Locality or area is required';

    if (formData.websiteUrl && !formData.websiteUrl.startsWith('http://') && !formData.websiteUrl.startsWith('https://')) {
      errors.websiteUrl = 'URL must start with https:// or http://';
    }

    if (formData.mapsUrl && !formData.mapsUrl.startsWith('http://') && !formData.mapsUrl.startsWith('https://')) {
      errors.mapsUrl = 'URL must start with https:// or http://';
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (duplicateMatches.length > 0 && !duplicateAcknowledged) {
      setDuplicateAcknowledged(true);
      return;
    }

    try {
      setIsSaving(true);
      await onSaveClinic(formData);
      setLastSavedClinic(formData.name);

      if (addAnother) {
        setFormData({
          name: '',
          city: formData.city,
          locality: formData.locality,
          address: '',
          phone: '',
          mapsUrl: '',
          websiteUrl: '',
          websiteStatus: 'No Website Found',
          salesStatus: 'To Call',
          notes: '',
          followUpDate: ''
        });
        setDuplicateMatches([]);
        setDuplicateAcknowledged(false);
      } else {
        setFormData({
          name: '',
          city: activeCity,
          locality: locality,
          address: '',
          phone: '',
          mapsUrl: '',
          websiteUrl: '',
          websiteStatus: 'No Website Found',
          salesStatus: 'To Call',
          notes: '',
          followUpDate: ''
        });
        setDuplicateMatches([]);
        setDuplicateAcknowledged(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const currentPreset = POPULAR_INDIAN_CITIES.find((c) => c.city === selectedCity);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#17202F] tracking-tight">
          Find Dental Clinics
        </h1>
        <p className="text-sm text-[#667085] mt-0.5">
          Search Google Maps for clinics in target areas, identify those needing a website, and manually log them below.
        </p>
      </div>

      {/* Manual Workflow Notice Box */}
      <div className="p-4 bg-[#F0FDFA] border border-[#CCFBF1] rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
        <div className="text-xs text-[#134E48] leading-relaxed">
          <p className="font-semibold text-sm text-[#0F766E]">Manual Verification Workflow</p>
          <p className="mt-0.5 text-[#115E59]">
            Clicking <strong>Search on Google Maps</strong> opens live Google Maps in a new browser tab for your chosen city and area.
            Review the listings to spot clinics without a website or with an outdated profile, copy their contact details, and save them into this CRM using the lead capture form below. No automated scraping or fake data is used.
          </p>
        </div>
      </div>

      {/* Section 1: Google Maps Search Controls */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-[#17202F] flex items-center gap-2">
          <Search className="w-4 h-4 text-[#0F766E]" />
          Step 1: Set Search Location & Launch Google Maps
        </h2>

        {/* City selection chips */}
        <div>
          <label className="block text-xs font-medium text-[#344054] mb-2">
            Popular Indian Cities:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_INDIAN_CITIES.map((c) => (
              <button
                key={c.city}
                type="button"
                onClick={() => handleCitySelect(c.city)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  !isCustomCityMode && selectedCity === c.city
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'bg-[#F2F4F7] hover:bg-[#E5E7EB] text-[#344054]'
                }`}
              >
                {c.city}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsCustomCityMode(true)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isCustomCityMode
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'bg-[#F2F4F7] hover:bg-[#E5E7EB] text-[#344054]'
              }`}
            >
              + Other City
            </button>
          </div>
        </div>

        {/* City and Locality Input Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {isCustomCityMode ? (
            <div>
              <label className="block text-xs font-medium text-[#344054] mb-1">
                Enter Custom City:
              </label>
              <input
                type="text"
                value={customCity}
                onChange={(e) => handleCustomCityChange(e.target.value)}
                placeholder="e.g. Coimbatore, Nashik, Bhopal..."
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] text-[#17202F] bg-white"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-[#344054] mb-1">
                Selected City:
              </label>
              <div className="px-3 py-2 text-sm bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg font-medium text-[#17202F] flex items-center justify-between">
                <span>{selectedCity}</span>
                <span className="text-[11px] text-[#98A2B3]">Click a chip above to switch</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#344054] mb-1">
              Locality or Area:
            </label>
            <input
              type="text"
              value={locality}
              onChange={(e) => handleLocalityInputChange(e.target.value)}
              placeholder="e.g. Koramangala, Bandra West, Anna Nagar..."
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] text-[#17202F] bg-white"
            />
          </div>
        </div>

        {/* Popular Localities Chips for Selected City */}
        {!isCustomCityMode && currentPreset && currentPreset.popularLocalities.length > 0 && (
          <div>
            <span className="text-[11px] text-[#667085] font-medium block mb-1.5">
              Popular areas in {selectedCity}:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {currentPreset.popularLocalities.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleLocalitySelect(loc)}
                  className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                    locality === loc
                      ? 'bg-[#F0FDFA] text-[#0F766E] font-medium border border-[#0F766E]'
                      : 'bg-[#F9FAFB] hover:bg-[#F2F4F7] text-[#475467] border border-[#E5E7EB]'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Google Maps Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSearchGoogleMaps}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Search &quot;dental clinics in {locality || activeCity}&quot; on Google Maps</span>
            <ExternalLink className="w-4 h-4 opacity-80" />
          </button>
          <p className="text-[11px] text-[#98A2B3] mt-1.5">
            Opens Google Maps in a new tab with query: &quot;dental clinics in {locality ? `${locality}, ` : ''}{activeCity}&quot;.
          </p>
        </div>
      </div>

      {/* Section 2: Fast Lead Capture Form */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#F2F4F7]">
          <div>
            <h2 className="text-sm font-semibold text-[#17202F] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#0F766E]" />
              Step 2: Quick Save Clinic into CRM
            </h2>
            <p className="text-xs text-[#667085] mt-0.5">
              As you browse listings on Google Maps, copy details here. City and area are already pre-filled.
            </p>
          </div>

          {lastSavedClinic && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ECFDF5] text-[#15803D] border border-[#A7F3D0] rounded-lg text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
              <span>Saved &quot;{lastSavedClinic}&quot;</span>
              <button
                onClick={onNavigateToClinics}
                className="underline hover:text-[#0F766E] ml-1 cursor-pointer font-medium"
              >
                View in Table
              </button>
            </div>
          )}
        </div>

        {/* Inline Duplicate Warning if detected */}
        {duplicateMatches.length > 0 && (
          <div className="p-3.5 bg-[#FFFAEB] border border-[#FEDF89] rounded-xl space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-[#B54708] shrink-0 mt-0.5" />
              <div className="text-xs text-[#7A2E0E] flex-1">
                <p className="font-semibold text-sm text-[#B54708]">Duplicate Lead Warning</p>
                <p className="mt-0.5">
                  A clinic named <strong>{duplicateMatches[0].clinic.name}</strong> ({duplicateMatches[0].clinic.locality})
                  already exists in your database with matching{' '}
                  {duplicateMatches[0].matchReason === 'both'
                    ? 'name and phone number'
                    : duplicateMatches[0].matchReason === 'phone'
                    ? 'phone number'
                    : 'normalized name'}.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#FEDF89]/60">
              <button
                type="button"
                onClick={() => onSelectClinic(duplicateMatches[0].clinic)}
                className="px-2.5 py-1.5 text-xs font-medium text-[#17202F] bg-white hover:bg-[#F2F4F7] border border-[#E5E7EB] rounded-lg cursor-pointer"
              >
                View Existing Record
              </button>
              <button
                type="button"
                onClick={() => setDuplicateAcknowledged(true)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                  duplicateAcknowledged
                    ? 'bg-[#ECFDF5] text-[#15803D] border-[#A7F3D0]'
                    : 'bg-[#FEF0C7] text-[#B54708] border-[#FEDF89] hover:bg-[#FDE68A]'
                }`}
              >
                {duplicateAcknowledged ? '✓ Duplicate Acknowledged' : 'Acknowledge & Allow Saving'}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={(e) => handleSaveLead(e, false)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-[#344054] mb-1">
                Clinic Name <span className="text-[#B42318]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="e.g. Tooth Comfort Dental Clinic"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] text-[#17202F] bg-white ${
                  formErrors.name ? 'border-[#FECDCA] focus:ring-[#B42318] bg-[#FEF3F2]/30' : 'border-[#E5E7EB]'
                }`}
              />
              {formErrors.name && <p className="text-xs text-[#B42318] mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#344054] mb-1">
                City <span className="text-[#B42318]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] text-[#17202F] bg-white ${
                  formErrors.city ? 'border-[#FECDCA]' : 'border-[#E5E7EB]'
                }`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#344054] mb-1">
                Locality / Area <span className="text-[#B42318]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.locality}
                onChange={(e) => handleFieldChange('locality', e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] text-[#17202F] bg-white ${
                  formErrors.locality ? 'border-[#FECDCA]' : 'border-[#E5E7EB]'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#F2F4F7]">
            <div>
              <label className="block text-xs font-medium text-[#344054] mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#98A2B3]" />
                Contact Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] font-mono text-[#17202F] bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#344054] mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#98A2B3]" />
                Follow-up Date
              </label>
              <input
                type="date"
                value={formData.followUpDate || ''}
                onChange={(e) => handleFieldChange('followUpDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] text-[#17202F] bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#344054] mb-1">
                Website Status <span className="text-[#0F766E] font-medium">(Key Pitch Indicator)</span>
              </label>
              <select
                value={formData.websiteStatus}
                onChange={(e) => handleFieldChange('websiteStatus', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] bg-white text-[#17202F]"
              >
                <option value="No Website Found">No Website Found (High Opportunity)</option>
                <option value="Needs Verification">Needs Verification</option>
                <option value="Has Website">Has Website</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#344054] mb-1">
                Sales Outreach Status
              </label>
              <select
                value={formData.salesStatus}
                onChange={(e) => handleFieldChange('salesStatus', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] bg-white text-[#17202F]"
              >
                <option value="To Call">To Call</option>
                <option value="Called">Called</option>
                <option value="No Answer">No Answer</option>
                <option value="Interested">Interested</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Demo Ready">Demo Ready</option>
                <option value="Won">Won (Sold Website)</option>
                <option value="Lost">Lost</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Ignored">Ignored</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#F2F4F7]">
            <div>
              <label className="block text-xs font-medium text-[#344054] mb-1">
                Google Maps Listing URL
              </label>
              <input
                type="url"
                value={formData.mapsUrl}
                onChange={(e) => handleFieldChange('mapsUrl', e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] text-[#17202F] bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#344054] mb-1">
                Website URL (if listed)
              </label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => handleFieldChange('websiteUrl', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] text-[#17202F] bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#344054] mb-1">
                Full Physical Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                placeholder="Clinic floor, building name, street address..."
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] text-[#17202F] bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#344054] mb-1">
                Outreach Notes & Pitch Angle
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder="Dentist name, clinic specialities, observations..."
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] text-[#17202F] bg-white"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 flex flex-wrap items-center justify-end gap-2.5 border-t border-[#F2F4F7]">
            <button
              type="button"
              onClick={(e) => handleSaveLead(e, true)}
              disabled={isSaving}
              className="px-4 py-2 bg-white hover:bg-[#F7F8FA] text-[#17202F] border border-[#E5E7EB] text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Save & Add Another
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Save Clinic Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
