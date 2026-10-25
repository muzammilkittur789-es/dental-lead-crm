import React from 'react';
import type { WebsiteStatus, SalesStatus, PaymentStatus } from '../../types/clinic';

interface WebsiteBadgeProps {
  status: WebsiteStatus;
  size?: 'sm' | 'md';
}

export const WebsiteBadge: React.FC<WebsiteBadgeProps> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5 font-medium';

  switch (status) {
    case 'No Website Found':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89] ${sizeClasses}`}
          title="No website found on Google Maps listing"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#B54708] shrink-0" />
          No Website Found
        </span>
      );
    case 'Has Website':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md bg-[#ECFDF5] text-[#15803D] border border-[#A7F3D0] ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] shrink-0" />
          Has Website
        </span>
      );
    case 'Needs Verification':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md bg-[#F2F4F7] text-[#475467] border border-[#E4E7EC] ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#98A2B3] shrink-0" />
          Needs Verification
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-md bg-[#F2F4F7] text-[#475467] border border-[#E4E7EC] ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};

interface SalesBadgeProps {
  status: SalesStatus;
  size?: 'sm' | 'md';
}

export const SalesBadge: React.FC<SalesBadgeProps> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'text-[11px] px-2 py-0.5 font-medium' : 'text-xs px-2.5 py-0.5 font-medium';

  switch (status) {
    case 'To Call':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#F2F4F7] text-[#344054] border border-[#E4E7EC] ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#98A2B3] shrink-0" />
          To Call
        </span>
      );
    case 'Called':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#F0F9FF] text-[#026AA2] border border-[#B9E6FE] ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#026AA2] shrink-0" />
          Called
        </span>
      );
    case 'No Answer':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89] ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#B54708] shrink-0" />
          No Answer
        </span>
      );
    case 'Interested':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] font-semibold ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] shrink-0" />
          Interested
        </span>
      );
    case 'Follow-up':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89] ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#B54708] shrink-0" />
          Follow-up
        </span>
      );
    case 'Demo Ready':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF] font-semibold ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#175CD3] shrink-0" />
          Demo Ready
        </span>
      );
    case 'Won':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#ECFDF5] text-[#15803D] border border-[#A7F3D0] font-semibold ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] shrink-0" />
          Won
        </span>
      );
    case 'Lost':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA] ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#B42318] shrink-0" />
          Lost
        </span>
      );
    case 'Not Interested':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA] ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#98A2B3] shrink-0" />
          Not Interested
        </span>
      );
    case 'Ignored':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#F2F4F7] text-[#475467] border border-[#E4E7EC] ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#98A2B3] shrink-0" />
          Ignored
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-md bg-[#F2F4F7] text-[#344054] border border-[#E4E7EC] ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};

interface FollowUpBadgeProps {
  date?: string;
  size?: 'sm' | 'md';
}

export const FollowUpBadge: React.FC<FollowUpBadgeProps> = ({ date, size = 'md' }) => {
  if (!date) {
    return <span className="text-[12px] text-[#98A2B3]">No date</span>;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5 font-medium';

  if (date < todayStr) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA] font-medium ${sizeClasses}`}
        title={`Overdue: scheduled for ${date}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#B42318]" />
        Overdue ({date})
      </span>
    );
  }

  if (date === todayStr) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89] font-medium ${sizeClasses}`}
        title="Due today"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#B54708]" />
        Today
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md bg-[#F2F4F7] text-[#475467] border border-[#E4E7EC] ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#98A2B3]" />
      {date}
    </span>
  );
};

interface PaymentBadgeProps {
  status?: PaymentStatus;
  size?: 'sm' | 'md';
}

export const PaymentBadge: React.FC<PaymentBadgeProps> = ({ status = 'Fully Paid', size = 'md' }) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'text-[11px] px-2 py-0.5 font-medium' : 'text-xs px-2.5 py-0.5 font-medium';

  switch (status) {
    case 'Fully Paid':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#ECFDF5] text-[#15803D] border border-[#A7F3D0] ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
          Fully Paid
        </span>
      );
    case 'Advance Paid':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89] ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#B54708]" />
          Advance Paid (50%)
        </span>
      );
    case 'Pending':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA] ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#B42318]" />
          Payment Pending
        </span>
      );
    default:
      return null;
  }
};
