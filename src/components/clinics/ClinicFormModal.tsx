import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import type { Clinic, ClinicFormData, WebsiteStatus, SalesStatus, DuplicateMatch, PaymentStatus } from '../../types/clinic';
import { findDuplicates } from '../../services/duplicateDetector';
import { AlertTriangle, Plus, Save, Phone, MapPin, Globe, Calendar, FileText, IndianRupee } from 'lucide-react';

interface ClinicFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ClinicFormData, id?: string) => Promise<void>;
  initialData?: Clinic | null;
  defaultCity?: string;
  defaultLocality?: string;
  allClinics: Clinic[];
  onViewExisting?: (clinic: Clinic) => void;
}

const DEFAULT_WEBSITE_STATUS: WebsiteStatus = 'No Website Found';
const DEFAULT_SALES_STATUS: SalesStatus = 'To Call';

export const ClinicFormModal: React.FC<ClinicFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultCity = '',
  defaultLocality = '',
  allClinics,
  onViewExisting
}) => {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState<ClinicFormData>({
    name: '',
    city: defaultCity,
    locality: defaultLocality,
    address: '',
    phone: '',
    mapsUrl: '',
    websiteUrl: '',
    websiteStatus: DEFAULT_WEBSITE_STATUS,
    salesStatus: DEFAULT_SALES_STATUS,
    notes: '',
    followUpDate: '',
    dealValue: 25000,
    paymentStatus: 'Fully Paid',
    dealPlan: 'Standard Clinic Portal',
    dealDate: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([]);
  const [duplicateWarningDismissed, setDuplicateWarningDismissed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        city: initialData.city,
        locality: initialData.locality,
        address: initialData.address || '',
        phone: initialData.phone || '',
        mapsUrl: initialData.mapsUrl || '',
        websiteUrl: initialData.websiteUrl || '',
        websiteStatus: initialData.websiteStatus,
        salesStatus: initialData.salesStatus,
        notes: initialData.notes || '',
        followUpDate: initialData.followUpDate || '',
        dealValue: initialData.dealValue ?? 25000,
        paymentStatus: initialData.paymentStatus || 'Fully Paid',
        dealPlan: initialData.dealPlan || 'Standard Clinic Portal',
        dealDate: initialData.dealDate || ''
      });
      setDuplicateMatches([]);
      setDuplicateWarningDismissed(false);
    } else {
      setFormData({
        name: '',
        city: defaultCity,
        locality: defaultLocality,
        address: '',
        phone: '',
        mapsUrl: '',
        websiteUrl: '',
        websiteStatus: DEFAULT_WEBSITE_STATUS,
        salesStatus: DEFAULT_SALES_STATUS,
        notes: '',
        followUpDate: '',
        dealValue: 25000,
        paymentStatus: 'Fully Paid',
        dealPlan: 'Standard Clinic Portal',
        dealDate: ''
      });
      setDuplicateMatches([]);
      setDuplicateWarningDismissed(false);
    }
    setErrors({});
  }, [initialData, defaultCity, defaultLocality, isOpen]);

  // Real-time duplicate check
  useEffect(() => {
    if (!formData.name.trim() && !formData.phone?.trim()) {
      setDuplicateMatches([]);
      return;
    }

    const matches = findDuplicates(
      {
        name: formData.name,
        phone: formData.phone,
        city: formData.city,
        locality: formData.locality,
        id: initialData?.id
      },
      allClinics
    );

    setDuplicateMatches(matches);
  }, [formData.name, formData.phone, formData.city, formData.locality, initialData?.id, allClinics]);

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errs.name = 'Clinic name is required';
    }
    if (!formData.city.trim()) {
      errs.city = 'City is required';
    }
    if (!formData.locality.trim()) {
      errs.locality = 'Locality or area is required';
    }

    if (formData.websiteUrl && !formData.websiteUrl.startsWith('http://') && !formData.websiteUrl.startsWith('https://')) {
      errs.websiteUrl = 'Website URL should start with https:// or http://';
    }

    if (formData.mapsUrl && !formData.mapsUrl.startsWith('http://') && !formData.mapsUrl.startsWith('https://')) {
      errs.mapsUrl = 'Google Maps URL should start with https:// or http://';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, addAnother = false) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (duplicateMatches.length > 0 && !duplicateWarningDismissed) {
      setDuplicateWarningDismissed(true);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(formData, initialData?.id);

      if (addAnother) {
        setFormData({
          name: '',
          city: formData.city,
          locality: formData.locality,
          address: '',
          phone: '',
          mapsUrl: '',
          websiteUrl: '',
          websiteStatus: DEFAULT_WEBSITE_STATUS,
          salesStatus: DEFAULT_SALES_STATUS,
          notes: '',
          followUpDate: '',
          dealValue: 25000,
          paymentStatus: 'Fully Paid',
          dealPlan: 'Standard Clinic Portal',
          dealDate: ''
        });
        setDuplicateMatches([]);
        setDuplicateWarningDismissed(false);
      } else {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDealStage =
    formData.salesStatus === 'Won' ||
    formData.salesStatus === 'Interested' ||
    formData.salesStatus === 'Demo Ready';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Clinic Record' : 'Add New Dental Clinic'}
      subtitle={
        isEditing
          ? 'Update contact info, website status, and sales outreach notes'
          : 'Save clinic details discovered from Google Maps into your local database'
      }
      maxWidth="2xl"
    >
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
        {/* Duplicate Warning Box */}
        {duplicateMatches.length > 0 && (
          <div className="p-3.5 bg-[#FFFAEB] border border-[#FEDF89] rounded-xl space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-[#B54708] shrink-0 mt-0.5" />
              <div className="flex-1 text-xs text-[#7A2E0E]">
                <p className="font-semibold text-sm text-[#B54708]">Potential Duplicate Warning</p>
                <p className="mt-0.5">
                  A clinic named{' '}
                  <strong className="font-semibold underline">{duplicateMatches[0].clinic.name}</strong> (
                  {duplicateMatches[0].clinic.locality}, {duplicateMatches[0].clinic.city}) matches this entry by{' '}
                  {duplicateMatches[0].matchReason === 'both'
                    ? 'both name and phone'
                    : duplicateMatches[0].matchReason === 'phone'
                    ? 'phone number'
                    : 'normalized clinic name'}
                  .
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#FEDF89]/60">
              {onViewExisting && (
                <button
                  type="button"
                  onClick={() => {
                    onViewExisting(duplicateMatches[0].clinic);
                    onClose();
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-[#17202F] bg-white hover:bg-[#F2F4F7] rounded-lg border border-[#E5E7EB] cursor-pointer"
                >
                  View Existing Record
                </button>
              )}
              <button
                type="button"
                onClick={() => setDuplicateWarningDismissed(true)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border cursor-pointer ${
                  duplicateWarningDismissed
                    ? 'bg-[#ECFDF5] text-[#15803D] border-[#A7F3D0]'
                    : 'bg-[#FEF0C7] text-[#B54708] border-[#FEDF89] hover:bg-[#FDE68A]'
                }`}
              >
                {duplicateWarningDismissed ? '✓ Duplicate Acknowledged' : 'Acknowledge & Allow Saving'}
              </button>
            </div>
          </div>
        )}

        {/* Section 1: Required Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-[#344054] mb-1">
              Clinic Name <span className="text-[#B42318]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Apex Multispeciality Dental Clinic"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] text-[#17202F] bg-white ${
                errors.name ? 'border-[#FECDCA] focus:ring-[#B42318] bg-[#FEF3F2]/30' : 'border-[#E5E7EB]'
              }`}
            />
            {errors.name && <p className="text-xs text-[#B42318] mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#344054] mb-1">
              City <span className="text-[#B42318]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g. Bengaluru"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] text-[#17202F] bg-white ${
                errors.city ? 'border-[#FECDCA]' : 'border-[#E5E7EB]'
              }`}
            />
            {errors.city && <p className="text-xs text-[#B42318] mt-1">{errors.city}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[#344054] mb-1">
              Locality or Area <span className="text-[#B42318]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.locality}
              onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
              placeholder="e.g. Koramangala 4th Block"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] text-[#17202F] bg-white ${
                errors.locality ? 'border-[#FECDCA]' : 'border-[#E5E7EB]'
              }`}
            />
            {errors.locality && <p className="text-xs text-[#B42318] mt-1">{errors.locality}</p>}
          </div>
        </div>

        {/* Section 2: Contact & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#F2F4F7]">
          <div>
            <label className="block text-xs font-medium text-[#344054] mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#98A2B3]" />
              Public Contact Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. +91 98765 43210 or 080 2345 6789"
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
              onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] text-[#17202F] bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#344054] mb-1">
              Website Status <span className="text-[#667085] font-normal">(Sales Target Indicator)</span>
            </label>
            <select
              value={formData.websiteStatus}
              onChange={(e) => setFormData({ ...formData, websiteStatus: e.target.value as WebsiteStatus })}
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
              onChange={(e) => setFormData({ ...formData, salesStatus: e.target.value as SalesStatus })}
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

        {/* REVENUE SECTION: Website Deal Value & Payment Details */}
        {isDealStage && (
          <div className="p-3.5 bg-[#F0FDFA]/50 border border-[#CCFBF1] rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-[#0F766E]">
              <IndianRupee className="w-4 h-4 text-[#0F766E]" />
              <span>Website Deal & Revenue Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#115E59] mb-1">
                  Website Package
                </label>
                <select
                  value={formData.dealPlan || 'Standard Clinic Portal'}
                  onChange={(e) => {
                    const plan = e.target.value;
                    let val = formData.dealValue;
                    if (plan === 'Starter Website') val = 15000;
                    else if (plan === 'Standard Clinic Portal') val = 25000;
                    else if (plan === 'Premium Clinic Suite') val = 45000;
                    setFormData({ ...formData, dealPlan: plan, dealValue: val });
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-[#CCFBF1] rounded-lg bg-white text-[#17202F] focus:border-[#0F766E]"
                >
                  <option value="Starter Website">Starter Website (₹15,000)</option>
                  <option value="Standard Clinic Portal">Standard Clinic Portal (₹25,000)</option>
                  <option value="Premium Clinic Suite">Premium Clinic Suite (₹45,000)</option>
                  <option value="Custom Website Deal">Custom Website Deal</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#115E59] mb-1">
                  Deal Value (₹)
                </label>
                <input
                  type="number"
                  value={formData.dealValue ?? 25000}
                  onChange={(e) => setFormData({ ...formData, dealValue: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 text-xs border border-[#CCFBF1] rounded-lg bg-white font-mono text-[#17202F] focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#115E59] mb-1">
                  Payment Status
                </label>
                <select
                  value={formData.paymentStatus || 'Fully Paid'}
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as PaymentStatus })}
                  className="w-full px-2.5 py-1.5 text-xs border border-[#CCFBF1] rounded-lg bg-white text-[#17202F] focus:border-[#0F766E]"
                >
                  <option value="Fully Paid">Fully Paid</option>
                  <option value="Advance Paid">Advance Paid (50%)</option>
                  <option value="Pending">Payment Pending</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Links & Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#F2F4F7]">
          <div>
            <label className="block text-xs font-medium text-[#344054] mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#98A2B3]" />
              Google Maps Listing URL
            </label>
            <input
              type="url"
              value={formData.mapsUrl}
              onChange={(e) => setFormData({ ...formData, mapsUrl: e.target.value })}
              placeholder="https://maps.google.com/..."
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] text-[#17202F] bg-white ${
                errors.mapsUrl ? 'border-[#FECDCA] focus:ring-[#B42318]' : 'border-[#E5E7EB]'
              }`}
            />
            {errors.mapsUrl && <p className="text-xs text-[#B42318] mt-1">{errors.mapsUrl}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#344054] mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#98A2B3]" />
              Website URL (if existing)
            </label>
            <input
              type="url"
              value={formData.websiteUrl}
              onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
              placeholder="https://clinicname.com"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] text-[#17202F] bg-white ${
                errors.websiteUrl ? 'border-[#FECDCA] focus:ring-[#B42318]' : 'border-[#E5E7EB]'
              }`}
            />
            {errors.websiteUrl && <p className="text-xs text-[#B42318] mt-1">{errors.websiteUrl}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[#344054] mb-1">
              Full Physical Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Shop #4, Ground Floor, Near Metro Station, MG Road..."
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] text-[#17202F] bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[#344054] mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#98A2B3]" />
              Outreach Notes & Pitch Context
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Doctor's name, gatekeeper notes, services offered, pitch angle..."
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] resize-y text-[#17202F] bg-white"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-[#F2F4F7]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-[#667085] hover:text-[#17202F] hover:bg-[#F2F4F7] rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-3.5 py-2 text-xs font-medium text-[#17202F] bg-white hover:bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Save this clinic and clear the form to add another clinic immediately"
              >
                <Plus className="w-3.5 h-3.5" />
                Save & Add Another
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2 text-xs font-medium text-white bg-[#0F766E] hover:bg-[#115E59] rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isEditing ? 'Update Clinic' : 'Save Clinic'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
