import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import type { Clinic, SalesStatus } from '../../types/clinic';
import { WebsiteBadge, SalesBadge, FollowUpBadge, PaymentBadge } from '../common/Badge';
import { formatINR, DEFAULT_DEAL_VALUE } from '../../services/revenue';
import {
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  Edit,
  Trash2,
  FileText,
  Copy,
  Check,
  Trophy
} from 'lucide-react';

interface ClinicDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinic: Clinic | null;
  onEdit: (clinic: Clinic) => void;
  onDelete: (clinic: Clinic) => void;
  onQuickUpdateStatus: (id: string, salesStatus: SalesStatus, notes?: string) => Promise<void>;
}

export const ClinicDetailModal: React.FC<ClinicDetailModalProps> = ({
  isOpen,
  onClose,
  clinic,
  onEdit,
  onDelete,
  onQuickUpdateStatus
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!clinic) return null;

  const handleCopyPhone = () => {
    if (clinic.phone) {
      navigator.clipboard.writeText(clinic.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleStatusChange = async (newStatus: SalesStatus) => {
    try {
      setIsUpdatingStatus(true);
      await onQuickUpdateStatus(clinic.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const isWon = clinic.salesStatus === 'Won';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clinic.name}
      subtitle={`${clinic.locality}, ${clinic.city}`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Top Badges & Quick Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
          <div className="flex flex-wrap items-center gap-2">
            <WebsiteBadge status={clinic.websiteStatus} />
            <SalesBadge status={clinic.salesStatus} />
            <FollowUpBadge date={clinic.followUpDate} />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(clinic)}
              className="px-3 py-1.5 text-xs font-medium text-[#17202F] bg-white hover:bg-[#F2F4F7] border border-[#E5E7EB] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Edit className="w-3.5 h-3.5 text-[#667085]" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(clinic)}
              className="px-3 py-1.5 text-xs font-medium text-[#B42318] bg-[#FEF3F2] hover:bg-[#FEE4E2] border border-[#FECDCA] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>

        {/* Won Deal Revenue Card if applicable */}
        {isWon && (
          <div className="p-4 bg-[#F0FDFA] rounded-xl border border-[#CCFBF1] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#0F766E] text-white rounded-lg shadow-xs">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0F766E] block">
                  Closed Website Sale
                </span>
                <span className="font-semibold text-[#17202F] text-sm">
                  {clinic.dealPlan || 'Standard Clinic Website'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-base font-semibold font-mono text-[#0F766E] block tabular-nums">
                {formatINR(clinic.dealValue ?? DEFAULT_DEAL_VALUE)}
              </span>
              <PaymentBadge status={clinic.paymentStatus || 'Fully Paid'} size="sm" />
            </div>
          </div>
        )}

        {/* Contact & Location Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-xl border border-[#E5E7EB] space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-[#0F766E]" />
              Contact & Calling
            </h4>

            {clinic.phone ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-semibold text-[#17202F]">{clinic.phone}</span>
                  <button
                    onClick={handleCopyPhone}
                    className="p-1.5 text-[#98A2B3] hover:text-[#17202F] hover:bg-[#F2F4F7] rounded-md transition-colors cursor-pointer"
                    title="Copy phone number"
                  >
                    {copiedPhone ? <Check className="w-4 h-4 text-[#15803D]" /> : <Copy className="w-4 h-4 text-[#667085]" />}
                  </button>
                </div>

                <a
                  href={`tel:${clinic.phone.replace(/\s+/g, '')}`}
                  className="w-full py-2 px-3 bg-[#0F766E] hover:bg-[#115E59] text-white font-medium text-xs rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call Now via Phone
                </a>
              </div>
            ) : (
              <p className="text-xs text-[#98A2B3] italic">No phone number recorded for this clinic.</p>
            )}
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#E5E7EB] space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#0F766E]" />
              Web Presence & Maps
            </h4>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[#667085] block mb-0.5">Google Maps Listing:</span>
                {clinic.mapsUrl ? (
                  <a
                    href={clinic.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#0F766E] hover:text-[#115E59] hover:underline font-medium break-all"
                  >
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    Open Listing on Google Maps
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-[#98A2B3] italic">No Google Maps URL saved</span>
                )}
              </div>

              <div className="pt-2 border-t border-[#F2F4F7]">
                <span className="text-[#667085] block mb-0.5">Website:</span>
                {clinic.websiteUrl ? (
                  <a
                    href={clinic.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#0F766E] hover:text-[#115E59] hover:underline font-medium break-all"
                  >
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    {clinic.websiteUrl}
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-[#B42318] font-medium">No Website Found (Pitch Prospect!)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Address & Outreach Notes */}
        <div className="p-4 bg-white rounded-xl border border-[#E5E7EB] space-y-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#0F766E]" />
            Address & Outreach Context
          </h4>

          <div className="text-xs text-[#344054] space-y-2">
            <div>
              <span className="text-[#667085] font-medium">Physical Address:</span>
              <p className="mt-0.5 font-normal text-[#17202F]">{clinic.address || `${clinic.locality}, ${clinic.city}`}</p>
            </div>

            <div>
              <span className="text-[#667085] font-medium">Notes & Pitch Strategy:</span>
              <div className="mt-1 p-3 bg-[#F9FAFB] rounded-lg text-[#344054] whitespace-pre-wrap leading-relaxed border border-[#E5E7EB]">
                {clinic.notes || 'No outreach notes yet. Use edit or quick note to add conversation details.'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Sales Status Update Box */}
        <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] space-y-2.5">
          <h4 className="text-xs font-semibold text-[#17202F]">Quick Outreach Status Update</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['Called', 'No Answer', 'Interested', 'Follow-up', 'Demo Ready', 'Won', 'Lost', 'Not Interested'] as SalesStatus[]).map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  disabled={isUpdatingStatus || clinic.salesStatus === status}
                  onClick={() => handleStatusChange(status)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    clinic.salesStatus === status
                      ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-xs'
                      : 'bg-white hover:bg-[#F2F4F7] text-[#344054] border-[#E5E7EB]'
                  }`}
                >
                  {status}
                </button>
              )
            )}
          </div>
        </div>

        {/* Metadata Footer */}
        <div className="text-[11px] text-[#98A2B3] flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F2F4F7]">
          <div>
            <span>Added: {new Date(clinic.createdAt).toLocaleString()}</span>
            {clinic.updatedAt !== clinic.createdAt && (
              <span className="ml-3">Updated: {new Date(clinic.updatedAt).toLocaleString()}</span>
            )}
          </div>
          <span className="font-mono text-[#98A2B3]">ID: {clinic.id}</span>
        </div>
      </div>
    </Modal>
  );
};
