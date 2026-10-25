export type WebsiteStatus = 'No Website Found' | 'Has Website' | 'Needs Verification';

export type SalesStatus =
  | 'To Call'
  | 'Called'
  | 'No Answer'
  | 'Interested'
  | 'Follow-up'
  | 'Ignored'
  | 'Not Interested'
  | 'Demo Ready'
  | 'Won'
  | 'Lost';

export type PaymentStatus = 'Pending' | 'Advance Paid' | 'Fully Paid';

export interface Clinic {
  id: string;
  name: string;
  city: string;
  locality: string;
  address?: string;
  phone?: string;
  mapsUrl?: string;
  websiteUrl?: string;
  websiteStatus: WebsiteStatus;
  salesStatus: SalesStatus;
  notes?: string;
  followUpDate?: string; // YYYY-MM-DD
  dealValue?: number; // In INR (₹)
  paymentStatus?: PaymentStatus;
  dealPlan?: string; // e.g. "Basic Website", "Standard Clinic Portal", "SEO + Website Package"
  dealDate?: string; // YYYY-MM-DD
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export type ClinicFormData = Omit<Clinic, 'id' | 'createdAt' | 'updatedAt'>;

export interface DuplicateMatch {
  clinic: Clinic;
  matchReason: 'phone' | 'name' | 'both';
  similarityScore: number;
}

export type NavigationPage = 'dashboard' | 'find' | 'clinics' | 'followups' | 'revenue' | 'settings';

export interface ClinicFilterState {
  searchQuery: string;
  city: string;
  locality: string;
  websiteStatus: string;
  salesStatus: string;
  followUpFilter: 'all' | 'today' | 'overdue' | 'upcoming' | 'none';
  quickNoWebsite: boolean;
  quickFollowUpDue: boolean;
  sortBy: 'name-asc' | 'name-desc' | 'created-desc' | 'created-asc' | 'followup-asc' | 'followup-desc';
}

export interface BackupData {
  app: string;
  version: string;
  exportedAt: string;
  totalClinics: number;
  clinics: Clinic[];
}

export interface RevenueSummary {
  totalWonRevenue: number;
  collectedRevenue: number;
  pendingRevenue: number;
  pipelineOpportunityValue: number;
  totalDealsWon: number;
  averageDealSize: number;
}
