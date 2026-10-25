import type { Clinic, RevenueSummary } from '../types/clinic';

export const DEFAULT_DEAL_VALUE = 25000; // Standard dental clinic website package ₹25,000

export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === 0) return '₹0';
  return '₹' + amount.toLocaleString('en-IN');
}

export function calculateRevenueSummary(clinics: Clinic[]): RevenueSummary {
  let totalWonRevenue = 0;
  let collectedRevenue = 0;
  let pendingRevenue = 0;
  let pipelineOpportunityValue = 0;
  let totalDealsWon = 0;

  for (const clinic of clinics) {
    const val = clinic.dealValue !== undefined && clinic.dealValue !== null ? Number(clinic.dealValue) : DEFAULT_DEAL_VALUE;

    if (clinic.salesStatus === 'Won') {
      totalDealsWon++;
      totalWonRevenue += val;

      const pStatus = clinic.paymentStatus || 'Fully Paid';
      if (pStatus === 'Fully Paid') {
        collectedRevenue += val;
      } else if (pStatus === 'Advance Paid') {
        // Assume 50% advance collected, 50% pending
        const half = Math.round(val * 0.5);
        collectedRevenue += half;
        pendingRevenue += (val - half);
      } else {
        // Pending
        pendingRevenue += val;
      }
    } else if (clinic.salesStatus === 'Interested' || clinic.salesStatus === 'Demo Ready') {
      pipelineOpportunityValue += val;
    }
  }

  const averageDealSize = totalDealsWon > 0 ? Math.round(totalWonRevenue / totalDealsWon) : 0;

  return {
    totalWonRevenue,
    collectedRevenue,
    pendingRevenue,
    pipelineOpportunityValue,
    totalDealsWon,
    averageDealSize
  };
}
