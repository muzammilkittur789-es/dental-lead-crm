import React, { useState } from 'react';
import type { Clinic, PaymentStatus } from '../types/clinic';
import { calculateRevenueSummary, formatINR, DEFAULT_DEAL_VALUE } from '../services/revenue';
import { PaymentBadge } from '../components/common/Badge';
import {
  IndianRupee,
  Trophy,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Plus,
  Edit,
  Building2
} from 'lucide-react';

interface RevenuePageProps {
  clinics: Clinic[];
  onSelectClinic: (clinic: Clinic) => void;
  onEditClinic: (clinic: Clinic) => void;
  onOpenAddModal: () => void;
  onUpdateClinicPayment: (id: string, paymentStatus: PaymentStatus, dealValue?: number) => Promise<void>;
  onNavigateToClinics: () => void;
}

export const RevenuePage: React.FC<RevenuePageProps> = ({
  clinics,
  onSelectClinic,
  onEditClinic,
  onOpenAddModal,
  onUpdateClinicPayment,
  onNavigateToClinics
}) => {
  const summary = calculateRevenueSummary(clinics);

  const wonClinics = clinics.filter((c) => c.salesStatus === 'Won');
  const pipelineClinics = clinics.filter((c) => c.salesStatus === 'Interested' || c.salesStatus === 'Demo Ready');

  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus>('Fully Paid');
  const [customDealValue, setCustomDealValue] = useState<number>(DEFAULT_DEAL_VALUE);

  const handleStartEditPayment = (clinic: Clinic) => {
    setEditingPaymentId(clinic.id);
    setSelectedPaymentStatus(clinic.paymentStatus || 'Fully Paid');
    setCustomDealValue(clinic.dealValue ?? DEFAULT_DEAL_VALUE);
  };

  const handleSavePayment = async (clinicId: string) => {
    await onUpdateClinicPayment(clinicId, selectedPaymentStatus, customDealValue);
    setEditingPaymentId(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17202F] tracking-tight flex items-center gap-2">
            <span className="p-1 rounded-md bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] inline-flex">
              <IndianRupee className="w-5 h-5" />
            </span>
            <span>Revenue & Closed Deals</span>
          </h1>
          <p className="text-sm text-[#667085] mt-0.5">
            Track income from dental clinic website packages, payments received, and prospective pipeline value.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Clinic Lead</span>
          </button>
        </div>
      </div>

      {/* Revenue KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Won Revenue */}
        <div className="p-4 bg-white rounded-xl border border-[#CCFBF1] bg-[#F0FDFA]/40 shadow-xs sm:col-span-1">
          <div className="flex items-center justify-between text-[#0F766E] text-[11px] font-semibold uppercase tracking-wider mb-1">
            <span>Total Sales</span>
            <Trophy className="w-4 h-4 text-[#0F766E]" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-[#0F766E]">
            {formatINR(summary.totalWonRevenue)}
          </div>
          <p className="text-[11px] text-[#115E59] mt-1">
            {summary.totalDealsWon} {summary.totalDealsWon === 1 ? 'website sold' : 'websites sold'}
          </p>
        </div>

        {/* Cash Collected */}
        <div className="p-4 bg-white rounded-xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-[#667085] text-[11px] font-semibold uppercase tracking-wider mb-1">
            <span>Cash Collected</span>
            <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
          </div>
          <div className="text-2xl font-semibold tabular-nums text-[#15803D]">
            {formatINR(summary.collectedRevenue)}
          </div>
          <p className="text-[11px] text-[#667085] mt-1">Realized payments</p>
        </div>

        {/* Pending Balance */}
        <div className="p-4 bg-white rounded-xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-[#667085] text-[11px] font-semibold uppercase tracking-wider mb-1">
            <span>Pending Balance</span>
            <Clock className="w-4 h-4 text-[#B45309]" />
          </div>
          <div className="text-2xl font-semibold tabular-nums text-[#B45309]">
            {formatINR(summary.pendingRevenue)}
          </div>
          <p className="text-[11px] text-[#667085] mt-1">Awaiting completion</p>
        </div>

        {/* Pipeline Value */}
        <div className="p-4 bg-white rounded-xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-[#667085] text-[11px] font-semibold uppercase tracking-wider mb-1">
            <span>Hot Pipeline</span>
            <Sparkles className="w-4 h-4 text-[#0F766E]" />
          </div>
          <div className="text-2xl font-semibold tabular-nums text-[#17202F]">
            {formatINR(summary.pipelineOpportunityValue)}
          </div>
          <p className="text-[11px] text-[#667085] mt-1">Interested / Demo</p>
        </div>

        {/* Avg Deal Size */}
        <div className="p-4 bg-white rounded-xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-[#667085] text-[11px] font-semibold uppercase tracking-wider mb-1">
            <span>Avg Deal Ticket</span>
            <TrendingUp className="w-4 h-4 text-[#667085]" />
          </div>
          <div className="text-2xl font-semibold tabular-nums text-[#17202F]">
            {formatINR(summary.averageDealSize)}
          </div>
          <p className="text-[11px] text-[#667085] mt-1">Per clinic project</p>
        </div>
      </div>

      {/* Closed Deals Management Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#F2F4F7] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#17202F] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#0F766E]" />
              <span>Closed Website Deals ({wonClinics.length})</span>
            </h2>
            <p className="text-[11px] text-[#667085] mt-0.5">
              Clinics marked with sales status &quot;Won&quot;. Update deal amount and payment statuses.
            </p>
          </div>

          <button
            onClick={onNavigateToClinics}
            className="text-xs font-medium text-[#0F766E] hover:text-[#115E59] flex items-center gap-1 cursor-pointer"
          >
            <span>View All Clinics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[11px] font-semibold text-[#475467] uppercase tracking-wider select-none">
                <th className="py-3 px-4">Clinic Name</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Website Package</th>
                <th className="py-3 px-3">Deal Value (₹)</th>
                <th className="py-3 px-3">Payment Status</th>
                <th className="py-3 px-3">Closed Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F4F7] text-xs">
              {wonClinics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#98A2B3]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Trophy className="w-10 h-10 mx-auto text-[#98A2B3] stroke-1" />
                      <p className="font-semibold text-sm text-[#17202F]">No Closed Deals Yet</p>
                      <p className="text-xs text-[#667085]">
                        When you pitch a dental clinic and they agree to build a website, change their sales status to <strong>&quot;Won&quot;</strong> to record revenue here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                wonClinics.map((clinic) => {
                  const isEditing = editingPaymentId === clinic.id;
                  const dealVal = clinic.dealValue ?? DEFAULT_DEAL_VALUE;
                  const paymentStatus = clinic.paymentStatus || 'Fully Paid';

                  return (
                    <tr
                      key={clinic.id}
                      className="hover:bg-[#F8F9FA] transition-colors cursor-pointer"
                      onClick={() => onSelectClinic(clinic)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#17202F] hover:text-[#0F766E] transition-colors">
                          {clinic.name}
                        </div>
                        {clinic.phone && (
                          <div className="text-[11px] text-[#667085] font-mono mt-0.5">{clinic.phone}</div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-[#17202F]">{clinic.locality}</span>,{' '}
                        <span className="text-[#667085] text-[11px]">{clinic.city}</span>
                      </td>

                      <td className="py-3 px-3 text-[#475467]">
                        {clinic.dealPlan || 'Standard Clinic Website'}
                      </td>

                      {/* Deal Value */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-[#667085] font-mono">₹</span>
                            <input
                              type="number"
                              value={customDealValue}
                              onChange={(e) => setCustomDealValue(Number(e.target.value))}
                              className="w-24 px-2 py-1 text-xs border border-[#E5E7EB] rounded bg-white font-mono text-[#17202F] focus:border-[#0F766E]"
                            />
                          </div>
                        ) : (
                          <span className="font-mono font-semibold text-[#17202F] text-xs">
                            {formatINR(dealVal)}
                          </span>
                        )}
                      </td>

                      {/* Payment Status Badge */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        {isEditing ? (
                          <select
                            value={selectedPaymentStatus}
                            onChange={(e) => setSelectedPaymentStatus(e.target.value as PaymentStatus)}
                            className="px-2 py-1 text-xs border border-[#E5E7EB] rounded bg-white text-[#17202F] focus:border-[#0F766E]"
                          >
                            <option value="Fully Paid">Fully Paid</option>
                            <option value="Advance Paid">Advance Paid (50%)</option>
                            <option value="Pending">Pending</option>
                          </select>
                        ) : (
                          <PaymentBadge status={paymentStatus} size="sm" />
                        )}
                      </td>

                      <td className="py-3 px-3 text-[11px] text-[#667085]">
                        {clinic.dealDate || new Date(clinic.updatedAt || clinic.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isEditing ? (
                            <button
                              type="button"
                              onClick={() => handleSavePayment(clinic.id)}
                              className="px-2.5 py-1 bg-[#0F766E] hover:bg-[#115E59] text-white font-medium text-xs rounded-lg cursor-pointer"
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartEditPayment(clinic)}
                              className="px-2.5 py-1 bg-[#F2F4F7] hover:bg-[#E5E7EB] text-[#17202F] text-xs font-medium rounded-lg cursor-pointer transition-colors"
                              title="Update deal value and payment status"
                            >
                              Update
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onEditClinic(clinic)}
                            className="p-1.5 text-[#667085] hover:text-[#0F766E] hover:bg-[#F0FDFA] rounded-md transition-colors cursor-pointer"
                            title="Edit full clinic details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Grid: Pipeline Forecast & Pricing Packages Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Hot Pipeline Opportunities */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F2F4F7]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#0F766E]" />
              <span>Pipeline In-Progress ({pipelineClinics.length})</span>
            </h3>
            <span className="text-xs font-semibold text-[#0F766E] tabular-nums">
              Potential: {formatINR(summary.pipelineOpportunityValue)}
            </span>
          </div>

          <div className="space-y-2">
            {pipelineClinics.length === 0 ? (
              <p className="py-8 text-center text-[#98A2B3] text-xs">
                No clinics currently in &quot;Interested&quot; or &quot;Demo Ready&quot; stage.
              </p>
            ) : (
              pipelineClinics.slice(0, 5).map((clinic) => (
                <div
                  key={clinic.id}
                  onClick={() => onSelectClinic(clinic)}
                  className="p-3 bg-[#F9FAFB] hover:bg-[#F2F4F7] rounded-lg border border-[#F2F4F7] flex items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-[#17202F] truncate">{clinic.name}</h4>
                    <p className="text-[11px] text-[#667085]">
                      {clinic.locality}, {clinic.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="tabular-nums text-xs font-semibold text-[#0F766E]">
                      {formatINR(clinic.dealValue ?? DEFAULT_DEAL_VALUE)}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] font-medium">
                      {clinic.salesStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Typical Website Packages & Pricing Reference */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#667085] flex items-center gap-1.5 pb-2 border-b border-[#F2F4F7]">
            <Building2 className="w-4 h-4 text-[#0F766E]" />
            <span>Dental Clinic Website Pricing Strategy</span>
          </h3>

          <div className="space-y-2.5 text-xs text-[#344054]">
            <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
              <div className="flex items-center justify-between font-semibold text-[#17202F]">
                <span>Starter Clinic Presence</span>
                <span className="text-[#0F766E] font-semibold tabular-nums">₹15,000</span>
              </div>
              <p className="text-[11px] text-[#667085] mt-0.5">
                Single-page modern site, Google Maps embed, treatments list, doctor photo, click-to-call button.
              </p>
            </div>

            <div className="p-3 bg-[#F0FDFA]/50 rounded-lg border border-[#CCFBF1]">
              <div className="flex items-center justify-between font-semibold text-[#17202F]">
                <span className="text-[#0F766E]">Standard Practice Portal (Most Popular)</span>
                <span className="text-[#0F766E] font-semibold tabular-nums">₹25,000</span>
              </div>
              <p className="text-[11px] text-[#667085] mt-0.5">
                Multi-page portal (Home, Treatments, About Doctors, Patient Reviews, Appointment Form, WhatsApp Chat).
              </p>
            </div>

            <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
              <div className="flex items-center justify-between font-semibold text-[#17202F]">
                <span>Premium Multi-Doctor Suite</span>
                <span className="text-[#0F766E] font-semibold tabular-nums">₹45,000+</span>
              </div>
              <p className="text-[11px] text-[#667085] mt-0.5">
                Full branding, online consultation booking, local SEO optimization, multi-branch support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
