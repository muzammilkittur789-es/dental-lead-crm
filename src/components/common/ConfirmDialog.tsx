import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  requiredWord?: string;
  userWordInput?: string;
  onUserWordChange?: (val: string) => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
  requiredWord,
  userWordInput = '',
  onUserWordChange
}) => {
  const isConfirmDisabled = requiredWord ? userWordInput.trim() !== requiredWord : false;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} maxWidth="md">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg shrink-0 ${isDestructive ? 'bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]' : 'bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89]'}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-[#475467] leading-relaxed">{message}</p>

          {requiredWord && onUserWordChange && (
            <div className="mt-4">
              <label className="block text-xs font-medium text-[#344054] mb-1">
                Type <span className="font-mono text-[#B42318] bg-[#FEF3F2] px-1 py-0.5 rounded border border-[#FECDCA]">{requiredWord}</span> to confirm:
              </label>
              <input
                type="text"
                value={userWordInput}
                onChange={(e) => onUserWordChange(e.target.value)}
                placeholder={requiredWord}
                className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-hidden focus:border-[#B42318] text-[#17202F]"
                autoFocus
              />
            </div>
          )}

          <div className="mt-6 flex justify-end items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-2 text-xs font-medium text-[#667085] hover:text-[#17202F] hover:bg-[#F2F4F7] rounded-lg transition-colors cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isConfirmDisabled}
              className={`px-4 py-2 text-xs font-medium rounded-lg text-white shadow-xs transition-colors cursor-pointer ${
                isConfirmDisabled
                  ? 'bg-[#E5E7EB] cursor-not-allowed text-[#98A2B3]'
                  : isDestructive
                  ? 'bg-[#B42318] hover:bg-[#912018]'
                  : 'bg-[#0F766E] hover:bg-[#115E59]'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
