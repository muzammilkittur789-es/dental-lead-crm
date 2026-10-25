import React from 'react';
import { Modal } from '../common/Modal';
import type { Clinic, DuplicateMatch } from '../../types/clinic';
import { WebsiteBadge, SalesBadge } from '../common/Badge';
import { AlertTriangle, Eye, CheckCircle2 } from 'lucide-react';

interface DuplicateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: DuplicateMatch[];
  pendingClinicName: string;
  onSaveAnyway: () => void;
  onViewExisting: (clinic: Clinic) => void;
}

export const DuplicateWarningModal: React.FC<DuplicateWarningModalProps> = ({
  isOpen,
  onClose,
  matches,
  pendingClinicName,
  onSaveAnyway,
  onViewExisting
}) => {
  if (matches.length === 0) return null;
  const primaryMatch = matches[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Potential Duplicate Detected"
      subtitle="A matching clinic already exists in your database"
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Warning Banner */}
        <div className="p-3.5 bg-[#FFFAEB] border border-[#FEDF89] rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#B54708] shrink-0 mt-0.5" />
          <div className="text-xs text-[#7A2E0E] leading-relaxed">
            <p className="font-semibold text-sm text-[#B54708]">Duplicate Check Alert</p>
            <p className="mt-0.5">
              You are adding <strong className="font-semibold text-[#17202F]">{pendingClinicName}</strong>. We found{' '}
              {matches.length === 1 ? 'an existing clinic' : `${matches.length} existing clinics`} with similar details (
              {primaryMatch.matchReason === 'both'
                ? 'matching both normalized clinic name and phone number'
                : primaryMatch.matchReason === 'phone'
                ? 'matching phone number'
                : 'matching clinic name and location'}
              ).
            </p>
          </div>
        </div>

        {/* Existing Record Details Card */}
        <div>
          <h3 className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider mb-2">
            Existing Clinic Record in Database
          </h3>
          <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-semibold text-[#17202F]">{primaryMatch.clinic.name}</h4>
                <p className="text-xs text-[#667085]">
                  {primaryMatch.clinic.locality}, {primaryMatch.clinic.city}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <WebsiteBadge status={primaryMatch.clinic.websiteStatus} size="sm" />
                <SalesBadge status={primaryMatch.clinic.salesStatus} size="sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-[#475467] pt-2 border-t border-[#E5E7EB]">
              <div>
                <span className="text-[#667085]">Phone: </span>
                <span className="font-mono font-medium text-[#17202F]">
                  {primaryMatch.clinic.phone || 'None recorded'}
                </span>
              </div>
              <div>
                <span className="text-[#667085]">Added: </span>
                <span>{new Date(primaryMatch.clinic.createdAt).toLocaleDateString()}</span>
              </div>
              {primaryMatch.clinic.address && (
                <div className="col-span-2">
                  <span className="text-[#667085]">Address: </span>
                  <span>{primaryMatch.clinic.address}</span>
                </div>
              )}
              {primaryMatch.clinic.notes && (
                <div className="col-span-2">
                  <span className="text-[#667085]">Notes: </span>
                  <span className="italic text-[#344054]">{primaryMatch.clinic.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#F2F4F7]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-[#667085] hover:text-[#17202F] hover:bg-[#F2F4F7] rounded-lg transition-colors cursor-pointer"
          >
            Back & Change Details
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => onViewExisting(primaryMatch.clinic)}
              className="w-full sm:w-auto px-3.5 py-2 text-xs font-medium text-[#17202F] bg-white hover:bg-[#F2F4F7] border border-[#E5E7EB] rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#667085]" />
              View Existing Record
            </button>

            <button
              type="button"
              onClick={onSaveAnyway}
              className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-white bg-[#0F766E] hover:bg-[#115E59] rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Save Anyway as New
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
